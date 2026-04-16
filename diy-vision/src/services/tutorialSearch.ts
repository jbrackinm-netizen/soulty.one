/**
 * tutorialSearch.ts
 *
 * Content-matching pipeline. All external calls go through the SearchProvider
 * interface so the mock layer can be swapped for real APIs without touching
 * calling code.
 *
 * To wire real APIs:
 *   1. Implement SearchProvider with your actual fetch calls.
 *   2. Call setSearchProvider(myRealProvider) at app boot.
 *
 * Real API targets:
 *   - YouTube: YouTube Data API v3  — /search with type=video, q=query
 *   - Web:     Google Custom Search API or SerpAPI
 */

import {
  TutorialResult,
  ToolMaterialSuggestion,
  ObjectCategory,
  ContentMatchResult,
} from '../types/smartDetection';
import { NormalizedQuery } from './queryNormalizer';

// ─── Provider Interface ───────────────────────────────────────────────────────

type SearchProvider = {
  searchYouTube(query: string, variations: string[]): Promise<TutorialResult[]>;
  searchWeb(query: string, category: ObjectCategory): Promise<TutorialResult[]>;
  getToolsAndMaterials(label: string, category: ObjectCategory): Promise<ToolMaterialSuggestion[]>;
};

// ─── Mock YouTube Results ─────────────────────────────────────────────────────

