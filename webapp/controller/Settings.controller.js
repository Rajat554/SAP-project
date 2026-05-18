sap.ui.define([
	"sap/ui/core/mvc/Controller",
	"sap/m/MessageToast"
], function (Controller, MessageToast) {
	"use strict";

	return Controller.extend("sap.ui.demo.walkthrough.controller.Settings", {
		onInit: function () {
            
			this.getView().addStyleClass("sapUiSizeCompact");
		},

		onSaveChangesButtonPress: function () {
			MessageToast.show("Settings saved successfully.");
		}
	});
});
