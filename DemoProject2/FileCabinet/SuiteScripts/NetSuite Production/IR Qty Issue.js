/**
 * Module Description
 * 
 * Version    Date            Author           Remarks
 * 1.00       22 May 2015     anduggal
 *
 */

/**
 * The recordType (internal id) corresponds to the "Applied To" record in your script deployment. 
 * @appliedtorecord recordType
 *   
 * @returns {Boolean} True to continue save, false to abort save
 */
function clientSaveRecord()
{
	for ( var i = 1; i <= nlapiGetLineItemCount('item'); i++) {
		var qty = nlapiGetLineItemValue('item', 'quantity', i);
		nlapiLogExecution('DEBUG', 'Save Record - Quantity on line number ' + i + ' is: ', qty);
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
 * @returns {Boolean} True to continue changing field value, false to abort value change
 */
function clientValidateField(type, name, linenum)
{
   if (type == 'item' && name == 'quantity')
   {
	   var qty = nlapiGetLineItemValue('item', 'quantity', linenum);
	   nlapiLogExecution('DEBUG', 'Validate Field - Quantity on line number ' + linenum + ' is: ', qty);
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
function clientFieldChanged(type, name, linenum)
{
	if (type == 'item' && name == 'quantity')
	{
	   var qty = nlapiGetLineItemValue('item', 'quantity', linenum);
	   nlapiLogExecution('DEBUG', 'Field Changed - Quantity on line number ' + linenum + ' is: ', qty);
	}
}