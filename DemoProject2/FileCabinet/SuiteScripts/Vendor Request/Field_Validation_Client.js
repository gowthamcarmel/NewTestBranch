/**
 * Module Description
 * 
 * Version    Date            Author           Remarks
 * 1.00       13 Mar 2015     vabhpant
 *
 */

/**
 * The recordType (internal id) corresponds to the "Applied To" record in your script deployment. 
 * @appliedtorecord recordType
 * @returns {Boolean} True to continue save, false to abort save
 */
function onSave_validateFields() {

	var vendorType = nlapiGetFieldValue('custrecord_vr_type');
	var isPerson = 'T';
	if (vendorType == 1) {
		isPerson = 'F';
	}
	
	if (isPerson=='T'){
		var firstName = nlapiGetFieldValue('custrecord_vr_first_name');
		var lastName = nlapiGetFieldValue('custrecord_vr_last_name');
		if(isEmpty(firstName) || isEmpty(lastName)){
			alert("Please enter the first name and last name for the new Vendor");
			return false;
		}
	}
	if(isPerson=='F'){
		var firstNameContact = nlapiGetFieldValue('custrecord_vr_contact_firstname');
		var contactPhone = nlapiGetFieldValue('custrecord_vr_contact_phone');
		if(isEmpty(firstNameContact) || isEmpty(contactPhone)){
			alert("Please enter details for the Contact, primarily the first name and phone number for the new Vendor Contact");
			return false;
		}
	}
	
	//Bank Details mandatory fields validation.
	//var count = nlapiGetLineItemCount('recmachcustrecord_item_req_ver');
	//nlapiLogExecution('DEBUG','Count',count);
	//var new_req = nlapiGetFieldValue('custrecord_new_req');
	
	//if (count < 1 && new_req == 'T')
	//{
	//	alert("Please attach atleast one item for the vendor");
	//		return false;
	//}
	var bank_format = nlapiGetFieldValue('custrecord_ven_req_bank_fmt');

	var iban = nlapiGetFieldValue('custrecord_ven_req_iban');
	var swift = nlapiGetFieldValue('custrecord_ven_req_swift_code');
	var acc_num = nlapiGetFieldValue('custrecord_ven_req_acc_num');
	var sort_code = nlapiGetFieldValue('custrecord_ven_req_sort_code');
	var bank_code = nlapiGetFieldValue('custrecord_ven_req_bank_code');
	var bank_name = nlapiGetFieldValue('custrecord_ven_req_bank_name');
	var branch_name = nlapiGetFieldValue('custrecord_ven_req_branch_name');
	var bic_sort = nlapiGetFieldValue('custrecord_ven_req_bic_sort');
	var micr = nlapiGetFieldValue('custrecord_ven_req_micr');
	var ifsc = nlapiGetFieldValue('custrecord_ven_req_ifsc');
	var branch_num = nlapiGetFieldValue('custrecord_ven_req_bank_branch_num');
	var bank_loc = nlapiGetFieldValue('custrecord_ven_req_bank_loc');
	var email = nlapiGetFieldValue('custrecord_ven_req_bank_email');
	
	// If item-category is contractor Bank Details are not mandatory
	var item_cat = nlapiGetFieldText('custrecord_ven_req_item_category');
	nlapiLogExecution('DEBUG', 'Item Category', item_cat);
	
	if (item_cat == 'Contractors') {
		return true;
	}
		
	switch (bank_format) {
	
	case 'Barclays MT103' :
		if (isEmpty(iban) || isEmpty(swift)) {
			nlapiLogExecution('ERROR', 'Barclays MT103', 'IBAN and Swift code fields are mandatory for the selected Bank format.');
			alert("IBAN and Swift code fields are mandatory for the Barclays MT103 Bank format.");
			return false;
		}
	break;
	case 'Barclays Sage Format - PROD' :	
		if (isEmpty(acc_num) || isEmpty(sort_code)) {
			nlapiLogExecution('ERROR', 'Barclays Sage Format - PROD', 'Account number and Sort code are mandatory for the selected Bank format.');
			alert("Account number and Sort code are mandatory for the Barclays Sage Format - PROD Bank format");
			return false;
		}
	break;
	case 'CBD' :  
		if (isEmpty(iban) || isEmpty(bank_code)) {
			nlapiLogExecution('ERROR', 'CBD', 'IBAN and Bank code fields are mandatory for the selected Bank format.');
			alert("IBAN and Bank code fields are mandatory for the CBD Bank format.");
			return false;
		}
	break;
	case 'Generic Payment Format' :
		if (isEmpty(acc_num) || isEmpty(bank_name)) {
			nlapiLogExecution('ERROR', 'Generic Payment Format', 'Account no and Bank Name fields are mandatory for the selected Bank format.');
			alert("Account no and Bank Name fields are mandatory for the Generic Payment Format.");
			return false;
		}
	break;
	case 'HSBC SEPA' :
		if (isEmpty(iban) || isEmpty(swift)) {
			nlapiLogExecution('ERROR', 'HSBC SEPA', 'IBAN and Swift code fields are mandatory for the selected Bank format.');
			alert("IBAN and Swift code fields are mandatory for the HSBC SEPA Bank format.");
			return false;
		}
	break;
	case 'RBS SEPA Credit Transfer' :
		if (isEmpty(iban) || isEmpty(swift)) {
			nlapiLogExecution('ERROR', 'RBS SEPA Credit Transfer', 'IBAN and Swift code fields are mandatory for the selected Bank format.');
			alert("IBAN and Swift code fields are mandatory for the RBS SEPA Credit Transfer Bank format.");
			return false;
		}
	break;
	case 'HDFC Supplier' :
		if (isEmpty(acc_num) || isEmpty(micr) || isEmpty(ifsc)) {
			nlapiLogExecution('ERROR', 'HDFC Supplier', 'Acc number, Micr and IFSC fields are mandatory for the selected Bank format.');
			alert("Acc number, Micr and IFSC fields are mandatory for the HDFC Supplier Bank format.");
			return false;
		}
	break;
	case 'HSBC India (Vendors)' :
		if (isEmpty(acc_num) || isEmpty(micr) || isEmpty(ifsc)) {
			nlapiLogExecution('ERROR', 'HSBC India (Vendors)', 'Acc number, Micr and IFSC fields are mandatory for the selected Bank format.');
			alert("Acc number, Micr and IFSC fields are mandatory for the HSBC India (Vendors) Bank format.");
			return false;
		}
	break;
	case 'BAML SEPA (Vendors)' :
		if (isEmpty(iban) || isEmpty(swift)) {
			nlapiLogExecution('ERROR', 'HSBC SEPA', 'IBAN and Swift code fields are mandatory for the selected Bank format.');
			alert("IBAN and Swift code fields are mandatory for the BAML SEPA (Vendors).");
			return false;
		}
	break;
	case 'BAML URGP (Vendors)' :
		if (isEmpty(iban) || isEmpty(swift)) {
			nlapiLogExecution('ERROR', 'BAML URGP', 'IBAN and Swift code fields are mandatory for the selected Bank format.');
			alert("IBAN and Swift code fields are mandatory for the BAML URGP (Vendors).");
			return false;
		}
	break;
	case 'BAML NURG (Vendors)' :
		if (isEmpty(iban) || isEmpty(bank_code)) {
			nlapiLogExecution('ERROR', 'BAML NURG', 'IBAN and Bank code fields are mandatory for the selected Bank format.');
			alert("IBAN and Bank code fields are mandatory for the BAML NURG (Vendors).");
			return false;
		}
	break;
	case 'HSBC US ACH (Vendors)' :
		if (isEmpty(acc_num) || isEmpty(bic_sort)) {
			nlapiLogExecution('ERROR', 'HSBC US ACH (Vendors)', 'Account no and ABA ROUTING No fields are mandatory for the selected Bank format.');
			alert("Account no and ABA ROUTING No fields are mandatory for the HSBC US ACH (Vendors).");
			return false;
		}
	break;
	case 'HSBC Australia (Vendors)' :
		if (isEmpty(acc_num) || isEmpty(bank_name) || isEmpty(bic_sort) || isEmpty(swift)) {
			nlapiLogExecution('ERROR', 'HSBC Australia (Vendors)', 'Account no, Bank Name, BSB Code and Swift Code fields are mandatory for the selected Bank format.');
			alert("Account no, Bank Name, BSB Code and Swift Code fields are mandatory for the HSBC Australia (Vendors).");
			return false;
		}
	break;
	case 'HSBC Singapore (Vendors)' :
		if (isEmpty(acc_num) || isEmpty(bank_name) || isEmpty(branch_num) || isEmpty(bank_code) || isEmpty(swift)) {
			nlapiLogExecution('ERROR', 'HSBC Singapore (Vendors))', 'Account no, Bank Name, Branch Code, Bank Code and Swift Code fields are mandatory for the selected Bank format.');
			alert("Account no, Bank Name, Branch Code, Bank Code and Swift Code fields are mandatory for the HSBC Singapore (Vendors).");
			return false;
		}
	break;
	default :
		nlapiLogExecution('Error', 'Not defined', 'No Bank format defined for selected subsidiary-currency combination.');
		return false;
	}
	
	return true;
}
	
