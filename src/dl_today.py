import requests
import os
import datetime as dt

from constants import DIR_DATA_DUMP, EVENT_TYPES, URL_BASE_EDGALAXYDATA
from multiprocessing.pool import ThreadPool

def get_last_downloaded_position(local_data_path):
    if not os.path.exists(local_data_path):
        return 0
    return os.path.getsize(local_data_path)


def download_incremental(remote_url, local_data_path, verbose=False):
    last_position = get_last_downloaded_position(local_data_path)
    if verbose:
        print(f"Attempting to download from byte: {last_position}")

    head_response = requests.head(remote_url, stream=True)
    head_response.raise_for_status() 

    content_length_header = head_response.headers.get('Content-Length')
    if not content_length_header:
        print("Warning: Could not get 'Content-Length' from HEAD response. Cannot determine remote file size.")
        # If we can't get the size, we can't reliably use ranges or know if there's new data.
        # For this script, we'll exit if we can't get size, as range logic depends on it.
        return

    remote_file_size = int(content_length_header)
    if remote_file_size == 0:
        print("Remote file is empty.")
        return

    if verbose:
        print(f"Remote file size: {remote_file_size} bytes")

    # 2. Determine if there's new data
    if last_position >= remote_file_size:
        print("No new data available.")
        return

    range_header = f"bytes={last_position}-"
    headers = {"Range": range_header}
    if verbose:
        print(f"Requesting range: {range_header}")
    
    response = requests.get(remote_url, headers=headers, stream=True, timeout=60)

    # Check the response status code
    if response.status_code == 206: # 206 Partial Content - Success!
        # Verify the Content-Range header matches what we asked for (optional but good)
        content_range = response.headers.get('Content-Range')
        if content_range:
            # Expected format: bytes <start>-<end>/<total>
            try:
                range_info_part = content_range.split(' ')[1]
                if '/' in range_info_part:
                    range_part = range_info_part.split('/')[0]
                    if '-' in range_part:
                        range_info = range_part.split('-')
                        # Check if the received start byte matches the requested start byte
                        received_start_byte = int(range_info[0])
                        if received_start_byte != last_position:
                            print(f"Warning: Requested range start {last_position}, but received Content-Range starts at {received_start_byte}. Server might not fully support Range requests as expected.")
                    else:
                        print(f"Warning: Could not parse range part of Content-Range header '{content_range}'.")
                else:
                    print(f"Warning: Could not parse total size part of Content-Range header '{content_range}'.")
            except (IndexError, ValueError) as e:
                print(f"Warning: Could not parse Content-Range header '{content_range}': {e}")


        downloaded_bytes = 0
        os.makedirs(os.path.dirname(local_data_path) or '.', exist_ok=True)
        with open(local_data_path, 'ab') as f:
            for chunk in response.iter_content(chunk_size=8192):
                if chunk: # filter out keep-alive new chunks
                    f.write(chunk)
                    downloaded_bytes += len(chunk)

        new_position = last_position + downloaded_bytes
        if verbose:
            print(f"Successfully downloaded {downloaded_bytes} bytes.")

    elif response.status_code == 200: # 200 OK - Server might not support Range or ignored it
        if last_position == 0:
            print("Received 200 OK. Server might not support Range or this is the initial download.")
            downloaded_bytes = 0
            os.makedirs(os.path.dirname(local_data_path) or '.', exist_ok=True)
            with open(local_data_path, 'wb') as f:
                for chunk in response.iter_content(chunk_size=8192):
                    if chunk:
                        f.write(chunk)
                        downloaded_bytes += len(chunk)

            new_position = downloaded_bytes
            print(f"Successfully downloaded initial file ({downloaded_bytes} bytes).")
        else:
            print(f"Warning: Requested range from byte {last_position}, but received 200 OK. Server likely ignored Range header. No data appended to avoid duplicates.")
            print("Consider checking server configuration for Range support.")

    elif response.status_code == 416: # 416 Range Not Satisfiable
        print(f"Received 416 Range Not Satisfiable. This likely means the requested byte position ({last_position}) is beyond the current file size ({remote_file_size}).")
        os.remove(local_data_path)
        print(f"Removed file {local_data_path} due to 416 error. Will re-download on next run.")

        # We reset the state. The next scheduled run will attempt a full download.

    else: # Other HTTP errors
        print(f"Received unexpected HTTP status code: {response.status_code}")
        response.raise_for_status() # Raise an HTTPError for other 4xx or 5xx responses

def dl_event(event_type_today):
    event_type, today = event_type_today
    filename = f"{event_type}-{today.strftime('%Y-%m-%d')}.jsonl"
    local_file = DIR_DATA_DUMP + filename
    download_incremental(URL_BASE_EDGALAXYDATA + filename, local_file)
    return event_type
    

def main(today):
    results = ThreadPool(8).imap_unordered(dl_event, [(event_type, today) for event_type in EVENT_TYPES])
    for i, event_type in enumerate(results):
        print(f"Done: {event_type} ({i+1}/{len(EVENT_TYPES)})")
        

if __name__ == "__main__":
    main(dt.date.today())
