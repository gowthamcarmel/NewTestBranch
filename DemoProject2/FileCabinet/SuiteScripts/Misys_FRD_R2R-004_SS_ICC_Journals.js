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

function sched_ICCSameSubsidiaries () {
	__log.start({
		 'logtitle'  : 'ICCTrans-CreatePO'
		,'company' 	 : 'Misys'
		,'scriptname': 'Misys_FRD_R2R-004_SS_ICC_PerTrans.js'
		,'scripttype': 'scheduled'
	});
	try
	{
		__log.writev('** Create Purchase Orders from ICC Per Transactions');
		
		__log.writev('..searching for icc transactions');
				
		var  filter = [ new nlobjSearchFilter('custrecord_icc_purchase_transaction', null, 'anyof', '@NONE@') ];
		var arrSearchGrouped = __ICC.searchGroupedPerTransaction(filter);
		
		__log.writev('..search results', [arrSearchGrouped ? arrSearchGrouped.length : 0 ]);
		
		for (var ii in arrSearchGrouped)
		{
			var rowResult = arrSearchGrouped[ii];			
			var dataPO = __ICC.getDataForTransfer( rowResult );
			
			__log.writev('.** Creating new PO from', dataPO);
			var stPurchOrderID = __ICC.createPurchaseOrder( dataPO );			
						
			if (! __usage.hasRemaining('25%') ) {
				if ( _RescheduleScript() ) break;
			}
			
			return false; //  FOR DEBUG ONLY 
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

function sched_CreateICSalesOrder () {
	__log.start({
		 'logtitle'  : 'ICCTrans-CreateSO'
		,'company' 	 : 'Misys'
		,'scriptname': 'Misys_FRD_R2R-004_SS_ICC_PerTrans.js'
		,'scripttype': 'scheduled'
	});
	try
	{
		__log.writev('** Create Purchase Orders from ICC Per Transactions');
		
		__log.writev('..searching for icc transactions');
				
		var  filter = [ (new nlobjSearchFilter('custrecord_icc_purchase_transaction', null, 'noneof', '@NONE@') )
		               ,(new nlobjSearchFilter('custrecord_icc_sales_transaction', null, 'anyof', '@NONE@') )];
		var arrSearchGrouped = __ICC.searchGroupedPerTransaction(filter);
		
		__log.writev('..search results', [arrSearchGrouped ? arrSearchGrouped.length : 0 ]);
		
		for (var ii in arrSearchGrouped)
		{
			var rowResult = arrSearchGrouped[ii];			
			var dataPO = __ICC.getDataForTransfer( rowResult );
			
			__log.writev('.** Creating new PO from', dataPO);
			var stPurchOrderID = __ICC.createPurchaseOrder( dataPO );			
			if( stPurchOrderID ) __ICC.setTransactionValue(rowResult, 'custrecord_icc_purchase_transaction', stPurchOrderID);			
						
			if (! __usage.hasRemaining('25%') ) {
				if ( _RescheduleScript() ) break;
			}
			
			return false; //  FOR DEBUG ONLY 
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


function sched_CreateICVendorReturnAuthorization() {
	__log.start({
		 'logtitle'  : 'ICCTrans-CreateSO'
		,'company' 	 : 'Misys'
		,'scriptname': 'Misys_FRD_R2R-004_SS_ICC_PerTrans.js'
		,'scripttype': 'scheduled'
	});
	try
	{
		__log.writev('** Create Purchase Orders from ICC Per Transactions');
		
		__log.writev('..searching for icc transactions');
				
		var  filter = [ (new nlobjSearchFilter('custrecord_icc_purchase_transaction', null, 'noneof', '@NONE@') )
		               ,(new nlobjSearchFilter('custrecord_icc_sales_transaction', null, 'anyof', '@NONE@') )];
		var arrSearchGrouped = __ICC.searchGroupedPerTransaction(filter);
		
		__log.writev('..search results', [arrSearchGrouped ? arrSearchGrouped.length : 0 ]);
		
		for (var ii in arrSearchGrouped)
		{
			var rowResult = arrSearchGrouped[ii];			
			var dataPO = __ICC.getDataForTransfer( rowResult );
			
			__log.writev('.** Creating new PO from', dataPO);
			var stPurchOrderID = __ICC.createPurchaseOrder( dataPO );			
			if( stPurchOrderID ) __ICC.setTransactionValue(rowResult, 'custrecord_icc_purchase_transaction', stPurchOrderID);			
						
			if (! __usage.hasRemaining('25%') ) {
				if ( _RescheduleScript() ) break;
			}
			
			return false; //  FOR DEBUG ONLY 
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


function sched_CreateICReturnAuthorization() {
	__log.start({
		 'logtitle'  : 'ICCTrans-CreateSO'
		,'company' 	 : 'Misys'
		,'scriptname': 'Misys_FRD_R2R-004_SS_ICC_PerTrans.js'
		,'scripttype': 'scheduled'
	});
	try
	{
		__log.writev('** Create Purchase Orders from ICC Per Transactions');
		
		__log.writev('..searching for icc transactions');
				
		var  filter = [ (new nlobjSearchFilter('custrecord_icc_purchase_transaction', null, 'noneof', '@NONE@') )
		               ,(new nlobjSearchFilter('custrecord_icc_purchase_transaction', null, 'anyof', '@NONE@') )];
		var arrSearchGrouped = __ICC.searchGroupedPerTransaction(filter);
		
		__log.writev('..search results', [arrSearchGrouped ? arrSearchGrouped.length : 0 ]);
		
		for (var ii in arrSearchGrouped)
		{
			var rowResult = arrSearchGrouped[ii];			
			var dataPO = __ICC.getDataForTransfer( rowResult );
			
			__log.writev('.** Creating new PO from', dataPO);
			var stPurchOrderID = __ICC.createPurchaseOrder( dataPO );			
			if( stPurchOrderID ) __ICC.setTransactionValue(rowResult, 'custrecord_icc_purchase_transaction', stPurchOrderID);			
						
			if (! __usage.hasRemaining('25%') ) {
				if ( _RescheduleScript() ) break;
			}
			
			return false; //  FOR DEBUG ONLY 
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

