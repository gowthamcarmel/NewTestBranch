//create and load triangulated exchange rates
//
// CR 8901	Add Corporate base currency to result file
//

function fxLoadTriangulatedRates(type) 
{
	var additionalRecipients = ',meni.kugler@dh.com,alexandra.razuvayva@dh.com,moran.dagai@dh.com,julian.lak@dh.com,Terresa.Skala@dh.com,Sarah.Quintiliani@dh.com,Ahsan.Ullah@dh.com,Laura.Yu@dh.com,Debbie.Siemens@dh.com,Debra.Hall@dh.com,Jo.Cabusao@dh.com,Carter.Chen@dh.com,Sukaran.Mehta@finastra.com';

	var trID = null;
	try 
	{
		var context = nlapiGetContext();
		var recipientAdds = context.getSetting('SCRIPT','custscript_recipientAdds');
		recipientAdds = recipientAdds + additionalRecipients;
		var senderId = context.getSetting('SCRIPT','custscript_senderId');
		var singleCurID = context.getSetting('SCRIPT','custscript_fx_triang_single_cid2');
		var dateStr = Utils.noNull(context.getSetting('SCRIPT','custscript_fx_triang_eff_date2'));
		var serverOffset = context.getSetting('SCRIPT','custscript_fx_triang_srv_offset2')=='T';
		var todayStr = nlapiDateToString(nlapiAddDays(nlapiAddDays((new Date()),(serverOffset?1:0)),-1));

		if(Utils.isEmpty(dateStr))
			dateStr = todayStr;

		var f = [
				new nlobjSearchFilter('internalid',null,'is',MSFX.SETUP_ID)
			];
		var c = [
				new nlobjSearchColumn('custrecord_ts_corp_base_currency'),
				new nlobjSearchColumn('custrecord_ts_other_base_ids'),
				new nlobjSearchColumn('custrecord_ts_other_base_currencies')
			];

		var hits = nlapiSearchRecord('customrecord_triangulation_setup',null,f,c);
		if(hits)
		{
			var setup = hits[0];
			var corpBaseCurID = setup.getValue('custrecord_ts_corp_base_currency');
			var corpBaseCurStr = setup.getText('custrecord_ts_corp_base_currency');

			if(Utils.isEmpty(corpBaseCurID))
				throw nlapiCreateError('CF_EX','No corporate base currency found on Triangulation Set-up record (id='+MSFX.SETUP_ID+').',true);
			
			var otherBaseCurIDsStr = setup.getValue('custrecord_ts_other_base_ids');
			if(Utils.isEmpty(otherBaseCurIDsStr))
				throw nlapiCreateError('CF_EX','No other base currencies found on Triangulation Set-up record (id='+MSFX.SETUP_ID+').',true);

			eval('var otherBaseCurIDs=['+otherBaseCurIDsStr+'];');
			eval("var otherBaseCurStrs=['"+Utils.noNull(setup.getValue('custrecord_ts_other_base_currencies')).replace(/,/g,"','")+"'];");

			var erm = new ERM(corpBaseCurID,corpBaseCurStr,otherBaseCurIDs,otherBaseCurStrs);
			erm.acquireCorpRates(dateStr); // acquire corporate values

			var csv = Utils.isEmpty(singleCurID)?erm.allRows('\n'):erm.restrictedRows(singleCurID,'\n'); // generate CSV

			var file = nlapiCreateFile('results.csv', 'CSV', csv);

			// Gowthaman
			// file.setFolder('996480');
			// var id = nlapiSubmitFile(file);
			// nlapiLogExecution('DEBUG', 'id :' + id);

			nlapiSendEmail(senderId, recipientAdds, '[]: NETSUITEEXRATES(3861)', 'Attached are the results of your search', null, null, null, file);

			nlapiLogExecution('DEBUG','FX Rates Triangulation CSV File Sent','Email sent to ');
			
			} 
			else
				throw nlapiCreateError('CF_EX','Failed to retrieve Triangulation Set-up data, record ID = '+MSFX.SETUP_ID,true);
	} 
	catch(ex) 
	{
		if(!Utils.isEmpty(trID))
		{
			nlapiLogExecution('DEBUG','Erro Encountered', MSFX.TP_ERROR,Utils.exInfo(ex) );
		}
		throw ex;
	}
	finally
	{
		nlapiLogExecution('DEBUG','FX Triangulation CSV Email','Processing completed');
	}
}

