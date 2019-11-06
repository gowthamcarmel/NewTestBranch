/**
* @author  vabhpant
* Request for new vendors via employee center to be created in Netsuite. 
* Scheduled script will be triggered on successful approval of vendor record


Change ID:- 8247 , Problem ID - 2919 //added by Gayatri Tarane
Change ID : 8367 , Problem ID : 3187 //added by Gayatri Tarane
Change ID -8761 // Added By Santhosh
Modified by : Gowtham Prakash
Modified on : 16th Oct 2019
Change request : CHG0105206
*/
function Schedule_CreateVendor(){
	try{
			var context = nlapiGetContext();
		    nlapiLogExecution('DEBUG', 'Context: ', context.getExecutionContext());
		    
		    var recId = context.getSetting('SCRIPT','custscript_ven_req_id');
		    //nlapiLogExecution('DEBUG', 'param type', recId);

		    
			nlapiLogExecution('DEBUG', 'VarId: ', recId);

		    var recType = 'customrecord_vendor_request';
			nlapiLogExecution('DEBUG', 'Type: ', recType);
		    
		    var rec = nlapiLoadRecord(recType, recId);
		    
			var id = rec.getFieldValue('id');//CHG0105206
			 var is_new_req = rec.getFieldValue('custrecord_new_req');//CHG0105206

				var approvalStatus = rec.getFieldValue('custrecord_vr_approval_status');
				var vendorId = rec.getFieldValue('custrecord_vr_vendor_id');
				var isInactive = rec.getFieldValue('isinactive');
				var vendorRequester = rec.getFieldValue('owner');
			    nlapiLogExecution('DEBUG', 'Details' ,'Status:'+approvalStatus+' Ven Id: '+vendorId,'isInactive: '+isInactive+' vendorRequester: '+vendorRequester);

				//if status has been changed to approved and no vendor already created then process vendor request
				if(approvalStatus==2 && isEmpty(vendorId)){
					var vendorType = rec.getFieldValue('custrecord_vr_type');
					var isPerson='T';
					if (vendorType==1){
						isPerson = 'F';
					}
					
					var stSubsidiaryId = rec.getFieldValue('custrecord_vr_subsidiary');
					var stSubsidiaryPrefix = nlapiLookupField('subsidiary',stSubsidiaryId,'tranprefix'); 
					nlapiLogExecution('DEBUG', 'Subsidiairy prefix: ', stSubsidiaryPrefix);
						   
					var legalName = rec.getFieldValue('custrecord_vr_legal_name');	   
					// Update Company Name with subsidiary Prefix
					stCompanyName = legalName + '-' + stSubsidiaryPrefix;
					
					var stCountry = rec.getFieldValue('custrecord_vr_country');
					var countryCode="";
					
					if(isNotEmpty(stCountry)){
						var searchFilter = [new nlobjSearchFilter('custrecord_iso_country',null,'anyof',stCountry)]	;
						var searchColumn = [new nlobjSearchColumn('name')];
						var searchRecord = nlapiSearchRecord('customrecord_country_iso_codes',null,searchFilter, searchColumn);
						if(isNotEmpty(searchRecord)){
							countryCode = searchRecord[0].getValue('name');
							nlapiLogExecution('DEBUG','countryCode',countryCode);
						}
					}
					
					var newVendor = nlapiCreateRecord('vendor');//,{recordmode: 'dynamic'});
					nlapiLogExecution('DEBUG','New Vendor',newVendor);
					
					newVendor.setFieldValue('subsidiary',stSubsidiaryId);
					newVendor.setFieldValue('companyname',stCompanyName);
					newVendor.setFieldValue('legalname',legalName);
					if (isPerson){
						newVendor.setFieldValue('firstname',rec.getFieldValue('custrecord_vr_first_name'));
						newVendor.setFieldValue('lastname',rec.getFieldValue('custrecord_vr_last_name'));
					}
					newVendor.setFieldValue('terms',rec.getFieldValue('custrecord_vr_terms'));
					newVendor.setFieldValue('currency',rec.getFieldValue('custrecord_vr_primary_currency'));
					newVendor.setFieldValue('custentity_primary_rship_mg',rec.getFieldValue('custrecord_vr_primary_rel_manager'));
					newVendor.setFieldValue('isperson',isPerson);
					newVendor.setFieldValue('custentity_procurement_owner',rec.getFieldValue('custrecord_vr_procurement_owner'));
					newVendor.setFieldValue('custentity_parent_vendor',rec.getFieldValue('custrecord_vr_parent_vendor'));
					newVendor.setFieldValue('custentity_is_partner',rec.getFieldValue('custrecord_vr_is_partner'));
					newVendor.setFieldValue('custentity_is_third_party',rec.getFieldValue('custrecord_vr_is_third_party'));
					newVendor.setFieldValue('email',rec.getFieldValue('custrecord_vr_vendor_email_add'));
					newVendor.setFieldValue('phone',rec.getFieldValue('custrecord_vr_vendor_phone'));
					newVendor.setFieldValue('fax',rec.getFieldValue('custrecord_vr_vendors_fax_number'));
					newVendor.setFieldValue('altphone',rec.getFieldValue('custrecord_vr_vendors_alt_phone'));
					//newVendor.setFieldValue('comments',rec.getFieldValue('custrecord_vr_comments'));
					newVendor.setFieldValue('printoncheckas',legalName);
					newVendor.setFieldValue('custentity_vendor_request', rec.getId());
                  
                    //Change ID -8761 -Start
                    newVendor.setFieldValue('custentity_service_tax_nr',rec.getFieldValue('custrecord_ven_req_str_number'));
					newVendor.setFieldValue('custentity_pan_nr',rec.getFieldValue('custrecord_ven_req_pan_number'));
					newVendor.setFieldValue('vatregnumber',rec.getFieldValue('custrecord_ven_req_taxid'));
                    //Change ID -8761 - End
					
					nlapiLogExecution('DEBUG', 'Ven Req Id', newVendor.getFieldValue('custentity_vendor_request'));
					
					newVendor.selectNewLineItem('addressbook');
					newVendor.setCurrentLineItemValue('addressbook', 'defaultshipping','T');
					newVendor.setCurrentLineItemValue('addressbook', 'defaultbilling','T');
					newVendor.setCurrentLineItemValue('addressbook', 'addressee',legalName);
					newVendor.setCurrentLineItemValue('addressbook', 'addr1',rec.getFieldValue('custrecord_vr_vendor_address_1'));
					newVendor.setCurrentLineItemValue('addressbook', 'addr2',rec.getFieldValue('custrecord_vr_vendors_address_2'));
					newVendor.setCurrentLineItemValue('addressbook', 'city',rec.getFieldValue('custrecord_vr_vendors_city'));
					newVendor.setCurrentLineItemValue('addressbook', 'state',rec.getFieldValue('custrecord_vr_vendor_county'));
					newVendor.setCurrentLineItemValue('addressbook', 'country',countryCode);
					newVendor.setCurrentLineItemValue('addressbook', 'zip',rec.getFieldValue('custrecord_vr_post_code'));	
//Reetesh code for Attention field value - 16/08/2015
                                        var addAtt = rec.getFieldValue('custrecord_vr_contact_firstname') + ' ' + rec.getFieldValue('custrecord_vr_contact_surname');
			                newVendor.setCurrentLineItemValue('addressbook', 'attention', addAtt);	
//Reetesh code for Attention field value - 16/08/2015			
					newVendor.commitLineItem('addressbook');

newVendor.setFieldValue('emailtransactions','T');  //Reetesh 25/08/2015 for To be emailed default 
					
					var vendorId = nlapiSubmitRecord(newVendor, true, true);
					nlapiLogExecution('DEBUG', 'Created new vendor#', vendorId);
					
					//update vendor request with newly created Vendor ID
					nlapiSubmitField(rec.getRecordType(), rec.getId(), 'custrecord_vr_vendor_id', vendorId);
					
					//send email to creator that vendor has been created.
					//NOT REQUIRED - Sending this from workflow
					//nlapiSendEmail(nlapiGetUser(), vendorRequester, 'Vendor Request - Approved', 'Your Vendor request#'+ rec.getId() +' has been successfully approved');
					
					if(isPerson=='F'){
						//create the associated contact for the vendor company
						var newContactRec = nlapiCreateRecord('contact');
							newContactRec.setFieldValue('firstname',rec.getFieldValue('custrecord_vr_contact_firstname'));
							newContactRec.setFieldValue('lastname',rec.getFieldValue('custrecord_vr_contact_surname'));
							newContactRec.setFieldValue('phone',rec.getFieldValue('custrecord_vr_contact_phone'));
							newContactRec.setFieldValue('email',rec.getFieldValue('custrecord_vr_contact_email'));
							newContactRec.setFieldValue('title',rec.getFieldValue('custrecord_vr_job_title'));
							newContactRec.setFieldValue('company',vendorId);
							contactId = nlapiSubmitRecord(newContactRec,true);
					}	
					
					//For assigning selected item to vendor
					var itemValid = rec.getFieldValue('custrecord_ven_req_ite_valid');
					nlapiLogExecution('DEBUG', 'Item Validated', itemValid);
					
					if(rec.getFieldValue('custrecord_ven_req_tem') && itemValid == 'T') {
					
						var itemId = rec.getFieldValue('custrecord_ven_req_tem');
						nlapiLogExecution('DEBUG', 'Item', itemId );
						
						var itemTypeText = rec.getFieldText('custrecord_mys_item_type');
						nlapiLogExecution('DEBUG', 'Item Type', itemTypeText );
						
						var itemType = '';
						
						switch (itemTypeText) {
							
							case'Non-inventory Item':
								itemType = 'noninventoryitem';
							break;
							case'Service':
								itemType = 'serviceitem';
							break;
							case'Discount':
								itemType = 'discountitem';
							break;
							case'Other Charge':
								itemType = 'otherchargeitem';
							break;
							case'Descriptions':
								itemType = 'descriptionitem';
							break;
							default :
								nlapiCreateError('NAVI', 'Not a Valid Item.', true);
							break;
							
						}
						
						var itemRec = nlapiLoadRecord(itemType, itemId);
						itemRec.selectNewLineItem('itemvendor');
						itemRec.setCurrentLineItemValue('itemvendor', 'vendor', vendorId);
						itemRec.commitLineItem('itemvendor');
						var itemId = nlapiSubmitRecord(itemRec);
						
						//Attaching Multiple items...................................
						
						var ven_filter = new Array();
						ven_filter[0]= new nlobjSearchFilter('custrecord_item_req_ver',null,'is', recId);
						
					
						var VenSearchResults= nlapiSearchRecord(null,'customsearch_new_ven_itm_srch',ven_filter,null);
						
						if (VenSearchResults !=0 && VenSearchResults !=null)
						{
							var VenSearchResults_length = VenSearchResults.length;
							nlapiLogExecution('DEBUG', 'SearchLength>>>', VenSearchResults_length);
							for(var i =0;i<VenSearchResults_length;i++){
								var searchResult1 = VenSearchResults[i];
								var result1 = searchResult1.getAllColumns();
								
								var itemid1 = searchResult1.getValue(result1[0]);
								var itemTypeText1 = searchResult1.getText(result1[1]);
								nlapiLogExecution('DEBUG', 'itemTypeText1>>>', itemTypeText1);
								var itemType1= '';
								
								switch (itemTypeText1) {
							
									case'Non-inventory Item':
										itemType1 = 'noninventoryitem';
									break;
									case'Service':
										itemType1 = 'serviceitem';
									break;
									case'Discount':
										itemType1 = 'discountitem';
									break;
									case'Other Charge':
										itemType1 = 'otherchargeitem';
									break;
									case'Descriptions':
										itemType1 = 'descriptionitem';
									break;
									default :
										nlapiCreateError('NAVI', 'Not a Valid Item.', true);
									break;
							
								}
								nlapiLogExecution('DEBUG', 'itemType1>>>', itemType1);
								nlapiLogExecution('DEBUG', 'itemid1>>>', itemid1);
								var itemRec1 = nlapiLoadRecord(itemType1, itemid1);
								itemRec1.selectNewLineItem('itemvendor');
								itemRec1.setCurrentLineItemValue('itemvendor', 'vendor', vendorId);
								itemRec1.commitLineItem('itemvendor');
								var itemId = nlapiSubmitRecord(itemRec1);
								
							}
						}
						
					}//CHG0105206
				
					
						
					var filters = new Array();   //Search for File Internal Id - added by Gayatri Tarane
			filters[0] = new nlobjSearchFilter('internalid', null, 'is', recId);

			var FilesearchResults = nlapiSearchRecord(null,'customsearch_vr_file_id', filters, null); // change the internal ID of your saved search

			if(FilesearchResults !=0 && FilesearchResults != null)
			{
				var FilesearchResults_length = FilesearchResults.length;
				nlapiLogExecution('DEBUG', 'Lenght>>>', FilesearchResults_length);
				for(var i =0;i<FilesearchResults_length;i++){
					var searchResult = FilesearchResults[i];
					var result = searchResult.getAllColumns();

					var fileId = searchResult.getValue(result[2]); // depends on which position is File : Internal ID in your Search
					nlapiAttachRecord("file", fileId , "vendor", vendorId);  //GT-Code 
				}
			}
			else{
				nlapiLogExecution('DEBUG', 'No Files attached in File Sublist');

			}

			nlapiAttachRecord("file", rec.getFieldValue('custrecord_ven_req_attach_file_mandatory') , "vendor", vendorId); 
			nlapiLogExecution('DEBUG', 'custrecord_ven_req_attach_file_mandatory>>>>',rec.getFieldValue('custrecord_ven_req_attach_file_mandatory')); //Attach File name/id

			attachsublist(rec,vendorId); //Creating Entity bank details
					
					//Set vendor inactive
					nlapiSubmitField('vendor', vendorId, 'isinactive', 'T');
				}
	}
	catch(error) 
	{
 	   if (error.getDetails != undefined) 
 	   {
 		   nlapiLogExecution('ERROR', 'Process Error', error.getCode() + ': ' + error.getDetails());
 		   throw error;
 	   }
 	   else 
 	   {    
 		   nlapiLogExecution('ERROR', 'Unexpected Error', error.toString());
 		   throw nlapiCreateError('99999', error.toString());
 	   }
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

/*create Entity bank details - Gayatri Tarane //added by Gayatri Tarane */
function attachsublist(rec,vendorId){                                                   
	var newEntityBankDetails = nlapiCreateRecord('customrecord_2663_entity_bank_details');


	newEntityBankDetails.setFieldValue('custrecord_2663_parent_vendor',vendorId);
	var fid = BankFormatId(rec);
	nlapiLogExecution('DEBUG', 'BankFormatId>>>',fid);
	newEntityBankDetails.setFieldValue('custrecord_2663_entity_file_format', fid);
	if(rec.getFieldValue('custrecord_ven_req_iban') !='' && rec.getFieldValue('custrecord_ven_req_iban') != null){
	newEntityBankDetails.setFieldValue('custrecord_2663_entity_iban',rec.getFieldValue('custrecord_ven_req_iban'));
	}
	newEntityBankDetails.setFieldValue('custrecord_2663_entity_bank_type',1);
	if(rec.getFieldValue('custrecord_ven_req_swift_code') !='' && rec.getFieldValue('custrecord_ven_req_swift_code') != null){
	newEntityBankDetails.setFieldValue('custrecord_2663_entity_swift',rec.getFieldValue('custrecord_ven_req_swift_code'));
	}
	if(rec.getFieldValue('custrecord_ven_req_acc_num') !='' && rec.getFieldValue('custrecord_ven_req_acc_num') != null){
	newEntityBankDetails.setFieldValue('custrecord_2663_entity_acct_no',rec.getFieldValue('custrecord_ven_req_acc_num'));
	}
	nlapiLogExecution('DEBUG', 'Sort code>>>>>>>>>>>>', rec.getFieldValue('custrecord_ven_req_sort_code'));
	if(rec.getFieldValue('custrecord_ven_req_sort_code') !='' && rec.getFieldValue('custrecord_ven_req_sort_code') != null) {
	newEntityBankDetails.setFieldValue('custrecord_2663_entity_processor_code',rec.getFieldValue('custrecord_ven_req_sort_code'));
	}
	nlapiLogExecution('DEBUG', 'process  code>>>>>>>>>>>>', newEntityBankDetails.getFieldValue('custrecord_2663_entity_processor_code'));
	if(rec.getFieldValue('custrecord_ven_req_bic_sort') !='' && rec.getFieldValue('custrecord_ven_req_bic_sort') != null){
		newEntityBankDetails.setFieldValue('custrecord_2663_entity_processor_code',rec.getFieldValue('custrecord_ven_req_bic_sort'));
	}
	if(rec.getFieldValue('custrecord_ven_req_bank_code') !='' && rec.getFieldValue('custrecord_ven_req_bank_code') != null){
	newEntityBankDetails.setFieldValue('custrecord_2663_entity_bank_code',rec.getFieldValue('custrecord_ven_req_bank_code'));
	}
	if(rec.getFieldValue('custrecord_ven_req_bank_name') !='' && rec.getFieldValue('custrecord_ven_req_bank_name') != null){
	newEntityBankDetails.setFieldValue('custrecord_2663_entity_bank_name',rec.getFieldValue('custrecord_ven_req_bank_name'));
	}
	if(rec.getFieldValue('custrecord_ven_req_branch_name') !='' && rec.getFieldValue('custrecord_ven_req_branch_name') != null){
	newEntityBankDetails.setFieldValue('custrecord_2663_entity_branch_name',rec.getFieldValue('custrecord_ven_req_branch_name'));
	}

	if(rec.getFieldValue('custrecord_ven_req_micr') !='' && rec.getFieldValue('custrecord_ven_req_micr') != null){
	newEntityBankDetails.setFieldValue('custrecord_2663_entity_bank_no',rec.getFieldValue('custrecord_ven_req_micr'));
	}
	if(rec.getFieldValue('custrecord_ven_req_bank_branch_num') !='' && rec.getFieldValue('custrecord_ven_req_bank_branch_num') != null){
	newEntityBankDetails.setFieldValue('custrecord_2663_entity_branch_no',rec.getFieldValue('custrecord_ven_req_bank_branch_num'));
	}
	if(rec.getFieldValue('custrecord_ven_req_bank_email') !='' && rec.getFieldValue('custrecord_ven_req_bank_email') != null){
	newEntityBankDetails.setFieldValue('custrecord_email',rec.getFieldValue('custrecord_ven_req_bank_email'));
	}
	if(rec.getFieldValue('custrecord_ven_req_ifsc') !='' && rec.getFieldValue('custrecord_ven_req_ifsc') != null){
	newEntityBankDetails.setFieldValue('custrecord_2663_entity_swift',rec.getFieldValue('custrecord_ven_req_ifsc'));
	}
	if(rec.getFieldValue('custrecord_ven_req_bank_loc') !='' && rec.getFieldValue('custrecord_ven_req_bank_loc') != null){
	newEntityBankDetails.setFieldValue('custrecord_2663_entity_branch_name',rec.getFieldValue('custrecord_ven_req_bank_loc'));
	}

	newEntityBankDetails.setFieldValue('name',rec.getFieldValue('custrecord_ven_req_bank_fmt'));
	
	var EntityBankDetailsId = nlapiSubmitRecord(newEntityBankDetails);
	nlapiLogExecution('DEBUG', 'Created new EntityBankDetails#', EntityBankDetailsId);

}



/*Bank Formate Inetrnal Id - added by Gayatri Tarane*/
function BankFormatId(rec) {
	var filters = new Array();
	var textbankformat = rec.getFieldValue('custrecord_ven_req_bank_fmt');
	filters[0] = new nlobjSearchFilter('name', null, 'is', textbankformat);

	var FilesearchResults = nlapiSearchRecord(null,'customsearchpaymentfileformatinternal_id', filters, null); // change the internal ID of your saved search

	if(FilesearchResults !=0 && FilesearchResults != null)
	{
		var FilesearchResults_length = FilesearchResults.length;
		nlapiLogExecution('DEBUG', 'Lenght>>>', FilesearchResults_length);
		for(var i =0;i<FilesearchResults_length;i++){
			var searchResult = FilesearchResults[i];
			var result = searchResult.getAllColumns();

			var FormatInternalId = searchResult.getValue(result[1]); // depends on which position is File : Internal ID in your Search
			nlapiLogExecution('DEBUG', 'FormatInternalId>>>', FormatInternalId);
			return FormatInternalId;
		}
	}     
}
