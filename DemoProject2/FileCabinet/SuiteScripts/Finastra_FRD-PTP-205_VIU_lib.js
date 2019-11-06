define('viulib', [],
    /**
     */
        function () {

            // Enumerations
            var VendorInvoiceUpdate = Object.freeze({
                TYPE: 'customrecord_ven_inv_upload_form',
                PO_NUMBER: 'custrecord_veninvupld_po_number',
                PO_STATUS: 'custrecord_po_status',
                VENDOR_BILL: 'custrecord_veninvupld_vendor_bill',
                VENDOR: 'custrecord_veninvupld_vendor_name',
                BILL_DATE: 'custrecord_inv_date',
                RECEIVED_ON: 'custrecord_inv_rec_dt',
                EMPLOYEE: 'custrecord_emp_name',
                VENDOR_BILL_CURRENCY: 'custrecord_veninvupld_bill_currency'
            });
            var POStatus = Object.freeze({
                PENDING_BILL: 'Pending Bill',
                PARTIALLY_RECEIVED: 'Partially Received',
                PENDING_BILLING_PARTIALLY_RECEIVED: 'Pending Billing/Partially Received',
                PENDING_RECEIPT: 'Pending Receipt'
            });
            var TransactionBody = Object.freeze({
                VENDOR_INVOICE_UPLOAD: 'custbody_vendor_invoice_upload',
                INVOICE_RECEIVED: 'custbody_inv_received',
                EMPLOYEE: 'custbody_employee'
            });

            return {
                VendorInvoiceUpdate: VendorInvoiceUpdate,
                POStatus: POStatus,
                TransactionBody: TransactionBody
            };

        });