// exchange rate manager
function ERM(corpBaseCurID, corpBaseCurStr, otherBaseCurIDs, otherBaseCurStrs) 
{
	this.dateStr = '';
	this.corpBaseCurID = corpBaseCurID;
	this.corpBaseCurStr = corpBaseCurStr;
	this.otherBaseCurIDs = otherBaseCurIDs;
	this.otherBaseCurStrs = otherBaseCurStrs;
	this.erList = new Array();

	// mod: acquire all currencies
	this.allOtherCurIDs = new Array();
	this.allOtherCurStrs = new Array();

	var hits = nlapiSearchRecord('currency', null, 
	[
		new nlobjSearchFilter('isinactive', null, 'is', 'F'),
		// new nlobjSearchFilter('internalid',null,'noneof',this.corpBaseCurID) // CR 8901
		// //commented to add all currencies USD // CR 8901
	], 
	new nlobjSearchColumn('symbol'));
	if (hits) 
	{
		nlapiLogExecution('DEBUG', 'Chits.length :' + hits.length);
		for (var i = 0; i < hits.length; i++) 
		{
			var h = hits[i];
			var curID = h.getId();

			//if(curID!=this.corpBaseCurID) // CR 8901
			//{ // CR 8901
				this.allOtherCurIDs.push(curID);
				this.allOtherCurStrs.push(Utils.noNull(h.getValue('symbol')));
			//} // CR 8901
		}
	}
}
ERM.epsilon = 0.000000001; // minimum value

//proposition: currency passed is a base currency
ERM.prototype.isBase = function(curID) 
{
	// start CR 8901
	if (curID == 1) // USD internal id returns true
	{
		return true
	} 
	else 
	{
	// End CR 8901
		for (var i = 0; i < this.otherBaseCurIDs.length; i++) 
		{
			if (this.otherBaseCurIDs[i] == curID)
				return true;
		}
		return false;
	} // CR 8901
}

//read corporate rates from NS
ERM.prototype.acquireCorpRates = function(dateStr) 
{
	this.dateStr = dateStr;
	for (var i = 0; i < this.allOtherCurIDs.length; i++) 
	{
		var rateStr = nlapiExchangeRate(this.allOtherCurStrs[i],this.corpBaseCurID,dateStr);
		var rate = Utils.toFloat(rateStr);

		if(rate<ERM.epsilon)
			throw nlapiCreateError('CF_EX','Invalid exchange rate found: '+
				this.allOtherCurStrs[i]+' to '+this.corpBaseCurStr+', rate = '+rateStr,true);
		this.erList.push(rate);
	}
}

//return CSV rows and ratios for all currencies
ERM.prototype.allRows = function(eol) 
{
	var header = 'Date,Base Currency,Other Currency,Exchange Rate' + eol;
	var csv = header;
	var list = new Array();

	// reciprocals first
	for (var i = 0; i < this.allOtherCurIDs.length; i++) 
	{
		var otherCurID = this.allOtherCurIDs[i];

		if (this.isBase(otherCurID)) 
		{
			var otherCurStr = this.allOtherCurStrs[i];
			var rate = 1.0 / this.erList[i];

			list.push({t:otherCurStr,f:this.corpBaseCurStr,r:rate.toFixed(8)});
		}
	}
	// cross terms and reciprocals
	for (var i = 0; i < this.allOtherCurIDs.length; i++) 
	{
		var iCurID = this.allOtherCurIDs[i];
		var iCurStr = this.allOtherCurStrs[i];
		var iToCorp = this.erList[i];

		for(var k=i;k<this.allOtherCurIDs.length;k++)
		{
			var kCurID = this.allOtherCurIDs[k];
			var kCurStr = this.allOtherCurStrs[k];
			var kToCorp = this.erList[k];

			if(i==k&&this.isBase(iCurID)) // rate = 1;
				list.push({t:iCurStr,f:iCurStr,r:(iToCorp/kToCorp).toFixed(8)});

			else // different
			{
				if(this.isBase(kCurID))
					list.push({t:kCurStr,f:iCurStr,r:(iToCorp/kToCorp).toFixed(8)});
				if(this.isBase(iCurID))
					list.push({t:iCurStr,f:kCurStr,r:(kToCorp/iToCorp).toFixed(8)});
			}
		}
	}
	var bySymbols = function(a,b)
	{
		if(a.t==b.t)
		{
			if(a.f==b.f)
				return 0;
			return a.f<b.f?(-1):1;
		}
		return a.t<b.t?(-1):1;
	}
	list.sort(bySymbols);
	for(var i=0;i<list.length;i++)
	{
		var row = list[i];
		csv+=this.dateStr+','+row.t+','+row.f+','+row.r+eol;
	}
	return csv;
}

