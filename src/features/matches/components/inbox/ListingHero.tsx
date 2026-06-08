import { useState } from "react";
import { MapPin, Images, X } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Dialog, DialogContent, DialogTitle,
} from "@/components/ui/dialog";
import type { Relationship } from "@/features/matches/hooks/useUnifiedRelationships";
import { propertyImages } from "./propertyImage";

interface Props {
  rel: Relationship;
  totalPhotos?: number;
}

export function ListingHero({ rel, totalPhotos = 40 }: Props) {
  const gallery = propertyImages(rel.propertyImageUrl, rel.id, 8);
  const [active, setActive] = useState(0);
  const [galleryOpen, setGalleryOpen] = useState(false);
  const fullGallery = propertyImages(rel.propertyImageUrl, rel.id, totalPhotos);

  return (
    <>
      <div className="relative w-full overflow-hidden bg-muted">
        <div className="relative aspect-[16/9] w-full sm:aspect-[21/9]">
          <img
            src={gallery[active]}
            alt={rel.propertyName}
            className="h-full w-full object-cover"
          />
          <div className="absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-black/40 to-transparent" />
          <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-black/70 to-transparent" />

          <div className="absolute left-5 top-5 flex flex-wrap gap-2">
            <span className="inline-flex items-center rounded-full bg-primary px-3 py-1 text-xs font-semibold text-primary-foreground shadow">
              Matched
            </span>
            <span className="inline-flex items-center rounded-full bg-card/95 px-3 py-1 text-xs font-semibold text-foreground shadow backdrop-blur">
              Investment Property
            </span>
          </div>

          <button
            type="button"
            onClick={() => setGalleryOpen(true)}
            className="absolute bottom-5 right-5 inline-flex items-center gap-2 rounded-lg bg-card/95 px-3.5 py-2 text-xs font-semibold text-foreground shadow-md backdrop-blur transition-colors hover:bg-card"
          >
            <Images className="h-3.5 w-3.5" />
            View all {totalPhotos} photos
          </button>

          <div className="absolute bottom-5 left-5 text-primary-foreground">
            <h1 className="text-3xl font-bold leading-tight tracking-tight text-white drop-shadow-md sm:text-4xl">
              {rel.propertyName}
            </h1>
            <p className="mt-1 flex items-center gap-1.5 text-sm text-white/90 drop-shadow">
              <MapPin className="h-4 w-4" />
              {[rel.propertyCity, rel.propertyState].filter(Boolean).join(", ") || "Location available on request"}
            </p>
          </div>
        </div>

        {/* Thumbnail strip */}
        <div className="flex gap-2 overflow-x-auto bg-card px-5 py-3">
          {gallery.slice(0, 7).map((src, i) => (
            <button
              key={i}
              type="button"
              onClick={() => setActive(i)}
              className={cn(
                "relative h-16 w-24 shrink-0 overflow-hidden rounded-md border-2 transition-all",
                active === i ? "border-primary ring-2 ring-primary/30" : "border-transparent opacity-80 hover:opacity-100",
              )}
            >
              <img src={src} alt="" className="h-full w-full object-cover" />
            </button>
          ))}
          {totalPhotos > 7 && (
            <button
              type="button"
              onClick={() => setGalleryOpen(true)}
              className="flex h-16 w-24 shrink-0 items-center justify-center rounded-md border border-border bg-muted text-xs font-semibold text-muted-foreground hover:bg-muted/70"
            >
              +{totalPhotos - 7}
            </button>
          )}
        </div>
      </div>

      <Dialog open={galleryOpen} onOpenChange={setGalleryOpen}>
        <DialogContent className="max-w-5xl">
          <DialogTitle className="sr-only">All photos</DialogTitle>
          <div className="grid max-h-[80vh] grid-cols-2 gap-2 overflow-y-auto sm:grid-cols-3">
            {fullGallery.map((src, i) => (
              <div key={i} className="aspect-[4/3] overflow-hidden rounded-lg bg-muted">
                <img src={src} alt="" className="h-full w-full object-cover" />
              </div>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
