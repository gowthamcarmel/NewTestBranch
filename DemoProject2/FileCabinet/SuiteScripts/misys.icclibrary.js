/**
 * Copyright (c) 1998-2014 NetSuite, Inc.
 * 2955 Campus Drive, Suite 100, San Mateo, CA, USA 94403-2511
 * All Rights Reserved.
 *
 * This software is the confidential and proprietary information of
 * NetSuite, Inc. ("Confidential Information"). You shall not
 * disclose such Confidential Information and shall use it only in
 * accordance with the terms of the license agreement you entered into
 * with NetSuite.
 */

/**
 * Library used for FRD-004
 *  - handles all the grouped saved searches
 *  - handles all the transaction creation
 */

/**
 * Saved searches for FRD-044
 */
var __SSEARCH_ICC_PER_TRANS = 'customsearch_frd004_icc_pertrans';
var __SSEARCH_ICC_NEG_PER_TRANS = 'customsearch_frd004_neg_icc_pertrans';
var __SSEARCH_ICC_PERIOD_DIRECT = 'customsearch_frd004_icc_period_direct';
var __SSEARCH_ICC_PERIOD_INDIR = 'customsearch_frd004_icc_period_indirect';
var __SSEARCH_ICC_NEG_PERIOD_DIRECT = 'customsearch_frd004_neg_icc_period_direc';
var __SSEARCH_ICC_NEG_PERIOD_INDIR = 'customsearch_frd004_neg_icc_period_indir';
var __SSEARCH_ICC_PERIOD_DIRECT_SAMESUB = 'customsearch_frd004_icc_period_dir_same';
var __SSEARCH_ICC_PERIOD_INDIR_SAMESUB = 'customsearch_frd004_icc_period_ind_same';
var __SSEARCH_ICC_SAMESUBS = 'customsearch_frd004_icc_samesubs';

var _CUSTFORM_IC_PO = '131';
var _CUSTFORM_IC_SO = '127';
var _CUSTFORM_IC_JE = '111';
var _CUSTFORM_IC_VRA = '110';
var _CUSTFORM_IC_RA = '128';

var _TRANSCATEG_IC = '4';
var _INVCREDITBODY_IC = '4';

var __ICC = {};

var _ATGROUPING_PERPERIOD = '2';
var _ATGROUPING_DIRECT = '1';

var _QUEUESTATUS_COMPLETE = 'Complete';
var _QUEUESTATUS_PENDING = 'Pending';
var _QUEUESTATUS_PROCESSING = 'Processing';
var _QUEUESTATUS_ERROR = 'Error';
var _QUEUESTATUS_FAILED = 'Failed';


/**
 * Grouped search for Per Transaction IC 
 */
////////////////////////////////////////////////////////////////////////////////////////
__ICC.searchGroupedPerTransaction = function (searchFilter, isNegAmount) {
    var ssearchKey = !isNegAmount ? __SSEARCH_ICC_PER_TRANS : __SSEARCH_ICC_NEG_PER_TRANS;
    __log.writev('** Searching for IC Recharges Per Transaction....', [(isNegAmount ? 'negative' : ''), ssearchKey]);


    __log.writev('...search key', [ssearchKey]);
    // var cols = [ new nlobjSearchColumn('internalid',null,'count').setSort(true)];\	
    searchFilter.push((new nlobjSearchFilter('isinactive', null, 'is', 'F')));
    searchFilter.push(new nlobjSearchFilter('custrecord_icc_source_internal_id', null, 'noneof', '@NONE@'));

    var arrSearchGrouped = __nlapi.searchAllRecord('customrecord_intercompany_charges', ssearchKey, searchFilter);
    if (!arrSearchGrouped || !arrSearchGrouped.length) return false;

    __log.writev('..total search results: ', [arrSearchGrouped.length]);
    return arrSearchGrouped ? arrSearchGrouped : false;
};
////////////////////////////////////////////////////////////////////////////////////////

/**
 * Grouped search for Per Period IC 
 */
////////////////////////////////////////////////////////////////////////////////////////
__ICC.searchGroupedPerPeriod = function (searchFilter, isDirect, isNegAmount) {
    __log.writev('** Searching for IC Recharges Per Period....', [(isDirect ? 'direct' : 'indirect'), (isNegAmount ? 'negative' : '')]);

    var ssearchKey = false;
    


    if (isDirect)
        ssearchKey = !isNegAmount ? __SSEARCH_ICC_PERIOD_DIRECT : __SSEARCH_ICC_NEG_PERIOD_DIRECT;
    else
        ssearchKey = !isNegAmount ? __SSEARCH_ICC_PERIOD_INDIR : __SSEARCH_ICC_NEG_PERIOD_INDIR;

    __log.writev('...search key', [ssearchKey]);
    searchFilter.push((new nlobjSearchFilter('isinactive', null, 'is', 'F')));

    var arrSearchGrouped = __nlapi.searchAllRecord('customrecord_intercompany_charges', ssearchKey, searchFilter);

    if (!arrSearchGrouped || !arrSearchGrouped.length) return false;

    __log.writev('..total search results: ', [arrSearchGrouped.length]);
    return arrSearchGrouped ? arrSearchGrouped : false;
};
////////////////////////////////////////////////////////////////////////////////////////



////////////////////////////////////////////////////////////////////////////////////////
/**
 * Grouped Search for IC charges with same subsidiaries
 */
__ICC.searchGroupedSameSubsPerPeriod = function (searchFilter) {
    var ssearchKey = __SSEARCH_ICC_PERIOD_DIRECT_SAMESUB;
    __log.writev('** Searching for IC Recharges Per Period Same Subs...', [ssearchKey]);

    var arrSearchGrouped = __nlapi.searchAllRecord('customrecord_intercompany_charges', ssearchKey, searchFilter);

    if (!arrSearchGrouped || !arrSearchGrouped.length) return false;

    __log.writev('..total search results: ', [arrSearchGrouped.length]);
    return arrSearchGrouped ? arrSearchGrouped : false;
};
////////////////////////////////////////////////////////////////////////////////////////




/**
 * Vendor Account retrieval from IC Entity Mapping
 */
////////////////////////////////////////////////////////////////////////////////////////
var __VENDORACCOUNT_CACHE = {};
__ICC.getVendorAccount = function (subsDestination, subsSource) {

    __log.writev('** Get Vendor Account', [subsDestination, subsSource]);

    var cacheKey = [subsDestination, subsSource].join('|');

    if (!__VENDORACCOUNT_CACHE[cacheKey]) {
        var arrSearchEntityMapping = nlapiSearchRecord('customrecord_intercompany_entity_mapping', null,
				[(new nlobjSearchFilter('custrecord_iem_subsidiary', null, 'anyof', subsDestination || '@NONE@'))
				 , (new nlobjSearchFilter('custrecord_iem_represents_subsidiary', null, 'anyof', subsSource || '@NONE@'))
				 , (new nlobjSearchFilter('custrecord_iem_vendor_account', null, 'noneof', '@NONE@'))],
				[(new nlobjSearchColumn('custrecord_iem_vendor_account'))]);

        if (!arrSearchEntityMapping) {
            __error.report('Vendor Account not found (Subs:' + subsDestination + ', RepSub:' + subsSource + ')');
            return false;
        }

        var rowResult = arrSearchEntityMapping.shift();

        __VENDORACCOUNT_CACHE[cacheKey] = rowResult.getValue('custrecord_iem_vendor_account');
    }

    __log.writev('...vendor account', [__VENDORACCOUNT_CACHE[cacheKey]]);

    return __VENDORACCOUNT_CACHE[cacheKey];
};
////////////////////////////////////////////////////////////////////////////////////////

/**
 * Customer retrieval from IC Entity Mapping
 */
////////////////////////////////////////////////////////////////////////////////////////
var __CUSTOMERACCOUNT_CACHE = {};
__ICC.getCustomerAccount = function (subsDestination, subsSource) {

    __log.writev('** Get Customer Account', [subsDestination, subsSource]);

    var cacheKey = [subsDestination, subsSource].join('|');

    if (!__CUSTOMERACCOUNT_CACHE[cacheKey]) {
        var arrSearchEntityMapping = nlapiSearchRecord('customrecord_intercompany_entity_mapping', null,
				[(new nlobjSearchFilter('custrecord_iem_subsidiary', null, 'anyof', subsDestination || '@NONE@'))
				 , (new nlobjSearchFilter('custrecord_iem_represents_subsidiary', null, 'anyof', subsSource || '@NONE@'))
				 , (new nlobjSearchFilter('custrecord_iem_customer_account', null, 'noneof', '@NONE@'))],
				[(new nlobjSearchColumn('custrecord_iem_customer_account'))]);

        if (!arrSearchEntityMapping) {
            __error.report('Customer Account not found (Subs:' + subsDestination + ', RepSub:' + subsSource + ')');
            return false;
        };

        var rowResult = arrSearchEntityMapping.shift();

        __CUSTOMERACCOUNT_CACHE[cacheKey] = rowResult.getValue('custrecord_iem_customer_account');
    }

    __log.writev('...customer account', [__CUSTOMERACCOUNT_CACHE[cacheKey]]);

    return __CUSTOMERACCOUNT_CACHE[cacheKey];
};
////////////////////////////////////////////////////////////////////////////////////////

