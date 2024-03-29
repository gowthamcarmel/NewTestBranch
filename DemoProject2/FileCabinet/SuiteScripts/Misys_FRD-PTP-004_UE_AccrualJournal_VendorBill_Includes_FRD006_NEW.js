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

/**
 * Module Description
 * 
 * Version    Date            Author           Remarks
 * 1.00       25 Sep 2013     bfeliciano
 *
 */

var _STATUS_APPROVED = 2;
var _PARAM_VBILLID = 'custscript_vendorbill_id';
var _PARAM_LASTBILLID = 'custscript_last_vbill_id';
var _SSCRIPT_ACCRUALJEVB = 'customscript_ss_accrualje_vendorbill';

/**
 * The recordType (internal id) corresponds to the "Applied To" record in your script deployment. 
 * @appliedtorecord recordType
 * 
 * @param {String} type Operation types: create, edit, delete, xedit,
 *                      approve, cancel, reject (SO, ER, Time Bill, PO & RMA only)
 *                      pack, ship (IF only)
 *                      dropship, specialorder, orderitems (PO only) 
 *                      paybills (vendor payments)
 * @returns {Void}
 */
function scheduled_AccrualJournalonVendorBill()
{
	try
	{
		__log.start({
			 'logtitle'  : 'scheduled_AccrualJEonVB'
			,'company' 	 : 'Misys'
			,'scriptname': 'Misys_UE_AccrualJournal_VendorBill.js'
			,'scripttype': 'scheduled'
		});
		
		// get the vendorbill id
		var stVBillId = __fn.getScriptParameter( _PARAM_VBILLID );
		
		if (stVBillId) 
		{
			/** CREATE THE ACCRUAL JOURNALS FOR THE BILL **/
			__log.writev('***  Vendor Bill Id', [stVBillId]);		
			_createAccrualJE_VendorBillApproved( stVBillId );
		}
		else		
		{
			/** SEARCH FOR Approved Vendor Bills that has no Accrual JEs generated **/
			var arrSearch = nlapiSearchRecord('vendorbill', null, 
					 [
					   (new nlobjSearchFilter('approvalstatus', null, 'anyof', 2 ) )
					  ,(new nlobjSearchFilter('custbody_accrualje_no', null, 'anyof', '@NONE@' ) )
					  //,(new nlobjSearchFilter('mainline', null, 'is', 'T' ) )
					  //,(new nlobjSearchFilter('taxline', null, 'is', 'F' ) )
					  ,(new nlobjSearchFilter('type', 'appliedtotransaction', 'anyof', 'PurchOrd' ) )
					  ,(new nlobjSearchFilter('custitem_capexopex', 'item', 'anyof', '2' ) ) // Only Opex Items
					  ,(new nlobjSearchFilter('isinactive', 'subsidiary', 'is', 'F' ) )
					 ]
					,[
					   (new nlobjSearchColumn('internalid')).setSort(true)
					  ,(new nlobjSearchColumn('approvalstatus'))
					  ,(new nlobjSearchColumn('custbody_accrualje_no'))
					  
					 ]);
			
			__log.writev('** Looking for Approved VendorBills with no JE Accruals..', [arrSearch ? arrSearch.length : 0] );
			var stLastBillId = __fn.getScriptParameter( _PARAM_LASTBILLID );
			var isPastLastBillID = false;
			
			var arrProcessedIDs = [];

			//custscript_last_vbill_id			
			for ( var ii in arrSearch)
			{
				var row= arrSearch[ii];
				var stCurrentBillId = row.getId();
				
				if ( __is.inArray(arrProcessedIDs, stCurrentBillId) ) continue;
				arrProcessedIDs.push(stCurrentBillId);
				
				__log.writev('***  Vendor Bill Id', [stCurrentBillId, stLastBillId]);
				
				if (!isPastLastBillID && stLastBillId )
				{
					if (stLastBillId > stCurrentBillId )
					{
						isPastLastBillID = true;
						__log.writev('...!!found the next!!!', [stCurrentBillId, stLastBillId]);
					}

					if (! isPastLastBillID)
					{
						__log.writev('...skipping, last bill processed was ', [stLastBillId]);
						continue;
					}					
				}
				 _createAccrualJE_VendorBillApproved( stCurrentBillId  );
				
				// try to reschedule
				if (! __usage.hasRemaining('80%') )
				{
					// reschedule this script!
					var scriptParam = {};
						scriptParam[ _PARAM_LASTBILLID ] = stCurrentBillId;
										
					__log.writev('*** Re-Scheduling the script', [_SSCRIPT_ACCRUALJEVB, scriptParam]);
					var schedStatus = nlapiScheduleScript( _SSCRIPT_ACCRUALJEVB, null, scriptParam);
					__log.writev('...script status', [schedStatus]);
					if (schedStatus == 'QUEUED') return __log.end(true);
				}
			}								
		}
		
		return __log.end('End Of Execution');
	}
	catch (error)
	{
		__log.end('EXIT SCRIPT with errors | ' + error.toString(), true);	
	    if (error.getDetails != undefined)
	    {
	        nlapiLogExecution( 'ERROR', 'Process Error',error.getCode() + ': ' + error.getDetails());	        
	        throw error;
	    }
	    else
	    {
	        nlapiLogExecution( 'ERROR', 'Unexpected Error',error.toString());
	        throw nlapiCreateError('99999' , error.toString());
	    }
	}	 	    
	
}