/**
 * Function is to enable/disable fields based on subsidiary-Currency-bank format mapping.
 * @param type
 * @param field
 * @returns {Boolean}
 */
function onEdit_DisplayFields(type, field) {
	
	var title = 'onEdit_DisplayFields';
	var context = nlapiGetContext();
	var mode = context.getExecutionContext();

	nlapiLogExecution('DEBUG', title, '--- START ---');
	if ( context.getExecutionContext() != 'userinterface') return false;
	
	try {
		var subs = nlapiGetFieldValue('custrecord_vr_subsidiary');
		
		    if (field == 'custrecord_vr_primary_currency' || field == 'custrecord_vr_subsidiary') {
				 
                                nlapiLogExecution('DEBUG', title, 'sub or curr changed');

				var filters = new Array();
				filters[0] = new nlobjSearchFilter('custrecord_ven_subs', null, 'anyof', nlapiGetFieldValue('custrecord_vr_subsidiary'));
				filters[1] = new nlobjSearchFilter('custrecord_ven_curr', null, 'anyof', nlapiGetFieldValue('custrecord_vr_primary_currency'));
				filters[2] = new nlobjSearchFilter('isinactive', null, 'is', 'F');
				
				var columns = new Array();
				columns[0] = new nlobjSearchColumn('custrecord_ven_bank_format');
				
				var searchResults = nlapiSearchRecord('customrecord_sub_cur_bank_fmt', null, filters, columns);
				if (searchResults != null) {
					var results = searchResults[0];
					nlapiLogExecution('DEBUG', title, 'Results = '+results);
					
					nlapiSetFieldValue('custrecord_ven_req_bank_fmt', results.getValue('custrecord_ven_bank_format'));
				}
				else if (subs == 192) {
nlapiLogExecution('DEBUG', title, 'no result so 192');
					HU2_HUF_BankFormatSelection();
				}
				else if  (subs == 74) {
nlapiLogExecution('DEBUG', title, 'no result so 74');
					US1_USD_BankFormatSelection();
				}
					
								
				nlapiLogExecution('DEBUG', title, 'Execution Context is '+mode+' and field edited is '+field+' type is '+type);
				var result = chooseFieldsToEnable();
				
				nlapiLogExecution('DEBUG', title, '--- END SUCCESSFULLY ---');
				return result;
			}
			else if (subs == 192 && field == 'custrecord_ven_req_iban'){
nlapiLogExecution('DEBUG', title, '192 with iban changed');
			HU2_HUF_BankFormatSelection();
			var result = chooseFieldsToEnable();
			return result;
			}
			else if (subs == 74 && field == 'custrecord_vr_country') {
nlapiLogExecution('DEBUG', title, '74 with country changed');
			US1_USD_BankFormatSelection();
			var result = chooseFieldsToEnable();
			return result;			
			}
	}
	catch(error) {
	   	if (error.getDetails != undefined) {
	         nlapiLogExecution('ERROR','Process Error',  error.getCode() + ': ' + error.getDetails());
	         throw error;
	   	}
		else {
		     nlapiLogExecution('ERROR','Unexpected Error', error.toString()); 
		     throw nlapiCreateError('99999', error.toString());
		}
	return false;
	}
}

