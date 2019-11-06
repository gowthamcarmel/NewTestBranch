/**
 * @NApiVersion 2.x
 * @NAmdConfig ./Finastra_FRD-PTP-205_VIU.json
 * @NScriptType UserEventScript
 * @NModuleScope Public
 */
define(['viulib', 'N/log'],
    /**
     * @param {viulib} viulib
     * @param {log} log
     */
        function (viulib, log) {

            /**
             * Function definition to be triggered before record is loaded.
             *
             * @param {Object} scriptContext
             */
            function beforeLoad(scriptContext) {
                log.debug('beforeLoad', 'event type: ' + scriptContext.type);
                if (scriptContext.type === scriptContext.UserEventType.VIEW) {
                    var curRec = scriptContext.newRecord;
                    var poId = curRec.getValue({
                        fieldId: viulib.VendorInvoiceUpdate.PO_NUMBER
                    });
                    if (!poId) poId = '';
                    var vendorId = curRec.getValue({
                        fieldId: viulib.VendorInvoiceUpdate.VENDOR
                    });
                    if (!vendorId) vendorId = '';
                    var poStatus = curRec.getValue({
                        fieldId: viulib.VendorInvoiceUpdate.PO_STATUS
                    });
                    if (!poStatus) poStatus = '';
                    var billRef = curRec.getValue({
                        fieldId: viulib.VendorInvoiceUpdate.VENDOR_BILL
                    });
                    if (!billRef) billRef = '';
                    scriptContext.form.clientScriptModulePath = './Finastra_FRD-PTP-205_CS_VIU_BillButton.js';
                    scriptContext.form.addButton({
                        id: 'custpage_gotobill',
                        label: 'Bill',
                        functionName: 'goToBill("' + curRec.id + '", "' + vendorId + '", "' + poId + '", "' + poStatus + '", "' + billRef + '")'
                    });
                }
            }

            return {
                beforeLoad: beforeLoad
            };

        });
