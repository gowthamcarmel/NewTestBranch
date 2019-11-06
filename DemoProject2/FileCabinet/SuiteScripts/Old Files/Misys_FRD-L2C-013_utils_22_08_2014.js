/**
 * Module Description
 * 
 * Version    Date            Author           Remarks
 * 1.00       24 Mar 2014     fromero
 *
 */

var CC_EXPENSES_UTILS = (function() {
	/*
	 * Constants
	 */
	var _RECORD_PAYMENT_TYPE = 'customrecord_exp_payment_type';
	var _FIELD_CREATE_NEG_LINE = 'custrecord_create_neg_line';
	var _FIELD_NEG_EXPENSE_CATEGORY = 'custrecord_neg_expense_category';
	var _FIELD_REVERSE_NON_REIMB_EXP = 'custrecord_reverse_non_reimb_expense';
	
	var _RECORD_OUT_OF_SCOPE_TAX_CODE = 'customrecord_out_of_scope_tax_code';
	var _FIELD_COUNTRY_CODE = 'custrecord_ooftc_country_code';
	var _FIELD_TAX_CODE = 'custrecord_oos_tax_code';
	
	// Expense line custom columns
	var _COL_PAYMENT_TYPE = 'custcol_exp_payment_type';
	var _COL_ITEM_CATEGORY = 'custcol_misyscategory';
	var _COL_ITEM_SUBCATEGORY_1 = 'custcol_misyssubcategory1';
	var _COL_ITEM_SUBCATEGORY_2 = 'custcol_misyssubcategory2';
	var _COL_EMPLOYEE = 'custcol_misysemployee';
	
	// Expense Category custom fields
	var _FIELD_ITEM_CATEGORY = 'custrecord_expcat_category';
	var _FIELD_ITEM_SUBCATEGORY_1 = 'custrecord_expcat_subcat1';
	var _FIELD_ITEM_SUBCATEGORY_2 = 'custrecord_expcat_subcat2';
	
	// Subsidiary custom fields
	var _FIELD_DEFAULT_COST_CENTER = 'custrecord_default_cost_center';
	var _FIELD_DEFAULT_REGION = 'custrecord_default_region';
	var _FIELD_DEFAULT_PRODUCT = 'custrecord_default_product';
	
	// Employee custom fields
	var _FIELD_VENDOR_CODE = 'custentity_vendor';
	
	// Transaction custom fields
	var _FIELD_OA_EXP_REPORT = 'custbody_oa_expense_report_number';
	var _FIELD_EXPENSES_ADJUSTED = 'custbody_expenses_adjusted';
	
	// Errors and messages
	var _ERROR_MISSING_EMAIL_SENDER = 'MISSING_EMAIL_SENDER';
	var _MESSAGE_MISSING_EMAIL_SENDER = 'Parameter "Error Email Sender" is missing. Contact the system Administrator';
	var _ERROR_EMAIL_SUBJECT = 'Script error';
	
	var _PROP_AMOUNT = 'amount';
	var _PROP_EXPENSE_CATEGORY = 'expenseCategory';
	var _PROP_ITEM_CATEGORY = 'itemCategory';
	var _PROP_ITEM_SUBCATEGORY_1 = 'itemSubcategory1';
	var _PROP_ITEM_SUBCATEGORY_2 = 'itemSubcategory2';
	
	var _FUNC_NAME_AMOUNT_TO_ADD = 'getAmountToAdd';
	var _FUNC_NAME_NEG_LINE_TAX_CODE = 'getNegLineTaxCode';
	var _FUNC_NAME_EMPLOYEE = 'getEmployee';
	var _FUNC_NAME_EMAIL_SENDER_PARAM_NAME = 'getEmailSenderParamName';
	/*
	 * End of Constants
	 */
	
	var _FUNC_MAIN = function(objFuncs) {
		nlapiLogExecution('DEBUG', 'event type', type);
		// Check event type
		if (type == 'create') {
			// Check execution context
			var objContext = nlapiGetContext();
			var strExecCtx = objContext.getExecutionContext();
			nlapiLogExecution('DEBUG', 'context', strExecCtx);
			if ((strExecCtx == 'webservices' || strExecCtx == 'userinterface') && nlapiGetFieldValue(_FIELD_OA_EXP_REPORT) != null && nlapiGetFieldValue(_FIELD_OA_EXP_REPORT) != '') {

				// Error notification sender's ID
				var strParamName = objFuncs[_FUNC_NAME_EMAIL_SENDER_PARAM_NAME].apply();
				nlapiLogExecution('DEBUG', 'email sender param name', strParamName);
				var intSenderId = parseInt(objContext.getSetting('SCRIPT', strParamName));
				nlapiLogExecution('DEBUG', 'email sender ID', intSenderId);
				if (isNaN(intSenderId) === true) {
					throw (nlapiCreateError(_ERROR_MISSING_EMAIL_SENDER,
							_MESSAGE_MISSING_EMAIL_SENDER));
				}

				var strSublistId = 'expense';
				var intLines = nlapiGetLineItemCount(strSublistId);
				
				var strOriginalAccount = nlapiGetFieldValue('account');
				var strOriginalAccountText = nlapiGetFieldText('account');
				nlapiLogExecution('DEBUG', 'account nlapiGetFieldValue', strOriginalAccount + ' - ' + strOriginalAccountText);
				
				var recTransaction = nlapiLoadRecord(nlapiGetRecordType(), nlapiGetRecordId(), {recordmode: 'dynamic'});
				
				var strHeaderAccount = recTransaction.getFieldValue('account');
				var strHeaderAccountText = recTransaction.getFieldText('account');
				nlapiLogExecution('DEBUG', 'account from recTransaction (start)', strHeaderAccount + ' - ' + strHeaderAccountText);
				
				// Get the employee to be set in the custom column field
				var strEmployeeId = objFuncs[_FUNC_NAME_EMPLOYEE].apply();
				nlapiLogExecution('DEBUG', 'employee for custom column', strEmployeeId);
				
				// Associative array to hold the negative lines to be entered, by Payment Type
				var objNegLines = {};
				
				// Iteration over the the expense lines to get the Payment Type, Expense Category and amount
				for (var i = 1; i <= intLines; i++) {
					var intPaymentType = nlapiGetLineItemValue(strSublistId, _COL_PAYMENT_TYPE, i);
					if (intPaymentType != null && intPaymentType != '') {
						var recPaymentType = nlapiLoadRecord(_RECORD_PAYMENT_TYPE, intPaymentType, null);
						if (recPaymentType != null) {
							var flAmount = parseFloat(nlapiGetLineItemValue(strSublistId, 'amount', i));
							if (isNaN(flAmount) === true) flAmount = 0;
							var strTaxCode = nlapiGetLineItemValue(strSublistId, 'taxcode', i);
							if (recPaymentType.getFieldValue(_FIELD_CREATE_NEG_LINE) == 'T') {	// Process for negative line
								var objAccumulator = {};
								if (objNegLines[intPaymentType]) {
									objAccumulator = objNegLines[intPaymentType];
								} else {
									// Initialises 'amount' to 0
									objAccumulator[_PROP_AMOUNT] = 0;
									
									// Retrieves the Expense Category from Payment Type and sets it in the accumulator
									var strCategory = recPaymentType.getFieldValue(_FIELD_NEG_EXPENSE_CATEGORY);
									objAccumulator[_PROP_EXPENSE_CATEGORY] = strCategory;
									
									// Retrieves Item Category, Subcategory1 and Subcategory2 from Expense Category
									var recCategory = nlapiLoadRecord('expensecategory', strCategory, null);
									objAccumulator[_PROP_ITEM_CATEGORY] = recCategory.getFieldValue(_FIELD_ITEM_CATEGORY);
									objAccumulator[_PROP_ITEM_SUBCATEGORY_1] = recCategory.getFieldValue(_FIELD_ITEM_SUBCATEGORY_1);
									objAccumulator[_PROP_ITEM_SUBCATEGORY_2] = recCategory.getFieldValue(_FIELD_ITEM_SUBCATEGORY_2);
									
									// Adds the new accumulator to the object
									objNegLines[intPaymentType] = objAccumulator;
								}
								
								// Gets the amount to add
								var flAmountToAdd = objFuncs[_FUNC_NAME_AMOUNT_TO_ADD]
										.apply(undefined, [strSublistId, i, flAmount, strTaxCode]);
								nlapiLogExecution('DEBUG', 'amount returned by the function', flAmountToAdd);
								objAccumulator[_PROP_AMOUNT] += flAmountToAdd;
							} else if (recPaymentType.getFieldValue(_FIELD_REVERSE_NON_REIMB_EXP) == 'T') {	// Process for reimburse line
								var strLineDate = nlapiGetLineItemValue(strSublistId, 'expensedate', i);
								var strLineCategory = nlapiGetLineItemValue(strSublistId, 'category', i);
								var strLineCurrency = nlapiGetLineItemValue(strSublistId, 'currency', i);
								var strLineCostCenter = nlapiGetLineItemValue(strSublistId, 'department', i);
								var strLineRegion = nlapiGetLineItemValue(strSublistId, 'location', i);
								var strLineProduct = nlapiGetLineItemValue(strSublistId, 'class', i);
								var strLineItemCategory = nlapiGetLineItemValue(strSublistId, _COL_ITEM_CATEGORY, i);
								var strLineSubCategory1 = nlapiGetLineItemValue(strSublistId, _COL_ITEM_SUBCATEGORY_1, i);
								var strLineSubCategory2 = nlapiGetLineItemValue(strSublistId, _COL_ITEM_SUBCATEGORY_2, i);
								
								// Create reimburse line
								recTransaction.selectNewLineItem(strSublistId);
								recTransaction.setCurrentLineItemValue(strSublistId, 'expensedate', strLineDate);
								recTransaction.setCurrentLineItemValue(strSublistId, 'category', strLineCategory);
								recTransaction.setCurrentLineItemValue(strSublistId, 'currency', strLineCurrency);
								recTransaction.setCurrentLineItemValue(strSublistId, 'department', strLineCostCenter);
								recTransaction.setCurrentLineItemValue(strSublistId, 'location', strLineRegion);
								recTransaction.setCurrentLineItemValue(strSublistId, 'class', strLineProduct);
								recTransaction.setCurrentLineItemValue(strSublistId, _COL_ITEM_CATEGORY, strLineItemCategory);
								recTransaction.setCurrentLineItemValue(strSublistId, _COL_ITEM_SUBCATEGORY_1, strLineSubCategory1);
								recTransaction.setCurrentLineItemValue(strSublistId, _COL_ITEM_SUBCATEGORY_2, strLineSubCategory2);
								recTransaction.setCurrentLineItemValue(strSublistId, 'amount', (-1) * flAmount);
								if (strTaxCode != null && strTaxCode != '') {
									recTransaction.setCurrentLineItemValue(strSublistId, 'taxcode', strTaxCode);
								}
								if (strEmployeeId != null && strEmployeeId != '') {
									recTransaction.setCurrentLineItemValue(strSublistId, _COL_EMPLOYEE, strEmployeeId);
								}
								recTransaction.commitLineItem(strSublistId);
							}
						}
					}
				}
				
				// Gets required values from the header (Cost Center, Region and Product from Subsidiary)
				var strSubsidiary = nlapiGetFieldValue('subsidiary');
				var strSubsCostCenter = null;
				var strSubsRegion = null;
				var strSubsProduct = null;
				var strSubsCurrency = null;
				if (strSubsidiary != null && strSubsidiary != '') {
					recSubsidiary = nlapiLoadRecord('subsidiary', strSubsidiary, null);
					if (recSubsidiary != null) {
						strSubsCostCenter = recSubsidiary.getFieldValue(_FIELD_DEFAULT_COST_CENTER);
						strSubsRegion = recSubsidiary.getFieldValue(_FIELD_DEFAULT_REGION);
						strSubsProduct = recSubsidiary.getFieldValue(_FIELD_DEFAULT_PRODUCT);
						strSubsCurrency = recSubsidiary.getFieldValue('currency');
					}
				}
				var strHeaderDate = nlapiGetFieldValue('trandate');
				var strNegLineTaxCode = objFuncs[_FUNC_NAME_NEG_LINE_TAX_CODE].apply();
				
				// Inserts negative lines
				for (var key in objNegLines) {
					if (objNegLines.hasOwnProperty(key)) {
						var objValues = objNegLines[key];
						recTransaction.selectNewLineItem(strSublistId);
						recTransaction.setCurrentLineItemValue(strSublistId, 'expensedate', strHeaderDate);
						recTransaction.setCurrentLineItemText(strSublistId, 'currency', strSubsCurrency);
						recTransaction.setCurrentLineItemValue(strSublistId, 'category', objValues[_PROP_EXPENSE_CATEGORY]);
						recTransaction.setCurrentLineItemValue(strSublistId, 'department', strSubsCostCenter);
						recTransaction.setCurrentLineItemValue(strSublistId, 'location', strSubsRegion);
						recTransaction.setCurrentLineItemValue(strSublistId, 'class', strSubsProduct);
						recTransaction.setCurrentLineItemValue(strSublistId, _COL_ITEM_CATEGORY, objValues[_PROP_ITEM_CATEGORY]);
						recTransaction.setCurrentLineItemValue(strSublistId, _COL_ITEM_SUBCATEGORY_1, objValues[_PROP_ITEM_SUBCATEGORY_1]);
						recTransaction.setCurrentLineItemValue(strSublistId, _COL_ITEM_SUBCATEGORY_2, objValues[_PROP_ITEM_SUBCATEGORY_2]);
						recTransaction.setCurrentLineItemValue(strSublistId, 'amount', (-1) * objValues[_PROP_AMOUNT]);
						nlapiLogExecution('DEBUG', 'setting amounts', objValues[_PROP_AMOUNT]);
						if (strNegLineTaxCode != null && strNegLineTaxCode != '') {
							recTransaction.setCurrentLineItemValue(strSublistId, 'taxcode', strNegLineTaxCode);
						}
						if (strEmployeeId != null && strEmployeeId != '') {
							recTransaction.setCurrentLineItemValue(strSublistId, _COL_EMPLOYEE, strEmployeeId);
						}
						recTransaction.commitLineItem(strSublistId);
					}
				}
				
				// Sets flag 'Expenses Adjusted' and saves record
				recTransaction.setFieldValue(_FIELD_EXPENSES_ADJUSTED, 'T');
				
				strHeaderAccount = recTransaction.getFieldValue('account');
				strHeaderAccountText = recTransaction.getFieldText('account');
				nlapiLogExecution('DEBUG', 'account from recTransaction (end)', strHeaderAccount + ' - ' + strHeaderAccountText);
				recTransaction.setFieldValue('account', strOriginalAccount);

				try {
					nlapiSubmitRecord(recTransaction, true, false);
				} catch (e) {
					var strMessage = 'Couldn\'t update the transaction. ';
					if (e instanceof nlobjError) {
						strMessage += e.getCode() + '\n' + e.getDetails();
						nlapiLogExecution('ERROR', 'afterSubmit', strMessage);
					} else {
						strMessage += e.toString();
						nlapiLogExecution('ERROR', 'afterSubmit', strMessage);
					}
					nlapiSendEmail(intSenderId, objContext.getUser(), _ERROR_EMAIL_SUBJECT, strMessage);
				}
			}
		}
	};

	return {
		FUNC_NAME_AMOUNT_TO_ADD: _FUNC_NAME_AMOUNT_TO_ADD,
		FUNC_NAME_NEG_LINE_TAX_CODE: _FUNC_NAME_NEG_LINE_TAX_CODE,
		FUNC_NAME_EMPLOYEE: _FUNC_NAME_EMPLOYEE,
		FUNC_NAME_EMAIL_SENDER_PARAM_NAME: _FUNC_NAME_EMAIL_SENDER_PARAM_NAME,
		
		RECORD_OUT_OF_SCOPE_TAX_CODE: _RECORD_OUT_OF_SCOPE_TAX_CODE,
		FIELD_COUNTRY_CODE: _FIELD_COUNTRY_CODE,
		FIELD_TAX_CODE: _FIELD_TAX_CODE,
		FIELD_VENDOR_CODE: _FIELD_VENDOR_CODE,
		
		main: _FUNC_MAIN
	};
})();
