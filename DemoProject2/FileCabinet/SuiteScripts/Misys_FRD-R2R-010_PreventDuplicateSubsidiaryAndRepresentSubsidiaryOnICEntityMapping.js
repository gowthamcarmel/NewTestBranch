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
 * Prevent Duplicate Subsidiary and Represent Subsidiary on IC Entity Mapping
 * @author Aurel Shenne Sinsin
 * @version 1.0
 */
function beforeSubmit_prevntDupOnICEntityMapping(stType)
{ 
    try
    {  
    	var stLoggerTitle = 'beforeSubmit_prevntDupOnICEntityMapping';
    	
    	nlapiLogExecution('DEBUG', stLoggerTitle, '>>Entry<<');
    	
    	// If event type is not create or edit
		if (stType != 'create' && stType != 'edit')
        {			               
            return;
        }
				
		// If execution context is not user interface or csv import
		var stExecutionContext = nlapiGetContext().getExecutionContext();
        if(stExecutionContext != 'userinterface' && stExecutionContext != 'csvimport')
        {        	 
            return;
        }
        
        var stRecId = nlapiGetRecordId();
        nlapiLogExecution('DEBUG', stLoggerTitle, 'Intercompany Entity Mapping = ' + stRecId);
        
        // Get the value of Subsidiary and Represents Subsidiary
        var stSubsidiary = nlapiGetFieldValue('custrecord_iem_subsidiary');
        var stRepresentsSubsidiary = nlapiGetFieldValue('custrecord_iem_represents_subsidiary');
        nlapiLogExecution('DEBUG', stLoggerTitle, 'Subsidiary = ' + stSubsidiary + ' | Represents Subsidiary = ' + stRepresentsSubsidiary);
        
        // Perform a search on the Intercompany Entity Mapping record
        var stICEntityMapping = getICEntityMapping(stSubsidiary, stRepresentsSubsidiary, stRecId);
        nlapiLogExecution('DEBUG', stLoggerTitle, 'Existing Intercompany Entity Mapping = ' + stICEntityMapping);
        
        // If a record is returned by the search
        if (!isEmpty(stICEntityMapping))
        {
        	// Display an error message that the Subsidiary and Represent Subsidiary already exist and do not allow the record to be saved
        	var stError = 'Intercompany Entity Mapping with Subsidiary = ' + stSubsidiary + ' and Represents Subsidiary = ' + stRepresentsSubsidiary + ' already exists.';
            throw nlapiCreateError('99999', stError);
        }
         
        // Allow the record to be saved
    	nlapiLogExecution('DEBUG', stLoggerTitle, '>>Entry<<');
    	return;    	
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
 * Search for Intercompany Entity Mapping by Subsidiary and Represents Subsidiary
 * @param stSubsidiary
 * @param stRepresentsSubsidiary
 * @param stRecId
 * @returns
 */
function getICEntityMapping(stSubsidiary, stRepresentsSubsidiary, stRecId)
{
	var stICEntityMapping;
	var arrFilters = [new nlobjSearchFilter('custrecord_iem_subsidiary', null ,'anyof' , stSubsidiary),
	                  new nlobjSearchFilter('custrecord_iem_represents_subsidiary', null ,'anyof' , stRepresentsSubsidiary)];
	
	if (!isEmpty(stRecId))
	{
		arrFilters.push(new nlobjSearchFilter('internalid', null, 'noneof', stRecId));
	}
	 
	var arrResults = nlapiSearchRecord('customrecord_intercompany_entity_mapping', null, arrFilters);
	if (arrResults != null)
	{
		stICEntityMapping = arrResults[0].getId();
	}
	
	return stICEntityMapping; 
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
