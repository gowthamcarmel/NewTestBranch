/**
 * Module Description
 * 
 * Version    Date            Author           Remarks
 * 1.00       04 Mar 2015     vabhpant
 *
 */

/**
 * @returns {Void} Any or no return value
 */
function Schedule_vendor_creation() {
	
	var context = nlapiGetContext();
	nlapiLogExecution('DEBUG', 'Context: ', context.getEnvironment());
	
	var recId = nlapiGetRecordId();
	
	var params = {
			custscript_ven_req_id: recId
		 	};
	
	var result = nlapiScheduleScript('customscript_create_ven_frm_ven_req_sche', null,params);
	nlapiLogExecution('DEBUG', 'Status: ', result);
	nlapiLogExecution('DEBUG', 'Params ', params['custscript_ven_req_id']);

	return true;
}
