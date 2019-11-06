/**
 * Module Description
 * 
 * Version    Date            Author           Remarks
 * 1.00       22 Apr 2014     anduggal
 *
 */

/**
 * @returns {Void} Any or no return value
 */
function cancelBill() {
	var billId = nlapiGetRecordId();
	var billRecord = nlapiLoadRecord('vendorbill', billId);
	var poNumber = null;
	
	if (billRecord != null) {
		try {
			var journal = billRecord.getFieldValue('custbody_accrualje_no');
			var revJournal = billRecord.getFieldValue('custbody_mys_acc_rev_je');
			
			if (journal != null && revJournal == null) {
				
				var je = nlapiCreateRecord('journalentry');
				var jeRecord = nlapiLoadRecord('journalentry', journal);
				poNumber = jeRecord.getFieldValue('custbody_sourcing_po');
				
				for ( var i = 1; i <= jeRecord.getLineItemCount('line'); i++) {
					
					je.setFieldValue('trandate', nlapiDateToString(new Date(), 'date'));
					je.setFieldValue('currency', jeRecord.getFieldValue('currency'));
					je.setFieldValue('exchangerate', jeRecord.getFieldValue('exchangerate'));
					je.setFieldValue('subsidiary', jeRecord.getFieldValue('subsidiary'));
					je.setFieldValue('postingperiod', billRecord.getFieldValue('postingperiod'));
				        je.setFieldValue('custbody_source_receipt_bill', billId);
      				        je.setFieldValue('custbody_sourcing_po', poNumber);
					//je.setFieldValue('custbody_mys_journal_type', '28');

					//create the line items; first work control account
					je.selectNewLineItem('line');
					je.setCurrentLineItemValue('line', 'account', jeRecord.getLineItemValue('line', 'account', i));
					je.setCurrentLineItemValue('line', 'debit', jeRecord.getLineItemValue('line', 'credit', i));
					je.setCurrentLineItemValue('line', 'credit', jeRecord.getLineItemValue('line', 'debit', i));
					je.setCurrentLineItemValue('line', 'entity', jeRecord.getLineItemValue('line', 'entity', i));
					//je.setCurrentLineItemValue('line', 'memo', jeRecord.getLineItemValue('line', 'memo', i));
					je.setCurrentLineItemValue('line', 'memo', 'Reversal of Vendor Bill Accrual Reversal');
					je.setCurrentLineItemValue('line', 'department', jeRecord.getLineItemValue('line', 'department', i));
					je.setCurrentLineItemValue('line', 'class', jeRecord.getLineItemValue('line', 'class', i));
					je.setCurrentLineItemValue('line', 'location', jeRecord.getLineItemValue('line', 'location', i));
					je.setCurrentLineItemValue('line', 'item', jeRecord.getLineItemValue('line', 'item', i));
					je.setCurrentLineItemValue('line', 'custcol_misyscategory', jeRecord.getLineItemValue('line', 'custcol_misyscategory', i));
					je.setCurrentLineItemValue('line', 'custcol_misyssubcategory1', jeRecord.getLineItemValue('line', 'custcol_misyssubcategory1', i));
					je.setCurrentLineItemValue('line', 'custcol_misyssubcategory2', jeRecord.getLineItemValue('line', 'custcol_misyssubcategory2', i));
					je.commitLineItem('line');
					
					i = i + 1;
					
					// now work the bank account
					je.selectNewLineItem('line');
					je.setCurrentLineItemValue('line', 'account', jeRecord.getLineItemValue('line', 'account', i));
					je.setCurrentLineItemValue('line', 'debit', jeRecord.getLineItemValue('line', 'credit', i));
					je.setCurrentLineItemValue('line', 'credit', jeRecord.getLineItemValue('line', 'debit', i));
					je.setCurrentLineItemValue('line', 'entity', jeRecord.getLineItemValue('line', 'entity', i));
					//je.setCurrentLineItemValue('line', 'memo', jeRecord.getLineItemValue('line', 'memo', i));
					je.setCurrentLineItemValue('line', 'memo', 'Reversal of Vendor Bill Accrual Reversal');
					je.setCurrentLineItemValue('line', 'department', jeRecord.getLineItemValue('line', 'department', i));
					je.setCurrentLineItemValue('line', 'class', jeRecord.getLineItemValue('line', 'class', i));
					je.setCurrentLineItemValue('line', 'location', jeRecord.getLineItemValue('line', 'location', i));
				        je.setCurrentLineItemValue('line', 'item', jeRecord.getLineItemValue('line', 'item', i));
					je.setCurrentLineItemValue('line', 'custcol_misyscategory', jeRecord.getLineItemValue('line', 'custcol_misyscategory', i));
					je.setCurrentLineItemValue('line', 'custcol_misyssubcategory1', jeRecord.getLineItemValue('line', 'custcol_misyssubcategory1', i));
					je.setCurrentLineItemValue('line', 'custcol_misyssubcategory2', jeRecord.getLineItemValue('line', 'custcol_misyssubcategory2', i));
					je.commitLineItem('line');
				}
				
				var je_id = nlapiSubmitRecord(je);
				billRecord.setFieldValue('custbody_mys_acc_rev_je', je_id);
			}
			
			var glJournal = billRecord.getFieldValue('custbody_mys_gl_rev_je');
			
			if (glJournal == null) {
				
				var glje = nlapiCreateRecord('journalentry');
				
				glje.setFieldValue('trandate', nlapiDateToString(new Date(), 'date'));
				glje.setFieldValue('currency', billRecord.getFieldValue('currency'));
				glje.setFieldValue('exchangerate', billRecord.getFieldValue('exchangerate'));
				glje.setFieldValue('subsidiary', billRecord.getFieldValue('subsidiary'));
				glje.setFieldValue('postingperiod', billRecord.getFieldValue('postingperiod'));
				glje.setFieldValue('custbody_source_receipt_bill', billId);
     				glje.setFieldValue('custbody_sourcing_po', poNumber);
				//glje.setFieldValue('custbody_mys_journal_type', '28');

				glje.selectNewLineItem('line');
				glje.setCurrentLineItemValue('line', 'account', billRecord.getFieldValue('account'));
				glje.setCurrentLineItemValue('line', 'debit', billRecord.getFieldValue('usertotal'));
				glje.setCurrentLineItemValue('line', 'entity', billRecord.getFieldValue('entity'));
				//glje.setCurrentLineItemValue('line', 'memo', billRecord.getFieldValue('memo'));
				glje.setCurrentLineItemValue('line', 'memo', 'Reversal of GL Impact on Bill Cancellation');
				glje.setCurrentLineItemValue('line', 'department', billRecord.getFieldValue('department'));
				glje.setCurrentLineItemValue('line', 'class', billRecord.getFieldValue('class'));
				glje.setCurrentLineItemValue('line', 'location', billRecord.getFieldValue('location'));
				glje.commitLineItem('line');
				
for ( var i2 = 1; i2 <= billRecord.getLineItemCount('item'); i2++) {
					
					var qty = billRecord.getLineItemValue('item', 'quantity', i2);
					
					if (qty != null) {
						
						var item = billRecord.getLineItemValue('item', 'item', i2);
						
						var filters = new Array();
						filters[0] = new nlobjSearchFilter('internalid', null, 'is', item);
						
						var columns = new Array();
						columns[0] = new nlobjSearchColumn('type');
						
						var searchResults = nlapiSearchRecord('item', null, filters, columns);
						var result = searchResults[0];
						
						var itemtype = result.getRecordType();
						var iRec = nlapiLoadRecord(itemtype, item);
						var iAcc = iRec.getFieldValue('expenseaccount');
						
						glje.selectNewLineItem('line');
						glje.setCurrentLineItemValue('line', 'account', iAcc);
						glje.setCurrentLineItemValue('line', 'credit', billRecord.getLineItemValue('item', 'amount', i2));
						glje.setCurrentLineItemValue('line', 'memo', billRecord.getLineItemValue('item', 'description', i2));
						glje.setCurrentLineItemValue('line', 'department', billRecord.getFieldValue('department'));
						glje.setCurrentLineItemValue('line', 'class', billRecord.getFieldValue('class'));
						glje.setCurrentLineItemValue('line', 'location', billRecord.getFieldValue('location'));
						glje.commitLineItem('line');
						
						var txAmt = billRecord.getLineItemValue('item', 'tax1amt', i2);
						
						if (txAmt != null && txAmt != '0.00') {
							
							var taxcode = billRecord.getLineItemValue('item', 'taxcode', i2);
							
							var filters1 = new Array();
							filters1[0] = new nlobjSearchFilter('internalid', null, 'is', taxcode);
							
							var columns1 = new Array();
							columns1[0] = new nlobjSearchColumn('internalid');
							
							var searchResults1 = nlapiSearchRecord('salestaxitem', null, filters1, columns1);
							if (searchResults1 != null) {
								
								var tRec = nlapiLoadRecord('salestaxitem', taxcode);
								var tAcc = tRec.getFieldValue('purchaseaccount');
								//var tEnt = tRec.getFieldValue('taxagency');
								var tMem = tRec.getFieldText('taxtype');
								
								glje.selectNewLineItem('line');
								glje.setCurrentLineItemValue('line', 'account', tAcc);
								glje.setCurrentLineItemValue('line', 'credit', txAmt);
								//glje.setCurrentLineItemValue('line', 'entity', tEnt);
								glje.setCurrentLineItemValue('line', 'memo', tMem);
								glje.setCurrentLineItemValue('line', 'department', billRecord.getFieldValue('department'));
								glje.setCurrentLineItemValue('line', 'class', billRecord.getFieldValue('class'));
								glje.setCurrentLineItemValue('line', 'location', billRecord.getFieldValue('location'));
								glje.commitLineItem('line');
								
							} else {
								
								var netAmt = billRecord.getLineItemValue('item', 'amount', i2);
								var tgRec = nlapiLoadRecord('taxgroup', taxcode);
								var totalTax = 0;
								
								for ( var i3 = 1; i3 <= tgRec.getLineItemCount('taxitem'); i3++) {
									var taxitem = tgRec.getLineItemValue('taxitem', 'taxname', i3);
									var taxRec = nlapiLoadRecord('salestaxitem', taxitem);
									
									var tAcc = taxRec.getFieldValue('purchaseaccount');
									//var tEnt = tgRec.getFieldValue('taxagency');
									var tMem = taxRec.getFieldText('taxtype');
									var txRate = parseFloat(taxRec.getFieldValue('rate'));
									var taxAmt = parseFloat((netAmt * txRate) / 100).toFixed(2);
									totalTax = parseFloat(totalTax) + parseFloat(taxAmt);
									if (totalTax > billRecord.getLineItemValue('item', 'tax1amt', i2)) {
										taxAmt = parseFloat(taxAmt - (totalTax - billRecord.getLineItemValue('item', 'tax1amt', i2))).toFixed(2);
									}
									
									glje.selectNewLineItem('line');
									glje.setCurrentLineItemValue('line', 'account', tAcc);
									glje.setCurrentLineItemValue('line', 'credit', taxAmt);
									//glje.setCurrentLineItemValue('line', 'entity', tEnt);
									glje.setCurrentLineItemValue('line', 'memo', tMem);
									glje.setCurrentLineItemValue('line', 'department', billRecord.getFieldValue('department'));
									glje.setCurrentLineItemValue('line', 'class', billRecord.getFieldValue('class'));
									glje.setCurrentLineItemValue('line', 'location', billRecord.getFieldValue('location'));
									glje.commitLineItem('line');
								}
							}
						}
						
						var wtxcode = billRecord.getLineItemValue('item', 'custcol_4601_witaxcode', i2);
						
						if (wtxcode != null) {
							
							var wtRec = nlapiLoadRecord('customrecord_4601_witaxcode', wtxcode);
							var wtTyp = wtRec.getFieldValue('custrecord_4601_wtc_witaxtype');
							var wtTypRec = nlapiLoadRecord('customrecord_4601_witaxtype', wtTyp);
							var wtAcc = wtTypRec.getFieldValue('custrecord_4601_wtt_purcaccount');
							var wtAmt = billRecord.getLineItemValue('item', 'custcol_4601_witaxamount', i2) * -1;
							
							glje.selectNewLineItem('line');
							glje.setCurrentLineItemValue('line', 'account', wtAcc);
							glje.setCurrentLineItemValue('line', 'debit', wtAmt);
							glje.setCurrentLineItemValue('line', 'department', billRecord.getFieldValue('department'));
							glje.setCurrentLineItemValue('line', 'class', billRecord.getFieldValue('class'));
							glje.setCurrentLineItemValue('line', 'location', billRecord.getFieldValue('location'));
							glje.commitLineItem('line');
							
//*************************************************************************************
							var actAmt = parseFloat(billRecord.getLineItemValue('item', 'grossamt', i2) - wtAmt - wtAmt).toFixed(2);
							if (actAmt == billRecord.getFieldValue('usertotal')) {
								glje.selectNewLineItem('line');
								glje.setCurrentLineItemValue('line', 'account', wtAcc);
								glje.setCurrentLineItemValue('line', 'debit', wtAmt);
								glje.setCurrentLineItemValue('line', 'department', billRecord.getFieldValue('department'));
								glje.setCurrentLineItemValue('line', 'class', billRecord.getFieldValue('class'));
								glje.setCurrentLineItemValue('line', 'location', billRecord.getFieldValue('location'));
								glje.commitLineItem('line');
							}
							//glje.setLineItemValue('line', 'debit', '1', actAmt);
//*************************************************************************************							
						}
					}
				}
				
				var glje_id = nlapiSubmitRecord(glje);
				billRecord.setFieldValue('custbody_mys_gl_rev_je', glje_id);
			}
			
			var int = 0;
			var count = billRecord.getLineItemCount('item');
			
			for ( var j = 1; j <= count; j++) {
				
				if (int == 0) {
					int = count + 1;
				} else {
					int = int + 1;
				}
				
				billRecord.insertLineItem('item', int);
				
				var item = billRecord.getLineItemValue('item', 'item', j);
				billRecord.setLineItemValue('item', 'item', int, item);
				
				var desc = billRecord.getLineItemValue('item', 'description', j);
				billRecord.setLineItemValue('item', 'description', int, desc);
				
				var billQty = billRecord.getLineItemValue('item', 'quantity', j);
				billRecord.setLineItemValue('item', 'quantity', int, billQty);
				
				var amount = billRecord.getLineItemValue('item', 'amount', j);
				billRecord.setLineItemValue('item', 'amount', int, amount);
				
				var gamount = billRecord.getLineItemValue('item', 'grossamt', j);
				billRecord.setLineItemValue('item', 'grossamt', int, gamount);
				
				var rate = billRecord.getLineItemValue('item', 'rate', j);
				billRecord.setLineItemValue('item', 'rate', int, rate);
				
				var dept = billRecord.getLineItemValue('item', 'department', j);
				billRecord.setLineItemValue('item', 'department', int, dept);
				
				var clas = billRecord.getLineItemValue('item', 'class', j);
				billRecord.setLineItemValue('item', 'class', int, clas);
				
				var loctn = billRecord.getLineItemValue('item', 'location', j);
				billRecord.setLineItemValue('item', 'location', int, loctn);
				
				var witax = billRecord.getLineItemValue('item', 'custcol_4601_witaxamount', j);
				billRecord.setLineItemValue('item', 'custcol_4601_witaxamount', int, witax);
				
				var witaxapp = billRecord.getLineItemValue('item', 'custcol_4601_witaxapplies', j);
				billRecord.setLineItemValue('item', 'custcol_4601_witaxapplies', int, witaxapp);
				
				var witaxbamt = billRecord.getLineItemValue('item', 'custcol_4601_witaxbaseamount', j);
				billRecord.setLineItemValue('item', 'custcol_4601_witaxbaseamount', int, witaxbamt);
				
				var witaxcode = billRecord.getLineItemValue('item', 'custcol_4601_witaxcode', j);
				billRecord.setLineItemValue('item', 'custcol_4601_witaxcode', int, witaxcode);
				
				var witaxrate = billRecord.getLineItemValue('item', 'custcol_4601_witaxrate', j);
				billRecord.setLineItemValue('item', 'custcol_4601_witaxrate', int, witaxrate);
				
				var taxcode = billRecord.getLineItemValue('item', 'taxcode', j);
				billRecord.setLineItemValue('item', 'taxcode', int, taxcode);
				
				var tax1amt = billRecord.getLineItemValue('item', 'tax1amt', j);
				billRecord.setLineItemValue('item', 'tax1amt', int, tax1amt);
			}
			
			var int1 = 0;
			
			for ( var j1 = 1; j1 <= count; j1++) {
				
				if (int1 == 0) {
					int1 = count;
				} else {
					int1 = int1 - 1;
				}
				
				billRecord.removeLineItem('item', int1);
			}
			
			return nlapiSubmitRecord(billRecord);
		}
		catch (error) {
			if (error.getDetails != undefined) {
				nlapiLogExecution('ERROR', 'Process Error', error.getCode() + ': ' + error.getDetails());	        
				throw error;
			}
			else
			{
				nlapiLogExecution('ERROR', 'Unexpected Error', error.toString());
				throw nlapiCreateError('99999', error.toString());
			}
		}
	}
}
