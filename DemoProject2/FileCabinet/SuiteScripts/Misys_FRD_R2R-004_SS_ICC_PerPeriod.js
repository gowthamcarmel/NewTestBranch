/**
 * Copyright (c) 1998-2014 NetSuite, Inc.
 * 2955 Campus Drive, Suite 100, San Mateo, CA, USA 94403-2511
 * All Rights Reserved.
 *
 * This software is the confidential and proprietary information of
 * NetSuite, Inc. ("Confidential Information"). You shall not
 * disclose such Confidential Information and shall use it only in
 * accordance with the terms of the license agreement you entered into
 * with NetSuite.
 */

//jkbautista : 20141022 - Silvia's Notes

/**   PROCESSING OF IC RECORDS (PER PERIOD)  **/

var _SCRIPT_PARAMS = {};
var _ICTRANS_TIME = false;
var _CURRENT_BATCHQ = false;
var _HAS_BEEN_RESCHEDULED = false;

var _TIMER = false;
var _THRESHOLD_MINUTES = 45;
var _THRESHOLD_USAGEPCT = '85%';
var _STARTED = false;

var _DEPLOYNUMS = 9;

var _IS_MASTER = false;
var _SKIP_BATCH = false;

//jkbautista : 20141105 - Added the deployment matrix
var _DEPLOYMENT_MATRIX = {
    0: 'customdeploy2',
    1: 'customdeploy3',
    2: 'customdeploy4',
    3: 'customdeploy5',
    4: 'customdeploy6',
    5: 'customdeploy7',
    6: 'customdeploy8',
    7: 'customdeploy9',
}


/** 
 * Scheduled script to process Per Period transactions
 * @returns
 */
