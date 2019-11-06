
	// on request of procurement team
	function pageInit_OnDealItem(type)
	{
		try
		{
			//alert('Type =='+type);
			//if(type == 'create')
			//{
			//	nlapiSetFieldValue('custbody_to_be_emailed', 'T');
			//}
			
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

	function fieldChange_OnDealItem(type,name)
	{	
		try
		{
		
			if(name == 'custrecord_nditems_taxtype' || name == 'custrecord_nditems_perpetual' || name == 'custrecord_nditems_qualifying_license' ||name == 'custrecord_nditems_ini_sw_del_type')
			{
				var taxType = nlapiGetFieldText('custrecord_nditems_taxtype');
				//alert('Tax Type Value -' +taxType ) 
				if(taxType == 'License')
				{					
					var sovosTaxCode=getSovosCode(name);
					//alert('sovosTaxCode=====' + sovosTaxCode)
					nlapiSetFieldText('custrecord_nditems_us_taxtypecode',sovosTaxCode)
				
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
	//below function used to identify the sovos code based on the item parameters
	function getSovosCode(name)
	{
		try
		{
			
			var perpetual = nlapiGetFieldValue('custrecord_nditems_perpetual');
			var onetimeDel = nlapiGetFieldValue('custrecord_nditems_onetime_delivery');
			var qualifyLicense = nlapiGetFieldValue('custrecord_nditems_qualifying_license');
			var InitialDeal = nlapiGetFieldText('custrecord_nditems_ini_sw_del_type');
			var sovosCode= '';
			//alert('Inside Function')
			if(qualifyLicense == 'T' && InitialDeal == 'Electronic' && perpetual == 'T')
			{
				sovosCode= '2043215';
			}
			else if(qualifyLicense == 'T' && InitialDeal == 'Electronic' && perpetual == 'F')
			{
				sovosCode= '2037799';
			}
			else if(qualifyLicense == 'T' && InitialDeal == 'Tangible' && perpetual == 'T')
			{
				sovosCode= '2043214';
			}
			else if(qualifyLicense == 'T' && InitialDeal == 'Tangible' && perpetual == 'F')
			{
				sovosCode= '2037798';
			}
			else if(qualifyLicense == 'F' && InitialDeal == 'Electronic' && perpetual == 'T')
			{
				sovosCode= '2037790';
			}
			else if(qualifyLicense == 'F' && InitialDeal == 'Electronic' && perpetual == 'F')
			{
				sovosCode= '2037790';
			}
			else if(qualifyLicense == 'F' && InitialDeal == 'Tangible' && perpetual == 'T')
			{
				sovosCode= '2037789';
			}
			else if(qualifyLicense == 'F' && InitialDeal == 'Tangible' && perpetual == 'F')
			{
				sovosCode= '2037789';
			}
			
			//alert('taxType -' + sovosCode)
			
			return sovosCode;
		} 
		catch(e)
		{
			 nlapiLogExecution('ERROR','Process Error',  e.getCode() + ': ' + e.getDetails());
		}
		
	}

