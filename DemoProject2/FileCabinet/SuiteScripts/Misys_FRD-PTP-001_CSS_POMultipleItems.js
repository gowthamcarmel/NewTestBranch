/**
 * Copyright (c) 1998-2013 NetSuite, Inc.
 * 2955 Campus Drive, Suite 100, San Mateo, CA, USA 94403-2511
 * All Rights Reserved.
 *
 * This software is the confidential and proprietary information of
 * NetSuite, Inc. ("Confidential Information"). You shall not
 * disclose such Confidential Information and shall use it only in
 * accordance with the terms of the license agreement you entered into
 * with NetSuite.
 * 
 * 
 * This is a CSS deployed on Purchase Order record, which is triggered on Field Change of Custom Transaction Column Field 'Select Item'
 * When checked, will pop-up a new window where User can select the Item (availabler per Subsidiary, Item Category, Sub Categories, and Vendor)
 * 
 * Version    Date            Author           Remarks
 * 1.00       14 Sep 2013     mcustodio
 *
 */

/**
 * The recordType (internal id) corresponds to the "Applied To" record in your script deployment. 
 * @appliedtorecord recordType 
 * 
 * @param {String} type Access mode: create, copy, edit
 * @returns {Void}
 */



function clientPageInit(type){
   
}

/**
 * The recordType (internal id) corresponds to the "Applied To" record in your script deployment. 
 * @appliedtorecord recordType
 * 
 * @param {String} type Sublist internal id
 * @param {String} name Field internal id
 * @param {Number} linenum Optional line item number, starts from 1
 * @returns {Void}
 */
function formClientFieldChanged(type, name, linenum){
	
	//alert(type);
	//alert(name);
	
	var fieldTrigger = name;
	
	if (type == 'item' && (fieldTrigger == 'custcol_select_item' || fieldTrigger == 'custcol_misyscategory' || fieldTrigger == 'custcol_misyssubcategory1' || fieldTrigger == 'custcol_misyssubcategory2'))
	{
		if (fieldTrigger == 'custcol_misyscategory' || fieldTrigger == 'custcol_misyssubcategory1' || fieldTrigger == 'custcol_misyssubcategory2')
		{
			nlapiSetCurrentLineItemValue('item', 'item', '', true);
			nlapiSetCurrentLineItemValue('item','rate', '', true);	 
			nlapiSetCurrentLineItemValue('item','quantity', '', true);		
			nlapiSetCurrentLineItemValue('item','custcol_item_selected', '', true);
			
			nlapiSetCurrentLineItemValue('item', 'custcol_select_item', 'F', true);

		}	
		
		var selectItem = nlapiGetCurrentLineItemValue('item', 'custcol_select_item');
		
		if (fieldTrigger == 'custcol_select_item' && selectItem == 'T')
		{	
			var lineItemCount = nlapiGetLineItemCount('item');
			
			if (lineItemCount < 260)
			{			
				var itemCategory = nlapiGetCurrentLineItemValue('item', 'custcol_misyscategory');
				var subCategory1 = nlapiGetCurrentLineItemValue('item', 'custcol_misyssubcategory1');
				var subCategory2 = nlapiGetCurrentLineItemValue('item', 'custcol_misyssubcategory2');
			
				if (itemCategory != '' && subCategory1 != '' && subCategory2 != '')
				{
					var multipleItemFlag = 'true';
				
					var orderVendor = nlapiGetFieldValue('entity');
					var orderCurrency = nlapiGetFieldValue('currency');
					var orderCurrencyText = nlapiGetFieldText('currency');
					
					//var NetSuite_URL = NetSuiteHelper(); //1107 - removing use of Helper function
					//nlapiLogExecution('DEBUG', stLoggerTitle, 'NetSuite_URL: '+NetSuite_URL);
					
					var NetSuite_URL = 'https://'+ window.location.hostname; //1107 - using hostname to avoid conflict for DC movement
					//alert(NetSuite_URL);
					
					var suitelet_url = nlapiResolveURL('SUITELET', 'customscript_suitelet_main_po_form', 'customdeploy_suitelet_main_po_form'); //set the Suitelet Script ID | get Suitelet Internal URL
					//may use NetSuite Helper for ease in dev/design (SB/Prod/etc)
					//nlapiLogExecution('DEBUG', stLoggerTitle, 'Orig URL: '+suitelet_url);
					
					var suitelet_form_url = NetSuite_URL + suitelet_url;
						suitelet_form_url+= '&multipleItemFlag=' + encodeURIComponent(multipleItemFlag);
						suitelet_form_url+= '&itemCategory=' + encodeURIComponent(itemCategory);
						suitelet_form_url+= '&subCategory1=' + encodeURIComponent(subCategory1);
						suitelet_form_url+= '&subCategory2=' + encodeURIComponent(subCategory2);
						suitelet_form_url+= '&orderVendor=' + encodeURIComponent(orderVendor);
						suitelet_form_url+= '&orderCurrency=' + encodeURIComponent(orderCurrency);
						suitelet_form_url+= '&orderCurrencyText=' + encodeURIComponent(orderCurrencyText);
					//nlapiLogExecution('DEBUG', stLoggerTitle, 'Base URL: '+suitelet_form_url);
					
					//open the suitelet in a new window
					//alert(suitelet_form_url);
					newWindow = window.open(suitelet_form_url, '_blank','width=500,height=500,location=no');
				}
				else //one of the categories are not set
				{
					alert('Please select Item Category, Sub-Category 1, and Sub-Category 2 before you can choose an Item.');
					nlapiSetCurrentLineItemValue('item', 'custcol_select_item', 'F');
				}
			}
			else //line item count cannot be more than 60
			{
				alert('You are not allowed to add more than 60 line items on one request. Please save your Transaction.');
			}
			
		}
		
		return true;
	}
	else
	{
		return true;
	}

}


