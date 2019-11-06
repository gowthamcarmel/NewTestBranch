/**
 * Module Description
 * 
 * Version    Date            Author           Remarks
 * 1.00       19 Mar 2014     fromero
 *	CR1 						EGO 		change to remove tax for expense reports	
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
function afterSubmit_createNegLines(type){
	// Function to get partial amount for negative lines.
	// Converts tax amount to foreign currency, if applicable
	var funcGetAmountToAdd = function(strSublistId, intIndex, flAmount, strTaxCode) {
		// Gets tax amount and exchange rate
		var flTaxAmount = parseFloat(nlapiGetLineItemValue(strSublistId, 'tax1amt', intIndex));
		nlapiLogExecution('DEBUG','flTaxAmount',flTaxAmount);
		//if (isNaN(flTaxAmount) === true) flTaxAmount = 0; // -- CR1
		flTaxAmount = 0; // -- CR1
		var flExRate = 1;
		//var flResult = flAmount + (flTaxAmount / flExRate);
		var flResult = flAmount + (flTaxAmount);
		nlapiLogExecution('DEBUG','flResult',flResult);
		return flResult;
	};
	
	var objAmountFunctions = {
			"DEFAULT" : funcGetAmountToAdd,
			"CA" : CC_EXPENSES_UTILS.getAmountTwoTaxes
	};
	
	var objTaxCodeFunctions = {
			"DEFAULT" : CC_EXPENSES_UTILS.getOutOfScopeTaxCode
	};
	
	// Get the Employee to be set in negative lines custom column field
	var funcGetEmployee = function() {
		var intEmployeeId = null;
		var strVendorId = nlapiGetFieldValue('entity');
		// Search the employee whose custom field 'custentity_vendor' = strVendorId
		var objFilterActive = new nlobjSearchFilter('isinactive', null, 'is', 'F');
		var objFilterVendor = new nlobjSearchFilter(
				CC_EXPENSES_UTILS.FIELD_VENDOR_CODE, null, 'anyof', strVendorId);
		var arResults = nlapiSearchRecord(
				'employee', null, [objFilterActive, objFilterVendor], null);
		if (arResults == null || arResults.length == 0) {
			nlapiLogExecution('ERROR', 'getEmployee', 'No employee found with Vendor Code = ' + strVendorId);
		} else {
			intEmployeeId = arResults[0].getId();
		}
		return intEmployeeId;
	};
	
	// Get the name of the script parameter that holds the email sender's ID
	var funcGetEmailSenderParamName = function() {
		return 'custscript_error_email_sender_vb';
	};
	
	var objFuncs = {};
	objFuncs[CC_EXPENSES_UTILS.FUNC_NAME_AMOUNT_TO_ADD] = objAmountFunctions;
	objFuncs[CC_EXPENSES_UTILS.FUNC_NAME_NEG_LINE_TAX_CODE] = objTaxCodeFunctions;
	objFuncs[CC_EXPENSES_UTILS.FUNC_NAME_EMPLOYEE] = funcGetEmployee;
	objFuncs[CC_EXPENSES_UTILS.FUNC_NAME_EMAIL_SENDER_PARAM_NAME] = funcGetEmailSenderParamName;
	CC_EXPENSES_UTILS.main(objFuncs);
}