/**
 * Module Description
 * 
 * Version Date Author Remarks 1.02 180427 plincoln
 * updated to not use global variables
 */

//MS 20180604 moved function from grav_fin_makebedrockrequest.js
function getTimestamp()
{
    var cd = new Date();

    function addZero(i)
    {
        if (i < 10) { i = "0" + i; }
        return i;
    }

    var formatDate = cd.getMonth() + 1 + "" + cd.getDate() + "" + cd.getFullYear() +
        addZero(cd.getHours()) + "" + addZero(cd.getMinutes()) + "" + addZero(cd.getSeconds());
    return JSON.parse(formatDate);
}

function sleep(seconds)
{
    var e = new Date().getTime() + seconds * 1000;
    while (new Date().getTime() <= e);
}

/**
 * Calculates line_item discount based on the amount and total transaction
 * discount
 * 
 * @param {number} item_amount
 *            The dollar amount of the line item
 * 
 * @returns {Object} with discount amount and type
 */
function compileDiscounts(item_amount)
{
    var discounts = [];

    var promo_id = nlapiGetFieldValue("promocode");
    nlapiLogExecution("DEBUG", "compileDiscounts.promo_id", promo_id);

    if (promo_id)
    {

        var discounttotal = nlapiGetFieldValue("discounttotal");
        nlapiLogExecution("DEBUG", "compileDiscounts.discounttotal", discounttotal);

        var promo_obj = nlapiLoadRecord("promotioncode", promo_id);
        var promo_rate = parseFloat(promo_obj.getFieldValue("rate"));
        nlapiLogExecution("DEBUG", "compileDiscounts.promo_rate", promo_rate);

        var discount_amount = 0 - item_amount * (promo_rate / 100);
        var discount_type = 1;

        var newDiscount = {
            amount: discount_amount,
            discountType: discount_type
        };

        discounts.push(newDiscount);
    }
    return discounts;
}

/**
 * Used to compile Bedrock request body [taxCalculationInputLine] property.
 * Loops through all items and pulls appropriate information needed from Bedrock
 * to properly calculate tax
 * @param {string} recordType  recordType
 * @param {number} recordID    Record ID
 * @returns {Array} of line items with corresponding information
 */
function compileLineItems(recordType, recordID)
{
    // MS 20180604 move from MBRR 
    var transaction = nlapiLoadRecord(recordType, recordID);

    var lineItems = [];
    // Get total # of line items for array iteration
    var total_items = transaction.getLineItemCount("item");

    getRemainingUnits("Compile Line Items - START");
    nlapiLogExecution("DEBUG", "compileLineItems.total_items", total_items);
    for (var i = 1; i < total_items + 1; i++)
    {

        // Get Item id to load full Item Obj
        var item_id = transaction.getLineItemValue("item", "item", i);
        var item_tax_type_code = transaction.getLineItemText('item', 'custcol_us_tax_type_code', i);
        var item_type = transaction.getLineItemValue("item", "itemtype", i);
        var item_amount = parseFloat(transaction.getLineItemValue("item", "amount", i));

        //nlapiLogExecution("DEBUG", "compileLineItems.custcol_us_tax_type_code", item_tax_type_code);

        // Get line number from sales order
        var item_line_number = transaction.getLineItemValue("item", "line", i);

        try
        {
            var newLineItem = {
                lineNumber: parseInt(item_line_number),
                itemType: item_type,
                lineType: item_type,
                amount: item_amount,
                quantity: parseFloat(transaction.getLineItemValue("item", "quantity", i)),
                reference: item_id,
                itemName: item_tax_type_code,
                discounts: compileDiscounts(item_amount)
            };

            lineItems.push(newLineItem);

            // nlapiLogExecution("DEBUG", recordType + " newLineItem",
            // JSON.stringify(newLineItem));
        }
        catch (e)
        {
            nlapiLogExecution("DEBUG", recordType + " newLineItem ERR", e);
        }

    }
    getRemainingUnits("Compile Line Items - END");
    return lineItems;
}

/**
 * Given the record type, determines if it should be added to the Bedrock commit pool
 * @param {string} rt  recordType
 * @returns {Boolean} TRUE if should be added to commit pool
 */
