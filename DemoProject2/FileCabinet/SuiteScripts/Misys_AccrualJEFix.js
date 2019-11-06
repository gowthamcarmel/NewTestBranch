/**
 * Module Description
 * 
 * Version    Date            Author           Remarks
 * 1.00       18 Feb 2014     bfeliciano
 *
 */

/**
 * @param {String} type Context Types: scheduled, ondemand, userinterface, aborted, skipped
 * @returns {Void}
 */
function sched_AccrualJEFix(type) {
	__log.start({
		 'logtitle'  : 'sched_AccrualJEFix'
		,'company' 	 : 'Misys'
		,'scriptname': 'Misys_AccrualJEFix.js'
		,'scripttype': 'scheduled'
	});	
	try
	{
		var searchMissingAccruals = __fn.getScriptParameter('custscript_missing_accruals');		
		var arrSearchResult = nlapiSearchRecord(null, searchMissingAccruals);
		
		__log.writev('** Search results ..', [arrSearchResult ? arrSearchResult.length : 0]);
		if (! arrSearchResult) return __log.end('Empty Search results');
		
		for (var ii in arrSearchResult)
		{
			var searchRow = arrSearchResult[ii];			
			var tranType = searchRow.getValue('type',null,'group');
			var tranId   = searchRow.getValue('internalid',null,'group');
			var stApprovalStatus = searchRow.getValue('approvalstatus',null,'group');//""'';
			
			
			if ( tranType == 'VendBill' && stApprovalStatus == _STATUS_APPROVED) {
//				continue;
				var createdFrom = false, createdFromType = false;				
				try {
					createdFrom =   nlapiLookupField(tranType,tranId,'createdfrom') || false;
					createdFromType = nlapiLookupField('transaction',createdFrom,'recordtype');					
				} catch(err){}
				
				__log.writev('Processing record...',[tranType, tranId, stApprovalStatus, [createdFrom, createdFromType]]);				
				_accrualJEFix_VendorBillApproved( tranId );
			}
			else if (tranType == 'ItemRcpt')  {				
				__log.writev('Processing record...',[tranType, tranId, stApprovalStatus]);
				_accrualJEFix_ItemRecpt( tranId );
//				if ( _accrualJEFix_ItemRecpt( tranId ) ) break;
			}			
			
			// try to reschedule
			if (! __usage.hasRemaining('80%') )
			{
				__log.write('*** Re-Scheduling the script....');				
				var cx = nlapiGetContext(); 
				if ( __nlapi.scheduleScript(cx.getScriptId(), cx.getDeploymentId(), {} )  ) {
					return __log.end(true);					
				}
			}
		}
		
		return __log.end('End Of Script');					
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





function _accrualJEFix_ItemRecpt(tranId){
	try
	{
//		__log.start({
//			 'logtitle'  : 'AccrualJournal on ItemRcpt'
//			,'company' 	 : 'Misys'
//			,'scriptname': 'Misys_UE_AccrualJournal_ItemRcpt.js'
//			,'scripttype': 'userevent'
//		});
		
//		var exec = nlapiGetContext().getExecutionContext();
//		__log.writev('type/context', [type,exec]);
		
//		o    Check if execution type (event type) is create  
		//o    Check the script has been invoked(execution context)  by user interaction, CSV or web services and user event script.  
//		if (!__is.inArray(['create'], type) ) return __log.end('Ignoring type: ' + type, true);	
//		if (!__is.inArray(['workflow','userevent','userinterface','suitelet'], exec) ) return __log.end('Ignoring execution context:' + exec, true);
		
		var recItemRcpt = nlapiLoadRecord('itemreceipt', tranId);//nlapiGetNewRecord();
		__log.setCurrentRecord( recItemRcpt );
		
		__log.writev('** Item Receipt' , [ recItemRcpt.getId(), recItemRcpt.getFieldValue('tranid') ]);
		
		var stSubsId  = recItemRcpt.getFieldValue('subsidiary');		
		var isSubsInActive = nlapiLookupField('subsidiary', stSubsId, 'isinactive');
		__log.writev('..Subsidiary /active ', [stSubsId, isSubsInActive]);
		if (isSubsInActive == 'T')
		{
			__error.report('Exiting due to inactive subsidiary ' + stSubsId);
			return false;
		}
		
		//var stCreatedFromID = recItemRcpt.getFieldValue('createdfrom');			
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
		var arrTransferFields = { 'subsidiary'	:'subsidiary'			//o   Set the Journal Entry Subsidary as the Item Receipt Subsidary (Required for JE)
								 ,'trandate'	:'trandate'				//o   Set the Journal Entry Date as the Item Receipt Transdate (Required for JE)
							     ,'postingperiod':'postingperiod'
								 ,'currency'	:'currency'				//o   Set the Journal Entry Currency as the Item Receipt Currency (Required for JE)
								 ,'exchangerate':'exchangerate'			//o   Set the Journal Entry Exchange Rate as the Item Receipt Exchange Rate (Required for JE) ?
								 ,'createdfrom' :'custbody_sourcing_po' //o   Set the Journal Entry  “Source Purchase Order” field  as  the Item Receipt Created From Purchase Order
								 ,'_id'	:'custbody_source_receipt_bill'
//							     ,'createddate':'createddate'
								 }; //o   Set  the  Journal  Entry  “Source  Item  Receipt/Bill”  field  with  the  Item Receipt Internal Id.
		
		for (var stItmRcptField in arrTransferFields)
		{
			var stJournalField = arrTransferFields[stItmRcptField];			
			var stValue = stItmRcptField == '_id' ? recItemRcpt.getId() : recItemRcpt.getFieldValue(stItmRcptField);			
			if (stValue)
			{
				__log.writev('...setting field value ', [stItmRcptField, stJournalField, stValue]);
				__safe.setFieldValue(recNewJournal, stJournalField, stValue);
			}
		}
		//o   Set the JE Header Memo to “Item Receipt Accrual”  
		__safe.setFieldValue(recNewJournal, 'memo', 'Item Receipt Accrual');

		//var stItemRcptTranID = nlapiLookupField('itemreceipt', recItemRcpt.getId(), 'tranid', true);
		var stItemRcptTranID = recNewJournal.getFieldText('custbody_source_receipt_bill'); 
		__log.writev('..setting field value custbody_source_itembill_refno', [stItemRcptTranID]);
		__safe.setFieldValue(recNewJournal, 'custbody_source_itembill_refno', stItemRcptTranID);
		
		// set the custbody_source_ir_created_by
		var stCurrentUser = nlapiGetContext().getUser();
		__log.writev('..setting field value custbody_source_ir_created_by', [stCurrentUser]);
		__safe.setFieldValue(recNewJournal, 'custbody_source_ir_created_by', stCurrentUser);
		/** TRANSFER FIELDS TO THE JOURNAL ENTRY ***/

		
		
		/** TRANSFER IR LINE FIELDS TO THE JOURNAL ENTRY ***/
		var arrItemRcptSearch = nlapiSearchRecord(null, 'customsearch_fetch_itemrcpt_items', 
									[ (new nlobjSearchFilter('internalid', null, 'anyof', recItemRcpt.getId() ) ) ]);				
		if (! arrItemRcptSearch ) return __log.end('** Empty ItemRcpt search...');
		
		
		// set the lines details
		for (var ii in arrItemRcptSearch )
		{			
			var rowIR = arrItemRcptSearch[ii];
			var lineItem 	= rowIR.getValue('item');//recPurchOrd.getLineItemValue('item','item', linePO);
			
			var arrJELines = ['debit','credit'];			
			for ( var iii in arrJELines)
			{
				var journaltype = arrJELines[ iii ];
				
				__log.writev('*** Creating new JE line', [iii, journaltype, lineItem]);
				recNewJournal.selectNewLineItem('line');
				
				var acct = journaltype == 'debit' ?
								rowIR.getValue('expenseaccount','item') : 
								rowIR.getValue('custitem_misysaccrualaccount','item');
				__safe.setCurrentLineItemValue(recNewJournal, 'line', 'account', acct);;
				__log.writev('...setting the account to ', [acct]);
					
				__safe.setCurrentLineItemValue(recNewJournal, 'line', 'item', lineItem);;
				__log.writev('...setting the item ', [lineItem]);
				
				/** TRANSFER LINE DETAILS **/
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
				};
				
				for (var searchfld in arrLineFields)
				{
					var journalFld= arrLineFields[searchfld];
					var value  = rowIR.getValue(searchfld, 'item') || rowIR.getValue(searchfld, 'createdfrom') || rowIR.getValue(searchfld) || false;
					
					__log.writev('... setting the JE Line field', [searchfld, journalFld, value]);
					if ( value)
						__safe.setCurrentLineItemValue(recNewJournal, 'line', journalFld, value);;						
				}				
				/** TRANSFER LINE DETAILS **/
				var lineAmount   = rowIR.getValue('formulacurrency')
					// lineAmount   = _roundOff(lineAmount);
					__log.writev('...[calculating the line amount, and currency]', [lineAmount, recItemRcpt.getFieldValue('currency')]);			
					lineAmount   = _roundToCurrencyPrecision(  __fn.parseFloat( lineAmount ), recItemRcpt.getFieldValue('currency') );
				
				
				__log.writev('...setting the journal amount ', [journaltype, lineAmount]);				
				__safe.setCurrentLineItemValue(recNewJournal, 'line', journaltype, lineAmount);;
				
				//Set the Journal Entry Number on the custom field “Accrual Journal Entry Number” on the Item Receipt.
				__safe.setCurrentLineItemValue(recNewJournal, 'line', 'custcol_item_accruals', lineItem);;				
				__safe.setCurrentLineItemValue(recNewJournal, 'line', 'memo', 'Item Receipt Accrual');;
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
			
			__log.writev('Setting the Accrual Journal Entry Number on the Item Receipt', [resultID, recItemRcpt.getId()]);
			__safe.nlapiSubmitField( recItemRcpt.getRecordType(), recItemRcpt.getId(), 'custbody_accrualje_no', resultID);
			
			
			return true;
		}
		else return false;
	}
	catch (error)
	{		
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




var _STATUS_APPROVED = 2;
var _PARAM_VBILLID = 'custscript_vendorbill_id';
var _PARAM_LASTBILLID = 'custscript_last_vbill_id';
var _SSCRIPT_ACCRUALJEVB = 'customscript_ss_accrualje_vendorbill';

function _accrualJEFix_VendorBillApproved( billId )
{
	if ( __is.empty(billId) ) return __log.end('Vendor Bill Id cannot be empty', [billId]);
	
	var recVendorBill = false;
	try 
	{
		recVendorBill = nlapiLoadRecord('vendorbill', billId);		
	}
	catch(err) {__error.report(err.toString());}
	
	if (! recVendorBill) return false;	
	__log.setCurrentRecord( recVendorBill );
	__log.writev('*** Create Accrual JE ***', [billId]);
	
	var stSubsId  = recVendorBill.getFieldValue('subsidiary');		
	var isSubsInActive = nlapiLookupField('subsidiary', stSubsId, 'isinactive');
	__log.writev('..Subsidiary /active ', [stSubsId, isSubsInActive]);
	if (isSubsInActive == 'T')
	{
		__error.report('Exiting due to inactive subsidiary ' + stSubsId);
		return false;
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
	var arrTransferFields = { 'subsidiary'	:'subsidiary'	//o   Set the Journal Entry Subsidary as the Item Receipt Subsidary (Required for JE)
							 ,'trandate'	:'trandate'				//o   Set the Journal Entry Date as the Item Receipt Transdate (Required for JE)								
							 ,'currency'	:'currency'				//o   Set the Journal Entry Currency as the Item Receipt Currency (Required for JE)
							 ,'exchangerate':'exchangerate'			//o   Set the Journal Entry Exchange Rate as the Item Receipt Exchange Rate (Required for JE) ?
							 ,'createdfrom' :'custbody_sourcing_po' //o   Set the Journal Entry  “Source Purchase Order” field  as  the Item Receipt Created From Purchase Order
							 ,'_id'	:'custbody_source_receipt_bill'
							 ,'postingperiod':'postingperiod'
//						     ,'createddate':'createddate'
							 }; //o   Set  the  Journal  Entry  “Source  Item  Receipt/Bill”  field  with  the  Item Receipt Internal Id.
	
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
	//o   Set the JE Header Memo to “Item Receipt Accrual”  
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
	
	
	// set the lines details
	for (var ii in arrVBillItemSearch )
	{			
		var rowVB = arrVBillItemSearch[ii];
		var lineItem 	= rowVB.getValue('item');//recPurchOrd.getLineItemValue('item','item', linePO);
		
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
			};
			
			for (var searchfld in arrLineFields)
			{
				var journalFld= arrLineFields[searchfld];
				var value  = rowVB.getValue(searchfld, 'item') || rowVB.getValue(searchfld, 'createdfrom') || rowVB.getValue(searchfld);
				
				__log.writev('... setting the JE Line field', [searchfld, journalFld, value]);
				if ( value)
					__safe.setCurrentLineItemValue(recNewJournal, 'line', journalFld, value);						
			}				
			/** TRANSFER LINE DETAILS **/
			var lineAmount   = rowVB.getValue('formulacurrency');
				// lineAmount   = _roundOff(  __fn.parseFloat( lineAmount ) );
				__log.writev('...[calculating the line amount, and currency]', [lineAmount, recVendorBill.getFieldValue('currency')]);			
				lineAmount   = _roundToCurrencyPrecision(  __fn.parseFloat( lineAmount ), recVendorBill.getFieldValue('currency') );
				 
							
			__log.writev('...setting the journal amount ', [journaltype, lineAmount]);				
			__safe.setCurrentLineItemValue(recNewJournal, 'line', journaltype, lineAmount);
			
			//Set the Journal Entry Number on the custom field “Accrual Journal Entry Number” on the Item Receipt.
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
		
		return true;
	}
	else 
		return false;
	
	//return __log.writev('End of Script', true);
}



var __ZEROPRECISION_CURRENCIES = [15,18,20,36,44,57];
function _roundToCurrencyPrecision ( amount, currency){
	var  newAmount = amount;
	
	if ( __is.inArray(__ZEROPRECISION_CURRENCIES, currency) )
		newAmount = Math.round( amount);
	else
		newAmount = __fn.roundOff(amount, 2);
		return newAmount;
}