const MOCK_YOUTUBE: Record<string, TutorialResult[]> = {
  furniture: [
    {
      id: 'yt-f-1',
      title: 'How To Reupholster a Couch — Complete Beginner Guide',
      url: 'https://www.youtube.com/watch?v=mock_f1',
      thumbnail: 'https://img.youtube.com/vi/dQw4w9WgXcQ/hqdefault.jpg',
      source: 'youtube',
      channelOrSite: 'Home Repair Tutor',
      snippet: 'Strip the old fabric, cut new yardage, and staple your sofa back to life. Full walkthrough from frame to finish.',
      duration: '18:42',
      viewCount: '1.2M views',
      relevanceScore: 0.96,
      publishedAt: '2023-11-14',
    },
    {
      id: 'yt-f-2',
      title: 'Reupholster a Dining Chair in ONE Hour — Budget DIY',
      url: 'https://www.youtube.com/watch?v=mock_f2',
      thumbnail: 'https://img.youtube.com/vi/dQw4w9WgXcQ/hqdefault.jpg',
      source: 'youtube',
      channelOrSite: 'DIY with Dave',
      snippet: 'Fastest method for chair seat reupholstery — minimal tools, under $40. Perfect for beginners.',
      duration: '11:20',
      viewCount: '842K views',
      relevanceScore: 0.89,
      publishedAt: '2024-01-20',
    },
    {
      id: 'yt-f-3',
      title: 'Fix Sagging Couch Cushions — Foam & Webbing Replacement',
      url: 'https://www.youtube.com/watch?v=mock_f3',
      thumbnail: 'https://img.youtube.com/vi/dQw4w9WgXcQ/hqdefault.jpg',
      source: 'youtube',
      channelOrSite: 'Crafted Workshop',
      snippet: 'Replace foam inserts and sagging support webbing to restore a drooping sofa in under 2 hours.',
      duration: '8:05',
      viewCount: '488K views',
      relevanceScore: 0.82,
      publishedAt: '2024-03-10',
    },
  ],
  concrete_masonry: [
    {
      id: 'yt-c-1',
      title: 'How to Repair a Cracked Concrete Driveway — Full Tutorial',
      url: 'https://www.youtube.com/watch?v=mock_c1',
      thumbnail: 'https://img.youtube.com/vi/dQw4w9WgXcQ/hqdefault.jpg',
      source: 'youtube',
      channelOrSite: 'The Concrete Network',
      snippet: 'Route the crack, clean, and fill with polyurethane sealant. Covers hairline cracks through 1/2" wide.',
      duration: '22:14',
      viewCount: '2.1M views',
      relevanceScore: 0.97,
      publishedAt: '2023-08-05',
    },
    {
      id: 'yt-c-2',
      title: 'Concrete Driveway Resurfacing — Transform It in a Weekend',
      url: 'https://www.youtube.com/watch?v=mock_c2',
      thumbnail: 'https://img.youtube.com/vi/dQw4w9WgXcQ/hqdefault.jpg',
      source: 'youtube',
      channelOrSite: 'Pro DIY Concrete',
      snippet: 'Full walkthrough: pressure wash, etch, apply a concrete overlay, and seal for a brand-new surface.',
      duration: '31:58',
      viewCount: '980K views',
      relevanceScore: 0.91,
      publishedAt: '2024-02-22',
    },
    {
      id: 'yt-c-3',
      title: 'Tuckpointing Brick — Repoint Mortar Joints DIY',
      url: 'https://www.youtube.com/watch?v=mock_c3',
      thumbnail: 'https://img.youtube.com/vi/dQw4w9WgXcQ/hqdefault.jpg',
      source: 'youtube',
      channelOrSite: 'This Old House',
      snippet: 'Grinding out old mortar joints and packing fresh mortar with a hawk and trowel.',
      duration: '16:30',
      viewCount: '720K views',
      relevanceScore: 0.79,
      publishedAt: '2023-10-01',
    },
  ],
  tools: [
    {
      id: 'yt-t-1',
      title: 'Circular Saw 101 — Everything a Beginner Needs to Know',
      url: 'https://www.youtube.com/watch?v=mock_t1',
      thumbnail: 'https://img.youtube.com/vi/dQw4w9WgXcQ/hqdefault.jpg',
      source: 'youtube',
      channelOrSite: 'Stumpy Nubs Woodworking',
      snippet: 'Blade selection, safety gear, rip cuts, crosscuts, and bevel angles. No experience required.',
      duration: '24:37',
      viewCount: '3.4M views',
      relevanceScore: 0.98,
      publishedAt: '2023-05-10',
    },
    {
      id: 'yt-t-2',
      title: 'Circular Saw Kickback — How to Prevent It Every Time',
      url: 'https://www.youtube.com/watch?v=mock_t2',
      thumbnail: 'https://img.youtube.com/vi/dQw4w9WgXcQ/hqdefault.jpg',
      source: 'youtube',
      channelOrSite: 'Fix This Build That',
      snippet: 'Real-world kickback scenarios, blade guard tips, and body positioning for safe cuts.',
      duration: '14:00',
      viewCount: '1.7M views',
      relevanceScore: 0.90,
      publishedAt: '2023-12-01',
    },
    {
      id: 'yt-t-3',
      title: 'Best Circular Saw Cuts — Rip, Cross, Bevel, Plunge',
      url: 'https://www.youtube.com/watch?v=mock_t3',
      thumbnail: 'https://img.youtube.com/vi/dQw4w9WgXcQ/hqdefault.jpg',
      source: 'youtube',
      channelOrSite: 'Wood Whisperer',
      snippet: 'Master every cut type with a circular saw using a guide rail and factory edge.',
      duration: '20:15',
      viewCount: '1.1M views',
      relevanceScore: 0.84,
      publishedAt: '2024-01-08',
    },
  ],
  plumbing: [
    {
      id: 'yt-p-1',
      title: 'How to Replace a Kitchen Faucet — Complete DIY Guide',
      url: 'https://www.youtube.com/watch?v=mock_p1',
      thumbnail: 'https://img.youtube.com/vi/dQw4w9WgXcQ/hqdefault.jpg',
      source: 'youtube',
      channelOrSite: 'Plumbing DIY TV',
      snippet: 'Shut off the supply lines, remove the old faucet, install the new one, and test for leaks — full walk-through.',
      duration: '17:23',
      viewCount: '1.9M views',
      relevanceScore: 0.95,
      publishedAt: '2023-09-18',
    },
    {
      id: 'yt-p-2',
      title: 'Fix a Dripping Faucet in 15 Minutes — Cartridge Replacement',
      url: 'https://www.youtube.com/watch?v=mock_p2',
      thumbnail: 'https://img.youtube.com/vi/dQw4w9WgXcQ/hqdefault.jpg',
      source: 'youtube',
      channelOrSite: 'Home Made Simple',
      snippet: 'Single-handle and double-handle cartridge replacement. Covers Moen, Delta, and Kohler.',
      duration: '12:05',
      viewCount: '980K views',
      relevanceScore: 0.87,
      publishedAt: '2024-02-10',
    },
  ],
  outdoor: [
    {
      id: 'yt-o-1',
      title: 'Build a Fire Pit in an Afternoon — Block by Block',
      url: 'https://www.youtube.com/watch?v=mock_o1',
      thumbnail: 'https://img.youtube.com/vi/dQw4w9WgXcQ/hqdefault.jpg',
      source: 'youtube',
      channelOrSite: "Lowe's Home Improvement",
      snippet: 'Layout, leveling, block stacking, capstone adhesion, and safety clearance specs. No mortar needed.',
      duration: '12:15',
      viewCount: '4.2M views',
      relevanceScore: 0.96,
      publishedAt: '2023-06-01',
    },
    {
      id: 'yt-o-2',
      title: 'DIY Pergola Build — Start to Finish in a Weekend',
      url: 'https://www.youtube.com/watch?v=mock_o2',
      thumbnail: 'https://img.youtube.com/vi/dQw4w9WgXcQ/hqdefault.jpg',
      source: 'youtube',
      channelOrSite: 'The Handyman',
      snippet: 'Post footings, beam layout, rafter spacing, and decorative end cuts for a 12x16 freestanding pergola.',
      duration: '38:20',
      viewCount: '2.8M views',
      relevanceScore: 0.91,
      publishedAt: '2023-07-15',
    },
  ],
};

