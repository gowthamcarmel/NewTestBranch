/**
 * Module Description
 * 
 * Version Date Author Remarks 1.02 180427 plincoln updated to not use global
 * variables
 */
/*
 * 
 * /** Used for debugging and to determine if a scheduled script should be
 * called
 * 
 * @param label {String} reference for event from which method was called
 * 
 * @returns {Int} API Governance Units Remaining
 */
function getRemainingUnits(label)
{
    var startTime = new Date().getTime();
    nlapiLogExecution("AUDIT", "getRemainingUnits START", startTime);
    try
    {
        var useString = label || "";
        var remaining_units = nlapiGetContext().getRemainingUsage();
        nlapiLogExecution("DEBUG", "remaining_units - " + label, remaining_units);
    }
    catch (e)
    {
        nlapiLogExecution("ERROR", "getRemainingUnits  ERR", JSON.stringify(e));
    }
    finally
    {
        var endTime = new Date().getTime();
        var duration = endTime - startTime;
        nlapiLogExecution("AUDIT", "getRemainingUnits END", "Execution Time (ms):" + duration.toString());
    }
    return remaining_units;
}

function makeBedrockRequest(xfullOrder, IsAuditable, isRetry, retryMessageLodId)
{
    //TODO PL 180912 refactor to have one return at the end of method
    var startTime = new Date().getTime();
    nlapiLogExecution("AUDIT", "makeBedrockRequest START", startTime);
    try
    {
        var retObj;
        var stringifyFullOrder = "";
        var fullOrder = null;
        if (isRetry === false)
        {
            stringifyFullOrder = JSON.stringify(xfullOrder);
            fullOrder = xfullOrder;
        }
        else
        {
            stringifyFullOrder = xfullOrder;
            fullOrder = JSON.parse(xfullOrder);
        }
        nlapiLogExecution("DEBUG", "makeBedrockRequest.stringifyFullOrder", stringifyFullOrder);

        var configRecord = GetFirstConfigRec();
        nlapiLogExecution('DEBUG', 'got record', JSON.stringify(configRecord));
        var custrecord_sovos_url = configRecord
            .getFieldValue("custrecord_sovos_url");
        var custrecord_sovos_user = configRecord
            .getFieldValue("custrecord_sovos_user");
        var custrecord_sovos_entity = configRecord
            .getFieldValue("custrecord_sovos_entity");
        var custrecord_sovos_password_encrypted = configRecord
            .getFieldValue("custrecord_sovos_encrypted_pass");
        var custrecord_sovos_password_decrypted = nlapiDecrypt(
            custrecord_sovos_password_encrypted, 'aes',
            'cb96141bb1b427b19f56694885a3788c');

        var url = custrecord_sovos_url + "core_adapter/api/netsuite/calculate";
        var creds = [custrecord_sovos_user, custrecord_sovos_password_decrypted];
        var headers = {
            "Accept": "application/json",
            "Content-Type": "application/json"
        };

        var reqBody = {
            userName: custrecord_sovos_user,
            password: custrecord_sovos_password_decrypted,
            entityName: custrecord_sovos_entity,
            //MS 20180824
            //entityName: fullOrder.entityId,
            requestBody: stringifyFullOrder
        };

        var fullOrder_string = JSON.stringify(reqBody);

        //MS 20180521 Log request
        var varRequestLogId;
        var varMessageType = 1;
        var varRequest = fullOrder_string;
        var varTWEDocNum = fullOrder.transactionDocNumber;
        var varTWEID = fullOrder.transactionId;
        var varTransactionType = fullOrder.transactionRecordType;
        var varIsError = 'T';
        var varIsCommited = 'F';
        var varIsaudible;
        if (IsAuditable === true)
        {
            varIsaudible = 'T';
        }
        else
        {
            varIsaudible = 'F';
        }
        if (isRetry === false)
        {
            varRequestLogId = GravMessageLog_Request(varMessageType, varRequest, varTWEDocNum, varTWEID, varIsError, varIsaudible, varIsCommited, stringifyFullOrder, varTransactionType);
        }
        else
        {
            varRequestLogId = retryMessageLodId;
        }
        nlapiLogExecution("DEBUG", "fullOrder_string", fullOrder_string);
        nlapiLogExecution("DEBUG", "varTransactionType", varTransactionType);
        nlapiLogExecution("DEBUG", "varTWEDocNum", varTWEDocNum);
        nlapiLogExecution("DEBUG", "varRequestLogId", varRequestLogId);
        var response = nlapiRequestURLWithCredentials(creds, url, fullOrder_string,
            headers);


        var resp_code = response.getCode();
        var resp_first_char = resp_code.toString().charAt(0);
        var resp_body = response.getBody();
        var resp_status = resp_body.toString().substr(2, 7);

        nlapiLogExecution("DEBUG", "makeBedrockRequest.resp_body", resp_body);
        nlapiLogExecution("DEBUG", "resp_first_char", resp_first_char);
        nlapiLogExecution("DEBUG", "response.resp_status", resp_status);

        if (resp_first_char === "2" && resp_status === "summary")
        {
            nlapiLogExecution("DEBUG", "valid resp");
            varIsError = 'F';

            nlapiLogExecution("DEBUG", "makeBedrockRequest.resp_body", resp_body);
        } else
        {
            nlapiLogExecution("DEBUG", "err");
            var user = nlapiGetUser();
            if (isRetry === false)
            {
                nlapiLogExecution("DEBUG", "user to email", user);
                var email_body = 'Bedrock returned "Status: '
                    + resp_code
                    + '" for transaction:'
                    + nlapiGetFieldValue("tranid")
                    + ".  Please contact your system administrator for further details.";
                var records = new Object();
                records['transaction'] = fullOrder.transactionDocNumber;
                try
                {
                    nlapiSendEmail(user, user, "Netsuite Bedrock API Error",
                        email_body, null, null, records);

                } catch (e)
                {
                    nlapiLogExecution("ERROR", "makeBedrockRequest email err", JSON.stringify(e));
                }
            }
        }
        //nlapiLogExecution("DEBUG", "MA-Before REQUEST GravMessageLog_Response.");
        //MS 20180521 Log response   
        GravMessageLog_Response(varRequestLogId, resp_body, resp_code, varIsError);
        //nlapiLogExecution("DEBUG", "MA-After REQUEST GravMessageLog_Response.");

        if (isRetry === false)
        {
            retObj= resp_body;
        }
        else
        {
            var responseObj = {};
            responseObj.resp_body = resp_body;
            responseObj.resp_code = resp_code;
            retObj= responseObj;
        }

    }
    catch (e)
    {
        nlapiLogExecution("ERROR", "makeBedrockRequest  ERR", JSON.stringify(e));
    }
    finally
    {
        var endTime = new Date().getTime();
        var duration = endTime - startTime;
        nlapiLogExecution("AUDIT", "makeBedrockRequest END", "Execution Time (ms):" + duration.toString());
        return retObj;
    }
}

