/**
 * @NApiVersion 2.x
 * @NScriptType UserEventScript
 */
define(['N/record', 'N/runtime'],
    function (record, runtime){
        function rbChangeOrderHelper(context){ if ( (context.type == context.UserEventType.CREATE) || (context.type == context.UserEventType.EDIT) || (context.type == context.UserEventType.XEDIT) ){
        	// retrieve external ID
        	var rec = context.newRecord;
            var recObj = record.load({ type: rec.type, id: rec.id });

            var coExternalId = recObj.getValue('externalid');
            var secondaryItemId = recObj.getValue('custrecord_sb_sco_subscription_item_sec');

            if( coExternalId && ( coExternalId.charAt(0) != 0 ) ){
            	var yrSubstring = coExternalId.substr(0,4);
            	log.debug('test2', yrSubstring);
            	var subsSecItemId = record.submitFields({ type: 'customrecord_sb_subscription_item', id: secondaryItemId, values: { custrecord_msys_sb_am_yr: yrSubstring } });
            }
        }}

        return {
            afterSubmit: rbChangeOrderHelper
        };
    }
);