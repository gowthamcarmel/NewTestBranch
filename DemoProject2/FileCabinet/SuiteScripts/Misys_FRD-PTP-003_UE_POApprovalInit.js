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
 **/

/**
 * Module Description
 * 
 * Version    Date            Author           Remarks
 * 1.00       22 Oct 2014     gmanarang
 * 2.00		  26 Apr 2015	  mreal	           added cloaking version 3.0
 * 3.00       16 Sep 2015     mreal            added created date criteria so approve button doesn't show for records created before August 17, 2014
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

// P2P - config Bundle - Changes in the script based on Advanced Procurement Module

function beforeLoad_POApprovalInit(type, form, request){
	// On Before Load; only show for records created on or after August 17, 2014
	var createdDate = nlapiGetFieldValue('createddate');//added by MREAL
	if(createdDate){
		var createdDate = nlapiStringToDate(nlapiDateToString(nlapiStringToDate(createdDate)));
		var hardCodedDate = nlapiStringToDate(nlapiDateToString(new Date('8/17/2014')));
		if(createdDate >= hardCodedDate){
			var WIP = nlapiGetFieldValue('custbody_mys_approval_wf_ip');
			var noTransition = nlapiGetFieldValue('custbody_mys_no_transition');
			var approvalStatus =  nlapiGetFieldValue('approvalstatus');
			var testStatus = nlapiGetFieldValue('custbody_po_testfield');//added by MREAL
			
			// Do not allow loading of record: record is still on transition 	
			// Oct 1 MREAL, added userinterface condition
			//Oct 09/15 PSHAH added admin condition
			//if(WIP == 'T' && noTransition == 'F' && (approvalStatus == '1') && (nlapiGetContext().getExecutionContext() == 'userinterface')){ 
			if(WIP == 'T' && noTransition == 'F' && (approvalStatus == '1') && (nlapiGetContext().getExecutionContext() == 'userinterface') && (nlapiGetRole()!=3)){
				nlapiLogExecution('AUDIT', 'Load Record', 'Approval Workflow is in Progress');
				throw nlapiCreateError('WORKFLOW_IN_PROGRESS', 'Approval Workflow is in Progress', true);
				return;
			}
			
			// This is for the Approve button; only on view and status pending approval; 
			if(type == 'view' && (approvalStatus == '1') && testStatus =='F')//added to ensure that approval button is not added when testfield is T
			{
				var stRecType = nlapiGetRecordType();
				var context = nlapiGetContext();
				var stSavedSearchID = context.getSetting('SCRIPT', 'custscript_navigation_search');
				var currUser = nlapiGetUser();
				var userRole = nlapiGetRole();
				var nextApprover = nlapiGetFieldValue('nextapprover');
				
				//---- P2P - config Bundle ------
				var FinanceClearanceCheck = nlapiGetFieldValue('custbody_finance_clearance_check');
				var CFOClearanceCheck = nlapiGetFieldValue('custbody_cfo_clearance_check');
				//--------- End of P2P - config Bundle ---------------------------
				
				var createdBy = nlapiLookupField(nlapiGetRecordType(), nlapiGetRecordId(), 'createdby');//nlapiGetFieldValue('createdby');
                                var poOwner = nlapiGetFieldValue('employee');
				var submittedForApproval = nlapiGetFieldValue('custbody_submitted_for_approval');
				nlapiLogExecution('AUDIT', 'Approve Button', 'currUser: '+currUser+' | userRole: '+userRole+' | nextApprover: '+nextApprover+ ' | createdBy: '+
															createdBy+ ' | approvalStatus: '+approvalStatus+ ' | submittedForApproval: '+submittedForApproval );
				//---- P2P - config Bundle ------
				if((currUser == nextApprover || userRole == '3' || userRole == '18') && (approvalStatus == '1') && (createdBy != currUser) && (poOwner != currUser) && (WIP == 'F'|| (WIP == 'T' && noTransition == 'T')) && (submittedForApproval == 'T') && (FinanceClearanceCheck != 'T') && (CFOClearanceCheck != 'T'))
				{
					form.addButton('custpage_script_approve', 'Approve', 'nlapiDisableField(\'custpage_script_approve\',true); approveScript(\''+stSavedSearchID+'\')');
					//form.addButton('custpage_script_approve', 'Approve', 'approveScript(\''+stSavedSearchID+'\')');
					form.setScript(nlapiGetContext().getScriptId());
				}		
			}	 
		}
	}
}

function approveScript(stSavedSearchID)
{	
	try
	{
		var recId = nlapiGetRecordId();
		var recType = nlapiGetRecordType();
		var context = nlapiGetContext();
		
		//nlapiLogExecution('DEBUG', 'After record type', 'recType:-', + recType);//---- P2P - config Bundle ------
		
		var uiRecType='';
		
		if(recType == 'purchaseorder')
		{
		uiRecType = 'Purchase Order';			
		}		
		else if(recType == 'vendorbill')
		{
		uiRecType = 'Vendor Bill';		
		}
		else if(recType == 'purchaserequisition')//---- P2P - config Bundle ------
		{
		uiRecType = 'Purchase Requisition';		//---- P2P - config Bundle ------
		}
		
		//nlapiLogExecution('DEBUG', 'After record type', 'start');//---- P2P - config Bundle ------
      
		alert(uiRecType + ' has been submitted for approval.');//DO NOT remove, required for suitelet to execute.	
		
		var stSuiteletUrl = nlapiResolveURL('SUITELET', 'customscript_po_async_approval_suitelet', 'customdeploy_po_async_approval_suitelet');
		stSuiteletUrl += '&recId=' + recId;
		stSuiteletUrl += '&recType=' + recType;
		nlapiRequestURL(stSuiteletUrl, null, null, dummy); //This will call a suitelet and trigger WF asynchronously
		
		/*
		 * The asynchronous call to the suitelet does not work with document.location.href without any of the following "hacks".
		 *  a.	Use an alert after the nlapiRequestURL
		 *  b.	Use nlapiRedirectURL on top of document.location.href
		 */
				    
       nlapiLogExecution('DEBUG', 'Before Search id', 'start');//---- P2P - config Bundle ------
		if(stSavedSearchID) // This is to redirect user to saved search results
		{
			var stSuiteletUrl2 = nlapiResolveURL('SUITELET', 'customscript_po_redirecttosearch', 'customdeploy_po_redirecttosearch');
			stSuiteletUrl2 += '&recType=' + recType + '&recId=' + recId +'&searchId=' + stSavedSearchID;
			document.location.href=stSuiteletUrl2;	
			//}
		}
		else // Redirect to dashboard if no search is selected
		{
			nlapiSetRedirectURL('TASKLINK', 'CARD_-29', null, null, null);	 //DO NOT remove if alert is disabled, required for suitelet to execute.	
			document.location.href='/app/center/card.nl?sc=';
		}		
	}
	catch(e)
	{
		alert('Error in Approval Process: '+e.message);
	}
	
	return;
}

