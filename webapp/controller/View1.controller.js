// sap.ui.define([
//     "sap/ui/core/mvc/Controller",
//     "sap/ui/model/json/JSONModel",
//     "sap/ui/model/Filter",
//     "sap/ui/model/FilterOperator",
//     "sap/ui/model/Sorter",
//     "sap/m/MessageToast"
// ], (Controller,JSONModel,Filter,FilterOperator,Sorter,MessageToast) => {
//     "use strict";

//     return Controller.extend("juniorpod.controller.View1", {
//         onInit() {
//         },
//         onEnter:function (oEvent){
//             const aFilter=[];
//             const oInput=this.byId("companycoded");
//             const sQuery=oInput.getValue();
//             if(sQuery){
//                 aFilter.push(new Filter('CompanyCode',FilterOperator.Contains, sQuery));
//             }
//             const oTable=this.byId("cmpTable");
//             const oBinding=oTable.getBinding("items");
//             oBinding.filter(aFilter);
//         },
//         // onClick:function(){
//         //     //this.getOwnerComponent().getRouter().navTo("View2");
//         //      this.getOwnerComponent().getRouter().navTo("View2",{
//         //     index: sIndex
//         // })
//         //},
//         onRowPress:function(oEvent){
//         var oItem = oEvent.getSource();
//         var oContext = oItem.getBindingContext("bhuvan");
//         if (!oContext) {
//             return;
//         }
//         var sPath = oContext.getPath();
//         var sIndex = sPath.split("/").pop();
//         this.getOwnerComponent().getRouter().navTo("View2",{
//             index: sIndex
//         });

