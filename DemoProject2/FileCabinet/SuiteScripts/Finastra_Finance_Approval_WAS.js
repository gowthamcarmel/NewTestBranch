function workflowAction_get_Finance_Approvers()
{
	var stLoggerTitle = 'workflowAction_get_Finance_Approvers';
	
	nlapiLogExecution('DEBUG', stLoggerTitle, '>>Entry<<');
    try
    {
    	var Approvers = new Array();//'';
    	
    	var CostCentre = nlapiGetFieldValue('department');
    	nlapiLogExecution('DEBUG', stLoggerTitle, 'CostCentre=='+CostCentre);
    	
    	var FunctionGrouping = nlapiLookupField('department',CostCentre,'custrecord_misys_function_grouping');
    	nlapiLogExecution('DEBUG', stLoggerTitle, 'FunctionGrouping=='+FunctionGrouping);
    	
    	var filters = new Array();
    	filters[0] = new nlobjSearchFilter('custrecord_function_grouping',null,'is',FunctionGrouping);
    	filters[1] = new nlobjSearchFilter('isinactive',null,'is','F');

    	var columns = new Array();
    	columns[0] = new nlobjSearchColumn('internalid');
    	columns[1] = new nlobjSearchColumn('custrecord_approvers_list');
    	
    	var searchRecord = nlapiSearchRecord('customrecord_fin_functionapproval_matrix',null,filters,columns);
    	nlapiLogExecution('DEBUG', stLoggerTitle, 'searchRecord=='+searchRecord);
    	
    	if(_logValidation(searchRecord))
    	{
    		for(var i=0;i<searchRecord.length;i++)
    		{
    			var List = searchRecord[i].getValue('custrecord_approvers_list');
    			nlapiLogExecution('DEBUG', stLoggerTitle, 'List=='+List);
    			
    			if(_logValidation(List))
    			{
    				var ApproversList = List.split(',');
        			nlapiLogExecution('DEBUG', stLoggerTitle, 'ApproversList=='+ApproversList);
        			
        			for(var i = 0; i < ApproversList.length; i++)
        			{
        				Approvers.push(ApproversList[i]);
        			}
        			nlapiLogExecution('DEBUG', stLoggerTitle, 'Approvers=='+Approvers);
        			
    				nlapiSetFieldValue('custbody_finance_approvers', Approvers);
    				break;
    			}
    		}
    	}
        nlapiLogExecution('DEBUG', stLoggerTitle, '>>Exit<<');        
        //return Approvers;
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
    if (value != null && value != '' && value != undefined) 
    {
        return true;
    }
    else 
    {
        return false;
    }
}