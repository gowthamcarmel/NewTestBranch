function adhoc1(){
	for ( var i = 1; i < 652; i++){
		try{
			var rec = nlapiLoadRecord('classification', i);
		}catch(e){
			nlapiLogExecution('DEBUG', i, 'Doesnt exist');	
		}
		nlapiLogExecution('DEBUG', i, rec.getFieldValue('parent') );
	}
}