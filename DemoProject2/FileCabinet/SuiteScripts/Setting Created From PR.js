function workflowAction_toSetCreatedFromPR()
{	
	var stLoggerTitle = 'workflowAction_toSetCreatedFromPR';
		
	//nlapiLogExecution('DEBUG', stLoggerTitle, '>>Entry<<');
    
    try
    {    	
    	var InternalID = nlapiGetRecordId();
		nlapiLogExecution('DEBUG', stLoggerTitle, 'InternalID = ' + InternalID);
    	
    	nlapiSetFieldValue('custbody_created_from_pr', InternalID);
    	
        //nlapiLogExecution('DEBUG', stLoggerTitle, '>>Exit<<');        
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