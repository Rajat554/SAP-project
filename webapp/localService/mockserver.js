sap.ui.define("sap/ui/demo/walkthrough/localService/mockserver", [     
    "sap/ui/core/util/MockServer",
    "sap/base/Log"
], function (MockServer, Log) {
    "use strict";

    var _oMockServer;

    return {
        
        init: function () {
            return new Promise(function(resolve, reject) {
                try {
                    if (_oMockServer && _oMockServer.isStarted()) {
                        return resolve();
                    }

                    
                    var sServiceUrl = "/destinations/WashWizard/";

                    
                    var sMetadataUrl = sap.ui.require.toUrl(
                        "sap/ui/demo/walkthrough/localService/metadata.xml"
                    );
                    var sMockdataUrl = sap.ui.require.toUrl(
                        "sap/ui/demo/walkthrough/localService/mockdata"
                    );

                    
                    _oMockServer = new MockServer({ rootUri: sServiceUrl });

                    
                    MockServer.config({
                        autoRespond      : true,
                        autoRespondAfter : 500
                    });

                    
                    _oMockServer.simulate(sMetadataUrl, {
                        sMockdataBaseUrl        : sMockdataUrl,
                        bGenerateMissingMockData: false
                    });

                    
                    _oMockServer.start();

                    Log.info("MockServer started on " + sServiceUrl);
                    resolve();

                } catch (oError) {
                    Log.error("MockServer failed to start", oError);
                    reject(oError);
                }
            });
        }
    };
});