function determinePreviewPosting(rt)
{
    var previewOrPosting = {
        isPreview: true,
        isPosting: false
    };

    switch (rt)
    {
        case "cashsale":
            previewOrPosting.isPreview = false;
            previewOrPosting.isPosting = !previewOrPosting.isPreview;
            break;
        case "salesorder":
            previewOrPosting.isPreview = true;
            previewOrPosting.isPosting = !previewOrPosting.isPreview;
            break;
        case "invoice":
            previewOrPosting.isPreview = false;
            previewOrPosting.isPosting = !previewOrPosting.isPreview;
            break;
        case "creditmemo":
            previewOrPosting.isPreview = false;
            previewOrPosting.isPosting = !previewOrPosting.isPreview;
            break;
        case "cashrefund":
            previewOrPosting.isPreview = false;
            previewOrPosting.isPosting = !previewOrPosting.isPreview;
            break;
        case "returnauthorization":
            previewOrPosting.isPreview = false;
            previewOrPosting.isPosting = !previewOrPosting.isPreview;
            break;
    }

    return previewOrPosting;
}

/**
 * Calculates the applicable tax rate for each line based on Bedrock data

 * @param {string} bedrock_response  Repsonse from Bedrock /calculate end-point
 * @param {string} rt  recordType
 * @param {number} rId    Record ID
 * @returns {Array} of line numbers and their calculated tax rate
 */
function calculateLineTaxPercent(bedrock_response, rt, rId)
{
    try
    {
        var record = nlapiLoadRecord(rt, rId);
    } catch (e)
    {
        nlapiLogExecution("DEBUG", rId + " load record ERR", e);
    }

    var newRecords = [];

    for (var i = 0; i < bedrock_response.lines.length; i++)
    {

        var thisLine = bedrock_response.lines[i];

        var lineItemNumber = thisLine.inputLineReference;

        var lineTaxPercent = 0;
        var lineNotionalTaxPercent = 0.0;
        // PL 180808  parse   
        var lineAmount = parseFloat(record.getLineItemValue('item', 'amount', lineItemNumber));
        nlapiLogExecution('DEBUG', 'lineAmount', "[" + lineAmount + "] - type: " + typeof lineAmount);

        for (var j = 0; j < thisLine.lines.length; j++)
        {
            var taxLine = thisLine.lines[j];
            nlapiLogExecution('DEBUG', 'taxLine - ' + j, JSON.stringify(taxLine));
            var thisPercent;
            //MS 20180808 this needs to be a double =
            if (lineAmount === 0.0)
            {
                thisPercent = 0;
            } else
            {
                thisPercent = taxLine.amount / lineAmount * 100;
            }
            nlapiLogExecution('DEBUG', 'thisPercent - ' + j, thisPercent);

            lineTaxPercent += thisPercent;
            // GRAVOC PL 180829 added notional tax percent
            lineNotionalTaxPercent += parseFloat(taxLine.taxRate);
        }

        // GRAVOC PL 180829 added notional tax percent
        var newRecord = {
            lineTaxPercent: Math.abs(lineTaxPercent),
            lineRef: lineItemNumber,
            notionalTaxPercent: Math.abs(lineNotionalTaxPercent)
        };

        newRecords.push(newRecord);

    }

    nlapiLogExecution("DEBUG", rId + " newRecords", JSON.stringify(newRecords));
    return newRecords;
}

