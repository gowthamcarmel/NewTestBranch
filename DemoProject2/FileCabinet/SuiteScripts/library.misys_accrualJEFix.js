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

function _roundOff( num, mult )
{
	return __fn.roundOff(num);
	
	if (!num) return 0;
	if (!mult) mult = 100;
	return __fn.parseInt( Math.round( num * mult ) ) / mult;	
}


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


var __ZEROPRECISION_CURRENCIES = [15,18,20,36,44,57];

__fn.roundToCurrencyPrecision = function ( amount, currency){
	var  newAmount = amount;
	
	if ( __is.inArray(__ZEROPRECISION_CURRENCIES, currency) )
		newAmount = Math.round( amount);
	else
		newAmount = __fn.roundOff(amount, 2);
	
	return newAmount;
};


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
	
	form.addButton('custpage_btnback','Go Back', '(function (){history.go(-1);})()');

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
