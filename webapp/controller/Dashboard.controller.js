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
				servicesCount: 0
			});
			this.getView().setModel(oViewModel, "viewModel");

			// Attach an event to update counts whenever the ServiceData model changes
			this.getView().attachEventOnce("modelContextChange", this._updateServicesCount, this);
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

		onFullWashCheckBoxSelect: function (oEvent) { this.onServiceCheck(oEvent); },
		onHalfWashCheckBoxSelect: function (oEvent) { this.onServiceCheck(oEvent); },
		onTopWashCheckBoxSelect: function (oEvent) { this.onServiceCheck(oEvent); },
		onWaterWashCheckBoxSelect: function (oEvent) { this.onServiceCheck(oEvent); },
		onDeseilWashCheckBoxSelect: function (oEvent) { this.onServiceCheck(oEvent); },
		onOilSpareCheckBoxSelect: function (oEvent) { this.onServiceCheck(oEvent); },
		onWashingAmpGressingCheckBoxSelect: function (oEvent) { this.onServiceCheck(oEvent); },
		onServiceCheck: function (oEvent) {
            // Get CheckBox reference
			var oCheckBox = oEvent.getSource();
            // Get whether it's selected
			var bSelected = oEvent.getParameter("selected");
            // Get custom data 'price'
			var sPrice = oCheckBox.data("price");
			var iPrice = parseInt(sPrice, 10);
            var sText = oCheckBox.getText();

			if (bSelected) {
				this._totalAmount += iPrice;
                this._selectedServices.push(sText);
			} else {
				this._totalAmount -= iPrice;
                var index = this._selectedServices.indexOf(sText);
                if (index > -1) {
                    this._selectedServices.splice(index, 1);
                }
			}

            // Update Amount Input Field
            var oAmountInput = this.byId("idAmountInput");
			oAmountInput.setValue(this._totalAmount.toString());
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
        }
	});
});