function sched_ProcessPerPeriod() {
    var deployid = nlapiGetContext().getDeploymentId();

    //	return false;

    __log.start({
        'logtitle': 'ICCTrans-PerPeriod-' + deployid
		, 'company': 'Misys'
		, 'scriptname': 'Misys_FRD_R2R-004_SS_ICC_PerPeriod.js'
		, 'scripttype': 'scheduled'
    });
    try {
        _SCRIPT_PARAMS['custscript_iccbatchperiod_frdnum'] = __fn.getScriptParameter('custscript_iccbatchperiod_frdnum') || '';
        //jkbautista : 20141105 - Removed unnecessary conditional
        // if (!_SCRIPT_PARAMS['custscript_iccbatchperiod_frdnum']) return false;

        //jkbautista : 20141105 - Substituting actual FRD004 value to script parametized value
        var FRDNO = "FRD004";

        // Custom Forms		
        _SCRIPT_PARAMS['custscript_iccbatchperiod_cfpo'] = __fn.getScriptParameter('custscript_iccbatchperiod_cfpo') || false;
        _SCRIPT_PARAMS['custscript_iccbatchperiod_cfso'] = __fn.getScriptParameter('custscript_iccbatchperiod_cfso') || false;
        _SCRIPT_PARAMS['custscript_iccbatchperiod_cfje'] = __fn.getScriptParameter('custscript_iccbatchperiod_cfje') || false;
        _SCRIPT_PARAMS['custscript_iccbatchperiod_cfvra'] = __fn.getScriptParameter('custscript_iccbatchperiod_cfvra') || false;
        _SCRIPT_PARAMS['custscript_iccbatchperiod_cfra'] = __fn.getScriptParameter('custscript_iccbatchperiod_cfra') || false;

        _CUSTFORM_IC_PO = _SCRIPT_PARAMS['custscript_iccbatchperiod_cfpo'];
        _CUSTFORM_IC_SO = _SCRIPT_PARAMS['custscript_iccbatchperiod_cfso'];
        _CUSTFORM_IC_JE = _SCRIPT_PARAMS['custscript_iccbatchperiod_cfje'];
        _CUSTFORM_IC_VRA = _SCRIPT_PARAMS['custscript_iccbatchperiod_cfvra'];
        _CUSTFORM_IC_RA = _SCRIPT_PARAMS['custscript_iccbatchperiod_cfra'];

        // GBM 03201014 added this parameter for Email Alert functionality
        _SCRIPT_PARAMS['custscript_icc_email_alert'] = __fn.getScriptParameter('custscript_icc_email_alert') || '';

        _TIMER = new _Timer();
        _TIMER.start();

        // Current IC Batch Queue && Batch TO Process
        _SCRIPT_PARAMS['custscript_current_batch'] = __fn.getScriptParameter('custscript_current_batch') || '';
        _SCRIPT_PARAMS['custscript_batch_to_process'] = __fn.getScriptParameter('custscript_batch_to_process') || '';

        var ctx = nlapiGetContext();

        //jkbautista : 20141105 - Removing the value assignment of arrBatchToProcess, as it will be only populated through getUniquePendingBatches()
        var arrBatchToProcess;

        /**
		 * set the MASTER if there are no batch to process defined
		 * MASTER will be the one to allocate the batches to each deployments
		 */

        //jkbautista : 20141104 - Replaced original checking if there's a parameter passed on to batch_to_process...
        //                      - ... to checking if current run is 'customdeploy1'
        if (deployid === 'customdeploy1') {
            _IS_MASTER = true;
            __log.writev('Deployment is currently a MASTER');

            /**
        * Get the Batches with unique Source Subsidiaries..
        *  this will prevent the script to process any batch with the same source subsidiary
        */
            arrBatchToProcess = _getUniquePendingBatches(FRDNO);



            /** Search for IC Batch Queue FRD004 that is still Pending status **/
            var arrFilters = [(new nlobjSearchFilter('custrecord_icbq_frd_no', null, 'is', FRDNO))
                              , (new nlobjSearchFilter('custrecord_icbq_status', null, 'is', _QUEUESTATUS_PENDING))];

            //jkbautista : 20141105 - Removing the check for current batch, as MASTER will always contain no CURRENT BATCH
            /** If the batch is available, only process that batch **/
            //if (_SCRIPT_PARAMS['custscript_current_batch']) {
            //    arrFilters.push(new nlobjSearchFilter('internalid', null, 'anyof', _SCRIPT_PARAMS['custscript_current_batch']));
            //    __log.writev('..current batch', [_SCRIPT_PARAMS['custscript_current_batch']]);
            //}
            /** Else, if the batch to process is available, only process those batches **/

            arrFilters.push(new nlobjSearchFilter('internalid', null, 'anyof', arrBatchToProcess));
            arrFilters.push(new nlobjSearchFilter('custrecord_deployment_id', null, 'isempty'));
            __log.writev('..batch to process', [arrBatchToProcess]);


            var arrBatchQueue = nlapiSearchRecord('customrecord_ic_batches_queue', null, arrFilters,
                        [(new nlobjSearchColumn('custrecord_icbq_batch_id'))
                         , (new nlobjSearchColumn('internalid')).setSort()
                         , (new nlobjSearchColumn('custrecord_icbq_frd_no'))
                         , (new nlobjSearchColumn('custrecord_icbq_source_subsidiary'))
                         , (new nlobjSearchColumn('custrecord_icbq_status'))
                         , (new nlobjSearchColumn('custrecord_icbq_parameters'))
                        ]);
            //if (!arrBatchQueue) {
            //    return __log.end('No Pending Batches.');
            //}

            if (arrBatchQueue) {
                /**
                 * Attempt to trigger other deployment to process the batches
                 */
                //jkbautista : 20141022 - Check if list of Pending batches is greater than the number of deployments
                //jkbautista : 20141022 - This means that if there's only 1 Pending Batch, then, no need to trigger other deployments
                var unAllocatedBatches = [];
                //jkbautista : 20141028 - Replaced _Deploynums with zero(0) as we are only checking if arrBatchQueue has length
                //jkbautista : 20141031 - Replaced result comparison to DEPLOYNUMS,
                //                      - Now, as long as there are pending batches in the result, allocate it no matter what.
                if (_IS_MASTER && arrBatchQueue.length > 0) {
                    var allBatchIDs = [];
                    for (var xx = 0; xx <= arrBatchQueue.length; xx++) {
                        if (arrBatchQueue[xx] && arrBatchQueue[xx].getId())
                            allBatchIDs.push(arrBatchQueue[xx].getId());
                    }
                    allBatchIDs.reverse();

                    // Assign the batches to process into the deployments //
                    unAllocatedBatches = _allocateBatches(allBatchIDs);

                    //jkbautista : 20141103 - Re-check
                    if (unAllocatedBatches.length == 0) {
                        //jkbautista : 20141103 - Placed sendEmailAlert() also here, to make sure email is indeed sent.
                        
                        //jkbautista : 20141105 - Triggerring the deployments one by one.
                        for (var cc = 0 ; cc < 9; cc++) {

                            var currentDeployment = _DEPLOYMENT_MATRIX[cc % 8];

                            //jkbautista : 20141018 - Removing cx.getDeploymentId() as we are always looking for the free queue to process the current batch.
                            __log.writev('Triggering the Scheduled Script: [scriptId, deploymentId', [ctx.getScriptId(), currentDeployment]);
                            __nlapi.scheduleScript(ctx.getScriptId(), currentDeployment);
                        }
                        return false;
                    }
                     
                } else if (_IS_MASTER && arrBatchQueue.length == 0) {
                    //jkbautista : 20141028 - Transferred the email alert functionality here, so that when the Master executes and found that there are no Pending Batches anymore, it will send an email as designed.
                    sendEmailAlert(_SCRIPT_PARAMS['custscript_icc_email_alert']);
                    return false;
                }
            } else {
                
            }

        } else {
            __log.writev('Deployment is currently WORKER');
        }

        __log.writev('Warning: Master should not be processing any batch.');


        /*WORKER SECTION*/
       
        var workerArrBatchQueue = [];
        var workerArrFilter = [(new nlobjSearchFilter('custrecord_icbq_frd_no', null, 'is', FRDNO))
                               , (new nlobjSearchFilter('custrecord_icbq_status', null, 'is', _QUEUESTATUS_PENDING))
                                , (new nlobjSearchFilter('custrecord_deployment_id', null, 'is', ctx.getDeploymentId()))];

        workerArrFilter.push(new nlobjSearchFilter('custrecord_deployment_id', null, 'isnotempty'));

        //jkbautista : 20141106 - Removing processing of current batch
        //                      - as the current deployment will still need to process all charges lined up to them.
        //if (_SCRIPT_PARAMS['custscript_current_batch']) {
        //    workerArrFilter.push(new nlobjSearchFilter('internalid', null, 'anyof', _SCRIPT_PARAMS['custscript_current_batch']));
        //    __log.writev('..current batch', [_SCRIPT_PARAMS['custscript_current_batch']]);
        //}
        

        var workerArrBatchQueue = nlapiSearchRecord('customrecord_ic_batches_queue', null, workerArrFilter,
                        [(new nlobjSearchColumn('custrecord_icbq_batch_id'))
                         , (new nlobjSearchColumn('internalid')).setSort()
                         , (new nlobjSearchColumn('custrecord_icbq_frd_no'))
                         , (new nlobjSearchColumn('custrecord_icbq_source_subsidiary'))
                         , (new nlobjSearchColumn('custrecord_icbq_status'))
                         , (new nlobjSearchColumn('custrecord_icbq_parameters'))
                        ]);
        if (!workerArrBatchQueue) {
            return __log.end('No Pending Batches.');
        }

        __log.writev('Mock start process for [deployment, batchQueue]', [ctx.getDeploymentId(), workerArrBatchQueue]);
       

        //jkbautista : 20141028 - All codes below this line can only be reached by WORKERS

        /*********** START PROCESSING THE BATCHES ***********************/
        for (var ii in workerArrBatchQueue) {
            var rowBatchQ = workerArrBatchQueue[ii];
            //jkbautista : 20141022 - Get Batch Queue Id
            var stQueueID = rowBatchQ.getId();

            // get the latest status of the batch

            var stBatchStatus = nlapiLookupField('customrecord_ic_batches_queue', stQueueID, 'custrecord_icbq_status');
            //jkbautista : 20141022 - This is where the problem is occurring
            //                          if both deployments perform the same "nlapiLookUpField" at the same exact time, they will see the same status of "Pending" in that particular Batch Queue.
            //                          Thus, the code below, "continue" will not be triggered, as they both have "Pending" status at hand.

            if (stBatchStatus !== _QUEUESTATUS_PENDING) continue; // skip if not PENDING			

            var stSourceSubs = rowBatchQ.getValue('custrecord_icbq_source_subsidiary');
            var stBatchParams = rowBatchQ.getValue('custrecord_icbq_parameters');
            var arrQueueParams = JSON.parse(stBatchParams);


            // check if there's an active processing of the same subsidiary
            //jkbautista : 20141022 - Brian's initial fix for MULTIPLE Deployments processing the same subs.
            if (_hasExistingRequest({
'frd_no': rowBatchQ.getValue('custrecord_icbq_frd_no')
									  , 'source_subsidiary': stSourceSubs
									  , 'parameters': stBatchParams
            }, true)) {
                continue;
            }

            _CURRENT_BATCHQ = stQueueID;

            __log.writev('** Current Batch', [stQueueID, stSourceSubs, stBatchStatus]);

            /** Check for usage and time limit **/
            if ((!__usage.hasRemaining(_THRESHOLD_USAGEPCT)) || (_TIMER.getDiffMins() > _THRESHOLD_MINUTES)) {
                if (_RescheduleScript()) return __log.end('Rescheduled Script');
            }

            /** Check whether the Grouping is direct **/
            var isDirect = !!(arrQueueParams['grouping'] == 'direct');

            /** set the initial filters for this request */
            var filter = [(new nlobjSearchFilter('custrecord_icc_period', null, 'anyof', arrQueueParams['iccperiod']))
			                , (new nlobjSearchFilter('custrecord_icc_source_subsidiary', null, 'anyof', stSourceSubs))
			                , (new nlobjSearchFilter('custrecord_icc_allocation_type', null, 'anyof', arrQueueParams['icctrans']))];

            // this script can also process single subs, if the destination subs is defined
            if (arrQueueParams['iccdestsubs']) {
                filter.push(new nlobjSearchFilter('custrecord_icc_destination_subsidiary', null, 'anyof', arrQueueParams['iccdestsubs']));
            }


            /** Update the IC Batch Queue to Processing **/
            _updateStatusBatchQueue(stQueueID, _QUEUESTATUS_PROCESSING);

            _CURRENT_BATCHQ = stQueueID;
            __log.writev('****** Processing Batch Queue ******', [stQueueID, arrQueueParams]);


            /*****************************************************************************************/
            /////// PURCHASE ORDERS 
            var filterPO = [new nlobjSearchFilter('custrecord_icc_purchase_transaction', null, 'anyof', '@NONE@')];
            for (var jj in filter) {
                filterPO.push(filter[jj]);
            }

            var arrGroupedICCforPO = __ICC.searchGroupedPerPeriod(filterPO, isDirect);
            _createTransactionsFromICC(arrGroupedICCforPO, 'purchaseorder', __ICC.createPurchaseOrder, filterPO, stQueueID, arrQueueParams['iccdate']);
            //------------------------------------
            /*****************************************************************************************/


            if ((!__usage.hasRemaining(_THRESHOLD_USAGEPCT)) || (_TIMER.getDiffMins() > _THRESHOLD_MINUTES)) {
                if (_RescheduleScript()) return __log.end('Rescheduled Script');
            }


            /*****************************************************************************************/
            /////// SALES ORDERS 
            var filterSO = [new nlobjSearchFilter('custrecord_icc_purchase_transaction', null, 'noneof', '@NONE@')
			  				 , new nlobjSearchFilter('custrecord_icc_sales_transaction', null, 'anyof', '@NONE@')];
            for (var jj in filter) {
                filterSO.push(filter[jj]);
            }
            var arrGroupedICCforSO = __ICC.searchGroupedPerPeriod(filterSO, isDirect);
            _createTransactionsFromICC(arrGroupedICCforSO, 'salesorder', __ICC.createSalesOrder, filterSO, stQueueID, arrQueueParams['iccdate']);
            //------------------------------------
            /*****************************************************************************************/


            if ((!__usage.hasRemaining(_THRESHOLD_USAGEPCT)) || (_TIMER.getDiffMins() > _THRESHOLD_MINUTES)) {
                if (_RescheduleScript()) return __log.end('Rescheduled Script');
            }


            /*****************************************************************************************/
            ///////   JOURNAL CREATION
            var filterJE = [new nlobjSearchFilter('custrecord_icc_journal_transaction', null, 'anyof', '@NONE@')];
            for (var jj in filter) {
                filterJE.push(filter[jj]);
            }
            var arrGroupedICCforJE = __ICC.searchGroupedSameSubsPerPeriod(filterJE);
            _createTransactionsFromICC(arrGroupedICCforJE, 'journalentry', __ICC.createJournal, filterJE, stQueueID, arrQueueParams['iccdate']);
            //------------------------------------			
            /*****************************************************************************************/


            if ((!__usage.hasRemaining(_THRESHOLD_USAGEPCT)) || (_TIMER.getDiffMins() > _THRESHOLD_MINUTES)) {
                if (_RescheduleScript()) return __log.end('Rescheduled Script');
            }

            /*****************************************************************************************/
            ///////   VENDOR RETURN AUTHORIZATIONS
            var filterVRA = [new nlobjSearchFilter('custrecord_icc_purchase_transaction', null, 'anyof', '@NONE@')];
            for (var jj in filter) {
                filterVRA.push(filter[jj]);
            }

            var arrGroupedICCforVRA = __ICC.searchGroupedPerPeriod(filterVRA, isDirect, true); // negative items
            _createTransactionsFromICC(arrGroupedICCforVRA, 'VRA', __ICC.createVendorReturnAuthorization, filterVRA, stQueueID, arrQueueParams['iccdate']);
            //------------------------------------
            /*****************************************************************************************/



            if ((!__usage.hasRemaining(_THRESHOLD_USAGEPCT)) || (_TIMER.getDiffMins() > _THRESHOLD_MINUTES)) {
                if (_RescheduleScript()) return __log.end('Rescheduled Script');
            }


            /*****************************************************************************************/
            ///////   RETURN AUTHORIZATIONS
            //20140923 - FRD004 - jkbautista - added check for Purchase transaction should not be null
            //fix for 2 orphaned RA's
            var filterRA = [new nlobjSearchFilter('custrecord_icc_sales_transaction', null, 'anyof', '@NONE@'),
			        new nlobjSearchFilter('custrecord_icc_purchase_transaction', null, 'noneof', '@NONE@')];
            for (var jj in filter) {
                filterRA.push(filter[jj]);
            }

            var arrGroupedICCforRA = __ICC.searchGroupedPerPeriod(filterRA, isDirect, true);
            _createTransactionsFromICC(arrGroupedICCforRA, 'RA', __ICC.createReturnAuthorization, filterRA, stQueueID, arrQueueParams['iccdate']);
            //------------------------------------			
            /*****************************************************************************************/

            //20141001 - jkbautista : Added missing RescheduleScript() call for RA creation when usage limit is breached.
            if ((!__usage.hasRemaining(_THRESHOLD_USAGEPCT)) || (_TIMER.getDiffMins() > _THRESHOLD_MINUTES)) {
                if (_RescheduleScript()) return __log.end('Rescheduled Script');
            }


            __log.writev('*** Update the Batch!!', stQueueID);

           

            __log.setSuffix('BatchComplete');

          

            _updateStatusBatchQueue(stQueueID, _QUEUESTATUS_COMPLETE);
            _CURRENT_BATCHQ = false;

            //jkbautista : 20141107 - If routine have more batches to process, don't send email yet.
            __log.writev('Checking for remaining batches.. ');
            if (hasRemainingBatches() == false) {
                sendEmailAlert(_SCRIPT_PARAMS['custscript_icc_email_alert']);
                __log.writev('All batches has been processed. Email alert sent. ');
            } else {
                __log.writev('More batches needs to be processed. Deferring email notification.');
            }

         		
        }

        



        return __log.end('End of Script');
    }
    catch (error) {
        __log.end('EXIT SCRIPT with errors | ' + error.toString(), true);
        if (error.getDetails != undefined) {
            nlapiLogExecution('ERROR', 'Process Error', error.getCode() + ': ' + error.getDetails());
            throw error;
        }
        else {
            nlapiLogExecution('ERROR', 'Unexpected Error', error.toString());
            throw nlapiCreateError('99999', error.toString());
        }
    }
}


