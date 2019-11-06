/**
 * Module Description
 * 
 * Version    Date            Author           Remarks
 * 1.00       17 Mar 2015     anduggal
 *
 */

var invId;
var invRec;
var account = '750010';
var baccount = '350050';
var otherIndex;
var cashIndex;

/**
 * The recordType (internal id) corresponds to the "Applied To" record in your script deployment. 
 * @appliedtorecord recordType 
 * 
 * @param {String} type Access mode: create, copy, edit
 * @returns {Void}
 */
function clientPageInit(type)
{
	if (type == 'create')
	{
		invId = GetUrlValue('invoice');
		if (isNotEmpty(invId))
		{
		   invRec = nlapiLoadRecord('invoice', invId);
		   
		   //Select new line item from 'Other Deposits' tab
		   nlapiSelectNewLineItem('other');
		   nlapiSetCurrentLineItemValue('other', 'entity', invRec.getFieldValue('entity'));
		   nlapiSetCurrentLineItemValue('other', 'department', invRec.getLineItemValue('item', 'department', '1'));
		   nlapiSetCurrentLineItemValue('other', 'class', invRec.getLineItemValue('item', 'class', '1'));
		   nlapiSetCurrentLineItemValue('other', 'location', invRec.getFieldValue('location'));
		   nlapiSetCurrentLineItemValue('other', 'amount', invRec.getFieldValue('amountremaining'));
		   nlapiSetCurrentLineItemText('other', 'account', account);
		   nlapiSetCurrentLineItemValue('other', 'paymentmethod', 3);
		   nlapiSetCurrentLineItemValue('other', 'memo', invRec.getFieldValue('tranid'));
		   
		   //Commit the line item
		   nlapiCommitLineItem('other');
		   
		   //Select new line item from 'Cash Back' tab
		   nlapiSelectNewLineItem('cashback');
		   nlapiSetCurrentLineItemValue('cashback', 'department', invRec.getLineItemValue('item', 'department', '1'));
		   nlapiSetCurrentLineItemValue('cashback', 'class', invRec.getLineItemValue('item', 'class', '1'));
		   nlapiSetCurrentLineItemValue('cashback', 'location', invRec.getFieldValue('location'));
		   nlapiSetCurrentLineItemText('cashback', 'account', baccount);
		   nlapiSetCurrentLineItemValue('cashback', 'memo', 'Bank Charges');
		   
		   //Commit the line item
		   nlapiCommitLineItem('cashback');
		   
		   nlapiSetFieldValue('custbody_mys_dep_invoice', invId);
		   nlapiSetFieldValue('department', invRec.getLineItemValue('item', 'department', '1'));
		   nlapiSetFieldValue('class', invRec.getLineItemValue('item', 'class', '1'));
		   nlapiSetFieldValue('location', invRec.getFieldValue('location'));
		}
	}
	else if (type == 'edit')
	{
		invId = nlapiGetFieldValue('custbody_mys_dep_invoice');
		if (isNotEmpty(invId))
		{
			invRec = nlapiLoadRecord('invoice', invId);
		}
	}
}

/**
 * The recordType (internal id) corresponds to the "Applied To" record in your script deployment. 
 * @appliedtorecord recordType
 * 
 * @param {String} type Sublist internal id
 * @param {String} name Field internal id
 * @returns {Void}
 */
