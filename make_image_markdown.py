#!/usr/bin/env python3
"""
Script to create markdown file with image tables from a CSV file.
Reads a CSV with image_name and caption columns and creates markdown
with clickable images as table headers and captions as table bodies.
"""

import csv
import sys
import os
from pathlib import Path

def auto_detect_image_path():
    """Auto-detect the proper image path based on current working directory."""
    cwd = Path.cwd()
    cwd_parts = cwd.parts
    
    # Look for src/assets/images pattern in the current path
    if 'src' in cwd_parts:
        src_index = cwd_parts.index('src')
        # Get everything after 'src' to construct the web path
        path_after_src = '/'.join(cwd_parts[src_index + 1:])
        if path_after_src:
            return f"/{path_after_src}"
    
    return ""

def create_image_markdown(csv_file="image_labels.csv", output_file="images.md", image_path="", thumbnail_mode=False):
    """Create markdown file with image tables from CSV data."""
    
    if not Path(csv_file).exists():
        print(f"Error: CSV file '{csv_file}' not found")
        return
    
    # Auto-detect image path if not provided
    if not image_path:
        image_path = auto_detect_image_path()
        if image_path:
            print(f"Auto-detected image path: {image_path}")
    
    markdown_content = []
    image_count = 0
    
    with open(csv_file, 'r', encoding='utf-8') as csvfile:
        reader = csv.DictReader(csvfile)
        
        if 'image_name' not in reader.fieldnames or 'caption' not in reader.fieldnames:
            print("Error: CSV must have 'image_name' and 'caption' columns")
            return
        
        if thumbnail_mode:
            # Start thumbnail gallery
            markdown_content.append('<div class="thumbnail-gallery">\n\n')
        
        for row in reader:
            image_name = row['image_name'].strip()
            caption = row['caption'].strip()
            
            if not image_name:
                continue
            
            # Construct image path (add leading slash if image_path provided)
            if image_path:
                full_image_path = f"{image_path.rstrip('/')}/{image_name}"
            else:
                full_image_path = image_name
            
            if thumbnail_mode:
                # Create thumbnail item
                thumbnail_markdown = f"""<div class="thumbnail-item">
  <a href="{full_image_path}">
    <img src="{full_image_path}" alt="{caption or image_name}">
  </a>
  <div class="thumbnail-caption">{caption or '*No caption provided*'}</div>
</div>

"""
                markdown_content.append(thumbnail_markdown)
            else:
                # Create table with clickable image header and caption body
                table_markdown = f"""| [![{caption or image_name}]({full_image_path})]({full_image_path}) |
|:---:|
| {caption or '*No caption provided*'} |

"""
                markdown_content.append(table_markdown)
            
            image_count += 1
        
        if thumbnail_mode:
            # End thumbnail gallery
            markdown_content.append('</div>\n\n')
    
    if not markdown_content:
        print("No valid image entries found in CSV")
        return
    
    # Write markdown file
    with open(output_file, 'w', encoding='utf-8') as mdfile:
        mdfile.write("# Image Gallery\n\n")
        mdfile.writelines(markdown_content)
    
    mode_text = "thumbnail gallery" if thumbnail_mode else "image tables"
    print(f"Created {output_file} with {image_count} {mode_text}")
    if image_path:
        print(f"Using image path: {image_path}")

def print_usage():
    """Print usage instructions."""
    print("Usage: python make_image_markdown.py [csv_file] [output_file] [image_path] [--thumbnails]")
    print()
    print("Arguments:")
    print("  csv_file    CSV file with image_name,caption columns (default: image_labels.csv)")
    print("  output_file Output markdown file (default: images.md)")
    print("  image_path  Path prefix for images (e.g., 'assets/images/projects')")
    print("  --thumbnails Generate thumbnail grid instead of individual tables")
    print()
    print("Examples:")
    print("  python make_image_markdown.py")
    print("  python make_image_markdown.py my_images.csv gallery.md")
    print("  python make_image_markdown.py labels.csv gallery.md assets/images/projects")
    print("  python make_image_markdown.py --thumbnails  # Create thumbnail gallery")
    print("  python make_image_markdown.py labels.csv thumbs.md '' --thumbnails")

if __name__ == "__main__":
    if len(sys.argv) > 1 and sys.argv[1] in ['-h', '--help']:
        print_usage()
        sys.exit(0)
    
    # Check for thumbnail mode flag
    thumbnail_mode = '--thumbnails' in sys.argv
    if thumbnail_mode:
        sys.argv.remove('--thumbnails')
    
    csv_file = sys.argv[1] if len(sys.argv) > 1 else "image_labels.csv"
    output_file = sys.argv[2] if len(sys.argv) > 2 else "images.md"
    image_path = sys.argv[3] if len(sys.argv) > 3 else ""
    
    print(f"Reading CSV: {csv_file}")
    print(f"Output file: {output_file}")
    if image_path:
        print(f"Image path prefix: {image_path}")
    if thumbnail_mode:
        print("Mode: Thumbnail gallery")
    
    create_image_markdown(csv_file, output_file, image_path, thumbnail_mode)