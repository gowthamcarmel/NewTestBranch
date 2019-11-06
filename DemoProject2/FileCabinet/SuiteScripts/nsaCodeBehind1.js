 /**********************************************************************
 *           n E T s U I T E   s M A R T   a S S I S T A N T         
 *               
 * 				"Necessity is the mother of all invention." - Anonymous                          
 *
 *   Author:    LoBS                                  
 *   Conceived: 10/2016                            
 *   Version: 	1.0.0                                 
 ***********************************************************************
 *
 *	Changelog: (please be diligent enough to update this all the time)
 *	
 * 
 * 
 * 
 * 
 */

var context = nlapiGetContext();
var mainScriptId = context.getScriptId();

function main(){
	// this baby will contain the primary logic of the AI

}

function nsaOnline(request, response){
	// this is the Suitelet that requires login access
	var form = nlapiCreateForm('Administrator Console');

	if ( request.getMethod() == 'GET' ){
		// load page
		var scriptDeploymentId = context.getDeploymentId();
		var scriptUrl = nlapiResolveURL('SUITELET', mainScriptId, scriptDeploymentId);

		var content = "";
		var toolId = "";

		var tool1link = form.addField( 'custpagelink1', 'inlinehtml');

		// Load Current Status


		// Load Tool List
		toolId = request.getParameter('custpagetoolid');

		/**
		//if( toolId == "" ){
			content += '<table>';
			content += '<tr><td style="vertical-align:top">';
			
			content += '<br/><font style="font-size:1.3em"><b>System Status</b></font><br/><br/>';	
			content += 'Exchange Rates Variance: % change vs yesterday, % chahnge vs 2 days back<br/>';
			content += 'Record Count Change: All counts are higher or same as yesterday.<br/>';	

			content += '<br/><font style="font-size:1.3em"><b>Admin Tools</b></font><br/><br/>';	
		
			content += '<a href="' + scriptUrl + '&custpagetoolid=1' + '">' + toolId + '</a>';
		
			content += '</td><td style="vertical-align:top; padding-left:20px">';

			content += 'content right<br/>';

			content += '</td></tr>';
			content += '</table>';
		//}
		**/
		
		
		//content += '<html>';
		//content += '<head>';
		/**content += '<style>';
		content += 'body {';
		content += '    margin: 0;';
		content += '}';

		content += 'ul {';
		content += '    list-style-type: none;';
		content += '    margin: 0;';
		content += '    padding: 0;';
		content += '    width: 25%;';
		content += '    background-color: #f1f1f1;';
		content += '    position: fixed;';
		content += '    height: 100%;';
		content += '    overflow: auto;';
		content += '}';

		content += 'li a {';
		content += '    display: block;';
		content += '    color: #000;';
		content += '    padding: 8px 16px;';
		content += '    text-decoration: none;';
		content += '}';

		content += 'li a.active {';
		content += '    background-color: #008CBA;';
		content += '    color: white;';
		content += '}';

		content += 'li a:hover {';
		content += '    background-color: #ddd;';
		content += '    color: #fff;';
		content += '}';
		content += '</style>';**/
		//content += '</head>';
		//content += '<body>';
		
		content += '<script type="text/javascript">';
		content += 'function showDiv(idInfo) {';
		content += 'var sel = document.getElementById(\'divLinks\').getElementsByTagName(\'div\');';
		content += 'for (var i=0; i<sel.length; i++) {';
		content += 'sel[i].style.display = \'none\';';
		content += '}';
		content += 'document.getElementById(\'container\'+idInfo).style.display = \'block\';';
		content += '}';
		content += '</script>';

		content += '<ul style="list-style-type: none;margin: 0;padding: 0;width: 25%;background-color: #f1f1f1; position: fixed;height: 100%;overflow: auto;">';
		content += '  <li><a style="display: block;color: #000;padding: 8px 16px;text-decoration: none;background-color: #008CBA;" href="#" onclick="showDiv(\'1\');return false">Dashboard</a></li>';
		content += '  <li><a style="display: block;color: #000;padding: 8px 16px;text-decoration: none;background-color: #008CBA;" href="#">Admin Tools</a></li>';
		content += '  <li><a style="display: block;color: #000;padding: 10px 16px;text-decoration: none;" href="#" onMouseOver="this.style.backgroundColor=\'#ddd\'" onMouseOut="this.style.backgroundColor=\'#f1f1f1\'" onclick="showDiv(\'2\'); this.style.backgroundColor=\'#008CBA\'; return false">VAT Number Change Tool</a></li>';
		content += '  <li><a style="display: block;color: #000;padding: 10px 16px;text-decoration: none;" href="#" onMouseOver="this.style.backgroundColor=\'#ddd\'" onMouseOut="this.style.backgroundColor=\'#f1f1f1\'" onclick="showDiv(\'3\');return false">RLF Sales Order Tester</a></li>';
		content += '  <li><a style="display: block;color: #000;padding: 10px 16px;text-decoration: none;" href="#" onMouseOver="this.style.backgroundColor=\'#ddd\'" onMouseOut="this.style.backgroundColor=\'#f1f1f1\'" onclick="showDiv(\'4\');return false">Subscription Change Order Tool</a></li>';
		
		
		content += '</ul>';

		content += '<div id="divLinks">';
		content += '<div id="container1" style="margin-left:30%;padding:25px 25px;height:100%;">';
		content += '  <h2>System Status</h2>';
		content += '  <p>Exchange Rates Variance: % change vs yesterday, % chahnge vs 2 days back Record Count Change: All counts are higher or same as yesterday</p>';
		content += '</div>';
		
		content += '<div id="container2" style="margin-left:30%;padding:25px 25px;height:100%;display:none;">';
		content += '  <h2>VAT Number Change Tool</h2>';
		//content += '  <p>Exchange Rates Variance: % change vs yesterday, % chahnge vs 2 days back Record Count Change: All counts are higher or same as yesterday</p>';
		content += '</div>';

		
		content += '<div id="container3" style="margin-left:30%;padding:25px 25px;height:100%;display:none;">';
		content += '  <h2>RLF Sales Order Tested</h2>';
		//content += '  <p>Exchange Rates Variance: % change vs yesterday, % chahnge vs 2 days back Record Count Change: All counts are higher or same as yesterday</p>';
		content += '</div>';

		
		content += '<div id="container4" style="margin-left:30%;padding:25px 25px;height:100%;display:none;">';
		content += '  <h2>Subscription Change Order</h2>';
		//content += '  <p>Exchange Rates Variance: % change vs yesterday, % chahnge vs 2 days back Record Count Change: All counts are higher or same as yesterday</p>';
		content += '</div>';
		content += '</div>';
			
		//content += '</body>';
		//content += '</html>';


		tool1link.setDefaultValue( content );
		tool1link.setLayoutType('normal', 'startcol');

	}else{
		// submit page

	}

	response.writePage( form );
}



