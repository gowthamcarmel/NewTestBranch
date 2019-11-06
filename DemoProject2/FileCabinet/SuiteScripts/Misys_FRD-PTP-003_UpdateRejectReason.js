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
 * A workflow action script for PO Approval Workflow to allow user to enter Reject Reason and Reject Reason Detail.  
 * @author Aurel Shenne Sinsin
 * @version 1.0
 */
function workflowAction_enterRejectReason()
{	
	var stLoggerTitle = 'workflowAction_enterRejectReason';
		
	nlapiLogExecution('DEBUG', stLoggerTitle, '>>Entry<<');
    
    try
    {    	
    	var stTranId = nlapiGetRecordId();
    	nlapiLogExecution('DEBUG', stLoggerTitle, 'Transaction ID = ' + stTranId);

	var stTranType = nlapiGetRecordType();
    	nlapiLogExecution('DEBUG', stLoggerTitle, 'Transaction Type = ' + stTranType);
    	
    	var arrParams = new Array();
		arrParams['custpage_tranid']=stTranId;
		arrParams['custpage_trantype']=stTranType;
    	
    	nlapiSetRedirectURL('SUITELET','customscript_update_rejection_reason','customdeploy_update_rejection_reason', null, arrParams);
        
        nlapiLogExecution('DEBUG', stLoggerTitle, '>>Exit<<');        
        return true;
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
        return false;
    }    
}


/**
 * A main suitelet that will display the Reject Reason page
 * @param request
 * @param response
 */
function suitelet_updateRejectReason(request,response)
{	
	var stLoggerTitle = 'suitelet_updateRejectReason';		
	nlapiLogExecution('DEBUG', stLoggerTitle, '>> Entry Log <<');
    
    try
    {    	
		var stStage = request.getParameter('custpage_stage');
		nlapiLogExecution('DEBUG', stLoggerTitle, 'Stage = ' + stStage);
		
		var stTranId = request.getParameter('custpage_tranid');
		nlapiLogExecution('DEBUG', stLoggerTitle, 'Transaction ID = ' + stTranId);

		var stTranType = request.getParameter('custpage_trantype');
		nlapiLogExecution('DEBUG', stLoggerTitle, 'Transaction Type = ' + stTranType);
		
    	var form = nlapiCreateForm('Rejection Reason', true);
    	
    	switch(stStage)
        {
        	case 'showRejectReasonPage':
        		form = updateRejectReason(request,response, form, stTranId, stTranType);
        		break;
        	default:
        		form = showRejectReasonPage(request,response, form, stTranId, stTranType);    	 
        }   	
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
 * Display Reject Reason page
 * @param request
 * @param response
 * @param form
 * @param stTranId 
 */
function showRejectReasonPage(request, response, form, stTranId, stTranType)
{
	form = nlapiCreateForm('Rejection Reason', true);
	
	var fldStage = form.addField('custpage_stage', 'text', 'Stage');
	fldStage.setDefaultValue('showRejectReasonPage');
	fldStage.setDisplayType('hidden');
	
	var fldTranId = form.addField('custpage_tranid', 'text', 'Transaction ID');
	fldTranId.setDefaultValue(stTranId);
	fldTranId.setDisplayType('hidden');
	
	var fldTranType = form.addField('custpage_trantype', 'text', 'Transaction Type');
	fldTranType.setDefaultValue(stTranType);
	fldTranType.setDisplayType('hidden');

	// Create the following fields: Reject Reason, Reject Reason Details
	//form.addField('custpage_reject_reason', 'select', 'Rejection Reason', '176').setMandatory(true); // SB
	form.addField('custpage_reject_reason', 'select', 'Rejection Reason', '117').setMandatory(true); // UAT
	form.addField('custpage_reject_reason_details', 'text', 'Rejection Reason Details').setMandatory(true);
	
	// Create the following buttons: Save, Cancel
	form.addSubmitButton('Save');
	
	response.writePage(form);
}


/**
 * If the user clicks Save, the page will be redirected back to the Purchase Order record and the status is changed to Rejected.
 * @param request
 * @param response
 * @param form
 * @param stTranId
 */
function updateRejectReason(request, response, form, stTranId, stTranType)
{
	var stLoggerTitle = 'suitelet_updateRejectReason - rejected';	
	nlapiLogExecution('DEBUG', stLoggerTitle, 'Transaction ID = ' + stTranId + ' | Transaction Type = ' + stTranType);
	
	var stRejectReason = request.getParameter('custpage_reject_reason');
	nlapiLogExecution('DEBUG', stLoggerTitle, 'Rejection Reason = ' + stRejectReason);
	
	var stRejectReasonDetails = request.getParameter('custpage_reject_reason_details');
	nlapiLogExecution('DEBUG', stLoggerTitle, 'Rejection Reason Details = ' + stRejectReasonDetails);

//	nlapiSubmitField(stTranType, stTranId, ['custbody_rejection_reason', 'custbodyreject_reason_details', 'approvalstatus'], 
//			[stRejectReason, stRejectReasonDetails, '3']); // SB
	nlapiSubmitField(stTranType, stTranId, ['custbody_reject_reason', 'custbody_reject_reason_details', 'approvalstatus'], 
			[stRejectReason, stRejectReasonDetails, '3']); // UAT
	nlapiLogExecution('DEBUG', stLoggerTitle, 'Successfully updated record.');
	
	nlapiSetRedirectURL('RECORD', stTranType, stTranId);
	
	
}