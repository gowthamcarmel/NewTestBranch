function bulkTransfer(){
	var assetId = [8012,8013,8014,8015,8016],
    transfers = {
    AssetType   : null, //Ch
    Subsidiary  : 128 , 
    Class       : 135 ,  //use 'unset' if unsetting the class, otherwise input class id
    Department  : 8 ,  //use 'unset' if unsetting the dept, otherwise input dept id
    Location    : 118 },  //use 'unset' if unsetting the loc, otherwise input loc id
    statedef = [], stateval = [];
    
	for(var t in transfers) {
		if(transfers[t]) {
			statedef.push(t);
			stateval.push(transfers[t]);
		}
	}
	statedef = statedef.join(',');
	stateval = stateval.join(',');

	for(var i =0; i < assetId.length; i++) {
		var rec = nlapiCreateRecord('customrecord_bg_procinstance');

		rec.setFieldValue('custrecord_far_proins_procstatus', 5); // Queued
		rec.setFieldValue('custrecord_far_proins_activitytype', 1); // Direct Execution
		rec.setFieldValue('custrecord_far_proins_functionname', 'famTransferAsset');
		rec.setFieldValue('custrecord_far_proins_processname', 'Asset Transfer');
		rec.setFieldValue('custrecord_far_proins_procuser', 19741);
		rec.setFieldValue('custrecord_far_proins_reccount', 0);
		rec.setFieldValue('custrecord_far_proins_procmsg', '');
		rec.setFieldValue('custrecord_far_proins_recordid',assetId[i]);
		rec.setFieldValue('custrecord_far_proins_statedefn', statedef);
		rec.setFieldValue('custrecord_far_proins_procstate', stateval);
		nlapiSubmitRecord(rec);
	}
}

