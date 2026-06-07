sap.ui.define([
    "sap/ui/core/mvc/Controller"
], function (Controller) {
    "use strict";

    return Controller.extend("washwizard.app.shell.controller.App", {

        onInit: function () {
            // Wait for the DOM to render the iframe, then load default app (service-records)
            this.getView().attachAfterRendering(function() {
                this._loadApp("service-records");
            }.bind(this));
        },

        onButtonCollapseExpandPress: function () {
            var oToolPage = this.byId("idToolPage");
            var bExpanded = oToolPage.getSideExpanded();

            oToolPage.setSideExpanded(!bExpanded);
        },

        onNavigationListItemSelect: function (oEvent) {
            var oItem = oEvent.getParameter("item");
            var sKey = oItem.getKey();
            this._loadApp(sKey);
        },

        _loadApp: function(sKey) {
            var sPath;
            var sHostname = window.location.hostname;
            
            // Check if running on local laptop OR inside SAP Business Application Studio (BAS)
            if (sHostname === "localhost" || sHostname === "127.0.0.1" || sHostname.includes("applicationstudio.cloud.sap")) {
                // Fixed: Matches the exact web routes exposed on your CAP server landing page!
                sPath = "/" + sKey + "/webapp/index.html";
            } else {
                // Production BTP Managed Approuter path (Used after full mta deployment)
                sPath = "/washwizard.app." + sKey + "/";
            }
            
            var oHTMLControl = this.byId("idAppIframeHTML");
            if (oHTMLControl) {
                oHTMLControl.setContent("<iframe class='fullHeightIFrame' src='" + sPath + "'></iframe>");
            }
        }
    });
});