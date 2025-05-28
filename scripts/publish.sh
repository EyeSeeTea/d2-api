#!/bin/bash
set -e -u -o pipefail

version=$(cat package.json | jq -r '.version')
publish_opts=$(if echo "$version" | grep -q beta; then echo "--tag beta"; fi)

yarn build
yarn publish $publish_opts --new-version "$version" build/

git tag "v$version" -f -m "Bump version"
git push --tags
