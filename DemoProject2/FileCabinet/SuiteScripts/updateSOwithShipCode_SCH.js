/**
 * @NApiVersion 2.x
 * @NScriptType ScheduledScript
 * @NModuleScope SameAccount
 */
define(['N/record', 'N/search', 'N/transaction','N/runtime'],
/**
 * @param {record} record
 * @param {search} search
 * @param {transaction} transaction
 */
function(record, search, transaction,runtime) {
   
    /**
     * Definition of the Scheduled script trigger point.
     *
     * @param {Object} scriptContext
     * @param {string} scriptContext.type - The context in which the script is executed. It is one of the values from the scriptContext.InvocationType enum.
     * @Since 2015.2
     */
    function execute(scriptContext) {
    	
    	//
    	var scriptObj = runtime.getCurrentScript();
    	
    	var ChangeFrom = scriptObj.getParameter({
			name : 'custscript_shipcode_changefrom'
		});
		var ChangeTo = scriptObj.getParameter({
			name : 'custscript_shipcode_changeto'
		});
		var UpdateItem = scriptObj.getParameter({
			name : 'custscript_update_item'
		});

		log.debug({
			details : 'SOVOS SO Update : ChangeFrom :' + ChangeFrom
		});
		log.debug({
			details : 'SOVOS SO Update :ChangeTo :' + ChangeTo
		});
		log.debug({
			details : 'SOVOS SO Update :UpdateItem :' + UpdateItem
		});
		
		//
		try {
			
			
			if(UpdateItem == true)
			{
			
				var itemSearch = search.load({
							id : 'customsearch_item_ship_code'
						});
						var MyFilters = search.createFilter({
							name : 'custitem_ship_from_code',
							operator : 'is',
							values : ChangeFrom
						})
						var MyFilters1 = search.createFilter({
							name : 'custitem_onetime_deleivery_sovos',
							operator : 'is',
							values : false
						})

					itemSearch.filters.push(MyFilters);
					
					itemSearch.filters.push(MyFilters1);

						var itemSearchResult = itemSearch.run().getRange(
								{
									start : 0,
									end : 100
								});
						if(itemSearchResult)
						{
								

						log.debug({
							details : 'itemSearchResult len  :'
									+ itemSearchResult.length
						});
						for (var i = 0; i < itemSearchResult.length; i++) {
							itemID = itemSearchResult[i].getValue({
								name : 'internalid'
							});
							
							log.debug(' itemID :' + itemID);
							// updating journal id in revenue elemnt

							var recObj = record.load({
								type : 'serviceitem',
								id : itemID,
								isDynamic: false
							});
							
							recObj.setValue({
                           fieldId: 'custitem_ship_from_code',
                            value: ChangeTo	});		

                            recObj.setValue({
                           fieldId: 'custitem_update_sfdc_sovos',
                            value: true									
						
							
						});
						
							var recordId = recObj.save();
							
							log.debug({
							details : 'itemrecordId :'
									+recordId
						});
								}
			}
			}
			
								
			
			var filters = [];

			var filterHeaderId = search.createFilter({
				name : 'custcol_ship_from_code',
				operator : search.Operator.ANYOF,
				values : ChangeFrom
			});
			var oneTimeVendor	 = search.createFilter({
				name : 'custcol_onetime_deleivery_sovos',
				operator : search.Operator.IS,
				values : false
			});
			filters.push(filterHeaderId);
			filters.push(oneTimeVendor);

			var s = search.create({
				type : 'salesorder',

				columns : [ {
					name : 'internalid'
				}, {
					name : 'custcol_ship_from_code'
				},  ],
				filters : filters
			});
			var results = s.run().getRange({
				start : 0,
				end : 1000
			});

			log.debug({
				title : 'Debug Entry',
				details : 'results.length :' + results.length,
			});
			
			//
			
			if(results)
			{
			for (var i = 0; i < results.length; i++) {
				soID = results[i].getValue({
					name : 'internalid'
				});
				
				log.debug(' soID :' + soID);
				// updating journal id in revenue elemnt

				var recObj = record.load({
					type : 'salesorder',
					id : soID,
					isDynamic: false
				});

				var itemCount = recObj
						.getLineCount('item');

				log.debug('itemCount:' + itemCount);

				for (var i = 0; i < itemCount; i++) {
					
					
						 var oldshipvalue = recObj.getSublistValue({
						    sublistId: 'item',
						    fieldId: 'custcol_ship_from_code',
						    line: i});
					var onetime = recObj.getSublistValue({
						    sublistId: 'item',
						    fieldId: 'custcol_onetime_deleivery_sovos',
						    line: i});		
					if(oldshipvalue == ChangeFrom )
						{
						if(	onetime == false)
						{
					recObj.setSublistValue({
						sublistId : 'item',
						fieldId : 'custcol_ship_from_code',
						line : i,
						value : ChangeTo
					});
						}
						}		

				}

				var currRecId = recObj.save();
				log.debug(' currRecId submitted :' + currRecId);

			}
			
			var recObjj = record.load({
					type : 'customrecord_ship_from',
					id : ChangeTo,
					isDynamic: false
				});
				
				  recObjj.setValue({
                           fieldId: 'custrecord_ship_from_update_so',
				            value: false});
					recObjj.setValue({
                           fieldId: 'custrecord_ship_from_change_from',
				            value: ''});
				
			var currRecIdd = recObjj.save();
				log.debug(' currRecIdd submitted :' + currRecIdd);
			
			}
			
			
			
			
			
			
		}catch(e)
		{
			log.debug({
				title : 'Debug Entry',
				details : 'Error:' + e.toString(),
			});
		}
    }
	
    return {
        execute: execute
    };
    
});