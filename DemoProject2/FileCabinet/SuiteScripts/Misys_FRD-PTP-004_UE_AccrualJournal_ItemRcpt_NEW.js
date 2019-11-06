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
 * 1.00       18 Sep 2013     bfeliciano
 *
 */

function afterSubmit_createJournalOnItemRcpt(type){
	try
	{
		__log.start({
			 'logtitle'  : 'AccrualJournal on ItemRcpt'
			,'company' 	 : 'Misys'
			,'scriptname': 'Misys_UE_AccrualJournal_ItemRcpt.js'
			,'scripttype': 'userevent'
		});
		
		var exec = nlapiGetContext().getExecutionContext();
		__log.writev('type/context', [type,exec]);
		
		//o    Check if execution type (event type) is create  
		//o    Check the script has been invoked(execution context)  by user interaction, CSV or web services and user event script.  
		if (!__is.inArray(['create'], type) ) return __log.end('Ignoring type: ' + type, true);	
		if (!__is.inArray(['workflow','userevent','userinterface','suitelet'], exec) ) return __log.end('Ignoring execution context:' + exec, true);
		
		var recItemRcpt = nlapiGetNewRecord();
		__log.setCurrentRecord( recItemRcpt );
		
		__log.writev('** Item Receipt' , [ recItemRcpt.getId(), recItemRcpt.getFieldValue('tranid') ]);
		
		var stSubsId  = recItemRcpt.getFieldValue('subsidiary');		
		var isSubsInActive = nlapiLookupField('subsidiary', stSubsId, 'isinactive');
		__log.writev('..Subsidiary /active ', [stSubsId, isSubsInActive]);
		if (isSubsInActive == 'T')
		{
			__error.report('Exiting due to inactive subsidiary ' + stSubsId);
			return true;
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
	        var now = new Date();
		var arrTransferFields = { 'trandate'	:now				        //o   Set the Journal Entry Date as the Item Receipt Transdate (Required for JE)
								 ,'subsidiary'	:'subsidiary'			//o   Set the Journal Entry Subsidary as the Item Receipt Subsidary (Required for JE)
								 ,'currency'	:'currency'				//o   Set the Journal Entry Currency as the Item Receipt Currency (Required for JE)
								 ,'exchangerate':'exchangerate'			//o   Set the Journal Entry Exchange Rate as the Item Receipt Exchange Rate (Required for JE) ?
								 ,'createdfrom' :'custbody_sourcing_po' //o   Set the Journal Entry  “Source Purchase Order” field  as  the Item Receipt Created From Purchase Order
								 ,'_id'	:'custbody_source_receipt_bill'
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
		__log.writev('..Item Receipt being searched for creating Journal:', recItemRcpt.getId());
		var arrItemRcptSearch = nlapiSearchRecord(null, 'customsearch_fetch_itemrcpt_items', 
									[ (new nlobjSearchFilter('internalid', null, 'anyof', recItemRcpt.getId() ) ) ]);				
		if (! arrItemRcptSearch ) return __log.end('** Empty ItemRcpt search...');
		

	    //jkbautista - 20140922 : Include the ProjectIC, 3PP Source Transactinon and IPR Item Code in Item Receipt Population
	    var projectICRecord,
            _3ppSourceTransaction,
            iprItemCode;
		
		// set the lines details
		for (var ii in arrItemRcptSearch )
		{
		   

			var rowIR = arrItemRcptSearch[ii];
			var lineItem 	= rowIR.getValue('item');//recPurchOrd.getLineItemValue('item','item', linePO);
			
            //jkbautista - 20140922 : Populate the 3 appended fields in the line item values
			projectICRecord = rowIR.getValue('custcol_ic_project') || null;
			_3ppSourceTransaction = rowIR.getValue( 'custcol_3pp_source_transaction') || null;
			iprItemCode = rowIR.getValue( 'custcol_trans_ipr_item_code') || null;

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
						, 'custbody_po_customer': 'custcol_accruals_customer'
						, 'custcol_ic_project': 'custcol_ic_project',
						'_3ppSourceTrans': 'custcol_3pp_source_transaction',
						'iprItemCode': 'custcol_trans_ipr_item_code'

				};
				
				

				for (var searchfld in arrLineFields)
				{
					var journalFld= arrLineFields[searchfld];
					var value = rowIR.getValue(searchfld, 'item') || rowIR.getValue(searchfld, 'createdfrom') || rowIR.getValue(searchfld) || false;

                    //jkbautista - 20140922 : Included a logic gate for setting the value of the 3 appended column values
					if (journalFld == "custcol_ic_project") {
					    value = projectICRecord;
					} else if (journalFld == "custcol_3pp_source_transaction") {
					    value = _3ppSourceTransaction;
					} else if (journalFld == "custcol_trans_ipr_item_code") {
					    value = iprItemCode;
					}
				
					__log.writev('... setting the JE Line field', [searchfld, journalFld, value]);
					if (value)

						__safe.setCurrentLineItemValue(recNewJournal, 'line', journalFld, value);						
				}				
				/** TRANSFER LINE DETAILS **/
				var lineAmount   = rowIR.getValue('formulacurrency');
					lineAmount   = roundToCurrencyPrecision(lineAmount, recItemRcpt.getFieldValue('currency'));
					
				//recItemRcpt.getFieldValue('currency')
				__log.writev('...setting the journal amount ', [journaltype, lineAmount]);				
				__safe.setCurrentLineItemValue(recNewJournal, 'line', journaltype, lineAmount);
				
				//Set the Journal Entry Number on the custom field “Accrual Journal Entry Number” on the Item Receipt.
				__safe.setCurrentLineItemValue(recNewJournal, 'line', 'custcol_item_accruals', lineItem);				
				__safe.setCurrentLineItemValue(recNewJournal, 'line', 'memo', 'Item Receipt Accrual');
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
		}
		
		
		return __log.end('End of Script', true);
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