// ─── Mock Web Results ─────────────────────────────────────────────────────────

const MOCK_WEB: Record<string, TutorialResult[]> = {
  furniture: [
    {
      id: 'web-f-1',
      title: 'The Complete Guide to Reupholstering a Sofa',
      url: 'https://www.familyhandyman.com/furniture/reupholster-sofa/',
      thumbnail: '',
      source: 'web',
      channelOrSite: 'Family Handyman',
      snippet: 'Tools list, fabric yardage calculator, and step-by-step photos for full sofa reupholstery.',
      relevanceScore: 0.92,
    },
    {
      id: 'web-f-2',
      title: 'How to Reupholster a Chair — Instructables',
      url: 'https://www.instructables.com/How-to-Reupholster-a-Chair/',
      thumbnail: '',
      source: 'web',
      channelOrSite: 'Instructables',
      snippet: '30+ photos covering frame inspection, batting installation, and fabric stapling techniques.',
      relevanceScore: 0.87,
    },
  ],
  concrete_masonry: [
    {
      id: 'web-c-1',
      title: 'DIY Concrete Driveway Repair: Cracks and Spalling',
      url: 'https://www.thisoldhouse.com/driveways/21016083/fixing-a-concrete-driveway',
      thumbnail: '',
      source: 'web',
      channelOrSite: 'This Old House',
      snippet: 'Expert guidance on routing, cleaning, and patching concrete cracks with the correct sealer type.',
      relevanceScore: 0.94,
    },
    {
      id: 'web-c-2',
      title: 'How to Resurface a Concrete Patio or Driveway',
      url: 'https://www.hgtv.com/outdoors/outdoor-spaces/how-to-resurface-concrete',
      thumbnail: '',
      source: 'web',
      channelOrSite: 'HGTV',
      snippet: 'Material selection, surface prep, and application guide for concrete resurfacer products.',
      relevanceScore: 0.88,
    },
  ],
  tools: [
    {
      id: 'web-t-1',
      title: 'Circular Saw Buying Guide and Safety Tips',
      url: 'https://www.homedepot.com/c/buying_guide/circular_saws',
      thumbnail: '',
      source: 'web',
      channelOrSite: 'Home Depot',
      snippet: 'Blade type guide, safety checklist, and cutting technique breakdown for beginners.',
      relevanceScore: 0.88,
    },
    {
      id: 'web-t-2',
      title: 'How to Use a Circular Saw — Bob Vila',
      url: 'https://www.bobvila.com/articles/how-to-use-a-circular-saw/',
      thumbnail: '',
      source: 'web',
      channelOrSite: 'Bob Vila',
      snippet: 'Step-by-step guide covering setup, blade guards, cutting lines, and safe technique.',
      relevanceScore: 0.84,
    },
  ],
  plumbing: [
    {
      id: 'web-p-1',
      title: 'Faucet Installation Guide — Moen Official',
      url: 'https://www.moen.com/support/faucet-installation',
      thumbnail: '',
      source: 'web',
      channelOrSite: 'Moen',
      snippet: 'Official brand instructions for single-handle and two-handle faucet installation and supply connections.',
      relevanceScore: 0.90,
    },
  ],
  outdoor: [
    {
      id: 'web-o-1',
      title: 'How to Build a Block Fire Pit — This Old House',
      url: 'https://www.thisoldhouse.com/yards/21017029/how-to-build-a-fire-pit',
      thumbnail: '',
      source: 'web',
      channelOrSite: 'This Old House',
      snippet: 'Material list, gravel base prep, block layout, and safety clearance requirements.',
      relevanceScore: 0.93,
    },
    {
      id: 'web-o-2',
      title: 'DIY Pergola Plans — Free Download + Build Guide',
      url: 'https://www.familyhandyman.com/project/build-a-pergola/',
      thumbnail: '',
      source: 'web',
      channelOrSite: 'Family Handyman',
      snippet: 'Free cut list, materials list, and annotated diagrams for a 12x12 freestanding pergola.',
      relevanceScore: 0.90,
    },
  ],
};

