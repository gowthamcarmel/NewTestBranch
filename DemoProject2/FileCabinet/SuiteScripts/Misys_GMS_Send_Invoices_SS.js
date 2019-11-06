function suitlet_GMS_Send_Invoices(request,response)
{
	var startProcEmail = genericSearch('customrecord_msys_script_params', 'name', 'GMS_START_EMAIL');
	nlapiLogExecution('DEBUG', 'suitlet in Get', 'startProcEmail===' + startProcEmail);
	
	if (request.getMethod() == 'GET')
	{
		var FromDate = request.getParameter('custscript_gms_send_from_date');
		nlapiLogExecution('DEBUG', 'suitlet in Get', 'FromDate===' + FromDate);
		var ToDate = request.getParameter('custscript_gms_send_to_date');
		nlapiLogExecution('DEBUG', 'suitlet in Get', 'ToDate===' + ToDate);
		
		var LineCount = 0;
		
		try
		{
			var form = nlapiCreateForm('Send GMS Invoices to Customers',false); 
			
			if( startProcEmail[1] == '1')
			{
				var info = form.addField('custpage_info','longtext','',null,'main');
				info.setDisplayType('inline');
				info.setLayoutType('outsideabove','startrow');

				var infoStr = "<div>Invoice E-Mails are currently being sent. Please wait for the process to complete before triggering the process again.</div>";
				
				info.setDefaultValue(infoStr);
			}
			else
			{
				form.setScript('customscript_misys_gms_send_invoices_cl');

				var info = form.addField('custpage_info','longtext','',null,'main');
				info.setDisplayType('inline');
				info.setLayoutType('outsideabove','startrow');

				var infoStr = "<p>Select the line items for which invoices to be sent to customers, then click on the 'Submit' button.<br/>To restrict your results to a particular period, edit the appropriate dates and then click on the 'Search Again' button.</p>";

				var FromDateFld = form.addField('custpage_from_date','date','From Date');
				if(!Utils.isEmpty(FromDate))
					FromDateFld.setDefaultValue(FromDate);
				
				var ToDateFld = form.addField('custpage_to_date','date','To Date');
				if(!Utils.isEmpty(ToDate))
					ToDateFld.setDefaultValue(ToDate);
				
				var SelectedLineCount = form.addField('custpage_selected_line_count','integer','Total Count of Selected Lines');
				SelectedLineCount.setDefaultValue(LineCount);
				SelectedLineCount.setDisplayType('inline');
				
				var ListCount = form.addField('custpage_list_count','integer','Count of Lines');
				ListCount.setDisplayType('inline');
				ListCount.setDefaultValue(LineCount);
				

				var sublist = form.addSubList('custpage_machine','list','Select Invoices');

				var GetButton = sublist.addMarkAllButtons();
				//nlapiLogExecution('DEBUG', 'suitlet', 'GetButton===' + GetButton);
				
				sublist.addField('custpage_select','checkbox','Select');
				sublist.addField('custpage_records','select','Invoice #','invoice').setDisplayType('inline');
				sublist.addField('custpage_customer','select','Customer','customer').setDisplayType('inline');
				sublist.addField('custpage_region','select','Region','location').setDisplayType('inline');
				sublist.addField('custpage_invoice_date','date','Invoice Date').setDisplayType('inline');
				sublist.addField('custpage_item_description','text','Item Description').setDisplayType('inline');
				sublist.addField('custpage_currency','select','Currency','currency').setDisplayType('inline');
				sublist.addField('custpage_total','currency','Total Amount').setDisplayType('inline');
				
				var TotalNoOfLines = 0;
				var Flag = 0;
				
				// fetch line items
				var filters = new Array();
				//filters[0] = new nlobjSearchFilter('custbody_gms_inv_file',null,'noneof',' ');
				
				if(!Utils.isEmpty(FromDate))
				{
					if(!Utils.isEmpty(ToDate))
					{
						
						filters[0] = new nlobjSearchFilter('trandate',null,'within',FromDate,ToDate);
						//nlapiLogExecution('DEBUG', 'suitlet', 'filters===' + filters);
					}
				}
				
				var columns = new Array();
				columns[0] = new nlobjSearchColumn('internalid');
				columns[1] = new nlobjSearchColumn('tranid');
				columns[2] = new nlobjSearchColumn('entity');
				columns[3] = new nlobjSearchColumn('location');
				columns[4] = new nlobjSearchColumn('trandate');
				columns[5] = new nlobjSearchColumn('memo');
				columns[6] = new nlobjSearchColumn('currency');
				columns[7] = new nlobjSearchColumn('amount');
				columns[8] = new nlobjSearchColumn('custbody_gms_inv_file');
				
				//nlapiLogExecution('DEBUG', 'suitlet', 'columns===' + columns);

				var hits = nlapiSearchRecord('invoice','customsearch_gms_inv_eml_scr',filters,columns);
				nlapiLogExecution('DEBUG', 'suitlet', 'hits===' + hits);
				
				if(_logValidation(hits))
				{
					var lines = new Array();
					for(var i=0;i<hits.length;i++)
					{
						var h = hits[i];
						var pdfID = hits[i].getValue('custbody_gms_inv_file');
						nlapiLogExecution('DEBUG', 'suitlet', 'pdfID===' + pdfID);
						
						if(pdfID != '')
						{
							TotalNoOfLines++;
							
							try
							{
								lines.push({
									custpage_records: h.getId(),
									custpage_invoice_no: Utils.srValue(h,'tranid'),
									custpage_customer: Utils.srValue(h,'entity'),
									custpage_region: Utils.srValue(h,'location'),
									custpage_invoice_date: Utils.srValue(h,'trandate'),
									custpage_item_description: Utils.srValue(h,'memo'),
									custpage_currency: Utils.srValue(h,'currency'),
									custpage_total: Utils.srValue(h,'amount')
								});
							}
							catch(e)
							{
								nlapiLogExecution('DEBUG', 'suitlet', 'in e');
								Utils.showInfoForm('Send Invoices - Error','An <b>error</b> occurred while setting Invoices details on Form: '+Utils.exInfo(e));
							}
						}
						
					}
					sublist.setLineItemValues(lines);
					if(hits.length>=Utils.MAX_PER_PAGE)
						infoStr+='<br/><p style="font-weight:bold;">N.B. Too many messages.. </p>';
					
					ListCount.setDefaultValue(TotalNoOfLines);
				}
				info.setDefaultValue(infoStr);
				form.addSubmitButton('Submit');

				var searchAction = "searchAgain();";
				form.addButton('custpage_search','Search Again',searchAction);
			}
			response.writePage(form);
		}
		catch(ex)
		{
			Utils.showInfoForm('Send Invoices - Error','An <b>error</b> occurred on Send Invoices script: '+Utils.exInfo(ex));
		}
	}
	else //post
	{
		var FromDate = request.getParameter('custscript_gms_send_from_date');
		nlapiLogExecution('DEBUG', 'suitlet in Post', 'FromDate===' + FromDate);
		var ToDate = request.getParameter('custscript_gms_send_to_date');
		nlapiLogExecution('DEBUG', 'suitlet in post', 'ToDate===' + ToDate);
		
		try
		{
			var EmployeeID = nlapiGetUser();
			nlapiLogExecution('DEBUG', 'suitlet in post', 'EmployeeID===' + EmployeeID);
			
			var group = 'custpage_machine';
			var lnCnt = request.getLineItemCount(group);
			
			var GMSInvoices = '';// = new Array();

			for(var ln=1;ln<=lnCnt;ln++)
			{
				if(request.getLineItemValue(group,'custpage_select',ln)=='T')
				{
					var RecID = request.getLineItemValue(group,'custpage_records',ln);
					nlapiLogExecution('DEBUG', 'suitlet in post', 'RecID===' + RecID);
					
					if(GMSInvoices == '')
					{
						GMSInvoices = RecID;
					}
					else
					{
						GMSInvoices = GMSInvoices + ',' + RecID;
					}
					
					//GMSInvoices.push(RecID);
				}
			}
			nlapiLogExecution('DEBUG', 'suitlet in post', 'GMSInvoices===' + GMSInvoices);
			
			nlapiSubmitField('customrecord_msys_script_params', startProcEmail[0], 'custrecord_msys_paramval', '1')

			var status = nlapiScheduleScript('customscript_gms_snd_email','customdeploy_gms_snd_eml_man',{custscript_invoice_ids:GMSInvoices, custscript_employee_id:EmployeeID});
			nlapiLogExecution('DEBUG', 'suitlet in post', 'status===' + status);
			
			if(status=='QUEUED')
			{
				Utils.showInfoForm('Send GMS Invoices Notification',"<p>Invoices have been queued for sending.</p>"); 
			}
			else if(Utils.isEmpty(status))// problems
				throw nlapiCreateError('FX_EX','all deployments are busy',true);
			else
				throw nlapiCreateError('FX_EX','status returned: '+status,true);
		}
		catch(ex)
		{
			var searchURL = nlapiResolveURL('SUITELET','customscript_misys_gms_send_invoices_ss','customdeploy1');

			if(!Utils.isEmpty(FromDate))
				searchURL+='&custparam_vid='+FromDate;

			if(!Utils.isEmpty(ToDate))
				searchURL+='&custparam_pid='+ToDate;

			var backAction = "window.ischanged=false;window.location='"+searchURL+"';";

			Utils.showInfoForm('Send Invoices - Error',
				'An <b>error</b> occurred while queuing Send Invoice process: '+Utils.exInfo(ex),backAction);
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

function genericSearch(table, fieldToSearch, valueToSearch)
{
	var resData= new Array();
	var internalID = '';
	var paramValueStr = '';

	try
	{
		var filters = new Array();
		filters[0] = new nlobjSearchFilter(fieldToSearch,null,'is',valueToSearch);

		var columns = new Array();
		columns[0] = new nlobjSearchColumn('internalid');
		columns[1] = new nlobjSearchColumn('custrecord_msys_paramval');
		
		var searchResults = nlapiSearchRecord(table,null,filters,columns);
		nlapiLogExecution('DEBUG', 'GMS Invoices Scheduled', 'searchResults ==' + searchResults);

		for (var i = 0; i < searchResults.length; i++) 
		{
			internalID = searchResults[i].getValue('internalid');
			nlapiLogExecution('DEBUG', 'GMS Invoices Scheduled', 'internalID ==' + internalID);
			paramValueStr = searchResults[i].getValue('custrecord_msys_paramval');
			nlapiLogExecution('DEBUG', 'GMS Invoices Scheduled', 'paramValueStr ==' + paramValueStr);
		}

	}
	catch(e)
	{
		Utils.showInfoForm('Send Invoices - Error','An <b>error</b> occurred on Send Invoices script: '+Utils.exInfo(e));
	}     	
	resData[0] = internalID;
	resData[1] = paramValueStr;
	return resData;
}

function TDL()
{
	this.poList = new Array();
}
// add selection
TDL.prototype.add = function(poID,lineID)
{
	for(var i=0;i<this.poList.length;i++)
	{
		if(this.poList[i].poID==poID)
		{
			this.poList[i].lines.push(lineID);
			return;
		}
	}
	this.poList.push(new POS(poID,lineID));
}
// return encoded form
TDL.prototype.encode = function()
{
	var encStr = '{';
	for(var i=0;i<this.poList.length;i++)
	{
		if(i>0)
			encStr+=',';
		encStr+=this.poList[i].encode();
	}
	return encStr+'}';;
}

function POS(poID,lineID)
{
	this.poID = poID;
	this.lines = new Array();
	this.lines.push(lineID);
}
// return encoded form
POS.prototype.encode = function()
{
	return ''+this.poID+':['+this.lines.toString()+']';
}

//utilities
var Utils = {}; // resolve namespace clashes
Utils.isEmpty = function(f) {return (f==null||f=='');}
Utils.noNull = function(f) {return f==null?'':f;}
Utils.srValue = function(sr,fld,join) { return sr?(Utils.noNull(sr.getValue(fld,(join?join:null)))):'';}
Utils.exInfo = function(ex)
{
	var info = '';
	if(ex instanceof nlobjError)
		info = ex.getDetails();// + '\n'+ex.getStackTrace();
	else if(ex!=null&&ex.message!=null)
		info = ex.message;
	return info;
}
// error handling code
Utils.showInfoForm = function(title,msg,goback)
{
	var form = nlapiCreateForm(title,false);

	var info = form.addField('custpage_info','longtext','',null,'main');
	info.setDisplayType('inline');
	info.setDefaultValue(msg);

	if(!Utils.isEmpty(goback))
		form.addButton('custpage_goback','Go Back',goback);
	response.writePage(form);
}
Utils.MAX_PER_PAGE = 1000; // max search records per page
Utils.MAX_LONG_TEXT = 100000; // max chars per long text field
	