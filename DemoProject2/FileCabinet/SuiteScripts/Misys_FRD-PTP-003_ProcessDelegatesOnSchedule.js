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

var USAGE_LIMIT_THRESHOLD = 200;

/**
 * A workflow action script that will update the Employee and transaction records with the Delegation details
 * 
 * @author Aurel Shenne Sinsin
 * @version 1.0
 */
 
  //P2P Bundle
function workflowAction_processDelagateOnSchedule()
{	
	var stLoggerTitle = 'workflowAction_processDelagateOnSchedule';
		
	nlapiLogExecution('DEBUG', stLoggerTitle, '>>Entry<<');
    
    try
    {    	
    	var context = nlapiGetContext();
    	
    	var stCurrentDelegatedApSearch = context.getSetting('SCRIPT', 'custscript_curr_delegated_ap');
        nlapiLogExecution('DEBUG', stLoggerTitle, 'Script Parameter | Current Delegated Approver Search = ' + stCurrentDelegatedApSearch);
        
        var stExpiredDelegatedApSearch = context.getSetting('SCRIPT', 'custscript_exp_delegated_ap');
        nlapiLogExecution('DEBUG', stLoggerTitle, 'Script Parameter | Expired Delegated Approver Search = ' + stExpiredDelegatedApSearch);
    	
    	var stPendingAppStandAloneVBSearch = context.getSetting('SCRIPT', 'custscript_pending_app_standalone_vb_sch');
        nlapiLogExecution('DEBUG', stLoggerTitle, 'Script Parameter | Pending Approval Stand Alone Vendor Bill Search = ' + stPendingAppStandAloneVBSearch);
        
        var stPendingAppPOSearch = context.getSetting('SCRIPT', 'custscript_pending_app_po_sch');
        nlapiLogExecution('DEBUG', stLoggerTitle, 'Script Parameter | Pending Approval Purchase Order Search = ' + stPendingAppPOSearch);
        
        // P2P Config Bundle
        var stPendingAppReqSearch = context.getSetting('SCRIPT', 'custscript_pending_app_req_sch');
        nlapiLogExecution('DEBUG', stLoggerTitle, 'Script Parameter | Pending Approval Requisition Search = ' + stPendingAppReqSearch);
        
        var stPendingAppURRSearch = context.getSetting('SCRIPT', 'custscript_pending_app_urr_sch');
        nlapiLogExecution('DEBUG', stLoggerTitle, 'Script Parameter | Pending Approval Requisition Search = ' + stPendingAppURRSearch);
        
        var stPendingAppRASearch = context.getSetting('SCRIPT', 'custscript_pending_app_ra_sch');
        nlapiLogExecution('DEBUG', stLoggerTitle, 'Script Parameter | Pending Approval Requisition Search = ' + stPendingAppRASearch);

        //fipulutan 01072014: added saved search that will pull the creator of the purchase order
        var stGetPORequestorSearch = context.getSetting('SCRIPT', 'custscript_get_po_requestor');
        nlapiLogExecution('DEBUG', stLoggerTitle, 'Script Parameter | Get PO Created By = ' + stGetPORequestorSearch);
		
		//this variable is to control the filtering of the transactions
		var updateExpiredDelegate = 'F'  	
    	
        //fipulutan 01072014: Added stGetPORequestorSearch parameter to processCurrentDelegates and processExpiredDelegates functions
        // Process current delegates by searching on the Delegate Approver custom record where Date From is equal to current date
		processCurrentDelegates(stCurrentDelegatedApSearch, stPendingAppStandAloneVBSearch, stPendingAppPOSearch, stPendingAppReqSearch, updateExpiredDelegate, stGetPORequestorSearch,stPendingAppURRSearch,stPendingAppRASearch);
    	
    	// Process expired delegates by searching on the Delegate Approver custom record where Date To is before current date
		processExpiredDelegates(stExpiredDelegatedApSearch, stPendingAppStandAloneVBSearch, stPendingAppPOSearch, stPendingAppReqSearch, updateExpiredDelegate, stGetPORequestorSearch,stPendingAppURRSearch,stPendingAppRASearch);
        
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
 * Call functions that will update the Employee and Transaction records related to the Delegated Approver that starts today
 * 
 * @param stDelegatedApSearch
 * @param stPendingAppStandAloneVBSearch
 * @param stPendingAppPOSearch
 */
function processCurrentDelegates(stDelegatedApSearch, stPendingAppStandAloneVBSearch, stPendingAppPOSearch, stPendingAppReqSearch, updateExpiredDelegate, stGetPORequestorSearch,stPendingAppURRSearch,stPendingAppRASearch)
{
	var stLoggerTitle = 'workflowAction_processDelagateOnSchedule - processCurrentDelegates';
		
	var arrResults = nlapiSearchRecord('customrecord_delegated_approver', stDelegatedApSearch);

    //fipulutan 01072014: this will pull the value from the Get PO Created By Saved Search 

    

    if (arrResults != null)
    { 
    	nlapiLogExecution('DEBUG', stLoggerTitle, 'Processing Delegated Approvers that will start today...');
    	
    	var context = nlapiGetContext();
    	
    	for (var i = 0; i < arrResults.length; i++)
        {
    		var intRemainingUsage = context.getRemainingUsage();
            nlapiLogExecution('DEBUG', stLoggerTitle, 'Remaining Usage Point = ' + intRemainingUsage);
            
            if (intRemainingUsage < USAGE_LIMIT_THRESHOLD)
            {
                var stSchedStatus = nlapiScheduleScript(context.getScriptId(), null);
                nlapiLogExecution('DEBUG', stLoggerTitle, 'Processing of starting Delegated Approvers will be rescheduled. Scheduled Script Status = ' + stSchedStatus);
                return;
            }	
    		
    		var stUser = arrResults[i].getValue('custrecord_da_user',null,'GROUP');
        	nlapiLogExecution('DEBUG', stLoggerTitle, 'User = ' + stUser);
        	
        	var stDelegatedApprover = arrResults[i].getValue('custentity_delegate_approver','custrecord_da_user','GROUP');
        	nlapiLogExecution('DEBUG', stLoggerTitle, 'Delegated Approver = ' + stDelegatedApprover);

    	    //fipulutan 01072014: Added stDelegatedApproverSupervisor variable to pull the Delegated Approver Supervisor from the record
        	var stDelegatedApproverSupervisor = arrResults[i].getValue('supervisor', 'custrecord_da_user', 'GROUP');
        	nlapiLogExecution('DEBUG', stLoggerTitle, 'Delegated Approver Supervisor = ' + stDelegatedApprover);

        	var stDateFrom = arrResults[i].getValue('custentity_date_from','custrecord_da_user','GROUP');
        	nlapiLogExecution('DEBUG', stLoggerTitle, 'Date From = ' + stDateFrom);
        	
        	var stDateTo = arrResults[i].getValue('custentity_to_date','custrecord_da_user','GROUP');
        	nlapiLogExecution('DEBUG', stLoggerTitle, 'Date To = ' + stDateTo);
    		
        	updateEmployee(stUser, stDelegatedApprover, stDateFrom, stDateTo);

    	    //fipulutan 01072014: Added stGetPORequestorSearch and stDelegatedApproverSupervisor parameter to updateTransactions function
        	updateTransactions(stPendingAppStandAloneVBSearch, stPendingAppPOSearch, stPendingAppReqSearch, stUser, stDelegatedApprover, updateExpiredDelegate, stGetPORequestorSearch, stDelegatedApproverSupervisor);
        }
    }
}


/**
 * Call functions that will update the Employee and Transaction records related to the Delegated Approver that expires today
 * 
 * @param stDelegatedApSearch
 * @param stPendingAppStandAloneVBSearch
 * @param stPendingAppPOSearch
 */
function processExpiredDelegates(stDelegatedApSearch, stPendingAppStandAloneVBSearch, stPendingAppPOSearch, stPendingAppReqSearch, updateExpiredDelegate, stGetPORequestorSearch,stPendingAppURRSearch,stPendingAppRASearch)
{
	var stLoggerTitle = 'workflowAction_processDelagateOnSchedule - processExpiredDelegates';
		
    var arrResults = nlapiSearchRecord('customrecord_delegated_approver', stDelegatedApSearch);
    if (arrResults != null)
    { 
    	nlapiLogExecution('DEBUG', stLoggerTitle, 'Processing Delegated Approvers that will expire today...');
    	
    	var context = nlapiGetContext();
    	
    	for (var i = 0; i < arrResults.length; i++)
        {
    		var intRemainingUsage = context.getRemainingUsage();
            nlapiLogExecution('DEBUG', stLoggerTitle, 'Remaining Usage Point = ' + intRemainingUsage);
            
            if (intRemainingUsage < USAGE_LIMIT_THRESHOLD)
            {
                var stSchedStatus = nlapiScheduleScript(context.getScriptId(), null);
                nlapiLogExecution('DEBUG', stLoggerTitle, 'Processing of expiring Delegated Approvers will be rescheduled. Scheduled Script Status = ' + stSchedStatus);
                return;
            }    		
    		    		    		
    		var stUser = arrResults[i].getValue('custrecord_da_user',null,'GROUP');
        	nlapiLogExecution('DEBUG', stLoggerTitle, 'User = ' + stUser);
        	
        	var stDelegatedApprover = arrResults[i].getValue('custentity_delegate_approver','custrecord_da_user','GROUP');
        	nlapiLogExecution('DEBUG', stLoggerTitle, 'Delegated Approver = ' + stDelegatedApprover);

    	    //fipulutan 01072014: Added stDelegatedApproverSupervisor variable to pull the Delegated Approver Supervisor from the record
        	var stDelegatedApproverSupervisor = arrResults[i].getValue('supervisor', 'custrecord_da_user', 'GROUP');
        	nlapiLogExecution('DEBUG', stLoggerTitle, 'Delegated Approver Suppervisor = ' + stDelegatedApprover);
        	
        	//var stDateFrom = arrResults[i].getValue('custrecord_da_date_from');
        	//nlapiLogExecution('DEBUG', stLoggerTitle, 'Date From = ' + stDateFrom);
        	
        	//var stDateTo = arrResults[i].getValue('custrecord_da_date_to');
        	//nlapiLogExecution('DEBUG', stLoggerTitle, 'Date To = ' + stDateTo);
			
			//set updateExpiredDelegate = 'T' so it filters the records further to only pick up transactions where 
			updateExpiredDelegate = 'T'
    		
			updateEmployee(stUser, '', '', '');

    	    //fipulutan 01072014: Added stGetPORequestorSearch and stDelegatedApproverSupervisor parameter to updateTransactions function
        	updateTransactions(stPendingAppStandAloneVBSearch, stPendingAppPOSearch, stPendingAppReqSearch, stDelegatedApprover, stUser, updateExpiredDelegate, stGetPORequestorSearch, stDelegatedApproverSupervisor,stPendingAppURRSearch,stPendingAppRASearch);
        }
    }
}


/**
 * Update Delegated Approver, Date From, and Date To on the Employee record
 * 
 * @param stUser
 * @param stDelegatedApprover
 * @param stDateFrom
 * @param stDateTo
 */
function updateEmployee(stUser, stDelegatedApprover, stDateFrom, stDateTo)
{
	var stLoggerTitle = 'workflowAction_processDelagateOnSchedule - updateEmployee';
	
	nlapiSubmitField('employee', stUser, ['custentity_delegate_approver', 'custentity_date_from', 'custentity_to_date'], [stDelegatedApprover, stDateFrom, stDateTo]);
	nlapiLogExecution('DEBUG', stLoggerTitle, 'Successfully updated employee record.');
}


/**
 * Update Next Approver on Pending Approval Purchase Orders and Stand Alone Vendor Bills
 * 
 * @param stPendingAppStandAloneVBSearch
 * @param stPendingAppPOSearch
 * @param stUser
 * @param stDelegatedApprover
 */
function updateTransactions(stPendingAppStandAloneVBSearch, stPendingAppPOSearch, stPendingAppReqSearch, stUser, stDelegatedApprover, updateExpiredDelegate, stGetPORequestorSearch, stDelegatedApproverSupervisor,stPendingAppURRSearch,stPendingAppRASearch)
{
	var stLoggerTitle = 'workflowAction_processDelagateOnSchedule - updateTransactions';
	
	// Execute the Saved Search for Stand Alone Vendor Bills where Next Approver is equal to Current Approver 
	if (updateExpiredDelegate=='T')  //only process the correct transactions for expired delegators  
    	var arrFilter = [new nlobjSearchFilter('nextapprover', null, 'anyof', stUser), new nlobjSearchFilter('custbody_original_approver_delegation',null,'anyof',stDelegatedApprover), new nlobjSearchFilter('custbody_is_delegator',null,'is','T')];
	else{
		var arrFilter = [new nlobjSearchFilter('nextapprover', null, 'anyof', stUser)];
	}        
    var arrResults = nlapiSearchRecord('vendorbill', stPendingAppStandAloneVBSearch, arrFilter);
    if (arrResults != null)
    {   
    	for (var i = 0; i < arrResults.length; i++)
        {
    	    var stVB = arrResults[i].getId();

    	    //calls the function checkDelegateApprover to pull the requestor
    	    var requestor = checkDelegateApprover(stVB, stGetPORequestorSearch);
    	    nlapiLogExecution('DEBUG', stLoggerTitle, 'Requestor = ' + requestor);

    	    //This will check if the delegated Approver is the same with the requestor and if true, set the Delegated Approver with the Delegate Approver Supervisor
    	    if (stDelegatedApprover == requestor) {
    	        stDelegatedApprover = stDelegatedApproverSupervisor;
    	        nlapiLogExecution('DEBUG', stLoggerTitle, 'Delegated Approver Supervisor = ' + stDelegatedApproverSupervisor);
    	    }

    		if (updateExpiredDelegate=='T'){
				nlapiSubmitField('vendorbill', stVB, ['nextapprover', 'custbody_is_delegator','custbody_original_approver_delegation'], [stDelegatedApprover, 'F','']); //reset "is delegator" so transactions are not picked up again
			}
			else{
				nlapiSubmitField('vendorbill', stVB, ['nextapprover', 'custbody_is_delegator','custbody_original_approver_delegation'], [stDelegatedApprover, 'T',stUser]);	
			}
			
    		nlapiLogExecution('DEBUG', stLoggerTitle, 'Successfully updated Next Approver. Vendor Bill ID = ' + stVB);
        }
    }
    
    // Execute the Saved Search for Purchase Orders where Next Approver is equal to Current Approver     
    if (updateExpiredDelegate=='T')    
    	var arrFilter = [new nlobjSearchFilter('nextapprover', null, 'anyof', stUser), new nlobjSearchFilter('custbody_original_approver_delegation',null,'anyof',stDelegatedApprover), new nlobjSearchFilter('custbody_is_delegator',null,'is','T')];
	else{
		var arrFilter = [new nlobjSearchFilter('nextapprover', null, 'anyof', stUser)];
	}  
	      
    var arrResults = nlapiSearchRecord('purchaseorder', stPendingAppPOSearch, arrFilter);
    if (arrResults != null)
    {        	
    	for (var i = 0; i < arrResults.length; i++)
    	{
            //do checking if ung nagcreate ng PO same sa delegate approver and if True 
    	    var stPO = arrResults[i].getId();

    	    //calls the function checkDelegateApprover to pull the requestor
    	    var requestor = checkDelegateApprover(stPO, stGetPORequestorSearch);
    	    nlapiLogExecution('DEBUG', stLoggerTitle, 'Requestor = ' + requestor);

            //This will check if the delegated Approver is the same with the requestor and if true, set the Delegated Approver with the Delegate Approver Supervisor
    	    if (stDelegatedApprover == requestor) {
    	        stDelegatedApprover = stDelegatedApproverSupervisor;
    	        nlapiLogExecution('DEBUG', stLoggerTitle, 'Delegated Approver Supervisor = ' + stDelegatedApproverSupervisor);
    	    }

    		if (updateExpiredDelegate == 'T') {
				nlapiSubmitField('purchaseorder', stPO, ['nextapprover', 'custbody_is_delegator','custbody_original_approver_delegation'], [stDelegatedApprover, 'F','']); //reset "is delegator" so transactions are not picked up again
			}
			else{
				nlapiSubmitField('purchaseorder', stPO, ['nextapprover', 'custbody_is_delegator','custbody_original_approver_delegation'], [stDelegatedApprover, 'T',stUser]);	
			}	
			
    		nlapiLogExecution('DEBUG', stLoggerTitle, 'Successfully updated Next Approver to ' + stDelegatedApprover + '. Purchase Order ID = ' + stPO);
        }
    }	
    
    //P2P Bundle
    // Execute the Saved Search for Requisitions where Next Approver is equal to Current Approver     
    if (updateExpiredDelegate=='T')    
    	var arrFilter = [new nlobjSearchFilter('nextapprover', null, 'anyof', stUser), new nlobjSearchFilter('custbody_original_approver_delegation',null,'anyof',stDelegatedApprover), new nlobjSearchFilter('custbody_is_delegator',null,'is','T')];
	else{
		var arrFilter = [new nlobjSearchFilter('nextapprover', null, 'anyof', stUser)];
	}  
	      
    var arrResults = nlapiSearchRecord('purchaserequisition', stPendingAppReqSearch, arrFilter);
    if (arrResults != null)
    {        	
    	for (var i = 0; i < arrResults.length; i++)
    	{
            //do checking if ung nagcreate ng PO same sa delegate approver and if True 
    	    var stReq = arrResults[i].getId();

    	    //calls the function checkDelegateApprover to pull the requestor
    	    var requestor = checkDelegateApprover(stReq, stGetPORequestorSearch);
    	    nlapiLogExecution('DEBUG', stLoggerTitle, 'Requestor = ' + requestor);

            //This will check if the delegated Approver is the same with the requestor and if true, set the Delegated Approver with the Delegate Approver Supervisor
    	    if (stDelegatedApprover == requestor) 
    	    {
    	        stDelegatedApprover = stDelegatedApproverSupervisor;
    	        nlapiLogExecution('DEBUG', stLoggerTitle, 'Delegated Approver Supervisor = ' + stDelegatedApproverSupervisor);
    	    }

    		if (updateExpiredDelegate == 'T') 
    		{
				nlapiSubmitField('purchaserequisition', stReq, ['nextapprover', 'custbody_is_delegator','custbody_original_approver_delegation'], [stDelegatedApprover, 'F','']); //reset "is delegator" so transactions are not picked up again
			}
			else
			{
				nlapiSubmitField('purchaserequisition', stReq, ['nextapprover', 'custbody_is_delegator','custbody_original_approver_delegation'], [stDelegatedApprover, 'T',stUser]);	
			}	
			
    		nlapiLogExecution('DEBUG', stLoggerTitle, 'Successfully updated Next Approver to ' + stDelegatedApprover + '. Requisition ID = ' + stReq);
        }
    }	
    
    
    // Execute the Saved Search for URR where Next Approver is equal to Current Approver     
    if (updateExpiredDelegate=='T')    
    	var arrFilter = [new nlobjSearchFilter('custrecord_next_approver', null, 'anyof', stUser), new nlobjSearchFilter('custrecord_urr_orignal_appro',null,'anyof',stDelegatedApprover)];
	else{
		var arrFilter = [new nlobjSearchFilter('custrecord_next_approver', null, 'anyof', stUser)];
	}  
	      
    var arrResults = nlapiSearchRecord('customrecord_access_request', stPendingAppURRSearch, arrFilter);
    if (arrResults != null)
    {        	
    	for (var i = 0; i < arrResults.length; i++)
    	{
            //do checking if ung nagcreate ng PO same sa delegate approver and if True 
    	    var stReq = arrResults[i].getId();

    	    //calls the function checkDelegateApprover to pull the requestor
    	    var requestor = checkDelegateApprover(stReq, stGetPORequestorSearch);
    	    nlapiLogExecution('DEBUG', stLoggerTitle, 'Requestor = ' + requestor);

            //This will check if the delegated Approver is the same with the requestor and if true, set the Delegated Approver with the Delegate Approver Supervisor
    	    if (stDelegatedApprover == requestor) 
    	    {
    	        stDelegatedApprover = stDelegatedApproverSupervisor;
    	        nlapiLogExecution('DEBUG', stLoggerTitle, 'Delegated Approver Supervisor = ' + stDelegatedApproverSupervisor);
    	    }

    		if (updateExpiredDelegate == 'T') 
    		{
				nlapiSubmitField('customrecord_access_request', stReq, ['custrecord_next_approver','custrecord_urr_orignal_appro'], [stDelegatedApprover,'']); //reset "is delegator" so transactions are not picked up again
			}
			else
			{
				nlapiSubmitField('customrecord_access_request', stReq, ['custrecord_next_approver','custrecord_urr_orignal_appro'], [stDelegatedApprover,stUser]);	
			}	
			
    		nlapiLogExecution('DEBUG', stLoggerTitle, 'Successfully updated Next Approver to ' + stDelegatedApprover + '. URR ID = ' + stReq);
        }
    }
    
    
 // Execute the Saved Search for Return Authorisation where Next Approver is equal to Current Approver     
    if (updateExpiredDelegate=='T')    
    	var arrFilter = [new nlobjSearchFilter('custbody_mys_next_approver', null, 'anyof', stUser), new nlobjSearchFilter('custbody_original_approver_delegation',null,'anyof',stDelegatedApprover), new nlobjSearchFilter('custbody_is_delegator',null,'is','T')];
	else{
		var arrFilter = [new nlobjSearchFilter('custbody_mys_next_approver', null, 'anyof', stUser)];
	}  
	      
    var arrResults = nlapiSearchRecord('returnauthorization', stPendingAppRASearch, arrFilter);
    if (arrResults != null)
    {        	
    	for (var i = 0; i < arrResults.length; i++)
    	{
            //do checking if ung nagcreate ng PO same sa delegate approver and if True 
    	    var stReq = arrResults[i].getId();

    	    //calls the function checkDelegateApprover to pull the requestor
    	    var requestor = checkDelegateApprover(stReq, stGetPORequestorSearch);
    	    nlapiLogExecution('DEBUG', stLoggerTitle, 'Requestor = ' + requestor);

            //This will check if the delegated Approver is the same with the requestor and if true, set the Delegated Approver with the Delegate Approver Supervisor
    	    if (stDelegatedApprover == requestor) 
    	    {
    	        stDelegatedApprover = stDelegatedApproverSupervisor;
    	        nlapiLogExecution('DEBUG', stLoggerTitle, 'Delegated Approver Supervisor = ' + stDelegatedApproverSupervisor);
    	    }

    		if (updateExpiredDelegate == 'T') 
    		{
				nlapiSubmitField('returnauthorization', stReq, ['nextapprover', 'custbody_is_delegator','custbody_original_approver_delegation'], [stDelegatedApprover, 'F','']); //reset "is delegator" so transactions are not picked up again
			}
			else
			{
				nlapiSubmitField('returnauthorization', stReq, ['nextapprover', 'custbody_is_delegator','custbody_original_approver_delegation'], [stDelegatedApprover, 'T',stUser]);	
			}	
			
    		nlapiLogExecution('DEBUG', stLoggerTitle, 'Successfully updated Next Approver to ' + stDelegatedApprover + '. RA ID = ' + stReq);
        }
    }	
}


//fipulutan 01072014 : added function
//Function that will get the requestor of the PO and VB. 
function checkDelegateApprover(transaction, stGetPORequestorSearch) {
    //This saved search will search for the requestor of the purchase order. 
    var arrFilters = new Array();
    arrFilters.push(new nlobjSearchFilter('internalid', '', 'is', transaction));

    var arrRequestorResult = nlapiSearchRecord('transaction', stGetPORequestorSearch, arrFilters);

    if (arrRequestorResult != null) {
        for (var j = 0; j < arrRequestorResult.length; j++) {
            var requestor = arrRequestorResult[j].getValue('name', 'systemnotes');

        }
    }

    return requestor;
}