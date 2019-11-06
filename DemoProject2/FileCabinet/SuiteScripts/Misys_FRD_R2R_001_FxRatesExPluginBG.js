/*
$Archive: /Misys/Misys_FRD_R2R_001_FxRatesExPluginBG.js $
$Author: Ken Woodhouse $
$Date: 4/09/19 18:51 $

$Modtime: 4/09/19 18:47 $
$Revision: 1 $
*/
var Utils = Utils||{};
Utils.isEmpty = function(f) {return (f==null||f=='');};
Utils.noNull = function(f) {return f==null?'':f;};
Utils.toFloat = function(s) {var f = parseFloat(s);return isNaN(f)?0:f;}
Utils.toInt = function(s) {var f = parseInt(s,10);return isNaN(f)?0:f;}
Utils.exInfo = function(ex)
{
	var info = '';
	if(ex instanceof nlobjError)
	{
		info = ex.getDetails();
		if(info==null)
			info = ex.code;
	}
	else if(ex!=null&&ex.message!=null)
		info = ex.message;
	return info;
};
// yield if threshold reached
Utils.checkGovenance = function(log,threshold)
{
	if(log.useAlerts)
		return;

	var context = nlapiGetContext();
	if( context.getRemainingUsage() < threshold )
	{
		var state = nlapiYieldScript();
		if( state.status == 'FAILURE')
		{
			log.error("Failed to yield script, exiting: Reason = "+state.reason + " / Size = "+ state.size);
			throw "Failed to yield script";
		} 
		else if ( state.status == 'RESUME')
			log.debug("Resuming script because of " + state.reason+".  Size = "+ state.size);
	}
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

//  Log
function Log(title)
{
	this.title = title;
	this.useAlerts = false;
}
// sends a debug message to log device
Log.prototype.debug = function(msg)
{
	var mode = 'DEBUG';
	if(this.useAlerts)
		alert(this.title+'<'+mode+'>:\n'+msg);
	else
		nlapiLogExecution(mode,this.title,msg);
}
// sends an error message to the log device
Log.prototype.error = function(msg)
{
	var mode = 'ERROR';
	if(this.useAlerts)
		alert(this.title+'<'+mode+'>:\n'+msg);
	else
		nlapiLogExecution(mode,this.title,msg);
}
// sends email
Log.prototype.sendEmail = function(fromID,toAddr,subj,body)
{
	if(this.useAlerts)
		alert('Email from: '+fromID+'\nto: '+toAddr+'\nSubject: '+subj+'\n\n'+body+'\n');
	else
		nlapiSendEmail(fromID,toAddr,subj,body,null,null,null,null);
}

// Report
function Report(title)
{
	this.title = title;
	this.notes = new Array();
}
// append a line to the report
Report.prototype.addNote = function(txt)
{
	this.notes.push(txt);
}
// append indented line to report
Report.prototype.subNote = function(txt)
{
	this.notes.push(' > '+txt);
}
// add a new line
Report.prototype.newLine = function() {this.notes.push('');}

// output report with specified line terminator
Report.prototype.compose = function(eol)
{
	var str = this.title+':'+eol+eol;
	for(var i=0;i<this.notes.length;i++)
		str+=this.notes[i]+eol;
	return str;
}

// subsidiary currency cache
function CC(log,report)
{
    log.debug('loading currency cache');
    report.subNote('Currency cache');

	var hits = nlapiSearchRecord('subsidiary',null,null,new nlobjSearchColumn('currency'));

	this.map = {};
	if(hits)
	{
		for(var i=0;i<hits.length;i++)
		{
			var h = hits[i];
			this.map[h.getId()] = Utils.noNull(h.getValue('currency'));
		}
	}	
}
// resolve and return currency
CC.prototype.resolve = function(subID)
{
	return this.map[subID];
}

// period rates cache
function PRC(periodID,log,report)
{
	this.periodID = periodID;
	this.hits = null;

    log.debug('loading accounting period rates cache');
    report.subNote('Accounting Period Rates cache');

	if(periodID)
	{
		var c = [
			new nlobjSearchColumn('custrecord_er_average_exchange_rate'),
			new nlobjSearchColumn('custrecord_er_balance_sheet_rate'),
			new nlobjSearchColumn('custrecord_er_reporting_currency'),
			new nlobjSearchColumn('custrecord_er_functional_currency')
			];

		this.hits = nlapiSearchRecord('customrecord_er_period_exchange_rate',null,
						new nlobjSearchFilter('custrecord_er_accounting_period',null,'is',periodID),c);
	}
}
// return rates
PRC.prototype.getRates = function(fromCurID,toCurID)
{
	if(fromCurID == null || toCurID == null)
		return null;

	if(fromCurID == toCurID)
		return {average:1.0,current:1.0};

	if(this.hits)
	{
		for(var i=0;i<this.hits.length;i++)
		{
			var h = this.hits[i];
			if(fromCurID == h.getValue('custrecord_er_functional_currency') && toCurID == h.getValue('custrecord_er_reporting_currency'))
				return {average: Utils.noNull(h.getValue('custrecord_er_average_exchange_rate')),
							current: Utils.noNull(h.getValue('custrecord_er_balance_sheet_rate'))};
		}
	}
	return null;
}

// consolidate exchange rate
function CER(sr)
{
	this.id = sr.getId();
	this.fromCurrency = sr.getValue('fromcurrency');
	this.fromSubsidiaryID = sr.getValue('internalid','fromsubsidiary');
	this.fromSubsidiary = sr.getValue('fromsubsidiary');
	this.toCurrency = sr.getValue('tocurrency');
	this.toSubsidiaryID = sr.getValue('internalid','tosubsidiary');
	this.toSubsidiary = sr.getValue('tosubsidiary');
}
// update consolidated rates 
CER.prototype.updateExchangeRates = function(log,report,cc,prc)
{
	var rates = prc.getRates(cc.resolve(this.fromSubsidiaryID),cc.resolve(this.toSubsidiaryID));
	
	if(rates)
	{
		try
		{
			this.rates = rates;
			nlapiSubmitField('consolidatedexchangerate',this.id,['averagerate','currentrate'],[rates.average,rates.current]);
		}
		catch(ex)
		{
			var eMsg = Utils.exInfo(ex);
			var title = 'failed to update Consolidated Exchange Rate record: id = '+this.id;
			
			log.error(title+' : '+eMsg);
			
			report.newLine();
			report.addNote(title);
			report.subNote('From subsidiary: '+this.fromSubsidiary);
			report.subNote('From currency: '+this.fromCurrency);
			report.subNote('To subsidiary: '+this.toSubsidiary);
			report.subNote('To currency: '+this.toCurrency);

			report.subNote(eMsg);
		}
	}
}

// run manager
function RunMgr(log,report,periodID)
{
	this.periodID = periodID;
	this.list = new Array(); // consolidated exchange rates

	// initialise caches
	report.addNote('Initialising Caches');
    this.cc = new CC(log,report); // currency cache
	this.prc = new PRC(periodID,log,report); // period rates cache
	report.newLine();
}

// acquire consolidated exchange rates
RunMgr.prototype.acquireExchgRates = function(log,report)
{
	var lastID = 0;
	var noMorePages = false;
	var MAX_PER_PAGE = 1000; // max search records per page
	
	log.debug('acquiring consolidated exchange rates');
	report.addNote('Acquiring Consolidated Exchange Rates');

    var c = [
        (new nlobjSearchColumn('internalid')).setSort(false),
        new nlobjSearchColumn('fromcurrency'),
		new nlobjSearchColumn('internalid','fromsubsidiary'),
		new nlobjSearchColumn('fromsubsidiary'),
        new nlobjSearchColumn('tocurrency'),
		new nlobjSearchColumn('internalid','tosubsidiary'),
		new nlobjSearchColumn('tosubsidiary')
    ];

	do
	{
        var f = [
            new nlobjSearchFilter('internalidnumber',null,'greaterthan',lastID),
			new nlobjSearchFilter('period',null,'is',this.periodID),
			new nlobjSearchFilter('isderivedrate',null,'is','F')
        ];

		var srs = nlapiSearchRecord('consolidatedexchangerate',null,f,c);
        var count = (srs == null) ? 0 : srs.length;
        
        noMorePages = (count < MAX_PER_PAGE);
		if(!noMorePages)
			lastID = srs[MAX_PER_PAGE-1].getId();

		for(var i=0;i<count;i++)
		{
            var sr = srs[i];
            this.list.push(new CER(sr));
		}
    } while(!noMorePages);

    log.debug(this.list.length+' consolidate exchange rates(s) found');    
}

// update consolidated rates 
RunMgr.prototype.updateExchangeRates = function(log,report)
{
	var msg = 'Updating exchange rates';
	
	log.debug(msg);
	report.addNote(msg);

	for(var i=0;i<this.list.length;i++)
	{
		Utils.checkGovenance(log,100);
		this.list[i].updateExchangeRates(log,report,this.cc,this.prc);
	}
}

//===================
// SCRIPT ENTRY POINT:
//===================
function consolidateFxRates(type)
{
	var eol = '<br />';
	var cx = nlapiGetContext();
    var adminID = cx.getSetting('SCRIPT','custscript_cfx_admin');
    var userID = cx.getSetting('SCRIPT','custscript_cfx_user');
    var periodID = cx.getSetting('SCRIPT','custscript_cfx_period');
    
    var log = new Log('Fx Rate Consolidation');
    var report = new Report('Fx Rate Consolidation Report');
	var runMgr = null;

	try 
	{
		// test only
		if(log.useAlerts)
		{
            userID = adminID = cx.getUser();
            periodID = 327;
			eol = '\n';
		}
		
		// validation
		if(Utils.isEmpty(adminID))
			throw nlapiCreateError('CFX_EX','no Administrator specified',true);

		if(Utils.isEmpty(userID))
            throw nlapiCreateError('CFX_EX','no User specified',true);
            
        if(Utils.isEmpty(periodID))
            throw nlapiCreateError('CFX_EX','no Accounting Period specified',true);
           
        // validate user permissions
        if(!Utils.isValidUser(userID))
            throw nlapiCreateError('CFX_EX','User does not have permission to perform calculations on consolidated exchange rates',true);           

		// process data
		runMgr  = new RunMgr(log,report,periodID);
		runMgr.acquireExchgRates(log,report);
		runMgr.updateExchangeRates(log,report);

		// send report
		report.addNote('');
		report.addNote('Processing completed');
		report.addNote('');
		log.sendEmail(adminID,userID,report.title,report.compose(eol));       
	}
	catch(ex)
	{
		// set status: failed
		var exMsg = Utils.exInfo(ex);
		var errMsg = 'fatal error: '+exMsg;

		report.addNote('');
		report.addNote('FATAL ERROR: processing terminated...');
		report.subNote(exMsg);
		report.addNote('');

		log.sendEmail(adminID,adminID,report.title+': FATAL ERROR',report.compose(eol),null,null);
		throw nlapiCreateError('CFX_EX','run terminated with errors',true);
	}
	finally
	{
		log.debug('processing completed');
	}
}

function test() {consolidateFxRates('DBG');}
