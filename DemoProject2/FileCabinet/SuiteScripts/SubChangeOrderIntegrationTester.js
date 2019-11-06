function subChangeOrderIntegrationTester(request,response) {
	 if ( request.getMethod() == 'GET' ){
        
		var form = nlapiCreateForm('Subscription Change Order Intergration Tester');
		
        var jsonpayload = form.addField('custparam_jsonpayload','textarea', 'JSON Payload');
		jsonpayload.setLayoutType('normal', 'startcol');
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
		
		var jsonpayload = request.getParameter('custparam_jsonpayload');
		nlapiLogExecution('DEBUg','jsonpayload = '+jsonpayload);
		
		
		// Make a RESTlet call        
		// Get the role and domain of the RESTlet
		var username = request.getParameter('custparam_username');
		var password = request.getParameter('custparam_password');
		var role = request.getParameter('custparam_role');
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
				
				if(accountid == '3431250_SB1'){
					role = userdetailsArr[x].role.internalId;
					restDomain =  userdetailsArr[x].dataCenterURLs.restDomain;
				}
			}
			
			var url = restDomain+"/app/site/hosting/restlet.nl?script=588&deploy=1";
			
			nlapiLogExecution('DEBUG','username = '+username+' password = '+password+' role = '+role);
			nlapiLogExecution('DEBUG','url = '+url);
							
			//Setting up Headers 
			var headers = {"User-Agent-x": "SuiteScript-Call",
						   "Authorization": "NLAuth nlauth_account=3431250_SB1, nlauth_email=" + username + 
											", nlauth_signature= " + password + ", nlauth_role=" + role,
						   "Content-Type": "application/json"};

			nlapiLogExecution('DEBUG','JSONRequest',jsonpayload);
			 
			var restresponse = nlapiRequestURL(url, jsonpayload, headers);
			
			if(restresponse.getCode() == 200) {
				title = 'Confirmation';
				message = restresponse.getBody();
				type = 'confirmation';
				
				
			} else {
				var errorresponse = restresponse.getBody();
				errorresponse = JSON.parse(errorresponse);
				
				title = errorresponse.error.code;
				message = errorresponse.error.message;
				type = 'error';
			}
		}
				
				
		var form = nlapiCreateForm('Subscription Change Order Intergration Tester');
		
		var htmlMessage = form.addField('custpage_header', 'inlinehtml').setLayoutType('normal', 'startcol');
		htmlMessage.setDefaultValue('<div id="div__alert"><div class="uir-alert-box '+type+' session_'+type+'_alert" width="100%" role="status"><div class="icon '+type+'"><img src="/images/icons/messagebox/icon_msgbox_'+type+'.png" alt=""></div><div class="content"><div class="title">'+title+'</div><div class="descr">'+message+'</div></div></div></div>');
		
		var jsonpayload = form.addField('custparam_jsonpayload','textarea', '15 Character SO ID');
		form.addField('custparam_username','text', 'Username');
		form.addField('custparam_password','password', 'Password').setMaxLength(60);
		
		var select = form.addField('custparam_role','select', 'Role');
		select.addSelectOption('3','Admin');
		select.addSelectOption('18','Full Access');
        
        form.addSubmitButton('Submit');
		
        response.writePage( form );
		
	}
}


