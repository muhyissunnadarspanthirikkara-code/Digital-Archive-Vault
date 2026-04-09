import { Link } from "wouter";
import { FileIcon, ImageIcon, VideoIcon, FileTextIcon, Download, Trash2, MoreVertical } from "lucide-react";
import { formatBytes, formatDate } from "@/lib/utils";
import type { FileItem } from "@workspace/api-client-react/src/generated/api.schemas";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { useDeleteFile, getListFilesQueryKey, getGetFileStatsQueryKey, getGetRecentFilesQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";

export function FileCard({ file, variant = "grid" }: { file: FileItem, variant?: "grid" | "list" }) {
  const queryClient = useQueryClient();
  const deleteMutation = useDeleteFile();

  const handleDelete = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (confirm("Are you sure you want to delete this file?")) {
      await deleteMutation.mutateAsync({ id: file.id });
      queryClient.invalidateQueries({ queryKey: getListFilesQueryKey() });
      queryClient.invalidateQueries({ queryKey: getGetFileStatsQueryKey() });
      queryClient.invalidateQueries({ queryKey: getGetRecentFilesQueryKey() });
    }
  };

  const handleDownload = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    window.open(`/api/storage${file.objectPath}`, "_blank");
  };

  const getIcon = () => {
    switch (file.fileType) {
      case "image": return <ImageIcon className="w-10 h-10 text-blue-500" />;
      case "video": return <VideoIcon className="w-10 h-10 text-purple-500" />;
      case "document": return <FileTextIcon className="w-10 h-10 text-orange-500" />;
      default: return <FileIcon className="w-10 h-10 text-gray-500" />;
    }
  };

  const getThumbnail = () => {
    if (file.fileType === "image") {
      return (
        <div className="w-full h-32 bg-secondary/50 rounded-t-lg overflow-hidden flex items-center justify-center">
          <img src={`/api/storage${file.objectPath}`} alt={file.name} className="w-full h-full object-cover" />
        </div>
      );
    }
    return (
      <div className="w-full h-32 bg-secondary/30 rounded-t-lg flex flex-col items-center justify-center">
        {getIcon()}
      </div>
    );
  };

  if (variant === "list") {
    return (
      <Link href={`/drive/file/${file.id}`} className="flex items-center gap-4 p-4 border-b border-border hover:bg-muted/50 transition-colors group cursor-pointer">
        <div className="w-10 h-10 rounded bg-secondary flex items-center justify-center shrink-0">
          {file.fileType === "image" ? <ImageIcon className="w-5 h-5 text-blue-500" /> :
           file.fileType === "video" ? <VideoIcon className="w-5 h-5 text-purple-500" /> :
           file.fileType === "document" ? <FileTextIcon className="w-5 h-5 text-orange-500" /> :
           <FileIcon className="w-5 h-5 text-gray-500" />}
        </div>
        <div className="flex-1 min-w-0">
          <h4 className="text-sm font-medium truncate text-foreground">{file.name}</h4>
          <p className="text-xs text-muted-foreground">{formatDate(file.createdAt)}</p>
        </div>
        <div className="text-sm text-muted-foreground w-24 shrink-0 text-right">{formatBytes(file.size)}</div>
        
        <DropdownMenu>
          <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
            <Button variant="ghost" size="icon" className="opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
              <MoreVertical className="w-4 h-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={handleDownload} className="cursor-pointer">
              <Download className="w-4 h-4 mr-2" /> Download
            </DropdownMenuItem>
            <DropdownMenuItem onClick={handleDelete} className="cursor-pointer text-destructive focus:text-destructive">
              <Trash2 className="w-4 h-4 mr-2" /> Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </Link>
    );
  }

  return (
    <Link href={`/drive/file/${file.id}`} className="block border border-border rounded-xl bg-card hover:border-primary/30 hover:shadow-md transition-all group overflow-hidden cursor-pointer relative">
      {getThumbnail()}
      <div className="p-4">
        <h4 className="font-semibold text-sm truncate text-foreground mb-1" title={file.name}>{file.name}</h4>
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>{formatBytes(file.size)}</span>
          <span>{formatDate(file.createdAt)}</span>
        </div>
      </div>
      
      <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
        <DropdownMenu>
          <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
            <Button variant="secondary" size="icon" className="h-8 w-8 bg-background/80 backdrop-blur-sm border border-border hover:bg-background">
              <MoreVertical className="w-4 h-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={handleDownload} className="cursor-pointer">
              <Download className="w-4 h-4 mr-2" /> Download
            </DropdownMenuItem>
            <DropdownMenuItem onClick={handleDelete} className="cursor-pointer text-destructive focus:text-destructive">
              <Trash2 className="w-4 h-4 mr-2" /> Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </Link>
  );
}
