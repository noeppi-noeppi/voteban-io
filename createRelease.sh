#!/usr/bin/env bash

if [[ ${1} == '' ]]; then
  echo "Usage: ${0} <version> <description>"
  exit
fi

if [[ ${GITHUB_TOKEN} == '' ]]; then
  echo 'Please store your GitHub access token in $GITHUB_TOKEN.'
  exit
fi

echo 'Create archives'
mkdir release
tar --exclude 'release' --exclude '.git' --exclude '.idea' --exclude 'createRelease.sh' --exclude 'node_modules' --exclude '*/node_modules' -cvzf release/release.tar.gz *
tar --exclude 'release' --exclude '.git' --exclude '.idea' --exclude 'createRelease.sh' -cvzf release/release-shaded.tar.gz *
zip release/release.zip -r . -x='release/*' -x='.git/*' -x'.idea/*' -x='createRelease.sh' -x='node_modules/*' -x='*/node_modules/*' --symlinks
zip release/release-shaded.zip -r . -x='release/*' -x='.git/*' -x'.idea/*' -x='createRelease.sh' --symlinks

echo 'Create release'
RELEASE_ID=`curl -X POST -H "Authorization: token ${GITHUB_TOKEN}" -H "Content-Type: application/json" --data "
{
  \"tag_name\": \"v${1}\",
  \"target_commitish\": \"master\",
  \"name\": \"v${1}\",
  \"body\": \"${*:2}\",
  \"draft\": true,
  \"prerelease\": false
}
" https://api.github.com/repos/noeppi-noeppi/voteban-io/releases | python3 -c "import sys, json; print(json.load(sys.stdin)['id'])"`

echo "Release id: ${RELEASE_ID}"

echo 'Upload files'
curl -X POST -H "Authorization: token ${GITHUB_TOKEN}" -H "Content-Type: application/x-compressed-tar" --data-binary @release/release.tar.gz https://uploads.github.com/repos/noeppi-noeppi/voteban-io/releases/${RELEASE_ID}/assets?name=v${1}.tar.gz > /dev/null
curl -X POST -H "Authorization: token ${GITHUB_TOKEN}" -H "Content-Type: application/x-compressed-tar" --data-binary @release/release-shaded.tar.gz https://uploads.github.com/repos/noeppi-noeppi/voteban-io/releases/${RELEASE_ID}/assets?name=v${1}-shaded.tar.gz > /dev/null
curl -X POST -H "Authorization: token ${GITHUB_TOKEN}" -H "Content-Type: application/zip" --data-binary @release/release.zip https://uploads.github.com/repos/noeppi-noeppi/voteban-io/releases/${RELEASE_ID}/assets?name=v${1}.zip > /dev/null
curl -X POST -H "Authorization: token ${GITHUB_TOKEN}" -H "Content-Type: application/zip" --data-binary @release/release-shaded.zip https://uploads.github.com/repos/noeppi-noeppi/voteban-io/releases/${RELEASE_ID}/assets?name=v${1}-shaded.zip > /dev/null

echo 'Publish release'
curl -X PATCH -H "Authorization: token ${GITHUB_TOKEN}" -H "Content-Type: application/json" --data "
{
  \"draft\": false
}
" https://api.github.com/repos/noeppi-noeppi/voteban-io/releases/${RELEASE_ID} > /dev/null

echo 'Delete release archives'
rm -r release