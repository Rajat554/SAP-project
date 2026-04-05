sap.ui.define([
	"sap/ui/core/mvc/Controller",
	"sap/ui/model/json/JSONModel"
], function (Controller, JSONModel) {
	"use strict";

	return Controller.extend("sap.ui.demo.walkthrough.controller.Analytics", {
		onInit: function () {
			var oViewModel = new JSONModel({
                totalRevenue: 0,
                totalServices: 0,
                avgDailyRevenue: 0,
                avgServiceValue: 0,
                revenueTrendData: [],
                serviceDistributionData: [],
                performanceMetrics: {
                    topServices: [],
                    bestDayDate: "N/A",
                    peakRevenue: 0,
                    busiestDayServices: 0,
                    workingDays: 0,
                    topServiceType: "N/A"
                }
			});
			this.getView().setModel(oViewModel, "analyticsModel");

			var oRouter = sap.ui.core.UIComponent.getRouterFor(this);
			oRouter.getRoute("analytics").attachPatternMatched(this._onObjectMatched, this);
		},

        _onObjectMatched: function (oEvent) {
            // Setup default date to current month/year if empty
            var oDatePicker = this.byId("idMonthDatePicker");
            if (!oDatePicker.getValue()) {
                var oDate = new Date();
                var sMonth = (oDate.getMonth() + 1).toString().padStart(2, '0');
                oDatePicker.setValue(oDate.getFullYear() + "-" + sMonth);
            }

            var that = this;
            setTimeout(function() {
                that._processData();
                that._setupVizFrames();
            }, 100);
        },

        onDatePickerMonthChange: function (oEvent) {
            this._processData();
        },

        _setupVizFrames: function() {
            var oVizFrameLine = this.byId("idLineVizFrame");
            if (oVizFrameLine) {
                oVizFrameLine.setVizProperties({
                    plotArea: {
                        dataLabel: { visible: false },
                        colorPalette: ["#0070F2"]
                    },
                    valueAxis: { title: { visible: false } },
                    categoryAxis: { title: { visible: false } },
                    title: { visible: false }
                });
            }

            var oVizFrameLineCount = this.byId("idLineCountVizFrame");
            if (oVizFrameLineCount) {
                oVizFrameLineCount.setVizProperties({
                    plotArea: {
                        dataLabel: { visible: false },
                        colorPalette: ["#10b981"]
                    },
                    valueAxis: { title: { visible: false } },
                    categoryAxis: { title: { visible: false } },
                    title: { visible: false }
                });
            }
            
            var oVizFramePie = this.byId("idPieVizFrame");
            if (oVizFramePie) {
                oVizFramePie.setVizProperties({
                    title: { visible: false },
                    plotArea: { dataLabel: { visible: true, type: "value" } }
                });
            }

            var oVizFrameCol = this.byId("idColumnVizFrame");
            if (oVizFrameCol) {
                oVizFrameCol.setVizProperties({
                    title: { visible: false },
                    plotArea: { dataLabel: { visible: false }, colorPalette: ["#0070F2"] },
                    valueAxis: { title: { visible: false } },
                    categoryAxis: { title: { visible: false } }
                });
            }
        },

        _processData: function() {
            var oModel = this.getView().getModel("ServiceData");
            if (!oModel) return;

            var sMonthValue = this.byId("idMonthDatePicker").getValue(); // e.g., "2026-03"
            if (!sMonthValue) return;

            var aAllServices = oModel.getProperty("/Services") || [];
            
            // Filter services by selected YYYY-MM
            var aMonthServices = aAllServices.filter(function(oService) {
                return oService.Date && oService.Date.indexOf(sMonthValue) === 0;
            });

            // Calculate KPIs
            var totalRevenue = 0;
            var totalServices = aMonthServices.length;
            
            var oDailyRevenue = {};
            var oDailyServices = {};
            var oServiceDistribution = {};

            aMonthServices.forEach(function(oService) {
                var amt = parseFloat(oService.Amount) || 0;
                totalRevenue += amt;

                var sDay = oService.Date.split("-")[2]; // "25"
                if (!oDailyRevenue[sDay]) oDailyRevenue[sDay] = 0;
                if (!oDailyServices[sDay]) oDailyServices[sDay] = 0;
                
                oDailyRevenue[sDay] += amt;
                oDailyServices[sDay] += 1;

                var sType = oService.ServiceType || "Unknown";
                if (!oServiceDistribution[sType]) {
                    oServiceDistribution[sType] = { Count: 0, Revenue: 0 };
                }
                oServiceDistribution[sType].Count += 1;
                oServiceDistribution[sType].Revenue += amt;
            });

            var workingDaysCount = Object.keys(oDailyRevenue).length;
            var avgDailyRevenue = workingDaysCount > 0 ? (totalRevenue / workingDaysCount) : 0;
            var avgServiceValue = totalServices > 0 ? (totalRevenue / totalServices) : 0;

            // Trend Chart Data (Full month, fill zeros)
            var aTrendData = [];
            var monthParts = sMonthValue.split("-");
            var daysInMonth = new Date(monthParts[0], monthParts[1], 0).getDate();
            
            for (var i = 1; i <= daysInMonth; i++) {
                var dayStr = i.toString().padStart(2, '0');
                aTrendData.push({
                    Day: dayStr,
                    Revenue: oDailyRevenue[dayStr] || 0,
                    ServiceCount: oDailyServices[dayStr] || 0
                });
            }

            // Pie/Column Distribution Data
            var aDistData = [];
            for (var key in oServiceDistribution) {
                if (oServiceDistribution.hasOwnProperty(key)) {
                    aDistData.push({
                        ServiceType: key,
                        Count: oServiceDistribution[key].Count,
                        Revenue: oServiceDistribution[key].Revenue
                    });
                }
            }

            var peakRev = 0;
            var bestDay = "N/A";
            var busiestDayCount = 0;

            for (var d in oDailyRevenue) {
                if (oDailyRevenue[d] > peakRev) {
                    peakRev = oDailyRevenue[d];
                    var monStr = new Date(parseInt(monthParts[0]), parseInt(monthParts[1]) - 1).toLocaleString('default', { month: 'short' });
                    bestDay = monStr + " " + parseInt(d, 10);
                }
            }
            for (var dx in oDailyServices) {
                if (oDailyServices[dx] > busiestDayCount) {
                    busiestDayCount = oDailyServices[dx];
                }
            }

            var topServiceType = "N/A";
            var topServiceCount = 0;

            aDistData.sort(function(a, b) {
                return b.Revenue - a.Revenue; // Descending by Revenue
            });

            if (aDistData.length > 0) {
                topServiceType = aDistData[0].ServiceType;
                topServiceCount = aDistData[0].Count;
            }

            var oViewModel = this.getView().getModel("analyticsModel");
            oViewModel.setProperty("/totalRevenue", totalRevenue.toFixed(0));
            oViewModel.setProperty("/totalServices", totalServices);
            oViewModel.setProperty("/avgDailyRevenue", avgDailyRevenue.toFixed(0));
            oViewModel.setProperty("/avgServiceValue", avgServiceValue.toFixed(0));
            
            oViewModel.setProperty("/revenueTrendData", aTrendData);
            oViewModel.setProperty("/serviceDistributionData", aDistData);

            oViewModel.setProperty("/performanceMetrics", {
                topServices: aDistData,
                bestDayDate: bestDay,
                peakRevenue: peakRev,
                busiestDayServices: busiestDayCount,
                workingDays: workingDaysCount,
                topServiceType: topServiceType
            });
        }
	});
});
