function removeDelegation()
{
	try
	{
		//alert('in client script')
		var DelegatedApproverRecId = nlapiGetRecordId();
		//alert('DelegatedApproverRecId ='+DelegatedApproverRecId)
		
		var recType = nlapiGetRecordType();
		//alert('recType ='+recType)
			
		var DelegatedApprover = nlapiLoadRecord(recType, DelegatedApproverRecId);
		
		DelegatedApprover.setFieldValue('custrecord_remove_delegation_check', 'T');
		
		var ID = nlapiSubmitRecord(DelegatedApprover, true, true);
		//alert('ID ='+ID)
		
		var searchURL = nlapiResolveURL('RECORD', 'customrecord_delegated_approver', ID, 'VIEW');
		//alert('searchURL ='+searchURL)

		window.ischanged=false;
		window.location=searchURL;
	}
	catch(e)
	{
		 nlapiLogExecution('ERROR','Process Error',  e.getCode() + ': ' + e.getDetails());
	}
}