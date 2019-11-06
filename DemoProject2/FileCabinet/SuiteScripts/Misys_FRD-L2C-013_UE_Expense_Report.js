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
	
	var ExpenseAdjusted = nlapiGetFieldValue('custbody_expenses_adjusted');
		nlapiLogExecution('DEBUG','ExpenseAdjusted',ExpenseAdjusted);
		
		var context2 = nlapiGetContext();
      	var userId = context2.getUser();
		if(ExpenseAdjusted == 'F' )//&&  userId == '777050') 
		{	
	// Function to get partial amount for negative lines
	var funcGetAmountToAdd = function(strSublistId, intIndex, flAmount, strTaxCode) {
		var flResult = 0;
		if (strTaxCode == null || strTaxCode == '') {
			flResult = flAmount;
		} else {
			var flGrossAmount = parseFloat(nlapiGetLineItemValue(strSublistId, 'grossamt', intIndex));
			if (isNaN(flGrossAmount) === true) flGrossAmount = 0;
			flResult = flGrossAmount;
		}
		return flResult;
	};
	
	var objAmountFunctions = {
			"DEFAULT" : funcGetAmountToAdd,
			"CA" : CC_EXPENSES_UTILS.getAmountTwoTaxes
	};
	
	var objTaxCodeFunctions = {
			"DEFAULT" : CC_EXPENSES_UTILS.getNullTaxCode,
			"CA" : CC_EXPENSES_UTILS.getOutOfScopeTaxCode
	};
	
	// Get the Employee to be set in negative lines custom column field
	var funcGetEmployee = function() {
		return nlapiGetFieldValue('entity');
	};
	
	// Get the name of the script parameter that holds the email sender's ID
	var funcGetEmailSenderParamName = function() {
		return 'custscript_error_email_sender_er';
	};
	
	var objFuncs = {};
	objFuncs[CC_EXPENSES_UTILS.FUNC_NAME_AMOUNT_TO_ADD] = objAmountFunctions;
	objFuncs[CC_EXPENSES_UTILS.FUNC_NAME_NEG_LINE_TAX_CODE] = objTaxCodeFunctions;
	objFuncs[CC_EXPENSES_UTILS.FUNC_NAME_EMPLOYEE] = funcGetEmployee;
	objFuncs[CC_EXPENSES_UTILS.FUNC_NAME_EMAIL_SENDER_PARAM_NAME] = funcGetEmailSenderParamName;
	CC_EXPENSES_UTILS.main(objFuncs);
	}
	else
	{
		nlapiLogExecution('DEBUG','ExpenseAdjusted','ExpenseAdjusted');
	}
}
