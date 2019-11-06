/**
 * Module Description
 * 
 * Version    Date            Author           Remarks
 * 1.00       26 Feb 2014     anduggal
 *
 */

/**
 * The recordType (internal id) corresponds to the "Applied To" record in your script deployment. 
 * @appliedtorecord recordType
 *   
 * @param {String} type Operation types: create, edit, view, copy, print, email
 * @param {nlobjForm} form Current form
 * @param {nlobjRequest} request Request object
 * @returns {Void}
 */
function hideCreditButton(type, form, request){
	var billId = nlapiGetRecordId();
	var billStat = nlapiGetFieldValue('status');
	if (billStat == null) {
		return true;
	}
	else if (billStat.indexOf('Cancelled') == -1) {
		if (billId != null) {
			var creditId = 0;
			var paymentId = 0;
			var creditAmount = 0;
			var paidAmount = 0;
			var payment = form.getButton('payment');
			var billRecord = nlapiLoadRecord('vendorbill', billId);
			var billTranid = billRecord.getFieldValue('tranid');
			var billAmount = parseFloat(billRecord.getFieldValue('usertotal'));
			
			var filters = new Array();
			filters[0] = new nlobjSearchFilter('internalid', null, 'is', billId);
			
			var columns = new Array();
			columns[0] = new nlobjSearchColumn('tranid');
			columns[1] = new nlobjSearchColumn('applyingtransaction');
			
			var searchResults = nlapiSearchRecord('vendorbill', null, filters, columns);
			for ( var i = 0; searchResults != null && i < searchResults.length; i++) {
				var result = searchResults[i];
				var txnType = result.getText('applyingtransaction');

				if (txnType.indexOf('Credit') !== -1) {
					if (creditId != result.getValue('applyingtransaction')) {
						creditId = result.getValue('applyingtransaction');
						var billCredit = nlapiLoadRecord('vendorcredit', creditId);
						for ( var int = 1; int <= billCredit.getLineItemCount('apply'); int++) {
							var refnum = billCredit.getLineItemValue('apply', 'refnum', int);
							if (refnum == billTranid) {
								creditAmount = parseFloat(creditAmount) + parseFloat(billCredit.getLineItemValue('apply', 'amount', int));
							}
						}
					}
				} else if (txnType.indexOf('Payment') !== -1) {
					if (paymentId != result.getValue('applyingtransaction')) {
						paymentId = result.getValue('applyingtransaction');
						var billPayment = nlapiLoadRecord('vendorpayment', paymentId);
						for ( var int = 1; int <= billPayment.getLineItemCount('apply'); int++) {
							var refnum = billPayment.getLineItemValue('apply', 'refnum', int);
							if (refnum == billTranid) {
								paidAmount = parseFloat(paidAmount) + parseFloat(billPayment.getLineItemValue('apply', 'amount', int));
							}
						}
					}
				}
			}
			
			if (creditAmount >= billAmount) {
				form.removeButton('credit');
			} else if ((paidAmount >= billAmount || (creditAmount + paidAmount) >= billAmount) && payment == null) {
				form.removeButton('credit');
				form.setScript(nlapiGetContext().getScriptId());
				form.addButton('custpage_btncredit', 'Credit', 'buttonClick_Credit(\''+billId+'\')');
			}
		}
	}
}

function buttonClick_Credit(billId) {
	if (!billId) return false;
	var message = 'Payment has already been created for this Vendor Bill.\n';
	message += 'If in case the Bill is not actually paid out of the bank, you may choose to Void the Bill Payment and then proceed with Bill Credit.\n';
	message += 'If already paid, kindly raise a stand-alone Credit against other Bills which are pending for Payment';
	
	window.alert(message);
	return true;
}