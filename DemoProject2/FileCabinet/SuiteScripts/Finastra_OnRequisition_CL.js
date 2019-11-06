	// BEGIN SCRIPT DESCRIPTION BLOCK  ==================================
	{
	/*
		Script Name: 	Finastra On Requisition Client Script
		Author: 		Shubhradeep Saha
		Date:			25/10/2017
		Description:


		Script Modification Log:

		-- Date --			-- Modified By --				--Requested By--				-- Description --
		5th July 2019		Shubhradeep						Procurement					Change Request Number - CHG0098908
		
	  
		Below is a summary of the process controls enforced by this script file.  The control logic is described
		more fully, below, in the appropriate function headers and code blocks.

		 PAGE INIT
			- pageInit(type)


		 SAVE RECORD
			- saveRecord()


		 VALIDATE FIELD
			- validateField(type, name, linenum)


		 FIELD CHANGED
			- fieldChanged(type, name, linenum)


		 POST SOURCING
			- postSourcing(type, name)


		LINE INIT
			- lineInit(type)


		 VALIDATE LINE
			- validateLine()


		 RECALC
			- reCalc()


		 SUB-FUNCTIONS
			- The following sub-functions are called by the above core functions in order to maintain code
				modularization:

	*/
	}
	// END SCRIPT DESCRIPTION BLOCK  ====================================

	// on request of procurement team
	function pageInit_OnRequisition(type)
	{
		try
		{
			//alert('Type =='+type);
			if(type == 'create')
			{
				nlapiSetFieldValue('custbody_to_be_emailed', 'T');
			}
			
		}
		catch (error)
		{
			if (error.getDetails != undefined)
			{
				nlapiLogExecution('ERROR','Process Error',  error.getCode() + ': ' + error.getDetails());
				throw error;
			}
			else
			{
				nlapiLogExecution('ERROR','Unexpected Error', error.toString()); 
				throw nlapiCreateError('99999', error.toString());
			}    	 
			return null;
		}
	}

	function fieldChange_OnRequisition(type,name)
	{	
		try
		{
			// --- code for global requester role -------------------
			
			/*if(name == 'entity')
			{
				var Role = nlapiGetRole();
				nlapiLogExecution('DEBUG','On Requisition Client','Role='+ Role);
				
				var Employee = nlapiGetFieldValue('entity');
				nlapiLogExecution('DEBUG','On Requisition Client','Employee='+ Employee);
					
				if(_logValidation(Employee))
				{
					var EmpCostCentre = nlapiLookupField('employee',Employee,'department');
					nlapiLogExecution('DEBUG','On Requisition Client','EmpCostCentre='+ EmpCostCentre);
					
					var EmpProduct= nlapiLookupField('employee',Employee,'class');
					nlapiLogExecution('DEBUG','On Requisition Client','EmpProduct='+ EmpProduct);
					
					var EmpRegion = nlapiLookupField('employee',Employee,'location');
					nlapiLogExecution('DEBUG','On Requisition Client','EmpRegion='+ EmpRegion);
					
					nlapiSetFieldValue('department', EmpCostCentre);
					nlapiSetFieldValue('class', EmpProduct);
					nlapiSetFieldValue('location', EmpRegion);
				}
			}*/
			
			//---------new code ---------
			
		
			var currentemployee = nlapiGetFieldValue('entity');
			var currentrequestor = nlapiGetFieldValue('custpage_currentreq');
			nlapiLogExecution('DEBUG','On Requisition Client','currentreq='+ currentrequestor);
			nlapiLogExecution('DEBUG','On Requisition Client','currentemployee='+ currentemployee);
			
			if(currentemployee !== currentrequestor && currentemployee !== "")
			{
					var Employee = nlapiGetFieldValue('entity');
					getEmpDetails();
					var changedemployee = nlapiGetFieldValue('entity');
					nlapiSetFieldValue('custpage_currentreq', changedemployee);
					nlapiLogExecution('DEBUG','On Requisition Client','Employee='+ Employee);
			}
			
			if(type == 'item' && name == 'custcol_select_currency')
			{
					
					//var EmpCostCentre = nlapiLookupField('employee',Employee,'department');
					//var EmpRegion = nlapiLookupField('employee',Employee,'location');
					//var EmpSupervisor = nlapiLookupField('employee',Employee,'supervisor');
					//nlapiSetFieldValue('department', EmpCostCentre);
					//nlapiSetFieldValue('location', EmpRegion);
					//nlapiSetFieldValue('custbody_po_1st_approver', EmpSupervisor);// ----
					
				var SelectCurrency = nlapiGetCurrentLineItemValue('item', 'custcol_select_currency');
				nlapiLogExecution('DEBUG','On Requisition Client','SelectCurrency='+ SelectCurrency);
				
				//alert('SelectCurrency='+SelectCurrency)
				
				if(SelectCurrency == 'T')
				{
					var Vendor = nlapiGetCurrentLineItemValue('item', 'povendor');
					nlapiLogExecution('DEBUG','On Requisition Client','Vendor='+ Vendor);
					
					if(_logValidation(Vendor))
					{
						var SubsidiaryCurrency = nlapiGetFieldValue('currency');
						nlapiLogExecution('DEBUG','On Requisition Client','SubsidiaryCurrency='+ SubsidiaryCurrency);
						
						var Date = nlapiGetFieldValue('trandate');
						nlapiLogExecution('DEBUG','On Requisition Client','Date='+ Date);
						
						//var temp = 'https://forms.eu1.netsuite.com/app/site/hosting/scriptlet.nl?script=876&deploy=1&compid=3431250_SB4&h=755e432c697955cc1d71';
						//var temp = 'https://system.eu2.netsuite.com/app/site/hosting/scriptlet.nl?script=1093&deploy=1';
						var temp = '/app/site/hosting/scriptlet.nl?script=1093&deploy=1'
						temp+='&custscript_vendor_id='+Vendor;
						temp+='&custscript_subsidiary_currency='+SubsidiaryCurrency;
						temp+='&custscript_requisition_date='+Date;
						 
						var objWind = window.open(temp, "_blank", "toolbar=no,menubar=0,status=0,copyhistory=0,scrollbars=yes,resizable=1,location=0,Width=450,Height=450");
					}
					else
					{
						var Value = 0;
						
						var SubsidiaryCurrency = nlapiGetFieldValue('currency');
						//nlapiLogExecution('DEBUG','On Requisition Client','SubsidiaryCurrency='+ SubsidiaryCurrency);
						
						nlapiSetCurrentLineItemValue('item','custcol_vendor_currency',SubsidiaryCurrency,true,true);
						nlapiSetCurrentLineItemValue('item', 'rate',Value,true,true);
						nlapiSetCurrentLineItemValue('item', 'estimatedrate',Value,true,true);
						nlapiSetCurrentLineItemValue('item', 'amount',Value,true,true);
						nlapiSetCurrentLineItemValue('item', 'estimatedamount',Value,true,true);
						nlapiSetCurrentLineItemValue('item', 'custcol_vendor_currency_rate',Value,true,true);
						nlapiSetCurrentLineItemValue('item', 'custcol_vendor_currency_amount',Value,true,true);
						
						nlapiSetCurrentLineItemValue('item', 'custcol_select_currency','F',true,true);
						
						alert('Please select a vendor');
					}
				}
			}
			
			//---------- end of new code -------------
			
			if(type == 'item' && name == 'povendor')
			{
				var Vendor = nlapiGetCurrentLineItemValue('item', 'povendor');
				//nlapiLogExecution('DEBUG','On Requisition Client','Vendor='+ Vendor);
				
				if(_logValidation(Vendor))
				{
					//var VendorCurrency = nlapiLookupField('vendor',Vendor,'currency');
					//nlapiLogExecution('DEBUG','On Requisition Client','VendorCurrency='+ VendorCurrency);
					
					var exrate = 1;
					nlapiSetCurrentLineItemValue('item','custcol_vendor_currency','',true,true);
					nlapiSetCurrentLineItemValue('item','custcol_selected_currency_ex_rate',exrate,true,true);
				}
				else
				{
					var Value = 0;
					
					var SubsidiaryCurrency = nlapiGetFieldValue('currency');
					//nlapiLogExecution('DEBUG','On Requisition Client','SubsidiaryCurrency='+ SubsidiaryCurrency);
					
					nlapiSetCurrentLineItemValue('item','custcol_vendor_currency',SubsidiaryCurrency,true,true);
					nlapiSetCurrentLineItemValue('item', 'rate',Value,true,true);
					nlapiSetCurrentLineItemValue('item', 'estimatedrate',Value,true,true);
					nlapiSetCurrentLineItemValue('item', 'amount',Value,true,true);
					nlapiSetCurrentLineItemValue('item', 'estimatedamount',Value,true,true);
					nlapiSetCurrentLineItemValue('item', 'custcol_vendor_currency_rate',Value,true,true);
					nlapiSetCurrentLineItemValue('item', 'custcol_vendor_currency_amount',Value,true,true);
				}
			}
			
			if(type == 'item' && name == 'custcol_vendor_currency')
			{
				var Currency = nlapiGetCurrentLineItemValue('item', 'custcol_vendor_currency');
				//nlapiLogExecution('DEBUG','On Requisition Client','Currency='+ Currency);
				
				if(_logValidation(Currency))
				{
					nlapiSetCurrentLineItemValue('item', 'custcol_select_currency','F',true,true);
					
					var VendorCurrencyRate = nlapiGetCurrentLineItemValue('item', 'custcol_vendor_currency_rate');
					//nlapiLogExecution('DEBUG','On Requisition Client','VendorCurrencyRate='+ VendorCurrencyRate);
					
					if(_logValidation(VendorCurrencyRate))
					{
						var Quantity = nlapiGetCurrentLineItemValue('item', 'quantity');
						//nlapiLogExecution('DEBUG','On Requisition Client','Quantity='+ Quantity);
						
						if(_logValidation(Quantity))
						{
							var exchgRate = nlapiGetCurrentLineItemValue('item', 'custcol_selected_currency_ex_rate');
							//nlapiLogExecution('DEBUG','On Requisition Client','exchgRate='+ exchgRate);
							
							var VendorCurrencyAmount = VendorCurrencyRate * Quantity;
							VendorCurrencyAmount = roundNumber(VendorCurrencyAmount);
							//nlapiLogExecution('DEBUG','On Requisition Client','VendorCurrencyAmount='+ VendorCurrencyAmount);
							
							//var EstimatedRate = VendorCurrencyRate * exchgRate;
							var EstimatedRate = VendorCurrencyRate/exchgRate;
							EstimatedRate = roundNumber(EstimatedRate);
							//nlapiLogExecution('DEBUG','On Requisition Client','EstimatedRate='+ EstimatedRate);
							
							var EstimatedAmount = EstimatedRate * Quantity;
							EstimatedAmount = roundNumber(EstimatedAmount);
							//nlapiLogExecution('DEBUG','On Requisition Client','EstimatedAmount='+ EstimatedAmount);
							
							nlapiSetCurrentLineItemValue('item', 'rate',EstimatedRate,true,true);
							nlapiSetCurrentLineItemValue('item', 'estimatedrate',EstimatedRate,true,true);
							nlapiSetCurrentLineItemValue('item', 'amount',EstimatedAmount,true,true);
							nlapiSetCurrentLineItemValue('item', 'estimatedamount',EstimatedAmount,true,true);
							nlapiSetCurrentLineItemValue('item', 'custcol_vendor_currency_amount',VendorCurrencyAmount,true,true);
						}
						
					}
				}
			}
			
			if(type == 'item' && name == 'custcol_vendor_currency_rate')
			{
				
				var Currency = nlapiGetCurrentLineItemValue('item', 'custcol_vendor_currency');
				//nlapiLogExecution('DEBUG','On Requisition Client','Currency='+ Currency);
				
				if(_logValidation(Currency))
				{
					var VendorCurrencyRate = nlapiGetCurrentLineItemValue('item', 'custcol_vendor_currency_rate');
					//nlapiLogExecution('DEBUG','On Requisition Client','VendorCurrencyRate='+ VendorCurrencyRate);
					
					if(_logValidation(VendorCurrencyRate))
					{
						var Quantity = nlapiGetCurrentLineItemValue('item', 'quantity');
						//nlapiLogExecution('DEBUG','On Requisition Client','Quantity='+ Quantity);
						
						if(_logValidation(Quantity))
						{
							var exchgRate = nlapiGetCurrentLineItemValue('item', 'custcol_selected_currency_ex_rate');
							//nlapiLogExecution('DEBUG','On Requisition Client','exchgRate='+ exchgRate);
							
							var VendorCurrencyAmount = VendorCurrencyRate * Quantity;
							VendorCurrencyAmount = roundNumber(VendorCurrencyAmount);
							//nlapiLogExecution('DEBUG','On Requisition Client','VendorCurrencyAmount='+ VendorCurrencyAmount);
							
							//var EstimatedRate = VendorCurrencyRate * exchgRate;
							var EstimatedRate = VendorCurrencyRate/exchgRate;
							EstimatedRate = roundNumber(EstimatedRate);
							//nlapiLogExecution('DEBUG','On Requisition Client','EstimatedRate='+ EstimatedRate);
							
							var EstimatedAmount = EstimatedRate * Quantity;
							EstimatedAmount = roundNumber(EstimatedAmount);
							//nlapiLogExecution('DEBUG','On Requisition Client','EstimatedAmount='+ EstimatedAmount);
							
							nlapiSetCurrentLineItemValue('item', 'rate',EstimatedRate,true,true);
							nlapiSetCurrentLineItemValue('item', 'estimatedrate',EstimatedRate,true,true);
							nlapiSetCurrentLineItemValue('item', 'amount',EstimatedAmount,true,true);
							nlapiSetCurrentLineItemValue('item', 'estimatedamount',EstimatedAmount,true,true);
							nlapiSetCurrentLineItemValue('item', 'custcol_vendor_currency_amount',VendorCurrencyAmount,true,true);
						}
						
					}
				}
				
			}
			
			if(type == 'item' && name == 'quantity')
			{
				var Currency = nlapiGetCurrentLineItemValue('item', 'custcol_vendor_currency');
				//nlapiLogExecution('DEBUG','On Requisition Client','Currency='+ Currency);
				
				if(_logValidation(Currency))
				{
					var VendorCurrencyRate = nlapiGetCurrentLineItemValue('item', 'custcol_vendor_currency_rate');
					//nlapiLogExecution('DEBUG','On Requisition Client','VendorCurrencyRate='+ VendorCurrencyRate);
					
					if(_logValidation(VendorCurrencyRate))
					{
						var Quantity = nlapiGetCurrentLineItemValue('item', 'quantity');
						//nlapiLogExecution('DEBUG','On Requisition Client','Quantity='+ Quantity);
						
						if(_logValidation(Quantity))
						{
							var exchgRate = nlapiGetCurrentLineItemValue('item', 'custcol_selected_currency_ex_rate');
							//nlapiLogExecution('DEBUG','On Requisition Client','exchgRate='+ exchgRate);
							
							var VendorCurrencyAmount = VendorCurrencyRate * Quantity;
							VendorCurrencyAmount = roundNumber(VendorCurrencyAmount);
							//nlapiLogExecution('DEBUG','On Requisition Client','VendorCurrencyAmount='+ VendorCurrencyAmount);
							
							//var EstimatedRate = VendorCurrencyRate * exchgRate;
							var EstimatedRate = VendorCurrencyRate/exchgRate;
							EstimatedRate = roundNumber(EstimatedRate);
							//nlapiLogExecution('DEBUG','On Requisition Client','EstimatedRate='+ EstimatedRate);
							
							var EstimatedAmount = EstimatedRate * Quantity;
							EstimatedAmount = roundNumber(EstimatedAmount);
							//nlapiLogExecution('DEBUG','On Requisition Client','EstimatedAmount='+ EstimatedAmount);
							
							nlapiSetCurrentLineItemValue('item', 'rate',EstimatedRate,true,true);
							nlapiSetCurrentLineItemValue('item', 'estimatedrate',EstimatedRate,true,true);
							nlapiSetCurrentLineItemValue('item', 'amount',EstimatedAmount,true,true);
							nlapiSetCurrentLineItemValue('item', 'estimatedamount',EstimatedAmount,true,true);
							nlapiSetCurrentLineItemValue('item', 'custcol_vendor_currency_amount',VendorCurrencyAmount,true,true);
						}
						
					}
				}
			}
		} 
		catch (error)
		{
			if (error.getDetails != undefined)
			{
				nlapiLogExecution('ERROR','Process Error',  error.getCode() + ': ' + error.getDetails());
				throw error;
			}
			else
			{
				nlapiLogExecution('ERROR','Unexpected Error', error.toString()); 
				throw nlapiCreateError('99999', error.toString());
			}    	 
			return null;
		}    
	}

	function validateLine_OnRequisition(type)
	{
		if (type == 'item')
		{
			var Currency = nlapiGetCurrentLineItemValue('item', 'custcol_vendor_currency');
			//nlapiLogExecution('DEBUG','On Requisition Client','Currency='+ Currency);
			
			var EstimatedAmount;
			
			if(_logValidation(Currency))
			{
				var VendorCurrencyRate = nlapiGetCurrentLineItemValue('item', 'custcol_vendor_currency_rate');
				//nlapiLogExecution('DEBUG','On Requisition Client','VendorCurrencyRate='+ VendorCurrencyRate);
				
				if(_logValidation(VendorCurrencyRate))
				{
					if(parseFloat(VendorCurrencyRate) > 0)// -------- CHG0098908
					{
						var Quantity = nlapiGetCurrentLineItemValue('item', 'quantity');
						//nlapiLogExecution('DEBUG','On Requisition Client','Quantity='+ Quantity);
						
						if(_logValidation(Quantity))
						{
							if(Quantity > 0)// -------- CHG0098908
							{
								var exchgRate = nlapiGetCurrentLineItemValue('item', 'custcol_selected_currency_ex_rate');
								//nlapiLogExecution('DEBUG','On Requisition Client','exchgRate='+ exchgRate);
								
								var VendorCurrencyAmount = VendorCurrencyRate * Quantity;
								VendorCurrencyAmount = roundNumber(VendorCurrencyAmount);
								//nlapiLogExecution('DEBUG','On Requisition Client','VendorCurrencyAmount='+ VendorCurrencyAmount);
								
								//var EstimatedRate = VendorCurrencyRate * exchgRate;
								var EstimatedRate = VendorCurrencyRate/exchgRate;
								
								if(EstimatedRate > 1)// -------- CHG0098908
								{
									EstimatedRate = roundNumber(EstimatedRate);
									//nlapiLogExecution('DEBUG','On Requisition Client','EstimatedRate='+ EstimatedRate);
								}
								
								EstimatedAmount = EstimatedRate * Quantity;
								
								if(EstimatedAmount > 1)// -------- CHG0098908
								{
									EstimatedAmount = roundNumber(EstimatedAmount);
									//nlapiLogExecution('DEBUG','On Requisition Client','EstimatedAmount='+ EstimatedAmount);
								}
								
								nlapiSetCurrentLineItemValue('item', 'rate',EstimatedRate,true,true);
								nlapiSetCurrentLineItemValue('item', 'estimatedrate',EstimatedRate,true,true);
								nlapiSetCurrentLineItemValue('item', 'amount',EstimatedAmount,true,true);
								nlapiSetCurrentLineItemValue('item', 'estimatedamount',EstimatedAmount,true,true);
								nlapiSetCurrentLineItemValue('item', 'custcol_vendor_currency_amount',VendorCurrencyAmount,true,true);
							}
							else// -------- CHG0098908
							{
								alert('The quantity should be greater than zero. Please enter a value for the quantity.')// -------- CHG0098908
								return false;// -------- CHG0098908
							}
							
						}
					}
					else// -------- CHG0098908
					{
						alert('The vendor currency rate should be greater than zero. Please enter a value for the rate.')// -------- CHG0098908
						return false;// -------- CHG0098908
					}
				}
				//nlapiLogExecution('DEBUG','On Requisition Client','EstimatedAmount less than 1='+ EstimatedAmount);// -------- CHG0098908
				
				var LineEstimatedAmount = nlapiGetCurrentLineItemValue('item', 'estimatedamount');// -------- CHG0098908
				//nlapiLogExecution('DEBUG','On Requisition Client','LineEstimatedAmount='+ LineEstimatedAmount);// -------- CHG0098908
				
				//if(_logValidation(EstimatedAmount))// -------- CHG0098908
				if(_logValidation(LineEstimatedAmount))// -------- CHG0098908
				{
					//if(parseFloat(EstimatedAmount) > 0)// -------- CHG0098908
					if(parseFloat(LineEstimatedAmount) > 0)// -------- CHG0098908
					{
						return true;
					}
					else
					{
						alert('The line amount should be greater than zero. Please enter a value for the line item.')
						return false;
					}
				}
			}
			return true;
		}
		else
		{
			return true;
		}
	}

	function postSourcing_OnRequisition(type, name) 
	{
		
			
		
		if (type === 'item' && name === 'item')
		{
			var Currency = nlapiGetCurrentLineItemValue('item', 'custcol_vendor_currency');
			//nlapiLogExecution('DEBUG','On Requisition Client','Currency='+ Currency);
			
			if(_logValidation(Currency))
			{
				var VendorCurrencyRate = nlapiGetCurrentLineItemValue('item', 'custcol_vendor_currency_rate');
				//nlapiLogExecution('DEBUG','On Requisition Client','VendorCurrencyRate='+ VendorCurrencyRate);
				
				if(_logValidation(VendorCurrencyRate))
				{
					var Quantity = nlapiGetCurrentLineItemValue('item', 'quantity');
					//nlapiLogExecution('DEBUG','On Requisition Client','Quantity='+ Quantity);
					
					if(_logValidation(Quantity))
					{
						var exchgRate = nlapiGetCurrentLineItemValue('item', 'custcol_selected_currency_ex_rate');
						//nlapiLogExecution('DEBUG','On Requisition Client','exchgRate='+ exchgRate);
						
						var VendorCurrencyAmount = VendorCurrencyRate * Quantity;
						VendorCurrencyAmount = roundNumber(VendorCurrencyAmount);
						//nlapiLogExecution('DEBUG','On Requisition Client','VendorCurrencyAmount='+ VendorCurrencyAmount);
						
						//var EstimatedRate = VendorCurrencyRate * exchgRate;
						var EstimatedRate = VendorCurrencyRate/exchgRate;
						EstimatedRate = roundNumber(EstimatedRate);
						//nlapiLogExecution('DEBUG','On Requisition Client','EstimatedRate='+ EstimatedRate);
						
						var EstimatedAmount = EstimatedRate * Quantity;
						EstimatedAmount = roundNumber(EstimatedAmount);
						//nlapiLogExecution('DEBUG','On Requisition Client','EstimatedAmount='+ EstimatedAmount);
						
						nlapiSetCurrentLineItemValue('item', 'rate',EstimatedRate,true,true);
						nlapiSetCurrentLineItemValue('item', 'estimatedrate',EstimatedRate,true,true);
						nlapiSetCurrentLineItemValue('item', 'amount',EstimatedAmount,true,true);
						nlapiSetCurrentLineItemValue('item', 'estimatedamount',EstimatedAmount,true,true);
						nlapiSetCurrentLineItemValue('item', 'custcol_vendor_currency_amount',VendorCurrencyAmount,true,true);
					}
					
				}
			}
			
		}
		
		if (type === 'item' && name === 'povendor')
		{
			//var Currency = nlapiGetCurrentLineItemValue('item', 'custcol_vendor_currency');
			//nlapiLogExecution('DEBUG','On Requisition Client','Currency='+ Currency);
			
			//if(_logValidation(Currency))
			{
				var VendorCurrencyRate = nlapiGetCurrentLineItemValue('item', 'custcol_vendor_currency_rate');
				//alert(VendorCurrencyRate);
				//nlapiLogExecution('DEBUG','On Requisition Client','VendorCurrencyRate='+ VendorCurrencyRate);
				
				if(_logValidation(VendorCurrencyRate))
				{
					var Quantity = nlapiGetCurrentLineItemValue('item', 'quantity');
					//alert(Quantity)
					//nlapiLogExecution('DEBUG','On Requisition Client','Quantity='+ Quantity);
					
					if(_logValidation(Quantity))
					{
						var exchgRate = nlapiGetCurrentLineItemValue('item', 'custcol_selected_currency_ex_rate');
						//nlapiLogExecution('DEBUG','On Requisition Client','exchgRate='+ exchgRate);
						
						var VendorCurrencyAmount = VendorCurrencyRate * Quantity;
						VendorCurrencyAmount = roundNumber(VendorCurrencyAmount);
						//nlapiLogExecution('DEBUG','On Requisition Client','VendorCurrencyAmount='+ VendorCurrencyAmount);
						
						//var EstimatedRate = VendorCurrencyRate * exchgRate;
						var EstimatedRate = VendorCurrencyRate/exchgRate;
						EstimatedRate = roundNumber(EstimatedRate);
						//nlapiLogExecution('DEBUG','On Requisition Client','EstimatedRate='+ EstimatedRate);
						
						var EstimatedAmount = EstimatedRate * Quantity;
						EstimatedAmount = roundNumber(EstimatedAmount);
						//nlapiLogExecution('DEBUG','On Requisition Client','EstimatedAmount='+ EstimatedAmount);
						
						nlapiSetCurrentLineItemValue('item', 'rate',EstimatedRate,true,true);
						nlapiSetCurrentLineItemValue('item', 'estimatedrate',EstimatedRate,true,true);
						nlapiSetCurrentLineItemValue('item', 'amount',EstimatedAmount,true,true);
						nlapiSetCurrentLineItemValue('item', 'estimatedamount',EstimatedAmount,true,true);
						nlapiSetCurrentLineItemValue('item', 'custcol_vendor_currency_amount',VendorCurrencyAmount,true,true);
					}
					
				}
			}
			
		}
		
		return true;
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

	function roundNumber(number)
	{
		var decimals = 2;
		var newnumber = new Number(number + '').toFixed(parseInt(decimals));
		parseFloat(newnumber);
		return newnumber;
	}

	// below function is used for user event script order requisition
	function createPO()
	{
		try
		{
			//alert('This feature is not available yet. Please do not click on this button for now. Please use the Create Purchase Order button for testing. Thank you.')
			var RequisitionID = nlapiGetRecordId();
			//nlapiLogExecution('DEBUG','On Requisition Client','RequisitionID='+ RequisitionID);
			
			//var context = nlapiGetContext();
			var searchURL = nlapiResolveURL('SUITELET','customscript_ns_sl_order_requisition','customdeploy_ns_sl_order_requisition');

			if(_logValidation(RequisitionID))
				searchURL+='&requisition_id='+RequisitionID;
			
			//var searchURL = nlapiResolveURL('RECORD', 'purchaserequisition', RequisitionID, 'VIEW');

			window.ischanged=false;
			window.location=searchURL;
		}
		catch(e)
		{
			 nlapiLogExecution('ERROR','Process Error',  e.getCode() + ': ' + e.getDetails());
		}
		
	}

	//below function is used to validate currency suitelet

	function setCurrencyValue(CurID, exchgRate)
	{
		//alert('setting currency = '+CurID);
		nlapiSetCurrentLineItemValue('item','custcol_vendor_currency', CurID, true, true);	 
		nlapiSetCurrentLineItemValue('item','custcol_selected_currency_ex_rate', exchgRate, true, true);
		nlapiSetCurrentLineItemValue('item','custcol_select_currency', 'F', true, true);
		
		//alert('commiting line item');
		//nlapiCommitLineItem('item');
		
		/*alert('set function')
		var group = 'custpage_machine';
		var lnCnt = nlapiGetLineItemCount(group);
		nlapiLogExecution('DEBUG', 'suitlet in post', 'lnCnt===' + lnCnt);
		alert('lnCnt='+lnCnt)

		for(var ln=1;ln<=lnCnt;ln++)
		{
			if(nlapiGetLineItemValue(group,'custpage_select',ln)=='T')
			{
				var CurID = nlapiGetLineItemValue(group,'custpage_currency_internalid',ln);
				nlapiLogExecution('DEBUG', 'suitlet in post', 'CurID===' + CurID);
				break;
			}
		}
		alert('CurID='+CurID)
		
		if(_logValidation(CurID))
		{
			window.opener.nlapiSetCurrentLineItemValue(('item', 'custcol_vendor_currency', CurID);
		}
		
		//nlapiSetCurrentLineItemValue, true, true);
		
		window.close();*/
	}

	//below function is used for user event script set Employee Details
	function getEmpDetails()
	{
		try
		{
			var EmpID = nlapiGetFieldValue('entity');
			//alert('EmpID ='+EmpID)
			//nlapiLogExecution('DEBUG','On Requisition Client','EmpID='+ EmpID);
			
			//var temp = 'https://system.eu2.netsuite.com/app/site/hosting/scriptlet.nl?script=1092&deploy=1';
			var temp = '/app/site/hosting/scriptlet.nl?script=1092&deploy=1'
			temp+='&custscript_employee_id_cl='+EmpID;
			 
			var objWind = window.open(temp, "_blank", "toolbar=no,menubar=0,status=0,copyhistory=0,scrollbars=yes,resizable=1,location=0,Width=800,Height=300");
		}
		catch(e)
		{
			 nlapiLogExecution('ERROR','Process Error',  e.getCode() + ': ' + e.getDetails());
		}
		
	}

	//function setEmpDetails(EmpCostCentre, EmpProduct, EmpRegion)
	function setEmpDetails(EmpCostCentre, EmpRegion, EmpSupervisor,EmpProduct)// -------- CHG0098908
	{
		//alert('EmpCostCentre ='+EmpCostCentre)
		//alert('EmpProduct ='+EmpProduct)
		//alert('EmpRegion ='+EmpRegion)
		
		nlapiSetFieldValue('department', EmpCostCentre);
		nlapiSetFieldValue('class', EmpProduct);
		nlapiSetFieldValue('location', EmpRegion);
		nlapiSetFieldValue('custbody_po_1st_approver', EmpSupervisor);// -------- CHG0098908
		/*window.opener.nlapiSetFieldValue('department', EmpCostCentre);
		window.opener.nlapiSetFieldValue('class', EmpProduct);
		window.opener.nlapiSetFieldValue('location', EmpRegion);*/
		//window.open("","_self");
		//window.close();
		
		
	}