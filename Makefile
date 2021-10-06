# Run the main script
.PHONY: build clean suffixes

clean:
	rm -rf build

build: clean
	tsc && cp manifest.json src/*.html src/*.css media/waypost_* build
# Delete export lines that ES5 chrome can't understand
	sed -i '/export {}/d' ./build/*.js

release: build
	zip waypost.zip build/*
