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
			
			var oldAcc = oldRec.getLineItemValue('line', 'account', count);
			var newAcc = newRec.getLineItemValue('line', 'account', count);
			
			var oldDeb = oldRec.getLineItemValue('line', 'debit', count);
			var newDeb = newRec.getLineItemValue('line', 'debit', count);
			
			var oldCre = oldRec.getLineItemValue('line', 'credit', count);
			var newCre = newRec.getLineItemValue('line', 'credit', count);
			
			var oldCC = oldRec.getLineItemValue('line', 'department', count);
			var newCC = newRec.getLineItemValue('line', 'department', count);
			
			var oldReg = oldRec.getLineItemValue('line', 'location', count);
			var newReg = newRec.getLineItemValue('line', 'location', count);
			
			if (oldAcc != newAcc || oldDeb != newDeb || oldCre != newCre || oldCC != newCC || oldReg != newReg) {
				
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
