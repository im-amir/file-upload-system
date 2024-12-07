export enum FileUploadStatus {
  PENDING = "pending",
  UPLOADING = "uploading",
  PAUSED = "paused",
  COMPLETED = "completed",
  FAILED = "failed",
}

export interface FileUpload {
  id: string;
  file: File;
  name: string;
  size: number;
  progress: number;
  status: FileUploadStatus;
  pausedAt?: number;
}

export interface UploadedFile {
  id: string;
  name: string;
  size: number;
  uploadDate: Date;
  url: string;
}
