/**
 * Copyright (c) 1998-2013 NetSuite, Inc.
 * 2955 Campus Drive, Suite 100, San Mateo, CA, USA 94403-2511
 * All Rights Reserved.
 *
 * This software is the confidential and proprietary information of
 * NetSuite, Inc. ("Confidential Information"). You shall not
 * disclose such Confidential Information and shall use it only in
 * accordance with the terms of the license agreement you entered into
 * with NetSuite.
 */


var USAGE_LIMIT_THRESHOLD = 50;
var SCHED_SCRIPT_ID = 'customscript_process_removed_da_sch';

/**
 * This script will be deployed on employee record to updated related transactions when Delegated Approver is removed
 * 
 * @author Aurel Shenne Sinsin
 * @version 1.0
 */
function beforeSubmit_processRemovedDelegatedApp(stType)
{	
	var stLoggerTitle = 'beforeSubmit_processRemovedDelegatedApp';
		
	nlapiLogExecution('DEBUG', stLoggerTitle, '>>Entry<<');
    
    try
    {  
    	var context = nlapiGetContext();
    	
    	var stPendingAppStandAloneVBSearch = context.getSetting('SCRIPT', 'custscript_pending_app_standalone_vb_sc2');
        nlapiLogExecution('DEBUG', stLoggerTitle, 'Script Parameter | Pending Approval Stand Alone Vendor Bill Search = ' + stPendingAppStandAloneVBSearch);
        
        var stPendingAppPOSearch = context.getSetting('SCRIPT', 'custscript_pending_app_po_sc2');
        nlapiLogExecution('DEBUG', stLoggerTitle, 'Script Parameter | Pending Approval Purchase Order Search = ' + stPendingAppPOSearch);   
        
        if (isEmpty(stPendingAppStandAloneVBSearch) || isEmpty(stPendingAppPOSearch))
        {
        	nlapiLogExecution('DEBUG', stLoggerTitle, 'Please enter values on the script parameter. Exit.');        
            return true;
        }    	    	
    	
    	var stEmployee = nlapiGetRecordId();
    	nlapiLogExecution('DEBUG', stLoggerTitle, 'Employee = ' + stEmployee);
    	
    	// Note: nlapiLoadRecord is used because nlapiGetOldRecord() is not working
    	var recOld = nlapiLoadRecord(nlapiGetRecordType(), nlapiGetRecordId());
    	var stOldDelegatedApprover = recOld.getFieldValue('custentity_delegate_approver');
    	    	    	
    	var stNewDelegatedApprover = nlapiGetFieldValue('custentity_delegate_approver');    	
    	nlapiLogExecution('DEBUG', stLoggerTitle, 'Old Delegated Approver = ' + stOldDelegatedApprover + ' | New Delegated Approver = ' + stNewDelegatedApprover);
    	
    	if (!isEmpty(stOldDelegatedApprover) && isEmpty(stNewDelegatedApprover))
    	{
    		updateTransactions(stPendingAppStandAloneVBSearch, stPendingAppPOSearch, stEmployee, stOldDelegatedApprover);
    	}
        
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
 * Update Next Approver on Pending Approval Purchase Orders and Stand Alone Vendor Bills for the Delegated Approver that was removed
 * 
 * @param stPendingAppStandAloneVBSearch
 * @param stPendingAppPOSearch
 * @param stEmployee
 * @param stOldDelegatedApprover
 */
function updateTransactions(stPendingAppStandAloneVBSearch, stPendingAppPOSearch, stEmployee, stOldDelegatedApprover)
{
	var stLoggerTitle = 'updateTransactions';
	
	var context = nlapiGetContext();
	
	// Execute the Saved Search for Stand Alone Vendor Bills where Next Approver is equal to Current Approver     
    var arrFilter = [new nlobjSearchFilter('nextapprover', null, 'anyof', stOldDelegatedApprover)];
    var arrResults = nlapiSearchRecord('vendorbill', stPendingAppStandAloneVBSearch, arrFilter);
    if (arrResults != null)
    {   
    	for (var i = 0; i < arrResults.length; i++)
        {
    		var intRemainingUsage = context.getRemainingUsage ();
            nlapiLogExecution ('DEBUG', stLoggerTitle, 'Remaining Usage Point = ' + intRemainingUsage);
            
            if (intRemainingUsage < USAGE_LIMIT_THRESHOLD)
            {
            	var arrParams = new Array ();
                arrParams['custscript_schr_pending_sa_vb_search'] = stPendingAppStandAloneVBSearch;
                arrParams['custscript_schr_pending_po_search'] = stPendingAppPOSearch;
                arrParams['custscript_schr_employee'] = stEmployee;
                arrParams['custscript_schr_old_da'] = stOldDelegatedApprover;

                var stSchedStatus = nlapiScheduleScript (SCHED_SCRIPT_ID, null, arrParams);
                nlapiLogExecution ('DEBUG', stLoggerTitle, 'Scheduled Script Status = ' + stSchedStatus);
                return;
            }
            
    		var stVB = arrResults[i].getId();
    		nlapiSubmitField('vendorbill', stVB, ['nextapprover', 'custbody_is_delegator'], [stEmployee, 'F']);
    		nlapiLogExecution('DEBUG', stLoggerTitle, 'Successfully updated Next Approver to ' + stEmployee + '. Vendor Bill ID = ' + stVB);
        }
    }
    else
    {
    	 nlapiLogExecution('DEBUG', stLoggerTitle, 'No Pending Approval Stand-Alone Vendor Bills for this Delegated Approver.'); 
    }
    
    // Execute the Saved Search for Purchase Orders where Next Approver is equal to Current Approver     
    var arrFilter = [new nlobjSearchFilter('nextapprover', null, 'anyof', stOldDelegatedApprover)];        
    var arrResults = nlapiSearchRecord('purchaseorder', stPendingAppPOSearch, arrFilter);
    if (arrResults != null)
    {        	
    	for (var i = 0; i < arrResults.length; i++)
        {
    		var intRemainingUsage = context.getRemainingUsage ();
            nlapiLogExecution ('DEBUG', stLoggerTitle, 'Remaining Usage Point = ' + intRemainingUsage);
            
            if (intRemainingUsage < USAGE_LIMIT_THRESHOLD)
            {
            	var arrParams = new Array ();
                arrParams['custscript_schr_pending_sa_vb_search'] = stPendingAppStandAloneVBSearch;
                arrParams['custscript_schr_pending_po_search'] = stPendingAppPOSearch;
                arrParams['custscript_schr_employee'] = stEmployee;
                arrParams['custscript_schr_old_da'] = stOldDelegatedApprover;

                var stSchedStatus = nlapiScheduleScript (SCHED_SCRIPT_ID, null, arrParams);
                nlapiLogExecution ('DEBUG', stLoggerTitle, 'Scheduled Script Status = ' + stSchedStatus);
                return;
            }
    		
    		var stPO = arrResults[i].getId();
    		nlapiSubmitField('purchaseorder', stPO, ['nextapprover', 'custbody_is_delegator'], [stEmployee, 'F']);
    		nlapiLogExecution('DEBUG', stLoggerTitle, 'Successfully updated Next Approver to ' + stEmployee + '. Purchase Order ID = ' + stPO);
        }
    }
    else
    {
    	nlapiLogExecution('DEBUG', stLoggerTitle, 'No Pending Approval Purchase Orders for this Delegated Approver.');
    }
}


/**
 * Schedule script to process removed Delegated Approver
 * @returns {Boolean}
 */
function schedule_processRemovedDelegatedApp()
{
	var stLoggerTitle = 'schedule_processRemovedDelegatedApp';
	
	nlapiLogExecution('DEBUG', stLoggerTitle, '>>Entry<<');
	
	try
    {
		var context = nlapiGetContext();
		
		var stPendingAppStandAloneVBSearch = context.getSetting ('SCRIPT', 'custscript_schr_pending_sa_vb_search');
	    nlapiLogExecution('DEBUG', stLoggerTitle, 'Script Parameter | Pending Approval Stand Alone Vendor Bill Search = ' + stPendingAppStandAloneVBSearch);
	    
	    var stPendingAppPOSearch = context.getSetting('SCRIPT', 'custscript_schr_pending_po_search');
	    nlapiLogExecution('DEBUG', stLoggerTitle, 'Script Parameter | Pending Approval Purchase Order Search = ' + stPendingAppPOSearch);
	    
	    var stEmployee = context.getSetting('SCRIPT', 'custscript_schr_employee');
	    nlapiLogExecution('DEBUG', stLoggerTitle, 'Script Parameter | Employee = ' + stEmployee);
	    
	    var stOldDelegatedApprover = context.getSetting('SCRIPT', 'custscript_schr_old_da');
	    nlapiLogExecution('DEBUG', stLoggerTitle, 'Script Parameter | Old Delegated Approver = ' + stOldDelegatedApprover);
	    
	    updateTransactions(stPendingAppStandAloneVBSearch, stPendingAppPOSearch, stEmployee, stOldDelegatedApprover);
	    
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
 * Check if a string is empty
 * @param stValue (string) value to check
 * @returns {Boolean}
 */
function isEmpty (stValue) {
     if ((stValue == '') || (stValue == null) || (stValue == undefined) || (stValue == 'null')) {
          return true;
     }

     return false;
}