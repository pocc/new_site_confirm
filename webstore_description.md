# New Site Confirm

Malicious websites serve their payload on their own domains. 
An easy way to block this is to confirm that you want to visit domains you haven't visited before. 

          / --------------------------|||
       < url you came from|||
          \ --------------------------|||
                                          |||-------------------------------------------------\
                                          ||| url you're going to w js disabled>
                                          |||-------------------------------------------------/
                                          |||----------------------------\
                                          ||| url you're going to >
                                          |||----------------------------/
                                          |||
                                          |||
                                          |||

Examples of deceptive websites:

* g0ogle.com, using a 0 instead of an 0
* 🇬oogle.com, which uses a regional indicator 🇬 (U+1F1EC)

If you click on an email or copy and paste a link, you might not realize that it's slightly different than the website you want. This extension gives you time on an extension page to choose whether you want to load this URL on a new domain. 

## Technical Details

* Blocks webrequests to URLs that do not exist in the browser's history or cookie store
* Uses the https://publicsuffix.org/list/ to determine domain

## Privacy

This chrome extension does not collect any data.
It does not have the permission to read or modify the contents of pages.
It will access the Public Service List and the Domain Block List.

## Future
* [ ] GUI improvement so that it looks like a waypoint
* [ ] Block javascript on target page
* [ ] Large warning signs if url is on the BDL
* [ ] I'd like to use tabActive instead of tabs, but it looks difficult per my use case https://stackoverflow.com/questions/69457809/how-do-you-get-the-url-with-activetab-inside-of-a-webrequest-callback-fn

Copyright (C) 2021-2021 Ross Jacobs - All Rights Reserved