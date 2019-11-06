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
 * This SSS Suitelet runs as Administrator and performs Search/Load of records, returns the Search result to the Client-script invoking the Suitelet.
 * This script is triggered from the Suitelet Main Form (CSS field change), which then returns Search result in format that can be parsed, 
 * and then added as Select Options on each respective fields.
 * 
 * 
 * Version    Date            Author           Remarks
 * 1.00       14 Sep 2013     mcustodio
 *
 */

/**
 * @param {nlobjRequest} request Request object
 * @param {nlobjResponse} response Response object
 * @returns {Void} Any output is written via response object
 */
function suiteletSearch(request, response){

	var trigger = request.getParameter('trigger');
		
	switch (trigger)
	{
	
	case ('subsidiary'):
		var subsidiary = request.getParameter('subsidiary');
		nlapiLogExecution('DEBUG', 'subsidiary', subsidiary);
		
		var filterEmployee = new Array();

		filterEmployee[0] = new nlobjSearchFilter('subsidiary', null, 'anyof', subsidiary);
		filterEmployee[1] = new nlobjSearchFilter('isinactive', null, 'is', 'F');
				
		var columnEmployee = new Array();
		columnEmployee[0] = new nlobjSearchColumn('internalid');
		columnEmployee[1] = new nlobjSearchColumn('altname');
		columnEmployee[1].setSort();

		var employeeSearchResults = nlapiSearchRecord('employee', null, filterEmployee, columnEmployee);
		
		var employees = new Array();
		nlapiLogExecution('DEBUG', 'create array', 'create array');
		
		for (var i=0; employeeSearchResults!=null && i<employeeSearchResults.length; i++)
		{
			nlapiLogExecution('DEBUG', 'for loop', i);
			var employeeSearchResult = employeeSearchResults[i];
			var recordId = employeeSearchResult.getValue(columnEmployee[0]);
			var employeeName = employeeSearchResult.getValue(columnEmployee[1]);
			employees[employees.length++] = new employeeDetail(recordId, employeeName); 			
		}
		
		var returnme = new Object();
		nlapiLogExecution('DEBUG', 'return me', 'return me object');
		returnme.nssearchresult = employees;
		//nlapiLogExecution('DEBUG', 'nssearchresult = employees;', 'nssearchresult = employees;');
		nlapiLogExecution('DEBUG', 'returnme', JSON.stringify(returnme));

		response.write(JSON.stringify(returnme));
		
	break; //end of subsidiary break
	
	//on field change of subcat2, runs an item search and returns a list of items
	case ('subcat2'):
		var subsidiary = request.getParameter('subsidiary');
		nlapiLogExecution('DEBUG', 'subsidiary', subsidiary);
		var cat1 = request.getParameter('cat1');
		nlapiLogExecution('DEBUG', 'cat1', cat1);
		var subcat1 = request.getParameter('subcat1');
		nlapiLogExecution('DEBUG', 'subcat1', subcat1);
		var subcat2 = request.getParameter('subcat2');	
		nlapiLogExecution('DEBUG', 'subcat2', subcat2);
		
		var filterExpression = [ ['isinactive', 'is', 'F'], 'and',['subsidiary', 'anyof', subsidiary],'and',['custitem_category','anyof',cat1],'and',['custitem_subcat1','anyof',subcat1],'and',['custitem_subcat2','anyof',subcat2], 'and', ['subtype', 'noneOf', 'Sale'] ]; //SDP change# 7328 26-June-2015 To restrict sales item 
			
		var columnSubCat2 = new Array();
		columnSubCat2[0] = new nlobjSearchColumn('internalid');
		columnSubCat2[1] = new nlobjSearchColumn('name');
		
		var itemSearchResults = nlapiSearchRecord('item', null, filterExpression, columnSubCat2);
		nlapiLogExecution('DEBUG', 'itemSearchResults', JSON.stringify(itemSearchResults));
		
		var items = new Array();
		nlapiLogExecution('DEBUG', 'create array', 'create array');
		
		for (var i=0; itemSearchResults!=null && i<itemSearchResults.length; i++)
		{
			nlapiLogExecution('DEBUG', 'for loop', i);
			var itemSearchResult = itemSearchResults[i];
			var recordId = itemSearchResult.getValue(columnSubCat2[0]);
			var itemName = itemSearchResult.getValue(columnSubCat2[1]);
			items[items.length++] = new itemDetail(recordId, itemName); 			
		}
		
		var returnme = new Object();
		nlapiLogExecution('DEBUG', 'return me', 'return me object');
		returnme.nssearchresult = items;

		nlapiLogExecution('DEBUG', 'returnme', JSON.stringify(returnme));

		response.write(JSON.stringify(returnme));
	break; //end of subcat2	
	
	
	//on field change of item, runs an item search and returns a list of vendors
	case ('item'):
		var subsidiary = request.getParameter('subsidiary');
		var cat1 = request.getParameter('cat1');
		var subcat1 = request.getParameter('subcat1');
		var subcat2 = request.getParameter('subcat2');	
		var itemV = request.getParameter('item');	
		
		var filterItem = new Array();
		filterItem[0] = new nlobjSearchFilter('subsidiary', 'vendor', 'anyof', subsidiary);
		filterItem[1] = new nlobjSearchFilter('internalid', null, 'anyof', itemV);
		filterItem[2] = new nlobjSearchFilter('isinactive', null, 'is', 'F');
		
		var columnItem = new Array();
		columnItem[0] = new nlobjSearchColumn('internalid','preferredvendor'); //adding column to get Primary Vendor
		columnItem[1] = new nlobjSearchColumn('currency','preferredvendor');
		columnItem[2] = new nlobjSearchColumn('internalid', 'vendor');
		columnItem[3] = new nlobjSearchColumn('companyname', 'vendor'); //changing from entityid to companyname
		columnItem[4] = new nlobjSearchColumn('vendorcost');
		columnItem[5] = new nlobjSearchColumn('vendorpricecurrency');
		columnItem[2].setSort();
		columnItem[5].setSort();
		
		var itemSearchResults = nlapiSearchRecord('item', null, filterItem, columnItem);
		nlapiLogExecution('DEBUG', 'itemSearchResults', JSON.stringify(itemSearchResults));
		
		var items = new Array();
		nlapiLogExecution('DEBUG', 'create array', 'create array');
		
		for (var i=0; itemSearchResults!=null && i<itemSearchResults.length ; i++)
		{
			nlapiLogExecution('DEBUG', 'for loop', i);
			var itemSearchResult = itemSearchResults[i];
			var primaryVendor = itemSearchResult.getValue(columnItem[0]);
			var primaryVendorCurrency = itemSearchResult.getText(columnItem[1]);
			var vendorId = itemSearchResult.getValue(columnItem[2]);
			var vendorName = itemSearchResult.getValue(columnItem[3]);
			var vendorCost = itemSearchResult.getValue(columnItem[4]);
			var vendorCurrency = itemSearchResult.getValue(columnItem[5]);
			items[items.length++] = new itemVendor(primaryVendor, primaryVendorCurrency, vendorId, vendorName, vendorCost, vendorCurrency); 
		}
		
		var returnme = new Object();
		nlapiLogExecution('DEBUG', 'return me', 'return me object');
		
		returnme.nssearchresult = items;
		nlapiLogExecution('DEBUG', 'nssearchresult = vendors;', 'nssearchresult = vendors;');
		nlapiLogExecution('DEBUG', 'returnme', JSON.stringify(returnme));

		response.write(JSON.stringify(returnme));
	break;	//end of item
			
	case ('vendor'):
		var vendor = request.getParameter('vendor');
		
		var vendorRec = nlapiLoadRecord('vendor', vendor);
		var primaryCurrencyId = vendorRec.getFieldValue('currency');
		var primaryCurrencyName = nlapiLookupField('currency', primaryCurrencyId, 'name');
		var vendorCurrencyCount = vendorRec.getLineItemCount('currency');
		
		var currency = new Array();
		nlapiLogExecution('DEBUG', 'create array', 'create array');
		
		for (var i=1; i<=vendorCurrencyCount; i++)
		{
			var currencyId = vendorRec.getLineItemValue('currency', 'currency', i);
			var currencyName = nlapiLookupField('currency', currencyId, 'name');
			currency[currency.length++] = new vCurrency(currencyId, currencyName, primaryCurrencyId); 			
		}
		
		var returnme = new Object();
		nlapiLogExecution('DEBUG', 'return me', 'return me object');
		
		returnme.nssearchresult = currency;
		nlapiLogExecution('DEBUG', 'nssearchresult = currency;', 'nssearchresult = currency;');
		nlapiLogExecution('DEBUG', 'returnme', JSON.stringify(returnme));
		
		response.write(JSON.stringify(returnme));
	break;
			
	case ('currency'):
		var subsidiary = request.getParameter('subsidiary');
		nlapiLogExecution('DEBUG', 'subsidiary', 'subsidiary');
		var item = request.getParameter('item');
		nlapiLogExecution('DEBUG', 'item', 'item');
		var vendor = request.getParameter('vendor');
		nlapiLogExecution('DEBUG', 'vendor', 'vendor');
		var currency = request.getParameter('currency');
		
		var filterItemCurrency = new Array();
		filterItemCurrency[0] = new nlobjSearchFilter('subsidiary', 'vendor', 'anyof', subsidiary);
		filterItemCurrency[1] = new nlobjSearchFilter('internalid', null, 'anyof', item);
		filterItemCurrency[2] = new nlobjSearchFilter('othervendor', null, 'anyof', vendor);
		filterItemCurrency[3] = new nlobjSearchFilter('vendorpricecurrency', null, 'anyof', currency);
		filterItemCurrency[4] = new nlobjSearchFilter('isinactive', null, 'is', 'F');
		
		var columnItemCurrency = new Array();
		columnItemCurrency[0] = new nlobjSearchColumn('vendorpricecurrency'); //vendor price currency --> currency name
		columnItemCurrency[1] = new nlobjSearchColumn('vendorcost'); //vendor price
		
		var itemSearchResultsCurrency = nlapiSearchRecord('item', null, filterItemCurrency, columnItemCurrency);
		
		var currencyRate = new Object();
		if (itemSearchResultsCurrency)
		{
			currencyRate.currencyName = itemSearchResultsCurrency[0].getValue(columnItemCurrency[0]);
			currencyRate.currencyRate = itemSearchResultsCurrency[0].getValue(columnItemCurrency[1]);
		}
		
		var returnme = new Object();
		nlapiLogExecution('DEBUG', 'return me', 'return me object');
		
		returnme.nssearchresult = currencyRate;
		nlapiLogExecution('DEBUG', 'nssearchresult = currency;', 'nssearchresult = currency;');
		nlapiLogExecution('DEBUG', 'returnme', JSON.stringify(returnme));
		
		response.write(JSON.stringify(returnme));
	break;
	
	}//close switch
}

function itemDetail(internalid, itemName)
{
	this.itemId = internalid;
	this.itemName = itemName;
}

function itemVendor(primaryVendor, primaryVendorCurrency, vendorId, vendorName, vendorCost, vendorCurrency)		
{
	this.primaryVendor = primaryVendor;
	this.primaryVendorCurrency = primaryVendorCurrency;
	this.vendorId = vendorId;
	this.vendorName = vendorName;
	this.vendorCost = vendorCost;
	this.vendorCurrency = vendorCurrency;
}

function vCurrency(currencyId, currencyName, primaryCurrencyId)
{
	this.currencyId = currencyId;
	this.currencyName = currencyName;
	this.primaryCurrencyId = primaryCurrencyId;
}

function employeeDetail(internalid, employeeName)
{
	this.employeeId = internalid;
	this.employeeName = employeeName;
}