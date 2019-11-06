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
 * A workflow action script for VB Approval Workflow to redirect the user to a confirmation message suitelet.  
 * @author Aurel Shenne Sinsin
 * @version 1.0
 */
function workflowAction_confirmVendorBillApproval()
{	
	var stLoggerTitle = 'workflowAction_confirmVendorBillApproval';
		
	nlapiLogExecution('DEBUG', stLoggerTitle, '>>Entry<<');
    
    try
    {    	
    	var stVB = nlapiGetRecordId()
    	nlapiLogExecution('DEBUG', stLoggerTitle, 'Vendor Bill = ' + stVB);
    	
    	var arrParams = new Array();
		arrParams['custpage_vb']=stVB;
    	
    	nlapiSetRedirectURL('SUITELET','customscript_confirm_vb_approval_suitele','customdeploy_confirm_vb_approval_suitele', null, arrParams);
        
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
 * A main suitelet that will display the confirmation message
 * @param request
 * @param response
 */
function suitelet_confirmVendorBillApproval(request,response)
{	
	var stLoggerTitle = 'suitelet_confirmVendorBillApproval';		
	nlapiLogExecution('DEBUG', stLoggerTitle, '>> Entry Log <<');
    
    try
    {    	
		var stStage = request.getParameter('custpage_stage');
		nlapiLogExecution('DEBUG', stLoggerTitle, 'Stage = ' + stStage);
		
		var stVB = request.getParameter('custpage_vb');
		nlapiLogExecution('DEBUG', stLoggerTitle, 'VB = ' + stVB);
		
    	var form = nlapiCreateForm('Select Invoice Range', true);
    	
    	switch(stStage)
        {
        	case 'showConfirmMessage':
        		form = confirmed(request,response, form, stVB);
        		break;
        	default:
        		form = showConfirmMessage(request,response, form, stVB);    	 
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
 * Display confirmation message. If the user clicks Cancel, the page will be redirected back to the Vendor Bill record and the status remains to Pending Approval.
 * @param request
 * @param response
 * @param form
 * @param stVB
 */
function showConfirmMessage(request, response, form, stVB)
{
	form = nlapiCreateForm('Confirm Vendor Bill Approval', true);
	
	var fldStage = form.addField('custpage_stage', 'text', 'Stage');
	fldStage.setDefaultValue('showConfirmMessage');
	fldStage.setDisplayType('hidden');
	
	var fldVB = form.addField('custpage_vb', 'text', 'VB');
	fldVB.setDefaultValue(stVB);
	fldVB.setDisplayType('hidden');
	
	// Create the following fields: From Date, To Date, Payment Method
	var fldMsg = form.addField('custpage_confirm_message', 'text');	
	fldMsg.setDefaultValue('The associated Purchase Order is currently in Pending Approval status. Do you wish to continue to approve the Bill?');
	fldMsg.setDisplayType('inline');
	
	// Create the following buttons: Save, Cancel
	form.addSubmitButton('Ok');
	form.addButton('custpage_cancel_button', 'Cancel', 'window.history.back();');
	
	response.writePage(form);
}


/**
 * If the user clicks Ok, the page will be redirected back to the Vendor Bill record and the status is changed to Approve.
 * @param request
 * @param response
 * @param form
 * @param stVB
 */
function confirmed(request, response, form, stVB)
{
	var stLoggerTitle = 'suitelet_confirmVendorBillApproval';	
	nlapiLogExecution('DEBUG', stLoggerTitle, 'VB = ' + stVB);
	
	nlapiSubmitField('vendorbill', stVB, 'approvalstatus', '2');
	nlapiLogExecution('DEBUG', stLoggerTitle, 'Successfully set status to Approved.');
	
	nlapiSetRedirectURL('RECORD', 'vendorbill', stVB);
}