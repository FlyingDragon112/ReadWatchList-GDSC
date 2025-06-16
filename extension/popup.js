document.addEventListener('DOMContentLoaded', async function() {
    const urlElement = document.getElementById('currentUrl');
    const textElement = document.getElementById('textContent');
    const statsElement = document.getElementById('textStats');
    const copyBtn = document.getElementById('copyBtn');
    
    // Add save button
    const saveBtn = document.createElement('button');
    saveBtn.textContent = 'Save to Database';
    saveBtn.className = 'copy-btn';
    saveBtn.style.marginLeft = '10px';
    saveBtn.id = 'saveBtn';
    saveBtn.style.display = 'none';
    
    let extractedText = '';
    let currentUrl = '';
    
    try {
        // Get the current active tab
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
        
        // Display the current URL
        currentUrl = tab.url;
        urlElement.textContent = currentUrl;
        
        // Execute script to extract text from the page
        const results = await chrome.scripting.executeScript({
            target: { tabId: tab.id },
            function: extractPageText
        });
        
        if (results && results[0] && results[0].result) {
            extractedText = results[0].result;
            
            if (extractedText.trim()) {
                textElement.textContent = extractedText;
                
                // Show statistics
                const wordCount = extractedText.trim().split(/\s+/).length;
                const charCount = extractedText.length;
                statsElement.textContent = `Words: ${wordCount} | Characters: ${charCount}`;
                
                // Show buttons
                copyBtn.style.display = 'inline-block';
                saveBtn.style.display = 'inline-block';
                copyBtn.parentNode.appendChild(saveBtn);
                
                // Add copy functionality
                copyBtn.addEventListener('click', function() {
                    navigator.clipboard.writeText(extractedText).then(function() {
                        copyBtn.textContent = 'Copied!';
                        setTimeout(function() {
                            copyBtn.textContent = 'Copy Text';
                        }, 2000);
                    });
                });
                
                // Add save functionality
                const token = await getGoogleAuthToken();
                if (!token) throw new Error('Please log in with Google first');
                const email = await getUserEmail(token);
                const exists = await urlExists(currentUrl, email, token);
                if (!exists) {
                    await saveToDatabase(currentUrl, extractedText, email, token);
                }                
            } else {
                textElement.textContent = 'No text content found on this page.';
                textElement.className = 'text-content error';
            }
        } else {
            textElement.textContent = 'Unable to extract text from this page.';
            textElement.className = 'text-content error';
        }
        
    } catch (error) {
        console.error('Error:', error);
        urlElement.textContent = 'Error loading URL';
        textElement.innerHTML = `<div class="error">Error: ${error.message}</div>`;
    }
});

// Function to save text to database
async function saveToDatabase(url, text, email, token) {
    try {
        const response = await fetch('http://localhost:8000/api/store-text', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ email, url, text })
        });

        if (!response.ok) {
            let errorMsg = 'Failed to save';
            try {
                const error = await response.json();
                errorMsg = error.detail || errorMsg;
            } catch (e) {}
            throw new Error(errorMsg);
        }
    } catch (error) {
        console.error('Save error:', error);
        alert(`Failed to save: ${error.message}`);
    }
}

// Helper to get user email from Google token
async function getUserEmail(token) {
    const resp = await fetch('https://openidconnect.googleapis.com/v1/userinfo', {
        headers: { Authorization: `Bearer ${token}` }
    });
    if (!resp.ok) throw new Error('Failed to get user info');
    const data = await resp.json();
    return data.email;
}

// Function to get Google Auth token
async function getGoogleAuthToken() {
    return new Promise((resolve, reject) => {
        chrome.identity.getAuthToken({ 
            interactive: true 
        }, function(token) {
            if (chrome.runtime.lastError) {
                console.error('Auth error:', chrome.runtime.lastError.message);
                alert('Please enable Google sign-in for this extension in Chrome settings');
                resolve(null);
            } else if (token) {
                console.log('Got auth token successfully');
                resolve(token);
            } else {
                console.error('No token received');
                resolve(null);
            }
        });
    });
}

// Function to be injected into the page to extract text
function extractPageText() {
    const tempDoc = document.cloneNode(true);
    
    // Remove unwanted elements
    tempDoc.querySelectorAll('script, style, nav, header, footer, aside, [class*="ad"], [class*="advertisement"], [class*="sidebar"]').forEach(el => el.remove());
    
    // Try to get main content areas first
    let textContent = '';
    const mainSelectors = ['main', 'article', '[role="main"]', '.content', '#content', '.post', '.entry'];
    
    for (const selector of mainSelectors) {
        const mainElement = tempDoc.querySelector(selector);
        if (mainElement) {
            textContent = mainElement.innerText || mainElement.textContent;
            break;
        }
    }
    
    // If no main content found, get body text
    if (!textContent) {
        const body = tempDoc.body || tempDoc.querySelector('body');
        if (body) {
            textContent = body.innerText || body.textContent;
        }
    }
    
    // Clean up the text
    return textContent
        .replace(/\s+/g, ' ')
        .replace(/\n\s*\n/g, '\n\n')
        .trim();
}
async function urlExists(url, email, token) {
    const response = await fetch(`http://localhost:8000/api/check-url?email=${encodeURIComponent(email)}&url=${encodeURIComponent(url)}`, {
        method: 'GET',
        headers: {
            'Authorization': `Bearer ${token}`
        }
    });

    if (!response.ok) {
        throw new Error('Failed to check if URL exists');
    }

    const data = await response.json();
    return data.exists;
}