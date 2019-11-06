/*
$Archive: /Misys/Misys_FRD_L2C_014_3rdPartyOutputBG.js $
$Author: Ken Woodhouse $
$Date: 20/04/15 9:33 $

$Modtime: 20/04/15 9:26 $
$Revision: 6  0v3 MC - added 3pp fields jan16$
*/

// send PDF 3rd Party Notifications in bulk mode
function pdf3rdPartyBG(type)
{
	var log = new Log('3rd-PARTY-EMAILS');
	var context = nlapiGetContext();
	var adminID = context.getSetting('SCRIPT','custscript_3rd_party_email_admin');
	var testMode = context.getSetting('SCRIPT','custscript_3rd_party_test_mode')=='T';
	var senderID = context.getSetting('SCRIPT','custscript_3rd_party_email_from');
	var templateID = context.getSetting('SCRIPT','custscript_3rd_party_template');
	var emailTemplateID = context.getSetting('SCRIPT','custscript_3rd_party_email_template'); 
	var encStr = context.getSetting('SCRIPT','custscript_3rd_party_selections');
	var report = new Report('3rd Party Notification Report');
	var workload = null;

	try 
	{
		// test only
		if(log.useAlerts)
		{
			senderID = adminID = context.getUser();
			testMode = true;
			templateID = '80738';
			emailTemplateID = '80841';
			encStr = '{1060437:[2,3],1060539:[1,2,3]}';
		}
		if(Utils.isEmpty(adminID))
			throw nlapiCreateError('3RD_PARTY_EX','no Administrator specified',true);

		if(Utils.isEmpty(senderID))
			throw nlapiCreateError('3RD_PARTY_EX','no Sender specified',true);

		if(Utils.isEmpty(templateID))
			throw nlapiCreateError('3RD_PARTY_EX','no PDF template specified',true);

		if(Utils.isEmpty(emailTemplateID))
			throw nlapiCreateError('3RD_PARTY_EX','no email template specified',true);

		var workload  = new Workload(log,report,senderID,templateID,emailTemplateID,encStr);
		while(workload.moreData()) // loop until done
		{
			for(var k=0;k<workload.count();k++)
				workload.process(log,report,adminID,k,testMode); // process
		}
		// send report
		log.debug('3rd Party Notifications completed');
		report.addNote('');
		report.addNote('3rd Party Notifications completed');
		report.addNote('');
		log.sendEmail(senderID,adminID,report.title,report.compose('\n'),null,null,{entity:adminID}); 
		//log.sendEmail(senderID,adminID,report.title,report.compose('\n'));
	}
	catch(ex)
	{
		// set status: failed
		var exMsg = Utils.exInfo(ex);
		var errMsg = 'fatal error: '+exMsg;

		log.error(errMsg);
		report.addNote('');
		report.addNote('FATAL ERROR: processing terminated...');
		report.addNote(' > '+exMsg);
		report.addNote('');
		log.sendEmail(senderID,adminID,report.title+': FATAL ERROR',report.compose('\n'));

		throw nlapiCreateError('3RD_PARTY_EX','run terminated with errors',true);
	}
	finally
	{
		log.debug('Processing completed');
	}
}
// notification control
function NC(encStr)
{
	this.poList = new Array();
	try
	{
		if(!Utils.isEmpty(encStr))
		{
			eval('this.encData = '+encStr);
			for(var poID in this.encData)
				this.poList.push(poID);
		}
		else
			this.encData = null;
	}
	catch(ex)
	{
		throw nlapiCreateError('3RD_PARTY_EX','invalid selection data specified: '+encStr,true);
	}
}
// remove po from list
NC.prototype.skip = function(poID)
{
	var list = new Array();
	for(var i=0;i<this.poList.length;i++)
	{
		if(this.poList[i]==poID)
		{
			this.poList.splice(i,1);
			return;
		}
	}
}
// proposition: PO line selected
NC.prototype.selected = function(poID,lineID)
{
	var lineIDs = this.encData[poID];
	if(lineIDs)
	{
		for(var i=0;i<lineIDs.length;i++)
		{
			if(lineIDs[i]==lineID)
				return true;
		}
	}
	return false;
}
// return array of line ids for PO
NC.prototype.lineIDs = function(poID)
{
	var lines = this.encData[poID];
	if(lines)
		return lines;
	return new Array();
}
// initialisation control
function Workload(log,report,senderID,templateID,emailTemplateID,encStr)
{
	this.noMorePages = false;
	this.errCnt = 0; // track errors
	this.senderID = senderID;
	this.runDateStr = nlapiDateToString(new Date());
	this.nc = new NC(encStr);
	
	if(log.useAlerts)
	{
		this.content = 
		'To: @@TO_NAME_HERE@@\n'+
		'From: @@FROM_NAME_HERE@@\n'+
		'Date: @@RUN_DATE_HERE@@\n'+
		'Product: @@PRODUCT_HERE@@\n'+
		'PO Number:	@@PO_NUMBER_HERE@@\n'+
		'Body: @@BODY_HERE@@';
	}
	else
	{
		var templateFile = nlapiLoadFile(templateID);
		this.content = templateFile.getValue();
	}
	this.content = this.content.replace(/@@MISYS_LOGO_HERE@@/,nlapiEscapeXML(MS.LOGO_URL)); // add logo
	this.emailTemplateID = emailTemplateID;
}
// proposition: more data to process
Workload.prototype.moreData = function()
{
	var MAX_PER_PAGE = 1000; // max search records per page

	if(this.nc.poList.length==0)
		this.noMorePages = true;

	if(this.noMorePages) // terminate page loads
		return false;

	// fetch line items
	var f = [
			new nlobjSearchFilter('mainline',null,'is','F'),
			new nlobjSearchFilter('taxline',null,'is','F'),
			new nlobjSearchFilter('fxamount',null,'greaterthan',0),
			new nlobjSearchFilter('custbody_3pp_po',null,'is','T'),
			new nlobjSearchFilter('approvalstatus',null,'is','2'), // status: 2=Approved
			new nlobjSearchFilter('custcol_3pp_notify_vendor',null,'is','T'),
			new nlobjSearchFilter('custcol_3pp_notification_sent',null,'is','F'),
			new nlobjSearchFilter('mainline','custcol_3pp_source_transaction','is','T'),
			new nlobjSearchFilter('internalid',null,'anyof',this.nc.poList)
		];

	var c = [

			// vendor fields
			(new nlobjSearchColumn('internalid')).setSort(false),
			new nlobjSearchColumn('internalid','vendor'),
			new nlobjSearchColumn('altname','vendor'),
			new nlobjSearchColumn('legalname','vendor'),			
				
			// PO fields
			new nlobjSearchColumn('tranid'),
			new nlobjSearchColumn('subsidiary'),
			new nlobjSearchColumn('class'),
			new nlobjSearchColumn('custbody_sublegalname'),
			new nlobjSearchColumn('custcol_3pp_disc_percent'),
			new nlobjSearchColumn('custcol_3pp_vendor_milestone'),
			new nlobjSearchColumn('custcol_licence_basis'),
			new nlobjSearchColumn('currency'),
			new nlobjSearchColumn('fxamount'),
			new nlobjSearchColumn('line'),
			new nlobjSearchColumn('linesequencenumber'),
			//new nlobjSearchColumn('memomain'),
			new nlobjSearchColumn('custcol_misysstartdate'),
			new nlobjSearchColumn('custcol_misysenddate'),
			new nlobjSearchColumn('custcol_3pp_client'),
			new nlobjSearchColumn('custcol_3pp_asset_location'),
			//new nlobjSearchColumn('custcol_3pp_ref'),
			new nlobjSearchColumn('custcol_3pp_asset_environ'),
			new nlobjSearchColumn('custcol_3pp_legacy_ref'),

			// item fields
			new nlobjSearchColumn('name','item'),
			new nlobjSearchColumn('salesdescription','item'),
			new nlobjSearchColumn('purchasedescription','item'),
			new nlobjSearchColumn('purchasedescription','item'),

			// SO fields
			new nlobjSearchColumn('entity','custcol_3pp_source_transaction'),
			new nlobjSearchColumn('custbody_misysref','custcol_3pp_source_transaction'),	
			new nlobjSearchColumn('custbody_transactioncategory','custcol_3pp_source_transaction')				
		];

	var hits = nlapiSearchRecord('purchaseorder',null,f,c);

	this.vList = new Array();
	var count = (hits==null)?0:hits.length;
	this.noMorePages = (count<MAX_PER_PAGE);

	var lastNF = null;
	for(var i=0;i<count;i++)
	{
		var sr = hits[i];
		var poID = sr.getId();
		var lineID = Utils.srValue(sr,'line');
		
		if(this.nc.selected(poID,lineID))
		{
			if(lastNF==null||lastNF.poID!=poID)
			{
				lastNF = new NF(poID,sr);
				this.vList.push(lastNF);
			}
			else
				lastNF.add(sr);
		}
	}
	// drop last entry if on a page boundary
	if(!this.noMorePages)
		this.vList.pop();

	return (this.vList.length>0);
}
// return notification count
Workload.prototype.count = function()
{
	return this.vList.length;
}
// notification item
function NI(sr)
{
	this.ref = Utils.srValue(sr,'custbody_misysref','custcol_3pp_source_transaction');
	this.clientName = Utils.srText(sr,'entity','custcol_3pp_source_transaction');
	this.product = Utils.srValue(sr,'salesdescription','item');
	this.licenceType = Utils.srValue(sr,'purchasedescription','item');
	this.licenceBasis = Utils.srValue(sr,'custcol_licence_basis');
	// this.txt3ppClient = Utils.srValue(sr,'custcol_3pp_client'); // 1444959
	this.txt3ppClient = Utils.srText(sr,'custcol_3pp_client'); // 1444959
	//this.txt3ppref = Utils.srValue(sr,'custcol_3pp_ref');
	this.licenceLocation = Utils.srValue(sr,'custcol_3pp_asset_location');
	this.txt3ppAssetenviron = Utils.srValue(sr,'custcol_3pp_asset_environ');
	this.txt3ppLegacyref = Utils.srValue(sr,'custcol_3pp_legacy_ref');
	this.startDateStr = Utils.srValue(sr,'custcol_misysstartdate');
	this.endDateStr = Utils.srValue(sr,'custcol_misysenddate');

	//this.startDateStr = Utils.srValue(sr,'startdate','custcol_3pp_source_transaction');
	//this.endDateStr = Utils.srValue(sr,'enddate','custcol_3pp_source_transaction');

	this.milestone = Utils.srText(sr,'custcol_3pp_vendor_milestone');
	this.discount = Utils.srValue(sr,'custcol_3pp_disc_percent');
	this.currency = Utils.srText(sr,'currency');
	this.amountStr = Utils.srValue(sr,'fxamount');
	this.amount = Utils.toFloat(this.amountStr);
	//this.memo = Utils.srValue(sr,'memomain');
	this.category = Utils.srValue(sr,'custbody_transactioncategory','custcol_3pp_source_transaction');
	this.lineID = Utils.srValue(sr,'line');
	this.lineSeq = Utils.srValue(sr,'linesequencenumber');
	this.desc = Utils.srValue(sr,'purchasedescription','item');

	this.eventNarr = '';
	if(this.category==MS.ST_ILF)
		this.eventNarr = this.milestone;
	else if(this.category==MS.ST_RLF)
	{
		this.eventNarr = 'Maintenance';
		if(!Utils.isEmpty(this.startDateStr)&&!Utils.isEmpty(this.endDateStr))
			this.eventNarr+=' '+this.startDateStr+' to '+this.endDateStr;
	}
	else
		this.eventNarr = this.desc;

/*
	if(this.memo=='ILF')
		this.eventNarr = this.milestone;
	else if(this.memo=='Maintenance')
	//else if(this.memo=='RLF')
	{
		this.eventNarr = 'Maintenance';
		if(!Utils.isEmpty(this.startDateStr)&&!Utils.isEmpty(this.endDateStr))
			this.eventNarr+=' '+this.startDateStr+' to '+this.endDateStr;
	}
*/
}
// notification
function NF(poID,sr)
{
	this.poID = poID;
	this.poNumber = Utils.srValue(sr,'tranid');
	this.vendorID =  Utils.srValue(sr,'internalid','vendor');
	//this.subsName = Utils.lastPart(Utils.srText(sr,'subsidiary'),':');
	this.subsName = Utils.srValue(sr,'custbody_sublegalname');
	this.prodName = Utils.lastPart(Utils.srText(sr,'class'),':');
	this.companyName = Utils.srValue(sr,'altname','vendor');
	this.legalName = Utils.srValue(sr,'legalname','vendor');
//	this.memo = Utils.srValue(sr,'memomain');
	this.category = Utils.srValue(sr,'custbody_transactioncategory','custcol_3pp_source_transaction');

	this.contacts = new Array();
/*
	this.contactID = '';
	this.contactName = '';
	this.contactEmail = '';
*/
	this.items = new Array();
	this.items.push(new NI(sr));
}
// return total
NF.prototype.total = function()
{
	var total = 0;
	for(var i=0;i<this.items.length;i++)
		total+=this.items[i].amount;
	return total;
}
// add another item
NF.prototype.add = function(sr)
{
	this.items.push(new NI(sr));
}
// mark PO lines as sent
NF.prototype.markSent = function(log,report,testMode)
{
	var msg = 'marking notification as sent';

	log.debug(msg);
	report.subNote(msg);
	try
	{
		log.debug('loading: '+this.poNumber);
		this.rec = nlapiLoadRecord('purchaseorder',this.poID);
		this.lnCnt = this.rec.getLineItemCount('item');

		for(var i=0;i<this.items.length;i++)
		{
			var ni = this.items[i];

			if(ni.lineSeq>this.lnCnt)
				throw nlapiCreateError('3RD_PARTY_EX','invalid sequence number',true);

			this.rec.selectLineItem('item',ni.lineSeq);
			if(this.rec.getCurrentLineItemValue('item','line')!=ni.lineID)
				throw nlapiCreateError('3RD_PARTY_EX','line # '+ni.lineSeq+' no longer has ID #'+ni.lineID,true);

			this.rec.setCurrentLineItemValue('item','custcol_3pp_notification_sent','T');
			this.rec.commitLineItem('item');
		}
		log.debug('updating: '+this.poNumber);
		if(!testMode)
			nlapiSubmitRecord(this.rec,false,true);
	}
	catch(ex)
	{
		var eMsg = 'failed to update '+this.poNumber+ ': '+Utils.exInfo(ex);
		log.error(eMsg);
		report.subNote(eMsg);
		throw nlapiCreateError('3RD_PARTY_EX',eMsg,true);
	}
}

