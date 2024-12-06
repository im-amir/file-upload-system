import axios from "axios";
import { UploadedFile } from "../types/file";
import Papa from "papaparse";

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
      const response = await axios.get(`${this.BASE_URL}/download`, {
        params: { url: fileUrl },
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
      throw error;
    }
  }

  static async previewFile(fileUrl: string): Promise<{
    headers: string[];
    rows: any[];
  } | null> {
    try {
      const response = await axios.get(fileUrl, {
        responseType: "text",
      });

      return new Promise((resolve, reject) => {
        Papa.parse(response.data, {
          complete: (results) => {
            if (results.data.length > 0) {
              const headers = results.data[0] as string[];
              const rows = results.data
                .slice(1)
                .map((row: any, index: number) => ({
                  id: index,
                  ...Object.fromEntries(
                    headers.map((header, i) => [header, row[i]])
                  ),
                }));
              resolve({ headers, rows });
            } else {
              resolve(null);
            }
          },
          error: (error) => {
            console.error("CSV parsing error:", error);
            reject(error);
          },
        });
      });
    } catch (error) {
      console.error("File preview error:", error);
      return null;
    }
  }
}
