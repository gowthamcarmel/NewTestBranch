/**
 * @NApiVersion 2.x
 * @NScriptType UserEventScript
 * @NModuleScope SameAccount
 */
define(['N/task', 'N/ui/message'],
/**
 * @param {task} task
 * @param {message} message
 */
function(task, message) {
   
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
    	
    	 if (scriptContext.type !== scriptContext.UserEventType.EDIT)
             return;

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

   	 if (scriptContext.type !== scriptContext.UserEventType.EDIT)
            return;

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
   	 
   	var shipFromRecord = scriptContext.newRecord;
    log.debug('Call record created successfully', 'shipFrom: ' + shipFromRecord.getValue('custrecord_ship_from_update_so'));
    log.debug('Call record created successfully', 'custrecord_ship_from_change_from: ' + shipFromRecord.getValue('custrecord_ship_from_change_from'));
    if (shipFromRecord.getValue('custrecord_ship_from_update_so') == true && shipFromRecord.getValue('custrecord_ship_from_change_from') != '')
    {
    	  var scriptTask = task.create({taskType: task.TaskType.SCHEDULED_SCRIPT});
    	    scriptTask.scriptId = 1142;
    	    scriptTask.deploymentId = 'customdeploy_sovos_update_so_with_shipco';
    	    scriptTask.params = {'custscript_shipcode_changefrom' : shipFromRecord.getValue('custrecord_ship_from_change_from') ,'custscript_shipcode_changeto' :shipFromRecord.id,'custscript_update_item' : 'T'};
    	    var scriptTaskId = scriptTask.submit();
    	   
    	    log.debug({
    	        title: 'End Script'
    	    });		
    }
    if (shipFromRecord.getValue('custrecord_ship_from_update_so') == true && shipFromRecord.getValue('custrecord_ship_from_change_from') == '')
    {
    	  var scriptTask = task.create({taskType: task.TaskType.SCHEDULED_SCRIPT});
    	    scriptTask.scriptId = 1142;
    	    scriptTask.deploymentId = 'customdeploy_sovos_update_so_with_shipco';
    	    scriptTask.params = {'custscript_shipcode_changefrom' : shipFromRecord.id ,'custscript_shipcode_changeto' : shipFromRecord.id, 'custscript_update_item' : 'T'};
    	    var scriptTaskId = scriptTask.submit();
    	   
    	    log.debug({
    	        title: 'End Script'
    	    });		
    }
 
    
  
    }

    return {
        beforeLoad: beforeLoad,
        beforeSubmit: beforeSubmit,
        afterSubmit: afterSubmit
    };
    
});
