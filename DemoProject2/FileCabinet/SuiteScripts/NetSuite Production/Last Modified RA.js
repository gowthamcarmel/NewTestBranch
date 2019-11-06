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
	
	if (oldRec != null && newRec != null && oldRec.getLineItemCount('line') == newRec.getLineItemCount('line')) {
		
		var count = 1;
		while (count <= oldRec.getLineItemCount('line')) {
			
			var oldItm = oldRec.getLineItemValue('line', 'item', count);
			var newItm = newRec.getLineItemValue('line', 'item', count);
			
			var oldQty = oldRec.getLineItemValue('line', 'quantity', count);
			var newQty = newRec.getLineItemValue('line', 'quantity', count);
			
			var oldTxCd = oldRec.getLineItemValue('line', 'taxcode', count);
			var newTxCd = newRec.getLineItemValue('line', 'taxcode', count);
			
			var oldCC = oldRec.getLineItemValue('line', 'department', count);
			var newCC = newRec.getLineItemValue('line', 'department', count);
			
			var oldPrd = oldRec.getLineItemValue('line', 'class', count);
			var newPrd = newRec.getLineItemValue('line', 'class', count);
			
			var oldReg = oldRec.getLineItemValue('line', 'location', count);
			var newReg = newRec.getLineItemValue('line', 'location', count);
			
			if (oldItm != newItm || oldQty != newQty || oldTxCd != newTxCd || oldCC != newCC || oldPrd != newPrd || oldReg != newReg) {
				
				//lastModif = newRec.getFieldValue('lastmodifieddate');
				lastModif = nlapiDateToString(now, 'datetime');
				
				nlapiLogExecution('DEBUG', 'RA', 'lastModif 1:'+lastModif );
				return lastModif;
				
			    
				count = oldRec.getLineItemCount('line') + 1;
				
			} else {
				lastModif = null;
					nlapiLogExecution('DEBUG', 'RA', 'lastModif 2:'+lastModif );
				return lastModif;
				count = count + 1;
			}
		}
		lastModif = nlapiDateToString(now, 'datetime');
		nlapiLogExecution('DEBUG', 'RA', 'lastModif 11:'+lastModif );
				return lastModif;
		
	} else {
		//lastModif = newRec.getFieldValue('lastmodifieddate');
		
		lastModif = nlapiDateToString(now, 'datetime');
			nlapiLogExecution('DEBUG', 'RA', 'lastModif 3:'+lastModif );
		return lastModif;
	}
}
