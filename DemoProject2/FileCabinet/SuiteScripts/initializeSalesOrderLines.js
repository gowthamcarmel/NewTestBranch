/* Misys Script to initialize sales order line items
 *
 * Fields:
 * - Transactions Status
 *  
 **************************
 * Change Order: 8298
 * 
 */

function lineInit(){
	var recId = nlapiGetRecordId();
	var rec = nlapiLoadRecord('salesorder', recId);
	var statusText = rec.getFieldText('orderstatus');
	var tranCat = rec.getFieldValue('custbody_transactioncategory');
	
	// check last lineid
	var filters = new Array();
	filters[0] = new nlobjSearchFilter('internalidnumber', null, 'equalto', recId);
	var columns = new Array();
	columns[0] = new nlobjSearchColumn('line', null, 'max');
	var search = nlapiSearchRecord('salesorder', null, filters, columns);
	var maxLineId = search[0].getValue('line', null, 'max');
	
	nlapiLogExecution('DEBUG', 'SO Internal ID:' + recId, 'Status:' + statusText + ', Max Line:' + maxLineId + ', LineCount:' + search.length);
	
	if( maxLineId > 0 ){	
		for( var i = 1; i < maxLineId; i++ ){
			var itemId = null;
			try{ 
				itemId = rec.getLineItemValue('item','item', i);
				if( itemId ){
					rec.setLineItemValue('item', 'custcol_order_status', i, statusText); 
				}
			}catch(err){ 
				nlapiLogExecution('DEBUG', 'SO ID:' + recId + ' No line ' + i, ''); 
			} 
		}
		
		//------ adding the line numbers to the custom Line ID Column ------------//
		
      	if (tranCat == 1){
			var SOLineItemCount = rec.getLineItemCount('item');
			for(var a = 1; a <= SOLineItemCount; a++)
			{
				var SOLine = rec.getLineItemValue('item', 'line', a);			
				rec.setLineItemValue('item', 'custcol_line_id', a, SOLine);
			}
        }
		//------ end of adding the line numbers to the custom Line ID Column -------------//
		nlapiSubmitRecord( rec );
	}
}