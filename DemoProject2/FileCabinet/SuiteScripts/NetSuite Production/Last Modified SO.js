/**
 * Module Description
 * 
 * Version    Date            Author           Remarks
 * 1.00       09 Apr 2014     anduggal
 *
 */

/**
 * @returns {Void} Any or no return value
 */
function LastModified()
{
	var oldRec = nlapiGetOldRecord();
	var newRec = nlapiGetNewRecord();
	
	var lastModif = null;
	var now = new Date();
	//var timezone = nlapiGetContext().getPreference('timezone');
	
	if (oldRec != null && newRec != null && oldRec.getLineItemCount('item') == newRec.getLineItemCount('item')) {
		
		var count = 1;
		while (count <= oldRec.getLineItemCount('item')) {
			
			var oldItm = oldRec.getLineItemValue('item', 'item', count);
			var newItm = newRec.getLineItemValue('item', 'item', count);
			
			var oldQty = oldRec.getLineItemValue('item', 'quantity', count);
			var newQty = newRec.getLineItemValue('item', 'quantity', count);
			
			var oldRate = oldRec.getLineItemValue('item', 'rate', count);
			var newRate = newRec.getLineItemValue('item', 'rate', count);
			
			var oldTxCd = oldRec.getLineItemValue('item', 'taxcode', count);
			var newTxCd = newRec.getLineItemValue('item', 'taxcode', count);
			
			var oldCC = oldRec.getLineItemValue('item', 'department', count);
			var newCC = newRec.getLineItemValue('item', 'department', count);
			
			var oldPrd = oldRec.getLineItemValue('item', 'class', count);
			var newPrd = newRec.getLineItemValue('item', 'class', count);
			
			var oldReg = oldRec.getLineItemValue('item', 'location', count);
			var newReg = newRec.getLineItemValue('item', 'location', count);
			
			if (oldItm != newItm || oldQty != newQty || oldRate != newRate || oldTxCd != newTxCd || oldCC != newCC || oldPrd != newPrd || oldReg != newReg) {
				
				//lastModif = newRec.getFieldValue('lastmodifieddate');
				lastModif = nlapiDateToString(now, 'datetime');
				return lastModif;
			    
				count = oldRec.getLineItemCount('line') + 1;
				
			} else {
				lastModif = null;
				return lastModif;
				count = count + 1;
			}
		}
	} else {
		//lastModif = newRec.getFieldValue('lastmodifieddate');
		lastModif = nlapiDateToString(now, 'datetime');
		return lastModif;
	}
}
