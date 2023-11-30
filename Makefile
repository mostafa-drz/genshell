.PHONY: all build-macos-intel build-macos-arm build-linux-intel build-linux-arm

all: build-macos-intel build-macos-arm build-linux-intel build-linux-arm

build-macos-intel:
	GOOS=darwin GOARCH=amd64 go build -o .build/genshell-macos-intel .

build-macos-arm:
	GOOS=darwin GOARCH=arm64 go build -o .build/genshell-macos-arm .

build-linux-intel:
	GOOS=linux GOARCH=amd64 go build -o .build/genshell-linux-intel .

build-linux-arm:
	GOOS=linux GOARCH=arm64 go build -o .build/genshell-linux-arm .
