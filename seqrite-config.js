
// seqrite-config.js
let userLang = (navigator.language || navigator.userLanguage || 'en').split('-')[0];
console.log("Browser Language Code: ", userLang);

async function initializeCookieConsent() {
    try {

        // Retrieve the token from local storage using your key 'token'
        const myToken = localStorage.getItem('token');
        const myConsentId = '12345'; 
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

        const configString = await response.text();
        
        // Parse the stringified JSON
        const configObject = JSON.parse(configString);
        
        // Inject the client-side user language just like the original script did
        configObject.lang = userLang;
        
        // Assign the object to window.klaroConfig globally
        window.klaroConfig = configObject;
        
        // Dynamically load seqrite.js so it executes AFTER the config is set
        const seqriteScript = document.createElement('script');
        seqriteScript.type = 'application/javascript';
        seqriteScript.dataset.config = 'seqriteConfig';
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

showCookie();