import { useState, useCallback, useRef } from 'react';
import {
  SmartDetectionState,
  DetectedObject,
  DetectionResults,
  ConfidenceTier,
  ProjectHistoryEntry,
  ObjectCategory,
} from '../types/smartDetection';
import { normalizeSearchQuery } from '../services/queryNormalizer';
import { getObjectCategory } from '../services/objectCategory';
import { fetchContentMatch } from '../services/tutorialSearch';

// ─── Confidence Threshold System ─────────────────────────────────────────────
// Scores below LOW_CONFIDENCE show a warning nudge but still allow confirmation.

const THRESHOLD = {
  TOP_MATCH:      0.80,  // ≥ 0.80 → green, "Top Match"
  MAYBE_MATCH:    0.55,  // ≥ 0.55 → yellow, "Maybe"
  LOW_CONFIDENCE: 0.00,  // < 0.55 → red, "Low Confidence"
} as const;

function toConfidenceTier(score: number): ConfidenceTier {
  if (score >= THRESHOLD.TOP_MATCH)   return 'top_match';
  if (score >= THRESHOLD.MAYBE_MATCH) return 'maybe_match';
  return 'low_confidence';
}

// ─── Raw Detection Input ──────────────────────────────────────────────────────
// Shape expected from the object detection model output (e.g. YOLO, AWS Rekognition,
// Google Vision API, on-device TensorFlow Lite, etc.)

export type RawDetectionData = {
  label: string;
  score: number;        // 0–1 confidence from model
  bbox?: { x: number; y: number; width: number; height: number };
};

// ─── Hook Return Shape ────────────────────────────────────────────────────────

export type UseSmartDetectionReturn = {
  state:           SmartDetectionState;
  projectHistory:  ProjectHistoryEntry[];
  /** Begin detection for a given image. Pass rawData from your model, or omit for mock data. */
  startDetection:  (imageUri: string, rawData?: RawDetectionData[]) => void;
  /** User taps a candidate from the detection list → moves to confirming step. */
  selectCandidate: (object: DetectedObject) => void;
  /** User taps "Yes" on the confirmation card → triggers content search. */
  confirmObject:   () => void;
  /** User taps "No" → returns to the detection review list. */
  rejectObject:    () => void;
  /** User types a custom search term and bypasses detection. */
  searchManually:  (query: string) => void;
  /** Reset everything back to idle. */
  reset:           () => void;
  /** Save current results to project history. */
  saveToHistory:   (notes?: string) => void;
};

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useSmartDetection(): UseSmartDetectionReturn {
  const [state,          setState]          = useState<SmartDetectionState>({ status: 'idle' });
  const [projectHistory, setProjectHistory] = useState<ProjectHistoryEntry[]>([]);
  const searchAbortRef = useRef<{ aborted: boolean }>({ aborted: false });

  // ── startDetection ────────────────────────────────────────────────────────

  const startDetection = useCallback((imageUri: string, rawData?: RawDetectionData[]) => {
    setState({ status: 'detecting', imageUri });

    const input = rawData ?? getMockDetectionData();

    const objects: DetectedObject[] = input.map((item, i) => {
      const category = getObjectCategory(item.label);
      return {
        id:             `det-${i}-${Date.now()}`,
        label:          item.label,
        confidence:     item.score,
        confidenceTier: toConfidenceTier(item.score),
        boundingBox:    item.bbox,
        category,
        description:    generateDescription(item.label, category),
      };
    });

    const detection: DetectionResults = {
      imageUri,
      objects: objects.sort((a, b) => b.confidence - a.confidence),
      detectedAt: new Date().toISOString(),
    };

    setState({ status: 'review', detection });
  }, []);

  // ── selectCandidate ───────────────────────────────────────────────────────

  const selectCandidate = useCallback((object: DetectedObject) => {
    setState(prev =>
      prev.status === 'review'
        ? { status: 'confirming', detection: prev.detection, selected: object }
        : prev
    );
  }, []);

  // ── confirmObject + async search ─────────────────────────────────────────

  const confirmObject = useCallback(() => {
    setState(prev => {
      if (prev.status !== 'confirming') return prev;

      const { selected } = prev;
      const query = normalizeSearchQuery(selected.label, selected.category ?? 'unknown');

      // Fire-and-forget; state updates happen in the async body
      triggerSearch(selected, query);

      return { status: 'searching', object: selected, query: query.primary };
    });
  }, []);

  async function triggerSearch(
    object:          DetectedObject,
    normalizedQuery: ReturnType<typeof normalizeSearchQuery>,
  ) {
    const token = { aborted: false };
    searchAbortRef.current = token;

    try {
      const content = await fetchContentMatch(normalizedQuery, object.label);
      if (!token.aborted) {
        setState({ status: 'results', object, content });
      }
    } catch (err) {
      if (!token.aborted) {
        const message = err instanceof Error ? err.message : 'Could not load tutorials. Please try again.';
        setState(prev => ({ status: 'error', message, previousState: prev }));
      }
    }
  }

  // ── rejectObject ──────────────────────────────────────────────────────────

  const rejectObject = useCallback(() => {
    setState(prev =>
      prev.status === 'confirming'
        ? { status: 'review', detection: prev.detection }
        : prev
    );
  }, []);

  // ── searchManually ────────────────────────────────────────────────────────

  const searchManually = useCallback(async (query: string) => {
    if (!query.trim()) return;

    const category = getObjectCategory(query);
    const syntheticObject: DetectedObject = {
      id:             `manual-${Date.now()}`,
      label:          query.trim(),
      confidence:     1.0,
      confidenceTier: 'top_match',
      category,
      description:    `Manual search: "${query.trim()}"`,
    };

    const normalizedQuery = normalizeSearchQuery(query.trim(), category);

    searchAbortRef.current = { aborted: false };
    setState({ status: 'searching', object: syntheticObject, query: normalizedQuery.primary });

    try {
      const content = await fetchContentMatch(normalizedQuery, query.trim());
      setState({ status: 'results', object: syntheticObject, content });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Search failed. Please try again.';
      setState({ status: 'error', message });
    }
  }, []);

  // ── reset ─────────────────────────────────────────────────────────────────

  const reset = useCallback(() => {
    searchAbortRef.current.aborted = true;
    setState({ status: 'idle' });
  }, []);

  // ── saveToHistory ─────────────────────────────────────────────────────────

  const saveToHistory = useCallback((notes?: string) => {
    setState(prev => {
      if (prev.status !== 'results') return prev;

      const entry: ProjectHistoryEntry = {
        id:       `hist-${Date.now()}`,
        savedAt:  new Date().toISOString(),
        imageUri: '', // populated from DetectionResults if screen passes it through
        object:   prev.object,
        content:  prev.content,
        notes,
      };

      setProjectHistory(h => [entry, ...h]);
      return prev;
    });
  }, []);

  return {
    state, projectHistory,
    startDetection, selectCandidate, confirmObject,
    rejectObject, searchManually, reset, saveToHistory,
  };
}

