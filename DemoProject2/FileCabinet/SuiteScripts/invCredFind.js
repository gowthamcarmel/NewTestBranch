// SD Ticket 1387528
// ver. 1.0.0		12/7/2016		EGO		Initial Build


// User Event : Applied to Bill and Invoice
// - triggered when invoice / bill is updated or created
// - this copies the standard transaction status to a custom transaction status field that reflects relationship to credit notes and other non-standard payments

function findCredits( type ){
	if( type == 'create' || type == 'xedit' || type == 'edit' ){
		var recId = nlapiGetRecordId();
		var recType = nlapiGetRecordType();
	
		manualFindCredits( recId, recType );
	}
}


//	User Event : Applied to Credit Memos 
//	- After submit, triggered only when Credit Memo status is updated to Fully Applied

function updateInvoices( type ){
	if( type == 'create' || type == 'xedit' || type == 'edit' ){
		var recId = nlapiGetRecordId();
		var recType = nlapiGetRecordType();
		
		var rec = nlapiLoadRecord(recType, recId );
	
		var recStatusMain = rec.getFieldValue('statusRef');
	
		if( recStatusMain != 'open' ){
			var raRecId = rec.getFieldValue('createdfrom');
			if( raRecId != '' && raRecId != null ){
				nlapiLogExecution('DEBUG', 'Credit Note has RA. Looking for invoice...', '' );
			
				var raRec = nlapiLoadRecord('returnauthorization', raRecId );
				var invRecId = raRec.getFieldValue('createdfrom');
			
				nlapiLogExecution('DEBUG', 'Updating Invoice Transaction Status', '');
				manualFindCredits( invRecId, 'invoice' );
			}
		}
	}
}

//	User Event : Applied to Customer Payments
//	

function updateInvoicesCustPay( type ){
	if( type == 'create' || type == 'xedit' || type == 'edit' ){
		try{
			var recId = nlapiGetRecordId();
			var recType = nlapiGetRecordType();
			
			if( recId ){
				var rec = nlapiLoadRecord(recType, recId );
	
				var linecount = rec.getLineItemCount('apply');
				for(var i = 1; i <= linecount; i++){
					manualFindCredits( rec.getLineItemValue('apply', 'internalid', i), 'invoice' );
				}
			}
		}catch(e){
			nlapiLogExecution("ERROR","updateInvoicesCustPay", e.message);
		}
	}
}

