#!/bin/bash

# Script to generate PWA icons from SVG
# Requires: imagemagick (convert command)

# Check if ImageMagick is installed
if ! command -v convert &> /dev/null; then
    echo "ImageMagick is not installed. Please install it first:"
    echo "  Ubuntu/Debian: sudo apt-get install imagemagick"
    echo "  MacOS: brew install imagemagick"
    echo "  Fedora: sudo dnf install imagemagick"
    exit 1
fi

# Icon sizes needed for PWA
sizes=(72 96 128 144 152 192 384 512)

echo "Generating PWA icons from icon.svg..."

for size in "${sizes[@]}"; do
    echo "Generating ${size}x${size}..."
    convert -background none -resize ${size}x${size} icon.svg icon-${size}.png
done

echo "Done! Generated ${#sizes[@]} icons."
echo ""
echo "Generated files:"
ls -lh icon-*.png