// ─── Mock Detection Data ──────────────────────────────────────────────────────
// Used when no real model output is provided — replace with actual model output.

function getMockDetectionData(): RawDetectionData[] {
  return [
    { label: 'couch',        score: 0.91, bbox: { x: 48,  y: 118, width: 284, height: 178 } },
    { label: 'coffee table', score: 0.74, bbox: { x: 82,  y: 258, width: 138, height: 78  } },
    { label: 'cushion',      score: 0.58, bbox: { x: 62,  y: 128, width: 98,  height: 88  } },
  ];
}

// ─── Description Generator ────────────────────────────────────────────────────

const DESCRIPTIONS: Partial<Record<string, string>> = {
  couch:            'Upholstered seating — repair, reupholster, or deep clean.',
  sofa:             'Multi-seat furniture — frame repair, fabric swap, or full restore.',
  chair:            'Single-seat furniture — upholstery, leg repair, or refinish.',
  driveway:         'Concrete surface — crack repair, resurfacing, or decorative overlay.',
  concrete:         'Concrete structure — repair, seal, or resurface.',
  'circular saw':   'Handheld power saw — blade selection, safe operation, and cut types.',
  drill:            'Rotary power tool — driving fasteners and boring holes in any material.',
  'angle grinder':  'High-speed grinder — cutting, grinding, sanding, or surface prep.',
  faucet:           'Plumbing fixture — install, replace cartridge, or stop a leak.',
  toilet:           'Plumbing fixture — replace flapper, wax ring, or full toilet swap.',
  'fire pit':       'Outdoor feature — build or repair a backyard fire pit.',
  pergola:          'Outdoor shade structure — design, build, or restore.',
  deck:             'Outdoor platform — build, repair boards, or refinish surface.',
  fence:            'Boundary structure — build, repair panels, or replace posts.',
  outlet:           'Electrical receptacle — replace, upgrade to GFCI, or troubleshoot.',
  'ceiling fan':    'Electrical fixture — install, wire, or balance a wobbling fan.',
  tile:             'Floor/wall surface — install, regrout, or replace cracked tiles.',
};

function generateDescription(label: string, category: ObjectCategory): string {
  const key = label.toLowerCase();
  if (DESCRIPTIONS[key]) return DESCRIPTIONS[key]!;

  const fallbacks: Partial<Record<ObjectCategory, string>> = {
    furniture:        'Furniture piece — restore, repair, or refinish.',
    concrete_masonry: 'Masonry element — repair, seal, or rebuild.',
    tools:            'Power tool — learn safe operation and best practices.',
    plumbing:         'Plumbing component — install, replace, or repair.',
    electrical:       'Electrical component — install or replace safely.',
    automotive:       'Vehicle component — replacement or repair guide.',
    carpentry:        'Carpentry element — build, repair, or refinish.',
    outdoor:          'Outdoor project — build or restore.',
    flooring:         'Flooring material — install, repair, or refinish.',
    roofing:          'Roofing component — inspect, repair, or replace.',
    painting:         'Surface finishing — prep, paint, or texture.',
  };

  return fallbacks[category] ?? `Detected object: ${label}. Tap to find DIY tutorials.`;
}
