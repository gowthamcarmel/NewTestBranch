/**
 * @NApiVersion 2.x
 * @NAmdConfig ./Finastra_FRD-PTP-205_VIU.json
 * @NScriptType ClientScript
 * @NModuleScope Public
 */
define(['viulib', 'N/search', 'N/url'],
    /**
     * @param {viulib} viulib
     * @param {search} search
     * @param {url} url
     */
        function (viulib, search, url) {

            function buildBasicForm(viuId) {
                var urlVB = url.resolveRecord({
                    recordType: 'vendorbill',
                    isEditMode: true
                });
//                alert('url: ' + urlVB);

                var ccForm = document.createElement('form');
                ccForm.action = urlVB;
                var viuField = document.createElement('input');
                viuField.type = 'hidden';
                viuField.name = 'viu';
                viuField.value = viuId;
                ccForm.appendChild(viuField);
                
                return ccForm;
            }
            
            function goToBill(viuId, vendorId, poId, poStatus, billRef) {
      //       alert('poId: ' + poId + ', vendorId: ' + vendorId + ', poStatus: ' + poStatus + ', billRef: ' + billRef);
       
                var filters = [];
                var filterRefNo = search.createFilter({
                    name: 'tranid',
                    operator: search.Operator.IS,
                    values: billRef
                });
				var filterVendorID = search.createFilter({
                    name: 'entity',
                    operator: search.Operator.IS,
                    values: vendorId
                });
                filters.push(filterRefNo);
				 filters.push(filterVendorID);
                var s = search.create({
                    type: search.Type.VENDOR_BILL,
                    filters: filters
                });
                var results = s.run().getRange({
                    start: 0,
                    end: 1
                });
//                alert('results length: ' + results.length);
                
                if (results && results.length > 0) {    // Scenario 4
                    var duplicateMessage = 'The Vendor Bill reference number you are using already exists in the system.';
                    duplicateMessage += '\nPlease edit your record and enter a different vendor bill reference number.';
                    alert(duplicateMessage);
                } else {
                    if (!poId) {    // Scenario 3
                        var standaloneMessage = 'You are about to create a standalone bill.';
                        standaloneMessage += '\nIf you intend to do so, please click OK to proceed to Billing Screen.';
                        standaloneMessage += '\nIf you intend to create a bill from a PO, please click Cancel and enter the PO number accordingly';
                        var confirmed = confirm(standaloneMessage);
                        if (confirmed) {
                            var billForm = buildBasicForm(viuId);
                            if (vendorId) {
                                var vendorField = document.createElement('input');
                                vendorField.type = 'hidden';
                                vendorField.name = 'entity';
                                vendorField.value = vendorId;
                                billForm.appendChild(vendorField);
                            }
                            document.body.appendChild(billForm);
                            billForm.submit();
                        }
                    } else {
                        var arStatus = poStatus ? poStatus.split(':') : '';
                        var status = arStatus[arStatus.length - 1];
                        
                        var funcScenario1 = function() {
                            var billForm = buildBasicForm(viuId);
                            var transformField = document.createElement('input');
                            transformField.type = 'hidden';
                            transformField.name = 'transform';
                            transformField.value = 'purchord';
                            billForm.appendChild(transformField);
                            var idField = document.createElement('input');
                            idField.type = 'hidden';
                            idField.name = 'id';
                            idField.value = poId;
                            billForm.appendChild(idField);
                            var editField = document.createElement('input');
                            editField.type = 'hidden';
                            editField.name = 'e';
                            editField.value = 'T';
                            billForm.appendChild(editField);
                            var memdocField = document.createElement('input');
                            memdocField.type = 'hidden';
                            memdocField.name = 'memdoc';
                            memdocField.value = '0';
                            billForm.appendChild(memdocField);
                            
                            document.body.appendChild(billForm);
                            billForm.submit();
                        };
                        var funcScenario2 = function() {
                            var wrongStatusMessage = 'The Purchase Order is not in a valid status to be received';
                            alert(wrongStatusMessage);
                        };
                        
                        var theFunction = null;
                        switch (status) {
                            case viulib.POStatus.PENDING_BILL:
                            case viulib.POStatus.PARTIALLY_RECEIVED:
                            case viulib.POStatus.PENDING_BILLING_PARTIALLY_RECEIVED:
                            case viulib.POStatus.PENDING_RECEIPT:
                                theFunction = funcScenario1;
                                break;
                            default:
                                theFunction = funcScenario2;
                        }
                        theFunction();
                    }
                }
            }

            /**
             * Function to be executed after page is initialized.
             *
             * @param {Object} scriptContext
             * @param {Record} scriptContext.currentRecord - Current form record
             * @param {string} scriptContext.mode - The mode in which the record is being accessed (create, copy, or edit)
             *
             * @since 2015.2
             */
            function pageInit(scriptContext) {

            }

            return {
                pageInit: pageInit,
                goToBill: goToBill
            };

        });
