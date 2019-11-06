function suitlet_GMS_Create_Invoices(request,response)
{
	if (request.getMethod() == 'GET')
	{
		var FromDate = request.getParameter('custscript_gms_from_date');
		nlapiLogExecution('DEBUG', 'suitlet in Get', 'FromDate===' + FromDate);
		var ToDate = request.getParameter('custscript_gms_to_date');
		nlapiLogExecution('DEBUG', 'suitlet in Get', 'ToDate===' + ToDate);
		
		var LineCount = 0;

		try
		{
			var form = nlapiCreateForm('Create GMS Invoices',false); 
			form.setScript('customscript_misys_gms_createinvoices_cl');

			var info = form.addField('custpage_info','longtext','',null,'main');
			info.setDisplayType('inline');
			info.setLayoutType('outsideabove','startrow');

			var infoStr = "<p>Select the line items for which invoices are to be created, then click on the 'Submit' button.<br/>To restrict your results to a particular period, edit the appropriate dates and then click on the 'Search Again' button.</p>";

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
			

			var sublist = form.addSubList('custpage_machine','list','Select Records');

			var GetButton = sublist.addMarkAllButtons();
			nlapiLogExecution('DEBUG', 'suitlet', 'GetButton===' + GetButton);
			
			sublist.addField('custpage_select','checkbox','Select');
			sublist.addField('custpage_records','select','Records','customrecord_gms_master_data').setDisplayType('inline');
			sublist.addField('custpage_invoice_no','text','Invoice #').setDisplayType('inline');
			sublist.addField('custpage_customer','select','Customer','customer').setDisplayType('inline');
			//sublist.addField('custpage_cost_centre','select','Cost Centre','department').setDisplayType('inline');
			//sublist.addField('custpage_product','select','Product','class').setDisplayType('inline');
			sublist.addField('custpage_region','select','Region','location').setDisplayType('inline');
			sublist.addField('custpage_invoice_date','date','Invoice Date').setDisplayType('inline');
			sublist.addField('custpage_item_description','text','Item Description').setDisplayType('inline');
			sublist.addField('custpage_currency','select','Currency','currency').setDisplayType('inline');
			sublist.addField('custpage_rate','currency','Rate').setDisplayType('inline');
			//sublist.addField('custpage_tax_rate','select','Tax Code', 'salestaxitem').setDisplayType('inline');
			sublist.addField('custpage_tax_rate','currency','Tax Amount').setDisplayType('inline');
			sublist.addField('custpage_total','currency','Total Amount').setDisplayType('inline');
			
			
			// fetch line items
			var filters = new Array();
			filters[0] = new nlobjSearchFilter('custrecord_all_invoice_fields_present',null,'is','T');
			filters[1] = new nlobjSearchFilter('custrecord_to_be_processed',null,'is','T');
			//filters[1] = new nlobjSearchFilter('custrecord_ns_invoice_number',null,'is','none');
			
			if(!Utils.isEmpty(FromDate))
			{
				if(!Utils.isEmpty(ToDate))
				{
					
					filters[2] = new nlobjSearchFilter('custrecord_gms_invoice_date',null,'within',FromDate,ToDate);
					//nlapiLogExecution('DEBUG', 'suitlet', 'filters===' + filters);
				}
			}
			
			var columns = new Array();
			columns[0] = new nlobjSearchColumn('internalid');
			columns[1] = new nlobjSearchColumn('custrecord_gms_invoice_number');
			columns[2] = new nlobjSearchColumn('custrecord_gms_customer_ns');
			//columns[3] = new nlobjSearchColumn('custrecord_gms_cost_centre');
			//columns[4] = new nlobjSearchColumn('custrecord_gms_product');
			columns[3] = new nlobjSearchColumn('custrecord_gms_region');
			columns[4] = new nlobjSearchColumn('custrecord_gms_invoice_date');
			columns[5] = new nlobjSearchColumn('custrecord_gms_item_description');
			columns[6] = new nlobjSearchColumn('custrecord_gms_invoice_currency');
			columns[7] = new nlobjSearchColumn('custrecord_gms_item_rate');
			columns[8] = new nlobjSearchColumn('custrecord_gms_item_tax_amount');
			columns[9] = new nlobjSearchColumn('custrecord_gms_item_amount');
			
			//nlapiLogExecution('DEBUG', 'suitlet', 'columns===' + columns);
			

			var hits = nlapiSearchRecord('customrecord_gms_master_data','customsearch_gms_createinvoicessearch_su',filters,columns);
			nlapiLogExecution('DEBUG', 'suitlet', 'hits===' + hits);
			
			if(_logValidation(hits))
			{
				
				ListCount.setDefaultValue(hits.length);
				nlapiLogExecution('DEBUG', 'suitlet', 'hits.length===' + hits.length);
				
				var lines = new Array();
				for(var i=0;i<hits.length;i++)
				{
					var h = hits[i];
					
					//nlapiLogExecution('DEBUG', 'suitlet', 'customer id===' + hits[i].getValue('custrecord_gms_customer_ns'));
					//nlapiLogExecution('DEBUG', 'suitlet', 'product id===' + hits[i].getValue('custrecord_gms_product'));
					lines.push({
						custpage_records: h.getId(),
						custpage_invoice_no: Utils.srValue(h,'custrecord_gms_invoice_number'),
						custpage_customer: Utils.srValue(h,'custrecord_gms_customer_ns'),
						//custpage_cost_centre: Utils.srValue(h,'custrecord_gms_cost_centre'),
						//custpage_product: Utils.srValue(h,'custrecord_gms_product'),
						custpage_region: Utils.srValue(h,'custrecord_gms_region'),
						custpage_invoice_date: Utils.srValue(h,'custrecord_gms_invoice_date'),
						custpage_item_description: Utils.srValue(h,'custrecord_gms_item_description'),
						custpage_currency: Utils.srValue(h,'custrecord_gms_invoice_currency'),
						custpage_rate: Utils.srValue(h,'custrecord_gms_item_rate'),
						custpage_tax_rate: Utils.srValue(h,'custrecord_gms_item_tax_amount'),
						custpage_total: Utils.srValue(h,'custrecord_gms_item_amount')
					});
				}
				sublist.setLineItemValues(lines);
				if(hits.length>=Utils.MAX_PER_PAGE)
					infoStr+='<br/><p style="font-weight:bold;">N.B. Too many messages.. </p>';
			}
			info.setDefaultValue(infoStr);
			form.addSubmitButton('Submit');

			var searchAction = "searchAgain();";
			form.addButton('custpage_search','Search Again',searchAction);

			response.writePage(form);
		}
		catch(ex)
		{
			Utils.showInfoForm('Create Invoices - Error','An <b>error</b> occurred while initiating Create Invoices script: '+Utils.exInfo(ex));
		}
	}
	else // POST
	{
		
		var FromDate = request.getParameter('custpage_from_date');
		nlapiLogExecution('DEBUG', 'suitlet in Post', 'FromDate===' + FromDate);
		var ToDate = request.getParameter('custpage_to_date');
		nlapiLogExecution('DEBUG', 'suitlet in post', 'ToDate===' + ToDate);
		
		
		try
		{
			var EmployeeID = nlapiGetUser();
			nlapiLogExecution('DEBUG', 'suitlet in post', 'EmployeeID===' + EmployeeID);
			
			var group = 'custpage_machine';
			var lnCnt = request.getLineItemCount(group);
			
			var GMSMasterRecords = '';// = new Array();

			for(var ln=1;ln<=lnCnt;ln++)
			{
				if(request.getLineItemValue(group,'custpage_select',ln)=='T')
				{
					var RecID = request.getLineItemValue(group,'custpage_records',ln);
					nlapiLogExecution('DEBUG', 'suitlet in post', 'RecID===' + RecID);
					
					if(GMSMasterRecords == '')
					{
						GMSMasterRecords = RecID;
					}
					else
					{
						GMSMasterRecords = GMSMasterRecords + ',' + RecID;
					}
					
					//GMSMasterRecords.push(RecID);
				}
			}
			nlapiLogExecution('DEBUG', 'suitlet in post', 'GMSMasterRecords===' + GMSMasterRecords);

			var status = nlapiScheduleScript('customscript_misys_gmscreateinvoices_sch','customdeploy_gms_create_invoices_sched',{custscript_gms_master_data_selections:GMSMasterRecords, custscript_gms_employee_id:EmployeeID});
			nlapiLogExecution('DEBUG', 'suitlet in post', 'status===' + status);
			
			if(status=='QUEUED')
			{
				Utils.showInfoForm('Create Invoice Notifications',"<p>Invoices creation have been queued for processing.</p>"); 
			}
			else if(Utils.isEmpty(status))// problems
				throw nlapiCreateError('FX_EX','all deployments are busy',true);
			else
				throw nlapiCreateError('FX_EX','status returned: '+status,true);
		}
		catch(ex)
		{
			var searchURL = nlapiResolveURL('SUITELET','customscript_misys_gms_createinvoices_ss','customdeploy1');

			if(!Utils.isEmpty(FromDate))
				searchURL+='&custparam_vid='+FromDate;

			if(!Utils.isEmpty(ToDate))
				searchURL+='&custparam_pid='+ToDate;

			var backAction = "window.ischanged=false;window.location='"+searchURL+"';";

			Utils.showInfoForm('Create Invoices - Error',
				'An <b>error</b> occurred while queuing Invoice Creation process: '+Utils.exInfo(ex),backAction);
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
