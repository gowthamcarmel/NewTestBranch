function saveRecord_Duplicate_Validation()
{	
	var stLoggerTitle = 'saveRecord_Duplicate_Validation';
		
	//nlapiLogExecution('DEBUG', stLoggerTitle, '>>Entry<<');
    
    try
    {
    	var ApprovalStatus = nlapiGetFieldValue('custrecord_ir_approval_status');
    	//nlapiLogExecution('DEBUG', stLoggerTitle, 'ApprovalStatus = ' + ApprovalStatus);
    	
    	if(ApprovalStatus != '3')
    	{
    		var ItemName = nlapiGetFieldValue('custrecord_ir_item_name');
        	//nlapiLogExecution('DEBUG', stLoggerTitle, 'ItemName = ' + ItemName);
        	
        	var filters = new Array();
    		filters[0] = new nlobjSearchFilter('itemid',null,'is',ItemName);

    		var columns = new Array();
    		columns[0] = new nlobjSearchColumn('internalid');
    		
    		var searchRecord = nlapiSearchRecord('noninventoryitem',null,filters,columns);
    		//nlapiLogExecution('DEBUG', 'GMS Invoices Scheduled', 'searchRecord ==' + searchRecord);
    		
    		if(_logValidation(searchRecord))
    		{
    			alert('Item with this Name is already present in Netsuite. Please enter a valid Item Name and then Save.')
    			return false;
    		}
    		else
    		{
    			return true;
    		}
    		
            //nlapiLogExecution('DEBUG', stLoggerTitle, '>>Exit<<'); 
    	}
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

function _logValidation(value)
{
 if(value != null && value != '' && value != undefined && value.toString() != 'NaN' && value != NaN)
 {
  return true;
 }
 else
 {
  return false;
 }
}