/**
 * Performs check if there more IC Batch Queues that needs to be processed.
 * Returns True if there are more
 * 
 */
function hasRemainingBatches() {
    var searchFilters = [
	        ['custrecord_icbq_status', 'is', 'Processing'], 'or'
	        , ['custrecord_icbq_status', 'is', 'Pending'], 'and'
	        , ['custrecord_icbq_frd_no', 'is', 'FRD004']
        ];

    var searchColumns = [];
    searchColumns[0] = new nlobjSearchColumn('internalid');
    searchColumns[1] = new nlobjSearchColumn('custrecord_icbq_batch_id');
    searchColumns[2] = new nlobjSearchColumn('custrecord_icbq_status');

    var results = nlapiSearchRecord('customrecord_ic_batches_queue', null, searchFilters, searchColumns) || 0;
    return results === 0 ? false : true;
}

/**
 * Returns an array of Batch Ids 
 * 
 * @param FRDNO
 * @returns array
 */
function _getUniquePendingBatches(FRDNO) {
    __log.writev('** Get Pending Batches ...', [FRDNO]);
    var arrUniqueSourceSub = nlapiSearchRecord('customrecord_ic_batches_queue', null,
			[(new nlobjSearchFilter('custrecord_icbq_frd_no', null, 'is', FRDNO))
			  , (new nlobjSearchFilter('custrecord_icbq_status', null, 'is', _QUEUESTATUS_PENDING))
			],
			[(new nlobjSearchColumn('custrecord_icbq_source_subsidiary')),
			  (new nlobjSearchColumn('internalid')).setSort(true)]);

    if (!arrUniqueSourceSub) return false;

    var arrSourceSubs = {};
    var arrPendingBatches = [];
    for (var ii in arrUniqueSourceSub) {
        var row = arrUniqueSourceSub[ii];
        var rowSubsId = row.getValue('custrecord_icbq_source_subsidiary');
        if (!arrSourceSubs[rowSubsId]) {
            arrSourceSubs[rowSubsId] = row.getId();
            arrPendingBatches.push(row.getId());
        }
    }

    __log.writev('...pending batches ', [arrPendingBatches]);

    return arrPendingBatches;
}

