// BEGIN SCRIPT DESCRIPTION BLOCK  ==================================
{
/*
 * 
 * 
   	Script Name: US Tax Distribute Client
	Author: Shubhradeep Saha
	Company: Finastra
	Date: 3rd Jan 2018
	Description:

	Script Modification Log:

	-- Date --			-- Modified By --				--Requested By--				-- Description --

*/
}
// END SCRIPT DESCRIPTION BLOCK  ====================================



// BEGIN GLOBAL VARIABLE BLOCK  =====================================
{
	//  Initialize any Global Variables, in particular, debugging variables...




}
// END GLOBAL VARIABLE BLOCK  =======================================

// BEGIN FUNCTION ===================================================
{

function pageInit_UStax(type)
{
	var Subsidiary = nlapiGetFieldValue('subsidiary');
	//alert('Subsidiary=='+Subsidiary)
	if(_logValidation(Subsidiary))
	{
		var Country = nlapiLookupField('subsidiary', Subsidiary, 'country');
		//alert('Country=='+Country)
		if(Country != 'US')
		{
			var TaxField = nlapiGetField('custbody_use_tax');
			//alert('TaxField=='+TaxField)
			if(_logValidation(TaxField))
			{
				TaxField.setDisplayType('hidden');
				
				document.getElementById("custbody_distribute_tax_fs").style.visibility = "hidden";
				
				nlapiDisableLineItemField('item', 'custcol_exclude_us_tax', true);
				//var TaxColumn = nlapiGetLineItemField('item', 'custcol_exclude_us_tax');
				//alert('TaxColumn=='+TaxColumn)
				//TaxColumn.setDisplayType('hidden');
			}
		}
	}
	return true;
}
	
function DistributeTax()
{
	var TotalAmount = 0.0;
	
	var SelfAssessmentTax = nlapiGetFieldValue('custbody_use_tax');
	//nlapiLogExecution('DEBUG', 'distribute tax' ,'SelfAssessmentTax==  '+SelfAssessmentTax);
	
	if(_logValidation(SelfAssessmentTax) && parseFloat(SelfAssessmentTax) > TotalAmount)
	{
	    
		var result = confirm("This action will remove all the lines present in the expense tab and fill with updated values. Are you sure to proceed?");
		if(result)
		{
			//Logic to delete the item
			var ExLineCount = nlapiGetLineItemCount('expense');
			//nlapiLogExecution('DEBUG', 'distribute tax' ,'ExLineCount==  '+ExLineCount);
			
			for(var m = 1; m <= ExLineCount; m++)
			{
				nlapiRemoveLineItem('expense', m);
			}
			//nlapiLogExecution('DEBUG', 'distribute tax' ,'All lines removed');
			
			var LineItemCount = nlapiGetLineItemCount('item');
			//nlapiLogExecution('DEBUG', 'distribute tax' ,'LineItemCount==  '+LineItemCount);
			
			var ExpenseItem = new Array();
			for(var a = 0; a < LineItemCount; a++)
			{
				ExpenseItem[a] = new Array();
				for(var b = 0; b <5; b++)
				{ 
					ExpenseItem[a][b] = '';
				}
			}
			
			for(var i = 1; i <= LineItemCount; i++)
			{
				var ApplyUStax = nlapiGetLineItemValue('item','custcol_exclude_us_tax', i);
				//nlapiLogExecution('DEBUG', 'distribute tax' ,'ApplyUStax==  '+ApplyUStax);
				//alert('ApplyUStax==  '+ApplyUStax)
				
				if(ApplyUStax != 'T')
				{
					var Amount = nlapiGetLineItemValue('item', 'amount', i);
					//nlapiLogExecution('DEBUG', 'distribute tax' ,'Amount==  '+Amount);
					
					TotalAmount = parseFloat(TotalAmount) + parseFloat(Amount);
				}
				
			}
			//nlapiLogExecution('DEBUG', 'distribute tax' ,'TotalAmount==  '+TotalAmount);
			//alert('TotalAmount==  '+TotalAmount)
			
			for(var j = 1; j <= LineItemCount; j++)
			{
				var ApplyUStax = nlapiGetLineItemValue('item', 'custcol_exclude_us_tax', j);
				//nlapiLogExecution('DEBUG', 'distribute tax' ,'ApplyUStax==  '+ApplyUStax);
				//alert('ApplyUStax==  '+ApplyUStax)
				
				if(ApplyUStax != 'T')
				{
					var ItemID = nlapiGetLineItemValue('item', 'item', j);
					//nlapiLogExecution('DEBUG', 'distribute tax' ,'ItemID==  '+ItemID);
					
					var Amount = nlapiGetLineItemValue('item', 'amount', j);
					//nlapiLogExecution('DEBUG', 'distribute tax' ,'Amount==  '+Amount);
					
					var CostCentre = nlapiGetLineItemValue('item', 'department', j);
					//nlapiLogExecution('DEBUG', 'distribute tax' ,'CostCentre==  '+CostCentre);
					
					var Product = nlapiGetLineItemValue('item', 'class', j);
					//nlapiLogExecution('DEBUG', 'distribute tax' ,'Product==  '+Product);
					
					var Region = nlapiGetLineItemValue('item', 'location', j);
					//nlapiLogExecution('DEBUG', 'distribute tax' ,'Region==  '+Region);
					
					var ExpenseAccount = nlapiLookupField('noninventoryitem', ItemID, 'expenseaccount');
					//nlapiLogExecution('DEBUG', 'distribute tax' ,'ExpenseAccount==  '+ExpenseAccount);
					
					var WeightedPercent = parseFloat(Amount)/parseFloat(TotalAmount);
					//nlapiLogExecution('DEBUG', 'distribute tax' ,'WeightedPercent==  '+WeightedPercent);
					//alert('WeightedPercent==  '+WeightedPercent)
					
					var ExpenseAmount = roundNumber(WeightedPercent * SelfAssessmentTax);
					//nlapiLogExecution('DEBUG', 'distribute tax' ,'ExpenseAmount==  '+ExpenseAmount);
					//alert('ExpenseAmount==  '+ExpenseAmount)
					
					var ExpenseLength = ExpenseItem.length;
					for(var c = 0; c <= ExpenseLength; c++)
					{
						var FItem = ExpenseItem[c][0];
						/*if(FItem == ExpenseAccount)
						{
							var AQty = ADDItem[c][1];
							var Tqty = parseInt(AQty) + parseInt(qty);
							ADDItem[c][1] = Tqty;
							break;
						}*/
						//else if(FItem == '')
						if(FItem == '')
						{
							ExpenseItem[c][0] = ExpenseAccount;
							ExpenseItem[c][1] = ExpenseAmount;
							ExpenseItem[c][2] = CostCentre;
							ExpenseItem[c][3] = Product;
							ExpenseItem[c][4] = Region;
							break;
						}
					}
				}
			}
			
			var ExpenseLineItemLength = ExpenseItem.length;
			for(var d = 0; d <= ExpenseLineItemLength; d++)
			{
				var addExpenseItem = ExpenseItem[d][0];
				if(addExpenseItem == '')
				{
					break;
				}
				else
				{
					var Ex_Account = ExpenseItem[d][0];
					var Ex_Amount = ExpenseItem[d][1];
					var Ex_Cost_Centre = ExpenseItem[d][2];
					var Ex_Product = ExpenseItem[d][3];
					var Ex_Region = ExpenseItem[d][4];
					
					var MemoValue = 'US Tax';
					
					nlapiSelectNewLineItem('expense');
					
					nlapiSetCurrentLineItemValue('expense', 'account', Ex_Account, true, true);
					nlapiSetCurrentLineItemValue('expense', 'amount', Ex_Amount, true, true);
					nlapiSetCurrentLineItemValue('expense', 'department', Ex_Cost_Centre, true, true);
					nlapiSetCurrentLineItemValue('expense', 'class', Ex_Product, true, true);
					nlapiSetCurrentLineItemValue('expense', 'location', Ex_Region, true, true);
					
					//---added as per demo 
					nlapiSetCurrentLineItemValue('expense', 'memo', MemoValue, true, true);

					// commit the line to the database
					nlapiCommitLineItem('expense');
				}
			}
		}
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

function roundNumber(number)
{
    var decimals = 2;
	var newnumber = new Number(number + '').toFixed(parseInt(decimals));
    parseFloat(newnumber);
    return newnumber;
}
// END FUNCTION =====================================================