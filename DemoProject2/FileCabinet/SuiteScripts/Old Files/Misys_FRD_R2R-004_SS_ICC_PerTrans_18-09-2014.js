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
var _SCRIPT_PARAMS = {};
function sched_CreateICPurcaseOrder (arrPeriod, arrSourceSub) {
	__log.start({
		 'logtitle'  : 'ICCTrans-CreatePO'
		,'company' 	 : 'Misys'
		,'scriptname': 'Misys_FRD_R2R-004_SS_ICC_PerTrans.js'
		,'scripttype': 'scheduled'
	});
	try
	{
		__log.setSuffix(['PO'].join('|'));
		__log.writev('** Create Purchase Orders from ICC Per Transactions');		
		__log.writev('..searching for icc transactions');
				
		var filter = [ new nlobjSearchFilter('custrecord_icc_purchase_transaction', null, 'anyof', '@NONE@') ];
		
		if (arrPeriod) 	filter.push( new nlobjSearchFilter('custrecord_icc_period', null, 'anyof', arrPeriod) );		
		if (arrSourceSub) 	filter.push( new nlobjSearchFilter('custrecord_icc_source_subsidiary', null, 'anyof', arrSourceSub) );
		
		var arrSearchGrouped = __ICC.searchGroupedPerTransaction(filter);
		
		__log.writev('..search results', [arrSearchGrouped ? arrSearchGrouped.length : 0 ]);		

		for (var ii in arrSearchGrouped)
		{
			var rowResult = arrSearchGrouped[ii];			
			__log.setSuffix(['PO'].join('|'));
			__log.appendSuffix( [ii+2,arrSearchGrouped.length].join('/') );
			
			var dataPO = __ICC.extractDataForPerTrans( rowResult, filter );
			__log.writev('.** Creating new PO from', dataPO);
			 
			try
			{
				dataPO['process'] = 'pertrans';
				__ICC.createPurchaseOrder( dataPO );
			}
			catch (error)
			{	
				__log.writev('--- ERROR: Error encountered while creating the record', [error.toString()]);
			}	
				
			if (! __usage.hasRemaining('85%') ) {
				if ( _RescheduleScript() ) break;
			}			
		}
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

function sched_CreateICSalesOrder (arrPeriod, arrSourceSub) {
	__log.start({
		 'logtitle'  : 'ICCTrans-CreateSO'
		,'company' 	 : 'Misys'
		,'scriptname': 'Misys_FRD_R2R-004_SS_ICC_PerTrans.js'
		,'scripttype': 'scheduled'
	});
	try
	{
		__log.setSuffix(['SO'].join('|'));
		__log.writev('** Create Sales Order from ICC Per Transactions');		
		__log.writev('..searching for icc transactions');
				
		var  filter = [ (new nlobjSearchFilter('custrecord_icc_purchase_transaction', null, 'noneof', '@NONE@') )
		               ,(new nlobjSearchFilter('custrecord_icc_sales_transaction', null, 'anyof', '@NONE@') )];
		
		if (arrPeriod) 	filter.push( new nlobjSearchFilter('custrecord_icc_period', null, 'anyof', arrPeriod) );		
		if (arrSourceSub) 	filter.push( new nlobjSearchFilter('custrecord_icc_source_subsidiary', null, 'anyof', arrSourceSub) );
		
		var arrSearchGrouped = __ICC.searchGroupedPerTransaction(filter);
		__log.writev('..search results', [arrSearchGrouped ? arrSearchGrouped.length : 0 ]);
		
		for (var ii in arrSearchGrouped)
		{			
			var rowResult = arrSearchGrouped[ii];			
			var data= __ICC.extractDataForPerTrans( rowResult, filter );
			__log.appendSuffix( [ii,arrSearchGrouped.length].join('/') );
			
			__log.writev('.** Creating new from', data);
			try
			{
				data['process'] = 'pertrans';
				__ICC.createSalesOrder( data );
			}
			catch (error)
			{	
				__log.writev('--- ERROR: Error encountered while creating the record', [error.toString()]);
			}	
												
			if (! __usage.hasRemaining('85%') ) {
				if ( _RescheduleScript() ) break;
			}			
		}
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


function sched_CreateICReturnAuthorization(arrPeriod, arrSourceSub) {
	__log.start({
		 'logtitle'  : 'ICCTrans-CreateRA'
		,'company' 	 : 'Misys'
		,'scriptname': 'Misys_FRD_R2R-004_SS_ICC_PerTrans.js'
		,'scripttype': 'scheduled'
	});
	try
	{
		__log.setSuffix(['RA'].join('|'));
		__log.writev('** Create Return Authorization ICC Per Transactions');
		__log.writev('..searching for icc transactions');
				
		var  filter = [ (new nlobjSearchFilter('custrecord_icc_sales_transaction', null, 'anyof', '@NONE@') ) ];
		if (arrPeriod) 	filter.push( new nlobjSearchFilter('custrecord_icc_period', null, 'anyof', arrPeriod) );		
		if (arrSourceSub) 	filter.push( new nlobjSearchFilter('custrecord_icc_source_subsidiary', null, 'anyof', arrSourceSub) );
		var arrSearchGrouped = __ICC.searchGroupedPerTransaction(filter, true); // negative mount
		__log.writev('..search results', [arrSearchGrouped ? arrSearchGrouped.length : 0 ]);
		
		for (var ii in arrSearchGrouped)
		{
			var rowResult = arrSearchGrouped[ii];			
			var data = __ICC.extractDataForPerTrans( rowResult, filter );
			__log.appendSuffix( [ii,arrSearchGrouped.length].join('/') );
			
			__log.writev('.** Creating new from', data);
			try
			{
				data['process'] = 'pertrans';
				 __ICC.createReturnAuthorization( data );
			}
			catch (error)
			{	
				__log.writev('--- ERROR: Error encountered while creating the record', [error.toString()]);
			}	
						
			if (! __usage.hasRemaining('85%') ) {
				if ( _RescheduleScript() ) break;
			}
		}
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



function sched_CreateICVendorReturnAuthorization(arrPeriod, arrSourceSub) {
	__log.start({
		 'logtitle'  : 'ICCTrans-CreateVRA'
		,'company' 	 : 'Misys'
		,'scriptname': 'Misys_FRD_R2R-004_SS_ICC_PerTrans.js'
		,'scripttype': 'scheduled'
	});
	try
	{
		__log.setSuffix(['VRA'].join('|'));
		__log.writev('** Create Vendor Return Authorization ICC Per Transactions');		
		__log.writev('..searching for icc transactions');
				
		var  filter = [ (new nlobjSearchFilter('custrecord_icc_purchase_transaction', null, 'anyof', '@NONE@') ) ];
		
		if (arrPeriod) 	filter.push( new nlobjSearchFilter('custrecord_icc_period', null, 'anyof', arrPeriod) );		
		if (arrSourceSub) 	filter.push( new nlobjSearchFilter('custrecord_icc_source_subsidiary', null, 'anyof', arrSourceSub) );
		
		var arrSearchGrouped = __ICC.searchGroupedPerTransaction(filter, true); // negative mount
		
		__log.writev('..search results', [arrSearchGrouped ? arrSearchGrouped.length : 0 ]);
		
		for (var ii in arrSearchGrouped)
		{
			var rowResult = arrSearchGrouped[ii];			
			var data = __ICC.extractDataForPerTrans( rowResult, filter);
			__log.appendSuffix( [ii,arrSearchGrouped.length].join('/') );
			
			__log.writev('.** Creating new from', data);
			try
			{
				data['process'] = 'pertrans';
				__ICC.createVendorReturnAuthorization( data );				
			}
			catch (error)
			{	
				__log.writev('--- ERROR: Error encountered while creating the record', [error.toString()]);
			}	
			if (! __usage.hasRemaining('85%') ) {
				if ( _RescheduleScript() ) break;
			}
		}
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

function _RescheduleScript(_SCRIPT_PARAMS)
{
	var  cx = nlapiGetContext();
	__log.writev('** Rescheduling the script', [_SCRIPT_PARAMS]);
	return __nlapi.scheduleScript(cx.getScriptId(), cx.getDeploymentId(), _SCRIPT_PARAMS);
}


function sched_CreateICPerTrans()
{
	try
	{		
		_SCRIPT_PARAMS['custscript_iccpertran_cfpo'] 	= __fn.getScriptParameter('custscript_iccpertran_cfpo') || false;
		_SCRIPT_PARAMS['custscript_iccpertran_cfso'] 	= __fn.getScriptParameter('custscript_iccpertran_cfso') || false;
		_SCRIPT_PARAMS['custscript_iccpertran_cfje'] 	= __fn.getScriptParameter('custscript_iccpertran_cfje') || false;
		_SCRIPT_PARAMS['custscript_iccpertran_cfvra'] 	= __fn.getScriptParameter('custscript_iccpertran_cfvra') || false;
		_SCRIPT_PARAMS['custscript_iccpertran_cfra']  	= __fn.getScriptParameter('custscript_iccpertran_cfra') || false;
				
		
		sched_CreateICPurcaseOrder();		
		sched_CreateICSalesOrder();
		sched_CreateICVendorReturnAuthorization();
		sched_CreateICReturnAuthorization();
		
		return __log.end('EndOfScript');		
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