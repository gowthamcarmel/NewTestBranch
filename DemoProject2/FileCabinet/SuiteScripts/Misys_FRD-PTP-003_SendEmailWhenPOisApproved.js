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
 * Send email to Vendor when PO is approved
 * 
 * @author Aurel Shenne Sinsin
 * @version 1.0
 */
function afterSubmit_sendEmailWhenPOisApproved(stType)
{	
	var stLoggerTitle = 'afterSubmit_sendEmailWhenPOisApproved';
		
	nlapiLogExecution('DEBUG', stLoggerTitle, 'Entered After Submit.');
    
    try
    {
    	var oldRec = nlapiGetOldRecord();
    	var stOldStatus = oldRec.getFieldValue('approvalstatus');
    	var stStatus = nlapiGetFieldValue('approvalstatus');
    	nlapiLogExecution('DEBUG', stLoggerTitle, 'Old Approval Status = ' + stOldStatus + ' | New Approval Status = ' + stStatus);

    	if ((stOldStatus == 1) && (stStatus == 2))
    	{
    		var stVendor = nlapiGetFieldValue('entity');
        	//var bToBeEmailed = nlapiLookupField('vendor', stVendor, 'emailtransactions');
			var bToBeEmailed = nlapiGetFieldValue('custbody_to_be_emailed');
        	nlapiLogExecution('DEBUG', stLoggerTitle, 'Vendor = ' + stVendor + ' | Email Transactions = ' + bToBeEmailed);
    		
    		if (bToBeEmailed == 'F')
        	{
        		nlapiLogExecution('DEBUG', stLoggerTitle, 'Exit After Submit Successfully.');
        		return;    		
        	}
    		
    		var file = nlapiPrintRecord('TRANSACTION', nlapiGetRecordId(), 'DEFAULT', null);
    		
    		var stTranId = nlapiGetFieldValue('tranid');
    		var companyInformation  = nlapiLoadConfiguration('companyinformation');
    		var stCompanyName = companyInformation.getFieldValue('companyname');    		
    		var stTitle = stCompanyName + ' : ' + 'Purchase Order #' + stTranId;
    		
    		var stEmailMessage = 'Please open the attached file to view your Purchase Order.<br/><br/>';
    		stEmailMessage += 'This is an automated email. Kindly do not respond to this email. Please refer to the attached Purchase order for contact details.<br/><br/>';
    		stEmailMessage += 'To view the attachment, you first need the free Adobe Acrobat Reader. If you don\'t have it yet, visit Adobe\'s Web site http://www.adobe.com/products/acrobat/readstep.html to download it.<br/><br/>';
    		
    		var stRecordId = nlapiGetRecordId();
    		var records = new Object();
    		records['transaction'] = '1000';
    		records['transaction'] = stRecordId;
    		
			var transEmailAddress = nlapiGetFieldValue('email');
			var sendEmailTo=stVendor
			if (transEmailAddress!="" && transEmailAddress!=null){
				sendEmailTo = transEmailAddress;
			}
			var sendEmailFrom = nlapiGetContext().getSetting('SCRIPT', 'custscript_email_sender');
			if (sendEmailFrom=='' || sendEmailFrom==null){
				sendEmailFrom = nlapiGetUser()
			}
    		nlapiSendEmail(sendEmailFrom, sendEmailTo, stTitle, stEmailMessage, null, null, records, file);

			//nlapiSendEmail(nlapiGetUser(), nlapiGetFieldValue('entity'), stTitle, stEmailMessage, null, null, records, file);
    		nlapiLogExecution('DEBUG', stLoggerTitle, 'Successfully sent email.');
    	}

    	nlapiLogExecution('DEBUG', stLoggerTitle, 'Exit After Submit Successfully.');
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