/**
 * @NApiVersion 2.x
 * @NScriptType WorkflowActionScript
 */

define(['N/task','N/runtime','N/search','N/record'],
    function(task,runtime,search,record) {
        function onAction(scriptContext) {
            log.debug({
                title: 'Start Script'
            });
            var newRecord = scriptContext.newRecord;
            var HeaderInternalID = newRecord.id;
            log.debug({
                title: 'HeaderInternalID', 
                details: HeaderInternalID
            });
          
           
           

            
            /*var CORecord = record.load({
			    type: 'customrecord_new_deals',
			       id:HeaderInternalID,
			       isDynamic: false                       
			   });
		 
          
            */
            
            var milestoneagg =getProjectTask(HeaderInternalID);
        	  
          log.debug({
              title: 'milestoneagg', 
              details: milestoneagg
          });
            
          
          var otherId = record.submitFields({
      		type:'customrecord_new_deals' ,
      		id: HeaderInternalID,
      		values: {
      			'custrecord_milestone_aggr': milestoneagg
      		}
      	});
          
//          CORecord.setValue({
//      	    fieldId: 'custrecord_milestone_aggr',
//      	 	value :milestoneagg
//        });
//          
//        
//          
//          CORecord.save();
//            log.debug({
//                title: 'End Script'
//            });
         //   return 1;
            
            
            
            function getProjectTask(dealid){
           	 try{
           		 log.debug('getProjectTask - start');
           		 log.debug('dealid - start',dealid);
           	    	var searchObj = search.load({id : 'customsearch_nd_projecttask'});
           	    	log.debug('getInputData - ',searchObj);
           	    	
           	    		
           	    		var MyFilters = search.createFilter({
           					name : 'custrecord_nd_prj',
           					operator : 'is',
           					values : dealid
           				})

           			searchObj.filters.push(MyFilters);

           				var searchResult1 = searchObj.run().getRange({
           					start : 0,
           					end : 100
           				});
           			
           				log.debug({
           					details : 'searchResult1 len  :'
           							+ searchResult1.length
           				});
           				var agg=0;
           				for(var i=0;i<searchResult1.length;i++)
           					{
           					agg += searchResult1[i].getValue({
           		             name: 'custrecord_nditems_amount'
           		         })
           					}
           				
           				log.debug('agg - ',agg);
           				return agg;
           				
           				
           	 }
           	 catch(e)
           	 {
           		 log.debug('getlgetProjectTaskineitems - Error',e.toString());
           	 }
            }

        }
        return {
            onAction: onAction
        }
    });