/**
 * Generates the data from the IC Grouped Search in preparation for the transaction record to be created
 */
////////////////////////////////////////////////////////////////////////////////////////
__ICC.extractDataForPeriod = function (groupedResultRow, filterExtra, forJE, recordType) {
    return __ICC.extractTransactionData(groupedResultRow, filterExtra, forJE, false, recordType);
};
__ICC.extractDataForPerTrans = function (groupedResultRow, filterExtra, forJE, recordType) {
    return __ICC.extractTransactionData(groupedResultRow, filterExtra, forJE, true, recordType);
};

/**
 * Extracts the data from the Grouped ICC record 
 * - determines the data that will be used to create both the header and line items for the transaction
 * 
 * @param groupedResultRow  - grouped result row
 * @param filterExtra 		- extra filters 
 * @param forJE				- is the data for journal?
 * @param isForPerTrans		- is the data for PerTransaction records
 */

//jkbautista - 20140918 - Added a new parameter value named 'recordType' as placeholder for the transaction type that will be used in grouping the IC records
__ICC.extractTransactionData = function (groupedResultRow, filterExtra, forJE, isForPerTrans, recordType) {
    __log.writev('** Generate the data creation', { 'forJE?': forJE, 'forPerTrans?': isForPerTrans });

    // gets the required grouped values to create a single transaction
    var valAllocationType = groupedResultRow.getValue('custrecord_icc_allocation_type', null, 'group');
    var valSourceSubs = groupedResultRow.getValue('custrecord_icc_source_subsidiary', null, 'group');
    var valDestSubs = groupedResultRow.getValue('custrecord_icc_destination_subsidiary', null, 'group');
    var valCurrency = groupedResultRow.getValue('custrecord_icc_currency', null, 'group');
    var valAmount = groupedResultRow.getValue('custrecord_icc_amount_fcy', null, 'sum');

    var valSourceInternalId = null;

    if (isForPerTrans) {
        valSourceInternalId = groupedResultRow.getValue('custrecord_icc_source_internal_id', null, 'group');
    }


    __log.writev('** search values', [valAllocationType, valSourceSubs, valDestSubs, valCurrency, valAmount, valSourceInternalId]);

    var cols = [], fltrs = [];
    //cols.push( new nlobjSearchColumn('custentity_excludeicrecharge','custrecord_icc_project','group') ); 
    //cols.push( new nlobjSearchColumn('custrecord_icc_amount_fcy',null,'sum') );

    /**
	 * ICC fields that will be grouped together..
	 */
    var groupColumns = ['custrecord_icc_item'
	                    , 'custrecord_icc_allocation_category'
	                    , 'custrecord_icc_item_category'
            			, 'custrecord_icc_sub_category_1'
            			, 'custrecord_icc_sub_category_2'
            			, 'custrecord_icc_project'];

    //jkbautista - 20140918 - Plucked out the Destination: class, deparment and location from the groupColumns and added a gated check for the recordType before pushing these filters to the filter array.
    //jkbautista - 20140922 - Added the VRA filter filter to fix negative IC records problem(Per Period Fix)
    //jkbautista - 20140926 - Added another VRA filter, this time, the whole id name of it(Per Trans Fix). 
    if (recordType === 'purchaseorder' || recordType === 'VRA' || recordType === 'vendorreturnauthorization') {
        groupColumns.push('custrecord_icc_destination_class');
        groupColumns.push('custrecord_icc_destination_department');
        groupColumns.push('custrecord_icc_destination_location');
    }

    //jkbautista - 20140918 - Plucked out the Source: class, deparment and location from the groupColumns and added a gated check for the recordType before pushing these filters to the filter array.
    //jkbautista - 20140922 - Added the VRA filter filter to fix negative IC records problem(Per Period Fix)
    //jkbautista - 20140926 - Added another RA filter, this time, the whole id name of it(Per Trans Fix). 
    if (recordType === 'salesorder' || recordType === 'returnauthorization' || recordType === 'RA') {
        groupColumns.push('custrecord_icc_source_department');
        groupColumns.push('custrecord_icc_source_location');
        groupColumns.push('custrecord_icc_source_class');
    }

    //removed forJE to handle all correct grouping required - ps 16/09/14
    if (forJE) {
        groupColumns.push('custrecord_icc_destination_class');
        groupColumns.push('custrecord_icc_destination_department');
        groupColumns.push('custrecord_icc_destination_location');
        groupColumns.push('custrecord_icc_source_department');
        groupColumns.push('custrecord_icc_source_location');
        groupColumns.push('custrecord_icc_source_class');
    }

    // Add all the ICC Charge Fields //
    for (var ii in _ICCHARGE_FIELDS) {
        var field = _ICCHARGE_FIELDS[ii];
        cols.push(new nlobjSearchColumn(field));
    }

    // Alloocation Type Fix
    cols.push(new nlobjSearchColumn('custrecord_icat_trans_type', 'custrecord_icc_allocation_type'));

    fltrs.push(new nlobjSearchFilter('custrecord_icc_allocation_type', null, 'anyof', valAllocationType));
    fltrs.push(new nlobjSearchFilter('custrecord_icc_source_subsidiary', null, 'anyof', valSourceSubs || '@NONE@'));
    fltrs.push(new nlobjSearchFilter('custrecord_icc_destination_subsidiary', null, 'anyof', valDestSubs || '@NONE@'));
    fltrs.push(new nlobjSearchFilter('custrecord_icc_currency', null, 'is', valCurrency));


    if (isForPerTrans) {
        fltrs.push(new nlobjSearchFilter('custrecord_icc_source_internal_id', null, 'equalto', valSourceInternalId));
    }

    cols.push(new nlobjSearchColumn('trandate', 'custrecord_icc_source_transaction'));
    cols.push(new nlobjSearchColumn('transactionnumber', 'custrecord_icc_source_transaction'));

    //jkbautista - 20140923 : added ICC date value for use in perTrans routine
    cols.push(new nlobjSearchColumn('custrecord_icc_date'));

    //	fltrs.push( new nlobjSearchFilter('mainline', 'custrecord_icc_source_transaction', 'is', 'T') );

    // fields that will used for the line items
    var lineFields = ['custrecord_icc_item'
	                  , 'custrecord_icc_item_category'
	                  , 'custrecord_icc_sub_category_1'
	                  , 'custrecord_icc_sub_category_2'
	                  , 'custrecord_icc_allocation_category'
	                  , 'custrecord_icc_destination_department'
	                  , 'custrecord_icc_destination_class'
	                  , 'custrecord_icc_amount_fcy'
	                  , 'custrecord_icc_source_department'
	                  , 'custrecord_icc_source_location'
	                  , 'custrecord_icc_source_class'
	                  , 'custrecord_icc_exclude_po_approval'
	                  , 'custrecord_icc_destination_location'];

    // fields that will be text value
    var textFields = ['custrecord_icc_currency'
	                   , 'custrecord_icc_period'
	                   , 'custrecord_icc_project'
	                   , 'custrecord_icc_source_subsidiary'
	                   , 'custrecord_icc_source_department'
	                   , 'custrecord_icc_source_location'
	                   , 'custrecord_icc_source_class'
	                   , 'custrecord_icc_header_memo'
	                   , 'custrecord_icc_destination_subsidiary'
	                   , 'custrecord_icc_destination_department'
	                   , 'custrecord_icc_destination_location'
	                   , 'custrecord_icc_destination_class'
	                   , 'custrecord_icc_item'
	                   , 'custrecord_icc_item_category'
	                   , 'custrecord_icc_sub_category_1'
	                   , 'custrecord_icc_sub_category_2'
	                   , 'custrecord_icc_allocation_category'
	                   , 'custrecord_icc_allocation_type'];

    // add the extra filters(if exists) to the current search filters
    var filters = filterExtra ? fltrs.concat(filterExtra) : fltrs;

    // searches the IC records
    var arrSearchResults = __nlapi.searchAllRecord('customrecord_intercompany_charges', null, filters, cols);

    /// prepare the data object to be transferred
    var dataForTransfer = { 'header': false, 'lines': {} };

    var arrProcessedIDs = [];

    /**
	 * Loop thru the search results
	 *  collect the header data and line item data
	 */
    for (var iii in arrSearchResults) {
        var rowData = arrSearchResults[iii];
        var lineData = {}, headerData = {};

        if (__is.inArray(arrProcessedIDs, rowData.getId())) continue;
        arrProcessedIDs.push(rowData.getId());  // save the processed ids


        // prepares the the data for the transaction record using the _ICCHARGE_FIELDS
        for (var iiii in _ICCHARGE_FIELDS) {
            var field = _ICCHARGE_FIELDS[iiii];

            headerData[field] = rowData.getValue(field);

            if (__is.inArray(lineFields, field)) {
                lineData[field] = headerData[field];
            }

            if (__is.inArray(textFields, field)) {
                headerData[field + '_text'] = rowData.getText(field);
            }
        }
        headerData['custbody_ic_trans_type'] = rowData.getValue('custrecord_icat_trans_type', 'custrecord_icc_allocation_type');
        headerData['custbody_ic_trans_type_text'] = rowData.getText('custrecord_icat_trans_type', 'custrecord_icc_allocation_type');
        headerData['custrecord_icc_allocation_category_text'] = rowData.getText('custrecord_icc_allocation_category');

        if (isForPerTrans) {
            var stTranDate = rowData.getValue('custrecord_icc_date');
            __log.writev('..transaction date is', stTranDate);

            if (stTranDate) {
                //jkbautista : 20141009 - Changed setup of header data to stTranDate. Fix for error of 'cannot getFullYear' of null.
                headerData['trandate'] = nlapiStringToDate(stTranDate);
                headerData['trandate'] = nlapiDateToString(headerData['trandate']);
            }
        }

        // generate a line key out of 'groupColumns'
        // these groupedColumns should represent a single line item for the transaction
        var arrFieldsKey = [];
        for (var iiii in groupColumns) {
            var field = groupColumns[iiii];
            arrFieldsKey.push(rowData.getValue(field) || 'null');
        }
        var fieldKey = arrFieldsKey.join('||');

        if (!dataForTransfer['header']) {
            dataForTransfer['header'] = headerData;
            dataForTransfer['idx'] = [];
            dataForTransfer['sourcetrans'] = [];
            dataForTransfer['sourcetranids'] = [];
        }

        if (headerData['custrecord_icc_exclude_po_approval'] == 'T')
            dataForTransfer['header']['custrecord_icc_exclude_po_approval'] = 'T';

        dataForTransfer['idx'].push(rowData.getId());

        if (!__is.inArray(dataForTransfer['sourcetrans'], rowData.getValue('custrecord_icc_source_transaction'))) {
            dataForTransfer['sourcetrans'].push(rowData.getValue('custrecord_icc_source_transaction'));
            dataForTransfer['sourcetranids'].push(rowData.getValue('transactionnumber', 'custrecord_icc_source_transaction'));
        }

        if (!dataForTransfer['lines'][fieldKey]) {
            lineData['idx'] = [rowData.getId()];
            lineData['rate'] = __fn.parseFloat(headerData['custrecord_icc_amount_fcy']);
            dataForTransfer['lines'][fieldKey] = lineData;
        }
        else {
            dataForTransfer['lines'][fieldKey]['idx'].push(rowData.getId());
            dataForTransfer['lines'][fieldKey]['rate'] += __fn.parseFloat(headerData['custrecord_icc_amount_fcy']);
        }
    }

    // sample data to be returned:
    /**
	 * dataForTransfer = {
	 *   'header': {...}
	 *   'lines': {
	 *      key1: {..line field values}
	 *      key2: {..line field values}
	 *   }
	 * }
	 * 
	 */

    //	__log.writev('Data For Transfer', [dataForTransfer]);

    return dataForTransfer;
};
////////////////////////////////////////////////////////////////////////////////////////


