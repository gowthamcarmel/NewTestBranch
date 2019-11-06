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




var LOGGER_TITLE = 'Mark Notify Vendor on ILF Non-Billing Milestone';




var SCHED_SCRIPT_ID = 'customscript_mark_notify_vedor_on_ilf_nb';




var USAGE_LIMIT_THRESHOLD = 100;




/**
 * When a project task is marked as Completed (Status = Completed), all Purchase Order lines that meet the following criteria are marked as Notify Vendor. 
 * Note that Purchase Orders are not automatically created once a Sales Order is approved. Lines are created in Pending 3PP Events record. 
 * A user will select these lines at a required interval and manually trigger the creation of the Purchase Order. 
 * This process means that a milestone may have been completed before the Purchase Order is actually created and marked for notification.
 * 
 * @author Aurel Shenne Sinsin
 * @version 1.0
 */
function scheduled_markNotifyVendorOnILFNonBillMs()
{
	try
    {  
    	nlapiLogExecution('DEBUG', LOGGER_TITLE, '>>Entry<<');
    	
    	var context = nlapiGetContext();
    	
    	// Retrieve the script parameter values
    	var stEmailRecipient = context.getSetting('SCRIPT', 'custscript_mnvinbm_email_recipient');
    	var stEmailAlert = context.getSetting('SCRIPT', 'custscript_mnvinbm_email_alert');        
        var stSavedSearch = context.getSetting('SCRIPT', 'custscript_mnvinbm_saved_search');
        nlapiLogExecution('DEBUG', LOGGER_TITLE, 'Email Recipient = ' + stEmailRecipient
        		+ '\n <br /> Email Alert = ' + stEmailAlert
        		+ '\n <br /> Saved Search = ' + stSavedSearch);
        if (isEmpty(stEmailRecipient) || isEmpty(stEmailAlert) || isEmpty(stSavedSearch)) 
        {	
        	throw nlapiCreateError('99999', 'Please enter values on the script parameter');
        }
    	
        // Search for Purchase Orders to set Notification Flag using the Saved Search
    	var arrPOSearchResult = nlapiSearchRecord('purchaseorder', stSavedSearch);
    	if (arrPOSearchResult != null)
    	{
    		var intPOSearchResultCount = arrPOSearchResult.length;
    		var recPO;
    		var bLoadPO = true;
    		for (var i = 0; i < intPOSearchResultCount; i++)
            {
            	var intRemainingUsage = context.getRemainingUsage();
    			nlapiLogExecution('DEBUG', LOGGER_TITLE, 'Remaining Usage = '  + intRemainingUsage);   
    	        if (intRemainingUsage < USAGE_LIMIT_THRESHOLD)
    	        {
    	        	var params = new Array();
    	    		params['custscript_mnvinbm_email_recipient'] = stEmailRecipient;
    	    		params['custscript_mnvinbm_email_alert'] =  stEmailAlert;
    	    		params['custscript_mnvinbm_saved_search'] = stSavedSearch;
    	        	
    				var stStatus = nlapiScheduleScript(SCHED_SCRIPT_ID, null, params);
    				nlapiLogExecution('DEBUG', LOGGER_TITLE, 'Scheduled Script Status = ' + stStatus);
    	        	return;
    	        }
    	        
    	        // Load the Purchase Order record
    	        var stPO = arrPOSearchResult[i].getId();
    	        var intSearchLine = arrPOSearchResult[i].getValue('line');
    	        var st3PPSourceTransaction = arrPOSearchResult[i].getValue('custcol_3pp_source_transaction');
    	        var st3PPSourceTransactionType = arrPOSearchResult[i].getValue('type', 'custcol_3pp_source_transaction');	        
    	        var stCreatedFrom = arrPOSearchResult[i].getValue('createdfrom', 'custcol_3pp_source_transaction');
    	        nlapiLogExecution('DEBUG', LOGGER_TITLE, 'PO Search Result: Purchase Order = '  + stPO
    	        		+ '\n <br /> Line ID = ' + intSearchLine
    	        		+ '\n <br /> 3PP Source Transaction = ' + st3PPSourceTransaction
    	        		+ '\n <br /> 3PP Source Transaction Type = ' + st3PPSourceTransactionType
    	        		+ '\n <br /> 3PP Source Transaction Created From = ' + stCreatedFrom);	        




    	        if (bLoadPO)
    	        {
    	        	recPO = nlapiLoadRecord('purchaseorder', stPO);    	        	
    	        }   
    	        
    	        // Loop through the item sublist
    	        var arrTranid = new Array();
    	        var arrSOInv = [];
    	        var intLineItemCount = recPO.getLineItemCount('item');
    	        for (var j = 1; j <= intLineItemCount; j++)
    	        {
    	        	// If Line ID (from search) = Line ID (from the sublist)
    	        	var intSublistLine = recPO.getLineItemValue('item', 'line', j);	        	
    	        	if (intSearchLine == intSublistLine)
    	        	{
    	        		// Set the Notify Vendor field to T on the line
    	        		nlapiLogExecution('DEBUG', LOGGER_TITLE, 'Setting Notify Vendor to true on Line ID = ' + intSearchLine
    	        				+ '\n <br /> Line Number = ' + j);
    	        		recPO.setLineItemValue('item', 'custcol_3pp_notify_vendor', j, 'T');
    	        		
    	        		if (!isEmpty(st3PPSourceTransaction))
    	        		{
    	        			// Store the 3PP Source Transaction id and type to an array
        	        		var arrSOInvFlds = [];
        	        		arrSOInvFlds.id = st3PPSourceTransaction;
        	        		arrSOInvFlds.type = toTransactionTypeId(st3PPSourceTransactionType);
        	        		arrSOInv.push(arrSOInvFlds);
        	        		arrTranid.push(st3PPSourceTransaction);
        	        		if (!isEmpty(stCreatedFrom))
        	        		{
        	        			// Store the 3PP Source Transaction Created From id and type to an array
        	        			var arrSOInvFlds = [];
        	        			arrSOInvFlds.id = stCreatedFrom;
        	        			arrSOInvFlds.type = 'salesorder';
        	        			arrSOInv.push(arrSOInvFlds);
        	        			arrTranid.push(stCreatedFrom);
        	        		}
    	        		}    	        		
    	        	}
    	        }
    	        
    	        // Determine the next record            	
            	var stNextPO = '';
            	var intNextIndex = i + 1;            	
            	if (intNextIndex < intPOSearchResultCount)
            	{	
            		stNextPO = arrPOSearchResult[intNextIndex].getId();
            	}
            	nlapiLogExecution('DEBUG', LOGGER_TITLE, 'Next Record = ' + stNextPO);
            	
            	if (stNextPO == stPO)
            	{
            		bLoadPO = false;
            	}
            	else
            	{
            		bLoadPO = true;
            		
            		// Submit the Purchase Order
        	        nlapiSubmitRecord(recPO, true, true);
        	        nlapiLogExecution('DEBUG', LOGGER_TITLE, 'Successfully updated Purchase Order');
        	        
        	        // Search for Pending 3PP Events using the following criteria: 3PP Source Transaction is any of the Transactions from the array, Trigger is none of Manual
        	        if (arrTranid.length > 0)
        	        {
        	        	var arrPending3PPEventsResult = searchPending3PPEvents(arrTranid);
                        var arrRemaining3PPNotification = searchRemaining3PPNotNotified(arrTranid); //check remaining 3PP not notified. --FIP




            	        if (!isNullOrUndefined(arrPending3PPEventsResult))
            	        {	
            	        	var arrUniquePending3PPEventsResult = removeDuplicates(arrPending3PPEventsResult);
            	        	
            	        	for (var j = 0; j < arrUniquePending3PPEventsResult; j++)
            		        {
            		        	var st3PPSourceTran = arrUniquePending3PPEventsResult[j].getValue('custrecord_3pp_event_source_tran');
            		        	
            		        	// If transaction not found from the search, set Notification Processed to true
            		        	var isSOInvFound = false;
            		        	var stTranType = '';
            		        	for (var k = 0; k < arrSOInv.length; k++)
            		        	{
            		        		if (st3PPSourceTran == arrSOInv[k].id)
            		        		{
            		        			isSOInvFound = true;
            		        			stTranType = arrSOInv[k].type;
            		        			break;
            		        		}
            		        	}
            		        	
            		        	if (!isSOInvFound)
            		        	{



									//Check if there is only one line Item remaining that needs to send notification. If only one set the notification processed in Sales Order --FIP 9172014**
                                    if(stType == 'invoice')
                                    {
                                        nlapiSubmitField('invoice', st3PPSourceTran, 'custbody_notification_processed', 'T');
                                    } else if(stType == 'salesorder' && !isNullOrUndefined(arrRemaining3PPNotification) && arrRemaining3PPNotification.length == 1) {
                                        nlapiSubmitField('salesorder', st3PPSourceTran, 'custbody_notification_processed', 'T');
                                    }
    	
            		        	}
            		        }	        	
            	        }	 
            	        else
            	        {
            	        	nlapiLogExecution('DEBUG', LOGGER_TITLE, 'No 3PP Event related to the Sales Order / Invoice found');
            	        	
            	        	for (var k = 0; k < arrSOInv.length; k++)
        		        	{
            	        		var stTranId = arrSOInv[k].id;
            	        		var stTranType = arrSOInv[k].type;
                                
								//Check if there is only one line Item remaining that needs to send notification. If only one set the notification processed in Sales Order --FIP 9172014**
                                if(stTranType == 'invoice')
                                    {
                                        nlapiSubmitField('invoice', stTranId, 'custbody_notification_processed', 'T');
                                    } else if(stTranType == 'salesorder' && !isNullOrUndefined(arrRemaining3PPNotification) && arrRemaining3PPNotification.length == 1) {
                                        nlapiSubmitField('salesorder', stTranId, 'custbody_notification_processed', 'T');
                                    }
            	        		
        		        	}
            	        }
        	        }
        	        else
        	        {
        	        	nlapiLogExecution('DEBUG', LOGGER_TITLE, 'Purchase Order does not have 3PP Source Transaction');
        	        } 
            	}
            }
    	}
    	else
    	{
    		nlapiLogExecution('DEBUG', LOGGER_TITLE, 'No Purchase Order found to process');
    	}
        
        
        // Send email alert    	
        sendEmailAlert(stEmailAlert, stEmailRecipient);
		nlapiLogExecution('DEBUG', LOGGER_TITLE, 'Successfully sent email alert.');        
                
    	nlapiLogExecution('DEBUG', LOGGER_TITLE, '>>Exit<<');
    } 
    catch (error)
    {
    	if (error.getDetails != undefined)
        {
            nlapiLogExecution('ERROR','Process Error',  error.getCode() + ': ' + error.getDetails());
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
 * Search for 3PP Events where that has the Invoice or Sales Orders related to the PO set as 3PP Source Transaction
 * @param arrTranid
 * @returns
 */
function searchPending3PPEvents(arrTranid)
{		
	var arrFilters = [new nlobjSearchFilter('custrecord_3pp_event_source_tran', null, 'anyof', arrTranid),
	                  new nlobjSearchFilter('custrecord_3pp_event_trigger', null, 'noneof', '3')]; // none of Manual    		
 
	var arrColumns = [new nlobjSearchColumn('custrecord_3pp_event_source_tran')];	
 	
 	var arr3PPEventsSearchResult = nlapiSearchRecord('customrecord_3pp_events', null, arrFilters, arrColumns);
 	
 	return arr3PPEventsSearchResult;
}








/**
 * Search for Purchase order Line Items that are not yet Sent for Notification --FIP, included this function
 * @param arrTranid
 * @returns
 */




 function searchRemaining3PPNotNotified(arr3PPSourceTranid)
 {
    var arrFilters = [new nlobjSearchFilter('custcol_3pp_source_transaction', null, 'anyof', arr3PPSourceTranid)];




    var arrNotified3PPEvents = nlapiSearchRecord('purchaseorder', 'customsearch_check_rem_notification', arrFilters);
    
    return arrNotified3PPEvents;
 }








/**
 * Send email alert when the script finished processing
 * @param stEmailAlert
 * @param stEmailRecipient
 */
function sendEmailAlert(stEmailAlert, stEmailRecipient)
{
	var arrEmailAlertFlds = nlapiLookupField('customrecord_email_alerts', stEmailAlert, ['custrecord_email_subject', 'custrecord_email_body', 'custrecord_email_from']);
    
    var stEmailSubject = arrEmailAlertFlds.custrecord_email_subject;
    var stEmailBody = arrEmailAlertFlds.custrecord_email_body;
    var stEmailFrom = arrEmailAlertFlds.custrecord_email_from;
    
    nlapiSendEmail(stEmailFrom, stEmailRecipient, stEmailSubject, stEmailBody);   
}








/**
 * Return 3PP Events Internal Ids sorted by Vendor and Currency
 * @param arrSelected3PPEvents
 */
function sort3PPEventsByVendorAndCurrency(arrSelected3PPEvents)
{
	var arrSorted3PPEventsId = new Array();
	arrSelected3PPEvents.sort(function (a,b) {
	    if (a[0] < b[0]) return  1;
	    if (a[0] > b[0]) return -1;
	    if (a[2] > b[2]) return  1;
	    if (a[2] < b[2]) return -1;
	    return 0;
	});	
		
	for (var j = 0; j < arrSelected3PPEvents.length; j++)
	{
		arrSorted3PPEventsId.push(arrSelected3PPEvents[j].id);		
	}
	
	return arrSorted3PPEventsId;	
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








/**
 * Determines if a variable is either set to null or is undefined.
 */
function isNullOrUndefined (value) {
     if (value === null) {
          return true;
     }




     if (value === undefined) {
          return true;
     }




     return false;
}








/**
 * Removing duplicate entries or values from a Javascript array.
 */
function removeDuplicates (array) {
     if (isNullOrUndefined (array)) {
          return array;
     }




     var arrNew = new Array ();




     o: for (var i = 0, n = array.length; i < n; i++) {
          for (var x = 0, y = arrNew.length; x < y; x++) {
               if (arrNew[x] == array[i]) {
                    continue o;
               }
          }




          arrNew[arrNew.length] = array[i];
     }




     return arrNew;
}








function toTransactionTypeId(stTranType)
{
    if (isEmpty(stTranType))
    {
        throw nlapiCreateError('10003', 'Transaction Type should not be empty.');
    }
    
    switch (stTranType)
    {
        case 'CustInvc':
            return 'invoice';
        case 'SalesOrd':
            return 'salesorder';      
        default:
            return stTranType;
    }
}
	