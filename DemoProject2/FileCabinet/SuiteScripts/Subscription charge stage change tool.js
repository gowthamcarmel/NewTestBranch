function subscriptionchargechange(request,response) {
	 if ( request.getMethod() == 'GET' ){
        
		var form = nlapiCreateForm('Subscription charge stage change tool');
		
		/*var select = form.addField('trantype','select', 'Transaction Type').setLayoutType('normal', 'startcol');
		select.addSelectOption('salesorder','Sales Order');
		select.addSelectOption('invoice','Invoice');
		select.addSelectOption('creditmemo','Credit Memo');*/
		
        form.addField('subnumber','integer','Subscription Number')
		form.addField('startdate','date','startdate');
		
		select = form.addField('chargestage','select', 'Charge Stage').setLayoutType('normal', 'startcol');
		select.addSelectOption('Ready','Ready');
		select.addSelectOption('Hold','Hold');
				
		
        form.addField('servicedeskticket','text', 'EPIC Ticket');

        form.addSubmitButton('Submit');
               nlapiLogExecution('DEBUG', '1', 'Successfully submitted chsrge Schedule');
        response.writePage( form );
    } else {
		var title = '';
		var message = '';
		var type = '';
		
		var servicedeskticket = request.getParameter('servicedeskticket');
		
		
		
		if(servicedeskticket == null || servicedeskticket == '') {
			title = 'Error';
			message = 'Service Desk Ticket is required.';
			type = 'error';
		} else {
			var subnumber = request.getParameter('subnumber');
			var startdate = request.getParameter('startdate');
			var chargestage = request.getParameter('chargestage');
			
			// Search Invoice Number 
			var filters = [];
			filters.push(new nlobjSearchFilter('custrecord_sb_sc_subs',null,'anyof', subnumber));
			filters.push(new nlobjSearchFilter('custrecord_sb_sc_start_date',null,'on', startdate));
			
			var columns = [];
			columns.push(new nlobjSearchColumn('internalid'));
			nlapiLogExecution('DEBUG', '2', 'Successfully submitted chsrge Schedule');
			
			nlapiLogExecution('DEBUG', '2', subnumber);
			nlapiLogExecution('DEBUG', '2', startdate);
			var search = nlapiSearchRecord('charge',null,filters, columns);
			nlapiLogExecution('DEBUG', '3', 'Successfully submitted chsrge Schedule');
			//nlapiLogExecution('DEBUG', '2', 'search count :'search.length());
			if(search) {
				
				for (var i = 0; i < search.length; i++) { 
				// Load Transaction and update vatregnum and custbody_service_desk_ticket
				var rec = nlapiLoadRecord('charge',search[i].getId());
				
				rec.setFieldText('stage',chargestage);
			//	rec.setFieldValue('custbody_service_desk_ticket',servicedeskticket);
				
				nlapiLogExecution('DEBUG', '4', 'Successfully submitted chsrge Schedule');
				var id = nlapiSubmitRecord(rec);
				
				nlapiLogExecution('DEBUG', '5', 'id:'+id);
				}	
				title = 'Confirmation';
				message = 'Transaction have been updated';
				type = 'confirmation';
				
			} else {
				title = 'Search Result';
				message = 'No transaction found. Search for '+subnumber+' returns no results.';
				type = 'info';
			}
		
		}
		
		
		 
		var form = nlapiCreateForm('Subscription charge stage change tool');
		
		/*var select = form.addField('trantype','select', 'Transaction Type').setLayoutType('normal', 'startcol');
		select.addSelectOption('salesorder','Sales Order');
		select.addSelectOption('invoice','Invoice');
		select.addSelectOption('creditmemo','Credit Memo');*/
		
        form.addField('subnumber','text','Subscription Number')
		form.addField('startdate','text','startdate');
		
		select = form.addField('chargestage','select', 'Charge Stage').setLayoutType('normal', 'startcol');
		select.addSelectOption('ready','Ready');
		select.addSelectOption('hold','Hold');
				
		
        form.addField('servicedeskticket','text', 'EPIC Ticket');

        form.addSubmitButton('Submit');
 
        response.writePage( form );
		
	}
}