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

// P2P - config Bundle - Changes in the script based on Advanced Procurement Module

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
			var lineSLcnt = _REQ.getLineItemCount('itemlist');
			__log.writev('LineItem count:', [lineSLcnt]);
			
			var lineCountIR = recItemRecpt.getLineItemCount('item');
			var hasLines = false;
			
			var recPO = nlapiLoadRecord('purchaseorder', stPurchOrdID, {'recordmode':'dynamic'});
			var poTran = recPO.getFieldValue('tranid');
			var hasChangesPO = false;
			
			for (var lineIR=1;lineIR<=lineCountIR;lineIR++)
			{
				var lineIRitem = recItemRecpt.getLineItemValue('item', 'item', lineIR);	
				var lineIRlineId = recItemRecpt.getLineItemValue('item', 'line', lineIR);	
				recItemRecpt.setLineItemValue('item', 'itemreceive', lineIR, 'F');// set this to 'F'
				recItemRecpt.setLineItemValue('item', 'quantity', lineIR, '0');// set this to 'F'
				
				__log.writev('*** Item Receipt Line', [lineIR, lineIRitem]);
				
				// search this on our submitted form
				for (var lineSL=1;lineSL<=lineSLcnt;lineSL++)
				{
					var lineSLitem = _REQ.getLineItemValue('itemlist', 'item', lineSL);
					var lineSLqty  = _REQ.getLineItemValue('itemlist', 'toreceive', lineSL);
					var lineSLfullyrcvd = _REQ.getLineItemValue('itemlist', 'fullyrecieved', lineSL);
					var lineSLfullyrcvdOrig = _REQ.getLineItemValue('itemlist', 'fullyrecievedorig', lineSL);
					var lineSLlineId = _REQ.getLineItemValue('itemlist', 'polineid', lineSL);

					__log.writev('***** suitelet line', [[lineIR, lineSL], [lineIRitem, lineSLitem], [lineIRlineId,lineSLlineId], 
					                                     lineSLqty, lineSLfullyrcvd, lineSLfullyrcvdOrig]);
					if ((lineIRitem == lineSLitem) && (lineIRlineId==lineSLlineId))
					{									
						if ( lineSLqty )
						{		
							__log.writev('...setting the item Receipt line', [lineIR, lineSLqty, lineSLfullyrcvd]);
							recItemRecpt.setLineItemValue('item', 'itemreceive', lineIR, 'T');// set this to 'F'
							recItemRecpt.setLineItemValue('item', 'quantity', lineIR, lineSLqty);
							recItemRecpt.setLineItemValue('item', 'custcol_fullyreceived', lineIR, lineSLfullyrcvd );
							hasLines = true;
						}
						
						
						if ( lineSLfullyrcvd != lineSLfullyrcvdOrig)
						{
							var stPOLine = recPO.findLineItemValue('item', 'line', lineSLlineId);
							if (stPOLine)
							{
								__log.writev('..updating the original purchase order', [stPurchOrdID, stPOLine, lineSLfullyrcvd, lineSLfullyrcvdOrig]);
								recPO.setLineItemValue('item', 'custcol_fullyreceived', stPOLine, lineSLfullyrcvd);
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
								   ,[ (new nlobjSearchColumn('custcol_fullyreceived')),(new nlobjSearchColumn('description','item')),(new nlobjSearchColumn('memo')) ,(new nlobjSearchColumn('quantity'))]);
		
		__log.writev('results..', [arrSearchPOItems ? arrSearchPOItems.length : 0]);
		if (arrSearchPOItems)
		{
			// build the sublist
			var htmlItemlist = _FORM.addSubList('itemlist', 'list', 'Items');
				htmlItemlist.addField('idx', 'text', 'ID').setDisplayType('hidden');	
				htmlItemlist.addField('item', 'select', 'Item', 'item').setDisplayType('inline');
				htmlItemlist.addField('description', 'textarea', 'Description');// P2P - config Bundle
				htmlItemlist.addField('uom', 'select', 'UOM', 'customrecord_custom_uom_parent').setDisplayType('inline');;     // P2P - config Bundle
				htmlItemlist.addField('unit_type', 	'select', 'Unit Type', 'customrecord_custom_uom_child').setDisplayType('inline');;     // P2P - config Bundle
				htmlItemlist.addField('quantity', 	'float', 'PO Qty');     // P2P - config Bundle
				htmlItemlist.addField('received', 	'float', 'Received');     // P2P - config Bundle
				htmlItemlist.addField('remaining', 	'float', 'Remaining');	
				htmlItemlist.addField('toreceive', 	'float', 'To Receive').setDisplayType('entry');				
				htmlItemlist.addField('fullyrecieved','checkbox', 'No Further Receipts Expected');
				htmlItemlist.addField('fullyrecievedorig','text', '').setDisplayType('hidden');
				htmlItemlist.addField('polineid','integer', 'PO Line ID').setDisplayType('hidden');
				
			var arrItemValues = [];			
			for (var ii in arrSearchPOItems)
			{
				var searchRow = arrSearchPOItems[ii];
				//var qtyAll 		= Math.abs( __fn.parseInt( searchRow.getValue('quantity') ) );
				//var qtyBilled 	= __fn.parseInt( searchRow.getValue('quantitybilled') );
				//var qtyShipped 	= __fn.parseInt( searchRow.getValue('quantityshiprecv') );
              
              	var qtyAll 		=   Math.abs(searchRow.getValue('quantity'));    
				var qtyBilled 	=  searchRow.getValue('quantitybilled');  
				var qtyShipped 	=  searchRow.getValue('quantityshiprecv'); 
			
              
              
				var qtyRemaining = qtyAll - qtyShipped;//Math.abs(qtyAll - qtyShipped);
				var chkFullyRecived = searchRow.getValue('custcol_fullyreceived');
				var itemdescription = searchRow.getValue('memo');     // P2P - config Bundle
				var uom = searchRow.getValue('custcol_unit_of_measure');     // P2P - config Bundle
				var unit_type = searchRow.getValue('custcol_rc1');     // P2P - config Bundle
				
				__log.writev('... adding items', [searchRow.getValue('item'), qtyRemaining, qtyBilled, chkFullyRecived , qtyShipped,qtyAll,itemdescription]);
				//if (qtyRemaining && chkFullyRecived!='T') 
				if (qtyRemaining > 0)
					arrItemValues.push({
						 'idx'			: ii
						,'item' 		: searchRow.getValue('item')
						,'description'	: itemdescription     // P2P - config Bundle
						,'uom'	: uom     // P2P - config Bundle
						,'unit_type'	: unit_type     // P2P - config Bundle
						,'quantity'	: qtyAll     // P2P - config Bundle
						,'received'	: qtyShipped     // P2P - config Bundle
						//,'remaining'	: qtyRemaining.toString()
                        ,'remaining'	: qtyRemaining.toFixed(2)
						,'fullyrecieved' : searchRow.getValue('custcol_fullyreceived')//custcol_fullyreceived
						,'fullyrecievedorig' : searchRow.getValue('custcol_fullyreceived')//custcol_fullyreceived
						,'polineid' : searchRow.getValue('line')//line id
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
