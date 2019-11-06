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
 **/


/**
 * Module Description
 * 
 * Version    Date            Author           Remarks
 * 1.00       26 Mar 2014     gmanarang
 *
 */

// List values
var _PENDING = '1';
var _PROCESSED = '2';
var _PROCESSED_WITH_ERROR = '3';

var _IPR = '2'; // internal id

/**
 * @param {String} type Context Types: scheduled, ondemand, userinterface, aborted, skipped
 * @returns {Void}
 */
function scheduled_generateICCharges (type) 
{
	//Try-catch 
	var stLogTitle = 'scheduled_generateICCharges';
	
	nlapiLogExecution('DEBUG', stLogTitle, '-------SCHEDULED SCRIPT STARTED---------');
	var context = nlapiGetContext();
	var stEmailAlertId = context.getSetting('SCRIPT', 'custscript_ipr_email_alert');
	var stAdminUserEmailRecipient = context.getSetting('SCRIPT', 'custscript_ipr_admin_user');
	var stRevRecJournalICChargesSearch = context.getSetting('SCRIPT', 'custscript_ipr_revrec_search');
	
	if(!stRevRecJournalICChargesSearch || !stEmailAlertId || !stAdminUserEmailRecipient)
	{
		nlapiLogExecution('ERROR', stLogTitle, 'Missing Script Parameter. Cannot continue processing. Exit Script...');
		return;
	}
	
	var searchResults = searchAllRecord('transaction', stRevRecJournalICChargesSearch);
	
	for (var i in searchResults) // loop through search results
	{
    	
		checkGovernance(500); // this function checks usage for rescheduling purposes. Input value is usage limit
		
		var stJournalInternalId = searchResults[i].getValue('internalid', null, 'group');
		var stJELine = forceParseInt(searchResults[i].getValue('linesequencenumber', null, 'group'));
		var stJournalSubsidiary = searchResults[i].getValue('subsidiary', null, 'group');
		var stJournalCurrency = searchResults[i].getValue('currency', null, 'group');
		var arrFields = ['custitem_ipr_perc', 'custitem_ipr_owner', 'department', 'class','custitem_category', 'custitem_subcat1', 'custitem_subcat2']; // Fields to Lookup    		
		var stIPRItem = searchResults[i].getValue('custcol_trans_ipr_item_code', 'appliedToTransaction', 'group'); // Applied to Transaction.IPR Item Code  				
		
		nlapiLogExecution('DEBUG', stLogTitle, 'IPR Item Id: '+stIPRItem);
		
		try
    	{
    			
    		var arrFieldValues = nlapiLookupField('item', stIPRItem, arrFields); // Lookup IPR Item Fields
    		
    		if(!arrFieldValues) // Verify retrieved values
    		{
    			nlapiLogExecution('ERROR', stLogTitle, 'Unable to Lookup IPR Item Fields of Item: '+stIPRItem);
    			continue;
    		}
    		
    		nlapiLogExecution('DEBUG', stLogTitle, 'Journal Subsidiary: '+stJournalSubsidiary+ ' | IP Owner: '+arrFieldValues['custitem_ipr_owner']);
    		
    		if(stJournalSubsidiary == arrFieldValues['custitem_ipr_owner']) // remove this condition if it is already in saved search 
    		{
    			nlapiLogExecution('DEBUG', stLogTitle, 'Subsidiary = IPR Owner moving to next item...');
    			continue; // filter this out
    		}
    		
    		stProcessingInternalId = stJournalInternalId; // set this for next loop if any   
    		
    		// Determine the Transaction Reference that will be set on the Memo field
    		var stTransactionReference = '';
    		var stTranType = searchResults[i].getValue('type', 'appliedToTransaction', 'group'); // Applied to Transaction.Type
    		
    		if(stTranType == 'RevComm')
    		{
    			stTransactionReference = searchResults[i].getText('createdfrom', 'appliedToTransaction', 'group');
    		}
    		else
    		{
    			stTransactionReference = searchResults[i].getValue('tranid', 'appliedToTransaction', 'group');
    		}
    		
    		nlapiLogExecution('DEBUG', stLogTitle, 'Transaction Reference: '+stTransactionReference);
    		
    		// Calculate Rate / Amount = IPR % * Rev Rec Journal Amount
    		var flRevRecAmount = forceParseFloat(searchResults[i].getValue('amount', null, 'sum'));
    		var flIPRPct = forceParseFloat(arrFieldValues['custitem_ipr_perc'])/100;
    		
    		var flCalculatedRate = flRevRecAmount*flIPRPct;    		
    		var stIPROwnerCurrency = nlapiLookupField('subsidiary', arrFieldValues['custitem_ipr_owner'], 'currency');
    		
    		// Compare currency and get convert to exchange rate to current date    		
    		flCalculatedRate = computeExchangeRate(flCalculatedRate, stJournalCurrency, stIPROwnerCurrency, nlapiDateToString(new Date()));    		
    		
    		nlapiLogExecution('DEBUG', stLogTitle, 'Calculate Rate / Amount: '+flCalculatedRate);
    		
    		// Create an Intercompany Charges record and set the following fields
    		var recICC = nlapiCreateRecord('customrecord_intercompany_charges');
    		
    		recICC.setFieldValue('custrecord_icc_allocation_type', _IPR); // Allocation Type 
    		recICC.setFieldValue('custrecord_icc_date', searchResults[i].getValue('trandate', null, 'group')); // Date Journal
    		recICC.setFieldText('custrecord_icc_period', searchResults[i].getText('postingperiod', null, 'group')); // Period Journal
    		recICC.setFieldValue('custrecord_icc_project', ''); // leave blank
    		recICC.setFieldValue('custrecord_icc_currency', stIPROwnerCurrency); // Currency IPR Owner
    		recICC.setFieldValue('custrecord_icc_source_subsidiary', arrFieldValues['custitem_ipr_owner']); // from IPR Item
    		recICC.setFieldValue('custrecord_icc_source_department', arrFieldValues['department']); // from IPR Item
    		recICC.setFieldValue('custrecord_icc_source_location', searchResults[i].getValue('location', null, 'group'));
    		recICC.setFieldValue('custrecord_icc_source_class', arrFieldValues['class']); // from IPR Item
    		recICC.setFieldValue('custrecord_icc_destination_subsidiary', stJournalSubsidiary);
    		recICC.setFieldValue('custrecord_icc_destination_department', arrFieldValues['department']); // from IPR Item
    		recICC.setFieldValue('custrecord_icc_destination_location', searchResults[i].getValue('location', null, 'group'));
    		recICC.setFieldValue('custrecord_icc_destination_class', arrFieldValues['class']); // from IPR Item
    		recICC.setFieldValue('custrecord_icc_quantity', 1);
    		recICC.setFieldValue('custrecord_icc_rate_fcy', flCalculatedRate);
    		recICC.setFieldValue('custrecord_icc_amount_fcy', flCalculatedRate);
    		recICC.setFieldValue('custrecord_icc_item', stIPRItem); // IPR Item
    		recICC.setFieldValue('custrecord_icc_item_category', arrFieldValues['custitem_category']); // from IPR Item
    		recICC.setFieldValue('custrecord_icc_sub_category_1', arrFieldValues['custitem_subcat1']); // from IPR Item
    		recICC.setFieldValue('custrecord_icc_sub_category_2', arrFieldValues['custitem_subcat2']); // from IPR Item
    		recICC.setFieldValue('custrecord_icc_source_internal_id', stJournalInternalId);
    		recICC.setFieldValue('custrecord_icc_source_transaction', stJournalInternalId);
    		// Compose Header Memo
    		var stHeaderMemo = searchResults[i].getText('entity', 'appliedToTransaction', 'group') +' - '+stTransactionReference;
    		recICC.setFieldValue('custrecord_icc_header_memo', stHeaderMemo); // Header Memo
    		
    		var stICCId = nlapiSubmitRecord(recICC);
    		
    		nlapiLogExecution('DEBUG', stLogTitle, 'Successfully Created Intercompany Charge record: '+stICCId);    		
    		
   			// update the Journal Entry IC Charges Routine Status of the Revenue Recognition Journal to 'Processed'
    		updateJEICCRoutineStatus(stJournalInternalId, (stJELine+1), _PROCESSED, null); // Plus 1 to Line cause it starts from 0

    		nlapiLogExecution('DEBUG', stLogTitle, 'moving to next record in search result...');
    	}
    	catch (error)
	    {
	       nlapiLogExecution('ERROR', stLogTitle, error.toString()); 
	       
	       // Send an email to the administrator specified on the script parameter. Email will only contain the Transaction Number and Line Number. 
	       // The details of the error will be recorder against the script execution log.
	       // Update the Revenue Recognition Journal Entry IC Charges Routine Status = Processed with Error

	       var objError = new Object();
	       objError.TransactionId = searchResults[i].getValue('tranid', 'appliedToTransaction', 'group');
	       objError.TransactionLine = searchResults[i].getValue('linesequencenumber', 'appliedToTransaction', 'group');
	       objError.Recipient = stAdminUserEmailRecipient;
	       objError.Details = error.toString();
	       updateJEICCRoutineStatus(stJournalInternalId, (stJELine+1), _PROCESSED_WITH_ERROR, objError);
	       nlapiLogExecution('DEBUG', stLogTitle, 'moving to next record in search result...');
	       continue;	       
	    }
		
	}
    
	// Send email to signify end of Scheduled script execution
    sendEmailAlert(stEmailAlertId, stAdminUserEmailRecipient);
	
	nlapiLogExecution('DEBUG', stLogTitle, '-------SCHEDULED SCRIPT COMPLETED---------');
    	    
}


