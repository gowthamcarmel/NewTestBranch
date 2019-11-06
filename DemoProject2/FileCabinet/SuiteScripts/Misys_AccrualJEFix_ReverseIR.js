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
function sched_ReverseJEFix(type) {
	__log.start({
		 'logtitle'  : 'sched_ReverseJEFix'
		,'company' 	 : 'Misys'
		,'scriptname': 'Misys_AccrualJEFix_ReverseIR.js'
		,'scripttype': 'scheduled'
	});	
	try
	{
		var searchIRsReconciledPOs = __fn.getScriptParameter('custscript_search_reverseir');		
		var arrSearchResult = nlapiSearchRecord(null, searchIRsReconciledPOs);
		
		__log.writev('** Search results ..', [arrSearchResult ? arrSearchResult.length : 0]);
		if (! arrSearchResult) return __log.end('Empty Search results');
		
		
		var arrProcessedIRs = []; 
		
		for (var ii in arrSearchResult)
		{
			var searchRow = arrSearchResult[ii];		
			var stItemRecptID = searchRow.getValue('internalid');			
			if (__is.inArray(arrProcessedIRs, stItemRecptID) ) continue;
			
			var stPurchOrderId = searchRow.getValue('createdfrom');
			__log.writev('** Item Receipt / PO ', [stItemRecptID, stPurchOrderId]);			
			
			var dataPO = nlapiLookupField('purchaseorder', stPurchOrderId, ['custbody_po_reconciled','custbody_accrualje_no']);			
			var isReconciledPO = dataPO['custbody_po_reconciled'];
			
			__log.writev('** Is PO Reconciled? ', dataPO);
			
			if  ( isReconciledPO == 'T' && !__is.empty( dataPO['custbody_accrualje_no'] ))
			{
				_reverseJE(dataPO['custbody_accrualje_no']);
			}
			else
				__log.writev('...PO is either not reconciled or no JE needed for reconciliation');
			
			// set the PO to not reconciled
			__log.writev('... setting the PO back to unreconciled');
			__safe.nlapiSubmitField('purchaseorder', stPurchOrderId, 'custbody_po_reconciled', 'F');
			
			arrProcessedIRs.push(stItemRecptID);			

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


function _reverseJE (stJournalID)
{
	try
	{
		//o   Load the original JE.
		var recAccrualJE = nlapiLoadRecord('journalentry', stJournalID, {'recordmode':'dynamic'});
		__log.writev('...loading the accrual JE', [recAccrualJE.getFieldValue('tranid')]);
		__log.setCurrentRecord( recAccrualJE );
		
		//o   Create a new Journal Entry record  (Dynamic mode)  
		var recNewJE  = nlapiCreateRecord('journalentry', {'recordmode':'dynamic'});
		__log.write('...creating a new Journal Entry');
		

		//o   Set the Journal Entry Date as current date(Required for JE)  
		//o   Set the Journal Entry Subsidary as the original JE Subsidary (Required for JE)  
		//o   Set the Journal Entry Currency as the  original JE  Currency (Required for JE)  
		//o   Set  the  Journal  Entry  Exchange  Rate  as  the  original  JE  Exchange  Rate (Required for JE)  
		//o   Set  the  Journal  Entry  “Source  Purchase  Order”  field  as  the  original  JE Purchase Order   
		//o   Set  the  Journal  Entry  “Source  Item  Receipt/Bill”  field    with  the  Item Receipt internal id.  
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
				stValue = stJournalID;
				stJournalField = 'custbody_accrualje_no';
			}
			
			if (stValue)
			{
				__log.writev('...setting field value ', [stJournalField, stValue]);
				__safe.setFieldValue(recNewJE, stJournalField, stValue);
			}
		}
		
		//TODO o   Set   the   Item   Receipt   Number   Being   Deleted   to   the   “Source Item Receipt/Bill  Reference Number” text field (internal ind:tranid)
		//__safe.setFieldValue(recNewJE, 'custbody_source_itembill_refno', recItemRcpt.getFieldValue('tranid'));
		
		//o   Set the User Who Created the Item Receipt from the Item Receipt System Notes Set By field (for Type create)                                                                   	 
		//o   Set  the  JE  line  Memo  to  “Reversing  Item  Receipt  Purchase  Accrual  on  Delete of Item Receipt”
		__safe.setFieldValue(recNewJE, 'memo', 'Reversing  Item  Receipt  Purchase  Accrual');
		
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
				__safe.setCurrentLineItemValue(recNewJE, 'line', 'debit', stCreditAmount);
				__log.writev('*** Creating new JE line', ['debit', stCreditAmount]);				
			}
			else
			{
				__safe.setCurrentLineItemValue(recNewJE, 'line', 'credit', stDebitAmount);
				__log.writev('*** Creating new JE line', ['credit', stDebitAmount]);				
			}
			
			var arrLineFields = ['account','item', 'department','class','location', 
			                     'custcol_misysvendor', 'custcol_accruals_project',
			                     'custcol_item_accruals', 'custcol_accruals_opportunity',
			                     'custcol_misyscategory',  'custcol_misyssubcategory1', 
			                     'custcol_misyssubcategory2',
			                     'custcol_accruals_customer'];				
			for (var iii in arrLineFields)
			{
				var fld = arrLineFields[iii];					
				var stValue = recAccrualJE.getLineItemValue('line', fld, lineAccJE);
				
				__safe.setCurrentLineItemValue(recNewJE, 'line', fld, stValue);
				__log.writev('... Setting line field value', [fld, stValue, lineAccJE]);
			}
			
			__safe.setCurrentLineItemValue(recNewJE, 'line', 'memo', 'Reversing  Item  Receipt  Purchase  Accrual');
			
			// commit the line
			recNewJE.commitLineItem('line');
		}
		
		// save the JE
		var resultID = __safe.nlapiSubmitRecord(recNewJE, true, true);
		if ( resultID )
		{
			__log.writev('Created Journal Entry ', [resultID]);
			nlapiSubmitField('journalentry', stJournalID, 'custbody_accrualje_no', resultID);
			
			return true;
		}
		else
			return false;
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




//--------------------------------------//
var __ZEROPRECISION_CURRENCIES = [15,18,20,36,44,57];
function _roundToCurrencyPrecision ( amount, currency){
	var  newAmount = amount;
	
	if ( __is.inArray(__ZEROPRECISION_CURRENCIES, currency) )
		newAmount = Math.round( amount);
	else
		newAmount = __fn.roundOff(amount, 2);
		return newAmount;
}
