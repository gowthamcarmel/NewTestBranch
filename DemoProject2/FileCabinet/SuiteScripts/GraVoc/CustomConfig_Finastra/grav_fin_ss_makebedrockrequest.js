/**
 * Module Description
 * 
 * Version Date Author Remarks 1.00 20 Dec 2017 ahoang
 * 
 */



/**
 * Pulls all necessary fields from the transaction record to compile request
 * body and make request, then kicks off next scheduled script to parse bedrock
 * response
 */
function compileBedrockRequestBody()
{

    var context = nlapiGetContext();
    var iterator = parseInt(context.getSetting('SCRIPT', 'custscriptiterator'));
    var recordID = context.getSetting('SCRIPT', 'custscript_bedrock_recordid');
    var recordType = context.getSetting('SCRIPT', 'custscript_bedrock_recordtype');
    var user = context.getSetting('SCRIPT', 'custscript_bedrock_user');

    var transaction = nlapiLoadRecord(recordType, recordID);

    nlapiLogExecution("DEBUG", "compileBedrockRequestBody.recordType", recordType);
    nlapiLogExecution("DEBUG", "compileBedrockRequestBody.RECORDID", recordID);
    nlapiLogExecution("DEBUG", "compileBedrockRequestBody.user", user);

    nlapiLogExecution("DEBUG", "Start compileBedrockRequestBody");

    /*var incRecord = nlapiLoadRecord('customrecord_inctranid', 1);
  	var incVal = incRecord.getFieldValue('custrecord_incnum');
  	incRecord.setFieldValue('custrecord_incnum', ( parseInt(incVal) + 1));
	nlapiSubmitRecord(incRecord, true);
  	var checkInc = nlapiLoadRecord('customrecord_inctranid', 1);*/
    try
    {
        // Load subrecords for shipping and billing addresses
        var shippingaddress = transaction.viewSubrecord("shippingaddress");
        var billingaddress = transaction.viewSubrecord("billingaddress");
        var subsid_id = transaction.getFieldValue('subsidiary');
        var subsid = nlapiLoadRecord('subsidiary', subsid_id);
        var fromAddress = subsid.viewSubrecord('mainaddress');

    } catch (e)
    {
        nlapiLogExecution("DEBUG", recordID + " - get addresses ERR", e);
    }

    var previewPosting = determinePreviewPosting(recordType);
    var accountInfo = nlapiLoadConfiguration('companyinformation');
    var employerId = accountInfo.getFieldValue('employerid');
    var entity = transaction.getFieldValue("entity");
    var entityRecord = nlapiLoadRecord('customer', entity);
    var trandate = transaction.getFieldValue('trandate');
    var timeStamp = getTimestamp();
    var uniqueID = recordID + timeStamp;

    /*var inc = checkInc.getFieldValue('custrecord_incnum');*/


    getRemainingUnits("compile order - START");
    var fullOrder = buildFullOrderFin(recordType, recordID, user);
    getRemainingUnits("compile order - END");

    try
    {
        getRemainingUnits("MAKE REQUEST - START");
        if (recordType === "salesorder")
        {
            var isAuditable = false;
        }
        else
        {
            var isAuditable = true;
        }
        var isRetry = false;
        //PL 180718 Update flag status
        SetUsTaxStatus(3, recordID, recordType);//sent - pending response
        var resp_body = makeBedrockRequest(fullOrder, isAuditable, isRetry);
        getRemainingUnits("MAKE REQUEST - END");
        nlapiLogExecution("DEBUG", recordID + " - resp_body", resp_body);
        //PL 180718 validate response
        if (resp_body === "" || resp_body === null)
        {

            var email_subject1 = "GTD has return an empty response";
            
            var email_body1 = email_subject1 + "\n" +" Sovos Bedrock Server may be down.";

            nlapiLogExecution('DEBUG', "compileBedrockRequestBody.Email Sent: "+email_subject1, email_body1);
            SendTransactionEmail(user, recordID, recordType, email_subject1, email_body1);

            SetUsTaxStatus(5, recordID, recordType); //completed - failure
        }
        else
        {

            var resp_status = resp_body.toString().substr(2, 7);
            if (resp_status === "summary")
            {

                /*
                 * The bedrock response is passed to the next ScheduledScript as
                 * a parameter. The param is stored as a 'Long Text' type field,
                 * which has a maximum length of 100000 characters.
                 * If the Bedrock response is greater than the maximum length,
                 * deconstruct the response.
                 */

                var maxLength = 100000;
                var response;

                // If response length is greater than max, pass ID as param, else pass response directly
                if (resp_body.length > maxLength)
                {
                    var responseArr = [];
                    while (resp_body.length > maxLength)
                    {
                        responseArr.push(resp_body.substr(0, maxLength)); // break up resp_body if too long
                        resp_body = resp_body.substr(maxLength);
                    }
                    responseArr.push(resp_body);

                    for (var i = 0; i < responseArr.length; i++)
                    {
                        nlapiLogExecution('DEBUG', recordID + ' - creating new record');
                        var gravResponse = nlapiCreateRecord('customrecord_gravresponse');
                        gravResponse.setFieldValue('custrecord_responsekey', timeStamp);
                        gravResponse.setFieldValue('custrecord_responsebody', responseArr[i]);
                        nlapiSubmitRecord(gravResponse, true);
                    }
                    response = timeStamp;
                } else
                {
                    response = resp_body;
                }
                nlapiLogExecution("DEBUG", recordID + " - response id", response);

                var params = {
                    custscript_bedrock_resp_body: response,
                    custscript_bedrock_resp_recordid: recordID,
                    custscript_bedrock_resp_recordtype: recordType,
                    custscript_bedrock_resp_user: user
                };

                do
                {
                    var status = nlapiScheduleScript('customscript_gravhandlebedrockresponse', null, params);
                    nlapiLogExecution('DEBUG', recordID + ' - Status', status);
                    sleep(1);
                }
                while (status !== 'QUEUED');

                nlapiLogExecution('DEBUG', recordID + ' - Status', status);
            }
            else
            {
                var email_subject = 'Sovos - GTD  has return an error';
                var email_body = 'Sovos - GTD has return an error';

                email_body = email_subject + "\n" + "Service Response: " + "\n" + resp_body;
                
                
                SendTransactionEmail(user, recordID, recordType, "Netsuite - Bedrock response seems to have failed", email_body);
                nlapiLogExecution('DEBUG', "compileBedrockRequestBody.Email Sent: " + email_subject, email_body);
                SetUsTaxStatus(5, recordID, recordType); //completed - failure

            }

        }

    }
    catch (e)
    {
        SetUsTaxStatus(5, recordID, recordType); //completed - failure
        nlapiLogExecution("DEBUG", "compileBedrockRequestBody response ERR", JSON.stringify(e));
        var email_subject2 = 'Netsuite Error on make bedrock request. ';
        
        var email_body2 = email_subject2 + "\n\n"+JSON.stringify(e);

       
        SendTransactionEmail(user, recordID, recordType, email_subject2, email_body2);
        nlapiLogExecution('DEBUG', "compileBedrockRequestBody.Email Sent: " + email_subject2, email_body2);
        
    }
}
