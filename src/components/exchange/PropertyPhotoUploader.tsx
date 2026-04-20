import { useState, useRef, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { Label } from "@/components/ui/label";
import { Upload, X, GripVertical } from "lucide-react";

export interface UploadedPropertyImage {
  storage_path: string;
  file_name: string;
  sort_order: number;
  url: string;
}

interface Props {
  images: UploadedPropertyImage[];
  onChange: (images: UploadedPropertyImage[]) => void;
}

const MAX_PHOTOS = 20;
const ACCEPTED = ".jpg,.jpeg,.png,.webp";
const BUCKET = "property-images";

export default function PropertyPhotoUploader({ images, onChange }: Props) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);
  const [dragIdx, setDragIdx] = useState<number | null>(null);

  const uploadFiles = useCallback(async (files: FileList | File[]) => {
    if (!user) return;
    const fileArr = Array.from(files).slice(0, MAX_PHOTOS - images.length);
    if (fileArr.length === 0) {
      toast({ title: "Limit reached", description: `Maximum ${MAX_PHOTOS} photos.`, variant: "destructive" });
      return;
    }

    setUploading(true);
    const newImages: UploadedPropertyImage[] = [];

    for (const file of fileArr) {
      const ext = file.name.split(".").pop()?.toLowerCase() ?? "jpg";
      const path = `${user.id}/${crypto.randomUUID()}.${ext}`;

      const { error } = await supabase.storage.from(BUCKET).upload(path, file, {
        cacheControl: "3600",
        upsert: false,
      });

      if (error) {
        toast({ title: "Upload failed", description: error.message, variant: "destructive" });
        continue;
      }

      const { data: urlData } = supabase.storage.from(BUCKET).getPublicUrl(path);

      newImages.push({
        storage_path: path,
        file_name: file.name,
        sort_order: images.length + newImages.length,
        url: urlData.publicUrl,
      });
    }

    onChange([...images, ...newImages]);
    setUploading(false);
  }, [user, images, onChange, toast]);

  const removeImage = async (idx: number) => {
    const img = images[idx];
    await supabase.storage.from(BUCKET).remove([img.storage_path]);
    onChange(images.filter((_, i) => i !== idx).map((im, i) => ({ ...im, sort_order: i })));
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer.files.length) uploadFiles(e.dataTransfer.files);
  };

  const handleReorderDrop = (targetIdx: number) => {
    if (dragIdx === null || dragIdx === targetIdx) return;
    const reordered = [...images];
    const [moved] = reordered.splice(dragIdx, 1);
    reordered.splice(targetIdx, 0, moved);
    onChange(reordered.map((img, i) => ({ ...img, sort_order: i })));
    setDragIdx(null);
  };

  return (
    <div className="space-y-4">
      <div
        className={`flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed p-10 transition-colors ${
          dragOver ? "border-primary bg-primary/5" : "border-border hover:border-primary/50"
        }`}
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        onClick={() => fileRef.current?.click()}
      >
        <Upload className="mb-3 h-8 w-8 text-muted-foreground" />
        <p className="text-sm font-medium text-foreground">Drag & drop photos here, or click to browse</p>
        <p className="mt-1 text-xs text-muted-foreground">JPG, PNG, WEBP · Max {MAX_PHOTOS} photos</p>
        <input
          ref={fileRef}
          type="file"
          multiple
          accept={ACCEPTED}
          className="hidden"
          onChange={(e) => e.target.files && uploadFiles(e.target.files)}
        />
      </div>

      {uploading && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          Uploading…
        </div>
      )}

      {images.length > 0 && (
        <div>
          <Label className="mb-2 block">
            {images.length} photo{images.length > 1 ? "s" : ""} · Drag to reorder
          </Label>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
            {images.map((img, idx) => (
              <div
                key={img.storage_path}
                draggable
                onDragStart={() => setDragIdx(idx)}
                onDragOver={(e) => e.preventDefault()}
                onDrop={() => handleReorderDrop(idx)}
                className={`group relative aspect-[4/3] overflow-hidden rounded-lg border bg-muted ${
                  dragIdx === idx ? "opacity-50" : ""
                }`}
              >
                <img src={img.url} alt={img.file_name} className="h-full w-full object-cover" />
                {idx === 0 && (
                  <span className="absolute left-1.5 top-1.5 rounded bg-primary px-1.5 py-0.5 text-[10px] font-semibold text-primary-foreground">Cover</span>
                )}
                <div className="absolute inset-0 flex items-center justify-center bg-black/0 opacity-0 transition-all group-hover:bg-black/30 group-hover:opacity-100">
                  <GripVertical className="h-5 w-5 text-white" />
                </div>
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); removeImage(idx); }}
                  className="absolute right-1.5 top-1.5 rounded-full bg-black/60 p-1 text-white opacity-0 transition-opacity group-hover:opacity-100 hover:bg-black/80"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
