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
var _SKIP_BATCH =false;

/** 
 * Scheduled script to process Per Period transactions
 * @returns
 */
function sched_ProcessPerPeriod()
{
	var deployid = nlapiGetContext().getDeploymentId();
	
//	return false;
	
	__log.start({
		 'logtitle'  : 'ICCTrans-PerPeriod-' + deployid
		,'company' 	 : 'Misys'
		,'scriptname': 'Misys_FRD_R2R-004_SS_ICC_PerPeriod.js'
		,'scripttype': 'scheduled'
	});
	try
	{
		_SCRIPT_PARAMS['custscript_iccbatchperiod_frdnum'] 	 = __fn.getScriptParameter('custscript_iccbatchperiod_frdnum') || '';
		if(! _SCRIPT_PARAMS['custscript_iccbatchperiod_frdnum'] ) return false;
		var FRDNO =  _SCRIPT_PARAMS['custscript_iccbatchperiod_frdnum'];
		
		// Custom Forms		
		_SCRIPT_PARAMS['custscript_iccbatchperiod_cfpo'] = __fn.getScriptParameter('custscript_iccbatchperiod_cfpo') || false;
		_SCRIPT_PARAMS['custscript_iccbatchperiod_cfso'] = __fn.getScriptParameter('custscript_iccbatchperiod_cfso') || false;
		_SCRIPT_PARAMS['custscript_iccbatchperiod_cfje'] = __fn.getScriptParameter('custscript_iccbatchperiod_cfje') || false;
		_SCRIPT_PARAMS['custscript_iccbatchperiod_cfvra'] = __fn.getScriptParameter('custscript_iccbatchperiod_cfvra') || false;
		_SCRIPT_PARAMS['custscript_iccbatchperiod_cfra'] = __fn.getScriptParameter('custscript_iccbatchperiod_cfra') || false;
		
		_CUSTFORM_IC_PO = _SCRIPT_PARAMS['custscript_iccbatchperiod_cfpo'];
		_CUSTFORM_IC_SO = _SCRIPT_PARAMS['custscript_iccbatchperiod_cfso']; 
		_CUSTFORM_IC_JE = _SCRIPT_PARAMS['custscript_iccbatchperiod_cfje'];
		_CUSTFORM_IC_VRA= _SCRIPT_PARAMS['custscript_iccbatchperiod_cfvra'];
		_CUSTFORM_IC_RA = _SCRIPT_PARAMS['custscript_iccbatchperiod_cfra'];
		
		// GBM 03201014 added this parameter for Email Alert functionality
		_SCRIPT_PARAMS['custscript_icc_email_alert'] = __fn.getScriptParameter('custscript_icc_email_alert') || '';
		
		_TIMER = new _Timer();
		_TIMER.start();
		
		// Current IC Batch Queue && Batch TO Process
		_SCRIPT_PARAMS['custscript_current_batch'] 		= __fn.getScriptParameter('custscript_current_batch') || '';		
		_SCRIPT_PARAMS['custscript_batch_to_process'] 	= __fn.getScriptParameter('custscript_batch_to_process') || '';		
		
		var arrBatchToProcess = _SCRIPT_PARAMS['custscript_batch_to_process'] ? JSON.parse( _SCRIPT_PARAMS['custscript_batch_to_process'] ) : '';
				
		/**
		 * set the MASTER if there are no batch to process defined
		 * MASTER will be the one to allocate the batches to each deployments
		 */
		if (!_SCRIPT_PARAMS['custscript_batch_to_process']) {
			_IS_MASTER = true;		
		}
		__log.writev('..Paramaters..',[_IS_MASTER, _SCRIPT_PARAMS]);
		
		/**
		 * Get the Batches with unique Source Subsidiaries..
		 *  this will prevent the script to process any batch with the same source subsidiary
		 */
		if ( _IS_MASTER ) {
			arrBatchToProcess = _getUniquePendingBatches( FRDNO );
		}		
		
		/** Search for IC Batch Queue FRD004 that is still Pending status **/
		var arrFilters = [ (new nlobjSearchFilter('custrecord_icbq_frd_no',null,'is', FRDNO))
						  ,(new nlobjSearchFilter('custrecord_icbq_status',null,'is', _QUEUESTATUS_PENDING)) ];
		
	
		/** If the batch is available, only process that batch **/ 
		if (_SCRIPT_PARAMS['custscript_current_batch'] ) 
		{		
			arrFilters.push( new nlobjSearchFilter('internalid', null, 'anyof', _SCRIPT_PARAMS['custscript_current_batch']) );			
			__log.writev('..current batch', [ _SCRIPT_PARAMS['custscript_current_batch'] ]);				
		}
		/** Else, if the batch to process is available, only process those batches **/
		else if (arrBatchToProcess && arrBatchToProcess.length ) 
		{
			arrFilters.push( new nlobjSearchFilter('internalid', null, 'anyof', arrBatchToProcess) );
			__log.writev('..batch to process', [arrBatchToProcess]);
		
		}  
		var arrBatchQueue = nlapiSearchRecord('customrecord_ic_batches_queue', null, arrFilters, 
					[ (new nlobjSearchColumn('custrecord_icbq_batch_id'))
					 ,(new nlobjSearchColumn('internalid')).setSort()
					 ,(new nlobjSearchColumn('custrecord_icbq_frd_no'))
					 ,(new nlobjSearchColumn('custrecord_icbq_source_subsidiary'))
					 ,(new nlobjSearchColumn('custrecord_icbq_status'))
					 ,(new nlobjSearchColumn('custrecord_icbq_parameters'))
					 ]);
		if (!arrBatchQueue ) {
			return __log.end('No Pending Batches.');
		}
		

		/**
		 * Attempt to trigger other deployment to process the batches
		 */
		var unAllocatedBatches = [];
		if (_IS_MASTER && arrBatchQueue.length > _DEPLOYNUMS )
		{
			var allBatchIDs = [];				
			for (var xx=0; xx<=arrBatchQueue.length;xx++) {
				if (arrBatchQueue[xx] && arrBatchQueue[xx].getId())
					allBatchIDs.push(arrBatchQueue[xx].getId()); 
			}
			allBatchIDs.reverse();
			
			// Allocate the batches to process into the deployments //
			unAllocatedBatches = _allocateBatches(allBatchIDs);			
		}
		
		/*********** START PROCESSING THE BATCHES ***********************/
		for (var ii in arrBatchQueue)
		{
			var rowBatchQ = arrBatchQueue[ii];
			var stQueueID = rowBatchQ.getId();
			
			// get the latest status of the batch
			var stBatchStatus  = nlapiLookupField('customrecord_ic_batches_queue', stQueueID, 'custrecord_icbq_status');
			if ( stBatchStatus !== _QUEUESTATUS_PENDING ) continue; // skip if not PENDING			
			
			var stSourceSubs 	= rowBatchQ.getValue('custrecord_icbq_source_subsidiary');
			var stBatchParams 	= rowBatchQ.getValue('custrecord_icbq_parameters');
			var arrQueueParams 	= JSON.parse( stBatchParams );
			
			
			// check if there's an active processing of the same subsidiary			
			if ( _hasExistingRequest({ 'frd_no'				: rowBatchQ.getValue('custrecord_icbq_frd_no')
									  ,'source_subsidiary'	: stSourceSubs
									  ,'parameters'			: stBatchParams}, true) ) {				
				continue;
			}
			
			_CURRENT_BATCHQ = stQueueID;
			
			__log.writev('** Current Batch', [stQueueID,stSourceSubs,stBatchStatus]);
			
			/** Check for usage and time limit **/
			if ( (! __usage.hasRemaining(_THRESHOLD_USAGEPCT) ) || ( _TIMER.getDiffMins() > _THRESHOLD_MINUTES ))  {
				if ( _RescheduleScript() ) return __log.end('Rescheduled Script');
			}			
			
			/** Check whether the Grouping is direct **/
			var isDirect = !! (arrQueueParams['grouping'] == 'direct');
			
			/** set the initial filters for this request */
			var  filter = [  (new nlobjSearchFilter('custrecord_icc_period', null, 'anyof', arrQueueParams['iccperiod']))
			                ,(new nlobjSearchFilter('custrecord_icc_source_subsidiary', null, 'anyof', stSourceSubs))
			                ,(new nlobjSearchFilter('custrecord_icc_allocation_type', null,'anyof', arrQueueParams['icctrans']))];
			
			// this script can also process single subs, if the destination subs is defined
			if ( arrQueueParams['iccdestsubs'] ) {
				filter.push( new nlobjSearchFilter('custrecord_icc_destination_subsidiary', null, 'anyof', arrQueueParams['iccdestsubs'] ) );
			}
						

			/** Update the IC Batch Queue to Processing **/			
			_updateStatusBatchQueue(stQueueID, _QUEUESTATUS_PROCESSING);
			
			_CURRENT_BATCHQ = stQueueID;
			__log.writev('****** Processing Batch Queue ******', [stQueueID, arrQueueParams]);
			
			
			/*****************************************************************************************/
			/////// PURCHASE ORDERS 
			var filterPO = [ new nlobjSearchFilter('custrecord_icc_purchase_transaction', null, 'anyof', '@NONE@') ];
			for (var jj in filter) {
				filterPO.push( filter[jj] );			
			}
			
			var arrGroupedICCforPO = __ICC.searchGroupedPerPeriod( filterPO, isDirect );
			_createTransactionsFromICC( arrGroupedICCforPO, 'purchaseorder', __ICC.createPurchaseOrder, filterPO, stQueueID, arrQueueParams['iccdate']);
			//------------------------------------
			/*****************************************************************************************/
			
			
			if ( (! __usage.hasRemaining(_THRESHOLD_USAGEPCT) ) || ( _TIMER.getDiffMins() > _THRESHOLD_MINUTES ))  {
				if ( _RescheduleScript() ) return __log.end('Rescheduled Script');
			}
						
			
			/*****************************************************************************************/
			/////// SALES ORDERS 
			var filterSO = [ new nlobjSearchFilter('custrecord_icc_purchase_transaction', null, 'noneof', '@NONE@')
			  				 ,new nlobjSearchFilter('custrecord_icc_sales_transaction', null, 'anyof', '@NONE@') ];
			for (var jj in filter){
				filterSO.push( filter[jj] );			
			}			
			var arrGroupedICCforSO = __ICC.searchGroupedPerPeriod( filterSO, isDirect );
			_createTransactionsFromICC( arrGroupedICCforSO, 'salesorder', __ICC.createSalesOrder, filterSO, stQueueID, arrQueueParams['iccdate']);			
			//------------------------------------
			/*****************************************************************************************/
			
			
			if ( (! __usage.hasRemaining(_THRESHOLD_USAGEPCT) ) || ( _TIMER.getDiffMins() > _THRESHOLD_MINUTES ))  {
				if ( _RescheduleScript() ) return __log.end('Rescheduled Script');
			}
			
						
			/*****************************************************************************************/
			///////   JOURNAL CREATION
			var filterJE =  [ new nlobjSearchFilter('custrecord_icc_journal_transaction', null, 'anyof', '@NONE@') ]; 
			for (var jj in filter){
				filterJE.push( filter[jj] );			
			}			
			var arrGroupedICCforJE = __ICC.searchGroupedSameSubsPerPeriod( filterJE );
			_createTransactionsFromICC( arrGroupedICCforJE, 'journalentry', __ICC.createJournal, filterJE, stQueueID, arrQueueParams['iccdate']);
			//------------------------------------			
			/*****************************************************************************************/
			
			
			if ( (! __usage.hasRemaining(_THRESHOLD_USAGEPCT) ) || ( _TIMER.getDiffMins() > _THRESHOLD_MINUTES ))  {
				if ( _RescheduleScript() ) return __log.end('Rescheduled Script');
			}
			
			/*****************************************************************************************/			
			///////   VENDOR RETURN AUTHORIZATIONS
			var filterVRA = [ new nlobjSearchFilter('custrecord_icc_purchase_transaction', null, 'anyof', '@NONE@') ];				
			for (var jj in filter){
				filterVRA.push( filter[jj] );			
			}			
			
			var arrGroupedICCforVRA = __ICC.searchGroupedPerPeriod( filterVRA, isDirect, true ); // negative items
			_createTransactionsFromICC( arrGroupedICCforVRA, 'VRA', __ICC.createVendorReturnAuthorization, filterVRA, stQueueID, arrQueueParams['iccdate']);
			//------------------------------------
			/*****************************************************************************************/
			
			
			
			if ( (! __usage.hasRemaining(_THRESHOLD_USAGEPCT) ) || ( _TIMER.getDiffMins() > _THRESHOLD_MINUTES ))  {
				if ( _RescheduleScript() ) return __log.end('Rescheduled Script');
			}
			
			
			/*****************************************************************************************/
		    ///////   RETURN AUTHORIZATIONS
		    //20140923 - FRD004 - jkbautista - added check for Purchase transaction should not be null
                //fix for 2 orphaned RA's
			var filterRA = [new nlobjSearchFilter('custrecord_icc_sales_transaction', null, 'anyof', '@NONE@'),
			        new nlobjSearchFilter('custrecord_icc_purchase_transaction', null, 'noneof', '@NONE@')];
			for (var jj in filter){
				filterRA.push( filter[jj] );			
			}			
			
			var arrGroupedICCforRA = __ICC.searchGroupedPerPeriod( filterRA, isDirect, true );
			_createTransactionsFromICC( arrGroupedICCforRA, 'RA', __ICC.createReturnAuthorization, filterRA, stQueueID, arrQueueParams['iccdate']);
			//------------------------------------			
			/*****************************************************************************************/
				
            //20141001 - jkbautista : Added missing RescheduleScript() call for RA creation when usage limit is breached.
            if ( (! __usage.hasRemaining(_THRESHOLD_USAGEPCT) ) || ( _TIMER.getDiffMins() > _THRESHOLD_MINUTES ))  {
				if ( _RescheduleScript() ) return __log.end('Rescheduled Script');
			}

			__log.writev('*** Update the Batch!!', stQueueID);
			__log.setSuffix('BatchComplete');
			_updateStatusBatchQueue(stQueueID, _QUEUESTATUS_COMPLETE);
			_CURRENT_BATCHQ = false;
			
			/**
			 * If there were unallocated batches, try to allocate them again to any free deployments
			 */			
			if (_IS_MASTER && unAllocatedBatches && unAllocatedBatches.length) {
				unAllocatedBatches = _allocateBatches(unAllocatedBatches);		
			} 			
		}
		
		/**
		 * Do a clean up before the script exits to ensure there aren't any more batches left to process
		 */
		arrBatchToProcess = _getUniquePendingBatches( FRDNO );
		if (arrBatchToProcess && arrBatchToProcess.length)
		{
			/**
			 * Try to allocate them again
			 */			
			_allocateBatches(arrBatchToProcess);		
		}
		else
		{
			/**
			 * Send the email alert notification, if there are no more batches to process 
			 */			
			// GBM 03192014 Added sending of email alert
			sendEmailAlert(_SCRIPT_PARAMS['custscript_icc_email_alert']);	
		}
		

		
		return __log.end('End of Script');
	}
	catch (error)
	{
		__log.end('EXIT SCRIPT with errors | ' + error.toString(), true);
	    if (error.getDetails != undefined)
	    {
	        nlapiLogExecution( 'ERROR', 'Process Error',error.getCode() + ': ' + error.getDetails());
	        throw error;
	    }
	    else
	    {
	        nlapiLogExecution( 'ERROR', 'Unexpected Error',error.toString());
	        throw nlapiCreateError('99999' , error.toString());
	    }
	}
}

