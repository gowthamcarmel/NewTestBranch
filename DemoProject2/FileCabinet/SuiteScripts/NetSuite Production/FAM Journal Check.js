/**
 * Module Description
 * 
 * Version    Date            Author           Remarks
 * 1.00       23 Feb 2015     anduggal
 *
 */

/**
 * Changed by Gowthaman 
 * Description of Change : FAM journals auto approval issue fixed
 * Date: 27/04/2016
 */

/**
 * @returns {Void} Any or no return value
 */
function checkFAMJournal() {
	try{
	
		var FAMJournal = null;
	//var journalRec = nlapiGetNewRecord();
	var journalid = nlapiGetRecordId();
	nlapiLogExecution('DEBUG', 'journalid', 'ID :' +journalid);
var journalRec = nlapiGetNewRecord();
	
	var memo = journalRec.getLineItemValue('line', 'memo', '1');
	if (memo != null) {
		var jnlTyp = journalRec.getFieldValue('custbody_mys_journal_type');
		if ((memo.indexOf('FAM') !== -1 || memo.indexOf('Void Of Bill Payment') !== -1) || isEmpty(jnlTyp)) {
			nlapiLogExecution('DEBUG', 'FAM1', 'before setting approved');
			//journalRec.setFieldValue('approved', 'T'); // Reetesh 18/11/2015
			//var s = nlapiSubmitField('journalentry',journalid,'approved', 'T');
			nlapiLogExecution('DEBUG', 'FAM1', 'before setting approved');
			FAMJournal = 'T';
			 //nlapiSubmitField('journalentry',journalid,'approved', 'T');
			nlapiSetFieldValue('approved', 'T');
			//nlapiSubmitRecord(journalRec);
		}
		else {
			
			FAMJournal = 'F';
			nlapiLogExecution('DEBUG', 'FAM2', '2 ');
		}
	}
	else {
		FAMJournal = 'F';
		nlapiLogExecution('DEBUG', 'FAM3', '3 ');
	}
 //   nlapiLogExecution('DEBUG', 'Approved', journalRec.getFieldValue('approved')); // Reetesh 18/11/2015
	return FAMJournal;
	}
	catch(e)
	{
		nlapiLogExecution('DEBUG', 'FAM3', 'Error: '+e);
	}
	
}
function isEmpty(fld) {return (fld==null||fld=='');}