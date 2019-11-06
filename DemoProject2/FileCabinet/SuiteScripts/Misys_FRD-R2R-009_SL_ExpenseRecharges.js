/**
 * Copyright (c) 1998-2014 NetSuite, Inc.
 * 2955 Campus Drive, Suite 100, San Mateo, CA, USA 94403-2511
 * All Rights Reserved.
 *
 * This software is the confidential and proprietary information of
 * NetSuite, Inc. ("Confidential Information"). You shall not
 * disclose such Confidential Information and shall use it only in
 * accordance with the terms of the license agreement you entered into
 * with NetSuite.
 */
var _REQ = {},_RESP = {},_PARAMS = {}, _FORM = false,_FIELDS = {};

var _HEADER_TEXT = 'Create Direct Recharges';

/**
**
Type == Allocation Type list ( both are Expense VB and ExpReps) 


*/
function suitlet_ExpenseRecharges(request, response){
	__log.start({
		 'logtitle'  : 'ExpenseRecharges'
		,'company' 	 : 'Misys'
		,'scriptname': 'Misys_FRD-RDR-009_SL_ExpenseRecharges.js'
		,'scripttype': 'suitelet'
	});
	try
	{
		_REQ = request, _RESP = response, _PARAMS = {};

		var fldparams = ['act'];

		for (var ii in fldparams) {
			var _fld = fldparams[ ii ];
			var _val = _REQ.getParameter( _fld );
			if ( _val !== null )
				_PARAMS[_fld] = _REQ.getParameter( _fld );
		}

		switch ( _PARAMS['act'] )
		{
			case 'trigger':
				_process_trigger();
				break;
			default:
				_view_MainForm();
				break;
		}

		__log.end('EndOfScript');
		return true;
	}
	catch (error)
	{
		__log.end('EXIT SCRIPT with errors | ' + error.toString(), true);
	    if (error.getDetails != undefined)
	    {
	        nlapiLogExecution( 'ERROR', 'Process Error',error.getCode() + ': ' + error.getDetails());
	        throw error;
	    }
	    else
	    {
	        nlapiLogExecution( 'ERROR', 'Unexpected Error',error.toString());
	        throw nlapiCreateError('99999' , error.toString());
	    }
	}
}


/**
 * Main suitelet page that displays the selection for Type, Subsidiary, End Date, End Date
 * @returns {Boolean}
 */
function _view_MainForm() {
	_FORM = nlapiCreateForm(_HEADER_TEXT);

	_FORM.setScript('customscript_misys_cs_expense_recharge');
	
	_FIELDS['trantype'] = _FORM.addField('custpage_trantype', 'select', 'Allocation Type');
	_FIELDS['trantype'].setMandatory(true);
	var fltrAT = [];
		fltrAT.push( new nlobjSearchFilter('custrecord_icat_trans_type', null, 'anyof', 3 )); // IC Transaction Type Type: Expense
	var colsAT = [];
		colsAT.push( new nlobjSearchColumn('custrecord_icat_allocation_type'));
		colsAT.push( new nlobjSearchColumn('custrecord_icat_trans_type'));
		colsAT.push( new nlobjSearchColumn('name').setSort() );

	var arrSearchPeriodAT = nlapiSearchRecord('customrecord_intercompany_alloc_type', null, fltrAT, colsAT);
	
	if ( arrSearchPeriodAT ) {
		_FIELDS['trantype'].addSelectOption('','');
		for (var ii in arrSearchPeriodAT) {
			var row = arrSearchPeriodAT[ii];			
			_FIELDS['trantype'].addSelectOption( row.getId(), row.getText('custrecord_icat_trans_type') );		
		}	
	}

	_FIELDS['enddate']  = _FORM.addField('custpage_enddate', 'date', 'End Date');
	_FIELDS['enddate'].setMandatory(true);

	_FIELDS['submitbtn']  = _FORM.addSubmitButton('Submit');

	_FIELDS['subsdiarylist'] = _FORM.addSubList('subsidiarylist', 'list', 'Subsidiaries');
	_FIELDS['subsdiarylist'].addMarkAllButtons();
	_FIELDS['subsdiarylist'].addField('apply','checkbox');
//	_FIELDS['subsdiarylist'].addField('parentsubs','text','Parent').setDisplayType('hidden');
	_FIELDS['subsdiarylist'].addField('subsidiaryname','text', 'Subsidiary');
//	_FIELDS['subsdiarylist'].addField('currency','text','Currency');
	_FIELDS['subsdiarylist'].addField('subsidiary','text').setDisplayType('hidden');
	
	var arrSubsidiarySearch = nlapiSearchRecord('transaction', null, 
							[ (new nlobjSearchFilter('type',null,'anyof',['ExpRept','VendBill']) )
							 ,(new nlobjSearchFilter('custentity_excludeicrecharge','custcol_ic_project','is','F') )
							 ,(new nlobjSearchFilter('custrecord_misys_exprecharge_item','expensecategory','noneof','@NONE@') )
//							 ,(new nlobjSearchFilter('custbody_exprecharge_processed',null,'is','F') )
							 ,(new nlobjSearchFilter('custbody_exprecharge_processed',null,'is','F') ) ],
						    [ (new nlobjSearchColumn('subsidiary', null, 'group')).setSort() ] );
	
	var arrSubsLines = [];
	if ( arrSubsidiarySearch )
	{
		for (var ii in arrSubsidiarySearch)
		{
			var resultRow = arrSubsidiarySearch[ii];
			var subsData = {};				
				subsData['subsidiary'] 		= resultRow.getValue('subsidiary', null,'group');
				subsData['subsidiaryname'] 	= resultRow.getText('subsidiary', null,'group');

			arrSubsLines.push( subsData );
		}
		_FIELDS['subsdiarylist'].setLineItemValues(arrSubsLines);
	}
	
	_PARAMS['act'] = 'trigger';

	__slet.printHiddenFields( _PARAMS );
	_RESP.writePage( _FORM );
	return true;
}

