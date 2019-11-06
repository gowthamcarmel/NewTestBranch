/*
	Misys VAT Sweep
	
	This script checks if the VAt Registration Number of a Customer is 
	valid. This checks it against VIES website (http://ec.europa.eu/taxation_customs/vies/)
	and is available only for the following countries as of 5-Feb-2017: 
	AT, BE, BG, CY, CZ, DE, DK, EE, EL, ES, FI, FR, HR, HU, IE, IT, LU, LV, LT, MT, NL,
	PL, PT, RO, SE, SI, SK, GB
	
	ueVATcheck:
	this function triggers on afterSubmit event of a customer record and performs the VAT check
	against the VIES website of the customer's VAT.

	Notes:
	- around 60 or less customer records are updated on a daily basis as of 6-Feb-2017

	- if default billing address is not same country as VAT RegNum base
	country then this can produce false positives. Advise CF team

	- if VAT number is changed incorrectly to trigger a valid tick,
	script will not run again on customer record, unless LAst Vat Sweep Date is cleared
	
	In Case VIES website starts blocking Netsuite requests:
	ITSM.VIESWEB@itsmtaxud.europa.eu
	TAXUD-VIESWEB@ec.europa.eu
	We would like to inform you that the IP address 167.216.131.254 of NetSuite Company had been performing a huge number of requests for two months (06/11/2015). As of 19/11/2015, this IP performed over 100.000 requests per day through the VIES on the Web service (http://ec.europa.eu/taxation_customs/vies/). However, taking into account all issues at stake and in view of facilitating your request, we will release the IP; yet we propose that:
	1.     you perform 30k or less requests for VAT validations per day,
	2.     preferably until 10:00 am CET and/or after 18:00 CET, and
	3.     you provide us with a contact point in your company in case of emergency or unexpected event when there is need to intervene, and
	4.     you also provide us with a list of  the IPs that you plan to do validations from,
	then we can ensure that you perform your validations without any blocking on our behalf.
	In addition, in case of an unexpected event whereby we will be forced to stop your validations, you will be informed beforehand. 

 */

var euCountries = ['AT', 'BE', 'BG', 'CY', 'CZ', 'DE', 'DK', 'EE', 'EL', 'ES', 'FI', 'FR', 'HR', 'HU', 'IE', 'IT', 'LU', 'LV', 'LT', 'MT', 'NL', 'PL', 'PT', 'RO', 'SE', 'SI', 'SK', 'GB'];
var serviceURL = 'http://ec.europa.eu/taxation_customs/vies/services/checkVatService';
var headers = new Array();

//function VATSweep(){
	// there is a limit to number of VAT validation calls that can be done via VIES
	// we should not hit this limit

	// do an initial sweep
	// tag when 
//	getVATChangedCustomers();
//	checkCustomersVATRegNoAgainstWebService();
//} 

function ueVATcheck(){
	var today = new Date();
	var rec = nlapiLoadRecord( nlapiGetRecordType(), nlapiGetRecordId() );
	var billCountryCode = rec.getFieldValue('billcountry');
	var vatRegNumber = rec.getFieldValue('vatregnumber');
	nlapiLogExecution('AUDIT', 'VAT Check Log', 'ID:' + nlapiGetRecordId() + ', billcountry:' + billCountryCode + ', vatnum:' + vatRegNumber + ', indexEu:' + euCountries.indexOf(billCountryCode));
	
	var dateNow = today.getDate() + '-' + misysMonth[today.getMonth()] + '-' + today.getFullYear();

	if( vatRegNumber != '' && euCountries.indexOf(billCountryCode) >= 0 ){
		var lastVatchecked = nlapiStringToDate(rec.getFieldValue('custentity_msys_vatsweep_date'));
		if( (today - lastVatchecked) > 0 ){
			vatRegNumber = parseVATNumberForRequest( billCountryCode, vatRegNumber );
			var vatvalidVar = checkVATNumberOKService(billCountryCode, vatRegNumber);
			nlapiLogExecution('AUDIT', 'vatvalidVar', vatvalidVar);
			if(  vatvalidVar != 'N/A' ){
				if( vatvalidVar == 'T'){
					rec.setFieldValue('custentity_msys_vatvalid', 'T');
				}else if( vatvalidVar == 'F' ){
					rec.setFieldValue('custentity_msys_vatvalid', 'F');
				}
				rec.setFieldValue('custentity_msys_vatsweep_date', dateNow);
				nlapiSubmitRecord( rec );
			}
		}
	}
}


