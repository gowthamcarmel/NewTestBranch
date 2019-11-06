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
 * This CSS is is referenced/called by the PO Request Suitelet Main form via form.setScript()
 * This Script is not to be deployed on any record type.
 * 
 * Version    Date            Author           Remarks
 * 1.00       13 Sep 2013     mcustodio
 *
 */

/**
 * The recordType (internal id) corresponds to the "Applied To" record in your script deployment. 
 * @appliedtorecord recordType 
 * 
 * @param {String} type Access mode: create, copy, edit
 * @returns {Void}
 */

function pageInit(stType){

	//this snippet is added, in-case customer prefers a pop-up window (instead of redirect) for first time add of item

	var stLoggerTitle = 'clientPageInit';
	
	//nlapiLogExecution('DEBUG', stLoggerTitle, '---------- START ----------');
	//nlapiLogExecution('DEBUG', 'Event type', stType);
	
	var context = nlapiGetContext();
	var executionContext = context.getExecutionContext();
	nlapiLogExecution('DEBUG', 'Execution Context', executionContext);	
	nlapiLogExecution('DEBUG', 'Event Type', stType);
	
	if (stType == 'create' && executionContext == 'userinterface') //if type is Create and context is UI, redirect to Suitelet
	{
		var userId = nlapiGetUser();
		nlapiLogExecution('DEBUG', stLoggerTitle, 'User ID: '+userId);
		var userSubsidiary = nlapiGetSubsidiary();
		nlapiLogExecution('DEBUG', stLoggerTitle, 'User Subsidiary: '+userSubsidiary);
		var userCenter = context.getRoleCenter();
		nlapiLogExecution('DEBUG', stLoggerTitle, 'User Role Center: '+userCenter);
		
		var NetSuite_URL = NetSuiteHelper();
		nlapiLogExecution('DEBUG', stLoggerTitle, 'NetSuite_URL: '+NetSuite_URL);
		
		var suitelet_url = nlapiResolveURL('SUITELET', 'customscript96', 'customdeploy1'); //set the Suitelet Script ID | get Suitelet Internal URL
		//may use NetSuite Helper for ease in dev/design (SB/Prod/etc)
		nlapiLogExecution('DEBUG', stLoggerTitle, 'Orig URL: '+suitelet_url);
		
		var suitelet_form_url = NetSuite_URL + suitelet_url;
		nlapiLogExecution('DEBUG', stLoggerTitle, 'Base URL: '+suitelet_form_url);
	     
	    //open the suitelet in a new window
	    newWindow = window.open(suitelet_form_url, '_blank','width=500,height=500,location=no');	    
	}
	else
	{
		nlapiLogExecution('DEBUG', stLoggerTitle, 'Exiting UE Script. Execution Context: '+executionContext +'. Execution Type: '+stType);
		return true;
	}

	
} //end pageInit function


