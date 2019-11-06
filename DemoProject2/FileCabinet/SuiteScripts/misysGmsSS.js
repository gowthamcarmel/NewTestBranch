/**
*@NApiVersion 2.x
*@NScriptType ScheduledScript
*/
define(['N/search', 'N/record', 'N/email', 'N/runtime', 'N/xml', 'N/file'],
	function(search, record, email, runtime, xml, file) {
		function execute(context) {			
			var authorId = runtime.getCurrentScript().getParameter("custscript_gms_inv_sender");
			log.debug('authorId', authorId);
			var recipientEmail = runtime.getCurrentScript().getParameter("custscript_gms_inv_recipient");
			log.debug('recipientEmail', recipientEmail);

			try {

				var mainFolderId = runtime.getCurrentScript().getParameter("custscript_gms_main_folder");
				var processedFolderId = runtime.getCurrentScript().getParameter("custscript_gms_processed_folder");

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

				//var searchResults = pdfFileSearch.run().getRange({ start: 0, end: 200 });
				var searchResults = pdfFileSearch.run().getRange({ start: 0, end: 1000 });
				log.debug('reord count', searchResults.length);
				for (var i = 0; i < searchResults.length; i++) 
				{
					var pdfInternalID = searchResults[i].getValue({ name: 'internalid' });
					var pdfName = searchResults[i].getValue({ name: 'name' }).split('.');
					var gmsInvoiceNum = pdfName[0];

					var invoiceRecInternalId = _searchInvoice(gmsInvoiceNum);

					log.debug('Invoice Number: ' + pdfName + ', GMS Inv: ' + gmsInvoiceNum, 'File Internal Id: ' + pdfInternalID + ', Invoice InternalID: ' + invoiceRecInternalId);

					if( invoiceRecInternalId )
					{
						//var recId = record.submitFields({ type: record.Type.INVOICE, id: invoiceRecInternalId, values: { custbody_gms_inv_file: pdfInternalID, custbody_pdf_sent: 'F' } });
						var recId = record.submitFields({ type: record.Type.INVOICE, id: invoiceRecInternalId, values: { custbody_gms_inv_file: pdfInternalID} });
						
						if( recId )
						{
							var pdfFile = file.load({ id: pdfInternalID });	
							pdfFile.folder = processedFolderId;
							pdfFile.save();
							
							// to get the internal ID of the GMS master data and to set the PDF file to the record.
							
							try
							{
								var GMSMasterDataSearch = search.create({
									type: search.Type.INVOICE,
									columns: [
										{ name: 'internalid' },
										{ name: 'custbody_related_gms_record' }
									],
									filters: [{
										name: 'mainline',
								        operator: 'is',
								        values: ['T']
								    }, {
								        name: 'internalid',
								        operator: 'is',
								        values: invoiceRecInternalId
									}]
								});

								var Results = GMSMasterDataSearch.run().getRange({ start: 0, end: 1000 });
								log.debug('reord count', Results.length);
								
								var MasterID = Results[0].getValue({ name: 'custbody_related_gms_record' });
								log.debug('MasterID', MasterID);
								
								record.submitFields({ type: 'customrecord_gms_master_data', id: MasterID, values: {custrecord_gms_pdf_file: pdfInternalID} });
							}
							catch(ex)
							{
								_errorHandler("execute", ex);
							}
							
						}
					}
				}
				//sending email once the attachment of PDFs are completed
				var subject = 'GMS PDF Invoice processing completed';
				
				email.send({
					author: authorId,
					recipients: recipientEmail,
					subject: subject,
					body: 'The GMS Invoice PDF files has been attached to respective Invoices and GMS Master Data.'
				});
				

			} catch (e) {
				_errorHandler("execute", e);
				var subject = 'GMS PDF Invoice processing failed';
				
				email.send({
					author: authorId,
					recipients: recipientEmail,
					subject: subject,
					body: 'We encountered the following error while processing the GMS Invoice PDF files: ' +
					'\n\n' + JSON.stringify(e)
				});
			}
		}

		function _genericSearch(table, fieldToSearch, valueToSearch){
			var internalID=0;

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
				}

			}catch(e){
				_errorHandler("genericSearch", e);
			}     	      
			return internalID;
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
