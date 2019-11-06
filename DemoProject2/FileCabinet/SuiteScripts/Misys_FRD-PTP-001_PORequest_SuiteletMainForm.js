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
 * Solution Overview:
 * The NetSuite Employee Center Purchase Requisition functionality as well as the standard purchase order functionality will be enhanced 
 * to allow employees to select an item for purchase, and then select the vendor from a pre-approved list of vendors defined for the item.
 * 
 * This SSS loads the Suitlet that creates the Form where an Employee can pre-select Item Category/Sub-Category
 * together with the Item and Vendor of choice.
 * 
 * Version    Date            Author           Remarks
 * 1.00       13 Sep 2013     mcustodio
 *
 */


function userEventBeforeLoadRedirect(stType, form, request){ 
		
	var stLoggerTitle = 'userEventBeforeLoad';
	
	nlapiLogExecution('DEBUG', stLoggerTitle, '---------- START ----------');
	nlapiLogExecution('DEBUG', 'Event type', stType);
	
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
		
		nlapiSetRedirectURL('SUITELET', 'customscript_suitelet_main_po_form', 'customdeploy_suitelet_main_po_form'); 
		//set to Suitelet Script ID and deployment
	    
	}
	else
	{
		nlapiLogExecution('DEBUG', stLoggerTitle, 'Exiting UE Script. Execution Context: '+executionContext +'. Execution Type: '+stType);
		return true;
	}

}


