#!/bin/sh

hdiutil create -srcfolder "dist/$1.app" -volname "$1" -fs HFS+ -fsargs "-c c=64,a=16,e=16" -format UDRW dist/$1.tmp.dmg
hdiutil attach -readwrite -noverify -noautoopen "dist/$1.tmp.dmg"
mkdir /Volumes/$1/.background
cp resources/mac/background.png /Volumes/$1/.background
chmod -Rf go-w /Volumes/$1
ln -sfn /Applications/ /Volumes/$1/Applications
export APP_NAME=$1
osascript resources/mac/dmgStyler.applescript
hdiutil detach /Volumes/$1
hdiutil convert "dist/$1.tmp.dmg" -format UDZO -imagekey zlib-level=9 -o "dist/$1.dmg" -puppetstrings
rm dist/$1.tmp.dmg