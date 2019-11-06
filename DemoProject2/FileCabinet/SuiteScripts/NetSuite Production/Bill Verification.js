/**
 * Module Description
 * 
 * Version    Date            Author           Remarks
 * 1.00       07 May 2014     anduggal
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
function billVerification(type, form, request){
	
	var billId = nlapiGetRecordId();
	var billStat = nlapiGetFieldValue('status');
	if (billStat == null) {
		return true;
	}
	else if (billStat.indexOf('Cancelled') == -1) {
	if (billId != null & type == 'view') {
		
		var standAlone = '';
		var billRec = nlapiLoadRecord('vendorbill', billId);
		var billTranid = billRec.getFieldValue('tranid');
		var billVerified = billRec.getFieldValue('custbody_mys_bill_verified');
		var status = billRec.getFieldValue('approvalstatus');
		
		var filters1 = new Array();
		filters1[0] = new nlobjSearchFilter('internalid', null, 'is', billId);
		
		var columns1 = new Array();
		columns1[0] = new nlobjSearchColumn('tranid');
		columns1[1] = new nlobjSearchColumn('applyingtransaction');
		columns1[2] = new nlobjSearchColumn('appliedtotransaction');
		
		var billResults = nlapiSearchRecord('vendorbill', null, filters1, columns1);
		for ( var int = 0; billResults != null && int < billResults.length; int++) {
			if (standAlone != 'F') {
				var result = billResults[int];
				var appTo = result.getValue('appliedtotransaction');
				if (appTo == '' || appTo == ' ' || appTo == null) {
					standAlone = 'T';
				} else {
					standAlone = 'F';
					continue;
				}
			}
		}
		
		if (status == '2' && standAlone != 'T') {
			var billLocked = 'F';
			var billPaid = 'F';
			var paymentId = 0;
			var paidAmount = 0;
			
			var billPeriod = billRec.getFieldText('postingperiod');
			var filters = new Array();
			filters[0] = new nlobjSearchFilter('periodname', null, 'is', billPeriod);
			
			var columns = new Array();
			columns[0] = new nlobjSearchColumn('periodname');
			columns[1] = new nlobjSearchColumn('allclosed');
			
			var taxResults = nlapiSearchRecord('taxperiod', null, filters, columns);
			for ( var i = 0; taxResults != null && i < 1; i++) {
				var taxResult = taxResults[i];
				var closed = taxResult.getValue('allclosed');
				if (closed == 'T') {
					billLocked = 'T';
				}
			}
			
			if (billResults != null) {
				for ( var j = 0; j < billResults.length; j++) {
					
					var billResult = billResults[j];
					var txnType = billResult.getText('applyingtransaction');
					
					if (txnType.indexOf('Bill Payment') !== -1) {
						if (paymentId != billResult.getValue('applyingtransaction')) {
							paymentId = billResult.getValue('applyingtransaction');
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
				
				if (paidAmount > 0) {
					billPaid = 'T';
				}
			}
			
			if (billLocked == 'T' || billPaid == 'T') {
				if (billVerified != 'F') {
					billRec.setFieldValue('custbody_mys_bill_verified', 'F');
					return nlapiSubmitRecord(billRec);
				}
			} else {
				if (billVerified != 'T') {
					billRec.setFieldValue('custbody_mys_bill_verified', 'T');
					return nlapiSubmitRecord(billRec);
				}
			}
		}
	}
	}
}
