

/**
 * Entry point of install script - makes calls to all necessary methods
 */
function InstallUsNexuses() {
    alert("InstallUsNexuses START");
    nlapiLogExecution('DEBUG', 'InstallUsNexuses - START');
    createNexusesUS();
    nlapiLogExecution('DEBUG', 'InstallUsNexuses - END');
    alert("InstallUsNexuses END");
}

function InstallUsTaxCodes() {
    alert("InstallUsTaxCodes START");
    nlapiLogExecution('DEBUG', 'InstallUsTaxCodes - START', null);
    createTaxCodes();
    nlapiLogExecution('DEBUG', 'InstallUsTaxCodes - customscript_grav_apg_ss_taxcodeinstall', status);
  
    alert("InstallUsTaxCodes END");
}

function InstallCAData() {
    alert("InstallCAData Started");
    nlapiLogExecution('DEBUG', 'InstallCAData - START');
    //createNexuses();
    //createTaxCodes();
}



var stateList = ['AL', 'AK', 'AZ', 'AR', 'CA', 'CO', 'CT', 'DE', 'DC', 'FL',
    'GA', 'HI', 'ID', 'IL', 'IN', 'IA', 'KS', 'KY', 'LA', 'ME', 'MD',
    'MA', 'MI', 'MN', 'MS', 'MO', 'MT', 'NE', 'NV', 'NH', 'NJ', 'NM',
    'NY', 'NC', 'ND', 'OH', 'OK', 'OR', 'PA', 'RI', 'SC', 'SD', 'TN',
    'TX', 'UT', 'VT', 'VA', 'WA', 'WV', 'WI', 'WY', 'PR'];

// var countryList = ['AF','AX', 'AL', 'DZ', 'AS', 'AD', 'AO', 'AI', 'AQ', 'AG', 'AR',
//                  'AM','AW', 'AU', 'AT', 'AZ', 'BS', 'BH', 'BD', 'BB', 'BY', 'BE', 'BZ','BJ', 'BM', 'BT', 'BO', 'BA', 'BW', 'BV', 'BR', 'VG', 'IO', 'BN', 'BG','BF', 'BI', 'KH', 'CM', 'CA', 'CV', 'KY', 'CF', 'TD', 'CL', 'CN', 'HK',
//                  'MO', 'CX', 'CC', 'CO', 'KM', 'CG', 'CD', 'CK', 'CR', 'CI', 'HR', 'CU', 'CY', 'CZ', 'DK', 'DJ', 'DM', 'DO', 'EC', 'EG', 'SV', 'GQ', 'ER', 'EE','ET', 'FK', 'FO', 'FJ', 'FI', 'FR', 'GF', 'PF', 'TF', 'GA', 'GM', 'GE',
//                  'DE', 'GH', 'GI', 'GR', 'GL', 'GD', 'GP', 'GU', 'GT', 'GG', 'GN', 'GW',
//                  'GY', 'HT', 'HM', 'VA', 'HN', 'HU', 'IS', 'IN', 'ID', 'IR', 'IQ', 'IE', 'IM', 'IL', 'IT', 'JM', 'JP', 'JE', 'JO', 'KZ', 'KE', 'KI', 'KP', 'KR', 'KW', 'KG', 'LA', 'LV', 'LB', 'LS', 'LR', 'LY', 'LI', 'LT', 'LU', 'MK', 'MG',
//                  'MW', 'MY', 'MV', 'ML', 'MT', 'MH', 'MQ', 'MR', 'MU', 'YT', 'MX', 'FM', 'MD', 'MC', 'MN', 'ME', 'MS', 'MA', 'MZ', 'MM', 'NA', 'NR', 'NP', 'NL', 'AN', 'NC', 'NZ', 'NI', 'NE', 'NG', 'NU', 'NF', 'MP', 'NO', 'OM', 'PK', 'PW',
//                  'PS', 'PA', 'PG', 'PY', 'PE', 'PH', 'PN', 'PL', 'PT', 'PR', 'QA', 'RE', 'RO', 'RU', 'RW', 'BL', 'SH', 'KN', 'LC', 'MF', 'PM', 'VC', 'WS', 'SM', 'ST', 'SA', 'SN', 'RS', 'SC', 'SL', 'SG', 'SK', 'SI', 'SB', 'SO', 'ZA', 'GS',
//                  'SS', 'ES', 'LK', 'SD', 'SR', 'SJ', 'SZ', 'SE', 'CH', 'SY', 'TW', 'TJ', 'TZ', 'TH', 'TL', 'TG', 'TK', 'TO', 'TT', 'TN', 'TR', 'TM', 'TC', 'TV', 'UG', 'UA', 'AE', 'GB',
//                  'US', 'UM', 'UY', 'UZ', 'VU', 'VE', 'VN', 'VI', 'WF', 'EH', 'YE', 'ZM', 'ZW' ];

