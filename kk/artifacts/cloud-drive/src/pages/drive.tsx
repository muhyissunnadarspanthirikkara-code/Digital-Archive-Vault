import { useState } from "react";
import { Redirect, Link } from "wouter";
import { Show } from "@clerk/react";
import { Search, Filter, LayoutGrid, List as ListIcon, Loader2, Shield } from "lucide-react";
import { Layout } from "@/components/layout";
import { UploadZone } from "@/components/upload-zone";
import { FileCard } from "@/components/file-card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useListFiles, useGetFileStats, useGetRecentFiles, getListFilesQueryKey } from "@workspace/api-client-react";
import { formatBytes } from "@/lib/utils";
import type { ListFilesType } from "@workspace/api-client-react/src/generated/api.schemas";
import { Skeleton } from "@/components/ui/skeleton";

export function Drive() {
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState<ListFilesType | "all">("all");

  const queryParams = {
    search: searchQuery || undefined,
    type: filterType === "all" ? undefined : filterType,
  };

  const { data: files, isLoading: isLoadingFiles } = useListFiles(queryParams, {
    query: { queryKey: getListFilesQueryKey(queryParams) }
  });
  
  const { data: stats, isLoading: isLoadingStats } = useGetFileStats();
  const { data: recentFiles, isLoading: isLoadingRecent } = useGetRecentFiles();

  return (
    <>
      <Show when="signed-out">
        <Redirect to="/" />
      </Show>
      
      <Show when="signed-in">
        <Layout>
          <div className="flex-1 p-6 max-w-7xl mx-auto w-full grid grid-cols-1 lg:grid-cols-4 gap-8">
            
            {/* Main Content Area */}
            <div className="lg:col-span-3 flex flex-col gap-6">
              
              <UploadZone />
              
              <div className="flex flex-col sm:flex-row items-center gap-4 justify-between bg-card p-4 rounded-xl border border-border">
                <div className="relative w-full sm:w-72">
                  <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                  <Input 
                    placeholder="Search files..." 
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9 bg-background"
                  />
                </div>
                
                <div className="flex items-center gap-2 w-full sm:w-auto">
                  <div className="flex bg-background border border-border rounded-lg p-1">
                    {(["all", "image", "video", "document"] as const).map((type) => (
                      <button
                        key={type}
                        onClick={() => setFilterType(type as any)}
                        className={`px-3 py-1 text-xs font-medium rounded-md capitalize transition-colors ${filterType === type ? 'bg-primary text-primary-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'}`}
                      >
                        {type}
                      </button>
                    ))}
                  </div>
                  
                  <div className="h-6 w-px bg-border mx-2 hidden sm:block"></div>
                  
                  <div className="flex bg-background border border-border rounded-lg p-1 shrink-0">
                    <button
                      onClick={() => setViewMode("grid")}
                      className={`p-1.5 rounded-md transition-colors ${viewMode === "grid" ? 'bg-muted text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
                    >
                      <LayoutGrid className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setViewMode("list")}
                      className={`p-1.5 rounded-md transition-colors ${viewMode === "list" ? 'bg-muted text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
                    >
                      <ListIcon className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>

              <div className="flex-1">
                <h2 className="text-xl font-bold mb-4">My Files</h2>
                
                {isLoadingFiles ? (
                  <div className={viewMode === "grid" ? "grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4" : "flex flex-col gap-2"}>
                    {[1, 2, 3, 4, 5, 6].map(i => (
                      viewMode === "grid" 
                        ? <Skeleton key={i} className="h-48 w-full rounded-xl" />
                        : <Skeleton key={i} className="h-16 w-full rounded-xl" />
                    ))}
                  </div>
                ) : files && files.length > 0 ? (
                  <div className={viewMode === "grid" ? "grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4" : "flex flex-col gap-2 bg-card rounded-xl border border-border overflow-hidden"}>
                    {files.map(file => (
                      <FileCard key={file.id} file={file} variant={viewMode} />
                    ))}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-20 text-center bg-card rounded-xl border border-border border-dashed">
                    <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
                      <Search className="w-8 h-8 text-muted-foreground" />
                    </div>
                    <h3 className="text-lg font-semibold text-foreground">No files found</h3>
                    <p className="text-muted-foreground mt-1">Try adjusting your search or upload a new file.</p>
                  </div>
                )}
              </div>
            </div>

            {/* Sidebar Area */}
            <div className="flex flex-col gap-6">
              <div className="bg-card rounded-xl border border-border p-6 shadow-sm">
                <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
                  <Shield className="w-5 h-5 text-accent" /> Storage
                </h3>
                
                {isLoadingStats ? (
                  <div className="space-y-4">
                    <Skeleton className="h-8 w-full" />
                    <Skeleton className="h-2 w-full" />
                    <div className="space-y-2 mt-4">
                      <Skeleton className="h-4 w-full" />
                      <Skeleton className="h-4 w-full" />
                    </div>
                  </div>
                ) : stats ? (
                  <>
                    <div className="mb-2">
                      <span className="text-3xl font-bold text-foreground">{formatBytes(stats.totalSize)}</span>
                      <span className="text-muted-foreground ml-2">used</span>
                    </div>
                    <div className="h-2 w-full bg-muted rounded-full overflow-hidden mb-6 flex">
                      <div className="h-full bg-blue-500" style={{ width: `${Math.max(5, (stats.imageCount / stats.totalFiles) * 100 || 0)}%` }} />
                      <div className="h-full bg-purple-500" style={{ width: `${Math.max(5, (stats.videoCount / stats.totalFiles) * 100 || 0)}%` }} />
                      <div className="h-full bg-orange-500" style={{ width: `${Math.max(5, (stats.documentCount / stats.totalFiles) * 100 || 0)}%` }} />
                      <div className="h-full bg-gray-400" style={{ width: `${Math.max(5, (stats.otherCount / stats.totalFiles) * 100 || 0)}%` }} />
                    </div>
                    
                    <div className="space-y-3 text-sm">
                      <div className="flex justify-between items-center">
                        <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-blue-500" /> <span className="text-muted-foreground">Images</span></div>
                        <span className="font-medium">{stats.imageCount}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-purple-500" /> <span className="text-muted-foreground">Videos</span></div>
                        <span className="font-medium">{stats.videoCount}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-orange-500" /> <span className="text-muted-foreground">Documents</span></div>
                        <span className="font-medium">{stats.documentCount}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-gray-400" /> <span className="text-muted-foreground">Other</span></div>
                        <span className="font-medium">{stats.otherCount}</span>
                      </div>
                    </div>
                    
                    <div className="mt-6 pt-4 border-t border-border flex justify-between text-sm">
                      <span className="text-muted-foreground">Total files</span>
                      <span className="font-bold text-foreground">{stats.totalFiles}</span>
                    </div>
                  </>
                ) : null}
              </div>

              <div className="bg-card rounded-xl border border-border p-6 shadow-sm flex-1">
                <h3 className="font-bold text-lg mb-4">Recent</h3>
                
                <div className="space-y-4">
                  {isLoadingRecent ? (
                    [1, 2, 3].map(i => <Skeleton key={i} className="h-12 w-full rounded-lg" />)
                  ) : recentFiles && recentFiles.length > 0 ? (
                    recentFiles.slice(0, 5).map(file => (
                      <Link key={file.id} href={`/drive/file/${file.id}`} className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50 transition-colors group cursor-pointer">
                        <div className="w-8 h-8 rounded bg-secondary flex items-center justify-center shrink-0">
                          {file.fileType === "image" ? <div className="w-4 h-4 bg-blue-500 rounded-sm" /> :
                           file.fileType === "video" ? <div className="w-4 h-4 bg-purple-500 rounded-sm" /> :
                           file.fileType === "document" ? <div className="w-4 h-4 bg-orange-500 rounded-sm" /> :
                           <div className="w-4 h-4 bg-gray-500 rounded-sm" />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate text-foreground leading-tight group-hover:text-primary transition-colors">{file.name}</p>
                          <p className="text-xs text-muted-foreground">{formatBytes(file.size)}</p>
                        </div>
                      </Link>
                    ))
                  ) : (
                    <p className="text-sm text-muted-foreground text-center py-4">No recent files</p>
                  )}
                </div>
              </div>
            </div>
            
          </div>
        </Layout>
      </Show>
    </>
  );
}
