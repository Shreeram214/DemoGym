#!/bin/sh
# Cloudflare Pages build: copy the public site into dist/, leaving out
# files that belong to the repo only (README, git and editor config).
# Pages settings: build command "sh build.sh", output directory "dist".
set -e

rm -rf dist
mkdir dist

for f in * .[!.]*; do
  case "$f" in
    dist|build.sh|README.md|.git|.gitignore|.claude|.cloudflare|.github|.vscode|.wrangler|node_modules) continue ;;
  esac
  [ -e "$f" ] && cp -R "$f" dist/
done

echo "Copied site to dist/:"
ls -A dist
