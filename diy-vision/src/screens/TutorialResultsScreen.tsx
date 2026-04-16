/**
 * TutorialResultsScreen.tsx
 *
 * Renders the full matched content for a confirmed detected object:
 *   - Best-match YouTube card (pinned at top)
 *   - Scrollable list of additional YouTube tutorials
 *   - Web how-to guide cards
 *   - Tools & Materials section (grouped by type)
 *   - "Ask a Pro" CTA
 *   - Save to project history
 */

import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, SafeAreaView,
  TouchableOpacity, Image, Linking,
} from 'react-native';
import {
  DetectedObject, ContentMatchResult,
  TutorialResult, ToolMaterialSuggestion,
} from '../types/smartDetection';
import { getCategoryIcon, getCategoryLabel } from '../services/objectCategory';

// ─── Navigation / route types ─────────────────────────────────────────────────

type Nav = {
  navigate: (screen: string, params?: Record<string, unknown>) => void;
  goBack:   () => void;
};

type RouteParams = {
  object:   DetectedObject;
  content:  ContentMatchResult;
  imageUri: string;
};

type Props = {
  navigation: Nav;
  route:      { params: RouteParams };
  onSave?:    (notes?: string) => void;
};

// ─── Screen ───────────────────────────────────────────────────────────────────

export function TutorialResultsScreen({ navigation, route, onSave }: Props) {
  const { object, content } = route.params;
  const [saved, setSaved] = useState(false);

  const icon      = getCategoryIcon(object.category ?? 'unknown');
  const catLabel  = getCategoryLabel(object.category ?? 'unknown');
  const topVideo  = content.tutorials[0];
  const moreVideos = content.tutorials.slice(1);

  const open = (url: string) => Linking.openURL(url).catch(() => {});

  const handleSave = () => {
    setSaved(true);
    onSave?.();
  };

  const hasResults = content.tutorials.length > 0 || content.webGuides.length > 0;

  return (
    <SafeAreaView style={styles.screen}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.headerBtn}>
          <Text style={styles.back}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Tutorials</Text>
        <TouchableOpacity onPress={handleSave} style={styles.headerBtn}>
          <Text style={[styles.saveText, saved && styles.savedText]}>
            {saved ? '✓ Saved' : 'Save'}
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Object summary strip */}
        <View style={styles.summaryStrip}>
          <Text style={styles.summaryIcon}>{icon}</Text>
          <View style={styles.summaryText}>
            <Text style={styles.summaryLabel}>{object.label}</Text>
            <Text style={styles.summaryCat}>{catLabel}</Text>
            <Text style={styles.summaryQuery} numberOfLines={1}>
              {content.normalizedQuery}
            </Text>
          </View>
        </View>

        {/* Empty state */}
        {!hasResults && (
          <NoResultsView
            label={object.label}
            onManual={() => navigation.goBack()}
          />
        )}

        {/* Best match */}
        {topVideo && (
          <Section title="🏆  Best Match">
            <TopTutorialCard tutorial={topVideo} onPress={open} />
          </Section>
        )}

        {/* More videos */}
        {moreVideos.length > 0 && (
          <Section title="▶  More Tutorials">
            {moreVideos.map(t => (
              <TutorialCard key={t.id} tutorial={t} onPress={open} />
            ))}
          </Section>
        )}

        {/* Web guides */}
        {content.webGuides.length > 0 && (
          <Section title="📖  How-To Guides">
            {content.webGuides.map(g => (
              <WebGuideCard key={g.id} guide={g} onPress={open} />
            ))}
          </Section>
        )}

        {/* Tools & Materials */}
        {content.toolsMaterials.length > 0 && (
          <Section title="🛠  Tools & Materials">
            <ToolsMaterials items={content.toolsMaterials} />
          </Section>
        )}

        {/* Ask a Pro */}
        <AskProCTA />

        <View style={styles.bottomPad} />
      </ScrollView>
    </SafeAreaView>
  );
}

// ─── Section wrapper ──────────────────────────────────────────────────────────

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {children}
    </View>
  );
}

// ─── Top tutorial card (best match, pinned) ───────────────────────────────────

