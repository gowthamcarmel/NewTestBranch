/**
 * Module Description
 * 
 * Version    Date            Author    Remarks
 * 1.00       10 Nov 2014     pshah	Generate 3PP events for SOs as a schedule script as opposed to UE to keep the order approval process consistent
 *
 **********************************************************************
 * 
 * @param {String} type Context Types: scheduled, ondemand, userinterface, aborted, skipped
 * @returns {Void}
 *
 *
 **********************************************************************
 *
 * 1444959	- FRD14 PO header fields additional fields autopopulate
 *		add custom script parameter custscript_c3p_employee_sc (employee List/Record) - for scheduled script
 * 		add custom script parameter custscript_c3p_employee (employee List/Record) - for suitelet script
 * 1444959.2 - FRD14 add subscription item id on event
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
		//,'custrecord_3pp_event_start_date' 	: 'custcol_sb_start_date'
		//,'custrecord_3pp_event_end_date' 	: 'custcol_sb_end_date'
		,'custrecord_3pp_event_start_date' 	: 'startdate'
		,'custrecord_3pp_event_end_date' 	: 'enddate'
		,'custrecord_3pp_event_source_tran' : false
		,'custrecord_3pp_event_misys_ref' 	: 'custbody_misysref'
		,'custrecord_3pp_event_disc' 		: 'custcol_3pp_disc_percent'
		,'custrecord_3pp_licence_basis'		: 'custcol_licence_basis'
		,'custrecord_3pp_asset_location'	: 'custcol_3pp_asset_location'
		,'custrecord_3pp_legacy_ref'		: 'custcol_3pp_legacy_ref'
		,'custrecord_3pp_asset_mngmt'		: 'custcol_3pp_asset_environ'
		,'custrecord_earliest_uplift_rev_date'		: 'custcol_ssi_earliest_uplift_rev_date'
		,'custrecord_misyssalestype'		: 'custbody_misyssalestype' // 1444959.2
		,'custrecord_license_band_quantity'		: 'custcol_license_band_quantity' // 1444959.2
		//,'custrecord_3pp_event_source_line'	: 'custcol_psi_id'	// 1444959.2
};

var _STATUS_SO_APPROVED = 'B';
function SS_Create3PP_ILF() {
	
	__log.start({
		 'logtitle'  : 'Create3PP_ILF'
		,'company' 	 : 'Misys'
		,'scriptname': 'Misys_L2C-014_3PP_Events.js'
		,'scripttype': 'schedulescript'
	});	
	try
	{
				
		//o  Retrieve the transaction Saved Search from the script parameter.
		//o  If Saved Search is empty Return an error
		var paramSearch = __fn.getScriptParameter('custscript_3pp_events_ilf_list_so'); //saved Search to find all SOs to process
		var paramSearch2 = __fn.getScriptParameter('custscript_3pp_events_ilf'); //process records
		var eventType = __fn.getScriptParameter('custscript_ilf_id'); //process records
		 
		if (! paramSearch ) return __log.end('Saved Search parameter is required.');		
		if (! paramSearch2 ) return __log.end('Saved Search parameter2 is required.');
		if (! eventType ) return __log.end('ILF parameter is required.');
		
		// Get the ILF Id from the Custom List
		var ILFId = eventType; //ILF
		
		//search for the sales orders that require processing
		// Load a search and get the first three results
		
		var searchSO = nlapiLoadSearch(null,paramSearch); //5units
		var resultSet = searchSO.runSearch();
		if ( !resultSet ) return  __log.end('Empty Results', true);
		
		var searchSOResults = resultSet.getResults(0, 35); //10 units --- only want to process 40 sales orders at a time to control governance, if more than 40 results are available to process the script will reschedule itself.
		__log.writev('...searchSOResults...', searchSOResults.length);
		for (var i=0; i<searchSOResults.length; i++){
			var stSO = searchSOResults[i].getValue('internalid',null,'GROUP');
			generate3PPEventsILF(stSO,paramSearch2,eventType,ILFId); //call function to process sales order
		}
		
		//check if any more records need processing if found then reschedule script
		var searchRemaining = nlapiSearchRecord(null, paramSearch); //10 units
		if (!searchRemaining) return __log.end('Empty Results', true);
		
		//reschedule script
		var context = nlapiGetContext();
		__log.writev('...rescheduling script...', '');
		nlapiScheduleScript(context.getScriptId(), context.getDeploymentId());
		
        //if ( status == 'QUEUED' )
           //break; 
		
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

function generate3PPEventsILF(stSO,paramSearch2,eventType,ILFId){
	//o  Get the Sales Order Internal ID
	//o  Load the Sale Order record
	//var recId = stSO;
	__log.writev('*** stSO *** ' + stSO);
	var recSO = nlapiLoadRecord('salesorder', stSO); //10 units
	var s3ppClient = recSO.getFieldValue('entity'); // 1444959
	
	if (recSO.getFieldValue('custbody_3pp_events_generated') == 'T') return __log.end('3PP Events already generated');
	
	__log.setCurrentRecord(recSO);
	__log.writev('*** Create 3PP Event *** ');
	
	var stStatusRef = recSO.getFieldValue('orderstatus');
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
	
	var arrSearchResults = __nlapi.searchAllRecord('salesorder', paramSearch2, 
								[(new nlobjSearchFilter('internalid', null, 'anyof', [stSO]))], arrCols); //10units
	if (!arrSearchResults) return  __log.end('Empty Results', true);
	
	
	
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
			
			//var jobOrCust = recSO.getFieldValue('job') || recSO.getFieldValue('entity'); 				
			//__safe.setFieldValue(rec3PP, 'custrecord_3pp_event_project_ic', jobOrCust);
			__safe.setFieldValue(rec3PP, 'custrecord_3pp_event_project_ic', row.getValue('custrecord_vd_bs_project','custcol_vendor_billing_schedule_3pp'));
			
			//	o  Type = ‘ILF’
			__safe.setFieldValue(rec3PP, 'custrecord_3pp_type', ILFId);
			__safe.setFieldValue(rec3PP, 'custrecord_3pp_event_qty', 1);
			__safe.setFieldValue(rec3PP, 'custrecord_3pp_event_rate', __fn.parseInt( billSChed.getValue('custrecord_vd_bs_amount') ));
			__safe.setFieldValue(rec3PP, 'custrecord_3pp_event_milestone', billSChed.getValue('custrecord_vd_milestone'));
			__safe.setFieldValue(rec3PP, 'custrecord_3pp_event_trigger', billSChed.getValue('custrecord_vd_bs_trigger'));
			__safe.setFieldValue(rec3PP, 'custrecord_3pp_event_source_tran', stSO);
			__safe.setFieldValue(rec3PP, 'custrecord_3pp_client', s3ppClient); // 1444959

			
			//o  Store the Internal ID of the created 3PP Event to an array so if
			var resultId3pp = __safe.nlapiSubmitRecord( rec3PP ); //4 units
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
			__safe.deleteRecord('customrecord_3pp_events', arr3PPRecords[ii]);	//4 units		
		}
		
	}
	else
	{
		//	o  Set 3PP Events Generated on the Sales Order = T
		//	o  Submit the Sales Order.		
		__safe.nlapiSubmitField('salesorder', stSO, 'custbody_3pp_events_generated', 'T'); //10 units
	}
	
	
	return __log.end('End Of Script');
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

