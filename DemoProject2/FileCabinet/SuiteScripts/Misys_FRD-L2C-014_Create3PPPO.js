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
 * 1444959.2 - FRD14 add event Id for better tracking
 * 
 */

//P2P - change

var LOGGER_TITLE = 'Create 3PP PO Suitelet';

var SCHED_SCRIPT_ID = 'customscript_create_3pp_po_sched';

var USAGE_LIMIT_THRESHOLD = 2500;

/**
 * Main suitelet for Create 3PP PO routine
 * @author Aurel Shenne Sinsin
 * @version 1.0
 */
function suitelet_create3PPPO()
{ 
    try
    {  
    	nlapiLogExecution('DEBUG', LOGGER_TITLE, '>>Entry<<');
    	
    	var stStage = request.getParameter('custpage_stage');
		nlapiLogExecution('DEBUG', LOGGER_TITLE, 'Stage = ' + stStage);
		
    	var form = nlapiCreateForm('Create 3PP PO');
    	
    	switch(stStage)
        {        	
        	case 'parametersSubmitted':
    		    form = displaySublist(request,response, form);
    		    break;
        	case 'sublistSubmitted':
    		    form = process3PPEvents(request,response, form);
    		    break;
        	default:
        		form = displayParameters(request,response, form);    	 
        }
    	
    	nlapiLogExecution('DEBUG', LOGGER_TITLE, '>>Exit<<');
    } 
    catch (error)
    {
    	if (error.getDetails != undefined)
        {
            nlapiLogExecution('ERROR','Process Error',  error.getCode() + ': ' + error.getDetails());
            throw error;
        }
        else
        {
            nlapiLogExecution('ERROR','Unexpected Error', error.toString()); 
            throw nlapiCreateError('99999', error.toString());
        }    	 
        return false;
    }    
}


/**
 * Display the parameters to be used when running the routine
 * @param request
 * @param response
 * @param form
 * @param stVB
 */
function displayParameters(request, response, form)
{
	var context = nlapiGetContext();
	
	// Retrieve the email recipient and email alert from the script parameter
	var stEmailRecipient = context.getSetting('SCRIPT', 'custscript_c3p_email_recipient');
	var stEmailAlert = context.getSetting('SCRIPT', 'custscript_c3p_email_alert');
	var stCustomForm = context.getSetting('SCRIPT', 'custscript_c3p_custom_form');
	var lstEmployee = context.getSetting('SCRIPT', 'custscript_c3p_employee'); // 1444959 set default PO Employee
	var st3PPEVentTypeCustomRecordId = context.getSetting('SCRIPT', 'custscript_3pp_event_type_cust_rec');
	// TODONE: Revrt DeleteEvents to as is
	var bDeleteEvents = context.getSetting('SCRIPT', 'custscript_c3p_delete_events');
	//var bDeleteEvents = "F";
	var st3PPPOFolder = context.getSetting('SCRIPT', 'custscript_c3p_3pp_po_folder');
	nlapiLogExecution('DEBUG', LOGGER_TITLE, 'Script Parameters: Email Recipient = ' + stEmailRecipient
    		+ '\n <br /> Email Alert = ' + stEmailAlert
    		+ '\n <br /> Custom Form = ' + stCustomForm
    		+ '\n <br /> 3PP Event Type Custom Record = ' + st3PPEVentTypeCustomRecordId
    		+ '\n <br /> Delete 3PP Events = ' + bDeleteEvents
    		+ '\n <br /> 3PP PO Folder = ' + st3PPPOFolder);
	if (isEmpty(stEmailRecipient) || isEmpty(stEmailAlert) || isEmpty(stCustomForm) || isEmpty(st3PPEVentTypeCustomRecordId))
	{	
		throw nlapiCreateError('99999', 'Please enter values on the script parameter');
	}
	
	form = nlapiCreateForm('Create 3PP PO');
	form.setScript('customscript_create_3pp_po_helper');
	
	// Add hidden fields to be passed to the next page
	var fldStage = form.addField('custpage_stage', 'text', 'Stage');
	fldStage.setDefaultValue('parametersSubmitted');
	fldStage.setDisplayType('hidden');
	
	form.addField('custpage_email_recipient', 'text', 'Email Recipient').setDisplayType('hidden').setDefaultValue(stEmailRecipient);
	form.addField('custpage_email_alert', 'text', 'Email Alert').setDisplayType('hidden').setDefaultValue(stEmailAlert);
	form.addField('custpage_custom_form', 'text', 'Custom Form').setDisplayType('hidden').setDefaultValue(stCustomForm);
	form.addField('custpage_delete_events', 'text', 'Delete Events').setDisplayType('hidden').setDefaultValue(bDeleteEvents);
	form.addField('custpage_3pp_po_folder', 'text', '3PP PO Folder').setDisplayType('hidden').setDefaultValue(st3PPPOFolder);
		
	// Add Type field with values from 3PP Event Type list
	var fldType = form.addField('custpage_type', 'select', 'Type', st3PPEVentTypeCustomRecordId).setMandatory(true);
	
	// Add Vendor field with values including Vendors from Pending 3PP Events
	var fldVendor = form.addField('custpage_vendors', 'select', 'Vendors');	
	var arrColumns = [new nlobjSearchColumn('custrecord_3pp_event_vendor', null, 'group')];
	var arr3PPVendorsSearch = nlapiSearchRecord('customrecord_3pp_events', null, null, arrColumns);
	if (arr3PPVendorsSearch != null)
	{
		fldVendor.addSelectOption('', '');
		for (var i = 0; i < arr3PPVendorsSearch.length; i++)
		{
			fldVendor.addSelectOption(arr3PPVendorsSearch[i].getValue('custrecord_3pp_event_vendor', null, 'group'), arr3PPVendorsSearch[i].getText('custrecord_3pp_event_vendor', null, 'group'));
		}		
	}
	
	form.addField('custpage_misys_ref', 'select', 'Misys Ref'); // Misys Ref	
	form.addField('custpage_start_date', 'date', 'Start Date'); // Start Date
	form.addField('custpage_end_date', 'date', 'End Date'); // End Date
	
	// Add Submit and Cancel buttons
	form.addSubmitButton('Submit');
	form.addButton('custpage_cancel_button', 'Cancel', 'window.location=\'/app/center/card.nl?sc=-29\'');
	
	response.writePage(form);
}


/**
 * Display form with Pending 3PP Events sublist
 * @param request
 * @param response
 * @param form
 */
