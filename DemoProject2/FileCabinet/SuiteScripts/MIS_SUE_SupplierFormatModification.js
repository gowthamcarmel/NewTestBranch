/*
 * Author:	     alexander.hughsam
 * Date:	       November 28th, 2013
 ***********************************************************************/
var PROCESSED_STATUS = 4;
/**
 * Calls the checkBankAccount method
 * @return nothing
 */
function beforeLoad_supplierformatmodification(){
    checkBankAccount();
}

/**
 * This function will verify if the bank account matches the bank account of the parameter
 * If they match, it calls the modifySupplierFormat method
 *
 * @return nothing
 */
function checkBankAccount(){
    // Gets the status of the Payment File Administration
    var status = nlapiGetFieldValue('custrecord_2663_file_processed');
    
    var bankDetailId = nlapiGetFieldValue('custrecord_2663_bank_account');
    // This gets the bank account ID 
    var account = null;
    if (bankDetailId != null && bankDetailId != '') {
        account = nlapiLookupField('customrecord_2663_bank_details', bankDetailId, 'custrecord_2663_gl_bank_account');
    }
    
    // This gets the bank account ID that is passed from the parameter
    var bankAccount = nlapiGetContext().getSetting('SCRIPT', 'custscript_bankaccount');
    //nlapiLogExecution('debug', 'bank accounts', 'account:' + account + ' bankAccount:' + bankAccount);
    // Start only if the status is 'processed' AND
    // if the account parameter is the same as the bank account ID of the payment file administration	
    if ((status == PROCESSED_STATUS) && (account == bankAccount)) {
    
        // modify the supplier format
        modifySupplierFormat();
    }
}

/**
 * This function will go through all the lines
 * It will then set the first lines with the lines starting with 'INC'
 * The second set of lines to be the line starting with 'A'
 * And then the final line to be the line starting with 'T'
 *
 * @return nothing
 */
function modifySupplierFormat(){
	
	try{
    var fileRef = nlapiGetFieldValue('custrecord_2663_file_ref');
    // Only works if the file_reference is not null or empty
    if (fileRef != null && fileRef != "") {
        // This opens the file and puts each line of the text file into an array
        var file = nlapiLoadFile(nlapiGetFieldValue('custrecord_2663_file_ref'));
        nlapiLogExecution('DEBUG', 'Loaded File');
        var data = file.getValue();
        var lines = data.split('\n');
        
        // Initializes variables
        
        // Only works if the lines array is not null AND not only one line
        if (lines != null && lines != '') {
            linesLength = lines.length;
            
            // Initialize three line arrays
            var iChar = [];
            var aChar = [];
            var tChar = [];
            var other = [];
            var transactionCount = '00000';
            var transactionAmount = '00000000000000000.00';
            
            // Go through each line
            for (var i = 0; i < linesLength; i++) {
                var firstChar = lines[i].charAt(0);
                switch (firstChar) {
                    case 'I':
                        iChar.push(lines[i]);
                        break;
                    case 'A':
                        aChar.push(lines[i]);
                        break;
                    case 'T':
                        tChar.push(lines[i]);
                        transactionCount = lines[i].substring(1, 6);
                        transactionAmount = lines[i].substring(6, 27);
                        break;
                    default:
                        var firstCharCode = lines[i].charCodeAt(0);
                        if (firstCharCode != 13 && !isNaN(firstCharCode)) {
                            nlapiLogExecution('debug', 'firstchar', lines[i].charCodeAt(0));                            
                            other.push(lines[i]);
                        }
                        break;
                }
            }
            for (var k = 0; k < other.length; k++) {
                if (other[k].charAt(0) == 'P') {
                    var tempStr = other[k].substring(0, 32) + transactionCount + transactionAmount;
                    other[k] = tempStr;
                    break;
                }
            }

            // Go through all the character arrays and put them back in the lines array
            var content = '';
            var newLines = [];
            for (var j = 0; j < linesLength; j++) {
                if (other.length != 0) {
                	content = other.shift();
                } else if (iChar.length != 0) {
                	content = iChar.shift(); // Shift returns the first element in the array
                } else if (aChar.length != 0) {
                	content = aChar.shift(); // Shift returns the first element in the array
                } else {
                    // tChar Array
                	if(tChar.length != 0){
                		content = tChar.shift(); // Shift returns the first element in the array	
                	}else{
                		continue;
                	}
                }
                
            	nlapiLogExecution('debug', 'content', content.length);
            	newLines.push(content);
            }
           
            
            // update the file with the new data containing the hash total at the end of the file
            var fileBody = newLines.join('\n');
            
            nlapiLogExecution('debug', 'fileBody', fileBody.replace(/\n/g, '<br/>'));
            updateFile(fileBody, file);
        }
        
    }
}
  catch(e)
	{
		  nlapiLogExecution('DEBUG', 'Exception',e.toString());
	}
}
	

/**
 * This function will receive the data it needs to put in the file.
 * It will then update the old file with the new data. It then gives it the 'custrecord_2663_file_ref' field value.
 *
 * @return nothing
 */
function updateFile(data, file){
    var dataNew = data;
    var id = file.getId();
    //var fileName = file.getName();
    var processedDateStr = nlapiGetFieldValue('custrecord_2663_process_date');
    var processedDate = nlapiStringToDate(processedDateStr);
    
    var batchNumber = nlapiGetFieldValue('id');
    
    //UPD: JSALCEDO 1/30/2014
    //The script contains logic to rename the file name.  The naming logic needs to pull the file name from the Header line of the file.
    //Specifics:  Header Line HMS422001.018MS42 – the field between H and MS42 should be the file name.
    var lines = data.split('\n');
    var header = lines[0];
    nlapiLogExecution('debug', 'header', header);
    //var fileName = 'MS42' + processedDate.getDate() + (parseInt(processedDate.getMonth(), 10) + 1) + '.' + batchNumber;
    var fileName = header.match(/H(.*)MS42/)[1];
    //END
    
    
    nlapiLogExecution('debug', 'File Name', fileName);
    // Updates the file with the new data
    var newFile = nlapiCreateFile(fileName, 'PLAINTEXT', dataNew);
    newFile.setFolder(file.getFolder());
    newFile.setName(fileName);
    var newId = nlapiSubmitFile(newFile);
    
    nlapiSubmitField(nlapiGetRecordType(), nlapiGetRecordId(), 'custrecord_2663_file_ref', newId);
    nlapiLogExecution('debug', 'fileId', newId);
}
