/**
 * Module Description
 * 
 * Version    Date            Author           Remarks
 * 1.00       05 Mar 2014     anduggal
 *
 */

/**
 * @returns {Void} Any or no return value
 */
function workflowAction_getHeadRevBillAssurance() {
	var stLoggerTitle = 'workflowAction_getHeadRevBillAssurance';
	nlapiLogExecution('DEBUG', stLoggerTitle, '>>Entry<<');
    
    try
    {
    	var context = nlapiGetContext();

        var stHeadRevBillAssuranceSearch = context.getSetting('SCRIPT', 'custscript_head_rev_bill_search');
        nlapiLogExecution('DEBUG', stLoggerTitle, 'Script Parameter | Head of Revenue & Billing Assurance Search = ' + stHeadRevBillAssuranceSearch);
    	
    	var arrResults = nlapiSearchRecord('customrecord_mys_head_rev_bill', stHeadRevBillAssuranceSearch);
    	if (arrResults != null)
    	{
    		var stHeadRevBillAssurance = arrResults[0].getValue('custrecord_mys_head_rev_bill');
    		nlapiLogExecution('DEBUG', stLoggerTitle, 'Head of Revenue & Billing Assurance = ' + stHeadRevBillAssurance);
    		return stHeadRevBillAssurance;
    	}
        
        nlapiLogExecution('DEBUG', stLoggerTitle, '>>Exit<<');        
        return null;
    }
    catch (error)
    {
    	if (error.getDetails != undefined)
        {
            nlapiLogExecution('ERROR','Process Error',  error.getCode() + ': ' + error.getDetails());
            throw error;
        }
        else
        {
            nlapiLogExecution('ERROR','Unexpected Error', error.toString()); 
            throw nlapiCreateError('99999', error.toString());
        }    	 
        return null;
    }
}