function suiteletFormFieldChanged(type, name){
	
	var fieldName = name;
	var flag = false;

	switch (fieldName){
		
	case ('custpage_subsidiaryfield'):
		var subsidiary = nlapiGetFieldValue('custpage_subsidiaryfield');
		
		if (subsidiary!=null && subsidiary!='') 
		{
			nlapiSetFieldValue('custpage_category1field', '');
			nlapiRemoveOption('custpage_sub_category1field');
			nlapiRemoveOption('custpage_sub_category2field');
			nlapiRemoveOption('custpage_item');
			nlapiRemoveOption('custpage_vendorfield');
			nlapiRemoveOption('custpage_currency');
			nlapiSetFieldValue('custpage_rate','');
			nlapiSetFieldValue('custpage_quantity', '');
			
			addEmployee(); //calling Search Helper to get List of Employees filtered by Subsidiary
			
		}
		else
		{
			alert('Please select a Valid Subsidiary'); //adding Alert if Shopper selects blank subsidiary
		} 	
	break; //subsidiary break

	case ('custpage_category1field'):
		//alert('custpage_category1field');
		var cat1 = nlapiGetFieldValue('custpage_category1field');
		if (cat1!=null && cat1!='')
		{		
			var filterItemCat = new Array();
			filterItemCat[0] = new nlobjSearchFilter('custrecord_categories', null, 'anyof', nlapiGetFieldValue('custpage_category1field'));
			filterItemCat[1] = new nlobjSearchFilter('isinactive', null, 'is', 'F');
			
			var columnItemCat = new Array();
			columnItemCat[0] = new nlobjSearchColumn('internalid');
			columnItemCat[1] = new nlobjSearchColumn('name');
			
			var subCat1SearchResults = nlapiSearchRecord('customrecord_sub_category1', null, filterItemCat, columnItemCat);
			
			nlapiRemoveOption('custpage_sub_category1field');
			nlapiRemoveOption('custpage_sub_category2field');
			nlapiRemoveOption('custpage_item');
			nlapiRemoveOption('custpage_vendorfield');
			nlapiRemoveOption('custpage_currency');
			nlapiSetFieldValue('custpage_rate', '');
			nlapiSetFieldValue('custpage_quantity', '');
			
			nlapiInsertSelectOption('custpage_sub_category1field','','');
			
			for (var i=0; subCat1SearchResults != null && i<subCat1SearchResults.length; i++)
			{
				nlapiInsertSelectOption('custpage_sub_category1field', subCat1SearchResults[i].getValue(columnItemCat[0]), subCat1SearchResults[i].getValue(columnItemCat[1]),false);
			}
			nlapiSetFieldValue('custpage_sub_category2field', '');
			nlapiSetFieldValue('custpage_item', '');
			nlapiSetFieldValue('custpage_vendorfield', '');
			nlapiSetFieldValue('custpage_currency', '');
			nlapiSetFieldValue('custpage_rate', '');
			nlapiSetFieldValue('custpage_quantity', '');
		break;	
		}
		else //adding else if user selects 'blank' from drop-down
		{
			nlapiRemoveOption('custpage_sub_category1field');
			nlapiRemoveOption('custpage_sub_category2field');
			nlapiRemoveOption('custpage_item');
			nlapiRemoveOption('custpage_vendorfield');
			nlapiRemoveOption('custpage_currency');
			nlapiSetFieldValue('custpage_rate', '');
			nlapiSetFieldValue('custpage_quantity', '');
		}
	break; //item category break

	case ('custpage_sub_category1field'):
		//alert('custpage_sub_category1field');
		var subcat1 = nlapiGetFieldValue('custpage_sub_category1field');
		if (subcat1!=null && subcat1!='')
		{
			var filterSubCat1 = new Array();
			filterSubCat1[0] = new nlobjSearchFilter('custrecord_sc2_item_category', null, 'anyof', nlapiGetFieldValue('custpage_category1field'));
			filterSubCat1[1] = new nlobjSearchFilter('custrecord_subcats1', null, 'anyof', nlapiGetFieldValue('custpage_sub_category1field'));
			filterSubCat1[2] = new nlobjSearchFilter('isinactive', null, 'is', 'F');
			
			var columnSubCat1 = new Array();
			columnSubCat1[0] = new nlobjSearchColumn('internalid');
			columnSubCat1[1] = new nlobjSearchColumn('name');
			var subCat2SearchResults = nlapiSearchRecord('customrecord_sub_category2', null, filterSubCat1, columnSubCat1);
			nlapiRemoveOption('custpage_sub_category2field');
			nlapiInsertSelectOption('custpage_sub_category2field','','');
			for (var i=0; subCat2SearchResults !=null && i<subCat2SearchResults.length; i++)
			{
				nlapiInsertSelectOption('custpage_sub_category2field', subCat2SearchResults[i].getValue(columnSubCat1[0]), subCat2SearchResults[i].getValue(columnSubCat1[1]),false);
			}
			nlapiSetFieldValue('custpage_item', '');
			nlapiSetFieldValue('custpage_vendorfield', '');
			nlapiSetFieldValue('custpage_currency', '');
			nlapiSetFieldValue('custpage_rate', '');
			nlapiSetFieldValue('custpage_quantity', '');	
			break;
		}
		else //adding else if use selects 'blank' from drop-down
		{
			nlapiRemoveOption('custpage_sub_category2field');
			nlapiRemoveOption('custpage_item');
			nlapiRemoveOption('custpage_vendorfield');
			nlapiRemoveOption('custpage_currency');
			nlapiSetFieldValue('custpage_rate', '');
			nlapiSetFieldValue('custpage_quantity', '');
		}
	break; //subcategory1 break

	case ('custpage_sub_category2field'):
		//alert('custpage_sub_category2field');
		var subcat2 = nlapiGetFieldValue('custpage_sub_category2field');		
		var subsidiary = nlapiGetFieldValue('custpage_subsidiaryfield');
		if (subcat2!=null && subcat2!='')
		{
			var cat1 = nlapiGetFieldValue('custpage_category1field');
			var subcat1 = nlapiGetFieldValue('custpage_sub_category1field');
			var subcat2 = nlapiGetFieldValue('custpage_sub_category2field');	
			var url = nlapiResolveURL('SUITELET', 'customscript_suitelet_search_helper', 'customdeploy_suitelet_search_helper'); 
			url+= '&subsidiary=' + encodeURIComponent(subsidiary);
			url+= '&cat1=' + encodeURIComponent(cat1);
			url+= '&subcat1=' + encodeURIComponent(subcat1);
			url+= '&subcat2=' + encodeURIComponent(subcat2);
			url+= '&trigger=subcat2';
			var itemSearchResults = callSuitelet(url); 
			//alert('remove item - subcat loop');
			nlapiRemoveOption('custpage_item');
			nlapiInsertSelectOption('custpage_item','','');
			
			if(itemSearchResults!=null && itemSearchResults!='')
			{
				for (var i=0; itemSearchResults !=null && i<itemSearchResults.length; i++)
				{
					//nlapiInsertSelectOption('custpage_item', itemSearchResults[i].getValue(columnSubCat2[0]), itemSearchResults[i].getValue(columnSubCat2[1]),false);
					nlapiInsertSelectOption('custpage_item', itemSearchResults[i].itemId, itemSearchResults[i].itemName, false);
				}
			}
			else
			{	//adding alert if no ItemSearchResult found
				alert('No Items found for this Product Combination. Please change your selections.');
			}
			
			nlapiSetFieldValue('custpage_vendorfield', '');
			nlapiSetFieldValue('custpage_currency', '');
			nlapiSetFieldValue('custpage_rate', '');
			nlapiSetFieldValue('custpage_quantity', '');
			break;
		}//close subcat if	
		else //adding else if use selects 'blank' from drop-down
		{
			nlapiRemoveOption('custpage_item');
			nlapiRemoveOption('custpage_vendorfield');
			nlapiRemoveOption('custpage_currency');
			nlapiSetFieldValue('custpage_rate', '');
			nlapiSetFieldValue('custpage_quantity', '');
		}

	break; //subcategory2 break
		
	case ('custpage_item'):
		//alert('custpage_item');
		var item = nlapiGetFieldValue('custpage_item');
		var subsidiary = nlapiGetFieldValue('custpage_subsidiaryfield');
		var cat1 = nlapiGetFieldValue('custpage_category1field');
		var subcat1 = nlapiGetFieldValue('custpage_sub_category1field');
		var subcat2 = nlapiGetFieldValue('custpage_sub_category2field');	
		nlapiRemoveOption('custpage_vendorfield');
		nlapiRemoveOption('custpage_currency');
		nlapiSetFieldValue('custpage_rate', '');
		if (item!=null && item!='')
		{			
			var url = nlapiResolveURL('SUITELET', 'customscript_suitelet_search_helper', 'customdeploy_suitelet_search_helper'); //getting Internal Suitelet URL
			url+= '&subsidiary=' + encodeURIComponent(subsidiary);
			url+= '&cat1=' + encodeURIComponent(cat1);
			url+= '&subcat1=' + encodeURIComponent(subcat1);
			url+= '&subcat2=' + encodeURIComponent(subcat2);
			url+= '&item=' + encodeURIComponent(item);
			url+= '&trigger=item';
			var vendorSearchResults = callSuitelet(url);
			//alert(vendorSearchResults.length);			
			nlapiInsertSelectOption('custpage_vendorfield','','');
			if(vendorSearchResults!=null && vendorSearchResults!='')

			{
				for (var a=0; vendorSearchResults != null && a<vendorSearchResults.length; a++)
				{
				//var preferredVendorRate = 0;
					if (a==0)
					{
						nlapiInsertSelectOption('custpage_vendorfield', vendorSearchResults[a].vendorId, vendorSearchResults[a].vendorName, false)
					/*	
						if (vendorSearchResults[a].vendorId == vendorSearchResults[a].primaryVendor && vendorSearchResults[a].vendorCurrency == vendorSearchResults[a].primaryVendorCurrency)
						{
						preferredVendorRate = vendorSearchResults[a].vendorCost;
						}
					*/	
					}
					else if (a != 0 && vendorSearchResults[a].vendorId != vendorSearchResults[a-1].vendorId)
					{
						nlapiInsertSelectOption('custpage_vendorfield', vendorSearchResults[a].vendorId, vendorSearchResults[a].vendorName, false)
					/*	
						if (vendorSearchResults[a].vendorId == vendorSearchResults[a].primaryVendor && vendorSearchResults[a].vendorCurrency == vendorSearchResults[a].primaryVendorCurrency)
						{
						preferredVendorRate = vendorSearchResults[a].vendorCost;
						}
					*/	
					}
					var preferredVendor = vendorSearchResults[0].primaryVendor
				}
				nlapiSetFieldValue ('custpage_vendorfield', preferredVendor);
				//nlapiSetFieldValue ('custpage_rate', preferredVendorRate); //commenting 09/20
			}
			else
			{	//adding alert if no ItemSearchResult found
				alert('No Vendor found for this Item/Product Combination. Please change your selections.');
			}
			
			//var vendor = nlapiGetFieldValue('custpage_vendorfield'); //commenting 09/20
			//addCurrency(); //to insert vendor currencies even those with no default item price //commenting 09/20
		}	
		break;
		
		case ('custpage_vendorfield'):
		addCurrency();
		addRate();
		break;
		
		case ('custpage_currency'):
		addRate();
		break;
		
		case ('custpage_item_multiple'):
		addRateMultiple();
		break;
		
	}//close switch
	
}

