/**
 * Module Description
 * 
 * Version    Date            Author           Remarks
 * 1.00       01 Apr 2014     anduggal
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
 * 
 *************************************************************
 * 8412	EGO	Change parent base currency to Euro
 * 8776	EGO Change parent base currency to USD
 * 
 */

function billAmountUSDAfterSubmit(type){

	var currentContext = nlapiGetContext(); 
	if(currentContext.getExecutionContext()!='userinterface' && currentContext.getExecutionContext()!='csv'){
		nlapiLogExecution('DEBUG','context', currentContext.getExecutionContext());
		return;
	}

	if(type=='create' || type=='edit')
	{
		txnId = nlapiGetRecordId();
		txnType = nlapiGetRecordType();
		
		var filters = new Array();
		filters[0] = new nlobjSearchFilter('internalid', null, 'is', txnId);
		filters[1] = new nlobjSearchFilter('mainline', null, 'is', 'T');
		
		var columns = new Array();
		columns[0] = new nlobjSearchColumn('tranid');
		columns[1] = new nlobjSearchColumn('amount');
		columns[2] = new nlobjSearchColumn('fxamount');
		columns[3] = new nlobjSearchColumn('currency');
		
		var searchResults = nlapiSearchRecord(txnType, null, filters, columns);
		for ( var i = 0; searchResults != null && i < 1; i++) {
			var record = nlapiLoadRecord(searchResults[i].getRecordType(), searchResults[i].getId());
			
			var result = searchResults[i];
			var amount = parseFloat(result.getValue('amount'));
			var fxamount = parseFloat(result.getValue('fxamount'));
			var currency = result.getValue('currency');
			
			// 8412
			// 8776 reinstates this
			if (currency != 1) {  	
				record.setFieldValue('custbody_mys_bill_amount_usd', amount);
			} else {
				record.setFieldValue('custbody_mys_bill_amount_usd', fxamount);
			}
			//
			
			/* 8412 - start -- 8776 reverses this
			if (currency != 4) {  	
				record.setFieldValue('custbody_mys_bill_amount_eur', amount);
			} else {
				record.setFieldValue('custbody_mys_bill_amount_eur', fxamount);
			}
			 8412 - end
			*/

			var id = nlapiSubmitRecord(record);
		}
	}
}