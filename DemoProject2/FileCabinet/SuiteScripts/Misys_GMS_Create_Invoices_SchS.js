function scheduled_GMS_Create_Invoices(request, response)
{
	try
	{
		
		var context = nlapiGetContext();
		var usageBegin = context.getRemainingUsage();
		nlapiLogExecution('DEBUG', 'GMS Invoices Scheduled', 'usageBegin ==' + usageBegin);
		
		var MasterIDs = context.getSetting('SCRIPT','custscript_gms_master_data_selections');
		nlapiLogExecution('DEBUG', 'GMS Invoices Scheduled', 'MasterIDs ==' + MasterIDs);
		
		var ProcessedRecordsCount = context.getSetting('SCRIPT','custscript_gms_processed_records_count');
		nlapiLogExecution('DEBUG', 'GMS Invoices Scheduled', 'ProcessedRecordsCount ==' + ProcessedRecordsCount);
		
		var EmployeeID = context.getSetting('SCRIPT','custscript_gms_employee_id');
		nlapiLogExecution('DEBUG', 'GMS Invoices Scheduled', 'EmployeeID ==' + EmployeeID);
		
		var AuthorID = context.getSetting('SCRIPT','custscript_author_id_gms');
		nlapiLogExecution('DEBUG', 'GMS Invoices Scheduled', 'AuthorID ==' + AuthorID);
		
		var EmailBody = context.getSetting('SCRIPT','custscript_email_body_gms');
		nlapiLogExecution('DEBUG', 'GMS Invoices Scheduled', 'EmailBody ==' + EmailBody);
		
		var EmailSubject = context.getSetting('SCRIPT','custscript_email_subject_gms');
		nlapiLogExecution('DEBUG', 'GMS Invoices Scheduled', 'EmailSubject ==' +  EmailSubject);
		
		var EmpRec = nlapiLoadRecord('employee', EmployeeID);
		var ReceipientEmail = EmpRec.getFieldValue('email');
		nlapiLogExecution('DEBUG', 'GMS Invoices Scheduled', 'ReceipientEmail ==' + ReceipientEmail);
		
		var RecIDs = MasterIDs.split(',');
		nlapiLogExecution('DEBUG', 'GMS Invoices Scheduled', 'RecIDs.length ==' + RecIDs.length);
		
		/*for(var i = 0; i < RecIDs.length; i++)
		{
			var DataID = RecIDs[i];
			nlapiLogExecution('DEBUG', 'GMS Invoices Scheduled', 'DataID ==' + DataID);
			if(_nullValidation(DataID))
			{
				break;
			}
		}*/
		
		var usageRemains;
		var RemainingRecIds = new Array();
		var RecordsProcessed = 0;
		
		//---------------- Getting Values -------------------- //
		
		// fetch line items
		var filters = new Array();
		filters[0] = new nlobjSearchFilter('internalid',null,'is',RecIDs);
		filters[1] = new nlobjSearchFilter('custrecord_ns_invoice_number',null,'anyof','none');
		filters[2] = new nlobjSearchFilter('custrecord_all_invoice_fields_present',null,'is','T');
		
		var columns = new Array();
		columns[0] = new nlobjSearchColumn('internalid');
		columns[1] = new nlobjSearchColumn('custrecord_gms_invoice_number');
		columns[2] = new nlobjSearchColumn('custrecord_gms_customer_ns');
		columns[3] = new nlobjSearchColumn('custrecord_gms_cost_centre');
		columns[4] = new nlobjSearchColumn('custrecord_gms_product');
		columns[5] = new nlobjSearchColumn('custrecord_gms_region');
		columns[6] = new nlobjSearchColumn('custrecord_gms_invoice_date');
		columns[7] = new nlobjSearchColumn('custrecord_gms_invoice_currency');
		columns[8] = new nlobjSearchColumn('custrecord_gms_item');
		columns[9] = new nlobjSearchColumn('custrecord_gms_item_description');
		columns[10] = new nlobjSearchColumn('custrecord_gms_quantity');
		columns[11] = new nlobjSearchColumn('custrecord_gms_item_rate');
		columns[12] = new nlobjSearchColumn('custrecord_gms_item_taxcode');
		columns[13] = new nlobjSearchColumn('custrecord_gms_item_amount');
		columns[14] = new nlobjSearchColumn('custrecord_customer_subsidiary');
		columns[15] = new nlobjSearchColumn('custrecord_payment_terms');

		var hits = nlapiSearchRecord('customrecord_gms_master_data',null,filters,columns);
		nlapiLogExecution('DEBUG', 'GMS Invoices Scheduled', 'hits ==' + hits);
		
		if(_logValidation(hits))
		{
			for(var i=0;i<hits.length;i++)
			{
				usageRemains = context.getRemainingUsage();
				nlapiLogExecution('DEBUG', 'GMS Invoices Scheduled', 'usageRemains ==' + usageRemains);
				if(usageRemains < 50)
				{
					var RecInternalID = hits[i].getValue('internalid');
					nlapiLogExecution('DEBUG', 'GMS Invoices Scheduled', 'RecInternalID ==' + RecInternalID);
					RemainingRecIds.push(RecInternalID);
				}
				else
				{
					var RecInternalID = hits[i].getValue('internalid');
					nlapiLogExecution('DEBUG', 'GMS Invoices Scheduled', 'RecInternalID ==' + RecInternalID);
					
					try
					{
						 var InvoiceRec = nlapiCreateRecord('invoice');
						 
						 InvoiceRec.setFieldValue('entity', hits[i].getValue('custrecord_gms_customer_ns'));
						 InvoiceRec.setFieldValue('custbody_transactioncategory', 7);
						 
						 var InvoiceDate = hits[i].getValue('custrecord_gms_invoice_date'); 
						 nlapiLogExecution('DEBUG', 'GMS Invoices Scheduled', 'InvoiceDate ==' + InvoiceDate);
						 
						 InvoiceRec.setFieldValue('trandate', InvoiceDate);
						 
						 var InvoiceCurrency = hits[i].getValue('custrecord_gms_invoice_currency');
						 nlapiLogExecution('DEBUG', 'GMS Invoices Scheduled', 'InvoiceCurrency ==' + InvoiceCurrency);
						 
						 var CustomerSubsidiary = hits[i].getValue('custrecord_customer_subsidiary');
						 nlapiLogExecution('DEBUG', 'GMS Invoices Scheduled', 'CustomerSubsidiary ==' + CustomerSubsidiary);
						 
						 var CustSubCurrency = nlapiLookupField('subsidiary',CustomerSubsidiary,'currency');
						 nlapiLogExecution('DEBUG', 'GMS Invoices Scheduled', 'CustSubCurrency ==' + CustSubCurrency);
						 
						 var ExchangeRate = 1;
						 if(InvoiceCurrency != CustSubCurrency)
						 {
							 ExchangeRate = getInvExchangeRate(InvoiceCurrency,CustSubCurrency,InvoiceDate);
							 
						 }
						 nlapiLogExecution('DEBUG', 'GMS Invoices Scheduled', 'ExchangeRate ==' + ExchangeRate);
						 
						 InvoiceRec.setFieldValue('currency', InvoiceCurrency);
						 InvoiceRec.setFieldValue('department', hits[i].getValue('custrecord_gms_cost_centre'));
						 InvoiceRec.setFieldValue('class', hits[i].getValue('custrecord_gms_product'));
						 InvoiceRec.setFieldValue('location', hits[i].getValue('custrecord_gms_region'));
						 //InvoiceRec.setFieldValue('custbody_dlmthemail', 'T');
						 // to set the value as per the customer as the system is not sourcing the value
						 
						 InvoiceRec.setFieldValue('custbody_related_gms_record', RecInternalID);
						 InvoiceRec.setFieldValue('terms', hits[i].getValue('custrecord_payment_terms'));
						 
						 InvoiceRec.setFieldValue('externalid', hits[i].getValue('custrecord_gms_invoice_number'));
						 InvoiceRec.setFieldValue('custbody_altinvoicenumber', hits[i].getValue('custrecord_gms_invoice_number'));
						 
						 InvoiceRec.selectNewLineItem('item');
						 InvoiceRec.setCurrentLineItemValue('item', 'item', hits[i].getValue('custrecord_gms_item'));
						 InvoiceRec.setCurrentLineItemValue('item', 'description', hits[i].getValue('custrecord_gms_item_description'));
						 InvoiceRec.setCurrentLineItemValue('item', 'quantity', hits[i].getValue('custrecord_gms_quantity'));
						 InvoiceRec.setCurrentLineItemValue('item', 'department', hits[i].getValue('custrecord_gms_cost_centre'));
						 InvoiceRec.setCurrentLineItemValue('item', 'class', hits[i].getValue('custrecord_gms_product'));
						 InvoiceRec.setCurrentLineItemValue('item', 'location', hits[i].getValue('custrecord_gms_region'));
						 InvoiceRec.setCurrentLineItemValue('item', 'rate', hits[i].getValue('custrecord_gms_item_rate'));
						 InvoiceRec.setCurrentLineItemValue('item', 'taxcode', hits[i].getValue('custrecord_gms_item_taxcode'));
						 //InvoiceRec.setCurrentLineItemValue('item', 'grossamt', hits[i].getValue('custrecord_gms_item_amount'));
						 InvoiceRec.commitLineItem('item');
					 
					 
						 var i_InvoiceRecID = nlapiSubmitRecord(InvoiceRec,false,false);
						 nlapiLogExecution('DEBUG', 'GMS Invoices Scheduled', 'i_InvoiceRecID ==' + i_InvoiceRecID);
						 
						 if(_logValidation(i_InvoiceRecID))
						 {
							 nlapiSubmitField('customrecord_gms_master_data',RecInternalID,'custrecord_ns_invoice_number',i_InvoiceRecID);
							 nlapiSubmitField('customrecord_gms_master_data',RecInternalID,'custrecord_error_invoice_creation','');
							 
							 RecordsProcessed = RecordsProcessed + 1;
							 nlapiLogExecution('DEBUG', 'GMS Invoices Scheduled', 'RecordsProcessed ==' + RecordsProcessed);
						 }
						 
						 
					 }
					 catch(e)
					 {
						 nlapiLogExecution('DEBUG', 'Try Catch', 'e=' + e);
						 nlapiLogExecution('DEBUG', 'Try Catch', 'e=' + e.code);
						 nlapiLogExecution('DEBUG', 'Try Catch', 'e=' + e.details);
						 var errorDetails = 'Code - ' +e.code + ' ; Details - ' + e.details;
						 nlapiSubmitField('customrecord_gms_master_data',RecInternalID,'custrecord_error_invoice_creation',errorDetails);
					 }
				}
				
				if(i == ((hits.length) - 1))
				{
					if(_nullValidation(RemainingRecIds))
					{
						nlapiLogExecution('DEBUG', 'GMS Invoices Scheduled', 'Inside Sending Email');
						
								
						
						var TotalRecordsProcessed = parseInt(RecordsProcessed) + parseInt(ProcessedRecordsCount);
						nlapiLogExecution('DEBUG', 'GMS Invoices Scheduled', 'TotalRecordsProcessed ==' + TotalRecordsProcessed);
						
						EmailBody = EmailBody + TotalRecordsProcessed;
						nlapiLogExecution('DEBUG', 'GMS Invoices Scheduled', 'EmailBody ==' + EmailBody);
						
						nlapiSendEmail(AuthorID, ReceipientEmail, EmailSubject,EmailBody , null, null, null);
					}
				}
			}
		}
		
		//----- to trigger the schedule script which attaches the PDF to the invoices.
		var params=new Array();
		params['custscript_gms_inv_recipient']=ReceipientEmail;
		
		var status = nlapiScheduleScript('customscript_gms_inv_proc','customdeploy_gms_inv_man',params);
		nlapiLogExecution('DEBUG', 'GMS Invoices Scheduled', 'status===' + status);
		
		if(usageRemains < 50)
		{
			nlapiLogExecution('DEBUG', 'GMS Invoices Scheduled', 'RemainingRecIds ==' + RemainingRecIds);
			Schedulescriptafterusageexceeded(RemainingRecIds, RecordsProcessed,EmployeeID);
		}	
		
	}
	catch(Exception) 
	{
		nlapiLogExecution('DEBUG', 'Try Catch', 'Exception=' + Exception);
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
function _nullValidation(value)
{
	if (value == null || value == 'NaN' || value == '' || value == undefined || value == '&nbsp;')
	{
		return true;
	}
	else
	{
		return false;
	}
}

function Schedulescriptafterusageexceeded(i, count, empid)
{
	nlapiLogExecution('DEBUG','GMS Invoices Scheduled','Inside Schedulescriptafterusageexceeded');
	
	var params=new Array();
	params['status']='scheduled';
	params['runasadmin']='T';
	params['custscript_gms_master_data_selections']=i;
	params['custscript_gms_processed_records_count']=count;
	params['custscript_gms_employee_id']=empid;
	
	var status=nlapiScheduleScript(nlapiGetContext().getScriptId(), nlapiGetContext().getDeploymentId(),params);
	nlapiLogExecution('DEBUG','GMS Invoices Scheduled','Script scheduled status='+ status);
	
	////If script is scheduled then successfuly then check for if status=queued
	if (status == 'QUEUED') 
	{
		nlapiLogExecution('DEBUG', 'GMS Invoices Scheduled', 'The script is rescheduled');
	}
}

function getInvExchangeRate(InvCur,SubCur,InvDate)
{
	var ExRate = '';
	
	/*nlapiLogExecution('DEBUG', 'GMS Invoices Scheduled', 'InvCur ==' + InvCur);
	nlapiLogExecution('DEBUG', 'GMS Invoices Scheduled', 'SubCur ==' + SubCur);
	nlapiLogExecution('DEBUG', 'GMS Invoices Scheduled', 'InvDate ==' + InvDate);
	
	InvDate = nlapiStringToDate(InvDate);
	nlapiLogExecution('DEBUG', 'GMS Invoices Scheduled', 'InvDate ==' + InvDate);
	
	var date1 = InvDate.getDate();
	var extramonth1 = InvDate.getMonth();
	var year1 = InvDate.getFullYear();
	var month1 = extramonth1 + 1;
	var OldDate = date1 +'/'+ month1 +'/'+ year1;
	nlapiLogExecution('DEBUG', 'context', '7 day old date = '+OldDate);
	var q = OldDate.split("/");
	var InvDate = new Date(q[2],(q[1]-1),q[0]);
	nlapiLogExecution('DEBUG', 'GMS Invoices Scheduled', 'InvDate ==' + InvDate);*/
	
	try
	{
		var filters = new Array();
		filters[0] = new nlobjSearchFilter('custrecord_er_date',null,'is',InvDate);
		filters[1] = new nlobjSearchFilter('custrecord_er_trans_base_currency',null,'is', SubCur);
		filters[2] = new nlobjSearchFilter('custrecord_er_trans_foreign_currency',null,'is',InvCur);
		filters[3] = new nlobjSearchFilter('isinactive',null,'is','F');

		var columns = new Array();
		columns[0] = new nlobjSearchColumn('internalid');
		columns[1] = new nlobjSearchColumn('custrecord_er_exchange_rate');
		
		var searchRecord = nlapiSearchRecord('customrecord_er_daily_exchange_rate',null,filters,columns);
		nlapiLogExecution('DEBUG', 'GMS Invoices Scheduled', 'searchRecord ==' + searchRecord);
		
		if(_logValidation(searchRecord))
		{
			for(var i=0;i<searchRecord.length;i++)
			{
				ExRate = searchRecord[i].getValue('custrecord_er_exchange_rate');
				nlapiLogExecution('DEBUG', 'GMS Invoices Scheduled', 'ExRate ==' + ExRate);
				if(_logValidation(ExRate))
				{
					break;
				}
			}
		}
		if(_logValidation(ExRate))
		{
			return ExRate;
		}
	}
	catch(exc)
	{
		 nlapiLogExecution('DEBUG', 'Try Catch', 'exc=' + exc);
		 nlapiLogExecution('DEBUG', 'Try Catch', 'exc=' + exc.code);
		 return ExRate;
	}
}