function nsaOffline(request, response){
// this is the Suitelet that is available without login 

	if(request.getMethod() == 'GET') {
		var fileHead = nlapiLoadFile(11358); //load the header file
		
		// load CSS files
		var fileCssBootstrap = nlapiLoadFile(11359); 
		var fileCssFont = nlapiLoadFile(11361); 
		var fileCssCustom = nlapiLoadFile(11360); 
		
		// load JS Files
		var fileScriptFooterJs = nlapiLoadFile(11372);
		var fileBootstrapJs = nlapiLoadFile(11362);
		var fileFastclickJs = nlapiLoadFile(11364);
		var fileNprogressJs = nlapiLoadFile(11366);
		var fileSmartwizardJs = nlapiLoadFile(11365);
		var fileCustomJs = nlapiLoadFile(11363);
		
		var fileBody = nlapiLoadFile(11357); //load the header file
		
		// System Variables
		var homeLink = 'https://miplace.misys.com/Interact/Pages/Section/Default.aspx?homepage=1&section=-1';
				
		var contents = '<!DOCTYPE html><html lang="en" class=" "><head>';
		contents += fileHead.getValue();
		
		// Load CSS files
		contents += '<style>';
		// load bootstrap.min.css
		contents += fileCssBootstrap.getValue();
		// load font-awesome.min.css
		contents += fileCssFont.getValue();
		// load custom.min.css
		contents += fileCssCustom.getValue();
		contents += '</style>';
		
		// Start Body
		contents += '</head><body class="nav-md">';
		
		contents += fileBody.getValue();
		
		
		// insert body scripts
		contents += '<script>';
		contents += fileBootstrapJs.getValue();
		contents += fileFastclickJs.getValue();
		contents += fileNprogressJs.getValue();
		contents += fileSmartwizardJs.getValue();
		contents += fileCustomJs.getValue();
		contents += '</script>';
		
		contents += fileScriptFooterJs.getValue();
				
		contents += '</body></html>';
		
		response.write(contents); //render it on the suitelet
	}
}