/**
 * Batch Allocation
 *  - divides the batch to process to each of the available deployments
 *   
 * @param batchToProcess
 * @returns
 */
function _allocateBatches(batchToProcess) {
    var cx = nlapiGetContext();

    if (!batchToProcess || !batchToProcess.length) return false;

    var arrparams = {};
    for (var _param in _SCRIPT_PARAMS) {
        arrparams[_param] = _SCRIPT_PARAMS[_param];
    }

    arrparams['custscript_current_batch'] = '';

    var unAllocBatches = [];

    for (var yy = 0; yy <= batchToProcess.length - 1 ; yy++) {
        /** Splice the batch **/



        __log.writev('Assigning batch to deployment[batch id, deploymentid]:',[ batchToProcess[yy], currentDeployment]);
        /** Send this batch_to_process to the deployment **/

        //jkbautista : 20141105 - Perform Modulo operation on the deployment matrix to get the equivalent deployment name
        var currentDeployment = _DEPLOYMENT_MATRIX[yy % 8];

        nlapiSubmitField('customrecord_ic_batches_queue', batchToProcess[yy], 'custrecord_deployment_id', currentDeployment);

        //arrparams['custscript_batch_to_process'] = JSON.stringify(batchToProcess[yy]);
        //jkbautista : 20141018 - Removing cx.getDeploymentId() as we are always looking for the free queue to process the current batch.
        //if (!__nlapi.scheduleScript(cx.getScriptId(), currentDeployment, arrparams)) {
        //    /**
        //     * if this job is not deployed (not available at the time)
        //     * collect them into an array 
        //     */
        //    unAllocBatches = unAllocBatches.concat(arrBatchToDepl);
        //}

    }


    // return the batch 
    /** SEnd back the batches that wasn't allocated **/
    __log.writev('...unallocated batches', [unAllocBatches]);
    return unAllocBatches;
}

