/**
 * Module Description
 * 
 * Version    Date            Author           Remarks
 * 1.00       28 Jul 2017     gowthamr
 *
 */

/**
 * @param {String} type Context Types: scheduled, ondemand, userinterface, aborted, skipped
 * @returns {Void}
 */
function scheduled(type) 
{

	var contextObj = nlapiGetContext();
	var usageBegin = contextObj.getRemainingUsage();
	nlapiLogExecution('DEBUG', 'GMS Invoices Scheduled', 'usageBegin ==' + usageBegin);
	
	var fileId = contextObj.getSetting('SCRIPT','custscript_zttblar_file_id');
	nlapiLogExecution('DEBUG', 'GMS Invoices Scheduled', 'fileId ==' + fileId);
	
	var EmployeeID = contextObj.getSetting('SCRIPT','custscript_gms_employee');
	nlapiLogExecution('DEBUG', 'GMS Invoices Scheduled', 'EmployeeID ==' + EmployeeID);
	
	var AuthorID = contextObj.getSetting('SCRIPT','custscript_gms_author_id');
	nlapiLogExecution('DEBUG', 'GMS Invoices Scheduled', 'AuthorID ==' + AuthorID);
	
	var EmailBody = contextObj.getSetting('SCRIPT','custscript_gms_email_body');
	nlapiLogExecution('DEBUG', 'GMS Invoices Scheduled', 'EmailBody ==' + EmailBody);
	
	var EmailSubject = contextObj.getSetting('SCRIPT','custscript_gms_email_subject');
	nlapiLogExecution('DEBUG', 'GMS Invoices Scheduled', 'EmailSubject ==' +  EmailSubject);
	
	var LastInvoiceID = contextObj.getSetting('SCRIPT','custscript_last_invoice_id');
	nlapiLogExecution('DEBUG', 'GMS Invoices Scheduled', 'LastInvoiceID ==' +  LastInvoiceID);
		
	log('fileId :'+fileId);
	
	try
	{
		//Loading the File
		var fileObj = nlapiLoadFile(fileId);
		
		var fileName = fileObj.getName();
		log('fileName :'+fileName);
		
		var records = GetFileContents(fileObj);
		nlapiLogExecution('DEBUG', 'Search Results', 'records==== :' + records);
		
		if(records == 1)
		{
			nlapiDeleteFile(fileId);
			nlapiLogExecution('DEBUG', 'Search Results', 'File has been deleted==== :');
			
			var EmpRec = nlapiLoadRecord('employee', EmployeeID);
			var ReceipientEmail = EmpRec.getFieldValue('email');
			nlapiLogExecution('DEBUG', 'GMS Invoices Scheduled', 'ReceipientEmail ==' + ReceipientEmail);
			
			var Subject = 'Incorrect Uploaded File';
			var Body = 'This file is in incorrect format. Please check the format and upload in the same format which has been recommended.';
			
			nlapiSendEmail(AuthorID, ReceipientEmail, Subject,Body , null, null, null);
		}
		else
		{
			nlapiLogExecution('DEBUG', 'Search Results', 'record.length :' + records.length);
			
			var tranID = '';
			var split = records.toString().split('#$');
			nlapiLogExecution('DEBUG', 'Search Project', 'split :' + split);
			nlapiLogExecution('DEBUG', 'Search Project', 'split Length :' + split.length);
			
			var Match = 0;
			var RecordsCount = 0;
			var ErrorMessage = 'Details';
			var cal_Usage = 50; 
			nlapiLogExecution('DEBUG', 'Search Results', 'cal_Usage- :' + cal_Usage);
			
			if (_logValidation(split))
			{
				for (var i=0; i<split.length; i++)
				{
					//current remaining usage
					var remainingUsage = contextObj.getRemainingUsage();
					nlapiLogExecution('DEBUG', 'Search Results', 'remainingUsage-:' + remainingUsage);
					
					nlapiLogExecution('DEBUG', 'Search Project', 'split[0]:' + split[0]);
					
					var splitArray = split[i].toString().split(',');
					nlapiLogExecution('DEBUG', 'Search Project', 'splitArray:' + splitArray);
					
					nlapiLogExecution('DEBUG', 'Search Project', 'splitArray[0]:' + splitArray[0]);
					
					var InvoiceNumber = splitArray[9];
					nlapiLogExecution('DEBUG', 'Search Project', 'InvoiceNumber:' + InvoiceNumber);
					
					if(_logValidation(LastInvoiceID))
					{
						if(LastInvoiceID == InvoiceNumber)
						{
							Match = 1;
						}
						else
						{
							if(Match == 1)
							{
								if (remainingUsage > cal_Usage)
								{
									try
									{
										var RecValidation = findRecord(InvoiceNumber);
										nlapiLogExecution('DEBUG', 'Search Project', 'RecValidation:' + RecValidation);
										
										if(RecValidation == 0)
										{
											var USCustomerID = splitArray[3];
											nlapiLogExecution('DEBUG', 'Search Project', 'USCustomerID:' + USCustomerID);
											
											var BICcode = splitArray[4];
											nlapiLogExecution('DEBUG', 'Search Project', 'BICcode:' + BICcode);
											
											//var CustomerInternalID = getCustomerID(USCustomerID,BICcode); // Change as per Srujan's Email
											var CustomerInternalID = getCustomerID(BICcode);
											//var CustomerInternalID = getCustomerID(USCustomerID);
											nlapiLogExecution('DEBUG', 'Search Project', 'CustomerInternalID:' + CustomerInternalID);
											
											var TaxRate = splitArray[6];
											nlapiLogExecution('DEBUG', 'Search Project', 'TaxRate:' + TaxRate);
											
											var TaxCodeID = getTaxCodeID(TaxRate);
											nlapiLogExecution('DEBUG', 'Search Project', 'TaxCodeID:' + TaxCodeID);
											
											var InvoiceDate = splitArray[10];
											nlapiLogExecution('DEBUG', 'Search Project', 'InvoiceDate:' + InvoiceDate);
											
											var ItemDescription = splitArray[9] + ' | ' + InvoiceDate + ' | ' + USCustomerID;
											nlapiLogExecution('DEBUG', 'Search Project', 'ItemDescription:' + ItemDescription);
											
											var Currency = getCurrencyID(splitArray[13]);
											nlapiLogExecution('DEBUG', 'Search Project', 'Currency:' + Currency);
											
											var CustPayTerms = '';
											
											var GMSRec = nlapiCreateRecord('customrecord_gms_master_data');
											
											if(_logValidation(splitArray[11]))
											{
												CustPayTerms = getPaymentTermsID(splitArray[11]);
												nlapiLogExecution('DEBUG', 'Search Project', 'CustPayTerms:' + CustPayTerms);
												
												if(_logValidation(CustPayTerms))
												{
													GMSRec.setFieldValue('custrecord_payment_terms', CustPayTerms);
												}
												else
												{
													GMSRec.setFieldValue('custrecord_payment_terms', '4');
													ErrorMessage = ErrorMessage + '\nPayment Terms Issue.';// is not present in NetSuite. Hence, adding due on receipt';
												}
											}
											else
											{
												GMSRec.setFieldValue('custrecord_payment_terms', '4');
											}
											
											GMSRec.setFieldValue('custrecord_gms_customer', splitArray[2]);
											
											if(_logValidation(CustomerInternalID))
											{
												GMSRec.setFieldValue('custrecord_gms_customer_ns', CustomerInternalID);
											}
											else
											{
												ErrorMessage = ErrorMessage + '\nCustomer BIC code Issue.';//is not present in NetSuite. Please add the correct NS Customer to Master Data.';
											}
											
											GMSRec.setFieldValue('custrecord_gms_item_description', ItemDescription);
											
											if(_logValidation(Currency))
											{
												GMSRec.setFieldValue('custrecord_gms_invoice_currency', Currency);
											}
											else
											{
												ErrorMessage = ErrorMessage + '\nCurrency Issue.';//is not present in NetSuite. Please add the correct currency to Master Data';
											}
											
											GMSRec.setFieldValue('custrecord_gms_item_taxrate', TaxRate);
											
											if(_logValidation(TaxCodeID))
											{
												GMSRec.setFieldValue('custrecord_gms_item_taxcode', TaxCodeID);
											}
											else
											{
												ErrorMessage = ErrorMessage + '\nTax Percent Issue.';//is not present in NetSuite. Please add the correct Tax Code to Master Data';
											}
											
											if(_logValidation(InvoiceDate))
											{
												try
												{
													GMSRec.setFieldValue('custrecord_gms_invoice_date', InvoiceDate);
												}
												catch(e)
												{
													 nlapiLogExecution('DEBUG', 'Try Catch', 'e=' + e);
													 nlapiLogExecution('DEBUG', 'Try Catch', 'e=' + e.code);
													 
													 var q = InvoiceDate.split("/");
													 nlapiLogExecution('DEBUG', 'Search Project', 'q:' + q);
													 
													 var NewDate = new Date(q[2],(q[0]-1),q[1]);
													 nlapiLogExecution('DEBUG', 'Search Project', 'NewDate:' + NewDate);
													 
													 var DateToSet = nlapiDateToString(NewDate);
													 nlapiLogExecution('DEBUG', 'Search Project', 'DateToSet:' + DateToSet);
													 
													 try
													 {
														 GMSRec.setFieldValue('custrecord_gms_invoice_date', DateToSet);
													 }
													 catch(excep)
													 {
														 nlapiLogExecution('DEBUG', 'Try Catch', 'excep=' + excep);
														 nlapiLogExecution('DEBUG', 'Try Catch', 'excep=' + excep.code);
														 GMSRec.setFieldValue('custrecord_gms_invoice_date', '');
														 ErrorMessage = ErrorMessage + '\nDate format Issue.';//does not match with NetSuite format. Please enter a correct format';
													 }
													 
												}
											}
											
											GMSRec.setFieldValue('custrecord_gms_item_rate', splitArray[5]);
											GMSRec.setFieldValue('custrecord_gms_item_tax_amount', splitArray[7]);
											GMSRec.setFieldValue('custrecord_gms_item_amount', splitArray[8]);
											GMSRec.setFieldValue('custrecord_gms_invoice_number', InvoiceNumber);
											GMSRec.setFieldValue('custrecord_gms_terms', splitArray[11]);
											//GMSRec.setFieldValue('custrecord_gms_exception', splitArray[14]);
											
											if(splitArray[14] == 'T')
											{
												GMSRec.setFieldValue('custrecord_to_be_processed', 'T');
											}
											else if(splitArray[14] == 'F')
											{
												GMSRec.setFieldValue('custrecord_to_be_processed', 'F');
											}
											else
											{
												ErrorMessage = ErrorMessage + '\nTo be processed check box Issue.';//is not present. Please add the required details to Master Data';
											}
											
											if(ErrorMessage == 'Details')
											{
												ErrorMessage = ErrorMessage + '\nNo Error Found.';
											}
											
											GMSRec.setFieldValue('custrecord_error_master_data_creation', ErrorMessage);
											GMSRec.setFieldValue('custrecord_zttblar_file_id', fileId);
								
											var i_GMSRecID = nlapiSubmitRecord(GMSRec,false,false);
											nlapiLogExecution('DEBUG', 'GMS Invoices Scheduled', 'i_GMSRecID ==' + i_GMSRecID);
											
											if(_logValidation(i_GMSRecID))
											{
												RecordsCount++;
											}
										}
									}
									catch(ex)
									{
										nlapiLogExecution('DEBUG', 'Try Catch', 'exception=' + ex);
										nlapiLogExecution('DEBUG', 'Try Catch', 'exception code=' + ex.code);
									}
									
									
									
								}
								else
								{
									nlapiLogExecution('DEBUG', 'GMS Invoices Scheduled', 'reschedule with last ID');
									Schedulescriptafterusageexceeded(InvoiceNumber, fileId, EmployeeID);
									
									break;
								}
							}
						}
					}
					else
					{
						if (remainingUsage > cal_Usage)
						{
							try
							{
								var RecValidation = findRecord(InvoiceNumber);
								nlapiLogExecution('DEBUG', 'Search Project', 'RecValidation:' + RecValidation);
								
								if(RecValidation == 0)
								{
									var USCustomerID = splitArray[3];
									nlapiLogExecution('DEBUG', 'Search Project', 'USCustomerID:' + USCustomerID);
									
									var BICcode = splitArray[4];
									nlapiLogExecution('DEBUG', 'Search Project', 'BICcode:' + BICcode);
									
									//var CustomerInternalID = getCustomerID(USCustomerID,BICcode); // Change as per Srujan's Email
									var CustomerInternalID = getCustomerID(BICcode);
									//var CustomerInternalID = getCustomerID(USCustomerID);
									nlapiLogExecution('DEBUG', 'Search Project', 'CustomerInternalID:' + CustomerInternalID);
									
									var TaxRate = splitArray[6];
									nlapiLogExecution('DEBUG', 'Search Project', 'TaxRate:' + TaxRate);
									
									var TaxCodeID = getTaxCodeID(TaxRate);
									nlapiLogExecution('DEBUG', 'Search Project', 'TaxCodeID:' + TaxCodeID);
									
									var InvoiceDate = splitArray[10];
									nlapiLogExecution('DEBUG', 'Search Project', 'InvoiceDate:' + InvoiceDate);
									
									var ItemDescription = splitArray[9] + ' | ' + InvoiceDate + ' | ' + USCustomerID;
									nlapiLogExecution('DEBUG', 'Search Project', 'ItemDescription:' + ItemDescription);
									
									var Currency = getCurrencyID(splitArray[13]);
									nlapiLogExecution('DEBUG', 'Search Project', 'Currency:' + Currency);
									
									var CustPayTerms = '';
									
									var GMSRec = nlapiCreateRecord('customrecord_gms_master_data');
									
									if(_logValidation(splitArray[11]))
									{
										CustPayTerms = getPaymentTermsID(splitArray[11]);
										nlapiLogExecution('DEBUG', 'Search Project', 'CustPayTerms:' + CustPayTerms);
										
										if(_logValidation(CustPayTerms))
										{
											GMSRec.setFieldValue('custrecord_payment_terms', CustPayTerms);
										}
										else
										{
											GMSRec.setFieldValue('custrecord_payment_terms', '4');
											ErrorMessage = ErrorMessage + '\nPayment Terms Issue.';//is not present in NetSuite. Hence, adding due on receipt';
										}
									}
									else
									{
										GMSRec.setFieldValue('custrecord_payment_terms', '4');
									}
									
									GMSRec.setFieldValue('custrecord_gms_customer', splitArray[2]);
									
									if(_logValidation(CustomerInternalID))
									{
										GMSRec.setFieldValue('custrecord_gms_customer_ns', CustomerInternalID);
									}
									else
									{
										ErrorMessage = ErrorMessage + '\nCustomer BIC code Issue.';//is not present in NetSuite. Please add the correct NS Customer to Master Data.';
									}
									
									GMSRec.setFieldValue('custrecord_gms_item_description', ItemDescription);
									
									if(_logValidation(Currency))
									{
										GMSRec.setFieldValue('custrecord_gms_invoice_currency', Currency);
									}
									else
									{
										ErrorMessage = ErrorMessage + '\nCurrency Issue.';//is not present in NetSuite. Please add the correct currency to Master Data';
									}
									
									GMSRec.setFieldValue('custrecord_gms_item_taxrate', TaxRate);
									
									if(_logValidation(TaxCodeID))
									{
										GMSRec.setFieldValue('custrecord_gms_item_taxcode', TaxCodeID);
									}
									else
									{
										ErrorMessage = ErrorMessage + '\nTax Percent Issue.';//is not present in NetSuite. Please add the correct Tax Code to Master Data';
									}
									
									if(_logValidation(InvoiceDate))
									{
										try
										{
											GMSRec.setFieldValue('custrecord_gms_invoice_date', InvoiceDate);
										}
										catch(e)
										{
											 nlapiLogExecution('DEBUG', 'Try Catch', 'e=' + e);
											 nlapiLogExecution('DEBUG', 'Try Catch', 'e=' + e.code);
											 
											 var q = InvoiceDate.split("/");
											 nlapiLogExecution('DEBUG', 'Search Project', 'q:' + q);
											 
											 var NewDate = new Date(q[2],(q[0]-1),q[1]);
											 nlapiLogExecution('DEBUG', 'Search Project', 'NewDate:' + NewDate);
											 
											 var DateToSet = nlapiDateToString(NewDate);
											 nlapiLogExecution('DEBUG', 'Search Project', 'DateToSet:' + DateToSet);
											 
											 try
											 {
												 GMSRec.setFieldValue('custrecord_gms_invoice_date', DateToSet);
											 }
											 catch(excep)
											 {
												 nlapiLogExecution('DEBUG', 'Try Catch', 'excep=' + excep);
												 nlapiLogExecution('DEBUG', 'Try Catch', 'excep=' + excep.code);
												 GMSRec.setFieldValue('custrecord_gms_invoice_date', '');
												 ErrorMessage = ErrorMessage + '\nDate format Issue.';//does not match with NetSuite format. Please enter a correct format';
											 }
											 
										}
									}
									
									GMSRec.setFieldValue('custrecord_gms_item_rate', splitArray[5]);
									GMSRec.setFieldValue('custrecord_gms_item_tax_amount', splitArray[7]);
									GMSRec.setFieldValue('custrecord_gms_item_amount', splitArray[8]);
									GMSRec.setFieldValue('custrecord_gms_invoice_number', InvoiceNumber);
									GMSRec.setFieldValue('custrecord_gms_terms', splitArray[11]);
									//GMSRec.setFieldValue('custrecord_gms_exception', splitArray[14]);
									
									if(splitArray[14] == 'T')
									{
										GMSRec.setFieldValue('custrecord_to_be_processed', 'T');
									}
									else if(splitArray[14] == 'F')
									{
										GMSRec.setFieldValue('custrecord_to_be_processed', 'F');
									}
									else
									{
										ErrorMessage = ErrorMessage + '\nTo be processed check box Issue.';//is not present. Please add the required details to Master Data';
									}
									
									if(ErrorMessage == 'Details')
									{
										ErrorMessage = ErrorMessage + '\nNo Error Found.';
									}
									
									nlapiLogExecution('DEBUG', 'GMS Invoices Scheduled', 'ErrorMessage ==' + ErrorMessage);
									
									GMSRec.setFieldValue('custrecord_error_master_data_creation', ErrorMessage);
									GMSRec.setFieldValue('custrecord_zttblar_file_id', fileId);
						
									var i_GMSRecID = nlapiSubmitRecord(GMSRec,false,false);
									nlapiLogExecution('DEBUG', 'GMS Invoices Scheduled', 'i_GMSRecID ==' + i_GMSRecID);
									
									if(_logValidation(i_GMSRecID))
									{
										RecordsCount++;
									}
								}
							}
							catch(ex)
							{
								nlapiLogExecution('DEBUG', 'Try Catch', 'exception=' + ex);
								nlapiLogExecution('DEBUG', 'Try Catch', 'exception code=' + ex.code);
							}
							
						}
						else
						{
							
							nlapiLogExecution('DEBUG', 'GMS Invoices Scheduled', 'reschedule without last ID');
							
							Schedulescriptafterusageexceeded(InvoiceNumber, fileId, EmployeeID);
							
							break;
						}
					}
				}
				nlapiLogExecution('DEBUG', 'GMS Invoices Scheduled', 'RecordsCount ==' + RecordsCount);
			}
			if(RecordsCount!=0)
			{
				
				var EmpRec = nlapiLoadRecord('employee', EmployeeID);
				var ReceipientEmail = EmpRec.getFieldValue('email');
				nlapiLogExecution('DEBUG', 'GMS Invoices Scheduled', 'ReceipientEmail ==' + ReceipientEmail);
				
				EmailBody = EmailBody + RecordsCount;
				nlapiLogExecution('DEBUG', 'GMS Invoices Scheduled', 'EmailBody ==' + EmailBody);
				
				nlapiSendEmail(AuthorID, ReceipientEmail, EmailSubject,EmailBody , null, null, null);
			}
			else
			{
				var EmpRec = nlapiLoadRecord('employee', EmployeeID);
				var ReceipientEmail = EmpRec.getFieldValue('email');
				nlapiLogExecution('DEBUG', 'GMS Invoices Scheduled', 'ReceipientEmail ==' + ReceipientEmail);
				
				EmailBody = 'These records are already present in GMS master data. Hence, no records are created.';
				nlapiLogExecution('DEBUG', 'GMS Invoices Scheduled', 'EmailBody ==' + EmailBody);
				
				nlapiSendEmail(AuthorID, ReceipientEmail, EmailSubject,EmailBody , null, null, null);
			}
		}
		
	}
	catch(exception)
	{
		nlapiLogExecution('DEBUG', 'Try Catch', 'exception=' + exception);
		nlapiLogExecution('DEBUG', 'Try Catch', 'exception code=' + exception.code);
	}
}

