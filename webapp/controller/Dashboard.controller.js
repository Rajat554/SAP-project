sap.ui.define(
  [
    "sap/ui/core/mvc/Controller",
    "sap/m/MessageToast",
    "sap/ui/model/json/JSONModel",
    "sap/ui/core/format/DateFormat",
    "sap/ui/core/Fragment",
  ],
  function (Controller, MessageToast, JSONModel, DateFormat, Fragment) {
    "use strict";

    return Controller.extend("sap.ui.demo.walkthrough.controller.Dashboard", {
      onInit: function () {
        this._totalAmount = 0;
        this._selectedServices = [];
        this._iItemsPerPage = 10;
        this._allCurrentServices = [];

        var oViewModel = new JSONModel({
          currentDate: this._getFormattedDate(),
          servicesCount: 0,
          pageHeaderInfo: "Page 1 of 1",
          pagedServices: [],
          currentPage: 1,
          totalPages: 1,
          hasPrevPage: false,
          hasNextPage: false,
          selectedWheels: "2 Wheeler",
          washingServices: [],
          interiorServices: [],
          coatingServices: [],
          tableColumns: {
            Icon: true,
            Customer: true,
            Service: true,
            Amount: true,
            Actions: true,
          },
        });
        this.getView().setModel(oViewModel, "viewModel");

        this.getView().attachEventOnce(
          "modelContextChange",
          this._updateServicesCount,
          this,
        );

        var oOwnerComponent = this.getOwnerComponent();
        if (oOwnerComponent) {
          var oPricingModel = oOwnerComponent.getModel("PricingData");
          if (oPricingModel) {
            oPricingModel.attachRequestCompleted(
              function () {
                this._updateServiceLists("2 Wheeler");
              }.bind(this),
            );
          }
        }
      },

      // ── Private helpers ──────────────────────────────────

      _getFormattedDate: function () {
        /** @type {Date} */
        var oDate = new Date();
        var oDateFormat = DateFormat.getDateInstance({
          pattern: "EEEE, dd MMMM yyyy",
        });
        return oDateFormat.format(oDate);
      },

      _updateServicesCount: function () {
        var oModel = this.getView().getModel("ServiceData");
        if (oModel) {
          var aServices = oModel.getProperty("/Services") || [];
          this.getView()
            .getModel("viewModel")
            .setProperty("/servicesCount", aServices.length);
          this._allCurrentServices = aServices;
          this._updatePagination(
            this.getView().getModel("viewModel").getProperty("/currentPage") ||
              1,
          );
        }
      },

      _updatePagination: function (iPage) {
        var oViewModel = this.getView().getModel("viewModel");
        var iTotalItems = this._allCurrentServices.length;
        var iTotalPages = Math.ceil(iTotalItems / this._iItemsPerPage) || 1;
        if (iPage < 1) iPage = 1;
        if (iPage > iTotalPages) iPage = iTotalPages;
        var iStart = (iPage - 1) * this._iItemsPerPage;
        var aPagedData = this._allCurrentServices.slice(
          iStart,
          iStart + this._iItemsPerPage,
        );
        oViewModel.setProperty("/pagedServices", aPagedData);
        oViewModel.setProperty("/currentPage", iPage);
        oViewModel.setProperty("/totalPages", iTotalPages);
        oViewModel.setProperty("/hasPrevPage", iPage > 1);
        oViewModel.setProperty("/hasNextPage", iPage < iTotalPages);
        oViewModel.setProperty(
          "/pageHeaderInfo",
          "Page " + iPage + " of " + iTotalPages,
        );
      },

      _updateServiceLists: function (sWheelType) {
        var oPricingModel =
          this.getView().getModel("PricingData") ||
          (this.getOwnerComponent() &&
            this.getOwnerComponent().getModel("PricingData"));
        if (!oPricingModel) return;
        var oData = oPricingModel.getData();
        var oSelected = oData[sWheelType];
        if (oSelected) {
          var oVM = this.getView().getModel("viewModel");
          oVM.setProperty("/washingServices", oSelected.Washing || []);
          oVM.setProperty("/interiorServices", oSelected.Interior || []);
          oVM.setProperty("/coatingServices", oSelected.Coating || []);
        }
      },

      _recalculateTotals: function () {
        this._totalAmount = 0;
        this._selectedServices = [];
        var aLists = [
          this.byId("idWashingServicesList"),
          this.byId("idInteriorServicesList"),
          this.byId("idCoatingServicesList"),
        ];
        aLists.forEach(
          function (oList) {
            if (!oList) return;
            oList.getSelectedContexts().forEach(
              function (oCtx) {
                if (oCtx) {
                  var o = oCtx.getObject();
                  this._totalAmount += parseInt(o.price, 10);
                  this._selectedServices.push(o.name);
                }
              }.bind(this),
            );
          }.bind(this),
        );
        var oAmountInput = this.byId("idAmountInput");
        if (oAmountInput) {
          oAmountInput.setValue(this._totalAmount.toString());
        }
      },

      _applyFilters: function () {
        var sQuery = "";
        var oSF = this.byId("idDashboardSearchField");
        if (oSF) sQuery = oSF.getValue() || "";
        this._allCurrentServices = (
          this.getView().getModel("ServiceData").getProperty("/Services") || []
        ).filter(function (o) {
          if (sQuery && sQuery.trim() !== "") {
            var q = sQuery.toLowerCase();
            return (
              (o.CustomerName &&
                o.CustomerName.toLowerCase().indexOf(q) !== -1) ||
              (o.CarPlate && o.CarPlate.toLowerCase().indexOf(q) !== -1)
            );
          }
          return true;
        });
        this._updatePagination(1);
      },

      // ══════════════════════════════════════════════════════
      // EVENT HANDLERS — names must match Dashboard.view.xml
      // ══════════════════════════════════════════════════════

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

      // Search
      onSearchFieldSearch: function () {
        this._applyFilters();
      },
      onSearchFieldLiveChange: function () {
        this._applyFilters();
      },

      // Select wheel change
      onSelectChange: function (oEvent) {
        var sKey = oEvent.getParameter("selectedItem").getKey();
        this._updateServiceLists(sKey);
        var w = this.byId("idWashingServicesList");
        var i = this.byId("idInteriorServicesList");
        var c = this.byId("idCoatingServicesList");
        if (w) w.removeSelections(true);
        if (i) i.removeSelections(true);
        if (c) c.removeSelections(true);
        this._recalculateTotals();
      },

      // Service list selections
      onWashingServicesListSelectionChange: function () {
        this._recalculateTotals();
      },
      onInteriorServicesListSelectionChange: function () {
        this._recalculateTotals();
      },
      onCoatingServicesListSelectionChange: function () {
        this._recalculateTotals();
      },

      // Save
      onSaveServiceButtonPress: function () {
        MessageToast.show("Save Service button clicked.");
      },

      // Complete
      onCompleteButtonPress: function () {
        MessageToast.show("Complete button clicked.");
      },

      // Delete
      onDeleteButtonPress: function () {
        MessageToast.show("Delete button clicked.");
      },

      // Edit
      onEditButtonPress: function () {
        MessageToast.show("Edit button clicked.");
      },

      // Table settings (gear icon)
      onButtonTableSettingsPress: function () {
        MessageToast.show("Table Settings button clicked.");
      },

      // Desktop table action buttons
      onButtonEditPress: function () {
        MessageToast.show("Edit button clicked.");
      },
      onButtonDeletePress: function () {
        MessageToast.show("Delete button clicked.");
      },
      onCompleteButtonPress: function () {
        MessageToast.show("Complete button clicked.");
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
    });
  },
);
