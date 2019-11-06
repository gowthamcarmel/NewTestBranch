/**
 * @NApiVersion 2.x
 * @NAmdConfig ./Finastra_FRD-PTP-205_VIU.json
 * @NScriptType UserEventScript
 * @NModuleScope Public
 */
define(['viulib', 'N/record', 'N/search', 'N/url', 'N/log', 'N/runtime'],
    /**
     * @param {viulib} viulib
     * @param {record} record
     * @param {search} search
     * @param {url} url
     * @param {log} log
     */
        function (viulib, record, search, url, log, runtime) {

            /**
             * Function definition to be triggered before record is loaded.
             *
             * @param {Object} scriptContext
             */
            function beforeLoad(scriptContext) {
                log.debug('beforeLoad', 'event type: ' + scriptContext.type);
                //log.debug('beforeLoad', 'event form: ' + scriptContext.form);
                //log.debug('beforeLoad', 'event request: ' + scriptContext.request);
                log.debug('beforeLoad', 'runtime.executionContext: ' + runtime.executionContext);
                
                if(runtime.executionContext != 'WEBSERVICES' && runtime.executionContext != 'SCHEDULED' && runtime.executionContext != 'CSVIMPORT')
                {
                	//if(scriptContext.type != 'create')
                    {
                    	if (scriptContext.type == scriptContext.UserEventType.CREATE) {
                            var rec = scriptContext.newRecord;
                            var request = scriptContext.request;
                            var viuId = request.parameters['viu'];
                            log.debug('beforeLoad', 'viuId: ' + viuId);
                            if (viuId) {
                                var transform = request.parameters['transform'];
                                var poId = request.parameters['id'];
                                log.debug('beforeLoad', 'transform: ' + transform);
                                log.debug('beforeLoad', 'poId: ' + poId);
                                var viuRec = record.load({
                                    type: viulib.VendorInvoiceUpdate.TYPE,
                                    id: viuId
                                });
                                var billDate = viuRec.getValue({
                                    fieldId: viulib.VendorInvoiceUpdate.BILL_DATE
                                });
                                var receivedOn = viuRec.getValue({
                                    fieldId: viulib.VendorInvoiceUpdate.RECEIVED_ON
                                });
                                var billRef = viuRec.getValue({
                                    fieldId: viulib.VendorInvoiceUpdate.VENDOR_BILL
                                });
                                log.debug('beforeLoad', 'bill date: ' + billDate);
                                log.debug('beforeLoad', 'received on: ' + receivedOn);
                                log.debug('beforeLoad', 'bill ref: ' + billRef);
                                if (billDate) {
                                    rec.setValue({
                                        fieldId: 'trandate',
                                        value: billDate
                                    });
                                }
                                if (receivedOn) {
                                    rec.setValue({
                                        fieldId: viulib.TransactionBody.INVOICE_RECEIVED,
                                        value: receivedOn
                                    });
                                }
                                if (billRef) {
                                    rec.setValue({
                                        fieldId: 'tranid',
                                        value: billRef
                                    });
                                }
                                rec.setValue({
                                    fieldId: viulib.TransactionBody.VENDOR_INVOICE_UPLOAD,
                                    value: viuId
                                });
                                if (!poId) {
                                    var vendorId = request.parameters['entity'];
                                    log.debug('beforeLoad', 'vendorId: ' + vendorId);
                                    var currency = viuRec.getValue({
                                        fieldId: viulib.VendorInvoiceUpdate.VENDOR_BILL_CURRENCY
                                    });
                                    if (currency) {
                                        rec.setValue({
                                            fieldId: 'currency',
                                            value: currency
                                        });
                                    }
                                }
                            }
                        }
                    }  
                }

                 
            }

            function afterSubmit(scriptContext) {
                log.debug('afterSubmit', 'event type: ' + scriptContext.type);
                if (scriptContext.type == scriptContext.UserEventType.CREATE) {
                    var viuId = scriptContext.newRecord.getValue({
                        fieldId: viulib.TransactionBody.VENDOR_INVOICE_UPLOAD
                    });
                    log.debug('afterSubmit', 'viuId: ' + viuId);
                    if (viuId) {
                        var filters = [];
                        var filterId = search.createFilter({
                            name: 'internalid',
                            operator: search.Operator.IS,
                            values: viuId
                        });
                        filters.push(filterId);
                        var columns = [];
                        var colFileId = search.createColumn({
                            name: 'internalid',
                            join: 'file'
                        });
                        columns.push(colFileId);
                        
                        //----------------- added for file to be added to PO and Requisition -----------------------
                        var colPOId = search.createColumn({
                            name: 'custrecord_veninvupld_po_number',
                        });
                        columns.push(colPOId);
                        
                        var PurchaseOrderId = '';
                        var RequisitionId = '';
                        //------------------------------------------------------------------------------------------

                        var s = search.create({
                            type: 'customrecord_ven_inv_upload_form',
                            filters: filters,
                            columns: columns
                        });
                        var results = s.run().getRange({
                            start: 0,
                            end: 1000
                        });
                       
                        for (var i = 0; i < results.length; i++) {
                        	
                        	var fileId = results[i].getValue(colFileId);
							
							if (fileId)
							{
							
                            record.attach({
                                record: {
                                    type: 'file',
                                    id: fileId
                                },
                                to: {
                                    type: scriptContext.newRecord.type,
                                    id: scriptContext.newRecord.id
                                }
                            });
							}
                            
                            //----------------- added for file to be added to PO and Requisition -----------------------
                        	if (PurchaseOrderId == '')
                        	{
                        		PurchaseOrderId = results[i].getValue(colPOId);
                            	log.debug('afterSubmit', 'PurchaseOrderId: ' + PurchaseOrderId);
                            	
                            	if (PurchaseOrderId)
                            	{
                            		var filters_req = [];
                                    var filterId_req = search.createFilter({
                                        name: 'applyingtransaction',
                                        operator: search.Operator.IS,
                                        values: PurchaseOrderId
                                    });
                                    filters_req.push(filterId_req);
                                    var columns_req = [];
                                    var colFileId_req = search.createColumn({
                                        name: 'internalid'
                                    });
                                    columns_req.push(colFileId_req);
                                    log.debug('afterSubmit', 'columns_req: ' + columns_req);
                                    
                                    var req_s = search.create({
                                        type: 'purchaserequisition',
                                        filters: filters_req,
                                        columns: columns_req
                                    });
                                   
                            		/*var req_s = search.load({
                                        id: 'customsearch_related_requisitions',
                                        filters: filters_req,
                                        columns: columns_req
                                    });*/
                                    
                            		log.debug('afterSubmit', 'req_s: ' + req_s);
                                    var results_req = req_s.run().getRange({
                                        start: 0,
                                        end: 1000
                                    });
                                    log.debug('afterSubmit', 'results_req.length: ' + results_req.length);
                                    
                                    
                                    for (var j = 0; j < results_req.length; j++)
                                    {
                                    	RequisitionId = results_req[j].getValue(colFileId_req);
                                    	log.debug('afterSubmit', 'RequisitionId: ' + RequisitionId);
                                    	
                                    	if (RequisitionId == null)
                                    	{
                                    		break;
                                    	}
                                    }
                            	}
                            	
                        	}
                        	
							if(RequisitionId != '' && fileId){
                        	record.attach({
                                record: {
                                    type: 'file',
                                    id: fileId
                                },
                                to: {
                                    type: 'purchaserequisition',
                                    id: RequisitionId
                                }
                            });
							}
                        	
							if(PurchaseOrderId != '' && fileId){
                        	record.attach({
                                record: {
                                    type: 'file',
                                    id: fileId
                                },
                                to: {
                                    type: 'purchaseorder',
                                    id: PurchaseOrderId
                                }
                            });
							}
                        	//------------------------------------------------------------------------------------------
                        	
                        }
                    }
                }
            }

            return {
                beforeLoad: beforeLoad,
                afterSubmit: afterSubmit
            };

        });
