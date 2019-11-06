


//Global Vars
var _Context = nlapiGetContext();
var _SovosConfigId = GetFirstConfigRec().getId();

function ProcessRemainingTransactions()
{
    try
    {
        nlapiLogExecution("DEBUG", "ProcessRemainingTransactions.START", _Context.getDeploymentId());
        // log remaining units
        GetUnits();
        // time in millsecond
        var startTime = new Date().getTime();
        var thresholdTime = 5 * 60 * 1000; // five minutes
        //set a random wait seed
        var randomWait = Math.floor(Math.random() * 20); // returns a random integer from 0 to 9
        nlapiLogExecution("DEBUG", "ProcessRemainingTransactions.randomWait", randomWait);
        sleep(randomWait);
        //check see if an instance is already running
        if (GetProcessingFlag())
        {
            // Another process is running stop processing
            return;

        }

        // Lift the processing flag
        SetProcessingFlag(true);



        // Query GravTransQueue for records
        var queueFilter = new nlobjSearchFilter("custrecord_grav_isqueued", null, "is", "F");
        // will only work on records one day prior as a performance govener
        var dateFilter = new nlobjSearchFilter("lastmodified", null, "onorafter", "yesterday");
        //define search columns
        var transTypeCol = new nlobjSearchColumn('custrecord_transtype', null, null);
        var transIdCol = new nlobjSearchColumn('custrecord_transinternalid', null, null);
        var transUserCol = new nlobjSearchColumn('custrecord_initiatinguser', null, null);

        var searchResults = nlapiSearchRecord("customrecord_gravtransqueue", null, [queueFilter, dateFilter], [transTypeCol, transIdCol, transUserCol]);
        var srCnt = 0;
        while (searchResults !== null)
        {

            var transType = null;
            var transId = null;
            var transUser = null;
            var queueId = null;
            // iterate through results
            nlapiLogExecution("DEBUG", "ProcessRemainingTransactions.searchResults.length", "(" + srCnt + ") " + searchResults.length);
            var totRec = searchResults.length;

            for (var i = 0; i < searchResults.length; i++)
            {
                // check if multiple deployment are running
                if (!IsDeploymentValid())
                {
                    return;
                }
                // set percent complete record
                var completePerc = 100 * (i + 1) / totRec;
                nlapiLogExecution("DEBUG", "ProcessRemainingTransactions.completePercent", completePerc);
                _Context.setPercentComplete(completePerc);

                // retrive 
                queueId = searchResults[i].getId();
                transType = searchResults[i].getValue(transTypeCol);
                transId = searchResults[i].getValue(transIdCol);
                transUser = searchResults[i].getValue(transUserCol);
                nlapiLogExecution("DEBUG", "ProcessRemainingTransactions.TransInfo", "QueueId: " + queueId + ",Type:" + transType + ",Id:" + transId + ",User:" + transUser);

                // Create parameter object
                var params = {
                    custscript_bedrock_recordid: transId,
                    custscript_bedrock_recordtype: transType,
                    custscript_bedrock_user: transUser
                };

                var cnt = 0;
                var status = null;
                var remainUsage = GetUnits();
                var isContinued = false;
                do
                {

                    // attempt to queue record
                    status = nlapiScheduleScript('customscript_gravmakebedrockrequest', null, params);
                    nlapiLogExecution('DEBUG', "ProcessRemainingTransactions.queueScheduledScript", transId + '(' + cnt + ')' + ': customscript_gravmakebedrockrequest : Status - ' + status);
                    if (status === 'QUEUED')
                    {
                        // update record with queue information
                        GravTransQueue_SetQueue(queueId);

                    }
                    else
                    {
                        // record not queued
                        sleep(1 + 1 * cnt);
                    }
                    cnt++;
                    remainUsage = GetUnits();
                    // handle case where script is going over usage limit
                    if (remainUsage < 500)
                    {
                        //break and schedule another script
                        isContinued = true;
                        status = nlapiScheduleScript('customscript_grav_fin_ss_bulktransproces', "customdeploygrav_ss_bulktransprocess02", null);
                        nlapiLogExecution('DEBUG', "ProcessRemainingTransactions.queueScheduledScript - usage", transId + '(' + cnt + ')' + ': customscript_grav_fin_ss_bulktransproces : Status - ' + status);
                        break;
                    }
                    // handle case when script is going over time limit
                    var curTime = new Date().getTime();
                    var elapsedTime = curTime - startTime;
                    nlapiLogExecution("DEBUG", "ProcessRemainingTransactions.elapsedTime", elapsedTime / 1000);
                    if ((curTime - startTime) > thresholdTime)
                    {
                        //time limit exceeded
                        //break and schedule another script
                        isContinued = true;
                        status = nlapiScheduleScript('customscript_grav_fin_ss_bulktransproces', "customdeploygrav_ss_bulktransprocess02", null);
                        nlapiLogExecution('DEBUG', "ProcessRemainingTransactions.queueScheduledScript - time", transId + '(' + cnt + ')' + ': customscript_grav_fin_ss_bulktransproces : Status - ' + status);
                        break;
                    }
                }
                while (status !== 'QUEUED');

                if (isContinued)
                {
                    // break for loop
                    break;
                }


            }

            if (isContinued)
            {
                // break for loop
                break;
            }

            /*
            // list completed.  Rerun to pull down flag.
            nlapiLogExecution("DEBUG", "ProcessRemainingTransactions", "All transactions are queued for processing");
            status = nlapiScheduleScript('customscript_grav_fin_ss_bulktransproces', null, null);
            nlapiLogExecution('DEBUG', "ProcessRemainingTransactions.queueScheduledScript", transId + '(' + cnt + ')' + ': customscript_grav_fin_ss_bulktransproces : Status - ' + status);
            */
            // repull search results
            searchResults = nlapiSearchRecord("customrecord_gravtransqueue", null, [queueFilter, dateFilter], [transTypeCol, transIdCol, transUserCol]);
            // if results are null wait 5 sec and retry.
            if (searchResults === null)
            {
                sleep(5);
                searchResults = nlapiSearchRecord("customrecord_gravtransqueue", null, [queueFilter, dateFilter], [transTypeCol, transIdCol, transUserCol]);
            }
            srCnt++;
        }
    }
    catch (err)
    {        
        nlapiLogExecution("ERROR", "ProcessRemainingTransactions.ERR", JSON.stringify(err));
    }

    // end script and drop flag

    // Lower the processing flag
    // even if an error occurs
    SetProcessingFlag(false);
    nlapiLogExecution("DEBUG", "ProcessRemainingTransactions.END", "No unprocessed transactions found");
}