/**
 * Reschedule this script
 * @returns {Boolean}
 */
function _RescheduleScript() {
    if (_HAS_BEEN_RESCHEDULED) return true;

    var cx = nlapiGetContext();

    __log.writev('** Rescheduling the script', [_SCRIPT_PARAMS]);

    _SCRIPT_PARAMS['custscript_current_batch'] = '';
    if (_CURRENT_BATCHQ) _SCRIPT_PARAMS['custscript_current_batch'] = _CURRENT_BATCHQ;

    _HAS_BEEN_RESCHEDULED = __nlapi.scheduleScript(cx.getScriptId(), cx.getDeploymentId(), _SCRIPT_PARAMS);

    if (_HAS_BEEN_RESCHEDULED && _CURRENT_BATCHQ) {
        // attach the Batch and set it back to Pending //
        _updateStatusBatchQueue(_CURRENT_BATCHQ, _QUEUESTATUS_PENDING);
    }

    return _HAS_BEEN_RESCHEDULED;
}

// This function sends email upon successful completion of the script
// GBM 03092014
function sendEmailAlert(stEmailAlertId) {
    var stLogTitle = 'sendEmailAlert';

    if (stEmailAlertId) {
        var recEmailAlert = nlapiLoadRecord('customrecord_email_alerts', stEmailAlertId);

        var stEmailSubject = recEmailAlert.getFieldValue('custrecord_email_subject');
        var stEmailBody = recEmailAlert.getFieldValue('custrecord_email_body');
        var stEmailFrom = recEmailAlert.getFieldValue('custrecord_email_from');

        var stEmailTo = nlapiGetUser();

        nlapiSendEmail(stEmailFrom, stEmailTo, stEmailSubject, stEmailBody); // Email sent to Current User
    }
    else {
        nlapiLogExecution('DEBUG', stLogTitle, 'SCRIPT Parameter Email Alert is Empty. Cannot Send Email');
    }
}

