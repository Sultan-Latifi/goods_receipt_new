/*global history */
sap.ui.define([
	"com/mindsquare/gdmvt/receipt/controller/BaseController",
	"sap/ui/model/json/JSONModel",
	"sap/ui/model/Filter",
	"sap/ui/model/FilterOperator",
	"sap/m/GroupHeaderListItem",
	"sap/ui/Device",
	"com/mindsquare/gdmvt/receipt/model/formatter",
	"sap/m/MessageBox",
	"sap/ushell/ui5service/ShellUIService"
], function (BaseController, JSONModel, Filter, FilterOperator, GroupHeaderListItem, Device, formatter, MessageBox, ShellUIService) {
	"use strict";

	return BaseController.extend("com.mindsquare.gdmvt.receipt.controller.Master", {

		formatter: formatter,

		/* =========================================================== */
		/* lifecycle methods                                           */
		/* =========================================================== */

		/**
		 * Called when the master list controller is instantiated. It sets up the event handling for the master/detail communication and other lifecycle tasks.
		 * @public
		 */
		onInit: function () {

			// Control state model
			var oList = this.byId("list"),
				oViewModel = this._createViewModel(),
				// Put down master list's original value for busy indicator delay,
				// so it can be restored later on. Busy handling on the master list is
				// taken care of by the master list itself.
				iOriginalBusyDelay = oList.getBusyIndicatorDelay();

			this._oList = oList;
			// keeps the filter and search state
			this._oListFilterState = {
				aFilter: [],
				aSearch: []
			};

			this.setModel(oViewModel, "masterView");
			// Make sure, busy indication is showing immediately so there is no
			// break after the busy indication for loading the view's meta data is
			// ended (see promise 'oWhenMetadataIsLoaded' in AppController)
			oList.attachEventOnce("updateFinished", function () {
				// Set initial filters
				//this.onSemanticFilterChange();

				// Restore original busy indicator delay for the list
				oViewModel.setProperty("/delay", iOriginalBusyDelay);
				this.getView().byId("searchField").focus();
			}.bind(this));

			oList.onAfterRendering = function (oEvent) {
				// Variablen auslesen
				var oView = this.getView();
				var oAppStorage = this.getAppStorage();
				var oModelMasterView = oView.getModel("masterView");
				var bInitialisierung = oModelMasterView.getProperty("/AppInitialisierung");
				if (bInitialisierung) {
					// Id der Liste auslesen
					var sListId = oEvent.srcControl.getId();
					oAppStorage.setProperty("/MasterListId", sListId);

					//var oSorter = new sap.ui.model.Sorter("Name1", false);
					//var aFilter = this._fnGetMasterFilter();

					// Binding aktualisieren
					//this.fnBindMasterList(aFilter, [oSorter]);

					// Variable im Model setzen
					oModelMasterView.setProperty("/AppInitialisierung", false);
					// this.getRouter().navTo("DetailInitial");

				}
			}.bind(this);

			this.getView().addEventDelegate({
				onBeforeFirstShow: function () {
					this.getOwnerComponent().oListSelector.setBoundMasterList(oList);
				}.bind(this)
			});

			this.getRouter().getRoute("master").attachPatternMatched(this._onMasterMatched, this);
			this.getRouter().attachBypassed(this.onBypassed, this);

			var oView = this.getView();
			var oSearchField = oView.byId("searchField");
			oSearchField.fireSearch();
		},

		fnGetTemplateMasterView: function () {
			// Template laden
			var oItem = sap.ui.xmlfragment("com.mindsquare.gdmvt.receipt.view.TemplateMasterList", this);

			// Template zuru00fcckgeben
			return oItem;
		},

		fnBindMasterList: function (aFilter, aSorter) {
			// Variablen laden
			var oView = this.getView();
			var oList = oView.byId("list");
			var oTemplate = this.fnGetTemplateMasterView();

			oList.bindItems({
				path: "/OrderheaderSet",
				template: oTemplate,
				sorter: aSorter,
				filters: aFilter,
				groupHeaderFactory: this.createGroupHeader
			});

			/*,
				parameters: {
					operationMode: "Client"
				}*/
		},

		/* =========================================================== */
		/* event handlers                                              */
		/* =========================================================== */

		/**
		 * After list data is available, this handler method updates the
		 * master list counter and hides the pull to refresh control, if
		 * necessary.
		 * @param {sap.ui.base.Event} oEvent the update finished event
		 * @public
		 */
		onUpdateFinished: function (oEvent) {
			// update the master list object counter after new data is loaded
			this._updateListItemCount(oEvent.getParameter("total"));
			// hide pull to refresh if necessary
			this.byId("pullToRefresh").hide();
		},

		/**
		 * Event handler for the master search field. Applies current
		 * filter value and triggers a new search. If the search field's
		 * 'refresh' button has been pressed, no new search is triggered
		 * and the list binding is refresh instead.
		 * @param {sap.ui.base.Event} oEvent the search event
		 * @public
		 */

		onLiveChange: function (oEvent) {
			// Filter und Sortierung auslesen
			var aFilter = this._fnGetMasterFilter();
			var aSorter = this._fnGetMasterSorter();

			// build filter array
			var oView = this.getView();
			var oSearchField = oView.byId("searchField");
			var sQuery = oSearchField.getValue().toUpperCase();
			var sQuerySplitArr = sQuery.split("_");
			// var 
			

			if (sQuery) {
				// Multiple Filters using OR
				var filter = new Filter({
					filters: [
						new Filter("Ebeln", FilterOperator.Contains, sQuery),
						new Filter("Filter", FilterOperator.Contains, sQuery),
						new Filter("FilterItems", FilterOperator.Contains, sQuery)
					],
					and: true
				});

				var aKonkatFilter = aFilter.concat(filter);

				// Binding aktualisieren
				this.fnBindMasterList(aKonkatFilter, aSorter);
			} else {
				// wenn leer
				// Binding aktualisieren
				this.fnBindMasterList(aFilter, aSorter);
			}
		},

		onSearch: function (oEvent) {
			/*	if (oEvent.getParameters().refreshButtonPressed) {
					// Search field's 'refresh' button has been pressed.
					// This is visible if you select any master list item.
					// In this case no new search is triggered, we only
					// refresh the list binding.
					this.onRefresh();
					this.fnSetVisibilityList(true);
					return;
				}*/
			this.onLiveChange(oEvent);
			this.fnSetVisibilityList(true);
			// var sQuery = oEvent.getParameter("query");
			// if (sQuery) {
			// 	this._oListFilterState.aSearch = [new Filter("Name1", FilterOperator.Contains, sQuery)];
			// } else {
			// 	this._oListFilterState.aSearch = [];
			// }
			// this._applyFilterSearch();

		},

		// Sichtbarkeit der Liste setzen
		fnSetVisibilityList: function (bVisibility) {
			this.getView().byId("list").setVisible(bVisibility);
		},

		/**
		 * Event handler for refresh event. Keeps filter, sort
		 * and group settings and refreshes the list binding.
		 * @public
		 */
		onRefresh: function () {
			this._oList.getBinding("items").refresh();
		},

		/**
		 * Event handler for the list selection event
		 * @param {sap.ui.base.Event} oEvent the list selectionChange event
		 * @public
		 */
		onSelectionChange: function (oEvent) {
			// get the list item, either from the listItem parameter or from the event's source itself (will depend on the device-dependent mode).

			this._showDetail(oEvent.getParameter("listItem") || oEvent.getSource());

		},

		/**
		 * Event handler for the bypassed event, which is fired when no routing pattern matched.
		 * If there was an object selected in the master list, that selection is removed.
		 * @public
		 */
		onBypassed: function () {
			this._oList.removeSelections(true);
		},

		/**
		 * Used to create GroupHeaders with non-capitalized caption.
		 * These headers are inserted into the master list to
		 * group the master list's items.
		 * @param {Object} oGroup group whose text is to be displayed
		 * @public
		 * @returns {sap.m.GroupHeaderListItem} group header with non-capitalized caption.
		 */
		createGroupHeader: function (oGroup) {
			return new GroupHeaderListItem({
				title: oGroup.text,
				upperCase: false
			});
		},

		/**
		 * Event handler for navigating back.
		 * We navigate back in the browser historz
		 * @public
		 */
		onNavBack: function () {
			var oHistory = History.getInstance();
			var sPreviousHash = oHistory.getPreviousHash();

			if (sPreviousHash !== undefined && sPreviousHash !== "") {
				window.history.go(-1);
			} else {
				var oRouter = sap.ui.core.UIComponent.getRouterFor(this);
				oRouter.navTo("master", true);
			}
		},

		/**
		 * Event handler for sorting master list.
		 * @public
		 */
		onSemanticSelectChange: function (oEvent, oData) {
			var oView = this.getView();
			var oList = oView.byId("list");
			var oListBinding = oList.getBinding("items");

			// Get selection
			var oSource = oEvent.getSource();
			var sSortkey = oSource.getSelectedKey();

			// Create sort order
			var bSortOrderDescending = false;

			if (sSortkey === "Aedat") {
				bSortOrderDescending = true;
			}

			// Create Sort Variables
			var aSorter = [];

			// Create Sorter
			var oSorter = new sap.ui.model.Sorter(sSortkey, bSortOrderDescending);
			aSorter.push(oSorter);

			// Sort Binding
			oListBinding.sort(aSorter);
		},

		/**
		 * Event handler for filtering master list.
		 * @public
		 */
		onSemanticFilterChange: function (oEvent) {
			// Get Binding
			var oView = this.getView();
			var oList = oView.byId("list");
			var oListBinding = oList.getBinding("items");

			var aFilter = this._fnGetMasterFilter(oEvent);

			// Sort Binding
			oListBinding.filter(aFilter);
		},

		_fnGetMasterFilter: function (oEvent) {
			// Variablen auslesen
			var oView = this.getView();
			var oModelMasterView = oView.getModel("masterView");

			// Wert auslesen
			var sFilterSelectedKey = oModelMasterView.getProperty("/filters/selectedKey");

			// Get selected Data
			/*	if (oEvent !== undefined) {
					var oSelectedItem = oEvent.getParameter("selectedItem");
					var oItemCtx = oSelectedItem.getBindingContext("masterView");
					var oItemData = oItemCtx.getObject();
					sArt = oItemData.art;
				} else {
					sArt = "meine";

					// set property in model
					oModelMasterView.setProperty("/filters/selectedKey", "meine");
				}*/

			// Get User
			// var sUser;

			// try {
			// 	// Get User from Lauchpad-Service
			// 	sUser = sap.ushell.Container.getService("UserInfo").getId();
			// } catch (e) {
			// 	// Launchpad Service not reachable
			// 	var sMsg = this.getResourceBundle().getText("errorMsgLaunchpad");
			// 	MessageBox.error(sMsg);
			// }

			// // Create Filter Variables
			var aFilter = [];

			// if (sFilterSelectedKey === "meine" && sUser !== undefined) {
			// 	// Create Sorter
			// 	var oFilter = new sap.ui.model.Filter({
			// 		path: "CreaAfnamItems",
			// 		operator: FilterOperator.Contains,
			// 		value1: sUser
			// 	});
			// 	aFilter.push(oFilter);
			// }

			// Werk auslesen
			//var aFilterWerks = this._fnGetPlantFilter();

			//aFilter = aFilter.concat(aFilterWerks);

			return aFilter;
		},

		_fnGetMasterSorter: function () {
			// Variablen laden
			var oView = this.getView();
			var oModelMasterView = oView.getModel("masterView");

			// Sortierung und Filter auslesen
			var sSorterSelectedKey = oModelMasterView.getProperty("/sorters/selectedKey");

			// Create sort order
			var bSortOrderDescending = false;

			if (sSorterSelectedKey === "Aedat") {
				bSortOrderDescending = true;
			}

			// Create Sort Variables
			var aSorter = [];

			// Create Sorter
			var oSorter = new sap.ui.model.Sorter(sSorterSelectedKey, bSortOrderDescending);
			aSorter.push(oSorter);

			// Sorter zuru00fcckgeben
			return oSorter;
		},

		onChangeMasterSelection: function (oEvent) {
			// Filter und Sortierung auslesen
			var aFilter = this._fnGetMasterFilter();
			var aSorter = this._fnGetMasterSorter();

			// build filter array
			var oView = this.getView();
			var oSearchField = oView.byId("searchField");
			var sQuery = oSearchField.getValue().toUpperCase();

			if (sQuery) {
				// Multiple Filters using OR
				var filter = new Filter({
					filters: [
						new Filter("Ebeln", FilterOperator.Contains, sQuery),
						new Filter("Filter", FilterOperator.Contains, sQuery),
						new Filter("FilterItems", FilterOperator.Contains, sQuery)
					],
					and: true
				});

				var aKonkatFilter = aFilter.concat(filter);

				// Binding aktualisieren
				this.fnBindMasterList(aKonkatFilter, aSorter);
			} else {
				// wenn leer
				// Binding aktualisieren
				this.fnBindMasterList(aFilter, aSorter);
			}
		},

		/* =========================================================== */
		/* begin: internal methods                                     */
		/* =========================================================== */

		_createViewModel: function () {
			return new JSONModel({
				isFilterBarVisible: false,
				filterBarLabel: "Filter",
				delay: 0,
				title: this.getResourceBundle().getText("masterTitleCount", ["..."]),
				noDataText: this.getResourceBundle().getText("masterListNoDataText"),
				sortBy: "Name1",
				groupBy: "None",
				sorters: {
					selectedKey: "Name1",
					sortTable: [{
						odataField: "Name1",
						description: this.getResourceBundle().getText("name1")
					}, {
						odataField: "Aedat",
						description: this.getResourceBundle().getText("aedat")
					}, {
						odataField: "Ebeln",
						description: this.getResourceBundle().getText("ebeln")
					}]
				},
				filters: {
					selectedKey: "alle",
					filterTable: [{
						odataField: "CreaAfnamItems",
						art: "meine",
						description: this.getResourceBundle().getText("meineBelege")
					}, {
						odataField: "CreaAfnamItems",
						art: "alle",
						description: this.getResourceBundle().getText("alleBelege")
					}]
				},
				ComboboxWerk: {
					selectedKeys: ["0500"]
				},
				AppInitialisierung: true,
				ListId: ""
			});
		},

		/**
		 * If the master route was hit (empty hash) we have to set
		 * the hash to to the first item in the list as soon as the
		 * listLoading is done and the first item in the list is known
		 * @private
		 */
		_onMasterMatched: function () {
			/*this.getOwnerComponent().oListSelector.oWhenListLoadingIsDone.then(
				function (mParams) {
					if (mParams.list.getMode() === "None") {
						return;
					}
					var sObjectId = mParams.firstListitem.getBindingContext().getProperty("Ebeln");
					this.getRouter().navTo("object", {
						objectId: sObjectId
					}, true);
				}.bind(this),
				function (mParams) {
					if (mParams.error) {
						return;
					}
					this.getRouter().getTargets().display("detailNoObjectsAvailable");
				}.bind(this)
			);*/
		},

		/**
		 * Shows the selected item on the detail page
		 * On phones a additional history entry is created
		 * @param {sap.m.ObjectListItem} oItem selected Item
		 * @private
		 */
		_showDetail: function (oItem) {
			var bReplace = !Device.system.phone;
			this.getRouter().navTo("object", {
				objectId: oItem.getBindingContext().getProperty("Ebeln")
			}, bReplace);
		},

		/**
		 * Sets the item count on the master list header
		 * @param {integer} iTotalItems the total number of items in the list
		 * @private
		 */
		_updateListItemCount: function (iTotalItems) {
			var sTitle;
			// only update the counter if the length is final
			if (this._oList.getBinding("items").isLengthFinal()) {
				sTitle = this.getResourceBundle().getText("masterTitleCount", [iTotalItems]);
				this.getModel("masterView").setProperty("/title", sTitle);
			}
		},

		/**
		 * Internal helper method to apply both filter and search state together on the list binding
		 * @private
		 */
		_applyFilterSearch: function () {
			var aFilters = this._oListFilterState.aSearch.concat(this._oListFilterState.aFilter),
				oViewModel = this.getModel("masterView");
			this._oList.getBinding("items").filter(aFilters, "Application");
			// changes the noDataText of the list in case there are no filter results
			if (aFilters.length !== 0) {
				oViewModel.setProperty("/noDataText", this.getResourceBundle().getText("masterListNoDataWithFilterOrSearchText"));
			} else if (this._oListFilterState.aSearch.length > 0) {
				// only reset the no data text to default when no new search was triggered
				oViewModel.setProperty("/noDataText", this.getResourceBundle().getText("masterListNoDataText"));
			}
		},

		/**
		 * Internal helper method to apply both group and sort state together on the list binding
		 * @param {sap.ui.model.Sorter[]} aSorters an array of sorters
		 * @private
		 */
		_applyGroupSort: function (aSorters) {
			this._oList.getBinding("items").sort(aSorters);
		},

		/**
		 * Internal helper method that sets the filter bar visibility property and the label's caption to be shown
		 * @param {string} sFilterBarText the selected filter value
		 * @private
		 */
		_updateFilterBar: function (sFilterBarText) {
			var oViewModel = this.getModel("masterView");
			oViewModel.setProperty("/isFilterBarVisible", (this._oListFilterState.aFilter.length > 0));
			oViewModel.setProperty("/filterBarLabel", this.getResourceBundle().getText("masterFilterBarText", [sFilterBarText]));
		},

		onBtnScanPress: function () {
			jQuery.sap.require("sap.ndc.BarcodeScanner");
			sap.ndc.BarcodeScanner.scan(
				function (oResult) { /* process scan result */
					var oSearchField = this.getView().byId("searchField");
					oSearchField.setValue(oResult.text);
					oSearchField.fireSearch();
				}.bind(this),
				function (oError) { /* handle scan error */ }
			);
		},

		selectFirstEntryOnMasterList: function () {
			var oList = this.getView().byId("list");
			var aItems = oList.getItems();

			if (aItems.length > 0) {
				// Erste Item markieren
				oList.setSelectedItem(aItems[0]);

			} else {
				// Leere Seite zeigen
				this.getRouter().navTo("DetailInitial");
			}
		},

		/**
		 * Werk Filter
		 */
		handleSelectionPlantFinish: function (oEvent) {
			/*	// Selektierte Werte auslesen
				var aSelectedItems = oEvent.getParameter("selectedItems");

				// Get Binding
				var oView = this.getView();
				var oList = oView.byId("list");
				var oListBinding = oList.getBinding("items");

				var aFilter = this._fnGetPlantFilter(aSelectedItems);

				if (aFilter.length !== 0) {
					// Sort Binding
					oListBinding.filter(aFilter);
				}*/

			this.onSemanticFilterChange();

		},

		_fnGetPlantFilter: function () {
			// Variablen laden
			var oView = this.getView();
			var oModelMasterView = oView.getModel("masterView");
			var aSelectedKeys = oModelMasterView.getProperty("/ComboboxWerk/selectedKeys");

			// Create Filter Variables
			var aFilter = [];

			for (var i = 0; i < aSelectedKeys.length; i++) {
				// Create Sorter
				var oFilter = new sap.ui.model.Filter({
					path: "Werks",
					operator: FilterOperator.EQ,
					value1: aSelectedKeys[i]
				});
				aFilter.push(oFilter);

			}

			return aFilter;
		}

	});

});