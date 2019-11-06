/**
 * Module Description
 * 
 * Version    Date            Author           Remarks
 * 1.00       26 Mar 2014     anduggal
 *
 */

/**
 * @returns {Void} Any or no return value
 */
function setApprovalStatus() {
	var txnId = nlapiGetRecordId();
	var txnType = nlapiGetRecordType();
	var record = nlapiLoadRecord(txnType, txnId);
	record.setFieldValue('custbody_mys_approval_stat', '2');
	var id = nlapiSubmitRecord(record);
}