function SetProcessingFlag(isProcessing)
{
    var deploymentId =_Context.getDeploymentId();

    nlapiLogExecution("DEBUG", "SetProcessingFlag.START", isProcessing + " , " + deploymentId);
    var config = nlapiLoadRecord("customrecord_sovos_configuration", _SovosConfigId, null);
    var value = "F";
    if (isProcessing)
    {
        value = "T";
    }
    config.setFieldValue("custrecord_sovosisbulkprocessing", value);
    config.setFieldValue("custrecord_sovosbulkprocessingdeployment", deploymentId);
    // PL how did this work with out setting the record
    nlapiSubmitRecord(config, { disabletriggers: false, enablesourcing: false },true);
    nlapiLogExecution("DEBUG", "SetProcessingFlag.Value", value + " , " + deploymentId);

}

function GetProcessingFlag()
{
    var retObj = false;
    
    nlapiLogExecution("DEBUG", "GetProcessingFlag.START", null);
    var config = nlapiLoadRecord("customrecord_sovos_configuration", _SovosConfigId, null);
    var flag = config.getFieldValue("custrecord_sovosisbulkprocessing");
    
    nlapiLogExecution("DEBUG", "GetProcessingFlag.Value", flag);
    if (flag === "T")
    {
        retObj = true;
    }
    return retObj;

}


// assume that the flag should be true but we need to distinguish the one true deployment id
function IsDeploymentValid()
{
    var retObj = false;
    var curDeployId = _Context.getDeploymentId();
    nlapiLogExecution("DEBUG", "IsDeploymentValid.START", null);
    var config = nlapiLoadRecord("customrecord_sovos_configuration", _SovosConfigId, null);
    var flag = config.getFieldValue("custrecord_sovosisbulkprocessing");    
    var deploymentId = config.getFieldValue("custrecord_sovosbulkprocessingdeployment");

    nlapiLogExecution("DEBUG", "IsDeploymentValid.Value", flag + " , " + curDeployId + " , " + deploymentId);
    if (flag === "T" )
    {
        if (curDeployId === deploymentId)
        {
            retObj = true;
        }
    }
    else
    {
        // error unexprected value
        throw "IsDeploymentValid - Flag is unexpectedly down.";
        nlapiLogExecution("ERROR", "IsDeploymentValid.WARN", "Flag is unexpectedly down.");
    }
    return retObj;

}

function GetUnits()
{
    var usageRemaining = parseInt(_Context.getRemainingUsage());
    nlapiLogExecution("DEBUG", "GetUnits.usageRemaining", usageRemaining);
    return usageRemaining;
}