// var countryNameList = ['Afghanistan','Aland Islands', 'Albania', 'Algeria', 'American Samoa', 'Andorra', 'Angola', 'Anguilla', 'Antarctica', 'Antigua and Barbuda', 'Argentina', 'Armenia', 'Aruba', 'Australia',
// 'Austria', 'Azerbaijan', 'Bahamas', 'Bahrain', 'Bangladesh', 'Barbados', 'Belarus', 'Belgium', 'Belize', 'Benin', 'Bermuda', 'Bhutan', 'Bolivia', 'Bosnia and Herzegovina', 'Botswana',
// 'Bouvet Island', 'Brazil', 'British Virgin Islands', 'British Indian Ocean Territory', 'Brunei Darussalam', 'Bulgaria', 'Burkina Faso', 'Burundi', 'Cambodia', 'Cameroon', 'Canada', 'Cape Verde',
// 'Cayman Islands', 'Central African Republic', 'Chad', 'Chile', 'China', 'Hong Kong, SAR China', 'Macao, SAR China', 'Christmas Island', 'Cocos (Keeling) Islands', 'Colombia', 'Comoros', 'Congo (Brazzaville)',
// 'Congo, (Kinshasa)', 'Cook Islands', 'Costa Rica', 'Côte d\'Ivoire', 'Croatia', 'Cuba', 'Cyprus', 'Czech Republic', 'Denmark', 'Djibouti', 'Dominica', 'Dominican Republic', 'Ecuador', 'Egypt', 'El Salvador',
// 'Equatorial Guinea', 'Eritrea', 'Estonia', 'Ethiopia', 'Falkland Islands (Malvinas)', 'Faroe Islands', 'Fiji', 'Finland', 'France', 'French Guiana', 'French Polynesia', 'French Southern Territories', 'Gabon',
// 'Gambia', 'Georgia', 'Germany', 'Ghana', 'Gibraltar', 'Greece', 'Greenland', 'Grenada', 'Guadeloupe', 'Guam', 'Guatemala', 'Guernsey', 'Guinea', 'Guinea-Bissau', 'Guyana', 'Haiti', 'Heard and Mcdonald Islands',
// 'Holy See (Vatican City State)', 'Honduras', 'Hungary', 'Iceland', 'India', 'Indonesia', 'Iran, Islamic Republic of', 'Iraq', 'Ireland', 'Isle of Man', 'Israel', 'Italy', 'Jamaica', 'Japan', 'Jersey', 'Jordan',
// 'Kazakhstan', 'Kenya', 'Kiribati', 'Korea (North)', 'Korea (South)', 'Kuwait', 'Kyrgyzstan', 'Lao PDR', 'Latvia', 'Lebanon', 'Lesotho', 'Liberia', 'Libya', 'Liechtenstein', 'Lithuania', 'Luxembourg', 'Macedonia, Republic of',
// 'Madagascar', 'Malawi', 'Malaysia', 'Maldives', 'Mali', 'Malta', 'Marshall Islands', 'Martinique', 'Mauritania', 'Mauritius', 'Mayotte', 'Mexico', 'Micronesia, Federated States of', 'Moldova', 'Monaco', 'Mongolia', 'Montenegro',
// 'Montserrat', 'Morocco', 'Mozambique', 'Myanmar', 'Namibia', 'Nauru', 'Nepal', 'Netherlands', 'Netherlands Antilles', 'New Caledonia', 'New Zealand', 'Nicaragua', 'Niger', 'Nigeria', 'Niue', 'Norfolk Island', 'Northern Mariana Islands',
// 'Norway', 'Oman', 'Pakistan', 'Palau', 'Palestinian Territory', 'Panama', 'Papua New Guinea', 'Paraguay', 'Peru', 'Philippines', 'Pitcairn', 'Poland', 'Portugal', 'Puerto Rico', 'Qatar', 'Réunion', 'Romania', 'Russian Federation',
// 'Rwanda', 'Saint-Barthélemy', 'Saint Helena', 'Saint Kitts and Nevis', 'Saint Lucia', 'Saint-Martin (French part)', 'Saint Pierre and Miquelon', 'Saint Vincent and Grenadines', 'Samoa', 'San Marino', 'Sao Tome and Principe',
// 'Saudi Arabia', 'Senegal', 'Serbia', 'Seychelles', 'Sierra Leone', 'Singapore', 'Slovakia', 'Slovenia', 'Solomon Islands', 'Somalia', 'South Africa', 'South Georgia and the South Sandwich Islands', 'South Sudan', 'Spain', 'Sri Lanka',
// 'Sudan', 'Suriname', 'Svalbard and Jan Mayen Islands', 'Swaziland', 'Sweden', 'Switzerland', 'Syrian Arab Republic (Syria)', 'Taiwan, Republic of China', 'Tajikistan', 'Tanzania, United Republic of', 'Thailand', 'Timor-Leste', 'Togo',
// 'Tokelau', 'Tonga', 'Trinidad and Tobago', 'Tunisia', 'Turkey', 'Turkmenistan', 'Turks and Caicos Islands', 'Tuvalu', 'Uganda', 'Ukraine', 'United Arab Emirates', 'United Kingdom',
// 'United States of America', 'US Minor Outlying Islands', 'Uruguay', 'Uzbekistan', 'Vanuatu', 'Venezuela (Bolivarian Republic)', 'Vietnam', 'Virgin Islands, US', 'Wallis and Futuna Islands', 'Western Sahara', 'Yemen', 'Zambia', 'Zimbabwe']

