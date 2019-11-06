function beforeload_addInstallButtons(type, form) {
    nlapiLogExecution('DEBUG', 'beforeload_addInstallButtons.Before Load Script Start', new Date().getTime());
    if (form) {
        form.setScript('customscript_grav_fin_cs_taxcodeinstall');
        form.addButton('custpage_grav_Install_US', 'Install US Nexuses', 'InstallUsNexuses()');
        form.addButton('custpage_grav_Install_US2', 'Install US TaxCodes', 'InstallUsTaxCodes()');
        //form.addButton('custpage_grav_Install_CA', 'Install Canada', 'InstallCAData()');
    }
    //nlapiLogExecution('DEBUG', 'beforeload_addInstallButtons.InstallUsTaxCodes - START', null);
    //var status = nlapiScheduleScript('customscript_grav_apg_ss_taxcodeinstall', null, null);
    //nlapiLogExecution('DEBUG', 'beforeload_addInstallButtons.InstallUsTaxCodes - customscript_grav_apg_ss_taxcodeinstall', status);
}

/**
 * On submit of Sovos Configuration Record, encrypts pass, stores in hidden field, and replaces
 * original pass for obfuscation
 */
function userEventAfterSubmit(type){
  
  var record = nlapiLoadRecord(nlapiGetRecordType(), nlapiGetRecordId());
  var pass_plain = record.getFieldValue('custrecord_sovos_password');
  if(pass_plain !== '********') {	  
	  nlapiLogExecution("DEBUG", "pass_plain", pass_plain);
	  var pass_encrypt = nlapiEncrypt(pass_plain, 'aes', 'cb96141bb1b427b19f56694885a3788c');
	  nlapiLogExecution("DEBUG", "pass_encrypt", pass_encrypt);
	  record.setFieldValue('custrecord_sovos_encrypted_pass', pass_encrypt)
	  record.setFieldValue('custrecord_sovos_password', '********');
	  nlapiSubmitRecord(record);
  }
}