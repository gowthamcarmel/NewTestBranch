/*****************************************************************************/
/**
 * Copyright (c) 1998- 2013 NetSuite, Inc.

 * 2955 Campus Drive, Suite 100, San Mateo, CA, USA 94403-2511
 * All Rights Reserved.
 *
 * This software is the confidential and proprietary information of
 * NetSuite, Inc. ("Confidential Information"). You shall not
 * disclose such Confidential Information and shall use it only in
 * accordance with the terms of the license agreement you entered into
 * with NetSuite.
 */

/**
 * Collection of reusable functions
 * 
 * Version Date Author Remarks 1.00 05 Feb 2012 bfeliciano
 * 
 */

var _HAS_STRINGIFY = true;
if (!JSON || !JSON.stringify || typeof JSON.stringify != 'function') _HAS_STRINGIFY = false;
	
// ******************//

var __is = {};
__is.empty = function (variable){
	if (variable == null)
		return true;
	else if (variable == '')
		return true;
	else if (typeof variable == 'undefined')
		return true;
	else if (typeof variable == 'string')
		return (variable == '');
	else if (__fn.isArray(variable) && typeof variable.length !== 'undefined')
		return (variable.length == 0);
	else if (isNaN(variable))
		return true;
	else
		return !variable;

	return false;
};
__is.inArray = function(arrSource, needle) {
	var length = arrSource.length;
	for ( var i = 0; i < length; i++) {
		if (arrSource[i] == needle)
			return true;
	}
	return false;
};

var __fn = {};

__fn.arrayUnique = function (arr){
	var u = {}, result = [];
	
	for (var i=0, len =arr.length; i<len; i++ ){
		if (u[ arr[i] ]) continue;
		u[arr[i]]=1;
		result.push( arr[i] );		
	}		
	return result;
};

__fn.parseInt = function(variable) {
	return (!__is.empty(variable)) ? parseInt(variable, 10) : 0;
};

__fn.parseFloat = function(variable, precision) {
	var value = !__is.empty(variable) ? parseFloat( (''+variable).replace(/[^\d\.-]/gi,'') ) : 0;
	var precision = arguments[1] || false;
	if (precision) {
		value = parseFloat(value).toFixed(precision);
	}

	return !isNaN(value) ? value : 0;
};

__fn.roundOff = function ( amount, decimals ){
	if (! amount) amount = 0;
	if (! decimals) decimals = 2;	
	
	var mx = 10;
	for (var i=1;i<decimals;i++)
	{
		mx = 10 * mx;	
	}
	
	return __fn.parseInt( Math.round( amount * mx) ) / mx;
};


__fn.getScriptParameter = function (stParamKey, contextObj) {
	if (__is.empty(stParamKey))
		return false;
	if (!contextObj)
		contextObj = nlapiGetContext();

	var stParamValue = contextObj.getSetting('SCRIPT', stParamKey);
	return (!__is.empty(stParamValue)) ? stParamValue : false;
};

__fn.isArray = function(arr) {
	return typeof arr == 'object' && typeof arr.length != 'undefined';
};

var __slet = {};

__slet.printHiddenFields = function ( hiddenFields )
{
	var form = arguments[1] || (typeof _FORM != 'undefined' ? _FORM : false) || false;
	
	if (!form) return false;
	
	/** add our hidden fields **/
	for ( var fld in hiddenFields) {
		var value = !!hiddenFields[fld] ? hiddenFields[fld] : '';
		var hdnfield = form.addField(fld, 'text');
		hdnfield.setDisplayType('hidden');
		hdnfield.setDefaultValue(value);
	}
	return true;
};



// ******************//
var __usage = {
	 'hasSentReport': false	
	,'limits': {
		'client' 	: 1000,
		'scheduled' : 10000,
		'userevent' : 1000,
		'suitelet' 	: 1000,
		'restlet' 	: 5000
	}
};

__usage.reportData = function (usageLimit) {
	
	var remainingUsage 	= __fn.parseInt( nlapiGetContext().getRemainingUsage() );	
	var totalUsagePct 	= usageLimit ? __fn.roundOff( (1 - remainingUsage / usageLimit) * 100 ) : 0;
	
	var report = {'rem':remainingUsage};
	if ( usageLimit ){
		report['pct'] = totalUsagePct+'%';
		report['lim'] = usageLimit;
		report['used'] = usageLimit - remainingUsage;
	}
	
	return report;
};


