#!/bin/sh

mkdir /usr/lib/quickquestion
cp -r dist/app.nw /usr/lib/quickquestion/
cp dist/nw.pak /usr/lib/quickquestion/
cp dist/node-webkit /usr/lib/quickquestion/
cp dist/qq /usr/bin/

cp resources/linux/quick-question.desktop /usr/share/applications/
cp resources/icons/QQ_Colored.svg /usr/share/pixmaps/

