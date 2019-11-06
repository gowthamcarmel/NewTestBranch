/**
 * Modified Version of script Misys_FRD-L2C-014_StandardBillingScheduleFromCustomerBillingSchedule.js 
 * that allows manual creation or update of Billing Schedules from Customer Billing Schedule
 */
function afterSubmit_createStandardBillingSched(request,response){
	var stLoggerTitle = 'Manual Billing Schedule Generate';
	nlapiLogExecution('DEBUG', stLoggerTitle, '>>Entry<<');

	if ( request.getMethod() == 'GET' ){
        
		var form = nlapiCreateForm('Manual Billing Schedule Generator');
        form.addField('internalidstring','text', 'Customer Billing Schedule Internal IDs (separated by commas)')
        form.addSubmitButton('Submit');
        response.writePage( form );

    } else {
	
		var stCustomerBillingSchedule = new Array();
		stCustomerBillingSchedule = request.getParameter('internalidstring').split(',');

		var recBillingSchedule = '';
    	var flTotalAmount = 0;
    	
		for( var i = 0; i < stCustomerBillingSchedule.length; i++ ){
			nlapiLogExecution('DEBUG', stLoggerTitle, 'Customer Billing Schedule = ' + stCustomerBillingSchedule[i]);
			var recCustomerBillingSchedule = nlapiLoadRecord('customrecord_customer_billing_schedules', stCustomerBillingSchedule[i]);
			// Retrieve the header fields from the Customer Billing Schedule
			var stName = recCustomerBillingSchedule.getFieldValue('name');
			var stInitialAmount = recCustomerBillingSchedule.getFieldValue('custrecord_cbs_initial_amount');
			var stInitialTerms = recCustomerBillingSchedule.getFieldValue('custrecord_cbs_initial_payment_terms');
			var stPublic = recCustomerBillingSchedule.getFieldValue('custrecord_cbs_public');
			var stProject = recCustomerBillingSchedule.getFieldValue('custrecord_cbs_project');
			var stSO = recCustomerBillingSchedule.getFieldValue('custrecord_cbs_sales_order');
			var stLineAmt = recCustomerBillingSchedule.getFieldValue('custrecord_cbs_line_amount');
			var stCompletionDate = recCustomerBillingSchedule.getFieldValue('custrecord_cbs_line_est_completion_date');
			var stProjectTask = recCustomerBillingSchedule.getFieldValue('custrecord_cbs_line_milestone');
			var stPaymentTerms = recCustomerBillingSchedule.getFieldValue('custrecord_cbs_line_payment_terms');
			var stComment = recCustomerBillingSchedule.getFieldValue('custrecord_cbs_line_comment')
			nlapiLogExecution('DEBUG', stLoggerTitle, 'Name = ' + stName
				+ '\n <br /> Initial Amount = ' + stInitialAmount
				+ '\n <br /> Initial Terms = ' + stInitialTerms
				+ '\n <br /> Public = ' + stPublic
				+ '\n <br /> Project = ' + stProject
				+ '\n <br /> Sales Order = ' + stSO
				+ '\n <br /> Line Amout = ' + stLineAmt
				+ '\n <br /> Completion Date = ' + stCompletionDate
				+ '\n <br /> Project Task = ' + stProjectTask
				+ '\n <br /> Payment Terms = ' + stPaymentTerms
				+ '\n <br /> Comment = ' + stComment);
	
			if( i == 0 ){ 
				nlapiLogExecution('DEBUG', stLoggerTitle, 'Creating new Billing Schedule...');

				var initValues = new Array();      
				initValues.schedtype = 'FBM';  
				initValues.project = stProject;

				// Set the fields based on the Customer Billing Schedule field values
				recBillingSchedule = nlapiCreateRecord('billingschedule', initValues);                                                                                                 
				recBillingSchedule.setFieldValue('name', stName);
				recBillingSchedule.setFieldValue('initialamount', stInitialAmount);
				recBillingSchedule.setFieldValue('initialterms', stInitialTerms);
				recBillingSchedule.setFieldValue('ispublic', stPublic);    	
				recBillingSchedule.setFieldValue('transaction', stSO);
			}
		
			flTotalAmount += forceFloatPercent(stLineAmt);
			nlapiLogExecution('DEBUG', stLoggerTitle, 'Total Amount = ' + flTotalAmount);
		
			// Add milestone line
			recBillingSchedule.selectNewLineItem('milestone');
			recBillingSchedule.setCurrentLineItemValue('milestone', 'milestoneamount', stLineAmt);
			recBillingSchedule.setCurrentLineItemValue('milestone', 'milestonedate', stCompletionDate);
			recBillingSchedule.setCurrentLineItemValue('milestone', 'projecttask', stProjectTask);
			recBillingSchedule.setCurrentLineItemValue('milestone', 'milestoneterms', stPaymentTerms);
			recBillingSchedule.setCurrentLineItemValue('milestone', 'comments', stComment);
			recBillingSchedule.commitLineItem('milestone');   
		}

		// Save the standard Billing Schedule
   	 	var stBillingSchedule = nlapiSubmitRecord(recBillingSchedule, true, true);
   	 	nlapiLogExecution('DEBUG', stLoggerTitle, 'Successfully submitted Billing Schedule = ' + stBillingSchedule);
    	
    	for( var i = 0; i < stCustomerBillingSchedule.length; i++ ){
			// Update the Customer Billing Schedule with the standard Billing Schedule ID
			nlapiSubmitField('customrecord_customer_billing_schedules', stCustomerBillingSchedule[i], 'custrecord_cbs_billing_schedule_id', stBillingSchedule)
			nlapiLogExecution('DEBUG', stLoggerTitle, 'Successfully updated Customer Billing Schedule with Billing Schedule ID');
    	}

		// Update the Project with the Billing Schedule
    	nlapiSubmitField('job', stProject, ['billingschedule', 'jobbillingtype'], [stBillingSchedule, 'FBM']);
    	nlapiLogExecution('DEBUG', stLoggerTitle, 'Successfully updated Project record');
        	
    	// Update the Sales Order with the the Job record to auto-populate the Billing Schedule
    	nlapiSubmitField('salesorder', stSO, ['job'], [stProject]);
    	nlapiLogExecution('DEBUG', stLoggerTitle, 'Successfully updated Sales Order record');
    	
    	// Update Package Completed = T only if total amount on the Billing Schedule is 100% or 1
    	if (flTotalAmount == 1){
    		nlapiSubmitField('salesorder', stSO, ['custbody_packagecompleted'], ['T']);
    		nlapiLogExecution('DEBUG', stLoggerTitle, 'Successfully updated Sales Order record Package Completed = T');
    	}
    	
    	nlapiLogExecution('DEBUG', stLoggerTitle, '>>Exit<<');

    	var form = nlapiCreateForm('Manual Billing Schedule Generator');
        var htmlMessage = form.addField('custpage_header', 'inlinehtml').setLayoutType('normal', 'startcol');
		htmlMessage.setDefaultValue('<div id="div__alert"><div class="uir-alert-box success session_success_alert" width="100%" role="status"><div class="icon success"><img src="/images/icons/messagebox/icon_msgbox_success.png" alt=""></div><div class="content"><div class="title">Billing Schedule created</div><div class="descr">Billing Schedule created. Internal ID: '+ stBillingSchedule +'</div></div></div></div>');
		
        form.addField('internalidstring','text', 'Customer Billing Schedule Internal IDs (separated by commas)')
        form.addSubmitButton('Submit');
        response.writePage( form );
 	}
}


