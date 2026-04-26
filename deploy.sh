#!/bin/bash

git pull
git add *
git commit -m 'update'
git push --no-verify
cd ../waterbearfieldschool.github.io/
rm -rf *
cd ../wfs-site/
cp -r _site/* ../waterbearfieldschool.github.io/
cp CNAME ../waterbearfieldschool.github.io/
cd ../waterbearfieldschool.github.io/
git add *	
git commit -m 'update'
git push
