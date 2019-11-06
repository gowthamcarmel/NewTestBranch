function workflowAction_getCFOClearanceLimit()
{	
	var stLoggerTitle = 'workflowAction_getCFOClearanceLimit';
		
	nlapiLogExecution('DEBUG', stLoggerTitle, '>>Entry<<');
    
    try
    {    	
    	// Retrieve the ff from the script parameter: Saved Search
		var context = nlapiGetContext();

        var stCFOClearanceLimitSearch = context.getSetting('SCRIPT', 'custscript_cfo_clear_limit_search');
        nlapiLogExecution('DEBUG', stLoggerTitle, 'Script Parameter | CFO Clearance Limit Search = ' + stCFOClearanceLimitSearch);
    	
    	var arrResults = nlapiSearchRecord('customrecord_approval_matrix', stCFOClearanceLimitSearch);
    	if (arrResults != null)
    	{
    		var flCFOClearanceLimit = forceParseFloat(arrResults[0].getValue('custrecord_approval_limit'));
    		nlapiLogExecution('DEBUG', stLoggerTitle, 'CFO Clearance Limit= ' + flCFOClearanceLimit);
    		return flCFOClearanceLimit;
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

/**
 * Converts a string to float
 * @param stValue
 * @returns
 */
function forceParseFloat(stValue)
{
	var flValue = parseFloat(stValue);
    
    if (isNaN(flValue))
    {
        return 0.00;
    }
    
    return flValue;
}