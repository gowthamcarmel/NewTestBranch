/**
 * Copyright (c) 1998-2013 NetSuite, Inc.
* 2955 Campus Drive, Suite 100, San Mateo, CA, USA 94403-2511
* All Rights Reserved.
*
* This software is the confidential and proprietary information of
* NetSuite, Inc. ("Confidential Information"). You shall not
* disclose such Confidential Information and shall use it only in
* accordance with the terms of the license agreement you entered into
* with NetSuite.
 * 
 * * Misys check Tolerance for Exchange Rate & raise alert if exceeded
 * 
 * @author pshah
 * @version 1.0
 */

//ensure the exchange rate modified field is set to false
function pageInit_resetCustomField(type){
	try {
		if(type=='copy'){
			nlapiSetFieldValue('custbody_default_exchange_rate', nlapiGetFieldValue('exchangerate'));
			nlapiSetFieldValue('custbody_current_exchange_rate',nlapiGetFieldValue('exchangerate'));
		}
		//nlapiSetFieldValue('custbody_exch_rate_modified', 'F');
	}
	catch(error) 
	{
 	   if (error.getDetails != undefined) 
 	   {
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

//set default exchange rate when user sets the currency/name field
function postSourcing_setDefaultExchangeRate(type, name, linenum){
	try {
		if (name == 'currency' || name == 'entity' || name == 'trandate') {
			
			var defaultExchangeRate = parseFloat(nlapiGetFieldValue('exchangerate'));
			nlapiSetFieldValue('custbody_default_exchange_rate', defaultExchangeRate);
		}
		return true;
	}
	catch(error) 
	{
 	   if (error.getDetails != undefined) 
 	   {
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

//on save validate if exchange rate has been modified and if above tolerance raise an alert, if confirmed set custom field
function onSave_validateExchangeRateMod(){
	try {
		//fetch the global script parameter tolerance
		var tolerancepercentage = parseFloat(nlapiGetContext().getPreference('custscript_tolerance'));
		
		
			//fetch the default exchange rate defined on the transaction
			var defaultExchangeRate = parseFloat(nlapiGetFieldValue('custbody_default_exchange_rate'));
			
			//fetch the current exchange rate defined on the transaction
			var currentExchangeRate = parseFloat(nlapiGetFieldValue('exchangerate'));
			
			//calculate the difference in exchange rate %
			var exchangeRateDiff = Math.abs(currentExchangeRate - defaultExchangeRate);
			
			var exchangeRateDiffPercent = (exchangeRateDiff / defaultExchangeRate) * 100;
			//alert("exchangeRateDiffPercent=" + exchangeRateDiffPercent)
			var exchangeRateModified = nlapiGetFieldValue('custbody_exch_rate_modified');
			
			var definedExchangeRate = parseFloat(nlapiGetFieldValue('custbody_current_exchange_rate'))
			//alert("definedExchangeRate=" + definedExchangeRate)
			//if exchange rate difference is greater than tolerance raise alert to current user, if confirmed set custom checkbox, if disagreed reset to default exchange rate
			if (exchangeRateDiffPercent > tolerancepercentage) {
				if (definedExchangeRate != currentExchangeRate) {
					
					var ans = confirm(nlapiGetContext().getPreference('custscript_alert_settolerance'));
					if (ans) {
						nlapiSetFieldValue('custbody_exch_rate_modified', 'T');
					//nlapiSetFieldValue('custbody_revert_exchange_rate','F');
					}
					else {
						nlapiSetFieldValue('custbody_exch_rate_modified', 'F');
						nlapiSetFieldValue('custbody_revert_exchange_rate', 'T');
						nlapiSetFieldValue('exchangerate', defaultExchangeRate, true, true);
					}
				}
			}
			else {
				nlapiSetFieldValue('custbody_exch_rate_modified', 'F');
			}
				
		return true;
	}
	catch(error) 
	{
 	   if (error.getDetails != undefined) 
 	   {
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

//set the exchange rate if user rejected change - client side script is not triggering update therefore running on server side.
function beforeSubmit_setExchangeRate(type){
	try {

		var CONTEXT_USERINTERFACE = 'userinterface';
		var CONTEXT_USEREVENT = 'userevent';
		var CONTEXT_SUITELET = 'suitelet'
		
		var context = nlapiGetContext().getExecutionContext();
		nlapiLogExecution('DEBUG','context',context);

		if (type != 'delete') {
			
			if (context == CONTEXT_USERINTERFACE || context == CONTEXT_USEREVENT) {
			
				var revertExchangeRate = nlapiGetFieldValue('custbody_revert_exchange_rate');
				if (revertExchangeRate == 'T') {
					var defaultExchangeRate = nlapiGetFieldValue('custbody_default_exchange_rate');
					nlapiSetFieldValue('exchangerate', defaultExchangeRate);
				}
				else{
					nlapiSetFieldValue('custbody_current_exchange_rate', nlapiGetFieldValue('exchangerate'));
				}
			}
		}
		if (type=='create'){
			if (context == CONTEXT_SUITELET){
				var exchangeRate = nlapiGetFieldValue('exchangerate');
				nlapiSetFieldValue('custbody_default_exchange_rate', exchangeRate);
			}
		}
		
	} 
	catch (error) {
		if (error.getDetails != undefined) {
			nlapiLogExecution('ERROR', 'Process Error', error.getCode() + ': ' + error.getDetails());
			throw error;
		}
		else {
			nlapiLogExecution('ERROR', 'Unexpected Error', error.toString());
			throw nlapiCreateError('99999', error.toString());
		}
	}
}		
	


//LIBRARY FUNCTIONS
function isEmpty(fld) {return (fld==null||fld=='');}
function isNotEmpty(fld) {return (fld!=null&&fld!='');}
function isTrue(fld) {return (isNotEmpty(fld)&&(fld=='T'||fld=='Y'));}
function isNotTrue(fld) {return (isEmpty(fld)||(fld!='T'&&fld!='Y'));}

function roundNumber(num, dec){
	var result = Math.round(num*Math.pow(10,dec))/Math.pow(10,dec);
	return result;
}
