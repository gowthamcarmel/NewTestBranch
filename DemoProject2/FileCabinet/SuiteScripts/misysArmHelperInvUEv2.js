/**
 * @NApiVersion 2.x
 * @NScriptType UserEventScript
 */
define(['N/record', 'N/runtime'],
    function (record, runtime){
        function invoiceArmInit(context){
            var rec = context.newRecord;
		
			// custcol_sb_end_date to custcol_arm_end_date
			// custcol_sb_start_date to custcol_arm_start_date
			var submitNeeded = 0;
			var recObj = record.load({ type: rec.type, id: rec.id });

			var itemCount = recObj.getLineCount('item');
			for( var i = 0; i < itemCount; i++){
				var varStartDate = recObj.getSublistValue({ sublistId: 'item', fieldId: 'custcol_sb_start_date', line: i });
				if( varStartDate ){ recObj.setSublistValue({ sublistId: 'item', fieldId: 'custcol_arm_start_date', line: i, value: varStartDate }); submitNeeded++; }
				var varEndDate = recObj.getSublistValue({ sublistId: 'item', fieldId: 'custcol_sb_end_date', line: i });
				if( varEndDate ){ recObj.setSublistValue({ sublistId: 'item', fieldId: 'custcol_arm_end_date', line: i, value: varEndDate }); submitNeeded++; }
			}

			if(submitNeeded > 0){ var currRecId = recObj.save(); }

		}
		return {
            afterSubmit: invoiceArmInit
        };
	}
);