function displaySublist(request, response, form)
{
var context = nlapiGetContext();
	
	form = nlapiCreateForm('Create 3PP PO');
	
	var fldStage = form.addField('custpage_stage', 'text', 'Stage');	
	fldStage.setDisplayType('hidden');
	
	// Retrieve the data entered by the user on the form
	var stType = request.getParameter('custpage_type');
	var stMisysRef = request.getParameter('custpage_misys_ref');
	var stVendor = request.getParameter('custpage_vendors');
	var stStartDate = request.getParameter('custpage_start_date');
	var stEndDate = request.getParameter('custpage_end_date');
	nlapiLogExecution('DEBUG', LOGGER_TITLE, 'Script Parameters: Type = ' + stType
    		+ '\n <br /> Misys Ref = ' + stMisysRef
    		+ '\n <br /> Vendor = ' + stVendor
    		+ '\n <br /> Start Date = ' + stStartDate
    		+ '\n <br /> End Date = ' + stEndDate);
	
	// Add validation to ensure that Misys Ref filter is populated if Type is ILF
	if (stType == '1' && isEmpty(stMisysRef) && isEmpty(stVendor))
	{
		fldStage.setDefaultValue('');
		
		// Show a message to the user to notify him that the Misys Ref is required if Type is ILF		
		form.addField('custpage_message', 'text', 'Vendor and Misys Ref are required for ILF').setDisplayType('inline');
		
		// Create the Go Back button
		form.addSubmitButton('Go Back');
	}
	else
	{
		// Add sublist fields
		var sublist3PPEvents = form.addSubList('custpage_3pp_events_list', 'list', '3PP Events');
		sublist3PPEvents.addField('custpage_so_check', 'checkbox', 'Select 3PP Event');
		sublist3PPEvents.addField('custpage_3pp_event_id', 'text', '3PP Event ID').setDisplayType('hidden');
		sublist3PPEvents.addField('custpage_3pp_event_vendor', 'select', '3PP Event Vendor', '-3').setDisplayType('inline');
		sublist3PPEvents.addField('custpage_3pp_event_currency', 'select', '3PP Event Currency', '-122').setDisplayType('inline');
		sublist3PPEvents.addField('custpage_3pp_event_item', 'select', '3PP Event Item', '-10').setDisplayType('inline');
		sublist3PPEvents.addField('custpage_3pp_event_qty', 'integer', '3PP Event Qty').setDisplayType('inline');
		sublist3PPEvents.addField('custpage_3pp_event_rate', 'float', '3PP Event Rate').setDisplayType('inline');		
		sublist3PPEvents.addField('custpage_3pp_source_tran', 'select', '3PP Source Transaction', '-30').setDisplayType('inline');
		sublist3PPEvents.addField('custpage_3pp_billing_milestone', 'text', 'Milestone').setDisplayType('inline');
		sublist3PPEvents.addField('custpage_3pp_date', 'date', 'Date').setDisplayType('inline');
		sublist3PPEvents.addField('custpage_3pp_item', 'select', 'Item', '-10').setDisplayType('inline');
		
		form.addField('custpage_type', 'text', 'Type').setDisplayType('hidden').setDefaultValue(stType);
		
		// Retrieve the script parameter values from the request and set as hidden values	
		form.addField('custpage_email_recipient', 'text', 'Email Recipient').setDisplayType('hidden').setDefaultValue(request.getParameter('custpage_email_recipient'));
		form.addField('custpage_email_alert', 'text', 'Email Alert').setDisplayType('hidden').setDefaultValue(request.getParameter('custpage_email_alert'));	
		form.addField('custpage_custom_form', 'text', 'Custom Form').setDisplayType('hidden').setDefaultValue(request.getParameter('custpage_custom_form'));
		form.addField('custpage_delete_events', 'text', 'Delete Events').setDisplayType('hidden').setDefaultValue(request.getParameter('custpage_delete_events'));
		form.addField('custpage_3pp_po_folder', 'text', '3PP PO Folder').setDisplayType('hidden').setDefaultValue(request.getParameter('custpage_3pp_po_folder'));
		
		// Search against 3PP Events for data that will be displayed for PO creation using the data from the form
		var arrFilters = new Array();
		arrFilters.push(new nlobjSearchFilter('custrecord_3pp_type', null, 'anyof', stType));
		if (!isEmpty(stMisysRef))
		{
			arrFilters.push(new nlobjSearchFilter('custrecord_3pp_event_misys_ref', null, 'is', stMisysRef));		
		}
		if (!isEmpty(stVendor))
		{
			arrFilters.push(new nlobjSearchFilter('custrecord_3pp_event_vendor', null, 'anyOf', stVendor));		
		}
		if (!isEmpty(stStartDate))
		{
			arrFilters.push(new nlobjSearchFilter('custrecord_3pp_event_start_date', null, 'onOrAfter', stStartDate));		
		}
		if (!isEmpty(stEndDate))
		{
			arrFilters.push(new nlobjSearchFilter('custrecord_3pp_event_end_date', null, 'onOrBefore', stEndDate));		
		}

	    // jkbautista : 20141124 - Adding additional filters for misys request
		arrFilters.push(new nlobjSearchFilter('custrecord_3pp_selected_for_creation', null, 'is', 'F'));
		arrFilters.push(new nlobjSearchFilter('custrecord_3pp_event_process_status', null, 'is', 2));
      
		nlapiLogExecution('DEBUG', LOGGER_TITLE, arrFilters.length);
			
		var arrColumns = [new nlobjSearchColumn('internalid').setSort(true),
		               new nlobjSearchColumn('custrecord_3pp_event_vendor'),
		               new nlobjSearchColumn('custrecord_3pp_event_currency'),
		               new nlobjSearchColumn('custrecord_3pp_event_item'),
		               new nlobjSearchColumn('custrecord_3pp_event_qty'),
		               new nlobjSearchColumn('custrecord_3pp_event_rate'),
		               new nlobjSearchColumn('custrecord_3pp_event_source_tran'),
		               new nlobjSearchColumn('custrecord_3pp_event_milestone'),
		               new nlobjSearchColumn('custrecord_3pp_event_date'),
		               new nlobjSearchColumn('custrecord_3pp_event_item'),
					new nlobjSearchColumn('custrecord_3pp_event_misys_ref')]; // 1444959	
		
		var arr3PPEventsSearch = nlapiSearchRecord('customrecord_3pp_events', null, arrFilters, arrColumns);
		
		// If there are results from the search
		if (arr3PPEventsSearch != null)
		{
			var sublistLineNum = 1;
			for (var i = 0; i < arr3PPEventsSearch.length; i++)
			{
				sublist3PPEvents.setLineItemValue('custpage_3pp_event_id', sublistLineNum, arr3PPEventsSearch[i].getId());
				sublist3PPEvents.setLineItemValue('custpage_3pp_event_vendor', sublistLineNum, arr3PPEventsSearch[i].getValue('custrecord_3pp_event_vendor'));
				sublist3PPEvents.setLineItemValue('custpage_3pp_event_currency', sublistLineNum, arr3PPEventsSearch[i].getValue('custrecord_3pp_event_currency'));
				sublist3PPEvents.setLineItemValue('custpage_3pp_event_item', sublistLineNum, arr3PPEventsSearch[i].getValue('custrecord_3pp_event_item'));
				sublist3PPEvents.setLineItemValue('custpage_3pp_event_qty', sublistLineNum, arr3PPEventsSearch[i].getValue('custrecord_3pp_event_qty'));
				sublist3PPEvents.setLineItemValue('custpage_3pp_event_rate', sublistLineNum, arr3PPEventsSearch[i].getValue('custrecord_3pp_event_rate'));				
				sublist3PPEvents.setLineItemValue('custpage_3pp_source_tran', sublistLineNum, arr3PPEventsSearch[i].getValue('custrecord_3pp_event_source_tran'));
				sublist3PPEvents.setLineItemValue('custpage_3pp_billing_milestone', sublistLineNum, arr3PPEventsSearch[i].getText('custrecord_3pp_event_milestone'));
				sublist3PPEvents.setLineItemValue('custpage_3pp_date', sublistLineNum, arr3PPEventsSearch[i].getValue('custrecord_3pp_event_date'));
				sublist3PPEvents.setLineItemValue('custpage_3pp_item', sublistLineNum, arr3PPEventsSearch[i].getValue('custrecord_3pp_event_item'));				
				
				sublistLineNum++;
			}	
				
			fldStage.setDefaultValue('sublistSubmitted');
			
			// Create the following buttons: Mark All, Save, Cancel
			sublist3PPEvents.addMarkAllButtons();
			form.addSubmitButton('Submit');
			form.addButton('custpage_cancel_button', 'Cancel', 'window.location=\'/app/center/card.nl?sc=-29\'');
		}
		else
		{
			fldStage.setDefaultValue('');
			
			// Show a message to the user indicating that there are no Pending 3PP Events records based on the criteria selected		
			form.addField('custpage_message', 'text', 'There are no Pending 3PP Events records based on the selected criteria').setDisplayType('inline');
			
			// Create the Go Back button
			form.addSubmitButton('Go Back');
		}
	}
	
	response.writePage(form);
}


