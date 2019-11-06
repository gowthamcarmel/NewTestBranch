/**
 * Copyright (c) 1998-2013 NetSuite, Inc.
 * 2955 Campus Drive, Suite 100, San Mateo, CA, USA 94403-2511
 * All Rights Reserved.
 *
 * This software is the confidential and proprietary information of
 * NetSuite, Inc. ("Confidential Information"). You shall not
 * disclose such Confidential Information and shall use it only in
 * accordance with the terms of the license agreement you entered into
 * with NetSuite.
 */
function beforeSubmit_TransferPOrate(type)
{
	try
	{
		__log.start({
			 'logtitle'  : 'TransferCustomPO Rate'
			,'company' 	 : 'Misys'
			,'scriptname': 'Misys_FRD-PTP-004_UE_TransferPORate.js'
			,'scripttype': 'userevent'
		});
		
		var exec = nlapiGetContext().getExecutionContext();
		__log.writev('type/context', [type,exec]);
		
		//o Check the script has been invoked(execution context) by user interaction, CSV or web services and user event script.
		if (!__is.inArray(['userevent','userinterface','webservices','csvimport'], exec) ) return __log.end('Ignoring execution context:' + exec, true);
		if (!__is.inArray(['edit','create'], type) ) return __log.end('Ignoring type: ' + type, true);		
		
		var recType = nlapiGetRecordType();
		if (recType!='purchaseorder') return;
		
		 var itemCount = nlapiGetLineItemCount('item');
		 
		 __log.setCurrentRecord( nlapiGetOldRecord() );
		 
		 __log.writev('total line count', [itemCount]);
		 
		 for (var line=1; line<=itemCount; line++)
		 {
			 var linePOrate =  nlapiGetLineItemValue('item', 'rate', line);
			 	 linePOrate = __fn.parseFloat( linePOrate);
			 
			 var lineCustPOrate = nlapiGetLineItemValue('item', 'custcol_po_rate', line);
			 	 lineCustPOrate = __fn.parseFloat( lineCustPOrate );
			 	 
			 __log.writev('** Process line', [line, linePOrate, lineCustPOrate]);
			 
			 // update this line item
			 nlapiSelectLineItem('item', line);
			 nlapiSetCurrentLineItemValue('item', 'custcol_po_rate', linePOrate, true, true);
			 nlapiCommitLineItem('item');
			 
			 __log.writev('..setting the custom po rate', [linePOrate]);
		 }
		 
		 __log.end('**End Of script ** ');
		 
		 return true;
		
	}
	catch (error)
	{		
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

function afterSubmit_TransferPOrate(type)
{
	try
	{		
		__log.start({
			 'logtitle'  : 'AfterTransferLine'
			,'company' 	 : 'Misys'
			,'scriptname': 'Misys_FRD-PTP-004_UE_TransferPORate.js'
			,'scripttype': 'userevent'
		});
		
		var exec = nlapiGetContext().getExecutionContext();
		__log.writev('type/context', [type,exec]);
		
		//o Check the script has been invoked(execution context) by user interaction, CSV or web services and user event script.
		if (!__is.inArray(['userevent','userinterface','webservices','csvimport'], exec) ) return __log.end('Ignoring execution context:' + exec, true);
		if (!__is.inArray(['edit','create'], type) ) return __log.end('Ignoring type: ' + type, true);
		
		var recPO = nlapiGetNewRecord();
		var recNewPO = nlapiLoadRecord( recPO.getRecordType(), recPO.getId(), {'recordmode':'dynamic'});
		__log.setCurrentRecord(recPO);
				
		var itemCount = recPO.getLineItemCount('item');
		__log.writev('total line count', [itemCount]);
		 
		 for (var line=1; line<=itemCount; line++)
		 {
			 var lineId  = recPO.getLineItemValue('item', 'line', line);
			 	 
			 __log.writev('** Process line', [line, lineId]);
			 
			 // update this line item
			 recNewPO.selectLineItem('item', line);
			 __safe.setCurrentLineItemValue(recNewPO, 'item', 'custcol_po_line_id', lineId);
			 recNewPO.commitLineItem('item');
			 
			 __log.writev('..setting the line id', [lineId]);
		 }
		 
		var resultID = __safe.nlapiSubmitRecord(recNewPO, true, true);
		if ( resultID )
		{
			__log.writev('..success updated of line id', [resultID]);
		}
		__log.end('**End Of script ***');
		return true;
	}
	catch (error)
	{		
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
function beforeLoad_setEmployeeField(type,form,request){
	try{
		var context = nlapiGetContext().getExecutionContext();
		
		if (context != 'userinterface')
		{
			return true;			
		}
		
		if (type != 'edit'){
			return true;
		}		
		var recType = nlapiGetRecordType();
		if (recType=='purchaseorder'){
			form.getField('employee').setDisplayType('inline');
		}
		return true;	
	}
	catch(error) 
	{
 	   if (error.getDetails != undefined) 
 	   {
 		   nlapiLogExecution('ERROR', 'Process Error', error.getCode() + ': ' + error.getDetails());
 		   throw error;
 	   }
 	   else 
 	   {    
 		   nlapiLogExecution('ERROR', 'Unexpected Error', error.toString());
 		   throw nlapiCreateError('99999', error.toString());
 	   }
 	}		
}