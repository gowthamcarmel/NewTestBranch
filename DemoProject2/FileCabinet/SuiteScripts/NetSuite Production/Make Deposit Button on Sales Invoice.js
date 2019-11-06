/**
 * Module Description
 * 
 * Version    Date            Author           Remarks
 * 1.00       11 Feb 2015     anduggal
 *
 */

/**
 * The recordType (internal id) corresponds to the "Applied To" record in your script deployment. 
 * @appliedtorecord recordType
 *   
 * @param {String} type Operation types: create, edit, view, copy, print, email
 * @param {nlobjForm} form Current form
 * @param {nlobjRequest} request Request object
 * @returns {Void}
 */
function userEventBeforeLoad(type, form, request){
	try
	{
		__log.start({
			 'logtitle'  : 'InvMakeDepositBtn'
			,'company' 	 : 'Misys'
			,'scriptname': 'Make Deposit Button on Sales Invoice.js'
			,'scripttype': 'userevent'
		});
		
		var exec = nlapiGetContext().getExecutionContext();
		__log.writev('type/context', [type,exec]);		
		
		if (!__is.inArray(['view'], type) ) 
			return __log.end('Ignoring type: ' + type, true);
		
		if (!__is.inArray(['userinterface'], exec) ) 
			return __log.end('Ignoring execution context:' + exec, true);
		
		var stInvoiceID = nlapiGetRecordId();
		__log.writev('*** Invoice', [stInvoiceID]);
		
		// get the status of this Invoice
		var stInvoiceStatus = nlapiLookupField(nlapiGetRecordType(), nlapiGetRecordId(), 'status');
		if ( !__is.inArray(['open'], stInvoiceStatus))
			return __log.end('Ignoring status:' + stInvoiceStatus, true);;	
		
		__log.writev('Status: ', [stInvoiceStatus]);
		
		// make this script a library 		
		form.setScript( nlapiGetContext().getScriptId() );
		form.addButton('custpage_btndeposit', 'Make Deposit', 'buttonClick_Deposit(\''+stInvoiceID+'\')');
		
		return __log.end('endofscript',true);
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

var __window_receivepage = false;

function buttonClick_Deposit(stInvoiceID)
{
	if (!stInvoiceID) return false;
	
	var strURL = nlapiResolveURL('TASKLINK', 'EDIT_TRAN_DEPOSIT');
	strURL += '?&invoice=' + stInvoiceID;
	window.location = strURL;

}