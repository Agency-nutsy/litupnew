import { createFileRoute, notFound, useNavigate } from "@tanstack/react-router";
import { useState, useRef, ChangeEvent } from "react";
import {
  getRestaurantDataFn,
  checkCmsAuthFn,
  cmsLoginFn,
  saveRestaurantDataFn,
  uploadPhotoFn,
  fetchGoogleReviewsFn,
} from "@/lib/cms-actions";
import { defaultRestaurantData, RestaurantData, SignatureDish, Review, getGoogleMapsEmbedUrl } from "@/lib/restaurant-data";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { AiMenuImporter } from "@/components/AiMenuImporter";
import {
  Sparkles,
  Home,
  UtensilsCrossed,
  Image as ImageIcon,
  BookOpen,
  PhoneCall,
  PanelBottom,
  ExternalLink,
  CheckCircle2,
  Lock,
  ArrowUpRight,
  SlidersHorizontal,
  Upload,
  X,
  Eye,
  Globe,
  Plus,
  Trash2,
  Star,
  Loader2,
  RefreshCw,
  MapPin,
  MessageSquareQuote,
  Instagram,
  Phone,
} from "lucide-react";

export const Route = createFileRoute("/dashboard-x7k2_/quick")({
  loader: async () => {
    const restaurantData = await getRestaurantDataFn();
    if (restaurantData.isLocked) {
      throw notFound();
    }
    const isAuthed = await checkCmsAuthFn();
    return { restaurantData, isAuthed };
  },
  component: QuickDashboardPage,
});

function QuickDashboardPage() {
  const { restaurantData, isAuthed } = Route.useLoaderData();

  if (!isAuthed) {
    return <QuickLoginForm />;
  }

  return <QuickAdminForm initialData={restaurantData} />;
}

function QuickLoginForm() {
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const result = await cmsLoginFn({ data: { password } });
      if (result.success) {
        navigate({ to: "/dashboard-x7k2/quick" });
        window.location.reload();
      } else {
        setError(result.error ?? "Login failed.");
      }
    } catch (err) {
      setError("Server error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-sm bg-slate-900 border border-slate-800 rounded-2xl p-8 space-y-6 shadow-2xl shadow-black/60">
        <div className="flex justify-center">
          <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
            <Lock className="w-6 h-6" />
          </div>
        </div>
        <div className="space-y-1 text-center">
          <h1 className="text-2xl font-bold tracking-tight text-white">Quick CMS</h1>
          <p className="text-slate-400 text-sm">Enter operator password to continue.</p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="bg-slate-950 border-slate-800 text-white text-center text-lg tracking-widest focus-visible:ring-amber-500"
            placeholder="••••••••"
            autoFocus
          />
          {error && <p className="text-red-400 text-xs text-center font-medium">{error}</p>}
          <Button type="submit" disabled={loading} className="w-full bg-amber-500 hover:bg-amber-400 text-slate-950 font-semibold transition-all">
            {loading ? "Verifying…" : "Unlock Quick CMS"}
          </Button>
        </form>
      </div>
    </div>
  );
}

// ── Components for form ───────────────────────────────────────────────────────
const inputCls = "bg-slate-900/90 border-slate-800 text-white placeholder:text-slate-500 text-sm focus-visible:ring-amber-500 focus-visible:border-amber-500/50";

function FieldRow({ label, children, help }: { label: string; children: React.ReactNode; help?: string }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-slate-300 text-xs font-semibold uppercase tracking-wider">{label}</Label>
      {children}
      {help && <p className="text-xs text-slate-500">{help}</p>}
    </div>
  );
}

async function uploadFile(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const base64 = e.target?.result as string;
        const result = await uploadPhotoFn({ data: { base64, filename: file.name } });
        resolve(result.url);
      } catch (err) {
        reject(err);
      }
    };
    reader.onerror = () => reject(new Error("FileReader error"));
    reader.readAsDataURL(file);
  });
}

function PhotoUpload({
  value,
  onChange,
  label,
  help,
  badge,
  buttonLabel = "Upload Image",
  emptyLabel = "No image",
  placeholder = "/uploads/photo.jpg or /photos/1.webp",
}: {
  value: string;
  onChange: (url: string) => void;
  label?: string;
  help?: string;
  badge?: string;
  buttonLabel?: string;
  emptyLabel?: string;
  placeholder?: string;
}) {
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const url = await uploadFile(file);
      onChange(url);
    } catch {
      alert("Failed to upload image. Please try again.");
    } finally {
      setUploading(false);
    }
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const url = await uploadFile(file);
      onChange(url);
    } catch {
      alert("Failed to upload image. Please try again.");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        {label && <Label className="text-slate-300 text-xs font-semibold uppercase tracking-wider">{label}</Label>}
        {badge && (
          <span className="text-[10px] font-medium bg-sky-500/10 text-sky-400 border border-sky-500/20 px-2 py-0.5 rounded-full">
            {badge}
          </span>
        )}
      </div>

      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        className={`p-3.5 rounded-xl border transition-all ${
          dragOver
            ? "border-amber-500 bg-amber-500/10"
            : "border-slate-800 bg-slate-900/80 hover:border-slate-700"
        }`}
      >
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
          {/* Thumbnail preview */}
          {value ? (
            <div className="relative group shrink-0 w-20 h-20 rounded-lg bg-slate-950/80 border border-slate-700/80 flex items-center justify-center overflow-hidden p-1 shadow-inner">
              <img
                src={value}
                alt="Preview"
                className="w-full h-full object-cover rounded"
              />
              <button
                type="button"
                onClick={() => onChange("")}
                className="absolute inset-0 bg-black/70 opacity-0 group-hover:opacity-100 flex items-center justify-center text-red-400 transition-opacity"
                title="Remove image"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div className="shrink-0 w-20 h-20 rounded-lg border border-dashed border-slate-700 bg-slate-950/50 flex flex-col items-center justify-center text-slate-500 text-xs">
              <Upload className="w-5 h-5 mb-1 text-slate-400" />
              <span>{emptyLabel}</span>
            </div>
          )}

          {/* Action buttons & URL */}
          <div className="flex-1 space-y-2 w-full">
            <div className="flex items-center gap-2">
              <Button
                type="button"
                onClick={() => inputRef.current?.click()}
                disabled={uploading}
                className="bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-semibold h-8 px-3.5 shadow-sm transition-all"
              >
                <Upload className="w-3.5 h-3.5 mr-1.5" />
                {uploading ? "Uploading…" : value ? `Replace ${buttonLabel.replace("Upload ", "")}` : buttonLabel}
              </Button>
              {value && (
                <a
                  href={value}
                  target="_blank"
                  rel="noreferrer"
                  className="text-xs text-slate-400 hover:text-slate-200 flex items-center gap-1 px-2.5 py-1.5 rounded-md hover:bg-slate-800 transition-colors"
                >
                  <Eye className="w-3.5 h-3.5" />
                  <span>View</span>
                </a>
              )}
            </div>

            <Input
              value={value}
              onChange={(e) => onChange(e.target.value)}
              placeholder={placeholder}
              className="bg-slate-950/80 border-slate-800 text-slate-300 text-xs font-mono h-8"
            />
          </div>
        </div>

        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleFile}
        />
      </div>

      {help && <p className="text-xs text-slate-500">{help}</p>}
    </div>
  );
}

const SECTIONS = [
  { id: "loading-screen", name: "Loading Screen", icon: Sparkles, badge: "Global Initial Load" },
  { id: "homepage", name: "Homepage", icon: Home, badge: "Route: /" },
  { id: "menupage", name: "Menu Page", icon: UtensilsCrossed, badge: "Route: /menu" },
  { id: "contactpage", name: "Contact Page", icon: PhoneCall, badge: "Route: /contact" },
  { id: "footer", name: "Footer", icon: PanelBottom, badge: "Global Footer" },
];

