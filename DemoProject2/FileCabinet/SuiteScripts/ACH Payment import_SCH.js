function scheduled_ACH_import()
{
	try
    {  
		var context = nlapiGetContext();
    	nlapiLogExecution('DEBUG', 'ACH', '>>Entry<<');
    	
    	var ACHFileID = context.getSetting('SCRIPT', 'custscript_ach_fileid');    
        var ACHImportID = context.getSetting('SCRIPT', 'custscript_ach_importid');
        
        nlapiLogExecution('DEBUG', 'ACHFileID', ACHFileID);
        nlapiLogExecution('DEBUG', 'ACHImportID', ACHImportID);
        
        
          var record = nlapiCreateRecord( 'customrecord_ach_files');
           record.setFieldValue( 'custrecord_ach_file', ACHFileID);
          var idach = nlapiSubmitRecord(record, true);  
          
          nlapiLogExecution('DEBUG', 'idach', idach);
          
          var fileCsvImport = nlapiCreateCSVImport();
			fileCsvImport.setMapping(ACHImportID);
			fileCsvImport.setPrimaryFile(nlapiLoadFile(ACHFileID));
			fileCsvImport.setOption("jobName", "ACH Payments Import Filename : " + ACHFileID);
		var x = 	nlapiSubmitCSVImport(fileCsvImport);
		 nlapiLogExecution('DEBUG','*** x ***',x);
    }
	catch(e)
	{
		 nlapiLogExecution('DEBUG','*** ERROR ***',e.toString());
	}
	
}