function checkVATNumberOKService(billToCountry, VATNo){	
	var retVal = 'N/A';
	var bodyStr = '';

	try{
		setupSOAPRequest( billToCountry, VATNo );
		setupHeaders();

		//connecting to the euro vat number checker
		nlapiLogExecution('AUDIT', 'serviceURL', serviceURL); 
		nlapiLogExecution('AUDIT', 'soapRequest', soapRequest); 
		nlapiLogExecution('AUDIT', 'headers', headers); 
		
		responseObject = nlapiRequestURL(serviceURL,soapRequest,headers,'POST');

		// throws error email if soap response is not successful.
		if(responseObject != null){
			bodyStr = responseObject.getBody ();
			nlapiLogExecution('AUDIT', 'response code: ' + responseObject.getCode(), 'response body: ' + bodyStr );
			
			if (responseObject.getCode() != '200'){
				// retry connecting to the euro vat number checker
				responseObject = nlapiRequestURL(serviceURL,soapRequest,headers,'POST');

				if(responseObject != null){
					bodyStr = responseObject.getBody ();

					if (responseObject.getCode() != '200'){
						nlapiLogExecution('AUDIT','SOAP request failed.','Return code was not 200 - this means the Europa check Vat Service has failed.');
						retVal = 'N/A';
					} else {
						if(bodyStr.indexOf("true") >= 0){
							nlapiLogExecution('AUDIT', '1', bodyStr.indexOf("true"));
							retVal = 'T';
						}

						if(bodyStr.indexOf("false")!=-1){
							retVal = 'F';
						}
					}
				} else {
					nlapiLogExecution('AUDIT','SOAP request failed.','Return code was not 200 - this means the Europa check Vat Service has failed.');
					retVal = 'N/A';	
				}
			} else {
				if(bodyStr.indexOf("true") >= 0){
					nlapiLogExecution('AUDIT', '2', bodyStr.indexOf("true"));
					retVal = 'T';
				}

				if(bodyStr.indexOf("false")!=-1){
					retVal = 'F';
				}
			}
		} else {
			nlapiLogExecution('AUDIT','SOAP request failed.','Return code was not 200 - this means the Europa check Vat Service has failed.');
			retVal = 'N/A';	
		}
	}catch(e){
		_errorHandler("checkVATNumberOKService", e);
	}
	return retVal;
}

function setupSOAPRequest(countryCode, VATNum){
	try{
		soapRequest = '<?xml version=\"1.0\" encoding=\"UTF-8\" standalone="no"?>'+
		'<SOAP-ENV:Envelope xmlns:SOAPSDK1="http://www.w3.org/2001/XMLSchema" xmlns:SOAPSDK2="http://www.w3.org/2001/XMLSchema-instance" xmlns:SOAPSDK3="http://schemas.xmlsoap.org/soap/encoding/" xmlns:SOAP-ENV="http://schemas.xmlsoap.org/soap/envelope/">'+
		'<SOAP-ENV:Body>'+
		'<checkVat xmlns="urn:ec.europa.eu:taxud:vies:services:checkVat:types">'+
		'<countryCode xmlns:SOAPSDK4="urn:ec.europa.eu:taxud:vies:services:checkVat:types">' + countryCode + '</countryCode>'+
		'<vatNumber xmlns:SOAPSDK5="urn:ec.europa.eu:taxud:vies:services:checkVat:types">' + VATNum + '</vatNumber>'+
		'</checkVat>'+
		'</SOAP-ENV:Body>'+
		'</SOAP-ENV:Envelope>';

	} catch(e){
		_errorHandler('setupSOAPRequest', e);
	}
}

function parseVATNumberForRequest( billCountryCode, inputvatnumber ){
	var tempVatNumber = '';
	try{
		tempVatNumber = inputvatnumber.replace(/[^\w]/g, '');
		var countryPrefixed = tempVatNumber.indexOf(billCountryCode, 0);
		if(countryPrefixed!=-1) {
			tempVatNumber = tempVatNumber.substring(2,tempVatNumber.length);
		}		
	}
	catch (e){
		_errorHandler('parseVATNumberForRequest', e);
	}

	nlapiLogExecution('AUDIT', 'parseVATNumberForRequest VATNumber', tempVatNumber);	
	return tempVatNumber;
}

function setupHeaders(){
	try{
		headers['Content-type'] =  "text/xml charset=\"UTF-8\"";
		headers['User-Agent'] = 'SOAP Toolkit 3.0';
		headers['Authorization'] = '';
		headers['SOAPAction'] = "";
		headers['Host'] = 'ec.europa.eu';
		headers['Pragma'] = 'no-cache';
	} catch(e) {
		_errorHandler('setupHeaders', e);
	}
}
