/**
 * Module Description
 * 
 * Version    Date            Author           Remarks
 * 1.00       09 Apr 2014     anduggal
 *
 */

/**
 * @returns {Void} Any or no return value
 */
function LastRejected()
{
	var now = new Date();
	//var txnId = nlapiGetRecordId();
	//var txnType = nlapiGetRecordType();
	//var record = nlapiLoadRecord(txnType, txnId);
	
	//var lastModif = record.getFieldValue('lastmodifieddate');
	var lastModif = nlapiDateToString(now, 'datetime');
	
	return lastModif;
}