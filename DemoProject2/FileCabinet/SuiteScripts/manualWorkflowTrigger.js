function triggerWorkflowManual(request, response){
	
	var context = nlapiGetContext();
	var subscriptionId = context.getSetting('SCRIPT', 'custscript_subsid');

	nlapiInitiateWorkflow('customrecord_sb_subscription', subscriptionId, 'customworkflow_subsbill200_manualrun')
	nlapiLogExecution('DEBUG','Subscription Manual Billing Triggered','Endrun');

}