function manualFindCredits( inputRecId, inputRecType ){
	try{
		var recId = inputRecId;
		var recType = inputRecType;
	
		var rec = nlapiLoadRecord(recType, recId );
	
		var recStatus = rec.getFieldValue('statusRef');
	
		nlapiLogExecution('DEBUG', 'Entered Script', 'Status: ' + recStatus );
	
		if( recStatus == 'open'){ 
			var searchresults = nlapiSearchRecord('creditmemo', 'customsearch_inv_credt', new nlobjSearchFilter('appliedtotransaction',null,'anyof', recId), new nlobjSearchColumn('amountremaining') );

			for ( var i = 0; searchresults != null && i < searchresults.length; i++ ) {
				var ccRecs = searchresults[i];
		
				//nlapiLogExecution('DEBUG', 'AmountRemaining: ' + ccRecs.getValue('amountremaining'), '');
			
				if ( parseFloat(rec.getFieldValue('amountremaining')).toFixed(2) > 0 ) {
					nlapiLogExecution('DEBUG','Inv Partially Credited', '');
					nlapiSubmitField(recType, recId, 'custbody_tran_status', 7 );
				}
			}
		
			if( searchresults == null ){
				nlapiLogExecution('DEBUG', 'Inv is Open', '');
				nlapiSubmitField(recType, recId, 'custbody_tran_status', 1 ); 
			}
		}
		else if( recStatus == 'cancelled'){ 
			// nlapiSubmitField(recType, recId, 'custbody_tran_status', 2 ); 
			nlapiLogExecution('DEBUG', 'Inv is Cancelled', '');
		}
		else if( recStatus == 'paidInFull'){ 	
			var searchresults = nlapiSearchRecord('creditmemo', 'customsearch_inv_credt', new nlobjSearchFilter('appliedtotransaction',null,'anyof', recId), new nlobjSearchColumn('amountremaining') );

			for ( var i = 0; searchresults != null && i < searchresults.length; i++ ) {
				var ccRecs = searchresults[i];
		
				//nlapiLogExecution('DEBUG', 'AmountRemaining: ' + ccRecs.getValue('amountremaining'), '');
		
				if ( parseFloat(rec.getFieldValue('amountremaining')).toFixed(2) > 0 ) {
					nlapiLogExecution('DEBUG','Inv Partially Credited', '');
					nlapiSubmitField(recType, recId, 'custbody_tran_status', 7 );
				}
          
				if ( parseFloat(rec.getFieldValue('amountremaining')).toFixed(2) == 0 ) {
					nlapiLogExecution('DEBUG','Inv Fully Credited', '');
					nlapiSubmitField(recType, recId, 'custbody_tran_status', 6 );
				}
			}
	
			if( searchresults == null ){
				nlapiLogExecution('DEBUG', 'Inv is Paid in Full', '');
				nlapiSubmitField(recType, recId, 'custbody_tran_status', 3 );
			}
		
		}	
		else if( recStatus == 'pendingApproval'){ 
			nlapiLogExecution('DEBUG', 'Inv is Pending Approval', '');
			nlapiSubmitField(recType, recId, 'custbody_tran_status', 4 ); 
		}
		else if( recStatus == 'rejected'){ 
			nlapiLogExecution('DEBUG', 'Inv is Rjected', '');
			nlapiSubmitField(recType, recId, 'custbody_tran_status', 5 ); 
		}	
		else if( recStatus == 'Replaced due to Legal Entity Change'){ 
			nlapiLogExecution('DEBUG', 'Inv is LEC', '');
			nlapiSubmitField(recType, recId, 'custbody_tran_status', 8 ); 
		}

		// Checks if PS Vendor Bill, then checks if overrride is enabled. If yes, Approval Status is reset to Pending until email is received
		// This portion is for the PS Bill PM Notiffication, comment this when deploying to production and uncomment when 
		// noted enhancement has been deployed to prodduction
	
		if( recType == 'vendorbill' && rec.getFieldValue('custbody_ps_apprvl_ovrd') == 'T' ){
			nlapiSubmitField( recType, recId, 'approvalstatus', 1 );
		}
	}catch(e){
		nlapiLogExecution("ERROR","manualFindCredits", e.message);
	}
}



// Scheduled Script To Update Status Sync Issues
// 

function invoiceStatusSyncSweep(){
	var counter = 0;
	var counterUpdated = 0;
	
	var syncSearch = nlapiLoadSearch('invoice','customsearch_tran_sync_issue');
	var syncSearchResultSet = syncSearch.runSearch();
	
	syncSearchResultSet.forEachResult(function(searchResult)
	{
		counter++
		try{
			var invRec = nlapiLoadRecord( 'invoice', searchResult.getId() );
			nlapiSubmitRecord( invRec );
			counterUpdated++;
		}catch(e){
			nlapiLogExecution('ERROR','Error Processing Record: ' + searchResult.getId() , e.message);
		}
		return true;                
	});
	
	/* taken out of scope
	syncSearch = nlapiLoadSearch('vendorbill','customsearch_tran_sync_issue_2');
	syncSearchResultSet = syncSearch.runSearch();
	
	syncSearchResultSet.forEachResult(function(searchResult2)
	{
		counter++
		if( searchResult2.getValue('statusRef') != 'cancelled' ){
			try{
				var vbillRec = nlapiLoadRecord( 'vendorbill', searchResult2.getId() );
				nlapiSubmitRecord( vbillRec );
				counterUpdated++;
			}catch(e){
				nlapiLogExecution('ERROR','Error Processing Record: ' + searchResult2.getId() , e.message);
			}
		}
		return true;                
	});
	*/
	
	nlapiLogExecution('DEBUG', 'Transaction Status Sync Issues Record Count', counter );
}