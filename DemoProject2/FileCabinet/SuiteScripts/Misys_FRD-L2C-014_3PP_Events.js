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
 *
 **********************************************************************
 *
 * 1444959	- FRD14 PO header fields additional fields autopopulate
 *		add custom script parameter custscript_c3p_employee_sc (employee List/Record) - for scheduled script
 * 		add custom script parameter custscript_c3p_employee (employee List/Record) - for suitelet script
 * 1444959.2 - FRD14 add subscription item id on event
 *
 * CRPLCHLDR01 - SShubhradeep
 * 			- manage 200+ lines billing 
 *
 */

var __MAP_3PPEvent = {
		 'custrecord_3pp_type' 				: false
		,'custrecord_3pp_event_date' 		: 'trandate'//'datecreated'
		,'custrecord_3pp_event_currency' 	: 'custcol_3pp_rate_currency'
		,'custrecord_3pp_event_item' 		: 'item'
		,'custrecord_3pp_event_qty' 		: false
		,'custrecord_3pp_event_rate' 		: false
		,'custrecord_3pp_event_vendor' 		: 'item.vendor'
		,'custrecord_3pp_event_vendor_billing_schd' : 'custcol_vendor_billing_schedule_3pp'
		,'custrecord_3pp_event_milestone' 	: false
		,'custrecord_3pp_event_trigger' 	: false
		,'custrecord_3pp_event_project_ic' 	: 'entity'
		,'custrecord_3pp_event_cost_centre' : 'item.department'
		,'custrecord_3pp_event_product' 	: 'item.class'
		,'custrecord_3pp_event_item_category' : 'item.custitem_category'
		,'custrecord_3pp_event_item_subcategory1' : 'item.custitem_subcat1'
		,'custrecord_3pp_event_item_subcategory2' : 'item.custitem_subcat2'
		,'custrecord_3pp_event_region' 		: 'location'
		,'custrecord_3pp_event_start_date' 	: 'custcol_sb_start_date'
		,'custrecord_3pp_event_end_date' 	: 'custcol_sb_end_date'
		,'custrecord_3pp_event_source_tran' : false
		,'custrecord_3pp_event_misys_ref' 	: 'custbody_misysref'
		,'custrecord_3pp_event_disc' 		: 'custcol_3pp_disc_percent'
		,'custrecord_3pp_licence_basis'		: 'custcol_licence_basis'
		,'custrecord_3pp_asset_location'	: 'custcol_3pp_asset_location'
		,'custrecord_3pp_legacy_ref'		: 'custcol_3pp_legacy_ref'
		,'custrecord_3pp_asset_mngmt'		: 'custcol_3pp_asset_environ'
		,'custrecord_earliest_uplift_rev_date'		: 'custcol_ssi_earliest_uplift_rev_date'
		,'custrecord_msys_nxtpaydate'		: 'custcol_msys_nxtpaydate'
		,'custrecord_3pp_event_source_line'	: 'custcol_psi_id'	// 1444959.2
};
function afterSubmit_Create3PP_ILF(type) {
	__log.start({
		 'logtitle'  : 'Create3PP_ILF'
		,'company' 	 : 'Misys'
		,'scriptname': 'Misys_L2C-014_3PP_Events.js'
		,'scripttype': 'userevent'
	});	
	try
	{
		var exec = nlapiGetContext().getExecutionContext();
		__log.writev('type/context', [type,exec]);
		
		//o Check the script has been invoked(execution context) by user interaction, CSV or web services and user event script.
		//An after submit script is triggered when a Sales Order record is approved.
		if (!__is.inArray(['userevent','userinterface','webservices','csvimport','workflow'], exec) ) return __log.end('Ignoring execution context:' + exec, true);
		if (!__is.inArray(['edit','create','approve'], type) ) return __log.end('Ignoring type: ' + type, true);
		
		var stSO = nlapiGetRecordId();	
		var pSCHEDULEDSCRIPT = [];
		pSCHEDULEDSCRIPT['custscript_salesid'] = stSO;
		pSCHEDULEDSCRIPT['custscript_trigger_type'] = type;
			
		//Call function that creates 3PP script
		nlapiScheduleScript('customscript_ss_generate_3pp_ilf', null, pSCHEDULEDSCRIPT);
		return __log.end('End Of Script');
	}
	catch (error)
	{		
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
var _STATUS_SO_APPROVED = 'B';
function afterSubmit_Create3PP_ILF_test(type) {
	
	__log.start({
		 'logtitle'  : 'Create3PP_ILF'
		,'company' 	 : 'Misys'
		,'scriptname': 'Misys_L2C-014_3PP_Events.js'
		,'scripttype': 'userevent'
	});	
	try
	{
		var exec = nlapiGetContext().getExecutionContext();
		__log.writev('type/context', [type,exec]);
		
		//o Check the script has been invoked(execution context) by user interaction, CSV or web services and user event script.
		//An after submit script is triggered when a Sales Order record is approved.
		if (!__is.inArray(['userevent','userinterface','webservices','csvimport','workflow'], exec) ) return __log.end('Ignoring execution context:' + exec, true);
		if (!__is.inArray(['edit','create','approve'], type) ) return __log.end('Ignoring type: ' + type, true);
		
		//o  Retrieve the transaction Saved Search from the script parameter.
		//o  If Saved Search is empty Return an error
		var paramSearch = __fn.getScriptParameter('custscript_3pp_saved_search'); //saved Search 
		if (! paramSearch ) return __log.end('Saved Search parameter is required.');		
		
		//o  Get the Sales Order Internal ID
		//o  Load the Sale Order record
		var recId = nlapiGetRecordId();
		var recSO = nlapiGetNewRecord();
		var recLoadSO = nlapiLoadRecord('salesorder', recId);
		
		var s3ppClient = recSO.getFieldValue('entity'); // 1444959
		
		if (recSO.getFieldValue('custbody_3pp_events_generated') == 'T') return __log.end('3PP Events already generated');
		
		__log.setCurrentRecord(recSO);
		__log.writev('*** Create 3PP Event *** ');
		
		// Get the status of the sales order, used orderstatus instead of statusRef.  --FIP
		var stStatusRef = recSO.getFieldValue('orderstatus');
		var isApproved = false;
		
		
		if (type == 'approve') 
		{
			isApproved = true;
		}
		else if (type == 'create')
		{
			//Changed statusRef.match to the appropriate status to match orderstatus instead of statusRef. --FIP
			if (stStatusRef && !stStatusRef.match(/A|C|H/gi)  ) isApproved = true;			
		}
		else if (type == 'edit')
		{			
			var recOldSO = nlapiGetOldRecord();
			if ( recOldSO )
			{
				//Changed the getFieldValue to use orderstatus instead of statusRef  --FIP
				stStatusRef = recLoadSO.getFieldValue('orderstatus');
				var stNewSOStatusRef = recSO.getFieldValue('orderstatus');
				var stOldStatusRef = recOldSO.getFieldValue('orderstatus');
				
				__log.writev('stOldStatusRef', stOldStatusRef);	
				__log.writev('stNewSOStatusRef', stNewSOStatusRef);
				__log.writev('stStatusRef', stStatusRef);
				
				//Changed statusRef.match to the appropriate status to match orderstatus instead of statusRef. --FIP
				if ( stOldStatusRef != stStatusRef && !stStatusRef.match(/A|C|H/gi) ) isApproved = true;
				__log.writev('...Sales Order is approved ?', [type, stOldStatusRef, stOldStatusRef]);				
			}
		}		
		__log.writev('...Sales Order is approved...', [type, stStatusRef, isApproved]);
		
		
		if (! isApproved ) return __log.end('SalesOrder not yet approved');
		
		// build the columns
		var arrCols = [];
		for (var flds3pp in __MAP_3PPEvent) {
			var fldSearch = __MAP_3PPEvent[flds3pp];					
			if ( ! fldSearch ) continue;			
			var mfld = fldSearch.split('.');
			arrCols.push(
				( mfld.length > 1 ) ? new nlobjSearchColumn(mfld[1], mfld[0]) : new nlobjSearchColumn(fldSearch)
			);
		}
		
		var arrSearchResults = __nlapi.searchAllRecord('salesorder', paramSearch, 
									[(new nlobjSearchFilter('internalid', null, 'anyof', [recId]))], arrCols); 
		if (!arrSearchResults) return  __log.end('Empty Results', true);
		
		// Get the ILF Id from the Custom List
		var stILFId = (function(){			
			var search3PPEventType = nlapiSearchRecord('customlist_3pp_event_type',null,[(new nlobjSearchFilter('name',null,'is','ILF') )] );
			if (! search3PPEventType) return false;
			return ( search3PPEventType.shift() ).getId();
		})();		
		
		var arr3PPRecords = [];
		var hasError = false;
		
		for (var ii in arrSearchResults)
		{			
			var row = arrSearchResults[ii];
		
			// For each Vendor Billing Schedule
			var stVendorBillingSchedule = row.getValue('custcol_vendor_billing_schedule_3pp');
			__log.writev('...vendor billing schedule', [stVendorBillingSchedule]);
			
			// Search for the Vendor Billing Schedule line and retrieve the amount, trigger, and milestone
			var searchVendorBillingScheduleLine = nlapiSearchRecord('customrecord_vd_bs_line',null,
														[ (new nlobjSearchFilter('custrecord_vd_bsch',null,'anyof',stVendorBillingSchedule))],
														[ (new nlobjSearchColumn('custrecord_vd_milestone'))
														 ,(new nlobjSearchColumn('custrecord_vd_bs_trigger'))
														 ,(new nlobjSearchColumn('custrecord_vd_bs_amount'))]);
			
			// For each Vendor Billing Schedule Line
			for (var iii in searchVendorBillingScheduleLine)
			{
				var billSChed = searchVendorBillingScheduleLine[iii];
				
				//o  Create a Pending 3PP Events record and set the following values:
				var rec3PP = nlapiCreateRecord('customrecord_3pp_events', {'recordmode':'dynamic'});
				for (var flds3pp in __MAP_3PPEvent)
				{
					var fldSearch = __MAP_3PPEvent[flds3pp];					
					if ( ! fldSearch ) continue;
					//if (fldSearch == 'startdate' || fldSearch == 'enddate') continue; // skip the start/end dates
					
					var mfld = fldSearch.split('.');					
					var searchValue = ( mfld.length > 1 ) ? row.getValue(mfld[1], mfld[0]) : row.getValue(fldSearch);
					
					
					__safe.setFieldValue(rec3PP, flds3pp, searchValue);
				}
				
				//custrecord_3pp_event_date				
				__safe.setFieldValue(rec3PP, 'custrecord_3pp_event_date', nlapiDateToString( nlapiStringToDate(row.getValue('trandate'))) );
				
				var jobOrCust = recSO.getFieldValue('job') || recSO.getFieldValue('entity'); 				
				__safe.setFieldValue(rec3PP, 'custrecord_3pp_event_project_ic', jobOrCust);
				
				//	o  Type = ‘ILF’
				__safe.setFieldValue(rec3PP, 'custrecord_3pp_type', stILFId);
				__safe.setFieldValue(rec3PP, 'custrecord_3pp_event_qty', 1);
				__safe.setFieldValue(rec3PP, 'custrecord_3pp_event_rate', __fn.parseInt( billSChed.getValue('custrecord_vd_bs_amount') ));
				__safe.setFieldValue(rec3PP, 'custrecord_3pp_event_milestone', billSChed.getValue('custrecord_vd_milestone'));
				__safe.setFieldValue(rec3PP, 'custrecord_3pp_event_trigger', billSChed.getValue('custrecord_vd_bs_trigger'));
				__safe.setFieldValue(rec3PP, 'custrecord_3pp_event_source_tran', recId);
//				__safe.setFieldValue(rec3PP, 'custrecord_3pp_event_disc', '0');
				__safe.setFieldValue(rec3PP, 'custrecord_3pp_client', s3ppClient); // 1444959
				
				//o  Store the Internal ID of the created 3PP Event to an array so if
				var resultId3pp = __safe.nlapiSubmitRecord( rec3PP );
				if ( resultId3pp ) {
					__log.writev('..generated 3PP Event', [resultId3pp]);
					arr3PPRecords.push( resultId3pp );				
				} else {
					
					__log.writev('..error creating 3PP Event');					
					hasError = true;
					break;					
				}
			}			
			
			if ( hasError ) break;
		}
		
		if ( hasError ){
			__log.writev('...deleting 3PP Event ');
			
			for (var ii in arr3PPRecords) {
				__safe.deleteRecord('customrecord_3pp_events', arr3PPRecords[ii]);			
			}
			
		}
		else
		{
			//	o  Set 3PP Events Generated on the Sales Order = T
			//	o  Submit the Sales Order.		
			__safe.nlapiSubmitField('salesorder', recId, 'custbody_3pp_events_generated', 'T');
		}
		
		
		return __log.end('End Of Script');
	}
	catch (error)
	{		
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





function afterSubmit_Create3PP_RLF(type) {
	
	__log.start({
		 'logtitle'  : 'Create3PP_RLF'
		,'company' 	 : 'Misys'
		,'scriptname': 'Misys_L2C-014_3PP_Events.js'
		,'scripttype': 'userevent'
	});
	
	try
	{
		var exec = nlapiGetContext().getExecutionContext();
		__log.writev('type/context', [type,exec]);
		
		//o Check the script has been invoked(execution context) by user interaction, CSV or web services and user event script.
		//An after submit script is triggered when a Sales Order record is approved.
		//if (!__is.inArray(['userevent','userinterface','webservices','csvimport','workflow'], exec) ) return __log.end('Ignoring execution context:' + exec, true);// CRPLCHLDR01
		//if (!__is.inArray(['create'], type) ) return __log.end('Ignoring type: ' + type, true);// CRPLCHLDR01
		if (!__is.inArray(['create', 'edit'], type) ) return __log.end('Ignoring type: ' + type, true); // CRPLCHLDR01
		
		//o  Get the Sales Order Internal ID
		//o  Load the Sale Order record
		//var recId = nlapiGetRecordId();
		var recType = nlapiGetRecordType(); // CRPLCHLDR01		
		var recINV = nlapiGetNewRecord(); // CRPLCHLDR01
		var recId = nlapiGetRecordId(); // CRPLCHLDR01
		//nlapiLogExecution('DEBUG', 'recId:=', recId); // CRPLCHLDR01
				
		var recLoadInv = nlapiLoadRecord(recType, recId); // CRPLCHLDR01

		/***----------------------- CRPLCHLDR01 -------------------***/
		
		var CustomMappingCheck = recLoadInv.getFieldValue('custbody_custom_mappings_updated');
		nlapiLogExecution('Debug', 'CustomMappingCheck:=', CustomMappingCheck);
		
		var InvLineCount = recLoadInv.getLineItemCount('item');
		//nlapiLogExecution('Debug', 'InvLineCount:=', InvLineCount);
		
		if(parseInt(InvLineCount) > 200){
			if(CustomMappingCheck == 'T'){
				if (!__is.inArray(['userevent','userinterface','webservices','csvimport','workflow', 'scheduled'], exec) ) return __log.end('Ignoring execution context:' + exec, true);
			} else {
				nlapiLogExecution('Debug', 'Custom Mapping Not completed');
				return;
			}
		} else {
			if (!__is.inArray(['userevent','userinterface','webservices','csvimport','workflow'], exec) ) return __log.end('Ignoring execution context:' + exec, true);
		}
		/***----------------------- end of CRPLCHLDR01 -------------------***/
		
		//o  Retrieve the transaction Saved Search from the script parameter.
		//o  If Saved Search is empty Return an error
		var paramSearch = __fn.getScriptParameter('custscript_3pp_savedsearch'); //saved Search 
		if (! paramSearch ) return __log.end('Saved Search parameter is required.');
		
		
		//o  Get the Sales Order Internal ID
		//o  Load the Sale Order record
		// var recId = nlapiGetRecordId(); // CRPLCHLDR01
		// var recType = nlapiGetRecordType(); // CRPLCHLDR01		
		// var recINV = nlapiGetNewRecord(); // CRPLCHLDR01
		
		// var recLoadInv = nlapiLoadRecord(recType, recId); // CRPLCHLDR01
		
		var s3ppClient = recLoadInv.getFieldValue('entity'); // 1444959

		// if (recINV.getFieldValue('custbody_3pp_events_generated') == 'T') return __log.end('3PP Events already generated');
		
		__log.setCurrentRecord(recINV);
		__log.writev('*** Create 3PP Event *** ');
		
		// build the columns 
		var arrCols = [];
		for (var flds3pp in __MAP_3PPEvent) {
			var fldSearch = __MAP_3PPEvent[flds3pp];					
			if ( ! fldSearch ) continue;			
			var mfld = fldSearch.split('.');
			arrCols.push(
				( mfld.length > 1 ) ? new nlobjSearchColumn(mfld[1], mfld[0]) : new nlobjSearchColumn(fldSearch)
			);
		}
		arrCols.push( new nlobjSearchColumn('custcol_create_3pp_po') ); 
		arrCols.push( new nlobjSearchColumn('custcol_3pp_rate') );
		
		var arrSearchResults = __nlapi.searchAllRecord(recType, paramSearch, 
															[ (new nlobjSearchFilter('internalid', null, 'anyof', [recId]))
															 ,(new nlobjSearchFilter('custcol_create_3pp_po', null, 'is', 'T'))], 
															 arrCols); 
		if (!arrSearchResults) return  __log.end('Empty Results', true);
		
		//	o  For each line from the search result
		var stRLFd = (function(){			
			var search3PPEventType = nlapiSearchRecord('customlist_3pp_event_type',null,[(new nlobjSearchFilter('name',null,'is','RLF') )] );
			if (! search3PPEventType) return false;
			return ( search3PPEventType.shift() ).getId();
		})();
		
		var stOnPayment = (function(){			
			var searchVendorBSchTrigger = nlapiSearchRecord('customlist_vd_bs_trigger',null,[(new nlobjSearchFilter('name',null,'is','On Payment') )] );
			if (! searchVendorBSchTrigger) return false;
			return ( searchVendorBSchTrigger.shift() ).getId();
		})(); 
		
		
		var arr3PPRecords = [];
		var hasError = false;
		
		for (var ii in arrSearchResults)
		{
			//		o  For each milestone retrieved above
			var row = arrSearchResults[ii];
			
			if (row.getValue('custcol_create_3pp_po') != 'T') continue; // skip if not create 3PP
			
			//o  Create a Pending 3PP Events record and set the following values:
			var rec3PP = nlapiCreateRecord('customrecord_3pp_events', {'recordmode':'dynamic'});
			for (var flds3pp in __MAP_3PPEvent)
			{
				var fldSearch = __MAP_3PPEvent[flds3pp];
				if ( ! fldSearch ) continue;
				
				var mfld = fldSearch.split('.');					
				var searchValue = ( mfld.length > 1 ) ? row.getValue(mfld[1], mfld[0]) : row.getValue(fldSearch);
				
				
				__safe.setFieldValue(rec3PP, flds3pp, searchValue);
			}
			
			__log.writev('...start date / end date', [row.getValue('custcol_sb_start_date'), row.getValue('custcol_sb_end_date')]);
			
			var amnt3PP = row.getValue('custcol_3pp_rate');
			var amount = _calculateProRatedAmount(
									row.getValue('custcol_sb_start_date'), 
									row.getValue('custcol_sb_end_date'), 
									__fn.parseFloat(amnt3PP) );
			
			
					
			var jobOrCust = recINV.getFieldValue('entity'); //row.getValue('entity');
			__safe.setFieldValue(rec3PP, 'custrecord_3pp_event_project_ic', jobOrCust);
			
			//	o  Type = ‘RLF’
			__safe.setFieldValue(rec3PP, 'custrecord_3pp_event_date', nlapiDateToString( nlapiStringToDate(row.getValue('trandate'))) );
			__safe.setFieldValue(rec3PP, 'custrecord_3pp_type', stRLFd);				
			__safe.setFieldValue(rec3PP, 'custrecord_3pp_event_qty', 1);
			__safe.setFieldValue(rec3PP, 'custrecord_3pp_event_rate', amount);			
			__safe.setFieldValue(rec3PP, 'custrecord_3pp_event_trigger', stOnPayment);
			__safe.setFieldValue(rec3PP, 'custrecord_3pp_event_source_tran', recId);
			__safe.setFieldValue(rec3PP, 'custrecord_3pp_client', s3ppClient); // 1444959

			//o  Store the Internal ID of the created 3PP Event to an array so if
			var resultId3pp = __safe.nlapiSubmitRecord( rec3PP );
			if ( resultId3pp ) {
				__log.writev('..generated 3PP Event', [resultId3pp]);
				arr3PPRecords.push( resultId3pp );				
			} else {
				
				__log.writev('..error creating 3PP Event');					
				hasError = true;
				break;					
			}
		}
		
		if ( hasError ){
			__log.writev('...deleting 3PP Event ');
			
			for (var ii in arr3PPRecords) {
				__safe.deleteRecord('customrecord_3pp_events', arr3PPRecords[ii]);			
			}
			
		}
		else
		{
			//	o  Set 3PP Events Generated on the Sales Order = T
			//	o  Submit the Sales Order.		
			__safe.nlapiSubmitField(recType, recId, 'custbody_3pp_events_generated', 'T');
			
			__safe.nlapiSubmitField(recType, recId, 'custbody_custom_mappings_updated', 'F'); // CRPLCHLDR01
		}
		
		
		return __log.end('End Of Script');		
		
	
	}
	catch (error)
	{		
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


function _calculateProRatedAmount( startDate, endDate, amount ) {
	if ( !startDate || !endDate) return 0;
	
	var dtStartDate = nlapiStringToDate( startDate );
	var dtEndDate = nlapiStringToDate( endDate );	
	__log.writev('...start/end', [dtStartDate, dtEndDate, amount]);
	
	var endYear = dtEndDate.getFullYear();
	
	var returnAmount = amount;
	var numDays = ( (dtEndDate - dtStartDate) / (1000*3600*24) )  + 1;
	var isLeapYear = ((endYear % 4 == 0) && (endYear % 100 != 0)) || (endYear % 400 == 0);
	
	var yearDays = isLeapYear ? 366 : 365;
	
	if ( numDays < yearDays )
	{
		returnAmount = (amount/yearDays) * numDays;
	}
	returnAmount = _roundOff(returnAmount);
	__log.writev(' ... numdays, yeardays, returnamount', [numDays, yearDays, returnAmount]);
	
	return returnAmount;
}