/*
 * Makes call to /commit bedrock end-point to finalize any transactions in queue
 */
function makeBedrockCommit(isRetry)
{
    var startTime = new Date().getTime();
    nlapiLogExecution("AUDIT", "makeBedrockCommit START", startTime);
    try
    {

        var accountInfo = nlapiLoadConfiguration('companyinformation');
        var context = nlapiGetContext();
        var today = new Date();

        //MS 20180521 Log request
        var varMessageType = 3;
        var varRequest = "";
        var varTWEDocNum = "";
        var varTWEID = "";
        var varIsError = 'T';
        var varIsCommited = 'F';
        var varIsaudible = 'F';
        var varRequestLogId = GravMessageLog_Request(varMessageType, varRequest, varTWEDocNum, varTWEID, varIsError, varIsaudible, varIsCommited, JSON.stringify(request_commit), "");
        nlapiLogExecution("DEBUG", "makeBedrockCommit.varRequestLogId", varRequestLogId);

        var request_commit = {
            "accountId": accountInfo.getFieldValue('companyid'),
            "auditId": varRequestLogId,
            "emailRecipient": "plincoln@gravoc.com;msmith@gravoc.com;",
            "requestedBy": context.getName(),
            "isEmail": true,
            "startDate": {
                "day": 1,
                "month": 1,
                "year": today.getFullYear()
            },
            "endDate": {
                "day": today.getDate(),
                "month": today.getMonth() + 1, //getmonth is 0index
                "year": today.getFullYear()
            }
        };


        nlapiLogExecution("DEBUG", "makeBedrockCommit.request_commit", JSON.stringify(request_commit));

        var configRecord = GetFirstConfigRec();
        var custrecord_sovos_url = configRecord
            .getFieldValue("custrecord_sovos_url");
        var custrecord_sovos_entity = configRecord
            .getFieldValue("custrecord_sovos_entity");
        var custrecord_sovos_user = configRecord
            .getFieldValue("custrecord_sovos_user");
        var custrecord_sovos_password_encrypted = configRecord
            .getFieldValue("custrecord_sovos_encrypted_pass");
        var custrecord_sovos_password_decrypted = nlapiDecrypt(
            custrecord_sovos_password_encrypted, 'aes',
            'cb96141bb1b427b19f56694885a3788c');

        var url = custrecord_sovos_url + "core_adapter/api/netsuite/commit";
        var creds = [custrecord_sovos_user, custrecord_sovos_password_decrypted];
        var headers = {
            "Accept": "application/json",
            "Content-Type": "application/json"
        };

        var reqBody = {
            userName: custrecord_sovos_user,
            password: custrecord_sovos_password_decrypted,
            entityName: custrecord_sovos_entity,
            requestBody: JSON.stringify(request_commit)
        };

        var request_commit_string = JSON.stringify(reqBody);

        //MS 20180612 update messagelog
        var record = nlapiLoadRecord("customrecord_gravmessagelog", varRequestLogId);
        record.setFieldValue('custrecord_requeststring', request_commit_string);
        nlapiSubmitRecord(record, true);

        var response = nlapiRequestURLWithCredentials(creds, url, request_commit_string, headers);
        nlapiLogExecution("DEBUG", "makeBedrockCommit.response", response);

        var resp_code = response.getCode();
        var resp_first_char = resp_code.toString().charAt(0);
        var resp_body = response.getBody();
        var resp_status = resp_body.toString().substr(2, 14);

        nlapiLogExecution("DEBUG", "makeBedrockCommit.resp_body", resp_body);
        nlapiLogExecution("DEBUG", "makeBedrockCommit.resp_first_char", resp_first_char);
        nlapiLogExecution("DEBUG", "makeBedrockCommit.response.resp_status", resp_status);

        if (resp_first_char === "2" && resp_status === "commitRequests")
        {
            varIsError = 'F';
        }
        //nlapiLogExecution("DEBUG", "MA-Before COMMIT GravMessageLog_Response.");
        //MS 20180521 Log response   
        GravMessageLog_Response(varRequestLogId, resp_body, resp_code, varIsError);
        //nlapiLogExecution("DEBUG", "MA-After COMMIT GravMessageLog_Response.");

    }
    catch (e)
    {
        nlapiLogExecution("ERROR", "makeBedrockCommit  ERR", JSON.stringify(e));
    }
    finally
    {
        var endTime = new Date().getTime();
        var duration = endTime - startTime;
        nlapiLogExecution("AUDIT", "makeBedrockCommit END", "Execution Time (ms):" + duration.toString());
    }
    return resp_body;

}
/**
 * Pulls all necessary fields from the transaction record to compile request
 * body and make request, then kicks off next scheduled script to parse bedrock
 * response
 * 
 * @param type
 *            Create, Edit, Copy etc.
 */

