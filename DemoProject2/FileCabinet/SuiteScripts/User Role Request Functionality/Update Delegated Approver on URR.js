/**
 * Set the Next Approver on the Pending Approval User Role Request with the Delegated Approver
 * 
 * @param stPendingAppURR
 */

/**
 * 
 * @author VPant
 * @version 1.0
 */

 // P2P - config Bundle - Changes in the script based on Advanced Procurement Module 
 
//-------------------------- newly added --------------------------P2P - config Bundle 
function beforeLoad_Remove_Delegation(type, form)
{   
    try
    {
    	if(type == 'view')
    	{
    		var stLoggerTitle = 'userEvent_UpdateDelagatedApproverURR';
    		
    		form.setScript('customscript_urr_remove_delegation_cli');
    		
    		var RemovalCheck = nlapiGetFieldValue('custrecord_remove_delegation_check');
    		nlapiLogExecution('DEBUG', stLoggerTitle, 'RemovalCheck = ' + RemovalCheck);
    		
    		if(RemovalCheck == 'F')
    		{
    			var TodayDate = nlapiStringToDate(nlapiDateToString(new Date()));
        		nlapiLogExecution('DEBUG', stLoggerTitle, 'TodayDate = ' + TodayDate);
        		
        		var Date1 = nlapiGetFieldValue('custrecord_da_date_from');
        		nlapiLogExecution('DEBUG', stLoggerTitle, 'Date1 = ' + Date1);
        		
        		var DateFrom = nlapiStringToDate(Date1);
        		nlapiLogExecution('DEBUG', stLoggerTitle, 'DateFrom = ' + DateFrom);
        		
        		var Date2 = nlapiGetFieldValue('custrecord_da_date_to');
        		nlapiLogExecution('DEBUG', stLoggerTitle, 'Date2 = ' + Date2);
        		
        		var DateTo = nlapiStringToDate(Date2);
        		nlapiLogExecution('DEBUG', stLoggerTitle, 'DateTo = ' + DateTo);
        		
        		if(TodayDate >= DateFrom && TodayDate <= DateTo)
        		{
        			nlapiLogExecution('DEBUG', stLoggerTitle, 'Inside add button');
        			form.addButton('custpage_remove_delegation', 'Remove Delegation', 'removeDelegation()');
        		}
    		}
    		
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

function afterSubmit_Remove_Delegation(type)
{
	
	try
    {
		var stLoggerTitle = 'userEvent_UpdateDelagatedApproverURR';
		
		var DelegatedApproverRecId = nlapiGetRecordId();
		
		var recType = nlapiGetRecordType();
		
		var date1 = new Date();
		//nlapiLogExecution('DEBUG', stLoggerTitle, 'date1 = ' + date1);
		
		var date2 = nlapiAddDays(date1, -1);
		//nlapiLogExecution('DEBUG', stLoggerTitle, 'date2 = ' + date2);
		
		var YesterdayDate = nlapiDateToString(date2);
		//nlapiLogExecution('DEBUG', stLoggerTitle, 'YesterdayDate = ' + YesterdayDate);
		
		var DelegatedApprover = nlapiLoadRecord(recType, DelegatedApproverRecId);
		
		var Check = DelegatedApprover.getFieldValue('custrecord_remove_delegation_check');
		//nlapiLogExecution('DEBUG', stLoggerTitle, 'Check = ' + Check);
		
		if(Check == 'T')
		{
			var Employee = DelegatedApprover.getFieldValue('custrecord_da_user');
			//nlapiLogExecution('DEBUG', stLoggerTitle, 'Employee = ' + Employee);
			
			nlapiSubmitField('employee', Employee, ['custentity_to_date'], [YesterdayDate]);
			
			DelegatedApprover.setFieldValue('custrecord_da_date_to', YesterdayDate);
			
			DelegatedApprover.setFieldValue('custrecord_remove_delegation_check', 'F');
			
			var status = nlapiScheduleScript('customscript_process_delegated_approvers','customdeploy2',null);
			//nlapiLogExecution('DEBUG', stLoggerTitle, 'status = ' + status);
			
		}
		
		var ID = nlapiSubmitRecord(DelegatedApprover, false, false);
		//nlapiLogExecution('DEBUG', stLoggerTitle, 'ID = ' + ID);
    	
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
// ---------------- end of newly added ------------------------------- P2P - config Bundle 

function setDelegatedAppAsNextApp(stPendingAppURR)
{
	
	var stLoggerTitle = 'userEvent_UpdateDelagatedApproverURR';
	
	nlapiLogExecution('DEBUG', stLoggerTitle, '>>Entry<<');
    
    try
    {    	
    	var context = nlapiGetContext();
    	
    	var stPendingAppURR = context.getSetting('SCRIPT', 'custscript_pending_app_urr');
        nlapiLogExecution('DEBUG', stLoggerTitle, 'Script Parameter | Pending Approval User Role Request Search = ' + stPendingAppURR);
        
  	   	var stUser = nlapiGetFieldValue('custrecord_da_user');
    	nlapiLogExecution('DEBUG', stLoggerTitle, 'User = ' + stUser);
    	
    	var stDelegatedApprover = nlapiGetFieldValue('custrecord_da_delegated_approver');
    	nlapiLogExecution('DEBUG', stLoggerTitle, 'Delegated Approver = ' + stDelegatedApprover);
    	
    	var stDateFrom = nlapiGetFieldValue('custrecord_da_date_from');
    	nlapiLogExecution('DEBUG', stLoggerTitle, 'Date From = ' + stDateFrom);
    	
    	var stDateTo = nlapiGetFieldValue('custrecord_da_date_to');
    	nlapiLogExecution('DEBUG', stLoggerTitle, 'Date To = ' + stDateTo);
    	
    	var stCurrentDate = nlapiGetFieldValue('custrecord_da_currentdate');
    	nlapiLogExecution('DEBUG', stLoggerTitle, 'Current = ' + stCurrentDate);
	
		// Execute the Saved Search for User Role Requests where Next Approver is equal to Current Approver     
	    var arrFilter = [new nlobjSearchFilter('custrecord_next_approver', null, 'anyof', stUser)];        
	    var arrResults = nlapiSearchRecord('customrecord_access_request', stPendingAppURR, arrFilter);
	    if (arrResults != null && stDateFrom <= stCurrentDate && stDateTo >= stCurrentDate)
	    if (arrResults != null)
	    {        	
	    	nlapiLogExecution('DEBUG', stLoggerTitle, 'Setting Delegated Approver as Next Approver for Uesr Role Requests where current Next Approver = ' + stUser);
	    	for (var i = 0; i < arrResults.length; i++)
	        {
	    		var stURR = arrResults[i].getId();
	    		nlapiSubmitField('customrecord_access_request', stURR, ['custrecord_next_approver','custrecord_urr_orignal_appro'], [stDelegatedApprover,stUser]);
	    		nlapiLogExecution('DEBUG', stLoggerTitle, 'Successfully updated Next Approver. User Role Request ID = ' + stURR);
	        }
	    }
	    return true;
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
        return false;
    }
}