/**
 * Create 3PP PO
 * @param request
 * @param response
 * @param form
 */
function process3PPEvents(request, response, form)
{		
	var arrSelected3PPEvents = new Array();
	
	// Loop through selected Pending 3PP Events records
	var int3PPEvents = request.getLineItemCount('custpage_3pp_events_list');
	for (i = 1; i <= int3PPEvents; i++)
	{
		var bSelected = request.getLineItemValue('custpage_3pp_events_list', 'custpage_so_check', i);
		if (bSelected == 'T')
		{
			var arrSelected3PPEventsFld = [];
			arrSelected3PPEventsFld.id = request.getLineItemValue('custpage_3pp_events_list', 'custpage_3pp_event_id', i);			
			arrSelected3PPEventsFld.vendor = request.getLineItemValue('custpage_3pp_events_list', 'custpage_3pp_event_vendor', i);
			arrSelected3PPEventsFld.currency = request.getLineItemValue('custpage_3pp_events_list', 'custpage_3pp_event_currency', i);
			arrSelected3PPEvents.push(arrSelected3PPEventsFld);
		}	
	}
			
	// Retrieve the Internal Ids of the selected Pending 3PP Events sorted by Vendor and Currency
	var arrSorted3PPEventsId = sort3PPEventsByVendorAndCurrency(arrSelected3PPEvents);	
		
	// If the user did not select any Pending 3PP Event
	var intSelectedCount = arrSorted3PPEventsId.length;
	nlapiLogExecution('DEBUG', LOGGER_TITLE, 'Selected 3PP Events Count = ' + intSelectedCount);
	if (intSelectedCount == 0)
	{
		// Show a message to the user indicating that at least one Pending 3PP Event must be selected
		form = nlapiCreateForm('Create 3PP PO');
		form.addField('custpage_message', 'text', 'Please select at least one Pending 3PP Event').setDisplayType('inline');
		
		// Create the Go Back button
		form.addSubmitButton('Go Back');		
		response.writePage(form);
	}
	// If the user selected at least one Pending 3PP Event
	else
	{
		// Call the scheduled script that will create the POs
		
		// Retrieve the script parameter values from the request
	    var params = new Array();
		params['custscript_c3p_selected_3pp_events'] = arrSorted3PPEventsId.toString();
		params['custscript_c3p_email_recipient_sc'] =  request.getParameter('custpage_email_recipient');
		params['custscript_c3p_email_alert_sc'] =  request.getParameter('custpage_email_alert');
		params['custscript_c3p_custom_form_sc'] =  request.getParameter('custpage_custom_form');
		params['custscript_c3p_delete_events_sc'] =  request.getParameter('custpage_delete_events');
		params['custscript_c3p_3pp_po_folder_sc'] =  request.getParameter('custpage_3pp_po_folder');
		

	    // 20141124 - jkbautista : Add logic to mark the 'custrecord_3pp_selected_for_creation' field under a 3PP event
		for (var ii = 0; ii < intSelectedCount; ii++) {
		    nlapiSubmitField('customrecord_3pp_events', arrSorted3PPEventsId[ii], 'custrecord_3pp_selected_for_creation', 'T');
		    nlapiLogExecution('DEBUG', LOGGER_TITLE, '3PP event has been set as selected, [internalid, value]:' + arrSorted3PPEventsId[ii] + ', T');
		}

		var stStatus = nlapiScheduleScript(SCHED_SCRIPT_ID, null, params);
		nlapiLogExecution('DEBUG', LOGGER_TITLE, 'Scheduled Script Status = ' + stStatus);
		
		// Redirect to home page
		var stHtml = '<html>';
	    stHtml += '<head>';
	    stHtml += '<script language="JavaScript">';
	    stHtml += 'window.location=\'/app/center/card.nl?sc=-29\';';
	    stHtml += '</script>';
	    stHtml += '</head>';
	    stHtml += '<body>';
	    stHtml += '</body>';
	    stHtml += '</html>';
	    
	    response.write(stHtml);
	}
}


/**
 * Create 3PP PO scheduled script
 * @returns {Boolean}
 */