function NetSuiteHelper()
{	//1107 - this helper function is no longer used
	var stLoggerTitle = 'NetSuiteHelper';	
	nlapiLogExecution('DEBUG', stLoggerTitle, '---------- START ----------');
	
    var envURL = 'https://system.'; //setting to system.na1. for TestDrive
    switch(nlapiGetContext().getEnvironment())
    {
        case 'PRODUCTION':
            //envURL += 'netsuite.com';
			envURL += 'na1.netsuite.com'; //setting to system.na1 as Misys Prod is hosted on na1 Domain/Data Center
        break;
        
        case 'SANDBOX':
            envURL += 'sandbox.netsuite.com';
        break;
        
        case 'BETA':
            envURL += 'na1.beta.netsuite.com';
        break;
/*		default:
			envURL += 'p.netsuite.com';
		break;
*/
    }

	nlapiLogExecution('DEBUG', stLoggerTitle, '---------- END ----------');
    return envURL;

}




function populateForm(addItem, addRate, addQuantity, addItemCat, addSubCat1, addSubCat2){ //function to be called by Suitelet to populate the transaction form

	//alert(addItem);
	//alert(addRate);
	//alert(addQuantity);
	//alert(addItemCat);
	//alert(addSubCat1);
	//alert(addSubCat2);

	//alert(nlapiGetLineItemCount('item'));
	//nlapiSelectLineItem('item', nlapiGetLineItemCount('item')+1);
	 
	 var costCenter = nlapiGetFieldValue('department');
	 //alert(costCenter);
	 var product = nlapiGetFieldValue('class');
	 //alert(product);
	 var region = nlapiGetFieldValue('location');
	 //alert(region);
	 
	 nlapiSetCurrentLineItemValue('item','item', addItem, true, true);	 
	 nlapiSetCurrentLineItemValue('item','rate', addRate, true, true);	 
	 nlapiSetCurrentLineItemValue('item','quantity', addQuantity, true, true);
	 
	 nlapiSetCurrentLineItemValue('item','custcol_select_item', 'F');
	 
	 nlapiSetCurrentLineItemValue('item','custcol_item_selected', addItem, true, true);
 
	// alert('setting cost center');
	 nlapiSetCurrentLineItemValue('item','department', costCenter, true, true);	 
	 //alert('setting region');
	 nlapiSetCurrentLineItemValue('item','location', region, true, true);	
	// alert('setting prodcut');
	 nlapiSetCurrentLineItemValue('item','class', product, true, true);	 
	  
	
	//alert('commiting line item');
	nlapiCommitLineItem('item');
	 
}



function resetCheckBox(){

	//alert('Calling reset checkbox');
	nlapiSetCurrentLineItemValue('item','custcol_select_item', 'F');

}