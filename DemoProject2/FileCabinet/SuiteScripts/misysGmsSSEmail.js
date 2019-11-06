/**
*@NApiVersion 2.x
*@NScriptType ScheduledScript
*/
define(['N/search', 'N/record', 'N/email', 'N/runtime', 'N/xml', 'N/file'],
	function(search, record, email, runtime, xml, file) {
		function execute(context) {			
			// check first if user triggered send email process
			var startProcEmail = _genericSearch('customrecord_msys_script_params', 'name', 'GMS_START_EMAIL');
			var IDs = runtime.getCurrentScript().getParameter("custscript_invoice_ids");
			log.debug('Entered Script', 'IDs:'+ IDs );
			
			var InvoiceIDs;
			
			/*var Temp = '';
			if( IDsArray.length > 0 )
			{
				for (var j = 0; j < IDsArray.length; j++)
				{
					if(Temp == '')
					{
						Temp = '"' + IDsArray[j] + '"';
					}
					else
					{
						Temp = Temp + ',"' + IDsArray[j] + '"';
					}
					
				}
			}
			log.debug('Entered Script', 'Temp:'+ Temp );*/

			if( startProcEmail[1] == '1')
			{
				var authorId = runtime.getCurrentScript().getParameter("custscript_gms_eml_sender");
				var errorRecipientEmail = runtime.getCurrentScript().getParameter("custscript_gms_eml_errmail");
				var subjectEmail = runtime.getCurrentScript().getParameter("custscript_gms_eml_subject");
				var bodyEmail = runtime.getCurrentScript().getParameter("custscript_gms_eml_body");
				
				// ---------------------- added by Shubhradeep ------------------------------------------------------
				var EmailCCid = [];
				var ccEmail = runtime.getCurrentScript().getParameter("custscript_gms_eml_copied");
				EmailCCid = [ccEmail];
				
				var EmpRecipientEmail = '';
				
				var EmployeeID = runtime.getCurrentScript().getParameter("custscript_employee_id");
				log.debug('Entered Script', 'EmployeeID:'+ EmployeeID );
				
				if(EmployeeID != null)
				{
					
					var fieldLookUp = search.lookupFields({
					    type: search.Type.EMPLOYEE,
					    id: EmployeeID,
					    columns: ['email']
					});
					
					EmpRecipientEmail = fieldLookUp.email;
					log.debug('Entered Script', 'EmpRecipientEmail:'+ EmpRecipientEmail );
				}
				
				// ---------------------- end - added by Shubhradeep ------------------------------------------------------

				log.debug('Entered Script', 'Author:'+ authorId + ', Subject:'+ subjectEmail);
				/*
				var pdfFileSearch = search.create({
					type: 'file',
					columns: [
						{ name: 'internalid' },
						{ name: 'name' }
					],
					filters: [{
						name: 'folder', operator: 'is', values: mainFolderId
					}]
				});
				*/				

				try 
				{

					var searchResults = search.load({ id: 'customsearch_gms_inv_eml_scr' }).run().getRange({ start: 0, end: 999 });
					log.debug('Records to process', searchResults.length );
					
		            var RecordsProcessed = 0;
					
					//check if no more results, if no more result then set parameter value to 0
					if( searchResults.length > 0 )
					{
						if(IDs != null)
						{
							InvoiceIDs = IDs.split(',');
							log.debug('Entered Script', 'InvoiceIDs:'+ InvoiceIDs.length);
							
							for (var i = 0; i < searchResults.length; i++) 
							{
								var invoiceNumber = searchResults[i].getValue('internalid');
								log.debug('Entered Script', 'invoiceNumber:'+ invoiceNumber);
								
								var Flag = 0;
								
								for(var k = 0;k < InvoiceIDs.length; k++)
								{
									var Temp = InvoiceIDs[k];
									log.debug('Entered Script', 'Temp:'+ Temp);
									if(Temp == invoiceNumber)
									{
										Flag = 1;
										break;
									}
								}
								log.debug('Entered Script', 'Flag:'+ Flag);
								
								if(Flag == 1)
								{
									var contactEmail = searchResults[i].getValue({ name: 'custentity_gms_email', join: 'customermain'});
									log.debug('Entered Script', 'contactEmail:'+ contactEmail);
									
									var currPdfId = searchResults[i].getValue('custbody_gms_inv_file');
									log.debug('Entered Script', 'currPdfId:'+ currPdfId);
									
									var invEntity = searchResults[i].getValue({ name: 'entity'});
									

									log.debug( 'Invoice ID: ' + invoiceNumber, 'Customer:' + invEntity + 'Email: ' + contactEmail + ', PDFid: ' + currPdfId );

									//if GMS Contact email is not blank, send email and mark PDF Doc Sent as TRUE
									if(contactEmail)
									{
										contactEmail = contactEmail + ',CMS.Billing@misys.com';
										log.debug('Entered Script', 'contactEmail:'+ contactEmail);
										
										try
										{
											log.debug('Attempting to send email.', '')	
											var fileObj = file.load({ id: currPdfId });
											email.send({
												author: authorId,
												recipients: contactEmail,
												cc: EmailCCid,
												subject: subjectEmail,
												body: bodyEmail,
												attachments: [fileObj],
												relatedRecords: {
													entityid: invEntity
												}
											});

											log.debug( 'Email Sent! Setting Flag', '');

											var invUpdateRec = record.submitFields({ type: record.Type.INVOICE, id: invoiceNumber, values: { custbody_pdf_sent: 'T' } });
											RecordsProcessed = RecordsProcessed + 1;
										}
										catch(ex)
										{
											_errorHandler("execute", ex);
										}
									}
									log.debug('Entered Script', 'RecordsProcessed:'+ RecordsProcessed);
									log.debug('Entered Script', '(searchResults.length)-1):'+ ((searchResults.length)-1));
									
									if(i == ((searchResults.length)-1))
									{
										log.debug( 'Inside Sending confirmation', '');
										var RecipientEmailSubject = 'Completion of Sending Invoices to Customers';
										
										var RecipientEmailBody = 'Total Number of Invoices sent to Customers is : ' + RecordsProcessed;
										log.debug('Entered Script', 'RecipientEmailBody:'+ RecipientEmailBody);
											
										email.send({
											author: authorId,
											recipients: EmpRecipientEmail,
											subject: RecipientEmailSubject,
											body: RecipientEmailBody
										});
									}
								}
								
							}
						}
						
					} 
					else 
					{
						var recId = record.submitFields({ type: 'customrecord_msys_script_params', id: startProcEmail[0], values: { custrecord_msys_paramval: '0' } });
					}

				} 
				catch (e) 
				{
					_errorHandler("execute", e);
					var subject = 'GMS PDF Invoice processing failed';
					
					email.send({
						author: authorId,
						recipients: errorRecipientEmail,
						subject: 'GMS Invoice PDF Email Error Notification',
						body: 'We encountered the following error while sending the GMS Invoice PDF Emails: ' +
						'\n\n' + JSON.stringify(e)
					});
				}
		
			}
		}

		function _genericSearch(table, fieldToSearch, valueToSearch){
			var resData=[];
			var internalID = null;
			var paramValueStr = null;

			try{
				var attSearch = search.create({
					type: table,
					columns: [
						{ name: 'internalid' },
						{ name: 'custrecord_msys_paramval' }
					],
					filters: [{
						name: fieldToSearch, operator: 'is', values: [valueToSearch]
					}]
				});

				var searchResults = attSearch.run().getRange({ start: 0, end: 100 });
				for (var i = 0; i < searchResults.length; i++) {
					internalID = searchResults[i].getValue({ name: 'internalid' });
					paramValueStr = searchResults[i].getValue({ name: 'custrecord_msys_paramval' });
				}

			}catch(e){
				_errorHandler("genericSearch", e);
			}     	
			resData = [ internalID, paramValueStr ];      
			return resData;
		}

		function _searchInvoice(gmsInvoiceNum){
			var internalID=0;

			try{
				var attSearch = search.create({
					type: search.Type.INVOICE,
					columns: [ 'internalid', 'tranid' ],
					filters: [
						[ 'mainline', 'is', 'F' ], 'and',
						[ 'memo', 'contains', gmsInvoiceNum ] 
					]
				});

				var searchResults = attSearch.run().getRange({ start: 0, end: 2 });
				for (var i = 0; i < searchResults.length; i++) {
					internalID = searchResults[i].getValue({ name: 'internalid' });
				}

			}catch(e){
				_errorHandler("searchInvoice", e);
			}     	      
			return internalID;
		}

		function _errorHandler(errorSource, e){
			var errorMessage='';
			log.error( 'unexpected error: ' + errorSource , e.message);
			return errorMessage;
		}

		return {
			execute: execute
		};
	}
);
