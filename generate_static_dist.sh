#!/bin/sh

# Files must be previously compiled.
mkdir static_dist
cp views/index.html static_dist/index.html
cp -r public/javascripts/ static_dist/javascripts
cp -r public/stylesheets/ static_dist/stylesheets
cp -r public/images/ static_dist/images
