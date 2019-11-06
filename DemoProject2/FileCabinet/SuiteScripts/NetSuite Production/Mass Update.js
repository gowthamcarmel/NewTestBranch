/**
 * Module Description
 * 
 * Version    Date            Author           Remarks
 * 1.00       10 Mar 2015     anduggal
 *
 */

/**
 * @param {String} recType Record type internal id
 * @param {Number} recId Record internal id
 * @returns {Void}
 */
function massUpdate(recType, recId) {
	nlapiSubmitField(recType, recId, 'owner', 13221);
}