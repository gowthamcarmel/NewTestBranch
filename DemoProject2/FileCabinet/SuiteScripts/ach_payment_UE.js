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
        var customer =  customerRecord.getValue('entity');
        var classs =  customerRecord.getValue('class'); 
            	
        log.debug({
			details : 'customer  :' + customer
		});
        log.debug({
			details : 'classs  :' + classs
		});
            

			// searching b

			var bankMatrixSearch = search.load({
				id : '7471'
			});
			var MyFilters = search.createFilter({
				name : 'custrecord_ach_customer',
				operator : 'is',
				values : customer
			});
			var MyFilters1 =search.createFilter({
			name : 'custrecord_ach_product',
				operator : 'is',
				values : classs
				
			});

		bankMatrixSearch.filters.push(MyFilters);
		bankMatrixSearch.filters.push(MyFilters1);

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
		   var	achenabled = bankMatrixSearchsearchResult[i].getValue({
				name : 'custrecord_ach_enabled'
			});
			
			
			log.debug(' achenabled :' + achenabled);
		//	log.debug(' invoiceid :' + invoiceid);
            customerRecord.setValue('custbody_ach_payment', achenabled);
//break;
        }
			}
			else{
				   //customerRecord.setValue('custbody_ach_payment', 'No bank matrix found');
				}
			}
     
        return {
          
            beforeSubmit: beforeSubmit
      
        };
			}
);
