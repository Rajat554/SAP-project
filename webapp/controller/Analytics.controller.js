/**
 * Analytics.controller.js — WashWizard Revenue Analytics
 * =====================================================================
 *  Reads from the default ODataModel (the "" model).
 *
 *  Data Flow (fixed):
 *    1. On route match, force a fresh oModel.read("/ServiceTaskSet") call.
 *    2. Use the response data directly (not from ODataModel cache) to
 *       guarantee charts render even on first navigation.
 *    3. Filter for Status='Completed', aggregate by month/day/service type.
 *    4. Push results into analyticsModel for chart bindings.
 *
 *  This approach avoids the ODataModel cache timing issue where
 *  getProperty("/ServiceTaskSet") returns empty on first load.
 * =====================================================================
 */
sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/ui/model/json/JSONModel",
    "sap/m/MessageToast"
], function (Controller, JSONModel, MessageToast) {
    "use strict";

    return Controller.extend("sap.ui.demo.walkthrough.controller.Analytics", {

        // ── Lifecycle ─────────────────────────────────────────────

        onInit: function () {
            // analyticsModel holds all computed KPIs and chart data
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

            // Listen for navigation to this page
            var oRouter = sap.ui.core.UIComponent.getRouterFor(this);
            oRouter.getRoute("analytics").attachPatternMatched(this._onObjectMatched, this);
        },

        // ── Private ───────────────────────────────────────────────

        _onObjectMatched: function () {
            // Set current month as default filter value
            var oDatePicker = this.byId("idMonthDatePicker");
            if (oDatePicker && !oDatePicker.getValue()) {
                var oDate   = new Date();
                var sMonth  = (oDate.getMonth() + 1).toString().padStart(2, "0");
                oDatePicker.setValue(oDate.getFullYear() + "-" + sMonth);
            }

            // Always force a fresh OData read to get up-to-date data
            this._loadAndProcess();
        },

        /**
         * _loadAndProcess — forces an OData read of /ServiceTaskSet and
         * passes the results directly to _processData(). This avoids
         * the ODataModel cache timing issue.
         */
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

        /** Sets chart visual properties (colors, labels) once on navigation */
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

        /**
         * _processData — main analytics calculation function.
         * Receives the already-filtered array of Completed records directly
         * from the OData read response (no cache dependency).
         *
         * @param {Array} aAllCompleted - all completed ServiceTask records
         */
        _processData: function (aAllCompleted) {
            if (!aAllCompleted || aAllCompleted.length === 0) {
                // Reset all KPIs to zero/empty so the UI shows an empty state
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

            // ── Step 1: Filter by selected month ──────────────────
            var oDatePicker = this.byId("idMonthDatePicker");
            if (!oDatePicker) return;
            var sMonthValue = oDatePicker.getValue(); // "2026-04"
            if (!sMonthValue) return;

            var aMonthServices = aAllCompleted.filter(function (oService) {
                // Check both CompletedAt and Date fields
                var dDate = oService.CompletedAt || oService.Date;
                if (!dDate) return false;
                
                var sDateStr = "";
                if (dDate instanceof Date) {
                    var mm = (dDate.getMonth() + 1).toString().padStart(2, "0");
                    sDateStr = dDate.getFullYear() + "-" + mm;
                } else if (typeof dDate === "string") {
                    sDateStr = dDate.substring(0, 7); // e.g. "2026-05" from "2026-05-03"
                }
                
                return sDateStr === sMonthValue;
            });

            // ── Step 2: Aggregate revenue and service counts ───────
            var totalRevenue       = 0;
            var totalServices      = aMonthServices.length;
            var oDailyRevenue      = {};
            var oDailyServices     = {};
            var oServiceDist       = {};

            aMonthServices.forEach(function (oService) {
                var amt = parseFloat(oService.Amount) || 0;
                totalRevenue += amt;

                // Group by day (just the DD part of the date string)
                var dDate = oService.CompletedAt || oService.Date;
                var sDay = "01";
                if (dDate instanceof Date) {
                    sDay = dDate.getDate().toString().padStart(2, "0");
                } else if (typeof dDate === "string" && dDate.length >= 10) {
                    sDay = dDate.split("-")[2].substring(0, 2);
                }

                oDailyRevenue[sDay]   = (oDailyRevenue[sDay]   || 0) + amt;
                oDailyServices[sDay]  = (oDailyServices[sDay]  || 0) + 1;

                // Split multi-service entries for more accurate distribution
                var aTypes = (oService.ServiceType || "Unknown").split(",");
                aTypes.forEach(function (sRaw) {
                    var sType = sRaw.trim();
                    if (!sType) return;
                    if (!oServiceDist[sType]) {
                        oServiceDist[sType] = { Count: 0, Revenue: 0 };
                    }
                    // Distribute revenue equally among service types for this entry
                    oServiceDist[sType].Count   += 1;
                    oServiceDist[sType].Revenue += (amt / aTypes.length);
                });
            });

            var workingDaysCount = Object.keys(oDailyRevenue).length;
            var avgDailyRevenue  = workingDaysCount > 0 ? totalRevenue / workingDaysCount : 0;
            var avgServiceValue  = totalServices   > 0 ? totalRevenue / totalServices    : 0;

            // ── Step 3: Build trend chart data (full month) ────────
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

            // ── Step 4: Build distribution data ───────────────────
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

            // Peak day calculation
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

            // ── Step 5: Push to analyticsModel ─────────────────────
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

        // ── Event Handlers ───────────────────────────────────────

        /** Called when the month/year picker changes */
        onDatePickerMonthChange: function () {
            this._loadAndProcess();
        }

    });
});