function addCurrency()
{
	nlapiRemoveOption('custpage_currency');
	var vendor = nlapiGetFieldValue('custpage_vendorfield');
	if (vendor!=null && vendor!='')
	{
		var url = nlapiResolveURL('SUITELET', 'customscript_suitelet_search_helper', 'customdeploy_suitelet_search_helper'); //getting Internal Suitelet URL
		url+= '&vendor=' + encodeURIComponent(vendor);
		url+= '&trigger=vendor';
		var currencySearchResults = callSuitelet(url); 
		if(currencySearchResults!=null && currencySearchResults!='')
		{
			for (var c=0; currencySearchResults != null && c<currencySearchResults.length; c++)
			{		
				if (currencySearchResults[c].currencyId == currencySearchResults[c].primaryCurrencyId)
				{
					nlapiInsertSelectOption('custpage_currency', currencySearchResults[c].currencyId, currencySearchResults[c].currencyName, true);
				}
				else 
				{
					nlapiInsertSelectOption('custpage_currency', currencySearchResults[c].currencyId, currencySearchResults[c].currencyName, false);
				}
			}
		}	
		else
		{	
			alert('No Currency found for this Item/Product/Vendor combination. Please change your selections.');
		}
	}	
}


function addRate()
{
	nlapiSetFieldValue('custpage_rate','');
	var item = nlapiGetFieldValue('custpage_item');
	var subsidiary = nlapiGetFieldValue('custpage_subsidiaryfield');
	var vendor = nlapiGetFieldValue('custpage_vendorfield');
	var currency = nlapiGetFieldValue('custpage_currency');
	var currencyName = nlapiGetFieldText('custpage_currency');
					
	nlapiSetFieldValue('custpage_rate', '');
			
	if (currency!=null && currency!='')
	{	
		var url = nlapiResolveURL('SUITELET', 'customscript_suitelet_search_helper', 'customdeploy_suitelet_search_helper'); 
		url+= '&subsidiary=' + encodeURIComponent(subsidiary);
		url+= '&item=' + encodeURIComponent(item);
		url+= '&vendor=' + encodeURIComponent(vendor);
		url+= '&currency=' + encodeURIComponent(currency);
		url+= '&trigger=currency';
		
		var rateSearchResults = callSuitelet(url);

		if (rateSearchResults.currencyName == currencyName)
		{
			nlapiSetFieldValue('custpage_rate', rateSearchResults.currencyRate);
		}
	}	
	else
	{
	//nothing yet	
	}
}