function doNetsuiteSovosAdaptation(isAuditable)
{
    var startTime = new Date().getTime();
    nlapiLogExecution("AUDIT", "doNetsuiteSovosAdaptation START", startTime);
    try
    {

        var rt = nlapiGetRecordType();
        var rId = nlapiGetRecordId();
        var transaction = nlapiLoadRecord(rt, rId);

        try
        {
            var fullOrder = buildFullOrder();
            nlapiLogExecution("DEBUG", rt + "doNetsuiteSovosAdaptation.fullOrder", fullOrder);
        } catch (e)
        {
            nlapiLogExecution("ERROR", rt + " doNetsuiteSovosAdaptation buildFullOrder ERR", JSON.stringify(e));
        }
        //Custom
        try
        {
            getRemainingUnits("MAKE REQUEST - START");
            var resp_body = makeBedrockRequest(fullOrder, isAuditable, false, 0);
            getRemainingUnits("MAKE REQUEST - END");
        } catch (e)
        {
            nlapiLogExecution("ERROR", rt + " doNetsuiteSovosAdaptation - response ERR", JSON.stringify(e));
        }
        // Custom
        try
        {
            getRemainingUnits("CALC LINES - START");
            var lineTaxPercents = calculateLineTaxPercent(resp_body, rt, rId);
            nlapiLogExecution("DEBUG", rt + " lineTaxPercents", JSON
                .stringify(lineTaxPercents));
            getRemainingUnits("CALC LINES - END");
        } catch (e)
        {
            nlapiLogExecution("ERROR", rt + " tax percent ERR", e);
        }
        //Custom
        try
        {
            getRemainingUnits("ASSIGN LINES - START");
            assignLineTaxPercent(lineTaxPercents, rt, rId);
            getRemainingUnits("ASSIGN LINES - END");
        } catch (e)
        {
            nlapiLogExecution("ERROR", rt + " ASSIGN LINES ERR", e);
        }
        // MS20180611 Dont commit after a save.  Only commit after retry
        /*   
            if (determinePreviewPosting(rt).isPosting) {
                makeBedrockCommit(false);
            }
        
        */
        getRemainingUnits("FINISHED");
    }
    catch (e)
    {
        nlapiLogExecution("ERROR", "doNetsuiteSovosAdaptation  ERR", JSON.stringify(e));
    }
    finally
    {
        var endTime = new Date().getTime();
        var duration = endTime - startTime;
        nlapiLogExecution("AUDIT", "doNetsuiteSovosAdaptation END", "Execution Time (ms):" + duration.toString());
    }
}


