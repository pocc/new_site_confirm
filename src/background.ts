/* Background script:

* [ ] Add TLD list here so you can check domains

*/
const formatLog = (requestID: string, msg: string, data: any) => console.log(`FDE|${new Date().getTime()}|${requestID}|${msg}: `, data) 
// Will get the domain from a url, https://n10.gov.uk => 'n10'
function getDomain(url: string): string {
    const hostname = (new URL(url)).origin
    const parts = hostname.split('.')
    let rightside = ''
    // Be as greedy as possible when it comes to possible effective TLDs.
    for (const part of parts) {
        rightside = `${part}.${rightside}`
        if (!hostname.includes(rightside)) {
            rightside = rightside.split('.')[1]
            const fullDomain = hostname.split('.'+rightside)[0]
            return fullDomain.split('.')[1] // remove subdomains
        } 
    }
    console.log("Unknown url pattern", rightside)
    return url
}

/* Intercept requests for URLs being accessed in the address bar
so that this extension can query URLs as fast possible */
chrome.webRequest.onBeforeRequest.addListener(
    (webRequest) => {
        // No feedback loops (don't react to requests made by this extension)
        const inspectingOwnTraffic = chrome.runtime.getURL('') === (webRequest.initiator || "") + "/"
        if (!inspectingOwnTraffic) {
            const msg = `${chrome.runtime.getURL('')}: Intercepted web request from "${webRequest.initiator}" for "${webRequest.url}"`
            formatLog(webRequest.requestId, msg, webRequest);
            const domain = getDomain(webRequest.url)
            chrome.history.getVisits({url: domain}, (visits) => {
                console.log("all visits", visits)
                // const linkVisits = visits.filter((i) => i.transition === "link");
                const viaSearchEngine = webRequest.initiator && (webRequest.initiator.includes('google.') || webRequest.initiator.includes('yahoo.') || webRequest.initiator.includes('bing.') || webRequest.initiator.includes('baidu.') || webRequest.initiator.includes('yandex.') || webRequest.initiator.includes('duckduckgo.'))
                if (visits.length === 0 && !viaSearchEngine) {
                    //const confirmed = window.confirm(`You haven't been to this domain, ${domain} before. Do you want to proceed?`)
                    //console.log(confirmed)
                }
            });
        }
    },
    {
        urls: ["http://*/*", "https://*/*"],
        types: ['main_frame']
    }
);
