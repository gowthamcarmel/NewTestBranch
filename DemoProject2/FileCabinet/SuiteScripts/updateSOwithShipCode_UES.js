/**
 * @NApiVersion 2.x
 * @NScriptType UserEventScript
 * @NModuleScope SameAccount
 */
define(['N/record', 'N/search', 'N/runtime','N/task'],
/**
 * @param {record} record
 * @param {search} search
 */
function(record, search,runtime,task) {
   
    /**
     * Function definition to be triggered before record is loaded.
     *
     * @param {Object} scriptContext
     * @param {Record} scriptContext.newRecord - New record
     * @param {string} scriptContext.type - Trigger type
     * @param {Form} scriptContext.form - Current form
     * @Since 2015.2
     */
    function beforeLoad(scriptContext) {

    }

    /**
     * Function definition to be triggered before record is loaded.
     *
     * @param {Object} scriptContext
     * @param {Record} scriptContext.newRecord - New record
     * @param {Record} scriptContext.oldRecord - Old record
     * @param {string} scriptContext.type - Trigger type
     * @Since 2015.2
     */
    function beforeSubmit(scriptContext) {

    }

    /**
     * Function definition to be triggered before record is loaded.
     *
     * @param {Object} scriptContext
     * @param {Record} scriptContext.newRecord - New record
     * @param {Record} scriptContext.oldRecord - Old record
     * @param {string} scriptContext.type - Trigger type
     * @Since 2015.2
     */
    function afterSubmit(scriptContext) {   
    	
    	if (scriptContext.type !== scriptContext.UserEventType.EDIT)
            return;
		
		log.debug('Update SO', ' runtime.executionContext: ' + runtime.executionContext); 
		
		if(runtime.executionContext == 'USERINTERFACE')
		{		
		//if(runtime.executionContext !== runtime.ContextType.USERINTERFACE)
		//	return
		
   	 
   	var shipFromRecord = scriptContext.newRecord;
	var oldshipFromRecord = scriptContext.oldRecord;
   
    log.debug('Update SO', ' New custitem_ship_from_code: ' + shipFromRecord.getValue('custitem_ship_from_code'));
    log.debug('Update SO', 'Old custitem_ship_from_code: ' + oldshipFromRecord.getValue('custitem_ship_from_code'));
    if (oldshipFromRecord.getValue('custitem_ship_from_code') != '' && (oldshipFromRecord.getValue('custitem_ship_from_code') != shipFromRecord.getValue('custitem_ship_from_code') ) )
    {
    	  var scriptTask = task.create({taskType: task.TaskType.SCHEDULED_SCRIPT});
    	    scriptTask.scriptId = 1142;
    	    scriptTask.deploymentId = 'customdeploy_sovos_update_so_with_shipco';
    	    scriptTask.params = {'custscript_shipcode_changefrom' : oldshipFromRecord.getValue('custitem_ship_from_code') ,'custscript_shipcode_changeto' : shipFromRecord.getValue('custitem_ship_from_code'),'custscript_update_item' : 'F'};
    	    var scriptTaskId = scriptTask.submit();
    	   
    	    log.debug({
    	        title: 'End Script'
    	    });		
    }
	}
	else if(runtime.executionContext == 'WEBSERVICES')
	{
	
   	var shipFromRecord = scriptContext.newRecord;
	var oldshipFromRecord = scriptContext.oldRecord;
   
    log.debug('Update SO', ' New custitem_ship_from_code: ' + shipFromRecord.getValue('custitem_ship_from_code'));
    log.debug('Update SO', 'Old custitem_ship_from_code: ' + oldshipFromRecord.getValue('custitem_ship_from_code'));
    if (oldshipFromRecord.getValue('custitem_ship_from_code') != '' && (oldshipFromRecord.getValue('custitem_ship_from_code') != shipFromRecord.getValue('custitem_ship_from_code') ) )
    {
    	  var scriptTask = task.create({taskType: task.TaskType.SCHEDULED_SCRIPT});
    	    scriptTask.scriptId = 1142;
    	    scriptTask.deploymentId = 'customdeploy_sovos_update_so_with_shipco';
    	    scriptTask.params = {'custscript_shipcode_changefrom' : oldshipFromRecord.getValue('custitem_ship_from_code') ,'custscript_shipcode_changeto' : shipFromRecord.getValue('custitem_ship_from_code'),'custscript_update_item' : 'F'};
    	    var scriptTaskId = scriptTask.submit();
    	   
    	    log.debug({
    	        title: 'End Script'
    	    });		
    }	
	}else
		
		{ return;}
  
    }

    

    return {
        beforeLoad: beforeLoad,
        beforeSubmit: beforeSubmit,
        afterSubmit: afterSubmit
    };
    
});
