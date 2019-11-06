/**
 * @NApiVersion 2.x
 * @NScriptType MapReduceScript
 * @NModuleScope SameAccount
 */
define(['N/email', 'N/record', 'N/runtime', 'N/search','N/format'],
/**
 * @param {email} email
 * @param {record} record
 * @param {runtime} runtime
 * @param {search} search
 */
function(email, record, runtime, search, format) {
   
    /**
     * Marks the beginning of the Map/Reduce process and generates input data.
     *
     * @typedef {Object} ObjectRef
     * @property {number} id - Internal ID of the record instance
     * @property {string} type - Record type id
     *
     * @return {Array|Object|Search|RecordRef} inputSummary
     * @since 2015.1
     */
    function getInputData() {
    	
    	log.debug('getInputData - start');
    	
    
    	//get the Project details
    	
    	var searchObj = search.load({id : 'customsearch_app_project_request'});
    	log.debug('getInputData - ',searchObj);
    	log.debug('getInputData - end');
    		return searchObj;
    		
    }

    /**
     * Executes when the map entry point is triggered and applies to each key/value pair.
     *
     * @param {MapSummary} context - Data collection containing the key/value pairs to process through the map stage
     * @since 2015.1
     */
    function map(context) {
    	log.debug('map - start');
    	var searchResult = JSON.parse(context.value);
    	var SOCustId = searchResult.id; 
    
    	
    	log.debug('SOCustId',SOCustId);
    
    	//Get Project ID
    	if(SOCustId){
    	var newSO = CreatePSSO(SOCustId);//Method to create JE using Project ID

    	}
    	if(newSO){

    	//This will add comments to context which will be fetched in summary 
    	                 context.write(SOCustId, newSO); //Key-Value pair
    	}
    	
    	log.debug('map - End');
    	}

    
 function CreatePSSO(SOCustId){
	 try{
		 
		 var Prjtaskids =[];
		 var cbsids =[];
		 
		log.debug('Create Project - start');
		
		 var PRRequest = record.load({
			    type: 'customrecord_project_request',
			       id:SOCustId,
			       isDynamic: false                       
			   });
		 
		 
	 
		log.debug('Create Project - Start');
		
	
         var Project = record.create({
             type: 'job', 
             isDynamic: true,
            
         });
         
         Project.setValue({
     		fieldId :'companyname',
     		value :PRRequest.getValue({
            	fieldId :'custrecord_pr_projectname'
            })
            });
         
         Project.setValue({
        		fieldId :'custentity_region',
        		value :PRRequest.getValue({
                	fieldId :'custrecord_pr_region'
                })});
				
				log.debug('Servicetype:'+PRRequest.getText({
                	fieldId :'custrecord_pr_project_servicetype'
                }));
				log.debug('Servicetype:'+PRRequest.getText({
                	fieldId :'custrecord_pr_service_sub_type'
                }));
	/*	 Project.setValue({
        		fieldId :'custentity_ns_project_service_type',
        		value :PRRequest.getText({
                	fieldId :'custrecord_pr_project_servicetype'
                }) + PRRequest.getText({
                	fieldId :'custrecord_pr_service_sub_type'
                })});
				
				*/
				var ss =PRRequest.getText({
                	fieldId :'custrecord_pr_project_servicetype'
                });
				var st =PRRequest.getText({
                	fieldId :'custrecord_pr_service_sub_type'
                });
					 Project.setValue({
        		fieldId :'custentity_ns_project_service_type',
					 value :ss + st
					 
					 });
				
				
				
         Project.setValue({
      		fieldId :'parent',
      		value :PRRequest.getValue({
               	fieldId :'custrecord_pr_customer'
            })});
         Project.setValue({
       		fieldId :'entitystatus',
       		value :PRRequest.getValue({
                	fieldId :'custrecord_pr_projectstatus'
             })});
         Project.setValue({
       		fieldId :'custentity_oa_export_to_openair',
       		value :true});
         
         Project.setValue({
     		fieldId :'custentity_product',
     		value :PRRequest.getValue({
            	fieldId :'custrecord_pr_product'
            })});
         Project.setValue({
     		fieldId :'custentity_costcentre',
     		value :PRRequest.getValue({
            	fieldId :'custrecord_pr_costcentre'
            })});
        
         
         Project.setValue({
      		fieldId :'custentity_oa_project_stage',
      		value :PRRequest.getValue({
            	fieldId :'custrecord_pr_projectstage'
            })});
         
         
         
         Project.setValue({
       		fieldId :'custentity_oa_project_template',
       		value :PRRequest.getValue({
            	fieldId :'custrecord_pr_oa_projecttemplate'
                })});
         Project.setValue({
       		fieldId :'custentity_projectdirector',
       		value :PRRequest.getValue({
            	fieldId :'custrecord_pr_projectdirector'
            })});
         Project.setValue({
        		fieldId :'custentity_owner',
        		value :PRRequest.getValue({
                	fieldId :'custrecord_pr_projectowner'
                })});
         Project.setValue({
     		fieldId :'custentity_ns_project_service_type',
     		value :PRRequest.getValue({
             	fieldId :'custrecord_pr_project_servicetype'
             })});
         
         Project.setValue({
      		fieldId :'custentity_misysref',
      		value :PRRequest.getValue({
              	fieldId :'custrecord_pr_opportunityid'
              })});
          
         
         
         
         
         var Projectid =Project.save({                  
        	   ignoreMandatoryFields: true    
        	});

         log.debug('Projectid :'+Projectid);         

         PRRequest.setValue({
            	fieldId :'custrecord_pr_projectcreated',
            	value :Projectid
            });
         

         PRRequest.save();
      
      	 
	 }
	 catch(e)
	 {
		 log.debug('Create Project - Error',e.toString());
	 }
    }
 
 function getdate(d)
 {
	 var initialFormattedDateString = d;
     var parsedDateStringAsRawDateObject = format.parse({
         value: initialFormattedDateString,
         type: format.Type.DATE
     });
     var formattedDateString = format.format({
         value: parsedDateStringAsRawDateObject,
         type: format.Type.DATE
     });
     return formattedDateString;
 }
 
 
 

 function getDateFormat(d,format)
	{
		
		log.debug({
			details : ' getDateFormat  :'
				+ d});
		
		 var parsedDateStringAsRawDateObject = format.parse({
             value: d,
             type: format.Type.DATE
         });
		 
		 log.debug({
				details : 'parsedDateStringAsRawDateObject  :'
					+ parsedDateStringAsRawDateObject});
		 return parsedDateStringAsRawDateObject;
		
	/*	var dd = Number(d.substring(0,2));
 	var mm = Number(d.substring(2,4));
 	var yyyy = Number(d.substring(4,8));
 	 log.debug({
          details: 'CASS Staging Creation :date :' + dd+ '-' +mm+ '-'+ yyyy});
		
	var	t = new date(yyyy,mm,dd);
		return t;*/
	}
 
 

    /**
     * Executes when the reduce entry point is triggered and applies to each group.
     *
     * @param {ReduceSummary} context - Data collection containing the groups to process through the reduce stage
     * @since 2015.1
     */
    function reduce(context) {

    }


    /**
     * Executes when the summarize entry point is triggered and applies to the result set.
     *
     * @param {Summary} summary - Holds statistics regarding the execution of a map/reduce script
     * @since 2015.1
     */
    function summarize(summary) {
    	
    	

    }

    return {
        getInputData: getInputData,
        map: map,
        reduce: reduce,
        summarize: summarize
    };
    
});
