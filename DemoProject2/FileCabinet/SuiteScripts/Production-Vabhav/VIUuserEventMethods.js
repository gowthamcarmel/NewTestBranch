/**
 * Module Description
 * 
 * Version    Date            Author           Remarks
 * 1.00       10 Oct 2014     vabhpant
 *
 **************************************************
 *
 *	8412	EGO	Add euro for base currency change
 *
 */

/**
 * @appliedtorecord recordType = customrecord_jnl_approval_routing
 * @param {String} type Operation types: create, edit, delete, xedit,
 * @returns {Void}
 */
function calculateDueDate(type){
  
		var stLoggerTitle = 'User_event_VIU_DueDate';		
		
		nlapiLogExecution('DEBUG', stLoggerTitle, '>> Entry Log <<');
		
		try
		{
			var recId = nlapiGetRecordId();
			var recType = nlapiGetRecordType();
			var rec = nlapiLoadRecord(recType, recId);
			
			var inv_date = nlapiStringToDate( rec.getFieldValue('custrecord_inv_date') );
			nlapiLogExecution('DEBUG', 'Invoice Date', inv_date);
			
			var pay_term = rec.getFieldValue('custrecord_pymnt_term');
			var days_due = rec.getFieldValue('custrecord_viu_days_until_due');
			nlapiLogExecution('DEBUG', 'Term details', 'Term = '+pay_term+' Days untill due= '+ days_due );
			
			var due_date = nlapiAddDays(inv_date, days_due);
			nlapiLogExecution('DEBUG', 'Due Date', due_date);
				
			rec.setFieldValue('custrecord_due_date', nlapiDateToString(due_date, 'date') );

			nlapiLogExecution('DEBUG', stLoggerTitle, '>> Exit Log <<');
			
			return nlapiSubmitRecord(rec);
		}
		catch (error) {
			nlapiLogExecution('DEBUG', 'Error', error.toString());
		}
			
	}

/**
 * The recordType (internal id) corresponds to the "Applied To" record in your script deployment.
 *  
 * @appliedtorecord recordType = customrecord_jnl_approval_routing
 * @param {String} type Operation types: create, edit, delete, xedit,                      
 * @returns {Void}
 */
	function calculateRemaingAmt(type){


		var stLoggerTitle = 'userevent_VIU_Remaining_Qty';		
		
		nlapiLogExecution('DEBUG', stLoggerTitle, '>> Entry Log <<');
		
		try
		{
			var recId = nlapiGetRecordId();
			var recType = nlapiGetRecordType();
			var rec = nlapiLoadRecord(recType, recId);
			
			var poNumber = rec.getFieldValue('custrecord_veninvupld_po_number');
			nlapiLogExecution('DEBUG', 'PO#', poNumber);
			
			var tran = nlapiLoadRecord('purchaseorder', poNumber);
			var total_amount = tran.getFieldValue('total');
			nlapiLogExecution('DEBUG', 'PO Amount', total_amount);
			
			var count = tran.getLineItemCount('item');
			nlapiLogExecution('DEBUG', 'Line count', count);
			
			var billed_amt = 0;
			var line_amt = 0;
			var line_rate = 0;
			
			for(var i = 1; i <= count; i++) 
			{
				line_amt = tran.getLineItemValue('item', 'quantitybilled', i);
				line_rate = tran.getLineItemValue('item', 'rate', i);
				billed_amt = billed_amt + (line_amt*line_rate);  
				nlapiLogExecution('DEBUG', 'Billed details', 'Line Amount '+line_amt+' Line Rate '+line_rate+' Billed Amount '+billed_amt);
			}
			
			var remaining_amt = total_amount - billed_amt ;
			
			rec.setFieldValue('custrecord_remain_po_amt', remaining_amt);
			nlapiLogExecution('DEBUG', 'Remaining Amount', remaining_amt);
			
		
			nlapiLogExecution('DEBUG', stLoggerTitle, '>> Exit Log <<');
			
			return nlapiSubmitRecord(rec);		

		}
		catch (error) {
			nlapiLogExecution('DEBUG', 'Error', error.toString());
		}
	}

	/**
	 * The recordType (internal id) corresponds to the "Applied To" record in your script deployment. 
	 * @appliedtorecord recordType = customrecord_jnl_approval_routing
	 * 
	 * @param {String} type Operation types: create, edit, delete, xedit
	 * @returns {Void}
	 */
	function calculateUSDValue(type){
		
		var stLoggerTitle = 'userevent_VIU_USD_Amount';
		nlapiLogExecution('DEBUG', stLoggerTitle, '>> Entry Log <<');
		
		var bill_amt = 0;
		var bill_cur = '';
		
		try
		{
			var recId = nlapiGetRecordId();
			var recType = nlapiGetRecordType();
			var rec = nlapiLoadRecord(recType, recId);
			
			bill_amt = rec.getFieldValue('custrecord_veninvupld_amount');
			bill_cur = rec.getFieldText('custrecord_veninvupld_bill_currency');
			var exch_rate = nlapiExchangeRate(bill_cur, 'USD');
			var exch_rate2 = nlapiExchangeRate(bill_cur, 'EUR'); // 8412

			// nlapiLogExecution('DEBUG', 'Currency Details', 'Bill Amount= '+bill_amt+' Bill Cur = '+bill_cur+' Exchange Rate='+exch_rate); // 8412
			nlapiLogExecution('DEBUG', 'Currency Details', 'Bill Amount= '+bill_amt+' Bill Cur = '+bill_cur+' Exchange Rate USD= '+ exch_rate + ' Exchahnge Rate EUR=' + exch_rate2); // 8412
			
			var usd_amt = bill_amt * exch_rate;
			var eur_amt = bill_amt * exch_rate2; // 8412
			rec.setFieldValue('custrecord_usd_amt', nlapiFormatCurrency(usd_amt));
			rec.setFieldValue('custrecord_eur_amt', nlapiFormatCurrency(eur_amt)); // 8412
			nlapiLogExecution('DEBUG', 'USD Amount', usd_amt);
			nlapiLogExecution('DEBUG', 'EUR Amount', eur_amt); // 8412

			nlapiLogExecution('DEBUG', stLoggerTitle, '>> Exit Log <<');
			return nlapiSubmitRecord(rec);		
		}
		catch (error) {
			nlapiLogExecution('DEBUG', 'Error', error.toString());
		}
	}