function log(message) 
{
	nlapiLogExecution('Debug', 'Create Zabbr record ', message);
}

//Function to get the file contents and create/update the Project Record
function GetFileContents(FileObj)
{
	var Flag = 0;
	
	if(_logValidation(FileObj))
	{
		var filedecodedrows = '';
		nlapiLogExecution('DEBUG', 'ReadfileFrmCabinet', '# Type =' + FileObj.getType());
		
		var fileContents = FileObj.getValue();
	    nlapiLogExecution('DEBUG', 'ReadfileFrmCabinet', 'fileContents=' + fileContents);
	    
		var fileEncoding= FileObj.getEncoding();
	    nlapiLogExecution('DEBUG', 'ReadfileFrmCabinet', 'fileEncoding=' + fileEncoding);
	    
	    //var decodedvalue = decode(fileContents);
		//nlapiLogExecution('DEBUG', 'ReadfileFrmCabinet', 'decodedvalue=' + decodedvalue);
		
		// Begin Code : To parse The data.
				
	    if (FileObj.getType() == 'EXCEL'|| (FileObj.getType() == 'MISCTEXT')) 	
		{
	        nlapiLogExecution('DEBUG', 'ReadfileFrmCabinet', '@@ excel file');
	        filedecodedrows = decode_base64(fileContents);
	        //filedecodedrows = fileContents;
	        nlapiLogExecution('DEBUG', 'ReadfileFrmCabinet', 'After filedecodedrows=' + filedecodedrows);
	    }
	    else 	
		{
	        nlapiLogExecution('DEBUG', 'ReadfileFrmCabinet', '@@ other than excel file');
	        filedecodedrows = fileContents;
	        nlapiLogExecution('DEBUG', 'ReadfileFrmCabinet', 'After fileContents=' + fileContents);
	    }
        
		// End Code : To parse The data.
		
		var arr =  filedecodedrows.split(/\n/g);
	    nlapiLogExecution('DEBUG', 'ReadfileFrmCabinet', 'base64Ecodedstring=' + arr.length);
		
		//var Length = parseInt(arr.length) - parseInt(1);
		var Length = parseInt(arr.length);// code added for file validation
		var FullContents = '';
		
		//for (var i = 1; i < Length; i++)
		for (var i = 0; i < Length; i++)// code added for file validation
		{
			// code added for file validation
			if(i == 0)
			{
				var Headers = parseCSV(arr[i]);
				nlapiLogExecution('DEBUG', 'ReadfileFrmCabinet', 'Headers=' + Headers);
				
				var FileHeaders = Headers.toString().split(',');
				nlapiLogExecution('DEBUG', 'ReadfileFrmCabinet', 'FileHeaders.length=' + FileHeaders.length);
				
				var FirstHeader = FileHeaders[0];
				nlapiLogExecution('DEBUG', 'ReadfileFrmCabinet', 'FirstHeader=' + FirstHeader);
				var LastHeader = FileHeaders[14];
				nlapiLogExecution('DEBUG', 'ReadfileFrmCabinet', 'LastHeader=' + LastHeader);
				
				if(FirstHeader != 'GLItem Id' && LastHeader != 'To be Sent' && FileHeaders.length != 15)
				{
					Flag = 1;
					break;
				}
			}
			else
			{
				//Begin Code : to get the data from the CSV Row wise
				
				arr[i] = parseCSV(arr[i]);
				
				if(i != (Length-1))
				{
					FullContents += arr[i] + '#$';
				}
				else
				{
					FullContents += arr[i];
				}
			}
		}
		nlapiLogExecution('DEBUG', 'ReadfileFrmCabinet', 'Flag=' + Flag);
		if(Flag == 0)
		{
			return FullContents.toString();
		}
		else
		{
			return Flag;
		}
		
	}
}

