#!/bin/sh

# Script to unpack build archives and test extensions

testDir=tests

# Prefer chrome/chromium zips. web-ext is unstable with Chromium MV3
# (MANIFEST_FIELD_UNSUPPORTED for service_worker / EXTENSION_ID_REQUIRED),
# so we only unpack and verify the archive layout here.
for packageArchive in `find . -maxdepth 1 -type f \( -name 'chrome.zip' -o -name 'chromium.zip' \) -print`;
do
	unpackDir="$testDir/$(basename -s .zip "$packageArchive")"

	# Unpack
	echo "Unpack build \"$packageArchive\" to \"$unpackDir\"";
	mkdir -p "$unpackDir" && unzip -o "$packageArchive" -d "$unpackDir"

	echo;

	# Basic integrity checks
	echo "Check build \"$packageArchive\"";
	if [ ! -f "$unpackDir/manifest.json" ];
	then
		echo "Missing manifest.json in \"$packageArchive\"" >&2
		exit 1
	fi

	echo "OK: \"$packageArchive\"";
	echo;
done