function buildFullOrderFin(recordType, recordID, user)
{
    var transaction = nlapiLoadRecord(recordType, recordID);

    nlapiLogExecution("DEBUG", "buildFullOrderFin START");
    nlapiLogExecution('DEBUG', 'start load config');
    nlapiLogExecution("DEBUG", " buildFullOrderFin.recordType", recordType);
    nlapiLogExecution("DEBUG", "buildFullOrderFin.recordID", recordID);
    nlapiLogExecution("DEBUG", "buildFullOrderFin.user", user);

    //var transaction = nlapiLoadRecord(recordType, recordID);
    var previewPosting = determinePreviewPosting(recordType);
    var accountInfo = nlapiLoadConfiguration('companyinformation');
    var employerId = accountInfo.getFieldValue('employerid');

    var transEntity = transaction.getFieldValue("entity");
    var CustomerRecord = nlapiLoadRecord('customer', transEntity);

    var trandate = transaction.getFieldValue('trandate');
    var timeStamp = getTimestamp();
    var uniqueID = recordID + timeStamp;

    // Load subrecords for shipping and billing addresses
    var shippingaddress = transaction.viewSubrecord("shippingaddress");
    var billingaddress = transaction.viewSubrecord("billingaddress");

    //var subsid_id = nlapiGetFieldValue('subsidiary');
    var subsid_id = transaction.getFieldValue('subsidiary');
    var subsid = nlapiLoadRecord('subsidiary', subsid_id);
    var fromAddress = subsid.viewSubrecord('mainaddress');
    // PL 180612  updated to pull the entity from a custom field
    var entity = subsid.getFieldValue('custrecord_twe_entity_id');
    var subName = subsid.getFieldValue('name');
    nlapiLogExecution("DEBUG", "BuildFullOrderFin - subsid.getFieldValue('custrecord_twe_entity_id')", entity);
    nlapiLogExecution("DEBUG", "BuildFullOrderFin - subsid.getFieldValue('name')", subName);
    nlapiLogExecution('DEBUG', 'subsid_id', subsid_id);
    nlapiLogExecution('DEBUG', 'fromAddress', fromAddress);
    nlapiLogExecution('DEBUG', 'shippingaddress', shippingaddress);
    nlapiLogExecution('DEBUG', 'billingaddress', billingaddress);
    nlapiLogExecution('DEBUG', 'got records');
    //var previewPosting = determinePreviewPosting(recordType);

    var validFromAddress = ValidateAddress_Fin(fromAddress);
    nlapiLogExecution('DEBUG', 'MS - validFromAddress  complete?', validFromAddress);
    var validshippingaddress = ValidateAddress_Fin(shippingaddress);
    nlapiLogExecution('DEBUG', 'MS - validshippingaddress  complete?', validshippingaddress);
    var validbillingaddress = ValidateAddress_Fin(billingaddress);
    nlapiLogExecution('DEBUG', 'MS - validbillingaddress  complete?', validbillingaddress);

    // PL 180530  modified to not look for billing address
    if (validshippingaddress === false || validFromAddress === false)
    {
        nlapiLogExecution('DEBUG', 'MS*-Cant create FullOrder - Some Address info is missing');
    }
    else
    {
        nlapiLogExecution('DEBUG', 'MS*-All addresses are good');

        getRemainingUnits("compile order - START");
        var fullOrder = {};
        fullOrder.entityId = entity; 
        fullOrder.subsidiaryName = subName;//nlapiGetFieldText("subsidiary");
        fullOrder.taxRegistrationId = accountInfo.getFieldValue('taxid');
        fullOrder.currencyId = transaction.getFieldValue("currencyname");
        fullOrder.nexusId = "";
        fullOrder.locationId = "";
        //fullOrder.subtotal = parseFloat(nlapiGetFieldValue("subtotal"));
        //fullOrder.discountTotal = parseFloat(nlapiGetFieldValue("discounttotal"));
        fullOrder.subtotal = parseFloat(transaction.getFieldValue("subtotal"));
        fullOrder.discountTotal = parseFloat(transaction.getFieldValue("discounttotal"));
        fullOrder.isPreview = previewPosting.isPreview;
        fullOrder.isTaxRegistrationOverridden = "false";

        // PL 180530 if no billing address then use shipping address
        var billToAdd = null;
        nlapiLogExecution('DEBUG', 'billingaddress', JSON.stringify(billingaddress));
        if (billingaddress === null)
        {
            billToAdd = new AddressInfo(shippingaddress);
        }
        else
        {
            billToAdd = new AddressInfo(billingaddress);
        }

        fullOrder.billToAddress = billToAdd;
        fullOrder.shipToAddress = new AddressInfo(shippingaddress);
        fullOrder.shipFromAddress = new AddressInfo(fromAddress);
        fullOrder.billFromAddress = new AddressInfo(fromAddress);
        fullOrder.transactionDate = {
            day: formatDate(trandate).getDate(),
            month: formatDate(trandate).getMonth() + 1,
            year: formatDate(trandate).getFullYear()
        };
        fullOrder.postingEndDate = {
            day: formatDate(trandate).getDate(),
            month: formatDate(trandate).getMonth() + 1,
            year: formatDate(trandate).getFullYear()
        };

        // PL 180723  changed to support multi line address
        //fullOrder.taxCalculationInputLine = compileLineItems(recordType, recordID);
        fullOrder.taxCalculationInputLine = CompileLineItemsMulti(recordType, recordID,
            fullOrder.shipFromAddress, fullOrder.billFromAddress,
            fullOrder.shipToAddress, fullOrder.billToAddress,
            user);

        fullOrder.customerVendor = {
            name: CustomerRecord.getFieldValue('entityid'),
            taxRegistrationNumber: CustomerRecord.getFieldValue('vatregnumber')
        };
        fullOrder.isPosting = previewPosting.isPosting;
        fullOrder.transactionDocNumber = transaction.getFieldValue("tranid");
        fullOrder.transactionId = recordID;
        fullOrder.transactionRecordType = recordType;
    }
    getRemainingUnits("buildFullOrderFin - END");
    return fullOrder;
}

