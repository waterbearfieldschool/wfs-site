#!/bin/bash

git add *
git commit -m 'update'
git push --no-verify
rm -rf ../waterbearfieldschool.github.io/*
cp -r dist/* ../waterbearfieldschool.github.io/
cp CNAME ../waterbearfieldschool.github.io/
cd ../waterbearfieldschool.github.io/
git add *	
git commit -m 'update'
git push
