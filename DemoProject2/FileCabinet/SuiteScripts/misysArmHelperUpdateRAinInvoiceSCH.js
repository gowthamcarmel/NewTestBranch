/**
 * @NApiVersion 2.x
 * @NScriptType ScheduledScript
 */
define(
		[ 'N/search', 'N/record', 'N/email', 'N/runtime' ],
		function(search, record, email, runtime) {
			function execute(context) {

				var searchIdInvoice = runtime.getCurrentScript().getParameter(
						"custscript_arm_inv_searchid");
			var searchIdRA = runtime.getCurrentScript().getParameter(
					"custscript_arm_ra_searchid");
				
				var invID ='';
				var raID ='';
				var invCreatedFrom ='';

				log.debug({
					details : 'searchIdInvoice  :' + searchIdInvoice
				});

				log.debug({
					details : 'searchIdRA  :' + searchIdRA
				});

				try {

					var InvSearch = search.load({
						id : searchIdInvoice
					});
					
					if(InvSearch)
						
				{		
					
					var InvsearchResult = InvSearch.run().getRange({
						start : 0,
						end : 100
					});

					log.debug({
						details : 'InvsearchResult len  :'
								+ InvsearchResult.length
					});

					for (var i = 0; i < InvsearchResult.length; i++) {

						 invID = InvsearchResult[i].getValue({
							name : 'internalid'
								
						});
						 
							log.debug(' invID :' + invID);

						 invCreatedFrom = InvsearchResult[i].getValue({
								name : 'createdfrom'
									
							});
						 
						 log.debug(' invCreatedFrom :' + invCreatedFrom);
						 
						var sourcetran = invCreatedFrom.split('#');
						
						 log.debug(' sourcetran[1] :' + sourcetran[1]);
						
						// searching Revenue Arrangements

						var RASearch = search.load({
							id : searchIdRA
						});
						var MyFilters = search.createFilter({
							name : 'custbody_arm_source_tran',
							operator : 'is',
							values : invCreatedFrom
						})

					RASearch.filters.push(MyFilters);

						var RASearchResult = RASearch.run().getRange(
								{
									start : 0,
									end : 100
								});
						if(RASearchResult)
							{

						log.debug({
							details : 'RASearchResult len  :'
									+ RASearchResult.length
						});
						for (var i = 0; i < RASearchResult.length; i++)
						{
							raID = RASearchResult[i].getValue({
								name : 'internalid'
							});
							
							log.debug(' raID :' + raID);
							
							// updating Revenue Arrangement id in invoice

							var recObj = record.load({
								type : 'invoice',
								id : invID,
								isDynamic: false
							});
							 
							//raID = '8662434';
							recObj.setValue('custbody_arm_rev_arr_link',raID);

						

							var currRecId = recObj.save();
							log.debug(' currRecId submitted :' + currRecId);
							
							if(i==3)
								break;

						}
						
						
					}

					}
				}

                    return true;
                
				} catch (e) {
					
					log.debug({
	            	    title: 'Debug Entry', 
	            	    details: e.toString(),
	            	    });
					var subject = 'Fatal Error: Unable to transform salesorder to item fulfillment!';
					var authorId = -5;
					var recipientEmail = 'notify@company.com';
					email.send({
						author : authorId,
						recipients : recipientEmail,
						subject : subject,
						body : 'Fatal error occurred in script: '
								+ runtime.getCurrentScript().id + '\n\n'
								+ JSON.stringify(e)
					});
				}
			}
			return {
				execute : execute
			};
		});
