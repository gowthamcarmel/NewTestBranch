function vatChangeTool(request,response) {
	 if ( request.getMethod() == 'GET' ){
        
		var form = nlapiCreateForm('VAT Number Change Tool');
		
		var select = form.addField('trantype','select', 'Transaction Type').setLayoutType('normal', 'startcol');
		select.addSelectOption('salesorder','Sales Order');
		select.addSelectOption('invoice','Invoice');
		select.addSelectOption('creditmemo','Credit Memo');
		
        form.addField('invnumber','text', 'Transaction Number')
		form.addField('newtaxregnum','text', 'New Tax Registration Number');
		form.addField('servicedeskticket','text', 'Service Desk Ticket');
        
        form.addSubmitButton('Submit');
 
        response.writePage( form );
    } else {
		var title = '';
		var message = '';
		var type = '';
		
		var servicedeskticket = request.getParameter('servicedeskticket');
		var transtype = request.getParameter('trantype');
		
		
		if(servicedeskticket == null || servicedeskticket == '') {
			title = 'Error';
			message = 'Service Desk Ticket is required.';
			type = 'error';
		} else {
			var invnumber = request.getParameter('invnumber');
			var newtaxregnum = request.getParameter('newtaxregnum');
			
			// Search Invoice Number 
			var filters = [];
			filters.push(new nlobjSearchFilter('tranid',null,'is', invnumber));
			
			var columns = [];
			columns.push(new nlobjSearchColumn('internalid'));
			
			var search = nlapiSearchRecord(transtype,null,filters, columns);
			
			if(search) {
				// Load Transaction and update vatregnum and custbody_service_desk_ticket
				var rec = nlapiLoadRecord(transtype,search[0].getId());
				
				rec.setFieldValue('vatregnum',newtaxregnum);
				rec.setFieldValue('custbody_service_desk_ticket',servicedeskticket);
				
				var id = nlapiSubmitRecord(rec);
				
				title = 'Confirmation';
				message = 'Transaction have been updated';
				type = 'confirmation';
				
			} else {
				title = 'Search Result';
				message = 'No transaction found. Search for '+invnumber+' returns no results.';
				type = 'info';
			}
		
		}
		
		
		var form = nlapiCreateForm('VAT Number Change Tool');
		
		var htmlMessage = form.addField('custpage_header', 'inlinehtml').setLayoutType('normal', 'startcol');
		htmlMessage.setDefaultValue('<div id="div__alert"><div class="uir-alert-box '+type+' session_'+type+'_alert" width="100%" role="status"><div class="icon '+type+'"><img src="/images/icons/messagebox/icon_msgbox_'+type+'.png" alt=""></div><div class="content"><div class="title">'+title+'</div><div class="descr">'+message+'</div></div></div></div>');
		
		var select = form.addField('trantype','select', 'Transaction Type');
		select.addSelectOption('salesorder','Sales Order');
		select.addSelectOption('invoice','Invoice');
		select.addSelectOption('creditmemo','Credit Memo');
		
        form.addField('invnumber','text', 'Transaction Number')
		form.addField('newtaxregnum','text', 'New Tax Registration Number');
		form.addField('servicedeskticket','text', 'Service Desk Ticket');
        
        form.addSubmitButton('Submit');
		
        response.writePage( form );
		
	}
}