__usage.hasRemaining = function ( allowableUsagePct, systemLimit )
{
	if (__log.scripttype && __usage.limits[__log.scripttype]) {
		systemLimit = __usage.limits[__log.scripttype];
	}
	
	var _allowableLimitPct = __fn.parseFloat(allowableUsagePct);
	if (!_allowableLimitPct || _allowableLimitPct >= 100)
		return false;
	
	var usageReport = __usage.reportData(systemLimit);	
	var totalpct = __fn.parseFloat( usageReport.pct || 0 );
	
	usageReport['allowed'] = _allowableLimitPct+'%';
	
	__log.writev('UsageReport', usageReport);
	
	return _allowableLimitPct > totalpct;			
};


// ******************//

var __log = {
	 __enabled 	:true		
	,hasStarted : false	
	,logtitle 	: ''
	,company 	: ''
	,scripttype	: false
	,enableusage: true
	,__suffix   : false
};

__log.setSuffix = function (suffix) {
	if (!suffix) return false;
	
	__log.__suffix = suffix;
};

__log.appendSuffix = function (newsfx) {
	if ( __is.empty(newsfx) ) return false;
	
	__log.__suffix = [__log.__suffix, newsfx].join('|');
};




__log.setCurrentRecord = function (record) {
	if (! record) return false;
	
	try {
		var recType = record.getRecordType();
		var recID   = record.getId();		
		__log.setSuffix([recType, recID].join(':')); 
	} catch(err){ __log.writev('ERR', [err.toString()]); };
	
	return true;
};

__log.write = function(msg, title, type) {
	var logtitle = title
			|| (typeof __log.logtitle !== 'undefined' ? __log.logtitle : false);
	var logtype = type || 'DEBUG';
	
	if ( __log.enableusage )
	{
		var systemLimit = false;
		if (__log.scripttype && __usage.limits[__log.scripttype]) {
			systemLimit = __usage.limits[__log.scripttype];
		}		
		var usageReport = __usage.reportData(systemLimit);
		var usageStr = [usageReport['used'],usageReport['lim']].join('/');
			usageStr+= ' | '+usageReport['pct'];
				
		logtitle+='__'+usageStr;
	}
	
	if ( __log.__suffix ){
		msg = '['+__log.__suffix+'] ' + msg; 
	}
	
	
	if ( __log.__enabled ) {
		nlapiLogExecution(logtype, logtitle, msg);		
	}
	
	return true;
};

__log.writev = function (msg, value) {
	if (typeof value !== 'undefined' && _HAS_STRINGIFY)
			msg+='...'+JSON.stringify(value);
	return __log.write(msg);
};

__log.start = function (logdata){
	if (__log.hasStarted) return true;	
	if (logdata) {
		var arrflds = [ 'logtitle', 'scripttype', 'company', 'scriptname','enableusage'];
		for ( var ii in arrflds) {
			var fld = arrflds[ii];
			if (logdata[fld]) __log[fld] = logdata[fld];
		}
	}
	__log.write('***************|__Script Started__|***************');	
	
	__log.hasStarted = true;
	return true;
};


__log.end = function (msg, value) {
	__log.__suffix = false;
	if (!__is.empty(msg) || !__is.empty(value))
	{
		__log.writev( '>> Exiting script: ' + (msg||''), value );	
	}
	var systemLimit = false;
	if (__log.scripttype && __usage.limits[__log.scripttype]) {
		systemLimit = __usage.limits[__log.scripttype];
	}
	var usageReport = __usage.reportData(systemLimit);		
	__log.writev('UsageReport', usageReport);
	__log.write('_________________End Of Execution_________________');
	
	return true;
};
/////////////////////////////////////
var __error = {
		__last_error_msg: ''		
};

__error.report = function (errmsg) {
	__log.write('*** ERROR *** ' + errmsg, '** ERROR **', 'ERROR');	
	__error.__last_error_msg = errmsg;	
	return false;
};

__error.lastError = function ()
{
	if (! __is.empty(__error.__last_error_msg))
		return __error.__last_error_msg;
	else 
		return false;	
};