///////  Misys Functions    //////

function constants(){
	this.pi = 3.141592653589793238462643383279502884197169399375105820974944592307816406286;
	this.nsCurrProdWsdl = 'https://webservices.netsuite.com/services/NetSuitePort_2014_2';
	this.nsCurrDemoWsdl = 'https://webservices.na1.netsuite.com/services/NetSuitePort_2014_2';
	this.nsCurrSbWsdl = 'https://webservices.sandbox.netsuite.com/services/NetSuitePort_2014_2';
	this.yahooFinanceWsdl = 'http://finance.yahoo.com/webservice/v1/symbols/allcurrencies/quote';
} 

function ueBeforeSubmit(){
	// Update Last Record Count
	var rec = nlapiGetRecordId();
	
}

function nsLog(fld, fldval){
	nlapiLogExecution('DEBUG',fld,fldval);
}

function nsaEncrypt(inputstring){
	var outputEncrypted = '';	
	return outputEncrypted;
}


function nsaDecrypt(inputstring){
	var outputDecrypted = '';	
	return outputDecrypted;
}

function nsPopUpAlert(form,inputMessage){
	var html = ''		 
		+'<script type="text/Javascript" src="/core/media/media.nl?id=331752&c=1062913&h=9a41ccb62ca1c9e97865&_xt=.js"></script>'
		+'<script type="text/Javascript">'				   
			+'setTimeout("getMessage(' + inputMessage + ')",500);'		   
		+'</script>';
	var alertfield =  form.addField('custpage_alertmode', 'inlinehtml', 'lorem ipsum: ',null,null); 
	alertfield.setDefaultValue(html); 
}

function nsGetSubrecordLineField(rectype,recid,linenum,fieldid,lineid){
	var b = nlapiLoadRecord('invoice', recid, {recordmode: 'dynamic'});
	b.selectLineItem('item', lineid);
	try{
		var a = b.viewCurrentLineItemSubrecord('item', 'inventorydetail');
		var f = "";
		nsLog('line number','Line: ' + linenum);
		a.selectLineItem('inventoryassignment', linenum);
		var d = a.getCurrentLineItemValue('inventoryassignment',fieldid);
		var e = nlapiLoadRecord('inventorynumber',d);
		f = e.getFieldValue('inventorynumber');	
		nsLog('Field',fieldid+': '+f);
		var gg = b.getCurrentLineItemValue('item','item');
		lobs_debug('Item','Item ID: ' + gg);
		return f;
	}catch(err){
		nsLog('Error',err);
	}
}

function nsCreateFileReturnURL(filename,filetyp,filecontent,folderid,isonline,env){
	var filex = nlapiCreateFile(filename, 'PLAINTEXT', 'Hello World\nHello World');
	filex.setFolder(folderid);
	filex.setIsOnline(isonline);
	var idx = nlapiSubmitFile(filex);
	var fileload = nlapiLoadFile(idx);
	if(env == 'prod'){
		var envparm = '';
	}else if( env == 'test'){
		var envparm = 'na1.';
	}else if( env == 'sandbox'){
		var envparm = 'sandbox.';
	}
	var fileUrl = 'https://system.' + envparm + 'netsuite.com' + fileload.getURL();
	nsLog('url',fileUrl);
}

function nsHtmlToPdf(contents,filename){
	var xml = '<?xml version=\"1.0\"?>\n<!DOCTYPE pdf PUBLIC \"-//big.faceless.org//report\" \"report-1.1.dtd\">\n'; 
	xml += '<pdf>\n';
	/****      Sample Data Input    *****
	'<body font-size=\"12\">\n<h3>Testing ACAL link</h3>\n'; 
	'<div style="background-image: url(http://www.w3schools.com/html/smiley.gif);">'; 
	'<a href="" style="text-decoration:none;">'; 
	'<img src="http://www.w3schools.com/html/smiley.gif" />'; 
	'</a>';
	'</div>'; 
	'</body>\n
	*************************************/
	xml += contents;
	xml += '</pdf>';    
	var pdf = nlapiXMLToPDF( xml ); 
	response.setContentType('PDF',filename); 
	response.write( pdf.getValue() ); 
}

function nsYieldRecovery(i){
	// To be used inside the 'For-Loop', pass iterator parameter as 'i'
	if((i % 100) == 0) nsSetRecoveryPoint();  
	nsCheckGovernance();
}
			
