/**
 * Module Description
 * 
 * Version    Date            Author           Remarks
 * 1.00       10 Apr 2015     anduggal
 *
 */

/**
 * The recordType (internal id) corresponds to the "Applied To" record in your script deployment. 
 * @appliedtorecord recordType
 *   
 * @param {String} type Sublist internal id
 * @param {String} name Field internal id
 * @param {Number} linenum Optional line item number, starts from 1
 * @returns {Boolean} True to continue changing field value, false to abort value change
 */
function clientValidateField(type, name, linenum) {
	var user = nlapiGetUser();
	if (name == 'custbody_mys_journal_type' && nlapiGetFieldValue('custbody_mys_journal_type') == '42' && user !=  '247147' && user != '27347' && user != '12161' && user != '126766') {
		alert('You are not authorized to use this Journal Type. Please select any other Journal Type.');
		return false;
	}
	else {
		return true;
	}
}