/**
 * Pulls date field value and formats string to values that can be passed to Bedrock
 * @param {string} trandate Transaction Date
 * @returns {string} ID of updated record
 */
function formatDate(trandate)
{
    var cleanDate = trandate.split('-');
    var m = trandate.split('-')[1];
    var d = trandate.split('-')[0];
    var y = trandate.split('-')[2];
    return new Date("" + d + " " + m + " " + y + "");
}

/**
 * Iterates through result of calculateLineTaxPercent to apply percentages and 
 * tax code TWE_[ISO STATE CODE] to line items
 * 
 * @param {Object} lineTaxPercents
 * 		Array of line items and their applicable tax rates
 * @param {string} recordType  recordType
 * @param {number} recordID    Record ID
 * @returns {String} ID of updated record
 */


function assignLineTaxPercent(lineTaxPercents, recordType, recordID, userId)
{

    try
    {
        var record = nlapiLoadRecord(recordType, recordID);
    }
    catch (e)
    {

        nlapiLogExecution("DEBUG", " assignLineTaxPercent.load record ERR", JSON.stringify(e));
    }

    var shipCountry = record.getFieldValue("shipcountry");
    var state = record.getFieldValue("shipstate");
    var state_code_name = null;
    var state_tax_code = null;
    var state_tax_id = null;
    var taxStatus = 5; //completed - failure
    //var user = nlapiGetUser();

    // PL 180718 added logic for Guam 
    nlapiLogExecution("DEBUG", " shipCounrty: " + shipCountry + " shipstate: " + state);
    if (shipCountry === "US" || shipCountry === "GU" || shipCountry === "PR")
    {

        if (shipCountry === "US" && state !== null && state.length === 2)
        {
            state_code_name = "TWE_" + state;
        }
        else if (shipCountry === "GU" || shipCountry === "PR")
        {
            state_code_name = "TWE_" + shipCountry;
        }

        //Ship state/country is valid
        if (state_code_name !== '' && state_code_name !== null)
        {
            nlapiLogExecution("DEBUG", "Ship state/country is valid.");
            // Search for the tax code for this transaction's shipping state
            nlapiLogExecution("DEBUG", recordID + " - state_code_name", state_code_name);
            state_tax_code = nlapiSearchRecord('salestaxitem', null, new nlobjSearchFilter('itemid', null, 'is', state_code_name), null);
        }
        if (state_tax_code !== '' && state_tax_code !== null)
        {
            state_tax_id = state_tax_code[0].getId();
        }
        else
        {
            // MS 20180808 could not find tax code in netsuite
            nlapiLogExecution("DEBUG", "Could not find applicable tax code.");
            //state_tax_id = 659781;
            var emailBody = "Could not find appropriate tax code for the shipping address.";
            nlapiLogExecution("DEBUG", "Send email to:" + userId);
            SendTransactionEmail(userId, recordID, recordType, "Unable to save taxcode / taxrate - could not find taxcode in netsuite.", emailBody);

        }

        if (state_tax_id !== '' && state_tax_id !== null)
        {
            nlapiLogExecution("DEBUG", " state_tax_id", state_tax_id);

            for (var i = 0; i < lineTaxPercents.length; i++)
            {
                nlapiLogExecution("DEBUG", recordType + " lineTaxPercent:", JSON.stringify(lineTaxPercents[i]));

                try
                {
                    // set Tax code first
                    record.setLineItemValue('item', 'taxcode', lineTaxPercents[i].lineRef, state_tax_id);
                    // set tax rate last
                    record.setLineItemValue('item', 'taxrate1', lineTaxPercents[i].lineRef, lineTaxPercents[i].lineTaxPercent);
                    // PL 180829 set notional tax rate 
                    record.setLineItemValue('item', 'custcol_grav_fin_notionaltaxrate', lineTaxPercents[i].lineRef, lineTaxPercents[i].notionalTaxPercent);
                }
                catch (e)
                {
                    nlapiLogExecution("DEBUG", " assignLineTaxPercent.setLineItemValue  - line leve - ERR", JSON.stringify(e));
                    var emailSub2 = "Unable to set taxcode / taxrate - line level.";
                    var emailBody2 = emailSub2 + "\n\n" + JSON.stringify(e);
                    SendTransactionEmail(userId, recordID, recordType, "Unable to save taxcode / taxrate - line level:", emailBody2);
                }
                /*
                
                var item_id = nlapiGetCurrentLineItemValue(recordType, "item");
                // If line is not empty, set tax code to previously queried
                if (item_id) {
                    nlapiSetCurrentLineItemValue(recordType, "taxcode", state_tax_id, false);
                }
                */
            }
            try
            {
                // Save record  
                // PL 190906 ignore mandatory fields
                nlapiSubmitRecord(record, { disabletriggers: true, enablesourcing: true },true);
                taxStatus = 4; //completed - Success

            }
            catch (e)
            {
                nlapiLogExecution("DEBUG", " assignLineTaxPercent.setLineItemValue - on save record - ERR", JSON.stringify(e));
                var emailSubject3 = "Unable to save taxcode / taxrate - on save record.";
                var emailBody3 = emailSubject3 + "\n\n" + JSON.stringify(e);
                SendTransactionEmail(userId, recordID, recordType, emailSubject3, emailBody3);
            }

        }
    }

    else
    {
        nlapiLogExecution("DEBUG", "TWE does not support international addresses at this time.");
        //email_body = 'TWE does not support international addresses at this time. Please review the appropriate tax code and rate for state "' + state + '" for transaction:' + transaction.getFieldValue("tranid") + ".  Please contact your system administrator for further details.";

        //SendTransactionEmail(userId, recordID, recordType, "Unable to save taxcode / taxrate - on save record:", emailBody);

    }
    return taxStatus;

}

