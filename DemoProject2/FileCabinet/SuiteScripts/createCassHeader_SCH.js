/**
 *@NApiVersion 2.x
 *@NScriptType ScheduledScript
 */
define(['N/search', 'N/record', 'N/email', 'N/runtime','N/file', 'N/error', 'N/log','N/format'],
    function(search, record, email, runtime,file,format) {
	var totalLines = 0;
	var failedLines = 0;
        function execute(context) {
          
            var CASSFileID = runtime.getCurrentScript().getParameter("custscript_cass_file_attachment");
            var CASSReceivedFrom = runtime.getCurrentScript().getParameter("custscript_cass_file_received_from");
            var CASSFileName = runtime.getCurrentScript().getParameter("custscript_cass_file_name");
            
            
            log.debug({
                details: 'CASS Staging Creation : CASSFileID :' + CASSFileID});
            log.debug({
                details: 'CASS Staging Creation : CASSReceivedFrom :' + CASSReceivedFrom});
            log.debug({
                details: 'CASS Staging Creation : CASSFileName :' + CASSFileName});
            
            
            try {
            	
            var cassHeaderID =createHeader(CASSFileID,CASSReceivedFrom,CASSFileName);
            
            createLog(cassHeaderID,'CASS File header created' );
            	
            var cassDetail = createDetails(cassHeaderID,CASSFileID,format);
            	
            	
            	   
            	   if(cassDetail == true)
            		   {
            		   
            		   var LobjRecord = record.load({
                   	    type: 'customrecord_cass_fileheader', 
                   	    id :cassHeaderID
            		   
            		   });
            		   
            		   LobjRecord.setValue({
                           fieldId: 'custrecord_casshdr_status',
                           value: '1',
            		   });
            		   
            		   var LHeaderrecordId = LobjRecord.save({
                           enableSourcing: false,
                           ignoreMandatoryFields: true
                       });
            		   
            		   log.debug({
                           details: 'CASS Staging Creation :Header Updated :' + LHeaderrecordId});
            		   
            			var message = 'Greetings from NetSuite Team !!!\n\n\n '
							+ 'Please note that the file received from Cass has been uploaded to NetSuite.Below are the details:\n\n'
							+ 'File Name : '  +CASSFileName +'\n'
							+ 'Number of lines Imported : '  +totalLines +'\n'
							+ 'Number of lines not Imported : '  +failedLines +'\n\n\n'
							'\n\n\nRegards \n Netsuite Team \n';
						var Receipent =getSettings("Receipent");
						
						log
						.debug({
							details : 'CASS Receipent :'
								+ Receipent
						});
						
						sendMail(cassHeaderID, 'CASS File Upload complete. FileName :'+ CASSFileName,Receipent,message);
            		   
            		   }
            	   else
            		   {
            		   
            		   var LobjRecord = record.load({
                      	    type: 'customrecord_cass_fileheader', 
                      	    id :cassHeaderID
               		   
               		   });
               		   
               		   LobjRecord.setValue({
                              fieldId: 'custrecord_casshdr_status',
                              value: '3',
               		   });
               		   
               		   var LHeaderrecordId = LobjRecord.save({
                              enableSourcing: false,
                              ignoreMandatoryFields: true
                          });
               		   
               		   log.debug({
                              details: 'CASS Staging Creation :Header Updated :' + LHeaderrecordId});
            		   
            		   }
                   	
            		   
                       
            	
            }
            catch (e) {
            	
            	log.debug({
            	    title: 'Debug Entry', 
            	    details: e.toString(),
            	    });
            	
            	 createLog(cassHeaderID,e.toString());
            	 
            	 var LobjRecord = record.load({
               	    type: 'customrecord_cass_fileheader', 
               	    id :cassHeaderID
        		   
        		   });
        		   
        		   LobjRecord.setValue({
                       fieldId: 'custrecord_casshdr_status',
                       value: '3',
        		   });
        		   
        		   var LHeaderrecordId = LobjRecord.save({
                       enableSourcing: false,
                       ignoreMandatoryFields: true
                   });
        		   
        		   log.debug({
                       details: 'CASS Staging Creation failed :'});
     		   
     		   
            	 
                var subject = 'Error';
                var authorId = -5;
                var recipientEmail = 'Gowthaman.r@misys.com';
                email.send({
                    author: authorId,
                    recipients: recipientEmail,
                    subject: subject,
                    body: 'Fatal error occurred in script: ' + runtime.getCurrentScript().id + '\n\n' + JSON.stringify(e)
                });
            }
        
}
        function createHeader(CASSFileID,CASSReceivedFrom,CASSFileName)
    	{    
        	
        	var objRecord = record.create({
        	    type: 'customrecord_cass_fileheader', 
        	    isDynamic: true,
        	   
        	});
        	
        	objRecord.setValue({
                fieldId: 'custrecord_casshdr_filereceivedfrom',
                value: CASSReceivedFrom,
        	});
        	objRecord.setValue({
                fieldId: 'custrecord_casshdr_file',
                value: CASSFileID,
        	});
        	objRecord.setValue({
                fieldId: 'custrecord_casshdr_filename',
                value: CASSFileName,
        	});
        
        	var HeaderrecordId = objRecord.save({
                enableSourcing: false,
                ignoreMandatoryFields: true
            });
        	
        	   log.debug({
                   details: 'CASS Staging Creation :HeaderCreated :' + HeaderrecordId});
        	   
        	 return HeaderrecordId;
    	}
        
        function createDetails(HeaderrecordId,CASSFileID)
        {
        	
        	
        	  var subRecord = record.create({
             	    type: 'customrecord_cass_filedetails', 
             	    isDynamic: true,
             	   
             	});
          	   subRecord.setValue({
                     fieldId: 'custrecord_cassdtl_headerid',
                     value: HeaderrecordId,
          	   });
          	   
          	  // Load the file and
               // process all the lines
                 var invoiceFile = file.load({
                     id: CASSFileID
                 });
                 var iterator = invoiceFile.lines.iterator();
                 
                 log.debug({
                     details: 'CASS Staging Creation :iterator :' + iterator.length});
               
             
          
               //Skip the first line (CSV header)
                 iterator.each(function () {return false;});
                 iterator.each(function (line)
                 {
                  // This function updates the total by
                  // adding the amount on each line to it
                     var lineValues = line.value.split(',');
                     var accountNumber = lineValues[0];
                     var InvoiceNumber = lineValues[1];
                     var InvoiceDate = changeDateFormate(lineValues[2],format);
                     var InvoiceDueDate = changeDateFormate(lineValues[3],format);
                     var APVendorNumber = lineValues[4];
                     var VendorName = lineValues[5];
                     var CassVendorID = lineValues[6];
                     var RemitToAddress1 = lineValues[7];
                     var RemitToAddress2 = lineValues[8];
                     var RemitToCity = lineValues[9];
                     var RemitToState = lineValues[10];
                     var RemitToZipCode = lineValues[11];
                     var CycleBeginDate =changeDateFormate( lineValues[12],format);
                     var CycleEndDate = changeDateFormate(lineValues[13],format);
                     var TotalDue_US = lineValues[14];
                     var CurrencyCodeForNextAmntField = lineValues[15];
                     var TotalDue_ForeignCurrency = lineValues[16];
                     var Ncontrol = lineValues[17];
                     var ApprovalID = lineValues[18];
                     var ApprovalDate = changeDateFormate(lineValues[19],format);
                     var GLCostAccount = lineValues[20];
                     var Level1Code = lineValues[21];
                     var Level1Desc = lineValues[22];
                     var Level2Code = lineValues[23];
                     var Level2Desc = lineValues[24];
                     var Level3Code = lineValues[25];
                     var Level3Desc = lineValues[26];
                     var Level4Code = lineValues[27];
                     var Level4Desc = lineValues[28];
                     var Level5Code = lineValues[29];
                     var Level5Desc = lineValues[30];
                     var Level6Code = lineValues[31];
                     var Level6Desc = lineValues[32];
                     var Level7Code = lineValues[33];
                     var Level7Desc = lineValues[34];
                     var ChargeAmountUS = lineValues[35];
                     var ChargeAmountForeign = lineValues[36];
                     var CostCenterDesc = lineValues[37];
                     
                     
                     
                     
                     log.debug({
                         details: 'CASS Staging Creation :Details accountNumber :' + accountNumber+ InvoiceNumber+ InvoiceDate+ InvoiceDueDate});
                                       
          	   
            subRecord.setValue({
                     fieldId: 'custrecord_cass_account_number',
                     value: accountNumber,
          	   });
          	 subRecord.setValue({
                 fieldId: 'custrecord_cass_invoice_number',
                 value: InvoiceNumber,
      	   });
           subRecord.setValue({
                 fieldId: 'custrecord_cass_invoice_date',
                 value: InvoiceDate,
      	   });
           	
          	 subRecord.setValue({
                 fieldId: 'custrecord_cass_inv_due_date',
                 value: InvoiceDueDate,
      	   });
          	 subRecord.setValue({
                 fieldId: 'custrecord_cass_ap_vendor_num',
                 value: APVendorNumber,
      	   });
          	 subRecord.setValue({
                 fieldId: 'custrecord_cass_vendor_name',
                 value: VendorName,
      	   });
          	 subRecord.setValue({
                 fieldId: 'custrecord_cass_vendor_id',
                 value: CassVendorID,
      	   });
          	 subRecord.setValue({
                 fieldId: 'custrecord_cass_remit_add_1',
                 value: RemitToAddress1,
      	   });
          	 subRecord.setValue({
                 fieldId: 'custrecord_cass_remit_add_2',
                 value: RemitToAddress2,
      	   });
          	subRecord.setValue({
                fieldId: 'custrecord_cass_remit_city',
                value: RemitToCity,
     	   });
          	 subRecord.setValue({
                 fieldId: 'custrecord_cass_remit_state',
                 value: RemitToState,
      	   });
          	 subRecord.setValue({
                 fieldId: 'custrecord_cass_remit_zipcode',
                 value: RemitToZipCode,
      	   });
          	 subRecord.setValue({
                 fieldId: 'custrecord_cass_cycle_begindate',
                 value: CycleBeginDate,
      	   });
          	 subRecord.setValue({
                 fieldId: 'custrecord_cass_cycle_enddate',
                 value: CycleEndDate,
      	   });
          	 subRecord.setValue({
                 fieldId: 'custrecord_cass_totalamountdue_usd',
                 value: TotalDue_US,
      	   });
          	 subRecord.setValue({
                 fieldId: 'custrecord_cass_curr_code_nxtamtfield',
                 value: CurrencyCodeForNextAmntField,
      	   });
          	 subRecord.setValue({
                 fieldId: 'custrecord_cass_totalamtdue_foreign_cy',
                 value: TotalDue_ForeignCurrency,
      	   });
          	 subRecord.setValue({
                 fieldId: 'custrecord_cass_internal_inv_id',
                 value: Ncontrol,
      	   });
          	 subRecord.setValue({
                 fieldId: 'custrecord_cass_approval_id',
                 value: ApprovalID,
      	   });
          	subRecord.setValue({
                 fieldId: 'custrecord_cass_approval_date',
                 value: ApprovalDate,
      	   });
          	 subRecord.setValue({
                 fieldId: 'custrecord_cass_gl_cost_account',
                 value: GLCostAccount,
      	   });
          	 subRecord.setValue({
                 fieldId: 'custrecord_cass_level_1_code',
                 value: Level1Code,
      	   });
          	 
          	 subRecord.setValue({
                 fieldId: 'custrecord_cass_level_1_desc',
                 value: Level1Desc,
      	   });
          	 
          	 subRecord.setValue({
                 fieldId: 'custrecord_cass_level_2_code',
                 value: Level2Code,
      	   });
          	 
          	 subRecord.setValue({
                 fieldId: 'custrecord_cass_level_2_desc',
                 value: Level2Desc,
      	   });
        	 subRecord.setValue({
                 fieldId: 'custrecord_cass_level_3_code',
                 value: Level3Code,
      	   });
        	 subRecord.setValue({
                 fieldId: 'custrecord_cass_level_3_desc',
                 value: Level3Desc,
      	   });
        	 subRecord.setValue({
                 fieldId: 'custrecord_cass_level_4_code',
                 value: Level4Code,
      	   });
        	 subRecord.setValue({
                 fieldId: 'custrecord_cass_level_4_desc',
                 value: Level4Desc,
      	   });
        	 subRecord.setValue({
                 fieldId: 'custrecord_cass_level_5_code',
                 value: Level5Code,
      	   });
        	 subRecord.setValue({
                 fieldId: 'custrecord_cass_level_5_desc',
                 value: Level5Desc,
      	   });
          	 
        	 subRecord.setValue({
                 fieldId: 'custrecord_cass_level_6_code',
                 value: Level6Code,
      	   });
        	 subRecord.setValue({
                 fieldId: 'custrecord_cass_level_6_desc',
                 value: Level6Desc,
      	   });
        	 subRecord.setValue({
                 fieldId: 'custrecord_cass_level_7_code',
                 value: Level7Code,
      	   });
        	 subRecord.setValue({
                 fieldId: 'custrecord_cass_level_7_desc',
                 value: Level7Desc,
      	   });
        	 subRecord.setValue({
                 fieldId: 'custrecord_cass_charge_amt_usd',
                 value: ChargeAmountUS,
      	   });subRecord.setValue({
               fieldId: 'custrecord_cass_charge_amt_foreign_cny',
               value: ChargeAmountForeign,
    	   });subRecord.setValue({
               fieldId: 'custrecord_cass_cost_center_desc',
               value: CostCenterDesc,
    	   });
          	   
          	   var SubrecordId = subRecord.save({
                     enableSourcing: false,
                     ignoreMandatoryFields: true
                 });
          	   log.debug({
                     details: 'CASS Staging Creation :Details Created :' + SubrecordId});
          	if(SubrecordId)  
          		{
          	 totalLines++;}
          	else
          		{
          		failedLines++
          		}
          	   
          	 return true;
                 })
                 
                 
                 return true;
                 
                 }
              //   return SubrecordId;
        
        function changeDateFormate(date1,format)
        {
        	if(date1.length == '7')
        		{
        		date1 = '0'+date1;
        		
        		log.debug({
                    details: 'CASS Staging Creation :date1 :' + date1});
        		}
        	
        	var mm = Number(date1.substring(0,2));
        	var dd = Number(date1.substring(2,4));
        	var yyyy = Number(date1.substring(4,8));
        	 log.debug({
                 details: 'CASS Staging Creation :date :' + dd+ '-' +mm+ '-'+ yyyy});
        	 var date = new Date(yyyy,mm - 1,dd);
        	
        	// date.setFullYear();
        	 
        	var datestring = dd +'/'+mm+'/'+yyyy;
        	/* var formattedDateString = format.format({
                 value: date,
                 type: format.Type.DATE
             });*/
        	 
        	/* var initialFormattedDateString = datestring;
             var parsedDateStringAsRawDateObject = format.parse({
                 value: initialFormattedDateString,
                 type: format.Type.DATE
             });
             var formattedDateString = format.format({
                 value: parsedDateStringAsRawDateObject,
                 type: format.Type.DATE
             });
*/          log.debug({
    details: 'CASS Staging Creation :date :' +date});
        	 
        	 return date;
        }
        
        function createLog(CASSHeaderID,LogMessage)
    	{    
        	
        	var objRecord = record.create({
        	    type: 'customrecord_cass_process_log', 
        	    isDynamic: true,
        	   
        	});
        	
        	objRecord.setValue({
                fieldId: 'custrecord_log_header_id',
                value: CASSHeaderID,
        	});
        	objRecord.setValue({
                fieldId: 'custrecordlog_description',
                value: LogMessage,
        	});
        
        	var LogrecordId = objRecord.save({
                enableSourcing: false,
                ignoreMandatoryFields: true
            });
        	
        	   log.debug({
                   details: 'CASS Staging Creation :LogrecordId :' + LogrecordId});
        	   
        	// return HeaderrecordId;
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

        

        return {
            execute: execute
        };
});