/**
 * Check if Customer Billing Schedule (header) is already created
 * @param stCustomerBillingSchedule
 * @param stName
 * @param stInitialTerms
 * @param stPublic
 * @param stProject
 * @param stSO
 * @returns
 */
function searchCustomerBillingSchedule(stCustomerBillingSchedule, stName, stProject, stSO){	
    var arrFilters = [new nlobjSearchFilter('name', null, 'is', stName),
                      new nlobjSearchFilter('internalidnumber', null, 'notequalto', stCustomerBillingSchedule),
                      new nlobjSearchFilter('custrecord_cbs_sales_order', null, 'anyof', stSO),
                      new nlobjSearchFilter('custrecord_cbs_project', null, 'anyof', stProject)];
    
    var arrColumns = [new nlobjSearchColumn('custrecord_cbs_billing_schedule_id')];
    
    var arrResults = nlapiSearchRecord('customrecord_customer_billing_schedules', null, arrFilters, arrColumns );

    return arrResults;
}


/**
 * Checks if value is null or undefined
 * @param value
 * @returns {Boolean}
 */
function isNullOrUndefined(value){
    if (value === null){
        return true;
    }
    
    if (value === undefined){
        return true;
    }  
    
    return false;
}


/**
 * Converts a percentage to float
 * @param stValue
 * @returns
 */
function forceFloatPercent(stValue){
	if (stValue == null){
		return 0.00;
	}

   if (stValue.length < 2){
       return 0.00;
   }    
       
   var flFloat = forceParseFloat(stValue.trim().replace('%', ''))/100;

   if (isNaN(flFloat)){
       return 0.00;
   }

   return flFloat;
}


/**
 * Converts a string to float
 * @param stValue
 * @returns
 */
function forceParseFloat(stValue){
	var flValue = parseFloat(stValue);
    
    if (isNaN(flValue)){
        return 0.00;
    }
    
    return flValue;
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
