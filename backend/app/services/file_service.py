import boto3
from fastapi import UploadFile
import os
import io
from botocore.exceptions import ClientError
from dotenv import load_dotenv
load_dotenv()

class FileService:
    def __init__(self):
        self.s3 = boto3.client(
            's3',
            aws_access_key_id=os.getenv('AWS_ACCESS_KEY_ID'),
            aws_secret_access_key=os.getenv('AWS_SECRET_ACCESS_KEY'),
            region_name=os.getenv('AWS_REGION')
        )
        self.bucket = os.getenv('AWS_BUCKET_NAME')
        print(f"Initialized S3 client with bucket: {self.bucket}")

    async def upload_file(self, file, filename: str) -> str:
        try:
            # Check if file is a file-like object or bytes
            if hasattr(file, 'read'):
                # If it's a file-like object, read its contents
                file_contents = file.read()
                if isinstance(file_contents, bytes):
                    file_obj = io.BytesIO(file_contents)
                else:
                    file_obj = io.BytesIO(file_contents.encode())
            elif isinstance(file, bytes):
                # If it's already bytes, create BytesIO
                file_obj = io.BytesIO(file)
            else:
                raise ValueError("Unsupported file type")
            
            key = f'uploads/{filename}'
            self.s3.upload_fileobj(
                file_obj,
                self.bucket,
                key,
                ExtraArgs={'ContentType': 'text/csv'}
            )
            
            url = f"https://{self.bucket}.s3.{os.getenv('AWS_REGION')}.amazonaws.com/{key}"
            return url
        except Exception as e:
            raise Exception(f"Error uploading file: {str(e)}")

    async def upload_large_file(self, file: UploadFile) -> str:
        try:
            # Initiate multipart upload
            multipart_upload = self.s3.create_multipart_upload(
                Bucket=self.bucket,
                Key=f'uploads/{file.filename}',
                ContentType='text/csv'
            )
            upload_id = multipart_upload['UploadId']
            
            # Track uploaded parts
            parts = []
            part_number = 1
            
            # Read file in chunks (e.g., 10MB chunks)
            while chunk := await file.read(10 * 1024 * 1024):
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
            
            # Complete multipart upload
            self.s3.complete_multipart_upload(
                Bucket=self.bucket,
                Key=f'uploads/{file.filename}',
                UploadId=upload_id,
                MultipartUpload={'Parts': parts}
            )
            
            # Generate file URL
            url = f"https://{self.bucket}.s3.{os.getenv('AWS_REGION')}.amazonaws.com/uploads/{file.filename}"
            return url
        
        except Exception as e:
            # Abort multipart upload in case of failure
            if 'upload_id' in locals():
                self.s3.abort_multipart_upload(
                    Bucket=self.bucket,
                    Key=f'uploads/{file.filename}',
                    UploadId=upload_id
                )
            raise Exception(f"Error uploading large file: {str(e)}")

    async def get_files(self):
        try:
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
