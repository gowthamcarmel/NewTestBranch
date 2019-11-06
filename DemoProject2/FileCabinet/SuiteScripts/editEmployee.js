/**
 * Module Description
 * 
 * Version    Date            Author           Remarks
 * 1.00       26 Oct 2016     gowthamr
 *
 */

/**
 * @param {String} type Context Types: scheduled, ondemand, userinterface, aborted, skipped
 * @returns {Void}
 */
function scheduled(type) {
	
	
	log('started :');
	var Emplist = nlapiSearchRecord(null, 'customsearch5923');	
	
	if (! Emplist) 
	  return log('Empty Emp List ');
	
	log('Emplist.length :' +Emplist.length);
	
	
	
	for (var idx in Emplist)
		
	{
		
		var resultrow = Emplist[idx];
		var stEMPID = resultrow.getId();
		
		var EmpRec = nlapiLoadRecord('employee', stEMPID);
		EmpRec.setFieldValue('comments', 'Contractor removal');
		
		var r = nlapiSubmitRecord(EmpRec);
		log('Submited Emp Record :' + r);
	}
	
	
	log('Ended :');

}
function log(message)
{
	nlapiLogExecution('Debug', 'Edit Employee', message);
}