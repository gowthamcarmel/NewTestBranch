/**
 * This script will update the Next Billing Date for RB 3.01.1 Customers and beyond
 * If 'Today Is' Preference is used, it is assumed to be in Company Time Zone, not User Preference Time Zone.
 * Lastly, it is a prerequisite that SWV_SB_SS_MigrateSubscriptions has already been executed
 *
 * Do the following manual steps for this script:
 * 1. Create new Scheduled Script record and corresponding Deployment
 * 2. Add SWV_SB_Au_Parameters.js, SWV_SB_Au_Constants.js, and SWV_SB_Au_Library.js in the Libraries
 * 3. Add new Parameter: 'Last Subscription ID' [_last_subscription_id_rb] ('custscript' prefix is added automatically); Type: List/Record; List/Record: Subscription
 * 4. Add new Parameter: 'Desired Next Billing Date' [_desired_next_bill_date] ('custscript' prefix is added automatically); Type: Date;
 * 5. Add new Parameter: 'Subscriptions to Process' [_subs_to_process] ('custscript' prefix is added automatically); Type: List/Record; List/Record: Saved Search
 *
 *
 * enhancement to automate running of this script
 *
 */

function updateNextBillingDates() {

    var runParam = _lookupScriptParam('run_customscript_putchrg_hold');
    nlapiLogExecution('DEBUG', 'Checking run parameter...', runParam);

    if( runParam == '0'){
        
        var MSG_TITLE = 'updateNextBillingDates()';
        nlapiLogExecution('DEBUG', MSG_TITLE, '---- Start ----');

        var lastSubscriptionId = nlapiGetContext().getSetting('SCRIPT', 'custscript_last_subscription_id_rb');
        //var todayIs = nlapiGetContext().getSetting('SCRIPT', 'custscript_desired_next_bill_date');
    	//var savedSearch = nlapiGetContext().getSetting('SCRIPT', 'custscript_subs_to_process');
        var companyTz = Library.Timezone.getCompanyPrefTimezone();
        //todayIs = isUndefinedNullOrEmpty(todayIs) ? Library.Timezone.getTodayIsByTz(companyTz) : nlapiStringToDate(todayIs, 'datetimetz');
        //nlapiLogExecution('DEBUG', MSG_TITLE, 'todayIs = ' + todayIs);
        //billDateForThisMonth = nlapiDateToString(billDateForThisMonth, 'datetimetz');
        //nlapiLogExecution('DEBUG', MSG_TITLE, 'billDateForThisMonth = ' + billDateForThisMonth);
        
    	var results = nlapiSearchRecord('customrecord_sb_subscription', 'customsearch_misys_subs_to_update');
    	if (results != null) {
            nlapiLogExecution('DEBUG', MSG_TITLE, 'subscriptions in search = ' + results.length);

            var subscriptionId = '';
            for (var i = 0; i < results.length; i++) {
                //Reschedule the script
                if (nlapiGetContext().getRemainingUsage() < 1000) { //usage to process each record is assumed to be 1000
                    nlapiLogExecution('DEBUG', MSG_TITLE, 'Remaining Usage = ' + nlapiGetContext().getRemainingUsage());
                    rescheduleScript(subscriptionId);
                    break;
                }

                subscriptionId = results[i].getId();
    			var billDate = results[i].getValue('custrecord_misys_migrate_start_date');
    			nlapiLogExecution('DEBUG', MSG_TITLE, 'billDateForThisMonth = ' + billDate);
    			var billDateForThisMonth = nlapiStringToDate(billDate);
    			nlapiLogExecution('DEBUG', MSG_TITLE, 'billDateForThisMonth = ' + billDateForThisMonth);
    			var periodStart = nlapiDateToString(nlapiAddMonths(billDateForThisMonth, -1), 'datetimetz');
    			var periodEndforAnalytics = nlapiDateToString(nlapiAddDays(billDateForThisMonth, -1, 'datetimetz'));
                var subscFields = ['custrecord_sb_next_billing_date'];
                var subscValues = [nlapiDateToString(billDateForThisMonth, 'datetimetz')];
                var triggerMap = new Object();
                triggerMap.disabletriggers = true;
                triggerMap.ignoremandatoryfields = true;

                nlapiSubmitField('customrecord_sb_subscription', subscriptionId, subscFields, subscValues, triggerMap);
                nlapiLogExecution('DEBUG', MSG_TITLE, 'Subscription ' + subscriptionId + ' header was updated successfully.');

                var siFilters = new Array();
                siFilters.push(new nlobjSearchFilter('custrecord_sb_sbitem_subscription', null, 'is', subscriptionId));
                siFilters.push(new nlobjSearchFilter('custrecord_sb_sbitem_subscriptionitem', null, 'noneof', '@NONE@')); //Secondary Items only
                siFilters.push(new nlobjSearchFilter('isinactive', null, 'is', 'F'));
    //			siFilters.push(new nlobjSearchFilter('custrecord_sb_sbitem_billing_frequency', null, 'is', Constants.BILL_FREQ_MONTHLY()));
               // siFilters.push(new nlobjSearchFilter('custrecord_sb_sbitem_status', 'custrecord_sb_sbitem_subscriptionitem', 'anyof', [Constants.SubscriptionStatus.OPEN(),
                  //                                                                                                                     Constants.SubscriptionStatus.PENDING_TERMINATION(),
                 //                                                                                                                      Constants.SubscriptionStatus.PENDING_MIGRATION(),
                   //                                                                                                                    Constants.SubscriptionStatus.PENDING_RENEWAL(),
                  //                                                                                                                     Constants.SubscriptionStatus.INITIALIZING(),
                  //                                                                                                                    Constants.SubscriptionStatus.SUSPENDED()]));
    //

    			var siColumns = new Array();
    			siColumns.push(new nlobjSearchColumn('custrecord_sb_sbitem_billingmethod'));
    			siColumns.push(new nlobjSearchColumn('custrecord_sb_sbitem_last_billing_date'));
    			siColumns.push(new nlobjSearchColumn('custrecord_sb_sbitem_bill_freq_months'));
    			
                var siResults = nlapiSearchRecord('customrecord_sb_subscription_item', null, siFilters, siColumns);
    			
                if (siResults != null) {
                    nlapiLogExecution('DEBUG', MSG_TITLE, 'secondary items found for Subscription ' + subscriptionId + ' = ' + siResults.length);
                    for (var j = 0; j < siResults.length; j++) {
                        var subscItemId = siResults[j].getId();
                        var lastEndDate = null;
    					var nextBillDate = nlapiDateToString(billDateForThisMonth, 'datetimetz');
    					var billFreqMonths = siResults[j].getValue('custrecord_sb_sbitem_bill_freq_months');
    					var parentIsUpdated = nlapiLookupField('customrecord_sb_subscription', subscriptionId, 'custrecord_misys_stdt_updated');
    					var periodStart = nlapiDateToString(nlapiAddMonths(billDateForThisMonth, -1 * parseFloat(billFreqMonths)), 'datetimetz');
                        if (siResults[j].getValue('custrecord_sb_sbitem_billingmethod') == 2) { //PS CODE -- method = arrears
                            lastEndDate = nlapiAddMonths(billDateForThisMonth, -1 * parseFloat(billFreqMonths));
    						nlapiLogExecution('debug', 'Usage Sub Item - last End Date = ', lastEndDate);
    						var lastCycleEndDate = nlapiAddDays(lastEndDate, -1);
    						nlapiLogExecution('debug', 'last cycle end date = ', lastCycleEndDate);
    						}
    					else { //PS CODE -- method = advance
    						var lastCycleEndDate = nlapiAddDays(billDateForThisMonth, -1);
    						nlapiLogExecution('debug', 'Advance Item; last cycle End Date = ', lastCycleEndDate);						
                        } //EN PS code
                        var siFields = ['custrecord_sb_sbitem_next_billing_date', 'custrecord_sb_sbitem_last_billing_date', 'custrecord_sb_item_cycle_end_date'];
                        var siValues = [nlapiDateToString(billDateForThisMonth, 'datetimetz'), periodStart, nlapiDateToString(lastCycleEndDate, 'datetimetz')];

                        nlapiSubmitField('customrecord_sb_subscription_item', subscItemId, siFields, siValues, triggerMap);
                        nlapiLogExecution('DEBUG', MSG_TITLE, 'Subscription Item ' + subscItemId + ' was updated successfully.');

    					if (parentIsUpdated != 'T')
    					{
    						var subscFields = ['custrecord_sb_last_billing_date', 'custrecord_misys_stdt_updated'];
    						var subscValues = [periodStart, 'T'];
    						nlapiSubmitField('customrecord_sb_subscription', subscriptionId, subscFields, subscValues, triggerMap);
    						nlapiLogExecution('DEBUG', MSG_TITLE, 'Subscription ' + subscriptionId + ' had last bill date updated successfully.');
    					}
                    }
    			}
            }

            if (results.length == 1000) { //get more results
                rescheduleScript(subscriptionId);
            }
        }

        nlapiLogExecution('DEBUG', MSG_TITLE, '----- End -----');

        _updateScriptParam('run_customscript_putchrg_hold','1');
    }
}

function rescheduleScript(subscriptionId) {
    var MSG_TITLE = 'rescheduleScript()';
    var params = [];
    params['custscript_last_subscription_id_rb'] = subscriptionId;
    nlapiLogExecution('DEBUG', MSG_TITLE, 'Rescheduling script...');
    nlapiScheduleScript(nlapiGetContext().getScriptId(), nlapiGetContext().getDeploymentId(), params);
}

function isUndefinedNullOrEmpty(value) {
    return (!value || value == null || value == '');
}