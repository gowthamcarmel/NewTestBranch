/**
 * @NApiVersion 2.x
 * @NAmdConfig ./Finastra_FRD-PTP-210.json
 * @NScriptType Suitelet
 * @NModuleScope Public
 */
define(['orderlib', 'N/ui/serverWidget', 'N/http', 'N/search', 'N/record', 'N/url', 'N/runtime', 'N/log','N/format'],
    /**
     * @param {object} orderlib
     * @param {object} ui
     * @param {object} http
     * @param {object} search
     * @param {object} record
     * @param {object} url
     * @param {object} runtime
     * @param {object} log
     */
        function (orderlib, ui, http, search, record, url, runtime, log,format) {
            
            var Parameter = Object.freeze({
                PO_FORM_ID: 'custscript_po_form_id'
            });
        
            function getVendors(subsId) {
                var filters = [];
		var filterInactive = search.createFilter({
			name: 'isinactive',
			operator: search.Operator.IS,
			values: false
		});
                filters.push(filterInactive);
		var filterSubsidiary = search.createFilter({
			name: 'subsidiary',
			operator: search.Operator.ANYOF,
			values: subsId
		});
                filters.push(filterSubsidiary);
                var columns = [];
                var colInternalId = search.createColumn({
                    name: 'internalid'
                });
                columns.push(colInternalId);
                var colEntityId = search.createColumn({
                    name: 'entityid'
                });
                columns.push(colEntityId);
                var colName = search.createColumn({
                    name: 'altname'
                });
                columns.push(colName);
                
                var results = orderlib.searchAllRecords(search.Type.VENDOR, null, filters, columns);
                var vendors = [];
                for (var i = 0; i < results.length; i++) {
                    var obj = {};
                    obj['value'] = results[i].getValue(colInternalId);
                    obj['text'] = results[i].getValue(colEntityId) + ' ' + results[i].getValue(colName);
                    vendors.push(obj);
                }
                return vendors;
            }

            /**
             * Definition of the Suitelet script trigger point.
             *
             * @param {Object} context
             */
            function onRequest(context) {
                var logTitle = 'onRequest';
                var request = context.request;
                var theForm = ui.createForm({
                    title: 'Order Requisition'
                });
                theForm.clientScriptModulePath = './Finastra_FRD-PTP-210_CS_OrderRequistion.js';
                var requisitionId = request.parameters[orderlib.SLField.REQUISITION_ID];
                log.debug(logTitle, 'requisition id: ' + requisitionId);
                if (requisitionId) {
                    var requisition = record.load({
                        type: record.Type.PURCHASE_REQUISITION,
                        id: requisitionId
                    });
					
					
                    if (request.method === http.Method.GET) {
                        
						//-----------------
						//var OrderReqFlag = requisition.getValue({
						//		fieldId: 'custbody_order_requisition_flag'
						//	});
						//	log.debug('GET', 'OrderReqFlag: ' + OrderReqFlag);
						
						
						//if(OrderReqFlag === true)
						//{
						//	throw 'Another window for Creation of PO for this Requisition is already open'
						//}
						//else
						//{
							//record.submitFields({ type: record.Type.PURCHASE_REQUISITION, id: requisitionId, values: { custbody_order_requisition_flag: true } });
						//}
						//-----------------
					
						
						theForm.addSubmitButton({
                            label: 'Submit'
                        });
						
						//var BackFunc = 'Back(' + requisitionId +')';
						//log.debug('GET', 'BackFunc: ' + BackFunc);
						// theForm.addButton({
                        //    id: 'back_window',
                        //    label: 'Back',
                        //    functionName: BackFunc
                        //});
						
                        var reqIdField = theForm.addField({
                            id: orderlib.SLField.REQUISITION_ID,
                            type: ui.FieldType.TEXT,
                            label: 'Requisition ID'
                        });
						
                        reqIdField.updateDisplayType({
                            displayType: ui.FieldDisplayType.HIDDEN
                        });
                        reqIdField.defaultValue = requisitionId;
                        
						//last updated date
						// added by Gowtham
						var requestmodifieddate=requisition.getValue({
							fieldId: 'custbody_lastmodifieddate'
							});
						 
						// log.debug(logTitle, 'Lastupdated Date: ' + requestmodifieddate);
						 
						 var lastupdateddate = theForm.addField({
                            id: 'custpage_lastupdatedate',
                            type: ui.FieldType.TEXT,
                            label: 'Last updated date'
							
                        });
						lastupdateddate.updateDisplayType({
                            displayType: ui.FieldDisplayType.HIDDEN
                        });
						lastupdateddate.defaultValue =requestmodifieddate;
							//var offsetIST = 0.5;
							//To convert to UTC datetime by subtracting the current Timezone offset
							//var utcdate = new Date(testDate.getTime() + (testDate.getTimezoneOffset() * 60000));
					
							//log.debug('DEBUG: '+utcdate);
							//Then cinver the UTS date to the required time zone offset like back to 5.5 for IST
							//var istdate = new Date(utcdate.getTime() - ((-offsetIST * 60) * 60000));
							
							//log.debug('DEBUG: '+istdate);
							
							//var utcIND = (istdate.getTime()-(86400000*1)) + (432 * 60000);
						   // nlapiLogExecution('DEBUG', 'context', 'utcdatecreated = '+utcIND); 
							
						
						// added by Gowtham-----------------------------
						
                        // Currency Picker URL
                        var currencyPickerUrl = url.resolveScript({
                            scriptId: orderlib.CurrencyPicker.SCRIPT_ID,
                            deploymentId: orderlib.CurrencyPicker.DEPLOYMENT_ID,
                            returnExternalUrl: false
                        });
                        log.debug(logTitle, 'picker url: ' + currencyPickerUrl);
                        var urlField = theForm.addField({
                            id: orderlib.SLField.CURRENCY_PICKER_URL,
                            type: ui.FieldType.TEXT,
                            label: 'Currency Picker URL'
                        });
                        urlField.updateDisplayType({
                            displayType: ui.FieldDisplayType.HIDDEN
                        });
                        urlField.defaultValue = currencyPickerUrl;
                        
                        // Get Currency data
                        var currencies = orderlib.getCurrencies();
                        var strCurrencies = JSON.stringify(currencies);
                        var currenciesField = theForm.addField({
                            id: orderlib.SLField.CURRENCIES,
                            type: ui.FieldType.LONGTEXT,
                            label: 'Currencies'
                        });
                        currenciesField.updateDisplayType({
                            displayType: ui.FieldDisplayType.HIDDEN
                        });
                        currenciesField.defaultValue = strCurrencies;
                        
                        // Get Requisition header data
                        var subsidiary = requisition.getValue({
                            fieldId: 'subsidiary'
                        });
                        var tranId = requisition.getValue({
                            fieldId: 'tranid'
                        });
                        var currencyId = requisition.getValue({
                            fieldId: 'currency'
                        });
                        var currencyName = requisition.getText({
                            fieldId: 'currency'
                        });
						
                        var requistionNoField = theForm.addField({
                            id: orderlib.SLField.REQUISITION_NO,
                            type: ui.FieldType.TEXT,
                            label: 'Requisition #'
                        });
                        requistionNoField.updateDisplayType({
                            displayType: ui.FieldDisplayType.INLINE
                        });
                        requistionNoField.defaultValue = tranId;
                        var subsIdField = theForm.addField({
                            id: orderlib.SLField.SUBSIDIARY_ID,
                            type: ui.FieldType.TEXT,
                            label: 'Subsidiary ID'
                        });
                        subsIdField.updateDisplayType({
                            displayType: ui.FieldDisplayType.HIDDEN
                        });
                        subsIdField.defaultValue = subsidiary;
                        var currencyNameField = theForm.addField({
                            id: orderlib.SLField.CURRENCY_NAME,
                            type: ui.FieldType.TEXT,
                            label: 'Currency'
                        });
                        currencyNameField.updateDisplayType({
                            displayType: ui.FieldDisplayType.INLINE
                        });
                        currencyNameField.defaultValue = currencyName;
                        var currencyIdField = theForm.addField({
                            id: orderlib.SLField.CURRENCY_ID,
                            type: ui.FieldType.TEXT,
                            label: 'Currency ID'
                        });
                        currencyIdField.updateDisplayType({
                            displayType: ui.FieldDisplayType.HIDDEN
                        });
                        currencyIdField.defaultValue = currencyId;
                        
                        var selectedLinesField = theForm.addField({
                            id: orderlib.SLField.SELECTED_LINES,
                            type: ui.FieldType.LONGTEXT,
                            label: 'Selected Lines'
                        });
                        selectedLinesField.updateDisplayType({
                            displayType: ui.FieldDisplayType.HIDDEN
                        });
                        
                        var vendorCurrenciesField = theForm.addField({
                            id: orderlib.SLField.VENDOR_CURRENCIES,
                            type: ui.FieldType.LONGTEXT,
                            label: 'Vendor Currencies'
                        });
                        vendorCurrenciesField.updateDisplayType({
                            displayType: ui.FieldDisplayType.HIDDEN
                        });
                        
                        var selectedDataField = theForm.addField({
                            id: orderlib.SLField.DATA,
                            type: ui.FieldType.LONGTEXT,
                            label: 'Selected Data'
                        });
                        selectedDataField.updateDisplayType({
                            displayType: ui.FieldDisplayType.HIDDEN
                        });

                        // Define sublist
                        var reqLinesSublist = theForm.addSublist({
                            id: orderlib.SLSublist.LINES,
                            label: 'Requisition Lines',
                            type: ui.SublistType.LIST
                        });
						
						
						//------------------------
						//var GetButton = reqLinesSublist.addMarkAllButtons();
						//log.debug('GET', 'GetButton: ' + GetButton);
						//----------------------------------
						
						
                        reqLinesSublist.addButton({
                            id: 'select_all',
                            label: 'Select All',
                            functionName: 'selectAll(true)'
                        });
                        reqLinesSublist.addButton({
                            id: 'unselect_all',
                            label: 'Unselect All',
                            functionName: 'selectAll(false)'
                        });
                        reqLinesSublist.addField({
                            id: orderlib.SLColumn.SELECTED,
                            label: 'Select',
                            type: ui.FieldType.CHECKBOX
                        });
                        var lineIdField = reqLinesSublist.addField({
                            id: orderlib.SLColumn.LINE_ID,
                            label: 'Line ID',
                            type: ui.FieldType.TEXT
                        });
                        lineIdField.updateDisplayType({
                            displayType: ui.FieldDisplayType.HIDDEN
                        });
                        var itemField = reqLinesSublist.addField({
                            id: orderlib.SLColumn.ITEM,
                            label: 'Item',
                            type: ui.FieldType.SELECT,
                            source: 'item'
                        });
                        itemField.updateDisplayType({
                            displayType: ui.FieldDisplayType.INLINE
                        });
                        var vendorField = reqLinesSublist.addField({
                            id: orderlib.SLColumn.VENDOR,
                            label: 'Vendor',
                            type: ui.FieldType.SELECT
                        });
                        vendorField.addSelectOption({
                            value: orderlib.Value.EMPTY,
                            text: '---'
                        });
                        var vendors = getVendors(subsidiary);
                        for (var i = 0; i < vendors.length; i++) {
                            vendorField.addSelectOption({
                                value: vendors[i].value,
                                text: vendors[i].text
                            });
                        }
                        var vendorCurrencyField = reqLinesSublist.addField({
                            id: orderlib.SLColumn.VENDOR_CURRENCY,
                            label: 'Vendor Currency',
                            type: ui.FieldType.SELECT,
                            source: record.Type.CURRENCY
                        });
                        vendorCurrencyField.updateDisplayType({
                            displayType: ui.FieldDisplayType.DISABLED
                        });
                        reqLinesSublist.addField({
                            id: orderlib.SLColumn.SELECT_CURRENCY,
                            label: 'Select Currency',
                            type: ui.FieldType.CHECKBOX
                        });
                        var quantityField = reqLinesSublist.addField({
                            id: orderlib.SLColumn.QUANTITY,
                            label: 'Quantity',
                            type: ui.FieldType.FLOAT
                        });
                        quantityField.updateDisplayType({
                            displayType: ui.FieldDisplayType.ENTRY
                        });
                        var vendorCurrencyRateField = reqLinesSublist.addField({
                            id: orderlib.SLColumn.VENDOR_CURRENCY_RATE,
                            label: 'Vendor Currency Rate',
                            type: ui.FieldType.CURRENCY
                        });
                        vendorCurrencyRateField.updateDisplayType({
                            displayType: ui.FieldDisplayType.ENTRY
                        });
                        var vendorCurrencyAmountField = reqLinesSublist.addField({
                            id: orderlib.SLColumn.VENDOR_CURRENCY_AMOUNT,
                            label: 'Vendor Currency Amount',
                            type: ui.FieldType.CURRENCY
                        });
                        vendorCurrencyAmountField.updateDisplayType({
                            displayType: ui.FieldDisplayType.ENTRY
                        });
                        var estimatedRateField = reqLinesSublist.addField({
                            id: orderlib.SLColumn.ESTIMATED_RATE,
                            label: 'Estimated Rate',
                            type: ui.FieldType.CURRENCY
                        });
                        var estimatedAmountField = reqLinesSublist.addField({
                            id: orderlib.SLColumn.ESTIMATED_AMOUNT,
                            label: 'Estimated Amount',
                            type: ui.FieldType.CURRENCY
                        });

                        var vendorCurrencies = {};
                        
                        // Transform requisition to get actual quantities
                        var poStub = record.transform({
                            fromType: record.Type.PURCHASE_REQUISITION,
                            fromId: requisitionId,
                            toType: record.Type.PURCHASE_ORDER
                        });

                        // Build sublist
                        var lineCount = requisition.getLineCount({
                            sublistId: 'item'
                        });
                        log.debug('GET', 'requisition line count: ' + lineCount);
                        var slLineIndex = 0;
                        for (var j = 0; j < lineCount; j++) {
                            var item = requisition.getSublistValue({
                                sublistId: 'item',
                                fieldId: 'item',
                                line: j
                            });
                            var actualQuantity = parseFloat(poStub.getSublistValue({
                                sublistId: 'item',
                                fieldId: 'quantity',
                                line: j
                            }));
                            log.debug('GET', 'actual quantity: ' + actualQuantity);
                            if (actualQuantity > 0) {
                                reqLinesSublist.setSublistValue({
                                    id: orderlib.SLColumn.LINE_ID,
                                    line: slLineIndex,
                                    value: j
                                });
                                reqLinesSublist.setSublistValue({
                                    id: orderlib.SLColumn.ITEM,
                                    line: slLineIndex,
                                    value: item
                                });
                                var vendorId = requisition.getSublistValue({
                                    sublistId: 'item',
                                    fieldId: 'povendor',
                                    line: j
                                });
                                if (vendorId) {
                                    reqLinesSublist.setSublistValue({
                                        id: orderlib.SLColumn.VENDOR,
                                        line: slLineIndex,
                                        value: vendorId
                                    });
                                    if (!vendorCurrencies[vendorId]) {
                                        vendorCurrencies[vendorId] = orderlib.getVendorCurrencies(vendorId);
                                    }
                                }
                                var vendorCurrency = requisition.getSublistValue({
                                    sublistId: 'item',
                                    fieldId: orderlib.TransactionColumn.VENDOR_CURRENCY,
                                    line: j
                                });
                                if (vendorCurrency) {
                                    reqLinesSublist.setSublistValue({
                                        id: orderlib.SLColumn.VENDOR_CURRENCY,
                                        line: slLineIndex,
                                        value: vendorCurrency
                                    });
                                }
                                var currencyRate = requisition.getSublistValue({
                                    sublistId: 'item',
                                    fieldId: orderlib.TransactionColumn.VENDOR_CURRENCY_RATE,
                                    line: j
                                });
                                if (currencyRate) {
                                    reqLinesSublist.setSublistValue({
                                        id: orderlib.SLColumn.VENDOR_CURRENCY_RATE,
                                        line: slLineIndex,
                                        value: currencyRate
                                    });
                                }
                                var currencyAmount = requisition.getSublistValue({
                                    sublistId: 'item',
                                    fieldId: orderlib.TransactionColumn.VENDOR_CURRENCY_AMOUNT,
                                    line: j
                                });
                                if (currencyAmount) {
                                    reqLinesSublist.setSublistValue({
                                        id: orderlib.SLColumn.VENDOR_CURRENCY_AMOUNT,
                                        line: slLineIndex,
                                        value: currencyAmount
                                    });
                                }
                                reqLinesSublist.setSublistValue({
                                    id: orderlib.SLColumn.QUANTITY,
                                    line: slLineIndex,
                                    value: actualQuantity
                                });
                                var estimatedRate = parseFloat(requisition.getSublistValue({
                                    sublistId: 'item',
                                    fieldId: 'estimatedrate',
                                    line: j
                                }));
                                if (!isNaN(estimatedRate)) {
                                    reqLinesSublist.setSublistValue({
                                        id: orderlib.SLColumn.ESTIMATED_RATE,
                                        line: slLineIndex,
                                        value: estimatedRate
                                    });
                                }
                                var estimatedAmount = parseFloat(requisition.getSublistValue({
                                    sublistId: 'item',
                                    fieldId: 'estimatedrate',
                                    line: j
                                }));
                                if (!isNaN(estimatedAmount)) {
                                    reqLinesSublist.setSublistValue({
                                        id: orderlib.SLColumn.ESTIMATED_AMOUNT,
                                        line: slLineIndex,
                                        value: estimatedAmount
                                    });
                                }
                                slLineIndex++;
                            }
                        }

                        vendorCurrenciesField.defaultValue = JSON.stringify(vendorCurrencies);
                        
                    } else {
                        var formId = runtime.getCurrentScript().getParameter({
                            name: Parameter.PO_FORM_ID
                        });
                        if (formId) {
                            var subsidiaryId = request.parameters[orderlib.SLField.SUBSIDIARY_ID];
                            var strSelectedData = request.parameters[orderlib.SLField.DATA];
                            log.debug('POST', 'requisition id: ' + requisitionId);
                            log.debug('POST', 'subsidiary id: ' + subsidiaryId);
                            log.debug('POST', 'selected data: ' + strSelectedData);
							
							//-----------------
							
							//record.submitFields({ type: record.Type.PURCHASE_REQUISITION, id: requisitionId, values: {custbody_order_requisition_flag: false}});
							//log.debug('POST', 'response: ' + response.write(window.close));
							//context.response.write('<html><body><script>window.close();</script></body></html>');
							
							//-----------------

                            var data = JSON.parse(strSelectedData);
                            var keys = Object.keys(data);
                            var poIds = [];

                            // Get Requisition body fields
                            var filters = [];
                            var filterInactive = search.createFilter({
                                    name: 'isinactive',
                                    operator: search.Operator.IS,
                                    values: false
                            });
                            filters.push(filterInactive);
                            var columns = [];
                            var colReqField = search.createColumn({
                                name: orderlib.RequisitionToPOBody.REQUISITION_BODY_FIELD
                            });
                            columns.push(colReqField);
                            var colPOField = search.createColumn({
                                name: orderlib.RequisitionToPOBody.PO_BODY_FIELD
                            });
                            columns.push(colPOField);
                            var sResults = orderlib.searchAllRecords(orderlib.RequisitionToPOBody.TYPE, null, filters, columns);
                            var reqFields = [];
                            var poFields = [];
                            for (var kk = 0; kk < sResults.length; kk++) {
                                reqFields.push(sResults[kk].getValue(colReqField));
                                poFields.push(sResults[kk].getValue(colPOField));
                            }
                            log.debug('POST', 'reqFields: ' + reqFields.length);
                            log.debug('POST', 'poFields: ' + poFields.length);

                            // Get Requisition column fields
                            columns = [];
                            var colReqColumn = search.createColumn({
                                name: orderlib.RequisitionToPOColumn.REQUISITION_COLUMN_FIELD
                            });
                            columns.push(colReqColumn);
                            var colPOColumn = search.createColumn({
                                name: orderlib.RequisitionToPOColumn.PO_COLUMN_FIELD
                            });
                            columns.push(colPOColumn);
                            sResults = orderlib.searchAllRecords(orderlib.RequisitionToPOColumn.TYPE, null, filters, columns);
                            var reqCols = [];
                            var poCols = [];
                            for (var kk = 0; kk < sResults.length; kk++) {
                                reqCols.push(sResults[kk].getValue(colReqColumn));
                                poCols.push(sResults[kk].getValue(colPOColumn));
                            }
                            log.debug('POST', 'reqColss: ' + reqCols.length);
                            log.debug('POST', 'poCols: ' + poCols.length);

                            for (var k = 0; k < keys.length; k++) {
                                var vendorAndCurrency = keys[k].split(orderlib.Data.SEPARATOR);
                                var vendor = vendorAndCurrency[0];
                                var currency = vendorAndCurrency[1];

                                var po = record.transform({
                                    fromType: record.Type.PURCHASE_REQUISITION,
                                    fromId: requisitionId,
                                    toType: record.Type.PURCHASE_ORDER,
                                    isDynamic: true,
                                    defaultValues: {
                                        customform: formId
                                    }
                                });
                                var subs = po.getValue({
                                    fieldId: 'subsidiary'
                                });
                                var dept = po.getValue({
                                    fieldId: 'department'
                                });
                                var loc = po.getValue({
                                    fieldId: 'location'
                                });
                                var klass = po.getValue({
                                    fieldId: 'class'
                                });
                                log.debug('POST', 'subs: ' + subs + ', dept: ' + dept + ', loc: ' + loc + ', class: ' + klass);
                                po.setValue({
                                    fieldId: 'entity',
                                    value: vendor
                                });
                                po.setValue({
                                    fieldId: 'currency',
                                    value: currency
                                });
                                for (var iii = 0; iii < reqFields.length; iii++) {
                                    var reqValue = requisition.getValue({
                                        fieldId: reqFields[iii]
                                    });
                                    log.debug('POST', 'reqField: ' + reqFields[iii] + '; value: ' + reqValue + '. Copying to poField ' + poFields[iii]);
                                    po.setValue({
                                        fieldId: poFields[iii],
                                        value: reqValue
                                    });
                                }
                                
                                // Log
                                /*
                                var poLineCount = po.getLineCount({
                                    sublistId: 'item'
                                });
                                for (var pl = 0; pl < poLineCount; pl++){
                                    var defaultQty = po.getSublistValue({
                                        sublistId: 'item',
                                        fieldId: 'quantity',
                                        line: pl
                                    });
                                    log.debug('POST', 'default quantity: ' + defaultQty);
                                }
                                */

                                var lines = data[keys[k]];
                                var poLineIndices = [];
                                for (var ii = 0; ii < lines.length; ii++) {
								
                                    var poLineIndex = parseInt(lines[ii][orderlib.Data.REQ_LINE], 10);
                                    poLineIndices.push(poLineIndex);
                                    po.selectLine({
                                        sublistId: 'item',
                                        line: poLineIndex
                                    });
                                    po.setCurrentSublistValue({
                                        sublistId: 'item',
                                        fieldId: 'item',
                                        value: lines[ii][orderlib.Data.ITEM]
                                    });
                                    po.setCurrentSublistValue({
                                        sublistId: 'item',
                                        fieldId: 'quantity',
                                        value: lines[ii][orderlib.Data.QUANTITY]
                                    });
                                    po.setCurrentSublistValue({
                                        sublistId: 'item',
                                        fieldId: 'rate',
                                        value: lines[ii][orderlib.Data.VENDOR_CURRENCY_RATE]
                                    });
                                    for (var iii = 0; iii < reqCols.length; iii++) {
                                        var reqColValue = requisition.getSublistValue({
                                            sublistId: 'item',
                                            fieldId: reqCols[iii],
                                            line: poLineIndex
                                        });
                                        log.debug('POST', 'reqCol: ' + reqCols[iii] + '; value: ' + reqColValue + '. Copying to poCol ' + poCols[iii]);
                                        po.setCurrentSublistValue({
                                            sublistId: 'item',
                                            fieldId: poCols[iii],
                                            value: reqColValue
                                        });
                                    }
                                    po.commitLine({
                                        sublistId: 'item'
                                    });
                                }

                                // Delete lines not ordered
                                var trLineCount = po.getLineCount({
                                    sublistId: 'item'
                                });
                                for (var trl = trLineCount - 1; trl >= 0; trl--){
                                    if (poLineIndices.indexOf(trl) === -1) {
                                        po.removeLine({
                                            sublistId: 'item',
                                            line: trl
                                        });
                                    }
                                }

                                try {
									    
								 //added by Gowtham
									 
								    var u_requisition_date = request.parameters['custpage_lastupdatedate'];
									
									var ModifiedDate=requisition.getValue({fieldId: 'custbody_lastmodifieddate'});
									
									//log.debug(logTitle, 'Modified Date: ' + ModifiedDate);
									//log.debug(logTitle, 'Lastupdated Date: ' + u_requisition_date);
									
									function sysDate() {
									var date = new Date();
									var tdate = date.getDate();
									var month = date.getMonth() + 1; // jan = 0
									var year = date.getFullYear();
									return currentDate = month + '/' + tdate + '/' + year;
									}

									function timestamp() {
									var str = "";

									var currentTime = new Date();
									var hours = currentTime.getHours();
									var minutes = currentTime.getMinutes();
									var seconds = currentTime.getSeconds();
									var milliseconds=currentTime.getMilliseconds();
									var meridian = "";
									if (hours > 12) {
										meridian += "pm";
									} else {
										meridian += "am";
									}
									if (hours > 12) {

										hours = hours - 12;
									}
									if (minutes < 10) {
										minutes = "0" + minutes;
									}
									if (seconds < 10) {
										seconds = "0" + seconds;
									}
									str += hours + ":" + minutes + ":" + seconds + ":" + milliseconds+" ";

									return str + meridian;
									}
									
									var currentDate = sysDate(); // returns the date
									var currentTime = timestamp(); // returns the time stamp in HH:MM:SS
									var currentDateAndTime = currentDate + ' ' + currentTime;
									
									record.submitFields({ type: record.Type.PURCHASE_REQUISITION, id: requisitionId, values: {custbody_lastmodifieddate: currentDateAndTime}});
									
									if (ModifiedDate == u_requisition_date){
									
                                    log.debug('Save','Saving Record');
									var poId = po.save();
                                    poIds.push(poId);
									
									var htmlResults = '<p>Purchase Orders</p><p>';
									for (var jj = 0; jj < poIds.length; jj++) {
										var lookup = search.lookupFields({
											type: search.Type.PURCHASE_ORDER,
											id: poIds[jj],
											columns: 'tranid'
										});
										var poUrl = url.resolveRecord({
											recordType: 'purchaseorder',
											recordId: poIds[jj]
										});
										htmlResults += '<a href="' + poUrl + '">' + lookup['tranid'] + '</a><br />';
									}
									htmlResults += '</p>';
									var resultsField = theForm.addField({
										id: orderlib.SLField.RESULTS,
										type: ui.FieldType.INLINEHTML,
										label: 'Purchase Orders'
									});
									resultsField.defaultValue = htmlResults;
									}
									else{
										var v_message = theForm.addField({
											id: orderlib.SLField.MESSAGE,
											type: ui.FieldType.INLINEHTML,
											label: 'Error'
										});
										v_message.defaultValue = '<p>' + 'Request has been modified by another user' + '</p>';
									}
									//added by Gowtham
                                } catch (e) {
									var error=e.toString();
									var n=error.search('RCRD_HAS_BEEN_CHANGED');
									
									if (n!==-1) {
										log.debug('error','identified string');
										var v_message = theForm.addField({
											id: orderlib.SLField.MESSAGE,
											type: ui.FieldType.INLINEHTML,
											label: 'Error'
										});
										v_message.defaultValue = '<p>' + 'Request has been modified by another user' + '</p>';	
									}
									
                                    log.error('POST', 'Couldn\'t save PO for vendor ' + vendor + ' and currency ' + currency + '. - Error: ' + e.toString());
                                }
                            }
						
                            
                        } else {
                            var message = theForm.addField({
                                id: orderlib.SLField.MESSAGE,
                                type: ui.FieldType.INLINEHTML,
                                label: 'Error'
                            });
                            message.defaultValue = '<p>' + orderlib.ErrorMessage.MISSING_PO_FORM_ID + '</p>';
                        }
                    }
                } else {
                    var message = theForm.addField({
                        id: orderlib.SLField.MESSAGE,
                        type: ui.FieldType.INLINEHTML,
                        label: 'Error'
                    });
                    message.defaultValue = '<p>' + orderlib.ErrorMessage.MISSING_REQUISITION_ID + '</p>';
                }
                
                context.response.writePage(theForm);
            }

            return {
                onRequest: onRequest
            };

        });
