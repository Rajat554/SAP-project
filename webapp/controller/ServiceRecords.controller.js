sap.ui.define(
  [
    "sap/ui/core/mvc/Controller",
    "sap/ui/model/json/JSONModel",
    "sap/m/MessageToast",
    "sap/ui/core/UIComponent",
    "sap/ui/core/Fragment",
  ],
  function (Controller, JSONModel, MessageToast, UIComponent, Fragment) {
    "use strict";

    return Controller.extend(
      "sap.ui.demo.walkthrough.controller.ServiceRecords",
      {
        formatter: {
          formatDateString: function (sDate) {
            if (!sDate) return "";
            var aParts = sDate.split("-");
            if (aParts.length === 3) {
              return (
                parseInt(aParts[1], 10) +
                "/" +
                parseInt(aParts[2], 10) +
                "/" +
                aParts[0]
              );
            }
            return sDate;
          },
        },

        onInit: function () {
          this._iItemsPerPage = 10;
          this._aAllFilteredData = [];

          var oViewModel = new JSONModel({
            totalServices: 0,
            pageHeaderInfo: "Page 1 of 1",
            pagedServices: [],
            currentPage: 1,
            totalPages: 1,
            hasPrevPage: false,
            hasNextPage: false,
            tableColumns: {
              Customer: true,
              Vehicle: true,
              Services: true,
              Payment: true,
              Amount: true,
              Date: true,
              Actions: true,
            },
          });
          this.getView().setModel(oViewModel, "viewModel");

          var oRouter = UIComponent.getRouterFor(this);
          oRouter
            .getRoute("serviceRecords")
            .attachPatternMatched(this._onObjectMatched, this);
        },

        // ── Private helpers ──────────────────────────────────

        _onObjectMatched: function () {
          var that = this;
          setTimeout(function () {
            that._initializeData();
          }, 100);
        },

        _initializeData: function () {
          var oModel = this.getView().getModel("ServiceData");
          if (!oModel) return;
          var aServices = oModel.getProperty("/Services") || [];
          this.getView()
            .getModel("viewModel")
            .setProperty("/totalServices", aServices.length);
          this._aAllFilteredData = aServices.slice();
          this._updatePagination(1);
        },

        _applyFilters: function () {
          var sQuery = this.byId("idRecordsSearchField").getValue() || "";
          var sPayment =
            this.byId("idPaymentComboBox").getSelectedKey() || "All";
          var sService =
            this.byId("idServiceComboBox").getSelectedKey() || "All";
          var oModel = this.getView().getModel("ServiceData");
          if (!oModel) return;
          var aServices = oModel.getProperty("/Services") || [];

          this._aAllFilteredData = aServices.filter(function (o) {
            var bSearch = true;
            if (sQuery && sQuery.trim() !== "") {
              var q = sQuery.toLowerCase();
              bSearch =
                (o.CustomerName &&
                  o.CustomerName.toLowerCase().indexOf(q) !== -1) ||
                (o.CarPlate && o.CarPlate.toLowerCase().indexOf(q) !== -1) ||
                (o.Phone && o.Phone.indexOf(q) !== -1);
            }
            var bPay = true;
            if (sPayment !== "All" && sPayment !== "")
              bPay = o.PaymentMethod === sPayment;
            var bSvc = true;
            if (sService !== "All" && sService !== "")
              bSvc = o.ServiceType === sService;
            return bSearch && bPay && bSvc;
          });
          this._updatePagination(1);
        },

        _updatePagination: function (iPage) {
          var oVM = this.getView().getModel("viewModel");
          var iTotal = this._aAllFilteredData.length;
          var iPages = Math.ceil(iTotal / this._iItemsPerPage) || 1;
          if (iPage < 1) iPage = 1;
          if (iPage > iPages) iPage = iPages;
          var iStart = (iPage - 1) * this._iItemsPerPage;
          oVM.setProperty(
            "/pagedServices",
            this._aAllFilteredData.slice(iStart, iStart + this._iItemsPerPage),
          );
          oVM.setProperty("/currentPage", iPage);
          oVM.setProperty("/totalPages", iPages);
          oVM.setProperty("/hasPrevPage", iPage > 1);
          oVM.setProperty("/hasNextPage", iPage < iPages);
          oVM.setProperty("/pageHeaderInfo", "Page " + iPage + " of " + iPages);
        },

        // ══════════════════════════════════════════════════════
        // EVENT HANDLERS — names must match ServiceRecords.view.xml
        // ══════════════════════════════════════════════════════

        // Search
        onSearchFieldSearch: function () {
          this._applyFilters();
        },
        onSearchFieldLiveChange: function () {
          this._applyFilters();
        },

        // ComboBox filters
        onComboBoxSelectionChange: function () {
          this._applyFilters();
        },
        onComboBoxSelectionChange: function () {
          this._applyFilters();
        },

        // Refresh
        onRefreshButtonPress: function () {
          this.byId("idRecordsSearchField").setValue("");
          this.byId("idPaymentComboBox").setSelectedKey("All");
          this.byId("idServiceComboBox").setSelectedKey("All");
          this._applyFilters();
          MessageToast.show("Data refreshed");
        },

        // Pagination
        onLtPreviousButtonPress: function () {
          var p = this.getView()
            .getModel("viewModel")
            .getProperty("/currentPage");
          this._updatePagination(p - 1);
        },
        onNextGtButtonPress: function () {
          var p = this.getView()
            .getModel("viewModel")
            .getProperty("/currentPage");
          this._updatePagination(p + 1);
        },
        onButtonPageSelectPress: function (oEvent) {
          this._updatePagination(parseInt(oEvent.getSource().getText(), 10));
        },

        // Print
        onPrintBillButtonPress: function () {
          MessageToast.show("Print Bill button clicked.");
        },

        // Delete
        onDeleteButtonPress: function () {
          MessageToast.show("Delete button clicked.");
        },

        // Table settings (gear icon)
        onButtonTableSettingsPress: function () {
          MessageToast.show("Table Settings button clicked.");
        },

        // Desktop table action buttons
        onButtonPrintBillPress: function () {
          MessageToast.show("Print Bill button clicked.");
        },
        onButtonDeletePress: function () {
          MessageToast.show("Delete button clicked.");
        },

        // Fragment handlers (used by ConfigureTableColumns.fragment.xml)
        onButtonResetPress: function () {
          MessageToast.show("Reset button clicked.");
        },
        onButtonOKPress: function () {
          MessageToast.show("OK button clicked.");
        },
        onButtonCancelPress: function () {
          MessageToast.show("Cancel button clicked.");
        },
      },
    );
  },
);
