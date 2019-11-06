// BEGIN SCRIPT DESCRIPTION BLOCK  ================================
{
/*
 * 
 * 
   	Script Name: Signing Bonus (Scheduled)
	Author: Shubhradeep Saha
	Company: Finastra
	Date: 26th Sept 2018
	Description:


	Script Modification Log:

	-- Date --			-- Modified By --				--Requested By--				-- Description --


*/
}
// END SCRIPT DESCRIPTION BLOCK  ====================================

function scheduled_Signing_Bonus(request, response)
{
	try
	{
		var context = nlapiGetContext();
		var usageBegin = context.getRemainingUsage();
		//nlapiLogExecution('DEBUG', 'Signing Bonus Scheduled', 'usageBegin ==' + usageBegin);
		
		var SearchID = context.getSetting('SCRIPT','custscript_salesorder_savedsearch');
		//nlapiLogExecution('DEBUG', 'Signing Bonus Scheduled', 'SearchID ==' + SearchID);
		
		var hits = nlapiSearchRecord('salesorder',SearchID,null,null);
		//nlapiLogExecution('DEBUG', 'Signing Bonus Scheduled', 'hits ==' + hits);
		
		if(_logValidation(hits))
		{
			for(var i=0;i<hits.length;i++)
			{
				usageRemains = context.getRemainingUsage();
				nlapiLogExecution('DEBUG', 'Signing Bonus Scheduled', 'usageRemains ==' + usageRemains);
				if(usageRemains < 50)
				{
					Schedulescriptafterusageexceeded();
				}
				else
				{
					var RecId = hits[i].getValue('internalid');
					//nlapiLogExecution('DEBUG', 'Signing Bonus Scheduled', 'RecId ==' + RecId);
					
					try
					{
						var RecordType = 'salesorder';
			
						var RecObj = nlapiLoadRecord(RecordType, RecId);
						
						var RecStatus = RecObj.getFieldValue('status');
						//nlapiLogExecution('DEBUG', 'Signing Bonus Scheduled', 'RecStatus:-'+RecStatus);
						
						var SigningBonusCreated = RecObj.getFieldValue('custbody_credit_trans_created');
						nlapiLogExecution('DEBUG', 'Signing Bonus Scheduled', 'SigningBonusCreated:-'+SigningBonusCreated);
						
						if(SigningBonusCreated == 'F')
						{
							if(RecStatus != 'Pending Approval' && RecStatus != 'Closed')
							{
								var Customer = RecObj.getFieldValue('entity');
								var Subsidiary = RecObj.getFieldValue('subsidiary');
								var SODate = RecObj.getFieldValue('trandate');
								var TranCategory = RecObj.getFieldValue('custbody_transactioncategory');
								var RecCurrency = RecObj.getFieldValue('currency');
								var InvoiceCreditBody = RecObj.getFieldValue('custbody_invoice_credit_body');
								var CostCentre = RecObj.getFieldValue('department');
								var Product = RecObj.getFieldValue('class');
								var Region = RecObj.getFieldValue('location');
								
								var OppNumber = RecObj.getFieldValue('custbody_misysref');
								//nlapiLogExecution('DEBUG', 'Signing Bonus Scheduled', 'OppNumber:-'+OppNumber);
								
								try
								{
									var SigningBonusAmount = RecObj.getFieldValue('custbody_customer_rebate');
									//nlapiLogExecution('DEBUG', 'Signing Bonus Scheduled', 'SigningBonusAmount:-'+SigningBonusAmount);
									
									var CreditMemoExternalID = OppNumber + 'CM';
									//nlapiLogExecution('DEBUG', 'Signing Bonus Scheduled', 'CreditMemoExternalID:-'+CreditMemoExternalID);
									
									var initvaluesCM = new Array();
									initvaluesCM.recordmode = 'dynamic';
									initvaluesCM.entity = Customer;
									
									var CreditMemoRec = nlapiCreateRecord('creditmemo', initvaluesCM);
									
									//CreditMemoRec.setFieldValue('entity', Customer);
									CreditMemoRec.setFieldValue('trandate', SODate);
									CreditMemoRec.setFieldValue('custbody_transactioncategory', TranCategory);
									CreditMemoRec.setFieldValue('currency', RecCurrency);
									CreditMemoRec.setFieldValue('custbody_invoice_credit_body', InvoiceCreditBody);
									CreditMemoRec.setFieldValue('department', CostCentre);
									CreditMemoRec.setFieldValue('class', Product);
									CreditMemoRec.setFieldValue('location', Region);
									CreditMemoRec.setFieldValue('externalid', CreditMemoExternalID);
									CreditMemoRec.setFieldValue('custbody_reference_sales_order', RecId);
									
									CreditMemoRec.selectNewLineItem('item');
									CreditMemoRec.setCurrentLineItemValue('item', 'item', 62255);//, true, true);
									CreditMemoRec.setCurrentLineItemValue('item', 'rate', SigningBonusAmount);//, true, true);
									CreditMemoRec.setCurrentLineItemValue('item', 'location', Region);//, true, true);
									CreditMemoRec.commitLineItem('item');
									
									var CreditMemoRecID = nlapiSubmitRecord(CreditMemoRec);
									nlapiLogExecution('DEBUG', 'Signing Bonus Scheduled', 'CreditMemoRecID:-'+CreditMemoRecID);
								}
								catch(exprCredit)
								{
									alert('Error in Process: '+exprCredit.message);
								}
								
								
								try
								{
									var RebateAmount = RecObj.getFieldValue('custbody_vendor_recharge');
									//nlapiLogExecution('DEBUG', 'Signing Bonus Scheduled', 'RebateAmount:-'+RebateAmount);
									
									var VendorCreditExternalID = OppNumber + 'VC';
									//nlapiLogExecution('DEBUG', 'Signing Bonus Scheduled', 'VendorCreditExternalID:-'+VendorCreditExternalID);
								
									var initvaluesVC = new Array();
									initvaluesVC.recordmode = 'dynamic';
									initvaluesVC.entity = '2617303';
									
									var VendorCreditRec = nlapiCreateRecord('vendorcredit', initvaluesVC);
									
									//VendorCreditRec.setFieldValue('entity', '872467');
									VendorCreditRec.setFieldValue('tranid', OppNumber);
									VendorCreditRec.setFieldValue('trandate', SODate);
									
									VendorCreditRec.setFieldValue('currency', RecCurrency);
									
									VendorCreditRec.setFieldValue('location', Region);
									VendorCreditRec.setFieldValue('externalid', VendorCreditExternalID);
									VendorCreditRec.setFieldValue('custbody_reference_sales_order', RecId);
									
									VendorCreditRec.selectNewLineItem('item');
									VendorCreditRec.setCurrentLineItemValue('item', 'item', 62255);//, true, true);
									VendorCreditRec.setCurrentLineItemValue('item', 'rate', RebateAmount);//, true, true);
									VendorCreditRec.setCurrentLineItemValue('item', 'location', Region);//, true, true);
									VendorCreditRec.commitLineItem('item');
									
									var VendorCreditID = nlapiSubmitRecord(VendorCreditRec);
									nlapiLogExecution('DEBUG', 'Signing Bonus Scheduled', 'VendorCreditID:-'+VendorCreditID);
								}
								catch(exprVendorCredit)
								{
									alert('Error in Process: '+exprVendorCredit.message);
								}
								
								if(_logValidation(VendorCreditID))
								{
									if(_logValidation(CreditMemoRecID))
									{
										nlapiSubmitField(RecordType,RecId,'custbody_credit_trans_created','T',true);
										nlapiSubmitField(RecordType,RecId,'custbody_credit_trans_to_be_updated','F',true);
									}
								}
								
							}
						}
						else
						{
							if(SigningBonusCreated == 'T')
							{
								//var SigningBonusToBeUpdated = RecObj.getFieldValue('custbody_credit_trans_to_be_updated');
								//nlapiLogExecution('DEBUG', 'Signing Bonus Scheduled', 'SigningBonusToBeUpdated:-'+SigningBonusToBeUpdated);
								
								//if(SigningBonusToBeUpdated == 'T')
								{
									var OppNumber = RecObj.getFieldValue('custbody_misysref');
									//nlapiLogExecution('DEBUG', 'Signing Bonus Scheduled', 'OppNumber:-'+OppNumber);
									
									var CreditMemoExternalID = OppNumber + 'CM';
									//nlapiLogExecution('DEBUG', 'Signing Bonus Scheduled', 'CreditMemoExternalID:-'+CreditMemoExternalID);
									
									var CreditType = 'creditmemo';
									
									var CreditMemoInternalID = GetTransactionInternalID(CreditType, CreditMemoExternalID);
									nlapiLogExecution('DEBUG', 'Signing Bonus Scheduled', 'CreditMemoInternalID:-'+CreditMemoInternalID);
									
									var SigningBonusAmount = RecObj.getFieldValue('custbody_customer_rebate');
									//nlapiLogExecution('DEBUG', 'Signing Bonus Scheduled', 'SigningBonusAmount:-'+SigningBonusAmount);
									
									var VendorCreditExternalID = OppNumber + 'VC';
									//nlapiLogExecution('DEBUG', 'Signing Bonus Scheduled', 'VendorCreditExternalID:-'+VendorCreditExternalID);
									
									var VendorCreditType = 'vendorcredit';
									
									var VendorCreditInternalID = GetTransactionInternalID(VendorCreditType, VendorCreditExternalID);
									nlapiLogExecution('DEBUG', 'Signing Bonus Scheduled', 'VendorCreditInternalID:-'+VendorCreditInternalID);
									
									var RebateAmount = RecObj.getFieldValue('custbody_vendor_recharge');
									//nlapiLogExecution('DEBUG', 'Signing Bonus Scheduled', 'RebateAmount:-'+RebateAmount);
									
									var SOnumber = RecObj.getFieldValue('tranid');
									//nlapiLogExecution('DEBUG', 'Signing Bonus Scheduled', 'SOnumber:-'+SOnumber);
									
									//var CurrentDate = new Date(year, month, date, hour, minute, second, millisecond);//new Date();
									var CurrentDate = new Date();
									//nlapiLogExecution('DEBUG', 'Signing Bonus Scheduled', 'CurrentDate:-'+CurrentDate);
									
									//CurrentDate = nlapiDateToString(CurrentDate);
									
									var ServiceDeskTicketValue = 'Values Changed on - ' + CurrentDate;
									//nlapiLogExecution('DEBUG', 'Signing Bonus Scheduled', 'ServiceDeskTicketValue:-'+ServiceDeskTicketValue);
									
									try
									{
										var CreditMemoRec = nlapiLoadRecord(CreditType, CreditMemoInternalID);
										//nlapiLogExecution('DEBUG', 'Signing Bonus Scheduled', 'CreditMemoRec:-'+CreditMemoRec);
										
										var CMLineItemCount = CreditMemoRec.getLineItemCount('item');
										//nlapiLogExecution('DEBUG', 'Signing Bonus Scheduled', 'CMLineItemCount:-'+CMLineItemCount);
										
										for(var a=1; a<=CMLineItemCount; a++)
										{
											var CMItem = CreditMemoRec.getLineItemValue('item', 'item', a);
											//nlapiLogExecution('DEBUG', 'Signing Bonus Scheduled', 'CMItem:-'+CMItem);
											if(CMItem == '62255')
											{
												//nlapiLogExecution('DEBUG','Signing Bonus Scheduled','Inside Credit');
												CreditMemoRec.setLineItemValue('item', 'rate', a, SigningBonusAmount);
												CreditMemoRec.commitLineItem('item');
												break;
											}
										}
										
										CreditMemoRec.setFieldValue('custbody_service_desk_ticket', ServiceDeskTicketValue);
										
										var CreditMemoRecID = nlapiSubmitRecord(CreditMemoRec, false, false);
										nlapiLogExecution('DEBUG', 'Signing Bonus Scheduled', 'CreditMemoRecID:-'+CreditMemoRecID);
									}
									catch(exprCredit)
									{
										alert('Error in Process: '+exprCredit.message);
									}
									
									try
									{
										var VendorCreditRec = nlapiLoadRecord(VendorCreditType, VendorCreditInternalID);
										//nlapiLogExecution('DEBUG', 'Signing Bonus Scheduled', 'VendorCreditRec:-'+VendorCreditRec);
										
										var VCLineItemCount = VendorCreditRec.getLineItemCount('item');
										//nlapiLogExecution('DEBUG', 'Signing Bonus Scheduled', 'VCLineItemCount:-'+VCLineItemCount);
										
										for(var b=1; b<=VCLineItemCount; b++)
										{
											var VCItem = VendorCreditRec.getLineItemValue('item', 'item', b);
											//nlapiLogExecution('DEBUG', 'Signing Bonus Scheduled', 'VCItem:-'+VCItem);
											if(VCItem == '62255')
											{
												//nlapiLogExecution('DEBUG','Signing Bonus Scheduled','Inside vendor credit');
												VendorCreditRec.setLineItemValue('item', 'rate', b, RebateAmount);
												VendorCreditRec.commitLineItem('item');
												break;
											}
										}
										
										VendorCreditRec.setFieldValue('custbody_service_desk_ticket', ServiceDeskTicketValue);
										
										var VendorCreditID = nlapiSubmitRecord(VendorCreditRec, false, false);
										nlapiLogExecution('DEBUG', 'Signing Bonus Scheduled', 'VendorCreditID:-'+VendorCreditID);
									}
									catch(exprVendorCredit)
									{
										alert('Error in Process: '+exprVendorCredit.message);
									}
									
									if(_logValidation(VendorCreditID))
									{
										if(_logValidation(CreditMemoRecID))
										{
											nlapiSubmitField(RecordType,RecId,'custbody_credit_trans_to_be_updated','F',true);
										}
									}
								}
							}
						}
					}
					catch(expr)
					{
						alert('Error in Process: '+expr.message);
					}
				}
			}
		}
		
	
		
		
	}
	catch(e)
	{
		alert('Error in Approval Process: '+e.message);
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

function Schedulescriptafterusageexceeded()
{
	nlapiLogExecution('DEBUG','Signing Bonus Scheduled','Inside Schedulescriptafterusageexceeded');
	
	var status=nlapiScheduleScript(nlapiGetContext().getScriptId(), nlapiGetContext().getDeploymentId(),null);
	nlapiLogExecution('DEBUG','GMS Invoices Scheduled','Script scheduled status='+ status);
	
	////If script is scheduled then successfuly then check for if status=queued
	if (status == 'QUEUED') 
	{
		nlapiLogExecution('DEBUG', 'Signing Bonus Scheduled', 'The script is rescheduled');
	}
}

function GetTransactionInternalID(trantype, tranexternalid)
{
	var TranInternalID;
	
	var filters = new Array();
	filters[0] = new nlobjSearchFilter('externalid',null,'is',tranexternalid);
	
	var columns = new Array();
	columns[0] = new nlobjSearchColumn('internalid');

	var searchRecords = nlapiSearchRecord(trantype,null,filters,columns);
	//nlapiLogExecution('DEBUG', 'Signing Bonus Scheduled', 'searchRecords ==' + searchRecords);
	
	if(_logValidation(searchRecords))
	{
		TranInternalID = searchRecords[0].getValue('internalid');
		//nlapiLogExecution('DEBUG', 'Signing Bonus Scheduled', 'TranInternalID ==' + TranInternalID);
	}
	
	return TranInternalID;
}
