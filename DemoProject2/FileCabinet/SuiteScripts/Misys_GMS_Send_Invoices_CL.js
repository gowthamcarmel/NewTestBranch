var g = {};
g.isEmpty = function(f) {return (f==null||f=='');}

// search again
function searchAgain()
{
	var context = nlapiGetContext();
	var searchURL = nlapiResolveURL('SUITELET','customscript_misys_gms_send_invoices_ss','customdeploy1');

	var FromDate = nlapiGetFieldValue('custpage_from_date');
	if(!g.isEmpty(FromDate))
		searchURL+='&custscript_gms_send_from_date='+FromDate;

	var Todate = nlapiGetFieldValue('custpage_to_date');
	if(!g.isEmpty(Todate))
		searchURL+='&custscript_gms_send_to_date='+Todate;

	window.ischanged=false;
	window.location=searchURL;
}
// validate before creating POs
function sendInvoices_Save()
{
	var selCnt = 0;
	var group = 'custpage_machine';
	var lnCnt = nlapiGetLineItemCount(group);

	for(var ln=1;ln<=lnCnt;ln++)
	{
		if(nlapiGetLineItemValue(group,'custpage_select',ln)=='T')
			++selCnt;
	}
	if(selCnt==0)
	{
		alert('You must select at least one line item.');
		return false;
	}
	else
	{
		nlapiSetFieldValue('custpage_selected_line_count',selCnt);
	}
	return true;
}

function sendInvoices_fieldChange(type,name)
{
	var group = 'custpage_machine';
	if(type == group && name == 'custpage_select')
	{
		var selCnt = 0;
		
		var lnCnt = nlapiGetLineItemCount(group);
		for(var ln=1;ln<=lnCnt;ln++)
		{
			if(nlapiGetLineItemValue(group,'custpage_select',ln)=='T')
				++selCnt;
		}
		
		nlapiSetFieldValue('custpage_selected_line_count',selCnt);
		
	}
}