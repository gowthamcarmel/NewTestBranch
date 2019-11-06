/**
 * Module Description
 * 
 * Version    Date            Author           Remarks
 * 1.00       12 Apr 2014     anduggal
 *
 */

/**
 * The recordType (internal id) corresponds to the "Applied To" record in your script deployment. 
 * @appliedtorecord recordType
 * 
 * @param {String} type Operation types: create, edit, delete, xedit,
 *                      approve, cancel, reject (SO, ER, Time Bill, PO & RMA only)
 *                      pack, ship (IF only)
 *                      dropship, specialorder, orderitems (PO only) 
 *                      paybills (vendor payments)
 * @returns {Void}
 */
function userEventAfterSubmit(type){
	
	var jnlId = nlapiGetRecordId();
	var jnlRec = nlapiLoadRecord('journalentry', jnlId);
	var oldNum = null;
	
	for ( var int = 1; int <= jnlRec.getLineItemCount('line'); int++) {
		var oaern = jnlRec.getLineItemValue('line', 'custcol_mys_oa_exp_rep_nmbr', int);
		
		if (oldNum != oaern) {
			var filters = new Array();
			filters[0] = new nlobjSearchFilter('custbody_oa_expense_report_number', null, 'is', oaern);
			
			var columns = new Array();
			columns[0] = new nlobjSearchColumn('tranid');
			
			var searchResults = nlapiSearchRecord('expensereport', null, filters, columns);
			for ( var i = 0; searchResults != null && i < 1; i++) {
				var record = nlapiLoadRecord(searchResults[i].getRecordType(), searchResults[i].getId());
				var icJnlCre = record.getFieldValue('custbody_mys_ic_jnl_cre');
				if (icJnlCre == 'F') {
					record.setFieldValue('custbody_mys_ic_jnl_cre', 'T');
					return nlapiSubmitRecord(record);
				}
			}
			oldNum = oaern;
		}
	}
}
