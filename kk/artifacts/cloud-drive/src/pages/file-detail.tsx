import { useRoute, Link, Redirect } from "wouter";
import { Show } from "@clerk/react";
import { ArrowLeft, Download, Trash2, FileIcon, ImageIcon, VideoIcon, FileTextIcon, Calendar, HardDrive, FileType } from "lucide-react";
import { Layout } from "@/components/layout";
import { Button } from "@/components/ui/button";
import { useGetFile, useDeleteFile, getGetFileQueryKey } from "@workspace/api-client-react";
import { formatBytes, formatDate } from "@/lib/utils";
import { useLocation } from "wouter";
import { Skeleton } from "@/components/ui/skeleton";

export function FileDetail() {
  const [, params] = useRoute("/drive/file/:id");
  const [, setLocation] = useLocation();
  const fileId = params?.id ? parseInt(params.id) : 0;
  
  const { data: file, isLoading } = useGetFile(fileId, {
    query: { queryKey: getGetFileQueryKey(fileId), enabled: !!fileId }
  });
  
  const deleteMutation = useDeleteFile();

  const handleDelete = async () => {
    if (confirm("Are you sure you want to delete this file?")) {
      await deleteMutation.mutateAsync({ id: fileId });
      setLocation("/drive");
    }
  };

  const handleDownload = () => {
    if (file) {
      window.open(`/api/storage${file.objectPath}`, "_blank");
    }
  };

  const getIcon = () => {
    if (!file) return null;
    switch (file.fileType) {
      case "image": return <ImageIcon className="w-16 h-16 text-blue-500" />;
      case "video": return <VideoIcon className="w-16 h-16 text-purple-500" />;
      case "document": return <FileTextIcon className="w-16 h-16 text-orange-500" />;
      default: return <FileIcon className="w-16 h-16 text-gray-500" />;
    }
  };

  return (
    <>
      <Show when="signed-out">
        <Redirect to="/" />
      </Show>
      
      <Show when="signed-in">
        <Layout>
          <div className="flex-1 max-w-5xl mx-auto w-full p-6">
            
            <div className="flex items-center justify-between mb-8">
              <Link href="/drive">
                <Button variant="ghost" className="gap-2 text-muted-foreground hover:text-foreground">
                  <ArrowLeft className="w-4 h-4" /> Back to Drive
                </Button>
              </Link>
              
              {file && (
                <div className="flex gap-2">
                  <Button variant="outline" onClick={handleDownload} className="gap-2">
                    <Download className="w-4 h-4" /> Download
                  </Button>
                  <Button variant="destructive" onClick={handleDelete} className="gap-2">
                    <Trash2 className="w-4 h-4" /> Delete
                  </Button>
                </div>
              )}
            </div>

            {isLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <div className="md:col-span-2 bg-card border border-border rounded-xl aspect-video w-full p-8 flex items-center justify-center">
                  <Skeleton className="w-full h-full rounded-lg" />
                </div>
                <div className="space-y-6">
                  <Skeleton className="h-8 w-3/4" />
                  <Skeleton className="h-32 w-full" />
                </div>
              </div>
            ) : file ? (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                
                {/* Preview Area */}
                <div className="md:col-span-2 bg-card border border-border rounded-xl overflow-hidden flex items-center justify-center min-h-[400px] shadow-sm relative group">
                  {file.fileType === "image" ? (
                    <img 
                      src={`/api/storage${file.objectPath}`} 
                      alt={file.name} 
                      className="max-w-full max-h-[70vh] object-contain"
                    />
                  ) : file.fileType === "video" ? (
                    <video 
                      src={`/api/storage${file.objectPath}`} 
                      controls 
                      className="max-w-full max-h-[70vh]"
                    />
                  ) : (
                    <div className="flex flex-col items-center justify-center p-12 text-center">
                      <div className="w-32 h-32 rounded-full bg-secondary flex items-center justify-center mb-6">
                        {getIcon()}
                      </div>
                      <h3 className="text-xl font-medium mb-2">No Preview Available</h3>
                      <p className="text-muted-foreground mb-6">This file type cannot be previewed in the browser.</p>
                      <Button onClick={handleDownload}>Download to View</Button>
                    </div>
                  )}
                </div>

                {/* Details Area */}
                <div className="flex flex-col gap-6">
                  <div>
                    <h1 className="text-2xl font-bold text-foreground break-words">{file.name}</h1>
                    <p className="text-muted-foreground mt-2 flex items-center gap-2">
                      <Calendar className="w-4 h-4" /> Added {formatDate(file.createdAt)}
                    </p>
                  </div>
                  
                  <div className="bg-card border border-border rounded-xl p-5 space-y-4 shadow-sm">
                    <h3 className="font-semibold text-lg border-b border-border pb-2">Information</h3>
                    
                    <div className="grid grid-cols-3 gap-y-4 text-sm">
                      <div className="text-muted-foreground flex items-center gap-2">
                        <HardDrive className="w-4 h-4" /> Size
                      </div>
                      <div className="col-span-2 font-medium">{formatBytes(file.size)}</div>
                      
                      <div className="text-muted-foreground flex items-center gap-2">
                        <FileType className="w-4 h-4" /> Type
                      </div>
                      <div className="col-span-2 font-medium capitalize">{file.fileType}</div>
                      
                      <div className="text-muted-foreground flex items-center gap-2">
                        <FileTextIcon className="w-4 h-4" /> MIME
                      </div>
                      <div className="col-span-2 font-medium break-all">{file.contentType}</div>
                    </div>
                  </div>
                  
                  <div className="bg-primary/5 border border-primary/10 rounded-xl p-5">
                    <p className="text-sm text-primary flex items-start gap-2">
                      <Shield className="w-5 h-5 shrink-0 text-accent" />
                      This file is securely stored in your personal vault and is only accessible by you.
                    </p>
                  </div>
                </div>
                
              </div>
            ) : (
              <div className="text-center py-20">
                <h2 className="text-2xl font-bold mb-2">File not found</h2>
                <p className="text-muted-foreground">The file you're looking for doesn't exist or you don't have access.</p>
                <Link href="/drive">
                  <Button className="mt-6">Return to Drive</Button>
                </Link>
              </div>
            )}
            
          </div>
        </Layout>
      </Show>
    </>
  );
}
