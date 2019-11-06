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
			// only apply to 3PP POs
			if (is3PP == 'T'){				
				var context = nlapiGetContext()
				var userInterface = context.getExecutionContext();
				var PPRole = context.getSetting('SCRIPT', 'custscript_3pp_approver_role');
				var currentRole = nlapiGetContext().getRole();
				var approvalStatus = nlapiGetFieldValue('approvalstatus');
				// log varaiables 
				nlapiLogExecution('DEBUG', 'userInterface', userInterface);
				nlapiLogExecution('DEBUG', 'PPRole', PPRole );
				nlapiLogExecution('DEBUG', 'currentRole', currentRole);
				
				// Only trigger if from user interface
				if (userInterface == 'userinterface'){
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