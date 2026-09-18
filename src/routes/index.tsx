import { createFileRoute } from "@tanstack/react-router";
import { Link } from "@tanstack/react-router";
import { useMemo } from "react";
import { getRestaurantDataFn } from "@/lib/cms-actions";
import { type RestaurantData, getGoogleMapsEmbedUrl } from "@/lib/restaurant-data";

export const Route = createFileRoute("/")({
  loader: async (): Promise<RestaurantData> => {
    return await getRestaurantDataFn();
  },
  component: Home,
});

function Home() {
  const data = Route.useLoaderData() as RestaurantData;
  const {
    heroLocationBadge,
    heroHeadline,
    heroHeadlineSince,
    heroSubcopy,
    heroStats,
    heroCollagePhotos,
    heroCollageAlts,
    heroCollageAnnotation,
    marqueeItems,
    storyTeaserPhoto,
    storyTeaserPhotoAlt,
    storyTeaserScriptLabel,
    storyTeaserPrefix,
    storyTeaserH2,
    storyTeaserBody,
    signatureDishes,
    reviews,
    address,
    hours,
    phone,
    priceRange,
    mapsEmbedQuery,
    socialLinks,
  } = data;

  // Moving marquee strip: displays the 5 custom dishes entered in CMS with star separators
  const displayMarquee = useMemo(() => {
    let dishes: string[] = [];

    // 1. Prefer custom marqueeDishes if set
    if (data.marqueeDishes && data.marqueeDishes.length > 0) {
      dishes = data.marqueeDishes.filter((d) => Boolean(d && d.trim().length > 0));
    }

    // 2. Fallback to extracting non-star items from marqueeItems
    if (dishes.length === 0 && data.marqueeItems && data.marqueeItems.length > 0) {
      dishes = data.marqueeItems.filter((item) => Boolean(item && item.trim().length > 0 && item !== "★"));
    }

    // 3. Fallback default 5 dishes matching the attached image
    if (dishes.length === 0) {
      dishes = ["KitKat Shake", "Steamy Momos", "Watermelon Mojito", "Brownie Fudge", "Cheesy Burgers"];
    }

    const itemsWithStars: string[] = [];
    dishes.forEach((dish) => {
      itemsWithStars.push(dish.trim().toUpperCase());
      itemsWithStars.push("★");
    });
    return itemsWithStars;
  }, [data.marqueeDishes, data.marqueeItems]);

  return (
    <>
      {/* HERO — typographic-led, asymmetric, with collage of real photos */}
      <section className="relative overflow-hidden">
        <div className="mx-auto max-w-7xl px-5 sm:px-8 pt-6 pb-12 lg:pt-10 lg:pb-16">
          <div className="grid lg:grid-cols-12 gap-8 items-end">
            <div className="lg:col-span-7 fade-up">
              <div className="flex items-center gap-3 text-sm font-medium">
                <span className="h-2 w-2 rounded-full bg-coral animate-pulse" />
                <span className="uppercase tracking-[0.2em] text-charcoal/70">{heroLocationBadge}</span>
              </div>
              <h1 className="mt-5 font-display text-[clamp(2.5rem,6vw,5.5rem)] leading-[0.88] tracking-tight">
                {heroHeadline[0]}<br />
                <span className="text-coral">{heroHeadline[1]}</span><br />
                <span className="marker-underline">{heroHeadline[2]}</span>{" "}
                <span className="font-script text-sage text-[0.55em] inline-block wiggle">{heroHeadlineSince}</span>
              </h1>
              <p className="mt-7 max-w-xl text-lg text-charcoal/80 leading-relaxed">
                {heroSubcopy}
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <Link to="/menu" className="group inline-flex items-center gap-2 rounded-full bg-charcoal text-cream px-6 py-3 font-medium hover:bg-coral transition-colors">
                  Eat the menu
                  <span aria-hidden className="transition-transform group-hover:translate-x-1">→</span>
                </Link>
                <Link to="/contact" className="inline-flex items-center gap-2 rounded-full border-2 border-charcoal px-6 py-3 font-medium hover:bg-mustard transition-colors">
                  Find us / book a table
                </Link>
              </div>
              {heroStats && heroStats.length > 0 && (
                <div className="mt-10 flex flex-wrap items-center gap-x-8 gap-y-3 text-sm text-charcoal/70">
                  {heroStats.map((s, i) => (
                    <span key={i}>{s}</span>
                  ))}
                </div>
              )}
            </div>

            {/* Collage */}
            <div className="lg:col-span-5 relative h-[460px] sm:h-[500px] lg:h-[560px] mt-8 lg:mt-0">
              
              {/* Image 1 - Top Right */}
              <div className="absolute top-0 right-0 sm:top-4 sm:right-8 w-56 sm:w-80 h-56 sm:h-80 rounded-full overflow-hidden shadow-xl ring-8 ring-cream/50 z-20 group">
                <img src={heroCollagePhotos[0]} alt={heroCollageAlts[0]} className="h-full w-full object-cover group-hover:scale-110 transition-transform duration-700" />
              </div>

              {/* Image 2 - Bottom Left */}
              <div className="absolute bottom-12 left-0 sm:bottom-8 sm:left-4 w-64 sm:w-96 h-64 sm:h-96 rounded-full overflow-hidden shadow-2xl ring-8 ring-cream/50 z-30 group">
                <img src={heroCollagePhotos[1]} alt={heroCollageAlts[1]} className="h-full w-full object-cover group-hover:scale-110 transition-transform duration-700" />
              </div>

              <div className="absolute bottom-4 left-16 hidden lg:block font-script text-sage text-2xl rotate-[-8deg] z-40">
                {heroCollageAnnotation}
              </div>
            </div>
          </div>
        </div>

        {/* Edison bulb string */}
        <div className="pointer-events-none absolute top-0 inset-x-0 flex justify-around opacity-80">
          {Array.from({ length: 9 }).map((_, i) => (
            <span key={i} className="bulb -mt-2 text-amber-400" style={{ animationDelay: `${i * 0.3}s` }}>
              <svg width="14" height="22" viewBox="0 0 14 22"><line x1="7" y1="0" x2="7" y2="8" stroke="currentColor" strokeWidth="0.8" /><ellipse cx="7" cy="14" rx="6" ry="7" fill="#f5c45a" /></svg>
            </span>
          ))}
        </div>
      </section>

      {/* MARQUEE strip */}
      <section className="bg-mustard text-charcoal py-3.5 sm:py-4 border-y-2 border-charcoal overflow-hidden shadow-sm">
        <div className="flex marquee-track whitespace-nowrap font-display text-xl sm:text-2xl font-black uppercase tracking-wider">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="flex gap-8 sm:gap-10 px-5 shrink-0 items-center">
              {displayMarquee.map((w: string, j: number) => (
                <span key={j} className={w === "★" ? "text-charcoal/80 text-lg sm:text-xl font-sans" : "hover:text-coral transition-colors"}>
                  {w}
                </span>
              ))}
            </div>
          ))}
        </div>
      </section>

      {/* STORY teaser */}
      <section className="mx-auto max-w-7xl px-5 sm:px-8 py-24 grid md:grid-cols-12 gap-12 items-center">
        <div className="md:col-span-5 relative">
          <div className="absolute -top-6 -left-6 w-24 h-24 stripe-pillar rounded-md -z-10" />
          <img src={storyTeaserPhoto} alt={storyTeaserPhotoAlt} className="rounded-md shadow-2xl w-full" />
        </div>
        <div className="md:col-span-7">
          <p className="font-script text-coral text-3xl">{storyTeaserScriptLabel}</p>
          <h2 className="mt-2 text-4xl md:text-5xl lg:text-6xl leading-[0.95]">
            {storyTeaserPrefix || "Eleven years of"}{" "}
            <span className="marker-underline">{storyTeaserH2[0]}</span> and
            <span className="text-coral"> {storyTeaserH2[1]}</span>.
          </h2>
          <p className="mt-6 text-lg text-charcoal/80 leading-relaxed max-w-2xl">
            {storyTeaserBody}
          </p>
          <Link to="/about" className="mt-7 inline-flex items-center gap-2 font-medium border-b-2 border-charcoal pb-1 hover:border-coral hover:text-coral transition-colors">
            Read the full story →
          </Link>
        </div>
      </section>

      {/* SIGNATURE MENU — staggered scattered cards */}
      <section className="bg-charcoal text-cream py-24 relative overflow-hidden">
        <div className="mx-auto max-w-7xl px-5 sm:px-8">
          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6">
            <div>
              <p className="font-script text-mustard text-3xl">the regulars know</p>
              <h2 className="text-4xl md:text-5xl lg:text-6xl mt-2">What everybody orders.</h2>
            </div>
            <Link to="/menu" className="inline-flex items-center gap-2 rounded-full bg-mustard text-ink px-6 py-3 font-medium hover:bg-coral hover:text-cream transition-colors w-fit">
              See the full menu →
            </Link>
          </div>

          <div className="mt-14 grid grid-cols-2 lg:grid-cols-4 gap-6">
            {(signatureDishes || []).slice(0, 4).map((s, i) => (
              <article
                key={s.name || i}
                className={`group relative bg-cream text-ink rounded-md overflow-hidden shadow-xl transition-all duration-500 hover:-translate-y-2 hover:rotate-0 ${
                  i % 2 === 0 ? "lg:translate-y-8 rotate-[-1.5deg]" : "rotate-[1.5deg]"
                }`}
              >
                <div className="aspect-[4/5] overflow-hidden bg-slate-200">
                  <img
                    src={s.img || "/photos/7.jpg"}
                    alt={s.name}
                    className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110"
                  />
                </div>
                <div className="p-4">
                  <span className="inline-flex items-center gap-1.5 text-[10px] uppercase tracking-widest font-bold text-coral">
                    <span className={s.veg ? "veg-dot" : "nonveg-dot"} /> {s.tag || "Special"}
                  </span>
                  <h3 className="mt-2 text-lg leading-tight font-black">{s.name}</h3>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* REVIEWS sticky-note wall */}
      <section className="py-24 relative overflow-hidden">
        <div className="mx-auto max-w-7xl px-5 sm:px-8">
          <div className="max-w-2xl">
            <p className="font-script text-sage text-3xl">straight from the wishes wall</p>
            <h2 className="mt-2 text-4xl md:text-5xl lg:text-6xl">
              Things people <span className="marker-underline">actually</span> said.
            </h2>
          </div>
        </div>

        <div className="mt-14 overflow-hidden py-10 -my-10 w-full relative">
          <div className="flex marquee-track w-max hover:[animation-play-state:paused]" style={{ animationDuration: '60s' }}>
            {Array.from({ length: 2 }).map((_, copyIndex) => (
              <div key={copyIndex} className="flex gap-6 shrink-0 pr-6">
                {reviews.map((r, i) => (
                  <div
                    key={`${copyIndex}-${i}`}
                    className="sticky-note p-6 rounded-sm w-[340px] shrink-0 whitespace-normal flex flex-col justify-between"
                    style={{ ["--rot" as never]: `${([-3, 2, -1, 3])[i % 4]}deg` }}
                  >
                    <p className="font-script text-xl text-ink leading-snug">"{r.text}"</p>
                    <p className="mt-6 text-xs uppercase tracking-widest text-ink/70">— {r.who}</p>
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* GALLERY teaser */}
      <section className="mx-auto max-w-7xl px-5 sm:px-8 py-20">
        <div className="flex items-end justify-between flex-wrap gap-4 mb-8">
          <h2 className="text-4xl md:text-5xl lg:text-6xl">A peek inside.</h2>
          <Link to="/gallery" className="font-medium border-b-2 border-charcoal pb-1 hover:text-coral hover:border-coral">Full gallery →</Link>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
          {(() => {
            const defaultPhotos = [
              "/photos/1.webp",
              "/photos/4.webp",
              "/photos/3.webp",
              "/photos/2.webp",
              "/photos/2.webp",
              "/photos/1.webp",
              "/photos/4.webp",
              "/photos/3.webp",
              "/photos/1.webp",
              "/photos/2.webp",
            ];
            const photos =
              data.homepageGalleryPhotos && data.homepageGalleryPhotos.length > 0
                ? data.homepageGalleryPhotos.filter(Boolean)
                : defaultPhotos;

            const radii = [
              "rounded-tl-[3rem] rounded-br-[3rem] rounded-tr-md rounded-bl-md",
              "rounded-full",
              "rounded-3xl",
              "rounded-[2rem] md:rounded-[4rem]",
              "rounded-t-full rounded-b-xl",
              "rounded-2xl",
              "rounded-bl-[4rem] rounded-tr-[4rem] rounded-tl-xl rounded-br-xl",
              "rounded-full",
              "rounded-t-full rounded-b-xl",
              "rounded-[2rem] md:rounded-[3rem]",
            ];
            const rotations = [
              "rotate-[-2deg]",
              "rotate-[3deg]",
              "rotate-[-1deg]",
              "rotate-[2deg]",
              "rotate-[-3deg]",
              "rotate-[1deg]",
              "rotate-[2deg]",
              "rotate-[-2deg]",
              "rotate-[1.5deg]",
              "rotate-[-1.5deg]",
            ];

            return photos.slice(0, 10).map((src, i) => {
              const isTall = i % 4 === 0 || i === 5;
              return (
                <div
                  key={i}
                  className={`group overflow-hidden border-2 border-charcoal bg-mustard shadow-[4px_4px_0px_#1a1a1a] hover:shadow-[6px_6px_0px_#f26b5b] hover:-translate-y-1 transition-all duration-300 ${
                    isTall ? "row-span-2 aspect-[3/5]" : "aspect-square"
                  } ${radii[i % radii.length]} ${rotations[i % rotations.length]}`}
                >
                  <img
                    src={src}
                    alt={`Cafe vibe ${i + 1}`}
                    className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110 group-hover:rotate-[-2deg] filter contrast-125 saturate-[1.1]"
                  />
                </div>
              );
            });
          })()}
        </div>
      </section>

      {/* LOCATION */}
      <section className="bg-cream border-t-2 border-charcoal/10">
        <div className="mx-auto max-w-7xl px-5 sm:px-8 py-20 grid md:grid-cols-2 gap-10 items-stretch">
          <div>
            <p className="font-script text-coral text-3xl">come hang</p>
            <h2 className="mt-2 text-4xl md:text-5xl lg:text-6xl">Find the door with the fairy lights.</h2>
            <ul className="mt-8 space-y-4 text-charcoal/80">
              <li><strong className="text-ink block">Address</strong>{address}</li>
              <li><strong className="text-ink block">Hours</strong>{hours}</li>
              <li>
                <strong className="text-ink block">Phone</strong>
                <a href={`tel:${phone?.replace(/[^+0-9]/g, "") || phone}`} className="hover:text-coral transition-colors font-medium">
                  {phone}
                </a>
              </li>
            </ul>
            <a
              href={socialLinks.maps}
              target="_blank"
              rel="noreferrer"
              className="mt-8 inline-flex items-center gap-2 rounded-full bg-charcoal text-cream px-6 py-3 font-medium hover:bg-coral transition-colors"
            >
              Open in Google Maps →
            </a>
          </div>
          <div className="rounded-md overflow-hidden shadow-2xl border-4 border-charcoal min-h-[380px]">
            <iframe
              title={`${data.name} location`}
              src={getGoogleMapsEmbedUrl(mapsEmbedQuery)}
              className="w-full h-full min-h-[380px]"
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
            />
          </div>
        </div>
      </section>
    </>
  );
}
