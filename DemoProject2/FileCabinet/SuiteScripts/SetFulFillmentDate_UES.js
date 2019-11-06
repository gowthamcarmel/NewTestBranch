/**
 * Module Description
 * 
 * Version    Date            Author           Remarks
 * 1.00       17 Jun 2016     gowthamr
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
function set_fulfillmentdate_aftersubmit(type)
{ 
	try{

		//if(type == 'create')
		{
			var cmId = nlapiGetRecordId();
			var cmRec = nlapiLoadRecord('creditmemo', cmId);
			var cm_applied_count = cmRec.getLineItemCount('apply');
			var cm_tran_id = cmRec.getFieldValue('tranid');
			
			var cm_fd = cmRec.getFieldValue('custbody_fulfillment_date');
			log('cm_fd:'+cm_fd);
			if(cm_fd == null || cm_fd =='')
				{
				
				
			log('cmId:'+cmId);
			log('cm_tran_id:'+cm_tran_id);
			
			log('cm_applied_count:'+cm_applied_count);
			
			log('getLatestDate function starts');
			
			var c = new Array();
			c.push(new nlobjSearchFilter('applyingtransaction', null, 'anyof', cmId));
			var search = nlapiSearchRecord('invoice', 'customsearch_fulfillmentdate_on_invoice', c, null);

			log('getLatestDate function ends');
		
			
			licount =search.length;
			log('licount:'+licount);
			
			var date = search[0].getValue('custbody_fulfillment_date',null,'max');
			log('date:'+date);
			
			cmRec.setFieldValue('custbody_fulfillment_date', date);
			
			var r = nlapiSubmitRecord(cmRec);
			log('Submited CM :' + r);
		 }
		}

	}
	catch (e)
	{
		log('ERROR :'+e);
	}
   
}

function log(message)
{
	nlapiLogExecution('Debug', 'Set FulFillment Date', message);
}



function getLatestDate(cm)
{
	log('getLatestDate function starts');

	var criteria = new Array();
	criteria.push(new nlobjSearchFilter('type', null, 'anyof', 'invoice'));
	criteria.push(new nlobjSearchFilter('applyingtransaction', null, 'anyof', cm));
	

	var col = new Array();
	col.push(new nlobjSearchColumn('shipdate',null,'max'));
	

	var latestdate = nlapiSearchRecord('invoice', null, criteria, col);
	log('getLatestDate function ends');
	return latestdate;
}