/**
 * Copyright (c) 1998-2014 NetSuite, Inc.
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
 * Module Description
 * 
 * Version    Date            Author           Remarks
 * 1.00       07 Mar 2014     bfeliciano
 *
 */

/**
 * The recordType (internal id) corresponds to the "Applied To" record in your script deployment. 
 * @appliedtorecord recordType
 *   
 * @param {String} type Operation types: create, edit, view, copy, print, email
 * @param {nlobjForm} form Current form
 * @param {nlobjRequest} request Request object
 * @returns {Void}
 */
function beforeLoad_ApprovingPO(type, form, request){
	__log.start({
		 'logtitle'  : 'beforeLoad-ApprovingPO-'
		,'company' 	 : 'Misys'
		,'scriptname': 'Misys_FRD_R2R-004_UE_ApprovePO.js'
		,'scripttype': 'userevent'
	});	
	try
	{
		var exec = nlapiGetContext().getExecutionContext();
		__log.writev('type/context', [type,exec]);
		
		
		//o    Check if execution type (event type) is create  
		//o    Check the script has been invoked(execution context)  by user interaction, CSV or web services and user event script.  
		if (!__is.inArray(['edit','view'], type) ) return __log.end('Ignoring type: ' + type, true);	
		if (!__is.inArray(['workflow','userevent','userinterface','suitelet'], exec) ) return __log.end('Ignoring execution context:' + exec, true);
		
		var recPO = nlapiGetNewRecord();
		__log.setCurrentRecord(recPO);
		
		var chkExcludeAutoApproval = recPO.getFieldValue('custbody_icc_exclude_po_approval');		
		__log.writev('Is Exclude Auto Approval?', [chkExcludeAutoApproval]);
		
		var stEmployee = recPO.getFieldValue('employee');
		__log.writev('Has Employee?', [stEmployee]);
		
		var paramICPOApproverRole = __fn.getScriptParameter('custscript_icpo_approver_role');
		__log.writev('IC PO Approver Role', [paramICPOApproverRole]);
		
		var userCurrentRole = nlapiGetContext().getRole();
		__log.writev('Current User Role', [userCurrentRole]);
		
		
		if ( ( chkExcludeAutoApproval == 'T' ) &&  (stEmployee==null || !stEmployee) )
		{
			if ( paramICPOApproverRole != userCurrentRole )
			{
				if ( type == 'view') 
				{
					var btnEdit 	= form.getButton('edit');				
					var btnApprove 	= form.getButton('approve');
					var btnReject 	= form.getButton('reject');
					
					
					if (btnEdit) btnEdit.setDisabled(true);
					if (btnApprove) btnApprove.setDisabled(true);
					if (btnReject) btnReject.setDisabled(true);
					
				} else {
					
					nlapiSetRedirectURL('RECORD',nlapiGetRecordType(), nlapiGetRecordId());
					
				} 				
				
			
			}
		
		
		}
		
		return __log.end(true); 
	}
	catch (error)
	{
		__log.end('EXIT SCRIPT with errors | ' + error.toString(), true);
	    if (error.getDetails != undefined)
	    {
	        nlapiLogExecution( 'ERROR', 'Process Error',error.getCode() + ': ' + error.getDetails());
	        throw error;
	    }
	    else
	    {
	        nlapiLogExecution( 'ERROR', 'Unexpected Error',error.toString());
	        throw nlapiCreateError('99999' , error.toString());
	    }
	}
 
}
