#!/bin/sh

# TODO: Implement as a Gulp task.

# Files must be previously compiled.
rm -R static_dist
mkdir static_dist
cp views/index.html static_dist/index.html
cp -r public/javascripts/ static_dist/javascripts
cp -r public/stylesheets/ static_dist/stylesheets
cp -r public/images/ static_dist/images
