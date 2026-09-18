import { createFileRoute } from "@tanstack/react-router";
import { getRestaurantDataFn } from "@/lib/cms-actions";
import type { RestaurantData } from "@/lib/restaurant-data";

export const Route = createFileRoute("/about")({
  loader: async (): Promise<RestaurantData> => {
    return await getRestaurantDataFn();
  },
  component: AboutPage,
});

function AboutPage() {
  const data = Route.useLoaderData() as RestaurantData;
  const { milestones, stats, pressQuote, pressAttribution, seoMeta } = data;

  // Hero image automatically copied from Homepage Story Teaser photo
  const heroImage = data.storyTeaserPhoto || seoMeta?.about?.ogImage || "/photos/ai_interior.png";

  return (
    <div>
      {/* Hero */}
      <section className="mx-auto max-w-7xl px-5 sm:px-8 pt-16 pb-12 grid md:grid-cols-12 gap-10 items-center">
        <div className="md:col-span-7">
          <p className="font-script text-coral text-3xl">
            {data.storyTeaserScriptLabel
              ? data.storyTeaserScriptLabel.replace(/→$/, "").trim()
              : "our whole deal"}
          </p>
          <h1 className="mt-2 text-5xl md:text-6xl lg:text-7xl leading-[0.95]">
            {data.storyTeaserPrefix ? (
              <>
                {data.storyTeaserPrefix}{" "}
                <span className="marker-underline">{data.storyTeaserH2?.[0] || ""}</span>,{" "}
                <span className="text-coral">{data.storyTeaserH2?.[1] || ""}</span>.
              </>
            ) : (
              <>
                A tiny cafe<br />
                with a <span className="text-coral">very big</span><br />
                <span className="marker-underline">crush</span> on DU.
              </>
            )}
          </h1>
          <p className="mt-7 text-lg text-charcoal/80 max-w-xl leading-relaxed">
            {data.storyTeaserBody ||
              `${data.name} has been the vibrant gathering place, celebration spot, and party venue of Hudson Lane. We bring great food and unforgettable vibes together.`}
          </p>
        </div>
        <div className="md:col-span-5 relative h-[420px]">
          <div className="absolute inset-0 rounded-md overflow-hidden shadow-2xl rotate-[3deg] tape bg-slate-200">
            <img
              src={heroImage}
              alt={`${data.name} story`}
              className="h-full w-full object-cover"
            />
          </div>
        </div>
      </section>

      {/* Timeline */}
      <section className="bg-charcoal text-cream py-24">
        <div className="mx-auto max-w-5xl px-5 sm:px-8">
          <h2 className="text-4xl md:text-5xl lg:text-6xl text-mustard">A short history.</h2>
          <div className="mt-14 relative">
            <div className="absolute left-4 md:left-1/2 top-0 bottom-0 w-0.5 stripe-pillar -translate-x-1/2" />
            <div className="space-y-12">
              {milestones.map((m, i) => (
                <div key={m.year} className={`relative grid md:grid-cols-2 gap-6 items-start ${i % 2 ? "md:[&>*:first-child]:order-2" : ""}`}>
                  <div className={`pl-12 md:pl-0 ${i % 2 ? "md:text-left md:pl-12" : "md:text-right md:pr-12"}`}>
                    <span className="font-display text-4xl md:text-5xl text-mustard">{m.year}</span>
                    <h3 className="text-2xl mt-2">{m.title}</h3>
                    <p className="text-cream/70 mt-2 text-sm leading-relaxed max-w-md md:inline-block">{m.body}</p>
                  </div>
                  <div />
                  <span className="absolute left-4 md:left-1/2 top-2 -translate-x-1/2 h-4 w-4 rounded-full bg-coral border-4 border-charcoal" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Counters */}
      <section className="mx-auto max-w-7xl px-5 sm:px-8 py-24 grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
        {stats.map((s) => (
          <div key={s.l} className="rounded-md bg-cream border-2 border-charcoal/15 p-6 hover:border-coral transition-colors">
            <div className="font-display text-4xl md:text-5xl text-coral">{s.n}</div>
            <div className="mt-2 text-sm uppercase tracking-widest text-charcoal/70">{s.l}</div>
          </div>
        ))}
      </section>

      {/* Press */}
      <section className="bg-mustard text-ink py-16">
        <div className="mx-auto max-w-5xl px-5 sm:px-8 text-center">
          <p className="font-script text-2xl text-coral">said about us</p>
          <h2 className="mt-2 text-3xl md:text-4xl lg:text-5xl">"{pressQuote}"</h2>
          <p className="mt-4 text-ink/80" dangerouslySetInnerHTML={{ __html: pressAttribution }} />
        </div>
      </section>
    </div>
  );
}