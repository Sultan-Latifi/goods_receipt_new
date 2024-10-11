/*global history */
sap.ui.define([
	"sap/ui/core/mvc/Controller",
	"sap/ui/core/routing/History"
], function (Controller, History) {
	"use strict";
 
	return Controller.extend("com.mindsquare.gdmvt.receipt.controller.BaseController", {
		/**
		 * Convenience method for accessing the router in every controller of the application.
		 * @public
		 * @returns {sap.ui.core.routing.Router} the router for this component
		 */
		getRouter: function () {
			return this.getOwnerComponent().getRouter();
		},

		/**
		 * Convenience method for getting the view model by name in every controller of the application.
		 * @public
		 * @param {string} sName the model name
		 * @returns {sap.ui.model.Model} the model instance
		 */
		getModel: function (sName) {
			return this.getView().getModel(sName);
		},

		getAppStorage: function () {
			return this.getView().getModel("AppStorage");
		},
		/**
		 * Convenience method for setting the view model in every controller of the application.
		 * @public
		 * @param {sap.ui.model.Model} oModel the model instance
		 * @param {string} sName the model name
		 * @returns {sap.ui.mvc.View} the view instance
		 */
		setModel: function (oModel, sName) {
			return this.getView().setModel(oModel, sName);
		},

		/**
		 * Convenience method for getting the resource bundle.
		 * @public
		 * @returns {sap.ui.model.resource.ResourceModel} the resourceModel of the component
		 */
		getResourceBundle: function () {
			return this.getOwnerComponent().getModel("i18n").getResourceBundle();
		},

		/**
		 * Event handler for navigating back.
		 * It there is a history entry we go one step back in the browser history
		 * If not, it will replace the current entry of the browser history with the master route.
		 * @public
		 */
		onNavBack: function () {
			var sPreviousHash = History.getInstance().getPreviousHash();

			if (sPreviousHash !== undefined) {
				history.go(-1);
			} else {
				this.getRouter().navTo("master", {}, true);
			}
		},

		showSuccessMessage: function (response, iDuration) {
			var duration;
			if (iDuration === undefined) {
				duration = 3000;
			} else {
				duration = iDuration;
			}
			// response header
			var hdrMessage = response.headers["sap-message"];
			var hdrMessageObject = JSON.parse(hdrMessage);
			sap.m.MessageToast.show(hdrMessageObject.message, {
				duration: duration, // default 3000
				width: "15em", // default
				my: "center bottom", // default
				at: "center bottom", // default
				of: window, // default
				offset: "0 -100", // default 0 0
				collision: "fit fit", // default
				onClose: null, // default
				autoClose: true, // default
				animationTimingFunction: "ease", // default
				animationDuration: 1000, // default
				closeOnBrowserNavigation: true // default
			});
		},

		showMessageErrorDialog: function (message) {
			var dialog = new sap.m.Dialog({
				title: "Error",
				type: "Message",
				state: "Error",
				content: new sap.m.Text({
					text: message
				}),
				beginButton: new sap.m.Button({
					text: "OK",
					press: function () {
						dialog.close();
					}
				}),
				afterClose: function () {
					dialog.destroy();
				}
			});
			dialog.open();
		},

		handleDate: function (property, sInput) {
			if (sInput === undefined) {
				return "";
			}
			switch (property) {
			case "month":
				if (sInput.length === 1) {
					sInput = "0" + sInput;
				}
				break;
			case "year":
				if (sInput.length === 2) {
					sInput = "20" + sInput;
				}
				break;
			default:
				return sInput;
			}
			return sInput;
		},

		getErrorDetailMessages: function (oError) {
			var aMessages;

			try {
				if (oError.responseText.startsWith("<")) {
					aMessages = [{ message: oError.responseText }];
				} else {
					var oResponseText = JSON.parse(oError.responseText);

					aMessages = oResponseText.error.innererror.errordetails;

					for (var i = 0; i < aMessages.length; i++) {
						if (aMessages[i].code === "/IWBEP/CX_MGW_BUSI_EXCEPTION") {
							aMessages.splice(i, 1);
							break;
						}

					}
				}
			} catch (e) {
				aMessages = [];
			}

			return aMessages;
		}

	});

});