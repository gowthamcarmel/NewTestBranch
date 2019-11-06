/**
 * @NApiVersion 2.x
 * @NScriptType WorkflowActionScript
 */

define(['N/task','N/runtime'],
    function(task,runtime) {
        function onAction(scriptContext) {
            log.debug({
                title: 'Start Script'
            });
            var newRecord = scriptContext.newRecord;
            var HeaderInternalID = newRecord.id;
            log.debug({
                title: 'HeaderInternalID', 
                details: HeaderInternalID
            });
            var action = 'validate';
          var status = newRecord.getValue({
        	    fieldId: 'custrecord_casshdr_status'
          });
          
          log.debug({
              title: 'status', 
              details: status
          });
          
          if(status == '5' || status == '9')
          {
        	  action = 'processbills'
          }
             
        	  
          log.debug({
              title: 'action', 
              details: action
          });
            
            var scriptTask = task.create({taskType: task.TaskType.SCHEDULED_SCRIPT});
            scriptTask.scriptId = 931;
            scriptTask.deploymentId = 'customdeploy_create_cass_bill_dply';
            scriptTask.params = {'custscript_cass_header_id' : HeaderInternalID ,'custscript_cass_action' :action};
            var scriptTaskId = scriptTask.submit();
           
            log.debug({
                title: 'End Script'
            });
         //   return 1;
        }
        return {
            onAction: onAction
        }
    });