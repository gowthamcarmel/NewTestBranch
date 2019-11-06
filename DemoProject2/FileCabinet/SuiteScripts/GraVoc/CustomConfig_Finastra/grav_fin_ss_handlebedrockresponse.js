/**
 * Module Description
 *
 * Version    Date            Author           Remarks
 * 1.00       20 Dec 2017     ahoang
 *
 */

var context = nlapiGetContext();
var recordID = context.getSetting('SCRIPT', 'custscript_bedrock_resp_recordid');
nlapiLogExecution("DEBUG", "RECORDID", recordID);
var recordType = context.getSetting('SCRIPT', 'custscript_bedrock_resp_recordtype');
var transaction = nlapiLoadRecord(recordType, recordID);
//var user = nlapiGetUser();
var paramBody = JSON.parse(context.getSetting('SCRIPT', 'custscript_bedrock_resp_body'));

var user = context.getSetting('SCRIPT', 'custscript_bedrock_resp_user');
nlapiLogExecution("DEBUG", "user", user);

nlapiLogExecution('DEBUG', recordID + ' - paramBody', JSON.stringify(paramBody));

var resp_body;
/* If parameter passed was a transaction id, get the responses for that transaction
 * else retrieve the response directly
 */
if (typeof paramBody === 'number') {
    resp_body = getResponseBody(paramBody);
} else {
    resp_body = paramBody;
}

/**
 * Searches for deconstructed bedrock responses for given transaction id
 * and returns complete response
 *
 * @param {string} key 		Unique Id of transaction (Record Id)
 * @returns {string} response body string
 */
function getResponseBody(key) {
    var response = '';
    var record;
    var filters = new Array();
    filters[0] = new nlobjSearchFilter('custrecord_responsekey', null, 'IS', key);

    var searchresults = nlapiSearchRecord('customrecord_gravresponse', null, filters, null);

    if (searchresults !== null) {
        for (var i = 0; i < searchresults.length; i++) {
            record = nlapiLoadRecord('customrecord_gravresponse', searchresults[i].getId());
            var respBody = record.getFieldValue('custrecord_responsebody');
            nlapiLogExecution('DEBUG', recordID + ' - respBody', respBody);
            response += record.getFieldValue('custrecord_responsebody') + '';
        }
    }
    nlapiLogExecution('DEBUG', recordID + ' - response', response.length);
    return JSON.parse(response);
}

/**
 * Used for debugging and to determine if a scheduled script should be called
 * 
 * @param {string} label {String} reference for event from which method was called
 *
 * @returns {number} API Governance Units Remaining
 */
function getRemainingUnits(label) {
    var useString = label || "";
    var remaining_units = context.getRemainingUsage();
    nlapiLogExecution("DEBUG", " getRemainingUnits " + label + " - " + remaining_units);
    return remaining_units;
}

/**
 * Called from the afterSubmit user event.  Makes calls to all other processing methods	
 */
function handleBedrockResponse() {

    var params = {
        custscript_bedrock_commit_recordid: recordID,
        custscript_bedrock_commit_recordtype: recordType,
        custscript_bedrock_user: user
    };

    getRemainingUnits("CALC LINES - START");

    var lineTaxPercents = calculateLineTaxPercent(resp_body, recordType, recordID);
    nlapiLogExecution("DEBUG", recordID + " lineTaxPercents", JSON.stringify(lineTaxPercents));
    getRemainingUnits("CALC LINES - END");

    getRemainingUnits("ASSIGN LINES - START");
    nlapiLogExecution("DEBUG", "handleBedrockResponse user:" + user);
    var taxStatus = assignLineTaxPercent(lineTaxPercents, recordType, recordID, user);
    getRemainingUnits("ASSIGN LINES - END");
    //PL 180718 Update flag status
    SetUsTaxStatus(taxStatus, recordID, recordType); 
    if (taxStatus === 4)  // completed - success
    {
        //HACK PL 180910   disabled commit
        nlapiLogExecution("DEBUG", 'COMMITING TO BEDROCK - Disabled', params);
        //nlapiScheduleScript('customscript_gravcommit', 'customdeploy_gravmakebedrockcommit', params);
    }
    else
    {
        nlapiLogExecution("DEBUG", 'WILL NOT COMMIT - ERROR ON HANDLE BEDROCKRESPONSE');
        var email_body = 'Netsuite - Handle Bedrock  seems to have failed, will not try to commit. ';
        email_body = email_body + ' Transtype: ' + recordType + ', internal id:' + recordID;

        nlapiLogExecution('DEBUG', 'Netsuite - Handle Bedrock  seems to have failed, will not try to commit', email_body);
        SendTransactionEmail(user, recordID, recordType, "Netsuite - Handle Bedrock  seems to have failed, will not try to commit", email_body);
    }
}