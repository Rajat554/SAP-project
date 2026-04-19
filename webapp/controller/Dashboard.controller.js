sap.ui.define([
	"sap/ui/core/mvc/Controller",
	"sap/m/MessageToast",
	"sap/ui/model/json/JSONModel",
	"sap/ui/core/format/DateFormat"
], function (Controller, MessageToast, JSONModel, DateFormat) {
	"use strict";

	return Controller.extend("sap.ui.demo.walkthrough.controller.Dashboard", {
		onInit: function () {
            this._totalAmount = 0;
            this._selectedServices = []; // Track selected services

			// Initialize Date and other view state
			var oRouter = sap.ui.core.UIComponent.getRouterFor(this);
			// We wait for the view to attach before we can reliably read the model count sometimes, 
            // but we can set up the basic view model now.
			var oViewModel = new JSONModel({
				currentDate: this._getFormattedDate(),
				servicesCount: 0,
                selectedWheels: "2 Wheeler",
                washingServices: [],
                interiorServices: [],
                coatingServices: [],
                tableColumns: {
                    Icon: true,
                    Customer: true,
                    Service: true,
                    Amount: true,
                    Actions: true
                }
			});
			this.getView().setModel(oViewModel, "viewModel");

			// Attach an event to update counts whenever the ServiceData model changes
			this.getView().attachEventOnce("modelContextChange", this._updateServicesCount, this);
            
            var oOwnerComponent = this.getOwnerComponent();
            if (oOwnerComponent) {
                var oPricingModel = oOwnerComponent.getModel("PricingData");
                if (oPricingModel) {
                    oPricingModel.attachRequestCompleted(function() {
                        this._updateServiceLists("2 Wheeler");
                    }.bind(this));
                }
            }
		},

		_getFormattedDate: function() {
			/** @type {Date} */
			var oDate = new Date();
			var oDateFormat = DateFormat.getDateInstance({pattern: "EEEE, dd MMMM yyyy"});
			return oDateFormat.format(oDate);
		},

		_updateServicesCount: function() {
			var oModel = this.getView().getModel("ServiceData");
			if (oModel) {
				var aServices = oModel.getProperty("/Services") || [];
				this.getView().getModel("viewModel").setProperty("/servicesCount", aServices.length);
			}
		},

		onSelectWheelChange: function (oEvent) {
            var sSelectedKey = oEvent.getParameter("selectedItem").getKey();
            this._updateServiceLists(sSelectedKey);
            
            // Reset selection and totals whenever vehicle changes
            var oWashingList = this.byId("idWashingServicesList");
            var oInteriorList = this.byId("idInteriorServicesList");
            var oCoatingList = this.byId("idCoatingServicesList");
            
            if (oWashingList) oWashingList.removeSelections(true);
            if (oInteriorList) oInteriorList.removeSelections(true);
            if (oCoatingList) oCoatingList.removeSelections(true);
            
            this._recalculateTotals();
        },
        
        _updateServiceLists: function(sWheelType) {
            var oPricingModel = this.getView().getModel("PricingData") || (this.getOwnerComponent() && this.getOwnerComponent().getModel("PricingData"));
            if (!oPricingModel) return;
                
            var oPricingData = oPricingModel.getData();
            var oSelectedData = oPricingData[sWheelType];
            
            if (oSelectedData) {
            	var oViewModel = this.getView().getModel("viewModel");
                oViewModel.setProperty("/washingServices", oSelectedData.Washing || []);
                oViewModel.setProperty("/interiorServices", oSelectedData.Interior || []);
                oViewModel.setProperty("/coatingServices", oSelectedData.Coating || []);
            }
        },

        onWashingServicesListSelectionChange: function (oEvent) { this._recalculateTotals(); },
        onInteriorServicesListSelectionChange: function (oEvent) { this._recalculateTotals(); },
        onCoatingServicesListSelectionChange: function (oEvent) { this._recalculateTotals(); },

        _recalculateTotals: function() {
            this._totalAmount = 0;
            this._selectedServices = [];
            
            var aLists = [
                this.byId("idWashingServicesList"),
                this.byId("idInteriorServicesList"),
                this.byId("idCoatingServicesList")
            ];
            
            aLists.forEach(function(oList) {
                if (!oList) return;
                var aSelectedItems = oList.getSelectedContexts();
                aSelectedItems.forEach(function(oContext) {
                    if (oContext) {
                        var oData = oContext.getObject();
                        this._totalAmount += parseInt(oData.price, 10);
                        this._selectedServices.push(oData.name);
                    }
                }.bind(this));
            }.bind(this));
            
            var oAmountInput = this.byId("idAmountInput");
            if(oAmountInput) {
				oAmountInput.setValue(this._totalAmount.toString());
            }
		},

		onSaveServiceButtonPress: function () {
            var sCustomerName = this.byId("idRajatPatelInput") ? this.byId("idRajatPatelInput").getValue() : "Walk-in Customer";
            var sVehicleNumber = this.byId("idVehicleInput") ? this.byId("idVehicleInput").getValue() : "Unknown";

			if (this._totalAmount === 0 || this._selectedServices.length === 0) {
				MessageToast.show("Please select at least one service.");
				return;
			}

			var oModel = this.getView().getModel("ServiceData");
			var aServices = oModel.getProperty("/Services") || [];

			var newService = {
				CarPlate: sVehicleNumber,
				CustomerName: sCustomerName,
				ServiceType: this._selectedServices.join(", "),
				Date: new Date().toISOString().split('T')[0],
				Status: "Pending",
				Amount: this._totalAmount
			};

			aServices.unshift(newService);
			oModel.setProperty("/Services", aServices);
			this._updateServicesCount();

			MessageToast.show("Service saved and added to queue!");
			
			// Switch to Current Services tab
			this.byId("idIconTabBar").setSelectedKey("current");
		},
        
        onCompleteButtonPress: function(oEvent) {
            // Delete logic for 'Complete'
            var oItem = oEvent.getSource().getParent().getParent(); // Item is CustomListItem
            var oContext = oItem.getBindingContext("ServiceData");
            var sPath = oContext.getPath();
            var iIndex = parseInt(sPath.split("/")[2], 10);

            var oModel = this.getView().getModel("ServiceData");
            var aServices = oModel.getProperty("/Services");
            aServices.splice(iIndex, 1);
            oModel.setProperty("/Services", aServices);
            this._updateServicesCount();

            MessageToast.show("Service marked as Complete.");
        },

        onButtonDeletePress: function(oEvent) {
            this.onCompleteButtonPress(oEvent); // Reuse the same removal logic for demo
            MessageToast.show("Service record deleted.");
        },

        onButtonEditPress: function() {
            MessageToast.show("Edit clicked.");
        },

		onSelectWheelChange: function(oEvent) {
            var sSelectedKey = oEvent.getParameter("selectedItem").getKey();
            this._updateServiceLists(sSelectedKey);
            
            // Reset selection and totals whenever vehicle changes
            var oWashingList = this.byId("idWashingServicesList");
            var oInteriorList = this.byId("idInteriorServicesList");
            var oCoatingList = this.byId("idCoatingServicesList");
            
            if (oWashingList) oWashingList.removeSelections(true);
            if (oInteriorList) oInteriorList.removeSelections(true);
            if (oCoatingList) oCoatingList.removeSelections(true);
            
            this._recalculateTotals();  
		},

        onButtonTableSettingsPress: function () {
			var oView = this.getView();
            var oViewModel = oView.getModel("viewModel");
            
            var oTableColumns = oViewModel.getProperty("/tableColumns");
            var aSettingsColumns = Object.keys(oTableColumns).map(function(sKey) {
                return { key: sKey, header: sKey, visible: oTableColumns[sKey] };
            });
            oViewModel.setProperty("/settingsColumns", aSettingsColumns);

			if (!this._pSettingsDialog) {
				this._pSettingsDialog = sap.ui.core.Fragment.load({
					id: oView.getId(),
					name: "sap.ui.demo.walkthrough.view.ConfigureTableColumns",
					controller: this
				}).then(function (oDialog) {
					oView.addDependent(oDialog);
					return oDialog;
				});
			}
			this._pSettingsDialog.then(function(oDialog) {
				oDialog.open();
			});
		},

        onTableSettingsConfirm: function() {
            var oViewModel = this.getView().getModel("viewModel");
            var aSettingsColumns = oViewModel.getProperty("/settingsColumns");
            var oTableColumns = {};
            
            aSettingsColumns.forEach(function(oCol) {
                oTableColumns[oCol.key] = oCol.visible;
            });
            oViewModel.setProperty("/tableColumns", oTableColumns);
            
            this._pSettingsDialog.then(function(oDialog) { oDialog.close(); });
            MessageToast.show("Table columns updated successfully.");
        },

        onTableSettingsCancel: function() {
            this._pSettingsDialog.then(function(oDialog) { oDialog.close(); });
        },

        onResetTableColumnsPress: function() {
            var oViewModel = this.getView().getModel("viewModel");
            var aSettingsColumns = oViewModel.getProperty("/settingsColumns");
            aSettingsColumns.forEach(function(oCol) {
                oCol.visible = true;
            });
            oViewModel.setProperty("/settingsColumns", aSettingsColumns.slice()); // trigger binding update
        }
	});
});