////////////////////////////////////////////////////////////////////////////////////////
/**
 * creates Purchase Order record
 */
__ICC.createPurchaseOrder = function (data) {
    var recNewTrans = nlapiCreateRecord('purchaseorder', { 'recordmode': 'dynamic', 'customform': _CUSTFORM_IC_PO });

    // fetch the Vendor Account	
    data['header']['entity'] = __ICC.getVendorAccount(
			data['header']['custrecord_icc_destination_subsidiary'],
			data['header']['custrecord_icc_source_subsidiary']);

    if (!data['header']['entity']) return false;

    if (!_checkCurrencyVendor(data['header']['custrecord_icc_currency'], data['header']['entity'])) {
        throw '** Vendor (' + data['header']['entity'] + ') has no currency (' + data['header']['custrecord_icc_currency'] + ')';
        return false;
    }

    var recVendor = nlapiLoadRecord('vendor', data['header']['entity']);
    var taxCode = recVendor.getFieldValue('taxitem');
    __log.writev('.... checking taxcode', taxCode);
    //if (!taxCode) return false; // FOR DEBUG


    // ,'entity': data['header']['entity']
    // unset the employee field
    __safe.setFieldValue(recNewTrans, 'employee', '');
    __log.writev('.... setting entity value', [data['header']['entity']]);
    __safe.setFieldValue(recNewTrans, 'entity', data['header']['entity']);

    // Header fields are mapped on the  HEADERFLDS_PO
    for (var p in __ICC.HEADERFLDS_PO) {
        var fldsPO = __ICC.HEADERFLDS_PO[p];
        var fldsICC = __ICC._FIELDMAP_PO[fldsPO];

        if (fldsICC) {
            __safe.setFieldValue(recNewTrans, fldsPO, data['header'][fldsICC]);
        }
    }

    __safe.setFieldValue(recNewTrans, 'custbody_transactioncategory', _TRANSCATEG_IC); //IC - Set the field Transaction Category (use this field instead of Sales Type) to IC  
    __safe.setFieldValue(recNewTrans, 'custbody_invoice_credit_body', _INVCREDITBODY_IC); //IC
    __safe.setFieldValue(recNewTrans, 'custbody_just_for_purch', 'From IC');  // need to fill this field	
    __safe.setFieldValue(recNewTrans, 'custbody_ic_trans_type', data['header']['custbody_ic_trans_type']);  //custbody_ic_trans_type
    __safe.setFieldValue(recNewTrans, 'custbody_docmemo', data['header']['custrecord_icc_header_memo']);  // need to fill this field

    var memoField = '';
    if (data['process'] && data['process'] == 'pertrans') {
        memoField = data['sourcetranids'] ? data['sourcetranids'].join() : '';
        if (memoField.length > 300) memoField = '';
    }
    __safe.setFieldValue(recNewTrans, 'memo', memoField);


    if (data['trandate']) {
        __safe.setFieldValue(recNewTrans, 'trandate', data['trandate']);
    } else {
        __safe.setFieldValue(recNewTrans, 'trandate', data['header']['custrecord_icc_date']);

    }


    var isExcludePOApprovalAuto = false;
    for (var uniqKey in data['lines']) {
        var lineData = data['lines'][uniqKey];

        recNewTrans.selectNewLineItem('item');

        // line fields are mapped from LINEFLDS_PO 
        for (var jj in __ICC.LINEFLDS_PO) {
            var lineField = __ICC.LINEFLDS_PO[jj];
            var fldsICC = __ICC._FIELDMAP_PO[lineField];
            if (fldsICC && lineData[fldsICC] != null) {
                __safe.setCurrentLineItemValue(recNewTrans, 'item', lineField, lineData[fldsICC]);
            }
        }

        //__safe.setCurrentLineItemValue(recNewTrans, 'item', 'taxcode', taxCode);
        __safe.setCurrentLineItemValue(recNewTrans, 'item', 'quantity', '1');
        __safe.setCurrentLineItemValue(recNewTrans, 'item', 'rate', lineData['rate']);
        __safe.setCurrentLineItemValue(recNewTrans, 'item', 'custcol_ic_trans_type', data['header']['custbody_ic_trans_type']);
        __safe.commitLineItem(recNewTrans, 'item');

        if (lineData['custrecord_icc_exclude_po_approval'] == 'T') isExcludePOApprovalAuto = true;
    }

    if (isExcludePOApprovalAuto) {
        __safe.setFieldValue(recNewTrans, 'orderstatus', 'A'); 	// PO Pending Approval		
        __safe.setFieldValue(recNewTrans, 'approvalstatus', '1');// Pending Approval;
        __safe.setFieldValue(recNewTrans, 'custbody_icc_exclude_po_approval', 'T');
    }
    else {
        __safe.setFieldValue(recNewTrans, 'orderstatus', 'B');  	 // Pending Receipt
        __safe.setFieldValue(recNewTrans, 'approvalstatus', '2'); // Approved
        __safe.setFieldValue(recNewTrans, 'custbody_icc_exclude_po_approval', 'F');
    }

    __safe.setFieldValue(recNewTrans, 'custbody_automatic_ic_recharge', 'T');

    __log.writev('..trying to save the record');

    var purchOrdID = __safe.nlapiSubmitRecord(recNewTrans, null, true);
    if (!purchOrdID) return false;

    __log.writev('*** New Record Created: [PO]', [purchOrdID]);

    // setting of the status and approvalstatus seemed to work *after* the record has been created

    var retval = true;
    if (isExcludePOApprovalAuto) {
        // set the status to Pending Approval 
        __safe.nlapiSubmitField('purchaseorder', purchOrdID, ['approvalstatus', 'orderstatus', 'status'], ['1', 'A', 'A']);
    }
    else {
        // set the status to Approved and Pending Receipt 
        __safe.nlapiSubmitField('purchaseorder', purchOrdID, ['approvalstatus', 'orderstatus', 'status'], ['2', 'B', 'B']);

        // then create the Vendor Bill
        retval = __ICC.createVendorBillFromPO(data, purchOrdID, isExcludePOApprovalAuto);
    }


    if (retval) {
        _updateChargesTransaction('custrecord_icc_purchase_transaction', purchOrdID, data['idx']);
    }
    else {
        // roll back this PO
        __log.writev('!!ROLLBACK THE PO!!');
        __safe.deleteRecord('purchaseorder', purchOrdID);

        return false;
    }


    return purchOrdID;
};
////////////////////////////////////////////////////////////////////////////////////////