function TopTutorialCard({
  tutorial, onPress,
}: { tutorial: TutorialResult; onPress: (url: string) => void }) {
  return (
    <TouchableOpacity
      style={styles.topCard}
      onPress={() => onPress(tutorial.url)}
      activeOpacity={0.8}
    >
      {tutorial.thumbnail ? (
        <Image source={{ uri: tutorial.thumbnail }} style={styles.topThumb} resizeMode="cover" />
      ) : (
        <ThumbPlaceholder large />
      )}

      <View style={styles.topInfo}>
        <SourceBadge source={tutorial.source} />

        <Text style={styles.topTitle} numberOfLines={3}>{tutorial.title}</Text>

        {tutorial.channelOrSite && (
          <Text style={styles.channel}>{tutorial.channelOrSite}</Text>
        )}

        <View style={styles.metaRow}>
          {tutorial.duration  && <MetaChip text={`⏱ ${tutorial.duration}`} />}
          {tutorial.viewCount && <MetaChip text={`👁 ${tutorial.viewCount}`} />}
          <MetaChip
            text={`${Math.round((tutorial.relevanceScore ?? 0) * 100)}% match`}
            highlight
          />
        </View>

        {tutorial.snippet && (
          <Text style={styles.topSnippet} numberOfLines={2}>{tutorial.snippet}</Text>
        )}
      </View>

      <TouchableOpacity
        style={styles.watchBtn}
        onPress={() => onPress(tutorial.url)}
        activeOpacity={0.85}
      >
        <Text style={styles.watchBtnText}>
          {tutorial.source === 'youtube' ? '▶  Watch Tutorial' : '→  Read Guide'}
        </Text>
      </TouchableOpacity>
    </TouchableOpacity>
  );
}

// ─── Smaller tutorial row card ────────────────────────────────────────────────

function TutorialCard({
  tutorial, onPress,
}: { tutorial: TutorialResult; onPress: (url: string) => void }) {
  return (
    <TouchableOpacity
      style={styles.tutCard}
      onPress={() => onPress(tutorial.url)}
      activeOpacity={0.8}
    >
      {tutorial.thumbnail ? (
        <Image source={{ uri: tutorial.thumbnail }} style={styles.tutThumb} resizeMode="cover" />
      ) : (
        <ThumbPlaceholder />
      )}

      <View style={styles.tutInfo}>
        <Text style={styles.tutTitle} numberOfLines={2}>{tutorial.title}</Text>
        <Text style={styles.tutChannel}>{tutorial.channelOrSite}</Text>
        <View style={styles.metaRow}>
          {tutorial.duration  && <MetaChip text={`⏱ ${tutorial.duration}`} />}
          {tutorial.viewCount && <MetaChip text={`👁 ${tutorial.viewCount}`} />}
        </View>
      </View>

      <Text style={styles.chevron}>›</Text>
    </TouchableOpacity>
  );
}

// ─── Web guide card ───────────────────────────────────────────────────────────

function WebGuideCard({
  guide, onPress,
}: { guide: TutorialResult; onPress: (url: string) => void }) {
  return (
    <TouchableOpacity
      style={styles.webCard}
      onPress={() => onPress(guide.url)}
      activeOpacity={0.8}
    >
      <View style={styles.webLeft}>
        <Text style={styles.webSite}>{guide.channelOrSite ?? 'Web'}</Text>
        <Text style={styles.webTitle} numberOfLines={2}>{guide.title}</Text>
        {guide.snippet && (
          <Text style={styles.webSnippet} numberOfLines={2}>{guide.snippet}</Text>
        )}
      </View>
      <Text style={styles.webArrow}>→</Text>
    </TouchableOpacity>
  );
}

// ─── Tools & Materials section ────────────────────────────────────────────────

function ToolsMaterials({ items }: { items: ToolMaterialSuggestion[] }) {
  const safety    = items.filter(i => i.type === 'safety');
  const tools     = items.filter(i => i.type === 'tool');
  const materials = items.filter(i => i.type === 'material');

  return (
    <View style={styles.toolsCard}>
      {safety.length    > 0 && <ToolGroup title="⚠️  Safety"    color="#FF6B6B" items={safety} />}
      {tools.length     > 0 && <ToolGroup title="🔧  Tools"     color="#00BFFF" items={tools} />}
      {materials.length > 0 && <ToolGroup title="📦  Materials" color="#FFB800" items={materials} />}
    </View>
  );
}

function ToolGroup({
  title, color, items,
}: { title: string; color: string; items: ToolMaterialSuggestion[] }) {
  return (
    <View style={styles.toolGroup}>
      <Text style={[styles.toolGroupTitle, { color }]}>{title}</Text>
      {items.map((item, i) => (
        <View key={i} style={styles.toolRow}>
          <View style={[styles.toolDot, { backgroundColor: color }]} />
          <View style={styles.toolContent}>
            <Text style={styles.toolName}>{item.name}</Text>
            {item.note          && <Text style={styles.toolNote}>{item.note}</Text>}
            {item.estimatedCost && <Text style={styles.toolCost}>{item.estimatedCost}</Text>}
          </View>
        </View>
      ))}
    </View>
  );
}

// ─── Ask a Pro CTA ────────────────────────────────────────────────────────────

