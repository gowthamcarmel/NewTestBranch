/**
 * Module Description
 * 
 * Version    Date            Author           Remarks
 * 1.00       19 Mar 2014     fromero
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
		if (isNaN(flTaxAmount) === true) flTaxAmount = 0;
		var flExRate = 1;
		if (flTaxAmount > 0) {
			flExRate = parseFloat(nlapiGetLineItemValue(strSublistId, 'exchangerate', intIndex));
			if (isNaN(flExRate) === true) flExRate = 1;
		}
		var flResult = flAmount + (flTaxAmount / flExRate);
		return flResult;
	};
	
	// Get tax code for negative line.
	// Out of Scope Tax Code for Vendor Bills
	var funcGetNegLineTaxCode = function() {
		var strResult = null;
		var strNexusCountry = nlapiGetFieldValue('nexus_country');
		if (strNexusCountry != null) {
			var arResults = nlapiSearchRecord(CC_EXPENSES_UTILS.RECORD_OUT_OF_SCOPE_TAX_CODE, null,
					new nlobjSearchFilter('name', CC_EXPENSES_UTILS.FIELD_COUNTRY_CODE, 'is', strNexusCountry),
					new nlobjSearchColumn(CC_EXPENSES_UTILS.FIELD_TAX_CODE, null, null));
			if (arResults != null && arResults.length > 0) {
				strResult = arResults[0].getValue(CC_EXPENSES_UTILS.FIELD_TAX_CODE, null, null);
			}
		}
		return strResult;
		//return null;
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
	
	var objFuncs = {};
	objFuncs[CC_EXPENSES_UTILS.FUNC_NAME_AMOUNT_TO_ADD] = funcGetAmountToAdd;
	objFuncs[CC_EXPENSES_UTILS.FUNC_NAME_NEG_LINE_TAX_CODE] = funcGetNegLineTaxCode;
	objFuncs[CC_EXPENSES_UTILS.FUNC_NAME_EMPLOYEE] = funcGetEmployee;
	CC_EXPENSES_UTILS.main(objFuncs);
}
