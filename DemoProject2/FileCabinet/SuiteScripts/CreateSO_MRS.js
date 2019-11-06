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
    	
    	var searchIdRA = runtime.getCurrentScript().getParameter(
		"custscript_ps_newdeal");
    	
    	log.debug('searchIdRA - ',searchIdRA);
    	//get the PS SO details
    	
    	var searchObj = search.load({id : 'customsearch_co_psdeal'});
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
		 
		log.debug('Create SO - start');
		
		 var CORecord = record.load({
			    type: 'customrecord_new_deals',
			       id:SOCustId,
			       isDynamic: false                       
			   });
		 
		 
	var dealType =	 CORecord.getValue({
         	fieldId :'custrecord_newdeal_dealtype'
         });
	
	var dealCategory =	 CORecord.getValue({
     	fieldId :'custrecord_newdeal_transactioncategory'
     });
	log.debug('dealType',dealType);
	log.debug('dealCategory',dealCategory);
	var salesOrder;
	var CC = getCC(SOCustId, 0);
	log.debug('CC',CC);
	var Prd = getCC(SOCustId, 1);
	log.debug('Prd',Prd);
	if(dealType == '2' && dealCategory == '3')//change order - PS
		{
	  
		 salesOrder = record.create({
            type: record.Type.SALES_ORDER, 
            isDynamic: true,
            defaultValues: {
                entity: CORecord.getValue({
                	fieldId :'custrecord_newdeal_customer'
                }),
                
                customform:  '125'         	
                              
            } 
        });

			salesOrder.setValue({
	    		fieldId :'location',
	    		value :CORecord.getValue({
	            	fieldId :'custrecord_newdeal_region'
	            })
	    		
	    	});
			
			/*salesOrder.setValue({
	    		fieldId :'class',
	    		value :CORecord.getValue({
	            	fieldId :'custrecord_newdeal_product'
	            })
	    		
	    	});*/
			
			salesOrder.setValue({
	    		fieldId :'class',
	    		value :Prd
	    		
	    	});
			salesOrder.setValue({
	    		fieldId :'department',
	    		value :CC
	    		
	    	});
			
			salesOrder.setValue({
	    		fieldId :'currency',
	    		value :CORecord.getValue({
	            	fieldId :'custrecord_newdeal_currency'
	            })
	    		
	    	});
    	
    	salesOrder.setValue({
    		fieldId :'custbody_misysref',
    		value :CORecord.getValue({
            	fieldId :'custrecord_newdeal_opp_id'
            })
    		
    		
    	});
    	
    	salesOrder.setValue({
    		fieldId :'custbody_contractdate',
    		value :CORecord.getValue({
            	fieldId :'custrecord_newdeal_contractdate'
            })
    		
    	});
    	salesOrder.setValue({
    		fieldId :'custbody_contractno',
    		value :CORecord.getValue({
            	fieldId :'custrecord_newdeal_contractid'
            })
    		
    	});
    	
    	//transaction category PS -3
    	salesOrder.setValue({
    		fieldId :'custbody_transactioncategory',
    		value :'3'
    		
    	});
    	salesOrder.setValue({
    		fieldId :'startdate',
    		value :CORecord.getValue({
            	fieldId :'custrecord_newdeal_startdate'
            })
    		
    	});
    	salesOrder.setValue({
    		fieldId :'enddate',
    		value :CORecord.getValue({
            	fieldId :'custrecord_newdeal_enddate'
            })
    		
    	});
    	salesOrder.setValue({
    		fieldId :'otherrefnum',
    		value :CORecord.getValue({
            	fieldId :'custrecord_newdeal_ponumber'
            })
    		
    	});
    	
    	salesOrder.setValue({
    		fieldId :'shipaddress',
    		value :CORecord.getValue({
            	fieldId :'custrecord_newdeal_shipto'
            })
    		
    	});
    	
    	salesOrder.setValue({
    		fieldId :'billaddress',
    		value :CORecord.getValue({
            	fieldId :'custrecord_newdeal_billto'
            })
    		
    	});
    	
    	

    	//invoice/credit body PS -3
    	salesOrder.setValue({
    		fieldId :'custbody_invoice_credit_body',
    		value :'3'
    		
    	});
    	//PS Project
    	salesOrder.setValue({
    		fieldId :'job',
    		value :CORecord.getValue({
            	fieldId :'custrecord_newdeal_project'
            })
    		
    	});
    	
    var lineitems = getlineitems(SOCustId);	
    
		
if(lineitems)
	{

log.debug({
	details : 'lineitems len  :'
			+ lineitems.length
});
    	
 for(var i=0; i<lineitems.length;i++)   
	 {
	 
	 salesOrder.selectNewLine({ //add a line to a sublist
		    sublistId: 'item'      //specify which sublist
		});

		salesOrder.setCurrentSublistValue({   //set item field
		    sublistId: 'item',
		    fieldId: 'item',
		    value:  lineitems[i].getValue({
              name: 'custrecord_nditems_item'
          })//replace with item internal id 
		});
		salesOrder.setCurrentSublistValue({   //set item field
		    sublistId: 'item',
		    fieldId: 'department',
		    value:  lineitems[i].getValue({
              name: 'custrecord_nditems_costcentre'
          })//replace with item internal id 
		});
		salesOrder.setCurrentSublistValue({   //set item field
		    sublistId: 'item',
		    fieldId: 'class',
		    value:  lineitems[i].getValue({
              name: 'custrecord_nditems_product'
          })//replace with item internal id 
		});
		salesOrder.setCurrentSublistValue({
		    sublistId: 'item',
		    fieldId: 'quantity',
		    value: lineitems[i].getValue({
              name: 'custrecord_nditems_quantity'
          })//replace with quantity
		    	
		});
		salesOrder.setCurrentSublistValue({
		    sublistId: 'item',
		    fieldId: 'rate',
		    value: lineitems[i].getValue({
              name: 'custrecord_nditems_rate'
          }) 
		});
		salesOrder.setCurrentSublistValue({
		    sublistId: 'item',
		    fieldId: 'amount',
		    value: lineitems[i].getValue({
              name: 'custrecord_nditems_amount'
          }) //replace with quantity
		    	
		});
		salesOrder.setCurrentSublistValue({
		    sublistId: 'item',
		    fieldId: 'custcol_oa_billing_rule_type',
		    value: lineitems[i].getValue({
              name: 'custrecord_nditems_oa_billingrule'
          }) //replace with quantity
		    	
		});
		salesOrder.setCurrentSublistValue({
		    sublistId: 'item',
		    fieldId: 'custcol_oa_rev_rec_rule',
		    value: lineitems[i].getValue({
              name: 'custrecord_nditems_oa_rr_rules'
          }) //replace with quantity
		    	
		});
		
		salesOrder.setCurrentSublistValue({
		    sublistId: 'item',
		    fieldId: 'custcol_arm_vsoedelivered',
		    value: false
		    	
		});
		salesOrder.setCurrentSublistValue({
		    sublistId: 'item',
		    fieldId: 'custcol_arm_fair_value2',
		    value: lineitems[i].getValue({
              name: 'custrecord_nditems_fairvalue'
          }) //replace with quantity
		    	
		});
		salesOrder.setCurrentSublistValue({
		    sublistId: 'item',
		    fieldId: 'custcol_vsoeallocation',
		    value: lineitems[i].getValue({
              name: 'custrecord_nditems_fairvalue'
          }) //replace with quantity
		    	
		});
		salesOrder.setCurrentSublistValue({
		    sublistId: 'item',
		    fieldId: 'custcol_misyschargeablehours',
		    value: lineitems[i].getValue({
              name: 'custrecord_nditems_ps_chrg_hrs'
          }) //replace with quantity
		    	
		});
		salesOrder.setCurrentSublistValue({
		    sublistId: 'item',
		    fieldId: 'custcol_profitonservice',
		    value: lineitems[i].getValue({
              name: 'custrecord_nditems_ps_prfitonservice'
          }) //replace with quantity
		    	
		});
		salesOrder.setCurrentSublistValue({
		    sublistId: 'item',
		    fieldId: 'custcol_totalcost',
		    value: lineitems[i].getValue({
              name: 'custrecord_nditems_ps_totalcst'
          }) //replace with quantity
		    	
		});
		salesOrder.setCurrentSublistValue({
		    sublistId: 'item',
		    fieldId: 'custcol_onetime_deleivery_sovos',
		    value: lineitems[i].getValue({
              name: 'custrecord_nditems_onetime_delivery'
          }) //replace with quantity
		    	
		});
		
		
		salesOrder.setCurrentSublistValue({
		    sublistId: 'item',
		    fieldId: 'custcol_revrecsched',
		    value: lineitems[i].getValue({
              name: 'custrecord_nditems_revrec_rule'
          }) //replace with quantity
		    	
		});
		salesOrder.setCurrentSublistValue({
		    sublistId: 'item',
		    fieldId: 'custcol_us_tax_type_code',
		    value: lineitems[i].getValue({
              name: 'custrecord_nditems_us_taxtypecode'
          }) //replace with quantity
		    	
		});
		salesOrder.setCurrentSublistValue({
		    sublistId: 'item',
		    fieldId: 'custcol_misysrevenuecontracted',
		    value: lineitems[i].getValue({
	           	name :'custrecord_nditems_ps_contract_val'
	          
         }) });
		salesOrder.setCurrentSublistValue({
		    sublistId: 'item',
		    fieldId: 'custcol_ship_from_code',
		    value: lineitems[i].getValue({
              name: 'custrecord_nditems_shipfrom'
          }) //replace with quantity
		    	
		});
		var armstr = lineitems[i].getValue({
            name: 'custrecord_nditems_rr_startdate'});
		var invoiceDate = getDateFormat(armstr,format);
		
		log.debug('invoiceDate :'+invoiceDate);
		salesOrder.setCurrentSublistValue({
		    sublistId: 'item',
		    fieldId: 'custcol_arm_start_date',
		    value: invoiceDate
		    	
		});
		
		var armstr1 = lineitems[i].getValue({
            name: 'custrecord_nditems_rr_enddate'
        });
		var invoiceDate1 = getDateFormat(armstr1,format);
		
		salesOrder.setCurrentSublistValue({
		    sublistId: 'item',
		    fieldId: 'custcol_arm_end_date',
		    value:invoiceDate1  //replace with quantity
		    	
		});
		
		//repeat above pattern to set the rest of the line fields

		salesOrder.commitLine({  //writes the line entry into the loaded record
		    sublistId: 'item'
		});}
	}

var id =salesOrder.save({                  //writes record back to database
    ignoreMandatoryFields: true    //set for testing in case you want to create a record without validating which can give errors
});

log.debug('PSSOcreated :'+id);
log.debug('CreatePSSO - end');

CORecord.setValue({
   	fieldId :'custrecord_created_so',
   	value :id
   });


CORecord.save();
	 }
	
	else if(dealType == '1' && dealCategory == '3')	 
	 {
		log.debug('CreatePSSO New Deal - Start');
		
	
         var Project = record.create({
             type: 'job', 
             isDynamic: true,
            
         });
         
         Project.setValue({
     		fieldId :'companyname',
     		value :CORecord.getValue({
            	fieldId :'custrecordcustrecord_newdeal_proj_name'
            })
            });
         
         Project.setValue({
        		fieldId :'custentity_region',
        		value :CORecord.getValue({
                	fieldId :'custrecord_newdeal_region'
                })});
         Project.setValue({
      		fieldId :'parent',
      		value :CORecord.getValue({
               	fieldId :'custrecord_newdeal_customer'
            })});
         Project.setValue({
       		fieldId :'entitystatus',
       		value :CORecord.getValue({
                	fieldId :'custrecord_newdeal_projectstatus'
             })});
         Project.setValue({
       		fieldId :'custentity_oa_export_to_openair',
       		value :true});
         
        /* Project.setValue({
     		fieldId :'custentity_product',
     		value :CORecord.getValue({
            	fieldId :'custrecord_newdeal_product'
            })});
         Project.setValue({
     		fieldId :'custentity_costcentre',
     		value :CORecord.getValue({
            	fieldId :'custrecord_newdeal_costcentre'
            })});*/
         Project.setValue({
      		fieldId :'custentity_product',
      		value :Prd});
          Project.setValue({
      		fieldId :'custentity_costcentre',
      		value :CC});
         
         Project.setValue({
      		fieldId :'custentity_oa_project_stage',
      		value :'3'});
         
         Project.setValue({
       		fieldId :'custentity_oa_project_template',
       		value :CORecord.getValue({
            	fieldId :'custrecord_newdeal_oatemplate'
                })});
         Project.setValue({
       		fieldId :'custentity_projectdirector',
       		value :CORecord.getValue({
            	fieldId :'custrecordcustrecord_newdeal_project_dir'
            })});
         Project.setValue({
        		fieldId :'custentity_owner',
        		value :CORecord.getValue({
                	fieldId :'custrecordcustrecord_newdeal_project_own'
                })});
          
         
         var Projectid =Project.save({                  
        	   ignoreMandatoryFields: true    
        	});

         CORecord.setValue({
        	   	fieldId :'custrecord_newdeal_project',
        	   	value :Projectid
        	   });
      
         if(Projectid)
        	 
        	 {
		 salesOrder = record.create({
           type: record.Type.SALES_ORDER, 
           isDynamic: true,
           defaultValues: {
               entity: CORecord.getValue({
               	fieldId :'custrecord_newdeal_customer'
               }),
               
               customform:  '125'         	
                             
           } 
       });

		 salesOrder.setValue({
	    		fieldId :'location',
	    		value :CORecord.getValue({
	            	fieldId :'custrecord_newdeal_region'
	            })
	    		
	    	});
			
		/*	salesOrder.setValue({
	    		fieldId :'class',
	    		value :CORecord.getValue({
	            	fieldId :'custrecord_newdeal_product'
	            })
	    		
	    	});
			*/
		 
			salesOrder.setValue({
	    		fieldId :'class',
	    		value :Prd
	    		
	    	});
			salesOrder.setValue({
	    		fieldId :'department',
	    		value : CC
	    		
	    	});
			
			salesOrder.setValue({
	    		fieldId :'currency',
	    		value :CORecord.getValue({
	            	fieldId :'custrecord_newdeal_currency'
	            })
	    		
	    	});
 	
 	salesOrder.setValue({
 		fieldId :'custbody_misysref',
 		value :CORecord.getValue({
         	fieldId :'custrecord_newdeal_opp_id'
         })
 		
 		
 	});
 	
 	
   	
   	salesOrder.setValue({
   		fieldId :'custbody_contractdate',
   		value :CORecord.getValue({
           	fieldId :'custrecord_newdeal_contractdate'
           })
   		
   	});
   	salesOrder.setValue({
		fieldId :'startdate',
		value :CORecord.getValue({
        	fieldId :'custrecord_newdeal_startdate'
        })
		
	});
	salesOrder.setValue({
		fieldId :'enddate',
		value :CORecord.getValue({
        	fieldId :'custrecord_newdeal_enddate'
        })
		
	});
	salesOrder.setValue({
		fieldId :'otherrefnum',
		value :CORecord.getValue({
        	fieldId :'custrecord_newdeal_ponumber'
        })
		
	});
	
	salesOrder.setValue({
		fieldId :'shipaddress',
		value :CORecord.getValue({
        	fieldId :'custrecord_newdeal_shipto'
        })
		
	});
	
	salesOrder.setValue({
		fieldId :'billaddress',
		value :CORecord.getValue({
        	fieldId :'custrecord_newdeal_billto'
        })
		
	});
   	salesOrder.setValue({
   		fieldId :'custbody_contractno',
   		value :CORecord.getValue({
           	fieldId :'custrecord_newdeal_contractid'
           })
   		
   	});
   	
   	//transaction category PS -3
   	salesOrder.setValue({
   		fieldId :'custbody_transactioncategory',
   		value :'3'
   		
   	});
   	

   	//invoice/credit body PS -3
   	salesOrder.setValue({
   		fieldId :'custbody_invoice_credit_body',
   		value :'3'
   		
   	});
   	//PS Project
   	salesOrder.setValue({
   		fieldId :'job',
   		value :Projectid
   		
   	});
   	
   var lineitems = getlineitems(SOCustId);	
   
		
if(lineitems)
	{

log.debug({
	details : 'lineitems len  :'
			+ lineitems.length
});
   	
for(var i=0; i<lineitems.length;i++)   
	 {
	 
	 salesOrder.selectNewLine({ //add a line to a sublist
		    sublistId: 'item'      //specify which sublist
		});

		salesOrder.setCurrentSublistValue({   //set item field
		    sublistId: 'item',
		    fieldId: 'item',
		    value:  lineitems[i].getValue({
              name: 'custrecord_nditems_item'
          })//replace with item internal id 
		});
		salesOrder.setCurrentSublistValue({   //set item field
		    sublistId: 'item',
		    fieldId: 'department',
		    value:  lineitems[i].getValue({
              name: 'custrecord_nditems_costcentre'
          })//replace with item internal id 
		});
		salesOrder.setCurrentSublistValue({   //set item field
		    sublistId: 'item',
		    fieldId: 'class',
		    value:  lineitems[i].getValue({
              name: 'custrecord_nditems_product'
          })//replace with item internal id 
		});
		salesOrder.setCurrentSublistValue({
		    sublistId: 'item',
		    fieldId: 'quantity',
		    value: lineitems[i].getValue({
              name: 'custrecord_nditems_quantity'
          })//replace with quantity
		    	
		});
		salesOrder.setCurrentSublistValue({
		    sublistId: 'item',
		    fieldId: 'rate',
		    value: lineitems[i].getValue({
              name: 'custrecord_nditems_rate'
          }) 
		});
		salesOrder.setCurrentSublistValue({
		    sublistId: 'item',
		    fieldId: 'amount',
		    value: lineitems[i].getValue({
              name: 'custrecord_nditems_amount'
          }) //replace with quantity
		    	
		});
		salesOrder.setCurrentSublistValue({
		    sublistId: 'item',
		    fieldId: 'custcol_oa_billing_rule_type',
		    value: lineitems[i].getValue({
              name: 'custrecord_nditems_oa_billingrule'
          }) //replace with quantity
		    	
		});
		salesOrder.setCurrentSublistValue({
		    sublistId: 'item',
		    fieldId: 'custcol_oa_rev_rec_rule',
		    value: lineitems[i].getValue({
              name: 'custrecord_nditems_oa_rr_rules'
          }) //replace with quantity
		    	
		});
		salesOrder.setCurrentSublistValue({
		    sublistId: 'item',
		    fieldId: 'custcol_misyschargeablehours',
		    value: lineitems[i].getValue({
              name: 'custrecord_nditems_ps_chrg_hrs'
          }) //replace with quantity
		    	
		});
		salesOrder.setCurrentSublistValue({
		    sublistId: 'item',
		    fieldId: 'custcol_profitonservice',
		    value: lineitems[i].getValue({
              name: 'custrecord_nditems_ps_prfitonservice'
          }) //replace with quantity
		    	
		});
		salesOrder.setCurrentSublistValue({
		    sublistId: 'item',
		    fieldId: 'custcol_totalcost',
		    value: lineitems[i].getValue({
              name: 'custrecord_nditems_ps_totalcst'
          }) //replace with quantity
		    	
		});
		salesOrder.setCurrentSublistValue({
		    sublistId: 'item',
		    fieldId: 'custcol_arm_vsoedelivered',
		    value: true
		    	
		});
		salesOrder.setCurrentSublistValue({
		    sublistId: 'item',
		    fieldId: 'custcol_onetime_deleivery_sovos',
		    value: lineitems[i].getValue({
              name: 'custrecord_nditems_onetime_delivery'
          }) //replace with quantity
		    	
		});
		salesOrder.setCurrentSublistValue({
		    sublistId: 'item',
		    fieldId: 'custcol_arm_fair_value2',
		    value: lineitems[i].getValue({
              name: 'custrecord_nditems_fairvalue'
          }) //replace with quantity
		    	
		});
		salesOrder.setCurrentSublistValue({
		    sublistId: 'item',
		    fieldId: 'custcol_vsoeallocation',
		    value: lineitems[i].getValue({
              name: 'custrecord_nditems_fairvalue'
          }) //replace with quantity
		    	
		});
		
		
		salesOrder.setCurrentSublistValue({
		    sublistId: 'item',
		    fieldId: 'custcol_misysrevenuecontracted',
		    value: lineitems[i].getValue({
	           	name :'custrecord_nditems_ps_contract_val'
	          
         }) });
		salesOrder.setCurrentSublistValue({
		    sublistId: 'item',
		    fieldId: 'custcol_revrecsched',
		    value: lineitems[i].getValue({
              name: 'custrecord_nditems_revrec_rule'
          }) //replace with quantity
		    	
		});
		salesOrder.setCurrentSublistValue({
		    sublistId: 'item',
		    fieldId: 'custcol_us_tax_type_code',
		    value: lineitems[i].getValue({
              name: 'custrecord_nditems_us_taxtypecode'
          }) //replace with quantity
		    	
		});
		salesOrder.setCurrentSublistValue({
		    sublistId: 'item',
		    fieldId: 'custcol_ship_from_code',
		    value: lineitems[i].getValue({
              name: 'custrecord_nditems_shipfrom'
          }) //replace with quantity
		    	
		});
		var armstr = lineitems[i].getValue({
            name: 'custrecord_nditems_rr_startdate'});
		var invoiceDate = getDateFormat(armstr,format);
		
		log.debug('invoiceDate :'+invoiceDate);
		salesOrder.setCurrentSublistValue({
		    sublistId: 'item',
		    fieldId: 'custcol_arm_start_date',
		    value: invoiceDate
		    	
		});
		
		var armstr1 = lineitems[i].getValue({
            name: 'custrecord_nditems_rr_enddate'
        });
		var invoiceDate1 = getDateFormat(armstr1,format);
		
		salesOrder.setCurrentSublistValue({
		    sublistId: 'item',
		    fieldId: 'custcol_arm_end_date',
		    value:invoiceDate1  //replace with quantity
		    	
		});
		
		//repeat above pattern to set the rest of the line fields

		salesOrder.commitLine({  //writes the line entry into the loaded record
		    sublistId: 'item'
		});
	 
	 }
	}

var id =salesOrder.save({                  //writes record back to database
   ignoreMandatoryFields: true    //set for testing in case you want to create a record without validating which can give errors
});




log.debug('PSSOcreated :'+id);
log.debug('CreatePSSO New Deal - Start');
	 

CORecord.setValue({
   	fieldId :'custrecord_created_so',
   	value :id
   });


CORecord.save();

        	 }
         else
        	 {
        	 
        	 log.debug('CreatePS New Deal Project creation failed');
     		
        	 }

	 }
	else if(dealType == '1' && dealCategory == '1')
		{
           //ILF SO creation - new deal
		

		log.debug('CreateILFSO New Deal - Start');
		
	

        var Project = record.create({
            type: 'job', 
            isDynamic: true,
           
        });
        
        Project.setValue({
    		fieldId :'companyname',
    		value :CORecord.getValue({
           	fieldId :'custrecordcustrecord_newdeal_proj_name'
           })
           });
        
        Project.setValue({
       		fieldId :'custentity_region',
       		value :CORecord.getValue({
               	fieldId :'custrecord_newdeal_region'
               })});
        Project.setValue({
     		fieldId :'parent',
     		value :CORecord.getValue({
              	fieldId :'custrecord_newdeal_customer'
           })});
        
        Project.setValue({
       		fieldId :'entitystatus',
       		value :CORecord.getValue({
                	fieldId :'custrecord_newdeal_projectstatus'
             })});
        
        Project.setValue({
      		fieldId :'custentity_oa_export_to_openair',
      		value :false});
        
        /*Project.setValue({
    		fieldId :'custentity_product',
    		value :CORecord.getValue({
           	fieldId :'custrecord_newdeal_product'
           })});
        Project.setValue({
    		fieldId :'custentity_costcentre',
    		value :CORecord.getValue({
           	fieldId :'custrecord_newdeal_costcentre'
           })});*/
        
        Project.setValue({
      		fieldId :'custentity_product',
      		value :Prd});
          Project.setValue({
      		fieldId :'custentity_costcentre',
      		value :CC});
         
        Project.setValue({
     		fieldId :'custentity_oa_project_stage',
     		value :'17'});
        
      /*  Project.setValue({
      		fieldId :'custentity_oa_project_template',
      		value :CORecord.getValue({
           	fieldId :'custrecord_newdeal_oatemplate'
               })});
        Project.setValue({
      		fieldId :'custentity_projectdirector',
      		value :CORecord.getValue({
           	fieldId :'custrecordcustrecord_newdeal_project_dir'
           })});
        Project.setValue({
       		fieldId :'custentity_owner',
       		value :CORecord.getValue({
               	fieldId :'custrecordcustrecord_newdeal_project_own'
               })});
         */
        
        var Projectid =Project.save({                  
       	   ignoreMandatoryFields: true    
       	});
		
		
         
         log.debug('Projectid :' +Projectid);
         
         
         CORecord.setValue({
        	   	fieldId :'custrecord_newdeal_project',
        	   	value :Projectid
        	   });
         
         var ProjectTasks = getProjectTask(SOCustId);
         
         if(ProjectTasks)
     	{

     log.debug({
     	details : 'ProjectTasks len  :'
     			+ ProjectTasks.length
     });
        	
     for(var i=0; i<ProjectTasks.length;i++)   
     	 {
    	 
         var Projecttask = record.create({
             type: 'projecttask', 
             isDynamic: true,
            
         });
         
         Projecttask.setValue({
     		fieldId :'title',
     		value :ProjectTasks[i].getValue({
                name: 'custrecord_task_name'
            })
            });
         Projecttask.setValue({
      		fieldId :'company',
      		value :Projectid
             });
       /*  Projecttask.setValue({
      		fieldId :'status',
      		value :3
             });*/
         Projecttask.setValue({
       		fieldId :'startdate',
       		value :CORecord.getValue({
               	fieldId :'custrecord_newdeal_contractdate'
            })
              });
          
         
         
         var ProjectTaskid =Projecttask.save({                  
      	   ignoreMandatoryFields: true    
      	});
         
         log.debug('ProjectTaskid :' +ProjectTaskid);
         
         Prjtaskids.push(ProjectTaskid);
         
         
    	 
     	 }
    	 
     	 }
         
         
		 salesOrder = record.create({
           type: record.Type.SALES_ORDER, 
           isDynamic: true,
           defaultValues: {
               entity: CORecord.getValue({
               	fieldId :'custrecord_newdeal_customer'
               }),
               
               customform:  '126'         	
                             
           } 
       });

		 salesOrder.setValue({
	    		fieldId :'location',
	    		value :CORecord.getValue({
	            	fieldId :'custrecord_newdeal_region'
	            })
	    		
	    	});
			
		 salesOrder.setValue({
	    		fieldId :'currency',
	    		value :CORecord.getValue({
	            	fieldId :'custrecord_newdeal_currency'
	            })
	    		
	    	});
		 salesOrder.setValue({
	    		fieldId :'class',
	    		value :Prd
	    		
	    	});
			salesOrder.setValue({
	    		fieldId :'department',
	    		value : CC
	    		
	    	});
			salesOrder.setValue({
	    		fieldId :'custbody_packagecompleted',
	    		value : true
	    		
	    	});
			
	
	salesOrder.setValue({
		fieldId :'custbody_misysref',
		value :CORecord.getValue({
      	fieldId :'custrecord_newdeal_opp_id'
      })
		
		
	});
	salesOrder.setValue({
		fieldId :'startdate',
		value :CORecord.getValue({
        	fieldId :'custrecord_newdeal_startdate'
        })
		
	});
	salesOrder.setValue({
		fieldId :'enddate',
		value :CORecord.getValue({
        	fieldId :'custrecord_newdeal_enddate'
        })
		
	});
	salesOrder.setValue({
		fieldId :'otherrefnum',
		value :CORecord.getValue({
        	fieldId :'custrecord_newdeal_ponumber'
        })
		
	});
	
	salesOrder.setValue({
		fieldId :'shipaddress',
		value :CORecord.getValue({
        	fieldId :'custrecord_newdeal_shipto'
        })
		
	});
	
	salesOrder.setValue({
		fieldId :'billaddress',
		value :CORecord.getValue({
        	fieldId :'custrecord_newdeal_billto'
        })
		
	});
   	
   	salesOrder.setValue({
   		fieldId :'custbody_contractdate',
   		value :CORecord.getValue({
           	fieldId :'custrecord_newdeal_contractdate'
           })
   		
   	});
   	salesOrder.setValue({
   		fieldId :'custbody_contractno',
   		value :CORecord.getValue({
           	fieldId :'custrecord_newdeal_contractid'
           })
   		
   	});
   	
   	//transaction category ILF
   	salesOrder.setValue({
   		fieldId :'custbody_transactioncategory',
   		value :'1'
   		
   	});
   	

   	//invoice/credit body ILF -1
   	salesOrder.setValue({
   		fieldId :'custbody_invoice_credit_body',
   		value :'1'
   		
   	});
   	//ILF Project
   	salesOrder.setValue({
   		fieldId :'job',
   		value :Projectid
   		
   	});
   	
 	salesOrder.setValue({
   		fieldId :'draccount',
   		value :'129'
   		
   	});
   	
   	
   var lineitems = getlineitems(SOCustId);	
   
		
if(lineitems)
	{

log.debug({
	details : 'lineitems len  :'
			+ lineitems.length
});
   	
for(var i=0; i<lineitems.length;i++)   
	 {
	 
	 salesOrder.selectNewLine({ //add a line to a sublist
		    sublistId: 'item'      //specify which sublist
		});

		salesOrder.setCurrentSublistValue({   //set item field
		    sublistId: 'item',
		    fieldId: 'item',
		    value:  lineitems[i].getValue({
             name: 'custrecord_nditems_item'
         })//replace with item internal id 
		});
		salesOrder.setCurrentSublistValue({   //set item field
		    sublistId: 'item',
		    fieldId: 'department',
		    value:  lineitems[i].getValue({
             name: 'custrecord_nditems_costcentre'
         })//replace with item internal id 
		});
		salesOrder.setCurrentSublistValue({   //set item field
		    sublistId: 'item',
		    fieldId: 'class',
		    value:  lineitems[i].getValue({
             name: 'custrecord_nditems_product'
         })//replace with item internal id 
		});
		salesOrder.setCurrentSublistValue({
		    sublistId: 'item',
		    fieldId: 'quantity',
		    value: lineitems[i].getValue({
             name: 'custrecord_nditems_quantity'
         })//replace with quantity
		    	
		});
		salesOrder.setCurrentSublistValue({
		    sublistId: 'item',
		    fieldId: 'rate',
		    value: lineitems[i].getValue({
             name: 'custrecord_nditems_rate'
         }) 
		});
		salesOrder.setCurrentSublistValue({
		    sublistId: 'item',
		    fieldId: 'amount',
		    value: lineitems[i].getValue({
             name: 'custrecord_nditems_amount'
         }) //replace with quantity
		    	
		});
		
		
		salesOrder.setCurrentSublistValue({
		    sublistId: 'item',
		    fieldId: 'custcol_arm_vsoedelivered',
		    value: true
		    	
		});
		salesOrder.setCurrentSublistValue({
		    sublistId: 'item',
		    fieldId: 'custcol_onetime_deleivery_sovos',
		    value: lineitems[i].getValue({
              name: 'custrecord_nditems_onetime_delivery'
          }) //replace with quantity
		    	
		});
		salesOrder.setCurrentSublistValue({
		    sublistId: 'item',
		    fieldId: 'custcol_arm_fair_value2',
		    value: lineitems[i].getValue({
             name: 'custrecord_nditems_fairvalue'
         }) //replace with quantity
		    	
		});
		
		salesOrder.setCurrentSublistValue({
		    sublistId: 'item',
		    fieldId: 'custcol_vsoeallocation',
		    value: lineitems[i].getValue({
             name: 'custrecord_nditems_fairvalue'
         }) //replace with quantity
		    	
		});
		
		salesOrder.setCurrentSublistValue({
		    sublistId: 'item',
		    fieldId: 'custcol_misysrevenuecontracted',
		    value: CORecord.getValue({
	           	fieldId :'custrecord_newdeal_contractvalue'
	          
         }) //replace with quantity
		    	
		});
	
		salesOrder.setCurrentSublistValue({
		    sublistId: 'item',
		    fieldId: 'custcol_revrecsched',
		    value: lineitems[i].getValue({
             name: 'custrecord_nditems_revrec_rule'
         }) //replace with quantity
		    	
		});
		salesOrder.setCurrentSublistValue({
		    sublistId: 'item',
		    fieldId: 'custcol_us_tax_type_code',
		    value: lineitems[i].getValue({
             name: 'custrecord_nditems_us_taxtypecode'
         }) //replace with quantity
		    	
		});
		salesOrder.setCurrentSublistValue({
		    sublistId: 'item',
		    fieldId: 'custcol_ship_from_code',
		    value: lineitems[i].getValue({
             name: 'custrecord_nditems_shipfrom'
         }) //replace with quantity
		    	
		});
		var armstr = lineitems[i].getValue({
           name: 'custrecord_nditems_rr_startdate'});
		var invoiceDate = getDateFormat(armstr,format);
		
		log.debug('invoiceDate :'+invoiceDate);
		salesOrder.setCurrentSublistValue({
		    sublistId: 'item',
		    fieldId: 'custcol_arm_start_date',
		    value: invoiceDate
		    	
		});
		
		var armstr1 = lineitems[i].getValue({
           name: 'custrecord_nditems_rr_enddate'
       });
		var invoiceDate1 = getDateFormat(armstr1,format);
		
		salesOrder.setCurrentSublistValue({
		    sublistId: 'item',
		    fieldId: 'custcol_arm_end_date',
		    value:invoiceDate1  //replace with quantity
		    	
		});
		
		//repeat above pattern to set the rest of the line fields

		salesOrder.commitLine({  //writes the line entry into the loaded record
		    sublistId: 'item'
		});
	 
	 }
	}

var id =salesOrder.save({                  //writes record back to database
   ignoreMandatoryFields: true    //set for testing in case you want to create a record without validating which can give errors
});

log.debug('ILFSOcreated :'+id);

CORecord.setValue({
   	fieldId :'custrecord_created_so',
   	value :id
   });


CORecord.save();

if(ProjectTasks)
	{

log.debug({
	details : 'ProjectTasks len  :'
			+ ProjectTasks.length
});
	
for(var i=0; i<ProjectTasks.length;i++)   
	 {
	
	
	//create customer billing schedule
	var cbs = record.create({
	    type: 'customrecord_customer_billing_schedules', 
	    isDynamic: true,
	   
	});

	cbs.setValue({
			fieldId :'name',
			value : 'OBS - ' + Projectid +'- ILF'
	    });
	cbs.setValue({
			fieldId :'custrecord_cbs_project',
			value :Projectid
	     });

	cbs.setValue({
			fieldId :'custrecord_cbs_initial_amount',
			value :ProjectTasks[i].getValue({
                name: 'custrecord_nd_initialamt'
            })
	      });
	cbs.setValue({
		fieldId :'custrecord_cbs_line_amount',
		value :ProjectTasks[i].getValue({
            name: 'custrecord_ns_lineamount'
        })
      });
	
	cbs.setValue({
		fieldId :'custrecord_cbs_initial_payment_terms',
		value :ProjectTasks[i].getValue({
            name: 'custrecord_nd_initial_pmt_terms'
        })
      });
	cbs.setValue({
		fieldId :'custrecord_cbs_line_payment_terms',
		value :ProjectTasks[i].getValue({
            name: 'custrecord_nd_line_pmt_terms'
        })
      });
	
	cbs.setValue({
		fieldId :'custrecord_cbs_line_milestone',
		value :Prjtaskids[i]
      });
	
	cbs.setValue({
		fieldId :'custrecord_cbs_line_comment',
		value :ProjectTasks[i].getValue({
            name: 'custrecord_ns_linecomment'
        })
      });
	
	cbs.setValue({
		fieldId :'custrecord_cbs_line_milestone_sequence',
		value :ProjectTasks[i].getValue({
            name: 'custrecord_nd_milestone_seq'
        })
      });
	
	cbs.setValue({
		fieldId :'custrecord_cbs_sales_order',
		value :id
      });
	
	 log.debug('est_completion_date :' +ProjectTasks[i].getValue({
         name: 'custrecord_ns_est_completeddate'
     }));
	 
	 
	
	
	var d = ProjectTasks[i].getValue({
        name: 'custrecord_ns_est_completeddate'
    });
	
	log.debug('d:' +d);
	
	var invoiceDate1 = getDateFormat(d,format);
	
	log.debug('invoiceDate1:' +invoiceDate1);
	
	cbs.setValue({
		fieldId :'custrecord_cbs_line_est_completion_date',
		value :invoiceDate1
      });
	
	
	 var cbsid =cbs.save({                  
		   ignoreMandatoryFields: true    
		});
	 log.debug('cbsid :' +cbsid);

	 cbsids.push(cbsid);

	//new Date(context[fldName])
	//format.format({value: now, type: format.Type.TIMEOFDAY})
	 
	 var cbsid =cbs.save({                  
		   ignoreMandatoryFields: true    
		});
	 log.debug('cbsid :' +cbsid);

	 cbsids.push(cbsid);

	 }

	}


  
 
 
 
	 
		
	}
	else{
		log.debug('Create SO - end');
		
	}
	 }
	 catch(e)
	 {
		 log.debug('Create SO - Error',e.toString());
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
				return searchResult1;
	 }
	 catch(e)
	 {
		 log.debug('getlgetProjectTaskineitems - Error',e.toString());
	 }
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
 
 function getlineitems(dealid){
	 try{
		 log.debug('getlineitems - start');
		 log.debug('dealid - start',dealid);
	    	var searchObj = search.load({id : 'customsearch_new_deal_items_search'});
	    	log.debug('getInputData - ',searchObj);
	    	
	    		
	    		var MyFilters = search.createFilter({
					name : 'custrecord_nditems_newdealid',
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
				return searchResult1;
	 }
	 catch(e)
	 {
		 log.debug('getlineitems - Error',e.toString());
	 }
 }
 
 
 //get maximun amounts Cost center and product
 
 function getCC(dealid,flag){
	 try{
		 log.debug('getCC - start');
		 log.debug('dealid - start',dealid);
	    	var searchObj = search.load({id : 'customsearch_max_line_amount'});
	    	log.debug('getInputData - ',searchObj);
	    	
	    		
	    		var MyFilters = search.createFilter({
					name : 'custrecord_nditems_newdealid',
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
				
				log.debug({
					details : 'searchResult1[0] len  :'
							+searchResult1[0].getValue({
					            name: 'custrecord_nditems_costcentre'
					        })
				});
				log.debug({
					details : 'searchResult1[0] len  :'
							+searchResult1[0].getValue({
					            name: 'custrecord_nditems_product'
					        })
				});
				
				if(flag == 0)
					{
					return searchResult1[0].getValue({
			            name: 'custrecord_nditems_costcentre'
			        });
					}
				else
					{
					return searchResult1[0].getValue({
			            name: 'custrecord_nditems_product'
			        });
					
					}
	 }
	 catch(e)
	 {
		 log.debug('getlineitems - Error',e.toString());
	 }
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
