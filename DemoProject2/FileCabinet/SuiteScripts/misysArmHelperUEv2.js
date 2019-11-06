/**
 * @NApiVersion 2.x
 * @NScriptType UserEventScript
 */

/*
CR 1 - Software delivered flag handling

 */

define(['N/record', 'N/runtime', 'N/task'],
    function (record, runtime, task){
	/**
     * Schedules the current script if the total revenue elements are more than 100
     */
	function SendToScheduleScript() {
        var SendToScheduleScriptTask = task.create({
            taskType: task.TaskType.SCHEDULED_SCRIPT
        });
        SendToScheduleScriptTask.scriptId = 'customscript_misys_arm_helper';
        SendToScheduleScriptTask.deploymentId = 'customdeploy_misys_arm_helper_dpy';
        return SendToScheduleScriptTask.submit();
    }	
	
	function soVsoeFieldsHelper(context){ if ( (context.type == context.UserEventType.CREATE) || (context.type == context.UserEventType.EDIT) || (context.type == context.UserEventType.XEDIT) ){
            var rec = context.newRecord;
            var recObj = record.load({ type: rec.type, id: rec.id });
            
            var psAccrualAccountIdsProd = ['1097', '1096', '1665'];
            var psAccrualAccountIdsDev = ['1097', '1096', '1674'];

            var accountId = runtime.accountId;

            if( accountId == '3431250_SB99')
            {
                var psAccrualAccountIds = psAccrualAccountIdsDev;
            } else 
            { 
                var psAccrualAccountIds = psAccrualAccountIdsProd;
            }

            var tranCat = recObj.getText('custbody_transactioncategory');
            var recTranId = recObj.getValue('tranid');

            var scriptObj = runtime.getCurrentScript();
            var bodymap = scriptObj.getParameter('custscript_arm_bdyflds_v2');

            var elementCount = recObj.getLineCount('revenueelement');
            var submitNeeded = 0;
            
            var StopScriptTrigger = recObj.getValue('custbody_stop_script_trigger');
            log.debug("StopScriptTrigger:- "+StopScriptTrigger);
            
            if(elementCount > 100)
            {
            	if(StopScriptTrigger == false)
            	{
            		SendToScheduleScript();
    				log.debug("Scheduling script ");
                    return;
            	}
            }
            else
            {
            	
            	
            	for( var i = 0; i < elementCount; i++)
                {
                    var sourceRec = recObj.getSublistValue({ sublistId: 'revenueelement', fieldId: 'referenceid', line: i });
                    var _index = sourceRec.indexOf('_');
                    var sourceRecId = sourceRec.substring( _index + 1 );

                    // INITIALIZE SUBLIST INFO
                    // determine source type
                    // SalesOrd, Journal, CustInvc, RtnAuth
                    var sourceRecType = sourceRec.substring(0, _index);
                    if( sourceRecType == 'SalesOrd' ){
                        var sourceRecord = record.load({ type: 'salesorder', id: sourceRecId });
                    }
                    if( sourceRecType == 'CustInvc' ){
                        var sourceRecord = record.load({ type: 'invoice', id: sourceRecId });
                    }
                    if( sourceRecType == 'Journal' ){
                        var sourceRecord = record.load({ type: 'journalentry', id: sourceRecId });
                    }
                    if( sourceRecType == 'RtnAuth' ){
                        var sourceRecord = record.load({ type: 'returnauthorization', id: sourceRecId });
                    }
                    var manRevRecSched = recObj.getSublistValue({ sublistId: 'revenueelement', fieldId: 'custcol_ra_revrec_sched', line: i }); 
                    var manFairValue = recObj.getSublistValue({ sublistId: 'revenueelement', fieldId: 'custcol_ra_vsoeallocation', line: i });
                    var tranCategory = recObj.getSublistValue({ sublistId: 'revenueelement', fieldId: 'custcol_ra_trancat', line: i });
                    var armVsoeDelivered = recObj.getSublistValue({ sublistId: 'revenueelement', fieldId: 'custcol_arm_vsoedelivered', line: i });
                    var isGa = recObj.getSublistValue({ sublistId: 'revenueelement', fieldId: 'custcol_ga', line: i});
                    var revArrLineId = recObj.getSublistValue({ sublistId: 'revenueelement', fieldId: 'custcol_line_id', line: i}) - 1;
                    log.debug('revArrLineId:' + revArrLineId)

                    // CR 1 - start
                    // get value of armvsoedelivered flag from SO based on line number... line number populated on create via 
                    // rev field mapping
                    var soVsoeDelivered = sourceRecord.getSublistValue({ sublistId: 'item', fieldId: 'custcol_arm_vsoedelivered', line: revArrLineId });
                    var soGa = sourceRecord.getSublistValue({ sublistId: 'item', fieldId: 'custcol_ga', line: revArrLineId });
                    var soLineNumber = sourceRecord.getSublistValue({ sublistId: 'item', fieldId: 'custcol_line_id', line: revArrLineId });
                    log.debug('soVsoeDelivered:' + soVsoeDelivered + ', soLineNumber:' + soLineNumber);
                    if( soVsoeDelivered )
                    {
                        recObj.setSublistValue({ sublistId: 'revenueelement', fieldId: 'custcol_arm_vsoedelivered', line: i, value: soVsoeDelivered });
                        armVsoeDelivered = soVsoeDelivered;
                    }
                    if( soGa )
                    {
                        recObj.setSublistValue({ sublistId: 'revenueelement', fieldId: 'custcol_ga', line: i, value: soGa });
                        isGa = soGa;
                    } 
                    // check start and end date -- to see if RLF invoice (it will be blank initially for RLF invoice)
                    var lineStartDate = recObj.getSublistValue({ sublistId: 'revenueelement', fieldId: 'revrecstartdate', line: i});

                    // CR 1. - end

                    // SUBLIST DEBUG INFO
                    //log.debug('fairvalue, revenuerecognitionrule, revrecforecastrule, sourceid', recObj.getSublistValue({ sublistId: 'revenueelement', fieldId: 'fairvalue', line: i }) + ', ' + recObj.getSublistValue({ sublistId: 'revenueelement', fieldId: 'revenuerecognitionrule', line: i}) + ', ' + recObj.getSublistValue({ sublistId: 'revenueelement', fieldId: 'revrecforecastrule', line: i}) + ', ' + sourceRec.substring(sourceRec.indexOf('_') + 1) );
                    //log.debug('CreatePlansOnCheck', 'trancat:' + tranCat + ', custcol_ga:' + isGa + ', custcol_arm_vsoedelivered:' + armVsoeDelivered + ', sourceRecType:' + sourceRecType );

                    
                    var RevenuePlan = recObj.getSublistValue({ sublistId: 'revenueelement', fieldId: 'createrevenueplanson', line: i});
                    
                    var LineAmount = recObj.getSublistValue({ sublistId: 'revenueelement', fieldId: 'amount', line: i });
                    
                    if(parseFloat(LineAmount) > 0)
                    {
                    	if( manRevRecSched )
                        {
                            recObj.setSublistValue({ sublistId: 'revenueelement', fieldId: 'revenuerecognitionrule', line: i,  value: manRevRecSched });
                            recObj.setSublistValue({ sublistId: 'revenueelement', fieldId: 'revrecforecastrule', line: i, value: manRevRecSched });    
                        }
                    	
                    	/* Gowthaman... look here
                        // PS : set custom accrual account
                        var revRecSchedText = recObj.getSublistText({ sublistId: 'revenueelement', fieldId: 'revenuerecognitionrule', line: i });
                        // if revRecSchedText has 'to accrued' get substring 18 (FED, PS, PSS) == (1097, 1096, 1674)
                        if( revRecSchedText.indexOf('to accrued - FED') >= 0 ){
                            recObj.setSublistValue({ sublistId: 'revenueelement', fieldId: 'recognitionaccount', line: i, value: psAccrualAccountIds[0] }); 
                        }else if( revRecSchedText.indexOf('to accrued - PS') >= 0 ){
                            recObj.setSublistValue({ sublistId: 'revenueelement', fieldId: 'recognitionaccount', line: i, value: psAccrualAccountIds[1] }); 
                        }else if( revRecSchedText.indexOf('to accrued - PSS') >= 0 ){
                            recObj.setSublistValue({ sublistId: 'revenueelement', fieldId: 'recognitionaccount', line: i, value: psAccrualAccountIds[2] }); 
                        }
                        */

                        // if RLF SO, set Create Revenue Plans on to blank so no revenue plans are created -- NS Case 2636805
                        // this is for legacy Misys RB billing
                        if( tranCat == 'RLF' && sourceRecType == 'SalesOrd' )
                        { 
                        	// Do not set blank. Keep the value as it is. Hence the line is commented
                        	//recObj.setSublistValue({ sublistId: 'revenueelement', fieldId: 'createrevenueplanson', line: i, value: '' }); 
                        }
                        //if( tranCat == 'RLF' && sourceRecType == 'SalesOrd' ){
                            // recObj.setSublistValue({ sublistId: 'revenueelement', fieldId: 'createrevenueplanson', line: i, value: "-2" });//-2 for billing
                            // recObj.setValue({ fieldId: 'approvalstatus', value: 2 });//approved
                        //} 
                        if( tranCat == 'RLF' && sourceRecType != 'SalesOrd' )
                        {
                            // if RLF invoice, set create revenue plans on revenue arrangement creation
                            //log.debug('setting create rev plans flag. line ' + i + ' revArrangement ' + recTranId, '');
                        	
                        	recObj.setSublistValue({ sublistId: 'revenueelement', fieldId: 'createrevenueplanson', line: i, value: "-1" }); 
                        }
                      
                        if( tranCat == 'ILF' )
                        {
                            // if ILF, check if VSOE Delivered and GA are ticked and set create revenue plans on revenue arrangement creation    
                            //log.debug('CreatePlansOnCheck', 'ILF Line found, Line ' + i + ' revArrangement ' + recTranId + '. isGa:' + isGa);
                            if( isGa == true && ( armVsoeDelivered == true || soVsoeDelivered == true) )
                            {
                                //log.debug('CreatePlansOnCheck', 'Setting create rev plans flag. Line ' + i + ' revArrangement ' + recTranId);
                                recObj.setSublistValue({ sublistId: 'revenueelement', fieldId: 'createrevenueplanson', line: i, value: "-1" }); 
                            }
                            else
                            {
                                // Do not set blank. Keep the value as it is. Hence the line is commented
                            	//recObj.setSublistValue({ sublistId: 'revenueelement', fieldId: 'createrevenueplanson', line: i, value: '' }); 
                            }
                        }

                        // if PS, should not create revenue plans regardless of source. PS Rev Recognition is to be done from OpenAir
                        if( tranCat == 'PS' )
                        { 
                        	// Do not set blank. Keep the value as it is. Hence the line is commented
                        	//recObj.setSublistValue({ sublistId: 'revenueelement', fieldId: 'createrevenueplanson', line: i, value: '' }); 
                        }
                    }
                    
                  
                    if( manFairValue )
                    {
                        recObj.setSublistValue({ sublistId: 'revenueelement', fieldId: 'fairvalue', line: i, value: manFairValue });
                    }

                    if( armVsoeDelivered )
                    {
                        recObj.setSublistValue({ sublistId: 'revenueelement', fieldId: 'delivered', line: i, value: armVsoeDelivered });
                    }
                    submitNeeded++;

                    // CR 1 - set line level fields only if lines less than 100 so not to hit governance limit, but has to cycle through list 
                    // at least once
                    if( elementCount > 100 && i < 3 )
                    { 
                        i = elementCount + 1; 
                        recObj.setValue('custbody_to_update_lines', true);
                    }
                }
            }

            // Approve all revenue arrangement except PS Sales Orders and Invoices
            if( tranCat == 'PS' ){
                recObj.setValue({ fieldId: 'approvalstatus', value: 3 });
                submitNeeded++;
            }else{
                recObj.setValue({ fieldId: 'approvalstatus', value: 2 });
                submitNeeded++;
            }
            //recObj.setValue({ fieldId: 'approvalstatus', value: 2 });
            submitNeeded++;
            
            // map invoice body fields
            // memo:memo,custbody_docmemo:custbody_docmemo,custbody_contractno:custbody_contractno,custbody_misysref:custbody_misysref,custbody_transactioncategory:custbody_transactioncategory,custbody_contract_ref:custbody_contract_ref,job:custbody_arm_project,custbody_mys_region:custbody_mys_region
            //log.debug('bodymap & sourceRecId & sourceType & submitNeeded', bodymap + ' ' + sourceRecId + ' ' + sourceRecType + ' ' + submitNeeded);

            // START MASS UPDATE START and END DATES
            var bulkStartDate = recObj.getValue( 'custbody_bulk_start' );
            var bulkEndDate = recObj.getValue( 'custbody_bulk_end' );

            // CR 1 start
            // If RLF Invoice, set bulk start and end date to invoice start and end date
            if( tranCat == 'RLF' && sourceRecType == 'CustInvc' && lineStartDate == '' )
            {
                bulkStartDate = sourceRecord.getValue('startdate');
                bulkEndDate = sourceRecord.getValue('enddate');
            }
            // CR 1 end
            
            if( bulkStartDate || bulkEndDate )
            {
                // clear bulk start and end dates
                recObj.setValue({ fieldId: 'custbody_bulk_start', value: '' });
                recObj.setValue({ fieldId: 'custbody_bulk_end', value: '' });
                
                for( var i = 0; i < elementCount; i++){
                    if( bulkStartDate ){
                        recObj.setSublistValue({ sublistId: 'revenueelement', fieldId: 'revrecstartdate', line: i,  value: bulkStartDate });
                        recObj.setSublistValue({ sublistId: 'revenueelement', fieldId: 'forecaststartdate', line: i,  value: bulkStartDate });
                    }
                    if( bulkEndDate ){
                        recObj.setSublistValue({ sublistId: 'revenueelement', fieldId: 'revrecenddate', line: i,  value: bulkEndDate });
                        recObj.setSublistValue({ sublistId: 'revenueelement', fieldId: 'forecastenddate', line: i,  value: bulkEndDate });
                    }
                }

                submitNeeded++;
            }
            // END MASS UPDATE CODE
            
            if(elementCount > 100)
            {
            	recObj.setValue({ fieldId: 'custbody_stop_script_trigger', value: false });
            	submitNeeded++;
            }
            else
            {
            	if( bodymap && (submitNeeded > 0))
                {
                    var bodyMapArray = bodymap.split(',');
                    
                    recObj.setValue({ fieldId: 'custbody_arm_source_tran', value: sourceRecId });

                    for( var i = 0; i < bodyMapArray.length; i++ ){
                        var fieldsMap = bodyMapArray[i].split(':');
                        //log.debug('Mapping fields for', fieldsMap[0] + ' to ' + fieldsMap[1] );
                        recObj.setValue({ fieldId: fieldsMap[1], value: sourceRecord.getValue( fieldsMap[0] ) });
                    }
                }
            }

            if(submitNeeded > 0){ var currRecId = recObj.save(); }    
        }}
        return {
            afterSubmit: soVsoeFieldsHelper
        };
    }
);