// https://system.eu2.netsuite.com/app/common/scripting/script.nl?id=772&whence=
// https://system.eu2.netsuite.com/app/site/hosting/scriptlet.nl?script=772&deploy=1

function testrevrec(){
	var invoiceId = 7347873;
	var rec = nlapiLoadRecord('invoice',invoiceId);
	var netAmountNoTax = parseFloat(nlapiLookupField('invoice', invoiceId, 'netamountnotax'));
	var fxRate = parseFloat(nlapiLookupField('invoice', invoiceId, 'fxamount')) / parseFloat(nlapiLookupField('invoice', invoiceId, 'amount'));
	var fxNetAmountNoTax = parseFloat(netAmountNoTax * fxRate).toFixed(2);
	var invLineCount = rec.getLineItemCount('item');
	
	
	var lineWithFairValueCount = 0;
	var totalFairValue = 0;
	for( var i = 1; i <= invLineCount; i++){
		var availRevRec = rec.getLineItemValue('item','custcol_avail_rev_rec',i);
		var itemFairValue = parseFloat(rec.getLineItemValue('item','custcol_fair_value',i));
		totalFairValue = parseFloat(totalFairValue + itemFairValue).toFixed(2);
		var itemAmount = rec.getLineItemValue('item','amount',i);
		var vsoeAmount = rec.getLineItemValue('item','vsoeamount',i);
		nlapiLogExecution('DEBUG','Line: ' + i + ', AvailForRevRec: ' + availRevRec + ', VSOEAmount: ' + vsoeAmount + ', ItemAmount: ' + itemAmount + ', FairValue: ' + itemFairValue,'');

		if(itemFairValue > 0){ lineWithFairValueCount++; }


		// check if itemFairValue == fxNetAmountNoTax / lineWithFairValueCount && itemFairValue > 0, then change 
		// newItemFairValue = (itemAmount/fxNetAmountNoTax)*
	}

	nlapiLogExecution('DEBUG','TranLog','ExchangeRate: ' + fxRate + ', LineCount: ' + invLineCount + ', FxNetAmountNoTax: ' + fxNetAmountNoTax + ', TotalFairValue: ' + totalFairValue + ', TotalLinesWithFairValue: ' + lineWithFairValueCount);
}