//return CSV rows and all ratios for single currency
ERM.prototype.restrictedRows = function(singleCurID, eol) 
{
	var header = 'Date,Base Currency,Other Currency,Exchange Rate' + eol;
	var csv = header;
	var list = new Array();

	// find index
	var index = -1;
	var looking = true;
	for(var idx=0;looking&&idx<this.allOtherCurIDs.length;idx++)
	{
		if(this.allOtherCurIDs[idx]==singleCurID)
		{
			looking = false;
			index = idx;
		}
	}
	if(looking)
		throw nlapiCreateError('CF_EX','Failed to find single currency data: ID = '+singleCurID,true);

	// reciprocal first
	var otherCurID = this.allOtherCurIDs[index];
	var otherCurStr = this.allOtherCurStrs[index];
	var rate = 1.0/this.erList[index];

	if(this.isBase(otherCurID))
		list.push({t:otherCurStr,f:this.corpBaseCurStr,r:rate.toFixed(8)});

	// cross terms and reciprocals
	for(var i=0;i<this.allOtherCurIDs.length;i++)
	{
		var iCurID = this.allOtherCurIDs[i];
		var iCurStr = this.allOtherCurStrs[i];
		var iToCorp = this.erList[i];

		for(var k=i;k<this.allOtherCurIDs.length;k++)
		{
			var kCurID = this.allOtherCurIDs[k];
			var kCurStr = this.allOtherCurStrs[k];
			var kToCorp = this.erList[k];

			if(i==index||k==index) // restrict to single currency 
			{
				if(i==k&&this.isBase(iCurID)) // rate = 1;
					list.push({t:iCurStr,f:iCurStr,r:(iToCorp/kToCorp).toFixed(8)});

				else // different
				{
					if(this.isBase(kCurID))
						list.push({t:kCurStr,f:iCurStr,r:(iToCorp/kToCorp).toFixed(8)});
					if(this.isBase(iCurID))
						list.push({t:iCurStr,f:kCurStr,r:(kToCorp/iToCorp).toFixed(8)});
				}
			}
		}
	}
	var bySymbols = function(a, b) 
	{
		if (a.t == b.t) {
			if (a.f == b.f)
				return 0;
			return a.f < b.f ? (-1) : 1;
		}
		return a.t < b.t ? (-1) : 1;
	}
	list.sort(bySymbols);
	for (var i = 0; i < list.length; i++) 
	{
		var row = list[i];
		csv += this.dateStr + ',' + row.t + ',' + row.f + ',' + row.r + eol;
	}
	return csv;
}

// utilities
var Utils = {}; // resolve namespace clashes
Utils.isEmpty = function(f) {return (f==null||f=='');}
Utils.noNull = function(f) {return f==null?'':f;}
Utils.toFloat = function(s) {var f = parseFloat(s);return isNaN(f)?0:f;}

Utils.exInfo = function(ex) 
{
	var info = '';
	if (ex instanceof nlobjError)
		info = ex.getDetails();// + '\n'+ex.getStackTrace();
	else if (ex != null && ex.message != null)
		info = ex.message;
	return info;
}