/**
 * Utility function to do a grouped search on IC Custom Record 
 * 
 * @param fieldname
 * @param sortColumn
 * @returns {Boolean}
 */
function _getGroupedValues(fieldname, sortColumn) {

    var arrSubsSearch = nlapiSearchRecord('customrecord_intercompany_charges', null,
            [(new nlobjSearchFilter(fieldname, null, 'noneof', '@NONE@'))]
           , [
             (new nlobjSearchColumn(fieldname, null, 'group')),
             (new nlobjSearchColumn(sortColumn, null, 'min')).setSort()
           ]);


    return arrSubsSearch || false;
}


function _cloneArray(arrVar) {
    var newarrVar = [];
    for (var ii in arrVar) {
        newarrVar[ii] = arrVar[ii];
    }
    return newarrVar;
}

/**
 * Create Transaction from IC Charges Custom Record
 *   = generates the
 * 
 * 
 * 
 * @param arrGroupedICC		- grouped ICC from the saved search
 * @param recordToCreate	- type of record to create	
 * @param fnRecordCreation	- the function to create the transaction (defined in misys.icclibrary.js)
 * @param filterExtra		- extra filters for the ICC records
 * @param queueId			- the current batch queue id
 * @param iccDate			- the icc date from the suitelet, will be used as the tranasction date
 * @returns {Boolean}
 */
