#!/usr/bin/env python3
"""
Upload local cache files to R2 for seeding GitHub Actions cache.

This script uploads:
- All .jsonl files from data-dump/
- All .lastmodified files from data-dump/
- The main data.duckdb file

Usage:
    python src/upload_cache_r2.py
"""

import boto3
from botocore.client import Config
from dotenv import load_dotenv
import os
import glob
from pathlib import Path

# --- Load .env file ---
load_dotenv(".env")

R2_ACCESS_KEY_ID = os.getenv("R2_ACCESS_KEY_ID", "")
R2_SECRET_ACCESS_KEY = os.getenv("R2_SECRET_ACCESS_KEY", "")
R2_ACCOUNT_ID = os.getenv("R2_ACCOUNT_ID", "")
R2_BUCKET = "control-point"
R2_ENDPOINT = f"https://{R2_ACCOUNT_ID}.r2.cloudflarestorage.com"

# Cache prefix to organize files
CACHE_PREFIX = "cache-seed/"

def get_s3_client():
    """Create and return an S3 client configured for R2."""
    session = boto3.session.Session()
    if not R2_ACCESS_KEY_ID or not R2_SECRET_ACCESS_KEY:
        raise ValueError("R2_ACCESS_KEY_ID and R2_SECRET_ACCESS_KEY must be set in .env")
    
    return session.client(
        service_name='s3',
        aws_access_key_id=R2_ACCESS_KEY_ID,
        aws_secret_access_key=R2_SECRET_ACCESS_KEY,
        endpoint_url=R2_ENDPOINT,
        config=Config(signature_version='s3v4'),
        region_name='auto'
    )

def upload_file(s3_client, local_path, remote_key):
    """Upload a single file to R2."""
    try:
        file_size = os.path.getsize(local_path)
        print(f"Uploading {local_path} ({file_size:,} bytes) -> {remote_key}")
        s3_client.upload_file(str(local_path), R2_BUCKET, remote_key)
        print(f"  ✓ Upload complete")
        return True
    except Exception as e:
        print(f"  ✗ Upload failed: {e}")
        return False

def get_latest_jsonl_file(data_dump_dir):
    """Find the latest .jsonl file based on filename date."""
    import re
    
    jsonl_files = glob.glob(str(data_dump_dir / "*.jsonl"))
    
    if not jsonl_files:
        return None
    
    # Extract dates from filenames and find the latest
    dated_files = []
    date_pattern = r'(\d{4}-\d{2}-\d{2})'
    
    for file_path in jsonl_files:
        filename = Path(file_path).name
        match = re.search(date_pattern, filename)
        if match:
            date_str = match.group(1)
            try:
                # Parse date for comparison
                from datetime import datetime
                file_date = datetime.strptime(date_str, '%Y-%m-%d').date()
                dated_files.append((file_date, file_path))
            except ValueError:
                continue  # Skip files with invalid dates
    
    if not dated_files:
        # If no dated files found, just return the first one alphabetically
        return sorted(jsonl_files)[0] if jsonl_files else None
    
    # Return the file with the latest date
    latest_file = max(dated_files, key=lambda x: x[0])[1]
    return latest_file

def upload_cache_files():
    """Upload all cache files to R2."""
    s3_client = get_s3_client()
    
    uploaded_count = 0
    failed_count = 0
    
    print(f"Starting cache upload to R2 bucket: {R2_BUCKET}")
    print(f"Cache prefix: {CACHE_PREFIX}")
    print("-" * 60)
    
    # Upload data.duckdb if it exists
    if os.path.exists("data.duckdb"):
        remote_key = f"{CACHE_PREFIX}data.duckdb"
        if upload_file(s3_client, "data.duckdb", remote_key):
            uploaded_count += 1
        else:
            failed_count += 1
    else:
        print("⚠ data.duckdb not found, skipping")
    
    # Upload data-dump files if directory exists
    data_dump_dir = Path("data-dump")
    if data_dump_dir.exists():
        print(f"\nScanning {data_dump_dir}/ for cache files...")
        
        # Get the latest .jsonl file
        latest_jsonl = get_latest_jsonl_file(data_dump_dir)
        
        # Get all .lastmodified files
        lastmodified_files = glob.glob(str(data_dump_dir / "*.lastmodified"))
        
        # Combine files to upload
        files_to_upload = []
        if latest_jsonl:
            files_to_upload.append(latest_jsonl)
            print(f"Latest .jsonl file: {Path(latest_jsonl).name}")
        else:
            print("No .jsonl files found")
        
        if lastmodified_files:
            files_to_upload.extend(lastmodified_files)
            print(f"Found {len(lastmodified_files)} .lastmodified files")
        else:
            print("No .lastmodified files found")
        
        if files_to_upload:
            print(f"Total files to upload from data-dump: {len(files_to_upload)}")
            
            for local_file in sorted(files_to_upload):
                local_path = Path(local_file)
                # Preserve the data-dump/ directory structure in R2
                remote_key = f"{CACHE_PREFIX}{local_path.name}"
                
                if upload_file(s3_client, local_path, remote_key):
                    uploaded_count += 1
                else:
                    failed_count += 1
        else:
            print("No cache files found in data-dump/")
    else:
        print("⚠ data-dump/ directory not found, skipping")
    
    print("-" * 60)
    print(f"Upload summary:")
    print(f"  ✓ Successful: {uploaded_count}")
    print(f"  ✗ Failed: {failed_count}")
    
    if failed_count > 0:
        print(f"\n⚠ {failed_count} files failed to upload")
        return False
    else:
        print(f"\n🎉 All {uploaded_count} files uploaded successfully!")
        return True

def list_cache_files():
    """List what cache files would be uploaded (dry run)."""
    print("Cache files that would be uploaded:")
    print("-" * 60)
    
    total_size = 0
    file_count = 0
    
    # Check data.duckdb
    if os.path.exists("data.duckdb"):
        size = os.path.getsize("data.duckdb")
        print(f"data.duckdb ({size:,} bytes)")
        total_size += size
        file_count += 1
    
    # Check data-dump files
    data_dump_dir = Path("data-dump")
    if data_dump_dir.exists():
        # Get the latest .jsonl file
        latest_jsonl = get_latest_jsonl_file(data_dump_dir)
        
        # Get all .lastmodified files
        lastmodified_files = glob.glob(str(data_dump_dir / "*.lastmodified"))
        
        # List the latest jsonl file
        if latest_jsonl:
            local_path = Path(latest_jsonl)
            size = os.path.getsize(local_path)
            print(f"{local_path.name} (latest .jsonl) ({size:,} bytes)")
            total_size += size
            file_count += 1
        
        # List all lastmodified files
        for local_file in sorted(lastmodified_files):
            local_path = Path(local_file)
            size = os.path.getsize(local_path)
            print(f"{local_path.name} ({size:,} bytes)")
            total_size += size
            file_count += 1
    
    print("-" * 60)
    print(f"Total: {file_count} files, {total_size:,} bytes ({total_size / 1024 / 1024:.1f} MB)")

if __name__ == "__main__":
    import argparse
    
    parser = argparse.ArgumentParser(description="Upload cache files to R2")
    parser.add_argument("--dry-run", action="store_true", 
                        help="List files that would be uploaded without uploading")
    
    args = parser.parse_args()
    
    if args.dry_run:
        list_cache_files()
    else:
        success = upload_cache_files()
        exit(0 if success else 1)