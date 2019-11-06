/**
 * Module Description
 * 
 * Version    Date            Author           Remarks
 * 1.00       17 Mar 2014     anduggal
 *
 *
 ************************************************
 *
 *  8412    EGO Change parent base currency to Euro
 *  8776    EGO Change parent base currency to USD
 *
 ************************************************
 * @returns {Void} Any or no return value
 *
 */

function workflowAction_getAmountUSD() { // 8412 -- reversed by 8776
//function workflowAction_getAmountEUR() { // 8412 -- reversed by 8776
    var stLoggerTitle = 'workflowAction_getAmountUSD'; // 8412 -- reversed by 8776
    //var stLoggerTitle = 'workflowAction_getAmountEUR'; //8412 -- reversed by 8776
	nlapiLogExecution('DEBUG', stLoggerTitle, '>>Entry<<');
    
    try
    {
    	var returnId = nlapiGetRecordId();
    	
    	var filters = new Array();
    	filters[0] = new nlobjSearchFilter('internalid', null, 'is', returnId);
    	filters[1] = new nlobjSearchFilter('mainline', null, 'is', 'T');
    	
    	var columns = new Array();
    	columns[0] = new nlobjSearchColumn('tranid');
    	columns[1] = new nlobjSearchColumn('amount');
    	columns[2] = new nlobjSearchColumn('fxamount');
    	columns[3] = new nlobjSearchColumn('netamountnotax');
    	columns[4] = new nlobjSearchColumn('currency');
		columns[5] = new nlobjSearchColumn('netamount');
		columns[6]= new nlobjSearchColumn('exchangerate');
		columns[7]= new nlobjSearchColumn('total');
		columns[8]= new nlobjSearchColumn('trandate')
    	
		
		
    	var searchResults = nlapiSearchRecord('returnauthorization', null, filters, columns);
    	for ( var i = 0; searchResults != null && i < 1; i++) {
    		var result = searchResults[i];
    		//var amount = roundNumber(result.getValue('total'));
			
			var amount = result.getValue('fxamount');
			nlapiLogExecution('DEBUG','AmountUSD','AmountUSD=='+amount);
			var Date = result.getValue('trandate');
			nlapiLogExecution('DEBUG','Date','Date=='+Date);
			
			var currency= result.getValue('currency');
			nlapiLogExecution('DEBUG','Currency','AmountUSD=='+currency);
			
			var curid= getCurrencyID('USD');
			nlapiLogExecution('DEBUG','Currency','Currency=='+currency);
			
			nlapiLogExecution('DEBUG','CurrencyID','CurrencyID=='+curid);
			
			var exchrate= nlapiExchangeRate(currency,curid,Date);
			
			nlapiLogExecution('DEBUG','excrate','excrate=='+exchrate);
			if (currency == 'USD')
			{
				amount = result.getValue('fxamount');;
			}
			else
			{
				amount=result.getValue('fxamount') * exchrate;
			}
			nlapiLogExecution('DEBUG','AmountUSD','AmountUSD=='+amount);
			//amount = Math.floor(amount);
	
    		if (amount < 0) {
				amount = amount * -1;
			}
            nlapiLogExecution('DEBUG','AmountUSD','AmountUSD=='+amount);
			 nlapiLogExecution('DEBUG','Exchnage Rate','exch=='+result.getValue('exchangerate'));
    		return amount;
    	}
        
        nlapiLogExecution('DEBUG', stLoggerTitle, '>>Exit<<');        
        return null;
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

function roundNumber(number)
	{
		var decimals = 2;
		var newnumber = new Number(number + '').toFixed(parseInt(decimals));
		parseFloat(newnumber);
		return newnumber;
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
