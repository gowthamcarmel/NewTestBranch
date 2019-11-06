function editRevArrangement( request, response ){
	var recId = request.getParameter('custpage_revarrid');
	var RevArrRecObj = nlapiLoadRecord('revenuearrangement', recId);
	nlapiSubmitRecord( RevArrRecObj );
	nlapiLogExecution('DEBUG', 'Updated Revenue Arrangement', recId);
}