function nsCheckGovernance(){
	var context = nlapiGetContext();
	if( context.getRemainingUsage() < 10000 ){
		var state = nlapiYieldScript();
		if( state.status == 'FAILURE'){
			nlapiLogExecution("ERROR","Failed to yield script, exiting: Reason = "+state.reason + " / Size = "+ state.size);
			throw "Failed to yield script";
		}else if( state.status == 'RESUME' ){
			nlapiLogExecution("AUDIT", "Resuming script because of " + state.reason+".  Size = "+ state.size);
		}
		// state.status will never be SUCCESS because a success would imply a yield has occurred.  The equivalent response would be yield
	}
}

function nsSetRecoveryPoint(){
	var state = nlapiSetRecoveryPoint(); //100 point governance
	if( state.status == 'SUCCESS' ) return;  //we successfully create a new recovery point
	//a recovery point was previously set, we are resuming due to some unforeseen error
	if( state.status == 'RESUME' ){
		nlapiLogExecution("ERROR", "Resuming script because of " + state.reason+".  Size = "+ state.size);
		handleScriptRecovery();
	}else if ( state.status == 'FAILURE' ){
		//we failed to create a new recovery point
		nlapiLogExecution("ERROR","Failed to create recovery point. Reason = "+state.reason + " / Size = "+ state.size);
		handleRecoveryFailure(state);
	}
}

function nsCreateRec(recType,isDynamic,fieldNames,fieldVals,sublistId,sublistFields,sublistVals){
	if(isDynamic == 'true'){
		var newRec = nlapiCreateRecord(recType,{recordmode:'dynamic'});
	}else{
		var newRec = nlapiCreateRecord(recType);
	}
	for ( var i = 0; fieldNames != null && i < fieldNames.length; i++ ){
		newRec.setFieldValue(fieldNames[i], fieldVals[i]);
	}
	for ( var i = 0; sublistId != null && i < sublistId.length; i++ ){
		newRec.selectNewLineItem(sublistId[i]);
		for ( var j = 0; sublistFields != null && j < sublistFields.length; j++ ){
			newRec.setCurrentLineItemValue(sublistId[i], sublistFields[j], sublistVals[j]);
		}
		newRec.commitLineItem(sublistId[i]);
	}
	var newRecId = nlapiSubmitRecord(newRec,true);
}

function nsSessionVar(){
	this.department = nlapiGetDepartment();
	this.location = nlapiGetLocation();
	this.role = nlapiGetRole();
	this.subsidiary = nlapiGetSubsidiary();
	this.user = nlapiGetUser();
}

function nsPoStatus(){
	this.PendingSupervisorApproval = 'PurchOrd:A'; 
	this.PendingReceipt = 'PurchOrd:B'; 
	this.RejectedBySupervisor = 'PurchOrd:C';
	this.PartiallyReceived = 'PurchOrd:D';
	this.PendingBillingPartiallyReceived = 'PurchOrd:E';
	this.PendingBill = 'PurchOrd:F';
	this.FullyBilled = 'PurchOrd:G';
	this.Closed = 'PurchOrd:H';
}

function nsInvStatus(){
	this.Open = 'CustInvc:A';
	this.PaidInFull = 'CustInvc:B';
}

function nsContentType(){
	// Files Content Type
	// last updated: 1/12/2014 12:00 MNL
	this.dwg = 'application/x-autocad';
	this.bmp = 'image/x-xbitmap';
	this.csv = 'text/csv';
	this.xls = 'application/vnd.ms-excel';
	this.flv = 'application/x-shockwave-flash';
	this.gif = 'image/gif';
	this.gzip = 'application/x-gzip-compressed';
	this.html = 'text/html';
	this.ico = 'image/ico';
	this.js = 'text/javascript';
	this.jpg = 'image/jpeg';
	this.eml = 'message/rfc822';
	this.mp3 = 'audio/mpeg';
	this.mpeg = 'video/mpeg';
	this.proj = 'application/vnd.ms-project';
	this.pdf = 'application/pdf';
	this.pjpg = 'image/pjpeg';
	this.txt = 'text/plain';
	this.png = 'image/x-png';
	this.ps = 'application/postscript';
	this.ppt = 'application/vnd.ms-powerpoint';
	this.mov = 'video/quicktime';
	this.trf = 'application/rtf';
	this.sms = 'application/sms';
	this.css = 'text/css';
	this.tiff = 'image/tiff';
	this.vsd = 'application/vnd.visio';
	this.doc = 'application/msword';
	this.xml = 'text/xml';
	this.zip = 'application/zip';
}

