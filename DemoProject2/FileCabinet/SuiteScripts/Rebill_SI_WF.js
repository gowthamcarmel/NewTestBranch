/**
 * Module Description
 * 
 * Uplift the SO when rebilling has to be done
 * 
 * Version    Date            Author           Remarks
 * 1.00       24 Feb 2016     gowthamr
 *
 */

/**
 * @returns {Void} Any or no return value
 */
function UpLift_SO() 
{
	try{
		//get Invoice ID
		var invId = nlapiGetRecordId();

		log('Invoice ID:'+invId);

		var invRec = nlapiLoadRecord('invoice', invId);

		var soId = invRec.getFieldValue('createdfrom');
		log('SO ID:'+soId);

		var soRec = nlapiLoadRecord('salesorder', soId);

		var invoice_count = invRec.getLineItemCount('item');

		log('Invoice Line item Count:'+invoice_count);

		var so_count = soRec.getLineItemCount('item');

		log('SO Line item Count:'+so_count);

		//calling the function to get the line id of the item in SO
		var lineobject = return_so_linenumber(soId,invId);

		if(so_count != 0 && invoice_count != 0  )
		{
			//looping Invoice line item 
			for ( var j = 1; j <= invoice_count; j++)
			{
			
				
				if(lineobject !=0 && lineobject != null)
					
					{
   					licount =lineobject.length;
					 log('licount :'+licount);
					
					
			
			   	var line = lineobject[j - 1].getValue('line');
                 log('line :'+line);
                 var applyinglinktype = lineobject[j - 1].getValue('applyinglinktype');
                 log('applyinglinktype :'+applyinglinktype);
                 
                 //checking whether line is null or zero
				if(line !=0 && line != null)
				{
					log('line No in SO :'+j+' :line :' +line);
					//item
					var Invitem = invRec.getLineItemValue('item', 'item', j);
					log('line No :'+j+' :Invitem :' +Invitem);
					var SOitem = soRec.getLineItemValue('item', 'item',line);
					log('line No :'+line+' :SOitem :' +SOitem);

					//line number
					var invlinenumber = invRec.getLineItemValue('item', 'line', j);
					log('line No :'+j+' :invlinenumber :' +invlinenumber);
					var SOlinenumber = soRec.getLineItemValue('item', 'line', line);
					log('line No :'+line+' :SOlinenumber :' +SOlinenumber);

					if(Invitem == SOitem)
					{
						var InvBillQty = invRec.getLineItemValue('item', 'quantity', j);
						log('line No :'+j+' :InvBillQty :' +InvBillQty );
						var SOBillQty = soRec.getLineItemValue('item', 'quantity', line);
						log('line No :'+line+' :SOBillQty :' +SOBillQty);

						var quantity = (+InvBillQty + +SOBillQty);
						log('quantity SO :' + quantity);

						var InvBillAmount = invRec.getLineItemValue('item', 'amount', j);
						log('line No :'+j+' :InvBillQty :' +InvBillAmount );
						var SOBillAmount = soRec.getLineItemValue('item', 'amount', line);
						log('line No :'+line+' :SOBillQty :' +SOBillAmount);

						var amount =  (+InvBillAmount + +SOBillAmount) ;
						log('amount SO :' + amount);

						soRec.setLineItemValue('item', 'quantity',line, quantity);
						soRec.setLineItemValue('item', 'amount',line,amount);
					}
				}
					}

				//looping SO line items

				/* for ( var i = 1; i <= so_count; i++)
				{

					//id
					var invlineid = invRec.getLineItemValue('item', 'id', j);
					log('line No :'+j+' :Invlineid :' +invlineid);
					var SOlineid = soRec.getLineItemValue('item', 'id', i);
					log('line No :'+i+' :SOlineid :' +SOlineid);

					//item
					var Invitem = invRec.getLineItemValue('item', 'item', j);
					log('line No :'+j+' :Invitem :' +Invitem);
					var SOitem = soRec.getLineItemValue('item', 'item', i);
					log('line No :'+i+' :SOitem :' +SOitem);

					//line number
					var invlinenumber = invRec.getLineItemValue('item', 'line', j);
					log('line No :'+j+' :invlinenumber :' +invlinenumber);
					var SOlinenumber = soRec.getLineItemValue('item', 'line', i);
					log('line No :'+i+' :SOlinenumber :' +SOlinenumber);


					//Check if items are equal
					if(Invitem == SOitem)
					{
						var InvBillQty = invRec.getLineItemValue('item', 'quantity', j);
						log('line No :'+j+' :InvBillQty :' +InvBillQty );
						var SOBillQty = soRec.getLineItemValue('item', 'quantity', i);
						log('line No :'+i+' :SOBillQty :' +SOBillQty);

						var quantity = (+InvBillQty + +SOBillQty);
						log('quantity SO :' + quantity);

						var InvBillAmount = invRec.getLineItemValue('item', 'amount', j);
						log('line No :'+j+' :InvBillQty :' +InvBillAmount );
						var SOBillAmount = soRec.getLineItemValue('item', 'amount', i);
						log('line No :'+i+' :SOBillQty :' +SOBillAmount);

						var amount =  (+InvBillAmount + +SOBillAmount) ;
						log('amount SO :' + amount);

						soRec.setLineItemValue('item', 'quantity',i, quantity);
						soRec.setLineItemValue('item', 'amount',i,amount);
						//soRec.commitLineItem('item');

						//nlapiSetCurrentLineItemValue('item', 'quantity',i, 4);
						//nlapiSetCurrentLineItemValue('item', 'amount', i,4);
						//nlapiCommitLineItem('item');
					}
					else
						{
						continue;
						}



				}*/

			}
		}
		var r = nlapiSubmitRecord(soRec);
		log('Submited SO :' + r);

	}
	catch(e)
	{
		log('ERROR :'+e);	
	}


}
function log(message)
{
	nlapiLogExecution('Debug', 'SO Uplift', message);
}


//Function returns line number of the SO item by passing internalid of SO and SI which are applying on SO
function return_so_linenumber(internalid,invoice)
{
	log('search_so_lineitems function starts');

	var criteria = new Array();
	criteria.push(new nlobjSearchFilter('internalid', null, 'anyof', internalid));
	criteria.push(new nlobjSearchFilter('applyingtransaction', null, 'anyof', invoice));
	criteria.push(new nlobjSearchFilter( 'mainline', null, 'is', 'F'));
	criteria.push(new nlobjSearchFilter( 'applyinglinktype', null, 'anyof', 'OrdBill'));

	var col = new Array();
	col.push(new nlobjSearchColumn('line'));
	col.push(new nlobjSearchColumn('applyinglinktype'));

	var linenumber = nlapiSearchRecord('salesorder', null, criteria, col);
	log('search_so_lineitems function ends');
	return linenumber;
}