__error.slet_report = function (errmsg) {
	var form = arguments[1] || (typeof _FORM != 'undefined' ? _FORM : false)
			|| false;
	var resp = arguments[2] || (typeof _RESP != 'undefined' ? _RESP : false)
			|| false;	
	if (!form || !resp) return false;

	var htmlError = form.addField('htmlerror', 'inlinehtml');
	var stErrorMsg = '<font color="red"><b> ERROR : </b> ' + errmsg + '</font>';
	htmlError.setDefaultValue(stErrorMsg);

	resp.writePage(form);
	return __error.report(errmsg);
};

__error.json_report = function (errmsg) {
	var resp = arguments[1] || (typeof _RESP != 'undefined' ? _RESP : false) || false;
	if (!resp) return false;
	
	if ( _HAS_STRINGIFY )
		resp.write(JSON.stringify({'error' : errMsg}));
	return __error.report(errmsg);
};


////////////////////////////////
var __safe = {};
__safe.nlapiSubmitRecord = function (recToSave, isDoSourcing, isIgnoreManadatory) {
	if (! recToSave) return false;
	var result = false;
	
	try {
		result = nlapiSubmitRecord(recToSave, isDoSourcing, isIgnoreManadatory);
	} catch (err) {
		// report this error
		__error.report('SubmitRecord failed: ' + err.toString());
	}

	return result;
};
__safe.nlapiSubmitField = function (recType, recId, fldNames, fldValues, isDoSourcing) {
	
	var result = false;
	
	try
	{
		nlapiSubmitField(recType, recId, fldNames, fldValues, isDoSourcing);
		result = true;
	} catch (err) {
		// report this error
		__error.report('SubmitRecord failed: ' + err.toString());
	}
	
	return result;

};

__safe.setFieldValue = function(recToSave, fieldName, value, isFireFieldChanged, isSynchronous) {
	if (!fieldName ) return false;
	
	var result = false;
	
	try {
		result = recToSave ? recToSave.setFieldValue( fieldName, value ) 
						: nlapiSetFieldValue(fieldName, value, isFireFieldChanged, isSynchronous);
		result = true;
	} catch (err) {
		// report this error
		__error.report('SetFieldvalue failed: ' + err.toString());
	}

	return result;
};

__safe.setCurrentLineItemValue = function (recToSave, lineType, fieldName, value, isFireFieldChanged, isSynchronous )
{
	if (!lineType || !fieldName) return false;
	var result = false;
	
	try {
		result = recToSave ? recToSave.setCurrentLineItemValue(lineType,fieldName, value ) 
						: nlapiSetCurrentLineItemValue(lineType, fieldName, value, isFireFieldChanged, isSynchronous);
		result = true;		
	} catch (err) {
		// report this error
		__error.report('setCurrentLineItemValue failed: ' + err.toString());
	}

	return result;
};

__safe.setLineItemValue = function (recToSave, lineType, fieldName, line, value)
{
	if (!lineType || !fieldName) return false;
	var result = false;
	
	try {
		result = recToSave ? recToSave.setLineItemValue(lineType,fieldName, line, value ) :
						nlapiSetLineItemValue(lineType, fieldName, line, value);
	} catch (err) {
		// report this error
		__error.report('setCurrentLineItemValue failed: ' + err.toString());
	}

	return true;
};

__safe.removeLineItem = function (record, lineType, line )
{
	if (! lineType || !line) return false;
	
	try
	{
		if (record)
			record.removeLineItem( lineType, line );
		else
			nlapiRemoveLineItem(lineType, line);
		
	} catch (err) {
		// report this error
		__error.report('removeLineItem failed: ' + err.toString());
	}
	
};


__safe.commitLineItem = function (record, sublistType)
{
	var result = false;
	try 
	{
		__nlapi.commitLineItem(sublistType, record);
		result = true;
	}
	catch (err)
	{
		__error.report('commitLineItem failed: ' + err.toString());
	}
	
	return result;

};


__safe.deleteRecord = function (recordType, recordId)
{
	var result = false;
	try 
	{
		nlapiDeleteRecord(recordType, recordId );
		result = true;
	}
	catch (err)
	{
		__error.report('delete Record failed: ' + err.toString());
	}
	
	return result;	
};


////
var __nlapi = {};
__nlapi.findLineItemValue = function (subListType, fldName, fldValue, record) {	
	return record  ? record.findLineItemValue(subListType, fldName, fldValue) : nlapiFindLineItemValue(subListType, fldName, fldValue); 
};

__nlapi.getFieldValue = function ( field, record )
{
	if (! field ) return false;
	
	return record  ? record.getFieldValue(field) : nlapiGetFieldValue( field ); 
};

