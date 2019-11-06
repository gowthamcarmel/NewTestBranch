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
};

var _STATUS_SO_APPROVED = 'B';
function afterSubmit_Create3PP_ILF2() {
	
	__log.start({
		 'logtitle'  : 'Create3PP_ILF'
		,'company' 	 : 'Misys'
		,'scriptname': 'Misys_L2C-014_3PP_Events.js'
		,'scripttype': 'schedulescript'
	});	
	try
	{
		nlapiLogExecution('DEBUG','TEST','TEST');
		var exec = nlapiGetContext().getExecutionContext();
		//__log.writev('type/context', [type,exec]);
		
		//o Check the script has been invoked(execution context) by user interaction, CSV or web services and user event script.
		//An after submit script is triggered when a Sales Order record is approved.
		//if (!__is.inArray(['userevent','userinterface','webservices','csvimport','workflow'], exec) ) return __log.end('Ignoring execution context:' + exec, true);
		//if (!__is.inArray(['edit','create','approve'], type) ) return __log.end('Ignoring type: ' + type, true);
		
		//o  Retrieve the transaction Saved Search from the script parameter.
		//o  If Saved Search is empty Return an error
		var paramSearch = __fn.getScriptParameter('custscript_3pp_saved_search2'); //saved Search 
		var stSO = __fn.getScriptParameter('custscript_salesid'); //sales order 
		if (! paramSearch ) return __log.end('Saved Search parameter is required.');		
		
		//o  Get the Sales Order Internal ID
		//o  Load the Sale Order record
		//var recId = stSO;
		__log.writev('*** stSO *** ' + stSO);
		var recLoadSO = nlapiLoadRecord('salesorder', stSO);
		
		if (recLoadSO.getFieldValue('custbody_3pp_events_generated') == 'T') return __log.end('3PP Events already generated');
		
		__log.setCurrentRecord(recLoadSO);
		__log.writev('*** Create 3PP Event *** ');
		
		var stStatusRef = recLoadSO.getFieldValue('orderstatus');
		var isApproved = false;
		
		
		if (stStatusRef && !stStatusRef.match(/A|C|H/gi)  ) isApproved = true;			
		
		__log.writev('...Sales Order is approved...', [stStatusRef, isApproved]);
		
		
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
									[(new nlobjSearchFilter('internalid', null, 'anyof', [stSO]))], arrCols); 
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
				
				var jobOrCust = recLoadSO.getFieldValue('job') || recLoadSO.getFieldValue('entity'); 				
				__safe.setFieldValue(rec3PP, 'custrecord_3pp_event_project_ic', jobOrCust);
				
				//	o  Type = ‘ILF’
				__safe.setFieldValue(rec3PP, 'custrecord_3pp_type', stILFId);
				__safe.setFieldValue(rec3PP, 'custrecord_3pp_event_qty', 1);
				__safe.setFieldValue(rec3PP, 'custrecord_3pp_event_rate', __fn.parseInt( billSChed.getValue('custrecord_vd_bs_amount') ));
				__safe.setFieldValue(rec3PP, 'custrecord_3pp_event_milestone', billSChed.getValue('custrecord_vd_milestone'));
				__safe.setFieldValue(rec3PP, 'custrecord_3pp_event_trigger', billSChed.getValue('custrecord_vd_bs_trigger'));
				__safe.setFieldValue(rec3PP, 'custrecord_3pp_event_source_tran', stSO);
//				__safe.setFieldValue(rec3PP, 'custrecord_3pp_event_disc', '0');
				
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
			__safe.nlapiSubmitField('salesorder', stSO, 'custbody_3pp_events_generated', 'T');
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

