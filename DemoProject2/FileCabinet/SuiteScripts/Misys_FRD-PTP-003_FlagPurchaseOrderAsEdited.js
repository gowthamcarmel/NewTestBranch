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
 * In order to support the PO Approval Workflow, a SuiteScript automation is required to detect edit on Class, Department, Location, Amount in the PO record.
 * 
 * This Edited flag will then be checked by the workflow to reroute the PO back to the Employee Supervisor.
 * The server-side script will be triggered before the PO record is saved in the NetSuite.
 * 
 * @author Aurel Shenne Sinsin
 * @version 1.0
 */
function beforeSubmit_flagPurchaseOrderAsEdited(stType)
{	
	var stLoggerTitle = 'beforeSubmit_flagPurchaseOrderAsEdited';
		
	nlapiLogExecution('DEBUG', stLoggerTitle, 'Entered Before Submit.');
    
    try
    {
    	var stExecContext = nlapiGetContext().getExecutionContext();
    	
    	if (stExecContext != 'userinterface')
    	{
    		nlapiLogExecution('DEBUG', stLoggerTitle, 'Exit Before Submit Successfully.');
    		return;
    	}
    	
    	// Get the old and new PO record object
    	var oldRec = nlapiGetOldRecord();
    	var newRec = nlapiGetNewRecord();
    	
    	// If status is Rejected
    	var stStatus = newRec.getFieldValue('approvalstatus');
    	nlapiLogExecution('DEBUG', stLoggerTitle, 'Approval Status = ' + stStatus);
    	
    	if (stStatus == '3')
    	{
    		// Set VB Edited = YES
    		nlapiLogExecution('DEBUG', stLoggerTitle, 'Setting PO Edited to true...');
    		nlapiSetFieldValue('custbody_po_edited', 'T');
    	}
    	else
    	{
    		// Else, compare old and new values for Class, Location, Department, Amount
    		
    		var stNewClass = forceParseString(newRec.getFieldValue('class'));    		
        	nlapiLogExecution('DEBUG', stLoggerTitle, 'New Class = ' + stNewClass);
        	var stNewLocation = forceParseString(newRec.getFieldValue('location'));    		
        	nlapiLogExecution('DEBUG', stLoggerTitle, 'New Location = ' + stNewLocation);
        	var stNewDepartment = forceParseString(newRec.getFieldValue('department'));    		
        	nlapiLogExecution('DEBUG', stLoggerTitle, 'New Department = ' + stNewDepartment);
        	var stNewAmount = forceParseString(newRec.getFieldValue('subtotal'));    	
        	if(stNewAmount <= 0)
        	{
        		stNewAmount = forceParseString(newRec.getFieldValue('total'));
        	}	
        	nlapiLogExecution('DEBUG', stLoggerTitle, 'New Amount = ' + stNewAmount);    	
        	
        	var stOldClass = forceParseString(oldRec.getFieldValue('class'));    		
        	nlapiLogExecution('DEBUG', stLoggerTitle, 'Old Class = ' + stOldClass);
        	var stOldLocation = forceParseString(oldRec.getFieldValue('location'));    		
        	nlapiLogExecution('DEBUG', stLoggerTitle, 'Old Location = ' + stOldLocation);
        	var stOldDepartment = forceParseString(oldRec.getFieldValue('department'));    		
        	nlapiLogExecution('DEBUG', stLoggerTitle, 'Old Department = ' + stOldDepartment);
        	var stOldAmount = forceParseString(oldRec.getFieldValue('subtotal'));    	
                if(stOldAmount <= 0)
        	{
        		stOldAmount = forceParseString(oldRec.getFieldValue('total'));
        	}	
        	nlapiLogExecution('DEBUG', stLoggerTitle, 'Old Amount = ' + stOldAmount);
        	    	    	
        	// If the value is different
        	if (stNewClass != stOldClass || stNewLocation != stOldLocation || stNewDepartment != stOldDepartment || stNewAmount != stOldAmount)
        	{
        		// Set VB Edited = YES
        		nlapiLogExecution('DEBUG', stLoggerTitle, 'Setting PO Edited to true...');
        		nlapiSetFieldValue('custbody_po_edited', 'T');
        	}
        	else
        	{
        		// Set VB Edited = NO
        		nlapiLogExecution('DEBUG', stLoggerTitle, 'Setting PO Edited to false...');
        		nlapiSetFieldValue('custbody_po_edited', 'F');
        	}
    	}
    	
    	nlapiLogExecution('DEBUG', stLoggerTitle, 'Exit Before Submit Successfully.');
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
    }   
}

/**
 * Return empty string if value is empty
 * @param stValue
 * @returns
 */
function forceParseString (stValue) {
     if (isEmpty(stValue)) {
    	 return '';
     }

     return stValue;
}

/**
 * Check if a string is empty
 * @param stValue (string) value to check
 * @returns {Boolean}
 */
function isEmpty (stValue) {
     if ((stValue == '') || (stValue == null) || (stValue == undefined)) {
          return true;
     }

     return false;
}