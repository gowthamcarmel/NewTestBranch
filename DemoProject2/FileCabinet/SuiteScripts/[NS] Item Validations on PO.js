function afterSubmit_ItemValidations_onPO(type)
{
	try
	{
		/*var currentContext = nlapiGetContext(); 
		if(currentContext.getExecutionContext()!='scheduled' && currentContext.getExecutionContext()!='suitelet' && currentContext.getExecutionContext()!='userinterface')
		{
			nlapiLogExecution('DEBUG','context', currentContext.getExecutionContext());
			return;
		}*/
		
		var poId = nlapiGetRecordId();
		//nlapiLogExecution('DEBUG','user event','poId==' +poId);
	    var RecordType = nlapiGetRecordType();
	    //nlapiLogExecution('DEBUG','user event','RecordType==' +RecordType);
	    
	    var PORec = nlapiLoadRecord(RecordType, poId);
	    //nlapiLogExecution('DEBUG','user event','PORec==' +PORec);
	    
	    var InterCompanyTran = PORec.getFieldValue('intercotransaction');
	    nlapiLogExecution('DEBUG','user event','InterCompanyTran==' +InterCompanyTran);
	    
	    if(_nullValidation(InterCompanyTran))
	    {
	    	var POLineItemCount = PORec.getLineItemCount('item');
			//nlapiLogExecution('DEBUG','user event','POLineItemCount==' +POLineItemCount);
			
			for (var i = 1; i <= POLineItemCount; i++)	
			{
				var ItemID = PORec.getLineItemValue('item','item', i);
				//nlapiLogExecution('DEBUG','user event','ItemID==' +ItemID);
				
				var LineItemType = PORec.getLineItemValue('item','itemtype', i);
				nlapiLogExecution('DEBUG','user event','LineItemType==' +LineItemType);
				
				var ItemType = 'noninventoryitem';
				
				if(LineItemType == 'Service')
				{
					ItemType = 'serviceitem';
				}
				nlapiLogExecution('DEBUG','user event','ItemType==' +ItemType);
				
				var ItemCategory = nlapiLookupField(ItemType, ItemID, 'custitem_category');
				//nlapiLogExecution('DEBUG','user event','ItemCategory==' +ItemCategory);
				
				var ItemSubCategory1 = nlapiLookupField(ItemType, ItemID, 'custitem_subcat1');
				//nlapiLogExecution('DEBUG','user event','ItemSubCategory1==' +ItemSubCategory1);
				
				var ItemSubCategory2 = nlapiLookupField(ItemType, ItemID, 'custitem_subcat2');
				//nlapiLogExecution('DEBUG','user event','ItemSubCategory2==' +ItemSubCategory2);
				
				var ItemDescription = nlapiLookupField(ItemType, ItemID, 'purchasedescription');
				//nlapiLogExecution('DEBUG','user event','ItemDescription==' +ItemDescription);
				
				PORec.setLineItemValue('item','custcol_item_selected', i, ItemID);
				PORec.setLineItemValue('item','custcol_misyscategory', i, ItemCategory);
				PORec.setLineItemValue('item','custcol_misyssubcategory1', i, ItemSubCategory1);
				PORec.setLineItemValue('item','custcol_misyssubcategory2', i, ItemSubCategory2);
				//PORec.setLineItemValue('item','description', i, ItemDescription);
				PORec.setLineItemValue('item','custcol_select_item', i, 'T');
			}

			var id = nlapiSubmitRecord(PORec,false,false);
			nlapiLogExecution('DEBUG','user event','id==' +id);
	    }
	}
	
	catch(e)
	{
		alert('Error in Process: '+e.message);
	}
}

function _nullValidation(value)
{
	if (value == null || value == 'NaN' || value == '' || value == undefined || value == '&nbsp;')
	{
		return true;
	}
	else
	{
		return false;
	}
}