function SetUsTaxStatus(status, rId, rType)
{

    /*   List Status Values     
     *  1	subsidiary not TWE enabled
     *  2   not started
     *  3	sent - pending response
     *  4	completed - success
     *  5	completed - failure
     */
    //grab the transaction from the Id
    nlapiLogExecution("DEBUG", "FinLib.SetUsTaxStatus START", "Status: " + status + " , RecId: " + rId + " ,RecType: " + rType);
    //update the status
    var fieldName = "custbody_ustaxstatus";
    var trans = nlapiLoadRecord(rType, rId);
    trans.setFieldValue(fieldName, status);


    if (status === 4 && rType === 'salesorder')
    {
        //MS 20180814 - fire trigger on submit of the last step - after tax code and rete is set
        nlapiSubmitRecord(trans, { disabletriggers: false, enablesourcing: false });
    }
    else
    {
        // submit record without firing a trigger
        nlapiSubmitRecord(trans, { disabletriggers: true, enablesourcing: false });
    }
}



/**
 * Used to compile Bedrock request body [taxCalculationInputLine] property.
 * Loops through all items and pulls appropriate information needed from Bedrock
 * to properly calculate tax
 * @param {string} recordType  recordType
 * @param {number} recordID    Record ID
 * @param {Object} shipFromAddress jason address
 * @param {Object} billFromAddress jason address
 * @param {Object} shipToAddress jason address
 * @param {Object} billToAddress jason address
 * @param {Object} user jason address
 * @returns {Array} of line items with corresponding information
 */