// ─── Mock Tools & Materials ───────────────────────────────────────────────────

const MOCK_TOOLS_MATERIALS: Record<string, ToolMaterialSuggestion[]> = {
  furniture: [
    { name: 'Heavy-duty staple gun', type: 'tool', note: '3/8" or 1/2" staples; electric is easiest for beginners', estimatedCost: '$30–$80' },
    { name: 'Upholstery fabric', type: 'material', note: '5–10 yards for a sofa; 1–2 yards for a chair', estimatedCost: '$15–$60/yd' },
    { name: 'High-density foam (2"–3")', type: 'material', note: '1.8 lb density minimum for seat cushions', estimatedCost: '$40–$120' },
    { name: 'Dacron batting', type: 'material', note: 'Wrap foam for a softer rounded edge', estimatedCost: '$15–$30' },
    { name: 'Tack strip remover / pry bar', type: 'tool', note: 'Flat pry bar or tack lifter for removing old staples', estimatedCost: '$10–$20' },
    { name: 'Heavy work gloves', type: 'safety', note: 'Old staples are extremely sharp', estimatedCost: '$8–$15' },
  ],
  concrete_masonry: [
    { name: 'Concrete crack filler', type: 'material', note: 'Polyurethane sealant for cracks up to 1/2"; epoxy for structural cracks', estimatedCost: '$15–$40' },
    { name: 'Concrete resurfacer', type: 'material', note: 'Required for full surface overlay — not just crack filling', estimatedCost: '$30–$80' },
    { name: 'Angle grinder + crack chaser blade', type: 'tool', note: 'Chase cracks wider than 1/4" for better sealant adhesion', estimatedCost: '$50–$120' },
    { name: 'Pressure washer (2000+ PSI)', type: 'tool', note: 'Surface must be clean and free of laitance before any coating', estimatedCost: '$100–$300 (rental)' },
    { name: 'Concrete sealer', type: 'material', note: 'Penetrating sealer for ongoing moisture protection', estimatedCost: '$25–$60' },
    { name: 'Safety glasses + rubber gloves', type: 'safety', note: 'Concrete is caustic — protect eyes and skin', estimatedCost: '$15–$25' },
  ],
  tools: [
    { name: 'Safety glasses (ANSI Z87.1)', type: 'safety', note: 'Required every time the saw is running', estimatedCost: '$10–$25' },
    { name: 'Hearing protection', type: 'safety', note: 'Circular saw exceeds safe exposure threshold in seconds', estimatedCost: '$5–$20' },
    { name: 'Push stick', type: 'tool', note: 'Keep hands 6"+ from blade path', estimatedCost: '$10–$20' },
    { name: 'Sawhorses or cutting table', type: 'tool', note: 'Proper workpiece support prevents blade pinch', estimatedCost: '$40–$80' },
    { name: 'Appropriate blade for material', type: 'material', note: 'Wood: 24T rip / 60T finish. Metal: carbide. Masonry: diamond', estimatedCost: '$15–$50' },
    { name: 'Combination square', type: 'tool', note: 'Mark accurate cut lines before cutting', estimatedCost: '$10–$25' },
  ],
  plumbing: [
    { name: 'Basin wrench', type: 'tool', note: 'Reaches faucet mounting nuts behind sink bowl — essential', estimatedCost: '$20–$40' },
    { name: 'Adjustable wrench + channel-lock pliers', type: 'tool', estimatedCost: '$15–$35' },
    { name: "Plumber's tape (PTFE / Teflon)", type: 'material', note: 'Wrap all threaded connections; 3 clockwise wraps minimum', estimatedCost: '$3–$8' },
    { name: 'Bucket + old towels', type: 'tool', note: 'Catch water trapped in supply lines after shutoff', estimatedCost: '$5–$15' },
    { name: 'Flashlight or headlamp', type: 'tool', note: 'Under-sink cabinet is dark — essential for safe work', estimatedCost: '$10–$25' },
  ],
  outdoor: [
    { name: 'Retaining wall blocks (qty varies)', type: 'material', note: '57 lbs each; plan ~100–150 for an 8-ft circle pit', estimatedCost: '$2–$4 each' },
    { name: 'Pea gravel (drainage base)', type: 'material', note: '4"–6" base layer inside and under ring', estimatedCost: '$30–$60' },
    { name: 'Plate compactor (rental)', type: 'tool', note: 'Compact base material before laying first course', estimatedCost: '$50–$120/day' },
    { name: '4-ft level + rubber mallet', type: 'tool', note: 'Check level on every block course', estimatedCost: '$25–$40' },
    { name: 'Capstones', type: 'material', note: 'Flat top ring for finished look; use landscape adhesive', estimatedCost: '$60–$120' },
    { name: 'Leather gloves', type: 'safety', note: 'Block edges are rough and heavy', estimatedCost: '$12–$25' },
  ],
};

