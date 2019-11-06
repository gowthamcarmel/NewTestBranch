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
 * Completed milestones will be matched to invoices sequentially as Invoices are generated. When an Invoice is generated, the system will look for completed milestones that haven't already been assigned to previous invoices.
 * 
 * @author Aurel Shenne Sinsin
 * @version 1.0
 */
function afterSubmit_linkInvoicesToMilestones(stType)
{
	try
    {  
		var stLoggerTitle = 'Link Invoices to Milestones for ILF';
		
    	nlapiLogExecution('DEBUG', stLoggerTitle, '>>Entry<<');
    	
    	// Get the Invoice ID
    	var stInvoice = nlapiGetRecordId();
    	nlapiLogExecution('DEBUG', stLoggerTitle, 'Invoice = ' + stInvoice);
    	
    	// If event type is not create, exit the script
    	if (stType != 'create')    	
        {	
			nlapiLogExecution('DEBUG', stLoggerTitle, 'Event Type ' + stType + ' is not supported. >>Exit<<');
            return;
        }
    	
    	// Load the Invoice record
    	var recInvoice = nlapiLoadRecord('invoice', stInvoice);
    	
    	// Get the Created From (Sales Order ID)
        var stCreatedFrom = recInvoice.getFieldValue('createdfrom');
        nlapiLogExecution('DEBUG', stLoggerTitle, 'Created From = ' + stCreatedFrom);
        
        if (isEmpty(stCreatedFrom))
        {
        	nlapiLogExecution('DEBUG', stLoggerTitle, 'Created from is empty. >>Exit<<');
        	return true;
        }
        
        // Get the Billing Schedule associated to the Sales Order
        var stBillingSchedule = nlapiLookupField('salesorder', stCreatedFrom, 'billingschedule');
        nlapiLogExecution('DEBUG', stLoggerTitle, 'Billing Schedule = ' + stBillingSchedule);
        
        if (isEmpty(stBillingSchedule))
        {
        	nlapiLogExecution('DEBUG', stLoggerTitle, 'Billing Schedule is empty. >>Exit<<');
        	return true;
        }
        
        // Load the Billing Schedule and identify the milestone that was completed by validating the amount paid (Invoice total) with the calculated milestone amount value based on Sales Order Total
        var recBillingSchedule = nlapiLoadRecord('billingschedule', stBillingSchedule);
        
        // Loop through the milestones
        var intMilestoneCount = recBillingSchedule.getLineItemCount('milestone');
        var arrMilestones = new Array();
        for (var i = 1; i <= intMilestoneCount; i++)
        {
        	// If Milestone is marked as completed, add the milestone to the array
        	var stCompleted = recBillingSchedule.getLineItemValue('milestone', 'milestonecompleted', i);
        	if (stCompleted == 'T')
        	{
        		var stCompletedMilestone = recBillingSchedule.getLineItemValue('milestone', 'projecttask', i);
        		arrMilestones.push(stCompletedMilestone);        		
        	}
        }
        nlapiLogExecution('DEBUG', stLoggerTitle, 'Completed Milestone = ' + arrMilestones.toString());
                
        var intMilestoneLength = arrMilestones.length;
        if (intMilestoneLength > 0)
        {
        	// Search for the Customer Billing Schedules that are not yet linked to Invoice using the completed milestone and Sales Order
        	var arrCustomerBillingSchedule = searchCustomerBillingSchedule(stBillingSchedule, arrMilestones, stCreatedFrom);
        	
        	if (arrCustomerBillingSchedule != null)
        	{        		
            	for (var i = 0; i < arrCustomerBillingSchedule.length; i++)
            	{        
            		var stCustomerBillingSchedule = arrCustomerBillingSchedule[i].getId();
            		nlapiLogExecution('DEBUG', stLoggerTitle, 'Customer Billing Schedule = ' + stCustomerBillingSchedule);
                	
                	// Update the Customer Billing Schedule with the Invoice to link the 2 records
                	nlapiSubmitField('customrecord_customer_billing_schedules', stCustomerBillingSchedule, 'custrecord_cbs_invoice', stInvoice);
                	nlapiLogExecution('DEBUG', stLoggerTitle, 'Successfully linked Invoice to Customer Billing Schedule');
            	}
        	}
            else
            {
            	nlapiLogExecution('DEBUG', stLoggerTitle, 'No Customer Billing Schedule for the Milestone that is not yet linked to the Invoice found');
            }
        }
        else
        {
        	nlapiLogExecution('DEBUG', stLoggerTitle, 'No completed Milestones found');
        }
                
    	nlapiLogExecution('DEBUG', stLoggerTitle, '>>Exit<<');
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
 * Search for Customer Billing Schedule to update
 * @param stBillingSchedule
 * @param arrMilestones
 * @param stCreatedFrom
 * @returns
 */
function searchCustomerBillingSchedule(stBillingSchedule, arrMilestones, stCreatedFrom)
{	
    var arrFilters = [new nlobjSearchFilter('custrecord_cbs_billing_schedule_id', null, 'anyof', stBillingSchedule),
                      new nlobjSearchFilter('custrecord_cbs_line_milestone', null, 'anyof', arrMilestones),
                      new nlobjSearchFilter('custrecord_cbs_sales_order', null, 'anyof', stCreatedFrom),
                      new nlobjSearchFilter('custrecord_cbs_invoice', null, 'anyof', '@NONE@')];
    
    var arrResults = nlapiSearchRecord('customrecord_customer_billing_schedules', null, arrFilters);

    return arrResults;
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