function afterSubmit_MasterData(type)
{
	//nlapiLogExecution('DEBUG','type=', type);
	//var exec = nlapiGetContext().getExecutionContext();
	//nlapiLogExecution('DEBUG','exec=', exec);
	
	if(type != 'xedit' && type != 'edit' && type != 'create')
	{
		return;
	}
	
	var RecId = nlapiGetRecordId();
    //nlapiLogExecution('DEBUG','RecId=', RecId);
    var RecordType = nlapiGetRecordType();
    //nlapiLogExecution('DEBUG','RecordType=', RecordType);
    
    var RecObj = nlapiLoadRecord(RecordType, RecId);
    
    var ErrorMessage = 'Details';
    var Flag = 'T';
    
    var InvoiceCustomer = RecObj.getFieldValue('custrecord_gms_customer_ns');
    //nlapiLogExecution('DEBUG','InvoiceCustomer=', InvoiceCustomer);
    var InvoicePaymentTerm = RecObj.getFieldValue('custrecord_payment_terms');
    //nlapiLogExecution('DEBUG','InvoicePaymentTerm=', InvoicePaymentTerm);
    var InvoiceCurrency = RecObj.getFieldValue('custrecord_gms_invoice_currency');
    //nlapiLogExecution('DEBUG','InvoiceCurrency=', InvoiceCurrency);
    var InvoiceTaxCode = RecObj.getFieldValue('custrecord_gms_item_taxcode');
    //nlapiLogExecution('DEBUG','InvoiceTaxCode=', InvoiceTaxCode);
    
    var InvoiceDate = RecObj.getFieldValue('custrecord_gms_invoice_date');
    //nlapiLogExecution('DEBUG','InvoiceDate=', InvoiceDate);
   
    if(_logValidation(InvoiceCustomer))
    {
    	if(_logValidation(InvoicePaymentTerm))
        {
			if(_logValidation(InvoiceCurrency))
		    {
				if(_logValidation(InvoiceTaxCode))
			    {
					//RecObj.setFieldValue('custrecord_all_invoice_fields_present', 'T');
					Flag = 'T';
					ErrorMessage = ErrorMessage + '\nNo Error Found.';
					//RecObj.setFieldValue('custrecord_error_master_data_creation', ErrorMessage);
			    }
				else
				{
					ErrorMessage = 'Details';
					ErrorMessage = ErrorMessage + '\nTax Percent Issue.';//is not present in NetSuite. Please add the correct Tax Code to Master Data';
					Flag = 'F';
					//RecObj.setFieldValue('custrecord_error_master_data_creation', ErrorMessage);
					//RecObj.setFieldValue('custrecord_all_invoice_fields_present', 'F');
				}
		    }
			else
			{
				if(_logValidation(InvoiceTaxCode))
				{
					ErrorMessage = 'Details';
					ErrorMessage = ErrorMessage + '\nCurrency Issue.';//is not present in NetSuite. Please add the correct currency to Master Data';
					Flag = 'F';
					//RecObj.setFieldValue('custrecord_error_master_data_creation', ErrorMessage);
					//RecObj.setFieldValue('custrecord_all_invoice_fields_present', 'F');
				}
				else
				{
					ErrorMessage = 'Details';
					ErrorMessage = ErrorMessage + '\nCurrency Issue.';//is not present in NetSuite. Please add the correct currency to Master Data';
					ErrorMessage = ErrorMessage + '\nTax Percent Issue.';//is not present in NetSuite. Please add the correct Tax Code to Master Data';
					Flag = 'F';
					//RecObj.setFieldValue('custrecord_error_master_data_creation', ErrorMessage);
					//RecObj.setFieldValue('custrecord_all_invoice_fields_present', 'F');
				}
			}
        }
    	else
    	{
    		if(_logValidation(InvoiceCurrency))
    		{
    			if(_logValidation(InvoiceTaxCode))
				{
					ErrorMessage = 'Details';
					ErrorMessage = ErrorMessage + '\nPayment Terms Issue.';//is not present in NetSuite. Please add the correct Payment Terms to Master Data';
					Flag = 'F';
					//RecObj.setFieldValue('custrecord_error_master_data_creation', ErrorMessage);
					//RecObj.setFieldValue('custrecord_all_invoice_fields_present', 'F');
				}
				else
				{
					ErrorMessage = 'Details';
					ErrorMessage = ErrorMessage + '\nPayment Terms Issue.';//is not present in NetSuite. Please add the correct Payment Terms to Master Data';
					ErrorMessage = ErrorMessage + '\nTax Percent Issue.';//is not present in NetSuite. Please add the correct Tax Code to Master Data';
					Flag = 'F';
					//RecObj.setFieldValue('custrecord_error_master_data_creation', ErrorMessage);
					//RecObj.setFieldValue('custrecord_all_invoice_fields_present', 'F');
				}
    		}
    		else
    		{
    			if(_logValidation(InvoiceTaxCode))
				{
					ErrorMessage = 'Details';
					ErrorMessage = ErrorMessage + '\nPayment Terms Issue.';//is not present in NetSuite. Please add the correct Payment Terms to Master Data';
					ErrorMessage = ErrorMessage + '\nCurrency Issue.';//is not present in NetSuite. Please add the correct currency to Master Data';
					Flag = 'F';
					//RecObj.setFieldValue('custrecord_error_master_data_creation', ErrorMessage);
					//RecObj.setFieldValue('custrecord_all_invoice_fields_present', 'F');
				}
				else
				{
					ErrorMessage = 'Details';
					ErrorMessage = ErrorMessage + '\nPayment Terms Issue.';//is not present in NetSuite. Please add the correct Payment Terms to Master Data';
					ErrorMessage = ErrorMessage + '\nCurrency Issue.';//is not present in NetSuite. Please add the correct currency to Master Data';
					ErrorMessage = ErrorMessage + '\nTax Percent Issue.';//is not present in NetSuite. Please add the correct Tax Code to Master Data';
					Flag = 'F';
					//RecObj.setFieldValue('custrecord_error_master_data_creation', ErrorMessage);
					//RecObj.setFieldValue('custrecord_all_invoice_fields_present', 'F');
				}
    		}
    	}
    }
    else
    {
    	if(_logValidation(InvoicePaymentTerm))
        {
			if(_logValidation(InvoiceCurrency))
		    {
				if(_logValidation(InvoiceTaxCode))
			    {
					ErrorMessage = 'Details';
					ErrorMessage = ErrorMessage + '\nCustomer BIC code Issue.';//is not present in NetSuite. Please add the correct NS Customer to Master Data.';
					Flag = 'F';
					//RecObj.setFieldValue('custrecord_error_master_data_creation', ErrorMessage);
					//RecObj.setFieldValue('custrecord_all_invoice_fields_present', 'F');
			    }
				else
				{
					ErrorMessage = 'Details';
					ErrorMessage = ErrorMessage + '\nCustomer BIC code Issue.';//is not present in NetSuite. Please add the correct NS Customer to Master Data.';
					ErrorMessage = ErrorMessage + '\nTax Percent Issue.';//is not present in NetSuite. Please add the correct Tax Code to Master Data';
					Flag = 'F';
					//RecObj.setFieldValue('custrecord_error_master_data_creation', ErrorMessage);
					//RecObj.setFieldValue('custrecord_all_invoice_fields_present', 'F');
				}
		    }
			else
			{
				if(_logValidation(InvoiceTaxCode))
			    {
					ErrorMessage = 'Details';
					ErrorMessage = ErrorMessage + '\nCustomer BIC code Issue.';//is not present in NetSuite. Please add the correct NS Customer to Master Data.';
					ErrorMessage = ErrorMessage + '\nCurrency Issue.';//is not present in NetSuite. Please add the correct currency to Master Data';
					Flag = 'F';
					//RecObj.setFieldValue('custrecord_error_master_data_creation', ErrorMessage);
					//RecObj.setFieldValue('custrecord_all_invoice_fields_present', 'F');
			    }
				else
				{
					ErrorMessage = 'Details';
					ErrorMessage = ErrorMessage + '\nCustomer BIC code Issue.';//is not present in NetSuite. Please add the correct NS Customer to Master Data.';
					ErrorMessage = ErrorMessage + '\nCurrency Issue.';//is not present in NetSuite. Please add the correct currency to Master Data';
					ErrorMessage = ErrorMessage + '\nTax Percent Issue.';//is not present in NetSuite. Please add the correct Tax Code to Master Data';
					Flag = 'F';
					//RecObj.setFieldValue('custrecord_error_master_data_creation', ErrorMessage);
					//RecObj.setFieldValue('custrecord_all_invoice_fields_present', 'F');
				}
			}
        }
    	else
    	{
    		if(_logValidation(InvoiceCurrency))
		    {
				if(_logValidation(InvoiceTaxCode))
			    {
					ErrorMessage = 'Details';
					ErrorMessage = ErrorMessage + '\nCustomer BIC code Issue.';//is not present in NetSuite. Please add the correct NS Customer to Master Data.';
					ErrorMessage = ErrorMessage + '\nPayment Terms Issue.';//is not present in NetSuite. Please add the correct Payment Terms to Master Data';
					Flag = 'F';
					//RecObj.setFieldValue('custrecord_error_master_data_creation', ErrorMessage);
					//RecObj.setFieldValue('custrecord_all_invoice_fields_present', 'F');
			    }
				else
				{
					ErrorMessage = 'Details';
					ErrorMessage = ErrorMessage + '\nCustomer BIC code Issue.';//is not present in NetSuite. Please add the correct NS Customer to Master Data.';
					ErrorMessage = ErrorMessage + '\nPayment Terms Issue.';//is not present in NetSuite. Please add the correct Payment Terms to Master Data';
					ErrorMessage = ErrorMessage + '\nTax Percent Issue.';//is not present in NetSuite. Please add the correct Tax Code to Master Data';
					Flag = 'F';
					//RecObj.setFieldValue('custrecord_error_master_data_creation', ErrorMessage);
					//RecObj.setFieldValue('custrecord_all_invoice_fields_present', 'F');
				}
		    }
			else
			{
				if(_logValidation(InvoiceTaxCode))
			    {
					ErrorMessage = 'Details';
					ErrorMessage = ErrorMessage + '\nCustomer BIC code Issue.';//is not present in NetSuite. Please add the correct NS Customer to Master Data.';
					ErrorMessage = ErrorMessage + '\nPayment Terms Issue.';//is not present in NetSuite. Please add the correct Payment Terms to Master Data';
					ErrorMessage = ErrorMessage + '\nCurrency Issue.';//is not present in NetSuite. Please add the correct currency to Master Data';
					Flag = 'F';
					//RecObj.setFieldValue('custrecord_error_master_data_creation', ErrorMessage);
					//RecObj.setFieldValue('custrecord_all_invoice_fields_present', 'F');
			    }
				else
				{
					ErrorMessage = 'Details';
					ErrorMessage = ErrorMessage + '\nCustomer BIC code Issue.';//is not present in NetSuite. Please add the correct NS Customer to Master Data.';
					ErrorMessage = ErrorMessage + '\nPayment Terms Issue.';//is not present in NetSuite. Please add the correct Payment Terms to Master Data';
					ErrorMessage = ErrorMessage + '\nCurrency Issue.';//is not present in NetSuite. Please add the correct currency to Master Data';
					ErrorMessage = ErrorMessage + '\nTax Percent Issue.';//is not present in NetSuite. Please add the correct Tax Code to Master Data';
					Flag = 'F';
					//RecObj.setFieldValue('custrecord_error_master_data_creation', ErrorMessage);
					//RecObj.setFieldValue('custrecord_all_invoice_fields_present', 'F');
				}
			}
    	}
    }
    
    //nlapiLogExecution('DEBUG','ErrorMessage=', ErrorMessage);
	
    if(_logValidation(InvoiceDate))
    {
    	 //nlapiLogExecution('DEBUG','InvoiceDate=', InvoiceDate);
    }
    else
    {
    	Flag = 'F';
    	ErrorMessage = ErrorMessage + '\nDate is empty. Please select a date before creating the invoice.';
    }
    
    var CustomerEmail = ''; 
    
    if(_logValidation(InvoiceCustomer))
    {
    	var DocDelEmail = nlapiLookupField('customer',InvoiceCustomer,'custentity_dlmthemail');
    	//nlapiLogExecution('DEBUG','DocDelEmail=', DocDelEmail);
    	
    	if(DocDelEmail == 'T')
    	{
    		CustomerEmail = RecObj.getFieldValue('custrecord_gms_contact_email');
    	    //nlapiLogExecution('DEBUG','CustomerEmail=', CustomerEmail);
    		
    		if(_logValidation(CustomerEmail))
    	    {
    	    	 //nlapiLogExecution('DEBUG','CustomerEmail=', CustomerEmail);
    	    }
    	    else
    	    {
    	    	Flag = 'F';
    	    	ErrorMessage = ErrorMessage + '\nCustomer Contact Email is not present. Please enter the correct email on the customer record and update the same here.';
    	    }
    	}
    	else
    	{
    		
    		var cust_fields = ['custentity_dlmthpost','custentity_docdeliverycourier','custentity_docdeliveryapupload'] ;

		    var Fields = nlapiLookupField('customer',InvoiceCustomer,cust_fields);
	
		    var DocDelPost = Fields.custentity_dlmthpost;
		    var DocDelCourier = Fields.custentity_docdeliverycourier;
		    var DocDelUpload = Fields.custentity_docdeliveryapupload;
	
		    //nlapiLogExecution('DEBUG','DocDelPost=', DocDelPost);
		    //nlapiLogExecution('DEBUG','DocDelCourier=', DocDelCourier);
		    
		    if(DocDelPost == 'T' || DocDelCourier == 'T' || DocDelUpload == 'T')
    	    {
    	    	 //nlapiLogExecution('DEBUG','Customer Invoice to be sent manually through post or courier');
    	    }
    	    else
    	    {
    	    	Flag = 'F';
    	    	ErrorMessage = ErrorMessage + '\nDoc Delivery method for the customer is not upadted in the system. Please update the same on the customer level.';
    	    }
    	}
    	
    }
    
    nlapiLogExecution('DEBUG','ErrorMessage=', ErrorMessage);
    nlapiLogExecution('DEBUG','Flag=', Flag);
    
    RecObj.setFieldValue('custrecord_error_master_data_creation', ErrorMessage);
	RecObj.setFieldValue('custrecord_all_invoice_fields_present', Flag);
    
    var id = nlapiSubmitRecord(RecObj);
    nlapiLogExecution('DEBUG','id=', id);
    
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