/**
 * Function is to Enable/Disable required bank detail fields upon edit of vendor request.
 * @returns
 */

function init_EnableFields() {
	var title =  'init_EnableBankDetailFields';
	
	try {
		var bank_format = nlapiGetFieldValue('custrecord_ven_req_bank_fmt');
		nlapiLogExecution('DEBUG', title, 'Bank Format= '+bank_format);
		
		if (isEmpty(bank_format)) {
				var filters = new Array();
				filters[0] = new nlobjSearchFilter('custrecord_ven_subs', null, 'anyof', nlapiGetFieldValue('custrecord_vr_subsidiary'));
				filters[1] = new nlobjSearchFilter('custrecord_ven_curr', null, 'anyof', nlapiGetFieldValue('custrecord_vr_primary_currency'));
				filters[2] = new nlobjSearchFilter('isinactive', null, 'is', 'F');
					
				var columns = new Array();
				columns[0] = new nlobjSearchColumn('custrecord_ven_bank_format');
					
				var searchResults = nlapiSearchRecord('customrecord_sub_cur_bank_fmt', null, filters, columns);
				if (searchResults != null) {
					var results = searchResults[0];
					nlapiSetFieldValue('custrecord_ven_req_bank_fmt', results.getValue('custrecord_ven_bank_format'));
				}
				else if (nlapiGetFieldValue('custrecord_vr_subsidiary') == 192) {
					HU2_HUF_BankFormatSelection();
				}
				else if  (nlapiGetFieldValue('custrecord_vr_subsidiary') == 74) {
					US1_USD_BankFormatSelection();
				}			
		}
		var result = chooseFieldsToEnable();
		return result;
	}
	catch(error) {
    	if (error.getDetails != undefined) {
            nlapiLogExecution('ERROR','Process Error',  error.getCode() + ': ' + error.getDetails());
            throw error;
        }
        else {
            nlapiLogExecution('ERROR','Unexpected Error', error.toString()); 
            throw nlapiCreateError('99999', error.toString());
        }
        return false;
	}
}

