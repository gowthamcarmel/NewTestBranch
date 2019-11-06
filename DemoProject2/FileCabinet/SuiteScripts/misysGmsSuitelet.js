/**
*@NApiVersion 2.x
*@NScriptType Suitelet
*/
define(['N/search', 'N/ui/serverWidget', 'N/record', 'N/runtime','N/util','N/https', 'N/task', 'N/redirect'],
	function(search, serverWidget, record, runtime, util, https, task,  redirect) 
	{
		function onRequest(context) 
		{
			// check first if user triggered send email process
			var startProcEmail = _genericSearch('customrecord_msys_script_params', 'name', 'GMS_START_EMAIL');
			
			var FromDate = context.request.parameters.custscript_gms_invoice_from_date;
			log.debug('FromDate', FromDate);
			var ToDate = context.request.parameters.custscript_gms_invoice_to_date;
			log.debug('ToDate', ToDate);
			
			//var Temp = context.request.getParameter('custscript_gms_invoice_from_date');
			//log.debug('Temp', Temp);

			if (context.request.method === 'GET') 
			{
				var form = serverWidget.createForm({ title: 'GMS : Send Invoice PDF' });
				form.clientScriptModulePath = 'SuiteScripts/misysGmsSuitelet_CL.js';
				
				if( startProcEmail[1] == '1')
				{
					var inlineHTMLField = form.addField({ 
						id: 'inlinehtmlfield1', 
						type: serverWidget.FieldType.INLINEHTML,
						label: 'Label'
					});
					inlineHTMLField.defaultValue = '<div>Invoice E-Mails are currently being sent. Please wait for the process to complete before triggering the process again.</div>';
				}
				else
				{
					var LineCount = 0;
					
					form.addSubmitButton({ label: 'Begin Invoice Email Process' });
					
					
					
					var inlineHTMLField = form.addField({ 
						id: 'inlinehtmlfield1', 
						type: serverWidget.FieldType.INLINEHTML,
						label: 'Label'
					});
					inlineHTMLField.defaultValue = '<div>Please click on the button to start sending the invoice E-Mails.</div>';
					
					/*var InvoiceFromDate = form.addField({ 
						id: 'custpage_invoice_from_date', 
						type: serverWidget.FieldType.DATE,
						label: 'From Date'
					});
					if(_logValidation(FromDate))
					{
						InvoiceFromDate.defaultValue = FromDate;
					}
					
					var InvoiceToDate = form.addField({ 
						id: 'custpage_invoice_to_date', 
						type: serverWidget.FieldType.DATE,
						label: 'To Date'
					});
					if(_logValidation(ToDate))
					{
						InvoiceToDate.defaultValue = ToDate;
					}*/
					
					var ListCount = form.addField({ 
						id: 'custpage_list_count', 
						type: serverWidget.FieldType.INTEGER,
						label: 'Total Lines'
					});
					ListCount.updateDisplayType({
	                    displayType: serverWidget.FieldDisplayType.INLINE
	                });
					
					var SelectedLineCount = form.addField({ 
						id: 'custpage_selected_line_count', 
						type: serverWidget.FieldType.INTEGER,
						label: 'Total - Selected Lines'
					});
					SelectedLineCount.defaultValue = LineCount
					SelectedLineCount.updateDisplayType({
	                    displayType: serverWidget.FieldDisplayType.INLINE
	                });
					
					
					var InvoiceIDs = form.addField({ 
						id: 'custpage_invoice_ids', 
						type: serverWidget.FieldType.TEXTAREA,
						label: 'Invoice Ids'
					});
					InvoiceIDs.updateDisplayType({
	                    displayType: serverWidget.FieldDisplayType.HIDDEN
	                });
					
						
					var sublist = form.addSublist({
	                    id: 'custpage_machine',
	                    //type: serverWidget.SublistType.INLINEEDITOR,
	                    type: serverWidget.SublistType.LIST,
	                    label: 'Select Records'
	                });
					
					sublist.addMarkAllButtons();
					
	                sublist.addField({
	                    id: 'custpage_select',
	                    type: serverWidget.FieldType.CHECKBOX,
	                    label: 'Select'
	                });
	                
	                var Field1 = sublist.addField({
	                    id: 'custpage_customer',
	                    //type: serverWidget.FieldType.TEXT,
	                    type: serverWidget.FieldType.SELECT,
	                    label: 'Customer',
	                    source:'customer'
	                });
	                Field1.updateDisplayType({
	                    //displayType: serverWidget.FieldDisplayType.DISABLED
	                	displayType: serverWidget.FieldDisplayType.INLINE
	                });
	                
	                var Field5 = sublist.addField({
	                    id: 'custpage_date',
	                    type: serverWidget.FieldType.DATE,
	                    label: 'Date'
	                });
	                Field5.updateDisplayType({
	                    displayType: serverWidget.FieldDisplayType.DISABLED
	                });
	                
	                var Field2 = sublist.addField({
	                    id: 'custpage_records',
	                    //type: serverWidget.FieldType.TEXT,
	                    type: serverWidget.FieldType.SELECT,
	                    label: 'Invoice Number',
	                    source:'invoice'
	                });
	                Field2.updateDisplayType({
	                    //displayType: serverWidget.FieldDisplayType.DISABLED
	                	displayType: serverWidget.FieldDisplayType.INLINE
	                });
	                
	                var Field3 = sublist.addField({
	                    id: 'custpage_description',
	                    type: serverWidget.FieldType.TEXTAREA,
	                    label: 'Description'
	                });
	                Field3.updateDisplayType({
	                    displayType: serverWidget.FieldDisplayType.DISABLED
	                });
	                
	                var Field4 = sublist.addField({
	                    id: 'custpage_total',
	                    type: serverWidget.FieldType.CURRENCY,
	                    label: 'Total'
	                });
	                Field4.updateDisplayType({
	                    displayType: serverWidget.FieldDisplayType.DISABLED
	                });
	                
	                var searchResults = search.load({ id: 'customsearch_gms_inv_eml_scr' }).run().getRange({ start: 0, end: 200 });
					log.debug('Records to process', searchResults.length );
					
					/*var RecordSearch = search.load({
		                id: 'customsearch_gms_inv_eml_scr'
		            });
					
					//Add Filter to search
					var filter1 = search.createFilter({
						name: 'custbody_gms_inv_file',
						operator: 'isnotempty'
						});
					
					RecordSearch.filters.push(filter1);
					
		            var searchResults = RecordSearch.run().getRange({
		                start: 0,
		                end: 1000
		                });
		            
		            log.debug('Records to process', searchResults.length );*/
					
					var TotalNoOfLines = 0;
					var Flag = 0;
					
					if( searchResults.length > 0 )
					{
						for (var i = 0; i < searchResults.length; i++)
						{
							log.debug('i=', i);
							
							//var invoiceNumber = searchResults[i].getValue('tranid');
							var invoiceNumber = searchResults[i].getValue('internalid');
							log.debug('invoiceNumber', invoiceNumber);
							
							var pdfID = searchResults[i].getValue('custbody_gms_inv_file');
							log.debug('pdfID', pdfID);
							
							if(pdfID != '')
							{
								TotalNoOfLines++;
								
								//var invEntity = searchResults[i].getText('entity');
								var invEntity = searchResults[i].getValue('entity');
								log.debug('invEntity', invEntity);
								var invDate = searchResults[i].getValue('trandate');
								log.debug('invDate', invDate);
								var invDescription = searchResults[i].getValue('memo');
								log.debug('invDescription', invDescription);
								var invAmount = searchResults[i].getValue('amount');
								log.debug('invAmount', invAmount);
								
								try
								{
									if(Flag == 0)
									{
										sublist.setSublistValue({
										    id : 'custpage_customer',
										    line : i,
										    value : invEntity
										});
										
										sublist.setSublistValue({
										    id : 'custpage_date',
										    line : i,
										    value : invDate
										});
										
										sublist.setSublistValue({
										    id : 'custpage_records',
										    line : i,
										    value : invoiceNumber
										});
										
										sublist.setSublistValue({
										    id : 'custpage_description',
										    line : i,
										    value : invDescription
										});
										
										sublist.setSublistValue({
										    id : 'custpage_total',
										    line : i,
										    value : invAmount
										});
									}
									else
									{
										
									}
									
								}
								catch(excep)
								{
									Flag = 1;
									log.debug('in excep');
									
								}
								
								
							}
						}
						ListCount.defaultValue = TotalNoOfLines;
					}
					
				}
				
				/*var SearchAgain = form.addButton({
				    id : 'custpage_search',
				    label : 'Search Again',
				    functioName : "searchAgain()"
				});*/
				
				context.response.writePage(form);
			} 
			else 
			{
				var FromDate = context.request.parameters.custscript_gms_invoice_from_date;
				log.debug('FromDate', FromDate);
				var ToDate = context.request.parameters.custscript_gms_invoice_to_date;
				log.debug('ToDate', ToDate);
				
				if(_logValidation(FromDate) && _logValidation(ToDate))
				{
					 redirect.toSuitelet({
			    		    scriptId: 'customscript_gms_suitelet',
			    		    deploymentId: 'customdeploy_gms_suitelet',
			    		    isExternal : true,
			    		    parameters: {'custpage_invoice_from_date':FromDate, 'custpage_invoice_to_date':ToDate} 
			    		});
				}
				else
				{
					var form = serverWidget.createForm({ title: 'GMS : Send Invoice PDF' });
					
					var InvoiceIDs = context.request.parameters.custpage_invoice_ids;
					log.debug('InvoiceIDs', InvoiceIDs);
					var TotalSelectedCount = context.request.parameters.custpage_selected_line_count;
					log.debug('TotalSelectedCount', TotalSelectedCount);
					
					var inlineHTMLField = form.addField({ 
						id: 'inlinehtmlfield1', 
						type: serverWidget.FieldType.INLINEHTML,
						label: 'Label'
					});
					inlineHTMLField.defaultValue = '<div>E-Mail sending process has started successfully.</div>';
					
					var SelectedLineCount = form.addField({ 
						id: 'custpage_selected_line_count', 
						type: serverWidget.FieldType.INTEGER,
						label: 'Total - Selected Lines'
					});
					SelectedLineCount.defaultValue = TotalSelectedCount
					SelectedLineCount.updateDisplayType({
	                    displayType: serverWidget.FieldDisplayType.INLINE
	                });
					
					var EmployeeID = runtime.getCurrentUser().id;
					log.debug('EmployeeID:', EmployeeID);
					
					var scriptTask = task.create({taskType: task.TaskType.SCHEDULED_SCRIPT});
					log.debug('scriptTask', scriptTask);
					scriptTask.scriptId = 829;
					scriptTask.deploymentId = 'customdeploy_gms_snd_eml_man';
					scriptTask.params = {custscript_invoice_ids: InvoiceIDs, custscript_employee_id: EmployeeID};
					var scriptTaskId = scriptTask.submit();
					log.debug('scriptTaskId', scriptTaskId);
					
					var recId = record.submitFields({ type: 'customrecord_msys_script_params', id: startProcEmail[0], values: { custrecord_msys_paramval: '1' } });
					context.response.writePage(form);
				}
				
				
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
		
		function searchAgain(){

			 redirect.toSuitelet({
	    		    scriptId: 'customscript_gms_suitelet',
	    		    deploymentId: 'customdeploy_gms_suitelet',
	    		    isExternal : true,
	    		    parameters: {'custpage_invoice_from_date':FromDate, 'custpage_invoice_to_date':ToDate} 
	    		});
			 }



		function _genericSearch(table, fieldToSearch, valueToSearch)
		{
			var resData=[];
			var internalID = null;
			var paramValueStr = null;

			try
			{
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
				for (var i = 0; i < searchResults.length; i++) 
				{
					internalID = searchResults[i].getValue({ name: 'internalid' });
					paramValueStr = searchResults[i].getValue({ name: 'custrecord_msys_paramval' });
				}

			}
			catch(e)
			{
				_errorHandler("genericSearch", e);
			}     	
			resData = [ internalID, paramValueStr ];      
			return resData;
		}

		function _errorHandler(errorSource, e)
		{
			var errorMessage='';
			log.error( 'unexpected error: ' + errorSource , e.message);
		}

		return {
			onRequest: onRequest
		};
	}
);