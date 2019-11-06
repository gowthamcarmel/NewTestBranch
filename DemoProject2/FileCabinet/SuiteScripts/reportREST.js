/**
 * @NApiVersion 2.x
 * @NScriptType Restlet
 * @NModuleScope SameAccount
 */
define(['N/search','N/record'],

function(search,record) {
   
    /**
     * Function called upon sending a GET request to the RESTlet.
     *
     * @param {Object} requestParams - Parameters from HTTP request URL; parameters will be passed into function as an Object (for all supported content types)
     * @returns {string | Object} HTTP response body; return string when request Content-Type is 'text/plain'; return Object when request Content-Type is 'application/json'
     * @since 2015.1
     */
    function doGet(requestParams) {
        
        
        //require(['N/search','N/record'], function(search,record){
            
            var recObj1 = [];
            /*var searchobj = search.create({
                type: search.Type.EMPLOYEE,
                columns: ['altname','email','lastmodifieddate'],
                filters: [    search.createFilter({
                    name: "supervisor",
                    operator : search.Operator.ANYOF,
                    values: '@NONE@'
                })]
            });*/
            
            var mySearch = search.load({
                id: 'customsearch7276'//you will input the id of the saved search
            });

            //Limit the result to the first 17 emplyoee
            var searchResultSet2 = mySearch.run().getRange({
                start: 0,
                end: 17
            });

                    for(var i=0;i<searchResultSet2.length;i++){
                        
                        recObj1[i] =[searchResultSet2[i].getValue('altname')+searchResultSet2[i].getValue('email')+searchResultSet2[i].getValue('lastmodifieddate')];
                        
                        }
                        
                    return JSON.stringify(recObj1);
    }

    return {
        'get': doGet,
    };
    
});