/**
 * Function is to decide which fields should be enabled, based on selected Bank format.
 * This function works with init function as well as onEdit function.
 * @returns {Boolean}
 */

function chooseFieldsToEnable() {

	var title = 'chooseFieldsToEnable';
	
	try {
		var bank_format = nlapiGetFieldValue('custrecord_ven_req_bank_fmt');
		nlapiLogExecution('DEBUG', title, 'Bank format is '+bank_format);
		
		var param = new Array();
		param['iban'] = true;
		param['swift'] = true;
		param['acc_num'] = true;
		param['sort_code'] = true;
		param['bank_code'] = true;
		param['bank_name'] = true;
		param['branch_name'] = true;
		param['bic_sort'] = true;
		param['micr'] = true;
		param['ifsc'] = true;
		param['branch_num'] = true;
		param['bank_loc'] = true;
		param['notify_email'] = true;
		
		switch (bank_format) {
		
			case 'Barclays MT103' :
				nlapiLogExecution('DEBUG', title, 'Switch format is Barclays MT103');
				param['iban'] = false;
				param['swift'] = false;
				setFieldsEnabled(param);
			break;
			case 'Barclays Sage Format - PROD' :	
				nlapiLogExecution('DEBUG', title, 'Switch format is Barclays Sage Format - PROD');
				param['acc_num'] = false;
				param['sort_code'] = false;
				setFieldsEnabled(param);
			break;
			case 'CBD' :
				nlapiLogExecution('DEBUG', title, 'Switch format is CBD');
				param['iban'] = false;
				param['bank_code'] = false;
				setFieldsEnabled(param);
			break;
			case 'Generic Payment Format' :	
				nlapiLogExecution('DEBUG', title, 'Switch format is Generic Payment Format');
				param['acc_num'] = false;
				param['bank_name'] = false;
				param['branch_name'] = false;
				param['iban'] = false;
				param['bic_sort'] = false;
				param['swift'] = false;
				setFieldsEnabled(param);
			break;
			case 'HSBC SEPA' : 
				nlapiLogExecution('DEBUG', title, 'Switch format is HSBC SEPA');
				param['iban'] = false;
				param['swift'] = false;
				setFieldsEnabled(param);
			break;
			case 'RBS SEPA Credit Transfer' :	
				nlapiLogExecution('DEBUG', title, 'Switch format is HSBC SEPA');
				param['iban'] = false;
				param['swift'] = false;
				param['notify_email'] = false;
				setFieldsEnabled(param);
			break;
			case 'HDFC Supplier' : 
				nlapiLogExecution('DEBUG', title, 'Switch format is HDFC Supplier');
				param['acc_num'] = false;
				param['micr'] = false;
				param['ifsc'] = false;
				param['bank_name'] = false;
				param['branch_num'] = false;
				param['bank_loc'] = false;
				param['notify_email'] = false;
				setFieldsEnabled(param);
			break;
			case 'HSBC India (Vendors)' : 
				nlapiLogExecution('DEBUG', title, 'Switch format is HSBC India (Vendors)');
				param['acc_num'] = false;
				param['micr'] = false;
				param['ifsc'] = false;
				param['bank_name'] = false;
				param['branch_num'] = false;
				param['bank_loc'] = false;
				param['notify_email'] = false;
				setFieldsEnabled(param);
			break;
			case 'BAML SEPA (Vendors)' : 
				nlapiLogExecution('DEBUG', title, 'Switch format is BAML SEPA (Vendors)');
				param['iban'] = false;
				param['swift'] = false;
				setFieldsEnabled(param);
			break;
			case 'BAML URGP (Vendors)' : 
				nlapiLogExecution('DEBUG', title, 'Switch format is BAML URGP (Vendors)');
				param['iban'] = false;
				param['swift'] = false;
				setFieldsEnabled(param);
			break;
			case 'BAML NURG (Vendors)' : 
				nlapiLogExecution('DEBUG', title, 'Switch format is BAML NURG (Vendors)');
				param['iban'] = false;
				param['bank_code'] = false;
				setFieldsEnabled(param);
			break;
			case 'HSBC US ACH (Vendors)' : 
				nlapiLogExecution('DEBUG', title, 'Switch format is HSBC US ACH (Vendors)');
				param['acc_num'] = false;
				param['bic_sort'] = false;
				param['bank_name'] = false;
				setFieldsEnabled(param);
			break;
			case 'HSBC Australia (Vendors)' : 
				nlapiLogExecution('DEBUG', title, 'Switch format is HSBC Australia (Vendors)');
				param['acc_num'] = false;
				param['bic_sort'] = false;
				param['bank_name'] = false;
				param['swift'] = false;
				setFieldsEnabled(param);
			break;
			case 'HSBC Singapore (Vendors)' : 
				nlapiLogExecution('DEBUG', title, 'Switch format is HSBC Singapore (Vendors)');
				param['acc_num'] = false;
				param['bank_name'] = false;
				param['branch_num'] = false;
				param['bank_code'] = false;
				param['swift'] = false;
				setFieldsEnabled(param);
			break;
			default :
				nlapiLogExecution('Error', title, 'Selected Bank Details type has not been defined.');
			break;
		}
	}
	catch(error) {
    	if (error.getDetails != undefined) {
            nlapiLogExecution('ERROR','Process Error',  error.getCode() + ': ' + error.getDetails());
            throw error;
        }
        else {
            nlapiLogExecution('ERROR','Unexpected Error', error.toString()); 
            throw nlapiCreateError('99999', error.toString());
        }
        return false;
	}
	return true;
}


