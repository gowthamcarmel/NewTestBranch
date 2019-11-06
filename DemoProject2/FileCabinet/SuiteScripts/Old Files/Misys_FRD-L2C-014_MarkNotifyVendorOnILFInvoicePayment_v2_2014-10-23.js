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
 * Module Description
 * 
 * Version    Date            Author           Remarks
 * 1.00       04 Jun 2014     gmanarang
 *
 */

/**
 * @param {String} type Context Types: scheduled, ondemand, userinterface, aborted, skipped
 * @returns {Void}
 */
function scheduled_markNotifyVendorOnILFnvPayment(type) 
{
	try
    {
		var logTitle = 'scheduled_markNotifyVendorOnILFnvPayment';
		nlapiLogExecution('DEBUG', logTitle, '>>Entry<<');
		
		var context = nlapiGetContext();
		
		// Retrieve the script parameter values
		var stEmailRecipient = context.getSetting('SCRIPT', 'custscript_ilf_email_recipient');
		var stEmailAlert = context.getSetting('SCRIPT', 'custscript_ilf_email_alert');        
	    var stSavedInvoiceSearch = context.getSetting('SCRIPT', 'custscript_ilf_invoice_search');
	    var stSaved3PPP0Search = context.getSetting('SCRIPT', 'custscript_ilf_3pppo_lines');
	    nlapiLogExecution('DEBUG', logTitle, 'Email Recipient = ' + stEmailRecipient
	    		+ '\n <br /> Email Alert = ' + stEmailAlert
	    		+ '\n <br /> Saved Invoice Search = ' + stSavedInvoiceSearch
	    		+ '\n <br /> Saved 3PPP0 Search = ' + stSaved3PPP0Search);
	    	    
		
	    var searchInvoice = searchAllRecord('transaction', stSavedInvoiceSearch);
	    
	    for (var i = 0; i < searchInvoice.length; i++ )
	    {
	    	checkGovernance(500); // check usage and yield script
	    	var stInvoiceId = searchInvoice[i].getValue('internalid', null, 'group');
	    	nlapiLogExecution('DEBUG', logTitle, 'Processing Invoice ID = ' + stInvoiceId);
	    	//check invoice if all linked transactions are payments
	    	var bAllPayment = verifyLinks(stInvoiceId);
	    	if(!bAllPayment)
	    	{
	    		nlapiLogExecution('DEBUG', logTitle, 'Links are not all Payment type. Moving to next Invoice record.');
	    		continue;
	    	}
	    	
	    	var filterCBS = new Array();
	    	filterCBS.push(new nlobjSearchFilter('custrecord_cbs_invoice', null, 'anyof', stInvoiceId));
	    	filterCBS.push(new nlobjSearchFilter('custrecord_cbs_line_milestone', null, 'isnotempty'));
	    	filterCBS.push(new nlobjSearchFilter('custrecord_cbs_sales_order', null, 'isnotempty'));
	    	
	    	var columnCBS = new Array();
	    	columnCBS.push(new nlobjSearchColumn('custrecord_cbs_line_milestone'));
			
			var searchCBS = searchAllRecord('customrecord_customer_billing_schedules', null, filterCBS, columnCBS); // custom billing schedule
	    	
	    	if(searchCBS.length > 0)
	    	{
	    		var arrLineMilestones = [];
	    		var stInvoiceSource = searchInvoice[i].getValue('createdfrom', null, 'group');
	    		
	    		for(var k = 0; k < searchCBS.length; k++) // get all associated milestones
	    		{
	    			var stLineMilestone = searchCBS[k].getValue('custrecord_cbs_line_milestone');
	    			if(stLineMilestone)
	    			{
	    				arrLineMilestones.push(stLineMilestone);
	    			}	    			
	    		}
	    		var Error = false;
	    		if(arrLineMilestones.length > 0)
	    		{
	    			var filter = new Array();
	    			filter.push(new nlobjSearchFilter('custcol_3pp_vendor_milestone', null, 'anyof', arrLineMilestones));
	    			filter.push(new nlobjSearchFilter('custcol_3pp_source_transaction', null, 'anyof', stInvoiceSource));
	    			
	    			var search3PPPOLines = searchAllRecord('transaction', stSaved3PPP0Search, filter);
	    			
	    			var procPO = '';
	    			var prevSourceTran = '';
	    			var curRecPO = null;
	    			
	    			for(var j = 0; j < search3PPPOLines.length; j++ )
	    			{
	    				checkGovernance(500); // check usage and yield script
	    				var currPO = search3PPPOLines[j].getValue('internalid');
	    				var curr3PPSourceTran = search3PPPOLines[j].getValue('custcol_3pp_source_transaction');	    				
	    				var curr3PPSourceTranType = search3PPPOLines[j].getValue('type', 'custcol_3pp_source_transaction');
	    				nlapiLogExecution('DEBUG', logTitle, 'curr3PPSourceTran: '+curr3PPSourceTran+'| curr3PPSourceTranType: '+curr3PPSourceTranType);
	    				var stTranType = toTransactionTypeId(curr3PPSourceTranType);
	    				try
	    				{	    						    					    				
		    				if(procPO != currPO)
		    				{
		    					if(procPO && curRecPO) // submit record
		    					{
		    						var updatedPO = nlapiSubmitRecord(curRecPO);
		    						nlapiLogExecution('DEBUG', logTitle, 'Updated PO = ' + updatedPO);
		    					}
		    					curRecPO = nlapiLoadRecord('purchaseorder', currPO); // load next PO
		    					nlapiLogExecution('DEBUG', logTitle, 'Updating PO Id:  ' + currPO);
		    					procPO = currPO;
		    				}
		    				var poLine = search3PPPOLines[j].getValue('linesequencenumber');
		    				curRecPO.setLineItemValue('item', 'custcol_3pp_notify_vendor', poLine, 'T');
		    				
		    				if(curRecPO && j == search3PPPOLines.length-1) // last record
		    				{
		    					var updatedPO = nlapiSubmitRecord(curRecPO, true, true); // ignore errors just update the line
	    						nlapiLogExecution('DEBUG', logTitle, 'Updated PO = ' + updatedPO);
		    				}
		    				
		    				if((prevSourceTran != curr3PPSourceTran || j == search3PPPOLines.length-1) && !Error)
		    				{
		    					prevSourceTran = curr3PPSourceTran;
		    					// Search for Pending 3PP Events using the following criteria: 3PP Source Transaction is any of the Transactions from the array, Trigger is none of Manual
		    					var arrPending3PPEventsResult = searchPending3PPEvents(curr3PPSourceTran);
	                	        if (arrPending3PPEventsResult)
	                	        {	
	                	        	nlapiLogExecution('DEBUG', logTitle, 'Found 3PP Event related to the Sales Order');            		        		
	                	        }	 
	                	        else
	                	        {
	                	        	nlapiLogExecution('DEBUG', logTitle, 'No 3PP Event related to the Sales Order');
	                	        	nlapiSubmitField(stTranType, curr3PPSourceTran, 'custbody_notification_processed', 'T');
	                	        	nlapiLogExecution('DEBUG', logTitle, 'Successfully updated Notification Process to true. ID = ' + curr3PPSourceTran
            		        				+ '\n <br /> Type = salesorder' + stTranType);
	                	        }
		    				}
		    						    				
	    				}
	    				catch (err)
	    				{
	    					nlapiLogExecution('ERROR', logTitle, 'Cannot update PO Id: '+ currPO+'. '+err.toString() );
	    					Error = true;
	    					continue;
	    				}
	    				
	    			}
	    		}
	    		if(!Error)
	    		{
	    			nlapiSubmitField('invoice', stInvoiceId, 'custbody_notification_processed', 'T');
	        		nlapiLogExecution('DEBUG', logTitle, 'Successfully updated Notification Process to true. ID = ' + stInvoiceId);
	    		}
	    		else
	    		{
	    			nlapiLogExecution('DEBUG', logTitle, 'Did NOT update Notification Process to true due to error. ID = ' + stInvoiceId);
	    		}
	    		
	    		
	    	}
	    	else
	    	{
	    		// nlapiSubmitField('invoice', stInvoiceId, 'custbody_notification_processed', 'T');
        		nlapiLogExecution('DEBUG', logTitle, 'No CBS Milestone. Successfully updated Notification Process to true. ID = ' + stInvoiceId);
	    	}
	    	
	    }
	    
		// Send email alert    	
	    sendEmailAlert(stEmailAlert, stEmailRecipient);
		nlapiLogExecution('DEBUG', logTitle, 'Successfully sent email alert.');        
	            
		nlapiLogExecution('DEBUG', logTitle, '>>Exit<<');

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
 * Checks governance then calls yield
 * @param 	{Integer} myGovernanceThreshold 
 * 
 * @returns {Void} 
 */
function checkGovernance(myGovernanceThreshold)
{
	var context = nlapiGetContext();
	
	if( context.getRemainingUsage() < myGovernanceThreshold )
	{
		var state = nlapiYieldScript();
		if( state.status == 'FAILURE')
		{
			nlapiLogExecution("ERROR","Failed to yield script, exiting: Reason = "+state.reason + " / Size = "+ state.size);
			throw "Failed to yield script";
		} 
		else if ( state.status == 'RESUME' )
		{
			nlapiLogExecution("AUDIT", "Resuming script because of " + state.reason+".  Size = "+ state.size);
		}
		// state.status will never be SUCCESS because a success would imply a yield has occurred.  The equivalent response would be yield
	}
}

//Function to search all related records
function searchAllRecord (recordType, searchId, searchFilter, searchColumns)
{
	var arrSearchResults = [];
	var count=1000, min=0, max=1000;

	var searchObj = false;

	if (searchId) 
	{
		searchObj = nlapiLoadSearch(recordType, searchId);
		if (searchFilter)
		{
			searchObj.addFilters(searchFilter);
		}
			
		if (searchColumns)
		{
			searchObj.addColumns(searchColumns);
		}			
	} 
	else 
	{
		searchObj = nlapiCreateSearch(recordType, searchFilter, searchColumns);
	}

	var rs = searchObj.runSearch();

	while( count == 1000 )
	{
		var resultSet = rs.getResults(min, max);
		arrSearchResults = arrSearchResults.concat(resultSet);
		min = max;
		max+=1000;
		count = resultSet.length;
	}

	if(arrSearchResults)
	{
		nlapiLogExecution('DEBUG', 'searchAllRecord', 'Total search results('+recordType+'): '+arrSearchResults.length);
	}
	return arrSearchResults;		
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
 * Check if a string is empty
 * @param stValue (string) value to check
 * @returns {Boolean}
 */
function isEmpty (stValue) 
{
     if ((stValue == '') || (stValue == null) || (stValue == undefined)) 
     {
          return true;
     }

     return false;
}

/**
 * Search for 3PP Events where that has the Invoice or Sales Orders related to the PO set as 3PP Source Transaction
 * @param arrTranid
 * @returns
 */
function searchPending3PPEvents(arrTranid)
{		
	var arrFilters = [new nlobjSearchFilter('custrecord_3pp_event_source_tran', null, 'is', arrTranid),
	                  new nlobjSearchFilter('custrecord_3pp_event_trigger', null, 'noneof', '3')]; // none of Manual    		
 
	var arrColumns = [new nlobjSearchColumn('custrecord_3pp_event_source_tran')];	
 	
 	var arr3PPEventsSearchResult = nlapiSearchRecord('customrecord_3pp_events', null, arrFilters, arrColumns);
 	
 	return arr3PPEventsSearchResult;
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

function verifyLinks(stInvoiceId)
{
	var recInvoice = nlapiLoadRecord('invoice', stInvoiceId);
	
	var intLinksCount = recInvoice.getLineItemCount('links');
	nlapiLogExecution('DEBUG', 'verifyLinks', 'Links Count: '+intLinksCount);
	
	for (var line = 1; line <= intLinksCount; line++)
	{
		var stTranType = recInvoice.getLineItemValue('links', 'type', line);
		if(stTranType != 'Payment' && stTranType != 'Total')
		{
			nlapiLogExecution('DEBUG', 'verifyLinks', 'With Non-Payment Link: '+stTranType);
			return false;
		}
	}
	
	return true;
	
}
	