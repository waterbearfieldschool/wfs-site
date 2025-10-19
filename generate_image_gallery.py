#!/usr/bin/env python3
"""
Script to generate a markdown file with image gallery from a folder of images.
Usage: python generate_image_gallery.py <image_folder> [output_file]
"""

import os
import sys
import argparse
from pathlib import Path

def get_image_files(folder_path):
    """Get all image files from the specified folder."""
    image_extensions = {'.jpg', '.jpeg', '.png', '.gif', '.webp', '.mp4', '.mov'}
    image_files = []
    
    for file_path in Path(folder_path).iterdir():
        if file_path.is_file() and file_path.suffix.lower() in image_extensions:
            image_files.append(file_path)
    
    return sorted(image_files)

def generate_caption_from_filename(filename):
    """Generate a caption from the filename."""
    # Remove extension and replace underscores/hyphens with spaces
    caption = Path(filename).stem
    caption = caption.replace('_', ' ').replace('-', ' ')
    # Capitalize first letter
    caption = caption.capitalize()
    return caption

def generate_markdown_gallery(image_files, image_folder, base_path="/assets/images/"):
    """Generate markdown content for the image gallery."""
    markdown_content = []
    
    # Determine the relative path for images
    folder_name = Path(image_folder).name
    
    for i, image_file in enumerate(image_files):
        filename = image_file.name
        caption = generate_caption_from_filename(filename)
        image_path = f"{base_path}{folder_name}/{filename}"
        
        # Alternate between left and right float, with some small variants
        float_class = "float-left" if i % 2 == 0 else "float-right"
        
        # Add occasional small class for variety
        if i % 5 == 2:
            float_class += " float-small"
        
        # Handle video files differently
        if image_file.suffix.lower() in {'.mp4', '.mov'}:
            markdown_content.append(f'<div class="float-figure {float_class}">')
            markdown_content.append(f'  <video controls playsinline preload="metadata" webkit-playsinline muted autoplay="false">')
            
            # Add appropriate MIME type based on extension
            if image_file.suffix.lower() == '.mp4':
                video_type = 'video/mp4'
            elif image_file.suffix.lower() == '.mov':
                video_type = 'video/quicktime'
            else:
                video_type = 'video/mp4'
                
            markdown_content.append(f'    <source src="{image_path}" type="{video_type}">')
            markdown_content.append(f'    Your browser does not support the video tag.')
            markdown_content.append(f'  </video>')
            markdown_content.append(f'  <div class="float-caption">{caption}</div>')
            markdown_content.append(f'</div>')
        else:
            markdown_content.append(f'<div class="float-figure {float_class}">')
            markdown_content.append(f'  <img src="{image_path}" alt="{caption}">')
            markdown_content.append(f'  <div class="float-caption">{caption}</div>')
            markdown_content.append(f'</div>')
        
        markdown_content.append('')  # Add blank line between images
    
    return '\n'.join(markdown_content)

def create_markdown_header(folder_name):
    """Create a basic markdown header."""
    title = folder_name.replace('_', ' ').replace('-', ' ').title()
    
    header = f"""---
title: "{title}"
date: 2025-10-18
location: "Waterbeaar Field School"
meta: Photo gallery for {title}
layout: layouts/post.njk
permalink: /events/{folder_name}/
---

# {title}

"""
    return header

def main():
    parser = argparse.ArgumentParser(description='Generate markdown gallery from image folder')
    parser.add_argument('image_folder', help='Path to folder containing images')
    parser.add_argument('output_file', nargs='?', help='Output markdown file (optional)')
    parser.add_argument('--base-path', default='/assets/images/', 
                       help='Base path for image URLs (default: /assets/images/)')
    
    args = parser.parse_args()
    
    if not os.path.isdir(args.image_folder):
        print(f"Error: {args.image_folder} is not a valid directory")
        sys.exit(1)
    
    image_files = get_image_files(args.image_folder)
    
    if not image_files:
        print(f"No image files found in {args.image_folder}")
        sys.exit(1)
    
    print(f"Found {len(image_files)} image files")
    
    # Generate output filename if not provided
    if not args.output_file:
        folder_name = Path(args.image_folder).name
        args.output_file = f"{folder_name}-gallery.md"
    
    # Generate markdown content
    folder_name = Path(args.image_folder).name
    header = create_markdown_header(folder_name)
    gallery_content = generate_markdown_gallery(image_files, args.image_folder, args.base_path)
    
    full_content = header + gallery_content
    
    # Write to file
    with open(args.output_file, 'w') as f:
        f.write(full_content)
    
    print(f"Generated markdown gallery: {args.output_file}")
    print(f"Processed {len(image_files)} images from {args.image_folder}")

if __name__ == "__main__":
    main()