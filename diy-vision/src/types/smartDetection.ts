// ─── Core Detection Types ────────────────────────────────────────────────────

export type BoundingBox = {
  x: number;
  y: number;
  width: number;
  height: number;
};

/** Confidence tiers shown in UI instead of raw numbers */
export type ConfidenceTier = 'top_match' | 'maybe_match' | 'low_confidence';

export type ObjectCategory =
  | 'furniture'
  | 'concrete_masonry'
  | 'tools'
  | 'plumbing'
  | 'electrical'
  | 'automotive'
  | 'carpentry'
  | 'outdoor'
  | 'flooring'
  | 'roofing'
  | 'painting'
  | 'unknown';

export type DetectedObject = {
  id: string;
  label: string;
  confidence: number;         // 0–1 raw score from detection model
  confidenceTier: ConfidenceTier;
  boundingBox?: BoundingBox;
  description?: string;       // short generated description
  category?: ObjectCategory;
};

export type DetectionResults = {
  imageUri: string;
  objects: DetectedObject[];  // sorted by confidence desc
  detectedAt: string;         // ISO timestamp
};

// ─── Content Matching Types ───────────────────────────────────────────────────

export type TutorialResult = {
  id: string;
  title: string;
  url: string;
  thumbnail: string;
  source: 'youtube' | 'web';
  channelOrSite?: string;
  snippet?: string;
  duration?: string;          // e.g. "18:42" — YouTube only
  viewCount?: string;         // e.g. "1.2M views" — YouTube only
  relevanceScore: number;     // 0–1 composite ranking score
  publishedAt?: string;       // ISO date string
};

export type ToolMaterialSuggestion = {
  name: string;
  type: 'tool' | 'material' | 'safety';
  note?: string;
  estimatedCost?: string;
};

export type ContentMatchResult = {
  query: string;              // original label
  normalizedQuery: string;    // expanded search intent string
  category: ObjectCategory;
  tutorials: TutorialResult[];
  webGuides: TutorialResult[];
  toolsMaterials: ToolMaterialSuggestion[];
  fetchedAt: string;          // ISO timestamp
};

// ─── State Machine ────────────────────────────────────────────────────────────

export type SmartDetectionState =
  | { status: 'idle' }
  | { status: 'detecting'; imageUri: string }
  | { status: 'review'; detection: DetectionResults }
  | { status: 'confirming'; detection: DetectionResults; selected: DetectedObject }
  | { status: 'manual_search'; detection: DetectionResults }
  | { status: 'searching'; object: DetectedObject; query: string }
  | { status: 'results'; object: DetectedObject; content: ContentMatchResult }
  | { status: 'error'; message: string; previousState?: SmartDetectionState };

// ─── Project History ──────────────────────────────────────────────────────────

export type ProjectHistoryEntry = {
  id: string;
  savedAt: string;            // ISO timestamp
  imageUri: string;
  object: DetectedObject;
  content: ContentMatchResult;
  notes?: string;
};
