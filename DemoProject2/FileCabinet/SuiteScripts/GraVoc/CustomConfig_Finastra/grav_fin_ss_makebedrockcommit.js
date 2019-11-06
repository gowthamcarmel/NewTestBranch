/**
 * Module Description
 * 
 * Version    Date            Author           Remarks
 * 1.00       14 Dec 2017     ahoang
 *
 */



/**
 * Makes call to /commit bedrock end-point to finalize any transactions in queue
 */
function Commit_Transactions_Scheduled()
{
    // add parameter
    var startTime = new Date().getTime();
    nlapiLogExecution("AUDIT", "Commit_Transactions_Scheduled START", startTime);
    try
    {
        // core method call
        makeBedrockCommit(false);

    }
    catch (e)
    {
        nlapiLogExecution("ERROR", "Commit_Transactions_Scheduled  ERR", JSON.stringify(e));
    }
    finally
    {

        var endTime = new Date().getTime();
        var duration = endTime - startTime;
        nlapiLogExecution("AUDIT", "Commit_Transactions_Scheduled END", "Execution Time (ms):" + duration.toString());

    }
}