function nsFileType(){
	// last updated: 1/12/2014 12:00 MNL
	this.dwg = 'AUTOCAD';
	this.bmp = 'BMPIMAGE';
	this.csv = 'CSV';
	this.xls = 'EXCEL';
	this.flv = 'FLASH';
	this.gif = 'GIFIMAGE';
	this.gzip = 'GZIP';
	this.html = 'HTMLDOC';
	this.ico = 'ICON';
	this.js = 'JAVASCRIPT';
	this.jpg = 'JPGIMAGE';
	this.eml = 'MESSAGERFC';
	this.mp3 = 'MP3';
	this.mpeg = 'MPEGMOVIE';
	this.proj = 'MSPROJECT';
	this.pdf = 'PDF';
	this.pjpg = 'PJPGIMAGE';
	this.txt = 'PLAINTEXT';
	this.png = 'PNGIMAGE';
	this.ps = 'POSTSCRIPT';
	this.ppt = 'POWERPOINT';
	this.mov = 'QUICKTIME';
	this.trf = 'RTF';
	this.sms = 'SMS';
	this.css = 'STYLESHEET';
	this.tiff = 'TIFFIMAGE';
	this.vsd = 'VISIO';
	this.doc = 'WORD';
	this.xml = 'XMLDOC';
	this.zip = 'ZIP';
}

