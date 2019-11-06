/*
 * 	Recurring Billing Enhancements as requeted for FY17
 * 	
 * 
 * 
 * 
 * 
 * 
 * 
 * 
 */


// Subscription Flag for Suspended Items
/*
 * This functions adds a big ass note on the subscription record 
 * that should serve as a warning to the user when the subscription
 * has subscription items in Suspended status
 * 
 * Custom Subscription field: Suspended Item Flag (custrecord_mis_sb_susp)
 * 
 * Script: [ns] Subscription Suspended Item Flag
 * Type: Scheduled (runs every 15 minutes)
 * 
 * 
 * nlapiSubmitField('customrecord_sb_subscription',433716,'custrecord_mis_sb_susp_val','Note: Suspended Items are present in this subscription. Please double check before billing.');
 * 
 */ 

function markSubscriptionSuspendedFlag(){
	// log script start time
	var t1 = new Date();
	
	var context = nlapiGetContext();
	
	var searchIdMark = context.getSetting('SCRIPT', 'custscript_search_mark');
	var searchIdUnmark = context.getSetting('SCRIPT', 'custscript_search_unmark');
	
	try{
		var subsId = new Array();
		
		var sResult = nlapiSearchRecord('customrecord_sb_subscription', searchIdMark, null, null);
		
		for(var i=0; sResult != null && i < sResult.length; i++){
			nlapiSubmitField('customrecord_sb_subscription', sResult[i].getId(),'custrecord_mis_sb_susp_val','Note: Suspended Items are present in this subscription. Please double check before billing.');
			subsId.push( sResult[i].getId() );
		}
	
		
		var sResult2 = nlapiSearchRecord('customrecord_sb_subscription', searchIdUnmark, null, null);
	
		for(var i=0; sResult2 != null && i < sResult2.length; i++){
			var subsfound = subsId.indexOf(sResult2[i].getId());
			if(subsfound < 0 ){
				var subsName = sResult2[i].getValue('name',null,'group');
				nlapiSubmitField('customrecord_sb_subscription', subsName.substr(0, subsName.indexOf('_')) ,'custrecord_mis_sb_susp_val','');
			}
		}
		
	}catch(e){
		nlapiLogExecution('DEBUG','markSubscriptionSuspendedFlag','Error Encountered');
	}
	
	// log script execution time
	var t2 = new Date();
	var dif = t1.getTime() - t2.getTime();
	var Seconds_from_T1_to_T2 = dif / 1000;
	var runtime = Math.abs(Seconds_from_T1_to_T2);
	nlapiLogExecution('DEBUG','*** Script Runtime ***','Runtime in Seconds: ' + runtime);
}


function handleChargeHoldOnTerminate(){
	// log script start time
	var t1 = new Date();
	
	var context = nlapiGetContext();
	var chargeholdscriptid = context.getSetting('SCRIPT', 'custscript_chargeholdscriptid');
	var chargeholddepid = context.getSetting('SCRIPT', 'custscript_chargeholddepid');

	try{
		var psubitemid = nlapiGetRecordId();
		var psubstat = nlapiLookupField('customrecord_sb_subscription_item', psubitemid, 'custrecord_sb_sbitem_status');

		if( psubstat == 7 ){
			nlapiLogExecution('DEBUG','Handling Charges on hold for Terminated Subs Item ' + psubitemid, 'Scheduling script [NS] Put Old Charges on Hold');
			_updateScriptParam('run_customscript_putchrg_hold','1');
			nlapiScheduleScript(chargeholdscriptid, chargeholddepid);
		}	
	}catch(e){
		nlapiLogExecution('DEBUG','handleChargeHoldOnTerminate','Error Encountered');
	}
	
	// log script execution time
	var t2 = new Date();
	var dif = t1.getTime() - t2.getTime();
	var Seconds_from_T1_to_T2 = dif / 1000;
	var runtime = Math.abs(Seconds_from_T1_to_T2);
	nlapiLogExecution('DEBUG','*** Script Runtime ***','Runtime in Seconds: ' + runtime);
}