function addRateMultiple()
{
	var subsidiary = nlapiGetFieldValue('custpage_subsidiaryfield_multiple');
	var item = nlapiGetFieldValue('custpage_item_multiple');
	var vendor = nlapiGetFieldValue('custpage_vendorfield_multiple');
	var currency = nlapiGetFieldValue('custpage_currency_multiple');
	var currencyName = nlapiGetFieldText('custpage_currency_multiple');

	nlapiSetFieldValue('custpage_rate_multiple', '');
	
	if (item!= null && item!='' && currency!=null && currency!='')
	{	
		var url = nlapiResolveURL('SUITELET', 'customscript_suitelet_search_helper', 'customdeploy_suitelet_search_helper'); 
		url+= '&subsidiary=' + encodeURIComponent(subsidiary);
		url+= '&item=' + encodeURIComponent(item);
		url+= '&vendor=' + encodeURIComponent(vendor);
		url+= '&currency=' + encodeURIComponent(currency);
		url+= '&trigger=currency';
		
		var rateSearchResults = callSuitelet(url);

		if (rateSearchResults.currencyName == currencyName)
		{
			nlapiSetFieldValue('custpage_rate_multiple', rateSearchResults.currencyRate);
		}
	}	
	else
	{
	//nothing yet	
	}
}


