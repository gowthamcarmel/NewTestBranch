/**
 * Module Description
 * 
 * Version    Date            Author           Remarks
 * 1.00       16 Aug 2017     fromero
 *
 */
var __window_receivepage = false;

function receive()
{
    var selectedLine = nlapiGetFieldValue('selectedline');
    if (!selectedLine)
        return false;
    
    var stPurchOrdID = nlapiGetLineItemValue('polist', 'poid', selectedLine);
    if (!stPurchOrdID)
        return false;

    //  get the suitelet url
    var strURL = nlapiResolveURL('SUITELET', 'customscript_emplcentr_po_receipt', 'customdeploy_emplcentr_po_receipt');
    strURL += '&refid=' + stPurchOrdID;

    if (__window_receivepage && !__window_receivepage.closed) {
        __window_receivepage.location.href = strURL;
        __window_receivepage.focus();
    } else {
        __window_receivepage = window.open(strURL, '__window_receivepage', 'scrollbars=yes,menubar=no,width=800,height=600,toolbar=no');
    }

    return __window_receivepage;
}

function fieldChanged_select(type, name, linenum)
{
    if (name === 'poselect')
    {
        var currentSelectedLine = nlapiGetFieldValue('selectedline');
        var flag = nlapiGetLineItemValue(type, name, linenum);
        if (flag === 'T')
        {
            // Uncheck the previous selection
            nlapiSetLineItemValue(type, name, currentSelectedLine, 'F');
            
            // Update selection
            nlapiSetFieldValue('selectedline', linenum);
        }
        else
        {
            // Void selection
            nlapiSetFieldValue('selectedline', '');
        }
    }
}