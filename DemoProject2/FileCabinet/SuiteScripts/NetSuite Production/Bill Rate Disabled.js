/**
 * Module Description
 * 
 * Version    Date            Author           Remarks
 * 1.00       08 May 2014     anduggal
 *
 */

/**
 * The recordType (internal id) corresponds to the "Applied To" record in your script deployment. 
 * @appliedtorecord recordType
 *   
 * @param {String} type Sublist internal id
 * @returns {Void}
 */
function clientLineInit(type) {
	var userRole = nlapiGetRole();
	if (userRole != '3' && userRole != '1021' && userRole != '1045') {
		nlapiDisableLineItemField('item', 'rate', 'T');
	}
}
