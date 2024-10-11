/*function initModel() {
	var sUrl = "/sap/opu/odata/sap/ZMDE_GDMVT_RECEIPT_SRV/";
	var oModel = new sap.ui.model.odata.ODataModel(sUrl, true);
	sap.ui.getCore().setModel(oModel);
}*/

function initModel() {
    var sUrl = sap.ui.require.toUrl("/sap/opu/odata/sap/ZMDE_GDMVT_RECEIPT_SRV/");
    var oModel = new sap.ui.model.odata.ODataModel(sUrl, true);
    sap.ui.getCore().setModel(oModel);
}