/**
 * Enable/Disable fields based on input received from chooseFieldsToEnable()
 * @param param
 * @returns {Boolean}
 */
function setFieldsEnabled(param) {
	
	nlapiDisableField('custrecord_ven_req_iban', param['iban']);
	nlapiDisableField('custrecord_ven_req_swift_code', param['swift']);
	nlapiDisableField('custrecord_ven_req_acc_num', param['acc_num']);
	nlapiDisableField('custrecord_ven_req_sort_code', param['sort_code']);
	nlapiDisableField('custrecord_ven_req_bank_code', param['bank_code']);
	nlapiDisableField('custrecord_ven_req_bank_name', param['bank_name']);
	nlapiDisableField('custrecord_ven_req_branch_name', param['branch_name']);
	nlapiDisableField('custrecord_ven_req_bic_sort', param['bic_sort']);
	nlapiDisableField('custrecord_ven_req_micr', param['micr']);
	nlapiDisableField('custrecord_ven_req_ifsc', param['ifsc']);
	nlapiDisableField('custrecord_ven_req_bank_branch_num', param['branch_num']);
	nlapiDisableField('custrecord_ven_req_bank_loc', param['bank_loc']);
	nlapiDisableField('custrecord_ven_req_bank_email', param['notify_email']);
		
	return true;
}