function AskProCTA() {
  return (
    <View style={styles.proCard}>
      <View style={styles.proTop}>
        <Text style={styles.proIcon}>👷</Text>
        <View style={styles.proText}>
          <Text style={styles.proTitle}>Not a DIY project?</Text>
          <Text style={styles.proSub}>
            Connect with licensed local pros for quotes and expert work.
          </Text>
        </View>
      </View>
      <TouchableOpacity style={styles.proBtn} activeOpacity={0.8}>
        <Text style={styles.proBtnText}>Find a Local Pro →</Text>
      </TouchableOpacity>
    </View>
  );
}

// ─── Empty state ──────────────────────────────────────────────────────────────

function NoResultsView({
  label, onManual,
}: { label: string; onManual: () => void }) {
  return (
    <View style={styles.noResults}>
      <Text style={styles.noResultsIcon}>📭</Text>
      <Text style={styles.noResultsTitle}>No results for "{label}"</Text>
      <Text style={styles.noResultsSub}>Try a broader term or search manually.</Text>
      <TouchableOpacity style={styles.noResultsBtn} onPress={onManual} activeOpacity={0.8}>
        <Text style={styles.noResultsBtnText}>← Search Again</Text>
      </TouchableOpacity>
    </View>
  );
}

// ─── Micro-components ─────────────────────────────────────────────────────────

function ThumbPlaceholder({ large }: { large?: boolean }) {
  return (
    <View style={[styles.thumbPlaceholder, large && styles.thumbPlaceholderLarge]}>
      <Text style={styles.thumbPlaceholderIcon}>▶</Text>
    </View>
  );
}

function SourceBadge({ source }: { source: 'youtube' | 'web' }) {
  return (
    <View style={styles.sourceBadge}>
      <Text style={styles.sourceBadgeText}>
        {source === 'youtube' ? '▶  YouTube' : '🌐  Web'}
      </Text>
    </View>
  );
}

