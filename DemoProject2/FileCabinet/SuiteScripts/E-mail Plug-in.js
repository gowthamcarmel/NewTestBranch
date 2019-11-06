function process(email){
		
			
	// Initialize values
	var context = nlapiGetContext();
	var sysEnv = context.getEnvironment();
	var emailFromAddress = email.getFrom().getEmail();
	var emailDate = email.getSentDate(); 
	var emailSubject = email.getSubject();
	var emailBody = email.getTextBody();
	
	// find invoice
	var emailSubjectResult = emailSubject.replace(/\[|\]/gi,'');
	
	var emailViuId = emailSubject.substring(0,5);
	nlapiLogExecution('DEBUG', 'VendInv internal id: ' + emailViuId, '');
	
	nlapiLogExecution('DEBUG', 'Search for VendInv: ' + emailSubjectResult, '');
	
	var billRes = nlapiSearchRecord('customrecord_ven_inv_upload_form',null, [new nlobjSearchFilter('internalid', null, 'is', emailViuId) ], [new nlobjSearchColumn('custrecord_veninvupld_po_number'), new nlobjSearchColumn('name')]);
	
	var recId = billRes[0].getId();
	var billRec = nlapiLoadRecord('customrecord_ven_inv_upload_form', recId);
		
	nlapiLogExecution('DEBUG', 'Vendor Invoice Found', recId);
	
	var billPo = billRec.getFieldValue('custrecord_veninvupld_po_number');
	var VIU = billRec.getFieldValue('name');
				
	nlapiLogExecution('DEBUG','PO', billPo);
	nlapiLogExecution('DEBUG','VIU', VIU);
			
	var POrecord = nlapiLoadRecord('purchaseorder', billPo);	
	var requestorEmail = nlapiLoadRecord( 'employee', POrecord.getFieldValue('custbody_mys_po_requester') );
	
	nlapiLogExecution('DEBUG', 'PO requester', POrecord.getFieldValue('custbody_mys_po_requester'));
	
	var requestorEmailId = requestorEmail.getFieldValue('email')
	
	nlapiLogExecution('DEBUG', 'requestorEmailId', requestorEmailId);

	nlapiLogExecution('DEBUG', 'Email check', emailFromAddress.toUpperCase() + ' : ' + requestorEmail.getFieldValue('email').toUpperCase() );
		
		//if(emailFromAddress.toUpperCase() == requestorEmail.getFieldValue('email').toUpperCase() ){
						
			// check if email body contains Approved
			var init = emailBody.indexOf('[');
			var fin = emailBody.indexOf(']');
			var emailBodyResult = emailBody.substr(init+1,fin-init-1)
			
			nlapiLogExecution('DEBUG', 'emailBodyResult: ' + emailBodyResult, '');
			
			var records = new Object();
			records['recordtype'] = 'customrecord_ven_inv_upload_form';
			records['record'] = recId;
			
			if( emailBodyResult == 'Approved'){
				nlapiLogExecution('DEBUG', 'Approving Vendor Bill', VIU);
					
				// set PS Approval Obtained to True	and send Approval confirmation
				billRec.setFieldValue('custrecord_ps_app_obt','T');				
				nlapiSendEmail(POrecord.getFieldValue('custbody_mys_po_requester'), 875568, emailSubject, emailBody, null, null, records, null);
				nlapiSubmitRecord(billRec);
			}
			
			else // check if email body contains Rejected
			if( emailBodyResult == 'Rejected'){
				nlapiLogExecution('DEBUG', 'Rejecting Vendor Bill', VIU);
					
				// Attach Rejection confirmation			
				nlapiSendEmail(POrecord.getFieldValue('custbody_mys_po_requester'), 875568, emailSubject, emailBody, null, null, records, null);
				nlapiSubmitRecord(billRec);
			}
			
		   // }
			
	    }	
			

