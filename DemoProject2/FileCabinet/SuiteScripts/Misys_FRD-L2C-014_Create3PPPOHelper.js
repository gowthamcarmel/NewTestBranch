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
 * Field changed script triggered when Vendor is selected to filter the Misys Ref dropdown
 * @author Aurel Shenne Sinsin
 * @version 1.0
 */
function fieldChanged_updateMisysRef(stType, stName, intLinenum)
{ 
    try
    {  
    	// Check if Vendor field is selected
    	if (stName == 'custpage_vendors')
    	{
    		nlapiRemoveOption('custpage_misys_ref');
    		
    		// If there is a Vendor selected, add the Misys Ref associated to the Vendor
    		var stVendor = nlapiGetFieldValue('custpage_vendors');
    		if (!isEmpty(stVendor)) 
    		{
    			// Call function
    			addMisysRef(stVendor);
    		}
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
        return false;
    }    
}


/**
 * Function that will search for Misys Ref and add values to the dropdown
 * @param stVendor
 */
function addMisysRef(stVendor)
{		
	// Search for Misys Ref associated to the Vendor on the 3PP Events custom record
	var arrFilters = [new nlobjSearchFilter('custrecord_3pp_event_vendor', null, 'anyOf', stVendor)];
	var arrColumns = [new nlobjSearchColumn('custrecord_3pp_event_misys_ref', null, 'group')];
	var arrResults = nlapiSearchRecord('customrecord_3pp_events', null, arrFilters, arrColumns);	
	if (arrResults != null)
	{
		// Add blank option
		nlapiInsertSelectOption('custpage_misys_ref','','');
		
		for (var i = 0; i < arrResults.length; i++)
		{
			// Add the Misys Ref to the dropdown
			var stMisysRef = arrResults[i].getValue('custrecord_3pp_event_misys_ref', null, 'group');
			if (stMisysRef != '-None-')
			{
				nlapiInsertSelectOption('custpage_misys_ref', stMisysRef, stMisysRef,false);
			}			
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
