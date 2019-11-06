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

var LOGGER_TITLE = 'AP Balances Routine';

var CUSTOM_FORM_MISYS_JE = '111';

var ICBQ_STATUS_NOTSTARTED = 'Not Started';
var ICBQ_STATUS_ONGOING = 'Ongoing';
var ICBQ_STATUS_COMPLETED = 'Completed';
var ICBQ_STATUS_FAILED = 'Error';
var ICBQ_FRD_NO = '0010 - AP Balances Routine';

var SCHED_SCRIPT_ID = 'customscript_ap_balance_routine_sched';
var SCHED_SCRIPT_DEPLOYMENT_ID = 'customdeploy_ap_balance_routine_sched';
var MAX_QUEUE = 5;

var IC_BATCH_QUEUE = '';

var USAGE_LIMIT_THRESHOLD = 200;

var ERROR_MESSAGE = '';

/**
 * Main suitelet for AP Balances Routine
 * @author Aurel Shenne Sinsin
 * @version 1.0
 */
function suitelet_apBalancesRoutine()
{ 
    try
    {  
    	nlapiLogExecution('DEBUG', LOGGER_TITLE, '>>Entry<<');
    	
    	var stStage = request.getParameter('custpage_stage');
		nlapiLogExecution('DEBUG', LOGGER_TITLE, 'Stage = ' + stStage);
		
    	var form = nlapiCreateForm('AP Balances Routine');
    	
    	switch(stStage)
        {
        	case 'parametersSubmitted':
        		form = displayConfirmMessage(request,response, form);
        		break;
        	case 'messageConfirmed':
        		form = callAPBalancesRoutine(request,response, form);
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
    var stVendorTransSummarySearch = context.getSetting('SCRIPT', 'custscript_slapr_vendor_trans_sum_search');
    var stVendorTransDetailSearch = context.getSetting('SCRIPT', 'custscript_slapr_vendor_trans_det_search');
    var stAcctsPayableSearch = context.getSetting('SCRIPT', 'custscript_slapr_accts_payable_search');
    var stEmailAlert = context.getSetting('SCRIPT', 'custscript_slapr_email_alert');    
    var bSendEmail = context.getSetting('SCRIPT', 'custscript_slapr_send_email');
    var stJECustomForm = context.getSetting('SCRIPT', 'custscript_slapr_je_custom_form');
    nlapiLogExecution('DEBUG', LOGGER_TITLE, 'Script Parameters: Vendor Transactions Summary Search = ' + stVendorTransSummarySearch
    		+ ' | Vendor Transactions Detail Search = ' + stVendorTransDetailSearch
    		+ ' | Accounts Payables Search = ' + stAcctsPayableSearch
    		+ ' | Email Alert = ' + stEmailAlert
    		+ ' | Send Email = ' + bSendEmail
    		+ ' | JE Custom Form = ' + stJECustomForm);
    if (isEmpty(stVendorTransSummarySearch) || isEmpty(stVendorTransDetailSearch) || isEmpty(stEmailAlert) || isEmpty(stJECustomForm))
    {	
    	throw nlapiCreateError('99999', 'Please enter values on the script parameter');
    }
	
	form = nlapiCreateForm('AP Balances Routine');
	
	var fldStage = form.addField('custpage_stage', 'text', 'Stage');
	fldStage.setDefaultValue('parametersSubmitted');
	fldStage.setDisplayType('hidden');
	
	// Add hidden fields to the form to set the values of the script parameter
	form.addField('custpage_trans_sum_search', 'text', 'Transaction Summary Search').setDisplayType('hidden').setDefaultValue(stVendorTransSummarySearch);
	form.addField('custpage_trans_det_search', 'text', 'Transaction Detail Search').setDisplayType('hidden').setDefaultValue(stVendorTransDetailSearch);
	form.addField('custpage_email_alert', 'text', 'Email Alert').setDisplayType('hidden').setDefaultValue(stEmailAlert);
	form.addField('custpage_send_email', 'text', 'Send Email').setDisplayType('hidden').setDefaultValue(bSendEmail);
	form.addField('custpage_je_custom_form', 'text', 'JE Custom Form').setDisplayType('hidden').setDefaultValue(stJECustomForm);
	
	// Create the parameter fields
	form.addField('custpage_source_tran_period', 'select', 'Source Transaction Period', '-105').setMandatory(true);
	form.addField('custpage_netting_date', 'date', 'Netting Date').setMandatory(true).setDefaultValue(nlapiDateToString(new Date()));
	
	// Show only Accounts Payables accounts in the dropdown
	var fldAccounts = form.addField('custpage_acct_payable_acct', 'select', 'Accounts Payable Account').setMandatory(true);
	var arrAcctsPayables = nlapiSearchRecord('account', stAcctsPayableSearch);    
	if (arrAcctsPayables != null)
	{
		for (var i = 0; i < arrAcctsPayables.length; i++)
		{
			fldAccounts.addSelectOption(arrAcctsPayables[i].getId(), arrAcctsPayables[i].getValue('name'));
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
	form = nlapiCreateForm('AP Balances Routine');
	
	var fldStage = form.addField('custpage_stage', 'text', 'Stage');
	fldStage.setDefaultValue('messageConfirmed');
	fldStage.setDisplayType('hidden');
	
	// Add hidden fields to the form to set the values of the script parameter which was set on the form
	form.addField('custpage_trans_sum_search', 'text', 'Transaction Summary Search').setDisplayType('hidden').setDefaultValue(request.getParameter('custpage_trans_sum_search'));
	form.addField('custpage_trans_det_search', 'text', 'Transaction Detail Search').setDisplayType('hidden').setDefaultValue(request.getParameter('custpage_trans_det_search'));
	form.addField('custpage_email_alert', 'text', 'Email Alert').setDisplayType('hidden').setDefaultValue(request.getParameter('custpage_email_alert'));
	form.addField('custpage_send_email', 'text', 'Send Email').setDisplayType('hidden').setDefaultValue(request.getParameter('custpage_send_email'));
	form.addField('custpage_je_custom_form', 'text', 'JE Custom Form').setDisplayType('hidden').setDefaultValue(request.getParameter('custpage_je_custom_form'));
		
	// Add hidden fields to the form to set the values entered by the user on the suitelet form
	form.addField('custpage_source_tran_period', 'select', 'Source Transaction Period', '-105').setDisplayType('hidden').setDefaultValue(request.getParameter('custpage_source_tran_period'));
	form.addField('custpage_netting_date', 'date', 'Netting Date').setDisplayType('hidden').setDefaultValue(request.getParameter('custpage_netting_date'));
	form.addField('custpage_acct_payable_acct', 'select', 'Accounts Payable Account', '-112').setDisplayType('hidden').setDefaultValue(request.getParameter('custpage_acct_payable_acct'));
	
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
 * Calls the AP Balances Routine Scheduled script and redirect the user back to the Suitelet main page
 * @param request
 * @param response
 * @param form
 */
function callAPBalancesRoutine(request, response, form)
{	
	var context = nlapiGetContext();
	
	var stCurrentUser = nlapiGetUser();
	nlapiLogExecution('DEBUG', LOGGER_TITLE, 'Current User = ' + stCurrentUser);
	
	var stVendorTransSummarySearch = request.getParameter('custpage_trans_sum_search');
    var stVendorTransDetailSearch = request.getParameter('custpage_trans_det_search');
    var stEmailAlert = request.getParameter('custpage_email_alert');
    var bSendEmail = request.getParameter('custpage_send_email');
    var stJECustomForm = request.getParameter('custpage_je_custom_form');
    	
	var stSrcTranPeriod = request.getParameter('custpage_source_tran_period');
	var stNettingDate = request.getParameter('custpage_netting_date');	
	var stAcctsPayable = request.getParameter('custpage_acct_payable_acct');
	
	var params = new Array();
	params['custscript_apr_vendor_trans_sum_search'] = stVendorTransSummarySearch;
	params['custscript_apr_vendor_trans_det_search'] = stVendorTransDetailSearch;
	params['custscript_apr_email_alert'] = stEmailAlert;
	params['custscript_apr_send_email'] = bSendEmail;
	params['custscript_apr_current_user'] = stCurrentUser;
	params['custscript_apr_src_tran_period'] = stSrcTranPeriod;
	params['custscript_apr_netting_date'] = stNettingDate;
	params['custscript_apr_accts_payable'] = stAcctsPayable;
	params['custscript_apr_je_custom_form'] = stJECustomForm;
	
	// Create a Netting Log record
	createNettingLog(stCurrentUser, stSrcTranPeriod, stNettingDate, stAcctsPayable);
	
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
					params['custscript_apr_batch_id'] = stICBatchId;					
					
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
 * Scheduled script for AP Balances Routine
 * @returns {Boolean}
 */
function scheduled_apBalancesRoutine()
{    
    try
    {    	
    	nlapiLogExecution('DEBUG', LOGGER_TITLE, '>>Entry<<');
    	
    	var context = nlapiGetContext();
    	
    	// Retrieve the parameters passed by the suitelet
        var stVendorTransSummarySearch = context.getSetting('SCRIPT', 'custscript_apr_vendor_trans_sum_search');
        var stVendorTransDetailSearch = context.getSetting('SCRIPT', 'custscript_apr_vendor_trans_det_search');
        var stEmailAlert = context.getSetting('SCRIPT', 'custscript_apr_email_alert');
        var bSendEmail = context.getSetting('SCRIPT', 'custscript_apr_send_email');
        var stBatchId = context.getSetting('SCRIPT', 'custscript_apr_batch_id');
        var stCurrentUser = context.getSetting('SCRIPT', 'custscript_apr_current_user');
    	var stSrcTranPeriod = context.getSetting('SCRIPT', 'custscript_apr_src_tran_period');
    	var stNettingDate = context.getSetting('SCRIPT', 'custscript_apr_netting_date');    	
    	var stAcctsPayable = context.getSetting('SCRIPT', 'custscript_apr_accts_payable');
    	var stJECustomForm = context.getSetting('SCRIPT', 'custscript_apr_je_custom_form');
    	nlapiLogExecution('DEBUG', LOGGER_TITLE, 'Vendor Transactions Summary Search = ' + stVendorTransSummarySearch
        		+ ' | Vendor Transactions Detail Search = ' + stVendorTransDetailSearch
        		+ ' | Email Alert = ' + stEmailAlert
        		+ ' | Send Email = ' + bSendEmail
        		+ ' | Batch ID = ' + stBatchId
    			+ ' | Current User = ' + stCurrentUser
    			+ ' | Source Transaction Period = ' + stSrcTranPeriod 
    			+ ' | Netting Date = ' + stNettingDate 
    			+ ' | Accounts Payable = ' + stAcctsPayable
    			+ ' | JE Custom Form = ' + stJECustomForm);
    	
    	if (isEmpty(stVendorTransSummarySearch) || isEmpty(stVendorTransDetailSearch) || isEmpty(stEmailAlert) || isEmpty(bSendEmail) || isEmpty(stBatchId) || isEmpty(stCurrentUser) || isEmpty(stSrcTranPeriod) || isEmpty(stNettingDate) || isEmpty (stAcctsPayable) || isEmpty(stJECustomForm))
    	{
    		nlapiLogExecution('Error', LOGGER_TITLE, 'Parameters are empty. >>Exit<<');
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
    	        	params['custscript_apr_current_user'] = stCurrentUser;
    	        	params['custscript_apr_src_tran_period'] = stSrcTranPeriod;
    	        	params['custscript_apr_netting_date'] = stNettingDate;
    	        	params['custscript_apr_accts_payable'] = stAcctsPayable;
    	        	params['custscript_apr_batch_id'] = stBatchId;
    	        	params['custscript_apr_vendor_trans_sum_search'] = stVendorTransSummarySearch;
    	        	params['custscript_apr_vendor_trans_det_search'] = stVendorTransDetailSearch;
    	        	params['custscript_apr_email_alert'] = stEmailAlert;
    	        	params['custscript_apr_send_email'] = bSendEmail;
    	        	params['custscript_apr_je_custom_form'] = stJECustomForm;
    	        	
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
    			
    			// The script call an Intercompany Entity Mapping search to retrieve the Vendors to process for the Subsidiary
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
    	    	        	params['custscript_apr_current_user'] = stCurrentUser;
    	    	        	params['custscript_apr_src_tran_period'] = stSrcTranPeriod;
    	    	        	params['custscript_apr_netting_date'] = stNettingDate;
    	    	        	params['custscript_apr_accts_payable'] = stAcctsPayable;
    	    	        	params['custscript_apr_batch_id'] = stBatchId;
    	    	        	params['custscript_apr_vendor_trans_sum_search'] = stVendorTransSummarySearch;
    	    	        	params['custscript_apr_vendor_trans_det_search'] = stVendorTransDetailSearch;
    	    	        	params['custscript_apr_email_alert'] = stEmailAlert;
    	    	        	params['custscript_apr_send_email'] = bSendEmail;
    	    	        	params['custscript_apr_je_custom_form'] = stJECustomForm;
    	    	        	
    	    	        	nlapiSubmitField('customrecord_ic_batches_queue', IC_BATCH_QUEUE, ['custrecord_icbq_status'], [ICBQ_STATUS_NOTSTARTED]); // Update the IC Batch Queue record so it will be picked up again
    	    	        	
    	    				var stStatus = nlapiScheduleScript(SCHED_SCRIPT_ID, null, params);
    	    				nlapiLogExecution('DEBUG', LOGGER_TITLE, 'Scheduled Script Status = ' + stStatus);
    	    	        	return;
    	    	        }
    	        		
    	        		var stICEntityMappingId = arrIntercompanyEntityMapping[i].getId();
    	        		var stNettingBankAcct = arrIntercompanyEntityMapping[i].getValue('custrecord_iem_netting_bank_account');
    	        		var stVendor = arrIntercompanyEntityMapping[i].getValue('custrecord_iem_vendor_account');
    	        		var stVendorRepresentsSubsidiary = nlapiLookupField('vendor', stVendor, 'representingsubsidiary');
    	        		nlapiLogExecution('DEBUG', LOGGER_TITLE, '***Intercompany Entity Mapping = ' + stICEntityMappingId
    	        				+ ' | Vendor = ' + stVendor 
    	        				+ ' | Netting Bank Account = ' + stNettingBankAcct
    	        				+ ' | Vendor Represents Subsidiary = ' + stVendorRepresentsSubsidiary + '***');
    	        		
    	        		// Execute a transaction saved search to retrieve the balance of the Vendor per Currency
    	        		var arrVendorTransactionsSummary = getVendorTransactionsSummary(stSubsidiary, stSrcTranPeriodEnd, stVendorTransSummarySearch, stVendor, stAcctsPayable);
    	        		if (arrVendorTransactionsSummary != null)
    	        	    {
    	        			// For each result returned by the transaction saved search
    	        			for (var j = 0; j < arrVendorTransactionsSummary.length; j++)
    	                    {
    	        				var intRemainingUsage = context.getRemainingUsage();
    	            			nlapiLogExecution('DEBUG', LOGGER_TITLE, 'Remaining Usage = '  + intRemainingUsage);   
    	            	        if (intRemainingUsage < USAGE_LIMIT_THRESHOLD)
    	            	        {
    	            	        	var params = new Array();
    	            	        	params['custscript_apr_current_user'] = stCurrentUser;
    	            	        	params['custscript_apr_src_tran_period'] = stSrcTranPeriod;
    	            	        	params['custscript_apr_netting_date'] = stNettingDate;
    	            	        	params['custscript_apr_accts_payable'] = stAcctsPayable;
    	            	        	params['custscript_apr_batch_id'] = stBatchId;
    	            	        	params['custscript_apr_vendor_trans_sum_search'] = stVendorTransSummarySearch;
    	            	        	params['custscript_apr_vendor_trans_det_search'] = stVendorTransDetailSearch;
    	            	        	params['custscript_apr_email_alert'] = stEmailAlert;
    	            	        	params['custscript_apr_send_email'] = bSendEmail;
    	            	        	params['custscript_apr_je_custom_form'] = stJECustomForm;
    	            	        	
    	            	        	nlapiSubmitField('customrecord_ic_batches_queue', IC_BATCH_QUEUE, ['custrecord_icbq_status'], [ICBQ_STATUS_NOTSTARTED]); // Update the IC Batch Queue record so it will be picked up again
    	            	        	
    	            				var stStatus = nlapiScheduleScript(SCHED_SCRIPT_ID, null, params);
    	            				nlapiLogExecution('DEBUG', LOGGER_TITLE, 'Scheduled Script Status = ' + stStatus);
    	            	        	return;
    	            	        }
    	        				
    	            			var stCurrency = arrVendorTransactionsSummary[j].getValue('currency', null, 'group');        			
    	            			var flTotalForeignAmount = forceParseFloat(arrVendorTransactionsSummary[j].getValue('fxamount', null, 'sum'));
    	            			nlapiLogExecution('DEBUG', LOGGER_TITLE, '**Currency = ' + stCurrency
    	                				+ ' | Total Foreign Amount = ' + flTotalForeignAmount + '**');     
    	            			
    	            			// If total Foreign Amount is positive
    	            			if (flTotalForeignAmount > 0)
    	            			{
    	            				// The script creates a Vendor Payment record
    	            				createVendorPayment(stVendor, stNettingBankAcct, stCurrency, stNettingDate, stAcctsPayable, stCostCenter, stProduct, stRegion, stSubsidiary, stSrcTranPeriodEnd, stVendorTransDetailSearch) 
    	            			}
    	            			// If total Foreign Amount is negative
    	            			else if (flTotalForeignAmount < 0)
    	            			{
    	            				// The script creates a Journal Entry record
    	            				var stJournalEntry = createJournalEntry(stVendor, stSubsidiary, stVendorRepresentsSubsidiary, stCurrency, stNettingDate, stAcctsPayable, stCostCenter, stProduct, stRegion, stNettingBankAcct, flTotalForeignAmount, stJECustomForm);
    	            				if (!isEmpty(stJournalEntry))
    	            				{
    	            					createVendorPayment(stVendor, stNettingBankAcct, stCurrency, stNettingDate, stAcctsPayable, stCostCenter, stProduct, stRegion, stSubsidiary, stSrcTranPeriodEnd, stVendorTransDetailSearch);            					
    	            				}            				
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
function createNettingLog(stCurrentUser, stSrcTranPeriod, stNettingDate, stAcctsPayable)
{
	var recNettingLog = nlapiCreateRecord('customrecord_netting_log');
	recNettingLog.setFieldValue('custrecord_nl_user_id', stCurrentUser);
	recNettingLog.setFieldValue('custrecord_nl_source_trans_period', stSrcTranPeriod);
	recNettingLog.setFieldValue('custrecord_nl_netting_date', stNettingDate);
	recNettingLog.setFieldValue('custrecord_nl_ap_account', stAcctsPayable);
	var stNettingLog = nlapiSubmitRecord(recNettingLog, true, true);
	nlapiLogExecution('DEBUG', LOGGER_TITLE, 'Successfully created Netting Log record. ID = ' + stNettingLog);
}


/**
 * Create Vendor Payment record
 * @param stVendor
 * @param stNettingBankAcct
 * @param stCurrency
 * @param stNettingDate
 * @param stAcctsPayable
 * @param stCostCenter
 * @param stProduct
 * @param stRegion
 * @param stSubsidiary
 * @param stSrcTranPeriodEnd
 * @param stVendorTransDetailSearch
 */
function createVendorPayment(stVendor, stNettingBankAcct, stCurrency, stNettingDate, stAcctsPayable, stCostCenter, stProduct, stRegion, stSubsidiary, stSrcTranPeriodEnd, stVendorTransDetailSearch)
{	
	try
	{
	nlapiLogExecution('DEBUG', 'INPUT VALUES', 'stVendor = ' + stVendor + ' stNettingBankAcct=' + stNettingBankAcct + ' stCurrency=' + stCurrency + ' stNettingDate=' + stNettingDate +  ' stAcctsPayable=' + stAcctsPayable + ' stCostCenter=' + stCostCenter + ' =stProduct' + stProduct + ' stRegion=' + stRegion + 'stSubsidiary=' + stSubsidiary +  ' stSrcTranPeriodEnd=' + stSrcTranPeriodEnd +  ' stVendorTransDetailSearch=' + stVendorTransDetailSearch);

	// The script initializes the Payee field to the value of Vendor from the Transaction search result
		var recVendorPayment = nlapiCreateRecord('vendorpayment', {recordmode:'dynamic', entity:stVendor});
		
		// The script sets the following fields:
		recVendorPayment.setFieldValue('apacct', stAcctsPayable); // Accounts Payable Account defined when running the routine
		recVendorPayment.setFieldValue('account', stNettingBankAcct); // Netting Bank Account from Intercompany Entity Mapping search result
		recVendorPayment.setFieldValue('currency', stCurrency); // Currency from Transaction search result
		recVendorPayment.setFieldValue('trandate', stNettingDate); // Netting Date defined when running the routine	
		recVendorPayment.setFieldValue('memo', 'Netting');
		recVendorPayment.setFieldValue('department', stCostCenter); // Cost Center defined when running the routine
		recVendorPayment.setFieldValue('class', stProduct); //Product defined when running the routine
		recVendorPayment.setFieldValue('location', stRegion); //Region defined when running the routine
			nlapiLogExecution('Error',LOGGER_TITLE,'Setting Accounts');
		// To set the apply line of the Vendor Payment, the script calls another Transaction saved search
		var bHasApplyLine = false;		
		var arrVendorTransactionsDetail = getTransactionsToApply(stSubsidiary, stCurrency, stSrcTranPeriodEnd, stVendor, stAcctsPayable, stVendorTransDetailSearch);
		nlapiLogExecution('Error',LOGGER_TITLE,'Transaction Search');
		if (arrVendorTransactionsDetail != null)
	    {
			// For each transaction Internal ID from the search result
			var intVendorTransactionsDetailLength = arrVendorTransactionsDetail.length;
			nlapiLogExecution('DEBUG', LOGGER_TITLE, 'Number of transactions to apply on Vendor Payment = ' + intVendorTransactionsDetailLength);
			nlapiLogExecution('Error',LOGGER_TITLE,'Vendor Payment');
			for (var i = 0; i < intVendorTransactionsDetailLength; i++)
	        {	
				var stTranInternalId = arrVendorTransactionsDetail[i].getId();
				var stTranType = arrVendorTransactionsDetail[i].getRecordType();
				nlapiLogExecution('DEBUG', LOGGER_TITLE, 'Saved Search Result [' + i + '] ' + stTranType + ' = ' + stTranInternalId);
				                    				
				// The script loops through the Vendor Payment apply line list
				var intVendorPaymentApplyCount = recVendorPayment.getLineItemCount('apply');
				for (var j = 1; j <= intVendorPaymentApplyCount; j++)
				{
					// If the doc field is equal to the Internal ID, the script sets the apply field to T
					var stDoc = recVendorPayment.getLineItemValue('apply', 'doc', j);
					if (stDoc == stTranInternalId)
					{
						recVendorPayment.selectLineItem('apply', j);
						recVendorPayment.setCurrentLineItemValue('apply', 'apply', 'T');
						recVendorPayment.commitLineItem('apply');
						nlapiLogExecution('DEBUG', LOGGER_TITLE, 'Line ' + j + ' is applied to the Vendor Payment');
						bHasApplyLine = true;
					}
				}
	        }	
				nlapiLogExecution('Error',LOGGER_TITLE,'Loop Lines');
	    }
		
		if (bHasApplyLine)
		{
			nlapiLogExecution('Error',LOGGER_TITLE,'Submitting Payment');
			var stVendorPayment = nlapiSubmitRecord(recVendorPayment, false, false);
			nlapiLogExecution('Error',LOGGER_TITLE,stVendorPayment);
			nlapiLogExecution('DEBUG', LOGGER_TITLE, 'Successfully created Vendor Payment= ' + stVendorPayment);
			
			//pshah 16-10-14 --> if vendor payment balanced the account field should not be updated otherwise will throw an error if it tries to.
			if (stVendorPayment!=0 && stVendorPayment!= null){
				nlapiSubmitField('vendorpayment', stVendorPayment, 'account', stNettingBankAcct);
				nlapiLogExecution('DEBUG', LOGGER_TITLE, 'Successfully updated Account of the Vendor Payment');
			}
		}
		else
		{
			nlapiLogExecution('DEBUG', LOGGER_TITLE, 'Vendor Payment will not be created because there are no transactions to apply'); 
		}
	}
	catch (error)
	{
		var stErrorMsg = 'Failed to create Vendor Payment for Vendor = ' + stVendor + ' ' + ' ' + stNettingBankAcct + ' ' + stAcctsPayable + ' ' + '. REASON = ' + error + '<br>';
		nlapiLogExecution('Error', LOGGER_TITLE, 'IC Bathes Queue = ' + IC_BATCH_QUEUE + ' | Error = ' + stErrorMsg);
		
		ERROR_MESSAGE = ERROR_MESSAGE + stErrorMsg;
	}
}


/**
 * Create Journal Entry record
 * @param stVendor
 * @param stSubsidiary
 * @param stVendorRepresentsSubsidiary
 * @param stCurrency
 * @param stNettingDate
 * @param stAcctsPayable
 * @param stCostCenter
 * @param stProduct
 * @param stRegion
 * @param stNettingBankAcct
 * @param flTotalForeignAmount
 * @param stJECustomForm
 * @returns
 */
function createJournalEntry(stVendor, stSubsidiary, stVendorRepresentsSubsidiary, stCurrency, stNettingDate, stAcctsPayable, stCostCenter, stProduct, stRegion, stNettingBankAcct, flTotalForeignAmount, stJECustomForm)
{
	var stJournalEntry = '';
	
	try
	{
		// The script creates a Journal Entry record
		var recJournalEntry = nlapiCreateRecord('journalentry', {recordmode:'dynamic', customform: CUSTOM_FORM_MISYS_JE});
		
		// The script sets the following header fields
		recJournalEntry.setFieldValue('customform', stJECustomForm);
		recJournalEntry.setFieldValue('subsidiary', stSubsidiary); // Subsidiary from the search result
		recJournalEntry.setFieldValue('tosubsidiary', stVendorRepresentsSubsidiary); // Represent Subsidiary on the Vendor record
		recJournalEntry.setFieldValue('currency', stCurrency); // Currency from Transaction search result
		recJournalEntry.setFieldValue('trandate', stNettingDate); // Netting Date defined when running the routine
		recJournalEntry.setFieldValue('apaccount', stAcctsPayable); // Accounts Payable Account defined when running the routine
		recJournalEntry.setFieldValue('department', stCostCenter); // Cost Center defined when running the routine
		recJournalEntry.setFieldValue('class', stProduct); //Product defined when running the routine
		recJournalEntry.setFieldValue('location', stRegion); //Region defined when running the routine
		
		// The script adds a credit line
		recJournalEntry.selectLineItem('line', 1);
		recJournalEntry.setCurrentLineItemValue('line', 'account', stNettingBankAcct); // Netting Bank Account from Intercompany Entity Mapping search result
		recJournalEntry.setCurrentLineItemValue('line', 'debit', flTotalForeignAmount * -1); // total Foreign Amount
		recJournalEntry.setCurrentLineItemValue('line', 'memo', 'Netting');
		recJournalEntry.setCurrentLineItemValue('line', 'department', stCostCenter); // Cost Center defined when running the routine
		recJournalEntry.setCurrentLineItemValue('line','class', stProduct); //Product defined when running the routine
		recJournalEntry.setCurrentLineItemValue('line','location', stRegion); //Region defined when running the routine
		recJournalEntry.commitLineItem('line');
		
		// The script adds a debit line
		recJournalEntry.selectLineItem('line', 2);
		recJournalEntry.setCurrentLineItemValue('line', 'account', stAcctsPayable); // Accounts Payable Account defined when running the routine
		recJournalEntry.setCurrentLineItemValue('line', 'credit', flTotalForeignAmount * -1); // total Foreign Amount
		recJournalEntry.setCurrentLineItemValue('line', 'memo', 'Netting');
		recJournalEntry.setCurrentLineItemValue('line', 'eliminate', 'T');
		recJournalEntry.setCurrentLineItemValue('line', 'entity', stVendor); // Vendor from the first Transaction search result
		recJournalEntry.setCurrentLineItemValue('line', 'department', stCostCenter); // Cost Center defined when running the routine
		recJournalEntry.setCurrentLineItemValue('line','class', stProduct); //Product defined when running the routine
		recJournalEntry.setCurrentLineItemValue('line','location', stRegion); //Region defined when running the routine
		recJournalEntry.commitLineItem('line');
		
		// The script submits the Journal Entry
		var stJournalEntry = nlapiSubmitRecord(recJournalEntry, true, true);
		nlapiLogExecution('DEBUG', LOGGER_TITLE, 'Successfully created Journal Entry. ID = ' + stJournalEntry);
	}
	catch (error)
	{
		var stErrorMsg = 'Failed to create Journal Entry for Vendor = ' + stVendor + '. REASON = ' + error + '<br>';
		nlapiLogExecution('DEBUG', LOGGER_TITLE, 'IC Bathes Queue = ' + IC_BATCH_QUEUE + ' | Error = ' + stErrorMsg);
		
		ERROR_MESSAGE = ERROR_MESSAGE + stErrorMsg;
	}	
	
	return stJournalEntry;
}


/**
 * Send email alert when the script finished processing a batch
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
 * Retrieve Intercompany Entity Mappings that are included in IC Netting
 * @returns
 */
function getIntercompanyEntityMapping()
{
	var arrFilters = [new nlobjSearchFilter('custrecord_iem_include_in_ic_netting', null, 'is', 'T'),
	                  new nlobjSearchFilter('custrecord_iem_vendor_account', null ,'noneof' ,'@NONE@'),
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
	                  new nlobjSearchFilter('custrecord_iem_vendor_account', null ,'noneof' ,'@NONE@'),
	                  new nlobjSearchFilter('custrecord_iem_netting_bank_account', null ,'noneof' ,'@NONE@'),
	                  new nlobjSearchFilter('isinactive', null ,'is' ,'F'),
	                  new nlobjSearchFilter('isinactive', 'custrecord_iem_subsidiary' ,'is','F')];
	
	var arrColumns = [new nlobjSearchColumn('custrecord_iem_netting_bank_account'),
                      new nlobjSearchColumn('custrecord_iem_vendor_account'),
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
	
	var arrColumns = [new nlobjSearchColumn('internalid'),
	                  new nlobjSearchColumn('custrecord_icbq_batch_id').setSort(),
                      new nlobjSearchColumn('custrecord_icbq_source_subsidiary')];
	
    var arrResults = nlapiSearchRecord('customrecord_ic_batches_queue', null, arrFilters, arrColumns);    
    return arrResults;
}


/**
 * Execution Vendor Transactions Summary Saved Search with additional filter for subsidiary and date
 * @param stSubsidiary
 * @param stSrcTranPeriodEnd
 * @param stVendorTransSummarySearch
 * @param stVendor
 * @returns
 */
function getVendorTransactionsSummary(stSubsidiary, stSrcTranPeriodEnd, stVendorTransSummarySearch, stVendor, stAcctsPayable)
{
    var arrFilters = [new nlobjSearchFilter('subsidiary', null, 'anyof', stSubsidiary),
                      new nlobjSearchFilter('trandate', null, 'onorbefore', stSrcTranPeriodEnd),
                      new nlobjSearchFilter('entity', null, 'anyof', stVendor),
					  new nlobjSearchFilter('account', null, 'anyof', stAcctsPayable)];
    
    var arrResults = nlapiSearchRecord('transaction', stVendorTransSummarySearch, arrFilters);
    
    return arrResults;
}


/**
 * Search for transactions to apply on Payment record
 * @param stSubsidiary
 * @param stCurrency
 * @param stSrcTranPeriodEnd
 * @param stVendor
 * @param stVendorTransDetailSearch
 * @returns
 */
function getTransactionsToApply(stSubsidiary, stCurrency, stSrcTranPeriodEnd, stVendor, stAcctsPayable, stVendorTransDetailSearch)
{
    var arrFilters = [new nlobjSearchFilter('subsidiary', null, 'anyof', stSubsidiary),
                      new nlobjSearchFilter('trandate', null, 'onorbefore', stSrcTranPeriodEnd),
                      new nlobjSearchFilter('entity', null, 'anyof', stVendor),
                      new nlobjSearchFilter('currency', null, 'anyof', stCurrency),
                      new nlobjSearchFilter('account', null, 'anyof', stAcctsPayable)]; //18/08/14 dicasiano@netsuite.com
    
    var arrResults = nlapiSearchRecord('transaction', stVendorTransDetailSearch, arrFilters);
    
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
