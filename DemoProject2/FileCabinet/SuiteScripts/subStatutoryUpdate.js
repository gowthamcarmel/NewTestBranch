function subStatutoryUpdate()
{
var stat_info = "1) Invoices that do not reference a P.O. number will be will be rejected and returned to you unpaid.\n2) Invoices and invoice related queries should be sent electronically to Misys.ap@misys.com.\n3) If you are unable to submit invoices electronically send your paper invoices to \"Accounts Payable\" at the Billing Address below.\n4) If you have any P.O. related queries please email them to Misys.purchasing@misys.com.\n5) All prices on this purchase order exclude VAT and similar taxes.\n6) Unless otherwise stated by Misys, this P.O. is subject to Misys\' Standard Terms and Conditions of Purchase, which are available at www.misys.com/purchaseterms.";
var subsidiary1 = nlapiSearchRecord(null, 'customsearch5022');
  for ( var ii in subsidiary1)
  {
	  var r= subsidiary1[ii];
	  var row = r.getId();
				
var record = nlapiLoadRecord('subsidiary', row)
record.setFieldValue('custrecord_sub_st_info', stat_info);
var id = nlapiSubmitRecord(record);
  }	
}