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
 * 1.00       12 Sep 2013     bfeliciano
 *
 */

/**
 * The recordType (internal id) corresponds to the "Applied To" record in your script deployment. 
 * @appliedtorecord recordType
 *   
 * @returns {Boolean} True to continue save, false to abort save
 */

// P2P - config Bundle - Changes in the script based on Advanced Procurement Module

var _err_msg = '';
var hasFullReceivd = {};

function saveRecord_CheckValues(){
	try
	{
		// ----   P2P - config Bundle -----------------------
		var date = nlapiGetFieldValue('receiptdate');
		//alert('date='+date)
		
		if(date != '' && date != null && date != 'undefined')
		{
			var date1 =  nlapiStringToDate(date);
			//alert('date1='+date1)
			var date2 = new Date();
			//alert('date2='+date2)
			var diff = new Date(date2.getTime() - date1.getTime());
			diff = diff/8.64e7;
			//alert('diff='+diff)
			
			if (diff < 0)
			{
				date2 = nlapiDateToString(date2);
				alert('Receipt Date cannot be a Future Date');
				nlapiSetFieldValue('receiptdate', date2,false);
				return false;
			}
		}
		// ----  End of P2P - config Bundle -----------------------
		
		if ( !_checkField_ToReceive() )
		{
			alert(_err_msg);
			return false;					
		}		
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

    return true;
}

function validateLine_verifyLine( subListType )
{
	try
	{
		if ( subListType == 'itemlist')
		{
			var linenum = nlapiGetCurrentLineItemIndex(subListType);			
			if ( !_checkField_ToReceive(linenum) )
			{
				alert(_err_msg);
				return false;					
			}
		}
		
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


/**
 * The recordType (internal id) corresponds to the "Applied To" record in your script deployment. 
 * @appliedtorecord recordType
 * 
 * @param {String} type Sublist internal id
 * @param {String} name Field internal id
 * @param {Number} linenum Optional line item number, starts from 1
 * @returns {Void}
 */
function fieldChange_verifyReceiveLine(type, name, linenum)
{
	try
	{	
		// ----   P2P - config Bundle -----------------------
		if(name == 'receiptdate')
		{
			var date = nlapiGetFieldValue('receiptdate');
			//alert('date='+date)
			
			if(date != '' && date != null && date != 'undefined')
			{
				var date1 =  nlapiStringToDate(date);
				//alert('date1='+date1)
				var date2 = new Date();
				//alert('date2='+date2)
				var diff = new Date(date2.getTime() - date1.getTime());
				diff = diff/8.64e7;
				//alert('diff='+diff)
				
				if (diff < 0)
				{
					date2 = nlapiDateToString(date2);
					alert('Receipt Date cannot be a Future Date');
					nlapiSetFieldValue('receiptdate', date2, false);
				}
			}
			
		}
		// ----  End of P2P - config Bundle -----------------------
		
		if ( type == 'itemlist')
		{			
			switch (name)
			{
				case 'toreceive':
					if ( !_checkField_ToReceive(linenum) )
					{
						alert(_err_msg);
						return false;					
					}
					break;			
				case 'fullyrecieved':				
					var value = nlapiGetLineItemValue(type, name, linenum);
					if (value == 'T')
					{
						alert('By ticking this check box, you acknowledge that no more receipts are expected for this PO line. ' + 
							  'The relevant teams will be notified accordingly');
					}
					break;
				default:
					break;
			}
		}
		
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



function _checkField_ToReceive (linenum)
{	
	var lineCount = nlapiGetLineItemCount('itemlist');
	var hasProblems = false;
	var hasChanges = false;
	
	for (var line=1;line<=lineCount;line++)
	{
		if(linenum && linenum!=line)  continue;
		
		var stToRecv = nlapiGetLineItemValue('itemlist', 'toreceive', line);
		var stRemain = nlapiGetLineItemValue('itemlist', 'remaining', line);			
			stRemain = __fn.parseFloat( stRemain );
			
			// ----  P2P - config Bundle -----------------------
			
		/*if ( stToRecv.match(/\D/g) ) {
			_err_msg = 'The column to Receive must be a numerical value';
			nlapiSetLineItemValue('itemlist', 'toreceive', line, '');
			hasProblems = true;
			break;
		}*/
		
			// ----  End of P2P - config Bundle -----------------------
		
		var chkFully = nlapiGetLineItemValue('itemlist', 'fullyrecieved', line);
		var chkFullyOrig = nlapiGetLineItemValue('itemlist', 'fullyrecievedorig', line);
		if ( chkFully != chkFullyOrig) {hasChanges = true;}
		
		
		// check the checkbox
		stToRecv = __fn.parseFloat(stToRecv);
		if (!stToRecv) continue;
				
		if (stToRecv > stRemain) {
			_err_msg = '\'Quantity To Receive\' cannot be higher than the \'Remaining Quantity\''+
					   ' \ please enter a quantity equal to or less than \'Remaining Quantity\'';			
			hasProblems = true;
			nlapiSetLineItemValue('itemlist', 'toreceive', line, '');
			break;
		}
				
		hasChanges = true;
	}
	
	if (!linenum && !hasChanges)
	{
		_err_msg ='Please select at least one item to receive.';		
		hasProblems = true;	
	}	
	
	if (hasProblems) nlapiRefreshLineItems('itemlist');
	
	return !hasProblems;
}

