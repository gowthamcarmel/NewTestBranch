// [NS] Set Auto Update Flag on Currencies

function updatecurrencypull(){
	var context = nlapiGetContext();
	var autoupdateflag = context.getSetting('SCRIPT','custscript_autoupdate');

	for( var i = 1; i <= 107; i++){
		try{
			var rec = nlapiLoadRecord('currency', i);	
			if( rec.getFieldValue('isinactive') == 'F'){
				rec.setFieldValue('includeinfxrateupdates', autoupdateflag);
				nlapiSubmitRecord( rec );
			}
		}catch(e){
			nlapiLogExecution('DEBUG','updatecurrencypull','Error Encountered Possible inactive currency');
		}
	}
}