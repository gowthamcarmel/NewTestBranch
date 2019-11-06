/**
 * Module Description
 * 
 * Version    Date            Author           Remarks
 * 1.00       25 May 2015     anduggal
 *
 */

/**
 * @param {String} type Context Types: scheduled, ondemand, userinterface, aborted, skipped
 * @returns {Void}
 */
function scheduled(type)
{
    var tranId = null;
    //var tranTyp = null;
	var trans = null;
    var tranRec = null;
    var lineId = null;
    //var entName = null;
    var costCentre = null;
    var recId = null;
    
	var context = nlapiGetContext();
    var stSavedSearch = context.getSetting('SCRIPT', 'custscript_ar_ap_no_name');
    
    var arrResults = nlapiSearchRecord('customrecord_mys_jnl_line_upd', stSavedSearch);
    if (arrResults)
    {
    	try
    	{
    		var j = arrResults.length - 1;
        	for ( var i = 0; i < arrResults.length; i++)
            {
        		tranId = arrResults[i].getValue('custrecord_mys_jnl_id');
        		//tranTyp = arrResults[i].getValue('custrecord_mys_tran_type');
        		lineId = parseInt(arrResults[i].getValue('custrecord_mys_jnl_line'));
        		//entName = arrResults[i].getValue('custrecord_mys_jnl_entity');
        		costCentre = arrResults[i].getValue('custrecord_mys_cc');
        		
        		recId = arrResults[i].getValue('internalid');
        		
        		if (tranId != trans)
        		{
        			if (tranRec != null)
        			{
        				nlapiLogExecution('DEBUG', 'Journal Line Update', 'Submitting Journal Entry: '+trans);
        				nlapiSubmitRecord(tranRec);
        				nlapiLogExecution('DEBUG', 'Journal Line Update', 'Journal Entry Submitted Successfully: '+trans);
    				}
        			tranRec = nlapiLoadRecord('journalentry', tranId);
    			}
        		
        		nlapiLogExecution('DEBUG', 'Journal Line Update', 'Updating Line Number: '+lineId);
        		lineId = lineId + 1;
        		//tranRec.setLineItemValue('line', 'entity', lineId, entName);
        		tranRec.setLineItemValue('line', 'department', lineId, costCentre);
        		
        		if (i == j && tranRec != null)
        		{
        			nlapiLogExecution('DEBUG', 'Journal Line Update', 'Submitting Journal Entry: '+tranId);
        			nlapiSubmitRecord(tranRec);
        			nlapiLogExecution('DEBUG', 'Journal Line Update', 'Journal Entry Submitted Successfully: '+tranId);
    			}
        		else
        		{
        			trans = tranId;
        		}
        		nlapiSubmitField('customrecord_mys_jnl_line_upd', recId, 'custrecord_mys_processed', 'T');
            }
		}
    	catch (error)
		{
			if (error.getDetails != undefined) 
		 	   {
		 		   nlapiLogExecution('ERROR', 'Process Error', error.getCode() + ': ' + error.getDetails());
		 		   throw error;
		 	   }
		 	   else 
		 	   {    
		 		   nlapiLogExecution('ERROR', 'Unexpected Error', error.toString());
		 		   throw nlapiCreateError('99999', error.toString());
		 	   }
		}
	}
}
