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
 * The user can manually update the Notify Vendor flag on ad hoc basis through a custom button that will display a suitelet from the Purchase Order record.
 * 
 * @author Aurel Shenne Sinsin
 * @version 1.0
 */
function beforeLoad_displayUpdateVendorNotiButton(stType, form, request)
{
	try
    {  
		var LOGGER_TITLE = 'beforeLoad_displayUpdateVendorNotiButton';
    	nlapiLogExecution('DEBUG', LOGGER_TITLE, '>>Entry<<');
    	
    	if (stType != 'view')
    	{
    		nlapiLogExecution('DEBUG', LOGGER_TITLE, '>>Exit<<');
    		return true;
    	}
    	
    	var stPO = nlapiGetRecordId();
    	nlapiLogExecution('DEBUG', LOGGER_TITLE, 'PO = ' + stPO);
    	
    	// If 3PP PO = F
    	var b3PPPO = nlapiGetFieldValue('custbody_3pp_po');
    	nlapiLogExecution('DEBUG', LOGGER_TITLE, '3PP PO = ' + b3PPPO);
    	
    	if (b3PPPO == 'F')
    	{
    		nlapiLogExecution('DEBUG', LOGGER_TITLE, 'Update Vendor Notification will not be displayed. Exit');
    		return true;
    	}
    	
    	var bShowButton = false;
    	var intLineItemCount = nlapiGetLineItemCount('item');
    	for (var i = 1; i <= intLineItemCount; i++)
    	{
    		var bNotifyVendor = nlapiGetLineItemValue('item', 'custcol_3pp_notify_vendor', i);
    		if (bNotifyVendor == 'F')
    		{
    			bShowButton = true;
    			break;
    		}
    	
    	}
    	
    	if (bShowButton)
    	{
    		// Display a button labelled as Update Vendor Notification which will call a suitelet
        	var stURLParams = '&custpage_poid=' + stPO;    	
        	var stSuiteletURL = nlapiResolveURL('SUITELET','customscript_mark_notify_vendor','customdeploy_mark_notify_vendor') + stURLParams;
        	nlapiLogExecution('DEBUG', LOGGER_TITLE, 'Update Vendor Notification will be displayed. Suitelet URL = ' + stSuiteletURL);
        	
        	form.addButton('custpage_update_vendor_notification_button', 'Update Vendor Notification','window.location=\'' + stSuiteletURL + '\';');		
    	}
    	else
    	{
    		nlapiLogExecution('DEBUG', LOGGER_TITLE, 'Update Vendor Notification will not be displayed');
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
 * 
 * @param request
 * @param response
 */
function suitelet_markNotifyVendor(request,response)
{		
	var LOGGER_TITLE = 'suitelet_markNotifyVendor';
	nlapiLogExecution('DEBUG', LOGGER_TITLE, '>>Entry<<');
    
    try
    {    	
    	var stStage = request.getParameter('custpage_stage');
    	var stPO = request.getParameter('custpage_poid');
    	nlapiLogExecution('DEBUG', LOGGER_TITLE, 'Purchase Order = ' + stPO);
    	
    	var form = nlapiCreateForm('Mark Notify Vendor');
		
    	if(isEmpty(stStage))
		{    		
    		form = displayItems(request, response, stPO); 
		}		
    	if(stStage == 'sublistSubmitted')
		{
			form = submitPO(request, response);
		}
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
    }    
}


/**
 * Display a sublist that the user will use to select the item lines where Notify Vendor will be checked
 * @param request
 * @param response
 * @param stPO
 */
function displayItems(request, response, stPO)
{	
	var LOGGER_TITLE = 'displayItems';
	
	var form = nlapiCreateForm('Mark Notify Vendor');
	form.setScript('customscript_prevent_notify_vendor_unchk');
	form.addField('custpage_stage', 'text', 'Stage').setDisplayType('hidden').setDefaultValue('sublistSubmitted');
	form.addField('custpage_po', 'text', 'PO').setDisplayType('hidden').setDefaultValue(stPO);
	
	// Loop through the item sublist of the Purchase Order and populate the fields on the suitelet
	var sublistItems = form.addSubList('custpage_item_list', 'list', 'Items');
	sublistItems.addField('custpage_mark_notify_vendor', 'checkbox', 'Mark Notify Vendor');
	sublistItems.addField('custpage_do_not_allow_uncheck', 'checkbox', 'Allow Uncheck').setDisplayType('hidden');
	sublistItems.addField('custpage_item', 'select', 'Item', '-10').setDisplayType('inline');
	sublistItems.addField('custpage_description', 'text', 'Description').setDisplayType('inline');
	sublistItems.addField('custpage_vendor_milestone', 'text', 'Vendor Milestone').setDisplayType('inline');
	sublistItems.addField('custpage_vendor_bsch_trigger', 'text', 'Vendor BSch Trigger').setDisplayType('inline');
	sublistItems.addField('custpage_amount', 'text', 'Amount').setDisplayType('inline');
	
	var recPO = nlapiLoadRecord('purchaseorder', stPO);
	var intLineItemCount = recPO.getLineItemCount('item');
	nlapiLogExecution('DEBUG', LOGGER_TITLE, 'Line Item Count = ' + intLineItemCount);
	for (var i = 1; i <= intLineItemCount; i++)
	{
		sublistItems.setLineItemValue('custpage_item', i, recPO.getLineItemValue('item', 'item', i));
		sublistItems.setLineItemValue('custpage_description', i, recPO.getLineItemValue('item', 'description', i));		
		sublistItems.setLineItemValue('custpage_vendor_milestone', i, recPO.getLineItemText('item', 'custcol_3pp_vendor_milestone', i));
		sublistItems.setLineItemValue('custpage_vendor_bsch_trigger', i, recPO.getLineItemText('item', 'custcol_3pp_vendor_bsch_trigger', i));
		sublistItems.setLineItemValue('custpage_amount', i, recPO.getLineItemValue('item', 'amount', i));
		
		var bCurrentMark = recPO.getLineItemValue('item', 'custcol_3pp_notify_vendor', i);
		sublistItems.setLineItemValue('custpage_mark_notify_vendor', i, bCurrentMark);
		sublistItems.setLineItemValue('custpage_do_not_allow_uncheck', i, bCurrentMark);
	}
	
	// Create the following buttons: Mark All, Save, Cancel
	form.addSubmitButton('Submit');
	form.addButton('custpage_cancel_button', 'Cancel', 'window.location=\'/app/center/card.nl?sc=-29\'');
	
	response.writePage(form);	
}


/**
 * 
 * @param request
 * @param response
 * @param stPO
 */
function submitPO(request, response)
{		
	var LOGGER_TITLE = 'submitPO';
	
	var stPO = request.getParameter('custpage_po');
	var recPO = nlapiLoadRecord('purchaseorder', stPO);
	
	// Loop through item sublist and update the Purchase Order record with Notify Vendor flag for each item line
	var intRequestLineItemCount = request.getLineItemCount('custpage_item_list');
	var intRecordLineItemCount = recPO.getLineItemCount('item');
	for (i = 1; i <= intRecordLineItemCount; i++)
	{		
		recPO.setLineItemValue('item', 'custcol_3pp_notify_vendor', i, request.getLineItemValue('custpage_item_list', 'custpage_mark_notify_vendor', i));
	}
	
	nlapiSubmitRecord(recPO, true, true);
	nlapiLogExecution('DEBUG', LOGGER_TITLE, 'Successfully updated Purchase Order. ID = ' + stPO);
	
	nlapiSetRedirectURL('RECORD', 'purchaseorder', stPO, false);
}


/**
 * Prevent user from unchecking Notify Vendor flag
 * @param stType
 * @param stName
 * @returns {Boolean}
 */
function fieldChanged_preventNotifyVendorToBeUnch(stType, stName)
{
	try
	{
		if (stType == 'custpage_item_list' && stName == 'custpage_mark_notify_vendor')
		{
			var bMarkNotifyVendor = nlapiGetCurrentLineItemValue('custpage_item_list', 'custpage_mark_notify_vendor');
			var bDoNotAllowUncheck = nlapiGetCurrentLineItemValue('custpage_item_list', 'custpage_do_not_allow_uncheck');
			if (bMarkNotifyVendor == 'F' && bDoNotAllowUncheck == 'T')
			{
				nlapiSetCurrentLineItemValue('custpage_item_list', 'custpage_mark_notify_vendor', 'T');
			}
		}
		return true;
		
	}
   	catch (error)
	{
   		if (error.getDetails != undefined)
        {
            nlapiLogExecution('ERROR','Process Error',error.getCode() + ': ' + error.getDetails());
            throw error;
        }
        else
        {
            nlapiLogExecution('ERROR','Unexpected Error',error.toString()); 
            throw nlapiCreateError('99999', error.toString());
        }
	}	
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


