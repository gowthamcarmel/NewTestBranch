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
 * This Automation is required to ensure the Advance Bill Date is never before the current date
 *
 * @param (string) <varname><desc>
 * @return <desc>
 * @type int
 * @version 1.0
 */
 
function main()
{

	try
	{
		var theDate = new Date();
		var theHour = theDate.getHours();
		nlapiLogExecution('debug', 'the hour = ', theHour);
		var theTzOffset = theDate.getTimezoneOffset();
		var hoursOffset = parseFloat(theTzOffset) / 60;
		nlapiLogExecution('debug', 'the offset minutes = ', theTzOffset);
		nlapiLogExecution('debug', 'the offset hours = ', hoursOffset);
		var checkHour = parseFloat(theHour) + parseFloat(hoursOffset);
		nlapiLogExecution('debug', 'the check hours = ', checkHour);
		if (checkHour >= 23)
		{
			var today = nlapiDateToString(nlapiAddDays(theDate, 1));
		}
		else
		{
			var today = nlapiDateToString(theDate);
		}
//			var todayTz = nlapiStringToDate(today, 'datetimetz');
//			nlapiLogExecution('debug', theDate);
			nlapiLogExecution('debug', 'today is: ' + today);
//			nlapiLogExecution('debug', todayTz);

		var filters = new Array();
		filters.push(new nlobjSearchFilter('custrecord_sb_advance_billing_date', null, 'isNotEmpty'));
		filters.push(new nlobjSearchFilter('custrecord_sb_advance_billing_date', null, 'before', today));
      filters.push(new nlobjSearchFilter('isinactive', null, 'is', 'F'));

		var columns = new Array();
		columns.push(new nlobjSearchColumn('internalid'));
		
		var subs = nlapiSearchRecord('customrecord_sb_subscription', null, filters, columns);
		
		if (subs)
		{
			nlapiLogExecution('debug', 'number to process = ', subs.length);
			for (var i = 0; i < subs.length; i++)
			{
				nlapiLogExecution('debug', 'subscr ' +i, subs[i].getId());
				nlapiSubmitField('customrecord_sb_subscription', subs[i].getId(), 'custrecord_sb_advance_billing_date', today);
				if (i == (subs.length - 1))
				{
					var stSchedStatus = nlapiScheduleScript(nlapiGetContext().getScriptId(), nlapiGetContext().getDeploymentId());
				}
			}
		}
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
