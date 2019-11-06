function workflowAction_getCFOClearanceApprov()
{	
	var stLoggerTitle = 'workflowAction_getCFOClearanceApprover';
		
	nlapiLogExecution('DEBUG', stLoggerTitle, '>>Entry<<');
    
    try
    {    	
    	// Retrieve the ff from the script parameter: Saved Search
		var context = nlapiGetContext();

        var stCFOClearanceApproverSearch = context.getSetting('SCRIPT', 'custscript_cfo_clear_approver_search');
        nlapiLogExecution('DEBUG', stLoggerTitle, 'Script Parameter | CFO Clearance Approver Search = ' + stCFOClearanceApproverSearch);
    	
    	var arrResults = nlapiSearchRecord('customrecord_approval_matrix', stCFOClearanceApproverSearch);
    	if (arrResults != null)
    	{
    		var stCFOClearanceApprover = arrResults[0].getValue('custrecord_employee_name');
    		nlapiLogExecution('DEBUG', stLoggerTitle, 'CFO Clearance Approver = ' + stCFOClearanceApprover);
    		return stCFOClearanceApprover;
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

