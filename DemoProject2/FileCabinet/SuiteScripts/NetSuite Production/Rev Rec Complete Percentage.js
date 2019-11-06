/**
 * Module Description
 * 
 * Version    Date            Author           Remarks
 * 1.00       15 May 2014     anduggal
 *
 */

/**
 * The recordType (internal id) corresponds to the "Applied To" record in your script deployment. 
 * @appliedtorecord recordType
 * 
 * @param {String} type Sublist internal id
 * @param {String} name Field internal id
 * @param {Number} linenum Optional line item number, starts from 1
 * @returns {Void}
 */
function percentage_fieldchange(type, name){
	
	if (name == 'percentcomplete') {
        var percentVal = nlapiGetFieldValue('percentcomplete');
        nlapiSetFieldValue('custentity_revreccomplpercent', percentVal);
	}
}
