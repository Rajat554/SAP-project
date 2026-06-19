sap.ui.define(["sap/ui/core/UIComponent"], function (UIComponent) {
    "use strict";
    return UIComponent.extend("washwizard.app.shell.Component", {
        metadata: { manifest: "json" },
        init: function () {
            UIComponent.prototype.init.apply(this, arguments);
        }
    });
});
