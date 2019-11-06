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
//Modify FRD 004

//Hide the Edit Button if the Role doesnot match in the script parameter.

var _SCRIPT_PARAMS = {}, _ALL_SUBS = [];

/**
 * Scheduled script that creates IC Recharges records
 * @param type
 * @returns
 */
function sched_GenerateIC(type) {
	
	__log.start({
		 'logtitle'  : 'ExpenseRecharges-SS'
		,'company' 	 : 'Misys'
		,'scriptname': 'Misys_FRD-RDR-009_SL_ExpenseRecharges.js'
		,'scripttype': 'scheduled'
	});
	try
	{
		// Read the script parameter values received from the suitelet and script deployment page
		_SCRIPT_PARAMS['custscript_icrecharge_type'] 	 	= __fn.getScriptParameter('custscript_icrecharge_type') || false;
		_SCRIPT_PARAMS['custscript_icrecharge_enddate']  	= __fn.getScriptParameter('custscript_icrecharge_enddate') || false;
		_SCRIPT_PARAMS['custscript_icrecharge_subslist'] 	= __fn.getScriptParameter('custscript_icrecharge_subslist') || false;
		_SCRIPT_PARAMS['custscript_icrecharge_allocttype'] 	= __fn.getScriptParameter('custscript_icrecharge_allocttype') || false;
		_SCRIPT_PARAMS['custscript_icrecharge_upliftitem'] 	= __fn.getScriptParameter('custscript_icrecharge_upliftitem') || false;

		_SCRIPT_PARAMS['custscript_recharges_email_alert']  	= __fn.getScriptParameter('custscript_recharges_email_alert') || false; // GBM 03192014 added email alert parameter

		_ALL_SUBS  = _SCRIPT_PARAMS['custscript_icrecharge_subslist'] ? _SCRIPT_PARAMS['custscript_icrecharge_subslist'].split('|') : [];

		__log.setSuffix([_SCRIPT_PARAMS['custscript_icrecharge_type'], _SCRIPT_PARAMS['custscript_icrecharge_enddate']].join(':'));
		__log.writev(' Parameters received', _SCRIPT_PARAMS);

//		if (__is.empty(_SCRIPT_PARAMS['custscript_icrecharge_type']))
//			return __error.report('Transaction Type cannot be empty');

		if (__is.empty(_SCRIPT_PARAMS['custscript_icrecharge_enddate']))
			return __error.report('End Date cannot be empty');

		if (__is.empty(_SCRIPT_PARAMS['custscript_icrecharge_subslist']) || !_ALL_SUBS || !_ALL_SUBS.length)
			return __error.report('Subsidiary cannot be empty');


		// Script will do a search on Expense and Vendor Bill report lines and for each line, it will create an IC Recharge record
		var ii = 0;
		while (_ALL_SUBS.length) {  
			var subsId = _ALL_SUBS.shift();
			__log.writev('... subsid', [ii++, subsId, _ALL_SUBS]);

            _create_ICRecharge('expensereport', subsId, _MAP_EXPREP);
			_create_ICRecharge('vendorbill', subsId, _MAP_BILL);
			
			__log.writev('... remaining', [_ALL_SUBS.length]);

			if (! __usage.hasRemaining('85%') ) {
				if ( _RescheduleScript() ) break;
			}
		}

		// GBM 03192014 This function call will send email alert specified on email alert id
		sendEmailAlert(_SCRIPT_PARAMS['custscript_recharges_email_alert']);

		__log.end('EndofScript');
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
 * Search on Expense and Vendor Bill report lines and for each line, it will create an IC Recharge record
 * @param tranType
 * @param subsId
 * @param MAPVALUES
 * @returns {Boolean}
 */
function _create_ICRecharge( tranType, subsId, MAPVALUES ) {

	var  cx = nlapiGetContext();
	__log.setSuffix([cx.getDeploymentId(),tranType, subsId].join('|'));
	__log.writev('*** Processing subsid ', [subsId]);

	var stEndDate = _SCRIPT_PARAMS['custscript_icrecharge_enddate'];
	var dtEndDate = nlapiStringToDate(stEndDate);

	var arrFilters = [];
	arrFilters.push( new nlobjSearchFilter('subsidiary', null, 'anyof', subsId) );
	arrFilters.push( new nlobjSearchFilter('subsidiary', 'custcol_ic_project', 'noneof', subsId) );
	arrFilters.push( new nlobjSearchFilter('trandate', null, 'onorbefore', dtEndDate) );

	var arrColumns = [];
	arrColumns.push( new nlobjSearchColumn('line') );
	arrColumns.push( new nlobjSearchColumn('linesequencenumber') );
	arrColumns.push( new nlobjSearchColumn('internalid') );
	arrColumns.push( new nlobjSearchColumn('amount') );
	// arrColumns.push( new nlobjSearchColumn('custrecord_local_currency','subsidiary') );
	
	var stPeriodText = '';// GBM 03212014 workaround variable
	for (var custFld in MAPVALUES)
	{
		var tranFld = MAPVALUES[custFld];
		if (! tranFld) continue;

		var transfields = tranFld.split(/\./g);

		if ( transfields[1] )
			arrColumns.push( new nlobjSearchColumn(  transfields[1],  transfields[0] ) );
		else
			arrColumns.push( new nlobjSearchColumn(  transfields[0] ) );
	}
	
	
	var searchId = tranType =='expensereport' ? 'customsearch_frd009_exprep' : 'customsearch_frd009_vendorbill';
	//var searchId = tranType =='expensereport' ? 'customsearch_frd009_exprep_2' : 'customsearch_frd009_vendorbill_2';
	var arrSearchResults = __nlapi.searchAllRecord('transaction', searchId, arrFilters, arrColumns);

	__log.writev('.. Search Total ', [arrSearchResults ? arrSearchResults.length : 0]);
	
	var arrICDataRecords = {};

	for (var ii in arrSearchResults)
	{
		var resultRow = arrSearchResults[ii];
		
		// BFF 03252014 -- check if the Project (IC) is a Project --//
		var dataProjectIC = resultRow.getValue('custcol_ic_project');
		if (__is.empty(dataProjectIC)) continue; // skip this if no Project IC defined
		
		var stProjectICType = nlapiLookupField('job', dataProjectIC, 'recordtype');
		if(!stProjectICType || stProjectICType != 'job') continue;  // skip if Project IC is not a Project
		var excludeFromRecharges = nlapiLookupField('job', dataProjectIC,'custentity_excludeicrecharge');
		// proceed creation of IC record if Project is a project

		var dataIC = {};
		for (var custFld in MAPVALUES)
		{
			var tranFld = MAPVALUES[custFld];
			if (! tranFld) continue;

			var transfields = tranFld.split(/\./g);
			dataIC[ custFld ] =  transfields[1] ? resultRow.getValue( transfields[1],  transfields[0]) : resultRow.getValue(  transfields[0] );
		}
		
		dataIC['custrecord_icc_allocation_type'] = _SCRIPT_PARAMS['custscript_icrecharge_allocttype'];
		dataIC['custrecord_icc_source_internal_id'] = resultRow.getId();
		dataIC['custrecord_icc_source_transaction'] = resultRow.getId();
		
		var stAmount	= __fn.parseFloat( resultRow.getValue('amount') );
		dataIC['custrecord_icc_rate_fcy'] = stAmount;
		dataIC['custrecord_icc_amount_fcy'] = stAmount;
		
		__log.writev('*** Data', [dataIC]);
		var itemData = nlapiLookupField('item', dataIC['custrecord_icc_item'], ['custitem_category','custitem_subcat1','custitem_subcat2']);		
		dataIC['custrecord_icc_item_category'] = itemData['custitem_category'];
		dataIC['custrecord_icc_sub_category_1'] = itemData['custitem_subcat1'];
		dataIC['custrecord_icc_sub_category_2'] = itemData['custitem_subcat2'];		
		dataIC['custrecord_icc_quantity'] = 1;
		
		var stProjectIC = dataProjectIC;
		var stCostCtr   = resultRow.getValue('department');
		var stRegion 	= resultRow.getValue('location');
		var stProduct 	= resultRow.getValue('class');
		
		if ( excludeFromRecharges!='T' && stProjectIC && stCostCtr && stRegion && stProduct)
		{
			var uniqKey = [ dataIC['custrecord_icc_source_subsidiary'], 
			                dataIC['custrecord_icc_destination_subsidiary'],
			                resultRow.getId(),
			                stProjectIC, stCostCtr, stProduct, stRegion ].join('||');
			
			if (! arrICDataRecords[uniqKey] )
			{
				arrICDataRecords[uniqKey] = dataIC;		
			}
			else 
			{
				 arrICDataRecords[uniqKey]['custrecord_icc_rate_fcy']+=__fn.parseFloat( stAmount );		
				 arrICDataRecords[uniqKey]['custrecord_icc_amount_fcy'] = arrICDataRecords[uniqKey]['custrecord_icc_rate_fcy'];
			}
		}
		else
			__log.writev('..skipping this line', [excludeFromRecharges, stProjectIC, stCostCtr, stProduct, stRegion]);
		
//		if (! arrICDataRecords[uniqKey])  arrICDataRecords[recordId] = [ dataIC ];
//		arrICDataRecords[recordId].push(dataIC);
	}
	
	__log.writev('*** Data To Process *** ', [arrICDataRecords]);
	
	
	for (var uniqKey in arrICDataRecords)
	{
		var dataIC = arrICDataRecords[uniqKey];
		var dataUplift = {};
		
		__log.writev('..Attempting to create the IC rechrage record',  [uniqKey, dataIC, uniqKey]);
		
		
		var stPeriodId = nlapiLookupField(tranType , dataIC['custrecord_icc_source_internal_id'], 'postingperiod');
		__safe.setFieldValue(recICRcharge, 'custrecord_icc_period', stPeriodId);		
		dataIC['custrecord_icc_period'] = stPeriodId; // back it up for the uplift
				
		var recICRcharge = nlapiCreateRecord('customrecord_intercompany_charges', {'recordmode':'dynamic'});
		for (var fld in dataIC){
			var value = dataIC[fld];
			__safe.setFieldValue(recICRcharge, fld, value);

			dataUplift[fld] = value; // back it up for the uplift 
		}
		
		var resultId = __safe.nlapiSubmitRecord(recICRcharge);
		__log.writev('*** New Record Created: [IC]', [resultId]);
		
		
		/**
		 * A second line must be created in the Intercompany Charge record using the Uplift recharge item.
		 * THe value of the uplift is 5% of the value of the expense.
		 * The recharge lines will be defined with the same values as the expense recharges, with the exception of
		 * 
		 * 1.) Rate/Amount � 5% of the value of the expense fields- the % is defined on the IC Expense recharge item, in the Uplift % field; 
		 * 2.) Item  Uplift item- script parameter.
		 */				
		// create the Uplift //
		var itemUplift = _SCRIPT_PARAMS['custscript_icrecharge_upliftitem'];
		if ( ! __is.empty(itemUplift)  ) {
			
			// var uplift pct 
			var upliftPCT = nlapiLookupField('item', dataIC['custrecord_icc_item'], 'custitem_misys_expenseuplift_pct');
				upliftPCT = upliftPCT ?  __fn.parseFloat( upliftPCT ) : 0;						
			__log.writev('..uplift pct', [upliftPCT]);
			
			if( upliftPCT ) {
				
				dataUplift['custrecord_icc_item']  = itemUplift;
				dataUplift['custrecord_icc_rate_fcy'] = __fn.parseFloat( dataUplift['custrecord_icc_rate_fcy'] ) * upliftPCT / 100;
				dataUplift['custrecord_icc_amount_fcy'] = __fn.parseFloat( dataUplift['custrecord_icc_rate_fcy'] ) * __fn.parseFloat(dataUplift['custrecord_icc_quantity']);
				
				__log.writev('..Creating the uplift item', [dataUplift]);				
				
				var recUplift = nlapiCreateRecord('customrecord_intercompany_charges', {'recordmode':'dynamic'});
				for (var fld in dataUplift){
					var value = dataUplift[fld];
					__safe.setFieldValue(recUplift, fld, value);
				}				
				var resultId = __safe.nlapiSubmitRecord(recUplift);
				__log.writev('*** New Record Created: [IC-Uplift]', [resultId]);
			}
		}
		
		nlapiSubmitField(tranType, dataIC['custrecord_icc_source_internal_id'], 'custbody_exprecharge_processed', 'T');
		__log.writev('...updating the custbody_exprecharge_processed ', [tranType, dataIC['custrecord_icc_source_internal_id']]);
		
		
		if (! __usage.hasRemaining('85%') ) {
			_ALL_SUBS.push(subsId);
			if ( _RescheduleScript() ) break;
		}		
	}
	
	

	return  true;
}


//----------------------------------------------------------------------------------------------//
//----------------------------------------------------------------------------------------------//

function _RescheduleScript()
{
	var  cx = nlapiGetContext();
	_SCRIPT_PARAMS['custscript_icrecharge_subslist'] = _ALL_SUBS.join('|');

	__log.writev('** Rescheduling the script', [_SCRIPT_PARAMS]);

	return __nlapi.scheduleScript(cx.getScriptId(), cx.getDeploymentId(), _SCRIPT_PARAMS);
}




var _MAP_EXPREP = {
	 'custrecord_icc_date' 				: 'trandate'
	,'custrecord_icc_currency' 			: 'currency' 
	,'custrecord_icc_period' 			: false //'postingperiod'
	 ,'custrecord_icc_project' 			: 'custcol_ic_project'
	,'custrecord_icc_source_subsidiary' : 'subsidiary'
	,'custrecord_icc_source_department' : 'department'
	,'custrecord_icc_source_location' 	: 'location'
	,'custrecord_icc_source_class' 		: 'class'
	,'custrecord_icc_destination_subsidiary' : 'customer.subsidiary'
	,'custrecord_icc_destination_department' : 'department'
	,'custrecord_icc_destination_location' 	 : 'location'
	,'custrecord_icc_destination_class' 	 : 'class'
	,'custrecord_icc_quantity' 	 			 : false //'quantity'
	,'custrecord_icc_rate_fcy' 	 			 : false //'netamountnotax' # get this from the actual line instead
	,'custrecord_icc_amount_fcy' 	 		 : false
	,'custrecord_icc_item' 	 				 : 'expenseCategory.custrecord_misys_exprecharge_item'
	,'custrecord_icc_item_category' 	  	 : false
	,'custrecord_icc_sub_category_1' 	 	 : false
	,'custrecord_icc_sub_category_2' 	 	 : false
	,'custrecord_icc_source_internal_id'	 : false
	,'custrecord_icc_source_transaction'	 : false
};

// TODO: don't use custcol_accruals_project, use another custom field for the projects //custcol_ic_project

var _MAP_BILL = {
	 'custrecord_icc_date' 				: 'trandate'
	,'custrecord_icc_currency' 			: 'subsidiary.currency' // currency of the subsidiary
	,'custrecord_icc_period' 			: false //'postingperiod'
	,'custrecord_icc_period' 			: 'accountingperiod.internalid'
	,'custrecord_icc_project' 			: 'custcol_ic_project'
	,'custrecord_icc_source_subsidiary' : 'subsidiary'
	,'custrecord_icc_source_department' : 'department'
	,'custrecord_icc_source_location' 	: 'location'
	,'custrecord_icc_source_class' 		: 'class'
  //,'custrecord_icc_destination_subsidiary' : 'custcol_ic_project.customer'// GBM 03212014 revised field to subsidiary
	,'custrecord_icc_destination_subsidiary' : 'custcol_ic_project.subsidiary'
	,'custrecord_icc_destination_department' : 'department'
	,'custrecord_icc_destination_location' 	 : 'location'
	,'custrecord_icc_destination_class' 	 : 'class'
	,'custrecord_icc_quantity' 	 			 : false //'quantity'
	,'custrecord_icc_rate_fcy' 	 			 : false //'netamountnotax'
	,'custrecord_icc_amount_fcy' 	 		 : false
	,'custrecord_icc_item' 	 				 : 'expenseCategory.custrecord_misys_exprecharge_item'
	,'custrecord_icc_item_category' 	  	 : false
	,'custrecord_icc_sub_category_1' 	 	 : false
	,'custrecord_icc_sub_category_2' 	 	 : false
	,'custrecord_icc_source_internal_id'	 : false
	,'custrecord_icc_source_transaction'	 : false
};	


//This function sends email upon successful completion of the script
//GBM 03092014
function sendEmailAlert(stEmailAlertId)
{
	var stLogTitle = 'sendEmailAlert';
	
	if(stEmailAlertId)
	{
		var recEmailAlert = nlapiLoadRecord('customrecord_email_alerts', stEmailAlertId);
		
		var stEmailSubject = recEmailAlert.getFieldValue('custrecord_email_subject');
		var stEmailBody = recEmailAlert.getFieldValue('custrecord_email_body');
		var stEmailFrom = recEmailAlert.getFieldValue('custrecord_email_from');
		
		var stEmailTo = nlapiGetUser();
		
		nlapiSendEmail(stEmailFrom, stEmailTo, stEmailSubject, stEmailBody); // Email sent to Current User
	}
	else
	{
		nlapiLogExecution('DEBUG', stLogTitle, 'SCRIPT Parameter Email Alert is Empty. Cannot Send Email');
	}
}

