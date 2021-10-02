# This script will get a list of the suffixes from the public suffix list
import json
import re
import requests
import socket

PUBLIC_SUFFIX_URL = 'https://publicsuffix.org/list/public_suffix_list.dat'

resp = requests.get(PUBLIC_SUFFIX_URL)
resptext = resp.text
# Remove comments and double new lines
new_resptext = re.sub(r'(?:^|\n)[\/\n][^\n]+', '', resptext)
tlds = list(filter(None, new_resptext.split('\n')))

with open("src/public_suffix_list.json", "w") as f:
    f.write(json.dumps(tlds))