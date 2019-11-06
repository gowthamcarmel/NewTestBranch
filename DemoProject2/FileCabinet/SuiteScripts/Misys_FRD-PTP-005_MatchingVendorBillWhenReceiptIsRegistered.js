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
 **/

/**
 * A scheduled script that will execute a Saved Search: **SCRIPT USE: Pending Approval Bills - 3 way match
 *  and then sets Vendor Bill to Approved if it satisfies all conditions in the [NS] Vendor Bill Approval Routing Workflow
 * 
 * Version    Date            Author           Remarks
 * 1.00       21 Oct 2013     gmanarang
 *
 */

/**
 * @param {String} type Context Types: scheduled, ondemand, userinterface, aborted, skipped
 * @returns {Void}
 */
function scheduled_3WayMatchApproval(type) 
{
	
	var stLoggerTitle = 'scheduled_3WayMatchApproval';		
	nlapiLogExecution('DEBUG', stLoggerTitle, '>> Entry <<');
	
	// Retrieve the ff from the script parameter: Saved Search
	var context = nlapiGetContext();
    var stSavedSearch = context.getSetting('SCRIPT', 'custscript_vendorbill_toprocess_srch');
                            
    // Execute the Saved Search and retrieve the Vendor Bill to be updated       
    var arrResults = nlapiSearchRecord('transaction', stSavedSearch);
    if (arrResults)
    {
    	nlapiLogExecution('DEBUG', stLoggerTitle, 'Processing Saved Search Results MEMO is Bill-PO Partial Receipt Quantity Exceeded and status = Pending Approval');
    	for (var i in arrResults)
        {        
            checkGovernance(100);           
    		var stVB = arrResults[i].getValue('internalid');
    		nlapiLogExecution('DEBUG', stLoggerTitle, 'Processing Vendor Bill Id: '+stVB);
    		var filter = new Array();  
			filter.push(new nlobjSearchFilter('internalid', null, 'anyof', stVB));
			
			// Verify if this still satisfies this check **SCRIPT USE: Vendor Bill PO Partial Rcpt Qty Check 
			var arrPartialRcptQtyCheckResult = nlapiSearchRecord('transaction', 'customsearch_script_vb_po_partial_rcpt', filter);
			if(arrPartialRcptQtyCheckResult)
			{
				nlapiLogExecution('DEBUG', stLoggerTitle, 'Proceed to Next Record. Vendor Bill = ' + stVB+
														  ' did not satisfy Vendor Bill PO Partial Rcpt Qty Check');
				continue;
			}
			else
			{
				nlapiLogExecution('DEBUG', stLoggerTitle, 'Next Check PO Quantity Check on Vendor Bill = ' + stVB);
				// Verify if this still satisfies this check **SCRIPT USE: Vendor Bill PO Quantity Check
				var arrPOQtyCheckResult = nlapiSearchRecord('transaction', 'customsearch_script_vb_po_qty', filter);
				if(arrPOQtyCheckResult)
				{
					nlapiSubmitField('vendorbill', stVB, 'memo', 'Bill-PO Quantity Exceeded');
					nlapiLogExecution('DEBUG', stLoggerTitle, 'Updated Memo to Bill-PO Quantity Exceeded. Proceed to Next Record. Vendor Bill = ' + stVB+
							                                  ' did not satisfy Vendor Bill PO Quantity Check');
					continue;
				}
				else
				{
					nlapiLogExecution('DEBUG', stLoggerTitle, 'Next Check PO Amount Check on Vendor Bill = ' + stVB);
					// Verify if this still satisfies this check **SCRIPT USE: Vendor Bill PO Amount Check
					var arrPOAmtCheckResult = nlapiSearchRecord('transaction', 'customsearch_script_vb_po_amt', filter);
					if(arrPOAmtCheckResult)
					{
						nlapiSubmitField('vendorbill', stVB, 'memo', 'Bill-PO Amount Exceeded');
						nlapiLogExecution('DEBUG', stLoggerTitle, 'Updated Memo to Bill-PO Amount Exceeded. Proceed to Next Record. Vendor Bill = ' + stVB+
								                                  ' did not satisfy Vendor Bill PO Amount Check');
						continue;
					}
					else
					{
						nlapiLogExecution('DEBUG', stLoggerTitle, 'Next Check PO Pending Approval Check on Vendor Bill = ' + stVB);
						// Verify if this still satisfies this check **SCRIPT USE: Vendor Bill PO Pending Approval 
						var arrPOAmtCheckResult = nlapiSearchRecord('transaction', 'customsearch_script_vb_po_pending_approv', filter);
						if(arrPOAmtCheckResult)
						{
							nlapiSubmitField('vendorbill', stVB, 'memo', 'Purchase Order currently in Pending Approval status');
							nlapiLogExecution('DEBUG', stLoggerTitle, 'Updated Memo to Bill-PO Amount Exceeded. Proceed to Next Record. Vendor Bill = ' + stVB+
									                                  ' did not satisfy Vendor Bill PO Pending Approval Check');
							continue;
						}
						else
						{
							try
							{   
								//@dicasiano remove WT line (Misys case #1907485 - Withholding was deducted twice on a bill)
								//if vendorbill column custcol_4601_witaxline == “T”, remove this line
								var vbRec = nlapiLoadRecord('vendorbill', stVB);
								var cnt = vbRec.getLineItemCount('item');
								for (var i=1; i<=cnt; i++){
									var isWT = vbRec.getLineItemValue('item', 'custcol_4601_witaxline', i);
                                                                        nlapiLogExecution('DEBUG', stLoggerTitle, 'isWt = ' + isWT );
									if(isWT == 'T'){
										vbRec.removeLineItem('item', i);
                                                                                nlapiLogExecution('DEBUG', stLoggerTitle, 'remove line item = ' + i);
									}
								}
								nlapiSubmitField('vendorbill', stVB, 'approvalstatus', '2');
								nlapiLogExecution('DEBUG', stLoggerTitle, 'Approved Vendor Bill = ' + stVB);
 					    		        nlapiLogExecution('DEBUG', stLoggerTitle, 'Successfully set Vendor Bill to Approved status');
							}
							catch(e)
							{
								nlapiLogExecution('DEBUG', stLoggerTitle, 'ERROR: '+e.toString());
							}
							
						}
					}
				}
				
			}    		
        }
    }
    
    nlapiLogExecution('DEBUG', stLoggerTitle, '>> EXIT <<');
}


/**  
 * Checks governance then calls yield
 * @param 	{Integer} myGovernanceThreshold 
 * 
 * @returns {Void} 
 */
function checkGovernance(myGovernanceThreshold)
{
	var context = nlapiGetContext();
	
	if( context.getRemainingUsage() < myGovernanceThreshold )
	{
		var state = nlapiYieldScript();
		if( state.status == 'FAILURE')
		{
			nlapiLogExecution("ERROR","Failed to yield script, exiting: Reason = "+state.reason + " / Size = "+ state.size);
			throw "Failed to yield script";
		} 
		else if ( state.status == 'RESUME' )
		{
			nlapiLogExecution("AUDIT", "Resuming script because of " + state.reason+".  Size = "+ state.size);
		}
		// state.status will never be SUCCESS because a success would imply a yield has occurred.  The equivalent response would be yield
	}
}