function _view_sucessMessage ( succMsg ) {
	_FORM = nlapiCreateForm(_HEADER_TEXT);
	_FORM.setScript('customscript_misys_cs_expense_recharge'); // GBM 03202014
	var htmlMsg = _FORM.addField('htmlerror', 'inlinehtml');
		htmlMsg.setDefaultValue(succMsg);

	// _FORM.addButton('custpage_btnback','Go Back', '(function (){history.go(-1);})()');
	_FORM.addButton('custpage_close','Close', 'redirectHome()'); // GBM 03202014 Modified go back to Go to Home Menu
	
	return _RESP.writePage(_FORM);
}

// GBM 03202014 redirects to homepage
function redirectHome()
{
	var url = '/app/center/card.nl?sc=';
	document.location.href = url;
}

function _view_errorMessage ( errorMsg ) {
	_FORM = nlapiCreateForm(_HEADER_TEXT);
	return __error.slet_report(errorMsg);
}

/**
 * This function will be triggered when the Submit button is clicked to call the scheduled script
 * @returns
 */
function _process_trigger() {
	if (_REQ.getMethod() !== 'POST' ) return _view_MainForm();

	// get this parameters..
	// trantype, enddate, subsidiary
	var scriptParams = {};
		scriptParams['custscript_icrecharge_type'] = _REQ.getParameter('custpage_trantype');
		scriptParams['custscript_icrecharge_enddate'] = _REQ.getParameter('custpage_enddate');

	var count = _REQ.getLineItemCount('subsidiarylist');
	var arrSubs = [];
	for (var line=1; line<=count; line++) {
		if ( _REQ.getLineItemValue('subsidiarylist','apply', line) == 'T' )
			arrSubs.push( _REQ.getLineItemValue('subsidiarylist','subsidiary', line) );
	}
	scriptParams['custscript_icrecharge_subslist'] = arrSubs.join('|');

	if(  __nlapi.scheduleScript ('customscript_misys_ss_gen_ic_recharges',
								 'customdeploy_misys_ss_gen_ic_recharges', scriptParams ) ) {
		return _view_sucessMessage('IC Recharges generation has been queued. ');
	} else {
		return _view_errorMessage('There was an error while trying to queue your request: ' + __error.lastError() );
	}

	return true;
}


function pageInit_ExpenseRecharges(type) {

}


/**
 * Validations for the fields on the main suitelet page
 * @returns {Boolean}
 */
function saveRecord_ExpenseRecharges() {
	//trantype, enddate, subsidiary
	var stTrantype = nlapiGetFieldValue('custpage_trantype');
	if ( __is.empty(stTrantype) ) {
		alert('Transaction Type cannot be empty');
		return false;
	}

	var stEnddate = nlapiGetFieldValue('custpage_enddate');
	if ( __is.empty(stEnddate) ) {
		alert('End Date cannot be empty');
		return false;
	}

	var lineCount = nlapiGetLineItemCount('subsidiarylist');
	var hasChecked = false;
	for (var line=1;line<=lineCount;line++) {
		if ( nlapiGetLineItemValue('subsidiarylist', 'apply', line) == 'T' ) {
			hasChecked = true;
			break;
		}

	}
	if ( !hasChecked ) {
		alert('Please choose at least one subsidiary');
		return false;
	}

	return true;
}
