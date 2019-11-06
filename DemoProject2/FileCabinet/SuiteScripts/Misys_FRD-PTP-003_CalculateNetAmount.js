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
 **************************************************
 *
 *  8412    EGO Add euro for base currency change
 *  8776    EGO Change parent base currency to USD
 */


/**
 * A workflow action script that calculates the Net Amount in USD
 * @author Aurel Shenne Sinsin
 * @version 1.0
 */
function workflowAction_calculateNetAmount()
{	
	var stLoggerTitle = 'workflowAction_calculateNetAmount';
		
	nlapiLogExecution('DEBUG', stLoggerTitle, '>>Entry<<');
    
    try
    {    	
    	var flNetAmt = 0.00;
    	var flTotal = 0.00;
    	var flTaxTotal = 0.00;
    	
    	var stCurrency = nlapiGetFieldText('currency');
    	nlapiLogExecution('DEBUG', stLoggerTitle, 'Currency = ' + stCurrency);
    	
    	var trandate = nlapiGetFieldValue('trandate');
        //nlapiLogExecution('DEBUG', stLoggerTitle, 'Date = ' + trandate);
    	
    	var flExchangeRate = forceParseFloat(nlapiExchangeRate(stCurrency, 'USD', trandate));
    	
    	//var flExchangeRate = forceParseFloat(nlapiExchangeRate(stCurrency, 'USD')); // 8412 -- reversed by 8776
        //var flExchangeRate = forceParseFloat(nlapiExchangeRate(stCurrency, 'EUR')); // 8412 -- reversed by 8776
    	nlapiLogExecution('DEBUG', stLoggerTitle, 'Exchange Rate = ' + flExchangeRate);
    	
    	var recType = nlapiGetRecordType();		
		nlapiLogExecution('DEBUG', stLoggerTitle, 'recType = ' + recType);
		
		
		if (recType == 'purchaserequisition')
		{
			flTotal = forceParseFloat(nlapiGetFieldValue('estimatedtotal'));
	    	nlapiLogExecution('DEBUG', stLoggerTitle, 'Total = ' + flTotal);
		}
		else
		{
			flTotal = forceParseFloat(nlapiGetFieldValue('total'));
			nlapiLogExecution('DEBUG', stLoggerTitle, 'Total = ' + flTotal);
			flTaxTotal = forceParseFloat(nlapiGetFieldValue('taxtotal'));
		}
    	
    	nlapiLogExecution('DEBUG', stLoggerTitle, 'Tax Total = ' + flTaxTotal);
    	
    	flNetAmt = (flTotal - flTaxTotal) * flExchangeRate;
    	nlapiLogExecution('DEBUG', stLoggerTitle, 'Net Amount = ' + flNetAmt);
    	
    	nlapiLogExecution('DEBUG', stLoggerTitle, '>>Setting values on Amount in USD tab<<');
      
    	
    	nlapiSetFieldValue('custbody_mys_net_amount_usd',flNetAmt);
        nlapiSetFieldValue('custbody_mys_tax_total_usd',(flTaxTotal * flExchangeRate));
        nlapiSetFieldValue('custbody_mys_gross_amount_usd',(flTotal * flExchangeRate));
        
        nlapiLogExecution('DEBUG', stLoggerTitle, '>>Exit<<');
        
        
        
        return flNetAmt;
    } 
    catch (error)
    {
    	if (error.getDetails != undefined)
        {
            nlapiLogExecution('ERROR','Process Error',  error.getCode() + ': ' + error.getDetails());
            throw error;
        }
        else
        {
            nlapiLogExecution('ERROR','Unexpected Error', error.toString()); 
            throw nlapiCreateError('99999', error.toString());
        }    	 
        return null;
    }    
}


/**
 * Converts a string to float
 * @param stValue
 * @returns
 */
function forceParseFloat(stValue)
{
	var flValue = parseFloat(stValue);
    
    if (isNaN(flValue))
    {
        return 0.00;
    }
    
    return flValue;
}