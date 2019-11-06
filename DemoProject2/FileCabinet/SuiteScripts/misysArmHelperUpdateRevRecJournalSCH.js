/**
 * @NApiVersion 2.x
 * @NScriptType ScheduledScript
 */
define(
		[ 'N/search', 'N/record', 'N/email', 'N/runtime' ],
		function(search, record, email, runtime) {
			function execute(context) {

				var searchIdRA = runtime.getCurrentScript().getParameter(
						"custscript_ra_searchid");
				var searchIdJounral = runtime.getCurrentScript().getParameter(
						"custscript_journal_search_id");
				
				var RAid ='';
				var journalID ='';

				log.debug({
					details : 'searchIdRA  :' + searchIdRA
				});

				log.debug({
					details : 'searchIdJounral  :' + searchIdJounral
				});

				try {

					var RASearch = search.load({
						id : searchIdRA
					});
					
					if(RASearch)
						
				{		
					
					var RAsearchResult = RASearch.run().getRange({
						start : 0,
						end : 100
					});

					log.debug({
						details : 'RAsearchResult len  :'
								+ RAsearchResult.length
					});

					for (var i = 0; i < RAsearchResult.length; i++) {

						 RAid = RAsearchResult[i].getValue({
							name : 'internalid'
								
						});
						 
							log.debug(' RAid :' + RAid);


						// searching Journals

						var JournalSearch = search.load({
							id : searchIdJounral
						});
						var MyFilters = search.createFilter({
							name : 'appliedtotransaction',
							operator : 'is',
							values : RAid
						})

					JournalSearch.filters.push(MyFilters);

						var JournalsearchResult = JournalSearch.run().getRange(
								{
									start : 0,
									end : 100
								});
						if(JournalsearchResult)
							{

						log.debug({
							details : 'JournalsearchResult len  :'
									+ JournalsearchResult.length
						});
						for (var i = 0; i < JournalsearchResult.length; i++) {
							journalID = JournalsearchResult[i].getValue({
								name : 'internalid'
							});
							
							log.debug(' journalID :' + journalID);
							// updating journal id in revenue elemnt

							var recObj = record.load({
								type : 'revenuearrangement',
								id : RAid,
								isDynamic: false
							});

							var elementCount = recObj
									.getLineCount('revenueelement');

							log.debug('elementCount:' + elementCount);

							for (var i = 0; i < elementCount; i++) {
								recObj.setSublistValue({
									sublistId : 'revenueelement',
									fieldId : 'custcol_rev_rec_journal',
									line : i,
									value : journalID
								});
								

							}

							var currRecId = recObj.save();
							log.debug(' currRecId submitted :' + currRecId);

						}
					}

					}
				}

                   // return true;
                
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
