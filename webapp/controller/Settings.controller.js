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
        this.byId("addUserDialog").close();
      },

      onSaveButtonPress: function () {
        var sUsername = this.byId("newUsernameInput").getValue();
        var sPassword = this.byId("newPasswordInput").getValue();
        var sRole = this.byId("newRoleSelect").getSelectedKey();

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
            that.byId("addUserDialog").close();
            that.byId("newUsernameInput").setValue("");
            that.byId("newPasswordInput").setValue("");
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
