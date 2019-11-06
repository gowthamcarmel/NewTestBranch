/**
 * Copyright (c) 1998-2013 NetSuite, Inc.
* 2955 Campus Drive, Suite 100, San Mateo, CA, USA 94403-2511
* All Rights Reserved.
*
* This software is the confidential and proprietary information of
* NetSuite, Inc. ("Confidential Information"). You shall not
* disclose such Confidential Information and shall use it only in
* accordance with the terms of the license agreement you entered into
* with NetSuite
*
* @author pshah
* Request for new vendors via employee center to be created in Netsuite. 
* User event script will be triggered on successful approval of vendor record
*/
function afterSubmit_CreateVendor(type){
	try{
		//only run on edit
		if (type=='edit'){
			//only run if change triggered via manual interaction
			var context = nlapiGetContext().getExecutionContext();
			if (context == 'userinterface'){
				var approvalStatus = nlapiGetFieldValue('custrecord_vr_approval_status');
				var vendorId = nlapiGetFieldValue('custrecord_vr_vendor_id');
				var isInactive = nlapiGetFieldValue('isinactive');
				var vendorRequester = nlapiGetFieldValue('owner');
				//if status has been changed to approved and no vendor already created then process vendor request
				if(approvalStatus==2 && isEmpty(vendorId)){
					var vendorType = nlapiGetFieldValue('custrecord_vr_type');
					var isPerson='T'
					if (vendorType==1){
						isPerson = 'F'
					}
					
					var stSubsidiaryId = nlapiGetFieldValue('custrecord_vr_subsidiary');
					var stSubsidiaryPrefix = nlapiLookupField('subsidiary',stSubsidiaryId,'tranprefix'); 
						   nlapiLogExecution('DEBUG', 'Subsidiairy prefix: ', stSubsidiaryPrefix);
						   
					var legalName = nlapiGetFieldValue('custrecord_vr_legal_name');	   
					// Update Company Name with subsidiary Prefix
					stCompanyName = legalName + '-' + stSubsidiaryPrefix;
					
					var stCountry = nlapiGetFieldValue('custrecord_vr_country');
					var countryCode="";
					
					if(isNotEmpty(stCountry)){
						var searchFilter = [new nlobjSearchFilter('custrecord_iso_country',null,'anyof',stCountry)]	;
						var searchColumn = [new nlobjSearchColumn('name')]
						var searchRecord = nlapiSearchRecord('customrecord_country_iso_codes',null,searchFilter, searchColumn);
						if(isNotEmpty(searchRecord)){
							countryCode = searchRecord[0].getValue('name');
							nlapiLogExecution('DEBUG','countryCode',countryCode);
						}
					}
					
					var newVendor = nlapiCreateRecord('vendor',{recordmode: 'dynamic'});
					newVendor.setFieldValue('subsidiary',stSubsidiaryId);
					newVendor.setFieldValue('companyname',stCompanyName);
					newVendor.setFieldValue('legalname',legalName);
					if (isPerson){
						newVendor.setFieldValue('firstname',nlapiGetFieldValue('custrecord_vr_first_name'));
						newVendor.setFieldValue('lastname',nlapiGetFieldValue('custrecord_vr_last_name'));
					}
					newVendor.setFieldValue('terms',nlapiGetFieldValue('custrecord_vr_terms'));
					newVendor.setFieldValue('currency',nlapiGetFieldValue('custrecord_vr_primary_currency'));
					newVendor.setFieldValue('custentity_primary_rship_mg',nlapiGetFieldValue('custrecord_vr_primary_rel_manager'));
					newVendor.setFieldValue('isperson',isPerson);
					newVendor.setFieldValue('custentity_procurement_owner',nlapiGetFieldValue('custrecord_vr_procurement_owner'));
					newVendor.setFieldValue('custentity_parent_vendor',nlapiGetFieldValue('custrecord_vr_parent_vendor'));
					newVendor.setFieldValue('custentity_is_partner',nlapiGetFieldValue('custrecord_vr_is_partner'));
					newVendor.setFieldValue('custentity_is_third_party',nlapiGetFieldValue('custrecord_vr_is_third_party'));
					newVendor.setFieldValue('email',nlapiGetFieldValue('custrecord_vr_vendor_email_add'));
					newVendor.setFieldValue('phone',nlapiGetFieldValue('custrecord_vr_vendor_phone'));
					newVendor.setFieldValue('fax',nlapiGetFieldValue('custrecord_vr_vendors_fax_number'));
					newVendor.setFieldValue('altphone',nlapiGetFieldValue('custrecord_vr_vendors_alt_phone'));
					//newVendor.setFieldValue('comments',nlapiGetFieldValue('custrecord_vr_comments'));
					newVendor.setFieldValue('printoncheckas',legalName);
					newVendor.setFieldValue('custentity_vendor_request', nlapiGetRecordId());
					
					newVendor.selectNewLineItem('addressbook');
                                        newVendor.setCurrentLineItemValue('addressbook', 'country',countryCode);
					newVendor.setCurrentLineItemValue('addressbook', 'defaultshipping','T');
					newVendor.setCurrentLineItemValue('addressbook', 'defaultbilling','T');
					newVendor.setCurrentLineItemValue('addressbook', 'addressee',legalName);
					newVendor.setCurrentLineItemValue('addressbook', 'addr1',nlapiGetFieldValue('custrecord_vr_vendor_address_1'));
					newVendor.setCurrentLineItemValue('addressbook', 'addr2',nlapiGetFieldValue('custrecord_vr_vendors_address_2'));
					newVendor.setCurrentLineItemValue('addressbook', 'city',nlapiGetFieldValue('custrecord_vr_vendors_city'));
					newVendor.setCurrentLineItemValue('addressbook', 'state',nlapiGetFieldValue('custrecord_vr_vendor_county'));
					newVendor.setCurrentLineItemValue('addressbook', 'zip',nlapiGetFieldValue('custrecord_vr_post_code'));				
					newVendor.commitLineItem('addressbook');
					
					var vendorId = nlapiSubmitRecord(newVendor,true,true);
					
					//update vendor request with newly created Vendor ID
					nlapiSubmitField(nlapiGetRecordType(),nlapiGetRecordId(),'custrecord_vr_vendor_id',vendorId);
					
					//send email to creator that vendor has been created.
					nlapiSendEmail(nlapiGetUser(),vendorRequester,'Vendor Request - Approved','Your Vendor request#'+ nlapiGetRecordId() +' has been successfully approved');
					
					if(isPerson=='F'){
						//create the associated contact for the vendor company
						var newContactRec = nlapiCreateRecord('contact')
							newContactRec.setFieldValue('firstname',nlapiGetFieldValue('custrecord_vr_contact_firstname'));
							newContactRec.setFieldValue('lastname',nlapiGetFieldValue('custrecord_vr_contact_surname'));
							newContactRec.setFieldValue('phone',nlapiGetFieldValue('custrecord_vr_contact_phone'));
							newContactRec.setFieldValue('email',nlapiGetFieldValue('custrecord_vr_contact_email'));
							newContactRec.setFieldValue('title',nlapiGetFieldValue('custrecord_vr_job_title'));
							newContactRec.setFieldValue('company',vendorId);
							contactId = nlapiSubmitRecord(newContactRec,true)
					}	
				}
				if (approvalStatus==3){
					var rejectReason = nlapiGetFieldValue('custrecord_vr_reject_reason');
					nlapiSendEmail(nlapiGetUser(),vendorRequester,'Vendor Request - Rejected','Your vendor request#'+ nlapiGetRecordId() +' has been rejected for the following reason: \r\n' + rejectReason);
				}
			}
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

//hide edit button once a vendor request has been set to rejected for all users
function beforeLoad_hideEditButtonForAdmin(type,form,request){
	try{
		var context = nlapiGetContext().getExecutionContext();
		if (context == 'userinterface') {
			if (type == 'view') {
				var approvalStatus = nlapiGetFieldValue('custrecord_vr_approval_status');
				if (approvalStatus == 3) {
					//hide the edit button from users when the status is pending approval/approved
					form.removeButton('edit');
				}
			}
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

function onSave_validateFields(){
	var vendorType = nlapiGetFieldValue('custrecord_vr_type');
	var isPerson='T'
	if (vendorType==1){
		isPerson = 'F'
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
	
	var approvalStatus = nlapiGetFieldValue('custrecord_vr_approval_status');
	if(approvalStatus==3){
		var rejectReason = nlapiGetFieldValue('custrecord_vr_reject_reason');
		if (isEmpty(rejectReason)){
			alert('Please enter a reject reason')
			return false;
		}
	}
	
	return true;
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
