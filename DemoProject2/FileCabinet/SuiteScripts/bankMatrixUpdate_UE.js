/**
 * Module Description
 * 
 * Version    Date            Author           Remarks
 * 1.00       19 Jun 2018     gowthamr
 *
 */

/**
 *@NApiVersion 2.x
 *@NScriptType UserEventScript
 */
define(['N/search','N/record'],
    function(search ,record) {
     
        function beforeSubmit(context) {
            if (context.type !== context.UserEventType.CREATE && context.type !== context.UserEventType.EDIT)
                return;
            var customerRecord = context.newRecord;
        var subsidiary =  customerRecord.getValue('subsidiary');
        var currency =  customerRecord.getValue('currency'); 
		 var DOClanguage =  customerRecord.getValue('custbody_printing_profile'); 
            	
        log.debug({
			details : 'subsidiary  :' + subsidiary
		});
        log.debug({
			details : 'currency  :' + currency
		});
		 log.debug({
			details : 'DOClanguage  :' + DOClanguage
		});
            
            

			// searching b

			var bankMatrixSearch = search.load({
				id : '7253'
			});
			var MyFilters = search.createFilter({
				name : 'custrecord_bm_subsidiary',
				operator : 'is',
				values : subsidiary
			});
			var MyFilters1 =search.createFilter({
			name : 'custrecord_bm_trans_currency',
				operator : 'is',
				values : currency
				
			});
			var MyFilters2 =search.createFilter({
			name : 'custrecord_doc_printing_lang',
				operator : 'is',
				values : DOClanguage
				
			});

		bankMatrixSearch.filters.push(MyFilters);
		bankMatrixSearch.filters.push(MyFilters1);
		bankMatrixSearch.filters.push(MyFilters2);

			var bankMatrixSearchsearchResult = bankMatrixSearch.run().getRange(
					{
						start : 0,
						end : 1
					});
			
			if(bankMatrixSearchsearchResult)
			{

		log.debug({
			details : 'bankMatrixSearchsearchResult len  :'
					+ bankMatrixSearchsearchResult.length
		});
		for (var i = 0; i < bankMatrixSearchsearchResult.length; i++) {
		   var	invoicetext = bankMatrixSearchsearchResult[i].getValue({
				name : 'custrecord_bm_invoice_text'
			});
			 var	invoiceid = bankMatrixSearchsearchResult[i].getValue({
				name : 'internalid'
			});
			
			log.debug(' invoicetext :' + invoicetext);
			log.debug(' invoiceid :' + invoiceid);
            customerRecord.setValue('custbody_bank_matrix', invoicetext);
//break;
        }
			}
			else{
				   customerRecord.setValue('custbody_bank_matrix', 'No bank matrix found');
				}
			}
     
        return {
          
            beforeSubmit: beforeSubmit
      
        };
			}
);
