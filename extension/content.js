// Content script that runs on all pages
// This can be used for additional functionality if needed

// Listen for messages from popup or background script
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'getPageInfo') {
        const pageInfo = {
            url: window.location.href,
            title: document.title,
            text: extractText()
        };
        sendResponse(pageInfo);
    }
});

function extractText() {
    // Create a clone to avoid modifying the original document
    const clone = document.cloneNode(true);
    
    // Remove unwanted elements
    const unwantedSelectors = [
        'script', 'style', 'nav', 'header', 'footer', 'aside',
        '.ad', '.advertisement', '.sidebar', '.menu', '.navigation'
    ];
    
    unwantedSelectors.forEach(selector => {
        clone.querySelectorAll(selector).forEach(el => el.remove());
    });
    
    // Try to get main content
    const mainSelectors = ['main', 'article', '[role="main"]', '.content', '#content'];
    let textContent = '';
    
    for (const selector of mainSelectors) {
        const element = clone.querySelector(selector);
        if (element) {
            textContent = element.innerText || element.textContent;
            break;
        }
    }
    
    // Fallback to body if no main content found
    if (!textContent) {
        const body = clone.body;
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