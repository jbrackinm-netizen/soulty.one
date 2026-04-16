// Screens
export { SmartDetectionScreen }    from './screens/SmartDetectionScreen';
export { TutorialResultsScreen }   from './screens/TutorialResultsScreen';

// Components
export { DetectionOverlay }          from './components/DetectionOverlay';
export { DetectionCandidateList }    from './components/DetectionCandidateList';
export { DetectionConfirmationCard } from './components/DetectionConfirmationCard';

// Hooks
export { useSmartDetection }   from './hooks/useSmartDetection';
export type { UseSmartDetectionReturn, RawDetectionData } from './hooks/useSmartDetection';

// Services
export { normalizeSearchQuery } from './services/queryNormalizer';
export type { NormalizedQuery, QueryIntent } from './services/queryNormalizer';
export { getObjectCategory, getCategoryLabel, getCategoryIcon } from './services/objectCategory';
export { fetchContentMatch, setSearchProvider } from './services/tutorialSearch';

// Types
export type {
  DetectedObject, DetectionResults,
  TutorialResult, ToolMaterialSuggestion,
  ContentMatchResult, SmartDetectionState,
  ObjectCategory, ConfidenceTier, BoundingBox,
  ProjectHistoryEntry,
} from './types/smartDetection';
