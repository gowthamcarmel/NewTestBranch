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
var _HEADER_TEXT = '';

/**
 * Suitelet function for Per Period - Direct 
 * 
 * @param request
 * @param response
 * @returns
 */
function suitelet_SingleSubsDirect(request, response){
	_REQ = request, _RESP = response, _PARAMS = {};
	
	__log.start({
		 'logtitle'  : 'ICC-SL-SingleSubsDirect'
		,'company' 	 : 'Misys'
		,'scriptname': 'Misys_FRD_R2R-004_SL_ICC_Transactions.js'
		,'scripttype': 'suitelet'
	});
	
	_HEADER_TEXT = 'Create Transaction for Direct Charges (Single Subsidiary)';	
	
	return _suiteletPerPeriod(true, false);
}

/**
 * Suitelet function for Per Period - Indirect 
 * 
 * @param request
 * @param response
 * @returns
 */
function suitelet_SingleSubsIndirect(request, response){
	_REQ = request, _RESP = response, _PARAMS = {};
	
	__log.start({
		 'logtitle'  : 'ICC-SL-SingleSubsIndirec'
		,'company' 	 : 'Misys'
		,'scriptname': 'Misys_FRD_R2R-004_SL_ICC_Transactions.js'
		,'scripttype': 'suitelet'
	});
	
	_HEADER_TEXT = 'Create Transaction for Indirect Charges (Single Subsidiary)';	
	
	return _suiteletPerPeriod(false, false);
}

/**
 * Suitelet function for Per Period - Indirect (Batch) 
 * 
 * @param request
 * @param response
 * @returns
 */
function suitelet_BatchSubsIndirect(request, response){
	_REQ = request, _RESP = response, _PARAMS = {};
	
	__log.start({
		 'logtitle'  : 'ICC-SL-BatchSubsIndirect'
		,'company' 	 : 'Misys'
		,'scriptname': 'Misys_FRD_R2R-004_SL_ICC_Transactions.js'
		,'scripttype': 'suitelet'
	});	
	_HEADER_TEXT = 'Create Transaction for Indirect Charges (Batch Process)';		
	return _suiteletPerPeriod(false, true);
}


/**
 * Suitelet function for Per Period - Direct (Batch) 
 * 
 * @param request
 * @param response
 * @returns
 */
function suitelet_BatchSubsDirect(request, response){
	_REQ = request, _RESP = response, _PARAMS = {};
	
	__log.start({
		 'logtitle'  : 'ICC-SL-BatchSubsDirect'
		,'company' 	 : 'Misys'
		,'scriptname': 'Misys_FRD_R2R-004_SL_ICC_Transactions.js'
		,'scripttype': 'suitelet'
	});
	
	_HEADER_TEXT = 'Create Transaction for Direct Charges (Batch Process)';	
	
	return _suiteletPerPeriod(true, true);
}

/**
 * Generic Suitelet function for processing Per Period ICs
 * 
 * @param isDirect
 * @param isBatch
 * @returns {Boolean}
 */
