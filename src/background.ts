/* Background script:
*/
let PUBLIC_SUFFIX_LIST = Object();
let EXTN_CACHE = {'history':[] as chrome.history.HistoryItem[], 'cookies': [] as chrome.cookies.Cookie[]}
const formatLog = (requestID: string, msg: string, data: any) => console.log(`FDE|${new Date().getTime()}|${requestID}|${msg}: `, data)
// Save history and cookies every minute
// Running it this way because it's not possible
function setData() {
    chrome.history.search({text: ''}, (visits) => EXTN_CACHE['history'] = visits); 
    chrome.cookies.getAll({}, (cookies) => EXTN_CACHE['cookies'] = cookies); 
}

async function setPublicSuffixList() {
    const PUBLIC_SUFFIX_URL = 'https://publicsuffix.org/list/public_suffix_list.dat'
    const resp = await fetch(PUBLIC_SUFFIX_URL)
    const resptext = await resp.text()
    const public_suffixes = [...resptext.matchAll(/\n[^\n\/](.*)/g)].map((i) => i[1])
    return public_suffixes
}

setData()
setInterval(setData, 60000);

chrome.runtime.onInstalled.addListener(async () => {
    PUBLIC_SUFFIX_LIST = await setPublicSuffixList(); // Only check on install
    const PSL_snapshot = `[${PUBLIC_SUFFIX_LIST.slice(0,20).join(', ')}, ...]`
    formatLog('0', `Loaded PSL ${PSL_snapshot}, with # entries of`, PUBLIC_SUFFIX_LIST.length);
    formatLog('0', 'Find Discussions extension has been installed at', chrome.runtime.getURL(''));
});

// Remove subdomains, protocol, searches, and hashes from domain, 'https://blog.github.com?search=true' => 'github.com'
function getBaseDomain(url: string): string {
    const hostname = (new URL(url)).hostname
    const parts = hostname.split('.')
    let rightside = parts.pop() as string;
    // Be as greedy as possible when it comes to possible effective TLDs.
    for (const part of parts.reverse()) {
        rightside = `${part}.${rightside}`
        if (!PUBLIC_SUFFIX_LIST.includes(rightside)) {
            const public_suffix = rightside.split('.')[1]
            let registeredDomain = hostname.split('.'+public_suffix)[0]
            const registeredDomainHasSubdomains = registeredDomain.includes('.')
            if (registeredDomainHasSubdomains) { // remove subdomains, registered domain should be one word
                registeredDomain = registeredDomain.split('.').reverse()[0]
            }
            return  registeredDomain + '.' + public_suffix
        }
    }
    console.log("Unknown url pattern", rightside)
    return url
}

// If initiator is a trusted initiator domains (search engine or news aggregator), ignore
function isInitiatorTrusted(initiator: string | undefined) {
    if (!initiator) return false
    const searchEngines = ['google.com', 'bing.com', 'yahoo.com', 'duckduckgo.com'];
    const moderatedAggregators = ['reddit.com', 'news.google.com', 'news.ycombinator.com', 'slashdot.com']
    const initiatorBaseDomain = getBaseDomain(initiator);
    for (const searchEngine of [...searchEngines, ...moderatedAggregators]) {
        if (initiatorBaseDomain.includes(searchEngine)) {
            return true;
        }
    }
    return false;
}

/* Intercept requests for URLs being accessed in the address bar
so that this extension can query URLs as fast possible */
chrome.webRequest.onBeforeRequest.addListener(
    (webRequest) => {
        const msg = `${chrome.runtime.getURL('')}: Intercepted web request from "${webRequest.initiator}" for "${webRequest.url}"`
        formatLog(webRequest.requestId, msg, webRequest);
        const baseDomain = getBaseDomain(webRequest.url)
        console.log(`baseDomain:'${baseDomain}'`)
        if (baseDomain === "facebook.com") {
            return {cancel: true}
        }
        const visits = EXTN_CACHE['history'].filter((v) => (v.url as string).includes(baseDomain))
        console.log(EXTN_CACHE['cookies'])
        const cookies = EXTN_CACHE['cookies'].filter((v) => (v.domain as string).includes(baseDomain))
        console.log("all visits", visits, cookies)
        const viaSearchEngineOrAggregator = isInitiatorTrusted(webRequest.initiator)
        if (visits.length === 0 && cookies.length === 0 && !viaSearchEngineOrAggregator) {
            const confirmed = window.confirm(`You haven't been to ${baseDomain} before. Do you want to proceed?`)
            if (!confirmed) {
                // Go back to safety of previous URL
                chrome.tabs.update(webRequest.tabId, { url: webRequest.initiator as string });
                return {cancel: true};
            }
        }
        return {cancel: false};    
    },
    {
        urls: ["http://*/*", "https://*/*"],
        types: ['main_frame']
    },
    ['blocking']
);
