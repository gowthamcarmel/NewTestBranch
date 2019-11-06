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
var _INVALID_FORMS = ['123','126'];

//var _LOG_SCRIPTTYPE = __SCRIPTTYPE_USEREVENT;
/**
 * Module Description
 * 
 * Version    Date            Author           Remarks
 * 1.00       10 Sep 2013     bfeliciano
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
function beforeLoad_POReceiptButton(type, form, request)
{
	try
	{
		__log.start({
			 'logtitle'  : 'POItemReceiptBtn'
			,'company' 	 : 'Misys'
			,'scriptname': 'Misys_CS_POReceiptButton.js'
			,'scripttype': 'userevent'
		});
		
		var exec = nlapiGetContext().getExecutionContext();
		__log.writev('type/context', [type,exec]);		
		
		if (!__is.inArray(['view'], type) ) 
			return __log.end('Ignoring type: ' + type, true);
		
		if (!__is.inArray(['userinterface'], exec) ) 
			return __log.end('Ignoring execution context:' + exec, true);
		
		var stEmployee = nlapiGetFieldValue('employee');
		var stCurrentUser = nlapiGetContext().getUser();
		__log.writev(' Current User / Employee ', [stEmployee, stCurrentUser]);
		
		//if( stEmployee != stCurrentUser)
		//	return __log.end('PO Employee is not the current user');
		
		
		
		
		//var cx = nlapiGetContext();
		//var roleCenter = cx.getRoleCenter();		
		//__log.writev('** Role Center', [roleCenter]);		
		//if (!__is.inArray(['EMPLOYEE'], roleCenter) ) 
		//	return __log.end('Invalid role center:' + roleCenter, true);
				
		var stPurchOrdID = nlapiGetRecordId();
		__log.writev('*** Purchase Order', [stPurchOrdID]);
		
		// get the status of this Purchase Order
		var stPurchOrdStatus = nlapiLookupField(nlapiGetRecordType(), nlapiGetRecordId(), 'status');
		if ( !__is.inArray(['pendingReceipt','partiallyReceived','pendingBillPartReceived'], stPurchOrdStatus)) 
			return __log.end('Ignoring status:' + stPurchOrdStatus, true);;
		
		// check the Form 
		var stCustomForm = nlapiLookupField(nlapiGetRecordType(), nlapiGetRecordId(), 'customform');
		if ( __is.inArray(_INVALID_FORMS, stCustomForm)) return true;		
		
		__log.writev('Status: ', [stPurchOrdStatus]);
				
		// check for any items
		var lineItemCount = nlapiGetLineItemCount('item');
		var hasReceivableItems = false;
		
		__log.writev('Total line items', [lineItemCount]);
		
		for (var line=1; line<=lineItemCount; line++)
		{
			var stItem = nlapiGetLineItemValue('item', 'item', line);
			__log.writev('... item?', [line, stItem]);			
			
			// check the item if fulfillable
			var stIsFulfillable = nlapiLookupField('item', stItem, 'isfulfillable');
			__log.writev('...... fullfillable?', [line, stIsFulfillable]);
			if ( stIsFulfillable == 'F' ) continue;			
			
			var stFullyRecvd = nlapiGetLineItemValue('item', 'custcol_fullyreceived', line);
			__log.writev('...... fully received?', [line, stFullyRecvd]);			
//			if ( stFullyRecvd == 'T') continue;
			
			var intAllQuantity	= __fn.parseInt( nlapiGetLineItemValue('item', 'quantity', line) );
			var intItemShipped 	= __fn.parseInt( nlapiGetLineItemValue('item', 'quantityreceived', line) || 0 );
			
			var intRemaining = intAllQuantity - intItemShipped;
			
			__log.writev('...... remaining?', [line, intAllQuantity,intItemShipped, intRemaining]);
			
			if ( intRemaining > 0 ) hasReceivableItems = true;
		}
		
		__log.writev('Has receivables?', [hasReceivableItems]);
		
		// make this script a library 		
		form.setScript( nlapiGetContext().getScriptId() );
		form.addButton('custpage_btnreceive', 'Receive Items', 'buttonClick_Receive(\''+stPurchOrdID+'\')').setDisabled(!hasReceivableItems);
		
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

function buttonClick_Receive(stPurchOrdID)
{
	
	if (!stPurchOrdID) return false;
	
	//  get the suitelet url
	var strURL = nlapiResolveURL('SUITELET', 'customscript_emplcentr_po_receipt', 'customdeploy_emplcentr_po_receipt');
		strURL+='&refid='+ stPurchOrdID;
	
	if (__window_receivepage && !__window_receivepage.closed) {
		__window_receivepage.location.href = strURL;
		__window_receivepage.focus();
	} else {
		__window_receivepage = window.open(strURL, '__window_receivepage', 'scrollbars=yes,menubar=no,width=800,height=600,toolbar=no');
	}
	
	return __window_receivepage;
}