import { useState, useCallback, useRef } from "react";
import { UploadCloud, File as FileIcon, X, Loader2 } from "lucide-react";
import { useRequestUploadUrl, useCreateFile, getListFilesQueryKey, getGetFileStatsQueryKey, getGetRecentFilesQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";

export function UploadZone() {
  const [isDragging, setIsDragging] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  const queryClient = useQueryClient();
  const requestUrl = useRequestUploadUrl();
  const createFile = useCreateFile();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleUpload = async (file: File) => {
    try {
      setError(null);
      setUploadProgress(10);
      
      // Determine file type category
      let fileType: "image" | "video" | "document" | "other" = "other";
      if (file.type.startsWith("image/")) fileType = "image";
      else if (file.type.startsWith("video/")) fileType = "video";
      else if (file.type.includes("pdf") || file.type.includes("document") || file.type.includes("text")) fileType = "document";

      // 1. Request presigned URL
      const { uploadURL, objectPath } = await requestUrl.mutateAsync({
        data: {
          name: file.name,
          size: file.size,
          contentType: file.type || "application/octet-stream",
        }
      });
      
      setUploadProgress(30);

      // 2. Upload directly to GCS via XMLHttpRequest to track progress
      await new Promise<void>((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.open("PUT", uploadURL, true);
        xhr.setRequestHeader("Content-Type", file.type || "application/octet-stream");
        
        xhr.upload.onprogress = (e) => {
          if (e.lengthComputable) {
            const percentComplete = 30 + Math.round((e.loaded / e.total) * 60);
            setUploadProgress(percentComplete);
          }
        };
        
        xhr.onload = () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            resolve();
          } else {
            reject(new Error("Upload to storage failed"));
          }
        };
        
        xhr.onerror = () => reject(new Error("Upload request failed"));
        xhr.send(file);
      });
      
      setUploadProgress(95);

      // 3. Create file record
      await createFile.mutateAsync({
        data: {
          name: file.name,
          size: file.size,
          contentType: file.type || "application/octet-stream",
          fileType,
          objectPath
        }
      });

      setUploadProgress(100);
      
      // Invalidate queries
      queryClient.invalidateQueries({ queryKey: getListFilesQueryKey() });
      queryClient.invalidateQueries({ queryKey: getGetFileStatsQueryKey() });
      queryClient.invalidateQueries({ queryKey: getGetRecentFilesQueryKey() });

      setTimeout(() => {
        setUploadProgress(null);
      }, 1000);
      
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Failed to upload file");
      setUploadProgress(null);
    }
  };

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleUpload(e.dataTransfer.files[0]);
    }
  }, []);

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      handleUpload(e.target.files[0]);
      e.target.value = ""; // Reset input
    }
  };

  return (
    <div className="w-full mb-8">
      <div
        className={cn(
          "w-full border-2 border-dashed rounded-xl p-8 flex flex-col items-center justify-center transition-all relative overflow-hidden group",
          isDragging ? "border-accent bg-accent/5 scale-[1.01]" : "border-border hover:border-primary/50 bg-card hover:bg-card/80",
          uploadProgress !== null && "pointer-events-none opacity-80"
        )}
        onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
        onDragLeave={(e) => { e.preventDefault(); setIsDragging(false); }}
        onDrop={onDrop}
      >
        <input 
          type="file" 
          className="hidden" 
          ref={fileInputRef} 
          onChange={onFileChange}
        />
        
        {uploadProgress !== null ? (
          <div className="flex flex-col items-center w-full max-w-sm">
            <Loader2 className="w-10 h-10 text-accent animate-spin mb-4" />
            <h3 className="text-lg font-semibold mb-2">Uploading...</h3>
            <Progress value={uploadProgress} className="w-full h-2" />
            <span className="text-sm text-muted-foreground mt-2">{uploadProgress}%</span>
          </div>
        ) : (
          <>
            <div className="w-16 h-16 rounded-full bg-primary/5 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <UploadCloud className="w-8 h-8 text-primary" />
            </div>
            <h3 className="text-lg font-bold mb-1">Upload a file</h3>
            <p className="text-sm text-muted-foreground mb-6 text-center max-w-md">
              Drag and drop your file here, or click to browse. Your files are encrypted and stored safely.
            </p>
            <Button onClick={() => fileInputRef.current?.click()} className="bg-primary text-primary-foreground hover:bg-primary/90">
              Browse Files
            </Button>
          </>
        )}
        
        {error && (
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-destructive text-destructive-foreground px-4 py-2 rounded-md text-sm font-medium flex items-center gap-2 shadow-lg">
            <X className="w-4 h-4" />
            {error}
          </div>
        )}
      </div>
    </div>
  );
}
