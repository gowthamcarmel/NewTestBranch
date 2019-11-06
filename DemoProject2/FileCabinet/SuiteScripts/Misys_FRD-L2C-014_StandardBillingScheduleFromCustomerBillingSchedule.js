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


/**
 * Create Standard Billing Schedule from Customer Billing Schedule - an after submit script will be triggered when a Customer Billing Schedule is created
 * @author Aurel Shenne Sinsin
 * @version 1.0
 */
function afterSubmit_createStandardBillingSched(stType)
{ 
//    try
//    {  
    	var stLoggerTitle = 'afterSubmit_createStandardBillingSched';
    	
    	nlapiLogExecution('DEBUG', stLoggerTitle, '>>Entry<<');
    	
    	// If event type is not create
    	if (stType != 'create'  )
		//if (stType != 'create')
        {	
			nlapiLogExecution('DEBUG', stLoggerTitle, 'Event Type ' + stType + ' is not supported. >>Exit<<');
            return;
        }
				
		// If execution context is not user interface or csv import
		var stExecutionContext = nlapiGetContext().getExecutionContext();
		if(stExecutionContext != 'csvimport' && stExecutionContext != 'webservices' && stExecutionContext != 'userinterface' && stExecutionContext != 'mapreduce' )
        // if(stExecutionContext != 'csvimport' && stExecutionContext != 'webservices')
        {        
        	nlapiLogExecution('DEBUG', stLoggerTitle, 'Execution Context ' + stExecutionContext + ' is not supported. >>Exit<<');
            return;
        }
        
        // Get the Customer Billing Schedule Internal ID
        var stCustomerBillingSchedule = nlapiGetRecordId();
    	nlapiLogExecution('DEBUG', stLoggerTitle, 'Customer Billing Schedule = ' + stCustomerBillingSchedule);
    	
    	// Load the Customer Billing Schedule
    	var recCustomerBillingSchedule = nlapiLoadRecord('customrecord_customer_billing_schedules', stCustomerBillingSchedule);
    	
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
    	
    	// If Project or Sales Order is empty, exit the script
    	if (isEmpty(stProject) || isEmpty(stSO))
    	{
    		nlapiLogExecution('ERROR', stLoggerTitle, 'Project or Sales Order is empty. >>Exit<<');
    		return;
    	}
    	
    	// Search other existing Customer Billing Schedule using Name, Project, and Sales Order. Retrieve the Customer Billing Schedule Internal ID and associated standard Billing Schedule Internal ID
    	var stExistingCustomerBillingSchedule = '';
    	var stExistingBillingId = '';
    	var arrExistingCustomerBillingSchedule = searchCustomerBillingSchedule(stCustomerBillingSchedule, stName, stProject, stSO);
    	if (arrExistingCustomerBillingSchedule != null)
    	{
    		stExistingCustomerBillingSchedule = arrExistingCustomerBillingSchedule[0].getId();
    		stExistingBillingId = arrExistingCustomerBillingSchedule[0].getValue('custrecord_cbs_billing_schedule_id'); 
    	}    	
    	nlapiLogExecution('DEBUG', stLoggerTitle, 'Existing Customer Billing Schedule = ' + stExistingCustomerBillingSchedule
    			+ '\n <br /> Billing Schedule ID = ' + stExistingBillingId);
    	
    	var recBillingSchedule = '';
    	var flTotalAmount = 0;
        var flInitialAmount = 0;
    	if (isEmpty(stExistingBillingId))
    	{
    		// If standard Billing Schedule already exists for the Customer Billing Schedule, create a standard Billing Schedule by initializing the Project = Project on the Customer Billing Schedule and Type = FBM
    		nlapiLogExecution('DEBUG', stLoggerTitle, 'Creating new Billing Schedule...');
    		
    		var initValues = new Array();      
        	initValues.schedtype = 'FBM';  
        	initValues.project = stProject;

        	// Set the fields based on the Customer Billing Schedule field values
        	recBillingSchedule = nlapiCreateRecord('billingschedule', initValues);                                                                                                  
        	recBillingSchedule.setFieldValue('name', stName);
        	if (!isEmpty(stInitialAmount))
        	{
                flInitialAmount = forceFloatPercent(stLineAmt);
        		recBillingSchedule.setFieldValue('initialamount', stInitialAmount);        		
        	}
        	recBillingSchedule.setFieldValue('initialterms', stInitialTerms);
        	recBillingSchedule.setFieldValue('ispublic', stPublic);    	
        	recBillingSchedule.setFieldValue('transaction', stSO);
    	}
    	else
    	{
    		// Update existing standard Billing schedule
    		nlapiLogExecution('DEBUG', stLoggerTitle, 'Updating existing Billing Schedule...');
    		recBillingSchedule = nlapiLoadRecord('billingschedule', stExistingBillingId);
    		nlapiLogExecution('DEBUG', stLoggerTitle, 'After Loading');
    		
    		var intMilestoneCount = recBillingSchedule.getLineItemCount('milestone');
    		for (var i = 1; i <= intMilestoneCount; i++)
    		{
    			flTotalAmount += forceFloatPercent(recBillingSchedule.getLineItemValue('milestone', 'milestoneamount', i));
    		}    		
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
    	nlapiLogExecution('DEBUG', stLoggerTitle, 'After Commit');
    	
    	// Save the standard Billing Schedule
    	var stBillingSchedule = nlapiSubmitRecord(recBillingSchedule, true, true);
    	nlapiLogExecution('DEBUG', stLoggerTitle, 'Successfully submitted Billing Schedule = ' + stBillingSchedule);
    	
    	// Update the Customer Billing Schedule with the standard Billing Schedule ID
    	nlapiSubmitField('customrecord_customer_billing_schedules', stCustomerBillingSchedule, 'custrecord_cbs_billing_schedule_id', stBillingSchedule)
    	nlapiLogExecution('DEBUG', stLoggerTitle, 'Successfully updated Customer Billing Schedule with Billing Schedule ID');
    	
    	if (isEmpty(stExistingCustomerBillingSchedule))
    	{
    		// Update the Project with the Billing Schedule
        	nlapiSubmitField('job', stProject, ['billingschedule', 'jobbillingtype'], [stBillingSchedule, 'FBM']);
        	nlapiLogExecution('DEBUG', stLoggerTitle, 'Successfully updated Project record');
        	
        	// Update the Sales Order with the the Job record to auto-populate the Billing Schedule
        	nlapiSubmitField('salesorder', stSO, ['job'], [stProject]);
        	nlapiLogExecution('DEBUG', stLoggerTitle, 'Successfully updated Sales Order record');
    	}    	
    	
    	// Update Package Completed = T only if total amount on the Billing Schedule is 100% or 1
    	if ( (flTotalAmount + flInitialAmount) == 1)
    	{
    		nlapiSubmitField('salesorder', stSO, ['custbody_packagecompleted'], ['T']);
    		nlapiLogExecution('DEBUG', stLoggerTitle, 'Successfully updated Sales Order record Package Completed = T');
    	}
    	
    	nlapiLogExecution('DEBUG', stLoggerTitle, '>>Exit<<');
   } 

//    catch (error)
//    {
//    	if (error.getDetails != undefined)
//        {
//            nlapiLogExecution('ERROR','Process Error',  error.getCode() + ': ' + error.getDetails());
//            throw error;
//        }
//        else
//        {
//            nlapiLogExecution('ERROR','Unexpected Error', error.toString()); 
//            throw nlapiCreateError('99999', error.toString());
//        }    	 
//        return false;
//    }   
//}


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
function searchCustomerBillingSchedule(stCustomerBillingSchedule, stName, stProject, stSO)
{	
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
function isNullOrUndefined(value)
{
    if (value === null)
    {
        return true;
    }
    
    if (value === undefined)
    {
        return true;
    }  
    
    return false;
}


/**
 * Converts a percentage to float
 * @param stValue
 * @returns
 */
function forceFloatPercent(stValue)
{
	if (stValue == null)
	{
		return 0.00;
	}

   if (stValue.length < 2)
   {
       return 0.00;
   }    
       
   var flFloat = forceParseFloat(stValue.trim().replace('%', ''))/100;

   if (isNaN(flFloat))
   {
       return 0.00;
   }

   return flFloat;

}


/**
 * Converts a string to float
 * @param stValue
 * @returns
 */
function forceParseFloat(stValue)
{
	var flValue = parseFloat(stValue);
    
    if (isNaN(flValue))
    {
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
