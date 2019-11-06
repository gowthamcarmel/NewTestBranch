/**
 *@NApiVersion 2.x
 *@NScriptType ClientScript
 */
define(['N/error','N/search', 'N/currentRecord', 'N/runtime','N/util', 'N/https', 'N/ui/dialog', 'N/url'],
    function(error, search, currentRecord, runtime, util, https, dialog, url) {
        
        function saveRecord(context) 
        {
        	var currentRec = currentRecord.get();
        	var numLines = currentRec.getLineCount({
        	    sublistId: 'custpage_machine'
        	});
        	
        	var selCnt = 0;
        	var MarkedInvoiceList = '';
        	
        	for(var i=0;i<numLines;i++)
        	{
        		var sublistFieldValue2;
        		
        		var sublistFieldValue1 = currentRec.getSublistValue({
            	    sublistId: 'custpage_machine',
            	    fieldId: 'custpage_select',
            	    line: i
            	});
        		
        		//currentRec.setValue({fieldId: 'custpage_invoice_ids', value: sublistFieldValue1});
        		
        		if(sublistFieldValue1 == true)
        		{
        			sublistFieldValue2 = currentRec.getSublistValue({
                	    sublistId: 'custpage_machine',
                	    fieldId: 'custpage_records',
                	    line: i
                	});
        			
        			//currentRec.setValue({fieldId: 'custpage_invoice_ids', value: sublistFieldValue2});
        			
        			if(MarkedInvoiceList == '')
        			{
        				MarkedInvoiceList = sublistFieldValue2;
        			}
        			else
        			{
        				MarkedInvoiceList = MarkedInvoiceList + ',' + sublistFieldValue2;
        			}
        			
        			++selCnt;
        			 
        		}
        	}
        	
        	currentRec.setValue({fieldId: 'custpage_invoice_ids', value: MarkedInvoiceList});
        	currentRec.setValue({fieldId: 'custpage_selected_line_count', value: selCnt});
        	
        	
            /*var currentRecord = context.currentRecord;
            if (!currentRecord.getValue({
                    fieldId: 'entity'
                }) || currentRecord.getLineCount({
                    sublistId: 'item'
                }) < 1)
                throw error.create({
                    name: 'MISSING_REQ_ARG',
                    message: 'Please enter all the necessary fields on the salesorder before saving'
                });*/
            return true;
        }
       
       function fieldChanged(context)
        {/*
            var currentRecord = context.currentRecord;
            log.debug('currentRecord', currentRecord);
            
            var sublistName = context.custpage_machine;
            log.debug('currentRecord', currentRecord);
            
            var sublistFieldName = context.custpage_select;
            log.debug('currentRecord', currentRecord);
            
            var line = context.line;
            if (sublistName === 'custpage_machine' && sublistFieldName === 'custpage_select')
            {
            	currentRecord.setValue({
                    fieldId: 'custpage_invoice_ids',
                    value: 'Item: ' + currentRecord.getCurrentSublistValue({
                        sublistId: 'item',
                        fieldId: 'item'
                    }) + ' is selected'
                });
            }
               */ 
        }
        
       function searchAgain()
       {
    	   
    	   var currentRec = currentRecord.get();
    	   var FromDate = currentRec.getValue({fieldId: 'custpage_invoice_from_date'});
    	   var ToDate = currentRec.getValue({fieldId: 'custpage_invoice_to_date'});
    	   
    	   /*var Parameters = FromDate +','+ToDate;
    	   
    	   var output = url.resolveScript({
    		    scriptId: 'customscript_gms_suitelet',
    		    deploymentId: 'customdeploy_gms_suitelet',
    		    returnExternalUrl: true,
    		    params : Parameters
    		});*/
    	   
    	   /*redirect.toSuitelet({
    		    scriptId: 'customscript_gms_suitelet',
    		    deploymentId: 'customdeploy_gms_suitelet',
    		    isExternal : true,
    		    parameters: {'custpage_invoice_from_date':FromDate, 'custpage_invoice_to_date':ToDate} 
    		});*/
    	   
	       	/*var context = nlapiGetContext();
	       	var searchURL = nlapiResolveURL('SUITELET','customscript_misys_gms_createinvoices_ss','customdeploy1');
	
	       	var FromDate = nlapiGetFieldValue('custpage_from_date');
	       	if(!g.isEmpty(FromDate))
	       		searchURL+='&custscript_gms_from_date='+FromDate;
	
	       	var Todate = nlapiGetFieldValue('custpage_to_date');
	       	if(!g.isEmpty(Todate))
	       		searchURL+='&custscript_gms_to_date='+Todate;
	
	       	window.ischanged=false;
	       	window.location=searchURL;*/
       }

        return {
            fieldChanged: fieldChanged,
            saveRecord: saveRecord,
            searchAgain: searchAgain
        };
    });