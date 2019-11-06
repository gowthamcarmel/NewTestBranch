/**
 * Module Description
 * 
 * Version    Date            Author           Remarks
 * 1.00       14 May 2015     vabhpant
 *
 */

/**
 * The recordType (internal id) corresponds to the "Applied To" record in your script deployment. 
 * @appliedtorecord Folder
 * 
 * @returns {Void}
 */
function userEventBeforeSubmit(type){
 
	var title = 'RestrictFolderCreationAtRoot';
	var context = nlapiGetContext();
	nlapiLogExecution('DEBUG', title, '----START----');
	
	try {
		var userRole = context.getRole();
		
		var rec = nlapiGetNewRecord();
		var parent = rec.getFieldValue('parent');
		
		var isatroot = isAtRoot(parent);
		var details = 'You do not have permission to create folder at root level. Only Administrator are allowed to create root level folders.\n If required, please log a SD ticket using SD catelogue - http://servicedesk/Templates.do?SkipNV2Filter=true&SkipNV2Filter=true&module=mergedRequest';
		
		if(isatroot == true && userRole != '3') { //3 is internal id of Administrator role.
			throw nlapiCreateError('99999', details, true);
		}
		nlapiLogExecution('DEBUG', title, '----END----');
	}
	catch(error) {
    	if (error.getDetails != undefined) {
            nlapiLogExecution('ERROR','Process Error',  error.getCode() + ': ' + error.getDetails());
            throw error;
        }
        else {
            nlapiLogExecution('ERROR','Unexpected Error', error.toString()); 
            throw nlapiCreateError('99999', error.toString());
        }
        return false;
	}
	return true;
}

function isAtRoot(parent){
	if (parent == '' || parent == null) return true;
	return false;
}