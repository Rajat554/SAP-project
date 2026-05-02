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

            // Initialize the router so views are loaded based on URL hash
            this.getRouter().initialize();
        }
    });
});
