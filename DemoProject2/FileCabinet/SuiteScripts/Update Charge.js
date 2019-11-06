/**
 * Module Description
 * 
 * Version    Date            Author           Remarks
 * 1.00       12 Mar 2015     anduggal
 *
 */

/**
 * @param {String} type Context Types: scheduled, ondemand, userinterface, aborted, skipped
 * @returns {Void}
 */
function updateCharge(type) {
	var context = nlapiGetContext();
	var savedSearch = context.getSetting('SCRIPT', 'custscript_charge_to_process');
	
	var arrResults = nlapiSearchRecord('customrecord_mys_temp_charges', savedSearch);
	if (arrResults) {
		for ( var i in arrResults) {
			var chargeId = arrResults[i].getValue('custrecord_mys_internal_id');
			var chargeRec = nlapiLoadRecord('charge', chargeId);
			chargeRec.setFieldText('stage', 'Ready');
			nlapiSubmitRecord(chargeRec);
		}
	}
}