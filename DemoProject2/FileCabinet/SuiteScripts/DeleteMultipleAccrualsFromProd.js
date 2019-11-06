/**
 * @author pshah
 */
function deleteMultipleAccrualsJournal(rec_type, rec_id)
{
	nlapiLogExecution('DEBUG','rec_id',rec_id);
	nlapiDeleteRecord(rec_type, rec_id);
 
}