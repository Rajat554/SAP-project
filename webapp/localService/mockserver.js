sap.ui.define("sap/ui/demo/walkthrough/localService/mockserver", [     
    "sap/ui/core/util/MockServer",
    "sap/base/Log"
], function (MockServer, Log) {
    "use strict";

    var _oMockServer;

    return {
        /**
         * init — Starts the mock server.
         * Returns a Promise so the application can wait for it to initialize.
         */
        init: function () {
            return new Promise(function(resolve, reject) {
                try {
                    if (_oMockServer && _oMockServer.isStarted()) {
                        return resolve();
                    }

                    // Must EXACTLY match manifest.json → dataSources → mainService → uri
                    var sServiceUrl = "/destinations/WashWizard/";

                    // Absolute paths to the local metadata and mockdata folder
                    var sMetadataUrl = sap.ui.require.toUrl(
                        "sap/ui/demo/walkthrough/localService/metadata.xml"
                    );
                    var sMockdataUrl = sap.ui.require.toUrl(
                        "sap/ui/demo/walkthrough/localService/mockdata"
                    );

                    // Create the MockServer
                    _oMockServer = new MockServer({ rootUri: sServiceUrl });

                    // Configure response delay
                    MockServer.config({
                        autoRespond      : true,
                        autoRespondAfter : 500
                    });

                    // Point MockServer at our metadata.xml and mockdata
                    _oMockServer.simulate(sMetadataUrl, {
                        sMockdataBaseUrl        : sMockdataUrl,
                        bGenerateMissingMockData: false
                    });

                    // Start interception
                    _oMockServer.start();

                    Log.info("[WashWizard] ✅ MockServer started on " + sServiceUrl);
                    resolve();

                } catch (oError) {
                    Log.error("[WashWizard] ❌ MockServer failed to start", oError);
                    reject(oError);
                }
            });
        }
    };
});