function suitelet_PoRequestForm(request, response){
	
	var stLoggerTitle = 'simpleSuitelet';	
	nlapiLogExecution('DEBUG', stLoggerTitle, '---------- START ----------');
	
	var userId = nlapiGetUser(); //Employee Logged In
	nlapiLogExecution('DEBUG', 'User ID', userId);	

	var context = nlapiGetContext();
	var executionContext = context.getExecutionContext();
	nlapiLogExecution('DEBUG', 'Execution Context', executionContext);	
	
	var userCenter = context.getRoleCenter();
	nlapiLogExecution('DEBUG', stLoggerTitle, 'User Role Center: '+userCenter);
	
	var userRole = context.getRole();
	nlapiLogExecution('DEBUG', stLoggerTitle, 'User Role Internal ID: '+userRole);
	
	//Sandbox Roles Internal ID
	//1025	Misys Employee Centre - Contractor
	//1015	Misys Employee Centre - General
	
	if (request.getMethod() == 'GET')
	{
		  nlapiLogExecution('DEBUG', 'GET', 'GET');
		  
		  var multipleItemFlag = request.getParameter('multipleItemFlag');
		  nlapiLogExecution('DEBUG', 'multipleItemFlag', multipleItemFlag);
		  
		  if (!multipleItemFlag) //first Line item to be added
		  {
			nlapiLogExecution('DEBUG', 'None multipleItem GET', 'None multipleItemFlag GET');
		  var frmMain = nlapiCreateForm('Purchase Order Request Form',false);
	      	frmMain.setScript('customscript_css_main_form_script'); //adding Client Side Script


		  var action = frmMain.addField('custpage_multiple_flag', 'text', 'Action');
			action.setDefaultValue(multipleItemFlag);
			action.setDisplayType('hidden');
			action.setLayoutType('normal', 'startcol');
						
		  var customForm = frmMain.addField('custpage_custom_forms', 'select', 'Custom Form');
			customForm.addSelectOption('','');
			customForm.setMandatory(true);
			
		  var filterCustomForm = new Array();		
			filterCustomForm[0] = new nlobjSearchFilter('isinactive', null, 'is', 'F');
			
		  var columnCustomForm = new Array();
			columnCustomForm[0] = new nlobjSearchColumn('custrecord_script_po_request_forms_id');
			columnCustomForm[1] = new nlobjSearchColumn('custrecord_script_po_request_forms_name');
		
		  var formSearchResults = nlapiSearchRecord('customrecord_script_po_request_forms', null, filterCustomForm, columnCustomForm);
			nlapiLogExecution('DEBUG', 'formSearchResults', JSON.stringify(formSearchResults));
		
			for (var i=0; formSearchResults !=null && i<formSearchResults.length; i++)
			{
				var formSearchResult = formSearchResults[i];
				var customFormId = formSearchResult.getValue(columnCustomForm[0]);
				nlapiLogExecution('DEBUG', 'customFormId '+i, customFormId);
				var customFormName = formSearchResult.getValue(columnCustomForm[1]);
				nlapiLogExecution('DEBUG', 'customFormName '+i, customFormName);
				customForm.addSelectOption(customFormId, customFormName);
			}
				
		/*	
			customForm.addSelectOption('98','Standard Purchase Order form');
			customForm.addSelectOption('103','Contractor Purchase Order form');
			customForm.addSelectOption('123','3PP Purchase Order form');		
		*/
			
			//Sandbox Purchase Order Form Internal IDs
			//98	Standard Purchase Order
			//103	Misys Contractor PR Form
			//122	Misys General PR Form
			//123	Misys 3PP PR Form
		  
	      var formSubsidiary = frmMain.addField('custpage_subsidiaryfield', 'select', 'Subsidiary','subsidiary');
		  	formSubsidiary.setDefaultValue(nlapiGetSubsidiary());
			formSubsidiary.setMandatory(true);
		  
		  //var formEmployee = frmMain.addField('custpage_employee', 'select', 'Employee', 'employee'); 
		  var formEmployee = frmMain.addField('custpage_employee', 'select', 'Employee'); //filtering employee list by Subsidiary
		  
		  	var filterEmployee = new Array();

			filterEmployee[0] = new nlobjSearchFilter('subsidiary', null, 'is', nlapiGetSubsidiary());
			filterEmployee[1] = new nlobjSearchFilter('isinactive', null, 'is', 'F');
				
			var columnEmployee = new Array();
			//columnEmployee[0] = new nlobjSearchColumn('internalid');
			columnEmployee[0] = new nlobjSearchColumn('altname');
			columnEmployee[0].setSort();
			
			//creating nlobjSearch for to capture result set for Employee >1k results

			//var employeeSearchResults = nlapiSearchRecord('employee', null, filterEmployee, columnEmployee);
			//	nlapiLogExecution('DEBUG', 'employeeSearchResults', JSON.stringify(employeeSearchResults));
			
			var srchObj = nlapiCreateSearch('employee', filterEmployee, columnEmployee);
			var results = srchObj.runSearch();
		
			var employeeSearchResults = get_resultArrray(results); //calling helper function to get All result set of Search (>1k records)
			nlapiLogExecution('DEBUG', 'Results array', 'Total Records: '+ employeeSearchResults.length);
				
				formEmployee.addSelectOption('', '');
				for (var e=0; e<employeeSearchResults.length; e++)
				{		
					var employeeSearchResult = employeeSearchResults[e];
					var employeeId = employeeSearchResult.getId();
					nlapiLogExecution('DEBUG', 'employeeId '+e, employeeId);
					
					if (employeeId == userId)
					{
						var defaultEmployee = employeeId;
					}
					
					var employeeName = employeeSearchResult.getValue('altname');
					nlapiLogExecution('DEBUG', 'employeeName '+e, employeeName);
					formEmployee.addSelectOption(employeeId, employeeName);
				}

			
		nlapiLogExecution('DEBUG', 'User ID', userId);
		nlapiLogExecution('DEBUG', 'User ID', defaultEmployee);
				
			formEmployee.setDefaultValue(defaultEmployee);
			formEmployee.setMandatory(true);
		  
		if (userCenter == 'EMPLOYEE')
		{
			customForm.setDisplayType('hidden'); //not visible
			formSubsidiary.setDisplayType('disabled');
			formEmployee.setDisplayType('disabled'); // setting to show but disabled
		}
		else // if (userCenter == 'CLASSIC')
		{
			formSubsidiary.setDisplayType('normal');
			customForm.setDefaultValue('122'); //setting Default to 'Misys General PR' - Form Internal ID for non-EC
		}
		  
	      //var formItemCategory = frmMain.addField('custpage_category1field', 'select', 'Item Category', 'customrecord_category');
		  //removing Add Sign per Purchase Request Issue 10/23
		  
		  var formItemCategory = frmMain.addField('custpage_category1field', 'select', 'Item Category');
		  		  
		  	var filterformItemCategory = new Array();
			filterformItemCategory[0] = new nlobjSearchFilter('isinactive', null, 'is', 'F');
			
			var columnformItemCategory = new Array();
			//columnformItemCategory[0] = new nlobjSearchColumn('internalid');
			columnformItemCategory[0] = new nlobjSearchColumn('name');
			columnformItemCategory[0].setSort();
			
			var formItemCategorySearchResults = nlapiSearchRecord('customrecord_category', null, filterformItemCategory, columnformItemCategory);
						
				formItemCategory.addSelectOption('', '');
				for (var c=0; formItemCategorySearchResults != null && c<formItemCategorySearchResults.length; c++)
				{				
					var formItemCategorySearchResult = formItemCategorySearchResults[c];
					var itemCategoryId = formItemCategorySearchResult.getId();
					nlapiLogExecution('DEBUG', 'itemCategoryId '+c, itemCategoryId);
					
					var itemCategoryName = formItemCategorySearchResult.getValue('name');
					nlapiLogExecution('DEBUG', 'itemCategoryName '+c, itemCategoryName);
					formItemCategory.addSelectOption(itemCategoryId, itemCategoryName);
				}
			formItemCategory.setMandatory(true);
			
			
	      var formSubCategory1 = frmMain.addField('custpage_sub_category1field', 'select', 'Sub-Category 1');
			formSubCategory1.setMandatory(true);
		  var formSubCategory2 = frmMain.addField('custpage_sub_category2field', 'select', 'Sub-Category 2');
			formSubCategory2.setMandatory(true);
		  var formItem = frmMain.addField('custpage_item', 'select', 'Item');
			formItem.setMandatory(true);
		  var formVendor = frmMain.addField('custpage_vendorfield', 'select', 'Vendor');
			formVendor.setMandatory(true);
		  var formCurrency = frmMain.addField('custpage_currency', 'select', 'Currency');
			formCurrency.setMandatory(true);
		  var formRate = frmMain.addField('custpage_rate', 'currency', 'Rate');
			formRate.setMandatory(true);
		  var formQuantity = frmMain.addField('custpage_quantity', 'integer', 'Quantity');
			formQuantity.setMandatory(true);
		  var formJustification = frmMain.addField('custpage_justification', 'textarea', 'Justification for Purchase'); //adding per UAT Issue#9
			formJustification.setMandatory(true);			
		    		  
		 //Reetesh 06072015 Start///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
			var formFromDate = frmMain.addField('custpage_from_date', 'date', 'From Date');
			formFromDate.setMandatory(true);
			var formToDate = frmMain.addField('custpage_to_date', 'date', 'To Date');
			formToDate.setMandatory(true);
			var formSpreadCostEqually = frmMain.addField('custpage_spread_cost_equally', 'checkbox', 'Spread Cost Equally');
			//formSpreadCostEqually.setMandatory(true);
		 //Reetesh 06072015 End///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

			frmMain.addSubmitButton('Submit');
			
		  var landingUrl = '/app/accounting/transactions/transactionlist.nl?Transaction_TYPE=PurchOrd'; //absolute URL of PO List
		  var onClickScript = "window.open('"+landingUrl+"', '_self')";
			frmMain.addButton('custpage_button', 'Cancel', onClickScript);
		  
		  }
		  
		  else if (multipleItemFlag == 'true') //for Multiple items
		  {
			nlapiLogExecution('DEBUG', 'multipleItem GET', 'multipleItemFlag GET');
			
			var itemCategory = request.getParameter('itemCategory'); 
			var subCategory1 = request.getParameter('subCategory1'); 
			var subCategory2 = request.getParameter('subCategory2'); 
			var orderVendor = request.getParameter('orderVendor'); 	
			var orderCurrency = request.getParameter('orderCurrency'); 	
			var orderCurrencyText = request.getParameter('orderCurrencyText'); 	
		  
		 var frmMain = nlapiCreateForm('Purchase Order Request Form - Additional Items',true);
	      	frmMain.setScript('customscript_css_main_form_script'); //adding Client Side Script
			
		 var action = frmMain.addField('custpage_multiple_flag', 'text', 'Action');
			action.setDefaultValue(multipleItemFlag);
			action.setDisplayType('hidden');			
			
	     var formSubsidiary = frmMain.addField('custpage_subsidiaryfield_multiple', 'select', 'Subsidiary','subsidiary');
		  	formSubsidiary.setDefaultValue(nlapiGetSubsidiary());
			formSubsidiary.setDisplayType('hidden');	 
		  
	      var formItemCategory = frmMain.addField('custpage_category1field_multiple', 'select', 'Item Category', 'customrecord_category');
			formItemCategory.setDefaultValue(itemCategory);
			formItemCategory.setDisplayType('hidden');
			
	      var formSubCategory1 = frmMain.addField('custpage_sub_category1field_multiple', 'select', 'Sub-Category 1', 'customrecord_sub_category1');
			formSubCategory1.setDefaultValue(subCategory1);
			formSubCategory1.setDisplayType('hidden');
		  
		  var formSubCategory2 = frmMain.addField('custpage_sub_category2field_multiple', 'select', 'Sub-Category 2', 'customrecord_sub_category2');
			formSubCategory2.setDefaultValue(subCategory2);
			formSubCategory2.setDisplayType('hidden');			

		  var formItem = frmMain.addField('custpage_item_multiple', 'select', 'Item');
			formItem.setLayoutType('normal', 'startcol')
			formItem.setMandatory(true);
				
		  var formVendor = frmMain.addField('custpage_vendorfield_multiple', 'select', 'Vendor', 'vendor');			
			formVendor.setDefaultValue(orderVendor);
			formVendor.setDisplayType('hidden');
			
		  var formCurrency = frmMain.addField('custpage_currency_multiple', 'select', 'Currency', 'currency');
			formCurrency.setDisplayType('disabled'); //setting to displayed
			formCurrency.setDefaultValue(orderCurrency);
		  
		  var formRate = frmMain.addField('custpage_rate_multiple', 'currency', 'Rate');
			formRate.setMandatory(true);
				//formRate.setLayoutType('normal', 'startrow')
				
		  var formQuantity = frmMain.addField('custpage_quantity_multiple', 'integer', 'Quantity');
			formQuantity.setMandatory(true);
			formQuantity.setDefaultValue('1');
				//formQuantity.setLayoutType('normal', 'startrow')
				

			var filterSubCat2 = [ [ ['isinactive', 'is', 'F'] ], 'and',[ [ ['subsidiary', 'is', nlapiGetSubsidiary()],'and',['custitem_category','is',itemCategory],'and',['custitem_subcat1','is',subCategory1],'and',['custitem_subcat2','is',subCategory2],'and', ['vendor.internalid','is',orderVendor] ],'or',[ ['subsidiary', 'is', nlapiGetSubsidiary()],'and',['custitem_category','is',itemCategory],'and',['custitem_subcat1','is',subCategory1],'and',['custitem_subcat2','is',subCategory2],'and',['custitem_do_not_restrict_by_vendor','is','T'] ] ], 'and', [ ['subtype', 'noneOf', 'Sale'] ] ];  //SDP change# 7328 (26-June-2015) Changes to restrict sales item in dropdown

/*			
			var filterSubCat2 = new Array();

			filterSubCat2[0] = new nlobjSearchFilter('subsidiary', null, 'anyof', nlapiGetSubsidiary());
			filterSubCat2[1] = new nlobjSearchFilter('custitem_category', null, 'anyof', itemCategory);
			filterSubCat2[2] = new nlobjSearchFilter('custitem_subcat1', null, 'anyof', subCategory1);
			filterSubCat2[3] = new nlobjSearchFilter('custitem_subcat2', null, 'anyof', subCategory2);
*/			
				
			var columnSubCat2 = new Array();
			columnSubCat2[0] = new nlobjSearchColumn('internalid');
			columnSubCat2[1] = new nlobjSearchColumn('name');

			//var itemSearchResults = nlapiSearchRecord('item', null, filterExpression, columnSubCat2);
			var itemSearchResults = nlapiSearchRecord('item', null, filterSubCat2, columnSubCat2);
			
			if(itemSearchResults)
			{	
				formItem.addSelectOption('', '');
				for (var a=0; a<itemSearchResults.length; a++)
				{		
						formItem.addSelectOption(itemSearchResults[a].getValue(columnSubCat2[0]), itemSearchResults[a].getValue(columnSubCat2[1]), false);
				}
			}
			else
			{	//adding alert if no ItemSearchResult found
				//throw ('No Items found for this Item/Product/Vendor Combination. Please close the window and change your selections.');
				
				var msgs = [];
					msgs.push('<br><br>'+'No Items/Vendor found for this Item/Product/Vendor combination. Please contact the Procurement team (Service.Desk@misys.com) for any new/update to the setup required.'+'<br><br>'+' Else please close window and change your selections.')
				var message = msgs.join('<p>');
				
				var frmMainNew = nlapiCreateForm('Purchase Order Request Form - Additional Items',true);
				
					frmMainNew.addField('suitelemsg', 'inlinehtml').setDefaultValue(message);
					
					//frmMainNew.addButton('custpage_close', 'Close', '(function(){self.close();})()');
					frmMainNew.addButton('custpage_close', 'Close', '(function(){window.opener.resetCheckBox(); self.close();})()');

				response.writePage( frmMainNew ); 
				return true;
			}
				


			frmMain.addSubmitButton('Submit');
			
		  //var onClickScript = 'window.close();';
			//frmMain.addButton('custpage_button', 'Cancel', onClickScript);	
			frmMain.addButton('custpage_button', 'Cancel', '(function(){window.opener.resetCheckBox(); self.close();})()');	

		  } //end of if loop for multiple items
		  
		  
	response.writePage(frmMain);
	} //end of GET loop
	
	else //POST 
	{
		nlapiLogExecution('DEBUG', 'POST', 'POST');
		var multipleItemFlagPost = request.getParameter('custpage_multiple_flag');
		nlapiLogExecution('DEBUG', 'multipleItemFlagPost', multipleItemFlagPost);
		
		if (!multipleItemFlagPost)
		{	
			nlapiLogExecution('DEBUG', '1st time to add', '1st if');
			var today = new Date();
			nlapiLogExecution('DEBUG', 'today', today);
			var trandate = nlapiDateToString(today);
			nlapiLogExecution('DEBUG', 'trandate', trandate);
			
			var form = request.getParameter('custpage_custom_forms');
			nlapiLogExecution('DEBUG', 'form', form);
			var subsidiary = request.getParameter('custpage_subsidiaryfield');
			nlapiLogExecution('DEBUG', 'subsidiary', subsidiary);
			
			var employee = request.getParameter('custpage_employee');
			nlapiLogExecution('DEBUG', 'employee', employee);
			
			var cat1 = request.getParameter('custpage_category1field');
			nlapiLogExecution('DEBUG', 'cat1', cat1);
			var subcat1 = request.getParameter('custpage_sub_category1field');
			nlapiLogExecution('DEBUG', 'subcat1', subcat1);
			var subcat2 = request.getParameter('custpage_sub_category2field');
			nlapiLogExecution('DEBUG', 'subcat2', subcat2);
			var item = request.getParameter('custpage_item');
			nlapiLogExecution('DEBUG', 'item', item);
			var vendor = request.getParameter('custpage_vendorfield');
			nlapiLogExecution('DEBUG', 'vendor', vendor);
			var currency = request.getParameter('custpage_currency');
			nlapiLogExecution('DEBUG', 'currency', currency);
			var rate = request.getParameter('custpage_rate');
			nlapiLogExecution('DEBUG', 'rate', rate);
			var quantity = request.getParameter('custpage_quantity');
			nlapiLogExecution('DEBUG', 'quantity', quantity);
			var justification = request.getParameter('custpage_justification');
			nlapiLogExecution('DEBUG', 'justification', justification);	

			//Reetesh 06072015 Start/////////////////////////////////////////////////////////////////////////////////////////////////////////
			var fromDate = request.getParameter('custpage_from_date');
			nlapiLogExecution('DEBUG', 'FromDate', fromDate);	
			var toDate = request.getParameter('custpage_to_date');
			nlapiLogExecution('DEBUG', 'ToDate', toDate);	
			var SpreadCostEqually = request.getParameter('custpage_spread_cost_equally');
			nlapiLogExecution('DEBUG', 'Spread Cost Equally', SpreadCostEqually);	
			//Reetesh 06072015 End////////////////////////////////////////////////////////////////////////////////////////////////////////					
					
			var costCenter = nlapiLookupField('employee', employee, 'department');
			nlapiLogExecution('DEBUG', 'costCenter', costCenter);
			var product = nlapiLookupField('employee', employee, 'class');
			nlapiLogExecution('DEBUG', 'product', product);
			var region = nlapiLookupField('employee', employee, 'location');
			nlapiLogExecution('DEBUG', 'region', region);
			
			var vendorTerms = nlapiLookupField('vendor', vendor, 'terms');
			nlapiLogExecution('DEBUG', 'vendorTerms', vendorTerms);
			var termIsInactive = nlapiLookupField('term', vendorTerms, 'isinactive');
			nlapiLogExecution('DEBUG', 'termIsInactive', termIsInactive);
			
			if (userCenter != 'EMPLOYEE')
			{
				var purchaseOrdRec = nlapiCreateRecord('purchaseorder', {customform: form}); //sets form based on selected option
			}
			else
			{
				var purchaseOrdRec = nlapiCreateRecord('purchaseorder'); //Employee Center, no need to set form, take the default/preferred
			}
			
								
				purchaseOrdRec.setFieldValue('trandate', trandate);
				
				purchaseOrdRec.setFieldValue('subsidiary', subsidiary);
				purchaseOrdRec.setFieldValue('employee', employee);
				purchaseOrdRec.setFieldValue('entity', vendor);
				purchaseOrdRec.setFieldValue('currency', currency);
				
				if (costCenter!=null && costCenter!='')
				{
					purchaseOrdRec.setFieldValue('department', costCenter);
				}
				
				if (product!=null && product!='')
				{
					purchaseOrdRec.setFieldValue('class', product);
				}
				
				if (region!=null && region!='')
				{
					purchaseOrdRec.setFieldValue('location', region);
				}
				
				if (termIsInactive!=null && termIsInactive!='T')
				{
					purchaseOrdRec.setFieldValue('custbody_misyspaymentterm', vendorTerms);
				}
				else //Term is inactive
				{
					purchaseOrdRec.setFieldValue('custbody_misyspaymentterm', '');
				}
								
				purchaseOrdRec.selectNewLineItem('item');
				purchaseOrdRec.setCurrentLineItemValue('item','item', item); 
				purchaseOrdRec.setCurrentLineItemValue('item','quantity', quantity);
				purchaseOrdRec.setCurrentLineItemValue('item','rate', rate);
				purchaseOrdRec.setCurrentLineItemValue('item','custcol_misyscategory', cat1);
				purchaseOrdRec.setCurrentLineItemValue('item','custcol_misyssubcategory1', subcat1);
				purchaseOrdRec.setCurrentLineItemValue('item','custcol_misyssubcategory2', subcat2);
				purchaseOrdRec.setCurrentLineItemValue('item','custcol_item_selected', item); //Items. custom field
				//purchaseOrdRec.setCurrentLineItemValue('item','custcol_select_item', 'T'); setting to F - not Store Value
				
				purchaseOrdRec.setCurrentLineItemValue('item','department', costCenter); //adding Cost Center Column on Item Sublist
				purchaseOrdRec.setCurrentLineItemValue('item','class', product);  //adding Product Column on Item Sublist
				purchaseOrdRec.setCurrentLineItemValue('item','location', region);  //adding Region Column on Item Sublist
				
				purchaseOrdRec.commitLineItem('item');
				
				purchaseOrdRec.setFieldValue('custbody_just_for_purch', justification); 
				//commenting value for Justification 09/27
				//adding Field value for 'Justification for Purchase' per UAT Issue#9 10/10

				//Reetesh 06072015 Start//////////////////////////////////////////////////////////////////////////////////////////////////////			
				purchaseOrdRec.setFieldValue('custbody_po_from_date', fromDate); 
				purchaseOrdRec.setFieldValue('custbody_po_to_date', toDate); 
				purchaseOrdRec.setFieldValue('custbody_po_spread_cost_equally', SpreadCostEqually); 
				//Reetesh 06072015 End////////////////////////////////////////////////////////////////////////////////////////////////////////
		
			try
			{
				nlapiLogExecution('DEBUG', stLoggerTitle, 'Submitting PO Order');
				
				var purchaseOrderId = nlapiSubmitRecord(purchaseOrdRec, true, true); //setting ignoremandatory to true
				nlapiLogExecution('DEBUG', 'purchaseOrderId', purchaseOrderId);
			}		
			catch (error) 
			{
				// do not use error instanceof nlobjError here        
				if (error.getDetails != undefined) 
				{
					nlapiLogExecution('ERROR', 'Validation Error', error.getCode() + ': ' + error.getDetails());
					throw error;
				}
				else 
				{
					nlapiLogExecution('ERROR', 'Unexpected Error', error.toString());
					throw nlapiCreateError('99999', error.toString());
				}
			}
			
			
			try
			{
				nlapiLogExecution('DEBUG', stLoggerTitle, 'Redirecting User to Saved PO in Edit mode');
				
				nlapiSetRedirectURL('RECORD','purchaseorder', purchaseOrderId, true);
			}
			catch (e) 
			{
				// add something about PO approver not set on Employee record      
				if (e.getDetails != undefined) 
				{
					nlapiLogExecution('ERROR', 'Validation Error - Please note that Approved PO can no longer be edited:', e.getCode() + ': ' + e.getDetails());
					throw error;
				}
				else 
				{
					nlapiLogExecution('ERROR', 'Unexpected Error', e.toString());
					throw nlapiCreateError('99999', e.toString());
				}
			}
		}
		
		else //else if (multipleItemFlag == 'true')
		{
			
			var addItemCat = request.getParameter('custpage_category1field_multiple');;
			var addSubCat1 = request.getParameter('custpage_sub_category1field_multiple');;
			var addSubCat2 = request.getParameter('custpage_sub_category2field_multiple');;
			
			var addItem = request.getParameter('custpage_item_multiple');
			var addRate = request.getParameter('custpage_rate_multiple');
			var addQuantity = request.getParameter('custpage_quantity_multiple');
			
			//call client function passing the value and close the pop-up window.
			response.write('<html><body><script>window.opener.populateForm(' + addItem +', '+ addRate+ ', '+addQuantity+', '+ addItemCat+ ', '+ addSubCat1+ ', '+ addSubCat2+ '); window.close();</script></body></html>');

		}


	}//end of POST loop

	
	nlapiLogExecution('DEBUG', stLoggerTitle, '---------- END ----------');
} //end of function



function get_resultArrray(resultset)
{
	var resultsArray = []; //creating array to hold all results returned (>1k)
    var searchid = 0;
    //loop while the results returned is 1000
    do { 
        var resultslice = resultset.getResults( searchid, searchid+1000 );
        for (var rs in resultslice) {
            resultsArray.push( resultslice[rs] );
            searchid++;
        }
    } while (resultslice.length >= 1000);
    return resultsArray;

}