// BEGIN SCRIPT DESCRIPTION BLOCK  ==================================
{
/*
   	Script Name: 	Finastra On Requisition User Event Script
	Author: 		Shubhradeep Saha
	Date:			26/10/2017
    Description:


	Script Modification Log:

	-- Date --			-- Modified By --				--Requested By--				-- Description --

  

Below is a summary of the process controls enforced by this script file.  The control logic is described
more fully, below, in the appropriate function headers and code blocks.


     BEFORE LOAD
		- beforeLoadRecord(type)



     BEFORE SUBMIT
		- beforeSubmitRecord(type)


     AFTER SUBMIT
		- afterSubmitRecord(type)



     SUB-FUNCTIONS
		- The following sub-functions are called by the above core functions in order to maintain code
            modularization:

               - NOT USED

*/
}
// END SCRIPT DESCRIPTION BLOCK  ====================================



function beforeLoad_OnRequisition(type,form)
{
	var RecordType = nlapiGetRecordType();
	//nlapiLogExecution('DEBUG','On Requisition User Event','RecordType='+ RecordType);
	
	nlapiLogExecution('DEBUG','On Requisition User Event','type='+ type);
	
	nlapiLogExecution('DEBUG','On Requisition User Event','context='+ nlapiGetContext().getExecutionContext());
	
	if((nlapiGetContext().getExecutionContext() == 'userinterface'))
	{
		if(type != 'print')
		{
			form.getSubList('item').getField('vendorname').setLabel('Vendor"s Item Code');
		}
		
		
		
		if(RecordType == 'purchaserequisition')
		{
			 
			var FormID = nlapiGetFieldValue('customform');
			//nlapiLogExecution('DEBUG','On Requisition User Event','FormID='+ FormID);
			
			form.getField('total').setDisplayType('hidden');
			form.getSubList('item').getField('rate').setDisplayType('hidden');
			form.getSubList('item').getField('amount').setDisplayType('hidden');
			form.getField('estimatedtotal').setLabel('Local Currency Total');
			form.getField('custbody_lastmodifieddate').setDisplayType('hidden');
			var modifieddate=nlapiGetFieldValue('custbody_lastmodifieddate');
			nlapiLogExecution('DEBUG','last modified date',modifieddate);
			
			
			var CurrentRequestor = nlapiGetFieldValue('entity');
			form.addField('custpage_currentreq','text','Current Requestor').setDefaultValue(CurrentRequestor);
			form.getField('custpage_currentreq').setDisplayType('hidden');
			nlapiLogExecution('DEBUG','CurrentReq',CurrentRequestor);
			//nlapiLogExecution('DEBUG','last modified',l_modified_Date);
			//form.getField('custbody_lastmodifieddate').setDisplayType('hidden');
			//nlapiSetFieldValue('custbody_lastmodifieddate',l_modified_Date,false);
			//var modifieddate=nlapiGetFieldValue('custbody_lastmodifieddate')
			//nlapiLogExecution('DEBUG','last modified date',modifieddate);
			//added by gowtham
			
			//if(FormID == '160')
			{
				//nlapiLogExecution('DEBUG','On Requisition User Event','Inside new form');
					
				 
				form.getSubList('item').getField('estimatedrate').setDisplayType('disabled');
				form.getSubList('item').getField('estimatedamount').setDisplayType('disabled');
				
			}
			if(type == 'view')
			{
				var Role = nlapiGetRole();
				
				if(Role == '3' || Role == '1056' || Role == '1260')
				{
					var Status = nlapiGetFieldValue('status');
					//nlapiLogExecution('DEBUG','On Requisition User Event','Status='+ Status);
					
					//if(Status == 'Pending Approval' && Status != 'Fully Ordered' && Status != 'Closed' && Status != 'Cancelled' && Status != 'Fully Received' && Status != 'Partially Received')
					
					if(Status == 'Pending Order' || Status == 'Partially Ordered')
					{
						form.setScript('customscript_finastra_onrequisition_cl');
						form.addButton('custpage_OrderRequisitionButton', 'Order Requisition', 'createPO()');
						
					}
				}
			}
			/*if(type == 'create')
			{
				var Role = nlapiGetRole();
				//nlapiLogExecution('DEBUG','On Requisition User Event','Role='+ Role);
				
				if(Role == '3' || Role == '1251' || Role == '1252')
				{
					form.setScript('customscript_finastra_onrequisition_cl');
					form.addButton('custpage_SetEmployeeDetails', 'Get Employee Details', 'getEmpDetails()');
				}
			}*/
			
		}
	}
	
	
	
	return true;
}


