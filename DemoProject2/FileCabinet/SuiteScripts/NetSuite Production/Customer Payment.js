/**
 * Module Description
 * 
 * Version    Date            Author           Remarks
 * 1.00       29 Apr 2014     anduggal
 *
 */

/**
 * @returns {Void} Any or no return value
 */
function setDefaultDimentsion() {
	var subsidiary = nlapiGetFieldValue('subsidiary');
	var customer = nlapiGetFieldValue('customer');
	if (customer != null && subsidiary != null) {
		var subRec = nlapiLoadRecord('subsidiary', subsidiary);
		nlapiSetFieldValue('class', subRec.getFieldValue('custrecord_default_product'));
		
		var custText = nlapiGetFieldText('customer');
       nlapiLogExecution('DEBUG','CustomerTest',custText);
		if (custText.indexOf('PR') == -1) {
          nlapiLogExecution('DEBUG','Customer',custText);
			var cusRec = nlapiLoadRecord('customer', customer);
			nlapiSetFieldValue('location', cusRec.getFieldValue('custentity_region'));
          nlapiLogExecution('DEBUG','Customer','test');
		}
		//nlapiSetFieldValue('department', subRec.getFieldValue('custrecord_default_cost_center'));
		
	}
}