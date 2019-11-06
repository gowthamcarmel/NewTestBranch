/**
 * Module Description
 * 
 * Version    Date            Author           Remarks
 * 1.00       06 Oct 2014     anduggal
 *
 */

/**
 * @param {nlobjRequest} request Request object
 * @param {nlobjResponse} response Response object
 * @returns {Void} Any output is written via response object
 */
function main(request, response){
	var epPaymentSelectionForm = new EPPaymentSelectionForm();
	
	epPaymentSelectionForm.AddFilter(false,'custbody_custom_name', 'text', 'Custom Name', '', '', 'Custom Name', '', '');
	epPaymentSelectionForm.AddFilter(true,'custcol_companyname', 'select', 'Custom Subsidiary', '', '', 'Custom Subsidiary', 'subsidiary', '');

	epPaymentSelectionForm.AddColumn('text', 'Custom Name', 'custbody_custom_name');
	epPaymentSelectionForm.AddColumn('text', 'Approval Status', 'approvalstatus', true);
	epPaymentSelectionForm.AddColumn('text', 'Email', 'email', '', '', '', 'vendor');

	epPaymentSelectionForm.RemoveFilter('custpage_2663_vendor');

	epPaymentSelectionForm.RemoveField('custpage_2663_payment_ref');

	epPaymentSelectionForm.BuildUI(request, response);

	var form  = epPaymentSelectionForm.GetForm();
	response.writePage(form);
}
