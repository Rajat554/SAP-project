sap.ui.define([
    "sap/ui/core/UIComponent",
    "sap/tnt/ToolPage",
    "sap/tnt/SideNavigation",
    "sap/tnt/NavigationList",
    "sap/tnt/NavigationListItem",
    "sap/m/OverflowToolbar",
    "sap/m/Button",
    "sap/m/Title",
    "sap/m/ToolbarSpacer",
    "sap/m/Avatar",
    "sap/m/Text",
    "sap/ui/core/ComponentContainer",
    "sap/ui/core/Component"
], function (
    UIComponent, ToolPage, SideNavigation, NavigationList, NavigationListItem,
    OverflowToolbar, Button, Title, ToolbarSpacer, Avatar, Text,
    ComponentContainer, ComponentFactory
) {
    "use strict";

    return UIComponent.extend("washwizard.portal.Component", {
        metadata: { manifest: "json" },

        init: function () {
            UIComponent.prototype.init.apply(this, arguments);
            // Configure module paths for the dynamic sub-apps
            var sRootPath = sap.ui.require.toUrl("washwizard/portal");
            sap.ui.loader.config({
                paths: {
                    "service-entries": sRootPath + "/service-entries",
                    "service-records": sRootPath + "/service-records",
                    "analytics": sRootPath + "/analytics",
                    "catalog": sRootPath + "/catalog",
                    "admin": sRootPath + "/admin"
                }
            });
        },

        createContent: function () {
            var oComponentContainer = new ComponentContainer({ height: "100%", width: "100%" });
            var activeComponent = null, activeKey = null;

            function loadApp(appName, navKey) {
                if (activeKey === navKey) return;
                activeKey = navKey;

                if (activeComponent) { activeComponent.destroy(); activeComponent = null; }
                oComponentContainer.setComponent(null);

                ComponentFactory.create({
                    name: appName,
                    url: sap.ui.require.toUrl("washwizard/portal") + "/" + navKey,
                    settings: { id: appName }
                }).then(function (oComponent) {
                    activeComponent = oComponent;
                    oComponentContainer.setComponent(oComponent);
                }).catch(function (err) {
                    console.error("Error loading component:", err);
                });
            }

            var oHeader = new OverflowToolbar({
                height: "56px",
                content: [
                    new Button({ icon: "sap-icon://menu", type: "Transparent", press: function () { oToolPage.setSideExpanded(!oToolPage.getSideExpanded()); } }),
                    new Button({ icon: "sap-icon://car-wash", type: "Transparent", enabled: false }),
                    new Title({ text: "WashWizard Manager", level: "H1" }),
                    new ToolbarSpacer(),
                    new Text({ text: "Employee Portal" }),
                    new Avatar({ initials: "WW", displaySize: "XS", backgroundColor: "Accent6" })
                ]
            });

            var oSideNavigation = new SideNavigation({
                item: new NavigationList({
                    items: [
                        new NavigationListItem({ text: "Dashboard", icon: "sap-icon://grid", key: "service-entries", select: function () { loadApp("service-entries", "service-entries"); } }),
                        new NavigationListItem({ text: "Service Records", icon: "sap-icon://list", key: "service-records", select: function () { loadApp("service-records", "service-records"); } }),
                        new NavigationListItem({ text: "Revenue Analytics", icon: "sap-icon://line-chart", key: "analytics", select: function () { loadApp("analytics", "analytics"); } }),
                        new NavigationListItem({ text: "Service Catalog", icon: "sap-icon://product", key: "catalog", select: function () { loadApp("catalog", "catalog"); } }),
                        new NavigationListItem({ text: "Settings", icon: "sap-icon://action-settings", key: "admin", select: function () { loadApp("admin", "admin"); } })
                    ]
                })
            });

            var oToolPage = new ToolPage({
                header: oHeader,
                sideContent: oSideNavigation,
                mainContents: [oComponentContainer],
                sideExpanded: true
            });

            loadApp("service-entries", "service-entries");
            return oToolPage;
        }
    });
});
