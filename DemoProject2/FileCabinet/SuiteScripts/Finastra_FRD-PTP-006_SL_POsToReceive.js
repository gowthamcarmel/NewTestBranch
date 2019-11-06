/**
 * Module Description
 * 
 * Version    Date            Author           Remarks
 * 1.00       16 Sep 2014     fromero
 *
 */

/**
 * @param {nlobjRequest} request Request object
 * @param {nlobjResponse} response Response object
 * @returns {Void} Any output is written via response object
 */
function suitelet_POsToReceive(request, response)
{
    try
    {
        __log.start({
            'logtitle': 'POsToReceive'
            , 'company': 'Finastra'
            , 'scriptname': 'Finastra_FRD-PTP-006_SL_POsToReceive.js'
            , 'scripttype': 'suitelet'
        });

        var stHeaderText = 'Purchase Orders to receive';
        var theForm = nlapiCreateForm(stHeaderText, false);
        __log.writev('header text: ', stHeaderText);

        __log.writev('** Method', [request.getMethod()]);

        var paramItemSearch = __fn.getScriptParameter('custscript_po_ssearch');
        __log.writev('*** PO search', [paramItemSearch]);

        theForm.setScript('customscript_cs_emplcentr_pos2receive');
        theForm.addField('selectedline', 'text', 'Selected Line').setDisplayType('hidden');

        // do the search 
        var arrSearchPOs = nlapiSearchRecord('purchaseorder', paramItemSearch);

        __log.writev('results..', [arrSearchPOs ? arrSearchPOs.length : 0]);
        if (arrSearchPOs)
        {
            // build the sublist
            var poList = theForm.addSubList('polist', 'list', 'Purchase Orders');
            poList.addButton('receive', 'Create Receipt', 'receive();');
            poList.addField('poselect', 'checkbox', '');
            poList.addField('poid', 'integer', 'PO ID').setDisplayType('hidden');
            poList.addField('ponumber', 'text', 'PO Number').setDisplayType('inline');
            poList.addField('date', 'date', 'Date').setDisplayType('inline');
            poList.addField('requisition', 'select', 'Linked Requisition', 'transaction').setDisplayType('inline');
            poList.addField('vendorid', 'text', 'Vendor ID').setDisplayType('inline');
            poList.addField('vendorname', 'text', 'Vendor Name').setDisplayType('inline');
            poList.addField('amount', 'currency', 'Amount').setDisplayType('inline');
            poList.addField('createdby', 'select', 'Created By', 'employee').setDisplayType('inline');
            poList.addField('delegatedto', 'select', 'Delegated To', 'employee').setDisplayType('inline');

            var arrPoValues = [];
            for (var ii in arrSearchPOs)
            {
                var searchRow = arrSearchPOs[ii];
                var po = searchRow.getId();
                var poNumber = searchRow.getValue('number');
                var date = searchRow.getValue('trandate');
                var requisition = searchRow.getValue('appliedtotransaction');
                var vendorId = searchRow.getValue('entityid', 'vendor');
                var vendorName = searchRow.getValue('altname', 'vendor');
                var amount = searchRow.getValue('amount');
                var createdBy = searchRow.getValue('createdby');
                var delegatedTo = searchRow.getValue('custbody_delegated_to', 'appliedtotransaction');

                __log.writev('... adding po', [po, poNumber, date, requisition, vendorId, vendorName, amount, createdBy, delegatedTo]);

                arrPoValues.push({
                    'poid': po,
                    'ponumber': poNumber,
                    'date': date,
                    'requisition': requisition,
                    'vendorid': vendorId,
                    'vendorname': vendorName,
                    'amount': amount,
                    'createdby': createdBy,
                    'delegatedto': delegatedTo
                });
            }
            poList.setLineItemValues(arrPoValues);
        }

        response.writePage(theForm);
        return __log.end('endofscript', true);
    } catch (error)
    {
        __log.end('EXIT SCRIPT with errors | ' + error.toString(), true);
        if (error.getDetails != undefined)
        {
            nlapiLogExecution('ERROR', 'Process Error', error.getCode() + ': ' + error.getDetails());
            throw error;
        } else
        {
            nlapiLogExecution('ERROR', 'Unexpected Error', error.toString());
            throw nlapiCreateError('99999', error.toString());
        }
    }
}
