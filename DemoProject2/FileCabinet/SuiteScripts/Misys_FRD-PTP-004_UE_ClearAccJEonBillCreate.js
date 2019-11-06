/**
 * Module Description
 * 
 * Version    Date            Author           Remarks
 * 1.00       25 Oct 2013     bfeliciano
 *
 */

/**
 * The recordType (internal id) corresponds to the "Applied To" record in your script deployment. 
 * @appliedtorecord recordType
 * 
 * @param {String} type Operation types: create, edit, delete, xedit
 *                      approve, reject, cancel (SO, ER, Time Bill, PO & RMA only)
 *                      pack, ship (IF)
 *                      markcomplete (Call, Task)
 *                      reassign (Case)
 *                      editforecast (Opp, Estimate)
 * @returns {Void}
 */
function beforeSubmit_clearAccJEField(type){
	try
	{
		__log.start({
			 'logtitle'  : 'beforeSubmit_clearAccJEField'
			,'company' 	 : 'Misys'
			,'scriptname': 'Misys_UE_ClearAccJEonBillCreate.js'
			,'scripttype': 'userevent'
		});
		
		var exec = nlapiGetContext().getExecutionContext();
		__log.writev('type/context', [type,exec]);
		
		if (!__is.inArray(['create'], type) ) return __log.end('Ignoring type: ' + type);
		if (!__is.inArray(['userinterface','userevent','scheduled','webservices','csvimport'], exec) ) return __log.end('Ignoring execution context: ' + exec);
		
		// empty this field
		nlapiSetFieldValue('custbody_accrualje_no', '');
		
		
		return true;
		
	}
	catch (error)
	{
	    if (error.getDetails != undefined)
	    {
	        nlapiLogExecution( 'ERROR', 'Process Error',error.getCode() + ': ' + error.getDetails());	        
	        throw error;
	    }
	    else
	    {
	        nlapiLogExecution( 'ERROR', 'Unexpected Error',error.toString());
	        throw nlapiCreateError('99999' , error.toString());
	    }
	}	 	  		
 
	
}
