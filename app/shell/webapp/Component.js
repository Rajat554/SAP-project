sap.ui.define(["sap/ui/core/UIComponent"], function (UIComponent) {
    "use strict";
    return UIComponent.extend("washwizard.app.shell.Component", {
        metadata: { manifest: "json" },
        init: function () {
            // Register component paths dynamically so UI5 loader can resolve them on BTP
            var sModulePath = sap.ui.require.toUrl("washwizard/app/shell");
            sap.ui.loader.config({
                paths: {
                    "washwizard/shell/service-records": sModulePath + "/components/service-records",
                    "washwizard/shell/service-entries": sModulePath + "/components/service-entries",
                    "washwizard/shell/analytics": sModulePath + "/components/analytics",
                    "washwizard/shell/catalog": sModulePath + "/components/catalog",
                    "washwizard/shell/admin": sModulePath + "/components/admin"
                }
            });

            UIComponent.prototype.init.apply(this, arguments);
        }
    });
});
