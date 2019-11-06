/*
		Email Capture CSV Importer
		- this script enables CSV import to be triggered using the Email Capture plugin
		It supports multiple file attachments and the possibility of triggering a script
		after the import has been initiated. 
		
		by: Lazyboy LoBS ( eolaguir ) All rights reserved 2015
		v.1.0.2

BUNDLE DESCRIPTION and CHANGELOG
This script uses the Email Capture Plugin to trigger a pre-defined CSV Import with the attached CSV file on the incoming email.

A configuration record is used to define the execution parameters so the user can define multiple rules for incoming emails to CSV import mapping.

Changelog
Version 1.0.4 - (03.10.2017)
- allow PDF import management

Version 1.0.3 - (11.11.2015)
- enables capture of email subject regardless of word order

Version 1.0.2 - (08.11.2015)
- added option to send a confirmation email upon successful import of CSV file to the sender email address

Version 1.0.1 - (08.05.2015)
- added Suitelet which can be deployed to provide users with a one-click trigger for either the SO or the IF Generation scripts.

*/

//var SCHED_SCRIPT_ID = 'customscript_import_gms_invoices';
var SCHED_SCRIPT_ID = 'customscript_ach_import';


function process(email) {
	// log script start time
	var t1 = new Date();
	
	// Initialize values
	var context = nlapiGetContext();
	var sysEnv = context.getEnvironment();
	var emailFromAddress = email.getFrom().getEmail();
	var emailDate = email.getSentDate(); 
	var emailSubject = email.getSubject();
	var emailBody = email.getTextBody();
	var importMappingData = null;
	var importName = "";
	var importId = "";
	var folderId = "";
	var testFlag = "";
	var reportRecipientId = "";
	var senderEmail = "";
	var emailBodyKeys = "";
	var suiteletId = "";
	var suiteletDepId = "";
	var receiptAck = 'F';	
	
	nlapiLogExecution('DEBUG','Email Data','emailSubject:' + emailSubject + ', emailBody:' + emailBody + ', emailFromAddress:' + emailFromAddress);
	
	// begin 1.0.3
	var initFilters = [];
	var stringEmailSubject = emailSubject.split(" ");
	
	initFilters.push( new nlobjSearchFilter('isinactive',  null, 'is', 'F') );
	for( var i = 0; i < stringEmailSubject.length; i++ ){
		initFilters.push( new nlobjSearchFilter('custrecord_email_subj_keys', null, 'contains', stringEmailSubject[i] ) );
	}
	// end 1.0.3
	
	nlapiLogExecution('DEBUG','Search Import Mapping','');

	importMappingData = nlapiSearchRecord('customrecord_nsa_emlplugin_map',null, initFilters,[new nlobjSearchColumn('custrecord_email_subj_keys'), new nlobjSearchColumn('custrecord_sender_email'), new nlobjSearchColumn('custrecord_email_mess_param'), new nlobjSearchColumn('custrecord_import_id'), new nlobjSearchColumn('custrecord_upload_folder'), new nlobjSearchColumn('custrecord_error_report_author'), new nlobjSearchColumn('custrecord_error_report_recipient'), new nlobjSearchColumn('custrecord_is_testing'), new nlobjSearchColumn('custrecord_import_suitelet_id'), new nlobjSearchColumn('custrecord_import_scr_dep_id'), new nlobjSearchColumn('custrecord_import_sndrecpt')]);
	
	if (importMappingData!=null){
	
		nlapiLogExecution('DEBUG','Import Definition Found',emailSubject);
		
		for(var i=0; i< importMappingData.length; i++){
			importName = importMappingData[i].getValue('custrecord_email_subj_keys');
			senderEmail = importMappingData[i].getValue('custrecord_sender_email');
			emailBodyKeys = importMappingData[i].getValue('custrecord_email_mess_param');
			importId = importMappingData[i].getValue('custrecord_import_id');
			folderId = importMappingData[i].getValue('custrecord_upload_folder');
			reportAuthorId = importMappingData[i].getValue('custrecord_error_report_author');
			reportRecipientId = importMappingData[i].getValue('custrecord_error_report_recipient');
			testFlag = importMappingData[i].getValue('custrecord_is_testing');
			suiteletId = importMappingData[i].getValue('custrecord_import_suitelet_id');
			suiteletDepId = importMappingData[i].getValue('custrecord_import_scr_dep_id');
			receiptAck = importMappingData[i].getValue('custrecord_import_sndrecpt');
		}
	}
	
	var senderEmailValid = 1;
	if(senderEmail != "" ){
		//senderEmailValid = findWord(senderEmail,emailFromAddress);
		senderEmailValid = 1; 
	}else{ 
		senderEmailValid = 1; 
	}
	
	var emailBodyValid = 0;
	if(emailBodyKeys != ""){
	//	emailBodyValid = findWord(emailBodyKeys,emailBody);
		emailBodyValid = 1; 
	}else{ 
		emailBodyValid = 1; 
	}
	
	if(testFlag=='T'){nlapiLogExecution('DEBUG','Is Message Valid','senderEmailValid:' + senderEmailValid + ', emailBodyValid:' + emailBodyValid);}
	
	//if(senderEmailValid == 1 && emailBodyValid == 1){
	if(senderEmailValid == 1){
		var reportRecipient = nlapiLookupField('employee',reportRecipientId,'email');
		var attachments = email.getAttachments();
		for (var indexAtt in attachments){
			processAttachment(importName, attachments[indexAtt], folderId, importId, testFlag, emailFromAddress, reportRecipient, reportAuthorId, receiptAck);
		}
	}
	
	if(testFlag!='T'){
	if(suiteletId != "" && suiteletDepId != ""){
		nlapiLogExecution('DEBUG','Script Call found','ID:' + suiteletId);
		//var urlServlet = nlapiResolveURL('SUITELET', suiteletId, suiteletDepId, true);
	//	nlapiScheduleScript(suiteletId,suiteletDepId);
		//nlapiLogExecution('DEBUG','urlServlet',urlServlet);
		//var responseSuitelCall = nlapiRequestURL(urlServlet, null, null);
		//nlapiLogExecution('DEBUG','RequestURL Response',responseSuitelCall.getBody());
	}}
	
	// log script execution time
	var t2 = new Date();
	var dif = t1.getTime() - t2.getTime();
	var Seconds_from_T1_to_T2 = dif / 1000;
	var runtime = Math.abs(Seconds_from_T1_to_T2);
	nlapiLogExecution('DEBUG','*** Script Runtime ***','Runtime in Seconds: ' + runtime);
}

