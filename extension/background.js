// background.js

chrome.runtime.onInstalled.addListener(() => {
    console.log('Extension installed.');
});

// Run on tab update (new page load)
chrome.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
    if (changeInfo.status === 'complete' && tab.active && tab.url.startsWith('http')) {
        try {
            const token = await getGoogleAuthToken();
            if (!token) return;

            // Inject script to extract page text
            const [{ result: extractedText }] = await chrome.scripting.executeScript({
                target: { tabId },
                func: extractPageText
            });

            const exists = await urlExists(tab.url, token);
            if (!exists) {
                await saveToDatabase(tab.url, extractedText, token);
            }
        } catch (error) {
            console.error('Error in background:', error.message);
        }
    }
});

function extractPageText() {
    const tempDoc = document.cloneNode(true);
    tempDoc.querySelectorAll('script, style, nav, header, footer, aside, [class*="ad"], [class*="advertisement"], [class*="sidebar"]').forEach(el => el.remove());

    let textContent = '';
    const mainSelectors = ['main', 'article', '[role="main"]', '.content', '#content'];
    for (const selector of mainSelectors) {
        const el = tempDoc.querySelector(selector);
        if (el) {
            textContent = el.innerText || el.textContent;
            break;
        }
    }

    if (!textContent) {
        const body = tempDoc.body;
        if (body) textContent = body.innerText || body.textContent;
    }

    return textContent.replace(/\s+/g, ' ').replace(/\n\s*\n/g, '\n\n').trim();
}

async function getGoogleAuthToken() {
    return new Promise(resolve => {
        chrome.identity.getAuthToken({ interactive: false }, token => {
            if (chrome.runtime.lastError) {
                console.error('Auth error:', chrome.runtime.lastError.message);
                return resolve(null);
            }
            resolve(token);
        });
    });
}

async function urlExists(url, token) {
    const res = await fetch(`http://localhost:8000/api/check-url?url=${encodeURIComponent(url)}`, {
        headers: {
            'Authorization': `Bearer ${token}`
        }
    });

    const data = await res.json();
    return data.exists;
}

async function saveToDatabase(url, text, token) {
    await fetch('http://localhost:8000/api/store-text', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ url, text })
    });
}
