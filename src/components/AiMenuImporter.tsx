import { useState, useEffect, useRef } from "react";
import {
  Sparkles,
  FileText,
  Upload,
  X,
  Plus,
  Trash2,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  Layers,
  Check,
  Star,
  Copy,
  ChevronDown,
  ChevronUp,
  KeyRound,
  Eye,
  EyeOff,
  Wand2,
  Loader2,
  Image as ImageIcon,
  CheckCheck,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { analyzeMenuWithAiFn, saveRestaurantDataFn } from "@/lib/cms-actions";
import type { RestaurantData, MenuCategory, MenuItem } from "@/lib/restaurant-data";
import { slugify } from "@/lib/menu-ai-parser";

interface AiMenuImporterProps {
  data: RestaurantData;
  setData: React.Dispatch<React.SetStateAction<RestaurantData>>;
  onSaveSuccess?: () => void;
}

interface PhotoItem {
  id: string;
  name: string;
  base64: string;
  mimeType: string;
}

const SAMPLE_GOOGLE_MENU = `STARTERS & FRIES
Crispy Peri Peri Fries ₹140
Golden French fries tossed in spicy peri peri seasoning
Cheese Corn Nuggets ₹180
Crispy bites filled with melted cheese and sweet corn
Chicken Popcorn ₹210
Crunchy bite-sized seasoned chicken fritters served with garlic mayo

PIZZAS (10 INCH)
Margherita Classic Pizza ₹240
San Marzano tomato sauce, fresh mozzarella cheese and fresh basil
Overloaded Veggie Pizza ₹290
Bell peppers, golden corn, olives, mushrooms and red onion
Barbeque Chicken Feast Pizza ₹340
Smoky shredded chicken, caramelized onion, jalapenos and BBQ drizzle

PASTA & ITALIAN
Creamy Mix Sauce Pasta ₹240
Penne pasta in rich pink sauce with garlic herbs and parmesan
Spicy Arrabiata Pasta ₹210
Fiery tomato concasse sauce with crushed chili flakes and fresh basil
Alfredo White Sauce Chicken Pasta ₹280
Slow-simmered rich creamy white sauce with grilled chicken

BURGERS & SANDWICHES
Litup Cheese Blast Burger ₹220
Double cheese patty with molten cheese explosion and house sauce
Crispy Fried Chicken Burger ₹250
Golden crunchy chicken fillet with iceberg lettuce and secret mayo
Paneer Tikka Grilled Sandwich ₹180
Spiced cottage cheese slices grilled between multigrain sourdough

SHAKES & BEVERAGES
KitKat Thick Shake ₹180
Velvety chocolate blend loaded with crunchy KitKat bars and whipped cream
Classic Cold Coffee with Ice Cream ₹150
Chilled espresso shot blended with vanilla bean ice cream
Watermelon Mint Mojito ₹130
Muddled fresh mint sprigs, lime wedges and watermelon syrup with fizz`;

export function AiMenuImporter({ data, setData, onSaveSuccess }: AiMenuImporterProps) {
  // Inputs (Both visible side-by-side, neither compulsory)
  const [textMenu, setTextMenu] = useState("");
  const [photos, setPhotos] = useState<PhotoItem[]>([]);
  const [photoDragOver, setPhotoDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // API Key Settings
  const [apiKey, setApiKey] = useState("");
  const [showApiKeyInput, setShowApiKeyInput] = useState(false);
  const [showKeyPassword, setShowKeyPassword] = useState(false);

  // AI Extraction State
  const [analyzing, setAnalyzing] = useState(false);
  const [analyzeStep, setAnalyzeStep] = useState<string>("");
  const [extractedCategories, setExtractedCategories] = useState<MenuCategory[] | null>(null);
  const [extractedPriceRange, setExtractedPriceRange] = useState<string | null>(null);
  const [extractionSummary, setExtractionSummary] = useState<string | null>(null);
  const [extractionSource, setExtractionSource] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Import Mode: replace vs append
  const [importMode, setImportMode] = useState<"replace" | "append">("replace");

  // Publishing to Real Website
  const [publishing, setPublishing] = useState(false);
  const [publishSuccess, setPublishSuccess] = useState(false);
  const [expandedCats, setExpandedCats] = useState<Record<string, boolean>>({});

  // Active Menu Accordion
  const [activeMenuExpanded, setActiveMenuExpanded] = useState(false);

  // Load saved API Key from localStorage
  useEffect(() => {
    try {
      const savedKey = localStorage.getItem("litup_ai_api_key");
      if (savedKey) setApiKey(savedKey);
    } catch {}
  }, []);

  const handleSaveApiKey = (key: string) => {
    setApiKey(key);
    try {
      localStorage.setItem("litup_ai_api_key", key);
    } catch {}
  };

  // Photo handlers
  const handlePhotoFiles = (files: FileList | null) => {
    if (!files || files.length === 0) return;
    const fileArray = Array.from(files);

    fileArray.forEach((file) => {
      if (!file.type.startsWith("image/")) return;
      const reader = new FileReader();
      reader.onload = (e) => {
        const base64 = e.target?.result as string;
        setPhotos((prev) => [
          ...prev,
          {
            id: Math.random().toString(36).substring(2, 9),
            name: file.name,
            base64,
            mimeType: file.type || "image/jpeg",
          },
        ]);
      };
      reader.readAsDataURL(file);
    });
  };

  const removePhoto = (id: string) => {
    setPhotos((prev) => prev.filter((p) => p.id !== id));
  };

  // Check what is currently filled
  const hasText = Boolean(textMenu.trim().length > 0);
  const hasPhotos = photos.length > 0;
  const hasBoth = hasText && hasPhotos;
  const canAnalyze = hasText || hasPhotos;

  // Trigger AI Analysis
  const handleAnalyze = async () => {
    if (!canAnalyze) {
      setErrorMessage("Please paste menu text from Google profile or upload at least one menu photo.");
      return;
    }

    setAnalyzing(true);
    setErrorMessage(null);
    setPublishSuccess(false);

    try {
      if (hasBoth) {
        setAnalyzeStep(`Analyzing BOTH Google text AND ${photos.length} menu photo(s)...`);
      } else if (hasPhotos) {
        setAnalyzeStep(`Scanning ${photos.length} menu photo(s) with AI vision...`);
      } else {
        setAnalyzeStep("Parsing Google profile menu text & prices...");
      }

      const payload = {
        textMenu: textMenu.trim() || undefined,
        photos: photos.map((p) => ({
          base64: p.base64,
          mimeType: p.mimeType,
          filename: p.name,
        })),
        apiKey: apiKey.trim() || undefined,
      };

      const result = await analyzeMenuWithAiFn({ data: payload });

      if (result.success && result.categories.length > 0) {
        setExtractedCategories(result.categories);
        if (result.priceRangeNote) {
          setExtractedPriceRange(result.priceRangeNote);
        }
        setExtractionSummary(result.summary);
        setExtractionSource(result.source);

        // Expand all extracted categories by default
        const initialExpand: Record<string, boolean> = {};
        result.categories.forEach((c) => {
          initialExpand[c.id] = true;
        });
        setExpandedCats(initialExpand);
      } else {
        setErrorMessage(result.error || "Could not detect menu items. Try pasting text with prices or uploading a clear photo.");
      }
    } catch (err: any) {
      setErrorMessage(err.message || "Failed to analyze menu. Please try again.");
    } finally {
      setAnalyzing(false);
      setAnalyzeStep("");
    }
  };

  // Apply & Save Directly to Real Website
  const handlePutInRealWebsite = async () => {
    if (!extractedCategories || extractedCategories.length === 0) return;

    setPublishing(true);
    setPublishSuccess(false);
    setErrorMessage(null);

    try {
      let finalMenu: MenuCategory[] = [];

      if (importMode === "replace") {
        finalMenu = [...extractedCategories];
      } else {
        // Append mode: merge categories
        const mergedMap = new Map<string, MenuCategory>();
        data.menu.forEach((cat) => {
          mergedMap.set(cat.id, { ...cat, items: [...cat.items] });
        });

        extractedCategories.forEach((newCat) => {
          if (mergedMap.has(newCat.id)) {
            const existing = mergedMap.get(newCat.id)!;
            const existingItemNames = new Set(existing.items.map((i) => i.name.toLowerCase()));
            const newItems = newCat.items.filter((i) => !existingItemNames.has(i.name.toLowerCase()));
            existing.items = [...existing.items, ...newItems];
          } else {
            mergedMap.set(newCat.id, { ...newCat, items: [...newCat.items] });
          }
        });

        finalMenu = Array.from(mergedMap.values());
      }

      const updatedPriceRange = extractedPriceRange && extractedPriceRange.trim() ? extractedPriceRange : data.priceRange;

      const updatedData: RestaurantData = {
        ...data,
        menu: finalMenu,
        priceRange: updatedPriceRange,
      };

      // Persist to server / data/restaurant.json
      await saveRestaurantDataFn({ data: updatedData });

      // Update parent state
      setData(updatedData);
      setPublishSuccess(true);
      if (onSaveSuccess) onSaveSuccess();
    } catch (err: any) {
      setErrorMessage(err.message || "Failed to save to live website.");
    } finally {
      setPublishing(false);
    }
  };

  // Extracted item modifiers
  const updateCategoryLabel = (catIdx: number, newLabel: string) => {
    if (!extractedCategories) return;
    const updated = [...extractedCategories];
    updated[catIdx].label = newLabel;
    updated[catIdx].id = slugify(newLabel);
    setExtractedCategories(updated);
  };

  const removeCategory = (catIdx: number) => {
    if (!extractedCategories) return;
    setExtractedCategories(extractedCategories.filter((_, idx) => idx !== catIdx));
  };

  const addNewCategory = () => {
    const newCat: MenuCategory = {
      id: `category-${Date.now()}`,
      label: "New Category",
      items: [{ name: "New Item", price: "₹150", veg: true }],
    };
    setExtractedCategories((prev) => (prev ? [...prev, newCat] : [newCat]));
    setExpandedCats((prev) => ({ ...prev, [newCat.id]: true }));
  };

  const updateItem = (catIdx: number, itemIdx: number, field: keyof MenuItem, value: any) => {
    if (!extractedCategories) return;
    const updated = [...extractedCategories];
    const cat = updated[catIdx];
    const item = { ...cat.items[itemIdx], [field]: value };
    cat.items[itemIdx] = item;
    setExtractedCategories(updated);
  };

  const removeItem = (catIdx: number, itemIdx: number) => {
    if (!extractedCategories) return;
    const updated = [...extractedCategories];
    updated[catIdx].items = updated[catIdx].items.filter((_, idx) => idx !== itemIdx);
    setExtractedCategories(updated);
  };

  const addItemToCategory = (catIdx: number) => {
    if (!extractedCategories) return;
    const updated = [...extractedCategories];
    updated[catIdx].items.push({
      name: "New Dish",
      price: "₹180",
      veg: true,
    });
    setExtractedCategories(updated);
  };

  const toggleCategoryExpand = (catId: string) => {
    setExpandedCats((prev) => ({ ...prev, [catId]: !prev[catId] }));
  };

  const totalExtractedDishes = extractedCategories ? extractedCategories.reduce((acc, c) => acc + c.items.length, 0) : 0;

  return (
    <div className="space-y-6">
      {/* ── AI Menu Import Studio Box ─────────────────────────────────────── */}
      <div className="rounded-2xl border border-orange-500/30 bg-gradient-to-b from-[#131b2e] to-[#0c1222] p-6 sm:p-7 space-y-6 shadow-2xl shadow-orange-950/20">
        {/* Studio Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-orange-500/15 border border-orange-500/30 flex items-center justify-center text-orange-400 shadow-inner">
              <Sparkles className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-bold text-white tracking-tight">AI Menu Scanner & Importer</h3>
                <span className="text-[10px] font-semibold bg-orange-500/20 text-orange-300 border border-orange-500/30 px-2 py-0.5 rounded-full">
                  Text + Photo Vision
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Upload photos, paste Google profile text, or <strong className="text-orange-300">do both</strong>. The AI analyzes and combines all items and prices.
              </p>
            </div>
          </div>

          {/* Quick API Key Toggle */}
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setShowApiKeyInput(!showApiKeyInput)}
              className={`text-xs border-slate-700 ${
                apiKey ? "text-emerald-400 border-emerald-500/30 bg-emerald-500/10" : "text-slate-400 hover:text-white"
              }`}
            >
              <KeyRound className="w-3.5 h-3.5 mr-1.5" />
              {apiKey ? "Gemini Key Configured ✓" : "Optional AI Key"}
            </Button>
          </div>
        </div>

        {/* Collapsible API Key settings */}
        {showApiKeyInput && (
          <div className="p-4 rounded-xl bg-slate-900/90 border border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <Label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                Google Gemini API Key
                <span className="text-[10px] font-normal text-slate-400">(Free at aistudio.google.com)</span>
              </Label>
              <a
                href="https://aistudio.google.com/app/apikey"
                target="_blank"
                rel="noreferrer"
                className="text-[11px] text-amber-400 hover:underline flex items-center gap-1"
              >
                Get free key <ExternalLink className="w-3 h-3" />
              </a>
            </div>
            <div className="relative">
              <Input
                type={showKeyPassword ? "text" : "password"}
                value={apiKey}
                onChange={(e) => handleSaveApiKey(e.target.value)}
                placeholder="AIzaSy... (leave blank to use smart built-in text parser)"
                className="bg-slate-950 border-slate-800 text-xs pr-10 text-white font-mono"
              />
              <button
                type="button"
                onClick={() => setShowKeyPassword(!showKeyPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200"
              >
                {showKeyPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            <p className="text-[11px] text-slate-400">
              ⚡ A free Gemini key powers photo OCR vision. For copied Google text, our smart NLP parser runs instantly even without a key!
            </p>
          </div>
        )}

        {/* ── DUAL INPUT GRID: BOTH VISIBLE SIDE-BY-SIDE (NEITHER COMPULSORY) ── */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Card A: Text Menu from Google Profile */}
          <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-4 sm:p-5 space-y-3 flex flex-col justify-between">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-orange-500/15 border border-orange-500/25 flex items-center justify-center text-orange-400">
                    <FileText className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-200">
                      1. Text Menu (Google Profile / Maps)
                    </h4>
                    <p className="text-[11px] text-slate-400">Copy & paste text from Google or websites</p>
                  </div>
                </div>

                {hasText ? (
                  <span className="text-[10px] font-semibold bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 px-2 py-0.5 rounded-full flex items-center gap-1">
                    <CheckCheck className="w-3 h-3" />
                    {textMenu.length} chars
                  </span>
                ) : (
                  <span className="text-[10px] font-medium bg-slate-800 text-slate-400 px-2 py-0.5 rounded-full">
                    Optional
                  </span>
                )}
              </div>

              <Textarea
                value={textMenu}
                onChange={(e) => setTextMenu(e.target.value)}
                placeholder="Paste raw text menu here...&#10;e.g.&#10;Margherita Pizza ₹240&#10;Crispy Peri Peri Fries ₹140&#10;KitKat Thick Shake ₹180"
                rows={9}
                className="bg-slate-900/80 border-slate-800 text-xs text-slate-200 placeholder:text-slate-600 font-mono leading-relaxed focus-visible:ring-orange-500 resize-y"
              />
            </div>

            {/* Helper Buttons */}
            <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-800/80">
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={async () => {
                    try {
                      const clipText = await navigator.clipboard.readText();
                      if (clipText) setTextMenu((prev) => (prev ? prev + "\n" + clipText : clipText));
                    } catch {
                      alert("Please use Ctrl+V / Cmd+V to paste directly into the box.");
                    }
                  }}
                  className="text-xs h-7 text-slate-400 hover:text-white hover:bg-slate-800 px-2"
                >
                  <Copy className="w-3 h-3 mr-1" /> Paste
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setTextMenu(SAMPLE_GOOGLE_MENU)}
                  className="text-xs h-7 border-orange-500/30 text-orange-300 hover:bg-orange-500/10 px-2"
                >
                  <Wand2 className="w-3 h-3 mr-1 text-orange-400" /> Load Sample
                </Button>
              </div>

              {hasText && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setTextMenu("")}
                  className="text-xs h-7 text-slate-500 hover:text-red-400 hover:bg-red-500/10 px-2"
                >
                  <X className="w-3 h-3 mr-1" /> Clear
                </Button>
              )}
            </div>
          </div>

          {/* Card B: Photos Upload (Cards, Boards, Displays) */}
          <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-4 sm:p-5 space-y-3 flex flex-col justify-between">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-orange-500/15 border border-orange-500/25 flex items-center justify-center text-orange-400">
                    <ImageIcon className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-200">
                      2. Menu Photos (Cards & Boards)
                    </h4>
                    <p className="text-[11px] text-slate-400">Upload paper menu cards or chalkboard photos</p>
                  </div>
                </div>

                {hasPhotos ? (
                  <span className="text-[10px] font-semibold bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 px-2 py-0.5 rounded-full flex items-center gap-1">
                    <CheckCheck className="w-3 h-3" />
                    {photos.length} photo(s)
                  </span>
                ) : (
                  <span className="text-[10px] font-medium bg-slate-800 text-slate-400 px-2 py-0.5 rounded-full">
                    Optional
                  </span>
                )}
              </div>

              {/* Upload Dropzone */}
              <div
                onDragOver={(e) => {
                  e.preventDefault();
                  setPhotoDragOver(true);
                }}
                onDragLeave={() => setPhotoDragOver(false)}
                onDrop={(e) => {
                  e.preventDefault();
                  setPhotoDragOver(false);
                  handlePhotoFiles(e.dataTransfer.files);
                }}
                onClick={() => fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-xl p-5 text-center cursor-pointer transition-all ${
                  photoDragOver
                    ? "border-orange-500 bg-orange-500/10"
                    : "border-slate-800 bg-slate-900/50 hover:border-slate-700 hover:bg-slate-900/80"
                }`}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={(e) => handlePhotoFiles(e.target.files)}
                  className="hidden"
                />
                <div className="flex flex-col items-center justify-center space-y-1.5">
                  <div className="w-10 h-10 rounded-xl bg-orange-500/10 border border-orange-500/20 flex items-center justify-center text-orange-400">
                    <Upload className="w-5 h-5" />
                  </div>
                  <p className="text-xs font-semibold text-slate-200">
                    Drop photos here, or <span className="text-orange-400 underline">browse</span>
                  </p>
                  <p className="text-[10px] text-slate-500">
                    Menu cards, chalkboards, QR menu screenshots (JPG, PNG, WebP)
                  </p>
                </div>
              </div>

              {/* Uploaded Photos Thumbnails */}
              {hasPhotos && (
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-[11px] text-slate-400">
                    <span>Attached Photos ({photos.length})</span>
                    <button
                      type="button"
                      onClick={() => setPhotos([])}
                      className="text-red-400 hover:underline"
                    >
                      Clear all
                    </button>
                  </div>
                  <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 max-h-36 overflow-y-auto pr-1">
                    {photos.map((p) => (
                      <div
                        key={p.id}
                        className="group relative aspect-square rounded-lg overflow-hidden border border-slate-800 bg-slate-900 shadow-sm"
                      >
                        <img src={p.base64} alt={p.name} className="w-full h-full object-cover" />
                        <div className="absolute inset-0 bg-slate-950/70 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              removePhoto(p.id);
                            }}
                            className="p-1 rounded-full bg-red-500 text-white hover:bg-red-600 transition-colors"
                            title="Remove photo"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                        <div className="absolute bottom-0 inset-x-0 bg-slate-950/85 px-1 py-0.5 text-[8px] text-slate-300 truncate">
                          {p.name}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-500">
              <span>Supports multiple menu photos</span>
              <span>JPG, PNG, WebP</span>
            </div>
          </div>
        </div>

        {/* ── DUAL MULTIMODAL STATUS BANNER ── */}
        <div
          className={`p-3.5 rounded-xl border flex items-center gap-3 transition-all ${
            hasBoth
              ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-200"
              : hasText
              ? "border-orange-500/30 bg-orange-500/10 text-orange-200"
              : hasPhotos
              ? "border-sky-500/30 bg-sky-500/10 text-sky-200"
              : "border-slate-800 bg-slate-950/60 text-slate-400"
          }`}
        >
          <div
            className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 font-bold ${
              hasBoth
                ? "bg-emerald-500 text-slate-950"
                : hasText
                ? "bg-orange-500 text-slate-950"
                : hasPhotos
                ? "bg-sky-500 text-slate-950"
                : "bg-slate-800 text-slate-400"
            }`}
          >
            {hasBoth ? "✨" : hasText ? "📄" : hasPhotos ? "📸" : "💡"}
          </div>

          <div className="flex-1 text-xs">
            {hasBoth ? (
              <div>
                <p className="font-bold text-emerald-300">
                  Dual Multimodal Mode Active (Text + Photos)
                </p>
                <p className="text-[11px] text-emerald-400/90 mt-0.5">
                  AI will analyze <strong>BOTH</strong> the pasted Google Profile text and all <strong>{photos.length} menu photo(s)</strong> together, cross-referencing and merging all items into a unified menu preview.
                </p>
              </div>
            ) : hasText ? (
              <div>
                <p className="font-bold text-orange-300">Text Extraction Mode Active</p>
                <p className="text-[11px] text-orange-400/90 mt-0.5">
                  AI will analyze all dishes and prices from your pasted Google profile text. <em>(You can also upload menu photos above if you have any!)</em>
                </p>
              </div>
            ) : hasPhotos ? (
              <div>
                <p className="font-bold text-sky-300">Photo Vision OCR Mode Active</p>
                <p className="text-[11px] text-sky-400/90 mt-0.5">
                  AI will scan all {photos.length} menu photo(s) with vision OCR. <em>(You can also paste Google text alongside for combined extraction!)</em>
                </p>
              </div>
            ) : (
              <div>
                <p className="font-semibold text-slate-300">Ready for your menu content</p>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Neither is compulsory! You can paste text on the left, upload photos on the right, or provide <strong>both</strong> together.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Action Bar */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2 border-t border-slate-800">
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <span
              className={`w-2 h-2 rounded-full ${
                canAnalyze ? "bg-emerald-400 animate-pulse" : "bg-slate-600"
              }`}
            />
            <span>
              {hasBoth
                ? `Ready to synthesize Text + ${photos.length} Photo(s)`
                : hasText
                ? "Ready to extract from Text"
                : hasPhotos
                ? `Ready to extract from ${photos.length} Photo(s)`
                : "Fill text, photos, or both above"}
            </span>
          </div>

          <Button
            type="button"
            disabled={analyzing || !canAnalyze}
            onClick={handleAnalyze}
            className={`w-full sm:w-auto font-bold px-7 py-3 rounded-xl shadow-lg transition-all flex items-center gap-2 ${
              canAnalyze
                ? "bg-gradient-to-r from-orange-500 via-amber-500 to-orange-500 hover:from-orange-400 hover:to-amber-400 text-slate-950 shadow-orange-500/25"
                : "bg-slate-800 text-slate-500 cursor-not-allowed"
            }`}
          >
            {analyzing ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin text-slate-950" />
                <span>{analyzeStep || "Analyzing menu..."}</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                <span>
                  {hasBoth
                    ? "✨ Analyze Both Text & Photos with AI"
                    : hasPhotos
                    ? "✨ Analyze Photos with AI Vision"
                    : "✨ Analyze Text Menu with AI"}
                </span>
              </>
            )}
          </Button>
        </div>

        {/* Error message */}
        {errorMessage && (
          <div className="p-3.5 rounded-xl bg-red-500/10 border border-red-500/20 flex items-start gap-3 text-red-300 text-xs">
            <AlertCircle className="w-4 h-4 shrink-0 text-red-400 mt-0.5" />
            <div>
              <p className="font-semibold">Analysis Notice</p>
              <p className="mt-0.5">{errorMessage}</p>
            </div>
          </div>
        )}
      </div>

      {/* ── Extracted AI Review & Approval Studio ────────────────────────── */}
      {extractedCategories && extractedCategories.length > 0 && (
        <div className="rounded-2xl border-2 border-emerald-500/40 bg-gradient-to-b from-[#0c1c1f] to-[#0a141a] p-6 sm:p-7 space-y-6 shadow-2xl">
          {/* Top Banner */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-5 border-b border-emerald-500/20">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="w-8 h-8 rounded-lg bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                  <CheckCircle2 className="w-5 h-5" />
                </span>
                <h3 className="text-xl font-bold text-white tracking-tight">
                  Extracted {totalExtractedDishes} Dishes across {extractedCategories.length} Categories
                </h3>
              </div>
              <p className="text-xs text-emerald-300/80">
                {extractionSummary} · Source: <span className="font-semibold uppercase">{extractionSource}</span>
              </p>
            </div>

            {/* Import Mode Switcher */}
            <div className="flex items-center gap-3 bg-slate-950/80 p-1.5 rounded-xl border border-slate-800 self-start md:self-auto">
              <span className="text-xs text-slate-400 pl-2 font-medium">Save mode:</span>
              <button
                type="button"
                onClick={() => setImportMode("replace")}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  importMode === "replace"
                    ? "bg-emerald-500 text-slate-950 shadow"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                Replace Live Menu
              </button>
              <button
                type="button"
                onClick={() => setImportMode("append")}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  importMode === "append"
                    ? "bg-emerald-500 text-slate-950 shadow"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                Append / Merge
              </button>
            </div>
          </div>

          {/* Categories & Dishes Editable List */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-300">
                Review & Edit Extracted Categories
              </span>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={addNewCategory}
                className="text-xs h-7 border-emerald-500/30 text-emerald-300 hover:bg-emerald-500/10"
              >
                <Plus className="w-3 h-3 mr-1" /> Add Category
              </Button>
            </div>

            {extractedCategories.map((cat, catIdx) => {
              const isExpanded = expandedCats[cat.id] ?? true;
              return (
                <div
                  key={cat.id || catIdx}
                  className="rounded-xl border border-slate-800 bg-slate-950/70 overflow-hidden transition-all"
                >
                  {/* Category Header */}
                  <div className="flex items-center justify-between p-4 bg-slate-900/80 border-b border-slate-800/80 gap-3">
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <button
                        type="button"
                        onClick={() => toggleCategoryExpand(cat.id)}
                        className="text-slate-400 hover:text-white"
                      >
                        {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                      </button>
                      <Input
                        value={cat.label}
                        onChange={(e) => updateCategoryLabel(catIdx, e.target.value)}
                        className="bg-slate-950 border-slate-800 text-sm font-bold text-white max-w-xs h-8"
                      />
                      <span className="text-xs text-slate-400 font-medium whitespace-nowrap">
                        ({cat.items.length} dishes)
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => addItemToCategory(catIdx)}
                        className="text-xs h-7 text-emerald-400 hover:bg-emerald-500/10"
                      >
                        <Plus className="w-3 h-3 mr-1" /> Add Dish
                      </Button>
                      <button
                        type="button"
                        onClick={() => removeCategory(catIdx)}
                        className="text-slate-500 hover:text-red-400 p-1"
                        title="Delete category"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Category Items Table */}
                  {isExpanded && (
                    <div className="p-4 space-y-3">
                      {cat.items.map((item, itemIdx) => (
                        <div
                          key={itemIdx}
                          className="flex flex-col sm:flex-row items-start sm:items-center gap-3 p-2.5 rounded-lg bg-slate-900/50 border border-slate-800/60 hover:border-slate-700 transition-colors"
                        >
                          {/* Veg toggle dot */}
                          <button
                            type="button"
                            onClick={() => updateItem(catIdx, itemIdx, "veg", !item.veg)}
                            className={`w-5 h-5 rounded flex items-center justify-center border shrink-0 transition-transform ${
                              item.veg !== false
                                ? "border-emerald-500 bg-emerald-500/10 text-emerald-400"
                                : "border-red-500 bg-red-500/10 text-red-400"
                            }`}
                            title={item.veg !== false ? "Vegetarian (click to switch)" : "Non-Veg (click to switch)"}
                          >
                            <span
                              className={`w-2.5 h-2.5 rounded-full ${
                                item.veg !== false ? "bg-emerald-400" : "bg-red-400"
                              }`}
                            />
                          </button>

                          {/* Item Name */}
                          <Input
                            value={item.name}
                            onChange={(e) => updateItem(catIdx, itemIdx, "name", e.target.value)}
                            placeholder="Dish name"
                            className="bg-slate-950 border-slate-800 text-xs font-semibold text-white h-8 flex-1 min-w-[140px]"
                          />

                          {/* Description */}
                          <Input
                            value={item.desc || ""}
                            onChange={(e) => updateItem(catIdx, itemIdx, "desc", e.target.value)}
                            placeholder="Optional ingredients or description"
                            className="bg-slate-950 border-slate-800 text-xs text-slate-300 h-8 flex-1 min-w-[160px]"
                          />

                          {/* Price */}
                          <Input
                            value={item.price}
                            onChange={(e) => updateItem(catIdx, itemIdx, "price", e.target.value)}
                            placeholder="₹..."
                            className="bg-slate-950 border-slate-800 text-xs font-bold text-amber-300 w-24 h-8 text-center"
                          />

                          {/* Star toggle */}
                          <button
                            type="button"
                            onClick={() => updateItem(catIdx, itemIdx, "star", !item.star)}
                            className={`p-1.5 rounded transition-colors ${
                              item.star
                                ? "text-amber-400 bg-amber-400/10"
                                : "text-slate-600 hover:text-slate-400"
                            }`}
                            title="Toggle Bestseller / Star Dish"
                          >
                            <Star className="w-4 h-4 fill-current" />
                          </button>

                          {/* Delete Item */}
                          <button
                            type="button"
                            onClick={() => removeItem(catIdx, itemIdx)}
                            className="p-1.5 text-slate-500 hover:text-red-400 transition-colors"
                            title="Delete dish"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* ── BIG CTA: PUT IN REAL WEBSITE ─────────────────────────────── */}
          <div className="p-5 rounded-2xl bg-gradient-to-r from-emerald-950/60 via-slate-900 to-emerald-950/60 border border-emerald-500/40 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div>
              <h4 className="text-base font-bold text-white flex items-center gap-2">
                <span>🚀 Ready to Publish to Live Website?</span>
              </h4>
              <p className="text-xs text-slate-400 mt-0.5">
                This will save the extracted {totalExtractedDishes} items into data/restaurant.json and instantly update /menu.
              </p>
            </div>

            <div className="flex items-center gap-3 w-full sm:w-auto">
              <Button
                type="button"
                disabled={publishing}
                onClick={handlePutInRealWebsite}
                className="w-full sm:w-auto bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-400 hover:to-teal-300 text-slate-950 font-black px-7 py-3 rounded-xl shadow-xl shadow-emerald-500/25 transition-all text-sm flex items-center justify-center gap-2"
              >
                {publishing ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-slate-950" />
                    <span>Publishing to /menu...</span>
                  </>
                ) : (
                  <>
                    <Check className="w-4 h-4 stroke-[3]" />
                    <span>Put in Real Website & Save</span>
                  </>
                )}
              </Button>
            </div>
          </div>

          {/* Success Dialog / Alert */}
          {publishSuccess && (
            <div className="p-4 rounded-xl bg-emerald-500/15 border-2 border-emerald-500/40 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 animate-in fade-in zoom-in-95">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-emerald-500 text-slate-950 flex items-center justify-center font-bold">
                  ✓
                </div>
                <div>
                  <p className="text-sm font-bold text-emerald-200">
                    Live Menu Updated Successfully!
                  </p>
                  <p className="text-xs text-emerald-300/80">
                    All {totalExtractedDishes} items and categories have been published to your real website.
                  </p>
                </div>
              </div>

              <a
                href="/menu"
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold px-4 py-2 rounded-lg text-xs transition-colors shadow"
              >
                <span>View Live Menu (/menu)</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
          )}
        </div>
      )}

      {/* ── Current Active Live Categories Manager (Accordion) ──────────── */}
      <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-orange-400" />
            <span className="text-xs font-bold text-slate-300 uppercase tracking-wider">
              Currently Active Menu on Site ({data.menu.length} Categories ·{" "}
              {data.menu.reduce((acc, c) => acc + c.items.length, 0)} Dishes)
            </span>
          </div>
          <button
            type="button"
            onClick={() => setActiveMenuExpanded(!activeMenuExpanded)}
            className="text-xs text-slate-400 hover:text-white flex items-center gap-1"
          >
            {activeMenuExpanded ? "Hide Details" : "View / Edit Active Menu"}
            {activeMenuExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>
        </div>

        {/* Categories Pills */}
        <div className="flex flex-wrap gap-2 pt-1">
          {data.menu.map((c) => (
            <span
              key={c.id}
              className="text-xs font-medium px-2.5 py-1 rounded-md bg-slate-800/90 text-slate-300 border border-slate-700/60"
            >
              {c.label} ({c.items.length})
            </span>
          ))}
        </div>

        {/* Expanded Direct Active Menu Editor */}
        {activeMenuExpanded && (
          <div className="pt-3 border-t border-slate-800 space-y-4">
            <p className="text-xs text-slate-400">
              Directly edit any existing category or dish on the live site:
            </p>
            {data.menu.map((cat, cIdx) => (
              <div key={cat.id || cIdx} className="rounded-lg border border-slate-800 bg-slate-950/70 p-3 space-y-3">
                <div className="flex items-center justify-between">
                  <Input
                    value={cat.label}
                    onChange={(e) => {
                      const arr = [...data.menu];
                      arr[cIdx].label = e.target.value;
                      arr[cIdx].id = slugify(e.target.value);
                      setData({ ...data, menu: arr });
                    }}
                    className="bg-slate-900 border-slate-800 text-xs font-bold text-white max-w-xs h-7"
                  />
                  <div className="flex items-center gap-2">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        const arr = [...data.menu];
                        arr[cIdx].items.push({ name: "New item", price: "₹150", veg: true });
                        setData({ ...data, menu: arr });
                      }}
                      className="text-xs h-6 text-orange-400 hover:bg-orange-500/10"
                    >
                      <Plus className="w-3 h-3 mr-1" /> Add Dish
                    </Button>
                    <button
                      type="button"
                      onClick={() => {
                        const arr = data.menu.filter((_, idx) => idx !== cIdx);
                        setData({ ...data, menu: arr });
                      }}
                      className="text-slate-500 hover:text-red-400 p-1"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                <div className="space-y-2">
                  {cat.items.map((it, itIdx) => (
                    <div key={itIdx} className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          const arr = [...data.menu];
                          arr[cIdx].items[itIdx].veg = !arr[cIdx].items[itIdx].veg;
                          setData({ ...data, menu: arr });
                        }}
                        className={`w-4 h-4 rounded-full border shrink-0 ${
                          it.veg !== false ? "bg-emerald-400 border-emerald-500" : "bg-red-400 border-red-500"
                        }`}
                        title={it.veg !== false ? "Vegetarian" : "Non-Veg"}
                      />
                      <Input
                        value={it.name}
                        onChange={(e) => {
                          const arr = [...data.menu];
                          arr[cIdx].items[itIdx].name = e.target.value;
                          setData({ ...data, menu: arr });
                        }}
                        className="bg-slate-900 border-slate-800 text-xs text-white h-7 flex-1"
                      />
                      <Input
                        value={it.price}
                        onChange={(e) => {
                          const arr = [...data.menu];
                          arr[cIdx].items[itIdx].price = e.target.value;
                          setData({ ...data, menu: arr });
                        }}
                        className="bg-slate-900 border-slate-800 text-xs text-amber-300 font-semibold h-7 w-20 text-center"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          const arr = [...data.menu];
                          arr[cIdx].items = arr[cIdx].items.filter((_, idx) => idx !== itIdx);
                          setData({ ...data, menu: arr });
                        }}
                        className="text-slate-500 hover:text-red-400 p-1"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
