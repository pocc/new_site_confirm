# Run the main script
.PHONY: build clean suffixes

clean:
	rm -rf build

build: clean
	tsc && cp manifest.json media/new_site_confirm_* build
# Delete export lines that ES5 chrome can't understand
	sed -i '/export {}/d' ./build/*.js

suffixes:
	python3 src/get_suffixes.py