/**
 *  Create the Vendor Bill from the PO
 */
__ICC.createVendorBillFromPO = function (dataPO, purchOrderID, isExcludePOApprovalAuto) {
    __log.appendSuffix(['newVB', purchOrderID].join('/'));

    __log.writev('** Create Vendor Bills from IC PO  ');

    // do the transform 
    var recVendorBill = nlapiTransformRecord('purchaseorder', purchOrderID, 'vendorbill');
    __safe.setFieldValue(recVendorBill, 'tranid', 'IC ' + nlapiLookupField('purchaseorder', purchOrderID, 'tranid'));

    if (dataPO['trandate']) {
        __safe.setFieldValue(recVendorBill, 'trandate', dataPO['trandate']);
        //jkbautista : 20141009 - Added new line for setting trandate if routine is PerTrans
    } else if (dataPO['header']['trandate']) {
        __safe.setFieldValue(recVendorBill, 'trandate', dataPO['header']['trandate']);
    }
    __safe.setFieldValue(recVendorBill, 'custbody_ic_trans_type', dataPO['header']['custbody_ic_trans_type']);  //custbody_ic_trans_type

    var vendorBillId = __safe.nlapiSubmitRecord(recVendorBill);
    if (!vendorBillId) return false;

    __log.writev('*** New Record Created: [VB]', [vendorBillId]);
    __safe.nlapiSubmitField('vendorbill', vendorBillId, ['approvalstatus', 'orderstatus', 'status'], ['2', '2', 'B']);

    return vendorBillId;
};


/**
 * Sales Order Creation
 */
__ICC.createSalesOrder = function (data) {

    // Set the Customer to the CUstomer Account from the IC Entity Mapping table where Subsidiary = Source Subsidiary and Represent Subsidiary = Destination Subsidiary	
    data['header']['entity'] = __ICC.getCustomerAccount(
			data['header']['custrecord_icc_source_subsidiary'],
			data['header']['custrecord_icc_destination_subsidiary']);

    if (!data['header']['entity']) return false;

    if (!_checkCurrencyCustomer(data['header']['custrecord_icc_currency'], data['header']['entity'])) {
        throw '** Vendor (' + data['header']['entity'] + ') has no currency (' + data['header']['custrecord_icc_currency'] + ')';
        return false;
    }



    __log.writev('** Creating the Sales Order ** ');
    var recNewTrans = nlapiCreateRecord('salesorder', { 'recordmode': 'dynamic', 'customform': _CUSTFORM_IC_SO });

    __log.writev('.... setting entity value', [data['header']['entity']]);
    __safe.setFieldValue(recNewTrans, 'entity', data['header']['entity']);

    // set the header fields from HEADERFDLDS_SO (defined at the bottom of the script)
    for (var ii in __ICC.HEADERFLDS_SO) {
        var fldsSO = __ICC.HEADERFLDS_SO[ii];
        var fldsICC = __ICC._FIELDMAP_SO[fldsSO];
        if (fldsICC) {
            __safe.setFieldValue(recNewTrans, fldsSO, data['header'][fldsICC]);
        }
    }

    __safe.setFieldValue(recNewTrans, 'custbody_transactioncategory', _TRANSCATEG_IC); //IC - Set the field Transaction Category (use this field instead of Sales Type) to IC
    __safe.setFieldValue(recNewTrans, 'custbody_invoice_credit_body', _INVCREDITBODY_IC); //IC
    __safe.setFieldValue(recNewTrans, 'custbody_automatic_ic_recharge', 'T');
    __safe.setFieldValue(recNewTrans, 'custbody_ic_trans_type', data['header']['custbody_ic_trans_type']);  //custbody_ic_trans_type
    __safe.setFieldValue(recNewTrans, 'custbody_docmemo', data['header']['custrecord_icc_header_memo']);  // need to fill this field

    var memoField = '';
    if (data['process'] && data['process'] == 'pertrans') {
        memoField = data['sourcetranids'] ? data['sourcetranids'].join() : '';
        if (memoField.length > 300) memoField = '';
    }
    __safe.setFieldValue(recNewTrans, 'memo', memoField);


    if (data['trandate']) {
        __safe.setFieldValue(recNewTrans, 'trandate', data['trandate']);
    } else {
        __safe.setFieldValue(recNewTrans, 'trandate', data['header']['custrecord_icc_date']);

    }



    for (var uniqKey in data['lines']) {
        var lineData = data['lines'][uniqKey];

        recNewTrans.selectNewLineItem('item');

        // set the line fields from LINEFLDS_SO
        for (var jj in __ICC.LINEFLDS_SO) {
            var lineField = __ICC.LINEFLDS_SO[jj];
            var fldsICC = __ICC._FIELDMAP_SO[lineField];
            if (fldsICC && lineData[fldsICC] != null) {
                __safe.setCurrentLineItemValue(recNewTrans, 'item', lineField, lineData[fldsICC]);
            }
        }

        __safe.setCurrentLineItemValue(recNewTrans, 'item', 'quantity', '1');
        __safe.setCurrentLineItemValue(recNewTrans, 'item', 'rate', lineData['rate']);
        __safe.setCurrentLineItemValue(recNewTrans, 'item', 'custcol_ic_trans_type', data['header']['custbody_ic_trans_type']);

        __safe.commitLineItem(recNewTrans, 'item');
    }

    var salesOrdID = __safe.nlapiSubmitRecord(recNewTrans, true, true);
    __log.writev('*** New Record Created: [SO]', [salesOrdID]);
    if (!salesOrdID) return false;

    // update the status to Pending Fulfillment
    __safe.nlapiSubmitField('salesorder', salesOrdID, ['orderstatus', 'status'], ['B', 'B']);

    //,'intercotransaction' 		: 'custrecord_icc_purchase_transaction' //data['header'][fldsICC]
    if (__ICC.createInvoiceFromICSO(data, salesOrdID)) {
        _updateChargesTransaction('custrecord_icc_sales_transaction', salesOrdID, data['idx']);
    }
    else {

        // roll back this SO
        __log.writev('!!ROLLBACK THE SO!');

        //jkbautista - 20140922 - Implemented SO decoupling from PO before Delete

        //Get the current record's intercontransactions
        var intPairedPurrchaseOrderId = recNewTrans.getFieldValue('intercotransaction');
        __log.writev('Current Paired PO Transaction:', intPairedPurrchaseOrderId);

        //Load the related purchase order record
        var recPurchaseOrder = nlapiLoadRecord('purchaseorder', intPairedPurrchaseOrderId);
        __log.writev('Purchase Order successfully loaded');

        //clear out the PO's paird transaction field
        recPurchaseOrder.setFieldValue('intercotransaction', '');
        __log.writev('Purchase Order Paired Transaction field cleared.');

        //Save the modified record
        var success = nlapiSubmitRecord(recPurchaseOrder);

        if (!success) return false;
        __log.writev('PO Saved successfully', success);


        var deleteRecord = __safe.deleteRecord('salesorder', salesOrdID);

        if (!deleteRecord) return false;
        __log.writev('SO Deleted successfully', deleteRecord);
        return false;

    }

    return salesOrdID;
};

__ICC.createInvoiceFromICSO = function (dataSO, salesOrderID) {
    __log.writev('** Creating an Invoice from IC Sales ORder', [salesOrderID]);

    var recINV = nlapiTransformRecord('salesorder', salesOrderID, 'invoice');
    if (dataSO['trandate']) {
        __safe.setFieldValue(recINV, 'trandate', dataSO['trandate']);
        //jkbautista : 20141009 - Added new line for setting trandate if routine is PerTrans
    } else if (dataSO['header']['trandate']) {
        __safe.setFieldValue(recINV, 'trandate', dataSO['header']['trandate']);
    }
    __safe.setFieldValue(recINV, 'custbody_ic_trans_type', dataSO['header']['custbody_ic_trans_type']);  //custbody_ic_trans_type

    var invoiceID = __safe.nlapiSubmitRecord(recINV);

    if (!invoiceID) return false;
    __log.writev('*** New Record Created: [Inv]', [invoiceID]);

    return invoiceID;
};

/**
 *  Journal Entry creation
 */

