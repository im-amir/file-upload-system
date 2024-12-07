import boto3
from fastapi import UploadFile
import os
import io
import math
from botocore.exceptions import ClientError
from dotenv import load_dotenv
from app.services.upload_progress import UPLOAD_PROGRESS
from typing import AsyncGenerator


load_dotenv()

S3_SIZE_LIMIT = 5 * 1024 * 1024  # 5MB

class FileService:
    def __init__(self):
        self.s3 = boto3.client(
            's3',
            aws_access_key_id=os.getenv('AWS_ACCESS_KEY_ID'),
            aws_secret_access_key=os.getenv('AWS_SECRET_ACCESS_KEY'),
            region_name=os.getenv('AWS_REGION'),
            config=boto3.session.Config(s3={'use_accelerate_endpoint': True})
        )
        self.bucket = os.getenv('AWS_BUCKET_NAME')
        self.upload_states = {}  # Track upload states

    async def upload_file(self, file: UploadFile, upload_id: str = None) -> AsyncGenerator:
   
        try:
            file_content = await file.read()
            total_size = len(file_content)
            uploaded_size = 0

            # Small file upload (less than 5MB)
            if total_size < 5 * 1024 * 1024:
                print(f"File is small ({total_size} bytes). Using simple upload.")
                file_obj = io.BytesIO(file_content)
                key = f'uploads/{file.filename}'
                
                self.s3.upload_fileobj(
                    file_obj,
                    self.bucket,
                    key,
                    ExtraArgs={'ContentType': 'text/csv'}
                )
                
                url = f"https://{self.bucket}.s3.{os.getenv('AWS_REGION')}.amazonaws.com/{key}"
                
                yield {
                    'progress': 100,
                    'total_parts': 1,
                    'fileUrl': url
                }
                return

            # Multipart upload for larger files
            multipart_upload = self.s3.create_multipart_upload(
                Bucket=self.bucket,
                Key=f'uploads/{file.filename}',
                ContentType='text/csv'
            )
            upload_id = multipart_upload['UploadId']

            parts = []
            part_number = 1
            chunk_size = max(5 * 1024 * 1024, math.ceil(total_size / 10000))

            yield {'total_size': total_size}

            # Chunk upload process
            for i in range(0, total_size, chunk_size):
                chunk = file_content[i:i + chunk_size]
                uploaded_size += len(chunk)

                part = self.s3.upload_part(
                    Bucket=self.bucket,
                    Key=f'uploads/{file.filename}',
                    PartNumber=part_number,
                    UploadId=upload_id,
                    Body=chunk
                )

                parts.append({
                    'PartNumber': part_number,
                    'ETag': part['ETag']
                })
                part_number += 1

                progress = (uploaded_size / total_size) * 100
                print(f"S3 Upload Progress: {progress:.2f}%")

                yield {
                    'progress': progress,
                    'total_parts': part_number - 1,
                    'total_size': total_size,
                }

            # Complete multipart upload
            self.s3.complete_multipart_upload(
                Bucket=self.bucket,
                Key=f'uploads/{file.filename}',
                UploadId=upload_id,
                MultipartUpload={'Parts': parts}
            )

            url = f"https://{self.bucket}.s3.{os.getenv('AWS_REGION')}.amazonaws.com/uploads/{file.filename}"
            print(f"Yielding final URL: {url}")

            yield {
                'progress': 100,
                'total_parts': part_number - 1,
                'fileUrl': url
            }

        except Exception as e:
            traceback.print_exc()
            
            # Abort multipart upload if it was initiated
            if 'upload_id' in locals():
                try:
                    self.s3.abort_multipart_upload(
                        Bucket=self.bucket,
                        Key=f'uploads/{file.filename}',
                        UploadId=upload_id
                    )
                except Exception as abort_error:
                    print(f"Error aborting multipart upload: {abort_error}")
            
            raise Exception(f"Error uploading large file: {str(e)}")

    async def cancel_upload(self, upload_id: str, filename: str) -> bool:
        try:
            # Abort the multipart upload
            self.s3.abort_multipart_upload(
                Bucket=self.bucket,
                Key=f'uploads/{filename}',
                UploadId=upload_id
            )
            return True
        except Exception as e:
            print(f"Error cancelling upload: {str(e)}")
            return False
    async def get_files(self):
        try:
            # Add more detailed logging and error handling
            print(f"Attempting to list objects in bucket: {self.bucket}")
            
            # Use paginator to handle large number of objects
            paginator = self.s3.get_paginator('list_objects_v2')
            page_iterator = paginator.paginate(
                Bucket=self.bucket, 
                Prefix='uploads/'
            )
            
            files = []
            for page in page_iterator:
                # Check if 'Contents' key exists in the page
                if 'Contents' in page:
                    for obj in page['Contents']:
                        # Additional checks to prevent NoneType errors
                        if obj and 'Key' in obj:
                            try:
                                url = f"https://{self.bucket}.s3.{os.getenv('AWS_REGION')}.amazonaws.com/{obj['Key']}"
                                files.append({
                                    'id': obj.get('Key', 'Unknown'),
                                    'name': obj['Key'].split('/')[-1],
                                    'size': obj.get('Size', 0),
                                    'uploadDate': obj.get('LastModified', None),
                                    'url': url
                                })
                            except Exception as item_error:
                                print(f"Error processing file {obj.get('Key', 'Unknown')}: {str(item_error)}")
                
            # Debug print
            print(f"Total files found: {len(files)}")
            
            return files
        except ClientError as e:
            # Specific AWS S3 error handling
            error_code = e.response['Error']['Code']
            error_message = e.response['Error']['Message']
            print(f"AWS S3 Error - Code: {error_code}, Message: {error_message}")
            raise Exception(f"S3 Error fetching files: {error_message}")
        except Exception as e:
            # Catch-all for any other unexpected errors
            print(f"Unexpected error in get_files: {str(e)}")
            raise Exception(f"Error fetching files: {str(e)}")
