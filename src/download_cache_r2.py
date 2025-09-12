#!/usr/bin/env python3
"""
Download cache files from R2 for seeding GitHub Actions cache.

This script downloads:
- data.duckdb (main database)
- Latest .jsonl file 
- All .lastmodified files

Usage:
    python src/download_cache_r2.py
"""

import boto3
from botocore.client import Config
import os
from pathlib import Path

R2_ACCESS_KEY_ID = os.getenv("R2_ACCESS_KEY_ID")
R2_SECRET_ACCESS_KEY = os.getenv("R2_SECRET_ACCESS_KEY") 
R2_ACCOUNT_ID = os.getenv("R2_ACCOUNT_ID")
R2_BUCKET = "control-point"
R2_ENDPOINT = f"https://{R2_ACCOUNT_ID}.r2.cloudflarestorage.com"
CACHE_PREFIX = "cache-seed/"

def get_s3_client():
    """Create and return an S3 client configured for R2."""
    if not R2_ACCESS_KEY_ID or not R2_SECRET_ACCESS_KEY or not R2_ACCOUNT_ID:
        raise ValueError("R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, and R2_ACCOUNT_ID must be set")
    
    session = boto3.session.Session()
    return session.client(
        service_name='s3',
        aws_access_key_id=R2_ACCESS_KEY_ID,
        aws_secret_access_key=R2_SECRET_ACCESS_KEY,
        endpoint_url=R2_ENDPOINT,
        config=Config(signature_version='s3v4'),
        region_name='auto'
    )

def download_file(s3_client, remote_key, local_path):
    """Download a single file from R2."""
    try:
        print(f"Downloading {remote_key} -> {local_path}")
        
        # Ensure directory exists
        local_dir = Path(local_path).parent
        local_dir.mkdir(parents=True, exist_ok=True)
        
        s3_client.download_file(R2_BUCKET, remote_key, local_path)
        file_size = os.path.getsize(local_path)
        print(f"  ✓ Downloaded {file_size:,} bytes")
        return True
    except Exception as e:
        print(f"  ✗ Download failed: {e}")
        return False

def download_cache_files():
    """Download cache files from R2."""
    try:
        s3_client = get_s3_client()
    except ValueError as e:
        print(f"Error: {e}")
        return False
    
    print(f"Downloading cache files from R2 bucket: {R2_BUCKET}")
    print(f"Cache prefix: {CACHE_PREFIX}")
    print("-" * 60)
    
    try:
        # List all files with the cache prefix
        response = s3_client.list_objects_v2(
            Bucket=R2_BUCKET,
            Prefix=CACHE_PREFIX
        )
        
        if 'Contents' not in response:
            print("No cache files found in R2")
            return False
        
        downloaded = 0
        failed = 0
        
        print(f"Found {len(response['Contents'])} files in R2:")
        
        for obj in response['Contents']:
            remote_key = obj['Key']
            file_name = remote_key[len(CACHE_PREFIX):]  # Remove prefix
            file_size = obj['Size']
            
            print(f"  {file_name} ({file_size:,} bytes)")
            
            # Determine local path based on file type
            if file_name == "data.duckdb":
                local_path = "data.duckdb"
            else:
                local_path = f"data-dump/{file_name}"
            
            if download_file(s3_client, remote_key, local_path):
                downloaded += 1
            else:
                failed += 1
        
        print("-" * 60)
        print(f"Download summary: {downloaded} successful, {failed} failed")
        
        if failed > 0:
            print(f"\n⚠ {failed} files failed to download")
            return False
        else:
            print(f"\n🎉 All {downloaded} files downloaded successfully!")
            return True
            
    except Exception as e:
        print(f"Error listing or downloading files: {e}")
        return False

if __name__ == "__main__":
    success = download_cache_files()
    exit(0 if success else 1)