function _suiteletPerPeriod ( isDirect, isBatch )
{
	try
	{
		var fldparams = ['act','grouping','isbatch'];		

		for (var ii in fldparams) {
			var _fld = fldparams[ ii ];
			var _val = _REQ.getParameter( _fld );
			if ( _val !== null )
				_PARAMS[_fld] = _REQ.getParameter( _fld );
		}
		
		_PARAMS['grouping'] = isDirect ? 'direct' : 'indirect';
		_PARAMS['isbatch'] 	= isBatch ? 'T' : 'F';
		
		
		switch ( _PARAMS['act'] )
		{
			case 'trigger':
				_process_trigger();
				break;
			default:
				_view_MainForm( isBatch, isDirect );
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
 * Suitelet functions for processing Per Transaction ICs
 * 
 * @param request
 * @param response
 * @returns {Boolean}
 */
function suitelet_PerTransaction(request, response){
	__log.start({
		 'logtitle'  : 'ICC-SL-PerTransaction'
		,'company' 	 : 'Misys'
		,'scriptname': 'Misys_FRD_R2R-004_SL_ICC_Transactions.js'
		,'scripttype': 'suitelet'
	});
	try {
		_REQ = request, _RESP = response, _PARAMS = {};
		
		_HEADER_TEXT = 'Create Transaction from Per Transaction Recharges';					
		
		var act = _REQ.getParameter( 'act' );
		
		switch ( act )
		{
			case 'trigger':
				_process_PerTrans();
				break;
			default:
				_view_PerTransactionForm();
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
 * displays the actual suitelet form
 * 
 * @param doShowDestSubs
 * @returns {Boolean}
 */
function _view_MainForm( doShowDestSubs, isDirect ) {
	_FORM = nlapiCreateForm(_HEADER_TEXT);
	_FORM.setScript( nlapiGetContext().getScriptId() );
	
	/**
	 * Displays the Period dropdown
	 */		
	_FIELDS['iccperiod'] = _FORM.addField('iccperiod', 'multiselect', 'Period');
	_FIELDS['iccperiod'].setMandatory(true);

	// only get all the Period from the IC Custom record
	var arrPostingPeriods = _getGroupedValues('custrecord_icc_period','custrecord_icc_date');
	if ( arrPostingPeriods ) {
		for ( var ii in arrPostingPeriods) {
			var row = arrPostingPeriods[ii];		
			_FIELDS['iccperiod'].addSelectOption(row.getValue('custrecord_icc_period',null,'group'),
											  row.getText('custrecord_icc_period',null,'group'));
		}
	}
	
	/**
	 * IC Date - will be used as the Transaction Date
	 */
	_FIELDS['iccdate']  = _FORM.addField('iccdate', 'date', 'IC Transaction Date');
	_FIELDS['iccdate'].setMandatory(true);
	
	/**
	 *  Allocation type list drop down
	 */	
	_FIELDS['icctrans'] = _FORM.addField('icctrans', 'select', 'Allocation Type');
	_FIELDS['icctrans'].setMandatory(true);
	
	var fltrPeriodAT = [];
		fltrPeriodAT.push( new nlobjSearchFilter('custrecord_icat_grouping', null, 'anyof',2)); // show only per period
		fltrPeriodAT.push( new nlobjSearchFilter('custrecord_icat_grouping_direct_indirect', null, 'anyof', (isDirect ? 1 : 2)  )); // show only direct		
	var colsPeriodAT = [];
		colsPeriodAT.push( new nlobjSearchColumn('custrecord_icat_allocation_type'));
		colsPeriodAT.push( new nlobjSearchColumn('name').setSort() );

	var arrSearchPeriodAT = nlapiSearchRecord('customrecord_intercompany_alloc_type', null, fltrPeriodAT, colsPeriodAT);	
	if ( arrSearchPeriodAT ) {
		_FIELDS['icctrans'].addSelectOption('','');
		for (var ii in arrSearchPeriodAT) {
			var row = arrSearchPeriodAT[ii];			
			_FIELDS['icctrans'].addSelectOption( row.getId(), row.getText('custrecord_icat_allocation_type') );		
		}	
	}
	
	/**
	 * Drop down for all the IC's Source subsidiaries
	 */
	_FIELDS['sourcesubs'] = _FORM.addField('sourcesubs', 'select', 'Source Subsidiary');	
	_FIELDS['sourcesubs'].addSelectOption('','');
	
	var arrSourceSubs = _getGroupedValues('custrecord_icc_source_subsidiary','custrecord_icc_source_subsidiary');
	if ( arrSourceSubs ) {		
		for ( var ii in arrSourceSubs) {
			var row = arrSourceSubs[ii];		
			_FIELDS['sourcesubs'].addSelectOption(row.getValue('custrecord_icc_source_subsidiary',null,'group'),
											  	  row.getText('custrecord_icc_source_subsidiary',null,'group'));
		}
	}
	
	
	/**
	 * Drop down for all the IC's Source subsidiaries
	 * Display them only if the suitelet is by single subsidiary
	 */	
	if(! doShowDestSubs ) {
		_FIELDS['sourcesubs'].setMandatory(true);
		
		// show destination subsidiaries		
		_FIELDS['destsubs'] = _FORM.addSubList('destsubs', 'list', 'Subsidiaries');
		_FIELDS['destsubs'].addMarkAllButtons();
		_FIELDS['destsubs'].addField('apply','checkbox');
		_FIELDS['destsubs'].addField('subsidiaryname','text', 'Subsidiary');
		_FIELDS['destsubs'].addField('subsidiary','text').setDisplayType('hidden');
		
		var arrDestSubs = _getGroupedValues('custrecord_icc_destination_subsidiary','custrecord_icc_destination_subsidiary');
		
		if ( arrDestSubs ) {
			var arrSubsLines = [];
			for ( var ii in arrDestSubs) {
				var row = arrDestSubs[ii];
				var subsData = {};
					subsData['subsidiary'] 		= row.getValue('custrecord_icc_destination_subsidiary',null,'group');
					subsData['subsidiaryname'] 	= row.getText('custrecord_icc_destination_subsidiary',null,'group');
				arrSubsLines.push( subsData );
			}
			_FIELDS['destsubs'].setLineItemValues(arrSubsLines);
		}
	}
	
	_FIELDS['submitbtn']  = _FORM.addSubmitButton('Submit');
	_PARAMS['act'] = 'trigger';

	// print the params as hidden fields 
	__slet.printHiddenFields( _PARAMS );
	_RESP.writePage( _FORM );
	return true;
}

/**
 * Utility function to do a grouped search on IC Custom Record 
 * 
 * @param fieldname
 * @param sortColumn
 * @returns {Boolean}
 */
function _getGroupedValues( fieldname, sortColumn ){
	
	var arrSubsSearch = nlapiSearchRecord('customrecord_intercompany_charges',null,
            [(new nlobjSearchFilter(fieldname,null,'noneof','@NONE@') )
             ,(new nlobjSearchFilter('isinactive',null,'is','F') )
             // ,(new nlobjSearchFilter('custrecord_icc_source_transaction',null,'noneof','@NONE@') )
             ]
           ,[
             (new nlobjSearchColumn(fieldname,null,'group')),
             (new nlobjSearchColumn(sortColumn,null,'min')).setSort()
            ]);	
	
	return arrSubsSearch || false;
}


/**
 * Handler of submit actions for the suitelet
 * 
 * @returns
 */
function _process_trigger(){
		
	if (_REQ.getMethod() !== 'POST' ) return false;
	
	_PARAMS['iccperiod'] 	= _REQ.getParameterValues('iccperiod');
	_PARAMS['icctrans']  	= _REQ.getParameter('icctrans');
	_PARAMS['sourcesubs'] 	= _REQ.getParameter('sourcesubs');	
	_PARAMS['grouping']  	= _REQ.getParameter('grouping');
	_PARAMS['iccdate']  	= _REQ.getParameter('iccdate');
		
	var FRDNO = 'FRD004';
	
	// get the period selected
	var arrPeriods = [];
	for (var ii in _PARAMS['iccperiod']) {
		arrPeriods.push( _PARAMS['iccperiod'][ii] );
	}
		
	// get the selected Destination Subs
	var arrDestSubs = [];
	var count = _REQ.getLineItemCount('destsubs');
	for (var line=1; line<=count; line++) {
		if ( _REQ.getLineItemValue('destsubs','apply', line) == 'T' ) {
			arrDestSubs.push( _REQ.getLineItemValue('destsubs','subsidiary', line) );				
		}
	}
	
	// get the selected Source subsidiary
	var arrSourceSubs = [];
	if (_PARAMS['sourcesubs']) {
		arrSourceSubs.push( _PARAMS['sourcesubs'] );
	} else {
		// if it is not defined, get all the available source subsidiaries
		//   for the request was to process a batch
		var arrGroupedSourceSubs = _getGroupedValues('custrecord_icc_source_subsidiary','custrecord_icc_source_subsidiary');
		if ( arrGroupedSourceSubs ) {		
			for ( var ii in arrGroupedSourceSubs) {
				var row = arrGroupedSourceSubs[ii];
				arrSourceSubs.push( row.getValue('custrecord_icc_source_subsidiary',null,'group') );
			}
		}
	}
	
	// collect the records that will be added on the Batch Queue
	var queueIds = [];	
	for (var iii in arrSourceSubs)
	{
		var sourceSub = arrSourceSubs[iii];		
		var queueParams = {};
			queueParams['iccperiod'] 	= arrPeriods;
			queueParams['iccdestsubs'] 	= arrDestSubs.length ? arrDestSubs : false;
			queueParams['icctrans'] 	= _PARAMS['icctrans'];
			queueParams['grouping'] 	= _PARAMS['grouping'];
			queueParams['iccdate'] 		= _PARAMS['iccdate'];
		
		// insert into batch queue
		var stBatchId = _getLastBatchQueueId( FRDNO );
		var queueData = {};
			queueData['batch_id'] = stBatchId;
			queueData['frd_no'] = FRDNO;
			queueData['source_subsidiary'] 	= sourceSub;
			queueData['parameters'] 		= JSON.stringify(queueParams);
					
		// Add each single source subsidiary to the IC Batch Queue
		var queueId = _addToBatchQueue( queueData );
		if ( queueId ) queueIds.push( queueId );
	}
	
	if ( queueIds.length )
	{
		__nlapi.scheduleScript('customscript_icctrans_per_batch','customdeploy1', {'custscript_iccbatchperiod_frdnum':FRDNO} );
		return _view_sucessMessage('IC Transactions has been queued.');
	}
	else {
		return _view_errorMessage('The request already exists in the Batch Queue as Pending or Processing... Please try another request.');		
	}
	
	return true;
}


function _view_sucessMessage ( succMsg ) {
	_FORM = nlapiCreateForm(_HEADER_TEXT);

	var htmlMsg = _FORM.addField('htmlerror', 'inlinehtml');
		htmlMsg.setDefaultValue(succMsg);

	_FORM.addButton('custpage_btnback','Go Back', '(function (){history.go(-1);})()');

	return _RESP.writePage(_FORM);
}

function _view_errorMessage ( errorMsg ) {
	_FORM = nlapiCreateForm(_HEADER_TEXT);
	return __error.slet_report(errorMsg);
}


function _view_backToHome(  ) {
	_FORM = nlapiCreateForm(_HEADER_TEXT);
	_FORM.addField('custpage_htmlcontent', 'inlinehtml')
		.setDefaultValue('<script>location.href=\'/app/center/card.nl?sc=-29\';</script>');
	return _RESP.writePage(_FORM);
}


/**
 * Standard suitelet view for Per Transaction process
 * @returns {Boolean}
 */
function _view_PerTransactionForm( ) {
	_FORM = nlapiCreateForm(_HEADER_TEXT);
	_FORM.setScript( nlapiGetContext().getScriptId() );
	
	
	_FORM.addField('custpage_htmlcontent', 'inlinehtml')
		 .setDefaultValue('To Generate Recharges Per Transaction click on Submit. A schedule script will be triggered to generate the charges');
	
	_FIELDS['submitbtn']  = _FORM.addSubmitButton('Submit');
	_PARAMS['act'] = 'trigger';

	// print the params as hidden fields 
	__slet.printHiddenFields( _PARAMS );
	_RESP.writePage( _FORM );
	return true;
}



function _process_PerTrans(){
	
	if (_REQ.getMethod() !== 'POST' ) return false;
	
	_PARAMS['iccperiod'] 	= _REQ.getParameterValues('iccperiod');
	_PARAMS['transtype']  	= _REQ.getParameterValues('transtype');
	_PARAMS['sourcesubs'] 	= _REQ.getParameter('sourcesubs');	
		
	var arrPeriods = [];
	for (var ii in _PARAMS['iccperiod']) {
		arrPeriods.push( _PARAMS['iccperiod'][ii] );
	}
		
	var arrSourceSubs = [];
	if (_PARAMS['sourcesubs']) {
		arrSourceSubs.push( _PARAMS['sourcesubs'] );
	} else {
		var arrGroupedSourceSubs = _getGroupedValues('custrecord_icc_source_subsidiary','custrecord_icc_source_subsidiary');
		if ( arrGroupedSourceSubs ) {		
			for ( var ii in arrGroupedSourceSubs) {
				var row = arrGroupedSourceSubs[ii];
				arrSourceSubs.push( row.getValue('custrecord_icc_source_subsidiary',null,'group') );
			}
		}
	}
	
	var arrTransType = [];
	for (var ii in _PARAMS['transtype']) {
		arrTransType.push( _PARAMS['transtype'][ii] );
	}
	
	
	var arrScriptParam = {};
	arrScriptParam['custscript_iccpertran_period'] = JSON.stringify(arrPeriods);
	arrScriptParam['custscript_iccpertran_transtype'] = JSON.stringify(arrTransType);
	arrScriptParam['custscript_iccpertran_sourcesubs'] = JSON.stringify(arrSourceSubs);
	
	__log.writev('...sending parameters', [arrScriptParam]);
	
	if ( __nlapi.scheduleScript('customscript_icc_alltrans_pertrans',null, arrScriptParam) ) {
		return _view_backToHome();		
	} else {	
		return _view_errorMessage('There was an error while trying to queue your request. All deployments may be busy. Please try again later. ');
	}
}

