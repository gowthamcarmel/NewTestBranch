/* Solution Overview:
*
* In order to capture the name of the vendor appropriatelyin Vendor modifications: 
*
* Script will be triggered to make sure that when Vendor is in edit mode shows a message to alert the user that changes into
* companyname field will not update other related fields.
*
* @author: Hugo Olivera Alonso
* @version: 1.0
************************************************************************************************************************
*/


/**
 * Shows an warning message based on Form status and field change
 * @param type (string) - Form status
 * @param name (string) - Field name
 * @version 1.0
 */
function fieldChange_LegalName(type,name) {
	
    var strFieldName = "";
	var message = ""

	if (name == 'legalname' )
	{
        strFieldName  = 'Legal Name';
		message = 'You have modified the' + strFieldName +', this will not update the associated fields [Company Name, Address Details, Print On Check As], if you do not wish to continue please revert the name change.';
		alert(message);
	}
	
}

function validateField_LegalName(type,name) {
	
    var strFieldName = "";
	var message = ""

	if (name == 'legalname' )
	{   
		var fieldValue = nlapiGetFieldValue('legalname');
		if (isNotEmpty(fieldValue)) {
			var fieldLength = fieldValue.length
			if (fieldLength > 79) {
				strFieldName = 'Legal Name';
				message = 'The ' + strFieldName + ' must not exceed 79 characters. Please update the ' + strFieldName;
				alert(message);
				return false;
			}
		}
	}
	return true;
}

function isEmpty(fld) {return (fld==null||fld=='');}
function isNotEmpty(fld) {return (fld!=null&&fld!='');}
function isTrue(fld) {return (isNotEmpty(fld)&&(fld=='T'||fld=='Y'));}
function isNotTrue(fld) {return (isEmpty(fld)||(fld!='T'&&fld!='Y'));}