function _createTransactionsFromICC(arrGroupedICC, recordToCreate, fnRecordCreation, filterExtra, queueId, iccDate) {
    var FRDNO = _SCRIPT_PARAMS['custscript_iccbatchperiod_frdnum'];
    var deployid = nlapiGetContext().getDeploymentId();

    //jkbautista : 20141022 - This is the line that writes the helpful log detail. This includes the deploymentID and the batchQueueID.
    //                      - Sample of this line is the following: "[WORKER|customdeploy7|FRD004|1089|VRA|01/3] *** New Record Created: [VendorCredits]...["1586517"]"
    __log.setSuffix([(_IS_MASTER ? 'MASTER' : 'WORKER'), deployid, FRDNO, queueId, recordToCreate].join('|'));

    var searchResultsLength = arrGroupedICC && arrGroupedICC.length ? arrGroupedICC.length : 0;
    __log.writev('[Grouped ICC]...', [recordToCreate, searchResultsLength]);
    if (!arrGroupedICC) {
        _addLogStatusBatchQueue(queueId, recordToCreate + ':0;');
        return true;
    }

    var isSuccess = true, arrCreatedTrans = [];


    /** 
	 * Loop all the grouped ICC records
	 */
    for (var iii in arrGroupedICC) {
        var rowICC = arrGroupedICC[iii];
        __log.setSuffix([(_IS_MASTER ? 'MASTER' : 'WORKER'), deployid, FRDNO, queueId, recordToCreate].join('|'));
        __log.appendSuffix([iii + 1, searchResultsLength].join('/'));

        /** Extract data to add to the transaction **/
        //jkbautista 20140918 - Added the recordToCreate parameter to allow extractDataForPeriod() to discern what searchFilters will it use when grouping the IC records.
        var data = __ICC.extractDataForPeriod(rowICC, filterExtra, !!(recordToCreate == 'journalentry'), recordToCreate);
        if (iccDate) data['trandate'] = iccDate;
        data['process'] = 'period';

        //		__log.writev('*** Creating new transaction from', data);

        _addLogStatusBatchQueue(queueId, 'ICs:' + data['idx'].join(','));
        isSuccess = false;

        try {
            /** trigger the function that will create transaction and send the data **/
            isSuccess = fnRecordCreation.apply(__ICC, [data]);
        } catch (err) {
            __log.writev('--- ERROR: Error encountered while creating the record', [err.toString()]);
            __error.report(err.toString());
        }

        if (isSuccess) arrCreatedTrans.push(isSuccess);
        else if (__error.lastError()) _addLogStatusBatchQueue(queueId, recordToCreate + ':' + __error.lastError());

        /** Check for usage limit  and time limit **/
        if ((!__usage.hasRemaining(_THRESHOLD_USAGEPCT)) || (_TIMER.getDiffMins() > _THRESHOLD_MINUTES)) {
            return true; // return true, let the outer loop do the rescheduling //
        }
    }

    if (!arrCreatedTrans || !arrCreatedTrans.length) {
        _updateStatusBatchQueue(queueId, [_QUEUESTATUS_FAILED, recordToCreate + ':' + __error.lastError()].join(' | '));
        _addLogStatusBatchQueue(queueId, recordToCreate + ':' + __error.lastError());
        return false;
    } else
        if (arrCreatedTrans.length > 0) _addLogStatusBatchQueue(queueId, recordToCreate + ':' + arrCreatedTrans.join(','));

    return true;
}


/**
 * Timer function 
 */
function _Timer(starttime) {
    this.startTime = starttime ? starttime : false;
    return this;
}

_Timer.prototype.start = function () {
    this.startTime = (new Date()).getTime();
};

_Timer.prototype.getDiffMins = function () {
    if (!this.startTime) {
        this.start();
    }
    var nowtime = new Date().getTime();
    var difftime = nowtime - this.startTime;

    __log.writev('**Timer Report', [this.report()]);

    return __fn.roundOff((difftime) / (1000 * 60));
};

_Timer.prototype.report = function () {
    if (!this.startTime) return ['time not started'];

    var nowtime = new Date().getTime();

    var difftime = nowtime - this.startTime; //roundOff( (  ) / 1000 );

    var report = { 'min': 0, 'sec': 0 };

    if (difftime < 1000 * 60) {
        report['sec'] = __fn.roundOff((difftime) / 1000);
    }
    else {
        var diffsecs = Math.floor((difftime) / 1000);
        var diffmins = Math.floor((diffsecs) / 60);
        var remsecs = __fn.roundOff((difftime - diffmins * 60 * 1000) / 1000);

        report['min'] = diffmins;
        report['sec'] = remsecs;
    }
    return report;
};
