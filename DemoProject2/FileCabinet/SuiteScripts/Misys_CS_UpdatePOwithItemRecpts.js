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
var _HAS_CHANGES;
var _RECORD_BODY;
var _RECORD_LINE;

var _LINEFLDS = ['quantity','quantityreceived', 'item','custcol_po_rate','department','class','location'];
var _BODYFLDS = ['trandate', 'subsidiary','currency','exchangerate','department','location','class',
                 'entity','custbody_project_id','custbody_po_customer','custbody_opportunityno'];

var _ALL_LINES;
var _ALL_FIELDS;

var _INIT_HASRCVD;

/**
 * The recordType (internal id) corresponds to the "Applied To" record in your script deployment. 
 * @appliedtorecord recordType 
 * 
 * @param {String} type Access mode: create, copy, edit
 * @returns {Void}
 */
function pageInit_checkInitialLines(){
	try
	{
		return true;
//		_INIT_HASRCVD = !! _checkHasRcvd();
//		for (var i=0; i<_BODYFLDS.length; i++)
//		{
//			var _fld = _BODYFLDS[i];
//			var _value = nlapiGetFieldValue( _fld );
//			if (!!_value) _RECORD_BODY[_fld] = _value;
//		}
//		
//		var lineCount = nlapiGetLineItemCount('item');
//		_RECORD_BODY['_count'] = lineCount;
//		
//		for (var line=1; line <=lineCount; line++)
//		{
//			var _recLine = {};
//			for (var i=0; i<_LINEFLDS.length; i++)
//			{
//				var _fld = _LINEFLDS[i];
//				var _value = nlapiGetLineItemValue('item', _fld, line);
//				if (!!_value) _recLine[_fld] = _value;
//			}
//			
//			_RECORD_LINE[line] = _recLine;
//		}
//		
		return true;
	}
	catch (error)
	{		
	    if (error.getDetails != undefined)
	    {
	        //nlapiLogExecution( 'ERROR', 'Process Error',error.getCode() + ': ' + error.getDetails());	        
	        throw error;
	    }
	    else
	    {
	        //nlapiLogExecution( 'ERROR', 'Unexpected Error',error.toString());
	        throw nlapiCreateError('99999' , error.toString());
	    }
	}    
}

function _checkHasRcvd()
{
	var lineCount = nlapiGetLineItemCount('item');
	var rcvdItems = 0;
	for (var line=1; line<=lineCount; line++)		
	{
		var rcvd = nlapiGetLineItemValue('item', 'quantityreceived', line);
		
		if (rcvd &&  parseInt(rcvd,10) >= 1 )
			rcvdItems++;	
	}
	
	return rcvdItems;	
}

/**
 * The recordType (internal id) corresponds to the "Applied To" record in your script deployment. 
 * @appliedtorecord recordType
 *   
 * @returns {Boolean} True to continue save, false to abort save
 */