function scheduled_create3PPPO()
{
	try
    {  
    	nlapiLogExecution('DEBUG', LOGGER_TITLE, '>>Entry<<');
    	
    	// 1444959 Custom Forms used
    	// ILF = 151
    	// RLF = 150
    	var rlfCustForm = '150';
    	var ilfCustForm = '151';
    	
    	var stToday = nlapiDateToString(new Date());
    	
    	var context = nlapiGetContext();
    	
	// Retrieve the parameters passed by the suitelet    	
	var st3PPEvents = context.getSetting('SCRIPT', 'custscript_c3p_selected_3pp_events');    
    var stEmailRecipient = context.getSetting('SCRIPT', 'custscript_c3p_email_recipient_sc');
	var stEmailAlert = context.getSetting('SCRIPT', 'custscript_c3p_email_alert_sc');
	var stCustomForm = context.getSetting('SCRIPT', 'custscript_c3p_custom_form_sc');
	var bDeleteEvents = context.getSetting('SCRIPT', 'custscript_c3p_delete_events_sc');
	var stFileId = context.getSetting('SCRIPT', 'custscript_c3p_3pp_po_file');
	var st3PPPOFolder = context.getSetting('SCRIPT', 'custscript_c3p_3pp_po_folder_sc');
	var lstEmployee = context.getSetting('SCRIPT', 'custscript_c3p_employee_sc');  // 1444959 set default 3PP PO Employee
	var intNextIndex = forceParseInt(context.getSetting('SCRIPT', 'custscript_c3p_next_index')); // the for loop for the search result will be initialized with this value if bDeleteEvents is unchecked        

		// TODO: Temp Params
    	// var st3PPEvents = '51';
    	// var stEmailRecipient = 9201;
    	// var stEmailAlert = 7;
    	// var stCustomForm = 106;
    	// var bDeleteEvents = "F";
    	// var stFileId = null;
    	// var st3PPPOFolder = 119461;
    	// var intNextIndex = 0;

		nlapiLogExecution('DEBUG', LOGGER_TITLE, 'Script Parameters: Pending 3PP Events to Process = ' + st3PPEvents
        		+ '\n <br /> Email Recipient = ' + stEmailRecipient
        		+ '\n <br /> Email Alert = ' + stEmailAlert
        		+ '\n <br /> Custom Form = ' + stCustomForm
        		+ '\n <br /> Delete Events = ' + bDeleteEvents
        		+ '\n <br /> File ID = ' + stFileId
        		+ '\n <br /> 3PP PO Folder = ' + st3PPPOFolder
        		+ '\n <br /> Next Index = ' + intNextIndex);
		if (isEmpty(stEmailRecipient) || isEmpty(stEmailAlert) || isEmpty(st3PPEvents) || isEmpty(stCustomForm)) 
		{	
			throw nlapiCreateError('99999', 'Please enter values on the script parameter');
		}
        
		// Convert 3PP Events Internal IDs from script parameter (string) to an array
		var arr3PPEvents = st3PPEvents.split(',');        
        
		// Search against Pending 3PP Events record using the 3PP Events Internal IDs
		var arrFilters = [new nlobjSearchFilter('internalid', null, 'anyof', arr3PPEvents),
						new nlobjSearchFilter('mainline', 'custrecord_3pp_event_source_tran', 'is', 'T')]; // 1444959
    	var arrColumns = [new nlobjSearchColumn('custrecord_3pp_event_vendor').setSort(),
						new nlobjSearchColumn('custrecord_3pp_event_currency').setSort(),
						new nlobjSearchColumn('custrecord_3pp_event_project_ic'),
						new nlobjSearchColumn('custrecord_3pp_event_item'),
						new nlobjSearchColumn('custrecord_3pp_event_rate'),
						new nlobjSearchColumn('custrecord_3pp_event_qty'),
						new nlobjSearchColumn('custrecord_3pp_event_milestone'),
						new nlobjSearchColumn('custrecord_3pp_event_trigger'),
						new nlobjSearchColumn('custrecord_3pp_event_cost_centre'),
						new nlobjSearchColumn('custrecord_3pp_event_product'),
						new nlobjSearchColumn('custrecord_3pp_event_region'),
						new nlobjSearchColumn('custrecord_3pp_event_item_category'),
						new nlobjSearchColumn('custrecord_3pp_event_item_subcategory1'),
						new nlobjSearchColumn('custrecord_3pp_event_item_subcategory2'),
						new nlobjSearchColumn('custrecord_3pp_event_start_date'),
						new nlobjSearchColumn('custrecord_3pp_event_end_date'),
						new nlobjSearchColumn('custrecord_3pp_event_source_tran'),
						new nlobjSearchColumn('custrecord_3pp_event_disc'),
						new nlobjSearchColumn('custrecord_3pp_event_vendor_billing_schd'),
						new nlobjSearchColumn('custrecord_3pp_event_misys_ref'), // 1444959
						new nlobjSearchColumn('custrecord_3pp_client'), // 1444959
						new nlobjSearchColumn('custbody_contractdate','custrecord_3pp_event_source_tran'), // 1444959
						new nlobjSearchColumn('custrecord_3pp_type'),    	                  
						new nlobjSearchColumn('custrecord_3pp_licence_basis'),
						new nlobjSearchColumn('custrecord_3pp_asset_location'), // 1444959
						new nlobjSearchColumn('custrecord_3pp_legacy_ref'), // 1444959
						new nlobjSearchColumn('custrecord_3pp_asset_mngmt'), // 1444959
						new nlobjSearchColumn('custrecord_misyssalestype'), // 1444959.2
						new nlobjSearchColumn('custrecord_license_band_quantity'), // 1444959.2
						new nlobjSearchColumn('subsidiary', 'custrecord_3pp_event_project_ic'),
						new nlobjSearchColumn('subsidiary', 'custrecord_3pp_event_vendor')];	
    	
		nlapiLogExecution('DEBUG', '3PP Events search filter and columns setup', '');
		
    	var arr3PPEventsSearchResult = nlapiSearchRecord('customrecord_3pp_events', null, arrFilters, arrColumns);     
		
		//jkbautista : 20150119 - 3PP search results needs to be sorted AGAIN to mirror the sorted values passed on from the Suitelet.
		//jkbautista : 20150126 - Removing manual sorting as .setSort() has been implemented.	    
    	//arr3PPEventsSearchResult = sortSearchResultByVendorAndCurrency(arr3PPEventsSearchResult);

        var intLineNum = 1; // initialize to 1, this variable will determine if a new PO will be created for another Vendor and Currency combination
        var int3PPEventsSearchResultCount = arr3PPEventsSearchResult.length;
        var arr3PPEventsProcessed = new Array();
		
		nlapiLogExecution('DEBUG', '3PP Events Search Result Count', int3PPEventsSearchResultCount);
		
        // Loop through the search result
        var arrPOCreated = [];
        for (var i = intNextIndex; i < int3PPEventsSearchResultCount; i++)
        {
        	var intRemainingUsage = context.getRemainingUsage();
			nlapiLogExecution('DEBUG', LOGGER_TITLE, 'Remaining Usage = '  + intRemainingUsage);   
	        if (intRemainingUsage < USAGE_LIMIT_THRESHOLD)
	        {
	        	// Create the file with Internal IDs of the POs created
	        	var stFileId = createFile(arrPOCreated, stFileId, false, stEmailAlert, st3PPPOFolder);
	        	
	        	var params = new Array();
	    		params['custscript_c3p_selected_3pp_events'] = arr3PPEvents.toString();
	    		params['custscript_c3p_email_recipient_sc'] =  stEmailRecipient;
	    		params['custscript_c3p_email_alert_sc'] =  stEmailAlert;
	    		params['custscript_c3p_custom_form_sc'] =  stCustomForm;
	    		params['custscript_c3p_delete_events_sc'] =  bDeleteEvents;
	    		params['custscript_c3p_3pp_po_file'] =  stFileId;
	    		params['custscript_c3p_3pp_po_folder_sc'] =  st3PPPOFolder;
	    		
	    		// if bDeleteEvents is checked initialize next index to 0
	            if (bDeleteEvents == 'F')
	            {
	            	params['custscript_c3p_next_index'] =  i;
	            }	    		
	        	
				var stStatus = nlapiScheduleScript(SCHED_SCRIPT_ID, null, params);
				nlapiLogExecution('DEBUG', LOGGER_TITLE, 'Scheduled Script Status = ' + stStatus);
	        	return;
	        }
        	
        	var st3PPEvent = arr3PPEventsSearchResult[i].getId();
        	nlapiLogExecution('DEBUG', LOGGER_TITLE, 'Pending 3PP Event = ' + st3PPEvent);

        	// Add the 3PP Event Internal ID to an array so it can be deleted later on
        	arr3PPEventsProcessed.push(st3PPEvent);        	
        	
        	// Get the Vendor and Currency
        	var stVendor = arr3PPEventsSearchResult[i].getValue('custrecord_3pp_event_vendor');
        	var stCurrency = arr3PPEventsSearchResult[i].getValue('custrecord_3pp_event_currency');
			var stMisysRef = arr3PPEventsSearchResult[i].getValue('custrecord_3pp_event_misys_ref');  // 1444959
			var lstCustomer = arr3PPEventsSearchResult[i].getValue('custrecord_3pp_client'); // 1444959
			var saleType = arr3PPEventsSearchResult[i].getValue('custrecord_misyssalestype'); // 1444959.2
			var contractDate = arr3PPEventsSearchResult[i].getValue('custbody_contractdate','custrecord_3pp_event_source_tran'); // 1444959
        	nlapiLogExecution('DEBUG', LOGGER_TITLE, 'Vendor = ' + stVendor + '\n <br /> Currency = ' + stCurrency);
        	
        	nlapiLogExecution('AUDIT', LOGGER_TITLE, saleType); // 1444959.2

        	// Get the segments
        	var stDepartment = arr3PPEventsSearchResult[i].getValue('custrecord_3pp_event_cost_centre');
        	var stClass = arr3PPEventsSearchResult[i].getValue('custrecord_3pp_event_product');
        	var stLocation = arr3PPEventsSearchResult[i].getValue('custrecord_3pp_event_region');        	
        	
        	// If line num is 1, create a new PO record
        	if (intLineNum == 1)
        	{
        		// get tran type ILF or RLF
        		var stMemo = arr3PPEventsSearchResult[i].getText('custrecord_3pp_type');
        		
        		// 1444959 set correct custom form to use
        		if( stMemo == 'RLF' ){ stCustomForm = rlfCustForm; } else { stCustomForm = ilfCustForm; }
        		
        		var recPurchaseOrder = nlapiCreateRecord('purchaseorder');
        		recPurchaseOrder.setFieldValue('customform', stCustomForm);
            	recPurchaseOrder.setFieldValue('entity', stVendor);
            	
            	var vendRec = nlapiLoadRecord('vendor', stVendor); // 1444959
            	var lstEmployee = vendRec.getFieldValue('custentity_3pp_po_emp'); // 1444959
            	nlapiLogExecution('DEBUG', '3PP PO Employee ID', lstEmployee);
				
				recPurchaseOrder.setFieldValue('currency', stCurrency);
				recPurchaseOrder.setFieldValue('trandate', stToday); // set to current date
				//recPurchaseOrder.setFieldValue('custbody_po_from_date', stToday); // 1444959 //P2P - change
				//recPurchaseOrder.setFieldValue('custbody_po_to_date', stToday); // 1444959 //P2P - change
				recPurchaseOrder.setFieldValue('custbody_just_for_purch', 'Automatic 3PP PO');            	
				recPurchaseOrder.setFieldValue('custbody_3pp_po', 'T');
				recPurchaseOrder.setFieldValue('employee', lstEmployee); // 1444959
				recPurchaseOrder.setFieldValue('department', stDepartment);
				//recPurchaseOrder.setFieldValue('class', stClass); //P2P - change
				recPurchaseOrder.setFieldValue('location', stLocation);
				recPurchaseOrder.setFieldValue('custbody_to_be_emailed', 'F'); // set this to false because the default value on the form is true
				recPurchaseOrder.setFieldValue('custbody_contract_ref', stMisysRef); // 1444959
				recPurchaseOrder.setFieldValue('custbody_misyssalestype', saleType); // 1444959.2
				recPurchaseOrder.setFieldValue('custbody_3pp_ilf_client_name', lstCustomer); // 1444959
				recPurchaseOrder.setFieldValue('custbody_misyssigningdate', contractDate); // 1444959
            	
            	// If type is ILF, set memo to ILF. If type is RLF, set memo to Maintenance
                if (stMemo == 'RLF')
                {
                	stMemo = 'Maintenance';
                }
                recPurchaseOrder.setFieldValue('memo', stMemo);
            	
            	// If Project Subsidiary is not equal to Purchase Order subsidiary            	
            	var stProjectSubsidiary = arr3PPEventsSearchResult[i].getValue('subsidiary', 'custrecord_3pp_event_project_ic');
            	var stPOSubsidiary = arr3PPEventsSearchResult[i].getValue('subsidiary', 'custrecord_3pp_event_vendor');
            	nlapiLogExecution('DEBUG', LOGGER_TITLE, 'Project Subsidiary = ' + stProjectSubsidiary + '\n <br /> PO Subsidiary = ' + stPOSubsidiary);
            	
			/* 1444959 - No longer needed as per Tracy : current process is this flag is unticked for all 3PP POs
			if (stProjectSubsidiary != stPOSubsidiary)
            	{
            		// Set Intercompany Adjustment Required field on the body level to T
            		recPurchaseOrder.setFieldValue('custbody_interco_adjustment_required', 'T');
            	}
			*/
        	}
        	
        	// add line to the PO
        	nlapiLogExecution('DEBUG', LOGGER_TITLE, 'Adding line ' + intLineNum);
        	recPurchaseOrder.setLineItemValue('item', 'item', intLineNum, arr3PPEventsSearchResult[i].getValue('custrecord_3pp_event_item'));
        	recPurchaseOrder.setLineItemValue('item', 'custcol_item_selected', intLineNum, arr3PPEventsSearchResult[i].getValue('custrecord_3pp_event_item')); //** [GBM] 06062014 updated "Item Selected" custom column same as the value of the standared Item column** // 20141124 - jkbautista : Switching populating values for Quantity and Rate.
        	//recPurchaseOrder.setLineItemValue('item', 'quantity', intLineNum, arr3PPEventsSearchResult[i].getValue('custrecord_3pp_event_qty'));
			//recPurchaseOrder.setLineItemValue('item', 'rate', intLineNum, arr3PPEventsSearchResult[i].getValue('custrecord_3pp_event_rate'));
        	recPurchaseOrder.setLineItemValue('item', 'quantity', intLineNum, arr3PPEventsSearchResult[i].getValue('custrecord_3pp_event_rate'));
        	recPurchaseOrder.setLineItemValue('item', 'rate', intLineNum, arr3PPEventsSearchResult[i].getValue('custrecord_3pp_event_qty'));
        	recPurchaseOrder.setLineItemValue('item', 'custcol_vendor_billing_schedule_3pp', intLineNum, arr3PPEventsSearchResult[i].getValue('custrecord_3pp_event_vendor_billing_schd'));
        	recPurchaseOrder.setLineItemValue('item', 'custcol_3pp_vendor_milestone', intLineNum, arr3PPEventsSearchResult[i].getValue('custrecord_3pp_event_milestone'));
        	recPurchaseOrder.setLineItemValue('item', 'custcol_3pp_vendor_bsch_trigger', intLineNum, arr3PPEventsSearchResult[i].getValue('custrecord_3pp_event_trigger'));
        	recPurchaseOrder.setLineItemValue('item', 'custcol_ic_project', intLineNum, arr3PPEventsSearchResult[i].getValue('custrecord_3pp_event_project_ic'));
        	recPurchaseOrder.setLineItemValue('item', 'department', intLineNum, stDepartment);        	
        	recPurchaseOrder.setLineItemValue('item', 'class', intLineNum, stClass);
        	recPurchaseOrder.setLineItemValue('item', 'location', intLineNum, stLocation);
			recPurchaseOrder.setLineItemValue('item', 'custcol_3pp_client', intLineNum, lstCustomer); // 1444959 
        	recPurchaseOrder.setLineItemValue('item', 'custcol_misyscategory', intLineNum, arr3PPEventsSearchResult[i].getValue('custrecord_3pp_event_item_category'));
        	recPurchaseOrder.setLineItemValue('item', 'custcol_misyssubcategory1', intLineNum, arr3PPEventsSearchResult[i].getValue('custrecord_3pp_event_item_subcategory1'));
        	recPurchaseOrder.setLineItemValue('item', 'custcol_misyssubcategory2', intLineNum, arr3PPEventsSearchResult[i].getValue('custrecord_3pp_event_item_subcategory2'));
        	recPurchaseOrder.setLineItemValue('item', 'custcol_misysstartdate', intLineNum, arr3PPEventsSearchResult[i].getValue('custrecord_3pp_event_start_date'));
        	recPurchaseOrder.setLineItemValue('item', 'custcol_misysenddate', intLineNum, arr3PPEventsSearchResult[i].getValue('custrecord_3pp_event_end_date'));
        	recPurchaseOrder.setLineItemValue('item', 'custcol_3pp_source_transaction', intLineNum, arr3PPEventsSearchResult[i].getValue('custrecord_3pp_event_source_tran'));
        	recPurchaseOrder.setLineItemValue('item', 'custcol_3pp_disc_percent', intLineNum, arr3PPEventsSearchResult[i].getValue('custrecord_3pp_event_disc'));
        	recPurchaseOrder.setLineItemValue('item', 'custcol_licence_basis', intLineNum, arr3PPEventsSearchResult[i].getValue('custrecord_3pp_licence_basis')); 
        	recPurchaseOrder.setLineItemValue('item', 'custcol_3pp_asset_location', intLineNum, arr3PPEventsSearchResult[i].getValue('custrecord_3pp_asset_location')); // 1444959
        	recPurchaseOrder.setLineItemValue('item', 'custcol_3pp_legacy_ref', intLineNum, arr3PPEventsSearchResult[i].getValue('custrecord_3pp_legacy_ref')); // 1444959
        	recPurchaseOrder.setLineItemValue('item', 'custcol_3pp_asset_environ', intLineNum, arr3PPEventsSearchResult[i].getValue('custrecord_3pp_asset_mngmt')); // 1444959
        	recPurchaseOrder.setLineItemValue('item', 'custcol_license_band_quantity', intLineNum, arr3PPEventsSearchResult[i].getValue('custrecord_license_band_quantity')); // 1444959.2
        	recPurchaseOrder.setLineItemValue('item', 'custcol_3pp_event_id', intLineNum, arr3PPEventsSearchResult[i].getId() ); // 1444959.2

        	// Determine the Vendor and Currency of the next record
        	var stNextVendor = '';
        	var stNextCurrency = '';
        	var intNextIndex = i + 1;
        	if (intNextIndex < int3PPEventsSearchResultCount)
        	{	
        		stNextVendor = arr3PPEventsSearchResult[intNextIndex].getValue('custrecord_3pp_event_vendor');
            	stNextCurrency = arr3PPEventsSearchResult[intNextIndex].getValue('custrecord_3pp_event_currency');
            	nlapiLogExecution('DEBUG', LOGGER_TITLE, 'Next Record: Vendor = ' + stNextVendor
                		+ '\n <br /> Currency = ' + stNextCurrency);
        	}        	
        	
        	// If next sublist line has different Vendor and Currency from the current line
        	if (stVendor == stNextVendor && stCurrency == stNextCurrency)
        	{    
        		// increment line number to be set on the PO line so the script can continue adding lines on the PO
        		intLineNum++;
        	}
        	else
        	{
        		// Save the PO
        		var stPurchaseOrder = nlapiSubmitRecord(recPurchaseOrder, true, true);
				
				// 1444959 - Reset Cost centre, product and region : fix for employee sourcing
				if( stPurchaseOrder ){
					nlapiSubmitField('purchaseorder', stPurchaseOrder, 'department', stDepartment, 'F');
					nlapiSubmitField('purchaseorder', stPurchaseOrder, 'class', stClass, 'F');
					nlapiSubmitField('purchaseorder', stPurchaseOrder, 'location', stLocation, 'F');
				}
				
				//1444959 - set po number on 3pp event
				for (var jj = 0; jj < arr3PPEventsProcessed.length; jj++) {
					nlapiSubmitField('customrecord_3pp_events', arr3PPEventsProcessed[jj], 'custrecord_3pp_event_po_tran', stPurchaseOrder);
				}

        		nlapiLogExecution('DEBUG', LOGGER_TITLE, 'Successfully created Purchase Order. ID = ' + stPurchaseOrder);
        		arrPOCreated.push(stPurchaseOrder); // add Purchase Order Internal ID to array
        		intLineNum = 1; // reset line number to 1

        		if (bDeleteEvents == 'T')
        		{
        			for (var j = 0; j < arr3PPEventsProcessed.length; j++)
            		{
            			// Delete the Pending 3PP Event record
            			var stDelete3PPEvent = arr3PPEventsProcessed[j];
            			nlapiDeleteRecord('customrecord_3pp_events', stDelete3PPEvent);
            			nlapiLogExecution('DEBUG', LOGGER_TITLE, 'Successfully deleted Pending 3PP Event. ID = ' + stDelete3PPEvent);
            			
            			// Remove the Pending 3PP Event from the array
            			var stDelete3PPEventIndex = arr3PPEvents.indexOf(stDelete3PPEvent);
            			if (stDelete3PPEventIndex == -1)
            			{        				
                			nlapiLogExecution('DEBUG', LOGGER_TITLE, 'Pending 3PP Event is not found from the array.');
            			}
            			else
            			{
            				arr3PPEvents.splice(stDelete3PPEventIndex, 1);
                			nlapiLogExecution('DEBUG', LOGGER_TITLE, 'Successfully removed Pending 3PP Event from array.');
            			}
            		}
        		}

        	    // jkbautista - 20141217 : We need to clear the arr3PPEventsProcessed[] to prevent successfully processed events from being rolled back - when error happens on succeeding 3pp lines.
        	    //jkbautista : 20141222 - Moved the clearer of 3PPeventsProcessed array below the deletes event to allow deletion of record it bDeleteEvents == 'T'
        		arr3PPEventsProcessed = [];

        	    //jkbautista : 20141222 - Moved inside the Events loop to send email for each created PO.
        	    // Create the file with Internal IDs of the POs created and send email alert
        		createFile(arrPOCreated, stFileId, true, stEmailAlert, st3PPPOFolder);
        	}
           
        }
                        
    	nlapiLogExecution('DEBUG', LOGGER_TITLE, '>>Exit<<');
    } 
    catch (error)
    {
        // 20141203 - jkbautista : Adding rollback for unsuccessful PO creation 
        nlapiLogExecution('DEBUG', LOGGER_TITLE, 'Listing all 3PP events that needs to be rolledback.' + arr3PPEventsProcessed);
        for (var jj = 0; jj < arr3PPEventsProcessed.length; jj++) {
            nlapiSubmitField('customrecord_3pp_events', arr3PPEventsProcessed[jj], 'custrecord_3pp_selected_for_creation', 'F');
            nlapiLogExecution('DEBUG', LOGGER_TITLE, '3PP Event(s) rolled back Selected For Creation Flag [internalid]: ' + arr3PPEventsProcessed[jj]);
        }

        // ===================== Fix
        for (var z = intNextIndex; z <= int3PPEventsSearchResultCount - 1; z++) {
            nlapiLogExecution('ERROR', 'Rolling back 3pp event: , [custrecord_3pp_selected_for_creation]', [arr3PPEventsSearchResult[z].getId()]);
            
            nlapiSubmitField('customrecord_3pp_events', arr3PPEventsSearchResult[z].getId(), 'custrecord_3pp_selected_for_creation', 'F');
        }

    	if (error.getDetails != undefined)
        {
            nlapiLogExecution('ERROR','Process Error',  error.getCode() + ': ' + error.getDetails());
            throw error;
        }
        else
        {
            nlapiLogExecution('ERROR','Unexpected Error', error.toString()); 
            throw nlapiCreateError('99999', error.toString());
        }    	 
        return false;
    }    
}


