import requests
from fastapi import APIRouter, UploadFile, HTTPException, Query, Form
from app.services.file_service import FileService
from fastapi.responses import StreamingResponse, JSONResponse
import pandas as pd
import numpy as np
import uuid
import asyncio
import json
import os
import io
from app.services.upload_progress import UPLOAD_PROGRESS
from urllib.parse import urlparse


router = APIRouter()
file_service = FileService()

@router.post("/upload/init")
async def init_upload(
    filename: str = Query(...), 
    filesize: int = Query(...), 
    totalChunks: int = Query(...)
):
    upload_id = str(uuid.uuid4())
    return {"uploadId": upload_id}

@router.post("/upload/chunk")
async def upload_chunk(
    file: UploadFile, 
    uploadId: str = Form(...), 
    chunkIndex: int = Form(...)
):
    # Ensure the temp directory exists
    os.makedirs('/tmp', exist_ok=True)
    
    # Create or append to the temp file
    temp_file_path = f'/tmp/{uploadId}'
    
    # Open file in append binary mode
    mode = 'ab' if os.path.exists(temp_file_path) else 'wb'
    with open(temp_file_path, mode) as temp_file:
        chunk_content = await file.read()
        temp_file.write(chunk_content)
    
    return {
        "message": "Chunk uploaded successfully",
        "chunkIndex": chunkIndex
    }

@router.get("/upload/finalize")
async def finalize_upload(uploadId: str = Query(...), filename: str = Query(...)):
    temp_file_path = f'/tmp/{uploadId}'
    file_object = None
    upload_file = None

    try:
        # Check if file exists before opening
        if not os.path.exists(temp_file_path):
            raise HTTPException(status_code=400, detail=f"Temporary file not found: {temp_file_path}")

        # Open file and create UploadFile correctly
        file_object = open(temp_file_path, 'rb')
        file_object.seek(0)
        
        upload_file = UploadFile(file=file_object, filename=filename)
        
        async def upload_generator():
            try:
                # Initial connection message
                yield f"data: {json.dumps({'message': 'Connection established'})}\n\n"

                # Use the generator from upload_file
                upload_generator = file_service.upload_file(upload_file)

                # Flag to track if any progress has been yielded
                progress_yielded = False

                # Iterate through progress updates
                async for progress_update in upload_generator:
                    # Set flag to True
                    progress_yielded = True

                    # Log the progress update for debugging
                    print(f"Yielding progress update: {progress_update}")

                    # Prepare message with SSE format
                    if 'fileUrl' in progress_update:
                        # Final upload complete message
                        final_message = json.dumps({
                            'progress': 100,
                            'complete': True,
                            'fileUrl': progress_update['fileUrl']
                        })
                        yield f"data: {final_message}\n\n"
                        break

                    # Intermediate progress message
                    progress_message = json.dumps({
                        'progress': progress_update.get('progress', 0),
                        'totalParts': progress_update.get('total_parts', 0),
                        'total_size': progress_update.get('total_size', 0)
                    })
                    yield f"data: {progress_message}\n\n"

                # If no progress was yielded, send an error
                if not progress_yielded:
                    error_message = json.dumps({
                        'error': 'No progress updates received'
                    })
                    yield f"data: {error_message}\n\n"

            except Exception as e:
                # Log the full exception for debugging
                import traceback
                traceback.print_exc()

                error_message = json.dumps({
                    'error': str(e),
                    'traceback': traceback.format_exc()
                })
                yield f"data: {error_message}\n\n"

            finally:
                # Ensure file is closed and temporary file is removed
                if file_object:
                    file_object.close()
                if os.path.exists(temp_file_path):
                    os.remove(temp_file_path)

        # Return StreamingResponse with proper headers
        return StreamingResponse(
            upload_generator(),
            media_type="text/event-stream",
            headers={
                "Content-Type": "text/event-stream",
                "Cache-Control": "no-cache",
                "Connection": "keep-open"
            }
        )

    except Exception as e:
        # Log the full exception for debugging
        import traceback
        traceback.print_exc()

        # Ensure file is closed and removed if it exists
        if file_object:
            file_object.close()
        if os.path.exists(temp_file_path):
            os.remove(temp_file_path)

        raise HTTPException(status_code=500, detail=str(e))


@router.get("/files")
async def get_files():
    try:
        files = await file_service.get_files()
        return {"files": files}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/preview")
async def preview_file(
    url: str = Query(...), 
    skip: int = Query(0, ge=0), 
    limit: int = Query(100, ge=1, le=1000)
):
    try:
        parsed_url = urlparse(url)
        s3_key = parsed_url.path.lstrip('/')

        try:
            s3_object = file_service.s3.get_object(
                Bucket=file_service.bucket, 
                Key=s3_key
            )
            
            # Read the body of the S3 object
            body = s3_object['Body'].read().decode('utf-8')
            
            # Use a generator to read file in chunks
            def csv_chunk_reader(content, skip, limit):
                # Convert content to a string IO
                content_io = io.StringIO(content)
                
                # Read the entire DataFrame
                df = pd.read_csv(content_io)
                
                # Apply skip and limit
                start = skip
                end = skip + limit
                
                # Slice the DataFrame
                sliced_df = df.iloc[start:end]
                
                # If it's the first request, return headers
                return {
                    "headers": list(df.columns),
                    "rows": sliced_df.to_dict(orient="records"),
                    "total_rows": len(df)
                }
            
            # Process the chunk
            preview_data = csv_chunk_reader(body, skip, limit)
            
            return preview_data
        
        except file_service.s3.exceptions.NoSuchKey:
            raise HTTPException(status_code=404, detail="File not found in S3")
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error previewing file: {str(e)}")

@router.get("/download")
async def download_file(url: str = Query(...)):
    try:
        # Use file_service to generate pre-signed URL
        download_url = await file_service.download_file(url)
        
        # Extract filename from the original URL
        filename = url.split('/')[-1]
        
        return {
            "downloadUrl": download_url,
            "filename": filename
        }
    except Exception as e:
        print(f"Error preparing download: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error preparing download: {str(e)}")
