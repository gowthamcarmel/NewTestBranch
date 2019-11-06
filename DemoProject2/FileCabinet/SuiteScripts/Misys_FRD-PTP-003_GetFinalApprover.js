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
 * A workflow action script that will retrieve the Final Approver record from Misys Approval Matrix custom record
 * @author Aurel Shenne Sinsin
 * @version 1.0
 */
function workflowAction_getFinalApprover()
{	
	var stLoggerTitle = 'workflowAction_getFinalApprover';
		
	nlapiLogExecution('DEBUG', stLoggerTitle, '>>Entry<<');
    
    try
    {    	
    	// Retrieve the ff from the script parameter: Saved Search
		var context = nlapiGetContext();

        var stFinalApproverSearch = context.getSetting('SCRIPT', 'custscript_final_approver_search');
        nlapiLogExecution('DEBUG', stLoggerTitle, 'Script Parameter | Final Approver Search = ' + stFinalApproverSearch);
    	
    	var arrResults = nlapiSearchRecord('customrecord_approval_matrix', stFinalApproverSearch);
    	if (arrResults != null)
    	{
    		var stFinalApprover = arrResults[0].getId();
    		nlapiLogExecution('DEBUG', stLoggerTitle, 'Final Approver = ' + stFinalApprover);
    		return stFinalApprover;
    	}
        
        nlapiLogExecution('DEBUG', stLoggerTitle, '>>Exit<<');        
        return null;
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

