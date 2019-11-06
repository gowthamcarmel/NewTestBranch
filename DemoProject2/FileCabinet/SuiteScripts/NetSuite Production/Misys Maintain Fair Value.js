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
 *
 * The purpose of this script is to update the 'Fair Value' amount stored on the subscription item.  This value is used by resulting invoices to allocate revenue.
 *
 * @param (string) stType the read operation type
 * @author 
 * @version 1.0
 */
 
 
 function updateFairValue(type)
{
    var stExecutionMode = nlapiGetContext().getExecutionContext();
    nlapiLogExecution('debug', 'Starting Before Submit');
    nlapiLogExecution('debug', 'stExecutionMode: ' + stExecutionMode);
	
	var subscrItem = nlapiGetRecordId();
	nlapiLogExecution('debug', 'subscr item = ', subscrItem);
	var uplift = nlapiGetFieldValue('custrecord_uplift_amt');
	var effdt = nlapiGetFieldValue('custrecord_uplift_date');
	nlapiLogExecution('debug', 'uplift = ', uplift);
	
	if (!uplift)
	{
		nlapiLogExecution('debug', 'uplift not set, exiting');
		return;
	}
	
	var theUpliftArr = uplift.split('%');
	var theUplift = (parseFloat(theUpliftArr[0]) / 100) + 1;
	nlapiLogExecution('debug', 'the uplift', theUplift);
	var theUplift = (parseFloat(theUpliftArr[0]) / 100) + 1;
	nlapiLogExecution('debug', 'the uplift', theUplift);
	var fairValue = nlapiGetFieldValue('custrecord_vsoeprice');
	nlapiLogExecution('debug', 'the old fair value = ', fairValue);
	newFairValue = parseFloat(fairValue) * parseFloat(theUplift);
	nlapiLogExecution('debug', 'the new fair value = ', newFairValue);
	nlapiSetFieldValue('custrecord_vsoeprice', newFairValue);

	nlapiSetFieldValue('custrecord_uplift_amt', '');
//	nlapiSetFieldValue('custrecord_uplift_date', '');  // not resetting date to blank so that it is known when the last uplift occurred.
	
}