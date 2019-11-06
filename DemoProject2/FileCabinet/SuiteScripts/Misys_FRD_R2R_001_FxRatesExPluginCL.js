/*
$Archive: /Misys/Misys_FRD_R2R_001_FxRatesExPluginCL.js $
$Author: Ken Woodhouse $
$Date: 5/09/19 15:23 $

$Modtime: 5/09/19 14:55 $
$Revision: 1 $
*/

// CLIENT SUPPORT FOR CONSOLIDATED EXCHANGE RATES

// utils
var g = {};
g.isEmpty = function(f) {return (f==null||f=='');}
g.noNull = function(f) {return f==null?'':f;}
g.exInfo = function(ex)
{
	var info = '';
	if(ex instanceof nlobjError)
		info = ex.getDetails();
	else if(ex!=null&&ex.message!=null)
		info = ex.message;
	return info;
}

// check selected period is open
function CER_saveRecord()
{
    var pID = nlapiGetFieldValue('custpage_ppid');
    
    if(g.isEmpty(pID))
    {
        alert('Please select a posting period before running consolidation.');
        return false;
    }
    // check period open
    var isOK = false;
    try
    {
        if(nlapiLookupField('accountingperiod',pID,'closed') == 'T')
            alert('ERROR: Selected posting period is closed.');
        else
        isOK = true;
    }
    catch(ex)
    {
        alert('ERROR: failed to acquire posting period data:\n'+g.exInfo(ex));
    }
    return isOK;
}