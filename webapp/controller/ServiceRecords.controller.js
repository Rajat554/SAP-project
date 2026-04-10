<<<<<<< HEAD
sap.ui.define(
  [
    "sap/ui/core/mvc/Controller",
    "sap/ui/model/json/JSONModel",
    "sap/m/MessageToast",
  ],
  function (Controller, JSONModel, MessageToast) {
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
          this._iItemsPerPage = 5;
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

          var oRouter = sap.ui.core.UIComponent.getRouterFor(this);
          oRouter
            .getRoute("serviceRecords")
            .attachPatternMatched(this._onObjectMatched, this);
        },

        _onObjectMatched: function (oEvent) {
          // Delay slightly to ensure formatting/data load is ready
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

          // Initial filter is empty
          this._aAllFilteredData = aServices.slice();
          this._updatePagination(1);
        },

        onSearchFieldSearch: function (oEvent) {
          this._applyFilters();
        },
        onSearchFieldLiveChange: function (oEvent) {
          this._applyFilters();
        },

        onComboBoxSelectionChange: function (oEvent) {
          this._applyFilters();
        },

        onRefreshButtonPress: function () {
          this.byId("idRecordsSearchField").setValue("");
          this.byId("idPaymentComboBox").setSelectedKey("All");
          this.byId("idServiceComboBox").setSelectedKey("All");
          this._applyFilters();
          MessageToast.show("Data refreshed");
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

          this._aAllFilteredData = aServices.filter(function (oItem) {
            var bMatchSearch = true;
            if (sQuery && sQuery.trim() !== "") {
              var sLowerQuery = sQuery.toLowerCase();
              bMatchSearch =
                (oItem.CustomerName &&
                  oItem.CustomerName.toLowerCase().indexOf(sLowerQuery) !==
                    -1) ||
                (oItem.CarPlate &&
                  oItem.CarPlate.toLowerCase().indexOf(sLowerQuery) !== -1) ||
                (oItem.Phone && oItem.Phone.indexOf(sLowerQuery) !== -1);
            }

            var bMatchPayment = true;
            if (sPayment !== "All" && sPayment !== "") {
              bMatchPayment = oItem.PaymentMethod === sPayment;
            }

            var bMatchService = true;
            if (sService !== "All" && sService !== "") {
              bMatchService = oItem.ServiceType === sService;
            }

            return bMatchSearch && bMatchPayment && bMatchService;
          });

          this._updatePagination(1);
        },

        _updatePagination: function (iPage) {
          var oViewModel = this.getView().getModel("viewModel");
          var iTotalItems = this._aAllFilteredData.length;
          var iTotalPages = Math.ceil(iTotalItems / this._iItemsPerPage) || 1;

          if (iPage < 1) iPage = 1;
          if (iPage > iTotalPages) iPage = iTotalPages;

          var iStartIndex = (iPage - 1) * this._iItemsPerPage;
          var iEndIndex = iStartIndex + this._iItemsPerPage;
          var aPagedData = this._aAllFilteredData.slice(iStartIndex, iEndIndex);

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

        onLtPreviousButtonPress: function () {
          var iCurrentPage = this.getView()
            .getModel("viewModel")
            .getProperty("/currentPage");
          this._updatePagination(iCurrentPage - 1);
        },

        onNextGtButtonPress: function () {
          var iCurrentPage = this.getView()
            .getModel("viewModel")
            .getProperty("/currentPage");
          this._updatePagination(iCurrentPage + 1);
        },

        onButtonPageSelectPress: function (oEvent) {
          var sPage = oEvent.getSource().getText();
          this._updatePagination(parseInt(sPage, 10));
        },

        onButtonViewDocPress: function (oEvent) {
          MessageToast.show("View document clicked");
        },

        onButtonDeletePress: function (oEvent) {
          // Delete logic for UI demonstration
          var oItem = oEvent.getSource().getParent().getParent(); // Item is CustomListItem
          var oContext = oItem.getBindingContext("viewModel");
          var oItemData = oContext.getObject();

          var oModel = this.getView().getModel("ServiceData");
          var aServices = oModel.getProperty("/Services");

          // Find and remove from main model
          for (var i = 0; i < aServices.length; i++) {
            if (
              aServices[i].CarPlate === oItemData.CarPlate &&
              aServices[i].CustomerName === oItemData.CustomerName
            ) {
              aServices.splice(i, 1);
              break;
            }
          }

          oModel.setProperty("/Services", aServices);
          this.getView()
            .getModel("viewModel")
            .setProperty("/totalServices", aServices.length);

          this._applyFilters(); // Re-apply to refresh current view

          MessageToast.show("Service record deleted.");
        },

        onButtonTableSettingsPress: function () {
          var oView = this.getView();
          var oViewModel = oView.getModel("viewModel");

          var oTableColumns = oViewModel.getProperty("/tableColumns");
          var aSettingsColumns = Object.keys(oTableColumns).map(
            function (sKey) {
              return { key: sKey, header: sKey, visible: oTableColumns[sKey] };
            },
          );
          oViewModel.setProperty("/settingsColumns", aSettingsColumns);

          if (!this._pSettingsDialog) {
            this._pSettingsDialog = sap.ui.core.Fragment.load({
              id: oView.getId(),
              name: "sap.ui.demo.walkthrough.view.ConfigureTableColumns",
              controller: this,
            }).then(function (oDialog) {
              oView.addDependent(oDialog);
              return oDialog;
            });
          }
          this._pSettingsDialog.then(function (oDialog) {
            oDialog.open();
          });
        },

        onTableSettingsConfirm: function () {
          var oViewModel = this.getView().getModel("viewModel");
          var aSettingsColumns = oViewModel.getProperty("/settingsColumns");
          var oTableColumns = {};

          aSettingsColumns.forEach(function (oCol) {
            oTableColumns[oCol.key] = oCol.visible;
          });
          oViewModel.setProperty("/tableColumns", oTableColumns);

          this._pSettingsDialog.then(function (oDialog) {
            oDialog.close();
          });
          MessageToast.show("Table columns updated successfully.");
        },

        onTableSettingsCancel: function () {
          this._pSettingsDialog.then(function (oDialog) {
            oDialog.close();
          });
        },

        onResetButtonPress: function () {
          var oViewModel = this.getView().getModel("viewModel");
          var aSettingsColumns = oViewModel.getProperty("/settingsColumns");
          aSettingsColumns.forEach(function (oCol) {
            oCol.visible = true;
          });
          oViewModel.setProperty("/settingsColumns", aSettingsColumns.slice()); // trigger binding update
        },

        onTableSettingsCancel: function (oEvent) {
          this._pSettingsDialog.then(function (oDialog) {
            oDialog.close();
          });
        },

        onTableSettingsConfirm: function (oEvent) {
          var oViewModel = this.getView().getModel("viewModel");
          var aSettingsColumns = oViewModel.getProperty("/settingsColumns");
          var oTableColumns = {};

          aSettingsColumns.forEach(function (oCol) {
            oTableColumns[oCol.key] = oCol.visible;
          });
          oViewModel.setProperty("/tableColumns", oTableColumns);

          this._pSettingsDialog.then(function (oDialog) {
            oDialog.close();
          });
          MessageToast.show("Table columns updated successfully.");
        },

        onTableSettingsConfirm: function (oEvent) {
          var oViewModel = this.getView().getModel("viewModel");
          var aSettingsColumns = oViewModel.getProperty("/settingsColumns");
          var oTableColumns = {};

          aSettingsColumns.forEach(function (oCol) {
            oTableColumns[oCol.key] = oCol.visible;
          });
          oViewModel.setProperty("/tableColumns", oTableColumns);

          this._pSettingsDialog.then(function (oDialog) {
            oDialog.close();
          });
          MessageToast.show("Table columns updated successfully.");
        },

		onOKButtonPress: function(oEvent) {
            var oViewModel = this.getView().getModel("viewModel");
            var aSettingsColumns = oViewModel.getProperty("/settingsColumns");
            var oTableColumns = {};

            aSettingsColumns.forEach(function (oCol) {
                oTableColumns[oCol.key] = oCol.visible;
            });
            oViewModel.setProperty("/tableColumns", oTableColumns);

            this._pSettingsDialog.then(function (oDialog) {
                oDialog.close();
            });
            MessageToast.show("Table columns updated successfully.");   
		},

		onCancelButtonPress: function(oEvent) {
            this._pSettingsDialog.then(function (oDialog) {
                oDialog.close();
            }); 
		},
      },
    );
  },
);
=======
sap.ui.define([
	"sap/ui/core/mvc/Controller",
	"sap/ui/model/json/JSONModel",
	"sap/m/MessageToast"
], function (Controller, JSONModel, MessageToast) {
	"use strict";

	return Controller.extend("sap.ui.demo.walkthrough.controller.ServiceRecords", {
        formatter: {
            formatDateString: function(sDate) {
                if (!sDate) return "";
                var aParts = sDate.split("-");
                if (aParts.length === 3) {
                    return parseInt(aParts[1], 10) + "/" + parseInt(aParts[2], 10) + "/" + aParts[0];
                }
                return sDate;
            }
        },

		onInit: function () {
            this._iItemsPerPage = 5;
            this._aAllFilteredData = [];

			var oViewModel = new JSONModel({
                totalServices: 0,
                pageHeaderInfo: "Page 1 of 1",
                pagedServices: [],
                currentPage: 1,
                totalPages: 1,
                hasPrevPage: false,
                hasNextPage: false
			});
			this.getView().setModel(oViewModel, "viewModel");

			var oRouter = sap.ui.core.UIComponent.getRouterFor(this);
			oRouter.getRoute("serviceRecords").attachPatternMatched(this._onObjectMatched, this);
		},

        _onObjectMatched: function (oEvent) {
            // Delay slightly to ensure formatting/data load is ready
            var that = this;
            setTimeout(function() {
                that._initializeData();
            }, 100);
        },

        _initializeData: function() {
            var oModel = this.getView().getModel("ServiceData");
            if (!oModel) return;

            var aServices = oModel.getProperty("/Services") || [];
            this.getView().getModel("viewModel").setProperty("/totalServices", aServices.length);
            
            // Initial filter is empty
            this._aAllFilteredData = aServices.slice();
            this._updatePagination(1);
        },

        onSearchFieldSearch: function (oEvent) {
            this._applyFilters();
        },
        onSearchFieldLiveChange: function (oEvent) {
            this._applyFilters();
        },

        onComboBoxSelectionChange: function (oEvent) {
            this._applyFilters();
        },

        onRefreshButtonPress: function() {
            this.byId("idRecordsSearchField").setValue("");
            this.byId("idPaymentComboBox").setSelectedKey("All");
            this.byId("idServiceComboBox").setSelectedKey("All");
            this._applyFilters();
            MessageToast.show("Data refreshed");
        },

        _applyFilters: function() {
            var sQuery = this.byId("idRecordsSearchField").getValue() || "";
            var sPayment = this.byId("idPaymentComboBox").getSelectedKey() || "All";
            var sService = this.byId("idServiceComboBox").getSelectedKey() || "All";

            var oModel = this.getView().getModel("ServiceData");
            if (!oModel) return;
            var aServices = oModel.getProperty("/Services") || [];

            this._aAllFilteredData = aServices.filter(function(oItem) {
                var bMatchSearch = true;
                if (sQuery && sQuery.trim() !== "") {
                    var sLowerQuery = sQuery.toLowerCase();
                    bMatchSearch = 
                        (oItem.CustomerName && oItem.CustomerName.toLowerCase().indexOf(sLowerQuery) !== -1) ||
                        (oItem.CarPlate && oItem.CarPlate.toLowerCase().indexOf(sLowerQuery) !== -1) ||
                        (oItem.Phone && oItem.Phone.indexOf(sLowerQuery) !== -1);
                }

                var bMatchPayment = true;
                if (sPayment !== "All" && sPayment !== "") {
                    bMatchPayment = oItem.PaymentMethod === sPayment;
                }

                var bMatchService = true;
                if (sService !== "All" && sService !== "") {
                    bMatchService = oItem.ServiceType === sService;
                }

                return bMatchSearch && bMatchPayment && bMatchService;
            });

            this._updatePagination(1);
        },

        _updatePagination: function(iPage) {
            var oViewModel = this.getView().getModel("viewModel");
            var iTotalItems = this._aAllFilteredData.length;
            var iTotalPages = Math.ceil(iTotalItems / this._iItemsPerPage) || 1;

            if (iPage < 1) iPage = 1;
            if (iPage > iTotalPages) iPage = iTotalPages;

            var iStartIndex = (iPage - 1) * this._iItemsPerPage;
            var iEndIndex = iStartIndex + this._iItemsPerPage;
            var aPagedData = this._aAllFilteredData.slice(iStartIndex, iEndIndex);

            oViewModel.setProperty("/pagedServices", aPagedData);
            oViewModel.setProperty("/currentPage", iPage);
            oViewModel.setProperty("/totalPages", iTotalPages);
            oViewModel.setProperty("/hasPrevPage", iPage > 1);
            oViewModel.setProperty("/hasNextPage", iPage < iTotalPages);
            oViewModel.setProperty("/pageHeaderInfo", "Page " + iPage + " of " + iTotalPages);
        },

        onLtPreviousButtonPress: function() {
            var iCurrentPage = this.getView().getModel("viewModel").getProperty("/currentPage");
            this._updatePagination(iCurrentPage - 1);
        },

        onNextGtButtonPress: function() {
            var iCurrentPage = this.getView().getModel("viewModel").getProperty("/currentPage");
            this._updatePagination(iCurrentPage + 1);
        },

        onButtonPageSelectPress: function(oEvent) {
            var sPage = oEvent.getSource().getText();
            this._updatePagination(parseInt(sPage, 10));
        },

        onButtonViewDocPress: function(oEvent) {
            MessageToast.show("View document clicked");
        },

        onButtonDeletePress: function(oEvent) {
            // Delete logic for UI demonstration
            var oItem = oEvent.getSource().getParent().getParent(); // Item is CustomListItem
            var oContext = oItem.getBindingContext("viewModel");
            var oItemData = oContext.getObject();
            
            var oModel = this.getView().getModel("ServiceData");
            var aServices = oModel.getProperty("/Services");
            
            // Find and remove from main model
            for (var i = 0; i < aServices.length; i++) {
                if (aServices[i].CarPlate === oItemData.CarPlate && aServices[i].CustomerName === oItemData.CustomerName) {
                    aServices.splice(i, 1);
                    break;
                }
            }
            
            oModel.setProperty("/Services", aServices);
            this.getView().getModel("viewModel").setProperty("/totalServices", aServices.length);
            
            this._applyFilters(); // Re-apply to refresh current view

            MessageToast.show("Service record deleted.");
        }
	});
});
>>>>>>> aa4020fa23e76092d2bc6e6986b01c5347b5e852
