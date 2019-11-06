/**
 *@NApiVersion 2.x
 *@NScriptType ScheduledScript
 */
define(
		[ 'N/search', 'N/record', 'N/email', 'N/runtime' ,'N/format'],
		function(search, record, email, runtime, format) {
			var billCreated = 0;
		var billCount =0;
		var billNotCreated =0
		var billErrorDetails =[];
			var settings = null;
			var resultSet = null;
			var z=0;
			function execute(context) {

				//  var CASSHeaderID = runtime.getCurrentScript().getParameter('custscript_cass_header_id');

				var scriptObj = runtime.getCurrentScript();

				var CASSHeaderID = scriptObj.getParameter({
					name : 'custscript_cass_header_id'
				});
				var CASSAction = scriptObj.getParameter({
					name : 'custscript_cass_action'
				});
				var CASSEmpID = null;
				var userss = runtime.getCurrentUser();

				log.debug({
					title : 'user',
					details : userss.id
				});
				CASSEmpID = userss.id;
				createLog(CASSHeaderID,
				'CASS Bill Creation Started : CASSHeaderID :');

				log.debug({
					details : 'CASS Bill  Creation : CASSHeaderID :'
						+ CASSHeaderID
				});

				log.debug({
					details : 'CASS Bill  Creation : CASSEmpID :' + CASSEmpID
				});
				log.debug({
					details : 'CASS Bill  Creation : CASSAction :' + CASSAction
				});
				var flag = false;
				var objRecord = null;

				try {
					var filters = [];

					var filterHeaderId = search.createFilter({
						name : 'custrecord_cassdtl_headerid',
						operator : search.Operator.ANYOF,
						values : CASSHeaderID
					});
					filters.push(filterHeaderId);

					var s = search.create({
						type : 'customrecord_cass_filedetails',

						columns : [ {
							name : 'name'
						}, {
							name : 'custrecord_cass_account_number'
						}, {
							name : 'custrecord_cass_invoice_number'
						}, {
							name : 'custrecord_cass_invoice_date'
						},{
							name : 'custrecord_cass_inv_due_date'
						}, {
							name : 'custrecord_cass_ap_vendor_num'
						}, {
							name : 'custrecord_cass_vendor_name'
						}, {
							name : 'custrecord_cass_vendor_id'
						}, {
							name : 'custrecord_cass_remit_add_1'
						}, {
							name : 'custrecord_cass_remit_city'
						}, {
							name : 'custrecord_cass_remit_state'
						}, {
							name : 'custrecord_cass_remit_zipcode'
						}, {
							name : 'custrecord_cass_cycle_begindate'
						}, {
							name : 'custrecord_cass_cycle_enddate'
						}, {
							name : 'custrecord_cass_totalamountdue_usd'
						}, {
							name : 'custrecord_cass_curr_code_nxtamtfield'
						}, {
							name : 'custrecord_cass_totalamtdue_foreign_cy'
						}, {
							name : 'custrecord_cass_internal_inv_id'
						}, {
							name : 'custrecord_cass_approval_id'
						}, {
							name : 'custrecord_cass_approval_date'
						}, {
							name : 'custrecord_cass_gl_cost_account'
						}, {
							name : 'custrecord_cass_level_2_code'
						}, {
							name : 'custrecord_cass_level_3_code'
						}, {
							name : 'custrecord_cass_charge_amt_usd'
						}, {
							name : 'custrecord_cass_charge_amt_foreign_cny'
						} ],
						filters : filters
					});
					var results = s.run().getRange({
						start : 0,
						end : 1000
					});

					log.debug({
						title : 'Debug Entry',
						details : 'results.length :' + results.length,
					});

					if (results && results.length > 0) {

						if (CASSAction == 'processbills') {
							try {
								log.debug({
									title : 'Debug Entry',
									details : 'CASSAction: '+CASSAction,
								});

								var billscreated = createBill(results,
										CASSHeaderID, CASSEmpID,format);
								
								if(billscreated == true)
									{
								log.debug({
									title : 'Debug Entry',
									details : 'billCreated :' + billCreated,
								});
								createLog(CASSHeaderID,
										'Total CASS Bill created :billCreated : '
										+ billCreated);

								var LobjRecord = record.load({
									type : 'customrecord_cass_fileheader',
									id : CASSHeaderID

								});

								LobjRecord.setValue({
									fieldId : 'custrecord_casshdr_status',
									value : '2',
									
									
								});
								var processDate= getDateToday();
								LobjRecord.setValue({
									fieldId : 'custrecord_casshdr_fileprocessedon',
									value : processDate,
									
									
								});
								
								
								LobjRecord.setValue({
									fieldId : 'custrecord_processed_by',
									value : CASSEmpID,
									
									
								});
								
								
								
							//	custrecord_casshdr_fileprocessedon
								var message ;
								if(billNotCreated > 0 )
									{
								 message = 'Greetings from NetSuite Team !!! \n\n\n '
									+ 'This is to notify that the file received from Cass has been processed and below are the details.\n\n'
									+ 'CASS Internal ID: '  +CASSHeaderID +'\n'
									+ 'Number of Bills Created : '  +billCreated +'\n'
									+ 'Number of Bills Failed :  '  +billNotCreated +'\n'
									+ 'Error Details :'+billErrorDetails.toString()+'\n'
									+'\n\n\nRegards \n Netsuite Team \n\n\n';
									}
								else
									{
									message = 'Greetings from NetSuite Team !!! \n\n\n '
										+ 'This is to notify that the file received from Cass has been processed and below are the details.\n\n'
										+ 'CASS Internal ID: '  +CASSHeaderID +'\n'
										+ 'Number of Bills Created : '  +billCreated +'\n'
										+ 'Number of Bills Failed :  '  +billNotCreated +'\n'
										+'\n\n\nRegards \n Netsuite Team \n\n\n';
									}
								var Receipent =getSettings("Receipent");
								
								log
								.debug({
									details : 'CASS Receipent :'
										+ Receipent
								});
								
								sendMail(CASSHeaderID, 'CASS Bill Creation Complete',Receipent,message);

								var LHeaderrecordId = LobjRecord.save({
									enableSourcing : false,
									ignoreMandatoryFields : true
								});

								log
								.debug({
									details : 'CASS Staging Creation :Header Updated :'
										+ LHeaderrecordId
								});

								createLog(CASSHeaderID,
										'CASS Bill  Creation Completed : CASSHeaderID:'
										+ CASSHeaderID);
							}
								else{
									
									createLog(CASSHeaderID,
											'CASS Bill  Creation : Failure'
											);
									updateStatus(CASSHeaderID,'7') //validaition success
								
							}
								
							} catch (e) {
								createLog(CASSHeaderID,
										'CASS Bill  Create Error : CASSHeaderID :'
										+ e.toString());
								updateStatus(CASSHeaderID,'7')

								log
								.debug({
									title : 'Debug Entry',
									details : 'CASS Bill  Create Error : CASSHeaderID :'
										+ e.toString(),
								});

							}
						} else if (CASSAction == 'validate') {
							try {
								log.debug({
									title : 'Debug Entry',
									details : 'CASSAction: Validate',
								});

								createLog(CASSHeaderID,
										'CASS Bill  Validation :Started'
										+ CASSHeaderID);
								var isValidationSuccess = validate(results,
										CASSHeaderID, CASSEmpID);
								
								log.debug({
									title : 'Debug Entry',
									details : 'CASSAction: isValidationSuccess :' +isValidationSuccess,
								});
								
								if(isValidationSuccess == true)
									{
								updateStatus(CASSHeaderID,'5') //validaition success
								createLog(CASSHeaderID,
										'CASS Bill  Validation : Success'
										);
									}
								else
									{
									updateStatus(CASSHeaderID,'6') // validation failure
									
									createLog(CASSHeaderID,
											'CASS Bill  Validation : Failure'
											);
									
									
									}
								
								log.debug({
									title : 'Debug Entry',
									details : 'CASSAction: Validation Completed'
								});
								createLog(CASSHeaderID,
										'CASS Bill  Validation :Completed'
										);

							
							} catch (e) {

								createLog(CASSHeaderID,
										'CASS Bill  validate Error : CASSHeaderID :'
										+ e.toString());
								
								updateStatus(CASSHeaderID,'7')//bill creation failure

								log
								.debug({
									title : 'Debug Entry',
									details : 'CASS Bill  validate Error : CASSHeaderID :'
										+ e.toString(),
								});

							}

						} else {

							log.debug({
								title : 'Debug Entry',
								details : 'invalid parameters :',
							});
							createLog(CASSHeaderID,
									'CASS Bill  Creation : Invalid Parameters:'
									+ CASSHeaderID);
							
							updateStatus(CASSHeaderID,'7')//bill creation failure

						}

					}

				} catch (e) {

					createLog(CASSHeaderID,
							'CASS Bill  Creation Error : CASSHeaderID :'
							+ e.toString());

					log.debug({
						title : 'Debug Entry',
						details : e.toString(),
					});
					updateStatus(CASSHeaderID,'7')//bill creation failure

					/*  var subject = 'Error';
					  var authorId = -5;
					  var recipientEmail = 'Gowthaman.r@misys.com';
					  email.send({
					      author: authorId,
					      recipients: recipientEmail,
					      subject: subject,
					      body: 'Fatal error occurred in script: ' + runtime.getCurrentScript().id + '\n\n' + JSON.stringify(e)
					  });*/
				}
			}

			function createBill(results, CASSHeaderID, CASSEmpID,format) {
				
				try
				{
					
				
				var prevInvoice = null;
				var lastRecord = results.length - 1;
				var lastFlag = false;
				var Detailid = null;
				var invoiceNumber = null;
				var vendorName = null;
				var subsidary = null;
				var costCenter = null;
				var LcostCenter = null;
				var GLAccount = null;
				var AmountUSD = null;
				var accountNumber = null;
				var product = null;
				var location = null;
				var  invoiceDate = null;
				var invoiceDueDate = null;

				//	var settingsresult = getSettings();

				for (var i = 0; i < results.length; i++) {

					Detailid = results[i].getValue({
						name : 'name'
					});

					log.debug({
						details : 'CASS Bill  Creation : Detailid :' + i + ':'
						+ Detailid
					});

					accountNumber = results[i].getValue({
						name : 'custrecord_cass_account_number'
					});

					log.debug({
						details : 'CASS Bill  Creation : accountNumber :'
							+ accountNumber
					});

					invoiceNumber = results[i].getValue({
						name : 'custrecord_cass_invoice_number'
					});

					log.debug({
						details : 'CASS Bill  Creation : invoiceNumber :'
							+ invoiceNumber
					});
					
					
					 var invDate = results[i].getValue({
						name : 'custrecord_cass_invoice_date'
					});
					 
					 log.debug({
							details : 'CASS Bill  Creation : invDate :'
								+ invDate
						});

					 invoiceDate = getDateFormat(invDate,format);
					
					log.debug({
						details : 'CASS Bill  Creation : invoiceDate :'
							+ invoiceDate
					});
					
					invDueDate = results[i].getValue({
						name : 'custrecord_cass_inv_due_date'
					});

					log.debug({
						details : 'CASS Bill  Creation : invDueDate :'
							+ invDueDate
					});
					
					invoiceDueDate = getDateFormat(invDueDate,format);
					 
					 log.debug({
							details : 'CASS Bill  Creation : invDueDate :'
								+ invoiceDueDate
						});

					var vendor = results[i].getValue({
						name : 'custrecord_cass_ap_vendor_num'
					});

					vendorName = getVendorid(vendor);

					log.debug({
						details : 'CASS Bill  Creation : vendorName :'
							+ vendorName
					});
					var accGL = results[i].getValue({
						name : 'custrecord_cass_gl_cost_account'
					});
					
					log.debug({
						details : 'CASS Bill  Creation : accGL :'
							+ accGL
					});

					//GLAccount = getGLaccount(accGL);
					GLAccount ='1633';

					log.debug({
						details : 'CASS Bill  Creation : AccountGL :'
							+ GLAccount
					});
					var LCC = results[i].getValue({
						name : 'custrecord_cass_level_3_code'
					});

					log.debug({
						details : 'CASS Bill  Creation : LCC :'
							+ LCC
					});
					LcostCenter = getCostCenterId(LCC);
					log.debug({
						details : 'CASS Bill  Creation : LcostCenter :'
							+ LcostCenter
					});
					costCenter = getSettings("costcenter");

					location = getSettings("location")

					product = getSettings("product")

					log.debug({
						details : 'CASS Bill  Creation : costCenter :'
							+ costCenter
					});

					

					AmountUSD = results[i].getValue({
						name : 'custrecord_cass_charge_amt_foreign_cny'
					});

					log.debug({
						details : 'CASS Bill  Creation : AmountUSD :'
							+ AmountUSD
					});

					//first bill
					if (prevInvoice == null) {

						//create Vendor bill
						objRecord = record.create({
							type : record.Type.VENDOR_BILL,
							isDynamic : true,
							
						});

						log.debug({
							details : 'CASS Bill  Creation : objRecord :'
								+ objRecord
						});

						objRecord.setValue({
							fieldId : 'entity',
							value : vendorName,
						});
						objRecord.setValue({
							fieldId : 'externalid',
							value : invoiceNumber,
						});
						objRecord.setValue({
							fieldId : 'tranid',
							value : invoiceNumber,
						});
						objRecord.setValue({
							fieldId : 'trandate',
							value : invoiceDate,
						});
						objRecord.setValue({
							fieldId : 'duedate',
							value : invoiceDueDate,
						});
						
						objRecord.setValue({
							fieldId : 'custbody_cass_file_id',
							value : CASSHeaderID,
						});
						objRecord.setValue({
							fieldId : 'custbody_employee',
							value : CASSEmpID,
						});
						objRecord.setValue({
							fieldId : 'subsidiary',
							value : '263',
						});

						objRecord.setValue({
							fieldId : 'currency',
							value : '1',
						});
						objRecord.setValue({
							fieldId : 'department',
							value : costCenter,
						});
					

						objRecord.setValue({
							fieldId : 'class',
							value : product,
						});
						objRecord.setValue({
							fieldId : 'location',
							value : location,
						});
						objRecord.setValue({
							fieldId : 'custbody_just_for_purch',
							value : 'CASSTest',
						});
						objRecord.selectNewLine({
							sublistId : 'expense'
						});
						objRecord.setCurrentSublistValue({
							sublistId : 'expense',
							fieldId : 'account',
							value : GLAccount
						});
						objRecord.setCurrentSublistValue({
							sublistId : 'expense',
							fieldId : 'amount',
							value : AmountUSD
						});
						objRecord.setCurrentSublistValue({
							sublistId : 'expense',
							fieldId : 'location',
							value : location,
						});
						objRecord.setCurrentSublistValue({
							sublistId : 'expense',
							fieldId : 'department',
							value : LcostCenter,
						});
						objRecord.commitLine({
							sublistId : 'expense'
						});

						log
						.debug({
							details : 'CASS Bill  Creation : before save after sublist:'
						});

						prevInvoice = invoiceNumber;

						log
						.debug({
							details : 'CASS Bill  Creation : prevInvoice in first seg :'
								+ prevInvoice
						});

						/* //Save Vendor bill record
						 var billID = objRecord.save({
						     enableSourcing: false,
						     ignoreMandatoryFields: true
						 });

						 log.debug({
						     details: 'CASS Bill  Creation : billID :' + billID});*/

					}

					else if (prevInvoice != invoiceNumber) {

						try{
						//Save Vendor bill record
						var billID = objRecord.save({
							enableSourcing : false,
							ignoreMandatoryFields : false
						});
						log
						.debug({
							details : 'CASS Bill  Creation :new bill seg billID :'
								+ billID
						});
						
						

						createLog(CASSHeaderID,
								'CASS Bill created Internal ID : ' + billID);

						billCreated++;
						}catch(e)
						{
							log
							.debug({
								details : 'CASS Bill  Creation error invoice number :'
									+ prevInvoice
							});

							if (prevInvoice == 'null')
								{
								billErrorDetails.push(invoiceNumber +' : Duplicate Bill ');
								
								}
							else{
							billErrorDetails.push(prevInvoice +' : Duplicate Bill ');
							}
							log.debug({
								details : 'CASS bill save function Error  '+ e.toString()});
							log.debug({
								details : 'CASS bill save function Error  '+ e.name});
							
							
							
							createLog(CASSHeaderID,
									'CASS Bill  Creation error invoice number: ' + prevInvoice);
							billNotCreated++
							continue;
						}finally{

						//create Vendor bill
						objRecord = record.create({
							type : record.Type.VENDOR_BILL,
							isDynamic : true,
							 

						});

						log.debug({
							details : 'CASS Bill  Creation :new bill seg :'
						});

						objRecord.setValue({
							fieldId : 'entity',
							value : vendorName,
						});
						objRecord.setValue({
							fieldId : 'tranid',
							value : invoiceNumber,
						});
						objRecord.setValue({
							fieldId : 'trandate',
							value : invoiceDate,
						});
						objRecord.setValue({
							fieldId : 'duedate',
							value : invoiceDueDate,
						});
						
						objRecord.setValue({
							fieldId : 'externalid',
							value : invoiceNumber,
						});
						objRecord.setValue({
							fieldId : 'custbody_cass_file_id',
							value : CASSHeaderID,
						});
						objRecord.setValue({
							fieldId : 'custbody_employee',
							value : CASSEmpID,
						});
						objRecord.setValue({
							fieldId : 'subsidiary',
							value : '263',
						});
						objRecord.setValue({
							fieldId : 'currency',
							value : '1',
						});
						objRecord.setValue({
							fieldId : 'department',
							value : costCenter,
						});
						

						objRecord.setValue({
							fieldId : 'class',
							value : product,
						});
						objRecord.setValue({
							fieldId : 'location',
							value : location,
						});
						objRecord.setValue({
							fieldId : 'custbody_just_for_purch',
							value : 'CASSTest',
						});
						objRecord.selectNewLine({
							sublistId : 'expense'
						});
						objRecord.setCurrentSublistValue({
							sublistId : 'expense',
							fieldId : 'account',
							value : GLAccount
						});
						objRecord.setCurrentSublistValue({
							sublistId : 'expense',
							fieldId : 'amount',
							value : AmountUSD
						});
						objRecord.setCurrentSublistValue({
							sublistId : 'expense',
							fieldId : 'location',
							value : location,
						});
						objRecord.setCurrentSublistValue({
							sublistId : 'expense',
							fieldId : 'department',
							value : LcostCenter,
						});
						objRecord.commitLine({
							sublistId : 'expense'
						});

						prevInvoice = invoiceNumber;
						log
						.debug({
							details : 'CASS Bill  Creation : prevInvoice in second seg :'
								+ prevInvoice
						});
						}

					}
					//populate child
					else if (prevInvoice == invoiceNumber) {

						log.debug({
							details : 'CASS Bill  Creation : populate child :'
						});

						//sublist

						objRecord.selectNewLine({
							sublistId : 'expense'
						});
						objRecord.setCurrentSublistValue({
							sublistId : 'expense',
							fieldId : 'account',
							value : GLAccount
						});
						objRecord.setCurrentSublistValue({
							sublistId : 'expense',
							fieldId : 'amount',
							value : AmountUSD
						});
						objRecord.setCurrentSublistValue({
							sublistId : 'expense',
							fieldId : 'department',
							value : LcostCenter,
						});
						objRecord.setCurrentSublistValue({
							sublistId : 'expense',
							fieldId : 'location',
							value : location,
						});
						objRecord.commitLine({
							sublistId : 'expense'
						});

						log
						.debug({
							details : 'CASS Bill  Creation : before save after sublist:'
						});

						prevInvoice = invoiceNumber;
						log
						.debug({
							details : 'CASS Bill  Creation : prevInvoice in thrid seg :'
								+ prevInvoice
						});
					}

					if (lastRecord == i) {
						lastFlag = true;

					}

					if (lastFlag) {

						log
						.debug({
							details : 'CASS Bill  Creation : before sublist lastFlag :'
						});

						//sublist

						/*  	objRecord.selectNewLine({
						          sublistId: 'expense'
						      });
						  	objRecord.setCurrentSublistValue({
						          sublistId: 'expense',
						          fieldId: 'account',
						          value: '1633'
						      });
						  	objRecord.setCurrentSublistValue({
						         sublistId: 'expense',
						         fieldId: 'amount',
						         value: AmountUSD
						     });
						  	objRecord.setCurrentSublistValue({
						         sublistId: 'expense',
						         fieldId: 'location',
						         value: location,
						     });
						  	objRecord.setCurrentSublistValue({
						         sublistId: 'expense',
						         fieldId: 'department',
						         value: '231',
						     });
						  	objRecord.commitLine({
						         sublistId: 'expense'
						     });*/

						log
						.debug({
							details : 'CASS Bill  Creation : before save after sublist:'
						});

						try{
						//Save Vendor bill record
						var billID = objRecord.save({
							enableSourcing : false,
							ignoreMandatoryFields : false
						});

						createLog(CASSHeaderID,
								'CASS Bill created Internal ID : ' + billID);

						log.debug({
							details : 'CASS Bill  Created :billID :' + billID
						});
						billCreated++;}
					catch(e)
						{
							log
							.debug({
								details : 'CASS Bill  Creation error invoice number :'
									+ invoiceNumber
							});
							
							billErrorDetails.push(invoiceNumber +' : Duplicate Bill ');

							createLog(CASSHeaderID,
									'CASS Bill  Creation error invoice number: ' + invoiceNumber);
							billNotCreated++
							continue;
						}

					}

				}

				return true;

			}catch(e)
			{
				log
				.debug({
					details : 'CASS Bill  Creation error invoice number :'
						+ prevInvoice
				});

				createLog(CASSHeaderID,
						'CASS Bill  Creation error invoice number: ' + invoiceNumber);
				billNotCreated++
				return false;
				
			}
			
				}

			//Log record creation
			function createLog(CASSHeaderID, LogMessage) {

				var objRecord = record.create({
					type : 'customrecord_cass_process_log',
					isDynamic : true,

				});

				objRecord.setValue({
					fieldId : 'custrecord_log_header_id',
					value : CASSHeaderID,
				});
				objRecord.setValue({
					fieldId : 'custrecordlog_description',
					value : LogMessage,
				});

				var LogrecordId = objRecord.save({
					enableSourcing : false,
					ignoreMandatoryFields : true
				});

				
			}
			//Validate function
			function validate(results, CASSHeaderID, CASSEmpID) 
			{
				try
				{
					
					log.debug({
						details : 'CASS Bill  validate functionn : Started :'
							
							
							
					});
					
					var FileDetailsid = [];
					var vendid = true;
					var CCid = true;
					var GLid = true;
					
					log.debug({
						details : 'CASS Bill  Creation : results.length :'
							+ results.length
							
							
					});
					
					for (var i = 0; i < results.length; i++) {
					var vendor = results[i].getValue({
						name : 'custrecord_cass_ap_vendor_num'
					});
					var CC = results[i].getValue({
						name : 'custrecord_cass_level_3_code'
					});
					var GL = results[i].getValue({
						name : 'custrecord_cass_gl_cost_account'
					});
					var id = results[i].getValue({
						name : 'name'
					});

					vendid = getVendorid(vendor);
					

					log.debug({
						details : 'CASS Bill  Creation : vendid :'
							+ vendid						
							
					});
					
					log.debug({
						details : 'CASS Bill  Creation : id :'
							+ id		
							
						
							
					});
					
					CCid = getCostCenterId(CC);
					
					log.debug({
						details : 'CASS Bill  Creation : Cost Center id :'
							+ CCid						
							
					});
					
					/*GLid = getGLaccount(GL);
					
					log.debug({
						details : 'CASS Bill  Creation : GL Account id :'
							+ GLid						
							
					});*/
					
					if(vendid == false )
						{
						FileDetailsid.push(id +' : Vendor not exists ')
						vendid = true;
						}
					if(CCid == false)
						{	
						FileDetailsid.push(id +' : Cost Center inactive/not exists ')
						CCid = true;
						
						}
					if(GLid == false)
					{	
					FileDetailsid.push(id +' : GL Account inactive/not exists ')
					GLid = true;
					
					}
					
					}
					if(FileDetailsid && FileDetailsid.length > 0)
					{
						createLog(CASSHeaderID,
								'CASS Bill Validation Failure Details : '
								+ FileDetailsid.toString());

						log.debug({
							details : 'CASS Bill Validation Failure Details : : FileDetailsid :'
								+ FileDetailsid.toString()
						});
						log.debug({
							details : 'CASS Bill  Creation return false  '});
						var message = '\nGreetings from NetSuite Team !!!'
						+ '\n\n\nThis is to notify that the file received from Cass has been processed and validation failed.\n\n'
						+ 'CASS Internal ID:'  +CASSHeaderID +'\n'
						+'Failure Details :'+ FileDetailsid.toString()
						+'\n\n\nRegards \n Netsuite Team \n\n\n';
							
						
						var Receipent =getSettings("Receipent");
						
						log
						.debug({
							details : 'CASS Receipent :'
								+ Receipent
						});
						sendMail(CASSHeaderID, 'Cass Validation Failure',Receipent,message);
						return false;
					}
					else
					{
						log.debug({
							details : 'CASS Bill  Creation return true '});
						

						return true;
					}
				}
				catch(e)
				{
					log.debug({
						details : 'CASS Bill  Creation catch  '+ e.toString()});
					
					createLog(CASSHeaderID,
							'CASS Bill  validate function Error : CASSHeaderID :'
							+ e.toString());
					return false;
				}
				
				
				

			}

			function getGLaccount(glaccount) {
				
				try{
					log.debug({
						details : 'CASS Bill get Account id glaccount: : :'
							+ glaccount});
							
				var accList = search.create({
					type : 'account',

					columns : [ {
						name : 'internalid'
					} ],
					filters : [ {
						name : 'acctnumber',
						operator : 'is',
						values : 341020
					}]

				});
				/*, {
						name : 'isinactive',
						operator : 'is',
						values : 'F'
					}*/ 

			var	accountL = accList.run().getRange({
					start : 0,
					end : 5
				});

				if (accountL && accountL.length > 0) {

					var accountid = accountL[0].getValue({
						name : 'internalid'
					});
					
					log.debug({
						details : 'CASS Bill get Account id : : :'
							+ accountid});
							

					return accountid;
				} else
					{
					log.debug({
						details : 'CASS Bill get accountid : : return null :'
							});
					return false;
					}
				}
				catch(e)
				{
					log.debug({
						details : 'CASS accountid id catch  '+ e.toString()});
					
					createLog(CASSHeaderID,
							'CASS Bill  validate GL account Error  :'
							+ e.toString());
					return false;
				}
			}

			function getSettings(request) {
				var p = null;
				var c = null;
				var l = null;
				var r = null;
				settings = search.create({
					type : 'customrecord_cass_settings',

					columns : [ {
						name : 'custrecord_cass_auto_posting'
					}, {
						name : 'custrecord_process_log_recipients'
					}, {
						name : 'custrecord_cass_header_costcentre'
					}, {
						name : 'custrecord_cass_region'
					}, {
						name : 'custrecord_cass_product'
					} ],
					filters : [ {
						name : 'internalid',
						operator : 'is',
						values : 1
					} ]

				});

				resultSet = settings.run().getRange({
					start : 0,
					end : 5
				});
				if (request == "product") {
					p = resultSet[0].getValue({
						name : 'custrecord_cass_product'
					});

					return p;
				} else if (request == "costcenter") {
					c = resultSet[0].getValue({
						name : 'custrecord_cass_header_costcentre'
					});
					return c;
				}
				else if (request == "Receipent") {
					r = resultSet[0].getValue({
						name : 'custrecord_process_log_recipients'
					});
					return r;
				}
				else {
					l = resultSet[0].getValue({
						name : 'custrecord_cass_region'
					});

					return l;

				}
			}

			//get vendor id
			function getVendorid(request) {
				
				try{
				var vendorList = search.create({
					type : 'vendor',

					columns : [ {
						name : 'internalid'
					} ],
					filters : [ {
						name : 'entityid',
						operator : 'is',
						values : request
					}, {
						name : 'isinactive',
						operator : 'is',
						values : 'F'
					} ]

				});

			var	vendorL = vendorList.run().getRange({
					start : 0,
					end : 5
				});

				if (vendorL && vendorL.length > 0) {

					var vendorid = vendorL[0].getValue({
						name : 'internalid'
					});
					
					log.debug({
						details : 'CASS Bill get vendorid : : vendorid :'
							+ vendorid});
							

					return vendorid;
				} else
					{
					log.debug({
						details : 'CASS Bill get vendorid : : return null :'
							});
					return false;
					}
				}
				catch(e)
				{
					log.debug({
						details : 'CASS getvendor id catch  '+ e.toString()});
					
					createLog(CASSHeaderID,
							'CASS Bill  validate function Error : CASSHeaderID :'
							+ e.toString());
					return false;
				}
			}
			
			function getDateToday()
			{
				var today = new Date();
				var dd = today.getDate();
				var mm = today.getMonth(); 
				var yyyy = today.getFullYear();
				
			var	t = new Date(yyyy,mm,dd);
				return t;
			}
			
			function getDateFormat(d,format)
			{
				
				log.debug({
					details : 'CASS Bill get getDateFormat  :'
						+ d});
				
				 var parsedDateStringAsRawDateObject = format.parse({
		                value: d,
		                type: format.Type.DATE
		            });
				 
				 log.debug({
						details : 'CASS Bill get parsedDateStringAsRawDateObject  :'
							+ parsedDateStringAsRawDateObject});
				 return parsedDateStringAsRawDateObject;
				
			/*	var dd = Number(d.substring(0,2));
	        	var mm = Number(d.substring(2,4));
	        	var yyyy = Number(d.substring(4,8));
	        	 log.debug({
	                 details: 'CASS Staging Creation :date :' + dd+ '-' +mm+ '-'+ yyyy});
				
			var	t = new date(yyyy,mm,dd);
				return t;*/
			}
			
			function getCostCenterId(request)
			{
				

				
				try{
				var costCenterList = search.create({
					type : 'department',

					columns : [ {
						name : 'internalid'
					} ],
					filters : [ {
						name : 'name',
						operator : 'contains',
						values : request
					}, {
						name : 'isinactive',
						operator : 'is',
						values : 'F'
					} ]

				});

			var	CCL = costCenterList.run().getRange({
					start : 0,
					end : 5
				});

				if (CCL && CCL.length > 0) {

					var costCenterId = CCL[0].getValue({
						name : 'internalid'
					});
					
					log.debug({
						details : 'CASS Bill get CCL : :costCenterId :'
							+ costCenterId});
							

					return costCenterId;
				} else
					{
					log.debug({
						details : 'CASS Bill get costCenterId : : return null :'
							});
					return false;
					}
				}
				catch(e)
				{
					log.debug({
						details : 'CASS costCenterId id catch  '+ e.toString()});
					
					createLog(CASSHeaderID,
							'CASS Bill  validate function Error : Cost Center :'
							+ e.toString());
					return false;
				}
			
					
			}
			

			function updateStatus(CASSHeaderID, statusid) {
				var LobjRecord = record.load({
					type : 'customrecord_cass_fileheader',
					id : CASSHeaderID

				});

				LobjRecord.setValue({
					fieldId : 'custrecord_casshdr_status',
					value : statusid,
				});

				var LHeaderrecordId = LobjRecord.save({
					enableSourcing : false,
					ignoreMandatoryFields : true
				});
			}
			

			function sendMail(CASSHeaderID, Emailtype,Receipent,Message) {
				try
				{ 
					log.debug({
					details : 'CASS Email function  CASSHeaderID :'+ CASSHeaderID +',Emailtype :'+Emailtype+',Receipent :'+Receipent.toString()+',Message :'+Message});
					
					var senderId = '34524';
					var recipientEmail = Receipent;
					var timeStamp = new Date().getUTCMilliseconds();
										
					email.send({
					    author: senderId,
					    recipients: recipientEmail,
					    subject: Emailtype,
					    body: Message,
					    relatedRecords: {
					                 customRecord:{
					                  id:CASSHeaderID,
					                  recordType: 'customrecord_cass_fileheader' //an integer value
					                  }
					      }
					});
					
					log.debug({
						details : 'CASS Email function Completed  '});
				}
				catch(e)
				{
					log.debug({
						details : 'CASS Email function Error  '+ e.toString()});
					
					createLog(CASSHeaderID,
							'CASS Email function Error  :'
							+ e.toString());
					
				}
			}
			return {
				execute : execute
			};
		});