/**
 * Dashboard.controller.js — WashWizard
 * =====================================================================
 *  Handles:
 *    1. SERVICE ENTRY (Tab 1) — validate inputs, POST or UPDATE OData
 *    2. CURRENT SERVICES (Tab 2) — complete (PATCH), edit, delete a job
 *    3. PAGINATION — 8 rows per page for the pending services table
 *
 *  Edit Flow:
 *    - onButtonEditPress reads the row data from viewModel (JSON slice)
 *    - Prefills Service Entry form and sets _isEditMode = true
 *    - onSaveServiceButtonPress checks _isEditMode → calls update() instead of create()
 * =====================================================================
 */
sap.ui.define(
  [
    "sap/ui/core/mvc/Controller",
    "sap/m/MessageToast",
    "sap/m/MessageBox",
    "sap/ui/model/json/JSONModel",
    "sap/ui/model/Filter",
    "sap/ui/model/FilterOperator",
    "sap/ui/model/Sorter",
    "sap/ui/core/format/DateFormat",
    "sap/ui/core/ValueState",
    "sap/ui/core/UIComponent",
  ],
  function (
    Controller,
    MessageToast,
    MessageBox,
    JSONModel,
    Filter,
    FilterOperator,
    Sorter,
    DateFormat,
    ValueState,
    UIComponent,
  ) {
    "use strict";

    var PAGE_SIZE = 8; // rows per page for the pending table

    return Controller.extend("sap.ui.demo.walkthrough.controller.Dashboard", {
      // ── Lifecycle ─────────────────────────────────────────────────

      onInit: function () {
        this._totalAmount = 0;
        this._selectedServices = [];
        this._isEditMode = false;
        this._editPath = null; // OData path for the record being edited

        // ViewModel drives Service Details panels (pricing lists) + pagination
        var oViewModel = new JSONModel({
          currentDate: this._getFormattedDate(),
          selectedWheels: "4 Wheeler", // default to most common
          washingServices: [],
          interiorServices: [],
          coatingServices: [],
          // Pagination state for Pending table
          pendingCurrentPage: 0,
          pendingTotalPages: 1,
          pendingServicesPage: [], // current page slice (8 items max)
          allPendingServices: [], // full filtered/sorted list
        });
        this.getView().setModel(oViewModel, "viewModel");

        // Attach to router so we can refresh when the user returns to Dashboard
        var oRouter = UIComponent.getRouterFor(this);
        oRouter
          .getRoute("dashboard")
          .attachPatternMatched(this._onRouteMatched, this);

        // Try to load pricing data now (works if PricingData already loaded)
        this._tryLoadPricing();
      },

      // ── Private ───────────────────────────────────────────────────

      /** Called every time the Dashboard route is activated */
      _onRouteMatched: function () {
        this._tryLoadPricing();
        this._loadPendingServices();
      },

      /**
       * _tryLoadPricing — loads the service selection lists.
       * Tries the component model first; if not ready, attaches a
       * one-time listener so it loads the moment data arrives.
       */
      _tryLoadPricing: function () {
        var oPricingModel =
          this.getView().getModel("PricingData") ||
          (this.getOwnerComponent() &&
            this.getOwnerComponent().getModel("PricingData"));

        if (!oPricingModel) return;

        var oData = oPricingModel.getData();
        var sWheel = this.getView()
          .getModel("viewModel")
          .getProperty("/selectedWheels");

        // If data is already loaded (non-empty object), populate immediately
        if (oData && oData[sWheel]) {
          this._updateServiceLists(sWheel);
        } else {
          // Data not ready yet — wait for the JSON model's request to complete
          oPricingModel.attachEventOnce(
            "requestCompleted",
            function () {
              this._updateServiceLists(
                this.getView()
                  .getModel("viewModel")
                  .getProperty("/selectedWheels"),
              );
            }.bind(this),
          );
        }
      },

      /**
       * _loadPendingServices — reads all Pending records from OData,
       * stores them in viewModel, then applies pagination.
       */
      _loadPendingServices: function () {
        var oModel = this.getView().getModel();
        if (!oModel) return;

        var that = this;
        var oPendingFilter = new Filter("Status", FilterOperator.EQ, "Pending");
        oModel.read("/ServiceTaskSet", {
          filters: [oPendingFilter],
          sorters: [new Sorter("Date", true)],
          success: function (oData) {
            var aAll = oData && oData.results ? oData.results : [];

            // Apply current search filter to the data
            var sQuery = that._getCurrentSearchQuery();
            if (sQuery) {
              var sLower = sQuery.toLowerCase();
              aAll = aAll.filter(function (o) {
                return (
                  (o.CustomerName &&
                    o.CustomerName.toLowerCase().indexOf(sLower) !== -1) ||
                  (o.VehiclePlate &&
                    o.VehiclePlate.toLowerCase().indexOf(sLower) !== -1) ||
                  (o.CarModel &&
                    o.CarModel.toLowerCase().indexOf(sLower) !== -1)
                );
              });
            }

            var oVM = that.getView().getModel("viewModel");
            oVM.setProperty("/allPendingServices", aAll);
            oVM.setProperty("/pendingCurrentPage", 0);
            that._applyPendingPagination();
          },
          error: function () {
            // If read fails, show empty state
            var oVM = that.getView().getModel("viewModel");
            oVM.setProperty("/allPendingServices", []);
            oVM.setProperty("/pendingServicesPage", []);
            oVM.setProperty("/pendingTotalPages", 1);
          },
        });
      },

      /**
       * _applyPendingPagination — slices allPendingServices into the current
       * page and updates totalPages in the viewModel.
       */
      _applyPendingPagination: function () {
        var oVM = this.getView().getModel("viewModel");
        var aAll = oVM.getProperty("/allPendingServices") || [];
        var nPage = oVM.getProperty("/pendingCurrentPage") || 0;
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

        oVM.setProperty("/pendingCurrentPage", nPage);
        oVM.setProperty("/pendingTotalPages", nTotal);
        oVM.setProperty("/pendingServicesPage", aPage);
      },

      /** Returns current search field value (empty string if not yet rendered) */
      _getCurrentSearchQuery: function () {
        var oSF = this.byId("idDashboardSearchField");
        return oSF ? oSF.getValue().trim() : "";
      },

      /** Returns today as "Monday, 21 April 2026" */
      _getFormattedDate: function () {
        var oFmt = DateFormat.getDateInstance({
          pattern: "EEEE, dd MMMM yyyy",
        });
        return oFmt.format(new Date());
      },

      /** Returns today as "YYYY-MM-DD" */
      _getTodayIso: function () {
        var d = new Date();
        var mm = (d.getMonth() + 1).toString().padStart(2, "0");
        var dd = d.getDate().toString().padStart(2, "0");
        return d.getFullYear() + "-" + mm + "-" + dd;
      },

      /** Simple UUID generator for the Guid primary key */
      _generateGuid: function () {
        return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(
          /[xy]/g,
          function (c) {
            var r = (Math.random() * 16) | 0;
            return (c === "x" ? r : (r & 0x3) | 0x8).toString(16);
          },
        );
      },

      /** Populates Washing / Interior / Coating lists from PricingData */
      _updateServiceLists: function (sWheelType) {
        var oPricingModel =
          this.getView().getModel("PricingData") ||
          (this.getOwnerComponent() &&
            this.getOwnerComponent().getModel("PricingData"));
        if (!oPricingModel) return;

        var oSelected = oPricingModel.getData()[sWheelType];
        if (oSelected) {
          var oVM = this.getView().getModel("viewModel");
          oVM.setProperty("/washingServices", oSelected.Washing || []);
          oVM.setProperty("/interiorServices", oSelected.Interior || []);
          oVM.setProperty("/coatingServices", oSelected.Coating || []);
        }
      },

      /** Recalculates total amount from selected service items */
      _recalculateTotals: function () {
        this._totalAmount = 0;
        this._selectedServices = [];
        [
          "idWashingServicesList",
          "idInteriorServicesList",
          "idCoatingServicesList",
        ].forEach(
          function (sId) {
            var oList = this.byId(sId);
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
        // Update the amount display field
        var oAmountInput = this.byId("idAmountInput");
        if (oAmountInput) {
          oAmountInput.setValue(
            this._totalAmount > 0 ? this._totalAmount.toString() : "",
          );
        }
      },

      // ── Per-Field Live Validation Helpers ─────────────────────────

      /**
       * _setFieldState — shared utility used by both liveChange handlers
       * and the full _validateInputs run on Save.
       * @param {sap.m.Input} oInput  - the input control
       * @param {boolean}     bValid  - true = green, false = red
       * @param {string}      sMsg    - error message shown in red state
       */
      _setFieldState: function (oInput, bValid, sMsg) {
        if (bValid) {
          oInput.setValueState(ValueState.Success);
          oInput.setValueStateText("");
        } else {
          oInput.setValueState(ValueState.Error);
          oInput.setValueStateText(sMsg);
        }
      },

      /** Customer Name — must not be empty. Green immediately on first character. */
      onCustomerNameLiveChange: function (oEvent) {
        var sVal = oEvent.getSource().getValue().trim();
        this._setFieldState(
          oEvent.getSource(),
          sVal.length > 0,
          "Customer name is required.",
        );
      },

      /** Phone — exactly 10 digits. Shows X/10 countdown, flags letters instantly. */
      onPhoneLiveChange: function (oEvent) {
        var sVal = oEvent.getSource().getValue().trim();
        var bOk = /^[0-9]{10}$/.test(sVal);
        var sMsg = /[^0-9]/.test(sVal)
          ? "Only digits allowed."
          : "Phone must be exactly 10 digits (" + sVal.length + "/10).";
        this._setFieldState(oEvent.getSource(), bOk, sMsg);
      },

      /** Car Model — must not be empty. */
      onCarModelLiveChange: function (oEvent) {
        var sVal = oEvent.getSource().getValue().trim();
        this._setFieldState(
          oEvent.getSource(),
          sVal.length > 0,
          "Car model name is required.",
        );
      },

      /** Vehicle Plate — Indian format e.g. GJ 05 AR 4521. */
      onVehiclePlateLiveChange: function (oEvent) {
        var sVal = oEvent.getSource().getValue().trim().toUpperCase();
        var bOk =
          /^[A-Z]{2}[\s\-][0-9]{1,2}([\s\-][A-Z]{1,3})?[\s\-][0-9]{4}$/.test(
            sVal,
          );
        this._setFieldState(
          oEvent.getSource(),
          bOk,
          "Format: GJ 05 AR 4521  (State · District · Letters · Number)",
        );
      },

      /**
       * onInputLiveChange — unified dispatcher used by the view.
       * Routes to the correct per-field handler based on the input control's ID.
       */
      onInputLiveChange: function (oEvent) {
        var sId = oEvent.getSource().getId();
        if (sId.indexOf("idCustomerNameInput") !== -1) {
          this.onCustomerNameLiveChange(oEvent);
        } else if (sId.indexOf("idPhoneInput") !== -1) {
          this.onPhoneLiveChange(oEvent);
        } else if (sId.indexOf("idCarModelInput") !== -1) {
          this.onCarModelLiveChange(oEvent);
        } else if (sId.indexOf("idVehiclePlateInput") !== -1) {
          this.onVehiclePlateLiveChange(oEvent);
        }
      },

      /**
       * _validateInputs — runs all field validations at once on Save press.
       * Reuses _setFieldState so the same red/green rules apply.
       * Returns true only if every field passes.
       */
      _validateInputs: function () {
        var bValid = true;
        var that = this;

        function _check(oInput, bOk, sMsg) {
          that._setFieldState(oInput, bOk, sMsg);
          if (!bOk) bValid = false;
        }

        var oNameInput = this.byId("idCustomerNameInput");
        var oPhoneInput = this.byId("idPhoneInput");
        var oModelInput = this.byId("idCarModelInput");
        var oPlateInput = this.byId("idVehiclePlateInput");

        _check(
          oNameInput,
          oNameInput.getValue().trim().length > 0,
          "Customer name is required.",
        );

        var sPhone = oPhoneInput.getValue().trim();
        _check(
          oPhoneInput,
          /^[0-9]{10}$/.test(sPhone),
          /[^0-9]/.test(sPhone)
            ? "Only digits allowed."
            : "Phone must be exactly 10 digits (" + sPhone.length + "/10).",
        );

        _check(
          oModelInput,
          oModelInput.getValue().trim().length > 0,
          "Car model name is required.",
        );

        var sPlate = oPlateInput.getValue().trim().toUpperCase();
        _check(
          oPlateInput,
          /^[A-Z]{2}[\s\-][0-9]{1,2}([\s\-][A-Z]{1,3})?[\s\-][0-9]{4}$/.test(
            sPlate,
          ),
          "Format: GJ 05 AR 4521  (State · District · Letters · Number)",
        );

        // Amount check
        var oAmountInput = this.byId("idAmountInput");
        var nAmount =
          parseFloat(oAmountInput ? oAmountInput.getValue() : "0") || 0;
        if (nAmount <= 0) {
          MessageToast.show("Please select a service or enter an amount.");
          bValid = false;
        }

        return bValid;
      },

      // ── Event Handlers: Tab 1 (Service Entry) ─────────────────────

      onSelectChange: function (oEvent) {
        var sKey = oEvent.getParameter("selectedItem").getKey();
        this._updateServiceLists(sKey);
        [
          "idWashingServicesList",
          "idInteriorServicesList",
          "idCoatingServicesList",
        ].forEach(
          function (sId) {
            var oList = this.byId(sId);
            if (oList) oList.removeSelections(true);
          }.bind(this),
        );
        this._recalculateTotals();
      },

      onWashingServicesListSelectionChange: function () {
        this._recalculateTotals();
      },
      onInteriorServicesListSelectionChange: function () {
        this._recalculateTotals();
      },
      onCoatingServicesListSelectionChange: function () {
        this._recalculateTotals();
      },

      /**
       * onSaveServiceButtonPress — validates then either:
       *   - POSTs a new record (normal mode), or
       *   - PATCHes the existing record (edit mode)
       */
      onSaveServiceButtonPress: function () {
        if (!this._validateInputs()) return;

        var oAmountInput = this.byId("idAmountInput");
        var nAmount = parseFloat(oAmountInput.getValue()) || 0;
        var sPlate = this.byId("idVehiclePlateInput")
          .getValue()
          .trim()
          .toUpperCase();

        var oPayload = {
          CustomerName: this.byId("idCustomerNameInput").getValue().trim(),
          Phone: this.byId("idPhoneInput").getValue().trim(),
          CarModel: this.byId("idCarModelInput").getValue().trim(),
          VehiclePlate: sPlate,
          ServiceType:
            this._selectedServices.length > 0
              ? this._selectedServices.join(", ")
              : "General Service",
          Amount: nAmount.toFixed(2),
          PaymentMethod: this.byId("idPaymentMethodSelect").getSelectedKey(),
        };

        var oModel = this.getView().getModel(); // default ODataModel
        var that = this;

        if (this._isEditMode && this._editPath) {
          // ── EDIT MODE: update existing record ───────────────────
          oModel.update(this._editPath, oPayload, {
            success: function () {
              MessageToast.show("Service entry updated successfully!");
              that._clearForm();
              that._loadPendingServices();
              var oTabBar = that.byId("idIconTabBar");
              if (oTabBar) {
                oTabBar.setSelectedKey("current");
              }
            },
            error: function (oError) {
              var sMsg = "Update failed.";
              try {
                sMsg = JSON.parse(oError.responseText).error.message.value;
              } catch (e) {}
              MessageBox.error("Could not update service:\n" + sMsg);
            },
          });
        } else {
          // ── CREATE MODE: post new record ─────────────────────────
          oPayload.Guid = this._generateGuid();
          oPayload.Status = "Pending";
          oPayload.Date = this._getTodayIso();
          oPayload.CompletedAt = "";

          oModel.create("/ServiceTaskSet", oPayload, {
            success: function () {
              MessageToast.show("Service Added to Queue");
              that._clearForm();
              that._loadPendingServices();
              var oTabBar = that.byId("idIconTabBar");
              if (oTabBar) {
                oTabBar.setSelectedKey("current");
              }
            },
            error: function (oError) {
              var sMsg = "Save failed.";
              try {
                sMsg = JSON.parse(oError.responseText).error.message.value;
              } catch (e) {}
              MessageBox.error("Could not save service:\n" + sMsg);
            },
          });
        }
      },

      /** Clears the service entry form after a successful save */
      _clearForm: function () {
        [
          "idCustomerNameInput",
          "idPhoneInput",
          "idCarModelInput",
          "idVehiclePlateInput",
        ].forEach(
          function (sId) {
            var oInput = this.byId(sId);
            if (oInput) {
              oInput.setValue("");
              oInput.setValueState(ValueState.None);
            }
          }.bind(this),
        );
        [
          "idWashingServicesList",
          "idInteriorServicesList",
          "idCoatingServicesList",
        ].forEach(
          function (sId) {
            var oList = this.byId(sId);
            if (oList) oList.removeSelections(true);
          }.bind(this),
        );
        this._totalAmount = 0;
        this._selectedServices = [];
        var oAmtInput = this.byId("idAmountInput");
        if (oAmtInput) oAmtInput.setValue("");
        var oPaySel = this.byId("idPaymentMethodSelect");
        if (oPaySel) oPaySel.setSelectedKey("Online");

        // Reset edit mode state
        this._isEditMode = false;
        this._editPath = null;
        var oSaveBtn = this.byId("idSaveServiceButton");
        if (oSaveBtn) {
          oSaveBtn.setText("Save Service");
        }
      },

      // ── Event Handlers: Tab 2 (Current Services) ──────────────────

      /**
       * onButtonEditPress — reads the row data from the JSON viewModel slice,
       * pre-fills the Service Entry form, and switches to the entry tab.
       */
      onEditButtonPress: function (oEvent) {
        // The table is now bound to viewModel>/pendingServicesPage (JSONModel)
        var oContext = oEvent.getSource().getBindingContext("viewModel");
        if (!oContext) {
          MessageToast.show("Cannot read record data. Please try again.");
          return;
        }
        var oData = oContext.getObject();
        if (!oData || !oData.Guid) {
          MessageToast.show("Cannot determine record. Please try again.");
          return;
        }

        // Store the OData path for the UPDATE call
        this._editPath = "/ServiceTaskSet('" + oData.Guid + "')";
        this._isEditMode = true;

        // Pre-fill the Service Entry form fields
        var oNameInput = this.byId("idCustomerNameInput");
        var oPhoneInput = this.byId("idPhoneInput");
        var oModelInput = this.byId("idCarModelInput");
        var oPlateInput = this.byId("idVehiclePlateInput");
        var oAmountInput = this.byId("idAmountInput");
        var oPaySel = this.byId("idPaymentMethodSelect");

        if (oNameInput) {
          oNameInput.setValue(oData.CustomerName || "");
          oNameInput.setValueState(ValueState.None);
        }
        if (oPhoneInput) {
          oPhoneInput.setValue(oData.Phone || "");
          oPhoneInput.setValueState(ValueState.None);
        }
        if (oModelInput) {
          oModelInput.setValue(oData.CarModel || "");
          oModelInput.setValueState(ValueState.None);
        }
        if (oPlateInput) {
          oPlateInput.setValue(oData.VehiclePlate || "");
          oPlateInput.setValueState(ValueState.None);
        }
        if (oAmountInput) {
          oAmountInput.setValue(oData.Amount || "");
        }
        if (oPaySel) {
          oPaySel.setSelectedKey(oData.PaymentMethod || "Online");
        }

        // Change the Save button to indicate Update mode
        var oSaveBtn = this.byId("idSaveServiceButton");
        if (oSaveBtn) {
          oSaveBtn.setText("Update Service");
        }

        // Switch to the Service Entry tab
        var oTabBar = this.byId("idIconTabBar");
        if (oTabBar) {
          oTabBar.setSelectedKey("entry");
        }

        MessageToast.show(
          "Edit mode: modify fields and click 'Update Service'",
        );
      },

      /**
       * onCompleteButtonPress — PATCHes Status to 'Completed'.
       * Now uses Guid from the JSON viewModel slice to find the OData path.
       */
      onCompleteButtonPress: function (oEvent) {
        var oContext = oEvent.getSource().getBindingContext("viewModel");
        if (!oContext) {
          MessageToast.show("Cannot determine record — please try again.");
          return;
        }
        var oData = oContext.getObject();
        if (!oData || !oData.Guid) {
          MessageToast.show("Cannot determine record — please try again.");
          return;
        }
        var sPath = "/ServiceTaskSet('" + oData.Guid + "')";
        var oModel = this.getView().getModel();
        var that = this;

        oModel.update(
          sPath,
          {
            Status: "Completed",
            CompletedAt: this._getTodayIso(),
          },
          {
            success: function () {
              MessageToast.show("Service marked as Completed!");
              that._loadPendingServices();
            },
            error: function () {
              MessageToast.show("Could not complete service.");
            },
          },
        );
      },

      onButtonDeletePress: function (oEvent) {
        var oContext = oEvent.getSource().getBindingContext("viewModel");
        if (!oContext) return;
        var oData = oContext.getObject();
        if (!oData || !oData.Guid) return;
        var sPath = "/ServiceTaskSet('" + oData.Guid + "')";
        var oModel = this.getView().getModel();
        var that = this;

        MessageBox.confirm("Delete this pending service?", {
          onClose: function (sAction) {
            if (sAction === MessageBox.Action.OK) {
              oModel.remove(sPath, {
                success: function () {
                  MessageToast.show("Deleted.");
                  that._loadPendingServices();
                },
                error: function () {
                  MessageToast.show("Delete failed.");
                },
              });
            }
          },
        });
      },

      // Alias for mobile list delete button
      onDeleteButtonPress: function (oEvent) {
        this.onButtonDeletePress(oEvent);
      },

      // ── Pagination Handlers ────────────────────────────────────────

      onButtonPendingPrevPagePress: function () {
        var oVM = this.getView().getModel("viewModel");
        var nPage = oVM.getProperty("/pendingCurrentPage") || 0;
        if (nPage > 0) {
          oVM.setProperty("/pendingCurrentPage", nPage - 1);
          this._applyPendingPagination();
        }
      },

      onButtonPendingNextPagePress: function () {
        var oVM = this.getView().getModel("viewModel");
        var nPage = oVM.getProperty("/pendingCurrentPage") || 0;
        var nTotal = oVM.getProperty("/pendingTotalPages") || 1;
        if (nPage < nTotal - 1) {
          oVM.setProperty("/pendingCurrentPage", nPage + 1);
          this._applyPendingPagination();
        }
      },

      // ── Search ────────────────────────────────────────────────────

      onSearchFieldSearch: function () {
        this._loadPendingServices();
      },
      onSearchFieldLiveChange: function () {
        this._loadPendingServices();
      },

      // Misc
      onButtonTableSettingsPress: function () {
        MessageToast.show("Table Settings");
      },
      onButtonResetPress: function () {
        MessageToast.show("Reset");
      },
      onButtonOKPress: function () {
        MessageToast.show("OK");
      },
      onButtonCancelPress: function () {
        MessageToast.show("Cancel");
      },
      onLtPreviousButtonPress: function () {},
      onNextGtButtonPress: function () {},
    });
  },
);
