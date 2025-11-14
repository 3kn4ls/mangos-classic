# Icons for PWA

This directory contains the icons needed for the Progressive Web App.

## Required Sizes

- 72x72
- 96x96
- 128x128
- 144x144
- 152x152
- 192x192
- 384x384
- 512x512

## How to Generate Icons

You can use any of these methods:

### Method 1: Using ImageMagick (Recommended)

```bash
# Install ImageMagick if not already installed
# Ubuntu/Debian: apt-get install imagemagick
# MacOS: brew install imagemagick

# Create a base icon (512x512) first, then resize
convert -size 512x512 xc:none -gravity center \
  -fill "#2c3e50" -draw "circle 256,256 256,10" \
  -fill white -pointsize 200 -gravity center -annotate +0+0 "🎮" \
  icon-512.png

# Generate all sizes
for size in 72 96 128 144 152 192 384; do
  convert icon-512.png -resize ${size}x${size} icon-${size}.png
done
```

### Method 2: Using Online Tools

1. Visit https://www.favicon-generator.org/
2. Upload your base image
3. Download generated icons and place them here

### Method 3: Manual Creation

Use any image editor (Photoshop, GIMP, Figma, etc.) to create icons in the required sizes.

## Current Status

Currently using placeholder. Replace with actual MaNGOS logo or custom icon.
