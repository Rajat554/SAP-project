sap.ui.define([
	"sap/ui/core/mvc/Controller",
    "sap/ui/core/Fragment",
    "sap/m/MessageToast",
    "sap/ui/model/json/JSONModel"
], function (Controller, Fragment, MessageToast, JSONModel) {
	"use strict";

	return Controller.extend("sap.ui.demo.walkthrough.controller.App", {
		onInit: function () {
			this.getView().addStyleClass("sapUiSizeCompact");
            
            // Set up User Model
            var oUserModel = new JSONModel({
                isLoggedIn: false,
                username: "",
                role: ""
            });
            this.getOwnerComponent().setModel(oUserModel, "userModel");

            // We do not need to open a dialog anymore.
            // The App container will show the loginPage by default.
		},

        onLoginPress: function () {
            var sUsername = this.byId("loginUsernameInput").getValue();
            var sPassword = this.byId("loginPasswordInput").getValue();

            if (!sUsername || !sPassword) {
                MessageToast.show("Please enter both username and password");
                return;
            }

            var sAuth = btoa(sUsername + ":" + sPassword);
            var oModel = this.getOwnerComponent().getModel(); // Main OData Model

            // Set headers for all future requests
            oModel.setHeaders({
                "Authorization": "Basic " + sAuth
            });

            var that = this;
            oModel.read("/UsersSet('" + sUsername + "')", {
                success: function (oData) {
                    that._completeLogin(sUsername, oData.Role || "Admin", oData);
                },
                error: function (oError) {
                    var iStatusCode = oError.statusCode || (oError.response && oError.response.statusCode);
                    // 403 means authenticated but not Admin. So it's a Staff.
                    if (iStatusCode === 403 || iStatusCode === "403") {
                        that._completeLogin(sUsername, "Staff", null);
                    } else {
                        MessageToast.show("Login failed. Check your credentials.");
                        oModel.setHeaders({}); // Clear headers on fail
                    }
                }
            });
        },

        _completeLogin: function(sUsername, sRole, oData) {
            MessageToast.show("Welcome, " + sUsername + " (" + sRole + ")");
            
            var oUserModel = this.getOwnerComponent().getModel("userModel");
            oUserModel.setProperty("/isLoggedIn", true);
            oUserModel.setProperty("/username", sUsername);
            oUserModel.setProperty("/role", sRole);

            // Clear inputs for next time
            this.byId("loginUsernameInput").setValue("");
            this.byId("loginPasswordInput").setValue("");

            // Navigate from Login Page to Main Page
            this.byId("rootApp").to(this.byId("mainPage"));

            // Refresh main model to load data with new auth
            this.getOwnerComponent().getModel().refresh();
        },

        onAvatarPress: function (oEvent) {
            var oButton = oEvent.getSource();
            
            if (!this._oActionSheet) {
                var sapMActionSheet = sap.ui.require("sap/m/ActionSheet");
                var sapMButton = sap.ui.require("sap/m/Button");
                
                this._oActionSheet = new sapMActionSheet({
                    buttons: [
                        new sapMButton({
                            text: "Logout",
                            icon: "sap-icon://log",
                            press: this.onLogoutPress.bind(this)
                        })
                    ]
                });
                this.getView().addDependent(this._oActionSheet);
            }
            this._oActionSheet.openBy(oButton);
        },

        onLogoutPress: function () {
            // Clear Authentication Headers
            var oModel = this.getOwnerComponent().getModel();
            oModel.setHeaders({});

            // Clear User Model
            var oUserModel = this.getOwnerComponent().getModel("userModel");
            oUserModel.setProperty("/isLoggedIn", false);
            oUserModel.setProperty("/username", "");
            oUserModel.setProperty("/role", "");

            // Clear UI inputs
            this.byId("loginUsernameInput").setValue("");
            this.byId("loginPasswordInput").setValue("");

            // Navigate to Dashboard just in case they were in Settings
            sap.ui.core.UIComponent.getRouterFor(this).navTo("dashboard");

            MessageToast.show("Logged out successfully.");

            // Navigate from Main Page back to Login Page
            this.byId("rootApp").to(this.byId("loginPage"));
        },

		onButtonSideNavPress: function () {
			var oToolPage = this.byId("idAppToolPage");
			var bSideExpanded = oToolPage.getSideExpanded();
			this._setToggleButtonTooltip(bSideExpanded);
			oToolPage.setSideExpanded(!bSideExpanded);
		},

		onSideNavigationItemSelect: function (oEvent) {
			var sKey = oEvent.getParameter("item").getKey();
			var oRouter = sap.ui.core.UIComponent.getRouterFor(this);
			
			if (sKey === "dashboard") {
				oRouter.navTo("dashboard");
			} else if (sKey === "records") {
				oRouter.navTo("serviceRecords");
			} else if (sKey === "analytics") {
                oRouter.navTo("analytics");
            } else if (sKey === "settings") {
                oRouter.navTo("settings");
            }
		},

		_setToggleButtonTooltip: function (bLarge) {
			var oToggleButton = this.byId("idSideNavigationToggleButton");
			if (bLarge) {
				oToggleButton.setTooltip("Expand Menu");
			} else {
				oToggleButton.setTooltip("Collapse Menu");
			}
		}
	});
});

