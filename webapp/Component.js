sap.ui.define([
    "sap/ui/core/UIComponent",
    "sap/ui/demo/walkthrough/localService/mockserver" 
], function (UIComponent, mockserver) {
    "use strict";

    return UIComponent.extend("sap.ui.demo.walkthrough.Component", {

        metadata: {
            manifest: "json"
        },

        init: function () {
            
            
            UIComponent.prototype.init.apply(this, arguments);

            
            this.getRouter().initialize();
        }
    });
});