//added by gowtham
function afterSubmit_OnRequisition(type)
{
    try
    {
    	nlapiLogExecution('DEBUG','On Requisition User Event','type='+ type);
		
		function sysDate() {
		var date = new Date();
		var tdate = date.getDate();
		var month = date.getMonth() + 1; // jan = 0
		var year = date.getFullYear();
		return currentDate = month + '/' + tdate + '/' + year;
		}

		function timestamp() {
		var str = "";

		var currentTime = new Date();
		var hours = currentTime.getHours();
		var minutes = currentTime.getMinutes();
		var seconds = currentTime.getSeconds();
		var milliseconds=currentTime.getMilliseconds();
		var meridian = "";
		if (hours > 12) {
			meridian += "pm";
		} else {
			meridian += "am";
		}
		if (hours > 12) {

			hours = hours - 12;
		}
		if (minutes < 10) {
			minutes = "0" + minutes;
		}
		if (seconds < 10) {
			seconds = "0" + seconds;
		}
		str += hours + ":" + minutes + ":" + seconds + ":" + milliseconds+" ";

		return str + meridian;
		}
		
		var currentDate = sysDate(); // returns the date
		var currentTime = timestamp(); // returns the time stamp in HH:MM:SS
		var currentDateAndTime = currentDate + ' ' + currentTime;
		nlapiSetFieldValue('custbody_lastmodifieddate', currentDateAndTime);
		nlapiLogExecution('DEBUG', 'User Event Script', currentDateAndTime);
		
		
    	if(type != 'delete')
    	{
    		var RecId = nlapiGetRecordId();
            //nlapiLogExecution('DEBUG','RecId=', RecId);
            var RecordType = nlapiGetRecordType();
            //nlapiLogExecution('DEBUG','RecordType=', RecordType);
            
            if(RecordType == 'purchaserequisition')
            {
            	var RecObj = nlapiLoadRecord(RecordType, RecId);
            	
            	var ItemDetails = '';
            	
            	var LineItemCount = RecObj.getLineItemCount('item')
            	nlapiLogExecution('DEBUG', 'After submit', 'LineItemCount'+LineItemCount);
            	
            	for(var i = 1; i <= LineItemCount; i++)
            	{
            		// -----------
            		var ItemName = RecObj.getLineItemText('item', 'item', i);
            		nlapiLogExecution('DEBUG', 'After submit', 'ItemName='+ItemName);
            		
            		var Vendor = RecObj.getLineItemValue('item', 'povendor', i);
            		nlapiLogExecution('DEBUG', 'After submit', 'Vendor='+Vendor);
            		
            		if(_logValidation(Vendor))
            		{
            			var VendorName = RecObj.getLineItemText('item', 'povendor', i);
                		nlapiLogExecution('DEBUG', 'After submit', 'ItemName='+ItemName);
                		
                		ItemDetails = ItemDetails + '\n'+ VendorName + ' - ' + ItemName + ' || ';
            		}
            		else
            		{
            			ItemDetails = ItemDetails + '\n' + ItemName + ' || ';
            		}
            		
            		nlapiLogExecution('DEBUG', 'After submit', 'ItemDetails='+ItemDetails);
            		
            		
            		//--------------------
            		
            		var Description = RecObj.getLineItemValue('item', 'description', i);
            		nlapiLogExecution('DEBUG', 'After submit', 'Description='+Description);
            		
            		if(_logValidation(Description))
            		{
            			//nlapiSelectLineItem('item', i);
            			RecObj.setLineItemValue('item', 'custcol_item_description', i, Description);
            			//nlapiCommitLineItem('item');
            		}
            	}
            	RecObj.setFieldValue('custbody_vendor_item_details', ItemDetails);
            	RecObj.setFieldValue('custbody_lastmodifieddate',currentDateAndTime);
				nlapiLogExecution('DEBUG', 'User Event Script', currentDateAndTime);
            	var ID = nlapiSubmitRecord(RecObj);
            	nlapiLogExecution('DEBUG', 'After submit', 'ID'+ID);
            }
            else
            {
            	if(RecordType == 'purchaseorder')
            	{
            		if(type == 'create')
            		{
            			var RecObj = nlapiLoadRecord(RecordType, RecId);
            			var InterCompanyTran = RecObj.getFieldValue('intercotransaction');
            			nlapiLogExecution('DEBUG', 'After submit', 'InterCompanyTran'+InterCompanyTran);
            			
            			var ThirdPartyPOCheck = RecObj.getFieldValue('custbody_3pp_po');
            			nlapiLogExecution('DEBUG', 'After submit', 'ThirdPartyPOCheck'+ThirdPartyPOCheck);
            			
            			if(ThirdPartyPOCheck == 'F')
            			{
            				if(_nullValidation(InterCompanyTran))
                			{
                				var LineItemCount = RecObj.getLineItemCount('item')
                            	nlapiLogExecution('DEBUG', 'After submit', 'LineItemCount'+LineItemCount);
                            	
                            	for(var i = 1; i <= LineItemCount; i++)
                            	{
                            		var Description = RecObj.getLineItemValue('item', 'custcol_item_description', i);
                            		nlapiLogExecution('DEBUG', 'After submit', 'Description='+Description);
                            		
                            		if(_logValidation(Description))
                            		{
                            			//nlapiSelectLineItem('item', i);
                            			RecObj.setLineItemValue('item', 'description', i, Description);
                            			//nlapiCommitLineItem('item');
                            		}
                            	}
                			}
            				
            				var ID = nlapiSubmitRecord(RecObj);
                        	nlapiLogExecution('DEBUG', 'After submit', 'ID'+ID);
            			}
            			else
            			{
            				if(ThirdPartyPOCheck == 'T')
            				{
            					if(_nullValidation(InterCompanyTran))
            					{
            						var stToday = nlapiDateToString(new Date());
            						
            						var LineItemCount = RecObj.getLineItemCount('item')
                                	nlapiLogExecution('DEBUG', 'After submit', 'LineItemCount'+LineItemCount);
                                	
                                	for(var i = 1; i <= LineItemCount; i++)
                                	{
                                		var Product = RecObj.getLineItemValue('item', 'class', i);
                                		nlapiLogExecution('DEBUG', 'After submit', 'Product='+Product);
                                		
                                		
                                		if(_logValidation(Product))
                                		{
                                			RecObj.setFieldValue('class', Product);
                                			RecObj.setFieldValue('custbody_po_from_date', stToday);
                                			RecObj.setFieldValue('custbody_po_to_date', stToday);
                                		}
                                	}
            					}
            					var ID = nlapiSubmitRecord(RecObj);
                            	nlapiLogExecution('DEBUG', 'After submit', 'ID'+ID);
            				}
            			}
            		}
            	}
            }
    	}
    	
    }
    catch (error)
    {
    	if (error.getDetails != undefined)
        {
            nlapiLogExecution('ERROR','Process Error',  error.getCode() + ': ' + error.getDetails());
            throw error;
        }
        else
        {
            nlapiLogExecution('ERROR','Unexpected Error', error.toString()); 
            throw nlapiCreateError('99999', error.toString());
        }    	 
        return null;
    }
    
    
    return true;
}


function _logValidation(value)
{
	if(value != null && value != '' && value != undefined && value.toString() != 'NaN' && value != NaN)
	{
		return true;
	}
	else
	{
		return false;
	}
}

function _nullValidation(value)
{
	if (value == null || value == 'NaN' || value == '' || value == undefined || value == '&nbsp;')
	{
		return true;
	}
	else
	{
		return false;
	}
}