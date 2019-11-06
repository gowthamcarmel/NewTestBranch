// enhancement to automate running of this script

function putEmOnHold()
{

	var runParam = _lookupScriptParam('run_customscript_putchrg_hold');
	nlapiLogExecution('DEBUG', 'Checking run parameter...', runParam);

	if( runParam == '1'){
		var context = nlapiGetContext();
		var allDone = 199;

		var charges = nlapiSearchRecord('charge', 'customsearch_nsps_charges_hold');
		if (charges)
		{
			for (var i = 0; i < charges.length; i++)
			{
				nlapiLogExecution('debug', 'putting charge on hold', charges[i].getId());
				var theCharge = nlapiLoadRecord('charge', charges[i].getId());
				theCharge.setFieldText('stage', 'Hold');
				theCharge.setFieldValue('custrecord_sb_sc_legacy', 'T');
				var chargeId = nlapiSubmitRecord(theCharge);		

				//Reschedule script
				var intRemainingUsage = context.getRemainingUsage();
				nlapiLogExecution('debug', 'Remaining Usage = ', intRemainingUsage);

				if (intRemainingUsage < allDone)
				{
					var stStatus = nlapiScheduleScript(nlapiGetContext().getScriptId(),nlapiGetContext().getDeploymentId());
					nlapiLogExecution('debug', 'Had to reschedule.  Rescheduled script status: ' + stStatus);
					return;
				}
			}
		}
		else
		{
			nlapiLogExecution('debug', 'no charges to put on hold.');
		}
		_updateScriptParam('run_customscript_putchrg_hold','0');
	}
}