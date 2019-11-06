/**
 * Module Description
 * 
 * Version    Date            Author           Remarks
 * 1.00       27 Jan 2014     anduggal
 *
 */

/**
 * The recordType (internal id) corresponds to the "Applied To" record in your script deployment. 
 * @appliedtorecord recordType
 * 
 * @param {String} type Operation types: create, edit, delete, xedit,
 *                      approve, cancel, reject (SO, ER, Time Bill, PO & RMA only)
 *                      pack, ship (IF only)
 *                      dropship, specialorder, orderitems (PO only) 
 *                      paybills (vendor payments)
 * @returns {Void}
 */
function updateAmountsUSD(type){
	var poId = nlapiGetRecordId();
	
	var filters = new Array();
	filters[0] = new nlobjSearchFilter('internalid', null, 'is', poId);
	filters[1] = new nlobjSearchFilter('mainline', null, 'is', 'T');
	
	var columns = new Array();
	columns[0] = new nlobjSearchColumn('tranid');
	columns[1] = new nlobjSearchColumn('amount');
	columns[2] = new nlobjSearchColumn('fxamount');
	columns[3] = new nlobjSearchColumn('netamountnotax');
	columns[4] = new nlobjSearchColumn('currency');
	
	var searchResults = nlapiSearchRecord('purchaseorder', null, filters, columns);
	for ( var i = 0; searchResults != null && i < 1; i++) {
		var record = nlapiLoadRecord(searchResults[i].getRecordType(), searchResults[i].getId());
		
		var result = searchResults[i];
		var amount = result.getValue('amount');
		var fxamount = result.getValue('fxamount');
		var netAmount = result.getValue('netamountnotax');
		var currency = result.getValue('currency');
		
		if (currency != 1) {
			if (netAmount != '') {			
				var taxTotal = amount - netAmount;
				
				record.setFieldValue('custbody_mys_net_amount_usd', netAmount);
				record.setFieldValue('custbody_mys_tax_total_usd', taxTotal);
			}
			else {
				netAmount = 0;
				var taxTotal = 0;
				record.setFieldValue('custbody_mys_net_amount_usd', netAmount);
				record.setFieldValue('custbody_mys_tax_total_usd', taxTotal);
			}
			
			record.setFieldValue('custbody_mys_gross_amount_usd', amount);
			
		} else {
			if (netAmount != '') {			
				var exchRate = amount / fxamount;
				netAmount = netAmount / exchRate;
				taxTotal = fxamount - netAmount;
				
				record.setFieldValue('custbody_mys_net_amount_usd', netAmount);
				record.setFieldValue('custbody_mys_tax_total_usd', taxTotal);
			}
			else {
				netAmount = 0;
				var taxTotal = 0;
				record.setFieldValue('custbody_mys_net_amount_usd', netAmount);
				record.setFieldValue('custbody_mys_tax_total_usd', taxTotal);
			}
			
			record.setFieldValue('custbody_mys_gross_amount_usd', fxamount);
		}
		
		var id = nlapiSubmitRecord(record);
	}
  
}
