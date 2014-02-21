#!/bin/sh

cp -f resources/linux/description-pak ./
mkdir -p ./SOURCES
tar -cz app/ > ./SOURCES/QuickQuestion-$1.tgz
checkinstall -y --install=no --fstrans=yes -R --pkgname QuickQuestion --pkgrelease 1 --reset-uids --deldoc --delspec \
--deldesc --maintainer dica-developer@mascha.me --pkgversion $1 --pkgarch amd64  --showinstall=no \
--pkgsource http://dica-developer.github.io/quickQuestion/ --pkglicense GPLv3 --pkggroup Tool resources/linux/install.sh
mv ~/rpmbuild/RPMS/amd64/QuickQuestion-$1-1.amd64.rpm ./
rm -r ./SOURCES
rm description-pak
