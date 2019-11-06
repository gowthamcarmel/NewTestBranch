	// BEGIN SUITELET ==================================================

	function suiteletFunction(request, response)
	{
		try 
		{
			if (request.getMethod() == 'GET') 
			{
				var ven = request.getParameter('custscript_vendor_id');
				//nlapiLogExecution('DEBUG', 'GET', 'ven= ' + ven);
				
				var cur = request.getParameter('custscript_subsidiary_currency');
				//nlapiLogExecution('DEBUG', 'GET', 'cur= ' + cur);
				
				var date = request.getParameter('custscript_requisition_date');
				//nlapiLogExecution('DEBUG', 'GET', 'date= ' + date);
				
				var form = nlapiCreateForm('Pick a Currency', true);
				
				form.setScript('customscript_finastra_onrequisition_cl');
				
				var infoStr = "<p>Please select the currency for this vendor.</p>";
				
				var info = form.addField('custpage_info','longtext','',null,'main');
				info.setDisplayType('inline');
				info.setLayoutType('outsideabove','startrow');
				info.setDefaultValue(infoStr);
				
				var Vendor = form.addField('custpage_vendor','select','Vendor', 'vendor');
				Vendor.setDefaultValue(ven);
				Vendor.setDisplayType('inline');
				
				var SubsidiaryCurrency = form.addField('custpage_sub_currency','select','Subsidiary Currency', 'currency');
				SubsidiaryCurrency.setDefaultValue(cur);
				SubsidiaryCurrency.setDisplayType('hidden');
				
				var ReqDate = form.addField('custpage_req_date','date','Date');
				ReqDate.setDefaultValue(date);
				ReqDate.setDisplayType('hidden');
				
				//var sublist = form.addSubList('custpage_machine','list','Select Currency');

				//var GetButton = sublist.addMarkAllButtons();
				//nlapiLogExecution('DEBUG', 'suitlet', 'GetButton===' + GetButton);
				
				//sublist.addField('custpage_select','checkbox','Select');
				//sublist.addField('custpage_currency','text','Currency').setDisplayType('inline');
				//sublist.addField('custpage_currency_internalid','select','Currency ID').setDisplayType('hidden');
				
				var selectCurrency = form.addField('custpage_currency','select','Vendor Currency');
				selectCurrency.addSelectOption('','');
				selectCurrency.setMandatory(true);
				 
				var Check = 0;
				
				var filters = new Array();
				filters[0] = new nlobjSearchFilter('internalid', null, 'is', ven);
				
				var columns = new Array();
				columns[0] = new nlobjSearchColumn('internalid');
				
				var searchResults = nlapiSearchRecord('vendor', 'customsearch_vendor_currency_search', filters, columns);
				//nlapiLogExecution('DEBUG','On Requisition Client','searchResults='+ searchResults);
				
				var result = searchResults[0];
				
				// return all columns associated with this search
				var columns = result.getAllColumns();
				
				var columnLen = searchResults.length;
				//nlapiLogExecution('DEBUG','On Requisition Client','columnLen='+ columnLen);
				
				
				if(_logValidation(searchResults))
				{
					for (var i = 0; i < columnLen; i++)
					{
						var column = columns[0];
						var label = column.getLabel() == "Internal ID";
						var InternalID = searchResults[i].getValue(column);
						//nlapiLogExecution('DEBUG','On Requisition Client','InternalID='+ InternalID);
						
						var column = columns[1];
						var label = column.getLabel() == "ID";
						var ID = searchResults[i].getValue(column);
						//nlapiLogExecution('DEBUG','On Requisition Client','ID='+ ID);
						
						var column = columns[2];
						var label = column.getLabel() == "NAME";
						var Name = searchResults[i].getValue(column);
						//nlapiLogExecution('DEBUG','On Requisition Client','Name='+ Name);
						
						var column = columns[3];
						var label = column.getLabel() == "CURRENCY LIST";
						var VenCurrency = searchResults[i].getValue(column);
						//nlapiLogExecution('DEBUG','On Requisition Client','VenCurrency='+ VenCurrency);
						
						var VenCurrencyID = getCurrencyID(VenCurrency)
						//nlapiLogExecution('DEBUG','On Requisition Client','VenCurrencyID='+ VenCurrencyID);
						
						//sublist.setLineItemValue('custpage_currency', i + 1, VenCurrency);
						//sublist.setLineItemValue('custpage_currency_internalid', i + 1, VenCurrencyID);
						
						selectCurrency.addSelectOption(VenCurrencyID,VenCurrency);
					}
				}
				
				form.addSubmitButton('Ok');
				
				//var OkAction = "setCurrencyValue();";
				//form.addButton('custpage_search','Ok',OkAction);
				
				response.writePage(form);
			}/**** End of request.getMethod() == 'GET'*******/
			else 
				if (request.getMethod() == 'POST') 
				{
					/*var CurID;
					
					var group = 'custpage_machine';
					var lnCnt = request.getLineItemCount(group);
					
					var GMSMasterRecords = '';// = new Array();

					for(var ln=1;ln<=lnCnt;ln++)
					{
						if(request.getLineItemValue(group,'custpage_select',ln)=='T')
						{
							CurID = request.getLineItemValue(group,'custpage_currency_internalid',ln);
							nlapiLogExecution('DEBUG', 'suitlet in post', 'CurID===' + CurID);
							break;
							
						}
					}*/
					
					var CurID = request.getParameter('custpage_currency');
					//nlapiLogExecution('DEBUG', 'suitlet in post', 'CurID===' + CurID);
					
					var SubsidiaryCurrency = request.getParameter('custpage_sub_currency');
					//nlapiLogExecution('DEBUG', 'suitlet in post', 'SubsidiaryCurrency===' + SubsidiaryCurrency);
					
					var Date = request.getParameter('custpage_req_date');
					//nlapiLogExecution('DEBUG', 'suitlet in post', 'Date===' + Date);
					
					//var exchgRate = nlapiExchangeRate(CurID, SubsidiaryCurrency, Date);
					var exchgRate = nlapiExchangeRate(SubsidiaryCurrency, CurID, Date);
					//nlapiLogExecution('DEBUG','suitlet in post','exchgRate='+ exchgRate);
					
					response.write('<html><body><script>window.opener.setCurrencyValue(' + CurID +', '+ exchgRate+ '); self.close();</script></body></html>');
					//response.write('<html><head><script>window.opener.nlapiSetCurrentLineItemValue("item", "custcol_vendor_currency", CurID);self.close();</script></head><body></body></html>');
				}/**** End of request.getMethod() == 'POST'*******/
		} 
		catch (Exception) {
			nlapiLogExecution('DEBUG', 'Exception', 'Exception= ' + Exception);
		}
	}
	// END SUITELET ====================================================


	//BEGIN SUITELET ==================================================

	function suiteletFunction_EmpDetails(request, response)
	{
		try 
		{
			if (request.getMethod() == 'GET') 
			{
				var EmployeeID = request.getParameter('custscript_employee_id_cl');
				nlapiLogExecution('DEBUG', 'GET', 'EmployeeID= ' + EmployeeID);
				
				var form = nlapiCreateForm('Confirm Employee Details', true);
				
				form.setScript('customscript_finastra_onrequisition_cl');
				
				//var infoStr = "<p>Please confirm the employee Cost Centre, Product, Region and Supervisor.</p>";
				var infoStr = "<p>Please confirm the employee Cost Centre, Region and Supervisor.</p>";
				
				var info = form.addField('custpage_info','longtext','',null,'main');
				info.setDisplayType('inline');
				info.setLayoutType('outsideabove','startrow');
				info.setDefaultValue(infoStr);
				
				var Employee = form.addField('custpage_employee','select','Employee', 'employee');
				Employee.setDefaultValue(EmployeeID);
				Employee.setDisplayType('disabled');
				
				var Supervisor = form.addField('custpage_supervisor','select','Supervisor', 'employee');
				Supervisor.setDisplayType('inline');
				
				var CostCentre = form.addField('custpage_costcentre','select','Cost Centre', 'department');
				//CostCentre.setDisplayType('inline');
				
				var Product = form.addField('custpage_product','text','Product', 'class');
				Product.setDisplayType('hidden');
				
				var Region = form.addField('custpage_region','select','Region', 'location');
				//Region.setDisplayType('inline');
				
				if(_logValidation(EmployeeID))
				{
					var EmpCostCentre = nlapiLookupField('employee',EmployeeID,'department');
					nlapiLogExecution('DEBUG', 'GET', 'EmpCostCentre= ' + EmpCostCentre);
					
					var EmpProduct= nlapiLookupField('employee',EmployeeID,'class');
				
					//var searchRecord= nlapiLookupField('classification',EmpProduct,'name');
				//nlapiLogExecution('DEBUG', 'Product', 'name ==' + searchRecord);
					
					//var test = nlapiLookupField('class',EmpProduct,'name');
				
					nlapiLogExecution('DEBUG', 'GET', 'EmpProduct= ' + EmpProduct);
			
					var EmpRegion = nlapiLookupField('employee',EmployeeID,'location');
					nlapiLogExecution('DEBUG', 'GET', 'EmpRegion= ' + EmpRegion);
					
					var EmpSupervisor = nlapiLookupField('employee',EmployeeID,'supervisor');
					nlapiLogExecution('DEBUG', 'GET', 'EmpSupervisor= ' + EmpSupervisor);
					
					CostCentre.setDefaultValue(EmpCostCentre);
					Product.setDefaultValue(EmpProduct);
					//Product.label(EmpProduct);
					Region.setDefaultValue(EmpRegion);
					Supervisor.setDefaultValue(EmpSupervisor);
				}
				
				form.addSubmitButton('Confirm');
				
				/*window.opener.nlapiSetFieldValue('department', EmpCostCentre);
				//window.opener.nlapiSetFieldValue('class', EmpProduct);
				window.opener.nlapiSetFieldValue('location', EmpRegion);
				window.open("","_self");
				window.close();*/
				
				response.writePage(form);
			}/**** End of request.getMethod() == 'GET'*******/
			else 
				if (request.getMethod() == 'POST') 
				{
					var EmpCostCentre = request.getParameter('custpage_costcentre');
					nlapiLogExecution('DEBUG', 'suitlet in post', 'EmpCostCentre===' + EmpCostCentre);
					
					var EmpProduct = request.getParameter('custpage_product');
					nlapiLogExecution('DEBUG', 'suitlet in post', 'EmpProduct===' + EmpProduct);
					
					var EmpRegion = request.getParameter('custpage_region');
					nlapiLogExecution('DEBUG', 'suitlet in post', 'EmpRegion===' + EmpRegion);
					
					var EmpSupervisor = request.getParameter('custpage_supervisor');
					nlapiLogExecution('DEBUG', 'suitlet in post', 'EmpSupervisor===' + EmpSupervisor);	
					
					//response.write('<html><body><script>window.opener.setEmpDetails(' + EmpCostCentre +', '+ EmpProduct+ ', '+ EmpRegion+ '); self.close();</script></body></html>');
					
					response.write('<html><body><script>window.opener.setEmpDetails(' + EmpCostCentre +', '+ EmpRegion+ ', '+ EmpSupervisor+ ', '+EmpProduct+ '); self.close();</script></body></html>');
					//response.write('<html><body><script>window.opener.setEmpDetails.self.close();</script></body></html>');
				}/**** End of request.getMethod() == 'POST'*******/
		} 
		catch (Exception) {
			nlapiLogExecution('DEBUG', 'Exception', 'Exception= ' + Exception);
		}
	}
	//END SUITELET ====================================================

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

	function getCurrencyID(Currency)
	{
		var CurrencyID = '';
		
		
		var filters = new Array();
		filters[0] = new nlobjSearchFilter('name',null,'contains',Currency);
		filters[1] = new nlobjSearchFilter('isinactive',null,'is','F');

		var columns = new Array();
		columns[0] = new nlobjSearchColumn('internalid');
		
		var searchRecord = nlapiSearchRecord('currency',null,filters,columns);
		//nlapiLogExecution('DEBUG', 'GMS Invoices Scheduled', 'searchRecord ==' + searchRecord);
		
		if(_logValidation(searchRecord))
		{

			for(var i=0;i<searchRecord.length;i++)
			{
				CurrencyID = searchRecord[i].getValue('internalid');
				nlapiLogExecution('DEBUG', 'GMS Invoices Scheduled', 'CurrencyID ==' + CurrencyID);
				if(_logValidation(CurrencyID))
				{
					break;
				}
			}
				
		}
		if(_logValidation(CurrencyID))
		{
			return CurrencyID;
		}
	}


	function suiteletFunction_ShipDetails(request, response)
	{
		try 
		{
			
			if (request.getMethod() == 'GET') 
			{
				
				var shipaddr='';
				var formcaption= '';
				var infoStr = '';
				var customerID = request.getParameter('custscript_customer1');
				var addrtype = request.getParameter('custscript_addr_type');
				var addresscaption= '';
				//shipaddr = addrtype;
				if (addrtype == 'S')
				{
					formcaption= 'Select Shipping Address';
					infoStr = "<p>Please select the Shipping address.</p>";
					addresscaption='Shipping Address';
				}
				else
				{
					formcaption= 'Select Billing Address';
					infoStr = "<p>Please select the Billing address.</p>";
					addresscaption='Billing Address';
				}
				nlapiLogExecution('DEBUG', 'GET', 'CustomerID= ' + customerID);
				
				var form = nlapiCreateForm(formcaption, true);
				
				form.setScript('customscript_fin_new_deal_cl');
				
				var LineCount = 0;
			
				form.addField('custpage_addr','text').setDisplayType('hidden');
				nlapiLogExecution('DEBUG', 'GET', 'customerid= ' + customerID);
				
				 var info = form.addField('custpage_info','longtext','',null,'main');
				info.setDisplayType('inline');
				info.setLayoutType('outsideabove','startrow');
				info.setDefaultValue(infoStr);
				
				
				var sublist = form.addSubList('custpage_machine','list','Select Records');
			   
				sublist.addField('custpage_select','checkbox','Select');
				sublist.addField('custpage_internalid','text','Internal ID').setDisplayType('hidden');
				sublist.addField('custpage_shippingaddr','text',addresscaption).setDisplayType('inline');
				sublist.addField('custpage_bill_ship','text','Addrtype').setDisplayType('hidden');
				
				var filters = new Array();
				filters[0] = new nlobjSearchFilter('internalid',null,'is',customerID);
				//var hits = nlapiSearchRecord('customer','customsearch_cust_addr_search',filters,columns);
				
				
				var columns = new Array();
				columns[0] = new nlobjSearchColumn('internalid');
				columns[1] = new nlobjSearchColumn('address');
				
				var hits = nlapiSearchRecord('customer','customsearch_cust_addr_search',filters,columns);
				nlapiLogExecution('DEBUG', 'suitlet', 'hits===' + hits);
				
				
				if(_logValidation(hits))
				{
					
					//ListCount.setDefaultValue(hits.length);
					nlapiLogExecution('DEBUG', 'suitlet', 'hits.length===' + hits.length);
					var lines = new Array();
					for(var i=0;i<hits.length;i++)
					{
						var h = hits[i];
						lines.push({
							custpage_shippingaddr: hits[i].getValue('address'),
							custpage_internalid: hits[i].getValue('addressinternalid'),
							custpage_bill_ship: addrtype
						
						});
						nlapiLogExecution('DEBUG','suitlet','id=='+hits[i].getValue('addressinternalid'))
						
					}
					sublist.setLineItemValues(lines);
					
				}
				form.addButton('btn_Confirm','Confirm','setShipAddress('+shipaddr+')');

				response.writePage(form);
			}/**** End of request.getMethod() == 'GET'*******/
				
		} 
		catch (Exception) {
			nlapiLogExecution('DEBUG', 'Exception', 'Exception= ' + Exception);
		}
	}


