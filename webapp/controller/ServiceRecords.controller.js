/**
 * ServiceRecords.controller.js — WashWizard History View
 * =====================================================================
 *  This view shows all COMPLETED service jobs.
 *
 *  Data Flow:
 *    - On route match, reads all Completed records from OData into
 *      recordsModel>/allCompletedServices (full array).
 *    - Pagination slices the array into pages of 8.
 *    - Search/filter re-computes the filtered array and resets to page 0.
 *    - Both desktop table and mobile list bind to recordsModel>/completedServicesPage.
 *
 *  Why JSONModel instead of direct OData binding?
 *    Client-side slicing gives deterministic, exact page sizes without
 *    relying on OData $skip/$top which the mock server may not support
 *    fully in combination with $filter.
 * =====================================================================
 */
sap.ui.define(
  [
    "sap/ui/core/mvc/Controller",
    "sap/ui/model/json/JSONModel",
    "sap/ui/model/Filter",
    "sap/ui/model/FilterOperator",
    "sap/ui/model/Sorter",
    "sap/m/MessageToast",
    "sap/m/MessageBox",
    "sap/ui/core/UIComponent",
    "sap/ui/core/Fragment",
  ],
  function (
    Controller,
    JSONModel,
    Filter,
    FilterOperator,
    Sorter,
    MessageToast,
    MessageBox,
    UIComponent,
    Fragment,
  ) {
    "use strict";

    var PAGE_SIZE = 8; // rows per page

    return Controller.extend(
      "sap.ui.demo.walkthrough.controller.ServiceRecords",
      {
        // ── Lifecycle ───────────────────────────────────────────

        onInit: function () {
          // recordsModel holds pagination state and the current page slice
          var oRecordsModel = new JSONModel({
            allCompletedServices: [], // full unsliced list
            completedServicesPage: [], // current page (max 8 items)
            completedCurrentPage: 0,
            completedTotalPages: 1,
          });
          this.getView().setModel(oRecordsModel, "recordsModel");

          // Attach to router so we refresh data every time the view is shown
          var oRouter = UIComponent.getRouterFor(this);
          oRouter
            .getRoute("serviceRecords")
            .attachPatternMatched(this._onRouteMatched, this);
        },

        // ── Private ─────────────────────────────────────────────

        /**
         * _onRouteMatched — called each time the user navigates to
         * the Service Records page. Reloads all completed data.
         */
        _onRouteMatched: function () {
          this._loadCompletedServices();
        },

        /**
         * _loadCompletedServices — reads all Completed records from OData,
         * applies active search/filter, stores result, and paginates.
         */
        _loadCompletedServices: function () {
          var oModel = this.getView().getModel();
          if (!oModel) return;

          var that = this;
          var oCompletedFilter = new Filter(
            "Status",
            FilterOperator.EQ,
            "Completed",
          );
          oModel.read("/ServiceTaskSet", {
            filters: [oCompletedFilter],
            sorters: [new Sorter("CompletedAt", true)],
            success: function (oData) {
              var aAll = oData && oData.results ? oData.results : [];
              // Apply in-memory filters
              aAll = that._applyInMemoryFilters(aAll);
              var oRM = that.getView().getModel("recordsModel");
              oRM.setProperty("/allCompletedServices", aAll);
              oRM.setProperty("/completedCurrentPage", 0);
              that._applyCompletedPagination();
            },
            error: function () {
              var oRM = that.getView().getModel("recordsModel");
              oRM.setProperty("/allCompletedServices", []);
              oRM.setProperty("/completedServicesPage", []);
              oRM.setProperty("/completedTotalPages", 1);
              MessageToast.show("Could not load service records.");
            },
          });
        },

        /**
         * _applyInMemoryFilters — applies search text, payment method,
         * and service type filters to the full data array.
         * @param {Array} aAll - full unfiltered array
         * @returns {Array} filtered array
         */
        _applyInMemoryFilters: function (aAll) {
          var sQuery = "";
          var sPayment = "";
          var sService = "";

          var oSF = this.byId("idRecordsSearchField");
          if (oSF) {
            sQuery = oSF.getValue().trim().toLowerCase();
          }

          var oPayCB = this.byId("idPaymentComboBox");
          if (oPayCB) {
            sPayment = oPayCB.getSelectedKey();
          }

          var oSvcCB = this.byId("idServiceComboBox");
          if (oSvcCB) {
            sService = oSvcCB.getSelectedKey();
          }

          return aAll.filter(function (o) {
            // Search text filter (OR across name, plate, phone)
            if (sQuery) {
              var bMatch =
                (o.CustomerName &&
                  o.CustomerName.toLowerCase().indexOf(sQuery) !== -1) ||
                (o.VehiclePlate &&
                  o.VehiclePlate.toLowerCase().indexOf(sQuery) !== -1) ||
                (o.Phone && o.Phone.toLowerCase().indexOf(sQuery) !== -1);
              if (!bMatch) return false;
            }
            // Payment filter
            if (
              sPayment &&
              sPayment !== "All" &&
              o.PaymentMethod !== sPayment
            ) {
              return false;
            }
            // Service type filter (contains match for multi-service strings)
            if (sService && sService !== "All") {
              if (!o.ServiceType || o.ServiceType.indexOf(sService) === -1) {
                return false;
              }
            }
            return true;
          });
        },

        /**
         * _applyCompletedPagination — slices allCompletedServices into
         * the current page and updates completedTotalPages.
         */
        _applyCompletedPagination: function () {
          var oRM = this.getView().getModel("recordsModel");
          var aAll = oRM.getProperty("/allCompletedServices") || [];
          var nPage = oRM.getProperty("/completedCurrentPage") || 0;
          var nTotal = Math.max(1, Math.ceil(aAll.length / PAGE_SIZE));

          // Clamp page index
          if (nPage >= nTotal) {
            nPage = nTotal - 1;
          }
          if (nPage < 0) {
            nPage = 0;
          }

          var nStart = nPage * PAGE_SIZE;
          var aPage = aAll.slice(nStart, nStart + PAGE_SIZE);

          oRM.setProperty("/completedCurrentPage", nPage);
          oRM.setProperty("/completedTotalPages", nTotal);
          oRM.setProperty("/completedServicesPage", aPage);
        },

        // ── Event Handlers ──────────────────────────────────────

        /** Refresh button — re-fetches data from the mock server */
        onRefreshButtonPress: function () {
          this.byId("idRecordsSearchField").setValue("");
          this.byId("idPaymentComboBox").setSelectedKey("All");
          this.byId("idServiceComboBox").setSelectedKey("All");
          this._loadCompletedServices();
          MessageToast.show("Data refreshed");
        },

        // Search handlers — reload with new filter
        onSearchFieldSearch: function () {
          this._loadCompletedServices();
        },
        onSearchFieldLiveChange: function () {
          this._loadCompletedServices();
        },

        // ComboBox filter handlers
        onComboBoxPaymentChange: function () {
          this._loadCompletedServices();
        },
        onComboBoxServiceChange: function () {
          this._loadCompletedServices();
        },
        onComboBoxSelectionChange: function () {
          this._loadCompletedServices();
        },

        // ── Pagination Handlers ──────────────────────────────────

        onButtonCompletedPrevPagePress: function () {
          var oRM = this.getView().getModel("recordsModel");
          var nPage = oRM.getProperty("/completedCurrentPage") || 0;
          if (nPage > 0) {
            oRM.setProperty("/completedCurrentPage", nPage - 1);
            this._applyCompletedPagination();
          }
        },

        onButtonCompletedNextPagePress: function () {
          var oRM = this.getView().getModel("recordsModel");
          var nPage = oRM.getProperty("/completedCurrentPage") || 0;
          var nTotal = oRM.getProperty("/completedTotalPages") || 1;
          if (nPage < nTotal - 1) {
            oRM.setProperty("/completedCurrentPage", nPage + 1);
            this._applyCompletedPagination();
          }
        },

        // ── Action Handlers ──────────────────────────────────────

        /** Print Bill — placeholder for future print logic */
        onButtonPrintBillPress: function () {
          MessageToast.show("Printing bill...");
        },
        onPrintBillButtonPress: function () {
          MessageToast.show("Printing bill...");
        },

        /** Delete a completed record from history */
        onButtonDeletePress: function (oEvent) {
          var oContext = oEvent.getSource().getBindingContext("recordsModel");
          if (!oContext) return;
          var oData = oContext.getObject();
          if (!oData || !oData.Guid) return;
          var sPath = "/ServiceTaskSet('" + oData.Guid + "')";
          var oModel = this.getView().getModel();
          var that = this;

          MessageBox.confirm("Permanently delete this service record?", {
            onClose: function (sAction) {
              if (sAction === MessageBox.Action.OK) {
                oModel.remove(sPath, {
                  success: function () {
                    MessageToast.show("Record deleted.");
                    that._loadCompletedServices();
                  },
                  error: function () {
                    MessageToast.show("Delete failed.");
                  },
                });
              }
            },
          });
        },

        onDeleteButtonPress: function (oEvent) {
          this.onButtonDeletePress(oEvent);
        },

        // ── Table Settings (Column Visibility) ────────────────────────
        onButtonTableSettingsPress: function () {
          var oView = this.getView();
          var oTable = this.byId("idCompletedServicesPageTable");
          this._currentTableForSettings = oTable;

          if (!this._pColumnSettingsDialog) {
            this._pColumnSettingsDialog = Fragment.load({
              id: oView.getId(),
              name: "sap.ui.demo.walkthrough.view.fragments.ColumnSettings",
              controller: this,
            }).then(function (oDialog) {
              oView.addDependent(oDialog);
              return oDialog;
            });
          }

          this._pColumnSettingsDialog.then(function (oDialog) {
            // Build column data model for the list
            var aCols = oTable.getColumns().map(function (oCol, i) {
              var sName = "Column " + (i + 1);
              var oHeader = oCol.getHeader();
              if (oHeader && oHeader.getText && oHeader.getText()) {
                sName = oHeader.getText();
              } else if (i === 0) {
                sName = "Icon Indicator";
              }
              return {
                id: oCol.getId(),
                name: sName,
                visible: oCol.getVisible(),
                index: i,
              };
            });

            var oModel = new JSONModel({ columns: aCols });
            oDialog.setModel(oModel, "colsModel");
            oDialog.open();
          });
        },

        onOKButtonPress: function (oEvent) {
          var oDialog = oEvent.getSource().getParent();
          var oList = sap.ui.core.Fragment.byId(
            this.getView().getId(),
            "idColumnsSettingsList",
          );
          var aItems = oList.getItems();
          var oTable = this._currentTableForSettings;

          aItems.forEach(function (oItem) {
            var oContext = oItem.getBindingContext("colsModel");
            if (oContext) {
              var bSelected = oItem.getSelected();
              var nIndex = oContext.getProperty("index");
              var oColumn = oTable.getColumns()[nIndex];
              if (oColumn) {
                oColumn.setVisible(bSelected);
              }
            }
          });
          oDialog.close();
        },

        onCancelButtonPress: function (oEvent) {
          oEvent.getSource().getParent().close();
        },
      },
    );
  },
);