function decode_base64(s)
{
    var e = {}, i, k, v = [], r = '', w = String.fromCharCode;
    var n = [[65, 91], [97, 123], [48, 58], [47, 48], [43, 44]];
    
    for (z in n) 
	{
        for (i = n[z][0]; i < n[z][1]; i++) 
		{
            v.push(w(i));
        }
    }
    for (i = 0; i < 64; i++) 
	{
        e[v[i]] = i;
    }
    
    for (i = 0; i < s.length; i += 72) 
	{
        var b = 0, c, x, l = 0, o = s.substring(i, i + 72);
        for (x = 0; x < o.length; x++) 
		{
            c = e[o.charAt(x)];
            b = (b << 6) + c;
            l += 6;
            while (l >= 8) 
			{
                r += w((b >>> (l -= 8)) % 256);
            }
        }
    }
    return r;
			
}

//function to parse the CSV String	
function parseCSV (csvString) 
{
    var fieldEndMarker  = /([,\015\012] *)/g; /* Comma is assumed as field separator */
    var qFieldEndMarker = /("")*"([,\015\012] *)/g; /* Double quotes are assumed as the quote character */
    var startIndex = 0;
    var records = [], currentRecord = [];
    do 
	{
        // If the to-be-matched substring starts with a double-quote, use the qFieldMarker regex, otherwise use fieldMarker.
        var endMarkerRE = (csvString.charAt (startIndex) == '"')  ? qFieldEndMarker : fieldEndMarker;
        endMarkerRE.lastIndex = startIndex;
        var matchArray = endMarkerRE.exec (csvString);
        if (!matchArray || !matchArray.length) 
		{
            break;
        }
        var endIndex = endMarkerRE.lastIndex - matchArray[matchArray.length-1].length;
        var match = csvString.substring (startIndex, endIndex);
        if (match.charAt(0) == '"') // The matching field starts with a quoting character, so remove the quotes
		{ 
            match = match.substring (1, match.length-1).replace (/""/g, '"');
        }
        currentRecord.push (match);
        var marker = matchArray[0];
        if (marker.indexOf (',') < 0) // Field ends with newline, not comma
		{ 
            records.push (currentRecord);
            currentRecord = [];
        }
        startIndex = endMarkerRE.lastIndex;
    } while (true);
    if (startIndex < csvString.length) 
	{ // Maybe something left over?
        var remaining = csvString.substring (startIndex).trim();
        if (remaining) currentRecord.push (remaining);
    }
    if (currentRecord.length > 0) 
	{ // Account for the last record
        records.push (currentRecord);
    }
	////nlapiLogExecution('DEBUG','parseCSV','records :'+records);
    return records;
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
function _nullValidation(value)
{
	if (value == null || value == 'NaN' || value == '' || value == undefined || value == '&nbsp;')
	{
		return true;
	}
	else
	{
		return false;
	}
}

function decode(utftext) 
{
    var string = "";
    var i = 0;
    var c = c1 = c2 = 0;

    while ( i < utftext.length ) 
    {

        c = utftext.charCodeAt(i);
        if (c < 128) 
        {
            string += String.fromCharCode(c);
            i++;
        }
        else if((c > 191) && (c < 224)) 
        {

            c2 = utftext.charCodeAt(i+1);
            string += String.fromCharCode(((c & 31) << 6) | (c2 & 63));
            i += 2;
        }
        else 
        {
            c2 = utftext.charCodeAt(i+1);
            c3 = utftext.charCodeAt(i+2);
            string += String.fromCharCode(((c & 15) << 12) | ((c2 & 63) << 6) | (c3 & 63));
            i += 3;
        }
    }
    return string;
}

//function getCustomerID(USCustomerID,BICcode)
//function getCustomerID(USCustomerID)
function getCustomerID(BICcode)
{
	//var newString=USCustomerID.substring(1);
	//nlapiLogExecution('DEBUG', 'GMS Invoices Scheduled', 'newString ==' + newString);
	
	var RecInternalID = '';
	var filters = new Array();
	filters[0] = new nlobjSearchFilter('custentity_gmsbiccode',null,'is',BICcode);
	//filters[0] = new nlobjSearchFilter('custentity_gmsbillinguscustomerid',null,'contains',newString);
	filters[1] = new nlobjSearchFilter('isinactive',null,'is','F');
	
	var columns = new Array();
	columns[0] = new nlobjSearchColumn('internalid');
	
	var hits = nlapiSearchRecord('customer',null,filters,columns);
	nlapiLogExecution('DEBUG', 'GMS Invoices Scheduled', 'hits ==' + hits);
	
	if(_logValidation(hits))
	{

		for(var i=0;i<hits.length;i++)
		{
			RecInternalID = hits[i].getValue('internalid');
			nlapiLogExecution('DEBUG', 'GMS Invoices Scheduled', 'RecInternalID ==' + RecInternalID);
			if(_logValidation(RecInternalID))
			{
				break;
			}
		}
			
	}
	if(_logValidation(RecInternalID))
	{
		return RecInternalID;
	}
	else
	{
		return '';
	}
	
}

function getTaxCodeID(TaxRate)
{
	var TaxInternalID = '';
	
	//var Rate = TaxRate + '%';
	//nlapiLogExecution('DEBUG', 'GMS Invoices Scheduled', 'Rate ==' + Rate);
	
	var filters = new Array();
	filters[0] = new nlobjSearchFilter('itemid',null,'contains','GMS');
	filters[1] = new nlobjSearchFilter('rate',null,'contains',TaxRate);
	filters[2] = new nlobjSearchFilter('isinactive',null,'is','F');
	
	var columns = new Array();
	columns[0] = new nlobjSearchColumn('internalid');
	
	var searchRecord = nlapiSearchRecord('salestaxitem',null,filters,columns);
	nlapiLogExecution('DEBUG', 'GMS Invoices Scheduled', 'searchRecord ==' + searchRecord);
	
	if(_logValidation(searchRecord))
	{

		for(var i=0;i<searchRecord.length;i++)
		{
			TaxInternalID = searchRecord[i].getValue('internalid');
			nlapiLogExecution('DEBUG', 'GMS Invoices Scheduled', 'TaxInternalID ==' + TaxInternalID);
			if(_logValidation(TaxInternalID))
			{
				break;
			}
		}
			
	}
	if(_logValidation(TaxInternalID))
	{
		return TaxInternalID;
	}
}


function getCurrencyID(Currency)
{
	var CurrencyID = '';
	
	
	var filters = new Array();
	filters[0] = new nlobjSearchFilter('name',null,'contains',Currency);
	filters[1] = new nlobjSearchFilter('isinactive',null,'is','F');

	var columns = new Array();
	columns[0] = new nlobjSearchColumn('internalid');
	
	var searchRecord = nlapiSearchRecord('currency',null,filters,columns);
	nlapiLogExecution('DEBUG', 'GMS Invoices Scheduled', 'searchRecord ==' + searchRecord);
	
	if(_logValidation(searchRecord))
	{

		for(var i=0;i<searchRecord.length;i++)
		{
			CurrencyID = searchRecord[i].getValue('internalid');
			nlapiLogExecution('DEBUG', 'GMS Invoices Scheduled', 'CurrencyID ==' + CurrencyID);
			if(_logValidation(CurrencyID))
			{
				break;
			}
		}
			
	}
	if(_logValidation(CurrencyID))
	{
		return CurrencyID;
	}
}

function getPaymentTermsID(Terms)
{
	var TermsID = '';
	
	nlapiLogExecution('DEBUG', 'GMS Invoices Scheduled', 'Terms.substring(1) ==' + Terms.substring(1));
	nlapiLogExecution('DEBUG', 'GMS Invoices Scheduled', 'Terms.substring(0, 1) ==' + Terms.substring(0, 1));
	
	if(Terms.substring(0, 1) == '45')// && Terms.substring(1) == 'N')
	{
		TermsID = 7;
		nlapiLogExecution('DEBUG', 'GMS Invoices Scheduled', 'Inside if - TermsID ==' + TermsID);
	}
	else
	{
		nlapiLogExecution('DEBUG', 'GMS Invoices Scheduled', 'Inside else - TermsID ==' + TermsID);
		
		var filters = new Array();
		filters[0] = new nlobjSearchFilter('name',null,'contains',Terms.substring(1));
		filters[1] = new nlobjSearchFilter('name',null,'contains',Terms.substring(0, 1));
		filters[2] = new nlobjSearchFilter('isinactive',null,'is','F');

		var columns = new Array();
		columns[0] = new nlobjSearchColumn('internalid');
		
		var searchRecord = nlapiSearchRecord('term',null,filters,columns);
		nlapiLogExecution('DEBUG', 'GMS Invoices Scheduled', 'searchRecord ==' + searchRecord);
		
		if(_logValidation(searchRecord))
		{

			for(var i=0;i<searchRecord.length;i++)
			{
				TermsID = searchRecord[i].getValue('internalid');
				nlapiLogExecution('DEBUG', 'GMS Invoices Scheduled', 'TermsID ==' + TermsID);
				if(_logValidation(TermsID))
				{
					break;
				}
			}
				
		}
	}
	
	
	if(_logValidation(TermsID))
	{
		return TermsID;
	}
}

function findRecord(number)
{
	var Check = 0;
	
	var filters = new Array();
	filters[0] = new nlobjSearchFilter('custrecord_gms_invoice_number',null,'is',number);
	filters[1] = new nlobjSearchFilter('isinactive',null,'is','F');

	var columns = new Array();
	columns[0] = new nlobjSearchColumn('internalid');
	
	var searchRecord = nlapiSearchRecord('customrecord_gms_master_data',null,filters,columns);
	nlapiLogExecution('DEBUG', 'GMS Invoices Scheduled', 'searchRecord ==' + searchRecord);
	
	if(_logValidation(searchRecord))
	{
		Check = 1;
	}
	
	return Check;
}

function Schedulescriptafterusageexceeded(number, file, employee)
{
	nlapiLogExecution('DEBUG','GMS Invoices Scheduled','Inside Schedulescriptafterusageexceeded');
	
	var params=new Array();
	params['status']='scheduled';
	params['runasadmin']='T';
	params['custscript_zttblar_file_id']=file;
	params['custscript_last_invoice_id']=number;
	params['custscript_gms_employee']=employee;
	
	var status=nlapiScheduleScript(nlapiGetContext().getScriptId(), nlapiGetContext().getDeploymentId(),params);
	nlapiLogExecution('DEBUG','GMS Invoices Scheduled','Script scheduled status='+ status);
	
	////If script is scheduled then successfuly then check for if status=queued
	if (status == 'QUEUED') 
	{
		nlapiLogExecution('DEBUG', 'GMS Invoices Scheduled', 'The script is rescheduled');
	}
}