/**
 * @NApiVersion 2.x
 * @NScriptType UserEventScript
 */

define(['N/record', 'N/runtime', 'N/task', 'N/search', 'N/email', 'N/xml', 'N/file', 'N/format'],
    function (record, runtime, task, search, email, xml, file, format){
	
	function roundNumber(number)
	{	
		var decimals = 2;
		var newnumber = new Number(number + '').toFixed(parseInt(decimals));
		log.debug("newnumber:- "+newnumber);
	    parseFloat(newnumber);
	    return newnumber;
	}
	function right(str)
	{
	return newstr=str.substr(str.length-2,str.length)
	}
	function execute(context) {
		if ( (context.type == context.UserEventType.CREATE)){
			try {
				
				var rec = context.newRecord;
	            var recObj = record.load({ type: rec.type, id: rec.id });
	            
	            var internalID = rec.id;
	            //log.debug("internalID:- "+internalID);
	            
	            var SubsidiaryID = recObj.getValue('subsidiary');
	            log.debug("SubsidiaryID:- "+SubsidiaryID);
	            
	            if(SubsidiaryID == '192')
	            {
	            	var recTranId = recObj.getValue('tranid');
		            log.debug("recTranId:- "+recTranId);
		            
		            var LineCount = recObj.getLineCount('item');
		            //log.debug("LineCount:- "+LineCount);
		            
		            var folderId = '1322771';
					            
		            var SupplierTaxID = '11936718';
		            var SupplierName = recObj.getValue('custbody_sublegalname');
		            //log.debug("SupplierName:- "+SupplierName);
		            var SupplierCountryCode = 'HU';
		            var SupplierPostalCode = '3530';
		            var SupplierCity = 'Miskolc';
		            var SupplierStreetName = 'Floor IV';
		            var SupplierpublicPlaceCategory = 'utca';
		            var SupplierNumber = 'SzÃ©chenyi u. 70.';
		            
		            var CustID = recObj.getValue('entity');
		            //log.debug("CustID:- "+CustID);
		            var CustObj = record.load({ type: 'customer', id: CustID });
		            
		            var CustomerName = CustObj.getValue('custentity_legalname');
		            //log.debug("CustomerName:- "+CustomerName);
		            
		            var TaxID = CustObj.getValue('vatregnumber');
		            //log.debug("TaxID:- "+TaxID);
		            
		            var CustomerTaxID = (TaxID.replace('HU', '').trim());
		            //log.debug("CustomerTaxID:- "+CustomerTaxID);
		            
		            var CustomerCountryCode = CustObj.getValue('billcountry');
		            //log.debug("CustomerCountryCode:- "+CustomerCountryCode);
		            var CustomerPostalCode = CustObj.getValue('billzip');
		            //log.debug("CustomerPostalCode:- "+CustomerPostalCode);
		            var CustomerCity = CustObj.getValue('billcity');
		            //log.debug("CustomerCity:- "+CustomerCity);
		            var CustomerAdditionalAddress = CustObj.getValue('billaddr1');
		            //log.debug("CustomerAdditionalAddress:- "+CustomerAdditionalAddress);
		            
		            var InvoiceNumber = recObj.getValue('tranid');
		            //log.debug("InvoiceNumber:- "+InvoiceNumber);
		            var InvoiceCategory = 'NORMAL';
		            
		            var IssueDate = recObj.getValue('trandate');
		            //log.debug("IssueDate:- "+IssueDate);
		            
		            var day1 = '0'+ (IssueDate.getDate());
		            day1 = right(day1);
		            var monthIndex1 = '0'+ (parseInt(IssueDate.getMonth()) +1);
		            monthIndex1 = right(monthIndex1);
		            var year1 = IssueDate.getFullYear();
		            
		            var InvoiceIssueDate = year1 + '-' + monthIndex1 + '-' + day1;
		            //log.debug("InvoiceIssueDate:- "+InvoiceIssueDate);
		            
		            /*var InvoiceIssueDate = format.format({
		                value: IssueDate,
		                type: format.Type.DATE
		            });
		            log.debug("InvoiceIssueDate:- "+InvoiceIssueDate);*/
		            
		            var DeliveryDate = recObj.getValue('trandate');
		            //log.debug("DeliveryDate:- "+DeliveryDate);
		            
		            var day2 =  '0'+ (DeliveryDate.getDate());
		            day2 = right(day2);
		            var monthIndex2 =  '0'+ (parseInt(DeliveryDate.getMonth()) +1);
		            monthIndex2 = right(monthIndex2);
		            var year2 = DeliveryDate.getFullYear();
		            
		            var InvoiceDeliveryDate = year2 + '-' + monthIndex2 + '-' + day2;
		            //log.debug("InvoiceDeliveryDate:- "+InvoiceDeliveryDate);
		            
		            /*var InvoiceDeliveryDate = format.format({
		                value: DeliveryDate,
		                type: format.Type.DATE
		            });
		            log.debug("InvoiceDeliveryDate:- "+InvoiceDeliveryDate);*/
		            
		            var InvoiceCurrency = recObj.getText('currency');
		            //log.debug("InvoiceCurrency:- "+InvoiceCurrency);
		            
		            var ExchangeRate = recObj.getValue('exchangerate');
		            //log.debug("ExchangeRate:- "+ExchangeRate);
		            
		            var InvoiceSelfBillingIndicator = false;
		            var InvoicePaymentMethod = 'TRANSFER';
		            
		            var PaymentDate = recObj.getValue('duedate');
		            //log.debug("PaymentDate:- "+PaymentDate);
		            
		            var day3 = '0'+ (PaymentDate.getDate());
		            day3 = right(day3);
		            var monthIndex3 = '0'+ (parseInt(PaymentDate.getMonth()) +1);
		            monthIndex3 = right(monthIndex3);
		            var year3 = PaymentDate.getFullYear();
		            
		            var InvoicePaymentDate = year3 + '-' + monthIndex3 + '-' + day3;
		            //log.debug("InvoicePaymentDate:- "+InvoicePaymentDate);
		            
		            
		            var InvoiceCashAccountingIndicator = false;
		            var InvoiceRecAppearance = 'ELECTRONIC';
		            
		            var VatItem = new Array();
		    		for(var a = 0; a < 10; a++)
		    		{
		    			VatItem[a] = new Array();
		    			for(var b = 0; b <3; b++)
		    			{ 
		    				VatItem[a][b] = 'x';
		    			}
		    		}
		            
		            var InvoiceSummaryNetAmount = recObj.getValue('subtotal');
		            //log.debug("InvoiceSummaryNetAmount:- "+InvoiceSummaryNetAmount);
		            InvoiceSummaryNetAmount = roundNumber(InvoiceSummaryNetAmount * ExchangeRate);
		            //log.debug("InvoiceSummaryNetAmount:- "+InvoiceSummaryNetAmount);
		            
		            var InvoiceSummaryVatAmount = recObj.getValue('taxtotal');
		            //log.debug("InvoiceSummaryVatAmount:- "+InvoiceSummaryVatAmount);
		            InvoiceSummaryVatAmount = roundNumber(InvoiceSummaryVatAmount * ExchangeRate);
		            //log.debug("InvoiceSummaryVatAmount:- "+InvoiceSummaryVatAmount);
		            
		            var InvoiceSummaryGrossAmount = recObj.getValue('total');
		            //log.debug("InvoiceSummaryGrossAmount:- "+InvoiceSummaryGrossAmount);
		            InvoiceSummaryGrossAmount = roundNumber(InvoiceSummaryGrossAmount * ExchangeRate);
		            //log.debug("InvoiceSummaryGrossAmount:- "+InvoiceSummaryGrossAmount);
		            
		            var authorId = '34524';
		            var recipientEmail = 'cluster.msun@misys.com';
		            var ccEmail = 'shubhradeep.saha@misys.com';
		            var EmailCCid = [ccEmail];

					// initialize report data
					var xmlContent = '';

					xmlContent += '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>';
					xmlContent += '<Invoice xmlns="http://schemas.nav.gov.hu/OSA/1.0/data">';
					xmlContent += '<invoiceExchange>';
					xmlContent += '<invoiceHead>';
					xmlContent += '<supplierInfo>';
					xmlContent += '<supplierTaxNumber>';
					xmlContent += '<taxpayerId>'+SupplierTaxID+'</taxpayerId>';
					xmlContent += '</supplierTaxNumber>';
					xmlContent += '<supplierName>'+SupplierName+'</supplierName>';
					xmlContent += '<supplierAddress>';
					xmlContent += '<detailedAddress>';
					xmlContent += '<countryCode>'+SupplierCountryCode+'</countryCode>';
					xmlContent += '<postalCode>'+SupplierPostalCode+'</postalCode>';
					xmlContent += '<city>'+SupplierCity+'</city>';
					xmlContent += '<streetName>'+SupplierStreetName+'</streetName>';
					xmlContent += '<publicPlaceCategory>'+SupplierpublicPlaceCategory+'</publicPlaceCategory>';
					xmlContent += '<number>'+SupplierNumber+'</number>';
					xmlContent += '</detailedAddress>';
					xmlContent += '</supplierAddress>';
					xmlContent += '</supplierInfo>';
					xmlContent += '<customerInfo>';
					xmlContent += '<customerTaxNumber>';
					xmlContent += '<taxpayerId>'+CustomerTaxID+'</taxpayerId>';
					xmlContent += '</customerTaxNumber>';
					xmlContent += '<customerName>'+CustomerName+'</customerName>';
					xmlContent += '<customerAddress>';
					xmlContent += '<simpleAddress>';
					xmlContent += '<countryCode>'+CustomerCountryCode+'</countryCode>';
					xmlContent += '<postalCode>'+CustomerPostalCode+'</postalCode>';
					xmlContent += '<city>'+CustomerCity+'</city>';
					xmlContent += '<additionalAddressDetail>'+CustomerAdditionalAddress+'</additionalAddressDetail>';
					xmlContent += '</simpleAddress>';
					xmlContent += '</customerAddress>';
					xmlContent += '</customerInfo>';
					xmlContent += '<invoiceData>';
					xmlContent += '<invoiceNumber>'+InvoiceNumber+'</invoiceNumber>';
					xmlContent += '<invoiceCategory>'+InvoiceCategory+'</invoiceCategory>';
					xmlContent += '<invoiceIssueDate>'+InvoiceIssueDate+'</invoiceIssueDate>';
					xmlContent += '<invoiceDeliveryDate>'+InvoiceDeliveryDate+'</invoiceDeliveryDate>';
					xmlContent += '<currencyCode>'+InvoiceCurrency+'</currencyCode>';
					xmlContent += '<selfBillingIndicator>'+InvoiceSelfBillingIndicator+'</selfBillingIndicator>';
					xmlContent += '<paymentMethod>'+InvoicePaymentMethod+'</paymentMethod>';
					xmlContent += '<paymentDate>'+InvoicePaymentDate+'</paymentDate>';
					xmlContent += '<cashAccountingIndicator>'+InvoiceCashAccountingIndicator+'</cashAccountingIndicator>';
					xmlContent += '<invoiceAppearance>'+InvoiceRecAppearance+'</invoiceAppearance>';
					xmlContent += '</invoiceData>';
					xmlContent += '</invoiceHead>';
					xmlContent += '<invoiceLines>';
					
					for( var i = 0; i < LineCount; i++)
					{
						var InvoiceLineNumber = recObj.getSublistValue({sublistId: 'item', fieldId: 'line', line: i});
			            //log.debug("InvoiceLineNumber:- "+InvoiceLineNumber);
			            var InvoiceLineDescription = recObj.getSublistValue({sublistId: 'item', fieldId: 'description', line: i});
			            //log.debug("InvoiceLineDescription:- "+InvoiceLineDescription);
			            var InvoiceLineQuantity = recObj.getSublistValue({sublistId: 'item', fieldId: 'quantity', line: i});
			            //log.debug("InvoiceLineQuantity:- "+InvoiceLineQuantity);
			            
			            var InvoiceLineUnitOfMeasure = 'NA';
			            
			            var InvoiceLineUnitPrice = recObj.getSublistValue({sublistId: 'item', fieldId: 'rate', line: i});
			            //log.debug("InvoiceLineUnitPrice:- "+InvoiceLineUnitPrice);
			            InvoiceLineUnitPrice = roundNumber(InvoiceLineUnitPrice * ExchangeRate);
			            //log.debug("InvoiceLineUnitPrice:- "+InvoiceLineUnitPrice);
			            
			            var InvoiceLineNetAmount = recObj.getSublistValue({sublistId: 'item', fieldId: 'amount', line: i});
			            //log.debug("InvoiceLineNetAmount:- "+InvoiceLineNetAmount);
			            InvoiceLineNetAmount = roundNumber(InvoiceLineNetAmount * ExchangeRate);
			            //log.debug("InvoiceLineNetAmount:- "+InvoiceLineNetAmount);
			            
			            var InvoiceLineVatPercentage = parseFloat((recObj.getSublistValue({sublistId: 'item', fieldId: 'taxrate1', line: i}))/100);
			            //log.debug("InvoiceLineVatPercentage:- "+InvoiceLineVatPercentage);
			            
			            var InvoiceLineVatAmountHUF = recObj.getSublistValue({sublistId: 'item', fieldId: 'tax1amt', line: i});
			            //log.debug("InvoiceLineVatAmountHUF:- "+InvoiceLineVatAmountHUF);
			            InvoiceLineVatAmountHUF = roundNumber(InvoiceLineVatAmountHUF * ExchangeRate);
			            //log.debug("InvoiceLineVatAmountHUF:- "+InvoiceLineVatAmountHUF);
			            
			            var InvoiceLineGrossAmount = recObj.getSublistValue({sublistId: 'item', fieldId: 'grossamt', line: i});
			            //log.debug("InvoiceLineGrossAmount:- "+InvoiceLineGrossAmount);
			            InvoiceLineGrossAmount = roundNumber(InvoiceLineGrossAmount * ExchangeRate);
			            //log.debug("InvoiceLineGrossAmount:- "+InvoiceLineGrossAmount);
			            
			            var LineNo = parseInt(i) + 1;
			            //log.debug("LineNo:- "+LineNo);
			            
						xmlContent += '<line>';
						xmlContent += '<lineNumber>'+LineNo+'</lineNumber>';
						xmlContent += '<lineDescription>'+InvoiceLineDescription+'</lineDescription>';
						xmlContent += '<quantity>'+InvoiceLineQuantity+'</quantity>';
						xmlContent += '<unitOfMeasure>'+InvoiceLineUnitOfMeasure+'</unitOfMeasure>';
						xmlContent += '<unitPrice>'+InvoiceLineUnitPrice+'</unitPrice>';
						xmlContent += '<lineAmountsNormal>';
						xmlContent += '<lineNetAmount>'+InvoiceLineNetAmount+'</lineNetAmount>';
						xmlContent += '<lineVatRate>';
						xmlContent += '<vatPercentage>'+InvoiceLineVatPercentage+'</vatPercentage>';
						xmlContent += '</lineVatRate>';
						xmlContent += '<lineVatAmountHUF>'+InvoiceLineVatAmountHUF+'</lineVatAmountHUF>';
						xmlContent += '<lineGrossAmountNormal>'+InvoiceLineGrossAmount+'</lineGrossAmountNormal>';
						xmlContent += '</lineAmountsNormal>';
						xmlContent += '</line>';
						
						var Length1 = VatItem.length;
						//log.debug("Length1:- "+Length1);
						
						for(var c = 0; c <= Length1; c++)
						{
							//log.debug("C:- "+c);
							var Check = VatItem[c][0];
							//log.debug("Check:- "+Check);
							//log.debug("InvoiceLineVatPercentage:- "+InvoiceLineVatPercentage);
							if(Check == InvoiceLineVatPercentage)
							{
								//log.debug("Updating:- ");
								var LineNet = VatItem[c][1];
								var TotalLineNet = parseFloat(LineNet) + parseFloat(InvoiceLineNetAmount);
								VatItem[c][1] = TotalLineNet;
								
								var LineVat = VatItem[c][2];
								var TotalLineVat = parseFloat(LineVat) + parseFloat(InvoiceLineVatAmountHUF);
								VatItem[c][2] = TotalLineVat;
								
								break;
							}
							else 
							{
								if(Check == 'x')
								{
									//log.debug("Adding:- ");
									VatItem[c][0] = InvoiceLineVatPercentage;
									VatItem[c][1] = InvoiceLineNetAmount;
									VatItem[c][2] = InvoiceLineVatAmountHUF;
									break;
								}
							}
						}
					}
					
					xmlContent += '</invoiceLines>';
					xmlContent += '<invoiceSummary>';
					xmlContent += '<summaryNormal>';
					
					//log.debug("VatItem:- "+VatItem);
					
					var Length2 = VatItem.length;
					//log.debug("Length2:- "+Length2);
					for(var d = 0; d <= Length2; d++)
					{
						var VatCheck = VatItem[d][0];
						//log.debug("VatCheck:- "+VatCheck);
						if(VatCheck == 'x')
						{
							break;
						}
						else
						{
							if(VatCheck != 'x' && VatCheck != null && VatCheck != undefined)
							{
								//log.debug("Setting:- ");
								var InvoiceVatPercentage = VatItem[d][0];
					            var InvoiceVatRateNetAmount = VatItem[d][1];
					            var InvoiceVatRateVatAmount = VatItem[d][2];

					            InvoiceVatRateNetAmount = roundNumber(InvoiceVatRateNetAmount * ExchangeRate);
					            //log.debug("InvoiceVatRateNetAmount:- "+InvoiceVatRateNetAmount);
					            InvoiceVatRateVatAmount = roundNumber(InvoiceVatRateVatAmount * ExchangeRate);
					            //log.debug("InvoiceVatRateVatAmount:- "+InvoiceVatRateVatAmount);
								
								xmlContent += '<summaryByVatRate>';
								xmlContent += '<vatRate>';
								xmlContent += '<vatPercentage>'+InvoiceVatPercentage+'</vatPercentage>';
								xmlContent += '</vatRate>';
								xmlContent += '<vatRateNetAmount>'+InvoiceVatRateNetAmount+'</vatRateNetAmount>';
								xmlContent += '<vatRateVatAmount>'+InvoiceVatRateVatAmount+'</vatRateVatAmount>';
								xmlContent += '</summaryByVatRate>';
							}
						}
					}
					
					xmlContent += '<invoiceNetAmount>'+InvoiceSummaryNetAmount+'</invoiceNetAmount>';
					xmlContent += '<invoiceVatAmount>'+InvoiceSummaryVatAmount+'</invoiceVatAmount>';
					xmlContent += '<invoiceVatAmountHUF>'+InvoiceSummaryGrossAmount+'</invoiceVatAmountHUF>';
					xmlContent += '</summaryNormal>';
					xmlContent += '</invoiceSummary>';
					xmlContent += '</invoiceExchange>';
					xmlContent += '</Invoice>';

					// create and save XML file
					var fileObj = file.create({
						name: 'HungaryInvoiceTaxUpload - ' + InvoiceNumber + '.xml',
						//name: 'HungaryInvoiceTaxUpload.xml',
						fileType: file.Type.XMLDOC,
						contents: xmlContent
					});
					fileObj.folder = folderId;
					var id = fileObj.save();

					// send export file to recipient email
					var subject = 'Hungary Tax';
					email.send({
						author: authorId,
						recipients: recipientEmail,
						cc: EmailCCid,
						subject: subject,
						body: 'Please find attached export file',
						attachments: [fileObj]
					});
					
					record.submitFields({ type: rec.type, id: rec.id, values: {custbody_hungary_invoice_upload_file: id} });
	            }
	            
	            } catch (e) {
				_errorHandler("execute", e);
				var subject = 'Invoice Data File Export Failed';
				
				email.send({
					author: authorId,
					recipients: recipientEmail,
					subject: subject,
					body: 'We encountered the following error while generating the export file: ' +
					'\n\n' + JSON.stringify(e)
				});
			}
		}
		
	}

	function _errorHandler(errorSource, e){
		var errorMessage='';
		log.error( 'unexpected error: ' + errorSource , e.message);
		return errorMessage;
	}

	return {
		afterSubmit: execute
	};
}
);