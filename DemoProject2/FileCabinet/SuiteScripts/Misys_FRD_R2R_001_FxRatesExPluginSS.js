/*
$Archive: /Misys/Misys_FRD_R2R_001_FxRatesExPluginSS.js $
$Author: Ken Woodhouse $
$Date: 5/09/19 15:23 $

$Modtime: 5/09/19 14:55 $
$Revision: 1 $
*/

// INITIALISES EXCHANGE RATE CONSOLIDATION TASK

function initConsolidateExchgRates(request,response)
{
    var cx = nlapiGetContext();
    var userID = cx.getUser();   
	var formName = 'Exchange Rate Consolidation';

	if(request.getMethod() == 'GET')
	{
		try
		{
            // validate user
            if(!Utils.isValidUser(userID))
            {
                Utils.showInfoForm(response,formName+' - Error',
                    'User does not have permission to perform calculations on consolidated exchange rates');
            }
            else
            {
                // build GUI
                var form = nlapiCreateForm(formName,false);
                form.setScript('customscript_consolidate_exchg_rates_cl');

                var info = form.addField('custpage_info','longtext','',null,'main');
                info.setDisplayType('inline');
                info.setLayoutType('outsideabove','startrow');
                info.setDefaultValue("<p>&nbsp;</p><p>Select the required posting period then click on the 'Run Consolidation' button to queue the Exchange Rate Consolidation process.</p><p>&nbsp;</p>");

                var ppFld = form.addField('custpage_ppid','select','Posting Period','accountingperiod');
                ppFld.setMandatory(true);
                
                form.addSubmitButton('Run Consolidation');
                response.writePage(form);
            }
		}
		catch(ex)
		{
			Utils.showInfoForm(response,formName+' - Error',
				'An error occurred during form initialisation: <br />&nbsp;<br />&gt; '+Utils.exInfo(ex),null);
		}
	}
	else // POST
	{
		try
		{
			var email = cx.getEmail();
			var ppID = request.getParameter('custpage_ppid');

			if(Utils.isEmpty(ppID))
				throw nlapiCreateError('CFX_EX ','no posting period specified',true);

			var status = nlapiScheduleScript('customscript_consolidate_exchg_rates_bg','customdeploy_consolidate_exchg_rates_bg',{custscript_cfx_user: userID,	custscript_cfx_period: ppID});

			if(status == 'QUEUED')
			{
				Utils.showInfoForm(response,formName,"<p>The Exchange Rate Consolidation processor has been queued. As soon as processing has completed, you will be notified by email on: <i><u>"+email+"</u></i></p>"); 
			}
			else // problems
			{
				if(Utils.isEmpty(status))
					status = 'Processor already active';
				Utils.showInfoForm(response,formName+' - Error','Failed to queue the Exchange Rate Consolidation processor. Status returned: '+status); 
			}
		}
		catch(ex)
		{
			Utils.showInfoForm(response,formName+' - Error','An <b>error</b> occurred while queuing the Exchange Rate Consolidation processor: '+Utils.exInfo(ex));
		}
	}
}
var Utils = {};
Utils.isEmpty = function(f) {return (f==null||f=='');}
Utils.noNull = function(f) {return f==null?'':f;}
Utils.exInfo = function(ex)
{
	var info = '';
	if(ex instanceof nlobjError)
	{
		info = ex.getDetails();
		if(!info&&ex.code!=null)
			info = ex.code;
		// info+='\n'+ex.getStackTrace();
	}
	else if(ex!=null&&ex.message!=null)
		info = ex.message;
	return info;
};
// error handling code
Utils.showInfoForm = function(response,title,msg,goback)
{
	var form = nlapiCreateForm(title,false);

	var info = form.addField('custpage_info','longtext','',null,'main');
	info.setDisplayType('inline');
	info.setDefaultValue(msg);

	if(!Utils.isEmpty(goback))
		form.addButton('custpage_goback','Go Back',goback);
	response.writePage(form);
}
// proposition: user has edit permissions
Utils.isValidUser = function(userID)
{
	var f = [
			new nlobjSearchFilter('custrecord_crp_tr_setup',null,'is',MSFX.SETUP_ID),
			new nlobjSearchFilter('isinactive',null,'is','F'),
			new nlobjSearchFilter('custrecord_crp_employee',null,'is',userID)
		];

	var hits = nlapiSearchRecord('customrecord_consolidated_rates_permiss',null,f,null);
	return hits != null;
}
