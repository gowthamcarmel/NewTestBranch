/*

*/
function sendEmailSched(){
	// check first if user triggered send email process
	var startProcEmail = _genericSearch('customrecord_msys_script_params', 'name', 'GMS_START_EMAIL');

	var context = nlapiGetContext();

	if( startProcEmail[1] == '1'){
		var authorId = context.getSetting('SCRIPT', 'custscript_gms_eml_sender1');
		var errorRecipientEmail = context.getSetting('SCRIPT', 'custscript_gms_eml_errmail1');
		var subjectEmail = context.getSetting('SCRIPT', 'custscript_gms_eml_subject1');
		var bodyEmail = context.getSetting('SCRIPT', 'custscript_gms_eml_body1');

		nlapiLogExecution('DEBUG', 'Entered Script', 'Author:'+ authorId + ', Subject:'+ subjectEmail);
		
		try {
			var searchResults = nlapiSearchRecord(null, 'customsearch_gms_inv_eml_scr');
			nlapiLogExecution('DEBUG', 'Records to process', searchResults.length );

			//check if no more results, if no more result then set parameter value to 0
			if( searchResults.length > 0 ){
				for (var i = 0; i < searchResults.length; i++) {
					var invoiceNumber = searchResults[i].getValue('internalid');
					var contactEmail = searchResults[i].getValue('custentity_gms_email','customermain');
					contactEmail = contactEmail + ',CMS.Billing@misys.com';
					var currPdfId = searchResults[i].getValue('custbody_gms_inv_file');
					var invEntity = searchResults[i].getValue('entity');

					nlapiLogExecution('DEBUG', 'Invoice ID: ' + invoiceNumber, 'Customer:' + invEntity + 'Email: ' + contactEmail + ', PDFid: ' + currPdfId );

					//if GMS Contact email is not blank, send email and mark PDF Doc Sent as TRUE
					if( contactEmail ){
						nlapiLogExecution('DEBUG', 'Attempting to send email.', '')	
						
						var fileObj = nlapiLoadFile( currPdfId );
						var recordsAtt = new Object();
   						recordsAtt['entity'] = invEntity;

						nlapiSendEmail(authorId, contactEmail, subjectEmail, bodyEmail, null, null, recordsAtt, fileObj);

						nlapiLogExecution('DEBUG', 'Email Sent! Setting Flag', '');

						nlapiSubmitField('invoice', invoiceNumber, 'custbody_pdf_sent', 'T');
					}
				}
			} else {
				nlapiSubmitField( 'customrecord_msys_script_params', startProcEmail[0], 'custrecord_msys_paramval', '0' );
			}


		} catch (e) {
			_errorHandler("execute", e);
			var subject = 'GMS PDF Invoice processing failed';
			
			nlapiSendEmail( authorId, errorRecipientEmail, 'GMS Invoice PDF Email Error Notification', 'We encountered the following error while sending the GMS Invoice PDF Emails: ' +
				'\n\n' + JSON.stringify(e) );
		}
	}
}

function _genericSearch(table, fieldToSearch, valueToSearch){
	var resData=[];
	var internalID = null;
	var paramValueStr = null;

	// Arrays
	var searchFilters = new Array();
	var searchColumns = new Array();

	try{
		//search filters                  
		searchFilters[0] = new nlobjSearchFilter(fieldToSearch, null, 'is',valueToSearch);                          

		// return columns
		searchColumns[0] = new nlobjSearchColumn('internalid');
		searchColumns[1] = new nlobjSearchColumn('custrecord_msys_paramval');

		// perform search
		var searchResults = nlapiSearchRecord(table, null, searchFilters, searchColumns);

		if(searchResults!=null){
			if(searchResults.length>0){
				searchResult = searchResults[ 0 ];
				internalID = searchResult.getValue('internalid');
				paramValueStr = searchResult.getValue('custrecord_msys_paramval');
			}
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
		var searchResults = nlapiSearchRecord( 'invoice', null,
			[ (new nlobjSearchFilter('mainline', null, 'is', 'F')), (new nlobjSearchFilter('memo', null, 'contains', gmsInvoiceNum )) ],
			[ (new nlobjSearchColumn('internalid'))
			 ,(new nlobjSearchColumn('tranid')) ] );

		for (var i = 0; i < searchResults.length; i++) {
			internalID = searchResults[i].getValue( 'internalid' );
		}

	}catch(e){
		_errorHandler("searchInvoice", e);
	}     	      
	return internalID;
}

function _errorHandler(errorSource, e){
	var errorMessage='';
	nlapiLogExecution('ERROR', 'unexpected error: ' + errorSource , e.message);
	return errorMessage;
}