function findWord(inputString,searchWord){
	var stringWordListArray = inputString.split(',');
	if (stringWordListArray.indexOf(searchWord) >= 0){
		return 1;
	}else{
		return 0;
	}
}

function processAttachment(importName, attachment, folderId, importId, testFlag, emailFromAddress, reportRecipient, reportAuthorId, receiptAck){
	var fileName = attachment.getName();  
	var fileNameArray = fileName.split('.');
	var fileType = attachment.getType();
	if(testFlag=='T'){nlapiLogExecution('DEBUG','Begin Processing Attachments','Filetype:' + fileType + ', Filename:' + fileName);}
	var isFilenameValid = CheckFileNameFormate(fileName);
	var isFileDuplicate = CheckDuplicateFileName(fileName);
	
	nlapiLogExecution('DEBUG','Debug Values','isFilenameValid:' + isFilenameValid + ', isFileDuplicate:' + isFileDuplicate );
	
	if(isFilenameValid == true ){
		
		if(isFileDuplicate == true)
			{
	
	// CSV File Attachment handling
	if(fileType == 'MISCBINARY' || fileType == 'CSV'){
		if(testFlag == 'T'){
			nlapiLogExecution('DEBUG','Debug Values','importName:' + importName + ', folderId:' + folderId + ', importId:' + importId + ', emailFromAddress:' + emailFromAddress + ', reportRecipient:' + reportRecipient + ', reportAuthorId:' + reportAuthorId + ', fileName:' + fileNameArray[0] + getDateToday() + '.csv'+ ', receiptAck:' + receiptAck )
		}
		var file = attachment;
		file.setName(fileNameArray[0] + getDateToday() + '.csv');
		file.setFolder(folderId); 
		var fileID = nlapiSubmitFile(file);
      nlapiLogExecution('DEBUG','*** File ID ***',fileID);
		//if(testFlag == 'F'){
			/*var fileCsvImport = nlapiCreateCSVImport();
			fileCsvImport.setMapping(importId);
			fileCsvImport.setPrimaryFile(nlapiLoadFile(fileID));
			fileCsvImport.setOption("jobName", "Import " + importName);
		var x = 	nlapiSubmitCSVImport(fileCsvImport);
		 nlapiLogExecution('DEBUG','*** x ***',x);*/
			var params = new Array();
    	    params['custscript_ach_fileid'] = fileID;
    	    params['custscript_ach_importid'] = importId;
    	  
    	   
    	       	    	 
    	    var stStatus = nlapiScheduleScript(SCHED_SCRIPT_ID, null, params);
    	    nlapiLogExecution('DEBUG', 'Schedule Script -', 'Scheduled Script Status = ' + stStatus);
							
	//	}
      
   /*   var record = nlapiCreateRecord( 'customrecord_ach_files');
      record.setFieldValue( 'custrecord_ach_file', fileID);
     var idach = nlapiSubmitRecord(record, true);  
     
     nlapiLogExecution('DEBUG','*** idach ***',idach);*/
  	
		if( receiptAck == 'T' ){
			nlapiSendEmail( reportAuthorId, emailFromAddress, 'CASS CSV File Received Successfully', 'We have received the CSV file : '+ fileNameArray[0]  +' you sent and we are now processing it. Thank you!');
		}
	}else if(fileType == 'PDF'){
	// PDF File Attachment Handling
		if(testFlag == 'T'){
			nlapiLogExecution('DEBUG','Debug Values','importName:' + importName + ', folderId:' + folderId + ', importId:' + importId + ', emailFromAddress:' + emailFromAddress + ', reportRecipient:' + reportRecipient + ', reportAuthorId:' + reportAuthorId + ', fileName:' + fileNameArray[0] + '.pdf')
		}
		var file = attachment;
		file.setName(fileNameArray[0] + '.pdf');
		file.setFolder(folderId); 
		var fileID = nlapiSubmitFile(file);

		if( receiptAck == 'T' ){
			nlapiSendEmail( reportAuthorId, emailFromAddress, 'File Received Successfully', 'Hi Team \n\nWe have received the file(s) you sent and are now processing it for import. Thank you! \n\n Regards\n Netsuite Team \n');
		}

	} else {	
		nlapiLogExecution('DEBUG','*** Invalid File Type ***',fileType);
		sendError('Invalid File Type: ' + fileType, importName, emailFromAddress, reportRecipient, reportAuthorId);
	    
	}
}else
	{
	nlapiLogExecution('DEBUG','*** Duplicate File: ***',fileName);
	sendError('Duplicate File: ' + fileName, importName, emailFromAddress, reportRecipient, reportAuthorId);

	}
		}
	else
	{
		nlapiLogExecution('DEBUG','*** Invalid File formate ***',fileName);
		sendError('Invalid File formate: ' + fileName, importName, emailFromAddress, reportRecipient, reportAuthorId);
	}
}
function sendError(errorMessage, importName, emailFromAddress, reportRecipient, reportAuthorId){
	try{
		nlapiSendEmail(reportAuthorId,reportRecipient,'Error Processing Email Capture CSV :' + errorMessage ,'Hi Team\n\nThere was an error processing CSV file ' + importName + ' from ' + emailFromAddress+'\n\nRegards\nNetsuite Team\n', null, null, null, null);
	}catch(e){
		errorHandler('sendError', e);		
	}
}