__ICC.createJournal = function (dataJE) {
    var recNewTransJE = nlapiCreateRecord('journalentry', { 'recordmode': 'dynamic', 'customform': _CUSTFORM_IC_JE });

    __safe.setFieldValue(recNewTransJE, 'subsidiary', dataJE['header']['custrecord_icc_destination_subsidiary']); //IC 
    __safe.setFieldValue(recNewTransJE, 'trandate', dataJE['header']['custrecord_icc_date']); //IC
    __safe.setFieldValue(recNewTransJE, 'currency', dataJE['header']['custrecord_icc_currency']); //IC

    var curr = dataJE['header']['custrecord_icc_currency'];

    __safe.setFieldValue(recNewTransJE, 'custbody_ic_trans_type', dataJE['header']['custbody_ic_trans_type']);  //custbody_ic_trans_type	
    var _MAP_JE_LINES_DEBIT = {
        // 'account'					: 'custrecord_icc_item' //expenseaccount
        'department': 'custrecord_icc_destination_department'
			, 'class': 'custrecord_icc_destination_class'
			, 'location': 'custrecord_icc_destination_location'
			, 'custcol_misyscategory': 'custrecord_icc_item_category'
			, 'custcol_misyssubcategory1': 'custrecord_icc_sub_category_1'
			, 'custcol_misyssubcategory2': 'custrecord_icc_sub_category_2'
    };

    var _MAP_JE_LINES_CREDIT = {
        // 'account'					: 'custrecord_icc_item' //expenseaccount
        'department': 'custrecord_icc_source_department'
			, 'class': 'custrecord_icc_source_class'
			, 'location': 'custrecord_icc_source_location'
			, 'custcol_misyscategory': 'custrecord_icc_item_category'
			, 'custcol_misyssubcategory1': 'custrecord_icc_sub_category_1'
			, 'custcol_misyssubcategory2': 'custrecord_icc_sub_category_2'
    };

    //	_roundToCurrPrecision(amount, currency)

    for (var uniqKey in dataJE['lines']) {
        var lineData = dataJE['lines'][uniqKey];

        __log.writev('*** Line Data', [lineData]);

        var memoJE = [dataJE['header']['custrecord_icc_allocation_category_text']];
        if (dataJE['header']['custrecord_icc_header_memo'])
            memoJE.push(dataJE['header']['custrecord_icc_header_memo']);

        var debitCreditAmount = __fn.parseFloat(lineData['rate']);
        var incomeAcct = nlapiLookupField('item', lineData['custrecord_icc_item'], 'incomeaccount');
        var expenseAcct = nlapiLookupField('item', lineData['custrecord_icc_item'], 'expenseaccount');


        if (debitCreditAmount > 0) /** POSITIVE **/ {
            debitCreditAmount = Math.abs(debitCreditAmount);
            debitCreditAmount = _roundToCurrPrecision(lineData['rate'], curr);

            /*** SET THE DEBIT LINE ***/
            recNewTransJE.selectNewLineItem('line');
            __safe.setCurrentLineItemValue(recNewTransJE, 'line', 'account', expenseAcct);

            for (var fldJE in _MAP_JE_LINES_DEBIT) {
                var fldICC = _MAP_JE_LINES_DEBIT[fldJE];
                var valICC = lineData[fldICC];
                if (valICC !== null) {
                    __safe.setCurrentLineItemValue(recNewTransJE, 'line', fldJE, valICC);
                }
            }
            lineData['custrecord_icc_amount_fcy'] = __fn.roundOff(lineData['custrecord_icc_amount_fcy']);
            __safe.setCurrentLineItemValue(recNewTransJE, 'line', 'debit', debitCreditAmount);
            __safe.setCurrentLineItemValue(recNewTransJE, 'line', 'memo', memoJE.join(' - '));
            __safe.setCurrentLineItemValue(recNewTransJE, 'line', 'custcol_ic_trans_type', dataJE['header']['custbody_ic_trans_type']);
            __safe.commitLineItem(recNewTransJE, 'line');

            /*** SET THE CREDIT LINE ***/
            recNewTransJE.selectNewLineItem('line');
            __safe.setCurrentLineItemValue(recNewTransJE, 'line', 'account', incomeAcct);
            for (var fldJE in _MAP_JE_LINES_CREDIT) {
                var fldICC = _MAP_JE_LINES_CREDIT[fldJE];
                var valICC = lineData[fldICC];
                if (valICC !== null) {
                    __safe.setCurrentLineItemValue(recNewTransJE, 'line', fldJE, valICC);
                }
            }
            lineData['custrecord_icc_amount_fcy'] = __fn.roundOff(lineData['custrecord_icc_amount_fcy']);
            __safe.setCurrentLineItemValue(recNewTransJE, 'line', 'credit', _roundToCurrPrecision(lineData['rate'], curr));
            __safe.setCurrentLineItemValue(recNewTransJE, 'line', 'memo', memoJE.join(' - '));
            __safe.setCurrentLineItemValue(recNewTransJE, 'line', 'custcol_ic_trans_type', dataJE['header']['custbody_ic_trans_type']);
            __safe.commitLineItem(recNewTransJE, 'line');
        }
        else /** NEGATIVE **/ {
            debitCreditAmount = Math.abs(debitCreditAmount);
            debitCreditAmount = _roundToCurrPrecision(lineData['rate'], curr);

            /*** SET THE DEBIT LINE ***/
            recNewTransJE.selectNewLineItem('line');
            __safe.setCurrentLineItemValue(recNewTransJE, 'line', 'account', expenseAcct);

            for (var fldJE in _MAP_JE_LINES_CREDIT) {
                var fldICC = _MAP_JE_LINES_CREDIT[fldJE];
                var valICC = lineData[fldICC];
                if (valICC !== null) {
                    __safe.setCurrentLineItemValue(recNewTransJE, 'line', fldJE, valICC);
                }
            }
            lineData['custrecord_icc_amount_fcy'] = __fn.roundOff(lineData['custrecord_icc_amount_fcy']);
            __safe.setCurrentLineItemValue(recNewTransJE, 'line', 'debit', debitCreditAmount);
            __safe.setCurrentLineItemValue(recNewTransJE, 'line', 'memo', memoJE.join(' - '));
            __safe.setCurrentLineItemValue(recNewTransJE, 'line', 'custcol_ic_trans_type', dataJE['header']['custbody_ic_trans_type']);
            __safe.commitLineItem(recNewTransJE, 'line');

            /*** SET THE CREDIT LINE ***/
            recNewTransJE.selectNewLineItem('line');
            __safe.setCurrentLineItemValue(recNewTransJE, 'line', 'account', incomeAcct);
            for (var fldJE in _MAP_JE_LINES_DEBIT) {
                var fldICC = _MAP_JE_LINES_DEBIT[fldJE];
                var valICC = lineData[fldICC];
                if (valICC !== null) {
                    __safe.setCurrentLineItemValue(recNewTransJE, 'line', fldJE, valICC);
                }
            }
            lineData['custrecord_icc_amount_fcy'] = __fn.roundOff(lineData['custrecord_icc_amount_fcy']);
            __safe.setCurrentLineItemValue(recNewTransJE, 'line', 'credit', _roundToCurrPrecision(lineData['rate'], curr));
            __safe.setCurrentLineItemValue(recNewTransJE, 'line', 'memo', memoJE.join(' - '));
            __safe.setCurrentLineItemValue(recNewTransJE, 'line', 'custcol_ic_trans_type', dataJE['header']['custbody_ic_trans_type']);
            __safe.commitLineItem(recNewTransJE, 'line');
        }

    }

    if (dataJE['trandate']) {
        __safe.setFieldValue(recNewTransJE, 'trandate', dataJE['trandate']);
    }

    //20140926 - jkbautista : Added code for setting the 'Automatic IC Recharge' flag for every JE that is created through the FRD004 routine
    __log.writev('*** Setting Automatic IC Recharge to True. Before', [recNewTransJE.getFieldValue('custbody_automatic_ic_recharge')]);
    __safe.setFieldValue(recNewTransJE, 'custbody_automatic_ic_recharge', 'T');
    __log.writev('*** Setting Automatic IC Recharge to True. After', [recNewTransJE.getFieldValue('custbody_automatic_ic_recharge')]);

    //20141001 - jkbautista : Added additional check on related IC's Journal Transaction Field, before submitting the JE.
    __log.writev('*** Checking if IC has linked journal transaction...');
    var hasJournals = _checkICforJournal(dataJE['idx']);
    if (hasJournals) {
        __log.writev('*** ERROR: IC has already been assigned to a journal transaction', dataJE['idx']);
        return false
        //noop;
    }

    __log.writev('*** IC has no Journal transaction linked. Proceeding.');

    var journalId = __safe.nlapiSubmitRecord(recNewTransJE);
    if (!journalId) return false;

    __log.writev('*** New Record Created: [JE]', [journalId]);
    _updateChargesTransaction('custrecord_icc_journal_transaction', journalId, dataJE['idx']);

    return journalId;
};



/**
 * VRA creation for negative ICs
 */