function MetaChip({ text, highlight }: { text: string; highlight?: boolean }) {
  return (
    <Text style={[styles.metaChip, highlight && styles.metaChipHL]}>{text}</Text>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  screen:          { flex: 1, backgroundColor: '#0A0A0A' },
  scroll:          { flex: 1 },
  bottomPad:       { height: 40 },

  // Header
  header: {
    flexDirection:    'row',
    alignItems:       'center',
    paddingHorizontal: 16,
    paddingVertical:  12,
    borderBottomWidth: 1,
    borderBottomColor: '#141414',
  },
  headerBtn:   { width: 60, paddingVertical: 4 },
  back:        { color: '#00E5A0', fontSize: 15, fontWeight: '600' },
  headerTitle: { flex: 1, textAlign: 'center', fontSize: 16, fontWeight: '700', color: '#F0F0F0' },
  saveText:    { color: '#555', fontSize: 14, fontWeight: '500', textAlign: 'right' },
  savedText:   { color: '#00E5A0' },

  // Summary strip
  summaryStrip: {
    flexDirection:  'row',
    alignItems:     'center',
    gap:            14,
    paddingHorizontal: 16,
    paddingVertical: 18,
    borderBottomWidth: 1,
    borderBottomColor: '#141414',
  },
  summaryIcon:  { fontSize: 36 },
  summaryText:  { flex: 1 },
  summaryLabel: { fontSize: 20, fontWeight: '800', color: '#F0F0F0', textTransform: 'capitalize' },
  summaryCat:   { fontSize: 12, color: '#555', fontWeight: '500', marginBottom: 2 },
  summaryQuery: { fontSize: 11, color: '#2A2A2A', fontStyle: 'italic' },

  // Section wrapper
  section: {
    paddingHorizontal: 16,
    paddingTop:        24,
    gap:               12,
  },
  sectionTitle: {
    fontSize:      13,
    fontWeight:    '700',
    color:         '#777',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    marginBottom:  4,
  },

  // Top card
  topCard: {
    backgroundColor: '#141414',
    borderRadius:    16,
    overflow:        'hidden',
    borderWidth:     1,
    borderColor:     '#00E5A0',
  },
  topThumb: { width: '100%', height: 195, backgroundColor: '#0E0E0E' },
  topInfo:  { padding: 16, gap: 6 },
  topTitle: { fontSize: 17, fontWeight: '700', color: '#F0F0F0', lineHeight: 23 },
  topSnippet: { fontSize: 13, color: '#666', lineHeight: 18, marginTop: 2 },
  channel: { fontSize: 12, color: '#555', fontWeight: '500' },
  metaRow: { flexDirection: 'row', gap: 10, flexWrap: 'wrap' },
  metaChip: { fontSize: 11, color: '#444', fontWeight: '500' },
  metaChipHL: { color: '#00E5A0' },
  watchBtn: {
    marginHorizontal: 16,
    marginBottom:     16,
    backgroundColor:  '#00E5A0',
    borderRadius:     10,
    paddingVertical:  13,
    alignItems:       'center',
  },
  watchBtnText: { fontSize: 14, fontWeight: '800', color: '#000' },

  // Source badge
  sourceBadge: {
    alignSelf:         'flex-start',
    backgroundColor:   'rgba(0,229,160,0.12)',
    paddingHorizontal: 8,
    paddingVertical:   3,
    borderRadius:      6,
    marginBottom:      2,
  },
  sourceBadgeText: { fontSize: 10, fontWeight: '700', color: '#00E5A0', letterSpacing: 0.4 },

  // Tutorial row
  tutCard: {
    flexDirection:   'row',
    backgroundColor: '#141414',
    borderRadius:    12,
    overflow:        'hidden',
    borderWidth:     1,
    borderColor:     '#1E1E1E',
    alignItems:      'center',
  },
  tutThumb: { width: 100, height: 70, backgroundColor: '#0E0E0E' },
  tutInfo:  { flex: 1, padding: 12, gap: 3 },
  tutTitle: { fontSize: 13, fontWeight: '600', color: '#DCDCDC', lineHeight: 18 },
  tutChannel: { fontSize: 11, color: '#555' },
  chevron: { paddingHorizontal: 14, fontSize: 20, color: '#333' },

  // Thumb placeholder
  thumbPlaceholder: {
    width:          100,
    height:         70,
    backgroundColor: '#0E0E0E',
    alignItems:     'center',
    justifyContent: 'center',
  },
  thumbPlaceholderLarge: { width: '100%', height: 195 },
  thumbPlaceholderIcon: { fontSize: 22, color: '#2A2A2A' },

  // Web guide
  webCard: {
    flexDirection:   'row',
    backgroundColor: '#141414',
    borderRadius:    12,
    padding:         14,
    borderWidth:     1,
    borderColor:     '#1E1E1E',
    alignItems:      'center',
    gap:             12,
  },
  webLeft:    { flex: 1, gap: 3 },
  webSite:    { fontSize: 10, fontWeight: '700', color: '#555', textTransform: 'uppercase', letterSpacing: 0.4 },
  webTitle:   { fontSize: 14, fontWeight: '600', color: '#DCDCDC', lineHeight: 19 },
  webSnippet: { fontSize: 12, color: '#555', lineHeight: 17 },
  webArrow:   { fontSize: 18, color: '#333', flexShrink: 0 },

  // Tools & materials
  toolsCard: {
    backgroundColor: '#141414',
    borderRadius:    14,
    padding:         16,
    gap:             18,
    borderWidth:     1,
    borderColor:     '#1E1E1E',
  },
  toolGroup:      { gap: 9 },
  toolGroupTitle: { fontSize: 12, fontWeight: '700', letterSpacing: 0.5, textTransform: 'uppercase', marginBottom: 2 },
  toolRow:        { flexDirection: 'row', gap: 10, alignItems: 'flex-start' },
  toolDot:        { width: 6, height: 6, borderRadius: 3, marginTop: 6, flexShrink: 0 },
  toolContent:    { flex: 1, gap: 2 },
  toolName:       { fontSize: 13, fontWeight: '600', color: '#DCDCDC' },
  toolNote:       { fontSize: 11, color: '#555', lineHeight: 16 },
  toolCost:       { fontSize: 11, color: '#3A3A3A', fontWeight: '500' },

  // Pro CTA
  proCard: {
    margin:          16,
    marginTop:       24,
    backgroundColor: '#141414',
    borderRadius:    16,
    padding:         16,
    gap:             14,
    borderWidth:     1,
    borderColor:     '#1E1E1E',
  },
  proTop:  { flexDirection: 'row', gap: 12, alignItems: 'flex-start' },
  proIcon: { fontSize: 28 },
  proText: { flex: 1, gap: 4 },
  proTitle: { fontSize: 15, fontWeight: '700', color: '#F0F0F0' },
  proSub:   { fontSize: 13, color: '#555', lineHeight: 18 },
  proBtn: {
    backgroundColor: '#1A1A1A',
    borderRadius:    10,
    paddingVertical: 13,
    alignItems:      'center',
    borderWidth:     1,
    borderColor:     '#2A2A2A',
  },
  proBtnText: { fontSize: 14, fontWeight: '700', color: '#CCC' },

  // No results
  noResults: {
    alignItems:      'center',
    paddingVertical: 48,
    paddingHorizontal: 32,
    gap:             12,
  },
  noResultsIcon:    { fontSize: 40 },
  noResultsTitle:   { fontSize: 17, fontWeight: '700', color: '#F0F0F0', textAlign: 'center' },
  noResultsSub:     { fontSize: 14, color: '#555', textAlign: 'center', lineHeight: 20 },
  noResultsBtn: {
    backgroundColor: '#1A1A1A',
    borderRadius:    12,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderWidth:     1,
    borderColor:     '#2A2A2A',
    marginTop:       4,
  },
  noResultsBtnText: { fontSize: 14, fontWeight: '600', color: '#CCC' },
});
