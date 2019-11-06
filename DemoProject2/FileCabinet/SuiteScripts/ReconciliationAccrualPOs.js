
var _SSEARCH_ACCRUALJE_BILLS 	= 'customsearch_reconcile_accrualje_bills';
var _SSEARCH_ACCRUALJE_ITMRCPT 	= 'customsearch_reconcile_accrualje_itmrcpt';

/**
 * @param {String} type Context Types: scheduled, ondemand, userinterface, aborted, skipped
 * @returns {Void}
 */
function sched_ReconcileAccrualJE(type) {
	try
	{
		__log.start({
			 'logtitle'  : 'ReconcileAccrualJE'
			,'company' 	 : 'Misys'
			,'scriptname': 'Misys_FRD-PTP-004_SS_ReconcileAccrualJE.js'
			,'scripttype': 'scheduled'
		});
		
		var objContext = nlapiGetContext();
		//var search1 = objContext.getSetting('SCRIPT','custscript_search1');
		//var search2 = objContext.getSetting('SCRIPT','custscript_search2');
		var searchFilterVal = objContext.getSetting('SCRIPT','custscript_searchfilter1');
		var arrSearchAllPO = ""
		
		
		
		__log.writev('... searchFilterVal', searchFilterVal);
		if (searchFilterVal==null || searchFilterVal=="") {
			arrSearchAllPO = nlapiSearchRecord(null, 'customsearch_po_to_be_reconcilled_2'); //10 units
		}
		else{
			var searchFilter = new Array();
				searchFilter[0] = new nlobjSearchFilter('formulanumeric', null, 'equalto', 1);    
		        searchFilter[0].setFormula('CASE WHEN TO_NUMBER({internalid}) > \'' + searchFilterVal + '\' THEN 1 ELSE 0 END');
			arrSearchAllPO = nlapiSearchRecord(null, 'customsearch_po_to_be_reconcilled_2',searchFilter);
		}		
		if (! arrSearchAllPO) return __log.end('Empty PO Search', true);
		
		__log.writev('... search results', [arrSearchAllPO.length]);
		
		//o     For each PO returned by the Saved Search, the Script will
		for (var idx in arrSearchAllPO)
		{
			var resultrow = arrSearchAllPO[idx];
			var stPurcOrdID = resultrow.getId();
			
			__log.writev('**** Process Purchase order', [stPurcOrdID]);
			if (! stPurcOrdID) continue;
						
			__log.writev('**** Process Purchase order', [stPurcOrdID]);
			__log.setSuffix('purchaseorder:'+stPurcOrdID);
			
			var arrAllItems = [];
			
			/** SEARCH ITEM RECEIPTS ACCRUAL JEs **/ //10 units
			__log.writev('** Accrual JE Search for Item Recpts', [_SSEARCH_ACCRUALJE_ITMRCPT]);	
			var arrAccrualItems = {};
			var arrSearchItmRcpts = nlapiSearchRecord(null, _SSEARCH_ACCRUALJE_ITMRCPT, 
										[ (new nlobjSearchFilter('custbody_sourcing_po', null, 'anyof', stPurcOrdID) ) ]);
			__log.writev('...search results', [arrSearchItmRcpts ? arrSearchItmRcpts.length : 0]);			
			if ( arrSearchItmRcpts )
			{
				for (var iii in arrSearchItmRcpts)
				{
					var row = arrSearchItmRcpts[iii];
					var stItem = row.getValue('item', null, 'group');
					var stAmnt = __fn.parseFloat( row.getValue('fxamount', null, 'sum') );
					var stAcct = row.getValue('account', null, 'group');
					
					arrAccrualItems[stItem] = {
						 'account'	: stAcct//row.getValue('account', null, 'group')
						,'item'		: stItem
						,'fxamouunt': stAmnt
						,'expacct'	: nlapiLookupField('item', stItem, 'expenseaccount') //row.getValue('expenseaccount', 'item', 'group') //10 units
						,'puracct'	: row.getValue('custitem_misysaccrualaccount', 'item', 'group')
						,'amount' 	: Math.abs(stAmnt)
 					};
					
					if (!__is.inArray(arrAllItems, stItem) )
					{
						arrAllItems.push(stItem);
					}
				}			
			}
			__log.writev('Total AccrualJEs Item Rcpts', [arrAccrualItems, arrAllItems]);
			
			
			/** SEARCH VENDOR BILL ACCRUAL JEs **/			
			__log.writev('** Accrual JE Search for Vendor Bills', [_SSEARCH_ACCRUALJE_BILLS]);	//10 units
			var arrAccrualVB = {};
			var arrSearchVB= nlapiSearchRecord(null, _SSEARCH_ACCRUALJE_BILLS, 
										[ (new nlobjSearchFilter('custbody_sourcing_po', null, 'anyof', stPurcOrdID) ) ]);
			__log.writev('...search results', [arrSearchVB ? arrSearchVB.length : 0]);			
			if ( arrSearchVB )
			{
				for (var iii in arrSearchVB)
				{
					var row = arrSearchVB[iii];
					var stItem = row.getValue('item', null, 'group');
					var stAmnt = __fn.parseFloat( row.getValue('fxamount', null, 'sum') );
					var stAcct = row.getValue('account', null, 'group');
					
					arrAccrualVB[stItem] = {
						 'account'	: stAcct//row.getValue('account', null, 'group')
						,'item'		: stItem
						,'fxamouunt': stAmnt
						,'expacct'	: nlapiLookupField('item', stItem, 'expenseaccount')//row.getValue('expenseaccount', 'item', 'group') //10 units
						,'puracct'	: row.getValue('custitem_misysaccrualaccount', 'item', 'group')
						,'amount' 	: Math.abs(stAmnt)
 					};
					
					if (!__is.inArray(arrAllItems, stItem) )
					{
						arrAllItems.push(stItem);
					}
					
				}			
			}
			__log.writev('Total AccrualJEs Vendor Bills', [arrAccrualVB, arrAllItems]);
			
			
			__log.writev('** Create a new Adjustment Journal..');
			
			
			
			__log.writev('** Loading the purchase order via a search') //10 units
			var arrSearchPO = nlapiSearchRecord('purchaseorder', null
								,[
								   (new nlobjSearchFilter('internalid', null, 'anyof', stPurcOrdID) )
								  ,(new nlobjSearchFilter('mainline', null, 'is', 'T') )
								  ,(new nlobjSearchFilter('taxline', null, 'is', 'F') )
								 ]
								,[
								  (new nlobjSearchColumn('subsidiary') )
								  ,(new nlobjSearchColumn('currency') )
								  ,(new nlobjSearchColumn('exchangerate') )
								  ,(new nlobjSearchColumn('department') )
								  ,(new nlobjSearchColumn('class') )
								  ,(new nlobjSearchColumn('location') )
								  ,(new nlobjSearchColumn('entity') )
								  ,(new nlobjSearchColumn('custbody_project_id') )
								  ,(new nlobjSearchColumn('custbody_opportunityno') )
								  ,(new nlobjSearchColumn('custbody_po_customer') )
								  ,(new nlobjSearchColumn('class') )
								  ,(new nlobjSearchColumn('class') )								  
								 ]);
			if(! arrSearchPO) return __log.writev('..empty result', [arrSearchPO]);			
			var arrPurchOrd = arrSearchPO.shift();			
			if(! arrPurchOrd) return __log.writev('..empty purchaseorder', [arrSearchPO]);
			
			
			
			__log.setSuffix( 'purchaseorder:'+stPurcOrdID );
			
			//  o   Create a new Journal Entry record  (Dynamic mode)  
			var recNewJournal = nlapiCreateRecord('journalentry', {'recordmode':'dynamic'}); //10 units
			//  o   Set the Journal Entry Date as the current Date (Required for JE)  
			//  o   Set the Journal Entry Subsidary as the PO Subsidary (Required for JE)  
			//  o   Set the Journal Entry Currency as the PO Currency (Required for JE)  
			//  o   Set the Journal Entry Exchange Rate as the PO Exchange Rate (Required for JE)  
			//  o   Set the Journal Entry �Source Purchase Order� field as the PO internal id.					
			var arrTransferFields = {
					  'subsidiary'	:'subsidiary'					  									
					 ,'currency'	:'currency'						
					 ,'exchangerate':'exchangerate'				  				
					 ,'_id'			:'custbody_sourcing_po'};	
			
			
			for (var stField in arrTransferFields)
			{
				var stJournalField = arrTransferFields[stField];			
				var stValue = stField == '_id' ? arrPurchOrd.getId() : arrPurchOrd.getValue(stField);			
				if (stValue)
				{
					__log.writev('...setting field value ', [stField, stJournalField, stValue]);
					__safe.setFieldValue(recNewJournal, stJournalField, stValue);
				}
			}
			// o   Set the JE Memo to Accrual Adjustment				
			__safe.setFieldValue(recNewJournal, 'memo', 'Accrual Adjustment');
			
			var transactionDate = ""
			var searchFilterPO = [new nlobjSearchFilter('internalid',null,'anyof',stPurcOrdID)];
			var searchSystemNotes = nlapiSearchRecord(null,'customsearch_po_to_be_reconcilled_2_2',searchFilterPO); //10 units
			if (searchSystemNotes){
				transactionDate = searchSystemNotes[0].getValue('date','systemNotes');
				transactionDate = nlapiStringToDate(transactionDate);
				transactionDate = new Date(transactionDate);
				__safe.setFieldValue(recNewJournal, 'trandate', nlapiDateToString(transactionDate));
			}
				
			
			var hasLines = false;
			for (var iii in arrAllItems )
			{
				var stItem = arrAllItems[iii];
				
				if (arrAccrualVB[stItem] && arrAccrualItems[stItem])
				{
					if (arrAccrualVB[stItem]['amount'] == arrAccrualItems[stItem]['amount'])  
					{
						__log.writev('...both items are balanced, ', [arrAccrualVB[stItem], arrAccrualItems[stItem]]);				
						continue;
					}
					else
					{
						var acct = {'item' : stItem};						
						
						__log.writev('... getting the amounts ', [arrAccrualVB[stItem]['amount'], arrAccrualItems[stItem]['amount'], 
						                                          	(arrAccrualVB[stItem]['amount'] < arrAccrualItems[stItem]['amount']) ]);
						if ( arrAccrualVB[stItem]['amount'] > arrAccrualItems[stItem]['amount'] )
						{
							acct['debit'] 	= arrAccrualVB[stItem]['expacct'];
							acct['credit']	= arrAccrualVB[stItem]['puracct'];
							acct['amount'] 	= Math.abs( arrAccrualVB[stItem]['amount'] - arrAccrualItems[stItem]['amount'] ); 
						}
						if ( arrAccrualVB[stItem]['amount'] < arrAccrualItems[stItem]['amount'] )
						{
							acct['credit'] 	= arrAccrualVB[stItem]['expacct'];
							acct['debit']	= arrAccrualVB[stItem]['puracct'];
							acct['amount'] 	= Math.abs( arrAccrualVB[stItem]['amount'] - arrAccrualItems[stItem]['amount'] ); 
						}						
						__log.writev('...accounts setup', [acct]);						
						
						var arrJELines = ['debit','credit'];
						for ( var iiii in arrJELines)
						{
							var _lineTypeJE = arrJELines[ iiii ];
							
							//Create the JE Line
							recNewJournal.selectNewLineItem('line');
						
							__safe.setCurrentLineItemValue(recNewJournal, 'line', 'account', acct[_lineTypeJE] );
							__log.writev('...setting the account to ', [acct[_lineTypeJE]]);
							
							acct['amount'] = roundToCurrencyPrecision(acct['amount'], arrPurchOrd.getValue('currency'));
							__safe.setCurrentLineItemValue(recNewJournal, 'line', _lineTypeJE, acct['amount']);
							
							__safe.setCurrentLineItemValue(recNewJournal, 'line', 'item', acct['item']);
							// set the line item 
							var arrCategories = nlapiLookupField('item', acct['item'], ['custitem_category','custitem_subcat1','custitem_subcat2']); //10 units
							__safe.setCurrentLineItemValue(recNewJournal, 'line', 'custcol_item_accruals', acct['item']);				
							
							__safe.setCurrentLineItemValue(recNewJournal, 'line', 'custcol_misyscategory', arrCategories['custitem_category']);
							__safe.setCurrentLineItemValue(recNewJournal, 'line', 'custcol_misyssubcategory1', arrCategories['custitem_subcat1']);
							__safe.setCurrentLineItemValue(recNewJournal, 'line', 'custcol_misyssubcategory2', arrCategories['custitem_subcat2']);
							
							var arrLineFields = {
									 'department'	:'department'
									,'class'		:'class'
									,'location'		:'location'
									,'entity'		:'custcol_misysvendor'
									,'custbody_project_id' :'custcol_accruals_project'
									,'custbody_opportunityno' :'custcol_accruals_opportunity'
									,'custbody_po_customer' :'custcol_accruals_customer'						
							};
							
							for (var _fld in arrLineFields)
							{
								var fldJE = arrLineFields[_fld];
								var stValue = arrPurchOrd.getValue( _fld );
								
								if (stValue)
								{
									__safe.setCurrentLineItemValue(recNewJournal, 'line', fldJE, stValue);
									__log.writev('... Setting line field value', [_fld, fldJE, stValue]);
								}
								
							}
							
							__safe.setCurrentLineItemValue(recNewJournal, 'line', 'memo', 'Accrual Adjustment');
							recNewJournal.commitLineItem('line');
							hasLines = true;							
						} // endforline						
					}//end else
				} // end if
			}// end for items
			
			__log.writev('...done adding the lines', [hasLines]);
			
			// save this JE 
			if (hasLines)
			{
				__log.writev('** Submitting this journalentry record');
				
				var resultID = __safe.nlapiSubmitRecord(recNewJournal, true, true);	//20 units		
				if ( resultID )
				{
					__log.writev('Created Journal Entry ', [resultID]);
					__log.write('..Purchase Order reconciiled!');
					__safe.nlapiSubmitField('purchaseorder', stPurcOrdID, 'custbody_po_reconciled', 'T');
					__safe.nlapiSubmitField('purchaseorder', stPurcOrdID, 'custbody_accrualje_no', resultID);
					//custbody_accrualje_no
					//return true;
				}
					else continue;
			}
			else
			{
				// there are no items, so debits and credits must be balanced
				__log.writev('Credits / Debits is balanced!');
				__log.write('..Purchase Order reconciiled!');
				__safe.nlapiSubmitField('purchaseorder', stPurcOrdID, 'custbody_po_reconciled', 'T');
			}
			
			// try to reschedule
			__log.write('..remaining units=' + (parseInt(objContext.getRemainingUsage()) < 1000));
			__log.write('..remaining units=' + (parseInt(objContext.getRemainingUsage())));
			if (parseInt(objContext.getRemainingUsage()) < 1000)
			
			//if (! __usage.hasRemaining('10%') ) ///150 units to cater for
			{
				var params = new Array();
				params['custscript_searchfilter1'] = stPurcOrdID;

				// reschedule this script!
				var schedStatus = nlapiScheduleScript( nlapiGetContext().getScriptId(), null, params ); //20 units
				__log.writev('..rescheduling the script', schedStatus);
				if (schedStatus == 'QUEUED') return true;;
			}
			
			__log.write('****** END OF LOOP ******');
			
		}
		//o    The script will execute as a administrator.
		return __log.end(true, true);
		
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



//LIBRARY FUNCTIONS
function isEmpty(fld) {return (fld==null||fld=='');}
function isNotEmpty(fld) {return (fld!=null&&fld!='');}
function isTrue(fld) {return (isNotEmpty(fld)&&(fld=='T'||fld=='Y'));}
function isNotTrue(fld) {return (isEmpty(fld)||(fld!='T'&&fld!='Y'));}