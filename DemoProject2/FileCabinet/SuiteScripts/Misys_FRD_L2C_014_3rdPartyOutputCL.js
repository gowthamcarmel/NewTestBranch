/*
$Archive: /Misys/Misys_FRD_L2C_014_3rdPartyOutputCL.js $
$Author: Ken Woodhouse $
$Date: 27/11/14 10:32 $

$Modtime: 27/11/14 10:30 $
$Revision: 1 $
*/

// utils
var g = {};
g.isEmpty = function(f) {return (f==null||f=='');}

// search again
function searchAgain()
{
	var context = nlapiGetContext();
	var searchURL = nlapiResolveURL('SUITELET','customscript_3rd_party_notifications_gui','customdeploy_3rd_party_notifications_gui');

	var vendorID = nlapiGetFieldValue('custpage_vid');
	if(!g.isEmpty(vendorID))
		searchURL+='&custparam_vid='+vendorID;

	var poID = nlapiGetFieldValue('custpage_pid');
	if(!g.isEmpty(poID))
		searchURL+='&custparam_pid='+poID;

	window.ischanged=false;
	window.location=searchURL;
}
// validate before creating POs
function createNotifications_Save()
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
	return true;
}