__ICC.createVendorReturnAuthorization = function (data) {
    __log.writev('** Create Vendor Return Authorization...');
    var recNewTrans = nlapiCreateRecord('vendorreturnauthorization', { 'recordmode': 'dynamic', 'customform': _CUSTFORM_IC_VRA });

    data['header']['entity'] = __ICC.getVendorAccount(
			data['header']['custrecord_icc_destination_subsidiary'],
			data['header']['custrecord_icc_source_subsidiary']);
    if (!data['header']['entity']) return false;

    if (!_checkCurrencyVendor(data['header']['custrecord_icc_currency'], data['header']['entity'])) {
        throw '** Vendor (' + data['header']['entity'] + ') has no currency (' + data['header']['custrecord_icc_currency'] + ')';
        return false;
    }


    // ,'entity': data['header']['entity']
    __safe.setFieldValue(recNewTrans, 'employee', '');
    __log.writev('.... setting entity value', [data['header']['entity']]);
    __safe.setFieldValue(recNewTrans, 'entity', data['header']['entity']);



    for (var ii in __ICC.HEADERFLDS_PO) {
        var fldsPO = __ICC.HEADERFLDS_PO[ii];
        var fldsICC = __ICC._FIELDMAP_PO[fldsPO];
        if (fldsICC) {
            __safe.setFieldValue(recNewTrans, fldsPO, data['header'][fldsICC]);
        }
    }

    __safe.setFieldValue(recNewTrans, 'custbody_transactioncategory', _TRANSCATEG_IC); //IC - Set the field Transaction Category (use this field instead of Sales Type) to IC
    __safe.setFieldValue(recNewTrans, 'custbody_invoice_credit_body', _INVCREDITBODY_IC); //IC
    __safe.setFieldValue(recNewTrans, 'custbody_just_for_purch', 'From IC');

    __safe.setFieldValue(recNewTrans, 'custbody_ic_trans_type', data['header']['custbody_ic_trans_type']);  //custbody_ic_trans_type
    if (data['trandate']) {
        __safe.setFieldValue(recNewTrans, 'trandate', data['trandate']);
    } else {
        __safe.setFieldValue(recNewTrans, 'trandate', data['header']['custrecord_icc_date']);

    }

    var isExcludePOApprovalAuto = false;

    for (var uniqKey in data['lines']) {
        var lineData = data['lines'][uniqKey];

        recNewTrans.selectNewLineItem('item');

        for (var jj in __ICC.LINEFLDS_PO) {
            var lineField = __ICC.LINEFLDS_PO[jj];
            var fldsICC = __ICC._FIELDMAP_PO[lineField];
            if (fldsICC && lineData[fldsICC] != null) {
                __safe.setCurrentLineItemValue(recNewTrans, 'item', lineField, lineData[fldsICC]);
            }
        }

        __safe.setCurrentLineItemValue(recNewTrans, 'item', 'quantity', '1');
        //var flRate = Math.abs( lineData['rate']) ;
        var flRate = lineData['rate'] * (-1);
        __log.writev('...setting line rate', flRate);
        __safe.setCurrentLineItemValue(recNewTrans, 'item', 'rate', flRate);
        __safe.setCurrentLineItemValue(recNewTrans, 'item', 'custcol_ic_trans_type', data['header']['custbody_ic_trans_type']);

        __safe.commitLineItem(recNewTrans, 'item');

        if (lineData['custrecord_icc_exclude_po_approval'] == 'T') isExcludePOApprovalAuto = true;
    }

    //FOR DEBUG//
    //if (! isExcludePOApprovalAuto ) return false;

    if (isExcludePOApprovalAuto) {
        // Pending Approval;
        __safe.setFieldValue(recNewTrans, 'orderstatus', 'A');
        __safe.setFieldValue(recNewTrans, 'approvalstatus', '1');
        __safe.setFieldValue(recNewTrans, 'custbody_automatic_ic_recharge', 'F');
        __safe.setFieldValue(recNewTrans, 'custbody_icc_exclude_po_approval', 'T');
        //
    }
    else {
        __safe.setFieldValue(recNewTrans, 'orderstatus', 'B');  //pending recpt		
        __safe.setFieldValue(recNewTrans, 'approvalstatus', '2'); // Approved;
        __safe.setFieldValue(recNewTrans, 'custbody_automatic_ic_recharge', 'T');
        __safe.setFieldValue(recNewTrans, 'custbody_icc_exclude_po_approval', 'F');
    }

    var vendorRetAuthID = __safe.nlapiSubmitRecord(recNewTrans, null, true);
    if (!vendorRetAuthID) return false;
    __log.writev('*** New Record Created: [VRA]', [vendorRetAuthID]);


    var retVal = true;
    if (isExcludePOApprovalAuto) {
        // for good measure, lets update the status for the record
        __safe.nlapiSubmitField('vendorreturnauthorization', vendorRetAuthID, ['approvalstatus', 'orderstatus', 'status'], ['1', 'A', 'A']);
    }
    else {
        // and create the vendor Bill
        retVal = __ICC.createVendorCreditsFromVRA(data, vendorRetAuthID);
    }

    if (retVal) {
        __log.writev('..updating recharges to created VRA', [data['idx']]);

        _updateChargesTransaction('custrecord_icc_purchase_transaction', vendorRetAuthID, data['idx']);
    } else {
        __log.writev('!!ROLLBACK THE VRA!!');
        __safe.deleteRecord('vendorreturnauthorization', vendorRetAuthID);
        return false;
    }

    return vendorRetAuthID;
};


__ICC.createVendorCreditsFromVRA = function (dataVRA, vendorRetAuthID) {

    __log.writev('** createVendorCreditsFromVRA  ', [vendorRetAuthID]);

    // do the transform
    try {
        var recVendorCredit = nlapiTransformRecord('vendorreturnauthorization', vendorRetAuthID, 'vendorcredit');
    } catch (err) {
        return false;
    }

    var tranId = nlapiLookupField('vendorreturnauthorization', vendorRetAuthID, 'tranid');
    __safe.setFieldValue(recVendorCredit, 'tranid', 'IC ' + tranId);

    if (dataVRA['trandate']) {
        __safe.setFieldValue(recVendorCredit, 'trandate', dataVRA['trandate']);
    } else if (dataVRA['header']['trandate']) {
        __safe.setFieldValue(recVendorCredit, 'trandate', dataVRA['header']['trandate']);
    }
    __safe.setFieldValue(recVendorCredit, 'custbody_ic_trans_type', dataVRA['header']['custbody_ic_trans_type']);  //custbody_ic_trans_type

    var vendCredId = __safe.nlapiSubmitRecord(recVendorCredit);

    if (!vendCredId) return false;
    __log.writev('*** New Record Created: [VendorCredits]', [vendCredId]);

    __safe.nlapiSubmitField('vendorcredit', vendCredId, ['approvalstatus', 'orderstatus', 'status'], ['2', 'B', 'B']);

    return vendCredId;
};



/**
 * Return Authorization creation 
 */
__ICC.createReturnAuthorization = function (data) {
    __log.writev('** Creating the Return Authorization ** ');
    var recNewTrans = nlapiCreateRecord('returnauthorization', { 'recordmode': 'dynamic', 'customform': _CUSTFORM_IC_RA });

    data['header']['entity'] = __ICC.getCustomerAccount(
			data['header']['custrecord_icc_source_subsidiary'],
			data['header']['custrecord_icc_destination_subsidiary']);


    if (!data['header']['entity']) return false;

    __log.writev('.... setting entity value', [data['header']['entity']]);
    __safe.setFieldValue(recNewTrans, 'entity', data['header']['entity']);


    for (var ii in __ICC.HEADERFLDS_SO) {
        var fldsSO = __ICC.HEADERFLDS_SO[ii];
        var fldsICC = __ICC._FIELDMAP_SO[fldsSO];
        if (fldsICC) {
            __safe.setFieldValue(recNewTrans, fldsSO, data['header'][fldsICC]);
        }
    }
    if (data['trandate']) {
        __safe.setFieldValue(recNewTrans, 'trandate', data['trandate']);
    } else {
        __safe.setFieldValue(recNewTrans, 'trandate', data['header']['custrecord_icc_date']);

    }

    __safe.setFieldValue(recNewTrans, 'custbody_transactioncategory', _TRANSCATEG_IC); //IC - Set the field Transaction Category (use this field instead of Sales Type) to IC
    __safe.setFieldValue(recNewTrans, 'custbody_invoice_credit_body', _INVCREDITBODY_IC); //IC
    __safe.setFieldValue(recNewTrans, 'custbody_automatic_ic_recharge', 'T');
    __safe.setFieldValue(recNewTrans, 'custbody_ic_trans_type', data['header']['custbody_ic_trans_type']);  //custbody_ic_trans_type

    for (var uniqKey in data['lines']) {
        var lineData = data['lines'][uniqKey];

        recNewTrans.selectNewLineItem('item');

        for (var jj in __ICC.LINEFLDS_SO) {
            var lineField = __ICC.LINEFLDS_SO[jj];
            var fldsICC = __ICC._FIELDMAP_SO[lineField];
            //if ( fldsICC ) {
            if (fldsICC && lineData[fldsICC] != null) {
                __safe.setCurrentLineItemValue(recNewTrans, 'item', lineField, lineData[fldsICC]);
            }
        }

        __safe.setCurrentLineItemValue(recNewTrans, 'item', 'quantity', '1');
        //		var flRate = Math.abs( lineData['rate'] );
        var flRate = lineData['rate'] * (-1);
        __log.writev('...setting line rate', flRate);
        __safe.setCurrentLineItemValue(recNewTrans, 'item', 'rate', flRate);
        __safe.setCurrentLineItemValue(recNewTrans, 'item', 'custcol_ic_trans_type', data['header']['custbody_ic_trans_type']);
        __safe.commitLineItem(recNewTrans, 'item');
    }

    var returnAuthID = __safe.nlapiSubmitRecord(recNewTrans, true, true);
    if (!returnAuthID) return false;
    __log.writev('*** New Record Created: [RA]', [returnAuthID]);

    __safe.nlapiSubmitField('returnauthorization', returnAuthID, ['orderstatus', 'status'], ['B', 'B']);


    var creditmemoID = __ICC.createCreditMemoFromRA(data, returnAuthID);

    if (creditmemoID) {
        _updateChargesTransaction('custrecord_icc_sales_transaction', returnAuthID, data['idx']);
    } else {
        // roll back this SO
        __log.writev('!!ROLLBACK THE RA!!');
        
        //jkbautista - 20140919 - Implemented RA decoupling from VRA before Delete

        //Get the current record's intercontransactions
        var returnAuthInterConTransaction = recNewTrans.getFieldValue('intercotransaction');
        __log.writev('Current Return Auth InterCompany Transaction:', returnAuthInterConTransaction);
         
        //Load the related vendorReturnAuth record
        var vendorReturnAuthorization = nlapiLoadRecord('vendorreturnauthorization', returnAuthInterConTransaction);
        __log.writev('VRA successfully loaded');

        //clear out the VRA's Intercon field
        vendorReturnAuthorization.setFieldValue('intercotransaction','');
        __log.writev('VRA InterCon Transaction field cleared.');

        //Save the modified record
        var success = nlapiSubmitRecord(vendorReturnAuthorization);
        
        if(!success) return false;
        __log.writev('VRA Saved successfully',success);


        var deleteRecord  = __safe.deleteRecord('returnauthorization', returnAuthID);

        if(!deleteRecord) return false;
        __log.writev('RA Deleted successfully', deleteRecord);
        return false;
    }

    // and create the vendor Bill
    return returnAuthID;
};

