function workflowAction_getFinanceClearanceApprov()
{	
	var stLoggerTitle = 'workflowAction_getFinanceClearanceApprover';
		
	nlapiLogExecution('DEBUG', stLoggerTitle, '>>Entry<<');
    
    try
    {    	
    	// Retrieve the ff from the script parameter: Saved Search
		var context = nlapiGetContext();

        var stFinanceClearanceApproverSearch = context.getSetting('SCRIPT', 'custscript_fin_clear_approver_search');
        nlapiLogExecution('DEBUG', stLoggerTitle, 'Script Parameter | Finance Clearance Approver Search = ' + stFinanceClearanceApproverSearch);
    	
    	var arrResults = nlapiSearchRecord('customrecord_approval_matrix', stFinanceClearanceApproverSearch);
    	if (arrResults != null)
    	{
    		var stFinanceClearanceApprover = arrResults[0].getValue('custrecord_employee_name');
    		nlapiLogExecution('DEBUG', stLoggerTitle, 'Finance Clearance Approver = ' + stFinanceClearanceApprover);
    		return stFinanceClearanceApprover;
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