function addEmployee()
{
	nlapiRemoveOption('custpage_employee');
	nlapiInsertSelectOption('custpage_employee','','');
	
	var subsidiary = nlapiGetFieldValue('custpage_subsidiaryfield');
	if (subsidiary!=null && subsidiary!='')
	{
		var url = nlapiResolveURL('SUITELET', 'customscript_suitelet_search_helper', 'customdeploy_suitelet_search_helper'); //getting Internal Suitelet URL
		url+= '&subsidiary=' + encodeURIComponent(subsidiary);
		url+= '&trigger=subsidiary';
		var employeeSearchResults = callSuitelet(url); 
		if(employeeSearchResults!=null && employeeSearchResults!='')
		{
			for (var e=0; employeeSearchResults != null && e<employeeSearchResults.length; e++)
			{		
				nlapiInsertSelectOption('custpage_employee', employeeSearchResults[e].employeeId, employeeSearchResults[e].employeeName, false);
			}
		}	
		else
		{	
			alert('No Employees found for this Subsidiary. Please change your selection.');
		}
	}	
}


function callSuitelet(url)
{
	var headers = new Array();
	headers['Content-Type'] = 'application/json';
	var response = nlapiRequestURL( url, null, headers );
    var responsebody = JSON.parse(response.getBody());
	var error = responsebody['error'];
    if (error)
    {
         var code = error.code;
         var message = error.message;
         nlapiLogExecution('DEBUG','failed: code='+code+'; message='+message);
         nlapiCreateError(code, message, false);
    }
    return responsebody['nssearchresult'];
}