__ICC.createCreditMemoFromRA = function (dataRA, returnAuthID) {
    __log.writev('** Creating a CreditMemo from IC RA', [returnAuthID]);

    try {
        var recCM = nlapiTransformRecord('returnauthorization', returnAuthID, 'creditmemo');
    } catch (err) {
        return false;
    }

    if (dataRA['trandate']) {
        __safe.setFieldValue(recCM, 'trandate', dataRA['trandate']);
    } else if (dataRA['header']['trandate']) {
        __safe.setFieldValue(recCM, 'trandate', dataRA['header']['trandate']);
    }

    __safe.setFieldValue(recCM, 'custbody_ic_trans_type', dataRA['header']['custbody_ic_trans_type']);  //custbody_ic_trans_type

    var creditmemoID = __safe.nlapiSubmitRecord(recCM);
    if (!creditmemoID) return false;

    __log.writev('*** New Record Created: [creditmemo]', [creditmemoID]);
    return creditmemoID;
};



/////////////////////////////////////////////////////////////////////////////
__ICC._FIELDMAP_PO = {
    // 'custbody_ic_trans_type'  	: 'custbody_ic_trans_type'
    'custbody_just_for_purch': 'custrecord_icc_header_memo'		//TODO:need a better document_memo
		, 'memo': 'custrecord_icc_source_transaction'
    //,'trandate'					: 'custrecord_icc_date'				//TODO:need a better trandate
		, 'department': 'custrecord_icc_destination_department'
		, 'location': 'custrecord_icc_destination_location'
		, 'class': 'custrecord_icc_destination_class'
		, 'custcol_ic_project': 'custrecord_icc_project'
		, 'item': 'custrecord_icc_item'
		, 'custcol_misyscategory': 'custrecord_icc_item_category'
		, 'custcol_misyssubcategory1': 'custrecord_icc_sub_category_1'
		, 'custcol_misyssubcategory2': 'custrecord_icc_sub_category_2'
		, 'custcol_allocation_category': 'custrecord_icc_allocation_category'
		, 'currency': 'custrecord_icc_currency' // set Currency to the value of Currency from the Intercompany Charge
};

__ICC.HEADERFLDS_PO = ['trandate', 'custbody_just_for_purch', 'memo',
		'department', 'class', 'location', 'project',
		'custbody_misyssalestype', 'custbody_invoice_credit_body',
		'custbody_automatic_ic_recharge', 'currency'];

__ICC.LINEFLDS_PO = ['item', 'custcol_misyscategory',
		'custcol_misyssubcategory1', 'custcol_misyssubcategory2',
		'custcol_allocation_category', 'custcol_ic_project', 'department',
		'class', 'location', 'quantity', 'rate'];




var _ICCHARGE_FIELDS = ['custrecord_icc_date', 'custrecord_icc_currency',
		'custrecord_icc_period', 'custrecord_icc_project',
		'custrecord_icc_source_subsidiary', 'custrecord_icc_source_department',
		'custrecord_icc_source_location', 'custrecord_icc_source_class',
		'custrecord_icc_header_memo', 'custrecord_icc_destination_subsidiary',
		'custrecord_icc_destination_department',
		'custrecord_icc_destination_location',
		'custrecord_icc_destination_class', 'custrecord_icc_quantity',
		'custrecord_icc_rate_fcy', 'custrecord_icc_item',
		'custrecord_icc_item_category', 'custrecord_icc_sub_category_1',
		'custrecord_icc_sub_category_2', 'custrecord_icc_source_internal_id',
		'custrecord_icc_allocation_category',
		'custrecord_icc_source_transaction', 'custrecord_icc_allocation_type',
		'custrecord_icc_amount_fcy', 'custrecord_icc_currency',
		'custrecord_icc_purchase_transaction',
		'custrecord_icc_sales_transaction',
		'custrecord_icc_journal_transaction',
		'custrecord_icc_exclude_po_approval'];


__ICC._FIELDMAP_SO = {
    // 'custbody_ic_trans_type'  	: 'custrecord_icc_allocation_type'
    //'memo' 						: 'custrecord_icc_header_memo' // set Memo to the value Header Memo from the Intercompany Charges
    'custbody_docmemo': 'custrecord_icc_header_memo' // set Memo to the value Header Memo from the Intercompany Charges
		, 'memo': 'custrecord_icc_source_transaction'
		, 'intercotransaction': 'custrecord_icc_purchase_transaction'
		, 'department': 'custrecord_icc_source_department'
		, 'location': 'custrecord_icc_source_location'
		, 'class': 'custrecord_icc_source_class'

		, 'custcol_ic_project': 'custrecord_icc_project'
		, 'item': 'custrecord_icc_item'
		, 'custcol_misyscategory': 'custrecord_icc_item_category'
		, 'custcol_misyssubcategory1': 'custrecord_icc_sub_category_1'
		, 'custcol_misyssubcategory2': 'custrecord_icc_sub_category_2'
		, 'custcol_allocation_category': 'custrecord_icc_allocation_category'
		, 'currency': 'custrecord_icc_currency' // set Currency to the value of Currency from the Intercompany Charge
};

__ICC.HEADERFLDS_SO = ['trandate', 'custbody_docmemo',
		'department', 'class', 'location', 'project',
		'custbody_misyssalestype', 'custbody_invoice_credit_body',
		'custbody_automatic_ic_recharge', 'currency', 'intercotransaction', 'custbody_transactioncategory'];

__ICC.LINEFLDS_SO = ['item', 'custcol_misyscategory',
		'custcol_misyssubcategory1', 'custcol_misyssubcategory2',
		'custcol_allocation_category', 'custcol_ic_project', 'department',
		'class', 'location', 'quantity', 'rate'];

////////////////////////////////////////////////////////////////////////

var _CACHE_CURRCUSTOMER = {};
function _checkCurrencyCustomer(currency, customerId) {
    if (!currency || !customerId) return false;


    if (_CACHE_CURRCUSTOMER[customerId])
        return __is.inArray(_CACHE_CURRCUSTOMER[customerId], currency);

    var recCustomer = nlapiLoadRecord('customer', customerId);
    var lineCount = recCustomer.getLineItemCount('currency');

    var allcurrencies = [];
    for (var line = 1; line <= lineCount; line++) {
        var curr = recCustomer.getLineItemValue('currency', 'currency', line);
        if (curr) allcurrencies.push(curr);
    }
    _CACHE_CURRCUSTOMER[customerId] = allcurrencies;

    return __is.inArray(_CACHE_CURRCUSTOMER[customerId], currency);
}

var _CACHE_CURRVENDOR = {};
function _checkCurrencyVendor(currency, vendorId) {
    if (!currency || !vendorId) return false;

    if (_CACHE_CURRVENDOR[vendorId])
        return __is.inArray(_CACHE_CURRVENDOR[vendorId], currency);

    var recVendor = nlapiLoadRecord('vendor', vendorId);
    var lineCount = recVendor.getLineItemCount('currency');

    var allcurrencies = [];
    for (var line = 1; line <= lineCount; line++) {
        var curr = recVendor.getLineItemValue('currency', 'currency', line);
        if (curr) allcurrencies.push(curr);
    }
    _CACHE_CURRVENDOR[vendorId] = allcurrencies;

    return __is.inArray(_CACHE_CURRVENDOR[vendorId], currency);
}


function _checkICforJournal(idx) {

    var arrICFilters = [(new nlobjSearchFilter('internalid', null, 'anyOf', idx)),
                                (new nlobjSearchFilter('custrecord_icc_journal_transaction', null, 'noneof', '@NONE@'))];
    var arrICColumns = [(new nlobjSearchColumn('internalid')), (new nlobjSearchColumn('internalid'))];
    var arrICResults = nlapiSearchRecord('customrecord_intercompany_charges', null, arrICFilters, arrICColumns);

    return arrICResults === null ? false : true;

}


