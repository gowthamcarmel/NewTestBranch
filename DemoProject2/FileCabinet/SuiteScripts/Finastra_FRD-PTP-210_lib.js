define('orderlib', ['N/search', 'N/record', 'N/log'],
    /**
     * @param {object} search
     * @param {object} record
     * @param {object} log
     */
        function (search, record, log) {

            // Enumerations
            var Value = Object.freeze({
                EMPTY: 'null'
            });
            var RequisitionToPOBody = Object.freeze({
                TYPE: 'customrecord_req_to_po_body',
                REQUISITION_BODY_FIELD: 'custrecord_requisition_body_field',
                PO_BODY_FIELD: 'custrecord_po_body_field'
            });
            var RequisitionToPOColumn = Object.freeze({
                TYPE: 'customrecord_req_to_po_column',
                REQUISITION_COLUMN_FIELD: 'custrecord_requisition_column_field',
                PO_COLUMN_FIELD: 'custrecord_po_column_field'
            });
            var TransactionColumn = Object.freeze({
                VENDOR_CURRENCY: 'custcol_vendor_currency',
                VENDOR_CURRENCY_RATE: 'custcol_vendor_currency_rate',
                VENDOR_CURRENCY_AMOUNT: 'custcol_vendor_currency_amount'
            });
            var SLField = Object.freeze({
                REQUISITION_ID: 'requisition_id',
                SUBSIDIARY_ID: 'subsidiary_id',
                REQUISITION_NO: 'requisition_no',
                CURRENCY_ID: 'currency_id',
                CURRENCY_NAME: 'currency_name',
                CURRENCIES: 'currencies',
                SELECTED_LINES: 'selected_lines',
                VENDOR_CURRENCIES: 'vendor_currencies',
                CURRENCY_PICKER_URL: 'currency_picker_url',
                MESSAGE: 'message',
                DATA: 'selected_data',
                RESULTS: 'results'
            });
            var SLColumn = Object.freeze({
                SELECTED: 'selected',
                ITEM: 'item',
                LINE_ID: 'line_id',
                VENDOR: 'vendor',
                VENDOR_CURRENCY: 'vendor_currency',
                SELECT_CURRENCY: 'select_currency',
                VENDOR_CURRENCY_RATE: 'vendor_currency_rate',
                VENDOR_CURRENCY_AMOUNT: 'vendor_currency_amount',
                QUANTITY: 'quantity',
                ESTIMATED_RATE: 'estimated_rate',
                ESTIMATED_AMOUNT: 'estimated_amount'
            });
            var SLSublist = Object.freeze({
                LINES: 'lines'
            });
            var Data = Object.freeze({
                SEPARATOR: '#',
                REQ_LINE: 'line',
                ITEM: 'item',
                VENDOR_CURRENCY: 'vc',
                VENDOR_CURRENCY_RATE: 'vcr',
                VENDOR_CURRENCY_AMOUNT: 'vca',
                QUANTITY: 'qty'
            });
            var ErrorMessage = Object.freeze({
                MISSING_REQUISITION_ID: "Requisition ID is missing",
                MISSING_PO_FORM_ID: "Parameter PO Form ID is missing"
            });
            
            var CurrSLField = Object.freeze({
                CURRENCY_IDS: 'currency_ids',
                CURRENCY_SYMBOLS: 'currency_symbols',
                PRESELECTED_CURRENCY: 'preselected_currency',
                CURRENCY: 'currency'
            });
            
            var CurrencyPicker = Object.freeze({
                SCRIPT_ID: 'customscript_ns_sl_currency_picker',
                DEPLOYMENT_ID: 'customdeploy_ns_sl_currency_picker'
            });

            // Functions
            var getCurrencies = function() {
                var columns = [];
                var colISOCode = search.createColumn({
                    name: 'symbol'
                });
                columns.push(colISOCode);
                var results = searchAllRecords(search.Type.CURRENCY, null, null, columns);
                var currencies = {};
                for (var i = 0; i < results.length; i++) {
                    currencies[results[i].id] = results[i].getValue(colISOCode);
                }
                return currencies;
            };
            
            var getVendorCurrencies = function(vendorId) {
                var vendor = record.load({
                    type: record.Type.VENDOR,
                    id: vendorId
                });
                var currencies = [];
                var primary = vendor.getValue({
                    fieldId: 'currency'
                });
                currencies.push(primary);
                var currCount = vendor.getLineCount({
                    sublistId: 'currency'
                });
                for (var i = 0; i < currCount; i++) {
                    var curr = vendor.getSublistValue({
                        sublistId: 'currency',
                        fieldId: 'currency',
                        line: i
                    });
                    if (curr !== primary) currencies.push(curr);
                }
                return currencies;
            };
            
            var buildMessage = function (rawMsg, params) {
                var msg = rawMsg;
                if (Array.isArray(params)) {
                    msg = rawMsg.replace(/\{(\d+)\}/g, function () {
                        return params[arguments[1]];
                    });
                }
                return msg;
            };

            var searchAllRecords = function (recordType, searchId, searchFilter, searchColumns) {
                var arrSearchResults = [];
                var count = 1000,
                        min = 0,
                        max = 1000;

                var searchObj = false;

                if (searchId) {
                    searchObj = search.load({
                        id: searchId
                    });
                    if (searchFilter) {
                        if (searchObj.filters) {
                            Array.prototype.push.apply(searchObj.filters, searchFilter);
                        } else {
                            searchObj.filters = searchFilter;
                        }
                    }

                    if (searchColumns) {
                        if (searchObj.columns) {
                            Array.prototype.push.apply(searchObj.columns, searchColumns);
                        } else {
                            searchObj.columns = searchColumns;
                        }
                    }
                } else {
                    searchObj = search.create({
                        type: recordType,
                        filters: searchFilter,
                        columns: searchColumns
                    });
                }

                var rs = searchObj.run();

                while (count === 1000) {
                    var results = rs.getRange({
                        start: min,
                        end: max
                    });
                    arrSearchResults = arrSearchResults.concat(results);
                    min = max;
                    max += 1000;
                    count = results.length;
                }

                log.debug('searchAllRecords', 'Total search results(' + recordType + '): ' + arrSearchResults.length);
                return arrSearchResults;
            };
            
            return {
                Value: Value,
                RequisitionToPOBody: RequisitionToPOBody,
                RequisitionToPOColumn: RequisitionToPOColumn,
                TransactionColumn: TransactionColumn,
                SLField: SLField,
                SLColumn: SLColumn,
                SLSublist: SLSublist,
                Data: Data,
                ErrorMessage: ErrorMessage,
                
                CurrSLField: CurrSLField,
                CurrencyPicker: CurrencyPicker,

                getCurrencies: getCurrencies,
                getVendorCurrencies: getVendorCurrencies,
                buildMessage: buildMessage,
                searchAllRecords: searchAllRecords
            };

        });
