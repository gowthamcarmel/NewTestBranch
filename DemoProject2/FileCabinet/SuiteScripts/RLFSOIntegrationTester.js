function RLFSOIntegrationTester(request,response) {
	 if ( request.getMethod() == 'GET' ){
        
		var form = nlapiCreateForm('RLF SO Integration Tester');
		
        form.addField('custparam_soid','text', '15 Character SO ID').setLayoutType('normal', 'startcol');
		form.addField('custparam_username','text', 'Username');
		form.addField('custparam_password','password', 'Password').setMaxLength(60);
		
		var select = form.addField('custparam_role','select', 'Role');
		select.addSelectOption('3','Admin');
		select.addSelectOption('18','Full Access');
        
        form.addSubmitButton('Submit');
 
        response.writePage( form );
    } else {
		var title = '';
		var message = '';
		var type = '';
		
		var soid = request.getParameter('custparam_soid');
		nlapiLogExecution('DEBUg','soid = '+soid);
		
		// Search misys_so_customrec which 
		var filters = [];
		filters.push(new nlobjSearchFilter('custrecordmisys_json_request_string',null,'contains',soid));
		
		var columns = [];
		columns.push(new nlobjSearchColumn('internalid'));
		
		var search = nlapiSearchRecord('customrecordcust_misys_sorec',null,filters,columns);
		
		if(search) {
			nlapiLogExecution('DEBUg','search = '+search.length);
			// Get the JSON String value from the record
			var rec = nlapiLoadRecord('customrecordcust_misys_sorec',search[0].getId());
			var JSONRequest = rec.getFieldValue('custrecordmisys_json_request_string');
			
			// Make a RESTlet call        
			// Get the role and domain of the RESTlet
			var username = request.getParameter('custparam_username');
			var password = request.getParameter('custparam_password');
			var role = request.getParameter('custparam_role');;
			var restDomain = '';
			
			var url = 'https://rest.netsuite.com/rest/roles';
			
			//Setting up Headers 
			var headers = {"User-Agent-x": "SuiteScript-Call",
						   "Authorization": "NLAuth nlauth_email=" + username + ", nlauth_signature=" + password,
						   "Accept": "*/*",
						   "Accept-Language":"en-us"};
						   
			var restresponse = nlapiRequestURL(url, null, headers);
			
			nlapiLogExecution('DEBUG','username = '+username+' password = '+password+' role = '+role);
			nlapiLogExecution('DEBUG','response = '+restresponse.getCode(),restresponse.getError());
			
			if(restresponse.getCode() == 200) {
				var userdetails = restresponse.getBody();
				var userdetailsArr = JSON.parse(userdetails);
				
				//check account and get role
				for (var x=0; x < userdetailsArr.length; x++) {
					var accountid = userdetailsArr[x].account.internalId;
					
					if(accountid == '3431250_SB99'){
						restDomain =  userdetailsArr[x].dataCenterURLs.restDomain;
					}
				}
				
				var url = restDomain+"/app/site/hosting/restlet.nl?script=586&deploy=1";
				
				nlapiLogExecution('DEBUG','username = '+username+' password = '+password+' role = '+role);
				nlapiLogExecution('DEBUG','url = '+url);
								
				//Setting up Headers 
				var headers = {"User-Agent-x": "SuiteScript-Call",
							   "Authorization": "NLAuth nlauth_account=3431250_SB99, nlauth_email=" + username + 
												", nlauth_signature= " + password + ", nlauth_role=" + role,
							   "Content-Type": "application/json"};

				nlapiLogExecution('DEBUG','JSONRequest',JSONRequest);
				 
				var restresponse = nlapiRequestURL(url, JSONRequest, headers);
				
				if(restresponse){
					var jsonresponse = JSON.parse(restresponse);
					
					if(jsonresponse.errorCode) {
						title = jsonresponse.getCode();
						message = jsonresponse.getBody();
						type = 'error';
						
					} else {
						title = 'Confirmation';
						message = restresponse.getBody();
						type = 'confirmation';
					
						//Delete misys_so_customrec record
						nlapiDeleteRecord('customrecordcust_misys_sorec',search[0].getId());
						
					}
					
				} else {
					title = 'Error';
					message = restresponse;
					type = 'error';
					
				}
				

			} else {
				title = 'Error : '+restresponse.getCode();
				message = restresponse.getBody();
				type = 'error';
			}

		} else {
			title = 'Search Result';
			message = 'No match for '+soid;
			type = 'info';
		}
		
		
		var form = nlapiCreateForm('RLF SO Integration Tester');
		
		var htmlMessage = form.addField('custpage_header', 'inlinehtml').setLayoutType('normal', 'startcol');
		htmlMessage.setDefaultValue('<div id="div__alert"><div class="uir-alert-box '+type+' session_'+type+'_alert" width="100%" role="status"><div class="icon '+type+'"><img src="/images/icons/messagebox/icon_msgbox_'+type+'.png" alt=""></div><div class="content"><div class="title">'+title+'</div><div class="descr">'+message+'</div></div></div></div><br>');
		
        form.addField('custparam_soid','text', '15 Character SO ID');
		form.addField('custparam_username','text', 'Username');
		form.addField('custparam_password','password', 'Password').setMaxLength(60);
		
		var select = form.addField('custparam_role','select', 'Role');
		select.addSelectOption('3','Admin');
		select.addSelectOption('18','Full Access');
		
		form.addSubmitButton('Submit');
		
		response.writePage( form );
		
	}
}


