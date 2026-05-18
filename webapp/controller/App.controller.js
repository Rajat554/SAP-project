sap.ui.define([
	"sap/ui/core/mvc/Controller"
], function (Controller) {
	"use strict";

	return Controller.extend("sap.ui.demo.walkthrough.controller.App", {
		onInit: function () {
            
			this.getView().addStyleClass("sapUiSizeCompact");
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
