import io
import os
import requests
from fastapi import APIRouter, UploadFile, HTTPException, Query, Form
from app.services.file_service import FileService
from fastapi.responses import StreamingResponse, JSONResponse
import pandas as pd
import numpy as np
import uuid

router = APIRouter()
file_service = FileService()
# In-memory upload tracking (consider using Redis in production)
UPLOAD_TRACKING = {}

@router.post("/upload/init")
async def init_upload(
    filename: str = Query(...), 
    filesize: int = Query(...), 
    totalChunks: int = Query(...)
):
    upload_id = str(uuid.uuid4())
    UPLOAD_TRACKING[upload_id] = {
        'filename': filename,
        'filesize': filesize,
        'total_chunks': totalChunks,
        'uploaded_chunks': [],
        'temp_path': f'/tmp/{upload_id}'
    }
    return {"uploadId": upload_id}

@router.post("/upload/chunk")
async def upload_chunk(
    file: UploadFile, 
    uploadId: str = Form(...), 
    chunkIndex: int = Form(...)
):
    if uploadId not in UPLOAD_TRACKING:
        raise HTTPException(status_code=400, detail="Invalid upload ID")

    upload_info = UPLOAD_TRACKING[uploadId]
    
    # Ensure temp directory exists
    os.makedirs(os.path.dirname(upload_info['temp_path']), exist_ok=True)

    # Save chunk
    chunk_path = f"{upload_info['temp_path']}_chunk_{chunkIndex}"
    with open(chunk_path, 'wb') as chunk_file:
        chunk_file.write(await file.read())

    upload_info['uploaded_chunks'].append(chunkIndex)
    return {"message": "Chunk uploaded successfully"}

@router.post("/upload/finalize")
async def finalize_upload(uploadId: str = Query(...), 
    filename: str = Query(...)):
    if uploadId not in UPLOAD_TRACKING:
        raise HTTPException(status_code=400, detail="Invalid upload ID")

    upload_info = UPLOAD_TRACKING[uploadId]

    # Combine chunks
    with open(upload_info['temp_path'], 'wb') as final_file:
        for i in range(upload_info['total_chunks']):
            chunk_path = f"{upload_info['temp_path']}_chunk_{i}"
            with open(chunk_path, 'rb') as chunk_file:
                final_file.write(chunk_file.read())
            os.remove(chunk_path)  # Clean up chunk

    # Upload to S3
    with open(upload_info['temp_path'], 'rb') as file:
        file_url = await file_service.upload_file(file, filename)

    # Clean up
    os.remove(upload_info['temp_path'])
    del UPLOAD_TRACKING[uploadId]

    return {"fileUrl": file_url}


@router.get("/files")
async def get_files():
    try:
        files = await file_service.get_files()
        return {"files": files}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


import io
import requests
from fastapi import APIRouter, UploadFile, HTTPException, Query
from fastapi.responses import StreamingResponse, JSONResponse
import pandas as pd
import numpy as np

@router.get("/preview")
async def preview_file(
    url: str = Query(...), 
    skip: int = Query(0, ge=0), 
    limit: int = Query(100, ge=1, le=1000)
):
    try:
        # Use streaming approach with requests
        response = requests.get(url, stream=True)
        
        if response.status_code != 200:
            raise HTTPException(status_code=404, detail="File not found")
        
        # Use a generator to read file in chunks
        def csv_chunk_reader(response, skip, limit):
            # Convert response content to a string IO
            content = io.StringIO(response.text)
            
            # Use pandas to read CSV in chunks
            df_iterator = pd.read_csv(
                content, 
                skiprows=skip, 
                chunksize=limit
            )
            
            # Get the first chunk
            try:
                df = next(df_iterator)
                return {
                    "headers": list(df.columns),
                    "rows": df.to_dict(orient="records"),
                    "total_rows": len(df)
                }
            except StopIteration:
                return {
                    "headers": [],
                    "rows": [],
                    "total_rows": 0
                }
        
        # Process the chunk
        preview_data = csv_chunk_reader(response, skip, limit)
        
        return preview_data
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error previewing file: {str(e)}")

@router.get("/download")
async def download_file(url: str = Query(...)):
    try:
        # Stream the download in chunks
        response = requests.get(url, stream=True)
        
        if response.status_code != 200:
            raise HTTPException(status_code=404, detail="File not found")
        
        return StreamingResponse(
            response.iter_content(chunk_size=1024 * 1024),  # 1MB chunks 
            media_type='application/octet-stream',
            headers={
                "Content-Disposition": f"attachment; filename={url.split('/')[-1]}"
            }
        )
    except Exception as e:
        print(f"Error downloading file: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error downloading file: {str(e)}")
