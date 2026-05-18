
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
  ) {
    "use strict";

    var PAGE_SIZE = 8; 

    return Controller.extend(
      "sap.ui.demo.walkthrough.controller.ServiceRecords",
      {
        

        onInit: function () {
          
          var oRecordsModel = new JSONModel({
            allCompletedServices: [], 
            completedServicesPage: [], 
            completedCurrentPage: 0,
            completedTotalPages: 1,
          });
          this.getView().setModel(oRecordsModel, "recordsModel");

          
          var oRouter = UIComponent.getRouterFor(this);
          oRouter
            .getRoute("serviceRecords")
            .attachPatternMatched(this._onRouteMatched, this);
        },

        

        
        _onRouteMatched: function () {
          this._loadCompletedServices();
        },

        
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
            
            if (sQuery) {
              var bMatch =
                (o.CustomerName &&
                  o.CustomerName.toLowerCase().indexOf(sQuery) !== -1) ||
                (o.VehiclePlate &&
                  o.VehiclePlate.toLowerCase().indexOf(sQuery) !== -1) ||
                (o.Phone && o.Phone.toLowerCase().indexOf(sQuery) !== -1);
              if (!bMatch) return false;
            }
            
            if (
              sPayment &&
              sPayment !== "All" &&
              o.PaymentMethod !== sPayment
            ) {
              return false;
            }
            
            if (sService && sService !== "All") {
              if (!o.ServiceType || o.ServiceType.indexOf(sService) === -1) {
                return false;
              }
            }
            return true;
          });
        },

        
        _applyCompletedPagination: function () {
          var oRM = this.getView().getModel("recordsModel");
          var aAll = oRM.getProperty("/allCompletedServices") || [];
          var nPage = oRM.getProperty("/completedCurrentPage") || 0;
          var nTotal = Math.max(1, Math.ceil(aAll.length / PAGE_SIZE));

          
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

        

        
        onRefreshButtonPress: function () {
          this.byId("idRecordsSearchField").setValue("");
          this.byId("idPaymentComboBox").setSelectedKey("All");
          this.byId("idServiceComboBox").setSelectedKey("All");
          this._loadCompletedServices();
          MessageToast.show("Data refreshed");
        },

        
        onSearchFieldSearch: function () {
          this._loadCompletedServices();
        },
        onSearchFieldLiveChange: function () {
          this._loadCompletedServices();
        },

        
        onComboBoxPaymentChange: function () {
          this._loadCompletedServices();
        },
        onComboBoxServiceChange: function () {
          this._loadCompletedServices();
        },
        onComboBoxSelectionChange: function () {
          this._loadCompletedServices();
        },

        

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

        

        
        onButtonPrintBillPress: function () {
          MessageToast.show("Printing bill...");
        },
        onPrintBillButtonPress: function () {
          MessageToast.show("Printing bill...");
        },

        
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
      },
    );
  },
);
