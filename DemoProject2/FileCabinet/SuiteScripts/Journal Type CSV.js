/**
 * Module Description
 * 
 * Version    Date            Author           Remarks
 * 1.00       20 Apr 2015     anduggal
 *
 */

/**
 * The recordType (internal id) corresponds to the "Applied To" record in your script deployment. 
 * @appliedtorecord recordType
 * 
 * @param {String} type Operation types: create, edit, delete, xedit
 *                      approve, reject, cancel (SO, ER, Time Bill, PO & RMA only)
 *                      pack, ship (IF)
 *                      markcomplete (Call, Task)
 *                      reassign (Case)
 *                      editforecast (Opp, Estimate)
 * @returns {Void}
 */
function userEventBeforeSubmit(type){
	var journal = nlapiGetNewRecord();
	var user = nlapiGetUser();
	
	if (journal.getFieldValue('custbody_mys_journal_type') == '42' && user !=  '247147' && user != '27347' && user != '12161' && user != '126766') {
		throw Error('You are not authorized to use "Year End" Journal Type. Please select any other Journal Type.');
		return false;
	}
}
