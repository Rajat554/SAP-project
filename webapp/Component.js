sap.ui.define([
    "sap/ui/core/UIComponent"
], function (UIComponent) {
    "use strict";

    return UIComponent.extend("sap.ui.demo.walkthrough.Component", {

        metadata: {
            manifest: "json"
        },

        init: function () {
            // Call base init — this creates all models from manifest.json
            // and triggers the ODataModel's $metadata request.
            UIComponent.prototype.init.apply(this, arguments);

            // IMPORTANT: Delay router initialization by one event loop tick.
            // This guarantees App.controller.js onInit() has fully run and
            // attached the beforeRouteMatched guard BEFORE the router parses
            // the URL hash. Without this, a direct visit to #/settings would
            // start loading the Settings view before the guard was listening.
            var oRouter = this.getRouter();
            setTimeout(function () {
                oRouter.initialize();
            }, 0);
        }
    });
});
