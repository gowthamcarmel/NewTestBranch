/**
 * Module Description
 * 
 * Version    Date            Author           Remarks
 * 1.00       25 Jun 2015     rtrivedi
 *
 */

/**
 * @returns {Void} Any or no return value
 */

function VIU_bank_detail_populate() {
	var title =  'VIU_bank_detail_populate';
		
		nlapiSetFieldValue('custrecord_viu_vendor_bank_details', '');
		
		var vendor_id = nlapiGetFieldValue('custrecord_veninvupld_vendor_name');
		nlapiLogExecution('DEBUG', title, 'vendor id= '+ vendor_id);
		
		if (isNotEmpty(vendor_id)) {
			var filters = new Array();
			filters[0] = new nlobjSearchFilter('custrecord_2663_parent_vendor', null, 'anyof', nlapiGetFieldValue('custrecord_veninvupld_vendor_name'));
			nlapiLogExecution('DEBUG', title, 'filter0= '+ filters[0]);
			
			var columns = new Array();
			columns[0] = new nlobjSearchColumn('custrecord_2663_entity_iban');
			columns[1] = new nlobjSearchColumn('custrecord_2663_entity_swift');
			columns[2] = new nlobjSearchColumn('custrecord_2663_entity_acct_no');
			columns[3] = new nlobjSearchColumn('custrecord_2663_entity_processor_code');
			columns[4] = new nlobjSearchColumn('custrecord_2663_entity_bank_code');
			columns[5] = new nlobjSearchColumn('custrecord_2663_entity_bank_name');
			columns[6] = new nlobjSearchColumn('custrecord_2663_entity_branch_name');
			columns[7] = new nlobjSearchColumn('custrecord_2663_entity_bic'); 
			columns[8] = new nlobjSearchColumn('custrecord_2663_entity_bank_no');  
			columns[9] = new nlobjSearchColumn('custrecord_2663_entity_branch_no');
			columns[10] = new nlobjSearchColumn('custrecord_email');
						
			var searchResults = nlapiSearchRecord('customrecord_2663_entity_bank_details', null, filters, columns);
			if (searchResults != null) {
				nlapiLogExecution('DEBUG', title, 'inside if, record found');
				var results = searchResults[0];
				
				var bank_details='';

				if (results.getValue('custrecord_2663_entity_iban')!= '' && results.getValue('custrecord_2663_entity_iban')!= null)					
					bank_details=bank_details+'IBAN: '+results.getValue('custrecord_2663_entity_iban');			
				if (results.getValue('custrecord_2663_entity_swift')!= '' && results.getValue('custrecord_2663_entity_swift')!= null)
				        bank_details=bank_details+"\n"+'SWIFT CODE/IFSC: '+results.getValue('custrecord_2663_entity_swift');
				if (results.getValue('custrecord_2663_entity_acct_no')!= '' && results.getValue('custrecord_2663_entity_acct_no')!= null)
					bank_details=bank_details+"\n"+'ACCOUNT NO: '+results.getValue('custrecord_2663_entity_acct_no');
				if (results.getValue('custrecord_2663_entity_processor_code')!= '' && results.getValue('custrecord_2663_entity_processor_code')!= null)
					bank_details=bank_details+"\n"+'Processor / SORT CODE: '+results.getValue('custrecord_2663_entity_processor_code');
				if (results.getValue('custrecord_2663_entity_bank_code')!= '' && results.getValue('custrecord_2663_entity_bank_code')!= null)
					bank_details=bank_details+"\n"+'BANK CODE: '+results.getValue('custrecord_2663_entity_bank_code');
				if (results.getValue('custrecord_2663_entity_bank_name')!= '' && results.getValue('custrecord_2663_entity_bank_name')!= null)
					bank_details=bank_details+"\n"+'BANK NAME: '+results.getValue('custrecord_2663_entity_bank_name');
				if (results.getValue('custrecord_2663_entity_branch_name')!= '' && results.getValue('custrecord_2663_entity_branch_name')!= null)
					bank_details=bank_details+"\n"+'BRANCH NAME/ Bank Location: '+results.getValue('custrecord_2663_entity_branch_name');
				if (results.getValue('custrecord_2663_entity_bic')!= '' && results.getValue('custrecord_2663_entity_bic')!= null)
					bank_details=bank_details+"\n"+'BIC CODE: '+results.getValue('custrecord_2663_entity_bic');
				if (results.getValue('custrecord_2663_entity_bank_no')!= '' && results.getValue('custrecord_2663_entity_bank_no')!= null)
					bank_details=bank_details+"\n"+'BANK NO: '+results.getValue('custrecord_2663_entity_bank_no');
				if (results.getValue('custrecord_2663_entity_country_code')!= '' && results.getValue('custrecord_2663_entity_country_code')!= null)
					bank_details=bank_details+"\n"+'COUNTRY CODE: '+results.getValue('custrecord_2663_entity_country_code');
				if (results.getValue('custrecord_2663_entity_branch_no')!= '' && results.getValue('custrecord_2663_entity_branch_no')!= null)
					bank_details=bank_details+"\n"+'BRANCH NO: '+results.getValue('custrecord_2663_entity_branch_no');
				if (results.getValue('custrecord_2663_entity_city')!= '' && results.getValue('custrecord_2663_entity_city')!= null)
					bank_details=bank_details+"\n"+'CITY: '+results.getValue('custrecord_2663_entity_city');
				if (results.getValue('custrecord_email')!= '' && results.getValue('custrecord_email')!= null)
					bank_details=bank_details+"\n"+'EMAIL: '+results.getValue('custrecord_email');
								
				nlapiSetFieldValue('custrecord_viu_vendor_bank_details', bank_details);

				//nlapiLogExecution('DEBUG', title, 'bank details= '+ nlapiGetFieldValue('custrecord_viu_vendor_bank_details'));
			}
			else nlapiLogExecution('DEBUG', title, 'no search result');		
		}
	}

function isEmpty(fld) {return (fld==null||fld=='');}
function isNotEmpty(fld) {return (fld!=null&&fld!='');}
function isTrue(fld) {return (isNotEmpty(fld)&&(fld=='T'||fld=='Y'));}
function isNotTrue(fld) {return (isEmpty(fld)||(fld!='T'&&fld!='Y'));}

function roundNumber(num, dec){
	var result = Math.round(num*Math.pow(10,dec))/Math.pow(10,dec);
	return result;
}