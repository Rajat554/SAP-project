
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

    var PAGE_SIZE = 8; 

    return Controller.extend(
      "sap.ui.demo.walkthrough.controller.ServiceRecords",
      {
        

        onInit: function () {
          
          var oRouter = UIComponent.getRouterFor(this);
          oRouter
            .getRoute("serviceRecords")
            .attachPatternMatched(this._onRouteMatched, this);
        },

        _onRouteMatched: function () {
          this._applyServerSideFilters();
        },

        _applyServerSideFilters: function () {
          var aFilters = [new Filter("Status", FilterOperator.EQ, "Completed")];
          
          var oSF = this.byId("idRecordsSearchField");
          var sQuery = oSF ? oSF.getValue().trim() : "";

          if (sQuery) {
             var oSearchFilter = new Filter({
                 filters: [
                     new Filter("CustomerName", FilterOperator.Contains, sQuery),
                     new Filter("VehiclePlate", FilterOperator.Contains, sQuery),
                     new Filter("Phone", FilterOperator.Contains, sQuery)
                 ],
                 and: false
             });
             aFilters.push(oSearchFilter);
          }

          var oPayCB = this.byId("idPaymentComboBox");
          if (oPayCB && oPayCB.getSelectedKey() && oPayCB.getSelectedKey() !== "All") {
              aFilters.push(new Filter("PaymentMethod", FilterOperator.EQ, oPayCB.getSelectedKey()));
          }

          var oSvcCB = this.byId("idServiceComboBox");
          if (oSvcCB && oSvcCB.getSelectedKey() && oSvcCB.getSelectedKey() !== "All") {
              aFilters.push(new Filter("ServiceType", FilterOperator.Contains, oSvcCB.getSelectedKey()));
          }

          var oTable = this.byId("idServiceTaskSetCompletedTable");
          if (oTable && oTable.getBinding("items")) {
              oTable.getBinding("items").filter(aFilters);
          }

          var oList = this.byId("idServiceTaskSetCompletedList");
          if (oList && oList.getBinding("items")) {
              oList.getBinding("items").filter(aFilters);
          }
        },

        onRefreshButtonPress: function () {
          this.byId("idRecordsSearchField").setValue("");
          this.byId("idPaymentComboBox").setSelectedKey("All");
          this.byId("idServiceComboBox").setSelectedKey("All");
          this._applyServerSideFilters();
          MessageToast.show("Data refreshed");
        },

        onSearchFieldSearch: function () {
          this._applyServerSideFilters();
        },
        onSearchFieldLiveChange: function () {
          this._applyServerSideFilters();
        },

        onComboBoxPaymentChange: function () {
          this._applyServerSideFilters();
        },
        onComboBoxServiceChange: function () {
          this._applyServerSideFilters();
        },
        onComboBoxSelectionChange: function () {
          this._applyServerSideFilters();
        },

        

        
        onButtonPrintBillPress: function (oEvent) {
          this._printReceipt(oEvent);
        },
        onPrintBillButtonPress: function (oEvent) {
          this._printReceipt(oEvent);
        },

        _printReceipt: function(oEvent) {
            var oContext = oEvent.getSource().getBindingContext();
            var oData = oContext ? oContext.getObject() : oEvent.getSource().getBindingContext("recordsModel").getObject();
            if (!oData) return;

            
            var sReceiptHtml = 
                "<div style='width: 300px; font-family: monospace; padding: 10px; margin: 0 auto;'>" +
                "<h2 style='text-align: center; margin-bottom: 5px;'>WASH WIZARD</h2>" +
                "<p style='text-align: center; margin-top: 0; font-size: 12px;'>Automotive Care Studio</p>" +
                "<hr style='border-top: 1px dashed black;'/>" +
                "<p><strong>Date:</strong> " + (oData.CompletedAt || new Date().toISOString().split('T')[0]) + "</p>" +
                "<p><strong>Customer:</strong> " + oData.CustomerName + "</p>" +
                "<p><strong>Vehicle:</strong> " + oData.VehiclePlate + " (" + oData.CarModel + ")</p>" +
                "<p><strong>Phone:</strong> " + oData.Phone + "</p>" +
                "<hr style='border-top: 1px dashed black;'/>" +
                "<p><strong>Services:</strong><br/>" + oData.ServiceType + "</p>" +
                "<hr style='border-top: 1px dashed black;'/>" +
                "<h3 style='text-align: right;'>TOTAL: Rs. " + oData.Amount + "</h3>" +
                "<p style='text-align: right; font-size: 12px;'>Paid via: " + oData.PaymentMethod + "</p>" +
                "<hr style='border-top: 1px dashed black;'/>" +
                "<p style='text-align: center; font-size: 12px;'>Thank you for your business!</p>" +
                "</div>";

            
            var oPrintWindow = window.open("", "_blank", "width=400,height=600");
            oPrintWindow.document.write("<html><head><title>Print Receipt</title></head><body onload='window.print();window.close();'>" + sReceiptHtml + "</body></html>");
            oPrintWindow.document.close();
            
            MessageToast.show("Sending to printer...");
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
          var oView = this.getView();
          var oTable = this.byId("idServiceTaskSetCompletedTable");
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
