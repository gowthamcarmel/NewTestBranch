/**
 * @NApiVersion 2.x
 * @NAmdConfig ./Finastra_FRD-PTP-210.json
 * @NScriptType ClientScript
 * @NModuleScope Public
 */
define(['orderlib', 'N/currentRecord', 'N/ui/dialog', 'N/record', 'N/url'],
    /**
     * @param {object} orderlib
     * @param {object} currentRecord
     * @param {object} dialog
     */
        function (orderlib, currentRecord, dialog, record, url) {
            
            var selectedLines = [];
			var SelectAllLinesCheck = false;
            var vendorCurrencies = {};
            var currencies = {};

            /**
             * Function to be executed after page is initialized.
             *
             * @param {Object} scriptContext
             */
            function pageInit(scriptContext) {
                selectedLines = [];
                var strVendorCurrencies = scriptContext.currentRecord.getValue({
                    fieldId: orderlib.SLField.VENDOR_CURRENCIES
                });
				
                if (strVendorCurrencies) vendorCurrencies = JSON.parse(strVendorCurrencies);
                var strCurrencies = scriptContext.currentRecord.getValue({
                    fieldId: orderlib.SLField.CURRENCIES
                });
                if (strCurrencies) currencies = JSON.parse(strCurrencies);
                var lineCount = scriptContext.currentRecord.getLineCount({
                    sublistId: orderlib.SLSublist.LINES
                });
                for (var i = 0; i < lineCount; i++) {
                    var colField = scriptContext.currentRecord.getSublistField({
                        sublistId: orderlib.SLSublist.LINES,
                        fieldId: orderlib.SLColumn.VENDOR_CURRENCY_AMOUNT,
                        line: i
                    });
                    colField.isDisabled = true;
                }
            }

            /**
             *
             * @param {Object} scriptContext
             */
            function fieldChanged(scriptContext) {
                var checkVendor = function() {
                    var result = true;
                    var vendor = scriptContext.currentRecord.getSublistValue({
                        sublistId: orderlib.SLSublist.LINES,
                        fieldId: orderlib.SLColumn.VENDOR,
                        line: scriptContext.line
                    });
                    if (!vendor || vendor === orderlib.Value.EMPTY) {
                        dialog.alert({
                            title: 'Vendor required',
                            message: 'Please select a Vendor'
                        });
                        result = false;
                    }
                    return result;
                };
                var checkCurrency = function() {
                    var result = true;
                    var currency = scriptContext.currentRecord.getSublistValue({
                        sublistId: orderlib.SLSublist.LINES,
                        fieldId: orderlib.SLColumn.VENDOR_CURRENCY,
                        line: scriptContext.line
                    });
                    if (!currency) {
                        dialog.alert({
                            title: 'Currency required',
                            message: 'Please select a Vendor Currency'
                        });
                        result = false;
                    }
                    return result;
                };
                var checkVendorAndCurrency = function() {
                    var result = checkVendor();
                    if (result === true) result = checkCurrency();
                    return result;
                };
                if (scriptContext.fieldId === orderlib.SLColumn.SELECTED) {
                    var selected = scriptContext.currentRecord.getSublistValue({
                        sublistId: orderlib.SLSublist.LINES,
                        fieldId: scriptContext.fieldId,
                        line: scriptContext.line
                    });
					//-------------
					/*if(selected){
						SelectAllLinesCheck = true;
					}
					else{
						SelectAllLinesCheck = false;
					}*/
					//-------------
                    if (selected && !checkVendorAndCurrency()) {
                        scriptContext.currentRecord.setCurrentSublistValue({
                        sublistId: orderlib.SLSublist.LINES,
                        fieldId: scriptContext.fieldId,
                            value: false,
                            ignoreFieldChange: true
                        });
                    } else {
                        var index = selectedLines.indexOf(scriptContext.line);
						/*dialog.alert({
                            title: 'scriptContext.line',
                            message: scriptContext.line
                        });
						dialog.alert({
                            title: 'index',
                            message: index
                        });
						dialog.alert({
                            title: 'selected',
                            message: selected
                        });*/
                        if (selected && index < 0) {
                            selectedLines.push(scriptContext.line);
                        } else if (!selected && index >= 0) {
                            selectedLines.splice(index, 1);
                        }
                    }
                } else if (scriptContext.fieldId === orderlib.SLColumn.SELECT_CURRENCY) {
                    if (checkVendor()) {
                        var vendor = scriptContext.currentRecord.getSublistValue({
                            sublistId: orderlib.SLSublist.LINES,
                            fieldId: orderlib.SLColumn.VENDOR,
                            line: scriptContext.line
                        });
                        var currencyIds = vendorCurrencies[vendor] ? vendorCurrencies[vendor] : [];
                        var currencySymbols = [];
                        for (var i = 0; i < currencyIds.length; i++) {
                            currencySymbols.push(currencies[currencyIds[i]]);
                        }
                        var suiteletUrl = scriptContext.currentRecord.getValue({
                            fieldId: orderlib.SLField.CURRENCY_PICKER_URL
                        });
                        var windowName = 'CURRENCY_PICKER' + new Date().getTime();
                        var cpForm = document.createElement('form');
                        cpForm.target = windowName;
                        cpForm.method = 'POST';
                        cpForm.action = suiteletUrl;
                        var currIdsField = document.createElement('input');
                        currIdsField.type = 'hidden';
                        currIdsField.name = orderlib.CurrSLField.CURRENCY_IDS;
                        currIdsField.value = JSON.stringify(currencyIds);
                        cpForm.appendChild(currIdsField);
                        var currSymField = document.createElement('input');
                        currSymField.type = 'hidden';
                        currSymField.name = orderlib.CurrSLField.CURRENCY_SYMBOLS;
                        currSymField.value = JSON.stringify(currencySymbols);
                        cpForm.appendChild(currSymField);
                        document.body.appendChild(cpForm);
                        window.open('', windowName, "resizable=yes, scrollbars=yes, titlebar=yes, width=400, height=600, top=10, left=150");
                        cpForm.submit();
                    }
                    scriptContext.currentRecord.setCurrentSublistValue({
                        sublistId: orderlib.SLSublist.LINES,
                        fieldId: scriptContext.fieldId,
                        value: false,
                        ignoreFieldChange: true
                    });
                } else if (scriptContext.fieldId === orderlib.SLColumn.VENDOR) {
                    scriptContext.currentRecord.setCurrentSublistValue({
                        sublistId: orderlib.SLSublist.LINES,
                        fieldId: orderlib.SLColumn.VENDOR_CURRENCY,
                        value: ''
                    });
                    var vendor = scriptContext.currentRecord.getSublistValue({
                        sublistId: orderlib.SLSublist.LINES,
                        fieldId: orderlib.SLColumn.VENDOR,
                        line: scriptContext.line
                    });
                    if (!vendor || vendor === orderlib.Value.EMPTY) {
                        scriptContext.currentRecord.setCurrentSublistValue({
                            sublistId: orderlib.SLSublist.LINES,
                            fieldId: orderlib.SLColumn.SELECTED,
                            value: false
                        });
                    } else {
                        if (!vendorCurrencies[vendor]) {
                            vendorCurrencies[vendor] = orderlib.getVendorCurrencies(vendor);
                        }
                    }
                } else if (scriptContext.fieldId === orderlib.SLColumn.VENDOR_CURRENCY_RATE ||
                    scriptContext.fieldId === orderlib.SLColumn.QUANTITY) {
                    var qty = parseFloat(scriptContext.currentRecord.getSublistValue({
                        sublistId: orderlib.SLSublist.LINES,
                        fieldId: orderlib.SLColumn.QUANTITY,
                        line: scriptContext.line
                    }));
                    var rate = parseFloat(scriptContext.currentRecord.getSublistValue({
                        sublistId: orderlib.SLSublist.LINES,
                        fieldId: orderlib.SLColumn.VENDOR_CURRENCY_RATE,
                        line: scriptContext.line
                    }));
                    var amount = '';
                    if (!(isNaN(qty) || isNaN(rate))) amount = qty * rate;
                    scriptContext.currentRecord.setCurrentSublistValue({
                        sublistId: orderlib.SLSublist.LINES,
                        fieldId: orderlib.SLColumn.VENDOR_CURRENCY_AMOUNT,
                        value: amount,
                        ignoreFieldChange: true
                    });
                    scriptContext.currentRecord.setCurrentSublistValue({
                        sublistId: orderlib.SLSublist.LINES,
                        fieldId: 'test',
                        value: amount,
                        ignoreFieldChange: true
                    });
                }
            }

            /**
             *
             * @param {Object} scriptContext
             */
            function saveRecord(scriptContext) {
                var valid = true;
				/*dialog.alert({
                        title: 'SelectAllLinesCheck',
                        message: SelectAllLinesCheck
                    });*/
                //if (SelectAllLinesCheck === false){
				if (selectedLines.length === 0) {
						dialog.alert({
                        title: 'Selection required',
                        message: 'Please select at least 1 line item'
                    });
                    valid = false;
					}
                    
                //} 
				else {
                    
					//------------------------
					//if (SelectAllLinesCheck === true) {
						
						/*var rec = currentRecord.get();
						var lineCount = rec.getLineCount({
							sublistId: orderlib.SLSublist.LINES
						});
						dialog.alert({
								title: 'Total Line Count',
								message: lineCount
							});
						for (var i = 0; i < lineCount; i++) {
							rec.selectLine({
								sublistId: orderlib.SLSublist.LINES,
								line: i
							});
							rec.setCurrentSublistValue({
								sublistId: orderlib.SLSublist.LINES,
								fieldId: orderlib.SLColumn.SELECTED,
								value: true
							});
							rec.commitLine({
								sublistId: orderlib.SLSublist.LINES
							});*/
							/*var temp = i + 1;
							dialog.alert({
								title: 'temp',
								message: temp
							});
							selectedLines.push(temp);*/
							
							
						//}
						
						/*var lineCount = scriptContext.currentRecord.getLineCount({
						sublistId: orderlib.SLSublist.LINES
						//fieldId: orderlib.SLColumn.LINE_ID
						});
						for (var i = 0; i < lineCount; i++) {
							
							var temp = i + 1;
							selectedLines.push(temp);
						}*/
					//}
					//-------------------------------
					
					var selectedData = {};
                    for (var i = 0; i < selectedLines.length; i++) {
                        var vendor = scriptContext.currentRecord.getSublistValue({
                            sublistId: orderlib.SLSublist.LINES,
                            fieldId: orderlib.SLColumn.VENDOR,
                            line: selectedLines[i]
                        });
                        var vendorCurrency = scriptContext.currentRecord.getSublistValue({
                            sublistId: orderlib.SLSublist.LINES,
                            fieldId: orderlib.SLColumn.VENDOR_CURRENCY,
                            line: selectedLines[i]
                        });
                        var key = vendor + orderlib.Data.SEPARATOR + vendorCurrency;
                        if (!selectedData[key]) selectedData[key] = [];
                        var dataLine = {};
                        var lineId = scriptContext.currentRecord.getSublistValue({
                            sublistId: orderlib.SLSublist.LINES,
                            fieldId: orderlib.SLColumn.LINE_ID,
                            line: selectedLines[i]
                        });
                        var item = scriptContext.currentRecord.getSublistValue({
                            sublistId: orderlib.SLSublist.LINES,
                            fieldId: orderlib.SLColumn.ITEM,
                            line: selectedLines[i]
                        });
                        var vendorCurrencyRate = scriptContext.currentRecord.getSublistValue({
                            sublistId: orderlib.SLSublist.LINES,
                            fieldId: orderlib.SLColumn.VENDOR_CURRENCY_RATE,
                            line: selectedLines[i]
                        });
                        var vendorCurrencyAmount = scriptContext.currentRecord.getSublistValue({
                            sublistId: orderlib.SLSublist.LINES,
                            fieldId: orderlib.SLColumn.VENDOR_CURRENCY_AMOUNT,
                            line: selectedLines[i]
                        });
                        var quantity = scriptContext.currentRecord.getSublistValue({
                            sublistId: orderlib.SLSublist.LINES,
                            fieldId: orderlib.SLColumn.QUANTITY,
                            line: selectedLines[i]
                        });
                        dataLine[orderlib.Data.REQ_LINE] = lineId;
                        dataLine[orderlib.Data.ITEM] = item;
                        dataLine[orderlib.Data.VENDOR_CURRENCY] = vendorCurrency;
                        dataLine[orderlib.Data.VENDOR_CURRENCY_RATE] = vendorCurrencyRate;
                        dataLine[orderlib.Data.VENDOR_CURRENCY_AMOUNT] = vendorCurrencyAmount;
                        dataLine[orderlib.Data.QUANTITY] = quantity;
                        selectedData[key].push(dataLine);
                    }
                    scriptContext.currentRecord.setValue({
                        fieldId: orderlib.SLField.DATA,
                        value: JSON.stringify(selectedData),
                        ignoreFieldChange: true
                    });
                }
                return valid;
            }
            
            function selectAll(select) {
                
				SelectAllLinesCheck = select;
				/*dialog.alert({
                        title: 'SelectAllLinesCheck',
                        message: select
                    });*/
				var rec = currentRecord.get();
                var lineCount = rec.getLineCount({
                    sublistId: orderlib.SLSublist.LINES
                });
                for (var i = 0; i < lineCount; i++) {
                    rec.selectLine({
                        sublistId: orderlib.SLSublist.LINES,
                        line: i
                    });
                    rec.setCurrentSublistValue({
                        sublistId: orderlib.SLSublist.LINES,
                        fieldId: orderlib.SLColumn.SELECTED,
                        value: select
                    });
                    rec.commitLine({
                        sublistId: orderlib.SLSublist.LINES
                    });
					//--------------------------
					//var temp = i + 1;
					if(select == true)
					{
						selectedLines.push(i);
					}
					else
					{
						selectedLines.pop(i);
					}
					
                }
            }
			
		//	function Back(requisitionId){
		//		
		//		/*dialog.alert({
        //               title: 'requisitionId',
        //               message: requisitionId
        //           });*/
		//		record.submitFields({ type: record.Type.PURCHASE_REQUISITION, id: requisitionId, values: { custbody_order_requisition_flag: false} });
		//			
		//		var scheme = 'https://';
		//		var host = url.resolveDomain({
		//			hostType: url.HostType.APPLICATION
		//		});
		//		var relativePath = url.resolveRecord({
		//			recordType: record.Type.PURCHASE_REQUISITION,
		//			recordId: requisitionId,
		//			isEditMode: false
		//		});
		//		var output = scheme + host + relativePath;
		//		/*dialog.alert({
		//			title: 'output',
		//			message: output
		//		});*/
		//		window.location=output;
		//		
        //   }
		//
           return {
               pageInit: pageInit,
               fieldChanged: fieldChanged,
               saveRecord: saveRecord,
               selectAll: selectAll,
				//Back: Back
           };

        });
