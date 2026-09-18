import { Link } from "@tanstack/react-router";
import { Instagram, MapPin, Phone } from "lucide-react";

type SiteFooterProps = {
  name: string;
  logoUrl?: string;
  footerTagline: string;
  footerBody: string;
  addressShort?: string;
  address?: string;
  hoursShort?: string;
  hours?: string;
  phone: string;
  whatsappNumber: string;
  socialLinks: {
    instagram: string;
    maps: string;
  };
};

export function SiteFooter({
  name,
  logoUrl,
  footerTagline,
  footerBody,
  addressShort,
  address,
  hoursShort,
  hours,
  phone,
  socialLinks,
}: SiteFooterProps) {
  // Split name at last space to colour the last word in mustard (matches original "The Litup Cafe" styling)
  const trimmedName = name?.trim() || "Cafe Name";
  const nameParts = trimmedName.split(" ");
  const nameLast = nameParts.length > 1 ? nameParts.pop() ?? "" : "";
  const nameFirst = nameParts.length > 0 ? nameParts.join(" ") : trimmedName;

  return (
    <footer className="mt-24 bg-charcoal text-cream">
      <div className="h-3 stripe-pillar" />
      <div className="mx-auto max-w-7xl px-5 sm:px-8 py-14 grid gap-12 md:grid-cols-4">
        <div className="md:col-span-2">
          {logoUrl && (
            <img
              src="/logo-gold.png"
              alt={name}
              className="h-14 w-auto object-contain mb-4 drop-shadow-md"
            />
          )}
          <div className="font-display text-3xl leading-tight">
            {nameFirst} {nameLast && <span className="text-mustard">{nameLast}</span>}
          </div>
          <p className="font-script text-2xl text-mustard mt-2">{footerTagline}</p>
          <p className="mt-4 text-cream/70 max-w-sm text-sm leading-relaxed">
            {footerBody}
          </p>
          <div className="mt-8 flex items-center gap-4">
            <a
              href={socialLinks.instagram}
              target="_blank"
              rel="noreferrer"
              aria-label="Instagram"
              className="bg-cream/10 p-3 rounded-full hover:bg-mustard hover:text-ink transition-colors text-cream/80"
            >
              <Instagram className="w-5 h-5" />
            </a>
            <a
              href={socialLinks.maps}
              target="_blank"
              rel="noreferrer"
              aria-label="Google Maps"
              className="bg-cream/10 p-3 rounded-full hover:bg-mustard hover:text-ink transition-colors text-cream/80"
            >
              <MapPin className="w-5 h-5" />
            </a>
            <a
              href={`tel:${phone?.replace(/[^+0-9]/g, "") || phone}`}
              aria-label="Phone"
              className="bg-cream/10 p-3 rounded-full hover:bg-mustard hover:text-ink transition-colors text-cream/80"
            >
              <Phone className="w-5 h-5" />
            </a>
          </div>
        </div>
        <div>
          <h4 className="text-mustard text-sm uppercase tracking-widest mb-3">Visit</h4>
          <p className="text-sm text-cream/80 leading-relaxed whitespace-pre-line">
            {addressShort || address}
          </p>
          <p className="text-sm text-cream/80 mt-3">{hoursShort || hours}</p>
        </div>
        <div>
          <h4 className="text-mustard text-sm uppercase tracking-widest mb-3">Wander</h4>
          <ul className="space-y-2 text-sm">
            {["/", "/menu", "/about", "/gallery", "/contact"].map((p, i) => (
              <li key={p}>
                <Link to={p} className="hover:text-coral transition-colors">
                  {["Home", "Menu", "About", "Gallery", "Contact"][i]}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </div>
      <div className="border-t border-cream/10 py-4 text-center text-xs text-cream/50">
        © {new Date().getFullYear()} {name} · Made with chai &amp; late nights
      </div>
    </footer>
  );
}