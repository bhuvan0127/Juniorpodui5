sap.ui.define([
    "sap/ui/core/mvc/Controller"
], function (Controller) {
    "use strict";
    return Controller.extend("juniorpod.controller.View2", {
        onInit: function () {
            this.getOwnerComponent().getRouter()
                .getRoute("View2")
                .attachPatternMatched(this._onObjectMatched, this);
        },

        _onObjectMatched: function (oEvent) {
            var sIndex = oEvent.getParameter("arguments").index;

            var sPath = "/FilterDataScenarios/" + sIndex;

            this.byId("detailArea").bindElement({
                path: sPath,
                model: "bhuvan"
            });
        },

        onBack: function () {
            this.getOwnerComponent().getRouter().navTo("View1");
        },
        onSidebarSelect: function (oEvent) {
            var oItem = oEvent.getParameter("listItem") || oEvent.getSource().getSelectedItem();
            if (!oItem) {
                return;
            }
            var oContext = oItem.getBindingContext("bhuvan");
            if (!oContext) {
                return;
            }
            var sPath = oContext.getPath();
            this.byId("detailArea").bindElement({
                path: sPath,
                model: "bhuvan"
            });
        }
    });
});