/**
 * Module Description
 * 
 * Version    Date            Author           Remarks
 * 1.00       19 Jul 2014     vpant
 *
 */

/**
 * Record Type : 'AAP : Role Grouping'
 * @parm custscript_urr_active_rec_list_to_cmp 
 */


function dup_detection(stActiveRecordURR) {
	
	var stLoggerTitle = 'client_dup_detection';
	
	nlapiLogExecution('DEBUG', stLoggerTitle, '>>Entry<<');
	
	try
    {    	
    	var context = nlapiGetContext();
    	var stActiveRecordURR = context.getSetting('SCRIPT', 'custscript_urr_active_rec_list_to_cmp');
    	nlapiLogExecution('DEBUG', stLoggerTitle, 'Script Parameter | Pending Approval User Role Request Search = ' + stActiveRecordURR);
	
    	var duplicate = null;
    	
		var name = nlapiGetFieldValue('name');
		nlapiLogExecution('DEBUG', 'Name', name);
		var recordId = nlapiGetRecordId();
		nlapiLogExecution('DEBUG', 'Record Id', recordId);
		var recordType = nlapiGetRecordType();
		nlapiLogExecution('DEBUG', 'Record Type', recordType);
	
		var filterExpression = new nlobjSearchFilter('name',null,'is',name);
	
		//check for the duplicate based on record type and parameter passed.
		if (recordType == 'customrecord_role_grouping') {
			duplicate = nlapiSearchRecord('customrecord_role_grouping',stActiveRecordURR, filterExpression, 1);
		}
		else if (recordType == 'customrecord_role_approval_matrix') {
			duplicate = nlapiSearchRecord('customrecord_role_approval_matrix',stActiveRecordURR, filterExpression, 1);
		}
	
		//Alert the user if any duplicate detected. 
		if(duplicate != null && duplicate[0].getId() != recordId ) {
			var searchRecord = duplicate[0].getId();
			alert('Duplicate Detected. "'+ name + '" is already in the list.');
			
			nlapiLogExecution('DEBUG', 'duplicate detected', searchRecord);
			nlapiLogExecution('DEBUG', stLoggerTitle, '>>Exit<<');
			return false;
		}
		else {
			nlapiLogExecution('DEBUG', 'Duplicate Detection failed', 'Not a duplicate record');
			nlapiLogExecution('DEBUG', stLoggerTitle, '>>Exit<<');
			return true;
		}
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