/**
 * Copyright (c) 1998-2014 NetSuite, Inc.
 * 2955 Campus Drive, Suite 100, San Mateo, CA, USA 94403-2511
 * All Rights Reserved.
 *
 * This software is the confidential and proprietary information of
 * NetSuite, Inc. ("Confidential Information"). You shall not
 * disclose such Confidential Information and shall use it only in
 * accordance with the terms of the license agreement you entered into
 * with NetSuite.
 */

var LOGGER_TITLE = 'AR Balances Routine';

var ICBQ_STATUS_NOTSTARTED = 'Not Started';
var ICBQ_STATUS_ONGOING = 'Ongoing';
var ICBQ_STATUS_COMPLETED = 'Completed';
var ICBQ_STATUS_FAILED = 'Error';
var ICBQ_FRD_NO = '0010 - AR Balances Routine';

var SCHED_SCRIPT_ID = 'customscript_ar_balance_routine_sched';
var SCHED_SCRIPT_DEPLOYMENT_ID = 'customdeploy_ar_balance_routine_sched';
var MAX_QUEUE = 5;

var IC_BATCH_QUEUE = '';

var USAGE_LIMIT_THRESHOLD = 200;

var ERROR_MESSAGE = '';

/**
 * Main suitelet for AR Balances Routine
 * @author Aurel Shenne Sinsin
 * @version 1.0
 */
