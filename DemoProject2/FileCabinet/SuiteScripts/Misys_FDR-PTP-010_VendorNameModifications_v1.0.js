/* Solution Overview:
*
* In order to capture the name of the vendor appropriately and then update based on the subsidiary to which the vendor belongs to, Misys will create the vendor as per the following process:
*  1.	The Legal Name field of the Vendor is entered.
*  2.	The Subsidiary of the Vendor is selected.
*  3.	Other relevant information is entered.
*
* Script will be triggered to make sure that when the first two steps are performed, the Company Name field is updated with the Transaction Prefix defined for the subsidiary under Setup iƒ  Company if  Subsidiaries (i.e. Legal Name + Subsidiary Transaction Prefix). 
* In addition to this, the Addressee field in the address information section of the vendor will also be updated with the Legal Name entered.
* This modification will only be applicable when creating new vendors.
* The Company Name will not be editable on Create of a Vendor record. If the user Edits an existing Vendor, the Company Name will be available to edit.
*
* The execution context needs to be applied within the script. The script should only work for the following input methods:
o	userinterface 
o	webservices 
o	csvimport 
o	userevent
*
* @author: Hugo Olivera Alonso
* @version: 1.0
************************************************************************************************************************
*/

/**
 * Set fields values based on Subsidiary
 * @param type (string) , type pf field
 * @param name (string) , name of the field
 * @version 1.0
 */
function recordSubmit_Vendor(type,name)
{
	
	//Constants definition
	var stLoggerTitle = 'recordSubmit_Vendor';
	var CONTEXT_USERINTERFACE = 'userinterface';
	var CONTEXT_WEBSERVICES = 'webservices';
	var CONTEXT_CVSIMPORT = 'csvimport';
	var CONTEXT_USEREVENT = 'userevent';
	
		
	var context = nlapiGetContext().getExecutionContext();

	nlapiLogExecution('DEBUG','Update Vendor Data', '---------- START ----------');
	
	if(context == CONTEXT_WEBSERVICES || context == CONTEXT_USERINTERFACE || context == CONTEXT_CVSIMPORT || context == CONTEXT_USEREVENT)
	{
	
		try 
		{
			if (type == 'create') 
			{
		    // check and add validation related to record status create , edit etc !!!!!
				var custCategory = nlapiGetFieldValue('category');
				
				if (custCategory != 49) {
					var stSubsidiaryId = nlapiGetFieldValue('subsidiary');
					var stLegalName = nlapiGetFieldValue('legalname');
					
					
					var objVendorRecord = nlapiGetNewRecord();
					
					if (stSubsidiaryId != '' && stLegalName != '') {
					
						// Update All Adressees with LegalName value
						var intAddressCount = objVendorRecord.getLineItemCount('addressbook');
						
						if (intAddressCount > 0) {
							for (var i = 1; i <= intAddressCount; i++) {
							
								objVendorRecord.selectLineItem('addressbook', i);
								objVendorRecord.setCurrentLineItemValue('addressbook', 'addressee', stLegalName);
								objVendorRecord.commitLineItem('addressbook');
							}
							
						}
						
						
						// Set Print On Check As to Legal Name value
						nlapiSetFieldValue('printoncheckas', stLegalName);
						
						
						var stSubsidiaryPrefix = nlapiLookupField('subsidiary', stSubsidiaryId, 'tranprefix');
						nlapiLogExecution('DEBUG', 'Subsidairy prefix: ', stSubsidiaryPrefix);
						
						
						// Update Company Name with subsidiary Prefix
						stCompanyName = stLegalName + '-' + stSubsidiaryPrefix;
						nlapiSetFieldValue('companyname', stCompanyName);
					}
					
					nlapiLogExecution('DEBUG', 'Update Vendor Data', '---------- END ----------');
				}
				else{
					var externalIdDesc = nlapiGetFieldValue('externalid');
					nlapiSetFieldValue('companyname', externalIdDesc);
				}		
			}
			
		}
		catch(error)
		{
				(error.getDetails !== undefined) ? nlapiLogExecution('ERROR', stLoggerTitle, error.getCode() + ': ' + error.getDetails()) : 
		                                           nlapiLogExecution('ERROR', stLoggerTitle, error.toString());	
		        
			    throw nlapiCreateError('99999', error, true);

		}
	}	
}



/**
 * Enable or disable field based on Form status
 * @param type (string) value to be parsed
 * @version 1.0
 */
function onLoad_disableFields(type, form) {
	var stLoggerTitle = 'onLoad_disableFields';
	nlapiLogExecution('DEBUG','Disable or enable fields', '---------- START ----------');
	
	try 
	{

		if (type == 'create') 
		{
				nlapiSetFieldValue('companyname', 'TBC');
				form.getField('companyname').setDisplayType('hidden');					
		}
		if (type!='create'){
			form.getField('custentity_legal_name').setDisplayType('hidden');
		}
			
		nlapiLogExecution('DEBUG','Disable or enable fields', '---------- END ----------');			
	}
	catch(error)
	{
		(error.getDetails !== undefined) ? nlapiLogExecution('ERROR', stLoggerTitle, error.getCode() + ': ' + error.getDetails()) : 
                                           nlapiLogExecution('ERROR', stLoggerTitle, error.toString());			
	}		
}
