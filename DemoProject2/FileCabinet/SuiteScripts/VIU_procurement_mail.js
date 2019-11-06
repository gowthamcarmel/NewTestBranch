function send_mail() 
{
try
{
	var IntId = nlapiGetRecordId();

	//var creater_id = nlapiLookupField('customrecord_ven_inv_upload_form', IntId, 'owner');
    var viu_id = nlapiLookupField('customrecord_ven_inv_upload_form', IntId, 'name');
    var vendor_id = nlapiLookupField('customrecord_ven_inv_upload_form', IntId, 'custrecord_veninvupld_vendor_name');
	var vendor_name= nlapiLookupField('vendor', vendor_id, 'entityid') + ' ' + nlapiLookupField('vendor', vendor_id, 'altname');	
	
//var body = 'Bank Details are not matching in Vendor master and Vendor Invoice for VIU record ' + viu_id + '  (Please find attached the vendor invoice copy). \n Please update the Bank Details in vendor master in netsuite. \n\n' ;
var body = 'Hi Team,\n\nThe Bank Details are not matching in Vendor master and Vendor Invoice for the below vendor. (Please find the attached vendor invoice copy).\n\n' + vendor_name + '\n\nPlease update the Bank Details in vendor master in Netsuite.\n\n';
var bodywithoutattachement = 'Vendor Invoice copy is not attached to the VIU record ' + viu_id + ',  Please attach the same. \n\n' ;

var filter = new Array();
filter[0] = new nlobjSearchFilter('internalid', null, 'anyof', IntId);	

// for the filter, you simply have to indicate the internal ID of the custom record
var column = [
new nlobjSearchColumn('internalid','file'),
new nlobjSearchColumn('name','file'),
//new nlobjSearchColumn('createdby','customrecord_ven_inv_upload_form'),
];

//perform a custom record search to retrieve the associated files on the record
var files = nlapiSearchRecord('customrecord_ven_inv_upload_form',null,filter,column);

//repository for the files
var attach = new Array();	
var flag=1;
//iterate through the result set and push into an array
if(files)
{
	for(var i=0;i<files.length;i++)
	{
		var file = files[i];
		var fileID = file.getValue('internalid','file');
        if(fileID)
		attach.push(nlapiLoadFile(fileID));
	    else
		{
flag=0;
		nlapiLogExecution('ERROR','Process Error',  'No file attached');
	    }			
	}
}

if(flag == 1)
{
	
	var records = new Object();
							records['recordtype'] = 'customrecord_ven_inv_upload_form';
							records['record'] = IntId;
	//attach the File array into the email to be sent
    nlapiSendEmail(875568,'Finastra.Purchasing@finastra.com','Bank Details Mismatch_' + vendor_name,body,'Finastra.Purchasing@finastra.com',null,records,attach); 
}
else
{
	//sending mail to AP team for attaching mail
    nlapiSendEmail(875568,'Finastra.AP@finastra.com','Vendor Invoice is not attached',bodywithoutattachement ); 
}	


/*
nlapiSendEmail(author, recipient, subject, body, cc, bcc, records, attachments, notifySenderOnBounce, internalOnly, replyTo)
nlapiSendEmail(author, recipient, subject, body, null, null, records, newAttachment);
nlapiSendEmail('jwolfe@netsuite.com', 'customer@customer.com', 
               'Invoice Receipt', 'your order has been completed', 
               null, null, null, null, true, null, 'accounts@netsuite.com');
*/
			   
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