function suitelet_arBalancesRoutine()
{ 
    try
    {  
    	nlapiLogExecution('DEBUG', LOGGER_TITLE, '>>Entry<<');
    	
    	var stStage = request.getParameter('custpage_stage');
		nlapiLogExecution('DEBUG', LOGGER_TITLE, 'Stage = ' + stStage);
		
    	var form = nlapiCreateForm('AR Balances Routine');
    	
    	switch(stStage)
        {
        	case 'parametersSubmitted':
        		form = displayConfirmMessage(request,response, form);
        		break;
        	case 'messageConfirmed':
        		form = callARBalancesRoutine(request,response, form);
        		break;
        	default:
        		form = displayParameters(request,response, form);    	 
        }
    	
    	nlapiLogExecution('DEBUG', LOGGER_TITLE, '>>Entry<<');
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
 * Display the parameters to be used when running the routine
 * @param request
 * @param response
 * @param form
 * @param stVB
 */
function displayParameters(request, response, form)
{
var context = nlapiGetContext();
	
	// Retrieve the script parameters from the scheduled script deployment
    var stCustomerTransSummarySearch = context.getSetting('SCRIPT', 'custscript_slarr_cstmr_trans_sum_search');
    var stCustomerTransDetailSearch = context.getSetting('SCRIPT', 'custscript_slarr_cstmr_trans_det_search');
    var stAcctsReceivableSearch = context.getSetting('SCRIPT', 'custscript_slarr_accts_receivable_search');
    var stEmailAlert = context.getSetting('SCRIPT', 'custscript_slarr_email_alert');
    var bSendEmail = context.getSetting('SCRIPT', 'custscript_slarr_send_email');
    nlapiLogExecution('DEBUG', LOGGER_TITLE, 'Script Parameters: Customer Transactions Summary Search = ' + stCustomerTransSummarySearch
    		+ ' | Customer Transactions Detail Search = ' + stCustomerTransDetailSearch
    		+ ' | Accounts Receivables Search = ' + stAcctsReceivableSearch
    		+ ' | Email Alert = ' + stEmailAlert
    		+ ' | Send Email = ' + bSendEmail);
    if (isEmpty(stCustomerTransSummarySearch) || isEmpty(stCustomerTransDetailSearch) || isEmpty(stEmailAlert))
    {	
    	throw nlapiCreateError('99999', 'Please enter values on the script parameter');
    }
	
	form = nlapiCreateForm('AR Balances Routine');
	
	var fldStage = form.addField('custpage_stage', 'text', 'Stage');
	fldStage.setDefaultValue('parametersSubmitted');
	fldStage.setDisplayType('hidden');
	
	// Add hidden fields to the form to set the values of the script parameter
	form.addField('custpage_trans_sum_search', 'text', 'Transaction Summary Search').setDisplayType('hidden').setDefaultValue(stCustomerTransSummarySearch);
	form.addField('custpage_trans_det_search', 'text', 'Transaction Detail Search').setDisplayType('hidden').setDefaultValue(stCustomerTransDetailSearch);
	form.addField('custpage_email_alert', 'text', 'Email Alert').setDisplayType('hidden').setDefaultValue(stEmailAlert);
	form.addField('custpage_send_email', 'text', 'Send Email').setDisplayType('hidden').setDefaultValue(bSendEmail);
	
	// Create the parameter fields
	form.addField('custpage_source_tran_period', 'select', 'Source Transaction Period', '-105').setMandatory(true);
	form.addField('custpage_netting_date', 'date', 'Netting Date').setMandatory(true).setDefaultValue(nlapiDateToString(new Date()));
		
	// Show only Accounts Receivable accounts in the dropdown
	var fldAccounts = form.addField('custpage_acct_receivable_acct', 'select', 'Accounts Receivable Account').setMandatory(true);
	var arrAcctsReceivables = nlapiSearchRecord('account', stAcctsReceivableSearch);    
	if (arrAcctsReceivables != null)
	{
		for (var i = 0; i < arrAcctsReceivables.length; i++)
		{
			fldAccounts.addSelectOption(arrAcctsReceivables[i].getId(), arrAcctsReceivables[i].getValue('name'));
		}		
	}
	
	// Create the following buttons: Save, Cancel
	form.addSubmitButton('Save');
	form.addButton('custpage_cancel_button', 'Cancel', 'window.location=\'/app/center/card.nl?sc=-29\'');
	
	response.writePage(form);
}


/**
 * Display the confirm message to ensure that the user performed the intercompany reconciliation
 * @param request
 * @param response
 * @param form
 */
function displayConfirmMessage(request, response, form)
{
	form = nlapiCreateForm('AR Balances Routine');
	
	var fldStage = form.addField('custpage_stage', 'text', 'Stage');
	fldStage.setDefaultValue('messageConfirmed');
	fldStage.setDisplayType('hidden');
	
	// Add hidden fields to the form to set the values of the script parameter which was set on the form
	form.addField('custpage_trans_sum_search', 'text', 'Transaction Summary Search').setDisplayType('hidden').setDefaultValue(request.getParameter('custpage_trans_sum_search'));
	form.addField('custpage_trans_det_search', 'text', 'Transaction Detail Search').setDisplayType('hidden').setDefaultValue(request.getParameter('custpage_trans_det_search'));
	form.addField('custpage_email_alert', 'text', 'Email Alert').setDisplayType('hidden').setDefaultValue(request.getParameter('custpage_email_alert'));
	form.addField('custpage_send_email', 'text', 'Send Email').setDisplayType('hidden').setDefaultValue(request.getParameter('custpage_send_email'));
	
	// Add hidden fields to the form to set the values entered by the user on the suitelet form
	form.addField('custpage_source_tran_period', 'select', 'Source Transaction Period', '-105').setDisplayType('hidden').setDefaultValue(request.getParameter('custpage_source_tran_period'));
	form.addField('custpage_netting_date', 'date', 'Netting Date').setDisplayType('hidden').setDefaultValue(request.getParameter('custpage_netting_date'));	
	form.addField('custpage_acct_receivable_acct', 'select', 'Accounts Receivable Account', '-112').setDisplayType('hidden').setDefaultValue(request.getParameter('custpage_acct_receivable_acct'));
	
	// Create the following fields: From Date, To Date, Payment Method
	var fldMsg = form.addField('custpage_confirm_message', 'text');	
	fldMsg.setDefaultValue('Did you perform the intercompany reconciliation?');
	fldMsg.setDisplayType('inline');
	
	// Create the following buttons: OK, Cancel
	form.addSubmitButton('Yes');
	form.addButton('custpage_cancel_button', 'No', 'window.location=\'/app/center/card.nl?sc=-29\'');
	
	response.writePage(form);
}


/**
 * Calls the AR Balances Routine Scheduled script and redirect the user back to the Suitelet main page
 * @param request
 * @param response
 * @param form
 */
function callARBalancesRoutine(request, response, form)
{	
	var context = nlapiGetContext();
    
    var stCurrentUser = nlapiGetUser();
	nlapiLogExecution('DEBUG', LOGGER_TITLE, 'Current User = ' + stCurrentUser);
	
	var stCustomerTransSummarySearch = request.getParameter('custpage_trans_sum_search');
    var stCustomerTransDetailSearch = request.getParameter('custpage_trans_det_search');
    var stEmailAlert = request.getParameter('custpage_email_alert');
    var bSendEmail = request.getParameter('custpage_send_email');
	
	var stSrcTranPeriod = request.getParameter('custpage_source_tran_period');
	var stNettingDate = request.getParameter('custpage_netting_date');	
	var stAcctsReceivable = request.getParameter('custpage_acct_receivable_acct');
	
	var params = new Array();
	params['custscript_arr_customer_trans_sum_search'] = stCustomerTransSummarySearch;
	params['custscript_arr_customer_trans_det_search'] = stCustomerTransDetailSearch;
	params['custscript_arr_email_alert'] = stEmailAlert;
	params['custscript_arr_send_email'] = bSendEmail;
	params['custscript_arr_current_user'] = stCurrentUser;
	params['custscript_arr_src_tran_period'] = stSrcTranPeriod;
	params['custscript_arr_netting_date'] = stNettingDate;
	params['custscript_arr_accts_receivable'] = stAcctsReceivable;
	
	// Create a Netting Log record
	createNettingLog(stCurrentUser, stSrcTranPeriod, stNettingDate, stAcctsReceivable);
	
	// Fetch the subsidiaries from IC Entity Mapping and IC Batches
	var arrIntercompanyEntityMapping = getIntercompanyEntityMapping();
	var arrICBatches = getICBatches();
	
	if (arrIntercompanyEntityMapping != null && arrICBatches != null)
    {			
		var stNextBatchId = ''; // Initialize a variable that will store the next Batch ID to processed. This will be used to determine if the script should start processing the current batch
		var intQueueNo = 1; // Initialize the queue to 1
		
		// For each subsidiary from the search result
		var intICBatchesLength = arrICBatches.length;
		var intLastICBatchIndex = intICBatchesLength - 1;
		var bBatchQueueCreated = false; // Initialize a variable that will determine if an IC Batch Queue record is created
		for (var j = 0; j < intICBatchesLength; j++)    	
        {	
			// Determine the batch from IC Batches
			var stICBatchId = arrICBatches[j].getValue('custrecord_icb_batch_id');
			nlapiLogExecution('DEBUG', LOGGER_TITLE, 'IC Batch ID = ' + stICBatchId);
			
			// Store the current IC Batch ID to the variable
    		if (j != intLastICBatchIndex)
    		{
    			stNextBatchId = arrICBatches[j + 1].getValue('custrecord_icb_batch_id');
    		}
			
			// If the Subsidiary exist on the Intercompany Entity Mapping
			var stICBSubsidiary = arrICBatches[j].getValue('custrecord_icb_subsidiary');
			nlapiLogExecution('DEBUG', LOGGER_TITLE, 'Subsidiary = ' + stICBSubsidiary);
    		for (var i = 0; i < arrIntercompanyEntityMapping.length; i++)    		
            {
    			var stICESubsidiary = arrIntercompanyEntityMapping[i].getValue('custrecord_iem_subsidiary', null, 'group');    			
    			if (stICBSubsidiary == stICESubsidiary)
    			{
    				// Create IC Batches Queue record
    				createICBatchesQueue(stICESubsidiary, stICBatchId, stCurrentUser);
    				bBatchQueueCreated = true;
    				break;
    			}
            }
    		
    		// If the creation of all queues is completed for current batch
			if (bBatchQueueCreated)
			{				
				if (stNextBatchId != stICBatchId || j == intLastICBatchIndex)
				{
					// Call the schedule script to process the records
					params['custscript_arr_batch_id'] = stICBatchId;
					
					var stScriptDeploymentId = SCHED_SCRIPT_DEPLOYMENT_ID + intQueueNo;
					var stStatus = nlapiScheduleScript(SCHED_SCRIPT_ID, stScriptDeploymentId, params);
					nlapiLogExecution('DEBUG', LOGGER_TITLE, 'Scheduled Script Deployment = ' + stScriptDeploymentId + ' | Status = ' + stStatus);
									
					intQueueNo++;
					bBatchQueueCreated = false; // reset the variable to false
				}				
			}
        }
    }
	else
	{
		nlapiLogExecution('DEBUG', LOGGER_TITLE, 'There are no records retrieved from Intercompani Entity Mapping or IC Batches records.');
	}
	
//	var param = new Array();
//	param['searchid'] = '895';
//	nlapiSetRedirectURL('TASKLINK', 'LIST_SEARCHRESULTS', null, null, param);
	
	// Redirect to home page
	var stHtml = '<html>';
    stHtml += '<head>';
    stHtml += '<script language="JavaScript">';
    stHtml += 'window.location=\'/app/center/card.nl?sc=-29\';';
    stHtml += '</script>';
    stHtml += '</head>';
    stHtml += '<body>';
    stHtml += '</body>';
    stHtml += '</html>';
    
    response.write(stHtml);
}


/**
 * Scheduled script for AR Balances Routine
 * @returns {Boolean}
 */
function scheduled_arBalancesRoutine()
{    
    try
    {    	
    	nlapiLogExecution('DEBUG', LOGGER_TITLE, '>>Entry<<');
    	
    	var context = nlapiGetContext();
    	
    	// Retrieve the parameters passed by the suitelet
        var stCustomerTransSummarySearch = context.getSetting('SCRIPT', 'custscript_arr_customer_trans_sum_search');
        var stCustomerTransDetailSearch = context.getSetting('SCRIPT', 'custscript_arr_customer_trans_det_search');
        var stEmailAlert = context.getSetting('SCRIPT', 'custscript_arr_email_alert');
        var bSendEmail = context.getSetting('SCRIPT', 'custscript_arr_send_email');
        var stBatchId = context.getSetting('SCRIPT', 'custscript_arr_batch_id');
        var stCurrentUser = context.getSetting('SCRIPT', 'custscript_arr_current_user');
    	var stSrcTranPeriod = context.getSetting('SCRIPT', 'custscript_arr_src_tran_period');
    	var stNettingDate = context.getSetting('SCRIPT', 'custscript_arr_netting_date');    	
    	var stAcctsReceivable = context.getSetting('SCRIPT', 'custscript_arr_accts_receivable');
    	nlapiLogExecution('DEBUG', LOGGER_TITLE, 'Customer Transactions Summary Search = ' + stCustomerTransSummarySearch
        		+ ' | Customer Transactions Detail Search = ' + stCustomerTransDetailSearch
        		+ ' | Email Alert = ' + stEmailAlert
        		+ ' | Send Email = ' + bSendEmail
        		+ ' | Batch ID = ' + stBatchId
    			+ ' | Current User = ' + stCurrentUser
    			+ ' | Source Transaction Period = ' + stSrcTranPeriod 
    			+ ' | Netting Date = ' + stNettingDate 
    			+ ' | Accounts Receivable = ' + stAcctsReceivable);
    	
    	if (isEmpty(stCustomerTransSummarySearch) || isEmpty(stCustomerTransDetailSearch) || isEmpty(stEmailAlert) || isEmpty(bSendEmail) || isEmpty(stBatchId) || isEmpty(stCurrentUser) || isEmpty(stSrcTranPeriod) || isEmpty(stNettingDate) || isEmpty (stAcctsReceivable))
    	{
    		nlapiLogExecution('DEBUG', LOGGER_TITLE, 'Parameters are empty. >>Exit<<');
    		return;
    	}
    	
    	// Retrieve the start and end date of the Source Transaction Period
    	var stSrcTranPeriodFlds = nlapiLookupField('accountingperiod', stSrcTranPeriod, ['startdate', 'enddate']);
		var stSrcTranPeriodEnd = stSrcTranPeriodFlds.enddate;    		
		nlapiLogExecution('DEBUG', LOGGER_TITLE, 'Source Transaction Period End Date = ' + stSrcTranPeriodEnd);
				    	
    	// The script retrieves the IC Batches Queue records
    	var arrICBatchesQueue = getICBatchesQueue(stBatchId);
    	if (arrICBatchesQueue != null)
        {
    		for (var z = 0; z < arrICBatchesQueue.length; z++)
            {
    			var intRemainingUsage = context.getRemainingUsage();
    			nlapiLogExecution('DEBUG', LOGGER_TITLE, 'Remaining Usage = '  + intRemainingUsage);   
    	        if (intRemainingUsage < USAGE_LIMIT_THRESHOLD)
    	        {
    	        	var params = new Array();
    	        	params['custscript_arr_current_user'] = stCurrentUser;
    	        	params['custscript_arr_src_tran_period'] = stSrcTranPeriod;
    	        	params['custscript_arr_netting_date'] = stNettingDate;
    	        	params['custscript_arr_accts_receivable'] = stAcctsReceivable;
    	        	params['custscript_arr_batch_id'] = stBatchId;
    	        	params['custscript_arr_customer_trans_sum_search'] = stCustomerTransSummarySearch;
    	        	params['custscript_arr_customer_trans_det_search'] = stCustomerTransDetailSearch;
    	        	params['custscript_arr_email_alert'] = stEmailAlert;
    	        	params['custscript_arr_send_email'] = bSendEmail;
    	        	
    	        	nlapiSubmitField('customrecord_ic_batches_queue', IC_BATCH_QUEUE, ['custrecord_icbq_status'], [ICBQ_STATUS_NOTSTARTED]); // Update the IC Batch Queue record so it will be picked up again
    	        	
    				var stStatus = nlapiScheduleScript(SCHED_SCRIPT_ID, null, params);
    				nlapiLogExecution('DEBUG', LOGGER_TITLE, 'Scheduled Script Status = ' + stStatus);
    	        	return;
    	        }
    			
    	        ERROR_MESSAGE = '';
    	        IC_BATCH_QUEUE = arrICBatchesQueue[z].getId();
    			var stSubsidiary = arrICBatchesQueue[z].getValue('custrecord_icbq_source_subsidiary');
    			nlapiLogExecution('DEBUG', LOGGER_TITLE, 'IC Batch Queue = ' + IC_BATCH_QUEUE + ' | Subsidiary = ' + stSubsidiary);
    			
    			var arrSubsidiary = nlapiLookupField('subsidiary', stSubsidiary, ['custrecord_default_cost_center', 'custrecord_default_region', 'custrecord_default_product']);
    			var stCostCenter = arrSubsidiary.custrecord_default_cost_center;
    			var stRegion = arrSubsidiary.custrecord_default_region;
    			var stProduct = arrSubsidiary.custrecord_default_product;
    			nlapiLogExecution('DEBUG', LOGGER_TITLE, 'Cost Centre = ' + stCostCenter + ' | Region = ' + stRegion + ' | Product = ' + stProduct);
    			
    			// Update the Status and Date Timestamp fields of the IC Batches Queue record
    			var stCurrentTimestamp = getCurrentTimestamp();
    			nlapiLogExecution('DEBUG', LOGGER_TITLE, 'Current Timestamp = ' + stCurrentTimestamp);    			
    			
    			nlapiSubmitField('customrecord_ic_batches_queue', IC_BATCH_QUEUE, ['custrecord_icbq_status', 'custrecord_icbq_date_timestamp'], [ICBQ_STATUS_ONGOING, stCurrentTimestamp]);
    			    			
    			// The script call an Intercompany Entity Mapping saved search to retrieve the Customers to process for the Subsidiary
    	    	var arrIntercompanyEntityMapping = getIntercompanyEntityMappingBySubsidiary(stSubsidiary);
    	    	if (arrIntercompanyEntityMapping != null)
    	        {
    	    		// For each subsidiary from the Intercompany Entity Mapping search result
    	        	for (var i = 0; i < arrIntercompanyEntityMapping.length; i++)
    	            {
    	        		var intRemainingUsage = context.getRemainingUsage();
    	    			nlapiLogExecution('DEBUG', LOGGER_TITLE, 'Remaining Usage = '  + intRemainingUsage);   
    	    	        if (intRemainingUsage < USAGE_LIMIT_THRESHOLD)
    	    	        {
    	    	        	var params = new Array();
    	    	        	params['custscript_arr_current_user'] = stCurrentUser;
    	    	        	params['custscript_arr_src_tran_period'] = stSrcTranPeriod;
    	    	        	params['custscript_arr_netting_date'] = stNettingDate;
    	    	        	params['custscript_arr_product'] = stProduct;
    	    	        	params['custscript_arr_batch_id'] = stBatchId;
    	    	        	params['custscript_arr_customer_trans_sum_search'] = stCustomerTransSummarySearch;
    	    	        	params['custscript_arr_customer_trans_det_search'] = stCustomerTransDetailSearch;
    	    	        	params['custscript_arr_email_alert'] = stEmailAlert;
    	    	        	params['custscript_arr_send_email'] = bSendEmail;
    	    	        	
    	    	        	nlapiSubmitField('customrecord_ic_batches_queue', IC_BATCH_QUEUE, ['custrecord_icbq_status'], [ICBQ_STATUS_NOTSTARTED]); // Update the IC Batch Queue record so it will be picked up again
    	    	        	
    	    				var stStatus = nlapiScheduleScript(SCHED_SCRIPT_ID, null, params);
    	    				nlapiLogExecution('DEBUG', LOGGER_TITLE, 'Scheduled Script Status = ' + stStatus);
    	    	        	return;
    	    	        }
    	    	        
    	        		var stICEntityMappingId = arrIntercompanyEntityMapping[i].getId();
    	        		var stNettingBankAcct = arrIntercompanyEntityMapping[i].getValue('custrecord_iem_netting_bank_account');
    	        		var stCustomer = arrIntercompanyEntityMapping[i].getValue('custrecord_iem_customer_account');
    	        		nlapiLogExecution('DEBUG', LOGGER_TITLE, '***Intercompany Entity Mapping = ' + stICEntityMappingId
    	        				+ ' | Customer = ' + stCustomer
    	        				+ ' | Netting Bank Account = ' + stNettingBankAcct + '***');       		
    	        		
    	        		var arrCustomerTransactionsSummary = getCustomerTransactionsSummary(stSubsidiary, stSrcTranPeriodEnd, stCustomerTransSummarySearch, stCustomer);
    	        		if (arrCustomerTransactionsSummary != null)
    	        	    {
    	        			// For each result returned by the transaction saved search
    	        			for (var j = 0; j < arrCustomerTransactionsSummary.length; j++)
    	                    {
    	        				var intRemainingUsage = context.getRemainingUsage();
    	            			nlapiLogExecution('DEBUG', LOGGER_TITLE, 'Remaining Usage = '  + intRemainingUsage);   
    	            	        if (intRemainingUsage < USAGE_LIMIT_THRESHOLD)
    	            	        {
    	            	        	var params = new Array();
    	            	        	params['custscript_arr_current_user'] = stCurrentUser;
    	            	        	params['custscript_arr_src_tran_period'] = stSrcTranPeriod;
    	            	        	params['custscript_arr_netting_date'] = stNettingDate;
    	            	        	params['custscript_arr_accts_receivable'] = stAcctsReceivable;
    	            	        	params['custscript_arr_batch_id'] = stBatchId;
    	            	        	params['custscript_arr_customer_trans_sum_search'] = stCustomerTransSummarySearch;
    	            	        	params['custscript_arr_customer_trans_det_search'] = stCustomerTransDetailSearch;
    	            	        	params['custscript_arr_email_alert'] = stEmailAlert;
    	            	        	params['custscript_arr_send_email'] = bSendEmail;
    	            	        	
    	            	        	nlapiSubmitField('customrecord_ic_batches_queue', IC_BATCH_QUEUE, ['custrecord_icbq_status'], [ICBQ_STATUS_NOTSTARTED]); // Update the IC Batch Queue record so it will be picked up again
    	            	        	
    	            				var stStatus = nlapiScheduleScript(SCHED_SCRIPT_ID, null, params);
    	            				nlapiLogExecution('DEBUG', LOGGER_TITLE, 'Scheduled Script Status = ' + stStatus);
    	            	        	return;
    	            	        }
    	            	        
    	            			var stCurrency = arrCustomerTransactionsSummary[j].getValue('currency', null, 'group');        			
    	            			var flTotalForeignAmount = forceParseFloat(arrCustomerTransactionsSummary[j].getValue('fxamount', null, 'sum'));
    	            			nlapiLogExecution('DEBUG', LOGGER_TITLE, '**Currency = ' + stCurrency
    	                				+ ' | Total Foreign Amount = ' + flTotalForeignAmount + '**');     
    	            			
    	            			// If total Foreign Amount is positive
    	            			if (flTotalForeignAmount > 0)
    	            			{
    	            				// The script creates a Customer Payment record
    	            				createCustomerPayment(stCustomer, stNettingBankAcct, stCurrency, stNettingDate, stAcctsReceivable, stCostCenter, stProduct, stRegion, stSubsidiary, stSrcTranPeriodEnd, stCustomerTransDetailSearch) 
    	            			}
    	            			// If total Foreign Amount is negative
    	            			else if (flTotalForeignAmount < 0)
    	            			{
    	            				// The script creates a Customer Refund record
    	            				createCustomerRefund(stCustomer, stNettingBankAcct, stCurrency, stNettingDate, stAcctsReceivable, stCostCenter, stProduct, stRegion, stSubsidiary, stSrcTranPeriodEnd, stCustomerTransDetailSearch);            				
    	            			}
    	                    }
    	        	    }
    	        		else
    	        		{
    	        			nlapiLogExecution('DEBUG', LOGGER_TITLE, 'There are no transactions with open balance for the specified parameters'); 
    	        		}
    	            }
    	        	
    	        	if (!isEmpty(ERROR_MESSAGE))
    	        	{
    	        		// Update the Status of the IC Batches Queue record
    	        		nlapiSubmitField('customrecord_ic_batches_queue', IC_BATCH_QUEUE, ['custrecord_icbq_status'], [ICBQ_STATUS_FAILED] + ' | ' + ERROR_MESSAGE);    
    	        	}
    	        	else
    	        	{
    	        		// Update the Status of the IC Batches Queue record
    	    			nlapiSubmitField('customrecord_ic_batches_queue', IC_BATCH_QUEUE, ['custrecord_icbq_status'], [ICBQ_STATUS_COMPLETED]);
    	    			nlapiLogExecution('DEBUG', LOGGER_TITLE, 'IC Batches Queue Status is set to Completed.'); 
    	        	}
    	        } 
            }
        }
    	
    	// Send an email once the script finished execution
    	if (bSendEmail == 'T')
    	{
    		sendEmailAlert(stEmailAlert, stCurrentUser, stBatchId);
    		nlapiLogExecution('DEBUG', LOGGER_TITLE, 'Successfully sent email alert.');
    	}
    	
    	nlapiLogExecution('DEBUG', LOGGER_TITLE, '>>Exit<<');
    } 
    catch (error)
    {
    	if (error.getDetails != undefined)
        {
    		var stErrorMsg = error.getCode() + ': ' + error.getDetails();
            nlapiLogExecution('ERROR','Process Error',  stErrorMsg);
            
            // Update the Status of the IC Batches Queue record
    		nlapiSubmitField('customrecord_ic_batches_queue', IC_BATCH_QUEUE, ['custrecord_icbq_status'], [ICBQ_STATUS_FAILED] + ' | ' + stErrorMsg);            
    		throw error;
        }
        else
        {
        	var stErrorMsg = error.toString();
            nlapiLogExecution('ERROR','Unexpected Error', stErrorMsg); 
            
            // Update the Status of the IC Batches Queue record
    		nlapiSubmitField('customrecord_ic_batches_queue', IC_BATCH_QUEUE, ['custrecord_icbq_status'], [ICBQ_STATUS_FAILED] + ' | ' + stErrorMsg);            
            throw nlapiCreateError('99999', stErrorMsg);
        }    	 
        return false;
    }  
}


/**
 * Create IC Batch Queue record
 * @param stSubsidiary
 * @param stBatchId
 * @param stCurrentUser
 */
function createICBatchesQueue(stSubsidiary, stBatchId, stCurrentUser)
{
	var recICBatchQueue = nlapiCreateRecord('customrecord_ic_batches_queue');
	recICBatchQueue.setFieldValue('custrecord_icbq_batch_id', stBatchId);
	recICBatchQueue.setFieldValue('custrecord_icbq_source_subsidiary', stSubsidiary);
	recICBatchQueue.setFieldValue('custrecord_icbq_current_user', stCurrentUser);
	recICBatchQueue.setFieldValue('custrecord_icbq_date_timestamp', '');
	recICBatchQueue.setFieldValue('custrecord_icbq_status', ICBQ_STATUS_NOTSTARTED);
	recICBatchQueue.setFieldValue('custrecord_icbq_frd_no', ICBQ_FRD_NO);
	var stICBatchQueue = nlapiSubmitRecord(recICBatchQueue, true, true);
	nlapiLogExecution('DEBUG', LOGGER_TITLE, 'Successfully created IC Batch Queue record. ID = ' + stICBatchQueue);
}


/**
 * Create Netting Log record
 * @param stCurrentUser
 * @param stSrcTranPeriod
 * @param stNettingDate
 * @param stAcctsPayable
 * @returns
 */
function createNettingLog(stCurrentUser, stSrcTranPeriod, stNettingDate, stAcctsReceivable)
{
	var recNettingLog = nlapiCreateRecord('customrecord_netting_log');
	recNettingLog.setFieldValue('custrecord_nl_user_id', stCurrentUser);
	recNettingLog.setFieldValue('custrecord_nl_source_trans_period', stSrcTranPeriod);
	recNettingLog.setFieldValue('custrecord_nl_netting_date', stNettingDate);
	recNettingLog.setFieldValue('custrecord_nl_ar_account', stAcctsReceivable);
	var stNettingLog = nlapiSubmitRecord(recNettingLog, true, true);
	nlapiLogExecution('DEBUG', LOGGER_TITLE, 'Successfully created Netting Log record. ID = ' + stNettingLog);
}


/**
 * Create Customer Payment record
 * @param stCustomer
 * @param stNettingBankAcct
 * @param stCurrency
 * @param stNettingDate
 * @param stAcctsReceivable
 * @param stCostCenter
 * @param stProduct
 * @param stRegion
 * @param stSubsidiary
 * @param stSrcTranPeriodEnd
 * @param stCustomerTransDetailSearch
 */
function createCustomerPayment(stCustomer, stNettingBankAcct, stCurrency, stNettingDate, stAcctsReceivable, stCostCenter, stProduct, stRegion, stSubsidiary, stSrcTranPeriodEnd, stCustomerTransDetailSearch)
{	
	try
	{
		// The script initializes the Payee field to the value of Customer from the Transaction search result
		var recCustomerPayment = nlapiCreateRecord('customerpayment', {recordmode:'dynamic', entity:stCustomer});
		
		// The script sets the following fields:
		recCustomerPayment.setFieldValue('aracct', stAcctsReceivable); // Accounts Receivable Account defined when running the routine		
		//recCustomerPayment.setFieldValue('undeffunds', 'F'); 
		//recCustomerPayment.setFieldValue('account', stNettingBankAcct); // Netting Bank Account from Intercompany Entity Mapping search result		
		recCustomerPayment.setFieldValue('currency', stCurrency); // Currency from Transaction search result
		recCustomerPayment.setFieldValue('trandate', stNettingDate); // Netting Date defined when running the routine	
		recCustomerPayment.setFieldValue('memo', 'Netting');
		recCustomerPayment.setFieldValue('department', stCostCenter); // Cost Center defined when running the routine
		recCustomerPayment.setFieldValue('class', stProduct); //Product defined when running the routine
		recCustomerPayment.setFieldValue('location', stRegion); //Region defined when running the routine
			
		// To set the apply line of the Customer Payment, the script calls another Transaction saved search
		var bHasApplyLine = false;
		var arrCustomerTransactionsDetail = getTransactionsToApply(stSubsidiary, stCurrency, stSrcTranPeriodEnd, stCustomer, stCustomerTransDetailSearch);
		if (arrCustomerTransactionsDetail != null)
	    {
			// For each transaction Internal ID from the search result
			var intCustomerTransactionsDetailLength = arrCustomerTransactionsDetail.length;
			nlapiLogExecution('DEBUG', LOGGER_TITLE, 'Number of transactions to apply on Customer Payment = ' + intCustomerTransactionsDetailLength);
			for (var i = 0; i < intCustomerTransactionsDetailLength; i++)
	        {	
				var stTranInternalId = arrCustomerTransactionsDetail[i].getId();
				var stTranType = arrCustomerTransactionsDetail[i].getRecordType();
				nlapiLogExecution('DEBUG', LOGGER_TITLE, 'Saved Search Result [' + i + '] ' + stTranType + ' = ' + stTranInternalId);
				
				if (stTranType == 'invoice')
				{
					// The script loops through the Customer Payment apply line list
					var intCustomerPaymenApplyCount = recCustomerPayment.getLineItemCount('apply');
					for (var j = 1; j <= intCustomerPaymenApplyCount; j++)
					{
						// If the doc field is equal to the Internal ID, the script sets the apply field to T
						var stDoc = recCustomerPayment.getLineItemValue('apply', 'doc', j);
						if (stDoc == stTranInternalId)
						{
							recCustomerPayment.selectLineItem('apply', j);
							recCustomerPayment.setCurrentLineItemValue('apply', 'apply', 'T');
							recCustomerPayment.commitLineItem('apply');
							nlapiLogExecution('DEBUG', LOGGER_TITLE, 'Apply Line ' + j + ' is applied to the Customer Payment');
							bHasApplyLine = true;
							break;
						}
					}
				}
				else if (stTranType == 'creditmemo')
				{
					// The script loops through the Customer Payment credit line list
					var intCustomerPaymenCreditCount = recCustomerPayment.getLineItemCount('credit');
					for (var j = 1; j <= intCustomerPaymenCreditCount; j++)
					{
						// If the doc field is equal to the Internal ID, the script sets the apply field to T
						var stDoc = recCustomerPayment.getLineItemValue('credit', 'doc', j);
						if (stDoc == stTranInternalId)
						{
							recCustomerPayment.selectLineItem('credit', j);
							recCustomerPayment.setCurrentLineItemValue('credit', 'apply', 'T');
							recCustomerPayment.commitLineItem('credit');
							nlapiLogExecution('DEBUG', LOGGER_TITLE, 'Credit Line ' + j + ' is applied to the Customer Payment');
							bHasApplyLine = true;
							break;
						}
					}
				}
	        }		
	    }
		
		if (bHasApplyLine)
		{
			var stCustomerPayment = nlapiSubmitRecord(recCustomerPayment, true, false);
			nlapiLogExecution('DEBUG', LOGGER_TITLE, 'Successfully created Customer Payment. ID = ' + stCustomerPayment);
			nlapiSubmitField('customerpayment', stCustomerPayment, 'account', stNettingBankAcct);	
			nlapiLogExecution('DEBUG', LOGGER_TITLE, 'Successfully updated Account of the Customer Payment');
		}
		else
		{
			nlapiLogExecution('DEBUG', LOGGER_TITLE, 'Customer Payment will not be created because there are no transactions to apply'); 
		}
	}
	catch (error)
	{
		var stErrorMsg = 'Failed to create Customer Payment for Customer = ' + stCustomer + '. REASON = ' + error + '<br>';
		nlapiLogExecution('DEBUG', LOGGER_TITLE, 'IC Bathes Queue = ' + IC_BATCH_QUEUE + ' | Error = ' + stErrorMsg);
		
		ERROR_MESSAGE = ERROR_MESSAGE + stErrorMsg;
	}	
}


/**
 * Create Customer Refund record
 * @param stCustomer
 * @param stNettingBankAcct
 * @param stCurrency
 * @param stNettingDate
 * @param stAcctsReceivable
 * @param stCostCenter
 * @param stProduct
 * @param stRegion
 * @param stSubsidiary
 * @param stSrcTranPeriodEnd
 * @param stCustomerTransDetailSearch
 */
function createCustomerRefund(stCustomer, stNettingBankAcct, stCurrency, stNettingDate, stAcctsReceivable, stCostCenter, stProduct, stRegion, stSubsidiary, stSrcTranPeriodEnd, stCustomerTransDetailSearch)
{	
	try
	{
		// The script initializes the Payee field to the value of Customer from the Transaction search result
		var recCustomerRefund = nlapiCreateRecord('customerrefund', {recordmode:'dynamic', entity:stCustomer});
		
		// The script sets the following fields:
		recCustomerRefund.setFieldValue('account', stNettingBankAcct); // Netting Bank Account from Intercompany Entity Mapping search result
		recCustomerRefund.setFieldValue('aracct', stAcctsReceivable); // Accounts Receivable Account defined when running the routine
		recCustomerRefund.setFieldValue('currency', stCurrency); // Currency from Transaction search result
		recCustomerRefund.setFieldValue('trandate', stNettingDate); // Netting Date defined when running the routine	
		recCustomerRefund.setFieldValue('memo', 'Netting');
		recCustomerRefund.setFieldValue('department', stCostCenter); // Cost Center defined when running the routine
		recCustomerRefund.setFieldValue('class', stProduct); //Product defined when running the routine
		recCustomerRefund.setFieldValue('location', stRegion); //Region defined when running the routine
			
		// To set the apply line of the Customer Refund, the script calls another Transaction saved search
		var bHasApplyLine = false;
		var arrCustomerTransactionsDetail = getTransactionsToApply(stSubsidiary, stCurrency, stSrcTranPeriodEnd, stCustomer, stCustomerTransDetailSearch);
		if (arrCustomerTransactionsDetail != null)
	    {
			// For each transaction Internal ID from the search result
			var intCustomerTransactionsDetailLength = arrCustomerTransactionsDetail.length;
			for (var i = 0; i < intCustomerTransactionsDetailLength; i++)
	        {	
				var stTranInternalId = arrCustomerTransactionsDetail[i].getId();
				var stTranType = arrCustomerTransactionsDetail[i].getRecordType();
				nlapiLogExecution('DEBUG', LOGGER_TITLE, 'Saved Search Result [' + i + '] ' + stTranType + ' = ' + stTranInternalId);
				                    				
				// The script loops through the Customer Payment apply line list
				var intCustomerRefundApplyCount = recCustomerRefund.getLineItemCount('apply');
				for (var j = 1; j <= intCustomerRefundApplyCount; j++)
				{
					// If the doc field is equal to the Internal ID, the script sets the apply field to T
					var stDoc = recCustomerRefund.getLineItemValue('apply', 'doc', j);
					if (stDoc == stTranInternalId)
					{
						recCustomerRefund.selectLineItem('apply', j);
						recCustomerRefund.setCurrentLineItemValue('apply', 'apply', 'T');
						recCustomerRefund.commitLineItem('apply');
						nlapiLogExecution('DEBUG', LOGGER_TITLE, 'Line ' + j + ' is applied to the Customer Refund');
						bHasApplyLine = true;
						break;
					}
				}
	        }		
	    }
		
		if (bHasApplyLine)
		{
			var stCustomerRefund = nlapiSubmitRecord(recCustomerRefund, true, true);
			nlapiLogExecution('DEBUG', LOGGER_TITLE, 'Successfully created Customer Refund. ID = ' + stCustomerRefund); 
		}
		else
		{
			nlapiLogExecution('DEBUG', LOGGER_TITLE, 'Customer Refund will not be created because there are no transactions to apply'); 
		}
	}
	catch (error)
	{
		var stErrorMsg = 'Failed to create Customer Refund for Customer = ' + stCustomer + '. REASON = ' + error + '<br>';
		nlapiLogExecution('DEBUG', LOGGER_TITLE, stErrorMsg);
		
		ERROR_MESSAGE += stErrorMsg;
	}
}


/**
 * Send email alert when the script finished processing a batch
 * @param stEmailAlert
 * @param stCurrentUser
 * @param stBatchId
 */
function sendEmailAlert(stEmailAlert, stCurrentUser, stBatchId)
{
	var arrEmailAlertFlds = nlapiLookupField('customrecord_email_alerts', stEmailAlert, ['custrecord_email_subject', 'custrecord_email_body', 'custrecord_email_from']);
    
    var stEmailSubject = arrEmailAlertFlds.custrecord_email_subject + ' | Batch ID: ' + stBatchId;
    var stEmailBody = arrEmailAlertFlds.custrecord_email_body;
    var stEmailFrom = arrEmailAlertFlds.custrecord_email_from;
    
    nlapiSendEmail(stEmailFrom, stCurrentUser, stEmailSubject, stEmailBody);   
}


/**
 * Retrieve all Intercompany Entity Mappings that are included in IC Netting
 * @returns
 */
function getIntercompanyEntityMapping()
{  
	var arrFilters = [new nlobjSearchFilter('custrecord_iem_include_in_ic_netting', null, 'is', 'T'),
	                  new nlobjSearchFilter('custrecord_iem_customer_account', null ,'noneof' ,'@NONE@'),
	                  new nlobjSearchFilter('custrecord_iem_netting_bank_account', null ,'noneof' ,'@NONE@'),
	                  new nlobjSearchFilter('isinactive', null ,'is' ,'F'),
	                  new nlobjSearchFilter('isinactive', 'custrecord_iem_subsidiary' ,'is','F')];
	
	var arrColumns = [new nlobjSearchColumn('custrecord_iem_subsidiary', null, 'group')];
	 
    var arrResults = nlapiSearchRecord('customrecord_intercompany_entity_mapping', null, arrFilters, arrColumns);    
    return arrResults;
}


/**
 * Retrieve Intercompany Entity Mappings that are included in IC Netting for a certain subsidiary
 * @param stSubsidiary
 * @returns
 */
function getIntercompanyEntityMappingBySubsidiary(stSubsidiary)
{
	var arrFilters = [new nlobjSearchFilter('custrecord_iem_include_in_ic_netting', null, 'is', 'T'),
	                  new nlobjSearchFilter('custrecord_iem_subsidiary', null, 'anyof', stSubsidiary),
	                  new nlobjSearchFilter('custrecord_iem_customer_account', null ,'noneof' ,'@NONE@'),
	                  new nlobjSearchFilter('custrecord_iem_netting_bank_account', null ,'noneof' ,'@NONE@'),
	                  new nlobjSearchFilter('isinactive', null ,'is' ,'F'),
	                  new nlobjSearchFilter('isinactive', 'custrecord_iem_subsidiary' ,'is','F')];
	
	var arrColumns = [new nlobjSearchColumn('custrecord_iem_netting_bank_account'),
                      new nlobjSearchColumn('custrecord_iem_customer_account'),
                      new nlobjSearchColumn('internalid').setSort()];
    
    var arrResults = nlapiSearchRecord('customrecord_intercompany_entity_mapping', null, arrFilters, arrColumns);    
    return arrResults;
}


/**
 * Retrieve IC Batches
 * @returns
 */
function getICBatches()
{
	var arrColumns = [new nlobjSearchColumn('custrecord_icb_batch_id').setSort(),
                      new nlobjSearchColumn('custrecord_icb_subsidiary')];
    
    var arrResults = nlapiSearchRecord('customrecord_intercompany_batches', null, null, arrColumns);    
    return arrResults;
}


/**
 * Retrieve IC Batch Queues
 * @returns
 */
function getICBatchesQueue(stBatchId)
{
	var arrFilters = [new nlobjSearchFilter('custrecord_icbq_batch_id', null, 'is', stBatchId),
	                  new nlobjSearchFilter('custrecord_icbq_status', null, 'is', ICBQ_STATUS_NOTSTARTED),
	                  new nlobjSearchFilter('custrecord_icbq_frd_no', null, 'is', ICBQ_FRD_NO)];
	
	var arrColumns = [new nlobjSearchColumn('internalid').setSort(),
	                  new nlobjSearchColumn('custrecord_icbq_batch_id').setSort(),
                      new nlobjSearchColumn('custrecord_icbq_source_subsidiary')];
		   
    var arrResults = nlapiSearchRecord('customrecord_ic_batches_queue', null, arrFilters, arrColumns);    
    return arrResults;
}


/**
 * Execution Customer Transactions Summary Saved Search with additional filter for subsidiary and date
 * @param stSubsidiary
 * @param stSrcTranPeriodEnd
 * @param stCustomerTransSummarySearch
 * @param stCustomer
 * @returns
 */
function getCustomerTransactionsSummary(stSubsidiary, stSrcTranPeriodEnd, stCustomerTransSummarySearch, stCustomer)
{
    var arrFilters = [new nlobjSearchFilter('subsidiary', null, 'anyof', stSubsidiary),
                      new nlobjSearchFilter('trandate', null, 'onorbefore', stSrcTranPeriodEnd),
                      new nlobjSearchFilter('entity', null, 'anyof', stCustomer)];
    
    var arrResults = nlapiSearchRecord('transaction', stCustomerTransSummarySearch, arrFilters);
    
    return arrResults;
}


/**
 * Search for all transactions to apply on Payment record
 * @param stSubsidiary
 * @param stCurrency
 * @param stSrcTranPeriodEnd
 * @param stCustomer
 * @param stCustomerTransDetailSearch
 * @returns
 */
function getTransactionsToApply(stSubsidiary, stCurrency, stSrcTranPeriodEnd, stCustomer, stCustomerTransDetailSearch)
{
    var arrFilters = [new nlobjSearchFilter('subsidiary', null, 'anyof', stSubsidiary),
                      new nlobjSearchFilter('trandate', null, 'onorbefore', stSrcTranPeriodEnd),
                      new nlobjSearchFilter('entity', null, 'anyof', stCustomer),
                      new nlobjSearchFilter('currency', null, 'anyof', stCurrency)];
    
    var arrResults = nlapiSearchRecord('transaction', stCustomerTransDetailSearch, arrFilters);
    
    return arrResults;
}


/**
 * Get current timestamp
 * @returns {String}
 */
function getCurrentTimestamp() 
{	
	var stToday = nlapiDateToString(new Date(), 'datetimetz');
	return stToday;
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


/**
 * Check if a string is empty
 * @param stValue (string) value to check
 * @returns {Boolean}
 */
function isEmpty (stValue) {
     if ((stValue == '') || (stValue == null) || (stValue == undefined)) {
          return true;
     }

     return false;
}