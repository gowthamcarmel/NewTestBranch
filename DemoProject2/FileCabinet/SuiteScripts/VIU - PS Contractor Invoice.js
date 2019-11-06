// Function to send email to PO requester when PO cost centre is PS with PS contractor items
//Contains hardcorded Email plugin address.

// P2P - config Bundle - Changes in the script based on Advanced Procurement Module

function CheckPSContractorInvoice(type, form, request)
		{
		var billId = nlapiGetRecordId();
		var ProcCanc = nlapiGetFieldValue('custrecord_cancelled');
		var billPost = nlapiGetFieldValue('custrecord_veninvupld_bill_posted');
		var Legentmis = nlapiGetFieldValue('custrecord_veninvupld_entity_validation');
		var PONotinList = nlapiGetFieldValue('custrecord_veninvupld_po_notinlist');
		var NoPO = nlapiGetFieldValue('custrecord_veninvupld_no_po_ontheinvoice');
		var Curmat = nlapiGetFieldValue('custrecord_veninvupld_curr_validation');
		var vbdup = nlapiGetFieldValue('custrecord_veninvupld_bill_duplicate_chk');
		var expres = nlapiGetFieldValue('custrecord_veninvupld_exctn_resolution');
		var othnote = nlapiGetFieldValue('custrecord_process_note');
		

		
              try
              {		
		//Exit if Vendor Invoice was cancelled or Vendor bill was posted
			if (ProcCanc == 'T' || billPost == 'T' || Legentmis == 'T' || Curmat == 'F' || vbdup!= '' ||  expres!='' || othnote!= '' || PONotinList == 'T' || NoPO == 'T')
		 	  {return true;}
			
			 
				
		//Find PO CC
			else 
				{ if (billId!= 'NULL')
					
				var billRecord = nlapiLoadRecord('customrecord_ven_inv_upload_form', billId);
				var billPo = nlapiGetFieldValue('custrecord_veninvupld_po_number');
				
				nlapiLogExecution('Debug','VIU', billId);
							
				var POrecord = nlapiLoadRecord('purchaseorder', billPo);	
				var PODpt = POrecord.getFieldValue('department');
			
				var POCC = nlapiLoadRecord('department', PODpt);
				var POCCFunc = POCC.getFieldText('custrecord_misys_function_grouping');
				var POCCDpt = POCC.getFieldText('custrecord_mys_department_oa');
			
			
			// Validate PO items 
					if (POCCFunc == "Global Services" && POCCDpt == "Services")
					{ 
					var filter1 = new Array();
					var POid = POrecord.getFieldValue('tranid');
			
						
					filter1[0] = new nlobjSearchFilter('internalid', null, 'is', billPo);	
						try { 
						var searchResults1 = nlapiSearchRecord(null,'customsearch_ps_po_search', filter1, null); 
						var searchResult1 = searchResults1[0];
						var result1 = searchResult1.getAllColumns();

						var POmatchid = searchResult1.getValue(result1[0]); 
						}
					
						catch(e)
							  {
							  if ( e instanceof nlobjError )
							  nlapiLogExecution( 'DEBUG', 'system error', e.getCode() + '\n' + e.getDetails() );
							  else
							  nlapiLogExecution( 'DEBUG', 'unexpected error', e.toString() );
							  }
	  
					    if(POid != POmatchid)
						{billRecord.setFieldValue('custrecord_ps_contractor_invoice' , 'F');
						nlapiSubmitRecord(billRecord);
						return true;
						}
		
						else
							{
							//If PO with PS CC and PS contractor items
							billRecord.setFieldValue('custrecord_ps_contractor_invoice' , 'T');
			
							var filters = new Array();
							filters[0] = new nlobjSearchFilter('internalid', null, 'is', billId);	
							var searchResults = nlapiSearchRecord(null,'customsearch_viu_file_id', filters, null); // change the internal ID of your saved search

							var searchResult = searchResults[0];
							var result = searchResult.getAllColumns();

							var fileId = searchResult.getValue(result[3]); // depends on which position is File : Internal ID in your Search

										
							var attachments = new Array();
							attachments.push(nlapiLoadFile(fileId)); 
										
							//send Email
			 
							// ---------------- P2P - config Bundle ---------------------------- 
							var PurReqRequester = POrecord.getFieldValue('custbody_pr_owner');
							var PORequester = POrecord.getFieldValue('custbody_mys_po_requester');
							
							if(_logValidation(PurReqRequester))
							{
								PORequester = PurReqRequester;
							}
							// ---------------- End of P2P - config Bundle ---------------------------- 
							
							var VIUId = searchResult.getValue(result[0]);
			
							var email_subject = 'PS contractor Vendor Invoice pending approval: ' + VIUId + ' on PO: ' + POid;
							var email_body = 
							'<pre>' +
							'Hello, <p>' +
							'You have a PS contractor Vendor Invoice ' + VIUId + ' pending your approval in Netsuite. You are receiving this because you are the PO requester of ' + POid + '. <p>' +
							'The PDF invoice is attached. Please review the invoice and approve or reject by clicking on one of the 2 links below. ' +
							'This will create a new email, please DO NOT MODIFY IT, but add any note BELOW THE LINE at the bottom of the email. ' +
							'For expense invoices, please ensure that the Open Air Expense Report number is mentioned in the notes.'+
							'These notes will get attached to the invoice in Netsuite. <p>' +
							
							'If you reject the invoice, you can still approve it later using this email. ' +
							'If this invoice should be deleted and replaced by another invoice from the vendor, please send an email to Misys.AP@misys.com and PSOps.Support@misys.com.' +
							
														
							'<p>' +
							'Please click ' +
							'<a href="mailto:emails.3431250.745.7ee1a5ea97@emails.eu2.netsuite.com?cc=PSOps.Support@misys.com' +
							'&subject=' + billId + ' - PS contractor Vendor Invoice: ' + VIUId +' on PO: '+ POid + ' Approved' +
							'&body=PS contractor Vendor Invoice: ' + VIUId + ' on PO: '+ POid +' has been reviewed.%0DStatus:[Approved] %0D=================  ANY NOTE BELOW THIS LINE ==============">' +
							'Here to Approve</a>' + 
							' Please Click ' + '<a href="mailto:emails.3431250.745.7ee1a5ea97@emails.eu2.netsuite.com?cc=PSOps.Support@misys.com' +
							'&subject=' + billId + ' - PS contractor Vendor Invoice: ' + VIUId +' on PO: '+ POid + ' Rejected' +
							'&body=PS contractor Vendor Invoice: ' + VIUId + ' on PO: '+ POid +' has been reviewed.%0DStatus:[Rejected] %0D=================  ANY NOTE BELOW THIS LINE ==============">Here to Reject </a>' + 
							'<p>' + 
							'</pre>';
							
							var records = new Object();
							records['recordtype'] = 'customrecord_ven_inv_upload_form';
							records['record'] = billId;
							
							nlapiSendEmail(875568, PORequester, email_subject, email_body, null, null, records, attachments);
							
							nlapiLogExecution('Debug','email', 'email successful');
							
							billRecord.setFieldValue('custrecord_ps_contractor_invoice' , 'T');
							
							nlapiSubmitRecord(billRecord);
							}
					    }
					}
				
                               }

                                                 catch(error) 
						 { nlapiLogExecution('DEBUG', 'Error', error.toString()); }
							
			}



//---------------- P2P - config Bundle ---------------------------- 
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
//---------------- End of P2P - config Bundle ----------------------------