// process next notification
Workload.prototype.process = function(log,report,adminID,k,testMode)
{
	var minUnits = 100;
	if(!log.useAlerts)
		Utils.checkGovenance(log,minUnits);	// suspend if insufficient units
	
	var nf = this.vList[k]; // next notification

	try
	{
		var msg = 'Processing: '+nf.poNumber;
		report.addNote(msg); // po
		log.debug(msg);

/*
		// check for ILF/RLF signature
		if(Utils.isEmpty(nf.memo)||(nf.memo!='ILF'&&nf.memo!='Maintenance'))
		//if(Utils.isEmpty(nf.memo)||(nf.memo!='ILF'&&nf.memo!='RLF'))
			throw nlapiCreateError('3RD_PARTY_EX','invalid memo setting: must be ILF or RLF for notifications',true);
*/
		// fetch contact details
		var f = [
				new nlobjSearchFilter('internalid','vendor','is',nf.vendorID),
			];

		var c = [
				new nlobjSearchColumn('entityid'),
				new nlobjSearchColumn('email')
			];

		var contacts = nlapiSearchRecord('contact',null,f,c);
		if(contacts)
		{
			for(var i=0;i<contacts.length;i++)
			{
				var contact = contacts[i];
				var contactID = contact.getId();
				var contactName = Utils.srValue(contact,'entityid');
				var contactEmail = Utils.srValue(contact,'email');

				if(Utils.isEmpty(contactEmail))
					throw nlapiCreateError('3RD_PARTY_EX','vendor contact ('+contactName+') has no email address',true);

				nf.contacts.push({id:contactID,name:contactName,email:contactEmail});
			}
/*
			if(contacts.length>1)
				throw nlapiCreateError('3RD_PARTY_EX','multiple contacts found on vendor record',true);
			
			var contact = contacts[0];

			nf.contactID = contact.getId();
			nf.contactName = Utils.srValue(contact,'entityid');
			nf.contactEmail = Utils.srValue(contact,'email');

			if(Utils.isEmpty(nf.contactEmail))
				throw nlapiCreateError('3RD_PARTY_EX','vendor contact has no email address',true);
*/
		}
		else
			throw nlapiCreateError('3RD_PARTY_EX','no contact details found on vendor record',true);

		// create PDF
		var doc = new Doc(this.content);	
		doc.createBFO(this.runDateStr,nf);

		// prepare email
		if(log.useAlerts)
		{
			var text = doc.output(nf.poNumber,'text');
			log.debug(text);

			var toList = new Array();
			for(var i=0;i<nf.contacts.length;i++)
				toList.push(nf.contacts[i].email);

			var toStr = toList.toString();
			log.debug('sending email to: '+toStr);

			nf.markSent(log,report,testMode);
		}
		else
		{	
			//CURRENT 1===========    var merge = nlapiMergeRecord(this.emailTemplateID,'contact',nf.contacts[0].id,'purchaseorder',nf.poID); // use first contact
			//CURRENT 1===========    //var merge = nlapiMergeRecord(this.emailTemplateID,'contact',nf.contactID,'purchaseorder',nf.poID);
			
			//UPDATED 1===========START
			var emailMerger = nlapiCreateEmailMerger(this.emailTemplateID); 
			emailMerger.setEntity('contact', nf.contacts[0].id);
			emailMerger.setTransaction(nf.poID);
			var mergeResult = emailMerger.merge(); 
			var emailBody = mergeResult.getBody(); 
			//UPDATED 1===========END
			
			var eLinks = {transaction:nf.poID};

			var toList = new Array();
			for(var i=0;i<nf.contacts.length;i++)
				toList.push(nf.contacts[i].email);

			var toStr = toList.toString();
			log.debug('sending email to: '+toStr);

			//CURRENT 2===========START    
			//nlapiSendEmail(this.senderID,toStr,'Royalty Notification - '+
				//nf.poNumber,merge.getValue(),null,null,eLinks,doc.output(nf.poNumber)); 
			//CURRENT 2===========END
			
			//UPDATED 2===========START	   
			nlapiSendEmail(this.senderID,toStr,'Royalty Notification - '+
				nf.poNumber,emailBody,null,null,eLinks,doc.output(nf.poNumber));
			//UPDATED 2===========END
			
			nf.markSent(log,report,testMode);
			
/*
			log.debug('sending email to: '+nf.contactEmail);
			nlapiSendEmail(this.senderID,nf.contactEmail,'Royalty Notification - '+
				nf.poNumber,merge.getValue(),null,null,eLinks,doc.output(nf.poNumber)); 
			nf.markSent(log,report,testMode);
*/
		}
	}
	catch(ex)
	{
		var eMsg = Utils.exInfo(ex);

		log.error(eMsg);
		report.addNote(' > ERROR: '+eMsg);
		this.nc.skip(nf.poID);
	}
}
// doc control
function Doc(content,dbg)
{
	this.dbg = dbg;
	this.content = content;
}
// create BFO document
Doc.prototype.createBFO = function(runDateStr,nf)
{
	this.content = this.content.replace(/@@TO_NAME_HERE@@/,nlapiEscapeXML(nf.legalName));
	//this.content = this.content.replace(/@@TO_NAME_HERE@@/,nlapiEscapeXML(nf.contactName));
	this.content = this.content.replace(/@@FROM_NAME_HERE@@/,nlapiEscapeXML(nf.subsName));
	this.content = this.content.replace(/@@RUN_DATE_HERE@@/,nlapiEscapeXML(runDateStr));
	this.content = this.content.replace(/@@PO_NUMBER_HERE@@/,nlapiEscapeXML(nf.poNumber));
		//html+='<tr><td class="item">REMOVED direct lookup Client:</td><td>'+nlapiEscapeXML(ni.clientName)+'</td></tr>\n';

	var html = '';
	for(var i=0;i<nf.items.length;i++)
	{
		var ni = nf.items[i];

		html+='<tr><td><b>'+nlapiEscapeXML(ni.ref)+'</b></td><td></td><td></td><td width="18mm"></td><td width="10mm"></td></tr>\n';
		html+='<tr><td class="item">Client:</td><td>'+nlapiEscapeXML(ni.txt3ppClient)+'</td></tr>\n';
		html+='<tr><td class="item">Location:</td><td>'+nlapiEscapeXML(ni.licenceLocation)+'</td></tr>\n';
		html+='<tr><td class="item">Environment:</td><td>'+nlapiEscapeXML(ni.txt3ppAssetenviron )+'</td></tr>\n';
		html+='<tr><td class="item">Misys Product:</td><td>'+nlapiEscapeXML(ni.product)+'</td></tr>\n';
		html+='<tr><td class="item">Licence Type:</td><td>'+nlapiEscapeXML(ni.licenceType)+'</td></tr>\n';
		html+='<tr><td class="item">Licence Basis:</td><td>'+nlapiEscapeXML(ni.licenceBasis)+'</td></tr>\n';
		html+='<tr><td class="item">Legacy Ref:</td><td>'+nlapiEscapeXML(ni.txt3ppLegacyref)+'</td></tr>\n';
		html+='<tr><td class="item">Event:</td><td>'+nlapiEscapeXML(ni.eventNarr)+'</td><td>'+
			nlapiEscapeXML(ni.discount)+'</td><td align="right">'+ni.amountStr+'</td><td>'+nlapiEscapeXML(ni.currency)+'</td></tr>\n';

		html+='<tr class="divider"><td colspan="5"></td></tr>\n';
	}
	if(nf.items.length>1)
	{
		var totalStr = nlapiFormatCurrency(nf.total().toFixed(2));
		html+='<tr><td colspan="3" align="right"><p style="padding-left: 58mm;" >Total</p></td><td align="right">'+
			totalStr+'</td><td>'+nlapiEscapeXML(nf.items[0].currency)+'</td></tr>';
	}
	this.content = this.content.replace(/@@BODY_HERE@@/,html);
}
// return output document
Doc.prototype.output = function(poNumber,dbg)
{
	if(dbg=='text')
		return this.content;

	else if(dbg=='html')
	{
		var hdr = '<!doctype html public "-//w3c//dtd html 4.0 transitional//en">\n<html>\n';
		return (hdr+this.content+'\n</html>\n');
	}
	else // PDF
	{
		var hdr = '<?xml version="1.0"?>\n<!DOCTYPE pdf PUBLIC "-//big.faceless.org//report" "report-1.1.dtd">\n<pdf>\n';
		var pdf = nlapiXMLToPDF(hdr+this.content+'\n</pdf>\n');

		pdf.setName('Royalty Notification - '+poNumber+'.pdf');
		return pdf;
	}
}
function test()
{
	pdf3rdPartyBG('test');
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
// output report with specified line terminator
Report.prototype.compose = function(eol)
{
	var str = this.title+':'+eol+eol;
	for(var i=0;i<this.notes.length;i++)
		str+=this.notes[i]+eol;
	return str;
}
//  Log
function Log(title)
{
	this.title = title;
	this.useAlerts = nlapiGetContext().getExecutionContext()=='userinterface';
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
// utilities
var Utils = {}; // resolve namespace clashes
Utils.isEmpty = function(f) {return (f==null||f=='');}
Utils.noNull = function(f) {return f==null?'':f;}
Utils.toInt = function(s) {var f = parseInt(s,10);return isNaN(f)?0:f;}
Utils.toFloat = function(s) {var v = parseFloat(s); return isNaN(v)?0:v;}
Utils.srValue = function(sr,fld,join) { return sr?(Utils.noNull(sr.getValue(fld,(join?join:null)))):'';}
Utils.srText = function(sr,fld,join) { return sr?(Utils.noNull(sr.getText(fld,(join?join:null)))):'';}
Utils.trim = function(str)
{
	var re = /\s*\b(.*)\b\s*/;
	if (re.test(str))
	{
		re.exec(str);
		return RegExp.$1;
	}
	return '';
}
Utils.lastPart = function(s,sep)
{
	if(Utils.isEmpty(s))
		return '';
	var p = s.split(sep);
	return Utils.trim(p[p.length-1]);
}
Utils.checkGovenance = function(log,governanceThreshold)
{
	var context = nlapiGetContext();
	if( context.getRemainingUsage()<governanceThreshold )
	{
		var state = nlapiYieldScript();
		if( state.status=='FAILURE')
		{
			log.error("Failed to yield script, exiting: Reason = "+state.reason + " / Size = "+ state.size);
			throw "Failed to yield script";
		} 
		else if ( state.status=='RESUME' )
			log.debug("Resuming script because of " + state.reason+".  Size = "+ state.size);
	}
}
Utils.exInfo = function(ex)
{
	var info = '';
	if(ex instanceof nlobjError)
		info = ex.getDetails();// + '\n'+ex.getStackTrace();
	else if(ex!=null&&ex.message!=null)
		info = ex.message;
	return info;
}
 