function nsRec(){
	// last updated: 1/12/2014 12:00 MNL
	this.Account = 'account';
	this.Activity = 'activity';
	this.AssemblyBuild = 'assemblybuild';
	this.AssemblyUnbuild = 'assemblyunbuild';
	this.BillingClass = 'billingclass';
	this.Bin = 'bin';
	this.BinTransfer = 'bintransfer';
	this.BinWorksheet = 'binworksheet';
	this.BuildAssemblyItem = 'assemblyitem';
	this.BundleInstallationScript = 'bundleinstallationscript';
	this.Campaign = 'campaign';
	this.CampaignTemplate = 'campaigntemplate';
	this.Case = 'supportcase';
	this.CashRefund = 'cashrefund';
	this.CashSale = 'cashsale';	
	this.Charge = 'charge';
	this.Check = 'check';
	this.Class = 'classification';
	this.ClientScript = 'clientscript';
	this.Competitor = 'competitor';
	this.Contact = 'contact';
	this.CouponCode = 'couponcode';
	this.CreditMemo = 'creditmemo';
	this.Currency = 'currency';
	this.CustomRecord = 'customrecord';
	this.Customer = 'customer';
	this.CustomerCategory = 'customercategory';
	this.CustomerDeposit = 'customerdeposit';	
	this.CustomerPayment = 'customerpayment';
	this.CustomerRefund = 'customerrefund';
	this.Department = 'department';
	this.DepositApplication = 'depositapplication';
	this.DescriptionItem = 'descriptionitem';
	this.DiscountItem = 'discountitem';
	this.DownloadItem = 'downloaditem';
	this.EmailTemplate = 'emailtemplate';
	this.Employee = 'employee';
	this.Entity = 'entity';
	this.Estimate = 'estimate';
	this.Event = 'calendarevent';
	this.ExpenseCategory = 'expensecategory';
	this.ExpenseReport = 'expensereport';
	this.Folder = 'folder';
	this.GiftCertificate = 'giftcertificate';
	this.GiftCertificateItem = 'giftcertificateitem';
	this.IntercompanyJournalEntry = 'intercompanyjournalentry';
	this.InventoryAdjustment = 'inventoryadjustment';
	this.InventoryCostRevaluation = 'inventorycostrevaluation';
	this.InventoryDetail = 'inventorydetail';
	this.InventoryNumber = 'inventorynumber';
	this.InventoryPart = 'inventoryitem';
	this.InventoryTransfer = 'inventorytransfer';
	this.Invoice = 'invoice';
	this.Issue = 'issue';
	this.Item = 'item';
	this.ItemDemandPlan = 'itemdemandplan';
	this.ItemFulfillment = 'itemfulfillment';
	this.ItemGroup = 'itemgroup';
	this.ItemReceipt = 'itemreceipt';
	this.ItemRevision = 'itemrevision';
	this.ItemSupplyPlan = 'itemsupplyplan';
	this.JournalEntry = 'journalentry';	
	this.KitItem = 'kititem';
	this.Lead = 'lead';
	this.Location = 'location';
	this.LotNumberedBuildAssemblyItem = 'lotnumberedassemblyitem';
	this.LotNumberedInventoryItem = 'lotnumberedinventoryitem';
	this.ManufacturingCostTemplate = 'manufacturingcosttemplate';
	this.ManufacturingOperationTask = 'manufacturingoperationtask';
	this.ManufacturingRouting = 'manufacturingrouting';
	this.MarkupItem = 'markupitem';
	this.MassupdateScript = 'massupdatescript';
	this.Message = 'message';
	this.Nexus = 'nexus';
	this.NonInventoryPart = 'noninventoryitem';
	this.Note = 'note';
	this.Opportunity = 'opportunity';
	this.OtherChargeItem = 'otherchargeitem';
	this.OtherName = 'othername';
	this.Partner = 'partner';
	this.PaycheckJournal = 'paycheckjournal';
	this.PaymentItem = 'paymentitem';
	this.PayrollItem = 'payrollitem';
	this.PhoneCall = 'phonecall';
	this.Portlet = 'portlet';
	this.PriceLevel = 'pricelevel';
	this.Project = 'job';
	this.ProjectTask = 'projecttask';
	this.Promotion = 'promotioncode';
	this.Prospect = 'prospect';
	this.PurchaseOrder = 'purchaseorder';
	this.ReallocateItems = 'reallocateitem';
	this.Restlet = 'restlet';
	this.ReturnAuthorization = 'returnauthorization';
	this.RevenueCommitment = 'revenuecommitment';
	this.RevenueCommitmentReversal = 'revenuecommitmentreversal';
	this.RevenueRecognitionSchedule = 'revrecschedule';
	this.RevenueRecognitionTemplate = 'revrectemplate';
	this.SalesOrder = 'salesorder';
	this.SalesTaxItem = 'salestaxitem';
	this.ScheduledScript = 'scheduledscript';
	this.ScheduledScriptInstance = 'scheduledscriptinstance';
	this.ScriptDeployment = 'scriptdeployment';
	this.SerializedBuildAssemblyItem = 'serializedassemblyitem';
	this.SerializedInventoryItem = 'serializedinventoryitem';
	this.Service = 'serviceitem';
	this.Solution = 'solution';
	this.Subsidiary = 'subsidiary';
	this.SubtotalItem = 'subtotalitem';
	this.Suitelet = 'suitelet';
	this.Task = 'task';
	this.TaxAccount = 'taxacct';
	this.TaxGroup = 'taxgroup';
	this.TaxPeriod = 'taxperiod';
	this.TaxType = 'taxtype';
	this.Term = 'term';
	this.Time = 'timebill';
	this.Topic = 'topic';
	this.Transaction = 'transaction';
	this.TransferOrder = 'transferorder';
	this.UnitsType = 'unitstype';
	this.UsereventScript = 'usereventscript';
	this.Vendor = 'vendor';
	this.VendorBill = 'vendorbill';
	this.VendorCategory = 'vendorcategory';
	this.VendoCredit = 'vendorcredit';
	this.VendorPayment = 'vendorpayment';
	this.VendorReturnAuthorization = 'vendorreturnauthorization';
	this.Website = 'website';
	this.WorkOrder = 'workorder';
	this.WorkOrderClose = 'workorderclose';
	this.WorkOrderCompletion = 'workordercompletion';
	this.WorkOrderIssue = 'workorderissue';
	this.WorkflowActionScript = 'workflowactionscript';
}

/******* NS Script Templates *******

// UE Before Load Template
function beforeLoad(type, form, request){}

// UE Before Submit Template 
function beforeSubmit(type){}

// UE After Submit Template
function afterSubmit(type){}

// CS PageInit Template
function clientPageInit(type){}

// CS LineInit Template
function clientLineInit(type) {}

// CS Save Record Template
function clientSaveRecord(){}

// CS Validate Field Template
function clientValidateField(type, name, linenum){}

// CS Field Change Template
function clientFieldChanged(type, name, linenum){}

// CS Post Sourcing Template
function clientPostSourcing(type, name) {}

// CS Validate Line Template
function clientValidateLine(type){}

// CS Recalc Template
function clientRecalc(type){}

// CS Validate Insert Template
function clientValidateInsert(type){}

// CS Validate Delete Template
function clientValidateDelete(type){}

// SchedScrpt Template
function scheduled(type) {}
************************************/