/*
 * Used as callback function for asynchronous request
 */

function dummy(){

}


/**
 *  Suitelet implementation of updating PO (  Not used anymore ) 
 *  This is to trigger the WF like the Approve Button
 * @param {nlobjRequest} request Request object
 * @param {nlobjResponse} response Response object
 * @returns {Void} Any output is written via response object
 */
function suitelet_UpdateApprovalFlag(request, response)
{
	
	// cleanup 11/19/2014
}

function setCustomApprovalField()
{
	nlapiLogExecution('DEBUG', 'start action', 'start');
	var recId = request.getParameter('recId');
	var recType = request.getParameter('recType');
	nlapiLogExecution('DEBUG', 'recType | recId', recType+' | '+recId);
	nlapiSubmitField(recType, recId, 'custbody_mys_approval_wf_ip', 'T', false);
	nlapiSubmitField(recType, recId, 'custbody_po_testfield', 'F', false);//added by MREAL
	nlapiLogExecution('DEBUG', 'end action', 'end');
}

function setTestFieldVendorBill()
{
	var recId = request.getParameter('recId');
	var recType = request.getParameter('recType');
	nlapiSubmitField(recType, recId, 'custbody_po_testfield', 'T', false);
}

function redirectToSearch(request, response)
{
	var recType = request.getParameter('recType');
	var recId = request.getParameter('recId');
	var searchId = request.getParameter('searchId');
	var search = nlapiLoadSearch(recType, searchId);
	filter = new nlobjSearchFilter('internalid', null, 'noneof', recId );
	search.addFilter(filter);
	search.setRedirectURLToSearchResults();
}