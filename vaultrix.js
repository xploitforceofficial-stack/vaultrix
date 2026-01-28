// VAULTRIX Web Protection System
// Client-Side Access Control

const VAULTRIX = (function() {
    // Configuration - Hardcoded token system
    const CONFIG = {
        TOKEN_SECRET: 'VAULTRIX_2024_SECURE_ACCESS',
        TOKEN_EXPIRY_HOURS: 24,
        SCRIPT_CONTENT: `-- VAULTRIX Protected Script Loader
-- Do not redistribute
-- Session ID: ${Date.now().toString(36).toUpperCase()}

local VAULTRIX = {
    _version = "1.0.0",
    _session = "${Date.now().toString(36).toUpperCase()}",
    _integrity = "VERIFIED"
}

function validateSession()
    -- Session validation logic
    local isValid = true
    -- Add your validation logic here
    return isValid
end

if validateSession() then
    -- Your script content goes here
    print("VAULTRIX: Script loaded successfully")
    -- Example Roblox script content
    game:GetService("Players").LocalPlayer:Kick("Example protected script")
else
    warn("VAULTRIX: Session validation failed")
end

-- End of VAULTRIX protected script`,
        USER_AGENT_KEY: 'userAgentHash'
    };

    // Helper functions
    function simpleHash(str) {
        let hash = 0;
        for (let i = 0; i < str.length; i++) {
            const char = str.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash;
        }
        return Math.abs(hash).toString(36);
    }

    function encodeToken(data) {
        const jsonStr = JSON.stringify(data);
        return btoa(unescape(encodeURIComponent(jsonStr)));
    }

    function decodeToken(token) {
        try {
            const jsonStr = decodeURIComponent(escape(atob(token)));
            return JSON.parse(jsonStr);
        } catch (e) {
            return null;
        }
    }

    // Generate access token for current session
    function generateAccessToken() {
        const userAgentHash = simpleHash(navigator.userAgent);
        const timestamp = Date.now();
        const expiry = timestamp + (CONFIG.TOKEN_EXPIRY_HOURS * 60 * 60 * 1000);
        
        const tokenData = {
            ua: userAgentHash,
            ts: timestamp,
            exp: expiry,
            ref: simpleHash(timestamp + CONFIG.TOKEN_SECRET)
        };
        
        localStorage.setItem(CONFIG.USER_AGENT_KEY, userAgentHash);
        return encodeToken(tokenData);
    }

    // Validate token from URL
    function validateToken(token) {
        const tokenData = decodeToken(token);
        if (!tokenData) return false;

        // Check expiry
        const now = Date.now();
        if (now > tokenData.exp) {
            console.warn('VAULTRIX: Token expired');
            return false;
        }

        // Check user agent
        const storedUA = localStorage.getItem(CONFIG.USER_AGENT_KEY);
        const currentUAHash = simpleHash(navigator.userAgent);
        
        if (tokenData.ua !== storedUA || tokenData.ua !== currentUAHash) {
            console.warn('VAULTRIX: User agent mismatch');
            return false;
        }

        // Verify checksum
        const expectedRef = simpleHash(tokenData.ts + CONFIG.TOKEN_SECRET);
        if (tokenData.ref !== expectedRef) {
            console.warn('VAULTRIX: Invalid checksum');
            return false;
        }

        return true;
    }

    // Gateway validation process
    function validateAccess() {
        const urlParams = new URLSearchParams(window.location.search);
        const token = urlParams.get('token');
        
        if (!token) {
            setTimeout(() => window.location.href = 'denied.html', 1000);
            return;
        }

        // Simulate validation steps with progress
        const steps = document.querySelectorAll('.step');
        const progressFill = document.getElementById('progressFill');
        const progressPercentage = document.getElementById('progressPercentage');
        const message = document.getElementById('validationMessage');
        
        let progress = 0;
        const stepDelay = 800;

        function updateProgress(step, status, text) {
            steps[step].querySelector('.step-status').textContent = status;
            message.textContent = text;
            progress = (step + 1) * 25;
            progressFill.style.width = `${progress}%`;
            progressPercentage.textContent = `${progress}%`;
        }

        // Step 1: Token Authentication
        setTimeout(() => {
            updateProgress(0, '✅', 'Token format verified');
        }, stepDelay);

        // Step 2: Time Validation
        setTimeout(() => {
            const tokenData = decodeToken(token);
            if (tokenData && Date.now() < tokenData.exp) {
                updateProgress(1, '✅', 'Time validation successful');
            } else {
                updateProgress(1, '❌', 'Token expired');
                setTimeout(() => window.location.href = 'denied.html', 1000);
                return;
            }
        }, stepDelay * 2);

        // Step 3: Session Integrity
        setTimeout(() => {
            updateProgress(2, '✅', 'Session integrity confirmed');
        }, stepDelay * 3);

        // Step 4: Checksum Verification
        setTimeout(() => {
            if (validateToken(token)) {
                updateProgress(3, '✅', 'All checks passed');
                message.textContent = 'Access granted. Redirecting to secure vault...';
                progressFill.style.width = '100%';
                progressPercentage.textContent = '100%';
                
                // Store session validation flag
                sessionStorage.setItem('VAULTRIX_VALIDATED', 'true');
                sessionStorage.setItem('VAULTRIX_TOKEN', token);
                
                setTimeout(() => {
                    window.location.href = 'vault.html';
                }, 1500);
            } else {
                updateProgress(3, '❌', 'Validation failed');
                message.textContent = 'Access denied. Redirecting...';
                setTimeout(() => window.location.href = 'denied.html', 1500);
            }
        }, stepDelay * 4);
    }

    // Initialize vault page
    function initializeVault() {
        // Check if user came from valid gateway session
        const isValidated = sessionStorage.getItem('VAULTRIX_VALIDATED');
        const token = sessionStorage.getItem('VAULTRIX_TOKEN');
        
        if (!isValidated || !validateToken(token)) {
            window.location.href = 'denied.html';
            return;
        }

        // Display session info
        const tokenData = decodeToken(token);
        if (tokenData) {
            const sessionId = tokenData.ts.toString(36).toUpperCase();
            document.getElementById('sessionId').textContent = sessionId;
            
            // Calculate expiry time
            const expiryTime = new Date(tokenData.exp);
            updateExpiryTimer(expiryTime);
        }

        // Inject script content
        const scriptDisplay = document.getElementById('scriptDisplay');
        scriptDisplay.textContent = CONFIG.SCRIPT_CONTENT;

        // Setup copy functionality
        document.getElementById('copyLoader').addEventListener('click', function() {
            navigator.clipboard.writeText(CONFIG.SCRIPT_CONTENT).then(() => {
                const status = document.getElementById('copyStatus');
                status.textContent = '✓ Script loader copied to clipboard';
                status.style.color = 'var(--success)';
                
                setTimeout(() => {
                    status.textContent = '';
                }, 3000);
            }).catch(err => {
                console.error('VAULTRIX: Failed to copy:', err);
            });
        });

        // Clear validation on page unload
        window.addEventListener('beforeunload', () => {
            sessionStorage.removeItem('VAULTRIX_VALIDATED');
        });
    }

    function updateExpiryTimer(expiryDate) {
        function update() {
            const now = new Date();
            const diff = expiryDate - now;
            
            if (diff <= 0) {
                document.getElementById('expiryTimer').textContent = 'EXPIRED';
                sessionStorage.removeItem('VAULTRIX_VALIDATED');
                setTimeout(() => window.location.href = 'denied.html', 2000);
                return;
            }
            
            const hours = Math.floor(diff / (1000 * 60 * 60));
            const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
            
            document.getElementById('expiryTimer').textContent = 
                `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
        }
        
        update();
        setInterval(update, 60000); // Update every minute
    }

    // Public API
    return {
        generateAccessToken,
        validateAccess,
        initializeVault,
        validateToken
    };
})();

// Auto-protection for direct access attempts
if (window.location.pathname.includes('vault.html')) {
    const isValidated = sessionStorage.getItem('VAULTRIX_VALIDATED');
    if (!isValidated) {
        window.location.href = 'denied.html';
    }
}

if (window.location.pathname.includes('gateway.html')) {
    const urlParams = new URLSearchParams(window.location.search);
    if (!urlParams.get('token')) {
        window.location.href = 'landing.html';
    }
}
