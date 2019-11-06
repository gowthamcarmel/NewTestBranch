function SendEmailToFinanceApprovers() 
{
	var stLoggerTitle = 'workflowAction_FinanceApproverEmail';
	
	nlapiLogExecution('DEBUG', stLoggerTitle, '>>Entry<<');
    
    try
    {    	
    	var ApproverList = nlapiGetFieldValue('custbody_finance_approvers');
    	nlapiLogExecution('DEBUG', stLoggerTitle, 'ApproverList = ' + ApproverList);
    	
    	if(_logValidation(ApproverList))
    	{
    		var ApproverArray = ApproverList.split(',');
        	nlapiLogExecution('DEBUG', stLoggerTitle, 'ApproverArray = ' + ApproverArray);
        	
        	var EmployeeName = nlapiGetFieldText('entity');
        	nlapiLogExecution('DEBUG', stLoggerTitle, 'EmployeeName = ' + EmployeeName);
        	
        	var sendEmailFrom = nlapiGetFieldValue('entity');
        	nlapiLogExecution('DEBUG', stLoggerTitle, 'sendEmailFrom = ' + sendEmailFrom);
        	
        	var internalid = nlapiGetRecordId();
        	nlapiLogExecution('DEBUG', stLoggerTitle, 'internalid = ' + internalid);
        	
        	var stTranId = nlapiGetFieldValue('tranid');
        	nlapiLogExecution('DEBUG', stLoggerTitle, 'stTranId = ' + stTranId);
        	
        	var stTitle = 'Requisition to Approve : ' + stTranId;
        	
        	var sendEmailTo;
        	 
        	for(var i = 0; i < ApproverArray.length; i++)
        	{
        		var Employee = ApproverArray[i];
        		nlapiLogExecution('DEBUG', stLoggerTitle, 'Employee = ' + Employee);
        		
        		var EmployeeEmail = nlapiLookupField('employee',Employee,'email');
        		nlapiLogExecution('DEBUG', stLoggerTitle, 'EmployeeEmail = ' + EmployeeEmail);
        		
        		if(i == 0)
        		{
        			sendEmailTo = EmployeeEmail;
        		}
        		else
        		{
        			sendEmailTo = sendEmailTo + ',' + EmployeeEmail;
        		}
        	}
        	nlapiLogExecution('DEBUG', stLoggerTitle, 'sendEmailTo = ' + sendEmailTo);
        	
        	var stEmailMessage = 'Please open the attached file to view your Purchase Order.<br/><br/>';
    		stEmailMessage += 'This is an automated email. Kindly do not respond to this email. Please refer to the attached Purchase order for contact details.<br/><br/>';
    		stEmailMessage += 'To view the attachment, you first need the free Adobe Acrobat Reader. If you don\'t have it yet, visit Adobe\'s Web site http://www.adobe.com/products/acrobat/readstep.html to download it.<br/><br/>';
    		
    		var stEmailMessage = '<html><head><meta http-equiv="Content-Type" content="text/html; charset=utf-8"><base href="https://system.eu1.netsuite.com/"></head>';
    		stEmailMessage += '<body style="font-family:Verdana,Arial,Helvetica,sans-serif;font-size:10pt;"><span style="color: rgb(0, 0, 0); font-family: Tahoma, Geneva, sans-serif; font-style: normal; font-variant: normal; font-weight: normal; letter-spacing: normal; line-height: normal; orphans: auto; text-align: start; text-indent: 0px; text-transform: none; white-space: normal; widows: auto; word-spacing: 0px; -webkit-text-stroke-width: 0px; float: none; display: inline !important;">';
    		stEmailMessage += '<font size="2"><br>You have a new employee purchase request from'+ EmployeeName +' to approve.</font></span><br>';
    		stEmailMessage += '<div style="font-size: 8pt;"><span style="font-size: 8pt;"><font size="2"><br><u><b>If you are&nbsp;<font color="#0000ff">NOT</font>&nbsp;already logged in to NetSuite:</b></u></font></span></div><div style="font-size: 8pt;"><font face="tahoma" size="2">You can directly access NetSuite by clicking&nbsp;</font><font face="tahoma" size="2"><a href="https://appadfs.misys.com/adfs/ls/idpinitiatedsignon.aspx?loginToRp=http://www.netsuite.com/sp&amp;appname=Netsuite" target="_self"><b>here</b></a>&nbsp;</font><font face="tahoma" size="2">using your Misys network ID and password. You can then browse through the list of Requisitions&nbsp;</font><font size="2"><font face="tahoma">and click on&nbsp;<b>Date&nbsp;</b></font></font><font size="2"><font face="tahoma"><b><font size="2"><font face="tahoma">field</font></font>&nbsp;(extreme left)&nbsp;</b>to Approve/Reject.</font></font></div><div style="font-size: 8pt;"><font face="tahoma" size="2"><i>Please note that this link can also be used when not connected to the Misys network.</i></font></div>';
    		stEmailMessage += '<font face="tahoma" size="2"><br><b><u>If you&nbsp;<font color="#0000ff">ARE</font>&nbsp;already logged in to NetSuite:</u></b></font><br><font face="tahoma" size="2">Please click on the &quot;View Record&quot; link below to access the Purchase Request.</font>';
    		stEmailMessage += '<p class="text" style="font-weight:bold"><a href="https://system.eu1.netsuite.com/app/accounting/transactions/purchreq.nl?id='+internalid+'&amp;c=3431250">View Record</a></p></body>';
    		stEmailMessage += '</html>&quot;Misys&quot; is the trade name of the Misys group of companies. This email and any attachments have been scanned for known viruses using multiple scanners. This email message is intended for the named recipient only. It may be privileged and/or confidential. If you are not the named recipient of this email please notify us immediately and do not copy it or use it for any purpose, nor disclose its contents to any other person. This email does not constitute the commencement of legal relations between you and Misys. Please refer to the executed contract between you and the relevant member of the Misys group for the identity of the contracting party with which you are dealing.';

    		nlapiSendEmail(sendEmailFrom, sendEmailTo, stTitle, stEmailMessage, null, null, null, null);
    		
    		nlapiLogExecution('DEBUG', stLoggerTitle, 'Successfully sent email.');
        	
        	    
            return null;
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
        return null;
    }
}

function _logValidation(value)
{
	if(value != null && value != '' && value != undefined && value.toString() != 'NaN' && value != NaN)
	{
		return true;
	}
	else
	{
		return false;
	}
}