function _getLastBatchQueueId(FRDNO) {
    var stBatchId = '1'; // default
    var arrBatchQueue = nlapiSearchRecord('customrecord_ic_batches_queue', null,
			[(new nlobjSearchFilter('custrecord_icbq_frd_no', null, 'is', FRDNO))],
			[(new nlobjSearchColumn('custrecord_icbq_batch_id'))
			 , (new nlobjSearchColumn('internalid')).setSort(true)]);
    if (arrBatchQueue) {
        var rowBatch = arrBatchQueue.shift();
        stBatchId = __fn.parseInt(rowBatch.getValue('custrecord_icbq_batch_id'));

    }

    return ++stBatchId; //increment
}

function _hasExistingRequest(requestData, processingOnly) {
    var fltrProc = [['custrecord_icbq_status', 'is', _QUEUESTATUS_PENDING], 'or', ['custrecord_icbq_status', 'is', _QUEUESTATUS_PROCESSING]];

    if (processingOnly) {
        fltrProc = ['custrecord_icbq_status', 'is', _QUEUESTATUS_PROCESSING];
    }


    var arrBatchQueueSearch = nlapiSearchRecord('customrecord_ic_batches_queue', null,
			[
			   ['custrecord_icbq_frd_no', 'is', requestData['frd_no']], 'and',
			   ['custrecord_icbq_source_subsidiary', 'is', requestData['source_subsidiary']], 'and',
			   fltrProc
			],
			[(new nlobjSearchColumn('custrecord_icbq_batch_id'))
			 , (new nlobjSearchColumn('internalid')).setSort(true)
			 , (new nlobjSearchColumn('custrecord_icbq_source_subsidiary'))
			 , (new nlobjSearchColumn('custrecord_icbq_status'))
			 , (new nlobjSearchColumn('custrecord_icbq_parameters'))
			]);

    var hasExistingRequest = arrBatchQueueSearch && arrBatchQueueSearch.length;
    //	if ( arrBatchQueueSearch  )
    //	{	
    //		for (var ii in arrBatchQueueSearch)
    //		{
    //			var rowBatchQ = arrBatchQueueSearch[ii];
    //			var stBatchParams 	= rowBatchQ.getValue('custrecord_icbq_parameters');
    //			var arrQueueParams 	= stBatchParams ? JSON.parse( stBatchParams ) : false;			
    //			var dataParams = requestData['parameters'] ? JSON.parse(requestData['parameters']) : false;
    //			
    //			var hasSameAllocType =false;
    //			var hasSamePeriod    =false;
    //			var hasSameDestSubs  =false;
    //			var hasSameGrouping  =false;
    //			
    //			if (arrQueueParams && dataParams)
    //			{
    //				if (arrQueueParams['grouping'] == dataParams['grouping']) hasSameGrouping = true;
    //				if (arrQueueParams['icctrans'] == dataParams['icctrans']) hasSameAllocType = true;
    //				
    //				if (hasSameGrouping && hasSameGrouping)
    //				{
    //					if (arrQueueParams['iccperiod'] &&  dataParams['iccperiod'])
    //					{
    //						for (var iii in dataParams['iccperiod'])
    //						{
    //							var dataPeriod = dataParams['iccperiod'][iii];
    //							
    //							__log.writev('.....checking for period',[arrQueueParams['iccperiod'], dataPeriod] );
    //							
    //							if ( __is.inArray(arrQueueParams['iccperiod'], dataPeriod) ) 
    //							{
    //								__log.writev('!! Same Period !!');
    //								hasSamePeriod = true; break;
    //								
    //							}					
    //						}
    //					}
    //					else hasSamePeriod = true;
    //					__log.writev('.....checking for period',[arrQueueParams['iccperiod'], dataParams['iccperiod']] );
    //				}
    //				
    //				if (hasSameGrouping && hasSameGrouping && hasSamePeriod)
    //				{
    //					
    //					if (arrQueueParams['iccdestsubs'] && dataParams['iccdestsubs'])
    //					{
    //						for (var iii in dataParams['iccdestsubs'])
    //						{
    //							var dataSubs = dataParams['iccdestsubs'][iii];
    //							__log.writev('.....checking for destsubs',[arrQueueParams['iccdestsubs'], dataSubs] );
    //							
    //							if ( __is.inArray(arrQueueParams['iccdestsubs'], dataSubs) ) 
    //							{
    //								__log.writev('!! Same Dest Subs !!');
    //								hasSameDestSubs = true; break;
    //							}					
    //						}
    //					}
    //					else hasSameDestSubs = true;				
    //					__log.writev('.....checking for destsubs',[arrQueueParams['iccdestsubs'], dataParams['iccdestsubs']] );
    //				}
    //				
    //				__log.writev('.. check for duplicates', [arrQueueParams,dataParams,  [hasSameAllocType,hasSameGrouping, hasSamePeriod, hasSameDestSubs] ]);				
    //				if (hasSameAllocType && hasSameGrouping && hasSamePeriod && hasSameDestSubs )
    //				{
    //					hasExistingRequest = true;
    //					__log.writev('*** Duplicate!! ***');
    //					break;				
    //				}
    //			}
    //		}
    //	}

    // return false, since the request is already existing //
    return hasExistingRequest;
}


function _addToBatchQueue(queueData) {

    // if ( _hasExistingRequest(queueData) ) return false;

    // try to search if there's already an existing batch for this request
    var recQueue = nlapiCreateRecord('customrecord_ic_batches_queue');
    recQueue.setFieldValue('custrecord_icbq_batch_id', queueData['batch_id'].toString());
    recQueue.setFieldValue('custrecord_icbq_frd_no', queueData['frd_no']);
    recQueue.setFieldValue('custrecord_icbq_source_subsidiary', queueData['source_subsidiary']);
    recQueue.setFieldValue('custrecord_icbq_current_user', nlapiGetContext().getUser());
    recQueue.setFieldValue('custrecord_icbq_status', _QUEUESTATUS_PENDING);

    var timestamp = nlapiDateToString(new Date(), 'datetimetz');
    recQueue.setFieldValue('custrecord_icbq_date_timestamp', timestamp);

    recQueue.setFieldValue('custrecord_icbq_parameters', queueData['parameters']);

    // submit the record
    var stQueueID = nlapiSubmitRecord(recQueue);
    // __log.writev('*** New Record Created: [IC Batch Queue]', [stQueueID]);

    return stQueueID;
}

function _updateStatusBatchQueue(stQueueID, status) {
    var timestamp = nlapiDateToString(new Date(), 'datetimetz');

    var newstatus = status;

    if (status == _QUEUESTATUS_COMPLETE) {
        // get the batch status

        var batchStatus = nlapiLookupField('customrecord_ic_batches_queue', stQueueID, 'custrecord_icbq_status');
        __log.writev('..current batch for completion?', [batchStatus]);
        //		if (batchStatus !=  _QUEUESTATUS_PROCESSING) newstatus = _QUEUESTATUS_ERROR;		
    }

    __safe.nlapiSubmitField('customrecord_ic_batches_queue', stQueueID, ['custrecord_icbq_status', 'custrecord_icbq_date_timestamp'], [newstatus, timestamp]);
    __log.writev('..setting batch queue status', [stQueueID, status]);
    return true;
}


function _addLogStatusBatchQueue(stQueueID, addmsg) {
    var msg = nlapiLookupField('customrecord_ic_batches_queue', stQueueID, 'custrecord_icbq_details');
    __safe.nlapiSubmitField('customrecord_ic_batches_queue', stQueueID, ['custrecord_icbq_details'], [msg + addmsg + ' / ']);

    return true;
}



function _updateChargesTransaction(transField, transId, dataIdx) {
    var arrProcessedIC = {};

    __log.writev('..updating the IC charges to created so', [transField, transId, dataIdx]);

    for (var ii in dataIdx) {
        var id = dataIdx[ii];
        if (arrProcessedIC[id]) continue;

        __safe.nlapiSubmitField('customrecord_intercompany_charges', id, transField, transId);
        arrProcessedIC[id] = true;
    }

    return true;
}



function _roundToCurrPrecision(amount, currency) {
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

        var __ZEROPRECISION_CURRENCIES = [__IDR, __JPY, __KRW, __CLP, __VND, __BYR];

        var newAmount = parseFloat(amount);
        var hasZeroCurrency = false;

        for (var ii in __ZEROPRECISION_CURRENCIES) {
            if (currency == __ZEROPRECISION_CURRENCIES[ii]) {
                hasZeroCurrency = true;
                break;
            }
        }

        if (hasZeroCurrency)
            newAmount = Math.round(amount);
        else
            newAmount = +newAmount.toFixed(2);

        nlapiLogExecution('DEBUG', 'CurrencyPRecision', ['hasZeroCurrency:' + (hasZeroCurrency ? 'true' : 'false'),
														 'amount:' + amount,
														 'currency:' + currency,
														 'newamount:' + newAmount].join(', '));

        return newAmount;
    }
    catch (error) {
        if (error.getDetails != undefined) {
            nlapiLogExecution('ERROR', 'Process Error', error.getCode() + ': ' + error.getDetails());
            // throw error;
        }
        else {
            nlapiLogExecution('ERROR', 'Unexpected Error', error.toString());
            // throw nlapiCreateError('99999' , error.toString());
        }


        return amount;
    }
}