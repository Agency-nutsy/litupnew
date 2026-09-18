import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { getRestaurantDataFn } from "@/lib/cms-actions";
import type { RestaurantData } from "@/lib/restaurant-data";

export const Route = createFileRoute("/menu")({
  loader: async (): Promise<RestaurantData> => {
    return await getRestaurantDataFn();
  },
  component: MenuPage,
});

function MenuPage() {
  const data = Route.useLoaderData() as RestaurantData;
  const { menu } = data;

  const [active, setActive] = useState<string>(menu[0]?.id ?? "");
  const isClicking = useRef(false);
  const pillContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!menu[0]) return;
    setActive(menu[0].id);
  }, [menu]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (isClicking.current) return;

        let newActive = active;
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            newActive = entry.target.id;
          }
        });

        if (newActive !== active) {
          setActive(newActive);
          const activePill = document.getElementById(`pill-${newActive}`);
          if (activePill && pillContainerRef.current) {
            const container = pillContainerRef.current;
            const scrollLeft = activePill.offsetLeft - container.offsetWidth / 2 + activePill.offsetWidth / 2;
            container.scrollTo({ left: scrollLeft, behavior: 'smooth' });
          }
        }
      },
      { rootMargin: "-20% 0px -70% 0px" }
    );

    menu.forEach((cat) => {
      const el = document.getElementById(cat.id);
      if (el) observer.observe(el);
    });

    return () => observer.disconnect();
  }, [active, menu]);

  const handleNavClick = (id: string) => {
    isClicking.current = true;
    setActive(id);

    const activePill = document.getElementById(`pill-${id}`);
    if (activePill && pillContainerRef.current) {
      const container = pillContainerRef.current;
      const scrollLeft = activePill.offsetLeft - container.offsetWidth / 2 + activePill.offsetWidth / 2;
      container.scrollTo({ left: scrollLeft, behavior: 'smooth' });
    }

    const el = document.getElementById(id);
    if (el) {
      const y = el.getBoundingClientRect().top + window.scrollY - 100;
      window.scrollTo({ top: y, behavior: 'smooth' });
    }

    setTimeout(() => {
      isClicking.current = false;
    }, 1000);
  };

  return (
    <div className="mx-auto max-w-7xl px-5 sm:px-8 py-12">
      {/* Header */}
      <div className="text-center max-w-3xl mx-auto">
        <p className="font-script text-coral text-3xl">the menu board</p>
        <h1 className="mt-2 text-5xl md:text-6xl lg:text-7xl leading-[0.95]">
          Everything <span className="marker-underline">we make.</span>
        </h1>
        <p className="mt-5 text-xs uppercase tracking-widest text-charcoal/50">Prices are indicative · please confirm at the cafe</p>
      </div>

      {/* Category pills */}
      <div
        ref={pillContainerRef}
        className="mt-10 flex gap-2 overflow-x-auto no-scrollbar sticky top-20 sm:top-24 z-20 py-3 bg-cream/85 backdrop-blur-md -mx-5 px-5 sm:-mx-8 sm:px-8 border-y border-charcoal/10"
      >
        {menu.map((c) => (
          <button
            key={c.id}
            id={`pill-${c.id}`}
            onClick={() => handleNavClick(c.id)}
            className={`whitespace-nowrap rounded-full px-5 py-2.5 text-sm font-medium border-2 transition-all shrink-0 ${
              active === c.id
                ? "bg-charcoal text-cream border-charcoal"
                : "border-charcoal/20 hover:border-charcoal hover:bg-mustard"
            }`}
          >
            {c.label}
          </button>
        ))}
      </div>

      {/* Sections */}
      <div className="mt-14 space-y-20">
        {menu.map((cat) => (
          <section key={cat.id} id={cat.id} className="scroll-mt-28">
            <div className="flex items-center gap-4 mb-8">
              <h2 className="text-3xl md:text-4xl lg:text-5xl">{cat.label}</h2>
              <div className="flex-1 h-1 stripe-pillar rounded-full" />
            </div>
            <div className="grid md:grid-cols-2 gap-x-10 gap-y-6">
              {cat.items.map((it) => (
                <div key={it.name} className="group flex items-baseline gap-4 py-3 border-b border-dashed border-charcoal/20 hover:border-coral transition-colors">
                  <span className={`${it.veg !== false ? "veg-dot" : "nonveg-dot"} translate-y-1 shrink-0`} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-baseline gap-2">
                      <h3 className="text-xl font-display tracking-tight">{it.name}</h3>
                      {it.star && <span className="text-xs uppercase tracking-widest bg-mustard text-ink px-2 py-0.5 rounded-sm">Bestseller</span>}
                    </div>
                    {it.desc && <p className="text-sm text-charcoal/70 mt-1">{it.desc}</p>}
                  </div>
                  <span className="font-display text-xl whitespace-nowrap">{it.price}</span>
                </div>
              ))}
            </div>
          </section>
        ))}
      </div>

      <div className="mt-20 rounded-md bg-charcoal text-cream p-8 md:p-12 grid md:grid-cols-[2fr_1fr] gap-6 items-center">
        <div>
          <p className="font-script text-mustard text-2xl">psst — birthday people</p>
          <h3 className="text-3xl mt-1">Want the balloon wall treatment?</h3>
          <p className="text-cream/80 mt-3 text-sm leading-relaxed">We do budget birthday setups, group bookings, and post-exam blowouts. Tell us what you're celebrating.</p>
        </div>
        <a href="/contact" className="rounded-full bg-mustard text-ink px-6 py-3 font-medium text-center hover:bg-coral hover:text-cream transition-colors w-fit md:justify-self-end">
          Plan it with us →
        </a>
      </div>
    </div>
  );
}