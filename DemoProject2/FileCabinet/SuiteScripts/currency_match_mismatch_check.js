function clientFieldChanged(type, name, linenum){
 
	if (name == 'custrecord_veninvupld_po_currency' || name == 'custrecord_veninvupld_bill_currency'){ 
			var poCurrency = nlapiGetFieldValue('custrecord_veninvupld_po_currency');
			var vendorBillCurrency = nlapiGetFieldValue('custrecord_veninvupld_bill_currency');

			if (poCurrency == vendorBillCurrency){
				nlapiSetFieldValue('custrecord_veninvupld_curr_validation','T');
				nlapiSetFieldValue('custrecord_veninvupld_curr_mismatch','F');
			}else{
				nlapiSetFieldValue('custrecord_veninvupld_curr_validation','F');
				nlapiSetFieldValue('custrecord_veninvupld_curr_mismatch','T');					
			}
			
		}
	
}
