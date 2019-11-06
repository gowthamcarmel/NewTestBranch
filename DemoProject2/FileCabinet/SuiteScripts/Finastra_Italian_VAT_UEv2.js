/**
 * @NApiVersion 2.x
 * @NScriptType UserEventScript
**/

define(['N/record', 'N/runtime', 'N/task', 'N/search', 'N/email', 'N/xml', 'N/file', 'N/format'],
    function (record, runtime, task, search, email, xml, file, format){
	
	function roundNumberValue(number)
	{	
		var decimals = 8;
		var newnumber = new Number(number + '').toFixed(parseInt(decimals));
		log.debug("newnumber:- "+newnumber);
	    parseFloat(newnumber);
	    return newnumber;
	}
	function roundNumberVAT(number)
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
		if ( (context.type == context.UserEventType.EDIT || context.type == context.UserEventType.CREATE)){
			try {
				
				var rec = context.newRecord;
	            var recObj = record.load({ type: rec.type, id: rec.id });
	            
	            var internalID = rec.id;
	            //log.debug("internalID:- "+internalID);
	            
	            var SubsidiaryID = recObj.getValue('subsidiary');
	            log.debug("SubsidiaryID:- "+SubsidiaryID);
	            
	            if(SubsidiaryID == '53')
	            {
	            	//var recTranId = recObj.getValue('tranid');
		            //log.debug("recTranId:- "+recTranId);
		            
		            var LineCount = recObj.getLineCount('item');
		            log.debug("LineCount:- "+LineCount);
		            
		            var folderId = '1396580';
					            
		            var SupplierTaxID = '07623200966';
		            var SupplierName = recObj.getValue('custbody_sublegalname');
		            log.debug("SupplierName:- "+SupplierName);
		            var SupplierCountryCode = 'IT';
		            var SupplierPostalCode = '20122';
		            var SupplierCity = 'MILANO';
		            var SupplierProvince = 'MI';
		            var SupplierAddress = 'CORSO ITALIA 1';
		            
		            var CustID = recObj.getValue('entity');
		            log.debug("CustID:- "+CustID);
		            var CustObj = record.load({ type: 'customer', id: CustID });
		            
		            var CustomerName = CustObj.getValue('custentity_legalname');
		            log.debug("CustomerName:- "+CustomerName);
		            
		            var TaxID = CustObj.getValue('vatregnumber');
		            log.debug("TaxID:- "+TaxID);
		            
		            var CustomerTaxID = (TaxID.replace('IT', '').trim());
		            log.debug("CustomerTaxID:- "+CustomerTaxID);
		            
		            var CustomerCountryCode = CustObj.getValue('billcountry');
		            log.debug("CustomerCountryCode:- "+CustomerCountryCode);
		            var CustomerPostalCode = CustObj.getValue('billzip');
		            log.debug("CustomerPostalCode:- "+CustomerPostalCode);
		            var CustomerCity = CustObj.getValue('billcity');
		            log.debug("CustomerCity:- "+CustomerCity);
					var CustomerProvince = CustObj.getValue('billstate');
		            log.debug("CustomerProvince:- "+CustomerProvince);
		            var CustomerAdditionalAddress = CustObj.getValue('billaddressee') + ',' + CustObj.getValue('billaddr1') + ',' + CustObj.getValue('billaddr2');
		            log.debug("CustomerAdditionalAddress:- "+CustomerAdditionalAddress);
					
		            var InvoiceNumber = recObj.getValue('tranid');
		            log.debug("InvoiceNumber:- "+InvoiceNumber);
		            
		            var IssueDate = recObj.getValue('trandate');
		            //log.debug("IssueDate:- "+IssueDate);		            
		            var day1 = '0'+ (IssueDate.getDate());
		            day1 = right(day1);
		            var monthIndex1 = '0'+ (parseInt(IssueDate.getMonth()) +1);
		            monthIndex1 = right(monthIndex1);
		            var year1 = IssueDate.getFullYear();
		            
		            var InvoiceIssueDate = year1 + '-' + monthIndex1 + '-' + day1;
		            log.debug("InvoiceIssueDate:- "+InvoiceIssueDate);
		            
		            var InvoiceCurrency = recObj.getText('currency');
		            log.debug("InvoiceCurrency:- "+InvoiceCurrency);
		            
		            var PaymentDate = recObj.getValue('duedate');
		            //log.debug("PaymentDate:- "+PaymentDate);		            
		            var day3 = '0'+ (PaymentDate.getDate());
		            day3 = right(day3);
		            var monthIndex3 = '0'+ (parseInt(PaymentDate.getMonth()) +1);
		            monthIndex3 = right(monthIndex3);
		            var year3 = PaymentDate.getFullYear();
		            
		            var InvoicePaymentDate = year3 + '-' + monthIndex3 + '-' + day3;
		            log.debug("InvoicePaymentDate:- "+InvoicePaymentDate);
		            		            
		            var VatItem = new Array();
		    		for(var a = 0; a < 10; a++)
		    		{
		    			VatItem[a] = new Array();
		    			for(var b = 0; b <3; b++)
		    			{ 
		    				VatItem[a][b] = 'x';
		    			}
		    		}
		            
		            var InvoiceSummaryGrossAmount = recObj.getValue('total');
					InvoiceSummaryGrossAmount = roundNumberValue(InvoiceSummaryGrossAmount);
		            log.debug("InvoiceSummaryGrossAmount:- "+InvoiceSummaryGrossAmount);
		            
					var PaymentType = 'TP02'; //TP01-payment by instalments,TP02-full payment,TP03-advance payment
					var PaymentMethod = 'MP05'; // payment methods check at the end
					
					var Matrix = recObj.getValue('custbody_bank_matrix');
		            //log.debug("Matrix:- "+Matrix);
					var MatrixArray = Matrix.split('IBAN');
					//log.debug("MatrixArray:- "+MatrixArray);
					var BankDetails = (MatrixArray[0].replace('Please make payment to Finastra Italy S.r.l. ;', '').trim());
					log.debug("BankDetails:- "+BankDetails);
					var IBANArray = MatrixArray[1].split(' ');
					//log.debug("IBANArray:- "+IBANArray);
					var IBANnumber = '';
					for(var d = 0; d < IBANArray.length; d++)
		    		{
		    			IBANnumber = IBANnumber + IBANArray[d];
		    		}
					//log.debug("IBANnumber:- "+IBANnumber);
					IBANnumber = IBANnumber.trim();
					log.debug("IBANnumber:- "+IBANnumber);
					
		            
		            var authorId = '34524';
		            var recipientEmail = 'shubhradeep.saha@misys.com';
		            var ccEmail = 'shubhradeep.saha@misys.com';
		            var EmailCCid = [ccEmail];

					// initialize report data
					var xmlContent = '';

					xmlContent += '<?xml version="1.0" encoding="utf-8"?>';
					xmlContent += '<FatturaElettronica xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns:xsd="http://www.w3.org/2001/XMLSchema" versione="FPR12" xmlns="http://ivaservizi.agenziaentrate.gov.it/docs/xsd/fatture/v1.2">';
					
					xmlContent += '<FatturaElettronicaHeader xmlns="">';
					
					xmlContent += '<CedentePrestatore>';
					xmlContent += '<DatiAnagrafici>';
					xmlContent += '<IdFiscaleIVA>';
					xmlContent += '<IdPaese>IT</IdPaese>';
					xmlContent += '<IdCodice>'+SupplierTaxID+'</IdCodice>';
					xmlContent += '</IdFiscaleIVA>';
					xmlContent += '<CodiceFiscale>'+SupplierTaxID+'</CodiceFiscale>';
					xmlContent += '<Anagrafica>';
					xmlContent += '<Denominazione>'+SupplierName+'</Denominazione>';
					xmlContent += '</Anagrafica>';
					xmlContent += '<RegimeFiscale>RF01</RegimeFiscale>';
					xmlContent += '</DatiAnagrafici>';
					xmlContent += '<Sede>';
					xmlContent += '<Indirizzo>'+SupplierAddress+'</Indirizzo>';
					xmlContent += '<CAP>'+SupplierPostalCode+'</CAP>';
					xmlContent += '<Comune>'+SupplierCity+'</Comune>';
					xmlContent += '<Provincia>'+SupplierProvince+'</Provincia>';
					xmlContent += '<Nazione>'+SupplierCountryCode+'</Nazione>';
					xmlContent += '</Sede>';
					xmlContent += '</CedentePrestatore>';
					
					xmlContent += '<CessionarioCommittente>';
					xmlContent += '<DatiAnagrafici>';
					xmlContent += '<IdFiscaleIVA>';
					xmlContent += '<IdPaese>IT</IdPaese>';
					xmlContent += '<IdCodice>'+CustomerTaxID+'</IdCodice>';
					xmlContent += '</IdFiscaleIVA>';
					xmlContent += '<CodiceFiscale>'+CustomerTaxID+'</CodiceFiscale>';
					xmlContent += '<Anagrafica>';
					xmlContent += '<Denominazione>'+CustomerName+'</Denominazione>';
					xmlContent += '</Anagrafica>';
					xmlContent += '</DatiAnagrafici>';
					xmlContent += '<Sede>';
					xmlContent += '<Indirizzo>'+CustomerAdditionalAddress+'</Indirizzo>';
					xmlContent += '<CAP>'+CustomerPostalCode+'</CAP>';
					xmlContent += '<Comune>'+CustomerCity+'</Comune>';
					xmlContent += '<Provincia>'+CustomerProvince+'</Provincia>';
					xmlContent += '<Nazione>'+CustomerCountryCode+'</Nazione>';
					xmlContent += '</Sede>';
					xmlContent += '</CessionarioCommittente>';
					
					xmlContent += '<SoggettoEmittente>CC</SoggettoEmittente>';
					
					xmlContent += '</FatturaElettronicaHeader>';
					
					xmlContent += '<FatturaElettronicaBody xmlns="">';
					
					xmlContent += '<DatiGenerali>';
					xmlContent += '<DatiGeneraliDocumento>';
					xmlContent += '<TipoDocumento>TD01</TipoDocumento>'; // TD01 is for Invoice - always same
					xmlContent += '<Divisa>'+InvoiceCurrency+'</Divisa>';
					xmlContent += '<Data>'+InvoiceIssueDate+'</Data>';
					xmlContent += '<Numero>'+InvoiceNumber+'</Numero>';
					xmlContent += '<ImportoTotaleDocumento>'+InvoiceSummaryGrossAmount+'</ImportoTotaleDocumento>';
					xmlContent += '</DatiGeneraliDocumento>';
					xmlContent += '</DatiGenerali>';
					
					xmlContent += '<DatiBeniServizi>';
					
					for( var i = 0; i < LineCount; i++)
					{
						var InvoiceLineNumber = recObj.getSublistValue({sublistId: 'item', fieldId: 'line', line: i});
			            log.debug("InvoiceLineNumber:- "+InvoiceLineNumber);
			            var InvoiceLineDescription = recObj.getSublistValue({sublistId: 'item', fieldId: 'description', line: i});
			            log.debug("InvoiceLineDescription:- "+InvoiceLineDescription);
			            var InvoiceLineQuantity = recObj.getSublistValue({sublistId: 'item', fieldId: 'quantity', line: i});
			            log.debug("InvoiceLineQuantity:- "+InvoiceLineQuantity);
			            
			            var InvoiceLineUnitPrice = recObj.getSublistValue({sublistId: 'item', fieldId: 'rate', line: i});
						InvoiceLineUnitPrice = roundNumberValue(InvoiceLineUnitPrice);
			            log.debug("InvoiceLineUnitPrice:- "+InvoiceLineUnitPrice);
			            
			            var InvoiceLineNetAmount = recObj.getSublistValue({sublistId: 'item', fieldId: 'amount', line: i});
			            InvoiceLineNetAmount = roundNumberValue(InvoiceLineNetAmount);
						log.debug("InvoiceLineNetAmount:- "+InvoiceLineNetAmount);
			            
			            //var InvoiceLineVatPercentage = parseFloat((recObj.getSublistValue({sublistId: 'item', fieldId: 'taxrate1', line: i}))/100);
						var InvoiceLineVatPercentage = parseFloat(recObj.getSublistValue({sublistId: 'item', fieldId: 'taxrate1', line: i}));
						InvoiceLineVatPercentage = roundNumberVAT(InvoiceLineVatPercentage);
			            log.debug("InvoiceLineVatPercentage:- "+InvoiceLineVatPercentage);
			            
			            var InvoiceLineVatAmount = recObj.getSublistValue({sublistId: 'item', fieldId: 'tax1amt', line: i});
						InvoiceLineVatAmount = roundNumberValue(InvoiceLineVatAmount);
			            log.debug("InvoiceLineVatAmount:- "+InvoiceLineVatAmount);
			            
			            var InvoiceLineGrossAmount = recObj.getSublistValue({sublistId: 'item', fieldId: 'grossamt', line: i});
						InvoiceLineGrossAmount = roundNumberValue(InvoiceLineGrossAmount);
			            log.debug("InvoiceLineGrossAmount:- "+InvoiceLineGrossAmount);
			            
			            var LineNo = parseInt(i) + 1;
			            log.debug("LineNo:- "+LineNo);
			            
						xmlContent += '<DettaglioLinee>';
						xmlContent += '<NumeroLinea>'+LineNo+'</NumeroLinea>';
						xmlContent += '<Descrizione>'+InvoiceLineDescription+'</Descrizione>';
						xmlContent += '<Quantita>'+InvoiceLineQuantity+'</Quantita>';
						xmlContent += '<PrezzoUnitario>'+InvoiceLineUnitPrice+'</PrezzoUnitario>';
						xmlContent += '<PrezzoTotale>'+InvoiceLineNetAmount+'</PrezzoTotale>';
						xmlContent += '<AliquotaIVA>'+InvoiceLineVatPercentage+'</AliquotaIVA>';
						xmlContent += '</DettaglioLinee>';
						
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
								var TotalLineVat = parseFloat(LineVat) + parseFloat(InvoiceLineVatAmount);
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
									VatItem[c][2] = InvoiceLineVatAmount;
									break;
								}
							}
						}
					}
					
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
					            log.debug("InvoiceVatRateNetAmount:- "+InvoiceVatRateNetAmount);
					            log.debug("InvoiceVatRateVatAmount:- "+InvoiceVatRateVatAmount);
								
								xmlContent += '<DatiRiepilogo>';
								xmlContent += '<AliquotaIVA>'+InvoiceVatPercentage+'</AliquotaIVA>';
								xmlContent += '<ImponibileImporto>'+InvoiceVatRateNetAmount+'</ImponibileImporto>';
								xmlContent += '<Imposta>'+InvoiceVatRateVatAmount+'</Imposta>';
								xmlContent += '<EsigibilitaIVA>I</EsigibilitaIVA>'; // 
								xmlContent += '</DatiRiepilogo>';
							}
						}
					}
					
					
					xmlContent += '</DatiBeniServizi>';
					
					xmlContent += '<DatiPagamento>';
					xmlContent += '<CondizioniPagamento>'+PaymentType+'</CondizioniPagamento>';
					xmlContent += '<DettaglioPagamento>';
					xmlContent += '<ModalitaPagamento>'+PaymentMethod+'</ModalitaPagamento>';
					xmlContent += '<DataScadenzaPagamento>'+InvoicePaymentDate+'</DataScadenzaPagamento>';
					xmlContent += '<ImportoPagamento>'+InvoiceSummaryGrossAmount+'</ImportoPagamento>';
					xmlContent += '<IstitutoFinanziario>'+BankDetails+'</IstitutoFinanziario>';
					xmlContent += '<IBAN>'+IBANnumber+'</IBAN>';
					xmlContent += '</DettaglioPagamento>';
					xmlContent += '</DatiPagamento>';
					xmlContent += '</FatturaElettronicaBody>';
					xmlContent += '</FatturaElettronica>';
					

					
					// create and save XML file
					var fileObj = file.create({
						name: 'ItalianVAT - ' + InvoiceNumber + '.xml',
						fileType: file.Type.XMLDOC,
						contents: xmlContent
					});
					fileObj.folder = folderId;
					var id = fileObj.save();

					// send export file to recipient email
					var subject = 'Italian VAT - ' + InvoiceNumber;
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

/*
MP01 cash
MP02 cheque
MP03 banker’s draft
MP04 cash at Treasury
MP05 bank transfer
MP06 money order
MP07 pre-compiled bank payment slip
MP08 paymant card
MP09 direct debit
MP10 utilities direct debit
MP11 fast direct debit
MP12 collection order
MP13 payment by notice
MP14 tax office quittance
MP15 transfer on special accounting account
MP16 order for direct payment from bank account
MP17 order for direct payment from post office account
MP18 bulletin postal account
MP19 SEPA Direct Debit
MP20 SEPA Direct Debit CORE
MP21 SEPA Direct Debit B2B
MP22 Deduction on sums already collected
*/