function NetSuiteHelper()
{	
	var stLoggerTitle = 'NetSuiteHelper';	
	nlapiLogExecution('DEBUG', stLoggerTitle, '---------- START ----------');
	
    var envURL = 'https://system.'; //setting to system.na1. for TestDrive
    switch(nlapiGetContext().getEnvironment())
    {
        case 'PRODUCTION':
            envURL += 'netsuite.com';
        break;
        
        case 'SANDBOX':
            envURL += 'sandbox.netsuite.com';
        break;
        
        case 'BETA':
            envURL += 'beta.netsuite.com';
        break;
/*		default:
			envURL += 'p.netsuite.com';
		break;
*/
    }

	nlapiLogExecution('DEBUG', stLoggerTitle, '---------- END ----------');
    return envURL;

}



function suiteletSaveRecord()
{
	var scriptParamAlertMessage = nlapiGetContext().getSetting('SCRIPT', 'custscript_confirmation_alert_message');
	var scriptParamConfirmFlag = nlapiGetContext().getSetting('SCRIPT', 'custscript_control_submit_confirm_alert');

	var multipleItemFlagPrompt = nlapiGetFieldValue('custpage_multiple_flag');
	//alert(multipleItemFlagPrompt);

	//alert(scriptParamAlertMessage);
	//alert(scriptParamConfirmFlag );
	//return confirm("Are you sure you want to submit this Purchase Request?");
	
	if (scriptParamConfirmFlag == 'T' &&  multipleItemFlagPrompt != 'true')
	{
		return confirm(scriptParamAlertMessage);
	}
	else //Flag to confirm is F - no confirmation prompt
	{
		return true;
	}
}



function validateFieldForceNonZero(type, name )
{
  if (name == 'custpage_rate')
  {
		var rateValue = nlapiGetFieldValue('custpage_rate');
		//alert(rateValue);
		
		if (rateValue <= 0 && rateValue != null && rateValue !='')
		{	
			alert("Invalid Rate Value. Please enter a rate greater than 0.");
			return false;
		}
   }
   
  if (name == 'custpage_quantity')
  {
		var quantityValue = nlapiGetFieldValue('custpage_quantity');
		//alert(quantityValue);
		
		if (quantityValue <= 0 && quantityValue != null && quantityValue !='')
		{	
			alert("Invalid Quantity Value. Please enter a quantity greater than 0.");
			return false;
		}
   }
   
  if (name == 'custpage_rate_multiple')
  {
		var rateValueMultiple = nlapiGetFieldValue('custpage_rate_multiple');
		//alert(rateValueMultiple);
		
		if (rateValueMultiple <= 0 && rateValueMultiple != null && rateValueMultiple !='')
		{	
			alert("Invalid Rate Value. Please enter a rate greater than 0.");
			return false;
		}
   }
 
  if (name == 'custpage_quantity_multiple')
  {
		var quantityValueMultiple = nlapiGetFieldValue('custpage_quantity_multiple');
		//alert(quantityValue);
		
		if (quantityValueMultiple <= 0 && quantityValueMultiple != null && quantityValueMultiple !='')
		{	
			alert("Invalid Quantity Value. Please enter a quantity greater than 0.");
			return false;
		}
   }

	//  Always return true at this level, to continue validating other fields
	return true;   
   
}