import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { getRestaurantDataFn } from "@/lib/cms-actions";
import type { RestaurantData, GalleryPhoto } from "@/lib/restaurant-data";

type Cat = "all" | "food_drinks" | "ambience" | "party";

export const Route = createFileRoute("/gallery")({
  loader: async (): Promise<RestaurantData> => {
    return await getRestaurantDataFn();
  },
  component: GalleryPage,
});

function GalleryPage() {
  const data = Route.useLoaderData() as RestaurantData;
  const items: GalleryPhoto[] = data.galleryPhotos || [];

  const [cat, setCat] = useState<Cat>("all");
  const [zoom, setZoom] = useState<string | null>(null);

  const visible = cat === "all" ? items : items.filter((i) => i.cat === cat);

  // Organic rotation values for playful scrapbook aesthetic
  const rotations = [-1.4, 1.1, -0.8, 1.3, -1.2, 0.9, -1.6, 1.5, -0.6, 1.2];

  return (
    <div className="mx-auto max-w-7xl px-5 sm:px-8 py-12">
      <div className="max-w-3xl">
        <p className="font-script text-coral text-3xl">come look around</p>
        <h1 className="mt-2 text-5xl md:text-6xl lg:text-7xl leading-[0.95]">
          The <span className="marker-underline">gallery.</span>
        </h1>
        <p className="mt-5 text-charcoal/70 text-lg">
          Authentic moments, signature dishes, and party vibes straight from The Litup Cafe.
        </p>
      </div>

      <div className="mt-10 flex flex-wrap gap-2.5">
        {([
          { id: "all", label: "Everything" },
          { id: "food_drinks", label: "Food & Drinks" },
          { id: "ambience", label: "Ambience" },
          { id: "party", label: "Parties" },
        ] as { id: Cat; label: string }[]).map((c) => {
          const count = c.id === "all" ? items.length : items.filter((i) => i.cat === c.id).length;
          return (
            <button
              key={c.id}
              onClick={() => setCat(c.id)}
              className={`rounded-full px-5 py-2 text-sm font-semibold border-2 capitalize transition-all duration-200 flex items-center gap-2 ${
                cat === c.id
                  ? "bg-charcoal text-cream border-charcoal shadow-[3px_3px_0px_#f26b5b]"
                  : "border-charcoal/25 bg-cream/70 hover:border-charcoal hover:bg-mustard text-charcoal"
              }`}
            >
              <span>{c.label}</span>
              <span
                className={`text-xs px-2 py-0.5 rounded-full ${
                  cat === c.id ? "bg-coral text-white" : "bg-charcoal/10 text-charcoal/80"
                }`}
              >
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Randomized Masonry Grid */}
      <div className="mt-10 columns-2 md:columns-3 lg:columns-4 gap-4 sm:gap-6 [column-fill:_balance]">
        {visible.map((p, i) => {
          const rotation = rotations[i % rotations.length];
          return (
            <button
              key={p.src + i}
              onClick={() => setZoom(p.src)}
              className="mb-5 sm:mb-6 group block w-full break-inside-avoid relative rounded-2xl overflow-hidden shadow-[3px_3px_0px_#1a1a1a] hover:shadow-[6px_6px_0px_#f26b5b] border-2 border-charcoal bg-mustard hover:-translate-y-1.5 transition-all duration-300 text-left focus:outline-none focus:ring-2 focus:ring-coral"
              style={{ transform: `rotate(${rotation}deg)` }}
            >
              <img
                src={p.src}
                alt={p.caption}
                loading="lazy"
                className="w-full h-auto object-cover transition-transform duration-500 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-charcoal/90 via-charcoal/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end p-4">
                <div>
                  <span className="inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-coral text-white mb-1.5 shadow-sm">
                    {p.cat}
                  </span>
                  <p className="text-cream text-lg font-script leading-snug drop-shadow-md">
                    {p.caption}
                  </p>
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {visible.length === 0 && (
        <p className="text-charcoal/60 italic mt-8">No photos in this category yet — check back soon.</p>
      )}

      {/* Lightbox / Zoom Modal */}
      {zoom && (
        <div
          className="fixed inset-0 bg-charcoal/90 backdrop-blur-md z-[100] flex items-center justify-center p-4 sm:p-8 cursor-zoom-out animate-[fade-up_.2s_ease-out]"
          onClick={() => setZoom(null)}
        >
          <div className="relative max-h-[90vh] max-w-[95vw] overflow-hidden rounded-2xl border-4 border-mustard shadow-2xl bg-charcoal">
            <img src={zoom} alt="Enlarged view" className="max-h-[85vh] max-w-full object-contain" />
          </div>
        </div>
      )}
    </div>
  );
}