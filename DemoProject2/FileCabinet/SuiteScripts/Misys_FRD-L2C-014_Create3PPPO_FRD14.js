/**
 * Create 3PP PO scheduled script
 * @returns {Boolean}
 */
var LOGGER_TITLE = 'Create 3PP PO FRD14';
var USAGE_LIMIT_THRESHOLD = 2500;

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
	/*var st3PPEvents = context.getSetting('SCRIPT', 'custscript_c3p_selected_3pp_events');    
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
        */
		// Convert 3PP Events Internal IDs from script parameter (string) to an array
	//	var arr3PPEvents = st3PPEvents.split(',');        
        
		// Search against Pending 3PP Events record using the 3PP Events Internal IDs
		var arrFilters = [new nlobjSearchFilter('custrecord_3pp_is_frd14_ex', null, 'is', 'T'),
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
						new nlobjSearchColumn('subsidiary', 'custrecord_3pp_event_vendor'),
						new nlobjSearchColumn('internalid')];	
    	
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
        for (var i = 1; i <= int3PPEventsSearchResultCount; i++)
        {
        	var intRemainingUsage = context.getRemainingUsage();
			nlapiLogExecution('DEBUG', LOGGER_TITLE, 'Remaining Usage = '  + intRemainingUsage);   
	        if (intRemainingUsage < USAGE_LIMIT_THRESHOLD)
	        {/*
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
	        */}
        	
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
        	
        	nlapiLogExecution('DEBUG', LOGGER_TITLE, saleType); // 1444959.2

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
					nlapiSubmitField('customrecord_3pp_events', arr3PPEventsProcessed[jj], 'custrecord_3pp_is_frd14_ex', 'F');
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
        		/*createFile(arrPOCreated, stFileId, true, stEmailAlert, st3PPPOFolder);*/
        	}
           
        }
                        
    	nlapiLogExecution('DEBUG', LOGGER_TITLE, '>>Exit<<');
    } 
    catch (error)
    {
        // 20141203 - jkbautista : Adding rollback for unsuccessful PO creation 
        nlapiLogExecution('DEBUG', LOGGER_TITLE, 'Listing all 3PP events that needs to be rolledback.' + arr3PPEventsProcessed);
        /*for (var jj = 0; jj < arr3PPEventsProcessed.length; jj++) {
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
        }    	 */
        return false;
    }    
}

