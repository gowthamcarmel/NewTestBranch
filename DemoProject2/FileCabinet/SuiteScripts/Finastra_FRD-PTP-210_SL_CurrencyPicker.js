/**
 * @NApiVersion 2.x
 * @NAmdConfig ./Finastra_FRD-PTP-210.json
 * @NScriptType Suitelet
 * @NModuleScope Public
 */
define(['orderlib', 'N/ui/serverWidget', 'N/http', 'N/search', 'N/record', 'N/log'],
    /**
     * @param {object} orderlib
     * @param {object} ui
     * @param {object} http
     * @param {object} search
     * @param {object} record
     * @param {object} log
     */
        function (orderlib, ui, http, search, record, log) {
            
            /**
             * Definition of the Suitelet script trigger point.
             *
             * @param {Object} context
             */
            function onRequest(context) {
                var logTitle = 'onRequest';
                var request = context.request;
                var theForm = ui.createForm({
                    title: 'Currency Picker',
                    hideNavBar: true
                });
                theForm.clientScriptModulePath = './Finastra_FRD-PTP-210_CS_CurrencyPicker.js';
                var currencyIds = JSON.parse(request.parameters[orderlib.CurrSLField.CURRENCY_IDS]);
                var currencySymbols = JSON.parse(request.parameters[orderlib.CurrSLField.CURRENCY_SYMBOLS]);
                var preselectedCurrency = request.parameters[orderlib.CurrSLField.PRESELECTED_CURRENCY];
                log.debug(logTitle, 'currency ids: ' + currencyIds);
                log.debug(logTitle, 'currency symbols: ' + currencySymbols);
                log.debug(logTitle, 'preselected currency: ' + preselectedCurrency);
                if (request.method === http.Method.POST) {
                    var currencyField = theForm.addField({
                        id: orderlib.CurrSLField.CURRENCY,
                        type: ui.FieldType.SELECT,
                        label: 'Currency'
                    });
                    for (var i = 0; i < currencyIds.length; i++) {
                        currencyField.addSelectOption({
                            value: currencyIds[i],
                            text: currencySymbols[i],
                            isSelected: (currencyIds[i] === preselectedCurrency)
                        });
                    }
                    theForm.addButton({
                        id: 'set_currency',
                        label: 'OK',
                        functionName: 'setCurrency()'
                    });
                    
                }
                
                context.response.writePage(theForm);
            }

            return {
                onRequest: onRequest
            };

        });
