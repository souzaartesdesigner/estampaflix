import { useState, useRef, useEffect } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { ChevronLeft, ChevronRight, ZoomIn, X } from "lucide-react";
import { useI18n } from "@/lib/i18n";

type Props = {
  images: string[];
  alt: string;
  showWatermark?: boolean;
};

export function ArtworkGallery({ images, alt, showWatermark = true }: Props) {
  const list = images.filter(Boolean);
  const [idx, setIdx] = useState(0);
  const [zoomOpen, setZoomOpen] = useState(false);
  const { t } = useI18n();

  const current = list[idx] ?? list[0];
  const go = (delta: number) => setIdx((i) => (i + delta + list.length) % list.length);

  if (!current) return null;

  return (
    <>
      <div className="flex flex-col gap-3">
        {/* Main image */}
        <div className="group relative overflow-hidden rounded-2xl border border-border/60 bg-surface">
          <div className="relative aspect-square">
            <img
              src={current}
              alt={alt}
              loading="eager"
              fetchPriority="high"
              decoding="async"
              className="h-full w-full cursor-zoom-in object-cover transition-transform duration-300 group-hover:scale-105"
              onClick={() => setZoomOpen(true)}
            />
            {showWatermark && (
              <div
                aria-hidden
                className="pointer-events-none absolute inset-0 flex items-center justify-center opacity-25 mix-blend-overlay"
                style={{ backgroundImage: "repeating-linear-gradient(-30deg, transparent 0 80px, oklch(1 0 0 / 0.25) 80px 81px)" }}
              >
                <span className="rotate-[-20deg] font-display text-5xl font-black tracking-widest text-white/70">ESTAMPAHUB</span>
              </div>
            )}
            <button
              type="button"
              onClick={() => setZoomOpen(true)}
              aria-label={t("gallery.zoom")}
              className="absolute right-3 top-3 grid h-10 w-10 place-items-center rounded-full bg-background/80 text-foreground opacity-0 backdrop-blur transition-opacity hover:bg-background group-hover:opacity-100"
            >
              <ZoomIn className="h-5 w-5" />
            </button>
            {list.length > 1 && (
              <>
                <button
                  type="button"
                  onClick={() => go(-1)}
                  aria-label="Anterior"
                  className="absolute left-3 top-1/2 grid h-10 w-10 -translate-y-1/2 place-items-center rounded-full bg-background/80 opacity-0 backdrop-blur transition-opacity hover:bg-background group-hover:opacity-100"
                >
                  <ChevronLeft className="h-5 w-5" />
                </button>
                <button
                  type="button"
                  onClick={() => go(1)}
                  aria-label="Próxima"
                  className="absolute right-3 top-1/2 grid h-10 w-10 -translate-y-1/2 place-items-center rounded-full bg-background/80 opacity-0 backdrop-blur transition-opacity hover:bg-background group-hover:opacity-100"
                >
                  <ChevronRight className="h-5 w-5" />
                </button>
              </>
            )}
          </div>
        </div>

        {/* Thumbnails */}
        {list.length > 1 && (
          <div className="flex gap-2 overflow-x-auto pb-1">
            {list.map((src, i) => (
              <button
                key={src + i}
                type="button"
                onClick={() => setIdx(i)}
                className={`h-16 w-16 shrink-0 overflow-hidden rounded-lg border-2 transition-colors ${
                  i === idx ? "border-primary" : "border-border/50 hover:border-border"
                }`}
              >
                <img src={src} alt="" loading="lazy" decoding="async" className="h-full w-full object-cover" />
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Zoom modal */}
      <Dialog open={zoomOpen} onOpenChange={setZoomOpen}>
        <DialogContent className="max-h-[95vh] max-w-6xl overflow-hidden border-0 bg-background/95 p-0 backdrop-blur">
          <ZoomViewer src={current} alt={alt} onClose={() => setZoomOpen(false)} onNext={() => go(1)} onPrev={() => go(-1)} multi={list.length > 1} />
        </DialogContent>
      </Dialog>
    </>
  );
}

function ZoomViewer({
  src,
  alt,
  onClose,
  onNext,
  onPrev,
  multi,
}: { src: string; alt: string; onClose: () => void; onNext: () => void; onPrev: () => void; multi: boolean }) {
  const [scale, setScale] = useState(1);
  const [pos, setPos] = useState({ x: 0, y: 0 });
  const dragRef = useRef<{ x: number; y: number } | null>(null);
  const { t } = useI18n();

  useEffect(() => {
    setScale(1);
    setPos({ x: 0, y: 0 });
  }, [src]);

  function onWheel(e: React.WheelEvent) {
    e.preventDefault();
    const delta = e.deltaY < 0 ? 0.2 : -0.2;
    setScale((s) => Math.min(4, Math.max(1, s + delta)));
  }
  function onMouseDown(e: React.MouseEvent) {
    if (scale === 1) return;
    dragRef.current = { x: e.clientX - pos.x, y: e.clientY - pos.y };
  }
  function onMouseMove(e: React.MouseEvent) {
    if (!dragRef.current) return;
    setPos({ x: e.clientX - dragRef.current.x, y: e.clientY - dragRef.current.y });
  }
  function stopDrag() {
    dragRef.current = null;
  }

  return (
    <div className="relative h-[90vh] w-full select-none">
      <button
        type="button"
        onClick={onClose}
        aria-label={t("gallery.close")}
        className="absolute right-4 top-4 z-10 grid h-10 w-10 place-items-center rounded-full bg-background/80 backdrop-blur hover:bg-background"
      >
        <X className="h-5 w-5" />
      </button>
      {multi && (
        <>
          <button
            type="button"
            onClick={onPrev}
            className="absolute left-4 top-1/2 z-10 grid h-12 w-12 -translate-y-1/2 place-items-center rounded-full bg-background/80 backdrop-blur hover:bg-background"
            aria-label="Anterior"
          >
            <ChevronLeft className="h-6 w-6" />
          </button>
          <button
            type="button"
            onClick={onNext}
            className="absolute right-4 top-1/2 z-10 grid h-12 w-12 -translate-y-1/2 place-items-center rounded-full bg-background/80 backdrop-blur hover:bg-background"
            aria-label="Próxima"
          >
            <ChevronRight className="h-6 w-6" />
          </button>
        </>
      )}
      <div className="absolute bottom-4 left-1/2 z-10 -translate-x-1/2 rounded-full bg-background/80 px-3 py-1.5 text-xs backdrop-blur">
        {Math.round(scale * 100)}% — {t("gallery.zoom")}: roda do mouse / clique
      </div>
      <div
        className="flex h-full w-full items-center justify-center overflow-hidden"
        onWheel={onWheel}
        onMouseDown={onMouseDown}
        onMouseMove={onMouseMove}
        onMouseUp={stopDrag}
        onMouseLeave={stopDrag}
        onDoubleClick={() => setScale((s) => (s === 1 ? 2 : 1))}
      >
        <img
          src={src}
          alt={alt}
          draggable={false}
          decoding="async"
          style={{
            transform: `translate(${pos.x}px, ${pos.y}px) scale(${scale})`,
            cursor: scale > 1 ? "grab" : "zoom-in",
            transition: dragRef.current ? "none" : "transform 0.2s",
          }}
          className="max-h-full max-w-full object-contain"
        />
      </div>
    </div>
  );
}
