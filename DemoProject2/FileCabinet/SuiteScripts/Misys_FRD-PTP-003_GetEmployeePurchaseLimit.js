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
 */


/**
 * A workflow action script that retrieves the employee Purchase Limit
 * @author Aurel Shenne Sinsin
 * @version 1.0
 */
function workflowAction_getEmpPurchaseLimit()
{	
	var stLoggerTitle = 'workflowAction_getEmpPurchaseLimit';
		
	nlapiLogExecution('DEBUG', stLoggerTitle, '>>Entry<<');
    
    try
    {    	
    	var flPurchaseLimit = 0.00
    	
    	var context = nlapiGetContext();
    	
    	var stEmployee = context.getSetting('SCRIPT', 'custscript_po_vb_employee');
    	nlapiLogExecution('DEBUG', stLoggerTitle, 'Script Parameter | Employee = ' + stEmployee);

      if (stEmployee == null) return flPurchaseLimit;
    	
    	var recPO = nlapiLoadRecord('employee', stEmployee);
    	flPurchaseLimit = forceParseFloat(recPO.getFieldValue('purchaseorderlimit'));
    	nlapiLogExecution('DEBUG', stLoggerTitle, 'Purchase Limit = ' + flPurchaseLimit);
        
        nlapiLogExecution('DEBUG', stLoggerTitle, '>>Exit<<');     
        
        return flPurchaseLimit;
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
