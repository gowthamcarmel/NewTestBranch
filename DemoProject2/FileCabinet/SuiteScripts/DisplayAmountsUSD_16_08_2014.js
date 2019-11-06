/**
 * Module Description
 * 
 * Version    Date            Author           Remarks
 * 1.00       27 Jan 2014     anduggal
 *
 *
 * The recordType (internal id) corresponds to the "Applied To" record in your script deployment. 
 * @appliedtorecord recordType
 * 
 * @param {String} type Operation types: create, edit, delete, xedit,
 *                      approve, cancel, reject (SO, ER, Time Bill, PO & RMA only)
 *                      pack, ship (IF only)
 *                      dropship, specialorder, orderitems (PO only) 
 *                      paybills (vendor payments)
 * @returns {Void}
 *
 *********************************************************
 * 
 * 8412	EGO	Change parent base currency to Euro
 * 8776	EGO Change parent base currency to USD
 * 
 */
 
function updateAmountsUSD(type){

	var currentContext = nlapiGetContext(); 
	if(currentContext.getExecutionContext()!='scheduled' && currentContext.getExecutionContext()!='suitelet' && currentContext.getExecutionContext()!='userinterface'){
		nlapiLogExecution('DEBUG','context', currentContext.getExecutionContext());
		return;
	}

    var poId = nlapiGetRecordId();

    var fxamountTotal = nlapiLookupField('purchaseorder', poId, 'fxamount');
    var currency = nlapiLookupField('purchaseorder', poId, 'currency');
    var trandate = nlapiLookupField('purchaseorder', poId, 'trandate');
    
	var exchgRate = nlapiExchangeRate(currency, 'USD', trandate); // 8412 -- reversed by 8776
    //var exchgRate = nlapiExchangeRate(currency, 'EUR', trandate); // 8412 -- reversed by 8776

	nlapiLogExecution('DEBUG','exrate', exchgRate);
    
	//------------------------------------------------------------------------------	subtotal in transaction currency
	var filters = new Array();
	filters[0] = new nlobjSearchFilter('internalid', null, 'is', poId);
	filters[1] = new nlobjSearchFilter('mainline', null, 'is', 'F');
	filters[2] = new nlobjSearchFilter('taxline', null, 'is', 'F');
	filters[3] = new nlobjSearchFilter('cogs', null, 'is', 'F');
	filters[4] = new nlobjSearchFilter('shipping', null, 'is', 'F');
	
	var columns = new Array();
	columns[0] = new nlobjSearchColumn('tranid');
	columns[1] = new nlobjSearchColumn('internalid');
	columns[2] = new nlobjSearchColumn('fxamount');
	
	var searchResults = nlapiSearchRecord('purchaseorder', null, filters, columns);
	
	var fxamountSubTotal = 0.00;
	for ( var i = 0; i < searchResults.length; i++) {
		var result = searchResults[i];
		fxamountSubTotal = fxamountSubTotal + parseFloat(parseFloat(result.getValue('fxamount')).toFixed(2));
		nlapiLogExecution('DEBUG','fxsubt', fxamountSubTotal);
		//nlapiLogExecution('DEBUG','linefxamount', result.getValue('fxamount'));
		//nlapiLogExecution('DEBUG','subtotal', fxamountSubTotal);
    }
	      
	//-----------------------------------------------------------------------

	var fxamoutTax = parseFloat((fxamountTotal - fxamountSubTotal).toFixed(2));

	nlapiLogExecution('DEBUG','fxfinalsubt', fxamountSubTotal);
	nlapiLogExecution('DEBUG','fxtax', fxamoutTax);
	nlapiLogExecution('DEBUG','fxt', fxamountTotal);
	      
    var USDsubtotal = parseFloat((fxamountSubTotal * exchgRate).toFixed(2));
    var USDtax = parseFloat((fxamoutTax * exchgRate).toFixed(2));
    //var USDtotal_C = parseFloat((fxamountTotal * exchgRate).toFixed(2));
	var USDtotal = parseFloat(USDsubtotal + USDtax);

	nlapiLogExecution('DEBUG','subtotal', USDsubtotal);
	nlapiLogExecution('DEBUG','tax', USDtax);
	nlapiLogExecution('DEBUG','total', USDtotal);
	
	var record = nlapiLoadRecord('purchaseorder', poId);
	
	// 8412	-- reversed by 8776
	record.setFieldValue('custbody_mys_net_amount_usd', USDsubtotal);
	record.setFieldValue('custbody_mys_tax_total_usd', USDtax);
	record.setFieldValue('custbody_mys_gross_amount_usd', USDtotal);
	//

	/* 8412 -- reversed by 8776
	record.setFieldValue('custbody_mys_net_amount_eur', USDsubtotal);
	record.setFieldValue('custbody_mys_tax_total_eur', USDtax);
	record.setFieldValue('custbody_mys_gross_amount_eur', USDtotal);
	*/
	
	var id = nlapiSubmitRecord(record);
  
}