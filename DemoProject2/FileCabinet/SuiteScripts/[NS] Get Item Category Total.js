function workflowAction_get_Item_Category_Total()
{
	var stLoggerTitle = 'workflowAction_get_Item_Category_Total';
	
	nlapiLogExecution('DEBUG', stLoggerTitle, '>>Entry<<');
    
    try
    {
    	var ItemCategoryTotal = 0;
    	
    	// Retrieve the ff from the script parameter: Saved Search
		var context = nlapiGetContext();
		
		var recID = nlapiGetRecordId();		
		nlapiLogExecution('DEBUG', stLoggerTitle, 'Script Parameter | recID = ' + recID);
		
		var stCurrency = nlapiGetFieldText('currency');
    	nlapiLogExecution('DEBUG', stLoggerTitle, 'Currency = ' + stCurrency);
    	
    	var trandate = nlapiGetFieldValue('trandate');
        nlapiLogExecution('DEBUG', stLoggerTitle, 'Date = ' + trandate);
    	
    	var flExchangeRate = forceParseFloat(nlapiExchangeRate(stCurrency, 'USD', trandate));
    	nlapiLogExecution('DEBUG', stLoggerTitle, 'Exchange Rate = ' + flExchangeRate);
		
		var filters = new Array();
	    filters[0] = new nlobjSearchFilter('internalid', null, 'is', recID);

        var stItemCatTotalSearch = context.getSetting('SCRIPT', 'custscript_req_itemcategory_total_amount');
        nlapiLogExecution('DEBUG', stLoggerTitle, 'Script Parameter | Item Category Total Search = ' + stItemCatTotalSearch);
    	
    	var arrResults = nlapiSearchRecord('purchaserequisition', stItemCatTotalSearch, filters, null);
    	if (arrResults != null)
    	{
    		for (var i = 0; i < arrResults.length; i++)
    		{
    			ItemCategoryTotal = ItemCategoryTotal + forceParseFloat(arrResults[i].getValue('estimatedamount'));
        		nlapiLogExecution('DEBUG', stLoggerTitle, 'ItemCategoryTotal= ' + ItemCategoryTotal);
    		}
    		
    		//return ItemCategoryTotal;
    	}
        
    	ItemCategoryTotal = ItemCategoryTotal * flExchangeRate;
    	nlapiLogExecution('DEBUG', stLoggerTitle, 'ItemCategoryTotal = ' + ItemCategoryTotal);
    	
        nlapiLogExecution('DEBUG', stLoggerTitle, '>>Exit<<');        
        return ItemCategoryTotal;
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


/**
 * Converts a string to float
 * @param stValue
 * @returns
 */
function forceParseFloat(stValue)
{
	var flValue = parseFloat(stValue);
    
    if (isNaN(flValue))
    {
        return 0.00;
    }
    
    return flValue;
}