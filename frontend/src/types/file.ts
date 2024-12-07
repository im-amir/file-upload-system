export enum FileUploadStatus {
  PENDING = "pending",
  UPLOADING = "uploading",
  COMPLETED = "completed",
  FAILED = "failed",
  CANCELLED = "cancelled",
}

export interface FileUpload {
  id: string;
  file: File;
  name: string;
  size: number;
  status: FileUploadStatus;
  progress: number;
}

export interface UploadedFile {
  id: string;
  name: string;
  size: number;
  uploadDate: Date;
  url: string;
}
