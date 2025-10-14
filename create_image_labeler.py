#!/usr/bin/env python3
"""
Script to create a CSV template for labeling images in the current directory.
Creates a CSV file with image names and blank captions for manual filling.
"""

import os
import csv
from pathlib import Path

def get_image_files(directory="."):
    """Get all image files in the specified directory."""
    image_extensions = {'.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg', '.bmp', '.tiff'}
    image_files = []
    
    for file_path in Path(directory).iterdir():
        if file_path.is_file() and file_path.suffix.lower() in image_extensions:
            image_files.append(file_path.name)
    
    return sorted(image_files)

def create_csv_template(output_file="image_labels.csv", directory="."):
    """Create CSV template with image names and blank captions."""
    image_files = get_image_files(directory)
    
    if not image_files:
        print(f"No image files found in {directory}")
        return
    
    with open(output_file, 'w', newline='', encoding='utf-8') as csvfile:
        writer = csv.writer(csvfile)
        writer.writerow(['image_name', 'caption'])
        
        for image_file in image_files:
            writer.writerow([image_file, ''])
    
    print(f"Created {output_file} with {len(image_files)} images:")
    for img in image_files:
        print(f"  - {img}")

if __name__ == "__main__":
    import sys
    
    directory = sys.argv[1] if len(sys.argv) > 1 else "."
    output_file = sys.argv[2] if len(sys.argv) > 2 else "image_labels.csv"
    
    print(f"Scanning directory: {directory}")
    create_csv_template(output_file, directory)