function HU2_HUF_BankFormatSelection(){
	
	var title = 'HU2-HUF Bank format selection';
	nlapiLogExecution('DEBUG', title, '----START----');
	
	try {
		nlapiLogExecution('DEBUG', title, nlapiGetFieldValue('custrecord_vr_primary_currency'));
		nlapiLogExecution('DEBUG', title, nlapiGetFieldValue('custrecord_ven_req_iban'));
		
		if (nlapiGetFieldValue('custrecord_vr_primary_currency')== 40) {
			var iban_initial = (nlapiGetFieldValue('custrecord_ven_req_iban').substring(0,2)).toUpperCase();
			if (iban_initial == 'HU')
				nlapiSetFieldValue('custrecord_ven_req_bank_fmt', 'BAML NURG (Vendors)');
			else
				nlapiSetFieldValue('custrecord_ven_req_bank_fmt', 'BAML URGP (Vendors)');
		}		
	}
	catch(error) {
    	if (error.getDetails != undefined) {
            nlapiLogExecution('ERROR','Process Error',  error.getCode() + ': ' + error.getDetails());
            throw error;
        }
        else {
            nlapiLogExecution('ERROR','Unexpected Error', error.toString()); 
            throw nlapiCreateError('99999', error.toString());
        }
        return false;
	}
}

function US1_USD_BankFormatSelection(){
	
	var title = 'US1_USD_BankFormatSelection';
	nlapiLogExecution('DEBUG', title, '----START----');
	
	try {
		nlapiLogExecution('DEBUG', title, nlapiGetFieldValue('custrecord_vr_primary_currency'));
		nlapiLogExecution('DEBUG', title, nlapiGetFieldValue('custrecord_vr_country'));
		var curr= nlapiGetFieldValue('custrecord_vr_primary_currency');
		nlapiLogExecution('DEBUG', title, curr);
		var country = nlapiGetFieldValue('custrecord_vr_country');
		nlapiLogExecution('DEBUG', title, country);	
			
		if (curr == 1) {			
			if (country == 230) {
				nlapiSetFieldValue('custrecord_ven_req_bank_fmt', 'HSBC US ACH (Vendors)');
			    nlapiLogExecution('DEBUG', title, 'HSBC US ACH (Vendors)'); }
			else {
				nlapiSetFieldValue('custrecord_ven_req_bank_fmt', 'Generic Payment Format');
			    nlapiLogExecution('DEBUG', title, 'Generic Payment Format'); }
		}		
	}
	catch(error) {
    	if (error.getDetails != undefined) {
            nlapiLogExecution('ERROR','Process Error',  error.getCode() + ': ' + error.getDetails());
            throw error;
        }
        else {
            nlapiLogExecution('ERROR','Unexpected Error', error.toString()); 
            throw nlapiCreateError('99999', error.toString());
        }
        return false;
	}
}

//LIBRARY FUNCTIONS
function isEmpty(fld) {return (fld==null||fld=='');}
function isNotEmpty(fld) {return (fld!=null&&fld!='');}
function isTrue(fld) {return (isNotEmpty(fld)&&(fld=='T'||fld=='Y'));}
function isNotTrue(fld) {return (isEmpty(fld)||(fld!='T'&&fld!='Y'));}

function roundNumber(num, dec){
	var result = Math.round(num*Math.pow(10,dec))/Math.pow(10,dec);
	return result;
}

