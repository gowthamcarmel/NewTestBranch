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
function beforeSubmit_ReverseAccrualJE(type)
{
	try
	{
		__log.start({
			 'logtitle'  : 'ReverseAccrualJE on ItemRcptDelete'
			,'company' 	 : 'Misys'
			,'scriptname': 'Misys_UE_AccrualJournal_ItemRcpt.js'
			,'scripttype': 'userevent'
		});
		
		var exec = nlapiGetContext().getExecutionContext();
		__log.writev('type/context', [type,exec]);
		
		//o    Check if execution type (event type) is delete  
		//o    Check the script has been invoked(execution context)  by user interaction, CSV or web services and user event script.  
		if (!__is.inArray(['delete'], type) ) return __log.end('Ignoring type: ' + type, true);	
		if (!__is.inArray(['userevent','userinterface','workflow'], exec) ) return __log.end('Ignoring execution context:' + exec, true);
		
		var recItemRcpt = nlapiGetOldRecord();//nlapiGetOldRecord();		
		__log.setCurrentRecord( recItemRcpt );
		
		//o   Determine the â€œAccrual Journal Entry Numberâ€�  Field on item receipt record as the Original JE
		var stAccrualJE = recItemRcpt.getFieldValue('custbody_accrualje_no');
		
		//o   IF â€œAccrual Journal Entry Numberâ€� field is Empty  
		//o   Then    Exit  
		if ( __is.empty(stAccrualJE) ) {
			__log.end('No Accrual JE No');
			return true;
			//throw nlapiCreateError('9999', 'No Accrual JE No');			
		}
		
		__log.writev('Accrual Journal Entry Number', [stAccrualJE]);
		
		
		//o   Load the original JE.
		var recAccrualJE = nlapiLoadRecord('journalentry', stAccrualJE, {'recordmode':'dynamic'});
		__log.writev('...loading the accrual JE', [recAccrualJE.getFieldValue('tranid')]);
		__log.setCurrentRecord( recAccrualJE );
		
		//o   Create a new Journal Entry record  (Dynamic mode)  
		var recNewJE  = nlapiCreateRecord('journalentry', {'recordmode':'dynamic'});
		__log.write('...creating a new Journal Entry');
		

		//o   Set the Journal Entry Date as current date(Required for JE)  
		//o   Set the Journal Entry Subsidary as the original JE Subsidary (Required for JE)  
		//o   Set the Journal Entry Currency as the  original JE  Currency (Required for JE)  
		//o   Set  the  Journal  Entry  Exchange  Rate  as  the  original  JE  Exchange  Rate (Required for JE)  
		//o   Set  the  Journal  Entry  â€œSource  Purchase  Orderâ€�  field  as  the  original  JE Purchase Order   
		//o   Set  the  Journal  Entry  â€œSource  Item  Receipt/Billâ€�  field    with  the  Item Receipt internal id.  
		//o   Set the Related Accural Journal Entry Number to the Original JE number.
		var arrTransferFields = [ 'trandate', 'subsidiary', 'currency', 'exchangerate', 'custbody_sourcing_po', 
		                          'custbody_source_ir_created_by',
		                          'custbody_source_receipt_bill', '_id','custbody_source_itembill_refno'];
		
		for (var ii in arrTransferFields)
		{
			var stJournalField = arrTransferFields[ii];
			
			var stValue = recAccrualJE.getFieldValue(stJournalField);
			if ( stJournalField == '_id' )
			{
				stValue = stAccrualJE;
				stJournalField = 'custbody_accrualje_no';
			}
			
			if (stValue)
			{
				__log.writev('...setting field value ', [stJournalField, stValue]);
				__safe.setFieldValue(recNewJE, stJournalField, stValue);
			}
		}
		
		//TODO o   Set   the   Item   Receipt   Number   Being   Deleted   to   the   â€œSource Item Receipt/Bill  Reference Numberâ€� text field (internal ind:tranid)
		//__safe.setFieldValue(recNewJE, 'custbody_source_itembill_refno', recItemRcpt.getFieldValue('tranid'));
		
		//o   Set the User Who Created the Item Receipt from the Item Receipt System Notes Set By field (for Type create)                                                                   	 
		//o   Set  the  JE  line  Memo  to  â€œReversing  Item  Receipt  Purchase  Accrual  on  Delete of Item Receiptâ€�
		__safe.setFieldValue(recNewJE, 'memo', 'Reversing  Item  Receipt  Purchase  Accrual  on  Delete of Item Receipt');
		
		//o   For each line in the Original JE create a corresponding line in the reversal JE  
		var lineCountAccrualJE = recAccrualJE.getLineItemCount('line');
		for (var lineAccJE = 1; lineAccJE<=lineCountAccrualJE; lineAccJE++)
		{
			// create a new line item
			recNewJE.selectNewLineItem('line');
			
			// o    If the Original JE line is a debit line, create a corresponding Credit line  
			var stDebitAmount = recAccrualJE.getLineItemValue('line', 'debit', lineAccJE) || false;
			var stCreditAmount = recAccrualJE.getLineItemValue('line', 'credit', lineAccJE) || false;
			
			__log.writev('...amount', [stDebitAmount, stCreditAmount]);
			
			if ( __fn.parseFloat(stCreditAmount) )
			{
				
				stCreditAmount = roundToCurrencyPrecision(stCreditAmount, recAccrualJE.getFieldValue('currency'));
				
				__safe.setCurrentLineItemValue(recNewJE, 'line', 'debit', stCreditAmount);
				__log.writev('*** Creating new JE line', ['debit', stCreditAmount]);				
			}
			else
			{
				stDebitAmount = roundToCurrencyPrecision(stDebitAmount, recAccrualJE.getFieldValue('currency'));
				
				__safe.setCurrentLineItemValue(recNewJE, 'line', 'credit', stDebitAmount);
				__log.writev('*** Creating new JE line', ['credit', stDebitAmount]);				
			}
			// GBM 08282014 Added Project IC ; IPR Item Columns ;  added 3pp source transaction
			var arrLineFields = ['account','item', 'department','class','location', 
			                     'custcol_misysvendor', 'custcol_accruals_project',
			                     'custcol_item_accruals', 'custcol_accruals_opportunity',
			                     'custcol_misyscategory',  'custcol_misyssubcategory1', 
			                     'custcol_misyssubcategory2',
			                     'custcol_accruals_customer', 'custcol_ic_project',
			                     'custcol_trans_ipr_item_code', 'custcol_3pp_source_transaction'];				
			for (var iii in arrLineFields)
			{
				var fld = arrLineFields[iii];					
				var stValue = recAccrualJE.getLineItemValue('line', fld, lineAccJE);
				
				__safe.setCurrentLineItemValue(recNewJE, 'line', fld, stValue);
				__log.writev('... Setting line field value', [fld, stValue, lineAccJE]);
			}
			
			__safe.setCurrentLineItemValue(recNewJE, 'line', 'memo', 'Reversing  Item  Receipt  Purchase  Accrual  on  Delete of Item Receipt');
			
			// commit the line
			recNewJE.commitLineItem('line');
		}
		
		// save the JE
		var resultID = __safe.nlapiSubmitRecord(recNewJE, true, true);
		if ( resultID )
		{
			__log.writev('Created Journal Entry ', [resultID]);
			nlapiSubmitField('journalentry', stAccrualJE, 'custbody_accrualje_no', resultID);
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



function beforeLoad_ShowDeleteBtnItemRecpt(type, form, request)
{
	try
	{
		__log.start({
			 'logtitle'  : 'ItemRecptDeleteBtn'
			,'company' 	 : 'Misys'
			,'scriptname': 'Misys_UE_AccrualJournal_ItemRcpt.js'
			,'scripttype': 'userevent'
		});
		
		var exec = nlapiGetContext().getExecutionContext();
		__log.writev('type/context', [type,exec]);
		
		if (__is.inArray(['create'], type) ) return __log.end('Ignoring type:' + type, true);
		if (!__is.inArray(['userevent','userinterface','workflow','scheduled'], exec) ) return __log.end('Ignoring execution context:' + exec, true);
		
		// check this Item Receipt if it ahs OPEX items
		var stRecordID = nlapiGetRecordId();
		var stRecordType = nlapiGetRecordType();
		
		if (! stRecordID ) return true;
		
		var hasOpex = false;
		var arrSearchItems = nlapiSearchRecord(stRecordType, null,
				[
			 	  (new nlobjSearchFilter('internalid', null, 'anyof', stRecordID))
			 	 ,(new nlobjSearchFilter('mainline', null, 'is', 'F') )
			 	 ,(new nlobjSearchFilter('taxline', null, 'is', 'F') )
			 	],
			 	[
			 	   (new nlobjSearchColumn('item') )
			 	  ,(new nlobjSearchColumn('account') )
			 	  ,(new nlobjSearchColumn('custcol_po_rate') )
			 	  ,(new nlobjSearchColumn('quantity') )
			 	  ,(new nlobjSearchColumn('custitem_misysaccrualaccount', 'item') )
			 	  ,(new nlobjSearchColumn('expenseaccount', 'item') )
			 	  ,(new nlobjSearchColumn('custitem_capexopex','item') )				 	 
			 	]);
		for (var iii in arrSearchItems)
		{
			var row = arrSearchItems[iii];
			
			var stOpex = row.getText('custitem_capexopex', 'item');
			__log.writev('..opex/Capex value', [stOpex]);
			
			if (!hasOpex && !stOpex.match(/\bopex\b/ig)) continue;
			
			hasOpex = true;
		}
		if (! hasOpex) return __log.end('Line has no Opex Items');
		
		if (type == 'edit')
		{
			nlapiSetRedirectURL('RECORD', nlapiGetRecordType(), nlapiGetRecordId(), false);
			return true;		
		}
		
		//o    Check if execution type (event type) is create  
		//o    Check the script has been invoked(execution context)  by user interaction, CSV or web services and user event script.  
		if (!__is.inArray(['view'], type) ) return __log.end('Ignoring type: ' + type, true);	
		if (!__is.inArray(['userevent','userinterface','webservices','csvimport'], exec) ) return __log.end(' execution context:' + exec, true);
		
		
		var stPostingPeriod = nlapiLookupField(stRecordType, stRecordID, 'postingperiod', true);		
		if (  _isPeriodClosed( stPostingPeriod ) ) return true; 
		
		var stItemRecptID = nlapiGetRecordId();
		
		// make this script a library 		
		form.setScript( nlapiGetContext().getScriptId() );		
		form.addButton('custpage_btndelete', 'Delete', 'buttonClick_Delete(\''+stItemRecptID+'\')');
		
		form.removeButton('edit');
		
				
//		var btnEdit = form.getButton('edit');
//		btnEdit.setDisabled(true); 
		
		return true;
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

function _isPeriodClosed( stPeriodName ) {
	var isclosed = false;	
	
	var arrPeriodSearch = nlapiSearchRecord('accountingperiod',null, 
				 [ (new nlobjSearchFilter('periodname',null,'is',stPeriodName))
				  ,(new nlobjSearchFilter('closed',null,'is','T'))], 
				 [ (new nlobjSearchColumn('closed'))
				  ,(new nlobjSearchColumn('periodname'))]);
	
	isclosed = !!(arrPeriodSearch && arrPeriodSearch.length);
	if (isclosed) return isclosed;
	
	// check for the taxperiod
	var arrTaxPeriodSearch = nlapiSearchRecord('taxperiod',null, 
			[ (new nlobjSearchFilter('periodname',null,'is',stPeriodName))
			 ,(new nlobjSearchFilter('allclosed',null,'is','T'))], 
			[ (new nlobjSearchColumn('allclosed'))
			 ,(new nlobjSearchColumn('periodname'))]);
	
	isclosed = !!(arrTaxPeriodSearch && arrTaxPeriodSearch.length);
	return isclosed;
}


function _isTaxPeriodClosed( stPeriodName ) {
	var isclosed = false;
	
	return isclosed;
}



function buttonClick_Delete( itemRecptID ) {
	
	if (!itemRecptID) return false;
	if (! window.confirm('You are about to delete an item receipt record. Do you wish to continue?') ) return false;
	
	var stPurcOrdID = nlapiGetFieldValue('createdfrom');	
	var successDelete = false;
	
	// delete this record
	try 
	{
		nlapiDeleteRecord(nlapiGetRecordType(), itemRecptID);
		successDelete = true;		
	}
	catch(error){
		alert('Unable to delete current record, this record may have already been deleted. Please contact the administrator.');
		
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
		
		return false;
	}
	
	if ( successDelete )
	{
		alert('The item receipt has been successfully deleted.');
		location.href = nlapiResolveURL('RECORD', 'purchaseorder', stPurcOrdID);
	}
	else
	{
        alert('Unable to delete record. Please contact the administrator.');
	}
	
	return true;
}