function clientPostSourcing(type, name)
{
	if (name == 'subsidiary' && isNotEmpty(invId))
	{
		otherIndex = nlapiGetCurrentLineItemIndex('other');
		cashIndex = nlapiGetCurrentLineItemIndex('cashback');
		
		//Select new line item from 'Other Deposits' tab
		nlapiSelectLineItem('other', otherIndex);
		if (nlapiGetCurrentLineItemValue('other', 'memo'))
		{
			if (isEmpty(nlapiGetCurrentLineItemValue('other', 'account')))
			{
				nlapiSetCurrentLineItemText('other', 'account', account);
			}
			nlapiSetCurrentLineItemValue('other', 'entity', invRec.getFieldValue('entity'));
			nlapiSetCurrentLineItemValue('other', 'department', invRec.getLineItemValue('item', 'department', '1'));
			nlapiSetCurrentLineItemValue('other', 'class', invRec.getLineItemValue('item', 'class', '1'));
			nlapiSetCurrentLineItemValue('other', 'location', invRec.getFieldValue('location'));
			
			//Commit the line item
			nlapiCommitLineItem('other');
		}
		
		//Select new line item from 'Cash Back' tab
		nlapiSelectLineItem('cashback', cashIndex);
		if (nlapiGetCurrentLineItemValue('cashback', 'memo'))
		{
			if (isEmpty(nlapiGetCurrentLineItemValue('cashback', 'account')))
			{
				nlapiSetCurrentLineItemText('cashback', 'account', baccount);
			}
			nlapiSetCurrentLineItemValue('cashback', 'department', invRec.getLineItemValue('item', 'department', '1'));
			nlapiSetCurrentLineItemValue('cashback', 'class', invRec.getLineItemValue('item', 'class', '1'));
			nlapiSetCurrentLineItemValue('cashback', 'location', invRec.getFieldValue('location'));
			
			//Commit the line item
			nlapiCommitLineItem('cashback');
		}
		
		var count = nlapiGetLineItemCount('other');
		if (count)
		{
			for ( var i = 1; i <= count; i++)
			{
				nlapiSelectLineItem('other', i);
				if (nlapiGetCurrentLineItemValue('other', 'memo'))
				{
					nlapiSetCurrentLineItemValue('other', 'entity', invRec.getFieldValue('entity'));
				}
				nlapiCommitLineItem('other');
			}
		}
		
		nlapiSetFieldValue('department', invRec.getLineItemValue('item', 'department', '1'));
		nlapiSetFieldValue('class', invRec.getLineItemValue('item', 'class', '1'));
		nlapiSetFieldValue('location', invRec.getFieldValue('location'));
	}
}

/**
 * The recordType (internal id) corresponds to the "Applied To" record in your script deployment. 
 * @appliedtorecord recordType
 *   
 * @param {String} type Sublist internal id
 * @returns {Boolean} True to save line item, false to abort save
 */
function clientValidateLine(type)
{
	if (isNotEmpty(invId))
	{
		if (type == 'other')
		{
			nlapiSetCurrentLineItemValue('other', 'entity', invRec.getFieldValue('entity'));
			nlapiSetCurrentLineItemValue('other', 'department', invRec.getLineItemValue('item', 'department', '1'));
			nlapiSetCurrentLineItemValue('other', 'class', invRec.getLineItemValue('item', 'class', '1'));
			nlapiSetCurrentLineItemValue('other', 'location', invRec.getFieldValue('location'));
			
			if (isEmpty(nlapiGetCurrentLineItemValue('other', 'amount')))
			{
				nlapiSetCurrentLineItemValue('other', 'amount', invRec.getFieldValue('amountremaining'));
			}
			if (isEmpty(nlapiGetCurrentLineItemValue('other', 'paymentmethod')))
			{
				nlapiSetCurrentLineItemValue('other', 'paymentmethod', 3);
			}
			if (isEmpty(nlapiGetCurrentLineItemValue('other', 'memo')))
			{
				nlapiSetCurrentLineItemValue('other', 'memo', invRec.getFieldValue('tranid'));
			}
		}
		else if (type == 'cashback')
		{
			nlapiSetCurrentLineItemValue('cashback', 'department', invRec.getLineItemValue('item', 'department', '1'));
			nlapiSetCurrentLineItemValue('cashback', 'class', invRec.getLineItemValue('item', 'class', '1'));
			nlapiSetCurrentLineItemValue('cashback', 'location', invRec.getFieldValue('location'));
			
			if (isEmpty(nlapiGetCurrentLineItemValue('cashback', 'memo')))
			{
				nlapiSetCurrentLineItemValue('cashback', 'memo', 'Bank Charges');
			}
		}
	}
	return true;
}

function GetUrlValue(VarSearch)
{
    var SearchString = window.location.search.substring(1);
    var VariableArray = SearchString.split('&');
    
    for (var i = 0; i < VariableArray.length; i++)
    {
        var KeyValuePair = VariableArray[i].split('=');
        if (KeyValuePair[0] == VarSearch)
        {
        	return KeyValuePair[1];
        }
    }
}

function isEmpty(fld) {return (fld==null||fld=='');}
function isNotEmpty(fld) {return (fld!=null&&fld!='');}