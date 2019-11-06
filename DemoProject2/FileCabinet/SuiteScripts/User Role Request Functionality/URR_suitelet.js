/**
 * A workflow action script for 'User role request' workflow to display currently assigned roles at the time of new role request creation .  
 * @author Vabhav Pant
 * @version 1.0
 */

function workflowaction_createForm() {
	
	var stLoggerTitle = 'workflow_currentRoles';		
	nlapiLogExecution('DEBUG', stLoggerTitle, '>> Entry Log <<');

	try {	
			var recId = nlapiGetRecordId();
			var recType = nlapiGetRecordType();
				
			var arg = new Array();
				arg['custpage_recid'] = recId;
				arg['custpage_rectype'] =recType;
	

			nlapiSetRedirectURL('SUITELET','customscript_urr_cur_roles','customdeploy_urr_cur_role_dep', null, arg);
		}
	catch (error) {
			nlapiLogExecution('Error', 'Catch Block', error.toString());
		}
	
	nlapiLogExecution('DEBUG', stLoggerTitle, '>> Exit Log <<');
}

/**
 * A main suitelet that will display Current Roles page
 * @param request
 * @param response
 */

function suitelet_currentRoles(request, response) {
	
	try {
			var custpage_recid = request.getParameter('custpage_recid');
			nlapiLogExecution('DEBUG', 'URR rec Id', custpage_recid);
			
			var custpage_rectype = request.getParameter('custpage_rectype');
			nlapiLogExecution('DEBUG', 'URR rec Type', custpage_rectype);
			
			var cust_stage = request.getParameter('cust_stage');
			nlapiLogExecution('DEBUG', 'Stage', cust_stage);
			
			var form = nlapiCreateForm('Current Roles', true);
			
			switch(cust_stage)
		    {
		    	case 'showPage':
		    		form =  updateCurrentRoles(request,response, form, custpage_recid, custpage_rectype); 
		    		nlapiLogExecution('DEBUG', 'Parameter', 'showPage');
		    		break;
		    	default:
		    		form = showCurrentRoles(request,response, form, custpage_recid, custpage_rectype);	 
		    }  
		}
		catch(error) {
			nlapiLogExecution('DEBUG', 'Error_suitelet_currentRoles', error.toString());
		}
}

/**
 * Display Current Role page
 * @param request
 * @param response
 * @param form
 * @param recId
 * @param recType 
 */

