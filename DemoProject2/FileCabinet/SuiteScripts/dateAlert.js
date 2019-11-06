// Backdating Alert for Invoices
//
// SD {pendingNumber}
// Throws an alert when the Transaction Date of dude date is 
//
// 1.0.0	27/05/2016	EGO	Initial Build	

function popupAlert( type, name, linenum ){
	if( name == 'trandate' || name == 'duedate' ){	
		// this is the threshold for maximum number of days for back/forward dating invoices. change as needed
		var dayThreshold = 5;
		var months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
		var dateString = nlapiGetFieldValue( name ).split('-');
		var mydate = new Date( dateString[2], months.indexOf(dateString[1]), dateString[0] ); 
		var today = new Date();
		var td = Math.floor( (today - mydate) / (24*60*60*1000) );
		
		if( name == 'trandate'){
			if( Math.abs(td) > dayThreshold ){
				alert("WARNING! The transaction date is more than " + dayThreshold + " days from today. Please double check before saving the record.");
			}
		}
		
		if( name == 'duedate'){
			if( td > dayThreshold ){
				alert("WARNING! The due date is more than " + dayThreshold + " days ago. Please double check before saving the record.");
			}
		}
	}
}

function OnSave_Validate()
{
		var on_hold = nlapiGetFieldValue('custbody_inv_on_hold');
		var hold_rsn = nlapiGetFieldValue('custbody_mys_hold_inv_rsn');
		if (on_hold == 'T' && hold_rsn == '')
		{
		   alert("Please select the Reason for Holding the Invoice");
		   return false;
		}
	return true;
}


