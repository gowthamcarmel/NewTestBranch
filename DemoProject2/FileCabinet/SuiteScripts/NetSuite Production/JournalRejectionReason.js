/**
 * Module Description
 * 
 * Version    Date            Author           Remarks
 * 1.00       05 Mar 2014     anduggal
 *
 */

/**
 * @returns {Void} Any or no return value
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
    	
    	nlapiSetRedirectURL('SUITELET','customscript_mys_upd_jnl_rej_rsn','customdeploy_mys_upd_jnl_rej_rsn', null, arrParams);
        
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
	//form.addField('custpage_reject_reason', 'select', 'Rejection Reason', '411').setMandatory(true); // UAT
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
	
	//var stRejectReason = request.getParameter('custpage_reject_reason');
	//nlapiLogExecution('DEBUG', stLoggerTitle, 'Rejection Reason = ' + stRejectReason);
	
	var stRejectReasonDetails = request.getParameter('custpage_reject_reason_details');
	nlapiLogExecution('DEBUG', stLoggerTitle, 'Rejection Reason Details = ' + stRejectReasonDetails);

	nlapiSubmitField(stTranType, stTranId, ['custbody_mys_so_rej_det', 'custbody_mys_approval_stat'], 
			[stRejectReasonDetails, '3']);
	nlapiLogExecution('DEBUG', stLoggerTitle, 'Successfully Updated Record.');
	
	nlapiSetRedirectURL('RECORD', stTranType, stTranId);
	
	
}