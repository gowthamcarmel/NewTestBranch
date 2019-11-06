/**
 * 
 * @author VPant
 * @version 1.0
 */
function workflowAction_processCurrDelagateOnSave()
{	
	var stLoggerTitle = 'userEvent_UpdateDelagatedApproverURR';
		
	nlapiLogExecution('DEBUG', stLoggerTitle, '>>Entry<<');
    
    try
    {    	
    	var context = nlapiGetContext();
    	
    	var stPendingAppStandAloneVBSearch = context.getSetting('SCRIPT', 'custscript_pending_app_standalone_vb');
        nlapiLogExecution('DEBUG', stLoggerTitle, 'Script Parameter | Pending Approval Stand Alone Vendor Bill Search = ' + stPendingAppStandAloneVBSearch);
        
        var stPendingAppPOSearch = context.getSetting('SCRIPT', 'custscript_pending_app_po');
        nlapiLogExecution('DEBUG', stLoggerTitle, 'Script Parameter | Pending Approval Purchase Order Search = ' + stPendingAppPOSearch);    	
    	    	
    	var stUser = nlapiGetFieldValue('custrecord_da_user');
    	nlapiLogExecution('DEBUG', stLoggerTitle, 'User = ' + stUser);
    	
    	var stDelegatedApprover = nlapiGetFieldValue('custrecord_da_delegated_approver');
    	nlapiLogExecution('DEBUG', stLoggerTitle, 'Delegated Approver = ' + stDelegatedApprover);
    	
    	var stDateFrom = nlapiGetFieldValue('custrecord_da_date_from');
    	nlapiLogExecution('DEBUG', stLoggerTitle, 'Date From = ' + stDateFrom);
    	
    	var stDateTo = nlapiGetFieldValue('custrecord_da_date_to');
    	nlapiLogExecution('DEBUG', stLoggerTitle, 'Date To = ' + stDateTo);
    	
    	updateEmployeeDelegateApprover(stUser, stDelegatedApprover, stDateFrom, stDateTo);    	
    	setDelegatedAppAsNextApp(stPendingAppStandAloneVBSearch, stPendingAppPOSearch, stUser, stDelegatedApprover);
        
        nlapiLogExecution('DEBUG', stLoggerTitle, '>>Exit<<');        
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


/**
 * Update Employee record with Delegated Approver, Date From, and Date To
 * 
 * @param stUser
 * @param stDelegatedApprover
 * @param stDateFrom
 * @param stDateTo
 */
function updateEmployeeDelegateApprover(stUser, stDelegatedApprover, stDateFrom, stDateTo)
{
	var stLoggerTitle = 'workflowAction_processCurrDelagateOnSave - updateEmployeeDelegateApprover';
	
	nlapiSubmitField('employee', stUser, ['custentity_delegate_approver', 'custentity_date_from', 'custentity_to_date'], [stDelegatedApprover, stDateFrom, stDateTo]);
	nlapiLogExecution('DEBUG', stLoggerTitle, 'Successfully updated employee record with Delagated Approver details');
	
}


/**
 * Set the Next Approver on the Pending Approval Purchase Orders and Stand Alone Vendor Bills with the Delegated Approver
 * 
 * @param stPendingAppStandAloneVBSearch
 * @param stPendingAppPOSearch
 * @param stUser
 * @param stDelegatedApprover
 */
function setDelegatedAppAsNextApp(stPendingAppStandAloneVBSearch, stPendingAppPOSearch, stUser, stDelegatedApprover)
{
	var stLoggerTitle = 'workflowAction_processCurrDelagateOnSave - setDelegatedAppAsNextApp';
	
	// Execute the Saved Search for Stand Alone Vendor Bills where Next Approver is equal to Current Approver     
    var arrFilter = [new nlobjSearchFilter('nextapprover', null, 'anyof', stUser)];        
    var arrResults = nlapiSearchRecord('vendorbill', stPendingAppStandAloneVBSearch, arrFilter);
    if (arrResults != null)
    {        	
    	nlapiLogExecution('DEBUG', stLoggerTitle, 'Setting Delegated Approver as Next Approver for Stand Alone Vendor Bills where current Next Approver = ' + stUser);
    	for (var i = 0; i < arrResults.length; i++)
        {
    		var stVB = arrResults[i].getId();
    		nlapiSubmitField('vendorbill', stVB, ['nextapprover', 'custbody_is_delegator','custbody_original_approver_delegation'], [stDelegatedApprover, 'T',stUser]);
    		nlapiLogExecution('DEBUG', stLoggerTitle, 'Successfully updated Next Approver. Vendor Bill ID = ' + stVB);
        }
    }
    
    // Execute the Saved Search for Purchase Orders where Next Approver is equal to Current Approver     
    var arrFilter = [new nlobjSearchFilter('nextapprover', null, 'anyof', stUser)];        
    var arrResults = nlapiSearchRecord('purchaseorder', stPendingAppPOSearch, arrFilter);
    if (arrResults != null)
    {        	
    	nlapiLogExecution('DEBUG', stLoggerTitle, 'Setting Delegated Approver as Next Approver for Purchase Orders where current Next Approver = ' + stUser);
    	for (var i = 0; i < arrResults.length; i++)
        {
    		var stPO = arrResults[i].getId();
    		nlapiSubmitField('purchaseorder', stPO, ['nextapprover', 'custbody_is_delegator','custbody_original_approver_delegation'], [stDelegatedApprover, 'T',stUser]);
    		nlapiLogExecution('DEBUG', stLoggerTitle, 'Successfully updated Next Approver. Purchase Order ID = ' + stPO);
        }
    }	
}