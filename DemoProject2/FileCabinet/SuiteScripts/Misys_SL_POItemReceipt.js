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
 * 1.00       10 Sep 2013     bfeliciano
 *
 */
var _REQ=false,_RESP=false,_PARAMS={}, _FORM={};


/**
 * @param {nlobjRequest} request Request object
 * @param {nlobjResponse} response Response object
 * @returns {Void} Any output is written via response object
 */
function suitelet_POItemReceipt(request, response)
{
	try
	{
		__log.start({
			 'logtitle'  : 'POItemReceipt'
			,'company' 	 : 'Misys'
			,'scriptname': 'Misys_SL_POItemReceipt.js'
			,'scripttype': 'suitelet'
		});
		
		_REQ = request, _RESP = response, _PARAMS = {};
		
		var stHeaderText = 'New Item Receipt';
		_FORM = nlapiCreateForm(stHeaderText, true);
		__log.writev('header text: ', stHeaderText);
		
		var stPurchOrdID = _REQ.getParameter('refid');
		__log.writev('*** Purchase ID', [stPurchOrdID]);
		
		if ( !stPurchOrdID)
			return __error.slet_report('Purchase ID cannot be empty');
		
		__log.writev('** Method', [_REQ.getMethod()]);
		
		
		if ( _REQ.getMethod() == 'POST')
		{	
			__log.writev('** Transforming the PurchaseOrder to item receipt');
			
			// transform it
			var recItemRecpt = nlapiTransformRecord('purchaseorder', stPurchOrdID, 'itemreceipt');
			
			// set the Memo to memo
			var stMemo = _REQ.getParameter('memo');
			if (!__is.empty(stMemo))
				__safe.setFieldValue(recItemRecpt, 'memo', stMemo);
			
			// set the trandate		
			var stReceiptDate = _REQ.getParameter('receiptdate');
			if (!__is.empty(stReceiptDate))
				__safe.setFieldValue(recItemRecpt, 'trandate', stReceiptDate);
			
			// check the lines
			var lineCount = _REQ.getLineItemCount('itemlist');
			__log.writev('LineItem count:', [lineCount]);
			
			var lineCountIR = recItemRecpt.getLineItemCount('item');
			var hasLines = false;
			
			var recPO = nlapiLoadRecord('purchaseorder', stPurchOrdID, {'recordmode':'dynamic'});
			var poTran = recPO.getFieldValue('tranid');
			var hasChangesPO = false;
			
			for (var  line=1;line<=lineCountIR;line++)
			{
				var itemRcptItem = recItemRecpt.getLineItemValue('item', 'item', line);								
				recItemRecpt.setLineItemValue('item', 'itemreceive', line, 'F');// set this to 'F'
				recItemRecpt.setLineItemValue('item', 'quantity', line, '0');// set this to 'F'
				
				__log.writev('*** Item Receipt Line', [line, itemRcptItem]);
				
				// search this on our submitted form
				for (var lineItem=1;lineItem<=lineCount;lineItem++)
				{
					var _item = _REQ.getLineItemValue('itemlist', 'item', lineItem);
					var _qty  = _REQ.getLineItemValue('itemlist', 'toreceive', lineItem);
					var _fullyrcvd = _REQ.getLineItemValue('itemlist', 'fullyrecieved', lineItem);
					var _fullyrcvdOrig = _REQ.getLineItemValue('itemlist', 'fullyrecievedorig', lineItem);


					if (itemRcptItem == _item )
					{
						__log.writev('***** suitelet line', [lineItem, _item, _qty, _fullyrcvd, _fullyrcvdOrig]);				
						if ( _qty )
						{		
							__log.writev('...setting the item Receipt line', [line, _qty, _fullyrcvd]);
							recItemRecpt.setLineItemValue('item', 'itemreceive', line, 'T');// set this to 'F'
							recItemRecpt.setLineItemValue('item', 'quantity', line, _qty);
							recItemRecpt.setLineItemValue('item', 'custcol_fullyreceived', line, _fullyrcvd );
							hasLines = true;
						}
						
						
						if ( _fullyrcvd != _fullyrcvdOrig)
						{
							var stPOLine = recPO.findLineItemValue('item', 'item', _item);
							if (stPOLine)
							{
								__log.writev('..updating the original purchase order', [stPurchOrdID, stPOLine, _fullyrcvd, _fullyrcvdOrig]);
								recPO.setLineItemValue('item', 'custcol_fullyreceived', stPOLine, _fullyrcvd);
								hasChangesPO = true;
							}
						}
					}
					
				}				
			}
			
			try {
				var resultId = false;				
				var msgs = [];
				__log.writev('** Applying the changes [PO/ItemRcpt]', [hasChangesPO, hasLines]);
				
				if (hasChangesPO)					
				{
					//update the PO first
					resultId = nlapiSubmitRecord(recPO, true, true);
					__log.writev('..updated PO ', [resultId]);
					
					// var poLink = nlapiResolveURL('RECORD', 'purchaseorder', stPurchOrdID);
					
					if(!hasLines)					
						msgs.push('Updated the Purchase Order ' + poTran + ' ('+stPurchOrdID+') ');
				}
				
				if ( hasLines )
				{					
					resultId = nlapiSubmitRecord( recItemRecpt, true, true);
					__log.writev('..resultId', [resultId]);
					var itemRecptTran = nlapiLookupField('itemreceipt', resultId, 'tranid');
					// var itemRecptLink = nlapiResolveURL('RECORD', 'itemreceipt', resultId);					
										
					msgs.push('Created Item Receipt ' + itemRecptTran + ' ('+resultId+')');
				}
				
				// get the email template
				var stEmailTo = nlapiGetContext().getEmail();
				var emailsender = nlapiGetContext().getUser();
				var subject = 'EC Item Receipt Report';
				var message = msgs.join('<p>');
				
				if (stEmailTo)
				{
					__log.writev('...sending email to ', [stEmailTo, emailsender, subject, message]);
					nlapiSendEmail(emailsender, stEmailTo, subject, message);
					
					// display this message 
					_FORM.addField('suitelemsg', 'inlinehtml').setDefaultValue(message);
					_FORM.addButton('custpage_btnclose', 'Close', '(function(){window.opener.location.reload(true);self.close();})()');
				}
				else
				{
					// just message the suitelet
					_FORM.addField('suitelemsg', 'inlinehtml').setDefaultValue(message);
				}
								
			} catch (err){
				var errstr = err.toString();
				_FORM.addButton('custpage_btngoback', 'Go Back', '(function(){history.go(-1);})()');					
				
				return __error.slet_report(errstr);
			}
			
			// save this item receipt			
			_RESP.writePage(_FORM);
			return __log.end('',true);		
		}
		
				
		var paramItemSearch = __fn.getScriptParameter('custscript_item_ssearch');		
		__log.writev('*** Item search', [paramItemSearch]);
		
		_FORM.setScript('customscript_emplcentr_itmrecpt_helper');
		
		var recPO = nlapiLoadRecord('purchaseorder', stPurchOrdID);
		
		// add the buttons
		_FORM.addSubmitButton('Save');
		_FORM.addButton('custpage_btncancel', 'Cancel', '(function(){self.close();})()');
		_FORM.addButton('custpage_btnreset', 'Reset', '(function(){self.location.reload(true);})()');
		
		_FORM.addField('refid', 'text')
			 .setDisplayType('hidden')
			 .setDefaultValue(stPurchOrdID);
		
		// now the fields
		_FORM.addField('ponumber', 'text', 'PO Number')
			 .setDisplayType('disabled')
			 .setDefaultValue(recPO.getFieldValue('tranid'));
					
		_FORM.addField('podate', 'date', 'PO Date')
			 .setDisplayType('disabled')
			 .setDefaultValue(recPO.getFieldValue('trandate'));
		
		
		_FORM.addField('vendorname', 'text', 'Vendor Name')
			 .setDisplayType('disabled')
			 .setDefaultValue(recPO.getFieldText('entity'));
		
		var strDate = nlapiDateToString( new Date() );			 
		_FORM.addField('receiptdate', 'date', 'Receipt Date')
			 .setDefaultValue( strDate );
		
		_FORM.addField('memo', 'longtext', 'Memo');
		
		// do the search 
		var arrSearchPOItems = nlapiSearchRecord('purchaseorder', paramItemSearch
								   ,[ (new nlobjSearchFilter('internalid', null, 'anyof', [stPurchOrdID])) ]									
								   ,[ (new nlobjSearchColumn('custcol_fullyreceived')) ]);
		
		__log.writev('results..', [arrSearchPOItems ? arrSearchPOItems.length : 0]);
		if (arrSearchPOItems)
		{
			// build the sublist
			var htmlItemlist = _FORM.addSubList('itemlist', 'list', 'Items');
				htmlItemlist.addField('idx', 		'text',	'ID').setDisplayType('hidden');	
				htmlItemlist.addField('item', 		'select', 'Item', 'item').setDisplayType('inline');
				htmlItemlist.addField('remaining', 	'float', 'Remaining');	
				htmlItemlist.addField('toreceive', 	'float', 'To Receive').setDisplayType('entry');				
				htmlItemlist.addField('fullyrecieved','checkbox', 'No Further Receipts Expected');
				htmlItemlist.addField('fullyrecievedorig','text', '').setDisplayType('hidden');
				
			var arrItemValues = [];			
			for (var ii in arrSearchPOItems)
			{
				var searchRow = arrSearchPOItems[ii];
				var qtyAll 		= Math.abs( __fn.parseInt( searchRow.getValue('quantity') ) );
				var qtyBilled 	= __fn.parseInt( searchRow.getValue('quantitybilled') );
				var qtyShipped 	= __fn.parseInt( searchRow.getValue('quantityshiprecv') );
				var qtyRemaining = qtyAll - qtyShipped;//Math.abs(qtyAll - qtyShipped);
				var chkFullyRecived = searchRow.getValue('custcol_fullyreceived');
				
				__log.writev('... adding items', [searchRow.getValue('item'), qtyRemaining, qtyBilled, chkFullyRecived]);
				//if (qtyRemaining && chkFullyRecived!='T') 
				if (qtyRemaining > 0)
					arrItemValues.push({
						 'idx'			: ii
						,'item' 		: searchRow.getValue('item')
						,'remaining'	: qtyRemaining.toString()
						,'fullyrecieved' : searchRow.getValue('custcol_fullyreceived')//custcol_fullyreceived
						,'fullyrecievedorig' : searchRow.getValue('custcol_fullyreceived')//custcol_fullyreceived
					});
			}
			htmlItemlist.setLineItemValues(arrItemValues);
		}
		
		_RESP.writePage(_FORM);		
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

