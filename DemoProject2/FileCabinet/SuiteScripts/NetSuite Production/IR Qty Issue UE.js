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
 * @param {String} type Operation types: create, edit, delete, xedit
 *                      approve, reject, cancel (SO, ER, Time Bill, PO & RMA only)
 *                      pack, ship (IF)
 *                      markcomplete (Call, Task)
 *                      reassign (Case)
 *                      editforecast (Opp, Estimate)
 * @returns {Void}
 */
function userEventBeforeSubmit(type)
{
	var irRec = nlapiGetNewRecord();
	for ( var i = 1; i <= irRec.getLineItemCount('item'); i++)
	{
		var qty = irRec.getLineItemValue('item', 'quantity', i);
		nlapiLogExecution('DEBUG', 'Quantity on line number ' + i + ' is: ', qty);
	}
}
