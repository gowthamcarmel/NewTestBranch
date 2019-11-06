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

var LOGGER_TITLE = 'Netting Balances Routine';

var ICBQ_STATUS_NOTSTARTED = 'Not Started';
var ICBQ_STATUS_ONGOING = 'Ongoing';
var ICBQ_STATUS_COMPLETED = 'Completed';
var ICBQ_STATUS_FAILED = 'Error';
var ICBQ_FRD_NO = '0010 - Net Balances Routine';

var SCHED_SCRIPT_ID = 'customscript_net_balance_routine_sched';
var SCHED_SCRIPT_DEPLOYMENT_ID = 'customdeploy_net_balance_routine_sched';
var MAX_QUEUE = 5;

var IC_BATCH_QUEUE = '';

var USAGE_LIMIT_THRESHOLD = 200;

var ERROR_MESSAGE = '';

/**
 * Main suitelet for AP Balances Routine
 * @author Aurel Shenne Sinsin
 * @version 1.0
 */
function suitelet_nettingBalancesRoutine()
{ 
    try
    {  
    	nlapiLogExecution('DEBUG', LOGGER_TITLE, '>>Entry<<');
    	
    	var stStage = request.getParameter('custpage_stage');
		nlapiLogExecution('DEBUG', LOGGER_TITLE, 'Stage = ' + stStage);
		
    	var form = nlapiCreateForm('Netting Balances Routine');
    	
    	switch(stStage)
        {
        	case 'parametersSubmitted':
        		form = displayConfirmMessage(request, response, form);
        		break;
        	case 'messageConfirmed':
        		form = callNettingBalancesRoutine(request, response, form);
        		break;
        	default:
        		form = displayParameters(request, response, form);       	 
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
	var stICARAcct = context.getSetting('SCRIPT', 'custscript_slnet_ic_ar_acct');
    var stICAPAcct = context.getSetting('SCRIPT', 'custscript_slnet_ic_ap_acct');
    var stEmailAlert = context.getSetting('SCRIPT', 'custscript_slnet_email_alert');
    var bSendEmail = context.getSetting('SCRIPT', 'custscript_slnet_send_email');
    var stJECustomForm = context.getSetting('SCRIPT', 'custscript_slnet_je_custom_form');
    var stSavedSearch = context.getSetting('SCRIPT', 'custscript_slnet_saved_search');
    nlapiLogExecution('DEBUG', LOGGER_TITLE, 'Script Parameters: IC AR Account = ' + stICARAcct
    		+ ' | IC AP Account = ' + stICAPAcct
    		+ ' | Email Alert = ' + stEmailAlert
    		+ ' | Send Email = ' + bSendEmail
    		+ ' | JE Custom Form = ' + stJECustomForm
    		+ ' | Saved Search = ' + stSavedSearch);
    if (isEmpty(stEmailAlert) || isEmpty(stICARAcct) || isEmpty(stICAPAcct) || isEmpty(stJECustomForm) || isEmpty(stSavedSearch))
    {	
    	throw nlapiCreateError('99999', 'Please enter values on the script parameter');
    }
		
	form = nlapiCreateForm('Netting Balances Routine');
	form.setScript('customscript_validate_posting_date_on_nr');
	
	var fldStage = form.addField('custpage_stage', 'text', 'Stage');
	fldStage.setDefaultValue('parametersSubmitted');
	fldStage.setDisplayType('hidden');
	
	// Add hidden fields to the form to set the values of the script parameter
	form.addField('custpage_ar_account', 'text', 'AR Account').setDisplayType('hidden').setDefaultValue(stICARAcct);
	form.addField('custpage_ap_account', 'text', 'AP Account').setDisplayType('hidden').setDefaultValue(stICAPAcct);
	form.addField('custpage_email_alert', 'text', 'Email Alert').setDisplayType('hidden').setDefaultValue(stEmailAlert);
	form.addField('custpage_send_email', 'text', 'Send Email').setDisplayType('hidden').setDefaultValue(bSendEmail);
	form.addField('custpage_je_custom_form', 'text', 'Send Email').setDisplayType('hidden').setDefaultValue(stJECustomForm);
	form.addField('custpage_saved_search', 'text', 'Saved Search').setDisplayType('hidden').setDefaultValue(stSavedSearch);
	
	// Create the parameter fields
	form.addField('custpage_balance_as_of', 'date', 'Balance as of').setMandatory(true).setDefaultValue(nlapiDateToString(new Date()));
	form.addField('custpage_posting_date', 'date', 'Posting Date').setMandatory(true);
	
	// Create the following buttons: Save, Cancel
	form.addSubmitButton('Save');
	form.addButton('custpage_cancel_button', 'Cancel', 'window.location=\'/app/center/card.nl?sc=-29\'');
	
	response.writePage(form);
}


/**
 * A client side script to ensure that the Posting Date is not less than the Balance as of
 * @param stType
 * @param stName
 * @param intLineNum
 * @returns {Boolean}
 */
function validateField_validatePostingDate(stType, stName, intLineNum)
{
	try
	{		
		// Retrieve the value of Balance as of and Posting Date fields
		var dBalanceAsOf = nlapiStringToDate(nlapiGetFieldValue('custpage_balance_as_of'));
		var stPostingDate = nlapiGetFieldValue('custpage_posting_date');	
		if (!isEmpty(stPostingDate))
		{
			// if Posting Date is less than Balance as of, display an alert message and set Balance as of field to blank
			var dPostingDate = nlapiStringToDate(stPostingDate);
			if (dPostingDate < dBalanceAsOf)
			{
				alert('Posting Date should not be later than Balance as of');
				nlapiSetFieldValue('custpage_posting_date', '');
				return false;				
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


/**
 * Display the confirm message to ensure that the user performed the intercompany reconciliation
 * @param request
 * @param response
 * @param form
 */
function displayConfirmMessage(request, response, form)
{
	form = nlapiCreateForm('Netting Balances Routine');
	
	var fldStage = form.addField('custpage_stage', 'text', 'Stage');
	fldStage.setDefaultValue('messageConfirmed');
	fldStage.setDisplayType('hidden');
	
	// Add hidden fields to the form to set the values of the script parameter which was set on the form
	form.addField('custpage_ar_account', 'text', 'AR Account').setDisplayType('hidden').setDefaultValue(request.getParameter('custpage_ar_account'));
	form.addField('custpage_ap_account', 'text', 'AP Account').setDisplayType('hidden').setDefaultValue(request.getParameter('custpage_ap_account'));
	form.addField('custpage_email_alert', 'text', 'Email Alert').setDisplayType('hidden').setDefaultValue(request.getParameter('custpage_email_alert'));	
	form.addField('custpage_send_email', 'text', 'Send Email').setDisplayType('hidden').setDefaultValue(request.getParameter('custpage_send_email'));
	form.addField('custpage_je_custom_form', 'text', 'Send Email').setDisplayType('hidden').setDefaultValue(request.getParameter('custpage_je_custom_form'));
	form.addField('custpage_saved_search', 'text', 'Send Email').setDisplayType('hidden').setDefaultValue(request.getParameter('custpage_saved_search'));
		
	// Add hidden fields to the form to set the values entered by the user on the suitelet form	
	form.addField('custpage_balance_as_of', 'date', 'Balance as of').setDisplayType('hidden').setMandatory(true).setDefaultValue(request.getParameter('custpage_balance_as_of'));
	form.addField('custpage_posting_date', 'date', 'Posting Date').setDisplayType('hidden').setMandatory(true).setDefaultValue(request.getParameter('custpage_posting_date'));
	
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
 * Calls the Netting Balances Routine Scheduled script and redirect the user back to the Suitelet main page
 * @param request
 * @param response
 * @param form
 */
function callNettingBalancesRoutine(request, response, form)
{	
	var context = nlapiGetContext();
	    
    var stCurrentUser = nlapiGetUser();
	nlapiLogExecution('DEBUG', LOGGER_TITLE, 'Current User = ' + stCurrentUser);
	
	var stARAccount = request.getParameter('custpage_ar_account');
    var stAPAccount = request.getParameter('custpage_ap_account');
	var stEmailAlert = request.getParameter('custpage_email_alert');
    var bSendEmail = request.getParameter('custpage_send_email');	
	var stBalanceAsOf = request.getParameter('custpage_balance_as_of');
	var stPostingDate = request.getParameter('custpage_posting_date');
	var stJECustomForm = request.getParameter('custpage_je_custom_form');
	var stSavedSearch = request.getParameter('custpage_saved_search');
	
	var params = new Array();
	params['custscript_net_ar_account'] = stARAccount;
	params['custscript_net_ap_account'] = stAPAccount;
	params['custscript_net_email_alert'] = stEmailAlert;
	params['custscript_net_send_email'] = bSendEmail;
	params['custscript_net_current_user'] = stCurrentUser;
	params['custscript_net_balance_as_of'] = stBalanceAsOf;
	params['custscript_net_posting_date'] = stPostingDate;
	params['custscript_net_je_custom_form'] = stJECustomForm;
	params['custscript_net_saved_search'] = stSavedSearch;
	
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
					params['custscript_net_batch_id'] = stICBatchId;
					
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
 * Scheduled script for Netting Balances Routine
 * @returns {Boolean}
 */
function scheduled_netBalancesRoutine()
{    
    try
    {    	
    	nlapiLogExecution('DEBUG', LOGGER_TITLE, '>>Entry<<');
    	
    	var context = nlapiGetContext();
    	
    	// Retrieve the script parameters passed by the suitelet
        var stEmailAlert = context.getSetting('SCRIPT', 'custscript_net_email_alert');        
        var bSendEmail = context.getSetting('SCRIPT', 'custscript_net_send_email');
        var stICARAcct = context.getSetting('SCRIPT', 'custscript_net_ar_account');
        var stICAPAcct = context.getSetting('SCRIPT', 'custscript_net_ap_account');
        var stBatchId = context.getSetting('SCRIPT', 'custscript_net_batch_id');
        var stCurrentUser = context.getSetting('SCRIPT', 'custscript_net_current_user');
    	var stBalanceAsOf = context.getSetting('SCRIPT', 'custscript_net_balance_as_of');
    	var stPostingDate = context.getSetting('SCRIPT', 'custscript_net_posting_date');
    	var stJECustomForm = context.getSetting('SCRIPT', 'custscript_net_je_custom_form');
    	var stSavedSearch = context.getSetting('SCRIPT', 'custscript_net_saved_search');
        nlapiLogExecution('DEBUG', LOGGER_TITLE, 'Script Parameters: IC AR Account = ' + stICARAcct
        		+ ' | IC AP Account = ' + stICAPAcct
        		+ ' | Email Alert = ' + stEmailAlert
        		+ ' | Send Email = ' + bSendEmail
        		+ ' | Batch ID = ' + stBatchId
        		+ ' | Current User = ' + stCurrentUser
        		+ ' | Balance as of = ' + stBalanceAsOf 
        		+ ' | Posting Date = ' + stPostingDate
        		+ ' | JE Custom Form = ' + stJECustomForm
        		+ ' | Saved Search = ' + stSavedSearch);
        
        
        if (isEmpty(stICARAcct) || isEmpty(stICAPAcct) || isEmpty(stEmailAlert) || isEmpty(bSendEmail) || isEmpty(stBatchId) || isEmpty(stCurrentUser) || isEmpty(stBalanceAsOf) || isEmpty(stPostingDate) || isEmpty(stJECustomForm) || isEmpty(stSavedSearch))
    	{
    		nlapiLogExecution('DEBUG', LOGGER_TITLE, 'Parameters are empty. >>Exit<<');
    		return;
    	}
    			
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
    	        	params['custscript_net_current_user'] = stCurrentUser;
    	        	params['custscript_net_balance_as_of'] = stBalanceAsOf;
    	        	params['custscript_net_posting_date'] = stPostingDate;
    	        	params['custscript_net_batch_id'] = stBatchId;
    	        	params['custscript_net_ar_account'] = stARAccount;
    	        	params['custscript_net_ap_account'] = stAPAccount;
    	        	params['custscript_net_email_alert'] = stEmailAlert;
    	        	params['custscript_net_send_email'] = bSendEmail;
    	        	params['custscript_net_je_custom_form'] = stJECustomForm;
    	        	params['custscript_net_saved_search'] = stSavedSearch;
    	        	
    	        	nlapiSubmitField('customrecord_ic_batches_queue', IC_BATCH_QUEUE, ['custrecord_icbq_status'], [ICBQ_STATUS_NOTSTARTED]); // Update the IC Batch Queue record so it will be picked up again
    	        	
    				var stStatus = nlapiScheduleScript(SCHED_SCRIPT_ID, null, params);
    				nlapiLogExecution('DEBUG', LOGGER_TITLE, 'Scheduled Script Status = ' + stStatus);
    	        	return;
    	        }    			
    			
    	        ERROR_MESSAGE = '';
    	        IC_BATCH_QUEUE = arrICBatchesQueue[z].getId();
    			var stSubsidiary = arrICBatchesQueue[z].getValue('custrecord_icbq_source_subsidiary');
    			nlapiLogExecution('DEBUG', LOGGER_TITLE, '***IC Batch Queue = ' + IC_BATCH_QUEUE + ' | Subsidiary = ' + stSubsidiary + '***');
    			
    			// Update the Status and Date Timestamp fields of the IC Batches Queue record
    			var stCurrentTimestamp = getCurrentTimestamp();
    			nlapiLogExecution('DEBUG', LOGGER_TITLE, 'Current Timestamp = ' + stCurrentTimestamp);    			
    			
    			nlapiSubmitField('customrecord_ic_batches_queue', IC_BATCH_QUEUE, ['custrecord_icbq_status', 'custrecord_icbq_date_timestamp'], [ICBQ_STATUS_ONGOING, stCurrentTimestamp]);
    			    			
    			// The script call an Intercompany Entity Mapping search to retrieve the accounts and parent subsidiary
    	    	var arrIntercompanyEntityMapping = getIntercompanyEntityMappingBySubsidiary(stSubsidiary);
    	    	if (arrIntercompanyEntityMapping != null)
    	        {	
    	    		var stSubsidiary = arrIntercompanyEntityMapping[0].getValue('custrecord_iem_subsidiary', null, 'group');
	        		var stCurrency = nlapiLookupField('subsidiary', stSubsidiary, 'currency');
	        		var stNettingBankAcct = arrIntercompanyEntityMapping[0].getValue('custrecord_iem_netting_bank_account', null, 'group');
	        		var stNettingBalancingAcct = arrIntercompanyEntityMapping[0].getValue('custrecord_iem_netting_balancing_account', null, 'group');
	        		var stParentSubsidiary = arrIntercompanyEntityMapping[0].getValue('custrecord_iem_parent_subsidiary', null, 'group');
	        		nlapiLogExecution('DEBUG', LOGGER_TITLE, 'Subsidiary = ' + stSubsidiary
	        				+ ' | Currency = ' + stCurrency
	        				+ ' | Netting Bank Account = ' + stNettingBankAcct
	        				+ ' | Netting Balancing Account = ' + stNettingBalancingAcct
	        				+ ' | Parent Subsidiary = ' + stParentSubsidiary);
	        		
	        		var arrSubsidiary = nlapiLookupField('subsidiary', stSubsidiary, ['custrecord_default_cost_center', 'custrecord_default_region', 'custrecord_default_product']);
	    			var stCostCenter = arrSubsidiary.custrecord_default_cost_center;
	    			var stRegion = arrSubsidiary.custrecord_default_region;
	    			var stProduct = arrSubsidiary.custrecord_default_product;
	    			nlapiLogExecution('DEBUG', LOGGER_TITLE, 'Cost Centre = ' + stCostCenter + ' | Region = ' + stRegion + ' | Product = ' + stProduct);	        		
	        		
	        		var stAPCustomer = '';
	        		var stAPVendor = '';        		
	        		var arrAPEntities = getAPEntitiesForICJE(stSubsidiary, stParentSubsidiary);
	        		if (arrAPEntities != null)
	        		{
	        			stAPCustomer = arrAPEntities[0].getValue('custrecord_iem_customer_account');
	        			stAPVendor = arrAPEntities[0].getValue('custrecord_iem_vendor_account');
	        		}
	        		
	        		var stCustomer = '';
	        		var stVendor = '';
	        		var arrEntities = getEntitiesForICJE(stSubsidiary, stParentSubsidiary);
	        		if (arrEntities != null)
	        		{
	        			stCustomer = arrEntities[0].getValue('custrecord_iem_customer_account');
	        			stVendor = arrEntities[0].getValue('custrecord_iem_vendor_account');
	        		}
	        		        		        		
	        		nlapiLogExecution('DEBUG', LOGGER_TITLE, 'AP Vendor = ' + stAPVendor 
	        				+ ' | AP Customer = ' + stAPCustomer
	        				+ ' | Vendor = ' + stVendor
	        				+ ' | Customer = ' + stCustomer);
	        		
	        		// The script calls a transaction saved search to retrieve balance for the Subsidiary
	        		var arrPaymentTransactionsSummary = getPaymentTransactionsSummary(stSavedSearch, stSubsidiary, stBalanceAsOf, stNettingBankAcct)
	        		if (arrPaymentTransactionsSummary != null)
	        	    {
	        			var flTotalForeignAmount = forceParseFloat(arrPaymentTransactionsSummary[0].getValue('amount', null, 'sum'));
	        			nlapiLogExecution('DEBUG', LOGGER_TITLE, 'Total Foreign Amount = ' + flTotalForeignAmount);
            			if (flTotalForeignAmount == 0)
            			{            				
            				nlapiLogExecution('DEBUG', LOGGER_TITLE, 'There is no balance for the subsidiary');
            			}
            			else
            			{
            				// If amount is not 0, the script creates an IC JE
            				flTotalForeignAmount = roundToCurrencyPrecision(flTotalForeignAmount, stCurrency); // added 08/29 to handle DPs
            				nlapiLogExecution('DEBUG', LOGGER_TITLE, 'Total Foreign Amount (after DP handling) = ' + flTotalForeignAmount);
            				createJournalEntry(stSubsidiary, stCurrency, stVendor, stCustomer, stAPVendor, stAPCustomer, stParentSubsidiary, stNettingBankAcct, stNettingBalancingAcct, flTotalForeignAmount, stICARAcct, stICAPAcct, stPostingDate, stJECustomForm, stCostCenter, stRegion, stProduct);            				
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
 * Create Journal Entry record
 * @param stSubsidiary
 * @param stCurrency
 * @param stVendor
 * @param stCustomer
 * @param stParentSubsidiary
 * @param stNettingBankAcct
 * @param stNettingBalancingAcct
 * @param flTotalForeignAmount
 * @param stICARAcct
 * @param stICAPAcct
 * @param stPostingDate
 * @param stJECustomForm
 * @returns
 */
function createJournalEntry(stSubsidiary, stCurrency, stVendor, stCustomer, stAPVendor, stAPCustomer, stParentSubsidiary, stNettingBankAcct, stNettingBalancingAcct, flTotalForeignAmount, stICARAcct, stICAPAcct, stPostingDate, stJECustomForm, stCostCenter, stRegion, stProduct)
{	
	try
	{
		// The script creates a Journal Entry record
		var recJournalEntry = nlapiCreateRecord('intercompanyjournalentry', {recordmode:'dynamic'});
		
		// The script sets the following header fields
		recJournalEntry.setFieldValue('customform', stJECustomForm);
		recJournalEntry.setFieldValue('subsidiary', stSubsidiary); // Subsidiary from the search result
		recJournalEntry.setFieldValue('tosubsidiary', stParentSubsidiary); // Parent Subsidiary from the search result
		recJournalEntry.setFieldValue('currency', stCurrency); // Base subsidiary of the source subsidiary
		recJournalEntry.setFieldValue('trandate', stPostingDate); // Posting Date defined when running the routine
		
		if (flTotalForeignAmount > 0)
		{	
			// The script adds a credit line for the Subsidiary
			nlapiLogExecution('DEBUG', LOGGER_TITLE, 'Adding credit line 1 with Account = ' + stNettingBankAcct + ' | Subsidiary = ' + stSubsidiary);
			recJournalEntry.selectLineItem('line', 1);
			recJournalEntry.setCurrentLineItemValue('line', 'linesubsidiary', stSubsidiary);
			recJournalEntry.setCurrentLineItemValue('line', 'account', stNettingBankAcct); // Netting Bank Account from Intercompany Entity Mapping search result
			recJournalEntry.setCurrentLineItemValue('line', 'credit', flTotalForeignAmount); // total Foreign Amount
			recJournalEntry.setCurrentLineItemValue('line', 'department', stCostCenter);
			recJournalEntry.setCurrentLineItemValue('line', 'location', stRegion);
			recJournalEntry.setCurrentLineItemValue('line', 'class', stProduct);
			
			recJournalEntry.commitLineItem('line');
			
			// The script adds a debit line for the subsidiary
			nlapiLogExecution('DEBUG', LOGGER_TITLE, 'Adding debit line 2 with Account = ' + stICARAcct + ' | Subsidiary = ' + stSubsidiary + ' | Customer = ' + stCustomer);
			recJournalEntry.selectLineItem('line', 2);
			recJournalEntry.setCurrentLineItemValue('line', 'linesubsidiary', stSubsidiary);
			recJournalEntry.setCurrentLineItemValue('line', 'account', stICARAcct); // IC AR account from script parameter
			recJournalEntry.setCurrentLineItemValue('line', 'entity', stAPCustomer); // Customer from the search result
			recJournalEntry.setCurrentLineItemValue('line', 'eliminate', 'T');
			recJournalEntry.setCurrentLineItemValue('line', 'debit', flTotalForeignAmount); // total Foreign Amount
			recJournalEntry.setCurrentLineItemValue('line', 'department', stCostCenter);
			recJournalEntry.setCurrentLineItemValue('line', 'location', stRegion);
			recJournalEntry.setCurrentLineItemValue('line', 'class', stProduct);
			recJournalEntry.commitLineItem('line');
			
			// The script adds a credit line for the Parent Subsidiary
			nlapiLogExecution('DEBUG', LOGGER_TITLE, 'Adding credit line 3 with Account = ' + stICAPAcct + ' | Subsidiary = ' + stParentSubsidiary + ' | Vendor = ' + stVendor);
			recJournalEntry.selectLineItem('line', 3);
			recJournalEntry.setCurrentLineItemValue('line', 'linesubsidiary', stParentSubsidiary);
			recJournalEntry.setCurrentLineItemValue('line', 'account', stICAPAcct); // IC AP account from script parameter
			recJournalEntry.setCurrentLineItemValue('line', 'entity', stVendor); // Vendor from the search result
			recJournalEntry.setCurrentLineItemValue('line', 'eliminate', 'T');
			recJournalEntry.setCurrentLineItemValue('line', 'credit', flTotalForeignAmount); // total Foreign Amount
			recJournalEntry.setCurrentLineItemValue('line', 'department', stCostCenter);
			recJournalEntry.setCurrentLineItemValue('line', 'location', stRegion);
			recJournalEntry.setCurrentLineItemValue('line', 'class', stProduct);
			recJournalEntry.commitLineItem('line');
			
			// The script adds a debit line for the Parent Subsidiary
			nlapiLogExecution('DEBUG', LOGGER_TITLE, 'Adding debit line 4 with Account = ' + stNettingBalancingAcct + ' | Subsidiary = ' + stParentSubsidiary);
			recJournalEntry.selectLineItem('line', 4);
			recJournalEntry.setCurrentLineItemValue('line', 'linesubsidiary', stParentSubsidiary);
			recJournalEntry.setCurrentLineItemValue('line', 'account', stNettingBalancingAcct); // Netting Bank Account from Intercompany Entity Mapping search result
			recJournalEntry.setCurrentLineItemValue('line', 'debit', flTotalForeignAmount); // total Foreign Amount
			recJournalEntry.setCurrentLineItemValue('line', 'department', stCostCenter);
			recJournalEntry.setCurrentLineItemValue('line', 'location', stRegion);
			recJournalEntry.setCurrentLineItemValue('line', 'class', stProduct);
			recJournalEntry.commitLineItem('line');
		}
		else
		{
			flTotalForeignAmount = flTotalForeignAmount * -1;
			
			// The script adds a debit line for the Subsidiary
			nlapiLogExecution('DEBUG', LOGGER_TITLE, 'Adding debit line 1 with Account = ' + stNettingBankAcct + ' | Subsidiary = ' + stSubsidiary);
			recJournalEntry.selectLineItem('line', 1);
			recJournalEntry.setCurrentLineItemValue('line', 'linesubsidiary', stSubsidiary);
			recJournalEntry.setCurrentLineItemValue('line', 'account', stNettingBankAcct); // Netting Bank Account from Intercompany Entity Mapping search result
			recJournalEntry.setCurrentLineItemValue('line', 'debit', flTotalForeignAmount); // total Foreign Amount
			recJournalEntry.setCurrentLineItemValue('line', 'department', stCostCenter);
			recJournalEntry.setCurrentLineItemValue('line', 'location', stRegion);
			recJournalEntry.setCurrentLineItemValue('line', 'class', stProduct);
			recJournalEntry.commitLineItem('line');
			
			// The script adds a credit line for the subsidiary
			nlapiLogExecution('DEBUG', LOGGER_TITLE, 'Adding credit line 2 with Account = ' + stICAPAcct + ' | Subsidiary = ' + stSubsidiary + ' | Vendor = ' + stVendor);
			recJournalEntry.selectLineItem('line', 2);
			recJournalEntry.setCurrentLineItemValue('line', 'linesubsidiary', stSubsidiary);
			recJournalEntry.setCurrentLineItemValue('line', 'account', stICAPAcct); // IC AP account from script parameter
			recJournalEntry.setCurrentLineItemValue('line', 'entity', stAPVendor); // Vendor from the search result
			recJournalEntry.setCurrentLineItemValue('line', 'eliminate', 'T');
			recJournalEntry.setCurrentLineItemValue('line', 'credit', flTotalForeignAmount); // total Foreign Amount
			recJournalEntry.setCurrentLineItemValue('line', 'department', stCostCenter);
			recJournalEntry.setCurrentLineItemValue('line', 'location', stRegion);
			recJournalEntry.setCurrentLineItemValue('line', 'class', stProduct);
			recJournalEntry.commitLineItem('line');
			
			// The script adds a debit line for the Parent Subsidiary
			nlapiLogExecution('DEBUG', LOGGER_TITLE, 'Adding debit line 3 with Account = ' + stICARAcct + ' | Subsidiary = ' + stParentSubsidiary + ' | Customer = ' + stCustomer);
			recJournalEntry.selectLineItem('line', 3);
			recJournalEntry.setCurrentLineItemValue('line', 'linesubsidiary', stParentSubsidiary);
			recJournalEntry.setCurrentLineItemValue('line', 'account', stICARAcct); // IC AR account from script parameter
			recJournalEntry.setCurrentLineItemValue('line', 'entity', stCustomer); // Customer from the search result
			recJournalEntry.setCurrentLineItemValue('line', 'eliminate', 'T');
			recJournalEntry.setCurrentLineItemValue('line', 'debit', flTotalForeignAmount); // total Foreign Amount
			recJournalEntry.setCurrentLineItemValue('line', 'department', stCostCenter);
			recJournalEntry.setCurrentLineItemValue('line', 'location', stRegion);
			recJournalEntry.setCurrentLineItemValue('line', 'class', stProduct);
			recJournalEntry.commitLineItem('line');
			
			// The script adds a credit line for the Parent Subsidiary
			nlapiLogExecution('DEBUG', LOGGER_TITLE, 'Adding credit line 4 with Account = ' + stNettingBalancingAcct + ' | Subsidiary = ' + stParentSubsidiary);
			recJournalEntry.selectLineItem('line', 4);
			recJournalEntry.setCurrentLineItemValue('line', 'linesubsidiary', stParentSubsidiary);
			recJournalEntry.setCurrentLineItemValue('line', 'account', stNettingBalancingAcct); // Netting Bank Account from Intercompany Entity Mapping search result
			recJournalEntry.setCurrentLineItemValue('line', 'credit', flTotalForeignAmount); // total Foreign Amount
			recJournalEntry.setCurrentLineItemValue('line', 'department', stCostCenter);
			recJournalEntry.setCurrentLineItemValue('line', 'location', stRegion);
			recJournalEntry.setCurrentLineItemValue('line', 'class', stProduct);
			recJournalEntry.commitLineItem('line');
		}
		
		// The script submits the Journal Entry
		var stJournalEntry = nlapiSubmitRecord(recJournalEntry, true, true);
		nlapiLogExecution('DEBUG', LOGGER_TITLE, 'Successfully created Intercompany Journal Entry. ID = ' + stJournalEntry);
	}
	catch (error)
	{
		var stErrorMsg = 'Failed to create Journal Entry for Subsidiary = ' + stSubsidiary  + '. REASON = ' + error + '<br>';
		nlapiLogExecution('DEBUG', LOGGER_TITLE, 'IC Bathes Queue = ' + IC_BATCH_QUEUE + ' | Error = ' + stErrorMsg);
		
		ERROR_MESSAGE = ERROR_MESSAGE + stErrorMsg; 
	}
}


/**
 * Retrieve Intercompany Entity Mappings that are included in IC Netting 
 * @returns
 */
function getIntercompanyEntityMapping()
{
	 var arrFilters = [new nlobjSearchFilter('custrecord_iem_include_in_ic_netting', null, 'is', 'T'),
	                   new nlobjSearchFilter('isinactive', null ,'is' ,'F'),
	                   new nlobjSearchFilter('custrecord_iem_netting_bank_account', null ,'noneof','@NONE@'),
	                   new nlobjSearchFilter('custrecord_iem_netting_balancing_account', null ,'noneof','@NONE@'),
	                   new nlobjSearchFilter('custrecord_iem_parent_subsidiary', null ,'noneof','@NONE@'),
	                   new nlobjSearchFilter('isinactive', 'custrecord_iem_parent_subsidiary' ,'is','F'),
	                   new nlobjSearchFilter('isinactive', 'custrecord_iem_subsidiary' ,'is','F')];
		
	 var arrColumns = [new nlobjSearchColumn('custrecord_iem_subsidiary', null, 'group'),
	                   new nlobjSearchColumn('custrecord_iem_netting_bank_account', null, 'group'),
	                   new nlobjSearchColumn('custrecord_iem_netting_balancing_account', null, 'group'),
	                   new nlobjSearchColumn('custrecord_iem_parent_subsidiary', null, 'group')];
	 
	 var arrResults = nlapiSearchRecord('customrecord_intercompany_entity_mapping', null, arrFilters, arrColumns);    
	 return arrResults;
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
 * Retrieve Intercompany Entity Mappings that are included in IC Netting for a certain subsidiary
 * @param stSubsidiary
 * @returns
 */
function getIntercompanyEntityMappingBySubsidiary(stSubsidiary)
{
	var arrFilters = [new nlobjSearchFilter('custrecord_iem_include_in_ic_netting', null, 'is', 'T'),
	                  new nlobjSearchFilter('custrecord_iem_subsidiary', null, 'anyof', stSubsidiary),
	                  new nlobjSearchFilter('isinactive', null ,'is' ,'F'),
	                  new nlobjSearchFilter('custrecord_iem_netting_bank_account', null ,'noneof','@NONE@'),
	                  new nlobjSearchFilter('custrecord_iem_netting_balancing_account', null ,'noneof','@NONE@'),
	                  new nlobjSearchFilter('custrecord_iem_parent_subsidiary', null ,'noneof','@NONE@'),
	                  new nlobjSearchFilter('isinactive', 'custrecord_iem_parent_subsidiary' ,'is','F'),
	                  new nlobjSearchFilter('isinactive', 'custrecord_iem_subsidiary' ,'is','F')];
	
	var arrColumns = [new nlobjSearchColumn('custrecord_iem_subsidiary', null, 'group'),
	                  new nlobjSearchColumn('custrecord_iem_netting_bank_account', null, 'group'),
	                  new nlobjSearchColumn('custrecord_iem_netting_balancing_account', null, 'group'),
	                  new nlobjSearchColumn('custrecord_iem_parent_subsidiary', null, 'group')];
    
    var arrResults = nlapiSearchRecord('customrecord_intercompany_entity_mapping', null, arrFilters, arrColumns);    
    return arrResults;
}


/**
 * Get AP Vendor and Customer for IC JE
 * In the Source Subsidiary JE line, AP Vendor and AP Customer are identified by filtering the mapping table by Subsidiary = Source Subsidiary and Represents Subsidiary = Parent Subsidiary
 * @param stSubsidiary
 * @param stParentSubsidiary
 * @returns
 */
function getAPEntitiesForICJE(stSubsidiary, stParentSubsidiary)
{
	var arrFilters = [new nlobjSearchFilter('custrecord_iem_subsidiary', null ,'anyof' , stSubsidiary),
	                  new nlobjSearchFilter('custrecord_iem_represents_subsidiary', null ,'anyof' , stParentSubsidiary),
	                  new nlobjSearchFilter('isinactive', null ,'is' ,'F')];
		
	var arrColumns = [new nlobjSearchColumn('custrecord_iem_customer_account'),
	                  new nlobjSearchColumn('custrecord_iem_vendor_account')];
	 
	var arrResults = nlapiSearchRecord('customrecord_intercompany_entity_mapping', null, arrFilters, arrColumns);
	return arrResults; 
}


/**
 * Get non-AP Vendor and Customer for IC JE
 * In the Parent Subsidiary line, Customer and Vendors are identified by filtering the mapping table by Subsidiary = Parent Subsidiary and Represent Subsidiary = Source Subsidiary * 
 * @param stSubsidiary
 * @param stParentSubsidiary
 * @returns
 */
function getEntitiesForICJE(stSubsidiary, stParentSubsidiary)
{
	var arrFilters = [new nlobjSearchFilter('custrecord_iem_subsidiary', null ,'anyof' , stParentSubsidiary),
	                  new nlobjSearchFilter('custrecord_iem_represents_subsidiary', null ,'anyof' , stSubsidiary),
	                  new nlobjSearchFilter('isinactive', null ,'is' ,'F')];
		
	var arrColumns = [new nlobjSearchColumn('custrecord_iem_customer_account'),
	                  new nlobjSearchColumn('custrecord_iem_vendor_account')];
	 
	var arrResults = nlapiSearchRecord('customrecord_intercompany_entity_mapping', null, arrFilters, arrColumns);	
	return arrResults; 
}


/**
 * Retrieve IC Batches
 * @returns
 */
function getICBatches()
{
	var arrFilters = [new nlobjSearchFilter('isinactive', null, 'is', 'F')];
	var arrColumns = [new nlobjSearchColumn('custrecord_icb_batch_id').setSort(),
                      new nlobjSearchColumn('custrecord_icb_subsidiary'),];
    
    var arrResults = nlapiSearchRecord('customrecord_intercompany_batches', null, arrFilters, arrColumns);    
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
 * Execution Payment Transactions Summary Search
 * @param stSavedSearch
 * @param stSubsidiary
 * @param stBalanceAsOf
 * @param stNettingBankAcct
 * @returns
 */
function getPaymentTransactionsSummary(stSavedSearch, stSubsidiary, stBalanceAsOf, stNettingBankAcct)
{
    var arrFilters = [new nlobjSearchFilter('subsidiary', null, 'anyof', stSubsidiary),
                      new nlobjSearchFilter('trandate', null, 'onorbefore', stBalanceAsOf),
                      new nlobjSearchFilter('account', null, 'anyof', stNettingBankAcct)];
    
    //pshah - removed fxamount as the trans could be in different currencies need to use the base currency of the sub - one clearing acc per sub is being used
	var arrColumns = [new nlobjSearchColumn('amount', null, 'sum')];
    
	//pshah - using saved search defined in UI forcing the trans date to filter by 31/07 by defining in the UI
    //var arrResults = nlapiSearchRecord('transaction', null, arrFilters, arrColumns);
    var arrResults = nlapiSearchRecord('transaction', stSavedSearch, arrFilters, null);
	  
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