function CompileLineItemsMulti(recordType, recordID, shipFromAddress, billFromAddress, shipToAddress, billToAddress, user)
{


    // MS 20180604 move from MBRR 
    var transaction = nlapiLoadRecord(recordType, recordID);

    var lineItems = [];
    // Get total # of line items for array iteration
    var total_items = transaction.getLineItemCount("item");

    getRemainingUnits("Compile Line Items - START");
    nlapiLogExecution("DEBUG", "compileLineItems.total_items", total_items);
    for (var i = 1; i < total_items + 1; i++)
    {

        // Get Item id to load full Item Obj
        var item_id = transaction.getLineItemValue("item", "item", i);
        var item_tax_type_code = transaction.getLineItemText('item', 'custcol_us_tax_type_code', i);
        var item_type = transaction.getLineItemValue("item", "itemtype", i);
        var item_amount = parseFloat(transaction.getLineItemValue("item", "amount", i));
        var ship_FromCodeId = transaction.getLineItemValue("item", "custcol_ship_from_code", i);
        var isMultiLine = false;
        nlapiLogExecution("DEBUG", "CompileLineItemsMulti.ship_FromCodeId", ship_FromCodeId);


        // determine if this line has a special address
        if (ship_FromCodeId !== null && ship_FromCodeId !== "")
        {
            isMultiLine = true;
            // pull the ship from address
            var ship_FromPipeAddr = transaction.getLineItemValue("item", "custcol_ship_from_address", i);

            nlapiLogExecution("DEBUG", "CompileLineItemsMulti.isMultiLine", isMultiLine);
        }

        // Get line number from sales order
        var item_line_number = transaction.getLineItemValue("item", "line", i);

        try
        {
            var newLineItem = {
                lineNumber: parseInt(item_line_number),
                itemType: item_type,
                lineType: item_type,
                amount: item_amount,
                quantity: parseFloat(transaction.getLineItemValue("item", "quantity", i)),
                reference: item_id,
                itemName: item_tax_type_code,
                discounts: compileDiscounts(item_amount)
            };

            // PL 180723 - if sales from line is found, then
            if (isMultiLine)
            {


                nlapiLogExecution("DEBUG", "CompileLineItemsMulti.shipfromAddress", ship_FromPipeAddr);
                newLineItem.shipFromAddress = new AddressInfoMulti(ship_FromPipeAddr, recordType, recordID, user);
            }
            lineItems.push(newLineItem);

            // nlapiLogExecution("DEBUG", recordType + " newLineItem",
            // JSON.stringify(newLineItem));
        }
        catch (e)
        {
            nlapiLogExecution("DEBUG", "CompileLineItemsMulti ERR", JSON.stringify(e));
        }

    }
    nlapiLogExecution("DEBUG", "CompileLineItemsMulti END", JSON.stringify(lineItems));
    return lineItems;
}