function getDateToday(){
	var today = new Date();
	var dd = today.getDate();
	var mm = today.getMonth()+1; 
	var yyyy = today.getFullYear();
	var hh = addZero(today.getHours());
    var min = addZero(today.getMinutes());
    var ss = addZero(today.getSeconds());
	if(dd<10){
		dd='0'+dd;
	} 
	if(mm<10){
		mm='0'+mm;
	} 
	today = yyyy+'_'+mm+'_'+dd+'_'+hh+'_'+min+'_'+ss;
	return today;
}

function addZero(i) {
    if (i < 10) {
        i = "0" + i;
    }
    return i;
}

function errorHandler(errorSource, e){
	var errorMessage='';
	errorMessage = getErrorMessage(e);
	nlapiLogExecution( 'ERROR', 'Unexpected Error: ' + errorSource , errorMessage);
	return errorMessage;
}

function getErrorMessage(e){
	var retVal='';
	if ( e instanceof nlobjError ){
		retVal =  e.getCode() + '\n' + e.getDetails();
	}else{
		retVal= e.toString();
	}
	return retVal;
}

function invokeConversionAdHoc( request, response ){
	// log script start time
	var t1 = new Date();
	
	var context = nlapiGetContext();
	var scriptId = "";
	var scriptDepId = "";
	var pageTitle = "";
	scriptId = context.getSetting('SCRIPT', 'custscript_adhoc_sId');
	scriptDepId = context.getSetting('SCRIPT', 'custscript_adhoc_dId');
	pageTitle = context.getSetting('SCRIPT', 'custscript_adhoc_pTitle');
	
	if( scriptId && scriptDepId ){
		nlapiScheduleScript( scriptId, scriptDepId );
	}
	
	var form = nlapiCreateForm( pageTitle );
	var header = form.addField('custpage_header_mess','inlinehtml');
	header.setDefaultValue('<br/>The Script has been ran. <a href="/app/common/scripting/scriptstatus.nl?daterange=TODAY&queueid=&sortcol=dcreated&sortdir=DESC&datemodi=WITHIN&date=TODAY" target="_blank"> Please click here </a> to view status ( Note: The link may require additional privileges )<br/>');
	header.setLayoutType('normal', 'startcol');
	
	response.writePage( form );
	
	// log script execution time
	var t2 = new Date();
	var dif = t1.getTime() - t2.getTime();
	var Seconds_from_T1_to_T2 = dif / 1000;
	var runtime = Math.abs( Seconds_from_T1_to_T2 );
	logme( '*** Script Runtime ***', 'Runtime in Seconds: ' + runtime );	
}

function logme( log1, log2 ){
	nlapiLogExecution( 'DEBUG', log1, log2 );
}
function CheckFileNameFormate(fileName)
{
	/*var firstName = fileName.split('_');
	
	if(firstName[0] == 'AP4635')
		{
		return true;
		}
	else
		{
		return false;
		}*/
	
	return true;
	
}
function CheckDuplicateFileName(fileName)

{
	
	nlapiLogExecution('DEBUG','Debug Values','fileName:' + fileName);
	
	/*var filter = [];
	filter.push( new nlobjSearchFilter('custrecord_casshdr_filename',  null, 'is', fileName) );
	var fileHeaderRecord = nlapiSearchRecord('customrecord_cass_fileheader',null, filter,[new nlobjSearchColumn('custrecord_casshdr_filename'), new nlobjSearchColumn('internalid')]);
	

	
	if (fileHeaderRecord!=null)
	{
		return false;
	}
	else
		{
		return true;
		}
	*/
	
	return true;
}