/**
 * Create CSV file which includes the PO Internal IDs. If a file is already created through previous execution, the new Internal IDs will be appended to that.
 * If bSendEmail parameter is true, an email alert will be sent after the file is created
 * @param arrPOCreated
 * @param stFileId
 * @param bSendEmail
 * @param stEmailAlert
 * @param st3PPPOFolder
 */
function createFile(arrPOCreated, stFileId, bSendEmail, stEmailAlert, st3PPPOFolder)
{
    nlapiLogExecution('DEBUG', LOGGER_TITLE, 'Value of bSendEmail is: ' + bSendEmail);


	var stFileName = '3PP_PO_TranIds.csv';
	var csvData = '';
	
	// If a file is already created through previous execution, load the file and update it with the new internal ids that were created
	if (!isEmpty(stFileId))
	{		
		var objFile = nlapiLoadFile(stFileId);
        csvData = objFile.getValue();
	}
	
	// Perform a search to retrieve the PO Tran IDs
	var arrFilters = [new nlobjSearchFilter('internalid', null, 'anyof', arrPOCreated)];
	var arrColumns = [new nlobjSearchColumn('tranid', null, 'group')];
	   
	// Loop through the result and form the data to be included in the file
	var arrResults = nlapiSearchRecord('purchaseorder', null, arrFilters, arrColumns);
	if (arrResults != null)
	{
		for (var i = 0; i < arrResults.length; i++)
		{	
			csvData += arrResults[i].getValue('tranid', null, 'group') + '\n';
		}
	}
	
	// Create the PO Internal ID csv file
	var csvFile = nlapiCreateFile(stFileName, 'CSV', csvData);		
	
	

	// Send email alert and attach the file
	if (bSendEmail)
	{
		sendEmailAlert(stEmailAlert, csvFile);
		nlapiLogExecution('DEBUG', LOGGER_TITLE, 'Successfully sent email alert.');
		
		// Remove the file from the file cabinet
		if (!isEmpty(stFileId))
		{
			nlapiDeleteFile(stFileId);
			nlapiLogExecution('DEBUG', LOGGER_TITLE, 'Successfully deleted file from file cabinet.');			
		}		
	}
	else // save the file to the File Cabinet using the folder specified from the suitelet script parameter
	{
		csvFile.setFolder(st3PPPOFolder);
		stFileId = nlapiSubmitFile(csvFile);
		nlapiLogExecution('DEBUG', LOGGER_TITLE, stFileName + ' File ID = ' + stFileId);
	}
	
	return stFileId; 
}


