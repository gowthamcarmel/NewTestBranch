function Period_Lock_Check_and_Setup(type) 
{

	var context = nlapiGetContext();
	nlapiLogExecution('DEBUG', 'Context: ', context.getEnvironment());
	
	var stVB = nlapiGetRecordId();

nlapiLogExecution('DEBUG', 'stLoggerTitle', 'vendor bill internal id: '+stVB);

	//check the accounting period is not closed before processing the transaction.
			var billRec = nlapiLoadRecord('vendorbill', stVB);
			var stPeriod = billRec.getFieldValue('postingperiod');
			//var stPeriod = nlapiLookupField('vendorbill', stVB, 'postingperiod');
			
			//customsearch_prd_chk_srch
			//var filter1 = new Array();  
			//filter1.push(new nlobjSearchFilter('internalid', null, 'anyof', stVB));
			
			//var arrActivePeriods1 = nlapiSearchRecord(null, 'customsearch_prd_chk_srch', filter1);
			
			//var stPeriod = arrActivePeriods1[0].getValue('postingperiod');
			
			///////////////////////////////////////////////////////////////////
			
			nlapiLogExecution('DEBUG', 'stLoggerTitle', 'stPeriod: '+stPeriod);
			
			if (stPeriod=="" || stPeriod==null){
				//continue;
			}
			else{
			var filter = new Array();  
			filter.push(new nlobjSearchFilter('internalid', null, 'anyof', stPeriod));
			
			var arrActivePeriods = nlapiSearchRecord(null, 'customsearch_accounting_periods', filter);
			
			if(!arrActivePeriods){
				var arrActivePeriods = nlapiSearchRecord(null, 'customsearch_accounting_periods');
				var stNewPeriod = arrActivePeriods[0].getValue('internalid',null,'GROUP');
				nlapiLogExecution('DEBUG', 'stLoggerTitle', 'stNewPeriod: '+stNewPeriod);
				if (stNewPeriod==null || stNewPeriod==""){
					//continue;
				}
				else{
					stPeriod = stNewPeriod;
                                         //billRec.setFieldValue('postingperiod',stNewPeriod);
					//var recId = nlapiSubmitRecord(billRec);	
				}
			}
			}
                        //var recId = nlapiSubmitRecord(billRec);	
	//end of code change for accounting period checks

nlapiLogExecution('DEBUG', 'stLoggerTitle', 'Finally Period returning from script: '+stPeriod);

return stPeriod;

}