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

        onCollapseExpandPress: function () {
            var oToolPage = this.byId("toolPage");
            var bExpanded = oToolPage.getSideExpanded();

            oToolPage.setSideExpanded(!bExpanded);
        },

        onItemSelect: function (oEvent) {
            var oItem = oEvent.getParameter("item");
            var sKey = oItem.getKey();
            this._loadApp(sKey);
        },

        _loadApp: function(sKey) {
            var sPath;
            // Check if we are running locally on cds-serve
            if (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1") {
                sPath = "/" + sKey + "/webapp/index.html";
            } else {
                // Production BTP Managed Approuter path
                sPath = "/washwizard.app." + sKey + "/";
            }
            
            var oIframe = document.getElementById("appIframe");
            if (oIframe) {
                oIframe.src = sPath;
            }
        }
    });
});
