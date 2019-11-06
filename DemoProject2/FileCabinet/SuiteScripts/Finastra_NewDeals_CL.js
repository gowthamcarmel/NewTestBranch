		function fieldChange_OnNewDeals(type,name)
		{	
			if (name == 'custrecord_newdeal_customer')
			{
			nlapiLogExecution('DEBUG', 'test', 'test');
			nlapiSetFieldValue('custrecord_newdeal_shipto','');
			nlapiSetFieldValue('custrecord_newdeal_billto','');
			//getCustomerAddress('B');
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

		function setShipAddress(addrtype)
		{
			try{
				
				nlapiLogExecution('DEBUG', 'Test', 'Test===' + addrtype);
				var Shippingaddr1='';
				var internalid = '';
				var addrtype1 = '';
				var seln = 0;
					var lnCnt = nlapiGetLineItemCount('custpage_machine');
					nlapiLogExecution('DEBUG', 'suitlet in post', 'linecount===' + lnCnt);
					
					var group = 'custpage_machine';
					for(var ln=1;ln<=lnCnt;ln++)
					{
						if(nlapiGetLineItemValue(group,'custpage_select',ln)=='T')
						{
							Shippingaddr1 = nlapiGetLineItemValue(group,'custpage_shippingaddr',ln);
							internalid = nlapiGetLineItemValue(group,'custpage_internalid',ln);
							addrtype1 = nlapiGetLineItemValue(group,'custpage_bill_ship',ln);
							nlapiLogExecution('DEBUG', 'suitlet in post', 'ShippingAdd===' + Shippingaddr1);
							seln= seln+1
						}
					}
					nlapiLogExecution('DEBUG', 'suitlet in post', 'Inter===' + internalid);
					
				if(seln > 1)
				{
					alert('Please select one address');
					
				}
			if(addrtype1 == 'S' && seln ==1)
			{
			window.opener.nlapiSetFieldValue('custrecord_newdeal_shipadd', Shippingaddr1);
			window.opener.nlapiSetFieldValue('custrecord_newdeal_shipto',internalid);
			
			//window.open("","_self");
			window.onbeforeunload = null;
			//window.open("","_self");
			window.close();
			}
			else
				if(addrtype1 == 'B' && seln ==1)
				{
					window.opener.nlapiSetFieldValue('custrecord_newdeal_billadd', Shippingaddr1);
					window.opener.nlapiSetFieldValue('custrecord_newdeal_billto',internalid);
					//window.open("","_self");
					window.onbeforeunload = null;
					//window.open("","_self");
					window.close();
				}


			}

			
			 catch (error)
			{
				 nlapiLogExecution('ERROR','Process Error',  e.getCode() + ': ' + e.getDetails());
			}
				
		}
		

		function postSourcing_OnNewDeals(type, name) 
		{
			if (name === 'custrecord_newdeal_customer' || name === 'custrecord_newdeal_shipto')
			{
				var Shippingaddr= nlapiGetFieldValue('custrecord_newdeal_shipto');

			}
		}


	function getCustomerAddress(Addr_Type)
		{
			try
			{
				
				//alert('EmpID ='+EmpID)
				 var customerID = nlapiGetFieldValue('custrecord_newdeal_customer');
				 nlapiLogExecution('DEBUG','On New Deals','CustomerID='+ customerID);
				if(_logValidation(customerID))
				{

				//var temp = 'https://system.eu2.netsuite.com/app/site/hosting/scriptlet.nl?script=1092&deploy=1';
				var temp = '/app/site/hosting/scriptlet.nl?script=1207&deploy=1'
				temp+='&custscript_customer1='+customerID
				temp+='&custscript_addr_type='+Addr_Type;
				
				 
				var objWind = window.open(temp, "_blank", "toolbar=no,menubar=0,status=0,copyhistory=0,scrollbars=yes,resizable=1,location=0,Width=800,Height=650");
			
				}
				else
				{
					alert('Please select a customer');
				}
			
			}
			catch(e)
			{
				 nlapiLogExecution('ERROR','Process Error',  e.getCode() + ': ' + e.getDetails());
			}
			
		}
		
		