// PL 180524 refactored for case where subId is not found
function checkIsTWEEnabled(tranid, trantype)
{
    var startTime = new Date().getTime();
    nlapiLogExecution("AUDIT", "checkIsTWEEnabled START", startTime);
    try
    {
        //MS 20180605 use transaction.getFieldValue
        var isTWEEnabled = 'T';
        var transaction = nlapiLoadRecord(trantype, tranid);

        var subsid_id = transaction.getFieldValue('subsidiary');
        nlapiLogExecution('DEBUG', 'checkIsTWEEnabled.subsid_id', subsid_id);

        if (!(subsid_id === '' || subsid_id === null))
        {
            var subsid = nlapiLoadRecord('subsidiary', subsid_id);
            isTWEEnabled = subsid.getFieldValue('custrecord_istweenabled');
            nlapiLogExecution('DEBUG', 'checkIsTWEEnabled.isTWEEnabled', isTWEEnabled);
        }

    }
    catch (e)
    {
        nlapiLogExecution("ERROR", "checkIsTWEEnabled  ERR", JSON.stringify(e));
    }
    finally
    {
        var endTime = new Date().getTime();
        var duration = endTime - startTime;
        nlapiLogExecution("AUDIT", "checkIsTWEEnabled END", "Execution Time (ms):" + duration.toString());
    }
    return isTWEEnabled;
}

function GetFirstConfigRec()
{
    var startTime = new Date().getTime();
    nlapiLogExecution("AUDIT", "GetFirstConfigRec START", startTime);
    try
    {
        var searchresults = nlapiSearchRecord('customrecord_sovos_configuration',
            null, null, null);
        for (var i = 0; searchresults !== null && i < searchresults.length; i++)
        {
            // get result values
            var searchresult = searchresults[i];
            var record = searchresult.getId();
            break;
        }
        var configRecord = nlapiLoadRecord('customrecord_sovos_configuration',
            record);
    }
    catch (e)
    {
        nlapiLogExecution("ERROR", "GetFirstConfigRec  ERR", JSON.stringify(e));
    }
    finally
    {
        var endTime = new Date().getTime();
        var duration = endTime - startTime;
        nlapiLogExecution("AUDIT", "GetFirstConfigRec END", "Execution Time (ms):" + duration.toString());
    }
    return configRecord;
}

/*
  * Used to check ensure that TWE switches are turned on.  Master switch in configfile.  
  * Subsidiary switch
  * 
  */