function AddressInfoMulti(pipedAddress, rTp, rId, user)
{
    // check for null values
    nlapiLogExecution('DEBUG', 'AddressInfoMulti.pipedAddress', pipedAddress);
    if (pipedAddress === null || pipedAddress === "")
        return;



    var splitArray = pipedAddress.split("|");
    var isInvalidAddress = true;
    if (splitArray.length >= 5)
    {
        // parse the values backwards
        var length = splitArray.length;
        this.country = splitArray[length - 1];
        this.zipCode = splitArray[length - 2];
        this.state = splitArray[length - 3];
        this.city = splitArray[length - 4];
        // concatenate the rest of the street address
        var tempStreet = "";
        for (var i = 0; i < splitArray.length - 4; i++)
        {
            tempStreet += splitArray[i];
        }

        this.streetNameNumber = tempStreet;
        // last value is country
        //validate address

        if (this.city !== null && this.city !== "" &&
            this.state !== null && this.state !== "" &&
            this.country !== null && this.country !== "")
        {
            isInvalidAddress = false;
        }



    }

    if (isInvalidAddress)
    {
        nlapiLogExecution('DEBUG', 'AddressInfoMulti - Invalid Address', "User (" + user + ") - " + pipedAddress);
        //send an email to user       
        var email_Body = "The following Ship From Address on " + rTp +
            " - " + rId + " is invalid.  \n\t[" + pipedAddress +
            "]\n\nPlease contact your system administrator for further details.\n\n\n\n";
        var email_Subject = "Invalid Ship From Address";
        SendTransactionEmail(user, rId, rTp, email_Subject, email_Body);
    }





}

function SendTransactionEmail(user, rId, rType, subject, email_body)
{
    var records = new Object();
    records['transaction'] = rId.toString();
    var bccArray = ["plincoln@gravoc.com", "msmith@gravoc.com"];
    nlapiLogExecution("DEBUG", "SendTransactionEmail");

    var transaction = nlapiLoadRecord(rType, rId);
    var transactionDocNumber = transaction.getFieldValue("tranid");
    subject = "Sovos Tax Calculation - " + subject;
    email_body = email_body + "\n" + "RecordType: " + rType + ", Record ID: " + rId + ", transactionDocNumber: " + transactionDocNumber + "\n\n";
    try
    {
        nlapiSendEmail(user, user, subject, email_body, null, bccArray, records, null, true, false, null);
    }
    catch (e)
    {
        nlapiLogExecution("DEBUG", "SendTransactionEmail ERR", JSON.stringify(e));
    }
}


function ValidateAddress_Fin(src)
{
    var retObj = true;
    if (src === null)
    {
        retObj = false;
    }
    else if (src.getFieldValue('country') === null || src.getFieldValue('country') === "")
    {
        retObj = false;
    }
    else if (src.getFieldValue('country') === 'US' && (
        src.getFieldValue('zip') === null || src.getFieldValue('zip') === "" ||
        src.getFieldValue('state') === null || src.getFieldValue('state') === ""))
    {

        retObj = false;

    }

    return retObj;
}

/*MS 20180807 Insert record in GravTransQueue
  transType - string
  transNum - string 
  transID - int - list/record
  transInternalId - int

*/
function GravTransQueue_Insert(transType, transID)
{
    var record = nlapiCreateRecord('customrecord_gravtransqueue');

    record.setFieldValue('custrecord_transtype', transType);
    if (transID !== 0) { record.setFieldValue('custrecord_transid', transID); }
    record.setFieldValue('custrecord_transinternalid', transID);

    record.setFieldValue('custrecord_grav_isqueued', "F");
    record.setFieldValue('custrecord_initiatinguser', nlapiGetUser());
    id = nlapiSubmitRecord(record, true);
    nlapiLogExecution('DEBUG', 'GravTransQueue_Insert id:' + id, 'transType: ' + transType + ', transID: ' + transID);

    return id;
}

/*MS 20180807 Update record in GravTransQueue
  GravTransQueueId - int - internal id
  failedToQueue - T or F
*/
function GravTransQueue_FailedToQueue(GravTransQueueId, failedToQueue)
{
    var record = nlapiLoadRecord('customrecord_gravtransqueue', GravTransQueueId);
    record.setFieldValue('custrecord_failedtoqueue', failedToQueue);
    id = nlapiSubmitRecord(record, true);
    return id;
}

function GravTransQueue_SetQueue(GravTransQueueId)
{
    nlapiLogExecution('DEBUG', "GravTransQueue_SetQueue.QueueId", GravTransQueueId);
    var record = nlapiLoadRecord('customrecord_gravtransqueue', GravTransQueueId);
    var createDate = record.getDateTimeValue("createddate");
    nlapiLogExecution('DEBUG', 'GravTransQueue_SetQueue.createDate', JSON.stringify(createDate));
    record.setFieldValue('custrecord_grav_isqueued', "T");
    //record.setDateTimeValue('custrecord_queuetime', SysTime());
    id = nlapiSubmitRecord(record, true);
    return id;
}

