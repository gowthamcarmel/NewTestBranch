// P2P - config Bundle - Changes in the script based on Advanced Procurement Module 
//hide edit button once a vendor bill & PO
function beforeLoad_hideEditButtonForAdmin(type,form,request){
	try{
		var context = nlapiGetContext().getExecutionContext();
		if (context == 'userinterface') 
		{
			var recType = nlapiGetRecordType();
			//vendor bills approved should editable except to administrators
			if ( recType == 'vendorbill'){
				var approvalStatus = nlapiGetFieldValue('approvalstatus');
				if (type == 'view') {
					//var approvalStatus = nlapiGetFieldValue('approvalstatus');
					if (approvalStatus == 2) {
						//hide the edit button from users when the status is approved
						form.removeButton('edit');
					}
				}
				if (type == 'edit' && approvalStatus == 2)
				{
					nlapiSetRedirectURL('RECORD', nlapiGetRecordType(), nlapiGetRecordId(), false);
					return true;		
				}
			}
			
			//purchase orders that are fully billed should not be editable except for Administrators
			if (recType == 'purchaseorder'){
				var statusRec = nlapiGetFieldValue('status');
				if (type == 'view') {
					//var approvalStatus = nlapiGetFieldValue('approvalstatus');
					if (statusRec=='Fully Billed'){
						//hide the edit button from users when the status is approved
						form.removeButton('edit');
					}
				}
				if (type == 'edit' && statusRec=='Fully Billed')  //P2P - config Bundle 
				{
					nlapiSetRedirectURL('RECORD', nlapiGetRecordType(), nlapiGetRecordId(), false);
					return true;		
				}
				
			}
			
			if (recType == 'purchaserequisition'){  //P2P - config Bundle 
				var statusRec = nlapiGetFieldValue('status');
				if (type == 'view') {
					//var approvalStatus = nlapiGetFieldValue('approvalstatus');
					if (statusRec=='Fully Ordered')
					{
						//hide the edit button from users when the status is approved
						form.removeButton('edit');
					}
				}
				if (type == 'edit' && statusRec=='Fully Ordered')
				{
					nlapiSetRedirectURL('RECORD', nlapiGetRecordType(), nlapiGetRecordId(), false);
					return true;		
				}
				
			}
		}
	}
	catch(error) 
	{
 	   if (error.getDetails != undefined) 
 	   {
 		   nlapiLogExecution('ERROR', 'Process Error', error.getCode() + ': ' + error.getDetails());
 		   throw error;
 	   }
 	   else 
 	   {    
 		   nlapiLogExecution('ERROR', 'Unexpected Error', error.toString());
 		   throw nlapiCreateError('99999', error.toString());
 	   }
 	}	
}