function preRunCheck(isServerSideCode)
{
    var startTime = new Date().getTime();
    nlapiLogExecution("AUDIT", "preRunCheck START", startTime);
    try
    {

        var retObj = true;
        // if server side then assume that we can pull records
        if (isServerSideCode)
        {
            // check for master switch
            var configRecord = GetFirstConfigRec();
            nlapiLogExecution('DEBUG', 'preRunCheck A ', new Date().getTime());
            if (configRecord === null)
            {
                throw "No customrecord_sovos_configuration index 1 found!";
            }
            else
            {
                var masterSwitch = configRecord.getFieldValue('custrecord_sovos_isenabled');
                nlapiLogExecution('DEBUG', 'preRunCheck.masterSwitch ', masterSwitch);
                if (masterSwitch === 'F')
                {
                    nlapiLogExecution('DEBUG', 'preRunCheck ', 'Config switch is turned off');
                    return false;
                    // master switch is turned off
                }
                else nlapiLogExecution('DEBUG', 'preRunCheck ', 'Config switch is turned on');
            }
            // check for subsidary switch
            var subsid = nlapiGetFieldValue('subsidiary');
            nlapiLogExecution('DEBUG', 'preRunCheck.subsid ', subsid);
            // avoid case where the subsidary is nothing
            if (subsid !== '' && subsid !== null)
            {
                var subsidiary = nlapiLoadRecord('subsidiary', subsid);
                nlapiLogExecution('DEBUG', 'preRunCheck C ', new Date().getTime());
                if (subsidiary === null)
                {
                    throw "No subsidiary index [" + subsid + "] found!";
                }
                else
                {
                    // PL 180710  fixed typo custrecord_tweenabled =>custrecord_IStweenabled
                    // PL 180905 version conflict with finastra changed back to custrecord_tweenabled for CFA
                    var isTweSubEnabled = subsidiary.getFieldValue('custrecord_tweenabled');
                    nlapiLogExecution('DEBUG', 'preRunCheck.isTweSubEnabled', isTweSubEnabled);
                    if (isTweSubEnabled === 'F' || isTweSubEnabled === null || isTweSubEnabled === '')
                    {
                        nlapiLogExecution('DEBUG', 'preRunCheck ', 'subsidary switch is turned off');
                        return false;
                        // Subsidiary field is turned off
                    }
                    else
                    {

                        nlapiLogExecution('DEBUG', 'preRunCheck ', 'subsidary switch is turned on');
                    }

                }
            }
            else
            {
                nlapiLogExecution('DEBUG', 'preRunCheck D ', "No Subsidary Id Found");
                return false;
            }

        }
        else
        {
            // use SuiteLet to check records
            nlapiLogExecution('DEBUG', 'preRunCheck F', "TODO:  Client side code required");
        }
    }
    catch (e)
    {
        nlapiLogExecution("ERROR", "preRunCheck  ERR", JSON.stringify(e));
    }
    finally
    {
        var endTime = new Date().getTime();
        var duration = endTime - startTime;
        nlapiLogExecution("AUDIT", "preRunCheck END", "Execution Time (ms):" + duration.toString());
    }
    // return true
    return retObj;

}
/*MS 20180521 Message Log Request
varMessageType - 1 CalcTax, 2 Abort, 3 Commit
varRequest - request string (fullOrderString)
varTWEDocNum – text  - Sales Order 
varTWEID - record - Sales Order
varIsError - bool
varIsAuditable - bool
varIsCommited - bool
*/
function GravMessageLog_Request(varMessageType, varRequest, varTWEDocNum, varTWEID, varIsError, varIsAuditable, varIsCommited, fullOrder, varTransactionType)
{
    var startTime = new Date().getTime();
    nlapiLogExecution("AUDIT", "GravMessageLog_Request START", startTime);
    try
    {

        var record = nlapiCreateRecord('customrecord_gravmessagelog');
        record.setFieldValue('custrecord_messagetype', varMessageType);
        record.setFieldValue('custrecord_requeststring', varRequest);
        record.setFieldValue('custrecord_twedocnum', varTWEDocNum);
        if (varTWEID !== 0)
        { record.setFieldValue('custrecord_tweid', varTWEID); }
        record.setFieldValue('custrecord_so_internalid', varTWEID);
        record.setFieldValue('custrecord_iserror', varIsError);
        record.setFieldValue('custrecord_isauditable', varIsAuditable);
        record.setFieldValue('custrecord_iscommited', varIsCommited);
        record.setFieldValue('custrecord_fullorder', fullOrder);
        record.setFieldValue('custrecord_transactiontype', varTransactionType);
        record.setFieldValue('custrecord_retrycount', 0);

        id = nlapiSubmitRecord(record, true);
    }
    catch (e)
    {
        nlapiLogExecution("ERROR", "GravMessageLog_Request  ERR", JSON.stringify(e));
    }
    finally
    {
        var endTime = new Date().getTime();
        var duration = endTime - startTime;
        nlapiLogExecution("AUDIT", "GravMessageLog_Request END", "Execution Time (ms):" + duration.toString());
    }
    return id;
}