/**
 * Returns an array of Batch Ids 
 * 
 * @param FRDNO
 * @returns array
 */
function _getUniquePendingBatches(FRDNO)
{
	__log.writev('** Get Pending Batches ...', [FRDNO]);
	var arrUniqueSourceSub = nlapiSearchRecord('customrecord_ic_batches_queue', null, 
			[  ( new nlobjSearchFilter('custrecord_icbq_frd_no', null, 'is', FRDNO) )
			  ,( new nlobjSearchFilter('custrecord_icbq_status', null, 'is', _QUEUESTATUS_PENDING) )
			],										
			[ (new nlobjSearchColumn('custrecord_icbq_source_subsidiary')),
			  (new nlobjSearchColumn('internalid')).setSort(true) ]);	
	
	if (! arrUniqueSourceSub) return false;

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
function _allocateBatches( batchToProcess ) 
{
	var  cx = nlapiGetContext();
	
	if (!batchToProcess || !batchToProcess.length) return false;
	
	var numBatchPerDepl = Math.floor( batchToProcess.length / _DEPLOYNUMS);
	__log.writev('**** Allocation: batch per depl:', [numBatchPerDepl, [batchToProcess.length, _DEPLOYNUMS]]);
	
	var arrparams = {};
	for (var _param in _SCRIPT_PARAMS) {
		arrparams[ _param ] = _SCRIPT_PARAMS[_param];
	}
	
	arrparams['custscript_current_batch'] = '';
	
	var unAllocBatches = [];
	if (numBatchPerDepl >  1) {
		for (var yy=0;yy<=_DEPLOYNUMS;yy++)
		{
			/** Splice the batch **/
			var start = yy * numBatchPerDepl;
			var end = start + numBatchPerDepl-1;
			var arrBatchToDepl = batchToProcess.slice(start, end);
			
			__log.writev('..batch splice', [start, end, arrBatchToDepl]);
			/** Send this batch_to_process to the deployment **/
			if (arrBatchToDepl && arrBatchToDepl.length) {				
				arrparams['custscript_batch_to_process'] 	= JSON.stringify( arrBatchToDepl );
				if (! __nlapi.scheduleScript(cx.getScriptId(), cx.getDeploymentId(), arrparams) ) {
					/**
					 * if this job isnot deployed (not available at the time)
					 * collect them into an array 
					 */
					unAllocBatches = unAllocBatches.concat(arrBatchToDepl);
				}
			}
		}
	}
	else
	{
		/** 
		 * If the job list for each deployment is only 1, just send it to 1 deployment
		 */
		arrparams['custscript_batch_to_process'] 	= JSON.stringify( batchToProcess );
		if (! __nlapi.scheduleScript(cx.getScriptId(), cx.getDeploymentId(), arrparams) ) {
			unAllocBatches = unAllocBatches.concat(batchToProcess);
		}
	
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
function _RescheduleScript()
{
	if ( _HAS_BEEN_RESCHEDULED ) return true;
	
	var  cx = nlapiGetContext();
	__log.writev('** Rescheduling the script', [_SCRIPT_PARAMS]);
	
	_SCRIPT_PARAMS['custscript_current_batch'] = '';
	 if ( _CURRENT_BATCHQ ) _SCRIPT_PARAMS['custscript_current_batch'] = _CURRENT_BATCHQ;
	
	_HAS_BEEN_RESCHEDULED = __nlapi.scheduleScript(cx.getScriptId(), cx.getDeploymentId(), _SCRIPT_PARAMS);
		
	if( _HAS_BEEN_RESCHEDULED && _CURRENT_BATCHQ) {
		// attach the Batch and set it back to Pending //
		_updateStatusBatchQueue(_CURRENT_BATCHQ, _QUEUESTATUS_PENDING);
	}
	
	return _HAS_BEEN_RESCHEDULED;
}

// This function sends email upon successful completion of the script
// GBM 03092014
function sendEmailAlert(stEmailAlertId)
{
	var stLogTitle = 'sendEmailAlert';
	
	if(stEmailAlertId)
	{
		var recEmailAlert = nlapiLoadRecord('customrecord_email_alerts', stEmailAlertId);
		
		var stEmailSubject = recEmailAlert.getFieldValue('custrecord_email_subject');
		var stEmailBody = recEmailAlert.getFieldValue('custrecord_email_body');
		var stEmailFrom = recEmailAlert.getFieldValue('custrecord_email_from');
		
		var stEmailTo = nlapiGetUser();
		
		nlapiSendEmail(stEmailFrom, stEmailTo, stEmailSubject, stEmailBody); // Email sent to Current User
	}
	else
	{
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
function _getGroupedValues( fieldname, sortColumn ){
	
	var arrSubsSearch = nlapiSearchRecord('customrecord_intercompany_charges',null,
            [(new nlobjSearchFilter(fieldname,null,'noneof','@NONE@') )]
           ,[
             (new nlobjSearchColumn(fieldname,null,'group')),
             (new nlobjSearchColumn(sortColumn,null,'min')).setSort()
            ]);
	
	
	return arrSubsSearch || false;
}


function _cloneArray( arrVar ) {
	var newarrVar= [];
	for (var ii in arrVar )
	{
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
function _createTransactionsFromICC ( arrGroupedICC, recordToCreate, fnRecordCreation, filterExtra, queueId, iccDate )
{
	var FRDNO =  _SCRIPT_PARAMS['custscript_iccbatchperiod_frdnum'];
	var deployid = nlapiGetContext().getDeploymentId();
	
	__log.setSuffix([(_IS_MASTER ? 'MASTER':'WORKER'),deployid,FRDNO,queueId,recordToCreate].join('|'));
	
	var searchResultsLength = arrGroupedICC && arrGroupedICC.length ? arrGroupedICC.length : 0;
	__log.writev('[Grouped ICC]...', [recordToCreate, searchResultsLength]);
	if (!arrGroupedICC) {
		_addLogStatusBatchQueue(queueId, recordToCreate+':0;');		
		return true;
	}
	
	var isSuccess = true, arrCreatedTrans = [];
	
	
	/** 
	 * Loop all the grouped ICC records
	 */
	for (var iii in arrGroupedICC) {
		var rowICC = arrGroupedICC[iii];
		__log.setSuffix([(_IS_MASTER ? 'MASTER':'WORKER'),deployid,FRDNO,queueId,recordToCreate].join('|'));
		__log.appendSuffix([iii+1,searchResultsLength].join('/'));
		
	    /** Extract data to add to the transaction **/
	    //jkbautista 20140918 - Added the recordToCreate parameter to allow extractDataForPeriod() to discern what searchFilters will it use when grouping the IC records.
		var data = __ICC.extractDataForPeriod(rowICC, filterExtra, !!(recordToCreate == 'journalentry'), recordToCreate);
		if (iccDate) data['trandate'] = iccDate;		
		data['process'] = 'period';
		
//		__log.writev('*** Creating new transaction from', data);
		
		_addLogStatusBatchQueue(queueId,  'ICs:' + data['idx'].join(',')); 
		isSuccess = false;
		
		try {
			/** trigger the function that will create transaction and send the data **/
			isSuccess = fnRecordCreation.apply(__ICC, [data]);	
		} catch(err){
			__log.writev('--- ERROR: Error encountered while creating the record', [err.toString()]);
			__error.report( err.toString() );			
		}		
		
		if( isSuccess ) arrCreatedTrans.push(isSuccess);
		else if (__error.lastError()) _addLogStatusBatchQueue(queueId,  recordToCreate + ':' + __error.lastError() );
		
		/** Check for usage limit  and time limit **/
		if ( (! __usage.hasRemaining(_THRESHOLD_USAGEPCT) ) || ( _TIMER.getDiffMins() > _THRESHOLD_MINUTES ))  {			
			return true; // return true, let the outer loop do the rescheduling //
		}
	}
	
	if(!arrCreatedTrans  || !arrCreatedTrans.length) {
		_updateStatusBatchQueue(queueId, [_QUEUESTATUS_FAILED, recordToCreate + ':' + __error.lastError() ].join(' | ') );
		_addLogStatusBatchQueue(queueId,  recordToCreate + ':' + __error.lastError() );
		return false;
	} else 
		if( arrCreatedTrans.length > 0) _addLogStatusBatchQueue(queueId,  recordToCreate + ':' + arrCreatedTrans.join(','));
	
	return true;
}


/**
 * Timer function 
 */
function _Timer (starttime) {	
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
	
	return __fn.roundOff( ( difftime ) / (1000*60) );
};

_Timer.prototype.report = function () {		
	if (!this.startTime) return ['time not started'];
	
	var nowtime = new Date().getTime();
	
	var difftime = nowtime - this.startTime; //roundOff( (  ) / 1000 );
	
	var report = {'min':0,'sec':0};
	
	if (difftime < 1000*60 )
	{
		report['sec'] =__fn.roundOff( ( difftime ) / 1000 ); 
	}
	else
	{
		var diffsecs = Math.floor( ( difftime ) / 1000 );
		var diffmins = Math.floor( ( diffsecs ) / 60 );
		var remsecs = __fn.roundOff(  (difftime - diffmins * 60 * 1000)/1000 );
		
		report['min'] =diffmins; 
		report['sec'] =remsecs;
	}
	return report;	
};

