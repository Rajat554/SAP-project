sap.ui.define(
  [
    "sap/ui/core/mvc/Controller",
    "sap/ui/core/Fragment",
    "sap/m/MessageToast",
    "sap/ui/model/json/JSONModel",
    "sap/m/MessageBox",
    "sap/ui/core/routing/HashChanger"
  ],
  function (Controller, Fragment, MessageToast, JSONModel, MessageBox, HashChanger) {
    "use strict";

    // ==============================================================
    //  ROUTE PERMISSIONS MAP
    //  "any"   = any authenticated user (Admin or Staff)
    //  "Admin" = Admin only
    // ==============================================================
    var ROUTE_PERMISSIONS = {
      "dashboard":      "any",
      "serviceRecords": "any",
      "analytics":      "any",
      "settings":       "Admin"
    };

    return Controller.extend("sap.ui.demo.walkthrough.controller.App", {

      // ────────────────────────────────────────────────────────────
      //  LIFECYCLE
      // ────────────────────────────────────────────────────────────

      onInit: function () {
        this.getView().addStyleClass("sapUiSizeCompact");

        // 1. Initialise user model (always start as logged-out)
        var oUserModel = new JSONModel({
          isLoggedIn: false,
          username:   "",
          role:       ""
        });
        this.getOwnerComponent().setModel(oUserModel, "userModel");

        // 2. Attach the route guard BEFORE checking the session,
        //    so it is in place when the router fires on first load.
        var oRouter = this.getOwnerComponent().getRouter();
        oRouter.attachBeforeRouteMatched(this._onBeforeRouteMatched, this);

        // 3. Try to restore an existing session from sessionStorage
        var sToken    = window.sessionStorage.getItem("jwtToken");
        var sUsername = window.sessionStorage.getItem("username");
        var sRole     = window.sessionStorage.getItem("role");

        function isTokenExpired(token) {
          try {
            var payload = JSON.parse(atob(token.split('.')[1]));
            return payload.exp * 1000 < Date.now();
          } catch (e) {
            return true;
          }
        }

        if (sToken && sUsername && sRole && !isTokenExpired(sToken)) {
          // Re-attach the JWT to every OData request
          this.getOwnerComponent().getModel().setHeaders({
            Authorization: "Bearer " + sToken
          });

          // Restore the user model so guards work correctly
          oUserModel.setProperty("/isLoggedIn", true);
          oUserModel.setProperty("/username",   sUsername);
          oUserModel.setProperty("/role",       sRole);

          // Show the main shell. The router's beforeRouteMatched will
          // then decide whether the current hash is allowed.
          var that = this;
          setTimeout(function () {
            that.byId("idRootApp").to(that.byId("idMainPage"));
          }, 0);

        } else {
          // Token is expired or missing. Clean up completely.
          window.sessionStorage.clear();
          
          // No valid session → make sure the URL hash is clean so the
          // route guard cannot accidentally fire a protected route.
          HashChanger.getInstance().replaceHash("");
        }
      },

      // ────────────────────────────────────────────────────────────
      //  ROUTE GUARD  (fires before EVERY route, on every navigation)
      // ────────────────────────────────────────────────────────────

      _onBeforeRouteMatched: function (oEvent) {
        var sRouteName  = oEvent.getParameter("name");
        var oUserModel  = this.getOwnerComponent().getModel("userModel");
        var bIsLoggedIn = oUserModel.getProperty("/isLoggedIn");
        var sRole       = oUserModel.getProperty("/role");

        var sRequiredRole = ROUTE_PERMISSIONS[sRouteName];

        // ── Guard 1: Not logged in → block everything ──────────────
        if (!bIsLoggedIn) {
          oEvent.preventDefault();
          HashChanger.getInstance().replaceHash("");
          return;
        }

        // ── Guard 2: Role check ────────────────────────────────────
        if (sRequiredRole === "Admin" && sRole !== "Admin") {
          oEvent.preventDefault();
          MessageBox.error(
            "Access Denied\n\nYou do not have permission to view the \"" + sRouteName + "\" page.\nThis area is restricted to Administrators only.",
            { title: "Unauthorized" }
          );
          // Redirect to dashboard and replace history so Back doesn't return here
          this.getOwnerComponent().getRouter().navTo("dashboard", {}, {}, true);
        }
      },

      // ────────────────────────────────────────────────────────────
      //  LOGIN
      // ────────────────────────────────────────────────────────────

      onInputSubmit: function () {
        this.onLoginButtonPress();
      },

      onLoginButtonPress: function () {
        var sUsername = this.byId("idLoginUsernameInput").getValue().trim();
        var sPassword = this.byId("idLoginPasswordInput").getValue();

        if (!sUsername || !sPassword) {
          MessageToast.show("Please enter both username and password.");
          return;
        }

        var oModel = this.getOwnerComponent().getModel();
        var that   = this;

        fetch("/api/login", {
          method:  "POST",
          headers: { "Content-Type": "application/json" },
          body:    JSON.stringify({ username: sUsername, password: sPassword })
        })
        .then(function (oResponse) {
          if (!oResponse.ok) {
            // Server returned 401 or similar – credentials are wrong
            throw new Error("InvalidCredentials");
          }
          return oResponse.json();
        })
        .then(function (oData) {
          var sRole = oData.role || "Staff";

          // Attach JWT to every future OData request
          oModel.setHeaders({ Authorization: "Bearer " + oData.token });

          // Persist session for page refresh (survives reload, cleared on tab close)
          window.sessionStorage.setItem("jwtToken", oData.token);
          window.sessionStorage.setItem("username",  oData.username);
          window.sessionStorage.setItem("role",      sRole);

          that._completeLogin(oData.username, sRole);
        })
        .catch(function () {
          MessageToast.show("Login failed. Invalid username or password.");
          oModel.setHeaders({}); // clear any stale header
        });
      },

      _completeLogin: function (sUsername, sRole) {
        // Update user model
        var oUserModel = this.getOwnerComponent().getModel("userModel");
        oUserModel.setProperty("/isLoggedIn", true);
        oUserModel.setProperty("/username",   sUsername);
        oUserModel.setProperty("/role",       sRole);

        // Clear the login fields
        this.byId("idLoginUsernameInput").setValue("");
        this.byId("idLoginPasswordInput").setValue("");

        // Show the main shell
        this.byId("idRootApp").to(this.byId("idMainPage"));

        // ALWAYS land on dashboard after login – never trust a stale hash
        // Replace history so hitting Back doesn't re-open a restricted page
        this.getOwnerComponent().getRouter().navTo("dashboard", {}, {}, true);

        MessageToast.show("Welcome, " + sUsername + "! (" + sRole + ")");

        // Refresh model data with the new auth token
        this.getOwnerComponent().getModel().refresh();
      },

      // ────────────────────────────────────────────────────────────
      //  LOGOUT
      // ────────────────────────────────────────────────────────────

      onLogoutPress: function () {
        var sToken = window.sessionStorage.getItem("jwtToken");

        // Tell the server to log the logout event (fire-and-forget)
        if (sToken) {
          fetch("/api/logout", {
            method:  "POST",
            headers: { "Authorization": "Bearer " + sToken }
          }).catch(function () {});
        }

        // ── CRITICAL: Wipe the hash BEFORE clearing sessionStorage ──
        // This prevents the router from re-firing a protected route
        // when the page reloads and finds the hash still in the URL.
        HashChanger.getInstance().replaceHash("");

        // Clear all session data
        window.sessionStorage.removeItem("jwtToken");
        window.sessionStorage.removeItem("username");
        window.sessionStorage.removeItem("role");

        MessageToast.show("Logged out successfully.");

        // Hard reload: destroys all UI5 models, views, OData bindings,
        // and the router state – the cleanest possible reset.
        setTimeout(function () {
          window.location.reload();
        }, 600);
      },

      // ────────────────────────────────────────────────────────────
      //  PROFILE POPOVER
      // ────────────────────────────────────────────────────────────

      onAvatarPress: function (oEvent) {
        var oButton = oEvent.getSource();
        var oView   = this.getView();

        if (!this._pProfilePopover) {
          this._pProfilePopover = Fragment.load({
            id:         oView.getId(),
            name:       "sap.ui.demo.walkthrough.fragment.ProfilePopover",
            controller: this
          }).then(function (oPopover) {
            oView.addDependent(oPopover);
            return oPopover;
          });
        }

        this._pProfilePopover.then(function (oPopover) {
          oPopover.openBy(oButton);
        });
      },

      onListProfileMenuItemPress: function (oEvent) {
        var sTitle = oEvent.getParameter("listItem").getTitle();
        if (sTitle === "Logout") {
          this._pProfilePopover.then(function (oPopover) { oPopover.close(); });
          this.onLogoutPress();
        } else if (sTitle === "Profile") {
          MessageToast.show("Profile feature coming soon!");
        }
      },

      // ────────────────────────────────────────────────────────────
      //  SIDE NAVIGATION
      // ────────────────────────────────────────────────────────────

      onButtonSideNavPress: function () {
        var oToolPage   = this.byId("idAppToolPage");
        var bExpanded   = oToolPage.getSideExpanded();
        this._setToggleButtonTooltip(bExpanded);
        oToolPage.setSideExpanded(!bExpanded);
      },

      onSideNavigationItemSelect: function (oEvent) {
        var sKey    = oEvent.getParameter("item").getKey();
        var oRouter = sap.ui.core.UIComponent.getRouterFor(this);

        var mRoutes = {
          "dashboard": "dashboard",
          "records":   "serviceRecords",
          "analytics": "analytics",
          "settings":  "settings"
        };

        if (mRoutes[sKey]) {
          oRouter.navTo(mRoutes[sKey]);
        }
      },

      _setToggleButtonTooltip: function (bExpanded) {
        var oToggleButton = this.byId("idSideNavigationToggleButton");
        oToggleButton.setTooltip(bExpanded ? "Expand Menu" : "Collapse Menu");
      }
    });
  }
);