/*MS 20180521 Message Log Response
varMesageLogId - int - internal id
varResponse - Resp_Body
varResponseCode - int (ex: 200, 400)
varIsError - T or F
*/
function GravMessageLog_Response(varMesageLogId, varResponse, varResponseCode, varIsError)
{
    var startTime = new Date().getTime();
    nlapiLogExecution("AUDIT", "GravMessageLog_Response START", startTime);
    try
    {
        var record = nlapiLoadRecord('customrecord_gravmessagelog', varMesageLogId);
        record.setFieldValue('custrecord_responsestring', varResponse);
        record.setFieldValue('custrecord_responsecode', varResponseCode);
        record.setFieldValue('custrecord_iserror', varIsError);
        id = nlapiSubmitRecord(record, true);
    }
    catch (e)
    {
        nlapiLogExecution("ERROR", "GravMessageLog_Response  ERR", JSON.stringify(e));
    }
    finally
    {
        var endTime = new Date().getTime();
        var duration = endTime - startTime;
        nlapiLogExecution("AUDIT", "GravMessageLog_Response END", "Execution Time (ms):" + duration.toString());
    }
    return id;
}

function getRemainingUnits(label, rId)
{
    var startTime = new Date().getTime();
    nlapiLogExecution("AUDIT", "getRemainingUnits2 START", startTime);
    try
    {

        var useString = label || "";
        var remaining_units = nlapiGetContext().getRemainingUsage();
        nlapiLogExecution("DEBUG", "Remaining Units (" + rId + ") " + label, remaining_units);
    }
    catch (e)
    {
        nlapiLogExecution("ERROR", "getRemainingUnits2  ERR", JSON.stringify(e));
    }
    finally
    {
        var endTime = new Date().getTime();
        var duration = endTime - startTime;
        nlapiLogExecution("AUDIT", "getRemainingUnits2 END", "Execution Time (ms):" + duration.toString());
    }
    return remaining_units;
}

function AddressInfo(src)
{
    var startTime = new Date().getTime();
    nlapiLogExecution("AUDIT", "getRemainingUnits START", startTime);
    try
    {
        // check for null values
        if (src !== null)
        {
            nlapiLogExecution('DEBUG', 'AddressInfo', JSON.stringify(src));
            this.streetNameNumber = src.getFieldValue("addr1");
            this.city = src.getFieldValue('city');
            this.state = src.getFieldValue('state');
            this.zipCode = src.getFieldValue('zip');
            this.country = src.getFieldText('country');
        }
    }
    catch (e)
    {
        nlapiLogExecution("ERROR", "AddressInfo  ERR", JSON.stringify(e));
    }
    finally
    {
        var endTime = new Date().getTime();
        var duration = endTime - startTime;
        nlapiLogExecution("AUDIT", "AddressInfo END", "Execution Time (ms):" + duration.toString());
    }
}

/*MS 20180601 
parameter transaction address sybrecord
return bool
*/
function ValidateAddress(src)
{
    var startTime = new Date().getTime();
    nlapiLogExecution("AUDIT", "ValidateAddress START", startTime);
    try
    {
        var retObj = true;
        if (src === null)
        {
            retObj = false;
        }
        else
        {
            if (src.getFieldValue('state') && src.getFieldValue('zip') && src.getFieldValue('country'))
            {
                retObj = true;
            }
            else
            { retObj = false; }

        }

    }
    catch (e)
    {
        nlapiLogExecution("ERROR", "ValidateAddress  ERR", JSON.stringify(e));
    }
    finally
    {
        var endTime = new Date().getTime();
        var duration = endTime - startTime;
        nlapiLogExecution("AUDIT", "ValidateAddress END", "Execution Time (ms):" + duration.toString());
    }
    return retObj;
}

