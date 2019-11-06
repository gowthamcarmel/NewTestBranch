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

var __MAP_3PPEvent = {
		 'custrecord_3pp_type' 				: false
		,'custrecord_3pp_event_date' 		: false//'datecreated'
		,'custrecord_3pp_event_currency' 	: 'custcol_3pp_rate_currency'
		,'custrecord_3pp_event_item' 		: 'item'
		,'custrecord_3pp_event_qty' 		: false
		,'custrecord_3pp_event_rate' 		: false
		,'custrecord_3pp_event_vendor' 		: 'item.vendor'
		,'custrecord_3pp_event_vendor_billing_schd' : 'custcol_vendor_billing_schedule_3pp'
		,'custrecord_3pp_event_milestone' 	: false
		,'custrecord_3pp_event_trigger' 	: false
		,'custrecord_3pp_event_project_ic' 	: 'custcol_ic_project'
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
		,'custrecord_3pp_event_disc' 		: false
		,'custrecord_3pp_licence_basis'		: 'custcol_licence_basis'
};

var _STATUS_SO_APPROVED = 'B';
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
		
		//o  Retrieve the transaction Saved Search from the script parameter.
		//o  If Saved Search is empty Return an error
		var paramSearch = __fn.getScriptParameter('custscript_3pp_saved_search'); //saved Search 
		if (! paramSearch ) return __log.end('Saved Search parameter is required.');		
		
		//o  Get the Sales Order Internal ID
		//o  Load the Sale Order record
		var recId = nlapiGetRecordId();
		var recSO = nlapiGetNewRecord();
		
		if (recSO.getFieldValue('custbody_3pp_events_generated') == 'T') return __log.end('3PP Events already generated');
		
		__log.setCurrentRecord(recSO);
		__log.writev('*** Create 3PP Event *** ');
		
		var stStatus = recSO.getFieldValue('orderstatus');
				
		//o  If event type is create
		//	o  Check if Status = Approved
		//o  If event type is edit
		//	o  Check if Status is changed to Approved
		//o  If either of the 2 conditions above is true,
		var isApproved = false;		
		if (type == 'approve') {
			isApproved = true;
			__log.writev('...Sales Order is approved...', [type]);
		} else if (type == 'create') {			
			isApproved = ( stStatus == _STATUS_SO_APPROVED);
			__log.writev('...Sales Order is approved...', [type, stStatus]);
		} else if (type == 'edit') {
			var recOldSO = nlapiGetOldRecord();			
			var oldStatus = recOldSO.getFieldValue('status');			
			if ( oldStatus != _STATUS_SO_APPROVED && stStatus == _STATUS_SO_APPROVED) isApproved = true;
			
			__log.writev('...Sales Order is approved ?', [type, oldStatus, stStatus]);
		}		
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
		
		//	o  For each line from the search result
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
			var searchVendorBillingScheduleLine = nlapiSearchRecord('customrecord_vd_bs_line',null,[(new nlobjSearchFilter('custrecord_vd_bsch',null,'anyof',stVendorBillingSchedule))],
					[(new nlobjSearchColumn('custrecord_vd_milestone')), (new nlobjSearchColumn('custrecord_vd_bs_trigger')), (new nlobjSearchColumn('custrecord_vd_bs_amount'))]);
			
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
				__safe.setFieldValue(rec3PP, 'custrecord_3pp_event_date', nlapiDateToString( nlapiStringToDate(row.getValue('datecreated'))) );
				
				//	o  Type = ‘ILF’
				__safe.setFieldValue(rec3PP, 'custrecord_3pp_type', stILFId);				
				__safe.setFieldValue(rec3PP, 'custrecord_3pp_event_qty', 1);
				__safe.setFieldValue(rec3PP, 'custrecord_3pp_event_rate', __fn.parseInt( billSChed.getValue('custrecord_vd_bs_amount') ));
				__safe.setFieldValue(rec3PP, 'custrecord_3pp_event_milestone', billSChed.getValue('custrecord_vd_milestone'));
				__safe.setFieldValue(rec3PP, 'custrecord_3pp_event_trigger', billSChed.getValue('custrecord_vd_bs_trigger'));
				__safe.setFieldValue(rec3PP, 'custrecord_3pp_event_source_tran', recId);
				__safe.setFieldValue(rec3PP, 'custrecord_3pp_event_disc', '0');
				
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
		if (!__is.inArray(['userevent','userinterface','webservices','csvimport','workflow''], exec) ) return __log.end('Ignoring execution context:' + exec, true);
		if (!__is.inArray(['create'], type) ) return __log.end('Ignoring type: ' + type, true);
		
		//o  Retrieve the transaction Saved Search from the script parameter.
		//o  If Saved Search is empty Return an error
		var paramSearch = __fn.getScriptParameter('custscript_3pp_savedsearch'); //saved Search 
		if (! paramSearch ) return __log.end('Saved Search parameter is required.');
		
		
		//o  Get the Sales Order Internal ID
		//o  Load the Sale Order record
		var recId = nlapiGetRecordId();
		var recType = nlapiGetRecordType();		
		var recINV = nlapiGetNewRecord();
		
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
			
			var numDays = _countNumDays(row.getValue('custcol_sb_start_date'), row.getValue('custcol_sb_end_date') );
			var yearDays = false;
			if (numDays ) {
				var startDate 	= nlapiStringToDate(row.getValue('custcol_sb_start_date'));					
				var endDate 	= nlapiStringToDate(row.getValue('custcol_sb_end_date'));
				
				var startYear 	= startDate.getFullYear();
				var endYear 	= endDate.getFullYear();
				if ( startYear != endYear) {
					// TODO: What to do if year is not the same					
				}
				
				var dtStartDate = new Date();
					dtStartDate.setDate('1');
					dtStartDate.setMonth('0');
				var stStartDate = nlapiDateToString( dtStartDate );
				var dtEndDate = nlapiAddDays(nlapiAddMonths(dtStartDate, 12), -1);
				var stEndDate = nlapiDateToString( dtEndDate );
					
				__log.writev('...startYear', [startYear, stStartDate,stEndDate, [dtStartDate,dtEndDate]]);

				
				yearDays = _countNumDays(stStartDate,stEndDate);
			}
			
//			__log.writev('...numdays/yeardays', [numDays,yearDays]);
			__log.writev('...amount / numdays / yeardays', [row.getValue('fxamount'), numDays,yearDays]);
			
			var amount = (row.getValue('fxamount') / yearDays) * numDays;
				amount = Math.round( amount/10 )  * 10;
			
			//	o  Type = ‘ILF’
			__safe.setFieldValue(rec3PP, 'custrecord_3pp_event_date', nlapiDateToString( nlapiStringToDate(row.getValue('datecreated'))) );
			__safe.setFieldValue(rec3PP, 'custrecord_3pp_type', stRLFd);				
			__safe.setFieldValue(rec3PP, 'custrecord_3pp_event_qty', 1);
			__safe.setFieldValue(rec3PP, 'custrecord_3pp_event_rate', amount);			
			__safe.setFieldValue(rec3PP, 'custrecord_3pp_event_trigger', stOnPayment);
			__safe.setFieldValue(rec3PP, 'custrecord_3pp_event_source_tran', recId);
			
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


function _countNumDays( startDate, endDate ) {
	if ( !startDate || !endDate) return 0;
	
	var dtStartDate = nlapiStringToDate( startDate );
	var dtEndDate = nlapiStringToDate( endDate );
	
	__log.writev('..count num days', [dtStartDate, dtEndDate]);
	
	return ( (dtEndDate - dtStartDate) / (1000*3600*24) ) +1;	
}