/**
 * Send email alert when the script finished processing. A file containing the created POs internal ids is attached to the email
 * @param stEmailAlert
 * @param csvFile
 */
function sendEmailAlert(stEmailAlert, csvFile)
{
	var arrEmailAlertFlds = nlapiLookupField('customrecord_email_alerts', stEmailAlert, ['custrecord_email_subject', 'custrecord_email_body', 'custrecord_email_from']);
    
    var stEmailSubject = arrEmailAlertFlds.custrecord_email_subject;
    var stEmailBody = arrEmailAlertFlds.custrecord_email_body;
    var stEmailFrom = arrEmailAlertFlds.custrecord_email_from;
    
    nlapiSendEmail(stEmailFrom, nlapiGetUser(), stEmailSubject, stEmailBody, null, null, null, csvFile);   
}


/**
 * Return 3PP Events Internal Ids sorted by Vendor and Currency
 * @param arrSelected3PPEvents
 */
function sort3PPEventsByVendorAndCurrency(arrSelected3PPEvents)
{
	var arrSorted3PPEventsId = new Array();
	arrSelected3PPEvents.sort(sortLines);

	for (var j = 0; j < arrSelected3PPEvents.length; j++)
	{		
		arrSorted3PPEventsId.push(arrSelected3PPEvents[j].id);		
	}
	
	return arrSorted3PPEventsId;	
}                                      