function afterSubmit_AccrualJournalonVendorBill(type) {
	try
	{
		__log.start({
			 'logtitle'  : 'afterSubmit_AccrualJEonVB'
			,'company' 	 : 'Misys'
			,'scriptname': 'Misys_UE_AccrualJournal_VendorBill.js'
			,'scripttype': 'userevent'
		});
		
		var exec = nlapiGetContext().getExecutionContext();
		__log.writev('type/context', [type,exec]);
		
		//o Check the script has been invoked(execution context) by user interaction, CSV or web services and user event script.
		if (!__is.inArray(['userevent','userinterface','workflow','scheduled'], exec) ) 
			return __log.end('Ignoring execution context:',exec);
		
		if (type == 'create')
		{
			/** TRIGGER THE ACCRUALJE VENDOR BILL SCRIPT **/			
			var scriptParam = {};
				scriptParam[ _PARAM_VBILLID ] = nlapiGetRecordId();
			__log.writev('*** Scheduling the script', [_SSCRIPT_ACCRUALJEVB, scriptParam]);			
			var schedStatus = nlapiScheduleScript( _SSCRIPT_ACCRUALJEVB, null, scriptParam);
						
			if (schedStatus == 'QUEUED')
				return __log.end('...script status', [schedStatus]);
			else
				return __log.end('*** ERROR!! Unable to schedule the script!',  [schedStatus]);
		}
		else if  (type == 'edit')
		{
			/** CREATE THE ACCRUAL JOURNALS FOR THE BILL **/
			_createAccrualJE_VendorBillApproved( nlapiGetRecordId() );
		}
		
		return __log.end('End Of Execution');
	}
	catch (error)
	{
		__log.end('EXIT SCRIPT with errors | ' + error.toString(), true);	
	    if (error.getDetails != undefined)
	    {
	        nlapiLogExecution( 'ERROR', 'Process Error',error.getCode() + ': ' + error.getDetails());	        
	        throw error;
	    }
	    else
	    {
	        nlapiLogExecution( 'ERROR', 'Unexpected Error',error.toString());
	        throw nlapiCreateError('99999' , error.toString());
	    }
	}	 	    
}

