#!/usr/bin/env python3
"""
Aggressive cleanup for GitHub Actions environment.

This script keeps only the essential files needed for incremental downloads:
- Latest .jsonl files for the current day
- .jsonl.bz2.lastmodified files for the previous day  
- Latest systemsPopulated.json.gz.lastmodified file
- data.duckdb file (handled separately)

This is more aggressive than the regular clean.py script which is designed
for local development with configurable retention periods.
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


def should_keep_file(filepath, today_date, yesterday_date):
    """
    Determine if a file should be kept based on GitHub Actions requirements.
    
    Keep only:
    - .jsonl files from today
    - .jsonl.bz2.lastmodified files from yesterday
    - systemsPopulated.json.gz.lastmodified (any date)
    
    Args:
        filepath: Path to the file
        today_date: datetime.date object for today
        yesterday_date: datetime.date object for yesterday
    
    Returns:
        bool: True if file should be kept
    """
    filename = filepath.name
    
    # Always keep systemsPopulated.json.gz.lastmodified
    if filename == 'systemsPopulated.json.gz.lastmodified':
        return True
    
    # Parse date from filename
    file_date = parse_date_from_filename(filename)
    if not file_date:
        # Keep files without dates (they might be important)
        return True
    
    file_date = file_date.date()
    
    # Keep today's .jsonl files
    if filename.endswith('.jsonl') and file_date == today_date:
        return True
    
    # Keep yesterday's .jsonl.bz2.lastmodified files
    if filename.endswith('.jsonl.bz2.lastmodified') and file_date == yesterday_date:
        return True
    
    # Delete everything else
    return False


def get_latest_date_from_files(data_dump_path):
    """
    Determine the latest date by examining actual JSONL files in the data-dump directory.
    
    Args:
        data_dump_path: Path to the data-dump directory
    
    Returns:
        datetime.date: Latest date found in JSONL files, or today's date if no files found
    """
    data_dump_path = Path(data_dump_path)
    
    if not data_dump_path.exists():
        print(f"Warning: Data dump directory does not exist: {data_dump_path}")
        return datetime.now().date()
    
    dates_found = set()
    
    # Look for .jsonl files and extract dates
    for filepath in data_dump_path.iterdir():
        if not filepath.is_file():
            continue
        
        filename = filepath.name
        
        # Only consider .jsonl files for determining the latest date
        if filename.endswith('.jsonl'):
            file_date = parse_date_from_filename(filename)
            if file_date:
                dates_found.add(file_date.date())
    
    if dates_found:
        latest_date = max(dates_found)
        print(f"Latest date found in JSONL files: {latest_date}")
        return latest_date
    else:
        print("Warning: No dated JSONL files found, using today's date")
        return datetime.now().date()


def aggressive_cleanup(data_dump_path, dry_run=False):
    """
    Aggressive cleanup for GitHub Actions - keep only essential files.
    
    Args:
        data_dump_path: Path to the data-dump directory
        dry_run: If True, just show what would be deleted without actually deleting
    """
    data_dump_path = Path(data_dump_path)
    
    if not data_dump_path.exists():
        print(f"Error: Data dump directory does not exist: {data_dump_path}")
        return
    
    # Determine the latest date from actual JSONL files
    today_date = get_latest_date_from_files(data_dump_path)
    yesterday_date = today_date - timedelta(days=1)
    
    deleted_count = 0
    kept_count = 0
    total_size_deleted = 0
    total_size_kept = 0
    
    print(f"GitHub Actions aggressive cleanup of: {data_dump_path}")
    print(f"Latest date from JSONL files: {today_date}")
    print(f"Previous day: {yesterday_date}")
    print(f"Mode: {'DRY RUN' if dry_run else 'DELETE'}")
    print("-" * 60)
    
    print("Files to KEEP:")
    print(f"  - *.jsonl files from {today_date}")
    print(f"  - *.jsonl.bz2.lastmodified files from {yesterday_date}")
    print(f"  - systemsPopulated.json.gz.lastmodified (any date)")
    print(f"  - Files without recognizable dates")
    print()
    
    # First pass: show what will be kept
    for filepath in sorted(data_dump_path.iterdir()):
        if not filepath.is_file():
            continue
        
        filename = filepath.name
        file_size = filepath.stat().st_size
        
        if should_keep_file(filepath, today_date, yesterday_date):
            kept_count += 1
            total_size_kept += file_size
            
            # Format file size
            if file_size > 1024 * 1024:
                size_str = f"{file_size / (1024 * 1024):.1f} MB"
            elif file_size > 1024:
                size_str = f"{file_size / 1024:.1f} KB"
            else:
                size_str = f"{file_size} bytes"
            
            print(f"KEEP: {filename} ({size_str})")
    
    print(f"\nFiles to DELETE:")
    
    # Second pass: delete what should be removed
    for filepath in sorted(data_dump_path.iterdir()):
        if not filepath.is_file():
            continue
        
        filename = filepath.name
        file_size = filepath.stat().st_size
        
        if not should_keep_file(filepath, today_date, yesterday_date):
            total_size_deleted += file_size
            
            # Format file size
            if file_size > 1024 * 1024:
                size_str = f"{file_size / (1024 * 1024):.1f} MB"
            elif file_size > 1024:
                size_str = f"{file_size / 1024:.1f} KB"
            else:
                size_str = f"{file_size} bytes"
            
            print(f"{'[DRY RUN] ' if dry_run else ''}DELETE: {filename} ({size_str})")
            
            if not dry_run:
                try:
                    filepath.unlink()
                    deleted_count += 1
                except OSError as e:
                    print(f"Error deleting {filename}: {e}")
            else:
                deleted_count += 1
    
    # Format total sizes
    def format_size(size):
        if size > 1024 * 1024 * 1024:
            return f"{size / (1024 * 1024 * 1024):.2f} GB"
        elif size > 1024 * 1024:
            return f"{size / (1024 * 1024):.1f} MB"
        elif size > 1024:
            return f"{size / 1024:.1f} KB"
        else:
            return f"{size} bytes"
    
    print("-" * 60)
    print(f"SUMMARY:")
    print(f"  Files kept: {kept_count} ({format_size(total_size_kept)})")
    print(f"  Files {'would be ' if dry_run else ''}deleted: {deleted_count} ({format_size(total_size_deleted)})")
    print(f"  Space {'would be ' if dry_run else ''}freed: {format_size(total_size_deleted)}")


def main():
    parser = argparse.ArgumentParser(
        description="Aggressive cleanup for GitHub Actions environment",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
This script keeps only the essential files needed for incremental downloads:
- Latest .jsonl files for the current day
- .jsonl.bz2.lastmodified files for the previous day  
- Latest systemsPopulated.json.gz.lastmodified file

Examples:
  python clean_github.py                    # Clean with aggressive settings
  python clean_github.py --dry-run          # Show what would be deleted
  python clean_github.py --data-dump ../data-dump  # Custom path
        """
    )
    
    parser.add_argument(
        '--data-dump',
        default='../data-dump',
        help='Path to data-dump directory (default: ../data-dump)'
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
    
    aggressive_cleanup(
        data_dump_path=data_dump_path,
        dry_run=args.dry_run
    )


if __name__ == '__main__':
    main()