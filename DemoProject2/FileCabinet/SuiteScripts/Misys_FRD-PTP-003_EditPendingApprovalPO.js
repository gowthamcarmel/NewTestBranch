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
 * A user event script that hides the edit button if PO is already submitted for approval and status is not Pending Approval
 * 
 * @author Aurel Shenne Sinsin
 * @version 1.0
 */
function beforeLoad_hideEditForPendingApproval(type,form,request)
{
	try{
		var context = nlapiGetContext().getExecutionContext();
		
		if (context != 'userinterface')
		{
			return true;			
		}
				
		var stApprovalStatus = nlapiGetFieldValue('approvalstatus');
		var bSubmittedForApproval = nlapiGetFieldValue('custbody_submitted_for_approval');
		if (stApprovalStatus == 1 && bSubmittedForApproval == 'T')
		{
			if (type == 'view') 
			{
				form.removeButton('edit');
			}
			if (type == 'edit')
			{
				nlapiSetRedirectURL('RECORD', nlapiGetRecordType(), nlapiGetRecordId(), false);				
			}
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