__nlapi.getLineItemCount = function ( sublistType, record )
{
	if (! sublistType) return false;
	
	return record ? record.getLineItemCount(sublistType) : nlapiGetLineItemCount(sublistType); 
};

__nlapi.getLineItemValue = function (sublistType, field, line, record)
{
	if (! sublistType || !field || !line) return false;	
	return record ? record.getLineItemValue(sublistType, field, line) : nlapiGetLineItemValue(sublistType, field, line); 	
};

__nlapi.selectNewLineItem = function (sublistType, record)
{
	if (! sublistType) return false;
	return record ? record.selectNewLineItem(sublistType) : nlapiSelectNewLineItem(sublistType); 
	
};

__nlapi.getCurrentLineItemIndex = function (sublistType, record)
{
	if (! sublistType ) return false;
	return record ? record.getCurrentLineItemIndex( sublistType )  : nlapiGetCurrentLineItemIndex( sublistType );	
};

__nlapi.commitLineItem = function (sublistType, record)
{
	if (! sublistType) return false;
	
	return record ? record.commitLineItem(sublistType) : nlapiCommitLineItem(sublistType);
};

__nlapi.scheduleScript = function ( scriptId, deployId, params ){
	if (! scriptId) return false;
	
	var status = nlapiScheduleScript(scriptId, null, params);
	
	__log.writev('** Schedule script (no deploy)', [status, scriptId, params]);	
	if (status != 'QUEUED')
	{
		if (! deployId ) return false;		
		status = nlapiScheduleScript(scriptId, deployId, params);
		__log.writev('...schedule script again', [status, scriptId, deployId, params]);		
		if (status != 'QUEUED') return false;
	}
	
	return true;
};


__nlapi.searchAllRecord = function ( recordType, searchId, searchFilter, searchColumns )
{
	var arrSearchResults = [];
	var count=1000, init=true, min=0, max=1000;

	__log.writev('*** Get All Results **', [recordType, searchId, searchFilter, searchColumns]);

	var searchObj = false;

	if (searchId) {
		searchObj = nlapiLoadSearch(recordType, searchId);
		if (searchFilter)
			searchObj.addFilters(searchFilter);
		if (searchColumns)
			searchObj.addColumns(searchColumns);
	} else {
		searchObj = nlapiCreateSearch(recordType, searchFilter, searchColumns);
	}

	var rs = searchObj.runSearch();

	while( count == 1000 )
	{
		var resultSet = rs.getResults(min, max);
		arrSearchResults = arrSearchResults.concat(resultSet);
		min = max;
		max+=1000;
		count = resultSet.length;
		__log.writev('....[runsearch]',[min, max, count] );
	}

	return arrSearchResults;		
};


/////////////////////////////////////////////////////////
__fn.parsableDate = function (strDate)
{
	var dt = Date.CDate(strDate) || new Date();
	return [ dt.getMonth()+1,
	         dt.getDate(),
	         dt.getFullYear() ].join('/');
};

__fn.parsableDateTime = function (strDate)
{
	var dt = Date.CDate(strDate) || new Date();
	
	return [ dt.getMonth()+1, dt.getDate(), dt.getFullYear()].join('/') 
		 	+ ' ' 
		 	+ [ dt.getHours() > 1 ? ( dt.getHours() > 12 ? dt.getHours() - 12 : dt.getHours() ) : 12, 
		 	    ('0' + dt.getMinutes()).slice(-2), 
		 	    ('0' + dt.getSeconds()).slice(-2)].join(':')
		 	+ ' ' 
		 	+ (dt.getHours() > 12 ? 'pm' : 'am');
};

__fn.currencyFormat = function (amount, sign)
{
	var nStr = __fn.parseFloat(amount).toFixed(2);
	
	nStr += '';
	x = nStr.split('.');
	x1 = x[0];
	x2 = x.length > 1 ? '.' + x[1] : '';
	var rgx = /(\d+)(\d{3})/;
	while (rgx.test(x1)) {
		x1 = x1.replace(rgx, '$1' + ',' + '$2');
	}	
	var retvalue = x1 + x2; 	
	return sign ? sign + retvalue:retvalue;
};




// var status = nlapiScheduleScript( schedScriptUpdatBillsID, null, arrScriptParam);



