/**
 * Module Description
 * 
 * Version    Date            Author           Remarks
 * 1.00       22 May 2018     ahoang
 *
 */


/**
 * Creates a log entry for the transaction to prevent an infinite loop triggered by the
 * nlapiSubmitRecord event upon completion of all TWE logic.  
 * 
 * @param tranid
 * 		The NetSuite Transaction Id
 * 
 * @param trantype
 * 		The Netsuite Transaction Type Internal Id (Sales Order, Invoice, etc..)
 * 
 * @returns {Void}
 */

function userEventBeforeLoad(type, form)
{

}

function userEventAfterSubmit(type)
{
    var startTime = new Date().getTime();
    var lineCount = nlapiGetLineItemCount("item");
    var recordType = nlapiGetRecordType();
    var recordID = nlapiGetRecordId();
    var transaction = nlapiLoadRecord(recordType, recordID);
    var params = {
        custscript_bedrock_recordid: recordID,
        custscript_bedrock_recordtype: recordType,
        custscript_bedrock_user: nlapiGetUser()

    };
    nlapiLogExecution("DEBUG", "userEventAfterSubmit START", startTime);

    getRemainingUnits("userEventAfterSubmit START", recordID);

    //var isTWEEnabled = checkIsTWEEnabled(recordID, recordType);
    var isTWEEnabled = PreRunCheck_Fin(true);
    if (isTWEEnabled === true)
    {

        nlapiLogExecution("DEBUG", "userEventAfterSubmit", "TWE is Enabled");
        //var recordID = context.getSetting('SCRIPT', 'custscript_bedrock_resp_recordid');
        //var recordType = context.getSetting('SCRIPT', 'custscript_bedrock_resp_recordtype');

        //PL 1907018  added functionality for Guam
        var shipCountry = nlapiGetFieldValue("shipcountry");

        if (shipCountry === "US" || shipCountry === "GU" || shipCountry === "PR")
        {

            nlapiLogExecution('DEBUG', 'nlapiGetFieldValue("shipaddress") ', nlapiGetFieldValue("shipaddress"));

            var subsid_id = transaction.getFieldValue('subsidiary');
            var subsid = nlapiLoadRecord('subsidiary', subsid_id);
            var fromAddress = subsid.viewSubrecord('mainaddress');
            var shippingaddress = transaction.viewSubrecord("shippingaddress");

            var validFromAddress = ValidateAddress_Fin(fromAddress);
            nlapiLogExecution('DEBUG', 'MS - validFromAddress  complete?', validFromAddress);
            nlapiLogExecution('DEBUG', 'from country', fromAddress.getFieldValue('country'));
            nlapiLogExecution('DEBUG', 'from state', fromAddress.getFieldValue('state'));

            var validshippingaddress = ValidateAddress_Fin(shippingaddress);
            nlapiLogExecution('DEBUG', 'MS - validshippingaddress  complete?', validshippingaddress);
            nlapiLogExecution('DEBUG', 'ship country', shippingaddress.getFieldValue('country'));
            nlapiLogExecution('DEBUG', 'ship state', shippingaddress.getFieldValue('state'));

            if (validshippingaddress === true && validFromAddress === true)
            {

                nlapiLogExecution('DEBUG', "userEventAfterSubmit", "Is a Valid Address");

                nlapiLogExecution("DEBUG", "RECORDID - TYPE", recordID + " " + recordType);
                nlapiLogExecution("DEBUG", "userEventAfterSubmit - operationType: ", JSON.stringify(type) + " : " + typeof type);
                // see if bypass is needed

                if (IsTaxCalcRequired(type))
                {
                    //PL 180718 Update flag status
                    SetUsTaxStatus(2, recordID, recordType); //Not Started
                    nlapiLogExecution('DEBUG', "userEventAfterSubmit", " params -" + JSON.stringify(params));

                    //Log transaction in gravTransQueue record
                    var gravTransQueueId = GravTransQueue_Insert(recordType, recordID);
                    // check if flag is raised and

                    //set a random wait seed before checking the flag
                    /*
                    var randomWait = Math.floor(Math.random() * 5); // returns a random integer from 0 to 9
                    nlapiLogExecution("DEBUG", "userEventAfterSubmit.randomWait", randomWait);
                    sleep(randomWait);
                    */

                    if (CheckProcessingFlag())
                    {
                        nlapiLogExecution('DEBUG', "userEventAfterSubmit.CheckProcessingFlag", "Bulk Process flag up. Bypassing additional queue.");

                    }
                    else
                    {
                        //customdeploy_grav_ss_bulktransproces01
                        var statusB = nlapiScheduleScript('customscript_grav_fin_ss_bulktransproces', "customdeploy_grav_ss_bulktransproces01", null);
                        nlapiLogExecution('DEBUG', "userEventAfterSubmit.queueScheduledScript", 'customscript_grav_fin_ss_bulktransproces : Status - ' + statusB);

                    }
                    /* GRAVOC PL 180824 remove the loop to put into make bed rock request
                    var cnt = 0;
                    getRemainingUnits("userEventAfterSubmit before loop", recordID);


                    //  Loop through to set the user event
                  
                    do
                    {
                        if (cnt >= 10)
                        {
                            nlapiLogExecution('DEBUG', 'userEventAfterSubmit  - Abort scehduling bedrock request, tried too many times - START');
                            GravTransQueue_FailedToQueue(gravTransQueueId, 'T');
                            nlapiLogExecution('DEBUG', 'userEventAfterSubmit  - Abort scehduling bedrock request, tried too many times:' + cnt, "GravTransQueue set to faield to queue: " + gravTransQueueId);
                            break;
                        }
                        var status = nlapiScheduleScript('customscript_gravmakebedrockrequest', null, params);

                        nlapiLogExecution('DEBUG', "userEventAfterSubmit.queueScheduledScript", recordID + '(' + cnt + ')' + ': customscript_gravmakebedrockrequest : Status - ' + status);
                        getRemainingUnits("userEventAfterSubmit inside loop", recordID);
                        if (status !== 'QUEUED')
                        {
                            // PL 180731 update to processing algor
                            sleep(1 + 1 * cnt);
                        }

                        cnt++;
                    }
                    while (status !== 'QUEUED');
                    */
                    getRemainingUnits("userEventAfterSubmit after loop", recordID);
                }
                else
                {
                    // no tax calculation required 
                    nlapiLogExecution("DEBUG", "userEventAfterSubmit", "No TWE Tax Calucation required.  Bypass - Operation Type: " + type);

                    SetUsTaxStatus(4, recordID, recordType); //completed - success
                }

            }
            else
            {
                var user = nlapiGetUser();
                var email_body = "To calculate tax, TWE requires a full address.";
                email_body = email_body + " OrderNumber =  " + nlapiGetFieldValue("tranid");
                email_body = email_body + "- ShipCountry =  " + nlapiGetFieldValue("shipcountry");
                nlapiLogExecution('DEBUG', 'Invalid address - Address incomplete. ShipCountry = ' + nlapiGetFieldValue("shipcountry"), 'Order number:' + nlapiGetFieldValue("tranid"));
                //nlapiSendEmail(user, user, "Netsuite Incomplete Address Error", email_body, null);
                SendTransactionEmail(user, recordID, recordType, "Netsuite Incomplete Address Error", email_body);

                SetUsTaxStatus(5, recordID, recordType); //completed - failure
                return;
            }
        }

        else
        {
            //user = nlapiGetUser();
            //email_body = "TWE does not support international addresses at this time.";
            //email_body = email_body + " OrderNumber =  " + nlapiGetFieldValue("tranid");
            //email_body = email_body + "- ShipCountry =  " + nlapiGetFieldValue("shipcountry");
            //SendTransactionEmail(user, recordID, recordType, "Netsuite International Address Error", email_body);
            nlapiLogExecution('DEBUG', 'TWE does not support international addresses at this time. ShipCountry = ' + nlapiGetFieldValue("shipcountry"), 'Order number:' + nlapiGetFieldValue("tranid"));

            SetUsTaxStatus(4, recordID, recordType); //completed - success
            return;
        }
    }
    else
    {
        nlapiLogExecution("DEBUG", "userEventAfterSubmit", "TWE not enabled");
        //PL 180718 Update flag status
        SetUsTaxStatus(1, recordID, recordType); //subsidiary not TWE enabled
        return;
    }
}

