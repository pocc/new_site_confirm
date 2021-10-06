# Waypost Chrome Extension

Confirm when going to a domain not in your history or cookies.

## Bugs

* [ ] Fix problem with redirect to gmail.com not going to google.mail.com
    * [ ] Expected behavior is to follow redirects. Check redirects.
* [ ] If you go to a website you continued to, hitting back should take you to the initiator

## Features

* [ ] Waypoint page needs GUI improvement to look like a waypoint:
        / -------------------------|||
       < https:// url you came from|||
        \ -------------------------|||
                                   |||-----------------------------------------\
                                   |||https:// url you're going to w js disabled>
                                   |||-----------------------------------------/
                                   |||----------------------------\
                                   |||https:// url you're going to >
                                   |||----------------------------/
                                   |||
                                   |||
                                   |||
                                   |||
                                   |||
                                   |||

* [ ] Large warning signs if it's on the BDL
    * Note should be "You should only proceed if you own this website or are a security researcher."

## Notes for myself

* All cookies and all history have been tested, and this extension picks up on new and old entries

urlhaus.abuse.ch is a malware aggregator, you can browse malware here: https://urlhaus.abuse.ch/browse/
* fetch https://urlhaus.abuse.ch/downloads/text/ on install
* fetch https://urlhaus.abuse.ch/downloads/text_recent/ every 5m

### URL with unknown initiator

chrome-extension://bmcjopanneifoejncfeeocmdoijimhcj/blocked.html?initiator=unknown&domain=news24.com&requestURL=https://www.news24.com/news24/southafrica/news/i-couldnt-believe-it-university-of-pretoria-student-submits-masters-thesis-gets-phd-instead-20211002

### URL with known initiator

chrome-extension://bmcjopanneifoejncfeeocmdoijimhcj/blocked.html?initiator=https://support.cloudflare.com/hc/en-us/articles/203118044-Gathering-information-to-troubleshoot-site-issues&domain=cloudflarestatus.com&requestURL=https://www.cloudflarestatus.com/