function buildAbort()
{
    var startTime = new Date().getTime();
    nlapiLogExecution("AUDIT", "buildAbort START", startTime);
    try
    {
        var rt = nlapiGetRecordType();
        var rId = nlapiGetRecordId();
        var transaction = nlapiLoadRecord(rt, rId);

        try
        {

            var abortString = {};
            abortString.transactionDocNumber = transaction.getFieldValue("tranid");
            abortString.transactionId = rId;
            abortString.transactionRecordType = rt;


        } catch (e)
        {
            nlapiLogExecution("ERROR", rt + "buildAbort abortString ERR", JSON.stringify(e));
        }
    }
    catch (e)
    {
        nlapiLogExecution("ERROR", "buildAbort  ERR", JSON.stringify(e));
    }
    finally
    {
        var endTime = new Date().getTime();
        var duration = endTime - startTime;
        nlapiLogExecution("AUDIT", "buildAbort END", "Execution Time (ms):" + duration.toString());
    }
    return abortString;
}

function makeBedrockAbort(xabortString, isRetry, retryMessageLodId)
{
    var startTime = new Date().getTime();
    nlapiLogExecution("AUDIT", "makeBedrockAbort START", startTime);
    try
    {
        var stringifyAbortString = null;
        var abortString = null;
        if (isRetry === false)
        {
            stringifyAbortString = JSON.stringify(xabortString);
            abortString = xabortString;
        }
        else
        {
            stringifyAbortString = xabortString;
            abortString = JSON.parse(xabortString);
        }
        nlapiLogExecution("DEBUG", "makeBedrockAbort.stringifyAbortString", stringifyAbortString);
        var resp_body;
        var configRecord = GetFirstConfigRec();
        nlapiLogExecution('DEBUG', 'got record', JSON.stringify(configRecord));
        var custrecord_sovos_url = configRecord.getFieldValue("custrecord_sovos_url");
        var custrecord_sovos_user = configRecord.getFieldValue("custrecord_sovos_user");
        var custrecord_sovos_entity = configRecord.getFieldValue("custrecord_sovos_entity");
        var custrecord_sovos_password_encrypted = configRecord.getFieldValue("custrecord_sovos_encrypted_pass");
        var custrecord_sovos_password_decrypted = nlapiDecrypt(custrecord_sovos_password_encrypted, 'aes', 'cb96141bb1b427b19f56694885a3788c');

        var url = custrecord_sovos_url + "core_adapter/api/netsuite/abort";
        var creds = [custrecord_sovos_user, custrecord_sovos_password_decrypted];
        var headers = {
            "Accept": "application/json",
            "Content-Type": "application/json"
        };

        var reqBody = {
            userName: custrecord_sovos_user,
            entityName: custrecord_sovos_entity,
            password: custrecord_sovos_password_decrypted,
            requestBody: stringifyAbortString
        };

        var abort_string = JSON.stringify(reqBody);

        //Log request
        var varRequestLogId;
        var varMessageType = 2;
        var varRequest = abort_string;
        var varTWEDocNum = abortString.transactionDocNumber;
        var varTWEID = abortString.transactionId;
        var varTransactionType = abortString.transactionRecordType;
        var varIsError = 'T';
        var varIsCommited = 'F';
        var varIsaudible = 'T';
        if (isRetry === false)
        {
            varRequestLogId = GravMessageLog_Request(varMessageType, varRequest, varTWEDocNum, varTWEID, varIsError, varIsaudible, varIsCommited, stringifyAbortString, varTransactionType);

        }
        else
        {
            varRequestLogId = retryMessageLodId;
        }
        nlapiLogExecution("DEBUG", "varTransactionType", varTransactionType);
        nlapiLogExecution("DEBUG", "varTWEDocNum", varTWEDocNum);
        nlapiLogExecution("DEBUG", "varTWEID", varTWEID);
        nlapiLogExecution("DEBUG", "makeBedrockAbort.creds", creds);
        nlapiLogExecution("DEBUG", "makeBedrockAbort.url", url);
        nlapiLogExecution("DEBUG", "makeBedrockAbort.abort_string", abort_string);
        nlapiLogExecution("DEBUG", "makeBedrockAbort.headers", headers);
        nlapiLogExecution("DEBUG", "makeBedrockAbort.varRequestLogId", varRequestLogId);

        try
        {
            var response = nlapiRequestURLWithCredentials(creds, url, abort_string, headers);

        } catch (e)
        {
            nlapiLogExecution("ERROR", "makeBedrockAbort.nlapiRequestURLWithCredentials ERR", JSON.stringify(e));
        }

        nlapiLogExecution("DEBUG", "makeBedrockAbort.response", JSON.stringify(response));

        var resp_code = response.getCode();
        var resp_first_char = resp_code.toString().charAt(0);
        resp_body = response.getBody();
        var resp_status = resp_body.toString().substr(21, 20);

        nlapiLogExecution("DEBUG", "makeBedrockAbort.resp_body", resp_body);
        nlapiLogExecution("DEBUG", "makeBedrockAbort.resp_first_char", resp_first_char);
        nlapiLogExecution("DEBUG", "makeBedrockAbort.response.resp_status", resp_status);

        if (resp_first_char === "2" && resp_status === "Aborted Successfully")
        {
            nlapiLogExecution("DEBUG", "makeBedrockAbort - valid resp");
            varIsError = 'F';

        } else
        {
            nlapiLogExecution("DEBUG", "abort err");
            var user = nlapiGetUser();
            if (isRetry === false)
            {
                nlapiLogExecution("DEBUG", "user to email", user);
                var email_body = 'Bedrock Abort returned "Status: '
                    + resp_code
                    + '" for transaction:'
                    + nlapiGetFieldValue("tranid")
                    + ".  Please contact your system administrator for further details.";
                var records = new Object();
                records['transaction'] = abortString.transactionDocNumber;
                try
                {
                    nlapiSendEmail(user, user, "Netsuite Bedrock Abort API Error", email_body, null, null, records);
                } catch (e)
                {
                    nlapiLogExecution("ERROR", "makeBedrockAbort email err", JSON.stringify(e));
                }
            }
        }
        //MS 20180521 Log response   
        nlapiLogExecution("DEBUG", "MA-Before ABORT GravMessageLog_Response.");
        GravMessageLog_Response(varRequestLogId, resp_body, resp_code, varIsError);
        nlapiLogExecution("DEBUG", "MA-After ABORT GravMessageLog_Response.");

        var responseObj = {};
        responseObj.resp_body = resp_body;
        responseObj.resp_code = resp_code;

    }
    catch (e)
    {
        nlapiLogExecution("ERROR", "makeBedrockAbort  ERR", JSON.stringify(e));
    }
    finally
    {
        var endTime = new Date().getTime();
        var duration = endTime - startTime;
        nlapiLogExecution("AUDIT", "makeBedrockAbort END", "Execution Time (ms):" + duration.toString());
    }

    return responseObj;


}