function IsTaxCalcRequired(operationType)
{
    var retObj = false;
    // there is something funky here as === produces an error
    if (operationType == "create")
    {
        retObj = true;
    }
    //else if (operationType == "edit" || operationType == "xedit") {
    else
    {

        /*
        Change scenarios:
        1. Billing address changed
        a.Field - Billaddress   string
        2. Shipping Address changed
        a.Field - Shipaddress  string
        3. Existing Line  amount / rate / quantity value changed
        a.Field - Subtotal real
        4. Exiting line addition or deletion(zero amount or non - zero amount)
        a.Field - LineCount
        b.Field - Subtotal
        5. Change any of per line TaxCode
        a.Field - Taxcode integer
        6. Change of any value on the order
        a.Field - Total real
        Change any value in the Ship From address
        */

        var transOld = nlapiGetOldRecord();
        var transNew = nlapiGetNewRecord();

        var old_BillTo = transOld.getFieldValue("billaddress");
        var old_ShipTo = transOld.getFieldValue("shipaddress");
        var old_Total = parseFloat(transOld.getFieldValue("total"));
        var old_Subtotal = parseFloat(transOld.getFieldValue("subtotal"));
        var old_LineCount = transOld.getLineItemCount("item");
        var old_LineAmount;
        var old_LineTaxCode;
        var old_ShipFrom;

        var new_BillTo = transNew.getFieldValue("billaddress");
        var new_ShipTo = transNew.getFieldValue("shipaddress");
        var new_Total = parseFloat(transNew.getFieldValue("total"));
        var new_Subtotal = parseFloat(transNew.getFieldValue("subtotal"));
        var new_LineCount = transNew.getLineItemCount("item");
        var new_LineAmount;
        var new_LineTaxCode;
        var new_ShipFrom;

        if (old_BillTo !== null)
        {
            old_BillTo = old_BillTo.replace(/\r/g, '');
        }
        if (old_ShipTo !== null)
        {
            old_ShipTo = old_ShipTo.replace(/\r/g, '');
        }

        if (new_BillTo !== null)
        {
            new_BillTo = new_BillTo.replace(/\r/g, '');
        }
        if (new_ShipTo !== null)
        {
            new_ShipTo = new_ShipTo.replace(/\r/g, '');
        }


        nlapiLogExecution("DEBUG", "IsTaxCalcRequired - old_BillTo: ", JSON.stringify(old_BillTo) + " - field type: " + typeof old_BillTo);
        nlapiLogExecution("DEBUG", "IsTaxCalcRequired - old_ShipTo: ", JSON.stringify(old_ShipTo) + " - field type: " + typeof old_ShipTo);
        nlapiLogExecution("DEBUG", "IsTaxCalcRequired - old_Total: ", JSON.stringify(old_Total) + " - field type: " + typeof old_Total);
        nlapiLogExecution("DEBUG", "IsTaxCalcRequired - old_Subtotal: ", JSON.stringify(old_Subtotal) + " - field type: " + typeof old_Subtotal);
        nlapiLogExecution("DEBUG", "IsTaxCalcRequired - old_LineCount: ", JSON.stringify(old_LineCount) + " - field type: " + typeof old_LineCount);

        nlapiLogExecution("DEBUG", "IsTaxCalcRequired - new_BillTo: ", JSON.stringify(new_BillTo) + " - field type: " + typeof new_BillTo);
        nlapiLogExecution("DEBUG", "IsTaxCalcRequired - new_ShipTo: ", JSON.stringify(new_ShipTo) + " - field type: " + typeof new_ShipTo);
        nlapiLogExecution("DEBUG", "IsTaxCalcRequired - new_Total: ", JSON.stringify(new_Total) + " - field type: " + typeof new_Total);
        nlapiLogExecution("DEBUG", "IsTaxCalcRequired - new_Subtotal: ", JSON.stringify(new_Subtotal) + " - field type: " + typeof new_Subtotal);
        nlapiLogExecution("DEBUG", "IsTaxCalcRequired - new_LineCount: ", JSON.stringify(new_LineCount) + " - field type: " + typeof new_LineCount);

        if (old_LineCount !== new_LineCount) { nlapiLogExecution("DEBUG", "IsTaxCalcRequired", "new_LineCount has changed."); }
        if (old_BillTo !== new_BillTo) { nlapiLogExecution("DEBUG", "IsTaxCalcRequired", " new_BillTo has changed."); }
        if (old_ShipTo !== new_ShipTo) { nlapiLogExecution("DEBUG", "IsTaxCalcRequired", "new_ShipTo has changed."); }
        //if (old_Total !== new_Total) { nlapiLogExecution("DEBUG", "IsTaxCalcRequired", "new_Total has changed."); }
        if (old_Subtotal !== new_Subtotal) { nlapiLogExecution("DEBUG", "IsTaxCalcRequired", "new_Subtotal has changed."); }

        //MS 20180818 - Not checking for total because this causes calculation run a second time after the tax iis updated on transaction
        //if (old_LineCount !== new_LineCount || old_BillTo !== new_BillTo || old_ShipTo !== new_ShipTo || old_Total !== new_Total || old_Subtotal !== new_Subtotal)
        if (old_LineCount !== new_LineCount || old_BillTo !== new_BillTo || old_ShipTo !== new_ShipTo ||  old_Subtotal !== new_Subtotal)
        {

            nlapiLogExecution("DEBUG", "IsTaxCalcRequired", "Transaction has changed.  Recalculalte tax.");
            retObj = true;
        }

        else
        {

            for (var i = 1; i < new_LineCount + 1; i++)
            {

                old_LineAmount = transOld.getLineItemValue("item", "amount", i);
                old_LineTaxCode = transOld.getLineItemValue("item", "taxcode", i);
                old_ShipFrom = transOld.getLineItemValue("item", "custcol_ship_from_code", i);

                new_LineAmount = transNew.getLineItemValue("item", "amount", i);
                new_LineTaxCode = transNew.getLineItemValue("item", "taxcode", i);
                new_ShipFrom = transNew.getLineItemValue("item", "custcol_ship_from_code", i);

                //nlapiLogExecution("DEBUG", "IsTaxCalcRequired - Old line value for line #: " + i, "[Subtotal | Taxcode | ShipFromCode] = [" + old_LineAmount + " | " + old_LineTaxCode + " | " + old_ShipFrom + "]");
                //nlapiLogExecution("DEBUG", "IsTaxCalcRequired - New line value for line #: " + i, "[Subtotal | Taxcode | ShipFromCode] = [" + new_LineAmount + " | " + new_LineTaxCode + " | " + new_ShipFrom + "]");

                if (old_LineAmount !== new_LineAmount || old_LineTaxCode !== new_LineTaxCode || old_ShipFrom !== new_ShipFrom)
                {
                    nlapiLogExecution("DEBUG", "IsTaxCalcRequired", "Line has changed.  Recalculalte tax.", "Line#: " + i);
                    retObj = true;
                }
                else
                {
                    //nlapiLogExecution("DEBUG", "IsTaxCalcRequired", "Line #:  " + i + " has NOT changed.");
                }

            }
        }
    }
    return retObj;

}

function CheckProcessingFlag()
{
    var retObj = true;
    nlapiLogExecution("DEBUG", "CheckProcessingFlag.START", null);
    var config = GetFirstConfigRec();
    var flag = config.getFieldValue("custrecord_sovosisbulkprocessing");
    nlapiLogExecution("DEBUG", "CheckProcessingFlag.Value", flag);
    if (flag === "F")
    {
        retObj = false;
    }



    return retObj;
}