function suitlet_FormToUpload_ZttblarFile(request,response)
{
		if ( request.getMethod()=='GET')
		{
			var form = nlapiCreateForm('Upload Zttblar File - Create GMS Master Data');
			
			var msg = "<p>Upload the Zttblar File in CSV Format. Click on Save to start the Process to Create GMS Master Data records.</p>"
				
			var info = form.addField('custpage_info','longtext','',null,'main');
			info.setDisplayType('inline');
			info.setDefaultValue(msg);
			info.setLayoutType('outsideabove','startrow');
			
			var file_field = form.addField('custpage_file','file', 'SelectFile');
			file_field.setMandatory(true);
			
			form.addSubmitButton('Save');
			form.addResetButton('Reset');
 
			response.writePage(form);//
		}
		else
		{
	
			var file1 = request.getFile('custpage_file');
			nlapiLogExecution('DEBUG', 'File added successfully',file1);

			file1.setFolder(1066513);
			var File_Id = nlapiSubmitFile(file1);
			nlapiLogExecution('DEBUG', 'suitlet in post', 'File_Id===' + File_Id);
			
			var EmployeeID = nlapiGetUser();
			nlapiLogExecution('DEBUG', 'suitlet in post', 'EmployeeID===' + EmployeeID);
			
			if(_logValidation(File_Id))
			{
				var status = nlapiScheduleScript('customscript_create_zabbr_record','customdeploy1',{custscript_zttblar_file_id:File_Id, custscript_gms_employee:EmployeeID});
				nlapiLogExecution('DEBUG', 'suitlet in post', 'status===' + status);
				
				if(status=='QUEUED')
				{
					var title = 'Status of Uploaded File';
					var msg = "<p>The file has been added successfully and the process has been initiated for to create the GMS Master Data.</p>"
					var form1 = nlapiCreateForm(title,false);
					

					var info = form1.addField('custpage_info','longtext','',null,'main');
					info.setDisplayType('inline');
					info.setDefaultValue(msg);

					response.writePage(form1);
				}
			}
		}
}

function _logValidation(value)
{
 if(value != null && value != '' && value != undefined && value.toString() != 'NaN' && value != NaN)
 {
  return true;
 }
 else
 {
  return false;
 }
}