const FALLBACK_TUTORIALS: TutorialResult[] = [
  {
    id: 'yt-gen-1',
    title: 'DIY Project Planning 101 — Where to Start Every Project',
    url: 'https://www.youtube.com/watch?v=mock_gen1',
    thumbnail: 'https://img.youtube.com/vi/dQw4w9WgXcQ/hqdefault.jpg',
    source: 'youtube',
    channelOrSite: 'DIY Academy',
    snippet: 'Planning checklist, tool selection, and safety basics applicable to any home improvement project.',
    duration: '15:00',
    viewCount: '500K views',
    relevanceScore: 0.65,
    publishedAt: '2024-01-01',
  },
];

const FALLBACK_WEB: TutorialResult[] = [
  {
    id: 'web-gen-1',
    title: 'DIY Project Center — This Old House',
    url: 'https://www.thisoldhouse.com',
    thumbnail: '',
    source: 'web',
    channelOrSite: 'This Old House',
    snippet: 'Browse expert DIY tutorials organized by trade and difficulty level.',
    relevanceScore: 0.60,
  },
];

const FALLBACK_TOOLS: ToolMaterialSuggestion[] = [
  { name: 'Safety glasses', type: 'safety', estimatedCost: '$10–$25' },
  { name: 'Work gloves', type: 'safety', estimatedCost: '$8–$15' },
  { name: 'Measuring tape', type: 'tool', estimatedCost: '$10–$20' },
  { name: 'Pencil + notepad', type: 'tool', note: 'Mark everything before you cut or drill', estimatedCost: '$2' },
];

