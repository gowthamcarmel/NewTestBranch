/**
 * Module Description
 * 
 * Version    Date            Author           Remarks
 * 1.00       01 Apr 2015     anduggal
 *
 ****************************************
 *
 * The recordType (internal id) corresponds to the "Applied To" record in your script deployment. 
 * @appliedtorecord recordType
 *   
 * @param {String} type Sublist internal id
 * @returns {Void}
 *
 ****************************************
 *
 *	8412    EGO Change parent base currency to Euro 
 *
 */
function clientLineInit(type) {
	var userRole = nlapiGetRole();
	//if (userRole != '3') { // 8412
	if (userRole != '3' && userRole != '18') { // 8412
		var poStatus = nlapiGetFieldValue('approvalstatus');
		if (poStatus == '2' && type == 'item') {
			var count = nlapiGetLineItemCount(type);
			var select = nlapiGetCurrentLineItemIndex(type);
			
			if (select <= count) {
				nlapiDisableLineItemField(type, 'custcol_select_item', true);
				nlapiDisableLineItemField(type, 'custcol_misyscategory', true);
				nlapiDisableLineItemField(type, 'custcol_misyssubcategory1', true);
				nlapiDisableLineItemField(type, 'custcol_misyssubcategory2', true);
			}
			else {
				nlapiDisableLineItemField(type, 'custcol_select_item', false);
				nlapiDisableLineItemField(type, 'custcol_misyscategory', false);
				nlapiDisableLineItemField(type, 'custcol_misyssubcategory1', false);
				nlapiDisableLineItemField(type, 'custcol_misyssubcategory2', false);
			}
		}
		else if (poStatus != '2' && type == 'item') {
			var received = nlapiGetCurrentLineItemValue('item', 'quantityreceived');
			
			if (received > 0) {
				nlapiDisableLineItemField(type, 'custcol_select_item', true);
				nlapiDisableLineItemField(type, 'custcol_misyscategory', true);
				nlapiDisableLineItemField(type, 'custcol_misyssubcategory1', true);
				nlapiDisableLineItemField(type, 'custcol_misyssubcategory2', true);
			}
			else {
				nlapiDisableLineItemField(type, 'custcol_select_item', false);
				nlapiDisableLineItemField(type, 'custcol_misyscategory', false);
				nlapiDisableLineItemField(type, 'custcol_misyssubcategory1', false);
				nlapiDisableLineItemField(type, 'custcol_misyssubcategory2', false);
			}
		}
	}
}