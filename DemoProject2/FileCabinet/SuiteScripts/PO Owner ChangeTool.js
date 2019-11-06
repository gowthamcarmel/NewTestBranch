/**
 * Module Description
 * 
 * PO Owner change tool
 * 
 * Version    Date            Author           Remarks
 * 1.00       19 May 2017     gowthamr
 *
 */

/**
 * @param {nlobjRequest}
 *            request Request object
 * @param {nlobjResponse}
 *            response Response object
 * @returns {Void} Any output is written via response object
 */
function PO_OwnerChangeTool(request, response) {
	if (request.getMethod() == 'GET') {

		var form = nlapiCreateForm('PO Owner Change Tool');

		var select = form.addField('trantype', 'select', 'Transaction Type')
		.setLayoutType('normal', 'startcol');

		select.addSelectOption('purchaseorder', 'Purchase Order');

		form
		.addField('ponumber', 'text',
		'PO Number (Example : POIN10002308) ')
		form.addField('newemployee', 'text',
		'New Employee ID (Example : 00006503)');
		form.addField('servicedeskticket', 'text', 'Service Desk Ticket');

		form.addSubmitButton('Submit');

		response.writePage(form);
	} else {
		var title = '';
		var message = '';
		var type = '';

		var servicedeskticket = request.getParameter('servicedeskticket');
		var transtype = request.getParameter('trantype');

		if (servicedeskticket == null || servicedeskticket == '') {
			title = 'Error';
			message = 'Service Desk Ticket is required.';
			type = 'error';
		} else {

			var employeeid = request.getParameter('newemployee');

			log('employeeid:' + employeeid);

			// Search Employee internal id Number
			var filters = [];
			filters.push(new nlobjSearchFilter('entityid', null, 'is',
					employeeid));

			var columns = [];
			columns.push(new nlobjSearchColumn('internalid'));

			var searchemployeeid = nlapiSearchRecord('employee', null, filters,
					columns);
			var employeeinternalid;
			var employeeexist = true;
			if (searchemployeeid) {
				employeeinternalid = searchemployeeid[0].getId();
				employeeexist = true;
			} else {
				employeeexist = false;
				title = 'Search Result';
				message = 'No Employee found with ID : ' + employeeid + '';
				type = 'info';
			}
			if (employeeexist == true) {
				var ponumber = request.getParameter('ponumber');
				var newemployee = employeeinternalid;

				log('ponumber:' + ponumber);
				log('newemployee:' + newemployee);

				// Search PO Number
				var filters = [];
				filters.push(new nlobjSearchFilter('tranid', null, 'is',
						ponumber));
				filters.push(new nlobjSearchFilter('status', null, 'noneof',
						['PurchOrd:A','PurchOrd:H','PurchOrd:G']));

				var columns = [];
				columns.push(new nlobjSearchColumn('internalid'));

				var search = nlapiSearchRecord(transtype, null, filters,
						columns);

				if (search) {
					// Load Transaction and update Employee and
					// custbody_service_desk_ticket
					var rec = nlapiLoadRecord(transtype, search[0].getId());

					rec.setFieldValue('employee', newemployee);
                  rec.setFieldValue('custbody_mys_po_requester', newemployee);
					rec.setFieldValue('custbody_service_desk_ticket',
							servicedeskticket);

					var id = nlapiSubmitRecord(rec);

					title = 'Confirmation';
					message = 'Transaction have been updated';
					type = 'confirmation';

				} else {
					title = 'Search Result';
					message = 'No transaction found. Either PO  ' + ponumber
							+ ' number invalid or PO not approved or Fully billed or Closed.';
					type = 'info';
				}
			}

		}

		var form = nlapiCreateForm('PO Owner Change Tool');

		var htmlMessage = form.addField('custpage_header', 'inlinehtml')
				.setLayoutType('normal', 'startcol');
		htmlMessage
				.setDefaultValue('<div id="div__alert"><div class="uir-alert-box '
						+ type
						+ ' session_'
						+ type
						+ '_alert" width="100%" role="status"><div class="icon '
						+ type
						+ '"><img src="/images/icons/messagebox/icon_msgbox_'
						+ type
						+ '.png" alt=""></div><div class="content"><div class="title">'
						+ title
						+ '</div><div class="descr">'
						+ message
						+ '</div></div></div></div>');

		var select = form.addField('trantype', 'select', 'Transaction Type');

		select.addSelectOption('purchaseorder', 'Purchase Order');

		form
				.addField('ponumber', 'text',
						'PO Number (Example : POIN10002308) ')
		form.addField('newemployee', 'text',
				'New Employee ID (Example : 00006503)');
		form.addField('servicedeskticket', 'text', 'Service Desk Ticket');

		form.addSubmitButton('Submit');

		response.writePage(form);

	}
}
function log(message) {
	nlapiLogExecution('Debug', 'PO Owner Change Tool ', message);
}