//jkbautista : 20150119 - Added Sorting mechanism for Search Results, this time, to correctly line up the array of values according to Vendor and Currency.
function sortSearchResultByVendorAndCurrency(arrSelected3PPEvents)
{
	var arrSorted3PPEventsId = new Array();
	arrSelected3PPEvents.sort(sortSearchResultLines);
	return arrSelected3PPEvents;
}       
//jkbautista : 20150119 - Added Sorting mechanism to correctly line up array values accroding to Vendor and Currency
function sortSearchResultLines(a, b) {

    var aa = {
    	id : a.id,
        vendor: a.getValue('custrecord_3pp_event_vendor'),
        currency: a.getValue('custrecord_3pp_event_currency')
    };

    var bb = {
    	id : b.id,
        vendor: b.getValue('custrecord_3pp_event_vendor'),
        currency: b.getValue('custrecord_3pp_event_currency')
    };
 

    if (aa.vendor == bb.vendor) {

        if (aa.currency > bb.currency) {

            return aa.currency - bb.currency;
        }

        // jkbautista - 20150126 : Added a final verdict if BOTH a and b have the same value for the lowest field level
        // Let's compare the ID for safety measures
        if(aa.currency == bb.currency){
        	return bb.id - aa.id;
        }

        return bb.currency - aa.currency;
    }



    if (aa.vendor != bb.vendor) {
        return aa.vendor_id - bb.vendor_id;
    }

   
    return false;

}