function _createAccrualJE_VendorBillApproved( billId )
{
	if ( __is.empty(billId) ) return __log.end('Vendor Bill Id cannot be empty', [billId]);
	
	var recVendorBill = false;
	try 
	{
		recVendorBill = nlapiLoadRecord('vendorbill', billId);		
	}
	catch(err) {__error.report(err.toString());}
	
	if (! recVendorBill) return true;	
	__log.setCurrentRecord( recVendorBill );
	__log.writev('*** Create Accrual JE ***', [billId]);
	
	var stSubsId  = recVendorBill.getFieldValue('subsidiary');		
	var isSubsInActive = nlapiLookupField('subsidiary', stSubsId, 'isinactive');
	__log.writev('..Subsidiary /active ', [stSubsId, isSubsInActive]);
	if (isSubsInActive == 'T')
	{
		__error.report('Exiting due to inactive subsidiary ' + stSubsId);
		return true;
	}

	/**  CHECK THE STATUS FIRST **/
	var stStatus = recVendorBill.getFieldValue('approvalstatus');
	var stStatusText = recVendorBill.getFieldText('approvalstatus');
	__log.writev('VB Status ', [stStatus, stStatusText]);
	
	
	/** CHECK FOR EXISTING ACCRUALS **/
	var hasAccrualJE = recVendorBill.getFieldValue('custbody_accrualje_no');		
	__log.writev('..has accrual JE already?', [hasAccrualJE||false]);
	

	/** EXIT IF, VB has existing accruals OR VB is not APPROVED **/
	if ( hasAccrualJE || stStatus != _STATUS_APPROVED)
		return __log.end('Ignoring vendor bill', [hasAccrualJE, stStatus, stStatusText]);
	
	//var stCreatedFromID = recVendorBill.getFieldValue('createdfrom');			
	//if (!stCreatedFromID) return false;
	//
	////o   IF Created From is NOT a Purchase Order // Then Exit
	//var stCreatedFrom = nlapiLookupField('transaction', stCreatedFromID, 'recordtype');		
	//var isCreatedFromPurchORd = stCreatedFrom == 'purchaseorder';
	//if (! isCreatedFromPurchORd ) return __log.writev('Item Recpt not created from Purchase Order', [stCreatedFrom]);
	
	
	
	
	// Create the new JournalEntry
	var recNewJournal = nlapiCreateRecord('journalentry', {'recordmode':'dynamic'});
	var hasLines = false; 

	/** TRANSFER FIELDS TO THE JOURNAL ENTRY ***/
	var arrTransferFields = { 'trandate'	:'trandate'				//o   Set the Journal Entry Date as the Item Receipt Transdate (Required for JE)
							 ,'subsidiary'	:'subsidiary'			//o   Set the Journal Entry Subsidary as the Item Receipt Subsidary (Required for JE)
							 ,'currency'	:'currency'				//o   Set the Journal Entry Currency as the Item Receipt Currency (Required for JE)
							 ,'exchangerate':'exchangerate'			//o   Set the Journal Entry Exchange Rate as the Item Receipt Exchange Rate (Required for JE) ?
							 ,'createdfrom' :'custbody_sourcing_po' //o   Set the Journal Entry  â€œSource Purchase Orderâ€� field  as  the Item Receipt Created From Purchase Order
							 ,'_id'	:'custbody_source_receipt_bill'
							 }; //o   Set  the  Journal  Entry  â€œSource  Item  Receipt/Billâ€�  field  with  the  Item Receipt Internal Id.
	
	for (var stVendorBillField in arrTransferFields)
	{
		var stJournalField = arrTransferFields[stVendorBillField];			
		var stValue = stVendorBillField == '_id' ? recVendorBill.getId() : recVendorBill.getFieldValue(stVendorBillField);			
		__log.writev('...setting field value ', [stVendorBillField, stJournalField, stValue]);
		if (stValue)
		{
			__safe.setFieldValue(recNewJournal, stJournalField, stValue);
		}
	}
	//o   Set the JE Header Memo to â€œItem Receipt Accrualâ€�  
	__safe.setFieldValue(recNewJournal, 'memo', 'Invoice Accrual Reversal');

	//var stVendorBillTranID = nlapiLookupField('itemreceipt', recVendorBill.getId(), 'tranid', true);
	var stVendorBillTranID = recNewJournal.getFieldText('custbody_source_receipt_bill'); 
	__log.writev('..setting field value custbody_source_itembill_refno', [stVendorBillTranID]);
	__safe.setFieldValue(recNewJournal, 'custbody_source_itembill_refno', stVendorBillTranID);
	
	var stCreatedFrom = nlapiLookupField(recVendorBill.getRecordType(), recVendorBill.getId(), 'createdfrom');
	__log.writev('..setting field value custbody_sourcing_po', [stCreatedFrom]);
	__safe.setFieldValue(recNewJournal, 'custbody_sourcing_po', stCreatedFrom);
	



	//// set the custbody_source_ir_created_by
	//var stCurrentUser = nlapiGetContext().getUser();
	//__log.writev('..setting field value custbody_source_ir_created_by', [stCurrentUser]);
	//__safe.setFieldValue(recNewJournal, 'custbody_source_ir_created_by', stCurrentUser);
	/** TRANSFER FIELDS TO THE JOURNAL ENTRY ***/

	
	
	/** TRANSFER IR LINE FIELDS TO THE JOURNAL ENTRY ***/
	var arrVBillItemSearch = nlapiSearchRecord(null, 'customsearch_fetch_vbill_items', 
								[ (new nlobjSearchFilter('internalid', null, 'anyof', recVendorBill.getId() ) ) ]);				
	if (! arrVBillItemSearch ) return __log.end('** Empty VendorBill search...');

    //jkbautista - 20140922 : Include the ProjectIC, 3PP Source Transactinon and IPR Item Code in Item Receipt Population
	var projectICRecord,
        _3ppSourceTransaction,
        iprItemCode;


	// set the lines details
	for (var ii in arrVBillItemSearch )
	{			
		var rowVB = arrVBillItemSearch[ii];
		var lineItem 	= rowVB.getValue('item');//recPurchOrd.getLineItemValue('item','item', linePO);
		
	    //jkbautista - 20140922 : Populate the 3 appended fields in the line item values
		projectICRecord = rowVB.getValue('custcol_ic_project') || null;
		_3ppSourceTransaction = rowVB.getValue('custcol_3pp_source_transaction') || null;
		iprItemCode = rowVB.getValue('custcol_trans_ipr_item_code') || null;

		var arrJELines = ['debit','credit'];			
		for ( var iii in arrJELines)
		{
			var journaltype = arrJELines[ iii ];
			
			__log.writev('*** Creating new JE line', [iii, journaltype, lineItem]);
			recNewJournal.selectNewLineItem('line');
			
			var acct = journaltype == 'credit' ?
							rowVB.getValue('expenseaccount','item') : 
							rowVB.getValue('custitem_misysaccrualaccount','item');
			__safe.setCurrentLineItemValue(recNewJournal, 'line', 'account', acct);
			__log.writev('...setting the account to ', [acct]);
				
			__safe.setCurrentLineItemValue(recNewJournal, 'line', 'item', lineItem);
			__log.writev('...setting the item ', [lineItem]);
			
			/** TRANSFER LINE DETAILS **/
			// GBM 04042014 Added Project IC and IPR Item Columns ; GBM 08282014 added 3pp source transaction
			var arrLineFields = {
					 'department' 	: 'department'
					,'class' 		: 'class'
					,'location' 	: 'location'
					,'entity'		: 'custcol_misysvendor'
					,'custitem_category' 	: 'custcol_misyscategory'
					,'custitem_subcat1' 	: 'custcol_misyssubcategory1'
					,'custitem_subcat2' 	: 'custcol_misyssubcategory2'
					,'custbody_project_id'			: 'custcol_accruals_project'
					,'custbody_opportunityno'		: 'custcol_accruals_opportunity'
					,'custbody_po_customer'			: 'custcol_accruals_customer'
					,'custcol_ic_project'			: 'custcol_ic_project'
					,'custcol_trans_ipr_item_code'	: 'custcol_trans_ipr_item_code'	
					,'custcol_3pp_source_transaction' : 'custcol_3pp_source_transaction'	
			};
			
			for (var searchfld in arrLineFields)
			{
				var journalFld= arrLineFields[searchfld];
				var value  = rowVB.getValue(searchfld, 'item') || rowVB.getValue(searchfld, 'appliedToTransaction') || rowVB.getValue(searchfld, 'createdfrom') || rowVB.getValue(searchfld); // GBM 04072014 appliedToTransaction
				
				if (journalFld == "custcol_ic_project") {
				    value = projectICRecord;
				} else if (journalFld == "custcol_3pp_source_transaction") {
				    value = _3ppSourceTransaction;
				} else if (journalFld == "custcol_trans_ipr_item_code") {
				    value = iprItemCode;
				}

				__log.writev('... setting the JE Line field', [searchfld, journalFld, value]);
				if ( value)
					__safe.setCurrentLineItemValue(recNewJournal, 'line', journalFld, value);						
			}				
			/** TRANSFER LINE DETAILS **/
			var lineAmount   = rowVB.getValue('formulacurrency');
				lineAmount   = roundToCurrencyPrecision(  __fn.parseFloat( lineAmount ), recVendorBill.getFieldValue('currency'));
			__log.writev('...setting the journal amount ', [journaltype, lineAmount]);				
			__safe.setCurrentLineItemValue(recNewJournal, 'line', journaltype, lineAmount);
			
			//Set the Journal Entry Number on the custom field â€œAccrual Journal Entry Numberâ€� on the Item Receipt.
			__safe.setCurrentLineItemValue(recNewJournal, 'line', 'custcol_item_accruals', lineItem);				
			__safe.setCurrentLineItemValue(recNewJournal, 'line', 'memo', 'Invoice Accrual Reversal');
			// commit this line
			recNewJournal.commitLineItem('line');
			hasLines = true;
		}
	}
	/** TRANSFER IR LINE FIELDS TO THE JOURNAL ENTRY ***/
	
	if (! hasLines )
		return __log.end('Exiting because there are no lines..');
	
	// save the JE
	var resultID = __safe.nlapiSubmitRecord(recNewJournal, true, true);
	if ( resultID )
	{
		__log.writev('Created Journal Entry ', [resultID]);
		
		__log.writev('Setting the Accrual Journal Entry Number on the Item Receipt', [resultID, recVendorBill.getId()]);
		__safe.nlapiSubmitField( recVendorBill.getRecordType(), recVendorBill.getId(), 'custbody_accrualje_no', resultID);
	}
	
	return __log.writev('End of Script', true);
}
