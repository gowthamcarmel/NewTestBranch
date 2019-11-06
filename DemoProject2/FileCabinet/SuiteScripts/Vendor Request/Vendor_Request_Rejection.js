/**
 * Module Description
 * 
 * Version    Date            Author           Remarks
 * 1.00       13 Mar 2015     vabhpant
 *
 */

/**
 * @returns {Void} Any or no return value
 */

// P2P - config Bundle - Changes in the script based on Advanced Procurement Module

function ven_req_workflowAction() {
	
	var logTitle = 'Ven_Requ_WorkflowAction';

	try {
	
		var recId = nlapiGetRecordId();
		nlapiLogExecution('DEBUG', logTitle, 'Rec Id= '+recId);
		
		var recType = nlapiGetRecordType();
		nlapiLogExecution('DEBUG', logTitle, 'Rec Type= '+recType);
		
		var param = new Array();
		param['custpage_rec_id'] = recId;
		param['custpage_rec_type'] = recType;
		
		nlapiSetRedirectURL('SUITELET', 'customscript_ven_req_rej', 'customdeploy_ven_req_rej',null , param);
		
		return true;
	}
	
	catch (error) {
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
function suitelet_updateRejectReason(request,response) {	
	
	var stLoggerTitle = 'suitelet_updateRejectReason';		
	nlapiLogExecution('DEBUG', stLoggerTitle, '>> Entry Log <<');
    
    try {    
    	
    	var recId = request.getParameter('custpage_rec_id');
    	var recType = request.getParameter('custpage_rec_type');
    	var stStage = request.getParameter('custpage_stage');
    	
    	switch (stStage) {
    	
	    	case 'update rejection reason' :
	    		updateRejectionReason(request,response,recId,recType);
	    	break;
	    	default :
	    			 ui_builder(request, response, recId, recType);
	    	break;		
	    	
    	}
    	
    	return true;
    }
    catch(error) {
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
 * UI Creation
 */

function ui_builder(request, response, recId, recType) {
	
	var title = 'UI Builder';
	nlapiLogExecution('DEBUG', title, '---START--');
	
	var form = nlapiCreateForm('Rejection Reason', true);
	
	var rId = form.addField('custpage_rec_id', 'Text', 'Record Id');
	rId.setDefaultValue(recId);
	rId.setDisplayType('hidden');
	
	var rType = form.addField('custpage_rec_type', 'Text', 'Record Type');
	rType.setDefaultValue(recType);
	rType.setDisplayType('hidden');
	
	var stage = form.addField('custpage_stage', 'Text', 'Stage');
	stage.setDefaultValue('update rejection reason');
	stage.setDisplayType('hidden');
  
	form.addField('custpage_reject_reason', 'select', 'Rejection Reason', '733').setMandatory(true); 	// P2P - config Bundle
	form.addField('custpage_rej_details', 'Text', 'Rejection Details').setMandatory(true);
	form.addSubmitButton();
	
	response.writePage(form);
	
	nlapiLogExecution('DEBUG', title, '---END---');
}

/**
 * update rejection reason
 */

function updateRejectionReason (request, response, recId, recType) {
	
	var title = 'UpdateRejectionReason';
	nlapiLogExecution('DEBUG', title , '---START---');
	
	var rej_details = request.getParameter('custpage_rej_details');
	nlapiLogExecution('DEBUG', 'rej_details', rej_details);
  
    var rej_reason_code = request.getParameter('custpage_reject_reason'); 	// P2P - config Bundle
	
	nlapiLogExecution('DEBUG', 'rec id', recId);
	nlapiLogExecution('DEBUG', 'rec type', recType);
	
	nlapiSubmitField(recType, recId, ['custrecord_vr_reject_reason','custrecord_vr_approval_status','custrecord_vr_reject_reason_code'], [rej_details, '3',rej_reason_code]); 	// P2P - config Bundle
  
  //nlapiSubmitField(recType, recId, ['custrecord_vr_reject_reason_code'],[rej_reason_code]);
  
	nlapiLogExecution('DEBUG', title , '---END---');

	nlapiSetRedirectURL('RECORD', recType, recId);
}