sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/ui/core/ComponentContainer"
], function (Controller, ComponentContainer) {
    "use strict";

    // Map each nav key to its sub-component namespace
    var mComponents = {
        "records":   "washwizard.shell.service-records",
        "entries":   "washwizard.shell.service-entries",
        "analytics": "washwizard.shell.analytics",
        "catalog":   "washwizard.shell.catalog",
        "admin":     "washwizard.shell.admin"
    };

    return Controller.extend("washwizard.app.shell.controller.App", {

        onInit: function () {
            // Load default section on startup
            this._loadSection("records");
        },

        onButtonCollapseExpandPress: function () {
            var oToolPage = this.byId("idToolPage");
            oToolPage.setSideExpanded(!oToolPage.getSideExpanded());
        },

        onNavigationListItemSelect: function (oEvent) {
            var sKey = oEvent.getParameter("item").getKey();
            var oNavList = this.byId("idNavigationList");
            oNavList.setSelectedKey(sKey);
            this._loadSection(sKey);
        },

        _loadSection: function (sKey) {
            var oPage = this.byId("idMainContentsPage");
            // Destroy the previous component container to free memory
            oPage.destroyContent();

            var oContainer = new ComponentContainer({
                name: mComponents[sKey],
                manifest: true,
                async: true,
                height: "100%",
                width: "100%",
                propagateModel: true
            });

            oPage.addContent(oContainer);
        }
    });
});