//            console.log("Row triggered")
//         }
//     });
// });
sap.ui.define([
  "sap/ui/core/mvc/Controller",
  "sap/ui/core/Fragment",
  "sap/ui/model/json/JSONModel",
  "sap/ui/model/Filter",
  "sap/ui/model/FilterOperator",
  "sap/ui/model/Sorter",
  "sap/m/MessageToast",
  "sap/m/MessageBox"
], function (Controller, Fragment, JSONModel, Filter, FilterOperator, Sorter, MessageToast, MessageBox) {
  "use strict";

  return Controller.extend("juniorpod.controller.View1", {
    onInit: function () {
      // keep fragment promise cache and edit index
      this._oFragments = {};
      this._editIndex = null;
    },

    /* -------------------------
       Fragment loader for Crud.fragment.xml
       path: webapp/view/fragments/Crud.fragment.xml
       ------------------------- */
    _getCrudDialog: function () {
      // cache as Promise to avoid multiple loads
      if (!this._oFragments.crud) {
        this._oFragments.crud = Fragment.load({
          id: this.getView().getId(),
          name: "juniorpod.view.Crud", // adjust if your namespace/path differs
          controller: this
        }).then(function (oDialog) {
          this.getView().addDependent(oDialog);
          return oDialog;
        }.bind(this));
      }
      return this._oFragments.crud;
    },

    /* -------------------------
       Open dialog for Add (clear fields)
       Triggered by <Button id="Add" press="onAddNew" />
       ------------------------- */
    onAddNew: function () {
      this._editIndex = null;
      this._getCrudDialog().then(function (oDialog) {
        // set title & begin button text/handler for "Save"
        oDialog.setTitle("Add Journal Entry");
        var oBegin = oDialog.getBeginButton();
        if (oBegin) {
          // detach any existing handlers to avoid duplicates
          try { oBegin.detachPress(this.onUpdateSave, this); } catch (e) {}
          try { oBegin.detachPress(this.onAddSave, this); } catch (e) {}
          oBegin.attachPress(this.onAddSave, this);
          oBegin.setText("Save");
        }
        this._clearAddFields();
        oDialog.open();
      }.bind(this));
    },

    /* -------------------------
       Save new entry (from fragment Save)
       ------------------------- */
    onAddSave: function () {
      var oView = this.getView();
      var oModel = oView.getModel("bhuvan");
      if (!oModel) { MessageToast.show("Model 'bhuvan' not found."); return; }

      var aData = oModel.getProperty("/FilterDataScenarios") || [];

      var newEntry = {
        CompanyCode: this.byId("addCompanyCode").getValue(),
        LedgerGroup: this.byId("addLedgerGroup").getValue(),
        JournalEntryType: this.byId("addJournalEntryType").getValue(),
        JournalEntry: this.byId("addJournalEntry").getValue(),
        DocumentDate: this.byId("addDocumentDate").getValue(),
        Period: this.byId("addPeriod").getValue(),
        FiscalYear: this.byId("addFiscalYear").getValue(),
        PostingDateRangeString: (function () {
          var dr = this.byId("addPostingDate");
          if (!dr) { return ""; }
          var d1 = dr.getDateValue(), d2 = dr.getSecondDateValue();
          if (!d1) { return ""; }
          var fmt = function (d) {
            var dd = ("0" + d.getDate()).slice(-2);
            var mm = ("0" + (d.getMonth() + 1)).slice(-2);
            var yy = d.getFullYear();
            return dd + "." + mm + "." + yy;
          };
          return d1 ? (fmt(d1) + (d2 ? " - " + fmt(d2) : "")) : "";
        }.bind(this))()
      };

      aData.push(newEntry);
      oModel.setProperty("/FilterDataScenarios", aData);

      // close dialog and notify
      this._getCrudDialog().then(function (oDialog) { oDialog.close(); });
      MessageToast.show("Entry added");
    },

    /* -------------------------
       Open dialog for Update (populate selected row)
       Triggered by <Button id="Update" press="onUpdate" />
       ------------------------- */
    onUpdate: function () {
      var oTable = this.byId("cmpTable");
      var oSelected = oTable && oTable.getSelectedItem();
      if (!oSelected) {
        MessageToast.show("Please select a row to edit.");
        return;
      }
      var iIndex = oTable.indexOfItem(oSelected);
      this._editIndex = iIndex;

      var oModel = this.getView().getModel("bhuvan");
      var oEntry = oModel.getProperty("/FilterDataScenarios/" + iIndex) || {};

      this._getCrudDialog().then(function (oDialog) {
        oDialog.setTitle("Update Journal Entry");
        var oBegin = oDialog.getBeginButton();
        if (oBegin) {
          try { oBegin.detachPress(this.onAddSave, this); } catch (e) {}
          try { oBegin.detachPress(this.onUpdateSave, this); } catch (e) {}
          oBegin.attachPress(this.onUpdateSave, this);
          oBegin.setText("Update");
        }

        // populate fields from selected entry
        this.byId("addCompanyCode").setValue(oEntry.CompanyCode || "");
        this.byId("addLedgerGroup").setValue(oEntry.LedgerGroup || "");
        this.byId("addJournalEntryType").setValue(oEntry.JournalEntryType || "");
        this.byId("addJournalEntry").setValue(oEntry.JournalEntry || "");
        this.byId("addDocumentDate").setValue(oEntry.DocumentDate || "");
        this.byId("addPeriod").setValue(oEntry.Period || "");
        this.byId("addFiscalYear").setValue(oEntry.FiscalYear || "");

        // populate DateRangeSelection if PostingDateRangeString exists (format dd.MM.yyyy or dd.MM.yyyy - dd.MM.yyyy)
        var dr = this.byId("addPostingDate");
        if (dr) {
          var s = oEntry.PostingDateRangeString || "";
          if (s.indexOf("-") > -1) {
            var parts = s.split("-").map(function (p) { return p.trim(); });
            try {
              var toDate = function (str) {
                var p = str.split(".");
                return new Date(p[2], parseInt(p[1], 10) - 1, p[0]);
              };
              dr.setDateValue(toDate(parts[0]));
              dr.setSecondDateValue(toDate(parts[1]));
            } catch (e) {
              dr.setDateValue(null); dr.setSecondDateValue(null);
            }
          } else {
            dr.setDateValue(null); dr.setSecondDateValue(null);
          }
        }

        oDialog.open();
      }.bind(this));
    },

    /* -------------------------
       Save Update (update selected record)
       ------------------------- */
    onUpdateSave: function () {
      if (this._editIndex === null || this._editIndex === undefined) {
        MessageToast.show("No item selected for update.");
        return;
      }

      var oModel = this.getView().getModel("bhuvan");
      var aData = oModel.getProperty("/FilterDataScenarios") || [];

      var updated = {
        CompanyCode: this.byId("addCompanyCode").getValue(),
        LedgerGroup: this.byId("addLedgerGroup").getValue(),
        JournalEntryType: this.byId("addJournalEntryType").getValue(),
        JournalEntry: this.byId("addJournalEntry").getValue(),
        DocumentDate: this.byId("addDocumentDate").getValue(),
        Period: this.byId("addPeriod").getValue(),
        FiscalYear: this.byId("addFiscalYear").getValue(),
        PostingDateRangeString: (function () {
          var dr = this.byId("addPostingDate");
          if (!dr) { return ""; }
          var d1 = dr.getDateValue(), d2 = dr.getSecondDateValue();
          if (!d1) { return ""; }
          var fmt = function (d) {
            var dd = ("0" + d.getDate()).slice(-2);
            var mm = ("0" + (d.getMonth() + 1)).slice(-2);
            var yy = d.getFullYear();
            return dd + "." + mm + "." + yy;
          };
          return d1 ? (fmt(d1) + (d2 ? " - " + fmt(d2) : "")) : "";
        }.bind(this))()
      };

      aData[this._editIndex] = updated;
      oModel.setProperty("/FilterDataScenarios", aData);

      // close dialog & reset
      this._getCrudDialog().then(function (oDialog) { oDialog.close(); });
      MessageToast.show("Entry updated");
      this._editIndex = null;
    },

    /* -------------------------
       Delete selected row (with confirmation)
       Triggered by <Button id="Delete" press="onDelete" />
       ------------------------- */
    onDelete: function () {
      var oTable = this.byId("cmpTable");
      var oSelected = oTable && oTable.getSelectedItem();
      if (!oSelected) {
        MessageToast.show("Please select a row to delete.");
        return;
      }
      var iIndex = oTable.indexOfItem(oSelected);

      MessageBox.confirm("Are you sure you want to delete the selected journal entry?", {
        actions: [MessageBox.Action.DELETE, MessageBox.Action.CANCEL],
        emphasizedAction: MessageBox.Action.DELETE,
        onClose: function (sAction) {
          if (sAction === MessageBox.Action.DELETE) {
            var oModel = this.getView().getModel("bhuvan");
            var aData = oModel.getProperty("/FilterDataScenarios") || [];
            aData.splice(iIndex, 1);
            oModel.setProperty("/FilterDataScenarios", aData);
            MessageToast.show("Entry deleted");
          }
        }.bind(this)
      });
    },

    /* -------------------------
       helper - clear fields in fragment
       ------------------------- */
    _clearAddFields: function () {
      try {
        this.byId("addCompanyCode").setValue("");
        this.byId("addLedgerGroup").setValue("");
        this.byId("addJournalEntryType").setValue("");
        this.byId("addJournalEntry").setValue("");
        this.byId("addDocumentDate").setValue("");
        this.byId("addPeriod").setValue("");
        this.byId("addFiscalYear").setValue("");
        var dr = this.byId("addPostingDate");
        if (dr) { dr.setDateValue(null); dr.setSecondDateValue(null); }
      } catch (e) {
        // ignore if fragment not yet instantiated
      }
    },

    /* -------------------------
       Generic close handler (Cancel button in fragment uses .onDialogClose)
       ------------------------- */
    onDialogClose: function (oEvent) {
      var oSource = oEvent && oEvent.getSource && oEvent.getSource();
      if (oSource) {
        var oDialog = oSource.getParent();
        if (oDialog) {
          // detach handlers from begin button to keep state clean
          try { oDialog.getBeginButton().detachPress(this.onAddSave, this); } catch (e) {}
          try { oDialog.getBeginButton().detachPress(this.onUpdateSave, this); } catch (e) {}
          oDialog.close();
          return;
        }
      }
      // fallback close if dialog cached
      if (this._oFragments.crud) {
        this._oFragments.crud.then(function (oDialog) {
          try { oDialog.getBeginButton().detachPress(this.onAddSave, this); } catch (e) {}
          try { oDialog.getBeginButton().detachPress(this.onUpdateSave, this); } catch (e) {}
          oDialog.close();
        }.bind(this));
      }
    },

    /* -------------------------
       Existing handlers you provided
       ------------------------- */
    onEnter: function (oEvent) {
      var aFilter = [];
      var oInput = this.byId("companycoded");
      var sQuery = oInput.getValue();
      if (sQuery) {
        aFilter.push(new Filter('CompanyCode', FilterOperator.Contains, sQuery));
      }
      var oTable = this.byId("cmpTable");
      var oBinding = oTable.getBinding("items");
      if (oBinding) { oBinding.filter(aFilter); }
    },

    onRowPress: function (oEvent) {
      var oItem = oEvent.getSource();
      var oContext = oItem.getBindingContext("bhuvan");
      if (!oContext) { return; }
      var sPath = oContext.getPath();
      var sIndex = sPath.split("/").pop();
      this.getOwnerComponent().getRouter().navTo("View2", { index: sIndex });
      console.log("Row triggered");
    }

  });
});
