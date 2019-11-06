/**
 * Module Description
 * 
 * Version    Date            Author           Remarks
 * 1.00       18 Mar 2014     anduggal
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
function clientFieldChanged(type, name, linenum){
	if (name == 'exchangerate') {
		var exchRate = parseFloat(nlapiGetFieldValue(name));
		var origRate = parseFloat(nlapiGetFieldValue('custbody_mys_original_exch_rate'));
		var tolerance = parseFloat(nlapiGetContext().getPreference('custscript_tolerance'));
		var allowed = parseFloat(origRate * (tolerance / 100));
		var pAmount = parseFloat(origRate + allowed);
		var nAmount = parseFloat(origRate - allowed);
		
		if (exchRate > pAmount | exchRate < nAmount)
		{
			alert('The modified exchange rate is outside the defined tolerance level.');
			nlapiSetFieldValue('custbody_exch_rate_modified', 'T');
		}
		else
		{
			nlapiSetFieldValue('custbody_exch_rate_modified', 'F');
		}
		
		var variance = parseFloat(exchRate - origRate);
		nlapiSetFieldValue('custbody_mys_exch_rate_var', variance);
		nlapiSetFieldValue('custbody_mys_var_allowed', allowed);
	}
}