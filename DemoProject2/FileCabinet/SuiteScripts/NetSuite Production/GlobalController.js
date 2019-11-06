/**
 * Module Description
 * 
 * Version    Date            Author           Remarks
 * 1.00       07 Mar 2014     anduggal
 *
 */

/**
 * @returns {Void} Any or no return value
 */
function workflowAction_getGlobalController() {
	var stLoggerTitle = 'workflowAction_getGlobalController';
	nlapiLogExecution('DEBUG', stLoggerTitle, '>>Entry<<');
    
    try
    {
    	var context = nlapiGetContext();

        var stGlobalControllerSearch = context.getSetting('SCRIPT', 'custscript_glob_cont_search');
        nlapiLogExecution('DEBUG', stLoggerTitle, 'Script Parameter | Global Controller Search = ' + stGlobalControllerSearch);
    	
    	var arrResults = nlapiSearchRecord('customrecord_mys_global_controller', stGlobalControllerSearch);
    	if (arrResults != null)
    	{
    		var stGlobalController = arrResults[0].getValue('custrecord_mys_global_controller');
    		nlapiLogExecution('DEBUG', stLoggerTitle, 'Global Controller = ' + stGlobalController);
    		return stGlobalController;
    	}
        
        nlapiLogExecution('DEBUG', stLoggerTitle, '>>Exit<<');        
        return null;
    }
    catch (error)
    {
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
        return null;
    }
}