var countryList = ['CN'];

/**
 * Creates a Nexus for each of the 50 US States and DC
 */
function createNexusesUS() {
    function checkExisting(nexus) {
        var exists = false;

        var Nexuses = nlapiSearchRecord(
            'nexus',
            null,
            [
                new nlobjSearchFilter('country', null, 'is', nexus.country),
                new nlobjSearchFilter('state', null, 'is', nexus.state),
                new nlobjSearchFilter('description', null, 'is', nexus.description)
            ],
            null
        );

        if (Nexuses) {
            if (Nexuses.length > 0) {
                exists = true;
            }
        }

        return exists;
    }

    /*
    // Country Loop
    for (var i = 0; i < countryList.length; i++) {
        var countryNexus = {
            country: countryList[i],
            description: countryList[i]
        };

        if (!checkExisting(countryNexus)) {
            var countryNexusRecord = nlapiCreateRecord('nexus');

            countryNexusRecord.setFieldValue('country', countryNexus.country);
            countryNexusRecord.setFieldValue('description', countryNexus.description);

            try {
                nlapiSubmitRecord(countryNexusRecord, true);
                nlapiLogExecution(
                    'DEBUG',
                    'Nexus Created',
                    JSON.stringify(countryNexus)
                );
            } catch (e) {
                nlapiLogExecution('DEBUG', 'ERR', e);
            }
        } else {
            nlapiLogExecution(
                'DEBUG',
                'Nexus Already Exists',
                JSON.stringify(countryNexus)
            );
        }
    }
    */

    // US - States Loop
    for (var j = 0; j < stateList.length; j++) {
        var newNexus = {
            country: 'US',
            state: stateList[j],
            description: stateList[j]
        };

        if (!checkExisting(newNexus)) {
            var stateNexusRecord = nlapiCreateRecord('nexus');

            stateNexusRecord.setFieldValue('country', newNexus.country);
            stateNexusRecord.setFieldValue('state', newNexus.state);
            stateNexusRecord.setFieldValue('description', newNexus.description);

            try {
                nlapiSubmitRecord(stateNexusRecord, true);
                nlapiLogExecution('DEBUG', 'Nexus Created', JSON.stringify(newNexus));
            } catch (e) {
                nlapiLogExecution('DEBUG', 'ERR', e);
            }
        } else {
            nlapiLogExecution(
                'DEBUG',
                'Nexus Already Exists',
                JSON.stringify(newNexus)
            );
        }
    }
}

