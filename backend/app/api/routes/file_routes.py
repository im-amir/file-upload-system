import requests
from fastapi import APIRouter, UploadFile, HTTPException, Query
from app.services.file_service import FileService
from fastapi.responses import StreamingResponse

router = APIRouter()
file_service = FileService()

@router.post("/upload")
async def upload_file(file: UploadFile):
    if not file.filename.endswith('.csv'):
        raise HTTPException(status_code=400, detail="Only CSV files are allowed")
    
    try:
        file_url = await file_service.upload_file(file)
        return {"fileUrl": file_url}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/files")
async def get_files():
    try:
        files = await file_service.get_files()
        return {"files": files}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/download")
async def download_file(url: str = Query(...)):
    try:
        response = requests.get(url)
        
        if response.status_code != 200:
            raise HTTPException(status_code=404, detail="File not found")
        
        return StreamingResponse(
            response.iter_content(chunk_size=8192), 
            media_type='application/octet-stream',
            headers={
                "Content-Disposition": f"attachment; filename={url.split('/')[-1]}"
            }
        )
    except Exception as e:
        print(f"Error downloading file: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error downloading file: {str(e)}")


@router.get("/preview")
async def preview_file(url: str = Query(...)):
    try:
        # Fetch the file from S3
        response = requests.get(url)
        
        # Check if the request was successful
        if response.status_code != 200:
            raise HTTPException(status_code=404, detail="File not found")
        
        # Return file content
        return response.text
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error previewing file: {str(e)}")