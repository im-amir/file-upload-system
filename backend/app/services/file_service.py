import boto3
from fastapi import UploadFile
import os
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
        print(f"Initialized S3 client with bucket: {self.bucket} {os.getenv('AWS_ACCESS_KEY_ID')}")

    async def upload_file(self, file: UploadFile) -> str:
        try:
            contents = await file.read()
            key = f'uploads/{file.filename}'
            self.s3.put_object(
                Bucket=self.bucket,
                Key=key,
                Body=contents,
                ContentType='text/csv'
            )
            url = f"https://{self.bucket}.s3.{os.getenv('AWS_REGION')}.amazonaws.com/{key}"
            return url
        except Exception as e:
            raise Exception(f"Error uploading file: {str(e)}")

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
