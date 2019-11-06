function sch_To_Update_Reveneue_Elements_onSO(type)
{
	try
	{
		var context = nlapiGetContext();
		var usageBegin = context.getRemainingUsage();
		nlapiLogExecution('DEBUG', 'Update Revenue Elements', 'usageBegin ==' + usageBegin);
		
		var SalesOrderSearch = context.getSetting('SCRIPT','custscript_so_search_to_update_rev_elemt');
		nlapiLogExecution('DEBUG', 'Update Revenue Elements', 'SalesOrderSearch ==' + SalesOrderSearch);
		
		var RevenueArrangementSearch = context.getSetting('SCRIPT','custscript_rev_argmt_search_to_update_so');
		nlapiLogExecution('DEBUG', 'Update Revenue Elements', 'RevenueArrangementSearch ==' + RevenueArrangementSearch);
		
		var SuiteletUrlBase = context.getSetting('SCRIPT','custscript_suitelet_url');
		nlapiLogExecution('DEBUG', 'Update Revenue Elements', 'custscript_suitelet_url ==' + SuiteletUrlBase);

		var hits = nlapiSearchRecord('salesorder',SalesOrderSearch,null,null);
		nlapiLogExecution('DEBUG', 'Update Revenue Elements', 'hits ==' + hits);
		
		if(_logValidation(hits))
		{
			for(var i=0;i<hits.length;i++)
			{
				var SORecId = hits[i].getValue('internalid');
				nlapiLogExecution('DEBUG', 'Update Revenue Elements', 'SORecId ==' + SORecId);
				
				var filters = new Array();
				filters[0] = new nlobjSearchFilter('custbody_arm_source_tran',null,'is',SORecId);
				
				var SearchResult = nlapiSearchRecord('revenuearrangement',RevenueArrangementSearch,filters,null);
				nlapiLogExecution('DEBUG', 'Update Revenue Elements', 'SearchResult ==' + SearchResult);
				
				if(_logValidation(SearchResult))
				{
					for(var j=0;j<SearchResult.length;j++)
					{
						var RevArrId = SearchResult[j].getValue('internalid');
						nlapiLogExecution('DEBUG', 'Update Revenue Elements', 'RevArrId ==' + RevArrId);
						
						if(_logValidation(RevArrId))
						{
							SORecObj = nlapiLoadRecord('salesorder', SORecId);
							//nlapiLogExecution('DEBUG', 'Update Revenue Elements', 'SORecObj ==' + SORecObj);
							
							RevArrRecObj = nlapiLoadRecord('revenuearrangement', RevArrId);
							//nlapiLogExecution('DEBUG', 'Update Revenue Elements', 'RevArrRecObj ==' + RevArrRecObj);
							
							var SOLineItemCount = SORecObj.getLineItemCount('item')
			            	//nlapiLogExecution('DEBUG', 'Update Revenue Elements', 'SOLineItemCount =='+SOLineItemCount);
							
							var RevElementLineItemCount = RevArrRecObj.getLineItemCount('revenueelement')
			            	//nlapiLogExecution('DEBUG', 'Update Revenue Elements', 'RevElementLineItemCount =='+RevElementLineItemCount);
			            	
			            	for(var a = 1; a <= SOLineItemCount; a++)
			            	{
			            		var RevElementID = '';
			            		
			            		var SOLineUniqueKey = SORecObj.getLineItemValue('item', 'lineuniquekey', a);
			            		//nlapiLogExecution('DEBUG', 'Update Revenue Elements', 'SOLineUniqueKey='+SOLineUniqueKey);
			            		
			            		for(var b = 1; b <= RevElementLineItemCount; b++)
				            	{
				            		var LineSourceId = RevArrRecObj.getLineItemValue('revenueelement', 'sourceid', b);
				            		//nlapiLogExecution('DEBUG', 'Update Revenue Elements', 'LineSourceId='+LineSourceId);
				            		
				            		if(SOLineUniqueKey == LineSourceId)
				            		{
				            			RevElementID = RevArrRecObj.getLineItemValue('revenueelement', 'revenueelement', b);
					            		//nlapiLogExecution('DEBUG', 'Update Revenue Elements', 'RevElementID='+RevElementID);
				            			
				            			//var SOLine = SORecObj.getLineItemValue('item', 'line', a);
					            		//nlapiLogExecution('DEBUG', 'Update Revenue Elements', 'SOLine='+SOLine);
					            		
					            		//RevArrRecObj.setLineItemValue('revenueelement', 'custcol_line_id', b, SOLine);
					            		
					            		break;
				            		}
				            	}
			            		
			            		if(_logValidation(RevElementID))
			            		{
			            			SORecObj.setLineItemValue('item', 'custcol_rev_elem_id', a, RevElementID);
			            		}
			            		
			            		//---- updating SO Line ID --------
			            		//var SOLine = SORecObj.getLineItemValue('item', 'line', a);
			            		//nlapiLogExecution('DEBUG', 'Update Revenue Elements', 'SOLine='+SOLine);
			            		
			            		//SORecObj.setLineItemValue('item', 'custcol_line_id', a, SOLine);
			            	}
			            	
			            	SORecObj.setFieldValue('custbody_to_update_lines', 'F');
			            	
			            	//var RevID = nlapiSubmitRecord(RevArrRecObj);
			            	//nlapiLogExecution('DEBUG', 'Update Revenue Elements', 'RevID='+RevID);
			            	
			            	var ID = nlapiSubmitRecord(SORecObj);
			            	nlapiLogExecution('DEBUG', 'Update Revenue Elements', 'ID='+ID);

			            	var suiteletUrl = SuiteletUrlBase + '&custpage_revarrid=' + RevArrId;
			            	var response = nlapiRequestURL(suiteletUrl);
			            	
			            	break;
						}
					}
				}
			}
		}
		
		
	}
	catch(Exception) 
	{
		nlapiLogExecution('DEBUG', 'Try Catch', 'Exception=' + Exception);
	}
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