/*
 * Common Re-usable functions
 */
function forceParseFloat(stValue) 
{
	return (isNaN(parseFloat(stValue)) ? 0 : parseFloat(stValue));
}

function forceParseInt(stValue) 
{
	return (isNaN(parseInt(stValue)) ? 0 : parseInt(stValue));
}

//Function to search all related records
function searchAllRecord (recordType, searchId, searchFilter, searchColumns)
{
	var arrSearchResults = [];
	var count=1000, min=0, max=1000;

	var searchObj = false;

	if (searchId) 
	{
		searchObj = nlapiLoadSearch(recordType, searchId);
		if (searchFilter)
		{
			searchObj.addFilters(searchFilter);
		}
			
		if (searchColumns)
		{
			searchObj.addColumns(searchColumns);
		}			
	} 
	else 
	{
		searchObj = nlapiCreateSearch(recordType, searchFilter, searchColumns);
	}

	var rs = searchObj.runSearch();

	while( count == 1000 )
	{
		var resultSet = rs.getResults(min, max);
		arrSearchResults = arrSearchResults.concat(resultSet);
		min = max;
		max+=1000;
		count = resultSet.length;
	}

	if(arrSearchResults)
	{
		nlapiLogExecution('DEBUG', 'searchAllRecord', 'Total search results: '+arrSearchResults.length);
	}
	return arrSearchResults;		
}


