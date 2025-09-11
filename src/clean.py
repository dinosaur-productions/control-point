#!/usr/bin/env python3
"""
Clean up old files from the data-dump folder.

This script removes:
- All dated files older than 30 days (default)
- Commodity files older than 7 days
- systemsPopulated.json.gz files immediately (but keeps .lastmodified files)
"""

import os
import re
import argparse
from datetime import datetime, timedelta
from pathlib import Path


def parse_date_from_filename(filename):
    """
    Extract date from filename patterns like:
    - Commodity-2025-08-14.jsonl.gz
    - Journal.ApproachSettlement-2025-07-01.jsonl.gz
    
    Returns datetime object or None if no date found.
    """
    # Pattern to match YYYY-MM-DD in filename
    date_pattern = r'(\d{4}-\d{2}-\d{2})'
    match = re.search(date_pattern, filename)
    
    if match:
        try:
            date_str = match.group(1)
            return datetime.strptime(date_str, '%Y-%m-%d')
        except ValueError:
            return None
    return None


def should_delete_file(filepath, days_threshold):
    """
    Determine if a file should be deleted based on its date and age threshold.
    
    Args:
        filepath: Path to the file
        days_threshold: Number of days - files older than this will be deleted
    
    Returns:
        bool: True if file should be deleted
    """
    filename = filepath.name
    
    # Always delete systemsPopulated.json.gz (but not .lastmodified)
    if filename == 'systemsPopulated.json.gz':
        return True
    
    if filename == 'systemsPopulated.json.gz.lastmodified':
        return False
    
    # Parse date from filename
    file_date = parse_date_from_filename(filename)
    if not file_date:
        return False
    
    # Check if file is older than threshold
    cutoff_date = datetime.now() - timedelta(days=days_threshold)
    return file_date < cutoff_date


def clean_data_dump(data_dump_path, default_days=30, commodity_days=7, dry_run=False):
    """
    Clean up old files from the data-dump directory.
    
    Args:
        data_dump_path: Path to the data-dump directory
        default_days: Default age threshold for most files
        commodity_days: Age threshold for Commodity files
        dry_run: If True, just show what would be deleted without actually deleting
    """
    data_dump_path = Path(data_dump_path)
    
    if not data_dump_path.exists():
        print(f"Error: Data dump directory does not exist: {data_dump_path}")
        return
    
    deleted_count = 0
    total_size = 0
    
    print(f"Scanning directory: {data_dump_path}")
    print(f"Default retention: {default_days} days")
    print(f"Commodity retention: {commodity_days} days")
    print(f"Mode: {'DRY RUN' if dry_run else 'DELETE'}")
    print("-" * 50)
    
    for filepath in data_dump_path.iterdir():
        if not filepath.is_file():
            continue
        
        filename = filepath.name
        
        # Determine which threshold to use
        if filename.startswith('Commodity-'):
            days_threshold = commodity_days
            file_type = "Commodity"
        else:
            days_threshold = default_days
            file_type = "General"
        
        # Check if file should be deleted
        if should_delete_file(filepath, days_threshold):
            file_size = filepath.stat().st_size
            total_size += file_size
            
            # Format file size
            if file_size > 1024 * 1024:
                size_str = f"{file_size / (1024 * 1024):.1f} MB"
            elif file_size > 1024:
                size_str = f"{file_size / 1024:.1f} KB"
            else:
                size_str = f"{file_size} bytes"
            
            print(f"{'[DRY RUN] ' if dry_run else ''}Deleting {file_type}: {filename} ({size_str})")
            
            if not dry_run:
                try:
                    filepath.unlink()
                    deleted_count += 1
                except OSError as e:
                    print(f"Error deleting {filename}: {e}")
            else:
                deleted_count += 1
    
    # Format total size
    if total_size > 1024 * 1024 * 1024:
        total_size_str = f"{total_size / (1024 * 1024 * 1024):.2f} GB"
    elif total_size > 1024 * 1024:
        total_size_str = f"{total_size / (1024 * 1024):.1f} MB"
    elif total_size > 1024:
        total_size_str = f"{total_size / 1024:.1f} KB"
    else:
        total_size_str = f"{total_size} bytes"
    
    print("-" * 50)
    print(f"{'Would delete' if dry_run else 'Deleted'} {deleted_count} files")
    print(f"{'Would free' if dry_run else 'Freed'} {total_size_str} of space")


def main():
    parser = argparse.ArgumentParser(
        description="Clean up old files from the data-dump folder",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  python clean.py                    # Clean with default settings
  python clean.py --dry-run          # Show what would be deleted
  python clean.py --days 45          # Keep files for 45 days instead of 30
  python clean.py --commodity-days 3 # Keep commodity files for 3 days instead of 7
        """
    )
    
    parser.add_argument(
        '--data-dump',
        default='../data-dump',
        help='Path to data-dump directory (default: ../data-dump)'
    )
    
    parser.add_argument(
        '--days',
        type=int,
        default=30,
        help='Delete general files older than this many days (default: 30)'
    )
    
    parser.add_argument(
        '--commodity-days',
        type=int,
        default=7,
        help='Delete commodity files older than this many days (default: 7)'
    )
    
    parser.add_argument(
        '--dry-run',
        action='store_true',
        help='Show what would be deleted without actually deleting files'
    )
    
    args = parser.parse_args()
    
    # Convert relative path to absolute
    script_dir = Path(__file__).parent
    data_dump_path = script_dir / args.data_dump
    data_dump_path = data_dump_path.resolve()
    
    clean_data_dump(
        data_dump_path=data_dump_path,
        default_days=args.days,
        commodity_days=args.commodity_days,
        dry_run=args.dry_run
    )


if __name__ == '__main__':
    main()