// ─── Helper Utilities ─────────────────────────────────────────────────────────

function simulateDelay(minMs: number, maxMs: number): Promise<void> {
  return new Promise(r => setTimeout(r, minMs + Math.random() * (maxMs - minMs)));
}

function categoryKey(category: ObjectCategory): string {
  const map: Partial<Record<ObjectCategory, string>> = {
    furniture: 'furniture', concrete_masonry: 'concrete_masonry',
    tools: 'tools', plumbing: 'plumbing',
    outdoor: 'outdoor', carpentry: 'outdoor',
  };
  return map[category] ?? 'unknown';
}

function inferCategoryFromQuery(query: string): string {
  const q = query.toLowerCase();
  if (q.includes('couch') || q.includes('sofa') || q.includes('chair') || q.includes('furniture')) return 'furniture';
  if (q.includes('concrete') || q.includes('driveway') || q.includes('patio') || q.includes('brick')) return 'concrete_masonry';
  if (q.includes('saw') || q.includes('drill') || q.includes('grinder') || q.includes('tool')) return 'tools';
  if (q.includes('faucet') || q.includes('toilet') || q.includes('plumb')) return 'plumbing';
  if (q.includes('fire pit') || q.includes('pergola') || q.includes('outdoor') || q.includes('deck')) return 'outdoor';
  return 'unknown';
}

function rankByScore(results: TutorialResult[]): TutorialResult[] {
  return [...results].sort((a, b) => (b.relevanceScore ?? 0) - (a.relevanceScore ?? 0));
}

// ─── Mock Provider ────────────────────────────────────────────────────────────

const mockProvider: SearchProvider = {
  async searchYouTube(query, _variations) {
    await simulateDelay(700, 1400);
    const key = inferCategoryFromQuery(query);
    return rankByScore(MOCK_YOUTUBE[key] ?? FALLBACK_TUTORIALS);
  },
  async searchWeb(query, category) {
    await simulateDelay(500, 1100);
    const key = categoryKey(category);
    return rankByScore(MOCK_WEB[key] ?? FALLBACK_WEB);
  },
  async getToolsAndMaterials(_label, category) {
    await simulateDelay(300, 700);
    const key = categoryKey(category);
    return MOCK_TOOLS_MATERIALS[key] ?? FALLBACK_TOOLS;
  },
};

// ─── Active Provider (swappable) ─────────────────────────────────────────────

let activeProvider: SearchProvider = mockProvider;

/** Call at app boot to replace mock with real API provider. */
export function setSearchProvider(provider: SearchProvider): void {
  activeProvider = provider;
}

// ─── Public API ───────────────────────────────────────────────────────────────

export async function fetchContentMatch(
  normalizedQuery: NormalizedQuery,
  objectLabel: string,
): Promise<ContentMatchResult> {
  const [tutorials, webGuides, toolsMaterials] = await Promise.all([
    activeProvider.searchYouTube(normalizedQuery.primary, normalizedQuery.variations),
    activeProvider.searchWeb(normalizedQuery.primary, normalizedQuery.category),
    activeProvider.getToolsAndMaterials(objectLabel, normalizedQuery.category),
  ]);

  return {
    query:           objectLabel,
    normalizedQuery: normalizedQuery.primary,
    category:        normalizedQuery.category,
    tutorials,
    webGuides,
    toolsMaterials,
    fetchedAt:       new Date().toISOString(),
  };
}
