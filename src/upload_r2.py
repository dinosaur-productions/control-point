import boto3
from botocore.client import Config
from dotenv import load_dotenv
import os

# --- Load .env file ---
# You need to install python-dotenv in your poetry environment:
# poetry add python-dotenv

load_dotenv(".env")

R2_ACCESS_KEY_ID = os.getenv("R2_ACCESS_KEY_ID", "")
R2_SECRET_ACCESS_KEY = os.getenv("R2_SECRET_ACCESS_KEY", "")
R2_ACCOUNT_ID = os.getenv("R2_ACCOUNT_ID", "")
R2_BUCKET = "control-point"
R2_ENDPOINT = f"https://{R2_ACCOUNT_ID}.r2.cloudflarestorage.com"
LOCAL_FILE = "data.duckdb"
REMOTE_FILE = "data.duckdb"

# --- Upload ---
def upload_file():
    session = boto3.session.Session()
    if not R2_ACCESS_KEY_ID or not R2_SECRET_ACCESS_KEY:
        raise ValueError("R2_ACCESS_KEY_ID and R2_SECRET_ACCESS_KEY must be set in .env")
    s3 = session.client(
        service_name='s3',
        aws_access_key_id=R2_ACCESS_KEY_ID,
        aws_secret_access_key=R2_SECRET_ACCESS_KEY,
        endpoint_url=R2_ENDPOINT,
        config=Config(signature_version='s3v4'),
        region_name='auto'
    )
    print(f"Uploading {LOCAL_FILE} to bucket {R2_BUCKET} as {REMOTE_FILE} ...")
    s3.upload_file(LOCAL_FILE, R2_BUCKET, REMOTE_FILE)
    print("Upload complete.")

if __name__ == "__main__":
    upload_file()