function saveRecord_PurchOrderHasChanged()
{
	try
	{
		return true;
		// first check if PO has received
//		var lineCount = nlapiGetLineItemCount('item');
//		
//		alert(JSON.stringify( [_RECORD_BODY, _RECORD_LINE, _HAS_CHANGES, _INIT_HASRCVD] ));
//		
//		if (!_INIT_HASRCVD) return true; //if no rcvd just return 
//		
//		if ( !_HAS_CHANGES )
//		{
//			var _HAS_RCVD = false;			
//			for (var line=1; line<=lineCount; line++)
//			{
//				if (!_HAS_RCVD)
//				{
//					var rcvdItems = nlapiGetLineItemValue('item', 'quantityreceived', line);
//					_HAS_RCVD = ( rcvdItems && parseInt(rcvdItems, 10) > 0 );
//				}
//				
//				if (_HAS_RCVD)
//				{
//					for (var _fld in _LINEFLDS)
//					{
//						var _value = nlapiGetLineItemValue('item', _fld, line);					
//						if (_value != _RECORD_LINE[line][_fld])
//						{
//							_HAS_CHANGES = true;
//							break;						
//						}
//					}
//					if ( _HAS_CHANGES ) break;
//				}
//			}
//			
//			//nlapiLogExecution('DEBUG', 'save record', '.. check line changes ' + JSON.stringify( [_HAS_RCVD, _HAS_CHANGES] ) );
//			if (!_HAS_RCVD) return true; // exit checking if no _HAS_RCVD;
//		}
//		
//		// check for changes
//		if ( !_HAS_CHANGES )
//		{
//			for (var _fld in _BODYFLDS)
//			{
//				var _value = nlapiGetFieldValue(_fld );
//				
//				if ( _value != _RECORD_BODY[_fld])
//				{
//					_HAS_CHANGES = true;
//					break;			
//				}
//			}
//			//nlapiLogExecution('DEBUG', 'save record', '.. check field changes ' + JSON.stringify( [_HAS_CHANGES] ) );
//		}
//		
//		
//		if ( !_HAS_CHANGES )
//		{
//			if ( _RECORD_BODY['_count'] != lineCount) _HAS_CHANGES = true;		
//			//nlapiLogExecution('DEBUG', 'save record', '.. check line counts changes' + JSON.stringify( [_HAS_CHANGES] ) );
//		}
//		
//		if ( !_HAS_CHANGES )
//		{
//			for (var line=1; line<=lineCount; line++)
//			{
//				for (var _fld in _LINEFLDS)
//				{
//					var _value = nlapiGetLineItemValue('item', _fld, line);
//					
//					if (_value != _RECORD_LINE[line][_fld])
//					{
//						_HAS_CHANGES = true;
//						break;						
//					}
//				}
//				if ( _HAS_CHANGES ) break;
//			}
//			//nlapiLogExecution('DEBUG', 'save record', '.. check line changes' + JSON.stringify( [_HAS_CHANGES] ) );
//		}
//		
//		if ( _HAS_CHANGES )
//		{
//			var stBeforeSaveChange = __fn.getScriptParameter('custscript_beforesave_msg');
//			if ( __is.empty(stBeforeSaveChange) ) return true;
//					
//			return window.confirm ( stBeforeSaveChange );
//		}
//		
		
		return true;
	}
	catch (error)
	{		
	    if (error.getDetails != undefined)
	    {
	        //nlapiLogExecution( 'ERROR', 'Process Error',error.getCode() + ': ' + error.getDetails());	        
	        throw error;
	    }
	    else
	    {
	        //nlapiLogExecution( 'ERROR', 'Unexpected Error',error.toString());
	        throw nlapiCreateError('99999' , error.toString());
	    }
	} 

    return true;
}

/**
 * The recordType (internal id) corresponds to the "Applied To" record in your script deployment. 
 * @appliedtorecord recordType
 * 
 * @param {String} type Sublist internal id
 * @param {String} name Field internal id
 * @param {Number} linenum Optional line item number, starts from 1
 * @returns {Void}
 */
function validateLine_QtyChange(type)
{
	try
	{
		return true;
		
		if ( type == 'item')
		{
			var lineItem = nlapiGetCurrentLineItemValue('item', 'item');
			// get the recived
			var stRcvd = nlapiGetCurrentLineItemValue('item', 'quantityreceived');
				stRcvd = __fn.parseInt(stRcvd);
				
			var stQty  = nlapiGetCurrentLineItemValue('item', 'quantity');
				stQty = __fn.parseInt(stQty);
				
			var stLine = nlapiGetCurrentLineItemIndex('item');
			
			if ( _RECORD_LINE[stLine] && _RECORD_LINE[stLine]['item'] == lineItem )
			{
				if (stRcvd && stRcvd > stQty)
				{
					var stQtyCheckMsg = __fn.getScriptParameter('custscript_lineqty_msg');
					window.alert(stQtyCheckMsg);
					_HAS_CHANGES = true;
					
					return true;
				}
			}
			else
			{
				_HAS_CHANGES = true;
				return true;
			}
			
			return true;
		}
		
		return true;		
	}
	catch (error)
	{		
	    if (error.getDetails != undefined)
	    {
	        //nlapiLogExecution( 'ERROR', 'Process Error',error.getCode() + ': ' + error.getDetails());	        
	        throw error;
	    }
	    else
	    {
	        //nlapiLogExecution( 'ERROR', 'Unexpected Error',error.toString());
	        throw nlapiCreateError('99999' , error.toString());
	    }
	} 
}