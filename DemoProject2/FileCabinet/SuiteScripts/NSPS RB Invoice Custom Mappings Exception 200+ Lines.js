/**
 * Copyright (c) 1998-2011 NetSuite, Inc.
 * 2955 Campus Drive, Suite 100, San Mateo, CA, USA 94403-2511
 * All Rights Reserved.
 *
 * This software is the confidential and proprietary information of
 * NetSuite, Inc. ("Confidential Information"). You shall not
 * disclose such Confidential Information and shall use it only in
 * accordance with the terms of the license agreement you entered into
 * with NetSuite.
 *
 * The purpose of this script is to map subscription and subscription item fields into invoice body/column fields
 *
 * @param (string) stType the read operation type
 * @author John Peacock
 * @version 1.0
 */

function nsPs_rb_invoiceMappingSchedule()
{
	try
	{
		nlapiLogExecution('debug', 'START');
		
		//Check Usage of script
		var context = nlapiGetContext();
		var usageBegin = context.getRemainingUsage();
		nlapiLogExecution('DEBUG', 'usageBegin ==' + usageBegin);
		
		var columns = new Array();
	    columns[0] = new nlobjSearchColumn('internalid');
	    	    
	    var o_searchDatabase = nlapiSearchRecord('invoice', 'customsearch_ns_invoicecolumns_to_update', null, columns);
	    nlapiLogExecution('DEBUG', 'schedule', 'o_searchDatabase-->' + o_searchDatabase);
	    
	    if (_logValidation(o_searchDatabase)) 
	    {
	    	var ResultLength = o_searchDatabase.length;
		    nlapiLogExecution('DEBUG', 'schedule', 'ResultLength-->' + ResultLength);

	        for (var s = 0; s < o_searchDatabase.length; s++) 
	        {
	        	var InvoiceID = o_searchDatabase[s].getValue('internalid');
	            nlapiLogExecution('DEBUG', 'schedule', 'InvoiceID-->' + InvoiceID);
	            
	            if (_logValidation(InvoiceID))
	            {
	                var recInv = nlapiLoadRecord('invoice', InvoiceID);
	                
	        		var subscr = recInv.getFieldValue('custbody_sb_subscription');
	        		nlapiLogExecution('debug', 'sub id = ', subscr);
	        		
	        		recInv.setFieldValue('custbody_custom_mappings_updated', 'F');

	        		if (subscr)
	        		{
	        			var recSub = nlapiLoadRecord('customrecord_sb_subscription', subscr);

	        			nlapiLogExecution('debug', 'Is Subscription');

	        			var bodyFilters = new Array();
	        			bodyFilters.push(new nlobjSearchFilter('isinactive', null, 'is', 'F'));
	        			bodyFilters.push(new nlobjSearchFilter('custrecord_rb_mapbody_sub_2_invoice', null, 'is', 'T'));
	        			
	        			var bodyColumns = new Array();
	        			bodyColumns.push(new nlobjSearchColumn('custrecord_rb_mapbody_txn'));
	        			bodyColumns.push(new nlobjSearchColumn('custrecord_rb_mapbody_sub'));
	        			
	        			// Execute a Search on Contract Lines custom record with the following 		
	        			var bodyResults = nlapiSearchRecord('customrecord_rb_body_field_mapping', null, bodyFilters, bodyColumns);		
	        			
	        			if ( (bodyResults) && (bodyResults.length > 0) )
	        			{
	        				nlapiLogExecution('debug', 'found body fields to map');
	        				var bodyFields = new Array();
	        				for (var i = 0; i < bodyResults.length; i++)
	        				{
	        					bodyFields.push([bodyResults[i].getValue('custrecord_rb_mapbody_txn'), bodyResults[i].getValue('custrecord_rb_mapbody_sub')]);
	        					nlapiLogExecution('debug', 'target field = ', bodyResults[i].getValue('custrecord_rb_mapbody_txn'));
	        					nlapiLogExecution('debug', 'source field = ', bodyResults[i].getValue('custrecord_rb_mapbody_sub'));
	        				}
	        				var fields = new Array();
	        				var values = new Array();
	        				for (var j = 0; j < bodyFields.length; j ++)
	        				{
	        					var currField = new Array();
	        					currField = bodyFields[j];
	        					nlapiLogExecution('debug', 'field to populate = ', currField[0]);
	        					nlapiLogExecution('debug', 'field value = ', currField[1]);
	        					
	        					recInv.setFieldValue(currField[0], recSub.getFieldValue(currField[1]));
	        					//nlapiSetFieldValue(currField[0], recSub.getFieldValue(currField[1]));
	        				}
	        			}

	        			nlapiLogExecution('debug', 'looking for column fields to map');
	        			var columnFilters = new Array();
	        			columnFilters.push(new nlobjSearchFilter('isinactive', null, 'is', 'F'));
	        			columnFilters.push(new nlobjSearchFilter('custrecord_rb_mapcolumn_sub_2_invoice', null, 'is', 'T'));
	        			
	        			var columnColumns = new Array();
	        			columnColumns.push(new nlobjSearchColumn('custrecord_rb_mapcolumn_txn'));
	        			columnColumns.push(new nlobjSearchColumn('custrecord_rb_mapcolumn_sub'));
	        			
	        			// Execute a Search on Contract Lines custom record with the following 		
	        			var columnResults = nlapiSearchRecord('customrecord_rb_column_field_mapping', null, columnFilters, columnColumns);		

	        			if ( (columnResults) && (columnResults.length > 0) )
	        			{
	        				nlapiLogExecution('debug', 'found column fields to map');
	        				var numLines = recInv.getLineItemCount('item');

	        				var srcFields = new Array();
	        				var tarFields = new Array();
	        				for (var i = 0; i < columnResults.length; i++)
	        				{
	        					srcFields.push(columnResults[i].getValue('custrecord_rb_mapcolumn_sub'));
	        					tarFields.push(columnResults[i].getValue('custrecord_rb_mapcolumn_txn'));
	        					nlapiLogExecution('debug', 'source field = ', columnResults[i].getValue('custrecord_rb_mapcolumn_sub'));
	        					nlapiLogExecution('debug', 'target field = ', columnResults[i].getValue('custrecord_rb_mapcolumn_txn'));
	        				}
	        				
	        				for (var tex = 1; tex <= numLines; tex++)
	        				{
	        					var subItem = recInv.getLineItemValue('item', 'custcol_sb_related_sub_item', tex);
	        					nlapiLogExecution('debug', 'processing line ', tex);
	        					nlapiLogExecution('debug', 'first source value = ', srcFields[0]);
	                                                if (!subItem)
	                                                {
	                                                       continue;
	                                                }

	        					var values = nlapiLookupField('customrecord_sb_subscription_item', subItem, srcFields);
	        					nlapiLogExecution('debug', 'found values.');
	        					
	        					for (var k = 0; k < srcFields.length; k++)
	        					{
	        						nlapiLogExecution('debug', 'the field to complete is: ', tarFields[k]);
	        						nlapiLogExecution('debug', 'the field value is: ', values[srcFields[k]]);
	        						recInv.setLineItemValue('item', tarFields[k], tex, values[srcFields[k]]);
	        					}
	        				}
	        			}
	        			
	        		}
	        		recInv.setFieldValue('custbody_custom_mappings_updated', 'T');
	        		recInv.setFieldValue('custbody_to_update_lines', 'F');
	        		
	        		var ID = nlapiSubmitRecord(recInv, true);
	        		nlapiLogExecution('DEBUG', 'ID ==' + ID);
	            }
	        }
	    }
	    
		var context = nlapiGetContext();
		var usageBegin = context.getRemainingUsage();
		nlapiLogExecution('DEBUG', 'remainingusageBegin ==' + usageBegin);
	}
	catch(e)
    {
        if (e.getDetails != undefined)
        {
            nlapiLogExecution('debug', 'Process Error',  e.getCode() + ': ' + e.getDetails());
            throw e;
        }
        else
        {
			nlapiLogExecution('debug', 'Unexpected Error', e.toString());
            throw nlapiCreateError('99999', e.toString());
        }
    }
}

function _logValidation(value)
{
    if (value != null && value != '' && value != undefined) 
    {
        return true;
    }
    else 
    {
        return false;
    }
}
function myTimer() 
{
	var count = 0;
	for(var l = 0; l < 10000000; l++)
	{
		count = count + 1;
	}
	nlapiLogExecution('DEBUG', 'count ==' + count);
}
function sleep(milliseconds) 
{
    var start = new Date().getTime();
    for (var i = 0; i < 1e7; i++) {
        if ((new Date().getTime() - start) > milliseconds){
            break;
        }
    }
}