/**
 * Creates a tax code for each of the 50 US States and DC called TWE_[STATE ISO CODE]
 */
function createTaxCodes() {
    function createTaxAgency(region) {
        var newTaxAgency = nlapiCreateRecord('vendor');
        var vendor_name = 'Tax Agency ' + region;
        try {
            newTaxAgency.setFieldValue('entityid', vendor_name);
            nlapiSubmitRecord(newTaxAgency, true);
        } catch (e) {
            nlapiLogExecution('DEBUG', 'create tax agency err', e);
        }
    }

    function getTaxAgency(region) {
        var agency_id;
        var agency;
        var vendor_name = 'Tax Agency ' + region;
        nlapiLogExecution('DEBUG', 'vendor_name', vendor_name);
        try {
            agency = nlapiSearchRecord('vendor', null, [new nlobjSearchFilter('entityid', null, 'startswith', vendor_name), new nlobjSearchFilter('currency', null, 'is', 'USD')], null);
            if (!agency && agency.length === 0) {
                agency = createTaxAgency(region);
            }
        } catch (e) {
            nlapiLogExecution('DEBUG', 'agency err', e);
        }

        if (agency && agency.length) {
            if (agency.length > 1) {
                agency_id = '';
                for (var a = 0; a < agency.length; a++) {
                    nlapiLogExecution('DEBUG', JSON.stringify(agency[a]));

                    var thisRecord = nlapiLoadRecord('vendor', agency[a].id);
                    //   var currency = thisRecord.getFieldValue('currency');

                    //   var currencyObj = nlapiLoadRecord('currency', currency);
                    //   var currencyName = currencyObj.getFieldValue('name');
                    //   nlapiLogExecution('DEBUG', currencyName);
                    //   if (currencyName == 'USD') {
                    // agency_id = agency[a].getId();
                    //   }
                }
                nlapiCreateError(
                    'MULTIPLE_AGENCIES',
                    'Multiple tax agencies found with the provided data'
                );
            } else if (agency.length < 1) {
                agency_id = '';
                nlapiLogExecution('DEBUG', 'second');
                nlapiCreateError(
                    'AGENCY_NOT_FOUND',
                    'No tax agencies found with the provided data'
                );
            } else {
                agency_id = agency[0].getId();
                nlapiLogExecution('DEBUG', 'agency_id', agency_id);
            }
        } else {
            nlapiLogExecution('DEBUG', 'agency not found');
        }

        return agency_id;
    }

    function checkExisting(codeObj) {
        var exists = false;
        var TaxTypes = nlapiSearchRecord(
            'salestaxitem',
            null,
            [
                new nlobjSearchFilter('itemid', null, 'contains', codeObj.tax_code_name)
            ],
            null
        );

        if (TaxTypes && TaxTypes.length && TaxTypes.length > 0) {
            exists = true;
        }

        return exists;
    }

    function getTaxAccount(state) {
        var account_id = '';

        try {
            var account_name = 'Sales Taxes Payable ' + state;
            var account = nlapiSearchRecord(
                'account',
                null,
                new nlobjSearchFilter('name', null, 'is', account_name),
                null
            );
            nlapiLogExecution('DEBUG', 'account.length', account.length);
        } catch (e) {
            nlapiLogExecution('DEBUG', 'account err', JSON.stringify(e));
        }

        if (account !== null && account.length > 1) {
            account_id = '';
            nlapiCreateError(
                'MULTIPLE_ACCOUNTS',
                'Multiple tax accounts found with the provided data'
            );
        } else if (account == null) {
            account_id = '';
            nlapiCreateError(
                'ACCOUNT_NOT_FOUND',
                'No tax accounts found with the provided data'
            );
        } else {
            account_id = account[0].getId();
            nlapiLogExecution('DEBUG', 'account_id', account_id);
        }

        return account_id;
    }

    var country = 'US';

    // Country
    for (var i = 0; i < countryList.length; i++) {
        nlapiLogExecution(
            'DEBUG',
            '--------------------',
            nlapiGetContext().getRemainingUsage()
        );

        var newTaxObj = {
            tax_code_name: 'TWE_' + countryList[i],
            tax_rate: '0.00'
        };

        if (!checkExisting(newTaxObj)) {
            newTaxObj.tax_agency = getTaxAgency(countryList[i]);
            newTaxObj.tax_account = getTaxAccount(stateList[i]);

            var newTaxCode = nlapiCreateRecord('salestaxitem', {
                nexuscountry: countryList[i]
            });

            try {
                newTaxCode.setFieldValue('itemid', newTaxObj.tax_code_name);
                newTaxCode.setFieldValue('displayname', newTaxObj.tax_code_name);
                newTaxCode.setFieldValue('rate', newTaxObj.tax_rate);
                newTaxCode.setFieldValue('taxagency', newTaxObj.tax_agency);
                newTaxCode.setFieldValue('taxaccount', newTaxObj.tax_account);
                newTaxCode.setFieldValue('includechildren', 'T');
                nlapiSubmitRecord(newTaxCode, true);
                nlapiLogExecution(
                    'DEBUG',
                    'TaxCode Created',
                    JSON.stringify(newTaxObj)
                );
            } catch (err) {
                nlapiLogExecution('DEBUG', 'err TAX_CODES', err);
            }
        } else {
            nlapiLogExecution('DEBUG', 'TaxCode Already Exists', stateList[i]);
        }
    }

    // State
    for (var k = 0; k < stateList.length; k++) {
        nlapiLogExecution(
            'DEBUG',
            '--------------------',
            nlapiGetContext().getRemainingUsage()
        );

        var newTaxObj2 = {
            tax_code_name: 'TWE_' + stateList[k],
            tax_rate: '0.00',
            state: stateList[k]
        };

        if (!checkExisting(newTaxObj)) {
            newTaxObj.tax_agency = getTaxAgency(stateList[k]);
            newTaxObj.tax_account = getTaxAccount(stateList[k]);

            var newTaxCode2 = nlapiCreateRecord('salestaxitem', {
                nexuscountry: 'US'
            });

            try {
                newTaxCode2.setFieldValue('itemid', newTaxObj2.tax_code_name);
                newTaxCode2.setFieldValue('displayname', newTaxObj2.tax_code_name);
                newTaxCode2.setFieldValue('rate', newTaxObj2.tax_rate);
                newTaxCode2.setFieldValue('state', newTaxObj2.state);
                newTaxCode2.setFieldValue('taxagency', newTaxObj2.tax_agency);
                newTaxCode2.setFieldValue('taxaccount', newTaxObj2.tax_account);
                newTaxCode2.setFieldValue('includechildren', 'T');
                nlapiSubmitRecord(newTaxCode2, true);
                nlapiLogExecution(
                    'DEBUG',
                    'TaxCode Created',
                    JSON.stringify(newTaxObj2)
                );
            } catch (err) {
                nlapiLogExecution('DEBUG', 'err TAX_CODES', JSON.stringify(err));
            }
        } else {
            nlapiLogExecution('DEBUG', 'TaxCode Already Exists', stateList[k]);
        }
    }
}

/**
 * Entry point of install script - makes calls to all necessary methods
 */
function beforeInstall() {
    nlapiLogExecution('DEBUG', 'Installing Bundle.');
    createNexuses();
    createTaxCodes();
}

function beforeUpdate() {
    nlapiLogExecution('DEBUG', 'Updating Bundle.');
    createNexuses();
    createTaxCodes();
}