/**  
 * Checks governance then calls yield
 * @param 	{Integer} myGovernanceThreshold 
 * 
 * @returns {Void} 
 */
function checkGovernance(myGovernanceThreshold)
{
	var context = nlapiGetContext();
	
	if( context.getRemainingUsage() < myGovernanceThreshold )
	{
		var state = nlapiYieldScript();
		if( state.status == 'FAILURE')
		{
			nlapiLogExecution("ERROR","Failed to yield script, exiting: Reason = "+state.reason + " / Size = "+ state.size);
			throw "Failed to yield script";
		} 
		else if ( state.status == 'RESUME' )
		{
			nlapiLogExecution("AUDIT", "Resuming script because of " + state.reason+".  Size = "+ state.size);
		}
		// state.status will never be SUCCESS because a success would imply a yield has occurred.  The equivalent response would be yield
	}
}

//This function sends email upon successful completion of the script
// needs recipient cause this is from a scheduled script Current user = -System- (-4)
function sendEmailAlert(stEmailAlertId, stRecipientId)
{
	var stLogTitle = 'sendEmailAlert';
	
	if(stEmailAlertId)
	{
		var recEmailAlert = nlapiLoadRecord('customrecord_email_alerts', stEmailAlertId);
		
		var stEmailSubject = recEmailAlert.getFieldValue('custrecord_email_subject');
		var stEmailBody = recEmailAlert.getFieldValue('custrecord_email_body');
		var stEmailFrom = recEmailAlert.getFieldValue('custrecord_email_from');
		
		// var stEmailTo = nlapiGetUser();		
		nlapiSendEmail(stEmailFrom, stRecipientId, stEmailSubject, stEmailBody); // Email sent to Current User
		nlapiLogExecution('DEBUG', stLogTitle, 'Email sent successfully from: '+stEmailFrom+'|to: '+stRecipientId+'|subject: '+stEmailSubject);
	}
	else
	{
		nlapiLogExecution('DEBUG', stLogTitle, 'SCRIPT Parameter Email Alert is Empty. Cannot Send Email Alert');
	}
}

//compute exchange rate
function computeExchangeRate(flEstUnitCost, stCurrency1, stCurrency2, stDateToday)
{
	var flExcRate = nlapiExchangeRate(stCurrency1, stCurrency2, stDateToday);		
	var flConvEstUnitCost = forceParseFloat(flEstUnitCost)*forceParseFloat(flExcRate);	
	nlapiLogExecution('DEBUG', 'computeExchangeRate', 'From Currency: '+stCurrency1+' | To Currency: '+stCurrency2+' | Exchange Rate: '+flExcRate+' | Orig Amount: '+flEstUnitCost+' | Conv Amount: '+flConvEstUnitCost);
	return flConvEstUnitCost;
}

// update Journal with status
function updateJEICCRoutineStatus(stJEId, LineNumber, stStatus, stErrorObj)
{
	var recJournal = nlapiLoadRecord('journalentry', stJEId);
	
	recJournal.setLineItemValue('line', 'custcol_icc_routine_status', LineNumber, stStatus);
	
	var stUpdateJE = nlapiSubmitRecord(recJournal);
	
	if(stErrorObj)
	{
		// Send Email to administrator details stored in error object
		var stSubject = 'Error: IPR Recharges - Applied To Transaction: '+stErrorObj.TransactionId+' Line: '+stErrorObj.TransactionLine;
		var stBody = stErrorObj.Details;
		
		nlapiSendEmail(stErrorObj.Recipient, stErrorObj.Recipient, stSubject, stBody); // modify sender if instructed
		
		nlapiLogExecution('DEBUG', 'updateJEICCRoutineStatus', 'Sent Email to Administrator: '+stErrorObj.Recipient);
	}
	
	nlapiLogExecution('DEBUG', 'updateJEICCRoutineStatus', 'Updated Journal: '+ stUpdateJE + ' line: '+LineNumber+ ' status: '+ stStatus);
}


