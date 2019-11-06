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
 * In order to support the VB Approval Workflow, a SuiteScript automation is required to detect edit on Amount in the VB record.
 * 
 * This Edited flag will then be checked by the workflow to reroute the VB back to the Employee Supervisor.
 * The server-side script will be triggered before the VB record is saved in the NetSuite.
 * 
 * @author Aurel Shenne Sinsin
 * @version 1.0
 */
function beforeSubmit_flagVendorBillAsEdited(stType)
{	
	var stLoggerTitle = 'beforeSubmit_flagVendorBillAsEdited';
		
	nlapiLogExecution('DEBUG', stLoggerTitle, 'Entered Before Submit.');
    
    try
    {
    	var stExecContext = nlapiGetContext().getExecutionContext();
    	
    	if (stExecContext != 'userinterface')
    	{
    		nlapiLogExecution('DEBUG', stLoggerTitle, 'Exit Before Submit Successfully.');
    		return;
    	}
    	
    	// Get the old and new VB record object
    	var oldRec = nlapiGetOldRecord();
    	var newRec = nlapiGetNewRecord();    	
    	
    	// If status is Rejected
    	var stStatus = newRec.getFieldValue('approvalstatus');
    	nlapiLogExecution('DEBUG', stLoggerTitle, 'Approval Status = ' + stStatus);
    	
    	if (stStatus == '3')
    	{
    		// Set VB Edited = YES
    		nlapiLogExecution('DEBUG', stLoggerTitle, 'Setting VB Edited to true...');
    		nlapiSetFieldValue('custbody_po_edited', 'T');
    	}
    	else
    	{
    		var stNewAmount = newRec.getFieldValue('total');
        	var stOldAmount = oldRec.getFieldValue('total');    		
        	nlapiLogExecution('DEBUG', stLoggerTitle, 'Old Amount = ' + stOldAmount +  '| New Amount = ' + stNewAmount);
        	    	    	
        	// If the value is different
        	if (stNewAmount != stOldAmount)
        	{
        		// Set VB Edited = NO
        		nlapiLogExecution('DEBUG', stLoggerTitle, 'Setting PO Edited to true...');
        		nlapiSetFieldValue('custbody_po_edited', 'T');
        	}
        	else
        	{
        		// Set VB Edited = YES
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