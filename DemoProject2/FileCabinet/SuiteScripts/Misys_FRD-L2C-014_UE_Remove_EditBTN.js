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
 * * Misys remove Edit button from 3pp POs if current user's role is not 3PP approver Role, set in  general preferences
 * 
 * @author amartins
 * @version 1.0
 */
//hide edit button once a vendor bill & PO
function beforeLoad_hideEditButton(type,form,request){
	try{
		if (type == 'edit' || type == 'view'){
			var is3PP = nlapiGetFieldValue('custbody_3pp_po');
			var stApprovalStatus = nlapiGetFieldValue('approvalstatus');
			var bSubmittedForApproval = nlapiGetFieldValue('custbody_submitted_for_approval');
			var context = nlapiGetContext()
			var userInterface = context.getExecutionContext();
			// Only trigger if from user interface
			if (userInterface == 'userinterface'){
				// only apply to 3PP POs
				if (is3PP == 'T'){				
					var PPRole = context.getSetting('SCRIPT', 'custscript_3pp_approver_role');
					var currentRole = nlapiGetContext().getRole();
					
					// log varaiables 
					nlapiLogExecution('DEBUG', 'userInterface', userInterface);
					nlapiLogExecution('DEBUG', 'PPRole', PPRole );
					nlapiLogExecution('DEBUG', 'currentRole', currentRole);
				
					//if vew mode remove edit button		
					if (currentRole == PPRole || currentRole == 3) 
					{
						nlapiLogExecution('DEBUG', 'DEBUG', 'Exit');
						return true;
					}
					
					if (type == 'view')
					{
						//hide the edit button from users 
						nlapiLogExecution('DEBUG', 'DEBUG', 'Hide Edit button');
						form.removeButton('edit');
						return true;
					}
					else if (type == 'edit')
					{
						nlapiLogExecution('DEBUG', 'DEBUG', 'Redirect to view mode');
						nlapiSetRedirectURL('RECORD', nlapiGetRecordType(), nlapiGetRecordId(), false);
						return true;	
					}
				}
			
				else {
					//hides the edit button if PO is already submitted for approval and status is not Pending Approval and is not Admin , Admin always sees Edit
					if (stApprovalStatus == 1 && bSubmittedForApproval == 'T' && nlapiGetContext().getRole()!=3) {
						if (type == 'view') {
							form.removeButton('edit');
						}
						if (type == 'edit') {
							nlapiSetRedirectURL('RECORD', nlapiGetRecordType(), nlapiGetRecordId(), false);
						}
					}
				}
			}	
		}	
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