///////////////////////////////////////////////////////////
/*
Name: jsDate
Desc: VBScript native Date functions emulated for Javascript
Author: Rob Eberhardt, Slingshot Solutions - http://slingfive.com/
Note: see jsDate.txt for more info
*/
/*
Name: jsDate
Desc: VBScript native Date functions emulated for Javascript
Author: Rob Eberhardt, Slingshot Solutions - http://slingfive.com/
Note: see jsDate.txt for more info
*/

// constants
vbGeneralDate=0; vbLongDate=1; vbShortDate=2; vbLongTime=3; vbShortTime=4;  // NamedFormat
vbUseSystemDayOfWeek=0; vbSunday=1; vbMonday=2; vbTuesday=3; vbWednesday=4; vbThursday=5; vbFriday=6; vbSaturday=7;	// FirstDayOfWeek
vbUseSystem=0; vbFirstJan1=1; vbFirstFourDays=2; vbFirstFullWeek=3;	// FirstWeekOfYear

// arrays (1-based)
Date.MonthNames = [null,'January','February','March','April','May','June','July','August','September','October','November','December'];
Date.WeekdayNames = [null,'Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];




Date.IsDate = function(p_Expression){
	return !isNaN(new Date(p_Expression));		// <-- review further
}

Date.CDate = function(p_Date){
	if(Date.IsDate(p_Date)){ return new Date(p_Date); }

	var strTry = p_Date.replace(/\-/g, '/').replace(/\./g, '/').replace(/ /g, '/');	// fix separators
	strTry = strTry.replace(/pm$/i, " pm").replace(/am$/i, " am");	// and meridian spacing
	if(Date.IsDate(strTry)){ return new Date(strTry); }

	var strTryYear = strTry + '/' + new Date().getFullYear();	// append year
	if(Date.IsDate(strTryYear)){ return new Date(strTryYear); }
	

	if(strTry.indexOf(":")){	// if appears to have time
		var strTryYear2 = strTry.replace(/ /, '/' + new Date().getFullYear() + ' ');	// insert year
		if(Date.IsDate(strTryYear2)){ return new Date(strTryYear2); }

		var strTryDate = new Date().toDateString() + ' ' + p_Date;	// pre-pend current date
		if(Date.IsDate(strTryDate)){ return new Date(strTryDate); }
	}
	
	return false;	// double as looser IsDate
	//throw("Error #13 - Type mismatch");	// or is this better? 
}
 


Date.DateAdd = function(p_Interval, p_Number, p_Date){
	if(!Date.CDate(p_Date)){	return "invalid date: '" + p_Date + "'";	}
	if(isNaN(p_Number)){	return "invalid number: '" + p_Number + "'";	}	

	p_Number = new Number(p_Number);
	var dt = Date.CDate(p_Date);
	
	switch(p_Interval.toLowerCase()){
		case "yyyy": {
			dt.setFullYear(dt.getFullYear() + p_Number);
			break;
		}
		case "q": {
			dt.setMonth(dt.getMonth() + (p_Number*3));
			break;
		}
		case "m": {
			dt.setMonth(dt.getMonth() + p_Number);
			break;
		}
		case "y":			// day of year
		case "d":			// day
		case "w": {		// weekday
			dt.setDate(dt.getDate() + p_Number);
			break;
		}
		case "ww": {	// week of year
			dt.setDate(dt.getDate() + (p_Number*7));
			break;
		}
		case "h": {
			dt.setHours(dt.getHours() + p_Number);
			break;
		}
		case "n": {		// minute
			dt.setMinutes(dt.getMinutes() + p_Number);
			break;
		}
		case "s": {
			dt.setSeconds(dt.getSeconds() + p_Number);
			break;
		}
		case "ms": {	// JS extension
			dt.setMilliseconds(dt.getMilliseconds() + p_Number);
			break;
		}
		default: {
			return "invalid interval: '" + p_Interval + "'";
		}
	}
	return dt;
}



Date.DateDiff = function(p_Interval, p_Date1, p_Date2, p_FirstDayOfWeek){
	if(!Date.CDate(p_Date1)){	return "invalid date: '" + p_Date1 + "'";	}
	if(!Date.CDate(p_Date2)){	return "invalid date: '" + p_Date2 + "'";	}
	p_FirstDayOfWeek = (isNaN(p_FirstDayOfWeek) || p_FirstDayOfWeek==0) ? vbSunday : parseInt(p_FirstDayOfWeek);	// set default & cast

	var dt1 = Date.CDate(p_Date1);
	var dt2 = Date.CDate(p_Date2);

	// correct DST-affected intervals ("d" & bigger)
	if("h,n,s,ms".indexOf(p_Interval.toLowerCase())==-1){
		if(p_Date1.toString().indexOf(":") ==-1){ dt1.setUTCHours(0,0,0,0) };	// no time, assume 12am
		if(p_Date2.toString().indexOf(":") ==-1){ dt2.setUTCHours(0,0,0,0) };	// no time, assume 12am
	}


	// get ms between UTC dates and make into "difference" date
	var iDiffMS = dt2.valueOf() - dt1.valueOf();
	var dtDiff = new Date(iDiffMS);

	// calc various diffs
	var nYears  = dt2.getUTCFullYear() - dt1.getUTCFullYear();
	var nMonths = dt2.getUTCMonth() - dt1.getUTCMonth() + (nYears!=0 ? nYears*12 : 0);
	var nQuarters = parseInt(nMonths / 3);	//<<-- different than VBScript, which watches rollover not completion
	
	var nMilliseconds = iDiffMS;
	var nSeconds = parseInt(iDiffMS / 1000);
	var nMinutes = parseInt(nSeconds / 60);
	var nHours = parseInt(nMinutes / 60);
	var nDays  = parseInt(nHours / 24);	// <-- now fixed for DST switch days
	var nWeeks = parseInt(nDays / 7);


	if(p_Interval.toLowerCase()=='ww'){
			// set dates to 1st & last FirstDayOfWeek
			var offset = Date.DatePart("w", dt1, p_FirstDayOfWeek)-1;
			if(offset){	dt1.setDate(dt1.getDate() +7 -offset);	}
			var offset = Date.DatePart("w", dt2, p_FirstDayOfWeek)-1;
			if(offset){	dt2.setDate(dt2.getDate() -offset);	}
			// recurse to "w" with adjusted dates
			var nCalWeeks = Date.DateDiff("w", dt1, dt2) + 1;
	}
	// TODO: similar for 'w'?
	
	
	// return difference
	switch(p_Interval.toLowerCase()){
		case "yyyy": return nYears;
		case "q": return nQuarters;
		case "m":	return nMonths;
		case "y":			// day of year
		case "d": return nDays;
		case "w": return nWeeks;
		case "ww":return nCalWeeks; // week of year	
		case "h": return nHours;
		case "n": return nMinutes;
		case "s": return nSeconds;
		case "ms":return nMilliseconds;	// not in VBScript
		default : return "invalid interval: '" + p_Interval + "'";
	}
}




Date.DatePart = function(p_Interval, p_Date, p_FirstDayOfWeek){
	if(!Date.CDate(p_Date)){	return "invalid date: '" + p_Date + "'";	}

	var dtPart = Date.CDate(p_Date);
	
	switch(p_Interval.toLowerCase()){
		case "yyyy": return dtPart.getFullYear();
		case "q": return parseInt(dtPart.getMonth() / 3) + 1;
		case "m": return dtPart.getMonth() + 1;
		case "y": return Date.DateDiff("y", "1/1/" + dtPart.getFullYear(), dtPart) + 1;	// day of year
		case "d": return dtPart.getDate();
		case "w": return Date.Weekday(dtPart.getDay()+1, p_FirstDayOfWeek);		// weekday
		case "ww":return Date.DateDiff("ww", "1/1/" + dtPart.getFullYear(), dtPart, p_FirstDayOfWeek) + 1;	// week of year
		case "h": return dtPart.getHours();
		case "n": return dtPart.getMinutes();
		case "s": return dtPart.getSeconds();
		case "ms":return dtPart.getMilliseconds();	// <-- JS extension, NOT in VBScript
		default : return "invalid interval: '" + p_Interval + "'";
	}
}



Date.MonthName = function(p_Month, p_Abbreviate){
	if(isNaN(p_Month)){	// v0.94- compat: extract real param from passed date
		if(!Date.CDate(p_Month)){	return "invalid month: '" + p_Month + "'";	}
		p_Month = DatePart("m", Date.CDate(p_Month));
	}

	var retVal = Date.MonthNames[p_Month];
	if(p_Abbreviate==true){	retVal = retVal.substring(0, 3)	}	// abbr to 3 chars
	return retVal;
}


Date.WeekdayName = function(p_Weekday, p_Abbreviate, p_FirstDayOfWeek){
	if(isNaN(p_Weekday)){	// v0.94- compat: extract real param from passed date
		if(!Date.CDate(p_Weekday)){	return "invalid weekday: '" + p_Weekday + "'";	}
		p_Weekday = DatePart("w", Date.CDate(p_Weekday));
	}
	p_FirstDayOfWeek = (isNaN(p_FirstDayOfWeek) || p_FirstDayOfWeek==0) ? vbSunday : parseInt(p_FirstDayOfWeek);	// set default & cast

	var nWeekdayNameIdx = ((p_FirstDayOfWeek-1 + parseInt(p_Weekday)-1 +7) % 7) + 1;	// compensate nWeekdayNameIdx for p_FirstDayOfWeek
	var retVal = Date.WeekdayNames[nWeekdayNameIdx];
	if(p_Abbreviate==true){	retVal = retVal.substring(0, 3)	}	// abbr to 3 chars
	return retVal;
}


// adjusts weekday for week starting on p_FirstDayOfWeek
Date.Weekday=function(p_Weekday, p_FirstDayOfWeek){	
	p_FirstDayOfWeek = (isNaN(p_FirstDayOfWeek) || p_FirstDayOfWeek==0) ? vbSunday : parseInt(p_FirstDayOfWeek);	// set default & cast

	return ((parseInt(p_Weekday) - p_FirstDayOfWeek +7) % 7) + 1;
}





Date.FormatDateTime = function(p_Date, p_NamedFormat){
	if(p_Date.toUpperCase().substring(0,3) == "NOW"){	p_Date = new Date()	};
	if(!Date.CDate(p_Date)){	return "invalid date: '" + p_Date + "'";	}
	if(isNaN(p_NamedFormat)){	p_NamedFormat = vbGeneralDate	};

	var dt = Date.CDate(p_Date);

	switch(parseInt(p_NamedFormat)){
		case vbGeneralDate: return dt.toString();
		case vbLongDate:		return Format(p_Date, 'DDDD, MMMM D, YYYY');
		case vbShortDate:		return Format(p_Date, 'MM/DD/YYYY');
		case vbLongTime:		return dt.toLocaleTimeString();
		case vbShortTime:		return Format(p_Date, 'HH:MM:SS');
		default:	return "invalid NamedFormat: '" + p_NamedFormat + "'";
	}
}


Date.Format = function(p_Date, p_Format, p_FirstDayOfWeek, p_firstweekofyear) {
	if(!Date.CDate(p_Date)){	return "invalid date: '" + p_Date + "'";	}
	if(!p_Format || p_Format==''){	return dt.toString()	};

	var dt = Date.CDate(p_Date);

	// Zero-padding formatter
	this.pad = function(p_str){
		if(p_str.toString().length==1){p_str = '0' + p_str}
		return p_str;
	}

	var ampm = dt.getHours()>=12 ? 'PM' : 'AM'
	var hr = dt.getHours();
	if (hr == 0){hr = 12};
	if (hr > 12) {hr -= 12};
	var strShortTime = hr +':'+ this.pad(dt.getMinutes()) +':'+ this.pad(dt.getSeconds()) +' '+ ampm;
	var strShortDate = (dt.getMonth()+1) +'/'+ dt.getDate() +'/'+ new String( dt.getFullYear() ).substring(2,4);
	var strLongDate = Date.MonthName(dt.getMonth()+1) +' '+ dt.getDate() +', '+ dt.getFullYear();		//

	var retVal = p_Format;
	
	// switch tokens whose alpha replacements could be accidentally captured
	retVal = retVal.replace( new RegExp('C', 'gi'), 'CCCC' ); 
	retVal = retVal.replace( new RegExp('mmmm', 'gi'), 'XXXX' );
	retVal = retVal.replace( new RegExp('mmm', 'gi'), 'XXX' );
	retVal = retVal.replace( new RegExp('dddddd', 'gi'), 'AAAAAA' ); 
	retVal = retVal.replace( new RegExp('ddddd', 'gi'), 'AAAAA' ); 
	retVal = retVal.replace( new RegExp('dddd', 'gi'), 'AAAA' );
	retVal = retVal.replace( new RegExp('ddd', 'gi'), 'AAA' );
	retVal = retVal.replace( new RegExp('timezone', 'gi'), 'ZZZZ' );
	retVal = retVal.replace( new RegExp('time24', 'gi'), 'TTTT' );
	retVal = retVal.replace( new RegExp('time', 'gi'), 'TTT' );

	// now do simple token replacements
	retVal = retVal.replace( new RegExp('yyyy', 'gi'), dt.getFullYear() );
	retVal = retVal.replace( new RegExp('yy', 'gi'), new String( dt.getFullYear() ).substring(2,4) );
	retVal = retVal.replace( new RegExp('y', 'gi'), Date.DatePart("y", dt) );
	retVal = retVal.replace( new RegExp('q', 'gi'), Date.DatePart("q", dt) );
	retVal = retVal.replace( new RegExp('mm', 'gi'), (dt.getMonth() + 1) );	
	retVal = retVal.replace( new RegExp('m', 'gi'), (dt.getMonth() + 1) );	
	retVal = retVal.replace( new RegExp('dd', 'gi'), this.pad(dt.getDate()) );
	retVal = retVal.replace( new RegExp('d', 'gi'), dt.getDate() );
	retVal = retVal.replace( new RegExp('hh', 'gi'), this.pad(dt.getHours()) );
	retVal = retVal.replace( new RegExp('h', 'gi'), dt.getHours() );
	retVal = retVal.replace( new RegExp('nn', 'gi'), this.pad(dt.getMinutes()) );
	retVal = retVal.replace( new RegExp('n', 'gi'), dt.getMinutes() );
	retVal = retVal.replace( new RegExp('ss', 'gi'), this.pad(dt.getSeconds()) ); 
	retVal = retVal.replace( new RegExp('s', 'gi'), dt.getSeconds() ); 
	retVal = retVal.replace( new RegExp('t t t t t', 'gi'), strShortTime ); 
	retVal = retVal.replace( new RegExp('am/pm', 'g'), dt.getHours()>=12 ? 'pm' : 'am');
	retVal = retVal.replace( new RegExp('AM/PM', 'g'), dt.getHours()>=12 ? 'PM' : 'AM');
	retVal = retVal.replace( new RegExp('a/p', 'g'), dt.getHours()>=12 ? 'p' : 'a');
	retVal = retVal.replace( new RegExp('A/P', 'g'), dt.getHours()>=12 ? 'P' : 'A');
	retVal = retVal.replace( new RegExp('AMPM', 'g'), dt.getHours()>=12 ? 'pm' : 'am');
	// (always proceed largest same-lettered token to smallest)

	// now finish the previously set-aside tokens 
	retVal = retVal.replace( new RegExp('XXXX', 'gi'), Date.MonthName(dt.getMonth()+1, false) );	//
	retVal = retVal.replace( new RegExp('XXX',  'gi'), Date.MonthName(dt.getMonth()+1, true ) );	//
	retVal = retVal.replace( new RegExp('AAAAAA', 'gi'), strLongDate ); 
	retVal = retVal.replace( new RegExp('AAAAA', 'gi'), strShortDate ); 
	retVal = retVal.replace( new RegExp('AAAA', 'gi'), Date.WeekdayName(dt.getDay()+1, false, p_FirstDayOfWeek) );	// 
	retVal = retVal.replace( new RegExp('AAA',  'gi'), Date.WeekdayName(dt.getDay()+1, true,  p_FirstDayOfWeek) );	// 
	retVal = retVal.replace( new RegExp('TTTT', 'gi'), dt.getHours() + ':' + this.pad(dt.getMinutes()) );
	retVal = retVal.replace( new RegExp('TTT',  'gi'), hr +':'+ this.pad(dt.getMinutes()) +' '+ ampm );
	retVal = retVal.replace( new RegExp('CCCC', 'gi'), strShortDate +' '+ strShortTime ); 

	// finally timezone
	tz = dt.getTimezoneOffset();
	timezone = (tz<0) ? ('GMT-' + tz/60) : (tz==0) ? ('GMT') : ('GMT+' + tz/60);
	retVal = retVal.replace( new RegExp('ZZZZ', 'gi'), timezone );

	return retVal;
}



// ====================================

/* if desired, map new methods to direct functions
*/
IsDate = Date.IsDate;
CDate = Date.CDate;
DateAdd = Date.DateAdd;
DateDiff = Date.DateDiff;
DatePart = Date.DatePart;
MonthName = Date.MonthName;
WeekdayName = Date.WeekdayName;
Weekday = Date.Weekday;
FormatDateTime = Date.FormatDateTime;
Format = Date.Format;