function SysTime()
{
    var str = "";

    var currentTime = new Date();
    var hours = currentTime.getHours();
    var minutes = currentTime.getMinutes();
    var seconds = currentTime.getSeconds();
    var meridian = "";

    if (hours >= 12)
    {
        meridian += "pm";
    } else
    {
        meridian += "am";
    }

    if (minutes < 10)
    {
        minutes = "0" + minutes;
    }
    if (seconds < 10)
    {
        seconds = "0" + seconds;
    }
    str += hours + ":" + minutes + ":" + seconds;

    var date = currentTime;
    var tdate = date.getDate();
    var month = date.getMonth() + 1; // jan = 0
    if (month < 10)
    {
        month = "0" + month;
    }
    if (tdate < 10)
    {
        tdate = "0" + tdate;
    }
    var year = date.getFullYear();
    var retObj = month + '/' + tdate + '/' + year + " " + str;
    nlapiLogExecution('DEBUG', 'SysTime', "[" + retObj + "]");
    return retObj;
}

/*
  * Used to check ensure that TWE switches are turned on.  Master switch in configfile.  
  * Subsidiary switch
  * 
  */
function PreRunCheck_Fin(isServerSideCode)
{
    nlapiLogExecution('DEBUG', 'preRunCheck Start ', new Date().getTime());
    var retObj = true;
    // if server side then assume that we can pull records
    if (isServerSideCode)
    {
        // check for master switch
        var configRecord = GetFirstConfigRec();
        nlapiLogExecution('DEBUG', 'preRunCheck A ', new Date().getTime());
        if (configRecord === null)
        {
            throw "No customrecord_sovos_configuration index 1 found!";
        }
        else
        {
            var masterSwitch = configRecord.getFieldValue('custrecord_sovos_isenabled');
            nlapiLogExecution('DEBUG', 'preRunCheck.masterSwitch ', masterSwitch);
            if (masterSwitch === 'F')
            {
                nlapiLogExecution('DEBUG', 'preRunCheck ', 'Config switch is turned off');
                return false;
                // master switch is turned off
            }
            else nlapiLogExecution('DEBUG', 'preRunCheck ', 'Config switch is turned on');
        }
        // check for subsidary switch
        var subsid = nlapiGetFieldValue('subsidiary');
        nlapiLogExecution('DEBUG', 'preRunCheck.subsid ', subsid);
        // avoid case where the subsidary is nothing
        if (subsid !== '' && subsid !== null)
        {
            var subsidiary = nlapiLoadRecord('subsidiary', subsid);
            nlapiLogExecution('DEBUG', 'preRunCheck C ', new Date().getTime());
            if (subsidiary === null)
            {
                throw "No subsidiary index [" + subsid + "] found!";
            }
            else
            {
                // PL 180710  fixed typo custrecord_tweenabled =>custrecord_IStweenabled
                // PL 180905 version conflict with finastra changed back to custrecord_tweenabled for CFA
                // PL 180906  added a Finastra specific version
                var isTweSubEnabled = subsidiary.getFieldValue('custrecord_istweenabled');
                nlapiLogExecution('DEBUG', 'preRunCheck.isTweSubEnabled', isTweSubEnabled);
                if (isTweSubEnabled === 'F' || isTweSubEnabled === null || isTweSubEnabled === '')
                {
                    nlapiLogExecution('DEBUG', 'preRunCheck ', 'subsidary switch is turned off');
                    return false;
                    // Subsidiary field is turned off
                }
                else
                {

                    nlapiLogExecution('DEBUG', 'preRunCheck ', 'subsidary switch is turned on');
                }

            }
        }
        else
        {
            nlapiLogExecution('DEBUG', 'preRunCheck D ', "No Subsidary Id Found");
            return false;
        }

    }
    else
    {
        // use SuiteLet to check records
        nlapiLogExecution('DEBUG', 'preRunCheck F', "TODO:  Client side code required");
    }

    // return true
    return retObj;

}