function QuickAdminForm({ initialData }: { initialData: RestaurantData }) {
  const [data, setData] = useState<RestaurantData>(initialData);
  const [saving, setSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [activeSection, setActiveSection] = useState("loading-screen");

  // Google Reviews Fetch State
  const [googleProfileUrl, setGoogleProfileUrl] = useState(
    initialData.socialLinks?.maps || "https://maps.app.goo.gl/FF8mphjaHEt2PKtC7"
  );
  const [fetchingReviews, setFetchingReviews] = useState(false);
  const [fetchSuccessMessage, setFetchSuccessMessage] = useState<string | null>(null);
  const [fetchErrorMessage, setFetchErrorMessage] = useState<string | null>(null);

  const handleFetchGoogleReviews = async () => {
    if (!googleProfileUrl.trim()) {
      setFetchErrorMessage("Please enter a valid Google Profile or Google Maps link.");
      return;
    }
    setFetchingReviews(true);
    setFetchSuccessMessage(null);
    setFetchErrorMessage(null);

    try {
      const res = await fetchGoogleReviewsFn({ data: { url: googleProfileUrl.trim() } });
      if (res.success && res.reviews && res.reviews.length > 0) {
        setData((prev) => ({
          ...prev,
          reviews: res.reviews,
        }));
        setFetchSuccessMessage(
          `✓ Successfully fetched and loaded ${res.reviews.length} 5-star reviews for ${res.placeName || "your cafe"}!`
        );
      } else {
        setFetchErrorMessage("Could not extract reviews from this link. Please check the URL.");
      }
    } catch (err: any) {
      setFetchErrorMessage(err.message || "Failed to fetch Google reviews. Please try again.");
    } finally {
      setFetchingReviews(false);
    }
  };

  // Save handler
  const handleSaveAll = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setSaving(true);
    setSavedSuccess(false);

    try {
      await saveRestaurantDataFn({ data });
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 3500);
    } catch (err) {
      alert("Failed to save changes.");
    } finally {
      setSaving(false);
    }
  };

  const scrollToSection = (id: string) => {
    setActiveSection(id);
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  return (
    <div className="min-h-screen bg-[#090d16] text-slate-100 selection:bg-amber-500/30 selection:text-amber-200">
      {/* Top Sticky Header */}
      <header className="sticky top-0 z-40 bg-[#0c1220]/95 backdrop-blur-md border-b border-slate-800/80 px-4 sm:px-8 py-3.5 shadow-lg">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 font-bold text-sm">
              Q
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base font-bold text-white leading-none">Quick CMS</h1>
                <span className="text-[10px] font-semibold uppercase tracking-wider bg-amber-500/20 text-amber-300 border border-amber-500/30 px-2 py-0.5 rounded-full">
                  Section Mode
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">Page-by-page content editor for {data.name}</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <a
              href="/dashboard-x7k2"
              className="text-xs text-slate-400 hover:text-slate-200 hidden sm:flex items-center gap-1 transition-colors px-3 py-1.5 rounded-lg hover:bg-slate-800"
            >
              <SlidersHorizontal className="w-3.5 h-3.5" />
              Full CMS
            </a>
            <a
              href="/"
              target="_blank"
              rel="noreferrer"
              className="text-xs text-slate-300 hover:text-white flex items-center gap-1 transition-colors px-3 py-1.5 rounded-lg bg-slate-800/80 border border-slate-700/60 hover:bg-slate-800"
            >
              <span>View Site</span>
              <ArrowUpRight className="w-3.5 h-3.5 text-slate-400" />
            </a>
            <Button
              onClick={handleSaveAll}
              disabled={saving}
              className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-semibold px-4 text-xs h-8 shadow-sm transition-all cursor-pointer"
            >
              {saving ? "Saving…" : savedSuccess ? "✓ Saved" : "Save All Changes"}
            </Button>
          </div>
        </div>
      </header>

      {/* Sticky Secondary Navigation - Page Headings / Anchor Jump Bar */}
      <nav className="sticky top-[57px] z-30 bg-[#0f172a]/90 backdrop-blur-md border-b border-slate-800 px-4 sm:px-8 py-2">
        <div className="max-w-7xl mx-auto flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5">
          {SECTIONS.map((sec) => {
            const Icon = sec.icon;
            const isActive = activeSection === sec.id;
            return (
              <button
                key={sec.id}
                type="button"
                onClick={() => scrollToSection(sec.id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all cursor-pointer ${isActive
                    ? "bg-amber-500 text-slate-950 shadow font-semibold"
                    : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/60"
                  }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{sec.name}</span>
              </button>
            );
          })}
        </div>
      </nav>

      {/* Main Content Area */}
      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-10 space-y-12 pb-32">

        {/* Helper Banner */}
        <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-200/90 text-sm flex items-start gap-3">
          <Sparkles className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold text-amber-300">Sections Skeleton Configured!</p>
            <p className="text-xs text-amber-200/70 mt-0.5">
              Each page section has its own dedicated heading below. Review the layout and tell me exactly what inputs, toggles, or photos you want placed in each section.
            </p>
          </div>
        </div>

        {/* 1. LOADING SCREEN SECTION */}
        <section id="loading-screen" className="scroll-mt-28 bg-[#0f172a]/70 border border-slate-800 rounded-2xl p-6 sm:p-8 space-y-6 shadow-xl">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800/80 pb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-white tracking-tight">1. Loading Screen Section</h2>
                <p className="text-xs text-slate-400">Controls the initial splash screen animation and brand identity</p>
              </div>
            </div>
            <span className="text-xs font-semibold px-2.5 py-1 rounded-md bg-amber-500/10 text-amber-300 border border-amber-500/20 self-start sm:self-auto flex items-center gap-1.5">
              <Globe className="w-3 h-3" />
              Syncs Globally
            </span>
          </div>

          <div className="space-y-6">
            {/* 1. Logo image upload */}
            <PhotoUpload
              label="1. Cafe Logo Image (Global)"
              badge="Applies across Entire Website (Nav, Loading, Footer)"
              help="Upload your cafe's logo. It will automatically update the loading screen, top navbar, footer, and brand elements site-wide."
              value={data.logoUrl}
              onChange={(url) => setData({ ...data, logoUrl: url })}
            />

            <div className="grid sm:grid-cols-2 gap-5">
              {/* 2. Name of the cafe */}
              <FieldRow
                label="2. Cafe Name"
                help="Displayed prominently on the loading splash & header"
              >
                <Input
                  value={data.name}
                  onChange={(e) => setData({ ...data, name: e.target.value })}
                  className={inputCls}
                  placeholder="e.g. The Litup Cafe"
                />
              </FieldRow>

              {/* 3. Subtext */}
              <FieldRow
                label="3. Loading Subtext"
                help="Script text between pulsing dots on the intro screen"
              >
                <Input
                  value={data.loadingSubtext ?? "warming up the grill..."}
                  onChange={(e) => setData({ ...data, loadingSubtext: e.target.value })}
                  className={inputCls}
                  placeholder="e.g. warming up the grill..."
                />
              </FieldRow>
            </div>

            {/* Live Interactive Loading Screen Preview */}
            <div className="pt-2">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                  <Eye className="w-3.5 h-3.5 text-amber-400" />
                  Live Loading Screen Preview
                </span>
                <span className="text-[11px] text-slate-500">Updates in real-time as you edit above</span>
              </div>

              <div className="relative rounded-2xl overflow-hidden border border-slate-700/60 bg-[#FAF7EE] text-[#1F1E1D] p-8 sm:p-12 flex flex-col items-center justify-center text-center shadow-2xl">
                {/* Floating Logo */}
                {data.logoUrl ? (
                  <img
                    src={data.logoUrl}
                    alt={data.name}
                    className="h-24 sm:h-28 w-auto object-contain mb-4 drop-shadow-md animate-bounce"
                    style={{ animationDuration: "2s" }}
                  />
                ) : (
                  <div className="w-20 h-20 rounded-full border-2 border-dashed border-amber-600/40 flex items-center justify-center text-xs text-amber-800 mb-4">
                    Logo
                  </div>
                )}

                {/* Cafe Name */}
                <h3 className="font-serif font-black text-3xl sm:text-4xl text-[#1F1E1D] tracking-tight uppercase">
                  {data.name || "Cafe Name"}
                </h3>

                {/* Loading Subtext with Pulsing Bars */}
                <div className="mt-4 font-serif italic text-xl sm:text-2xl text-[#FF6B6B] flex items-center gap-2">
                  <span className="w-6 h-[3px] bg-[#FF6B6B]/60 rounded-full animate-pulse"></span>
                  <span>{data.loadingSubtext || "warming up the grill..."}</span>
                  <span className="w-6 h-[3px] bg-[#FF6B6B]/60 rounded-full animate-pulse"></span>
                </div>

                {/* Progress Bar Preview */}
                <div className="mt-6 w-48 h-2.5 rounded-full bg-slate-300 overflow-hidden shadow-inner">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-[#FF6B6B] via-[#FFA94D] to-[#FF6B6B] animate-pulse"
                    style={{ width: "80%" }}
                  />
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* 2. HOMEPAGE SECTION */}
        <section id="homepage" className="scroll-mt-28 bg-[#0f172a]/70 border border-slate-800 rounded-2xl p-6 sm:p-8 space-y-6 shadow-xl">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800/80 pb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
                <Home className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-white tracking-tight">2. Homepage Hero Section</h2>
                <p className="text-xs text-slate-400">Hero headlines, location badge, short story paragraph, and review stats</p>
              </div>
            </div>
            <span className="text-xs font-semibold px-2.5 py-1 rounded-md bg-slate-800 text-slate-300 border border-slate-700/60 self-start sm:self-auto">
              Route: /
            </span>
          </div>

          <div className="space-y-6">
            {/* Location & Timings Badge */}
            <FieldRow
              label="Location & Timings Badge (Above Headline)"
              help="e.g. DELHI · 10:00 AM – 10:30 PM EVERY DAY or Satya Niketan · open till 10:30 PM"
            >
              <Input
                value={data.heroLocationBadge}
                onChange={(e) => setData({ ...data, heroLocationBadge: e.target.value })}
                className={inputCls}
                placeholder="e.g. DELHI · 10:00 AM – 10:30 PM EVERY DAY"
              />
            </FieldRow>

            {/* 3-Line Headline Grid */}
            <div className="space-y-2">
              <Label className="text-slate-300 text-xs font-semibold uppercase tracking-wider">
                Big 3-Line Hero Headline
              </Label>
              <div className="grid sm:grid-cols-3 gap-4">
                <FieldRow label="Line 1 (Dark Bold)" help="First line, e.g. Loud music.">
                  <Input
                    value={data.heroHeadline[0] ?? ""}
                    onChange={(e) => {
                      const newHeadline: [string, string, string] = [
                        e.target.value,
                        data.heroHeadline[1] ?? "",
                        data.heroHeadline[2] ?? "",
                      ];
                      setData({ ...data, heroHeadline: newHeadline });
                    }}
                    className={inputCls}
                    placeholder="Loud music."
                  />
                </FieldRow>
                <FieldRow label="Line 2 (Coral Accent)" help="Second line in coral, e.g. Cheesy burgers.">
                  <Input
                    value={data.heroHeadline[1] ?? ""}
                    onChange={(e) => {
                      const newHeadline: [string, string, string] = [
                        data.heroHeadline[0] ?? "",
                        e.target.value,
                        data.heroHeadline[2] ?? "",
                      ];
                      setData({ ...data, heroHeadline: newHeadline });
                    }}
                    className={`${inputCls} text-coral font-semibold`}
                    placeholder="Cheesy burgers."
                  />
                </FieldRow>
                <FieldRow label="Line 3 (Marker Underline)" help="Third line with yellow line, e.g. Tiny tables.">
                  <Input
                    value={data.heroHeadline[2] ?? ""}
                    onChange={(e) => {
                      const newHeadline: [string, string, string] = [
                        data.heroHeadline[0] ?? "",
                        data.heroHeadline[1] ?? "",
                        e.target.value,
                      ];
                      setData({ ...data, heroHeadline: newHeadline });
                    }}
                    className={inputCls}
                    placeholder="Tiny tables."
                  />
                </FieldRow>
              </div>
            </div>

            {/* Script Annotation ("since 2014") */}
            <FieldRow
              label="Script Text beside Headline"
              help="Handwritten script annotation, e.g. since 2014"
            >
              <Input
                value={data.heroHeadlineSince}
                onChange={(e) => setData({ ...data, heroHeadlineSince: e.target.value })}
                className={inputCls}
                placeholder="e.g. since 2014"
              />
            </FieldRow>

            {/* Short Paragraph (Subcopy) */}
            <FieldRow
              label="Short Story Paragraph"
              help="Appears directly under the big headline"
            >
              <Textarea
                rows={3}
                value={data.heroSubcopy}
                onChange={(e) => setData({ ...data, heroSubcopy: e.target.value })}
                className={`${inputCls} resize-none`}
                placeholder="A scrappy little corner of Satya Niketan where DU South Campus has been celebrating birthdays, surviving deadlines, and arguing over the last momo for over a decade."
              />
            </FieldRow>

            {/* Rating, Reviews & Stat Badges */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-slate-300 text-xs font-semibold uppercase tracking-wider">
                    Rating, Reviews & Stat Badges (Below Buttons)
                  </Label>
                  <p className="text-xs text-slate-500">
                    Pills displaying reviews, press mentions, price range, etc.
                  </p>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setData({ ...data, heroStats: [...(data.heroStats ?? []), ""] })}
                  className="border-slate-700 bg-slate-800/60 text-slate-200 hover:text-white text-xs h-7 px-2.5"
                >
                  <Plus className="w-3.5 h-3.5 mr-1" />
                  Add Stat
                </Button>
              </div>

              <div className="space-y-2">
                {data.heroStats.map((stat, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    <Input
                      value={stat}
                      onChange={(e) => {
                        const newStats = [...data.heroStats];
                        newStats[idx] = e.target.value;
                        setData({ ...data, heroStats: newStats });
                      }}
                      className={inputCls}
                      placeholder={
                        idx === 0
                          ? "★ 4.3 · 1,567 reviews"
                          : idx === 1
                            ? "· Featured in Delhi Times & So Delhi"
                            : "· ₹400–900 for two"
                      }
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        const newStats = data.heroStats.filter((_, i) => i !== idx);
                        setData({ ...data, heroStats: newStats });
                      }}
                      className="text-slate-500 hover:text-red-400 hover:bg-red-500/10 h-8 w-8 p-0 shrink-0"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>

            {/* Hero Collage Photos (3 Images) */}
            <div className="space-y-3 pt-2">
              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-slate-300 text-xs font-semibold uppercase tracking-wider">
                    Hero Collage Photos (3 Images)
                  </Label>
                  <p className="text-xs text-slate-500">
                    Upload or replace the 3 featured photos displayed in the collage on the right of the homepage hero.
                  </p>
                </div>
                <span className="text-[10px] font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded-full">
                  3 Photos
                </span>
              </div>

              <div className="grid sm:grid-cols-3 gap-4">
                <PhotoUpload
                  label="Photo 1 (Tall Portrait / Top Right)"
                  help="Main tall photo at the top right"
                  buttonLabel="Upload Photo 1"
                  emptyLabel="No photo"
                  placeholder="/uploads/hero-1.jpg or /photos/3.webp"
                  value={data.heroCollagePhotos?.[0] ?? ""}
                  onChange={(url) => {
                    const next: [string, string, string] = [
                      url,
                      data.heroCollagePhotos?.[1] ?? "",
                      data.heroCollagePhotos?.[2] ?? "",
                    ];
                    setData({ ...data, heroCollagePhotos: next });
                  }}
                />
                <PhotoUpload
                  label="Photo 2 (Tilted Shot / Middle Left)"
                  help="Horizontal photo tilted left"
                  buttonLabel="Upload Photo 2"
                  emptyLabel="No photo"
                  placeholder="/uploads/hero-2.jpg or /photos/2.webp"
                  value={data.heroCollagePhotos?.[1] ?? ""}
                  onChange={(url) => {
                    const next: [string, string, string] = [
                      data.heroCollagePhotos?.[0] ?? "",
                      url,
                      data.heroCollagePhotos?.[2] ?? "",
                    ];
                    setData({ ...data, heroCollagePhotos: next });
                  }}
                />
                <PhotoUpload
                  label="Photo 3 (Bottom Landscape / Bottom Right)"
                  help="Featured wide photo at the bottom"
                  buttonLabel="Upload Photo 3"
                  emptyLabel="No photo"
                  placeholder="/uploads/hero-3.jpg or /photos/1.webp"
                  value={data.heroCollagePhotos?.[2] ?? ""}
                  onChange={(url) => {
                    const next: [string, string, string] = [
                      data.heroCollagePhotos?.[0] ?? "",
                      data.heroCollagePhotos?.[1] ?? "",
                      url,
                    ];
                    setData({ ...data, heroCollagePhotos: next });
                  }}
                />
              </div>
            </div>

            {/* Moving Bar Dishes (5 Dishes) */}
            <div className="space-y-4 pt-4 border-t border-slate-800/80">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <div className="flex items-center gap-2">
                    <Label className="text-slate-200 text-sm font-bold uppercase tracking-wider">
                      Moving Bar Dishes (5 Dishes)
                    </Label>
                    <span className="text-[10px] font-semibold bg-amber-500/20 text-amber-300 border border-amber-500/30 px-2 py-0.5 rounded-full">
                      ★ Auto-Formatted with Stars
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Enter any 5 dishes below. The yellow moving bar on your homepage will immediately replace its text with these 5 dishes separated by ★ stars.
                  </p>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    const defaultFive = ["KitKat Shake", "Steamy Momos", "Watermelon Mojito", "Brownie Fudge", "Cheesy Burgers"];
                    const itemsWithStars: string[] = [];
                    defaultFive.forEach((d) => {
                      itemsWithStars.push(d);
                      itemsWithStars.push("★");
                    });
                    setData({
                      ...data,
                      marqueeDishes: defaultFive,
                      marqueeItems: itemsWithStars,
                    });
                  }}
                  className="border-slate-700 bg-slate-800/60 text-slate-300 hover:text-white text-xs h-7 self-start sm:self-auto"
                >
                  Reset to Popular 5
                </Button>
              </div>

              {/* 5 Dish Inputs Grid */}
              {(() => {
                const currentDishes = (data.marqueeDishes && data.marqueeDishes.length === 5)
                  ? data.marqueeDishes
                  : (data.marqueeItems || []).filter((item) => item !== "★").slice(0, 5);
                const safeDishes = [
                  currentDishes[0] ?? "KitKat Shake",
                  currentDishes[1] ?? "Steamy Momos",
                  currentDishes[2] ?? "Watermelon Mojito",
                  currentDishes[3] ?? "Brownie Fudge",
                  currentDishes[4] ?? "Cheesy Burgers",
                ];

                const handleDishChange = (index: number, val: string) => {
                  const newDishes = [...safeDishes];
                  newDishes[index] = val;
                  const itemsWithStars: string[] = [];
                  newDishes.forEach((d) => {
                    if (d.trim()) {
                      itemsWithStars.push(d.trim());
                      itemsWithStars.push("★");
                    }
                  });
                  setData({
                    ...data,
                    marqueeDishes: newDishes,
                    marqueeItems: itemsWithStars.length > 0 ? itemsWithStars : data.marqueeItems,
                  });
                };

                const dishPlaceholders = [
                  "e.g. KitKat Shake",
                  "e.g. Steamy Momos",
                  "e.g. Watermelon Mojito",
                  "e.g. Brownie Fudge",
                  "e.g. Cheesy Burgers",
                ];

                return (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
                    {safeDishes.map((dish, i) => (
                      <div key={i} className="space-y-1.5 bg-slate-900/60 border border-slate-800 p-3 rounded-xl">
                        <div className="flex items-center justify-between">
                          <Label className="text-[11px] font-bold text-amber-400 uppercase tracking-wider">
                            Dish {i + 1}
                          </Label>
                          <span className="text-[10px] text-slate-500 font-mono">★ separator</span>
                        </div>
                        <Input
                          value={dish}
                          onChange={(e) => handleDishChange(i, e.target.value)}
                          className={`${inputCls} font-medium`}
                          placeholder={dishPlaceholders[i]}
                        />
                      </div>
                    ))}
                  </div>
                );
              })()}
            </div>

            {/* Live Interactive Hero & Marquee Preview */}
            <div className="pt-2">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                  <Eye className="w-3.5 h-3.5 text-emerald-400" />
                  Live Hero Section & Moving Bar Preview
                </span>
                <span className="text-[11px] text-slate-500">Updates live as you edit the fields above</span>
              </div>

              <div className="relative rounded-2xl overflow-hidden border border-slate-700/60 bg-[#FAF7EE] text-[#1F1E1D] shadow-2xl">
                <div className="p-6 sm:p-10 grid lg:grid-cols-12 gap-8 items-center text-left">
                  {/* Left Column: Text & Buttons */}
                  <div className="lg:col-span-7 space-y-5">
                    {/* Location Badge */}
                    <div className="flex items-center gap-2 text-xs font-semibold tracking-widest text-[#1F1E1D]/70 uppercase">
                      <span className="h-2 w-2 rounded-full bg-[#FF6B6B] animate-pulse" />
                      <span>{data.heroLocationBadge || "DELHI · 10:00 AM – 10:30 PM EVERY DAY"}</span>
                    </div>

                    {/* Big 3-Line Headline */}
                    <h1 className="font-serif font-black text-3xl sm:text-4xl md:text-5xl leading-[0.92] tracking-tight text-[#1F1E1D]">
                      <div>{data.heroHeadline[0] || "Loud music."}</div>
                      <div className="text-[#FF6B6B]">{data.heroHeadline[1] || "Cheesy burgers."}</div>
                      <div className="flex items-baseline gap-3 flex-wrap">
                        <span className="relative inline-block pb-1">
                          {data.heroHeadline[2] || "Tiny tables."}
                          <span className="absolute left-0 bottom-0.5 w-full h-[6px] bg-[#F5C242] -z-0 rounded-sm"></span>
                        </span>
                        <span className="font-serif italic text-xl sm:text-2xl text-[#6B8E23]">
                          {data.heroHeadlineSince || "since 2014"}
                        </span>
                      </div>
                    </h1>

                    {/* Short Paragraph */}
                    <p className="text-[#1F1E1D]/80 text-xs sm:text-sm max-w-xl leading-relaxed">
                      {data.heroSubcopy ||
                        "A scrappy little corner of Satya Niketan where DU South Campus has been celebrating birthdays, surviving deadlines, and arguing over the last momo for over a decade."}
                    </p>

                    {/* Buttons Preview */}
                    <div className="flex flex-wrap gap-2.5 pt-1">
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-[#1F1E1D] text-[#FAF7EE] px-4 py-2 text-xs font-medium">
                        Eat the menu →
                      </span>
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-[#F5C242] border-2 border-[#1F1E1D] text-[#1F1E1D] px-4 py-2 text-xs font-medium">
                        Find us / book a table
                      </span>
                    </div>

                    {/* Review & Stat Pills */}
                    <div className="flex flex-wrap items-center gap-x-5 gap-y-1.5 pt-2 text-xs text-[#1F1E1D]/70 font-medium">
                      {data.heroStats.map((s, i) => (
                        <span key={i}>{s}</span>
                      ))}
                    </div>
                  </div>

                  {/* Right Column: Hero Collage Preview with the 3 Photos */}
                  <div className="lg:col-span-5 relative h-64 sm:h-72 w-full">
                    {/* Photo 1: Top Right */}
                    <div className="absolute top-0 right-2 w-32 sm:w-40 h-44 sm:h-52 rounded-md overflow-hidden shadow-xl rotate-[4deg] bg-slate-200 border-2 border-white">
                      <img
                        src={data.heroCollagePhotos?.[0] || "/photos/3.webp"}
                        alt="Hero Collage 1"
                        className="h-full w-full object-cover"
                      />
                    </div>
                    {/* Photo 2: Middle Left */}
                    <div className="absolute top-16 left-2 w-36 sm:w-44 h-28 sm:h-36 rounded-md overflow-hidden shadow-xl -rotate-[5deg] bg-slate-200 border-2 border-white">
                      <img
                        src={data.heroCollagePhotos?.[1] || "/photos/2.webp"}
                        alt="Hero Collage 2"
                        className="h-full w-full object-cover"
                      />
                    </div>
                    {/* Photo 3: Bottom Right */}
                    <div className="absolute bottom-2 right-4 w-40 sm:w-48 h-32 sm:h-40 rounded-md overflow-hidden shadow-2xl rotate-[2deg] bg-slate-200 border-2 border-white">
                      <img
                        src={data.heroCollagePhotos?.[2] || "/photos/1.webp"}
                        alt="Hero Collage 3"
                        className="h-full w-full object-cover"
                      />
                    </div>
                  </div>
                </div>

                {/* Moving Bar Strip Live Preview */}
                {(() => {
                  const previewDishes = (data.marqueeDishes && data.marqueeDishes.length === 5)
                    ? data.marqueeDishes.filter((d) => d && d.trim().length > 0)
                    : (data.marqueeItems || []).filter((i) => i !== "★").slice(0, 5);

                  const activeDishes = previewDishes.length > 0
                    ? previewDishes
                    : ["KitKat Shake", "Steamy Momos", "Watermelon Mojito", "Brownie Fudge", "Cheesy Burgers"];

                  return (
                    <div className="bg-[#F5C242] text-[#1F1E1D] py-3 px-4 border-t-2 border-[#1F1E1D] overflow-hidden flex items-center font-display font-black text-xs sm:text-sm uppercase tracking-wider">
                      <div className="flex items-center gap-6 animate-pulse shrink-0">
                        {Array.from({ length: 2 }).map((_, copyIdx) => (
                          <div key={copyIdx} className="flex items-center gap-6 shrink-0">
                            {activeDishes.map((dish, dIdx) => (
                              <span key={dIdx} className="flex items-center gap-6">
                                <span className="hover:text-coral transition-colors">{dish}</span>
                                <span className="text-xs">★</span>
                              </span>
                            ))}
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })()}
              </div>
            </div>

            {/* Story Teaser (Photo, Text & Subtext) */}
            <div className="space-y-6 pt-6 border-t border-slate-800/80">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <Label className="text-slate-200 text-sm font-bold uppercase tracking-wider">
                      Homepage Story Teaser ("Our Whole Thing")
                    </Label>
                    <span className="text-[10px] font-semibold bg-coral/20 text-coral border border-coral/30 px-2 py-0.5 rounded-full">
                      Below Moving Bar
                    </span>
                    <span className="text-[10px] font-semibold bg-rose-500/20 text-rose-300 border border-rose-500/30 px-2 py-0.5 rounded-full flex items-center gap-1">
                      <Sparkles className="w-3 h-3 text-rose-400" />
                      Auto-Copies to About Page (/about)
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Controls the featured story picture, headline, script label, and body subtext shown right below the moving dishes strip. Automatically copies to the About Page hero section as well!
                  </p>
                </div>
              </div>

              {/* 1. Photo Upload */}
              <PhotoUpload
                label="Story Teaser Photo"
                help="Featured picture displayed on the left with decorative stripe accent"
                buttonLabel="Upload Story Photo"
                emptyLabel="No story photo"
                placeholder="/uploads/story.jpg or /photos/4.webp"
                value={data.storyTeaserPhoto ?? ""}
                onChange={(url) => setData({ ...data, storyTeaserPhoto: url })}
              />

              {/* 2. Script Tagline & Headline Inputs */}
              <div className="space-y-4">
                <FieldRow
                  label="Script Tagline (Above Headline)"
                  help="e.g. our whole thing →"
                >
                  <Input
                    value={data.storyTeaserScriptLabel ?? ""}
                    onChange={(e) => setData({ ...data, storyTeaserScriptLabel: e.target.value })}
                    className={inputCls}
                    placeholder="our whole thing →"
                  />
                </FieldRow>

                <div className="space-y-2">
                  <Label className="text-slate-300 text-xs font-semibold uppercase tracking-wider">
                    Story Headline
                  </Label>
                  <div className="grid sm:grid-cols-3 gap-4">
                    <FieldRow label="Prefix Text" help="e.g. Eleven years of">
                      <Input
                        value={data.storyTeaserPrefix ?? "Eleven years of"}
                        onChange={(e) => setData({ ...data, storyTeaserPrefix: e.target.value })}
                        className={inputCls}
                        placeholder="Eleven years of"
                      />
                    </FieldRow>
                    <FieldRow label="Highlight 1 (Yellow Underline)" help="e.g. fairy lights">
                      <Input
                        value={data.storyTeaserH2?.[0] ?? ""}
                        onChange={(e) => {
                          const nextH2: [string, string] = [e.target.value, data.storyTeaserH2?.[1] ?? ""];
                          setData({ ...data, storyTeaserH2: nextH2 });
                        }}
                        className={inputCls}
                        placeholder="fairy lights"
                      />
                    </FieldRow>
                    <FieldRow label="Highlight 2 (Coral Text)" help="e.g. first-year crushes">
                      <Input
                        value={data.storyTeaserH2?.[1] ?? ""}
                        onChange={(e) => {
                          const nextH2: [string, string] = [data.storyTeaserH2?.[0] ?? "", e.target.value];
                          setData({ ...data, storyTeaserH2: nextH2 });
                        }}
                        className={`${inputCls} text-coral font-semibold`}
                        placeholder="first-year crushes"
                      />
                    </FieldRow>
                  </div>
                </div>
              </div>

              {/* 3. Subtext Paragraph */}
              <FieldRow
                label="Story Subtext / Paragraph"
                help="The descriptive story paragraph displayed beside the photo"
              >
                <Textarea
                  rows={4}
                  value={data.storyTeaserBody ?? ""}
                  onChange={(e) => setData({ ...data, storyTeaserBody: e.target.value })}
                  className={`${inputCls} resize-none leading-relaxed`}
                  placeholder="The Litup Cafe opened on the first floor of a tiny Satya Niketan building in 2014 with three tables, one speaker, and a wall full of empty space. Today the walls are covered in sticky-note confessions, the speaker is louder, and there are still never quite enough tables on a Friday night."
                />
              </FieldRow>

              {/* Live Interactive Story Teaser Preview */}
              <div className="pt-2">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                    <Eye className="w-3.5 h-3.5 text-coral" />
                    Live Story Teaser Preview
                  </span>
                  <span className="text-[11px] text-slate-500">Matches your homepage story section exactly</span>
                </div>

                <div className="relative rounded-2xl overflow-hidden border border-slate-700/60 bg-[#FAF7EE] text-[#1F1E1D] p-6 sm:p-10 shadow-2xl">
                  <div className="grid md:grid-cols-12 gap-8 items-center text-left">
                    {/* Photo on Left with decorative accent */}
                    <div className="md:col-span-5 relative">
                      <div className="absolute -top-3 -left-3 w-16 h-16 bg-[#F5C242] rounded-md opacity-80 -z-0" />
                      <div className="relative z-10 rounded-md overflow-hidden shadow-xl border border-black/10 aspect-[4/5] bg-slate-200">
                        {data.storyTeaserPhoto ? (
                          <img
                            src={data.storyTeaserPhoto}
                            alt="Story teaser"
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-xs text-slate-400">
                            No photo selected
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Content on Right */}
                    <div className="md:col-span-7 space-y-4">
                      {/* Script Label */}
                      <p className="font-serif italic text-coral text-2xl sm:text-3xl">
                        {data.storyTeaserScriptLabel || "our whole thing →"}
                      </p>

                      {/* Headline */}
                      <h2 className="text-3xl sm:text-4xl md:text-5xl font-black font-serif leading-[0.95] text-[#1F1E1D]">
                        {data.storyTeaserPrefix || "Eleven years of"}{" "}
                        <span className="relative inline-block pb-1">
                          {data.storyTeaserH2?.[0] || "fairy lights"}
                          <span className="absolute left-0 bottom-0.5 w-full h-[6px] bg-[#F5C242] -z-0 rounded-sm"></span>
                        </span>{" "}
                        and
                        <span className="text-coral"> {data.storyTeaserH2?.[1] || "first-year crushes"}</span>.
                      </h2>

                      {/* Subtext Body */}
                      <p className="text-[#1F1E1D]/80 text-xs sm:text-sm leading-relaxed max-w-xl">
                        {data.storyTeaserBody ||
                          "The Litup Cafe opened on the first floor of a tiny Satya Niketan building in 2014 with three tables, one speaker, and a wall full of empty space. Today the walls are covered in sticky-note confessions, the speaker is louder, and there are still never quite enough tables on a Friday night."}
                      </p>

                      {/* Read story link */}
                      <div className="pt-2">
                        <span className="inline-flex items-center gap-1.5 font-semibold text-xs sm:text-sm border-b-2 border-[#1F1E1D] pb-0.5">
                          Read the full story →
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* 4 Featured Food Dishes ("What Everybody Orders") */}
            <div className="space-y-6 pt-6 border-t border-slate-800/80">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <div className="flex items-center gap-2">
                    <Label className="text-slate-200 text-sm font-bold uppercase tracking-wider">
                      4 Featured Food Dishes ("What Everybody Orders")
                    </Label>
                    <span className="text-[10px] font-semibold bg-amber-500/20 text-amber-300 border border-amber-500/30 px-2 py-0.5 rounded-full">
                      Homepage Grid (4 Cards)
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Upload 4 food photos along with their dish name and price. These 4 featured dishes appear in the signature dark section on your homepage.
                  </p>
                </div>
              </div>

              {/* 4 Cards Grid */}
              {(() => {
                const defaultFour: SignatureDish[] = [
                  { name: "Cheese Blast Burger", tag: "Fan Favorite", price: "₹220", img: "/photos/7.jpg", veg: false },
                  { name: "Ferrero Fantasy", tag: "Bestseller", price: "₹180", img: "/photos/11.jpg", veg: true },
                  { name: "Mix Sauce Pasta", tag: "Regulars' Pick", price: "₹220", img: "/photos/10.jpg", veg: true },
                  { name: "Cheesy Chicken Feast", tag: "Munchies MVP", price: "₹190", img: "/photos/12.jpg", veg: false },
                ];

                const dishes = [
                  data.signatureDishes?.[0] || defaultFour[0],
                  data.signatureDishes?.[1] || defaultFour[1],
                  data.signatureDishes?.[2] || defaultFour[2],
                  data.signatureDishes?.[3] || defaultFour[3],
                ];

                const updateSignatureDish = (index: number, updatedFields: Partial<SignatureDish>) => {
                  const nextDishes = [...dishes];
                  nextDishes[index] = { ...nextDishes[index], ...updatedFields };
                  const remaining = (data.signatureDishes || []).slice(4);
                  setData({
                    ...data,
                    signatureDishes: [...nextDishes, ...remaining],
                  });
                };

                return (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    {dishes.map((dish, i) => (
                      <div
                        key={i}
                        className="bg-slate-900/60 border border-slate-800 rounded-2xl p-5 space-y-4 hover:border-slate-700 transition-colors shadow-lg"
                      >
                        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                          <div className="flex items-center gap-2">
                            <span className="w-6 h-6 rounded-full bg-amber-500/20 text-amber-300 flex items-center justify-center text-xs font-bold font-mono">
                              {i + 1}
                            </span>
                            <span className="text-sm font-bold text-white">
                              {dish.name || `Featured Dish ${i + 1}`}
                            </span>
                          </div>
                          <button
                            type="button"
                            onClick={() => updateSignatureDish(i, { veg: !dish.veg })}
                            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium border transition-colors cursor-pointer ${
                              dish.veg
                                ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/20"
                                : "bg-red-500/10 text-red-400 border-red-500/30 hover:bg-red-500/20"
                            }`}
                            title="Click to toggle Veg / Non-Veg"
                          >
                            <span
                              className={`w-2 h-2 rounded-full ${
                                dish.veg ? "bg-emerald-400" : "bg-red-400"
                              }`}
                            />
                            <span>{dish.veg ? "Veg" : "Non-Veg"}</span>
                          </button>
                        </div>

                        {/* Photo Upload for Dish */}
                        <PhotoUpload
                          label={`Dish ${i + 1} Photo`}
                          help="Food picture for this card"
                          buttonLabel="Upload Food Photo"
                          emptyLabel="No food photo"
                          placeholder="/uploads/dish.jpg or /photos/7.jpg"
                          value={dish.img ?? ""}
                          onChange={(url) => updateSignatureDish(i, { img: url })}
                        />

                        {/* Dish Name & Price in 2 Columns */}
                        <div className="grid grid-cols-2 gap-3">
                          <FieldRow label="Dish Name" help="e.g. Cheese Blast Burger">
                            <Input
                              value={dish.name}
                              onChange={(e) => updateSignatureDish(i, { name: e.target.value })}
                              className={inputCls}
                              placeholder="e.g. Cheese Blast Burger"
                            />
                          </FieldRow>

                          <FieldRow label="Price" help="e.g. ₹220">
                            <Input
                              value={dish.price}
                              onChange={(e) => updateSignatureDish(i, { price: e.target.value })}
                              className={inputCls}
                              placeholder="e.g. ₹220"
                            />
                          </FieldRow>
                        </div>

                        {/* Badge / Tag */}
                        <FieldRow label="Badge Tag (Optional)" help="e.g. Fan Favorite, Bestseller, Regulars' Pick">
                          <Input
                            value={dish.tag}
                            onChange={(e) => updateSignatureDish(i, { tag: e.target.value })}
                            className={inputCls}
                            placeholder="e.g. Bestseller"
                          />
                        </FieldRow>
                      </div>
                    ))}
                  </div>
                );
              })()}

              {/* Live Interactive "What Everybody Orders" Preview */}
              <div className="pt-2">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                    <Eye className="w-3.5 h-3.5 text-amber-400" />
                    Live "What Everybody Orders" Preview
                  </span>
                  <span className="text-[11px] text-slate-500">Reflects your 4 food photos, names, and prices live</span>
                </div>

                <div className="relative rounded-2xl overflow-hidden border border-slate-700/60 bg-[#161a24] text-cream p-6 sm:p-10 shadow-2xl">
                  {/* Top Header */}
                  <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-slate-700/60 pb-6 mb-8 text-left">
                    <div>
                      <p className="font-serif italic text-amber-400 text-2xl sm:text-3xl">the regulars know</p>
                      <h3 className="text-2xl sm:text-3xl md:text-4xl font-black font-serif text-white mt-1">
                        What everybody orders.
                      </h3>
                    </div>
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-400 text-slate-950 font-bold px-4 py-2 text-xs w-fit">
                      See the full menu →
                    </span>
                  </div>

                  {/* 4 Cards Preview */}
                  {(() => {
                    const defaultFour: SignatureDish[] = [
                      { name: "Cheese Blast Burger", tag: "Fan Favorite", price: "₹220", img: "/photos/7.jpg", veg: false },
                      { name: "Ferrero Fantasy", tag: "Bestseller", price: "₹180", img: "/photos/11.jpg", veg: true },
                      { name: "Mix Sauce Pasta", tag: "Regulars' Pick", price: "₹220", img: "/photos/10.jpg", veg: true },
                      { name: "Cheesy Chicken Feast", tag: "Munchies MVP", price: "₹190", img: "/photos/12.jpg", veg: false },
                    ];

                    const dishes = [
                      data.signatureDishes?.[0] || defaultFour[0],
                      data.signatureDishes?.[1] || defaultFour[1],
                      data.signatureDishes?.[2] || defaultFour[2],
                      data.signatureDishes?.[3] || defaultFour[3],
                    ];

                    return (
                      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 text-left">
                        {dishes.map((s, i) => (
                          <div
                            key={i}
                            className={`group relative bg-[#FAF7EE] text-[#1F1E1D] rounded-xl overflow-hidden shadow-xl transition-all duration-300 ${
                              i % 2 === 0 ? "rotate-[-1.5deg]" : "rotate-[1.5deg]"
                            }`}
                          >
                            <div className="aspect-[4/5] overflow-hidden bg-slate-200">
                              {s.img ? (
                                <img
                                  src={s.img}
                                  alt={s.name}
                                  className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-500"
                                />
                              ) : (
                                <div className="h-full w-full flex items-center justify-center text-xs text-slate-400">
                                  No image
                                </div>
                              )}
                            </div>
                            <div className="p-3.5 space-y-1.5">
                              <div className="flex items-center justify-between gap-1">
                                <span className="inline-flex items-center gap-1 text-[9px] uppercase tracking-wider font-bold text-coral">
                                  <span
                                    className={`w-2 h-2 rounded-full ${
                                      s.veg ? "bg-emerald-500" : "bg-red-500"
                                    }`}
                                  />
                                  <span>{s.tag || "Special"}</span>
                                </span>
                                <span className="font-display font-black text-sm text-[#1F1E1D]">{s.price}</span>
                              </div>
                              <h4 className="text-xs sm:text-sm font-black leading-tight text-[#1F1E1D] line-clamp-2">
                                {s.name || `Dish ${i + 1}`}
                              </h4>
                            </div>
                          </div>
                        ))}
                      </div>
                    );
                  })()}
                </div>
              </div>
            </div>

            {/* Google Reviews Sticky Notes ("Things People Actually Said") */}
            <div className="space-y-6 pt-6 border-t border-slate-800/80">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <div className="flex items-center gap-2">
                    <Label className="text-slate-200 text-sm font-bold uppercase tracking-wider">
                      Google Reviews Sticky Notes ("Things People Actually Said")
                    </Label>
                    <span className="text-[10px] font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-2 py-0.5 rounded-full flex items-center gap-1">
                      <Star className="w-3 h-3 fill-emerald-300 text-emerald-300" />
                      Auto-Fetch Top 10 5-Star Reviews
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Paste your cafe's Google Maps link below. Click "Fetch Top 10 5-Star Reviews" and it will automatically retrieve 10 glowing 5-star customer reviews to replace the sticky notes wall on your homepage!
                  </p>
                </div>
              </div>

              {/* Auto-Fetch Tool Card */}
              <div className="bg-gradient-to-r from-amber-500/10 via-slate-900 to-amber-500/10 border border-amber-500/30 p-5 rounded-2xl space-y-4 shadow-xl">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center">
                      <MapPin className="w-4 h-4" />
                    </div>
                    <Label className="text-slate-200 text-xs font-bold uppercase tracking-wider">
                      Paste Cafe's Google Profile / Google Maps Link
                    </Label>
                  </div>
                  <span className="text-[10px] text-amber-300/80 font-mono">Auto 5-Star Extraction</span>
                </div>

                <div className="flex flex-col sm:flex-row gap-3">
                  <Input
                    value={googleProfileUrl}
                    onChange={(e) => setGoogleProfileUrl(e.target.value)}
                    placeholder="https://maps.app.goo.gl/... or https://www.google.com/maps/place/..."
                    className="flex-1 bg-slate-950 border-amber-500/30 text-amber-200 placeholder:text-slate-600 text-xs font-mono h-10"
                  />
                  <Button
                    type="button"
                    onClick={handleFetchGoogleReviews}
                    disabled={fetchingReviews}
                    className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold px-5 h-10 shadow-md transition-all cursor-pointer shrink-0"
                  >
                    {fetchingReviews ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Fetching 5-Star Reviews…
                      </>
                    ) : (
                      <>
                        <Star className="w-4 h-4 mr-1.5 fill-slate-950 text-slate-950" />
                        Fetch Top 10 5-Star Reviews
                      </>
                    )}
                  </Button>
                </div>

                {/* Status Notifications */}
                {fetchingReviews && (
                  <div className="flex items-center gap-2.5 text-xs text-amber-200 bg-amber-500/15 border border-amber-500/30 p-3 rounded-xl animate-pulse">
                    <Loader2 className="w-4 h-4 text-amber-400 animate-spin shrink-0" />
                    <span>
                      Connecting to Google profile, resolving cafe details, and extracting top 10 verified 5-star customer reviews… Please wait a few seconds.
                    </span>
                  </div>
                )}

                {fetchSuccessMessage && (
                  <div className="flex items-center gap-2.5 text-xs text-emerald-200 bg-emerald-500/15 border border-emerald-500/30 p-3.5 rounded-xl">
                    <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                    <div className="space-y-0.5">
                      <p className="font-bold text-emerald-300">Reviews Successfully Loaded!</p>
                      <p className="text-emerald-200/90">{fetchSuccessMessage}</p>
                    </div>
                  </div>
                )}

                {fetchErrorMessage && (
                  <div className="flex items-center gap-2.5 text-xs text-red-200 bg-red-500/15 border border-red-500/30 p-3.5 rounded-xl">
                    <X className="w-5 h-5 text-red-400 shrink-0" />
                    <div className="space-y-0.5">
                      <p className="font-bold text-red-300">Could Not Fetch Reviews</p>
                      <p className="text-red-200/90">{fetchErrorMessage}</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Current Reviews Editor (10 Items) */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Label className="text-slate-300 text-xs font-semibold uppercase tracking-wider">
                      Loaded Reviews ({data.reviews?.length ?? 0} Reviews)
                    </Label>
                    <span className="text-[10px] text-slate-500">Editable below</span>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setData({
                        ...data,
                        reviews: [...(data.reviews || []), { text: "Amazing cafe and great food!", who: "Customer" }],
                      });
                    }}
                    className="border-slate-700 bg-slate-800/60 text-slate-300 hover:text-white text-xs h-7"
                  >
                    <Plus className="w-3.5 h-3.5 mr-1" />
                    Add Review
                  </Button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-[420px] overflow-y-auto pr-1 no-scrollbar">
                  {(data.reviews || []).map((rev, idx) => (
                    <div
                      key={idx}
                      className="bg-slate-900/80 border border-slate-800 rounded-xl p-3.5 space-y-2.5 hover:border-slate-700 transition-colors shadow"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5">
                          <span className="text-[10px] font-mono font-bold bg-amber-500/20 text-amber-300 px-1.5 py-0.5 rounded">
                            #{idx + 1}
                          </span>
                          <span className="text-[11px] text-amber-400 flex items-center gap-0.5 font-bold">
                            ★★★★★ <span className="text-slate-400 font-normal ml-1">5.0</span>
                          </span>
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            const newReviews = data.reviews.filter((_, i) => i !== idx);
                            setData({ ...data, reviews: newReviews });
                          }}
                          className="text-slate-500 hover:text-red-400 hover:bg-red-500/10 h-6 w-6 p-0 shrink-0"
                          title="Delete review"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </div>

                      <Textarea
                        rows={2}
                        value={rev.text}
                        onChange={(e) => {
                          const nextReviews = [...data.reviews];
                          nextReviews[idx] = { ...nextReviews[idx], text: e.target.value };
                          setData({ ...data, reviews: nextReviews });
                        }}
                        className={`${inputCls} text-xs resize-none leading-relaxed`}
                        placeholder="Review quote..."
                      />

                      <div className="flex items-center gap-2">
                        <span className="text-[11px] text-slate-500 uppercase font-semibold">Reviewer:</span>
                        <Input
                          value={rev.who}
                          onChange={(e) => {
                            const nextReviews = [...data.reviews];
                            nextReviews[idx] = { ...nextReviews[idx], who: e.target.value };
                            setData({ ...data, reviews: nextReviews });
                          }}
                          className={`${inputCls} text-xs h-7`}
                          placeholder="Name (e.g. Simran Gaha)"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Live Interactive Sticky Notes Wall Preview */}
              <div className="pt-2">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                    <Eye className="w-3.5 h-3.5 text-amber-400" />
                    Live Sticky Notes Wall Preview ("Things People Actually Said")
                  </span>
                  <span className="text-[11px] text-slate-500">Matches your homepage wishes wall</span>
                </div>

                <div className="relative rounded-2xl overflow-hidden border border-slate-700/60 bg-[#FAF7EE] text-[#1F1E1D] p-6 sm:p-10 shadow-2xl space-y-6">
                  {/* Top Header */}
                  <div className="text-left space-y-1">
                    <p className="font-serif italic text-[#6B8E23] text-2xl sm:text-3xl">
                      straight from the wishes wall
                    </p>
                    <h3 className="text-3xl sm:text-4xl md:text-5xl font-black font-serif leading-[0.95] text-[#1F1E1D]">
                      Things people{" "}
                      <span className="relative inline-block pb-0.5">
                        actually
                        <span className="absolute left-0 bottom-0.5 w-full h-[6px] bg-[#F5C242] -z-0 rounded-sm"></span>
                      </span>{" "}
                      said.
                    </h3>
                  </div>

                  {/* Horizontal Scrolling Sticky Notes Ribbon */}
                  <div className="overflow-x-auto py-4 -my-2 flex gap-5 no-scrollbar">
                    {(data.reviews || []).slice(0, 10).map((r, i) => {
                      const rotations = ["-2.5deg", "1.8deg", "-1.2deg", "2.2deg", "-2deg", "1.5deg"];
                      const rot = rotations[i % rotations.length];
                      return (
                        <div
                          key={i}
                          className="shrink-0 w-64 sm:w-72 bg-[#FDF3A7] text-[#1F1E1D] p-5 rounded shadow-md border border-[#E8DE8C]/60 flex flex-col justify-between transition-transform hover:scale-105 duration-300"
                          style={{ transform: `rotate(${rot})` }}
                        >
                          <p className="font-serif italic text-base leading-snug text-[#1F1E1D]">
                            "{r.text}"
                          </p>
                          <p className="mt-5 text-[11px] uppercase tracking-widest text-[#1F1E1D]/75 font-semibold text-left">
                            — {r.who}
                          </p>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>

            {/* 10 Homepage Showcase Photos ("A Peek Inside") */}
            <div className="space-y-6 pt-6 border-t border-slate-800/80">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <div className="flex items-center gap-2">
                    <Label className="text-slate-200 text-sm font-bold uppercase tracking-wider">
                      10 Homepage Showcase Photos ("A Peek Inside")
                    </Label>
                    <span className="text-[10px] font-semibold bg-sky-500/20 text-sky-300 border border-sky-500/30 px-2 py-0.5 rounded-full flex items-center gap-1">
                      <Sparkles className="w-3 h-3 text-sky-400" />
                      Auto-Syncs to Gallery "Everything"
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Upload or replace the 10 photos displayed in the creative mosaic on your homepage. These 10 photos automatically display on the Gallery page inside the "Everything" tab without having to re-upload them!
                  </p>
                </div>
              </div>

              {/* 10 Photos Upload Grid */}
              {(() => {
                const defaultTen = [
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

                const currentTen =
                  data.homepageGalleryPhotos && data.homepageGalleryPhotos.length >= 10
                    ? data.homepageGalleryPhotos.slice(0, 10)
                    : defaultTen.map((d, i) => data.homepageGalleryPhotos?.[i] || d);

                const updateHomepagePhoto = (index: number, url: string) => {
                  const nextPhotos = [...currentTen];
                  nextPhotos[index] = url;
                  setData({
                    ...data,
                    homepageGalleryPhotos: nextPhotos,
                  });
                };

                const photoLabels = [
                  "Photo 1 (Tall Arch Left)",
                  "Photo 2 (Top Oval)",
                  "Photo 3 (Rounded Squircle)",
                  "Photo 4 (Pill Capsule)",
                  "Photo 5 (Arched Top)",
                  "Photo 6 (Tall Mosaic Center)",
                  "Photo 7 (Diagonal Cut)",
                  "Photo 8 (Circle Frame)",
                  "Photo 9 (Bottom Arch)",
                  "Photo 10 (Accent Cut)",
                ];

                return (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
                    {currentTen.map((photoUrl, i) => (
                      <div
                        key={i}
                        className="bg-slate-900/70 border border-slate-800 rounded-xl p-3.5 space-y-3 hover:border-slate-700 transition-colors shadow-md"
                      >
                        <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                          <span className="text-xs font-bold text-amber-400">
                            #{i + 1}
                          </span>
                          <span className="text-[10px] text-slate-400 truncate max-w-[120px]">
                            {photoLabels[i]}
                          </span>
                        </div>

                        <PhotoUpload
                          buttonLabel={`Upload Photo ${i + 1}`}
                          emptyLabel={`No photo ${i + 1}`}
                          placeholder={`/photos/${(i % 4) + 1}.webp`}
                          value={photoUrl}
                          onChange={(url) => updateHomepagePhoto(i, url)}
                        />
                      </div>
                    ))}
                  </div>
                );
              })()}

              {/* Live Interactive "A Peek Inside" Preview */}
              <div className="pt-2">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                    <Eye className="w-3.5 h-3.5 text-sky-400" />
                    Live "A Peek Inside" Mosaic Preview
                  </span>
                  <span className="text-[11px] text-slate-500">
                    Matches your homepage geometric mosaic
                  </span>
                </div>

                <div className="relative rounded-2xl overflow-hidden border border-slate-700/60 bg-[#FAF7EE] text-[#1F1E1D] p-6 sm:p-10 shadow-2xl space-y-6 text-left">
                  {/* Header */}
                  <div className="flex items-end justify-between flex-wrap gap-4 border-b border-[#1F1E1D]/10 pb-4">
                    <h3 className="text-3xl sm:text-4xl md:text-5xl font-black font-serif text-[#1F1E1D]">
                      A peek inside.
                    </h3>
                    <span className="font-semibold text-xs sm:text-sm border-b-2 border-[#1F1E1D] pb-0.5 text-[#1F1E1D]">
                      Full gallery →
                    </span>
                  </div>

                  {/* Geometric Mosaic Grid with 10 Photos */}
                  {(() => {
                    const defaultTen = [
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
                        : defaultTen;

                    const radii = [
                      "rounded-tl-[2.5rem] rounded-br-[2.5rem] rounded-tr-md rounded-bl-md",
                      "rounded-full",
                      "rounded-3xl",
                      "rounded-[2rem]",
                      "rounded-t-full rounded-b-xl",
                      "rounded-2xl",
                      "rounded-bl-[3rem] rounded-tr-[3rem] rounded-tl-xl rounded-br-xl",
                      "rounded-full",
                      "rounded-t-full rounded-b-xl",
                      "rounded-[2rem]",
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

                    return (
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
                        {photos.slice(0, 10).map((src, i) => {
                          const isTall = i % 4 === 0 || i === 5;
                          return (
                            <div
                              key={i}
                              className={`group overflow-hidden border-2 border-[#1F1E1D] bg-[#F5C242] shadow-[3px_3px_0px_#1F1E1D] transition-all duration-300 ${
                                isTall ? "row-span-2 aspect-[3/5]" : "aspect-square"
                              } ${radii[i % radii.length]} ${rotations[i % rotations.length]}`}
                            >
                              <img
                                src={src}
                                alt={`Cafe vibe ${i + 1}`}
                                className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105 filter contrast-125 saturate-[1.1]"
                              />
                            </div>
                          );
                        })}
                      </div>
                    );
                  })()}
                </div>
              </div>
            </div>

            {/* Homepage Location, Hours, Phone & Google Maps Section */}
            <div className="space-y-6 pt-6 border-t border-slate-800/80">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <div className="flex items-center gap-2">
                    <Label className="text-slate-200 text-sm font-bold uppercase tracking-wider">
                      Homepage Location, Hours & Map ("Find the door with the fairy lights")
                    </Label>
                    <span className="text-[10px] font-semibold bg-teal-500/20 text-teal-300 border border-teal-500/30 px-2 py-0.5 rounded-full flex items-center gap-1">
                      <Sparkles className="w-3 h-3 text-teal-400" />
                      Auto-Syncs to Contact Page (/contact)
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Update your cafe's full address, opening hours, calling phone number (replaces price on the homepage), and Google Maps embed link. Changes here automatically populate the Contact page and Footer — no need to re-enter!
                  </p>
                </div>
              </div>

              {/* Grid of Location Inputs */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {/* 1. Address */}
                <div className="md:col-span-2">
                  <FieldRow
                    label="Cafe Address (Full Street Address)"
                    help="Displayed on the Homepage location card and the Contact page"
                  >
                    <Textarea
                      rows={2}
                      value={data.address}
                      onChange={(e) => {
                        const newAddr = e.target.value;
                        setData({
                          ...data,
                          address: newAddr,
                          addressShort: data.addressShort || newAddr.split(",")[0] || newAddr,
                        });
                      }}
                      className={`${inputCls} resize-none`}
                      placeholder="e.g. 96, 1st, Satya Niketan, opposite Venkateshwar college, Moti Bagh II, Satya Niketan, South Moti Bagh, New Delhi, Delhi, 110021"
                    />
                  </FieldRow>
                </div>

                {/* 2. Hours */}
                <FieldRow
                  label="Operating Hours"
                  help="e.g. 10:00 am – 10:30 pm every day"
                >
                  <Input
                    value={data.hours}
                    onChange={(e) =>
                      setData({
                        ...data,
                        hours: e.target.value,
                        hoursShort: data.hoursShort || e.target.value,
                      })
                    }
                    className={inputCls}
                    placeholder="e.g. 10:00 am – 10:30 pm every day"
                  />
                </FieldRow>

                {/* 3. Phone Number */}
                <FieldRow
                  label="Phone Number (Replaces Price on Homepage)"
                  help="Displayed directly under Hours on Homepage and on the Contact page"
                >
                  <Input
                    value={data.phone}
                    onChange={(e) => {
                      const newPhone = e.target.value;
                      const digits = newPhone.replace(/[^0-9]/g, "");
                      setData({
                        ...data,
                        phone: newPhone,
                        whatsappNumber: digits || data.whatsappNumber,
                      });
                    }}
                    className={inputCls}
                    placeholder="e.g. +91 99997 39766"
                  />
                </FieldRow>

                {/* 4. Google Maps Embed Link / Query */}
                <FieldRow
                  label="Google Maps Embed Link / Place Query"
                  help="Paste your Google Maps embed URL (https://www.google.com/maps/embed?...), <iframe> tag, or cafe search query"
                >
                  <Input
                    value={data.mapsEmbedQuery}
                    onChange={(e) => setData({ ...data, mapsEmbedQuery: e.target.value })}
                    className={`${inputCls} font-mono text-xs`}
                    placeholder="e.g. https://www.google.com/maps/embed?... or The Litup Cafe Hudson Lane"
                  />
                </FieldRow>

                {/* 5. Google Maps Navigation Link */}
                <FieldRow
                  label="'Open in Google Maps' Button Link"
                  help="Direct Google Maps URL opened when clicking the button on Homepage or Contact page"
                >
                  <Input
                    value={data.socialLinks?.maps ?? ""}
                    onChange={(e) =>
                      setData({
                        ...data,
                        socialLinks: {
                          ...data.socialLinks,
                          maps: e.target.value,
                        },
                      })
                    }
                    className={`${inputCls} font-mono text-xs`}
                    placeholder="https://maps.app.goo.gl/... or https://goo.gl/maps/..."
                  />
                </FieldRow>
              </div>

              {/* Live Interactive Location & Map Preview */}
              <div className="pt-2">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                    <Eye className="w-3.5 h-3.5 text-teal-400" />
                    Live Homepage Location & Map Preview
                  </span>
                  <span className="text-[11px] text-teal-300 font-medium">
                    ⚡ Auto-synced with Contact Page
                  </span>
                </div>

                <div className="relative rounded-2xl overflow-hidden border border-slate-700/60 bg-[#FAF7EE] text-[#1F1E1D] p-6 sm:p-10 shadow-2xl space-y-6 text-left">
                  <div className="grid md:grid-cols-2 gap-8 items-stretch">
                    {/* Left Info Column */}
                    <div className="flex flex-col justify-between space-y-6">
                      <div>
                        <p className="font-serif italic text-coral text-3xl">come hang</p>
                        <h4 className="mt-1 text-3xl sm:text-4xl md:text-5xl font-black font-serif text-[#1F1E1D] leading-tight">
                          Find the door with the fairy lights.
                        </h4>

                        <ul className="mt-6 space-y-4 text-[#1F1E1D]/80 text-sm">
                          <li>
                            <strong className="text-[#1F1E1D] block font-bold text-xs uppercase tracking-wider">
                              Address
                            </strong>
                            <p className="mt-0.5 leading-relaxed">
                              {data.address || "96, 1st, Satya Niketan, opposite Venkateshwar college..."}
                            </p>
                          </li>
                          <li>
                            <strong className="text-[#1F1E1D] block font-bold text-xs uppercase tracking-wider">
                              Hours
                            </strong>
                            <p className="mt-0.5">{data.hours || "10:00 am – 10:30 pm every day"}</p>
                          </li>
                          <li className="bg-teal-500/10 -mx-3 p-3 rounded-lg border border-teal-500/20">
                            <strong className="text-[#1F1E1D] block font-bold text-xs uppercase tracking-wider flex items-center gap-1.5 text-teal-700">
                              <PhoneCall className="w-3.5 h-3.5" />
                              Phone (Replaces Price)
                            </strong>
                            <p className="mt-0.5 font-bold font-mono text-base text-[#1F1E1D]">
                              {data.phone || "+91 99997 39766"}
                            </p>
                          </li>
                        </ul>
                      </div>

                      <div className="pt-2">
                        <span className="inline-flex items-center gap-2 rounded-full bg-[#1F1E1D] text-[#FAF7EE] px-5 py-2.5 text-xs font-semibold shadow hover:bg-coral transition-colors cursor-pointer">
                          Open in Google Maps →
                        </span>
                      </div>
                    </div>

                    {/* Right Google Maps Iframe */}
                    <div className="rounded-xl overflow-hidden shadow-2xl border-4 border-[#1F1E1D] min-h-[300px] sm:min-h-[360px] bg-slate-200">
                      <iframe
                        title="Google Maps Location"
                        src={getGoogleMapsEmbedUrl(data.mapsEmbedQuery)}
                        className="w-full h-full min-h-[300px] sm:min-h-[360px] border-0"
                        loading="lazy"
                        referrerPolicy="no-referrer-when-downgrade"
                      />
                    </div>
                  </div>

                  {/* Sync Notice Pill */}
                  <div className="pt-4 border-t border-[#1F1E1D]/10 flex items-center justify-between flex-wrap gap-2 text-xs text-[#1F1E1D]/70">
                    <span className="flex items-center gap-1.5 font-medium">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      Same Address, Hours, Phone and Map automatically render on <span className="font-bold text-[#1F1E1D]">/contact</span>
                    </span>
                    <span className="text-[11px] bg-[#1F1E1D]/5 px-2.5 py-1 rounded-full font-mono">
                      No double data-entry required
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* 3. MENU PAGE SECTION */}
        <section id="menupage" className="scroll-mt-28 bg-[#0f172a]/70 border border-slate-800 rounded-2xl p-6 sm:p-8 space-y-6 shadow-xl">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800/80 pb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-orange-500/10 border border-orange-500/20 flex items-center justify-center text-orange-400">
                <UtensilsCrossed className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-white tracking-tight">3. Menu Page Section</h2>
                <p className="text-xs text-slate-400">Categories, signature specials, prices, and menu highlights</p>
              </div>
            </div>
            <a
              href="/menu"
              target="_blank"
              rel="noreferrer"
              className="text-xs font-semibold px-3 py-1 rounded-md bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700/60 self-start sm:self-auto flex items-center gap-1.5 transition-colors"
            >
              <span>Route: /menu</span>
              <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
            </a>
          </div>

          {/* AI-Powered Menu Scanner & Importer Studio */}
          <AiMenuImporter
            data={data}
            setData={setData}
            onSaveSuccess={() => {
              setSavedSuccess(true);
              setTimeout(() => setSavedSuccess(false), 3500);
            }}
          />
        </section>

        {/* 4. CONTACT PAGE SECTION */}
        <section id="contactpage" className="scroll-mt-28 bg-[#0f172a]/70 border border-slate-800 rounded-2xl p-6 sm:p-8 space-y-6 shadow-xl">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800/80 pb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-teal-500/10 border border-teal-500/20 flex items-center justify-center text-teal-400">
                <PhoneCall className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-white tracking-tight">4. Contact Page Section</h2>
                <p className="text-xs text-slate-400">Phone, WhatsApp, physical address, opening hours, and Google Maps</p>
              </div>
            </div>
            <span className="text-xs font-semibold px-2.5 py-1 rounded-md bg-teal-500/10 text-teal-300 border border-teal-500/20 self-start sm:self-auto flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5" />
              Synced from Homepage
            </span>
          </div>

          {/* Sync Information Banner */}
          <div className="p-3.5 rounded-xl bg-teal-500/10 border border-teal-500/20 text-teal-200/90 text-xs flex items-center gap-2.5">
            <Sparkles className="w-4 h-4 text-teal-400 shrink-0" />
            <span>
              <strong>Zero duplicate work:</strong> Address, Hours, Phone and Google Maps are automatically shared with the Homepage section. Any changes made here or in the Homepage section stay 100% in sync!
            </span>
          </div>

          <div className="grid sm:grid-cols-2 gap-5">
            <FieldRow label="Display Phone" help="Calling phone displayed on Contact cards and Homepage">
              <Input
                value={data.phone}
                onChange={(e) => {
                  const val = e.target.value;
                  setData({
                    ...data,
                    phone: val,
                    whatsappNumber: val.replace(/[^0-9]/g, "") || data.whatsappNumber,
                  });
                }}
                className={inputCls}
              />
            </FieldRow>
            <FieldRow label="WhatsApp Number (digits only)" help="Used for table reservation WhatsApp button">
              <Input
                value={data.whatsappNumber}
                onChange={(e) => setData({ ...data, whatsappNumber: e.target.value })}
                className={inputCls}
              />
            </FieldRow>
            <div className="sm:col-span-2">
              <FieldRow label="Full Address" help="Physical address displayed on Contact page and Homepage">
                <Input
                  value={data.address}
                  onChange={(e) => setData({ ...data, address: e.target.value })}
                  className={inputCls}
                />
              </FieldRow>
            </div>
            <FieldRow label="Operating Hours" help="Cafe daily schedule">
              <Input
                value={data.hours}
                onChange={(e) => setData({ ...data, hours: e.target.value })}
                className={inputCls}
              />
            </FieldRow>
            <FieldRow label="Google Maps Embed Link / Query" help="Google Maps embed URL, iframe code, or query">
              <Input
                value={data.mapsEmbedQuery}
                onChange={(e) => setData({ ...data, mapsEmbedQuery: e.target.value })}
                className={`${inputCls} font-mono text-xs`}
              />
            </FieldRow>
            <FieldRow label="Instagram Profile Link" help="Syncs with Footer and Contact page follow card">
              <div className="relative">
                <Input
                  value={data.socialLinks?.instagram ?? ""}
                  onChange={(e) =>
                    setData({
                      ...data,
                      socialLinks: {
                        ...data.socialLinks,
                        instagram: e.target.value,
                      },
                    })
                  }
                  className={`${inputCls} pl-9`}
                  placeholder="https://instagram.com/litup.cafe"
                />
                <Instagram className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              </div>
            </FieldRow>
            <FieldRow label="Google Maps Profile / Navigation Link" help="Syncs with 'Open in Google Maps' button and Contact page">
              <div className="relative">
                <Input
                  value={data.socialLinks?.maps ?? ""}
                  onChange={(e) =>
                    setData({
                      ...data,
                      socialLinks: {
                        ...data.socialLinks,
                        maps: e.target.value,
                      },
                    })
                  }
                  className={`${inputCls} pl-9 font-mono text-xs`}
                  placeholder="https://maps.app.goo.gl/..."
                />
                <MapPin className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              </div>
            </FieldRow>
          </div>
        </section>

        {/* 5. FOOTER SECTION */}
        <section id="footer" className="scroll-mt-28 bg-[#0f172a]/70 border border-slate-800 rounded-2xl p-6 sm:p-8 space-y-6 shadow-xl">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800/80 pb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
                <PanelBottom className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-white tracking-tight">5. Footer Section</h2>
                <p className="text-xs text-slate-400">Global footer brand name, bio text, Instagram handle, and auto-synced visit details</p>
              </div>
            </div>
            <span className="text-xs font-semibold px-2.5 py-1 rounded-md bg-slate-800 text-slate-300 border border-slate-700/60 self-start sm:self-auto">
              Global Footer
            </span>
          </div>

          <div className="space-y-6">
            {/* Auto-sync status bar */}
            <div className="p-3.5 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-200/90 text-xs flex items-center gap-2.5">
              <Sparkles className="w-4 h-4 text-indigo-400 shrink-0" />
              <span>
                <strong>Auto-Connected:</strong> Address, Hours, Phone, and Google Profile are already auto-filled from your previous sections — zero re-typing required! Changes to Instagram or Phone here also sync automatically to the Contact page.
              </span>
            </div>

            <div className="grid sm:grid-cols-2 gap-5">
              {/* 1. Cafe Name in Footer */}
              <FieldRow
                label="Cafe Name in Footer (and Global)"
                help="The bold brand title shown in the footer and across the site"
              >
                <Input
                  value={data.name}
                  onChange={(e) => setData({ ...data, name: e.target.value })}
                  className={inputCls}
                  placeholder="e.g. The Litup Cafe"
                />
              </FieldRow>

              {/* 2. Script Tagline */}
              <FieldRow
                label="Script Tagline (Under Name)"
                help="e.g. since 2014"
              >
                <Input
                  value={data.footerTagline}
                  onChange={(e) => setData({ ...data, footerTagline: e.target.value })}
                  className={inputCls}
                  placeholder="e.g. since 2014"
                />
              </FieldRow>

              {/* 3. Text Below It (Footer Description / Bio Paragraph) */}
              <div className="sm:col-span-2">
                <FieldRow
                  label="Text Below Cafe Name (Footer Bio Paragraph)"
                  help="The story paragraph displayed on the left side of the footer"
                >
                  <Textarea
                    rows={3}
                    value={data.footerBody}
                    onChange={(e) => setData({ ...data, footerBody: e.target.value })}
                    className={`${inputCls} resize-none leading-relaxed`}
                    placeholder="A tiny, loud, plant-strung corner of Satya Niketan that has been feeding DU South Campus on a student budget for over a decade."
                  />
                </FieldRow>
              </div>

              {/* 4. Instagram Link */}
              <FieldRow
                label="Instagram Profile Link"
                help="Opens when visitors click the Instagram icon (also updates Contact page)"
              >
                <div className="relative">
                  <Input
                    value={data.socialLinks?.instagram ?? ""}
                    onChange={(e) =>
                      setData({
                        ...data,
                        socialLinks: {
                          ...data.socialLinks,
                          instagram: e.target.value,
                        },
                      })
                    }
                    className={`${inputCls} pl-9`}
                    placeholder="https://instagram.com/litup.cafe"
                  />
                  <Instagram className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                </div>
              </FieldRow>

              {/* 5. Google Profile / Maps Link (Auto-taken) */}
              <FieldRow
                label="Google Profile / Maps Link"
                help="Auto-taken from Homepage/Reviews. Click to edit."
              >
                <div className="relative">
                  <Input
                    value={data.socialLinks?.maps ?? ""}
                    onChange={(e) =>
                      setData({
                        ...data,
                        socialLinks: {
                          ...data.socialLinks,
                          maps: e.target.value,
                        },
                      })
                    }
                    className={`${inputCls} pl-9 font-mono text-xs`}
                    placeholder="https://maps.app.goo.gl/..."
                  />
                  <MapPin className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                </div>
              </FieldRow>

              {/* 6. Phone Number (Auto-taken) */}
              <FieldRow
                label="Calling Phone Number"
                help="Auto-taken from previous info. Click to call from footer icon."
              >
                <div className="relative">
                  <Input
                    value={data.phone}
                    onChange={(e) => {
                      const val = e.target.value;
                      setData({
                        ...data,
                        phone: val,
                        whatsappNumber: val.replace(/[^0-9]/g, "") || data.whatsappNumber,
                      });
                    }}
                    className={`${inputCls} pl-9`}
                    placeholder="+91 99997 39766"
                  />
                  <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                </div>
              </FieldRow>

              {/* 7. Short Address (Optional override) */}
              <FieldRow
                label="Short Address in Footer (Optional)"
                help="Leave empty to automatically use your full address from Homepage"
              >
                <Input
                  value={data.addressShort}
                  onChange={(e) => setData({ ...data, addressShort: e.target.value })}
                  className={inputCls}
                  placeholder={data.address || "e.g. 96, 1st, Satya Niketan, Delhi"}
                />
              </FieldRow>
            </div>

            {/* Visit Section Summary Card */}
            <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
              <div className="space-y-1">
                <span className="font-bold text-slate-200 uppercase tracking-wider flex items-center gap-1.5 text-[11px]">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  Footer "VISIT" Section Data
                </span>
                <p className="text-slate-400">
                  <strong className="text-slate-300">Address:</strong> {data.addressShort || data.address || "96, 1st, Satya Niketan..."}
                </p>
                <p className="text-slate-400">
                  <strong className="text-slate-300">Hours:</strong> {data.hoursShort || data.hours || "10:00 am – 10:30 pm every day"}
                </p>
              </div>
              <span className="shrink-0 text-[10px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 px-2.5 py-1 rounded-full">
                Auto-Synced from Homepage
              </span>
            </div>

            {/* Live Interactive Footer Preview */}
            <div className="pt-2">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                  <Eye className="w-3.5 h-3.5 text-indigo-400" />
                  Live Footer Preview
                </span>
                <span className="text-[11px] text-slate-500">Matches your site footer across all pages</span>
              </div>

              {(() => {
                const trimmedName = data.name?.trim() || "Cafe Name";
                const nameParts = trimmedName.split(" ");
                const nameLast = nameParts.length > 1 ? nameParts.pop() ?? "" : "";
                const nameFirst = nameParts.length > 0 ? nameParts.join(" ") : trimmedName;

                return (
                  <div className="relative rounded-2xl overflow-hidden border border-slate-700/60 bg-[#1c1b18] text-[#FAF7EE] shadow-2xl text-left">
                    {/* Top Stripe Pillar */}
                    <div className="h-2 w-full bg-gradient-to-r from-[#F5C242] via-[#FF6B6B] to-[#F5C242]" />

                    <div className="p-6 sm:p-10 grid gap-8 md:grid-cols-4">
                      {/* Left Brand Column */}
                      <div className="md:col-span-2 space-y-3">
                        {data.logoUrl && (
                          <img
                            src={data.logoUrl}
                            alt={data.name}
                            className="h-10 w-auto object-contain drop-shadow"
                          />
                        )}
                        <div className="font-serif font-black text-2xl sm:text-3xl text-white">
                          {nameFirst} {nameLast && <span className="text-[#F5C242]">{nameLast}</span>}
                        </div>
                        <p className="font-serif italic text-xl text-[#F5C242]">
                          {data.footerTagline || "since 2014"}
                        </p>
                        <p className="text-xs sm:text-sm text-[#FAF7EE]/70 max-w-sm leading-relaxed">
                          {data.footerBody || "A tiny, loud, plant-strung corner that feeds everyone on a budget."}
                        </p>

                        {/* Social Icons */}
                        <div className="pt-2 flex items-center gap-3">
                          <a
                            href={data.socialLinks?.instagram || "#"}
                            target="_blank"
                            rel="noreferrer"
                            className="bg-white/10 p-2.5 rounded-full hover:bg-[#F5C242] hover:text-[#1c1b18] transition-colors text-white/80"
                            title="Instagram"
                          >
                            <Instagram className="w-4 h-4" />
                          </a>
                          <a
                            href={data.socialLinks?.maps || "#"}
                            target="_blank"
                            rel="noreferrer"
                            className="bg-white/10 p-2.5 rounded-full hover:bg-[#F5C242] hover:text-[#1c1b18] transition-colors text-white/80"
                            title="Google Maps"
                          >
                            <MapPin className="w-4 h-4" />
                          </a>
                          <a
                            href={`tel:${data.phone?.replace(/[^+0-9]/g, "") || data.phone}`}
                            className="bg-white/10 p-2.5 rounded-full hover:bg-[#F5C242] hover:text-[#1c1b18] transition-colors text-white/80"
                            title="Phone"
                          >
                            <Phone className="w-4 h-4" />
                          </a>
                        </div>
                      </div>

                      {/* Middle VISIT Column */}
                      <div className="space-y-2 text-xs">
                        <h5 className="text-[#F5C242] text-xs font-bold uppercase tracking-widest">
                          Visit
                        </h5>
                        <p className="text-[#FAF7EE]/80 leading-relaxed whitespace-pre-line">
                          {data.addressShort || data.address || "96, 1st, Satya Niketan, opposite Venkateshwar college..."}
                        </p>
                        <p className="text-[#FAF7EE]/80 pt-1">
                          {data.hoursShort || data.hours || "10:00 am – 10:30 pm every day"}
                        </p>
                      </div>

                      {/* Right WANDER Column */}
                      <div className="space-y-2 text-xs">
                        <h5 className="text-[#F5C242] text-xs font-bold uppercase tracking-widest">
                          Wander
                        </h5>
                        <ul className="space-y-1.5 text-[#FAF7EE]/70">
                          <li>Home</li>
                          <li>Menu</li>
                          <li>About</li>
                          <li>Gallery</li>
                          <li>Contact</li>
                        </ul>
                      </div>
                    </div>

                    {/* Bottom Copyright */}
                    <div className="border-t border-white/10 py-3 text-center text-[11px] text-white/50">
                      © {new Date().getFullYear()} {data.name || "Cafe Name"} · Made with chai &amp; late nights
                    </div>
                  </div>
                );
              })()}
            </div>
          </div>
        </section>

      </main>

      {/* Floating Bottom Save Bar */}
      <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-40 bg-slate-900/95 border border-slate-800 shadow-2xl backdrop-blur-md px-5 py-3 rounded-full flex items-center gap-4">
        {savedSuccess ? (
          <span className="text-xs font-medium text-emerald-400 flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4" />
            Changes saved successfully
          </span>
        ) : (
          <span className="text-xs text-slate-400 hidden sm:inline">
            Edits update live site across all pages
          </span>
        )}
        <Button
          onClick={handleSaveAll}
          disabled={saving}
          className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-semibold px-5 text-xs h-8 rounded-full shadow transition-all cursor-pointer"
        >
          {saving ? "Saving…" : "Save All Changes"}
        </Button>
      </div>
    </div>
  );
}
