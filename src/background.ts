/* Background script. */
const browser = chrome;
let PUBLIC_SUFFIX_LIST = Object();
let EXTN_CACHE = {'history':[] as chrome.history.HistoryItem[], 'cookies': [] as chrome.cookies.Cookie[]}
let INTERCEPTED_URLS: string[] = [];
let ACTIVE_URL = '';
const EXTN_URL = chrome.runtime.getURL('')
const ONE_WEEK = 604800 * 1000
const formatLog = (requestID: string, msg: string, data: any) => {
    console.log(`Waypost|${new Date().getTime()}|${requestID}|${msg}: `, data)
}

// Don't need tab of update because we need to query tabs for url anyway
chrome.tabs.onActivated.addListener((_activeInfo)=> {
    console.log("Tab activated", _activeInfo)
    chrome.tabs.query({active: true}, (tabs) => {
        ACTIVE_URL = tabs[0].url || tabs[0].pendingUrl || ACTIVE_URL;  // If url isn't available, page is still loading
    });
});

chrome.tabs.onUpdated.addListener((_tabID, _changeInfo, tab) => {
    console.log("Tab updated", _tabID, _changeInfo, tab)
    ACTIVE_URL = tab.url || ACTIVE_URL;
});

function cacheHistoryAndCookies() {
    const allResultsQuery = {text:'', maxResults:0} 
    browser.history.search(allResultsQuery, (visits) => EXTN_CACHE['history'] = visits); 
    browser.cookies.getAll({}, (cookies) => EXTN_CACHE['cookies'] = cookies); 
}

async function setPublicSuffixList() {
    const PUBLIC_SUFFIX_URL = 'https://publicsuffix.org/list/public_suffix_list.dat'
    const resp = await fetch(PUBLIC_SUFFIX_URL)
    const resptext = await resp.text()
    const public_suffixes = [...resptext.matchAll(/\n[^\n\/](.*)/g)].map((i) => i[1])
    return public_suffixes
}

cacheHistoryAndCookies()
setInterval(cacheHistoryAndCookies, ONE_WEEK);

browser.runtime.onInstalled.addListener(async () => {
    PUBLIC_SUFFIX_LIST = await setPublicSuffixList(); // Only check PSL on install
    formatLog('0', `Loaded PSL with # entries of`, PUBLIC_SUFFIX_LIST.length);
    formatLog('0', 'Waypost extension has been installed at', EXTN_URL);
});

// Remove subdomains, protocol, searches, and hashes from domain, 'https://blog.github.com?search=true' => 'github.com'
function getBaseDomain(url: string): string {
    const hostname = (new URL(url)).hostname
    const parts = hostname.split('.')
    let rightside = parts.pop() as string;
    let publicSuffix;
    // Be as greedy as possible when it comes to possible effective TLDs.
    for (const part of parts.reverse()) {
        publicSuffix = rightside
        rightside = `${part}.${rightside}`
        if (!PUBLIC_SUFFIX_LIST.includes(rightside)) { // If the parsed domain from the right is no longer in PSL
            const re = new RegExp(`(.*)\.${publicSuffix}$`, 'g');
            let registeredDomain = (re.exec(hostname) as string[])[1]; 
            // remove subdomains
            if (registeredDomain.includes('.')) registeredDomain = registeredDomain.split('.').reverse()[0]
            return  registeredDomain + '.' + publicSuffix
        }
    }
    console.log("Unknown url pattern", hostname)
    return url
}

// If initiator is a trusted initiator domains (search engine or news aggregator), ignore
function isInitiatorTrusted(initiator: string | undefined) {
    if (!initiator) return false
    const trustedTLDs = ['edu', 'gov']
    const tldRe = RegExp(`\.${trustedTLDs}$`, 'g')
    const searchEngines = ['google.com', 'bing.com', 'yahoo.com', 'duckduckgo.com'];
    const moderatedAggregators = ['reddit.com', 'news.google.com', 'news.ycombinator.com', 'slashdot.com']
    const trustedInitiators = [...searchEngines, ...moderatedAggregators]
    for (const trustedInitiator of trustedInitiators) {
        if (new URL(initiator).origin.includes(trustedInitiator) || initiator.match(tldRe)) {
            return true;
        }
    }
    return false;
}

/* Intercept requests for URLs being accessed in the address bar
so that this extension can query URLs as fast possible */
browser.webRequest.onBeforeRequest.addListener(
    (webRequest) => {
        let sourceURL = 'unknown';
        if (webRequest.initiator) {
            const sameOriginRequest = webRequest.url.includes(getBaseDomain(webRequest.initiator))
            if (INTERCEPTED_URLS.includes(webRequest.initiator) || sameOriginRequest) return {cancel: false};
            INTERCEPTED_URLS.push(webRequest.initiator); // Trigger per domain request, not per request
            if (ACTIVE_URL.includes(webRequest.initiator)) sourceURL = ACTIVE_URL 
        }
        const msg = `${EXTN_URL}: Intercepted web request from "${webRequest.initiator}" for "${webRequest.url}"`
        formatLog(webRequest.requestId, msg, webRequest);
        const baseDomain = getBaseDomain(webRequest.url);
        const visits = EXTN_CACHE['history'].filter((v) => (v.url as string).includes(baseDomain))
        const cookies = EXTN_CACHE['cookies'].filter((v) => (v.domain as string).includes(baseDomain))
        console.log(`Received history/cookies: for base domain ${baseDomain}:`, visits, cookies)
        const viaSearchEngineOrAggregator = isInitiatorTrusted(webRequest.initiator)
        if (visits.length === 0 && cookies.length === 0 && !viaSearchEngineOrAggregator) {
            const extn_redirect_url = `${EXTN_URL}/blocked.html?initiator=${sourceURL}&domain=${baseDomain}&requestURL=${webRequest.url}`
            browser.tabs.update(webRequest.tabId, { url: extn_redirect_url });
            formatLog(webRequest.requestId, 'Blocking this request', webRequest);
            return {cancel: true} as any;
        }
        browser.history.addUrl({url: webRequest.url})  // Add url to history so they don't get prompted again
        return {cancel: false} as any;    
    },
    {
        urls: ["http://*/*", "https://*/*"],
        types: ['main_frame']
    },
    ['blocking']
);