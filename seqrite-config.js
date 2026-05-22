
// seqrite-config.js
let userLang = (navigator.language || navigator.userLanguage || 'en').split('-')[0];
console.log("Browser Language Code: ", userLang);

function parseConfigPayload(payload) {
    let parsed = payload;

    while (typeof parsed === 'string') {
        try {
            parsed = JSON.parse(parsed);
        } catch (error) {
            const sanitized = parsed.replace(/(^|[\r\n])\s*"?lang"?\s*:\s*userLang\s*,?\s*(?=[\r\n])/g, '$1');
            parsed = JSON.parse(sanitized);
        }
    }

    const wrapperKeys = ['response', 'data', 'config', 'result'];
    for (const key of wrapperKeys) {
        if (parsed && typeof parsed === 'object' && parsed[key]) {
            return parseConfigPayload(parsed[key]);
        }
    }

    return parsed;
}

function normalizeKlaroConfig(config) {
    if (!config || typeof config !== 'object') {
        throw new Error('Seqrite config API did not return a valid object.');
    }

    if (!Array.isArray(config.services) && Array.isArray(config.apps)) {
        config.services = config.apps;
    }

    if (!Array.isArray(config.services)) {
        console.warn(
            'Seqrite config is missing a services array. Falling back to category-level services.',
            config
        );
        config.services = [
            { name: 'marketing', purposes: ['marketing'], default: true },
            { name: 'others', purposes: ['others'], default: true },
            { name: 'functional', purposes: ['functional'], default: true }
        ];
    }

    return config;
}

async function initializeCookieConsent() {
    try {

        // Retrieve the token from local storage using your key 'token'
        const myToken = 'eyJhbGciOiJIUzM4NCJ9.eyJzdWIiOiJkZXZvcEB5b3BtYWlsLmNvbSIsImlhdCI6MTc3OTQzOTI2NSwiZXhwIjoxNzc5NDc1MjY1fQ.hsO4SOlmeGfTSUAC0PPepgt7DKGM1iI02zDVn6ygd8HGSyUG_rN--BYMcVw3objC';
        console.log('myToken:', myToken);
        const myConsentId = '6a1016f994045f7aaa5aa72e'; 
        if (!myToken) {
          console.warn("No token found in local storage. Configuration fetch may fail.");
        }

        // Fetch the configuration from your API 
        const apiUrl = new URL('http://localhost:8080/cookie/v1/fetchStoredCookieConfig');
        apiUrl.searchParams.append('consentId', myConsentId);

        const response = await fetch(apiUrl, {
            method: 'GET', 
            headers: {
                'Authorization': `Bearer ${myToken}`,
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            throw new Error(`Config fetch failed with HTTP ${response.status}`);
        }

        const configString = await response.text();
        
        // Parse the stringified JSON
        const configObject = normalizeKlaroConfig(parseConfigPayload(configString));
        
        // Inject the client-side user language just like the original script did
        configObject.lang = userLang;
        
        // Assign the object to window.klaroConfig globally
        window.klaroConfig = configObject;
        
        // Dynamically load seqrite.js so it executes AFTER the config is set
        const seqriteScript = document.createElement('script');
        seqriteScript.type = 'application/javascript';
        seqriteScript.dataset.klaroConfig = 'klaroConfig';
        seqriteScript.src = 'seqrite.js';
        
        // Ensure seqrite-enforcement.js loads AFTER seqrite.js finishes executing
        seqriteScript.onload = () => {
            const enforcementScript = document.createElement('script');
            enforcementScript.defer = true;
            enforcementScript.src = 'seqrite-enforcement.js';
            document.head.appendChild(enforcementScript);
        };
        
        // Append the first dynamic script to kick off the chain
        document.head.appendChild(seqriteScript);

    } catch (error) {
        console.error('Failed to load Seqrite Cookie Consent Configuration:', error);
    }
}

// Execute the initialization
initializeCookieConsent();
