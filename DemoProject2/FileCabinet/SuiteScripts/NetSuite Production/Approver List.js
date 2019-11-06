/**
 * Module Description
 * 
 * Version    Date            Author           Remarks
 * 1.00       01 Apr 2014     anduggal
 *
 */

/**
 * @returns {Void} Any or no return value
 */
function approverList() {
	var context = nlapiGetContext();
	var user = context.getName();
	var approver = nlapiGetFieldValue('custbody_mys_app_list');
	
	if (approver == null | approver == '') {
		approver = '--> ' + user;
	} else {
		approver = (approver + "\n" + '--> ' + user);
	}
	
	nlapiSetFieldValue('custbody_mys_app_list', approver);
}