function gravGetItemType(item_id)
{
    var startTime = new Date().getTime();
    nlapiLogExecution("AUDIT", "gravGetItemType START", startTime);
    try
    {
        var columns = new Array();
        columns[0] = new nlobjSearchColumn('internalid');

        var itemIdArray = [];
        itemIdArray.push(item_id);
        var filters = new Array();
        filters[0] = new nlobjSearchFilter('internalid', null, 'anyof', itemIdArray);

        nlapiLogExecution('DEBUG', 'gravGetItemType.itemIdArray', itemIdArray);

        // Get item record
        var recs = nlapiSearchRecord('item', null, filters, columns);
        nlapiLogExecution('DEBUG', 'gravGetItemType.recs', recs);
        nlapiLogExecution('DEBUG', 'gravGetItemType.recs.length', recs.length);

        var item_obj;
        var item_type;
        if (recs !== null)
        {
            for (var a = 0; a < recs.length; a++)
            {
                item_obj = nlapiLoadRecord(recs[a].recordType, item_id);
                item_type = recs[a].recordType;
                nlapiLogExecution('DEBUG', 'gravGetItemType.item_type in loop', item_type);
                nlapiLogExecution('DEBUG', 'gravGetItemType.item_id in loop', recs[a]);
            }
        }
        nlapiLogExecution('DEBUG', 'gravGetItemType.item_type', item_type);
    }
    catch (e)
    {
        nlapiLogExecution("ERROR", "gravGetItemType  ERR", JSON.stringify(e));
    }
    finally
    {
        var endTime = new Date().getTime();
        var duration = endTime - startTime;
        nlapiLogExecution("AUDIT", "gravGetItemType END", "Execution Time (ms):" + duration.toString());
    }
    return item_type;
}

