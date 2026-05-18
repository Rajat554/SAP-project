sap.ui.define(
  [
    "sap/ui/core/mvc/Controller",
    "sap/m/MessageToast",
    "sap/ui/core/Fragment",
    "sap/m/MessageBox",
  ],
  function (Controller, MessageToast, Fragment, MessageBox) {
    "use strict";

    return Controller.extend("sap.ui.demo.walkthrough.controller.Settings", {
      onInit: function () {
        this.getView().addStyleClass("sapUiSizeCompact");

        
        
        
        
        var oComponent = this.getOwnerComponent();
        var oUserModel = oComponent.getModel("userModel");

        
        var that = this;
        var _checkAuth = function () {
          var bIsLoggedIn = oUserModel.getProperty("/isLoggedIn");
          var sRole = oUserModel.getProperty("/role");

          if (!bIsLoggedIn) {
            
            window.sessionStorage.clear();
            window.location.hash = "";
            window.location.reload();
            return;
          }

          if (sRole !== "Admin") {
            
            MessageBox.error(
              "Access Denied: You do not have permission to view the Settings page.\nThis area is restricted to Administrators only.",
              {
                title: "Unauthorized",
                onClose: function () {
                  
                  that.getView().setVisible(false);
                  oComponent.getRouter().navTo("dashboard", {}, {}, true);
                },
              },
            );
          }
        };

        
        if (oUserModel) {
          _checkAuth();
        } else {
          this.getView().addEventDelegate({
            onAfterRendering: function () {
              _checkAuth();
            },
          });
        }
      },

      onIconTabBarSelect: function (oEvent) {
        var sKey = oEvent.getParameter("key");
        if (sKey === "users") {
          var oTable = this.byId("idUsersSetTable");
          var oBinding = oTable.getBinding("items");
          if (oBinding && oBinding.isSuspended()) {
            oBinding.resume();
          }
        }
      },

      onSaveChangesButtonPress: function () {
        MessageToast.show("Settings saved successfully.");
      },

      onAddUserButtonPress: function () {
        var oView = this.getView();
        if (!this._pAddUserDialog) {
          this._pAddUserDialog = Fragment.load({
            id: oView.getId(),
            name: "sap.ui.demo.walkthrough.fragment.AddUserDialog",
            controller: this,
          }).then(function (oDialog) {
            oView.addDependent(oDialog);
            return oDialog;
          });
        }
        this._pAddUserDialog.then(function (oDialog) {
          oDialog.open();
        });
      },

      onCancelButtonPress: function () {
        this.byId("idAddUserDialog").close();
      },

      onSaveButtonPress: function () {
        var sUsername = this.byId("idNewUsernameInput").getValue();
        var sPassword = this.byId("idNewPasswordInput").getValue();
        var sRole = this.byId("idNewRoleSelect").getSelectedKey();

        if (!sUsername || !sPassword) {
          MessageToast.show("Please enter both username and password.");
          return;
        }

        var oModel = this.getView().getModel();
        var oNewUser = {
          Username: sUsername,
          Password: sPassword,
          Role: sRole,
        };

        var that = this;
        oModel.create("/UsersSet", oNewUser, {
          success: function () {
            MessageToast.show("User added successfully.");
            that.byId("idAddUserDialog").close();
            that.byId("idNewUsernameInput").setValue("");
            that.byId("idNewPasswordInput").setValue("");
          },
          error: function (oError) {
            MessageToast.show("Failed to add user.");
          },
        });
      },

      onButtonPress: function (oEvent) {
        var oItem = oEvent.getSource().getParent();
        var sPath = oItem.getBindingContext().getPath();
        var oModel = this.getView().getModel();

        MessageBox.confirm("Are you sure you want to delete this user?", {
          onClose: function (sAction) {
            if (sAction === MessageBox.Action.OK) {
              oModel.remove(sPath, {
                success: function () {
                  MessageToast.show("User deleted.");
                },
                error: function () {
                  MessageToast.show("Error deleting user.");
                },
              });
            }
          },
        });
      },
    });
  },
);
