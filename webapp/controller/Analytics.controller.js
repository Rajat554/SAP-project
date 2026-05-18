
sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/ui/model/json/JSONModel",
    "sap/m/MessageToast"
], function (Controller, JSONModel, MessageToast) {
    "use strict";

    return Controller.extend("sap.ui.demo.walkthrough.controller.Analytics", {

        

        onInit: function () {
            
            var oViewModel = new JSONModel({
                totalRevenue              : 0,
                totalServices             : 0,
                avgDailyRevenue           : 0,
                avgServiceValue           : 0,
                revenueTrendData          : [],
                serviceDistributionData   : [],
                performanceMetrics: {
                    topServices          : [],
                    bestDayDate          : "N/A",
                    peakRevenue          : 0,
                    busiestDayServices   : 0,
                    workingDays          : 0,
                    topServiceType       : "N/A"
                }
            });
            this.getView().setModel(oViewModel, "analyticsModel");

            
            var oRouter = sap.ui.core.UIComponent.getRouterFor(this);
            oRouter.getRoute("analytics").attachPatternMatched(this._onObjectMatched, this);
        },

        

        _onObjectMatched: function () {
            
            var oDatePicker = this.byId("idMonthDatePicker");
            if (oDatePicker && !oDatePicker.getValue()) {
                var oDate   = new Date();
                var sMonth  = (oDate.getMonth() + 1).toString().padStart(2, "0");
                oDatePicker.setValue(oDate.getFullYear() + "-" + sMonth);
            }

            
            this._loadAndProcess();
        },

        
        _loadAndProcess: function () {
            var oModel = this.getView().getModel();
            if (!oModel) {
                MessageToast.show("Data model not available.");
                return;
            }

            var that = this;
            oModel.read("/ServiceTaskSet", {
                success: function (oData) {
                    var aResults = oData && oData.results ? oData.results : [];
                    var aCompleted = aResults.filter(function (o) {
                        return o && o.Status === "Completed";
                    });
                    that._processData(aCompleted);
                    that._setupVizFrames();
                },
                error: function () {
                    MessageToast.show("Could not load analytics data.");
                }
            });
        },

        
        _setupVizFrames: function () {
            var chartConfigs = [
                {
                    id    : "idLineVizFrame",
                    color : "#0070F2"
                },
                {
                    id    : "idLineCountVizFrame",
                    color : "#10b981"
                }
            ];

            chartConfigs.forEach(function (cfg) {
                var oFrame = this.byId(cfg.id);
                if (oFrame) {
                    oFrame.setVizProperties({
                        plotArea: {
                            dataLabel   : { visible: true, showTotal: false },
                            colorPalette: [cfg.color],
                            marker: { visible: true, shape: "circle", size: 5 }
                        },
                        valueAxis   : { title: { visible: false } },
                        categoryAxis: { title: { visible: false } },
                        title       : { visible: false },
                        legend      : { visible: false }
                    });
                }
            }.bind(this));

            var oPie = this.byId("idPieVizFrame");
            if (oPie) {
                oPie.setVizProperties({
                    title   : { visible: false },
                    plotArea: { 
                        dataLabel: { visible: true, type: "value", formatString: "u" },
                        colorPalette: ["#0070F2", "#10b981", "#F58B00", "#E9730C", "#B00"]
                    },
                    legend: { title: { visible: false } }
                });
            }

            var oCol = this.byId("idColumnVizFrame");
            if (oCol) {
                oCol.setVizProperties({
                    title    : { visible: false },
                    plotArea : { dataLabel: { visible: true }, colorPalette: ["#0070F2"] },
                    valueAxis: { title: { visible: false } },
                    categoryAxis: { title: { visible: false } },
                    legend   : { visible: false }
                });
            }
        },

        
        _processData: function (aAllCompleted) {
            if (!aAllCompleted || aAllCompleted.length === 0) {
                
                var oViewModel = this.getView().getModel("analyticsModel");
                oViewModel.setProperty("/totalRevenue",    0);
                oViewModel.setProperty("/totalServices",   0);
                oViewModel.setProperty("/avgDailyRevenue", 0);
                oViewModel.setProperty("/avgServiceValue", 0);
                oViewModel.setProperty("/revenueTrendData",        []);
                oViewModel.setProperty("/serviceDistributionData", []);
                oViewModel.setProperty("/performanceMetrics", {
                    topServices       : [],
                    bestDayDate       : "N/A",
                    peakRevenue       : 0,
                    busiestDayServices: 0,
                    workingDays       : 0,
                    topServiceType    : "N/A"
                });
                return;
            }

            
            var oDatePicker = this.byId("idMonthDatePicker");
            if (!oDatePicker) return;
            var sMonthValue = oDatePicker.getValue(); 
            if (!sMonthValue) return;

            var aMonthServices = aAllCompleted.filter(function (oService) {
                
                var dDate = oService.CompletedAt || oService.Date;
                if (!dDate) return false;
                
                var sDateStr = "";
                if (dDate instanceof Date) {
                    var mm = (dDate.getMonth() + 1).toString().padStart(2, "0");
                    sDateStr = dDate.getFullYear() + "-" + mm;
                } else if (typeof dDate === "string") {
                    sDateStr = dDate.substring(0, 7); 
                }
                
                return sDateStr === sMonthValue;
            });

            
            var totalRevenue       = 0;
            var totalServices      = aMonthServices.length;
            var oDailyRevenue      = {};
            var oDailyServices     = {};
            var oServiceDist       = {};

            aMonthServices.forEach(function (oService) {
                var amt = parseFloat(oService.Amount) || 0;
                totalRevenue += amt;

                
                var dDate = oService.CompletedAt || oService.Date;
                var sDay = "01";
                if (dDate instanceof Date) {
                    sDay = dDate.getDate().toString().padStart(2, "0");
                } else if (typeof dDate === "string" && dDate.length >= 10) {
                    sDay = dDate.split("-")[2].substring(0, 2);
                }

                oDailyRevenue[sDay]   = (oDailyRevenue[sDay]   || 0) + amt;
                oDailyServices[sDay]  = (oDailyServices[sDay]  || 0) + 1;

                
                var aTypes = (oService.ServiceType || "Unknown").split(",");
                aTypes.forEach(function (sRaw) {
                    var sType = sRaw.trim();
                    if (!sType) return;
                    if (!oServiceDist[sType]) {
                        oServiceDist[sType] = { Count: 0, Revenue: 0 };
                    }
                    
                    oServiceDist[sType].Count   += 1;
                    oServiceDist[sType].Revenue += (amt / aTypes.length);
                });
            });

            var workingDaysCount = Object.keys(oDailyRevenue).length;
            var avgDailyRevenue  = workingDaysCount > 0 ? totalRevenue / workingDaysCount : 0;
            var avgServiceValue  = totalServices   > 0 ? totalRevenue / totalServices    : 0;

            
            var aTrendData   = [];
            var monthParts   = sMonthValue.split("-");
            var daysInMonth  = new Date(monthParts[0], monthParts[1], 0).getDate();

            for (var i = 1; i <= daysInMonth; i++) {
                var dayStr = i.toString().padStart(2, "0");
                aTrendData.push({
                    Day          : dayStr,
                    Revenue      : oDailyRevenue[dayStr]  || 0,
                    ServiceCount : oDailyServices[dayStr] || 0
                });
            }

            
            var aDistData = [];
            for (var key in oServiceDist) {
                if (oServiceDist.hasOwnProperty(key)) {
                    aDistData.push({
                        ServiceType : key,
                        Count       : oServiceDist[key].Count,
                        Revenue     : Math.round(oServiceDist[key].Revenue)
                    });
                }
            }
            aDistData.sort(function (a, b) { return b.Revenue - a.Revenue; });

            
            var peakRev   = 0;
            var bestDay   = "N/A";
            var busiestDayCount = 0;

            Object.keys(oDailyRevenue).forEach(function (d) {
                if (oDailyRevenue[d] > peakRev) {
                    peakRev = oDailyRevenue[d];
                    var monStr = new Date(
                        parseInt(monthParts[0]), parseInt(monthParts[1]) - 1
                    ).toLocaleString("default", { month: "short" });
                    bestDay = monStr + " " + parseInt(d, 10);
                }
                if (oDailyServices[d] > busiestDayCount) {
                    busiestDayCount = oDailyServices[d];
                }
            });

            var topServiceType = aDistData.length > 0 ? aDistData[0].ServiceType : "N/A";

            
            var oVM = this.getView().getModel("analyticsModel");
            oVM.setProperty("/totalRevenue",    totalRevenue.toFixed(0));
            oVM.setProperty("/totalServices",   totalServices);
            oVM.setProperty("/avgDailyRevenue", avgDailyRevenue.toFixed(0));
            oVM.setProperty("/avgServiceValue", avgServiceValue.toFixed(0));
            oVM.setProperty("/revenueTrendData",        aTrendData);
            oVM.setProperty("/serviceDistributionData", aDistData);
            oVM.setProperty("/performanceMetrics", {
                topServices       : aDistData,
                bestDayDate       : bestDay,
                peakRevenue       : peakRev,
                busiestDayServices: busiestDayCount,
                workingDays       : workingDaysCount,
                topServiceType    : topServiceType
            });
        },

        

        
        onDatePickerMonthChange: function () {
            this._loadAndProcess();
        }

    });
});
