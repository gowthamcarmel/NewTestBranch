function roundToCurrencyPrecision(amount, currency) {
	try {
		var __USD = 1, __CAD = 3, __EUR = 4, __AED = 5,
		__AUD = 7, __BHD = 8, __BRL = 9, __CHF = 10,
		__CNY = 11, __DKK = 12, __GBP = 13, __HKD = 14,
		__IDR = 15, __ILS = 16, __INR = 17, __JPY = 18,
		__KES = 19, __KRW = 20, __LVL = 21, __MAD = 22,
		__MXN = 23, __MYR = 24, __NZD = 25, __PHP = 26,
		__PLN = 27, __RON = 28, __RUB = 29, __SEK = 30,
		__SGD = 31, __THB = 32, __TRY = 33, __TWD = 34,
		__ZAR = 35, __CLP = 36, __COP = 37, __CZK = 38,
		__EGP = 39, __HUF = 40, __NOK = 41, __NGN = 42,
		__SAR = 43, __VND = 44, __BGN = 45, __KWD = 46,
		__VEF = 47, __NAD = 48, __BYR = 57, __EEK = 70,
		__KZT = 80, __LTL = 84, __UAH = 103;
	
		var __ZEROPRECISION_CURRENCIES = [ __IDR, __JPY, __KRW, __CLP, __VND, __BYR];
	
		var newAmount = parseFloat(amount);	
		var hasZeroCurrency = false;
	
		for (var ii in __ZEROPRECISION_CURRENCIES) {
			if ( currency == __ZEROPRECISION_CURRENCIES[ii] ) {
				hasZeroCurrency = true;
				break;		
			}
		}
	
		if (hasZeroCurrency)
			newAmount = Math.round(amount);
		else
			newAmount = +newAmount.toFixed(2);
		
		nlapiLogExecution('DEBUG', 'CurrencyPRecision', ['hasZeroCurrency:'+ (hasZeroCurrency?'true':'false'),
														 'amount:'+amount, 
														 'currency:'+currency, 
														 'newamount:'+newAmount].join(', ') );
				
		return newAmount;
	}
	catch(error)
	{
	    if (error.getDetails != undefined)
	    {
	        nlapiLogExecution( 'ERROR', 'Process Error',error.getCode() + ': ' + error.getDetails());	        
	        // throw error;
	    }
	    else
	    {
	        nlapiLogExecution( 'ERROR', 'Unexpected Error',error.toString());
	        // throw nlapiCreateError('99999' , error.toString());
	    }
	    
	    
	    return amount;		
	}
}

//For Reference: https://system.sandbox.netsuite.com/help/helpcenter/en_US/Output/Help/Accounting/GeneralAccounting/UnderstandingCurrencyDecimalPrecision.html?NS_VER=2013.2.0 
