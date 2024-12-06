import axios from "axios";
import { UploadedFile } from "../types/file";

export class FileManagerService {
  private static BASE_URL =
    process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api";

  static async fetchUploadedFiles(): Promise<UploadedFile[]> {
    try {
      const response = await axios.get(`${this.BASE_URL}/files`);
      return response.data.files.map((file: any) => ({
        id: file.id,
        name: file.name,
        size: file.size,
        uploadDate: new Date(file.uploadDate),
        url: file.url,
      }));
    } catch (error) {
      console.error("Error fetching uploaded files:", error);
      return [];
    }
  }

  static async downloadFile(fileUrl: string, fileName: string): Promise<void> {
    try {
      const response = await axios.get(fileUrl, {
        responseType: "blob",
      });

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", fileName);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      console.error("File download error:", error);
    }
  }

  static async previewFile(fileUrl: string): Promise<string | null> {
    try {
      const response = await axios.get(fileUrl, {
        responseType: "text",
      });
      return response.data;
    } catch (error) {
      console.error("File preview error:", error);
      return null;
    }
  }
}