//jkbautista : 20150119 - Added Sorting mechanism to correctly line up array values accroding to Vendor and Currency
// This function is called from the Suitelet and not from the Scheduled Script.
function sortLines(a, b) {
    //entsFld.vendor = request.getLineItemValue('custpage_3pp_events_list', 'custpage_3pp_event_vendor', i);
    //arrSelected3PPEventsFld.currency = request.getLineItemValue('custpage_3pp_events_list', 'custpage_3pp_event_currency', i);
    if (a.vendor == b.vendor) {
        
        if (a.currency > b.currency) {
            
               return a.currency - b.currency;
        }
        return b.currency - a.currency;
    }

    if (a.vendor != b.vendor) {
        return a.vendor_id - b.vendor_id;
    }
 
    return false;

}




/**
 * Force string to int
 * @param stValue
 * @returns
 */
function forceParseInt(stValue)
{    
    var intValue = parseInt(stValue);
    
    if (isNaN(intValue))
    {
        return 0;
    }
    
    return intValue;
}


/**
 * Check if a string is empty
 * @param stValue (string) value to check
 * @returns {Boolean}
 */
function isEmpty (stValue) {
     if ((stValue == '') || (stValue == null) || (stValue == undefined)) {
          return true;
     }

     return false;
}


function update3ppEventOnBill(){
	// UE script applied to vendor bill. updates any linked 3pp events with 
	// the generated vendor bill number
	// afterSubmit	
	var recId = nlapiGetRecordId();

	var rec = nlapiLoadRecord( nlapiGetRecordType(), recId );
	var recLineLength = nlapiGetLineItemCount( 'item' );
	for( var i = 1; i <= recLineLength; i++){
		var eventId = rec.getLineItemValue('item', 'custcol_3pp_event_id', i);
		if( eventId ){
			try{ 
				nlapiSubmitField( 'customrecord_3pp_events', eventId, 'custrecord_3pp_event_bill_tran', recId );
				nlapiSubmitField( 'customrecord_3pp_events', eventId, 'custrecord_3pp_event_process_status', 3 ); // 3 is internal ID of invoiced
			}catch (error){
    			if (error.getDetails != undefined){
 		           nlapiLogExecution('ERROR','Process Error',  error.getCode() + ': ' + error.getDetails());
            	}else{
            		nlapiLogExecution('ERROR','Unexpected Error', error.toString());
		        }    	 
			}  

		}
	}
}

function setSalesType(){
	var recType = nlapiGetRecordType();
	var recId = nlapiGetRecordId();
	var rec = nlapiLoadRecord( recType, recId );
	var transactcat = rec.getFieldValue( 'custbody_transactioncategory' );
	var salesTypeStr = rec.getFieldValue( 'custbody_misyssalestype_str' );
	if( salesTypeStr && transactcat == 1){	
		var salesTypeId = _genericSearch( 'customlist_sales_type', 'name', salesTypeStr );
		rec.setFieldValue( 'custbody_misyssalestype', salesTypeId );
		nlapiSubmitRecord( rec );
	}
}