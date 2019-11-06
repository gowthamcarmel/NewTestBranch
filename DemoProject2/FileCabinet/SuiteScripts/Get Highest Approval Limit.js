function workflowAction_HighestApprovalBeforeCFO()
{	
	var stLoggerTitle = 'workflowAction_getHighestApprovalBeforeCFO';
		
	//nlapiLogExecution('DEBUG', stLoggerTitle, '>>Entry<<');
    
    try
    {    	
    	var NetAmount = nlapiGetFieldValue('custbody_mys_net_amount_usd');
    	
    	NetAmount = forceParseFloat(NetAmount);
        nlapiLogExecution('DEBUG', stLoggerTitle, 'NetAmount = ' + NetAmount);
        
        var flCFOClearanceLimit;
    	
		var context = nlapiGetContext();
		
		//  getting the cfo limit
        var stCFOClearanceLimitSearch = context.getSetting('SCRIPT', 'custscript_search_cfo_clearance_limit');
        //nlapiLogExecution('DEBUG', stLoggerTitle, 'Script Parameter | CFO Clearance Limit Search = ' + stCFOClearanceLimitSearch);
    	
    	var arrResults = nlapiSearchRecord('customrecord_approval_matrix', stCFOClearanceLimitSearch);
    	if (arrResults != null)
    	{
    		//flCFOClearanceLimit = forceParseFloat(arrResults[0].getValue('custrecord_approval_limit'));
    		flCFOClearanceLimit = arrResults[0].getValue('custrecord_approval_limit');
    		nlapiLogExecution('DEBUG', stLoggerTitle, 'CFO Clearance Limit= ' + flCFOClearanceLimit);
    	}
        
    	var stHighestApprovalBeforeCFOSearch = context.getSetting('SCRIPT', 'custscript_highest_approval_limit_search');
        //nlapiLogExecution('DEBUG', stLoggerTitle, 'Script Parameter | Highest Approval Before CFO Search = ' + stHighestApprovalBeforeCFOSearch);
    	
    	var searchRecord = nlapiSearchRecord('customrecord_approval_matrix', stHighestApprovalBeforeCFOSearch);
    	if (searchRecord != null)
    	{
    		var Check;
    		
    		for(var i=0;i<searchRecord.length;i++)
    		{
    			var ApprovalLimit = forceParseFloat(searchRecord[i].getValue('custrecord_approval_limit'));
        		//nlapiLogExecution('DEBUG', stLoggerTitle, 'ApprovalLimit= ' + ApprovalLimit);
        		
        		if(NetAmount > flCFOClearanceLimit)
        		{
        			//nlapiLogExecution('DEBUG', stLoggerTitle, 'Net Amount more than CFO limit ');
        			if(ApprovalLimit <= flCFOClearanceLimit)
        			{
        				Check = ApprovalLimit;
        			}
        			else
        			{
        				break;
        			}
        		}
        		else
        		{
        			//nlapiLogExecution('DEBUG', stLoggerTitle, 'Net Amount less than CFO limit ');
        			//if(NetAmount <= flCFOClearanceLimit)
        			{
        				if(NetAmount > ApprovalLimit)
        				{
        					// do nothing
        					if(ApprovalLimit <= flCFOClearanceLimit)
        					{
        						Check = ApprovalLimit;
            					//break;
        					}
        				}
        				else
        				{
        					if(ApprovalLimit <= flCFOClearanceLimit)
        					{
        						Check = ApprovalLimit;
            					break;
        					}
        				}
        			}
        		}
    		}
    		
    		nlapiLogExecution('DEBUG', stLoggerTitle, 'Check(Approval Limit)= ' + Check);
    		return Check;
    	}
    	
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