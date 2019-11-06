/**
 * Copyright (c) 1998-2013 NetSuite, Inc.
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
 * This script will be deployed on employee record to prevent selecting current date as Date From value
 * 
 * @author Aurel Shenne Sinsin
 * @version 1.0
 */
function validateField_validateDateFrom(stType, stName, intLinenum)
{
	try
	{		
		if (stName == 'custentity_date_from')
		{
			var stDateFrom = nlapiGetFieldValue('custentity_date_from');
			if (stDateFrom)
			{
				var dCurrentDate = nlapiStringToDate(nlapiDateToString(new Date()));
				
				var dDateFrom = nlapiStringToDate(stDateFrom);
				if (dDateFrom < dCurrentDate)
				{		
					alert('Delegation of PR approval cannot be earlier than the current date.');
					return false;
				}	
			}
		}		
		
		return true;
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