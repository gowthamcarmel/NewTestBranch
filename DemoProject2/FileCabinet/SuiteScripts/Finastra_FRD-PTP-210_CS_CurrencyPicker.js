/**
 * @NApiVersion 2.x
 * @NAmdConfig ./Finastra_FRD-PTP-210.json
 * @NScriptType ClientScript
 * @NModuleScope Public
 */
define(['orderlib', 'N/currentRecord'],
    /**
     * @param {object} orderlib
     * @param {object} currentRecord
     */
        function (orderlib, currentRecord) {

            /**
             * Function to be executed after page is initialized.
             *
             * @param {Object} scriptContext
             */
            function pageInit(scriptContext) {
            }
            
            function setCurrency() {
//                alert('setting currency...');
                var selectedCurrency = currentRecord.get().getValue({
                    fieldId: orderlib.CurrSLField.CURRENCY
                });
		if (window.opener && window.opener.nlapiSetCurrentLineItemValue) {
                    window.opener.nlapiSetCurrentLineItemValue(orderlib.SLSublist.LINES, orderlib.SLColumn.VENDOR_CURRENCY, selectedCurrency);
		}
		window.ischanged = false;
                window.close();
            }

            return {
                pageInit: pageInit,
                setCurrency: setCurrency
            };

        });
