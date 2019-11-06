/**
 * @NApiVersion 2.x
 * @NScriptType UserEventScript
 */
define(['N/record', 'N/runtime', 'N/search', 'N/error'],
    function (record, runtime, search){
        function erMisysHelper(context){ if ( (context.type == context.UserEventType.CREATE) || (context.type == context.UserEventType.EDIT) || (context.type == context.UserEventType.XEDIT) ){          
            var rec = context.newRecord;
            var recObj = record.load({ type: rec.type, id: rec.id });
			
			var oaErNum = recObj.getText('custbody_oa_expense_report_number');

			if( oaErNum ){
				// check subsidiary first two letters
				var subsField = recObj.getText('subsidiary').substr(0,2).replace('UK','GB');
				
				// search for tax code with 'VAT_{subsMnemonic}'' and 'Zero Rate' on name			
				var taxId = _taxCodeSearch( subsField );
 				
 				// special cases: MX, SA, US, IN
 				if( subsField == 'MX' ){ taxId = '340'; }
 				if( subsField == 'SA' ){ taxId = '1205'; }
 				if( subsField == 'US' ){ taxId = '-7'; }
 				if( subsField == 'IN' ){ taxId = '6509'; }
 				if( subsField == 'CO' ){ taxId = '257'; }
 				if( subsField == 'JP' ){ taxId = '1281'; }
 				if( subsField == 'CA' ){ taxId = '830'; }
 				if( subsField == 'SE' ){ taxId = '30008'; }

 				// set tax on lines
 				if( taxId != 0 ){
	 				var expenseCount = recObj.getLineCount('expense');
 					var submitNeeded = 0;
 					for( var i = 0; i < expenseCount; i++){
 						recObj.setSublistValue({ sublistId: 'expense', fieldId: 'taxcode', line: i,  value: taxId });
 						submitNeeded++;
 					}
 				}

 				if(submitNeeded > 0){ var currRecId = recObj.save(); } 
        	}
        }}

        function erMisysBeforeSubmitHelper(context){ if ( (context.type == context.UserEventType.CREATE) || (context.type == context.UserEventType.EDIT) || (context.type == context.UserEventType.XEDIT) ){ 

        	var rec = context.newRecord;
        	var oaErNum = rec.getValue('custbody_oa_expense_report_number');

			if( oaErNum ){
				var subsField = rec.getValue('subsidiary');
				if( subsField == 127 ){ 
					taxId = '830'; 
					// Canada override
	 				var expenseCount = rec.getLineCount('expense');
 					var submitNeeded = 0;
 					for( var i = 0; i < expenseCount; i++){
 						rec.setSublistValue({ sublistId: 'expense', fieldId: 'taxcode', line: i,  value: taxId });
 						submitNeeded++;
 					}
 				}
			}
        }}

        function _taxCodeSearch(subsField){
			var internalID=0;
			var taxName = '';
			try{
				var attSearch = search.load({
					id: 'customsearch_msys_tax_code_srch'
				});

				var searchResults = attSearch.run().getRange({ start: 0, end: 250 });
				for (var i = 0; i < searchResults.length; i++) {
					taxName = searchResults[i].getValue({ name: 'itemid' });
					if( taxName ){
					if( taxName.indexOf(subsField) >= 0 ){
						internalID = searchResults[i].getValue({ name: 'internalid' });
					}}
				}
			}catch(e){
				_errorHandler("taxCodeSearch", e);
			}     	      

			return internalID;
		}

		function _errorHandler(errorSource, e){
			var errorMessage='';
			log.error( 'unexpected error: ' + errorSource , e.message);
			return errorMessage;
		}

        return {
            beforeSubmit: erMisysBeforeSubmitHelper,
            afterSubmit: erMisysHelper
        };
    }
);
