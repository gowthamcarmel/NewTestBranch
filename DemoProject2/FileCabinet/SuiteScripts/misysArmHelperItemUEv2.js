/**
 * @NApiVersion 2.x
 * @NScriptType UserEventScript
 */
define(['N/record', 'N/runtime', 'N/search', 'N/error'],
    function (record, runtime, search){
        function setItemForecastRule(context){
          	if(context.type == context.UserEventType.CREATE){
          
            var rec = context.newRecord;

			// check direct posting
          var directpost = rec.getValue('directrevenueposting');
          
          if(directpost != 'T'){
          var ruleNameID = rec.getValue('revrecschedule');

			if(ruleNameID != ''){
				var ruleName = rec.getText('revrecschedule');
				if(ruleName){
					var internalID = _genericSearch('revenuerecognitionrule', 'name', ruleName);
					//var rule = nlapiGetFieldValue('revenuerecognitionrule');
					rec.setValue({ fieldId: 'revenuerecognitionrule', value: internalID });
					rec.setValue({ fieldId: 'revrecforecastrule', value: internalID });
				}
            }}}
		}

		function _genericSearch(table, fieldToSearch, valueToSearch){
			var internalID=0;

			try{
				var attSearch = search.create({
					type: table,
					columns: [{
						name: 'internalid'
					}],
					filters: [{
						name: fieldToSearch, operator: 'is', values: [valueToSearch]
					}]
				});

				var searchResults = attSearch.run().getRange({ start: 0, end: 100 });
				for (var i = 0; i < searchResults.length; i++) {
					internalID = searchResults[i].getValue({ name: 'internalid' });
				}

			}catch(e){
				_errorHandler("genericSearch", e);
			}     	      

			return internalID;
		}

		function _errorHandler(errorSource, e){
			var errorMessage='';
			log.error( 'unexpected error: ' + errorSource , e.message);
			return errorMessage;
		}

		return {
            beforeSubmit: setItemForecastRule
        };
	}
);