function showCurrentRoles(request, response, form, recId, recType) {
	
	var stLoggerTitle = 'suitelet_currentRoles';
	nlapiLogExecution('DEBUG', stLoggerTitle, '>> Entry Log suitlet<<');
	
	var rec = nlapiLoadRecord(recType, recId);
	var reqName = rec.getFieldText('custrecord_access_requester');
	nlapiLogExecution('DEBUG', 'Requester', reqName);
	
	var reqId = rec.getFieldValue('custrecord_access_requester');
	nlapiLogExecution('DEBUG', 'Requester IntId', reqId);
	
	var empRole = new Array(1029,1030,1038,1039);
	//define filter
	var searchFilter = new Array();
	searchFilter[0] = new nlobjSearchFilter('internalid', null, 'anyof', reqId);
	searchFilter[1] = new nlobjSearchFilter('role', null, 'noneof', empRole);			//Filter is to remove Employee Centre roles from the list of current roles.
	
	//define return column
	var result = new Array();
	result[0] = new nlobjSearchColumn('role');
	
	//Run saved search
	var search = nlapiSearchRecord('employee', null, searchFilter, result);
	
	form = nlapiCreateForm('Current Roles', true);
	
	var cust_stage = form.addField('cust_stage', 'text', 'Stage');
	cust_stage.setDefaultValue('showPage');
	cust_stage.setDisplayType('hidden');
	
	var custpage_recid = form.addField('custpage_recid', 'text', 'recId');
	custpage_recid.setDefaultValue(recId);
	custpage_recid.setDisplayType('hidden');
	
	var custpage_rectype = form.addField('custpage_rectype', 'text', 'recType');
	custpage_rectype.setDefaultValue(recType);
	custpage_rectype.setDisplayType('hidden');
	
	//Primary Details Block
	var primaryGroup = form.addFieldGroup('primarygrp', 'Primary Details');
	
	var name = form.addField('req_name', 'text', 'Requester', null, 'primarygrp');
	name.setDefaultValue(reqName);
	name.setDisplayType('inline');

	primaryGroup.setShowBorder(true);
	
	// Message Block
	var messageGroup = form.addFieldGroup('message', 'Note');
	var message = form.addField('msg', 'inlinehtml', '', null, 'message');
	message.setDefaultValue('<br><b>Currently below listed roles are assigned to you.<br><br> Please choose roles you want to continue with, all other roles will be revoked by Admin team.</b><br><br><b> P.S. List of the roles below does not include Employee Centre roles.</b>');
	messageGroup.setShowBorder(true);

	//Adding Current roles
	var roleGroup = form.addFieldGroup('currentroles', 'Current Roles');
	
	var i=0;		//For getting role count
	for (row in search) {
		var roleName = search[row].getText('role');
		nlapiLogExecution('DEBUG', 'Role Name', roleName.toString());
		form.addField('custpage_role'+i, 'checkbox', roleName, null, 'currentroles');
		form.addField('custpage_rolename'+i, 'text', 'Role'+i, null, 'currentroles').setDisplayType('hidden').setDefaultValue(roleName);
		i++;
	}
	form.addField('custpage_rolecount', 'integer', 'Role count').setDisplayType('hidden').setDefaultValue(i-1);
	nlapiLogExecution('DEBUG', 'Role count',i-1);
	
	if(i-1 == 0) { form.addField('custpage_newuser', 'inlinehtml', 'newuser', null, 'currentroles').setDefaultValue('<b>New user - No roles to display</b>'); }
	
	roleGroup.setShowBorder(true);
	
	form.addSubmitButton('Save'); //This will add submit button
	response.writePage(form);
	
	nlapiLogExecution('DEBUG', stLoggerTitle, '>> Exit Log suitelet <<');
}


/**
 * If the user clicks Save, the page will be redirected back to user role request page with the selected/unselected user roles.
 * @param request
 * @param response
 * @param form
 * @param tranId
 * @param tranType
 */

function updateCurrentRoles(request,response, form, tranId, tranType) {
	
	var check='';
	var uncheck='';
	
	var custpage_rolecount = request.getParameter('custpage_rolecount');
	nlapiLogExecution('DEBUG', 'Role count', custpage_rolecount);

		
	for(var count=0; count<=custpage_rolecount; count++) {
		
		var custpage_role_value = request.getParameter('custpage_role'+count);			// Checked/Unchecked
		var custpage_rolename = request.getParameter('custpage_rolename'+count);		// Role name
		nlapiLogExecution('DEBUG', 'Role Details', 'Role name= '+custpage_rolename+' Value= '+custpage_role_value);
		
		if (custpage_role_value == 'T') {
			if(check != '' )check = check + ', '+custpage_rolename; else check = check +custpage_rolename;
		} else {
			if(uncheck != '' )uncheck = uncheck + ', '+ custpage_rolename; else uncheck = uncheck + custpage_rolename;
		}
			
	}
	
	if (check == '' && uncheck == '') {
		nlapiSubmitField(tranType, tranId, ['custrecord_cur_roles_selected', 'custrecord_cur_roles_to_revoke'], ['New User', 'New User']);
	}else {
		nlapiSubmitField(tranType, tranId, ['custrecord_cur_roles_selected', 'custrecord_cur_roles_to_revoke'], [check, uncheck]);
	}
	
	nlapiLogExecution('DEBUG', 'check/uncheck Role', 'Selected Roles = '+check+' Unselected Roles = '+uncheck);
	
	nlapiLogExecution('DEBUG', 'updateCurrentRoles', 'Successfully updated record.');
	
	nlapiSetRedirectURL('RECORD', tranType, tranId);

}


