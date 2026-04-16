/**
 * SmartDetectionScreen.tsx
 *
 * Orchestrates the full detection → confirm → search flow.
 * Navigation wiring shown for expo-router; swap for react-navigation if needed.
 *
 * Expected route params:
 *   imageUri      — local URI from expo-image-picker or expo-camera
 *   detectionData — optional raw model output; falls back to mock if omitted
 */

import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, SafeAreaView,
  TouchableOpacity, ActivityIndicator, TextInput,
  KeyboardAvoidingView, Platform,
} from 'react-native';
import { useSmartDetection, RawDetectionData } from '../hooks/useSmartDetection';
import { DetectionOverlay }          from '../components/DetectionOverlay';
import { DetectionCandidateList }    from '../components/DetectionCandidateList';
import { DetectionConfirmationCard } from '../components/DetectionConfirmationCard';

// ─── Navigation types (replace with your router's types) ─────────────────────

type Nav = {
  navigate: (screen: string, params?: Record<string, unknown>) => void;
  goBack:   () => void;
};

type RouteParams = {
  imageUri:      string;
  detectionData?: RawDetectionData[];
};

type Props = {
  navigation: Nav;
  route:      { params: RouteParams };
};

// ─── Screen ───────────────────────────────────────────────────────────────────

export function SmartDetectionScreen({ navigation, route }: Props) {
  const { imageUri, detectionData } = route.params;

  const {
    state, selectCandidate, confirmObject,
    rejectObject, searchManually, reset, startDetection,
  } = useSmartDetection();

  // Kick off detection once on mount
  useEffect(() => {
    startDetection(imageUri, detectionData);
  }, []);

  // Navigate to results when content is ready
  useEffect(() => {
    if (state.status === 'results') {
      navigation.navigate('TutorialResults', {
        object:   state.object,
        content:  state.content,
        imageUri,
      });
    }
  }, [state.status]);

  // ── Loading states ──────────────────────────────────────────────────────

  if (state.status === 'detecting') {
    return <LoadingView message="Analyzing image…" />;
  }

  if (state.status === 'searching') {
    return <LoadingView message={`Finding tutorials for "${state.object.label}"…`} />;
  }

  // ── Error state ─────────────────────────────────────────────────────────

  if (state.status === 'error') {
    return (
      <ErrorView
        message={state.message}
        onRetry={reset}
        onManualSearch={searchManually}
      />
    );
  }

  // ── Review: tap a candidate ─────────────────────────────────────────────

  if (state.status === 'review') {
    return (
      <SafeAreaView style={styles.screen}>
        <ScreenHeader
          title="What did we find?"
          onBack={() => navigation.goBack()}
          rightLabel="Manual"
          onRight={() => searchManually('')}
        />
        <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
          <DetectionOverlay
            imageUri={imageUri}
            detectedObjects={state.detection.objects}
          />
          <DetectionCandidateList
            objects={state.detection.objects}
            onSelect={selectCandidate}
          />
          <View style={styles.bottomPad} />
        </ScrollView>
      </SafeAreaView>
    );
  }

  // ── Confirming: yes / no / manual ───────────────────────────────────────

  if (state.status === 'confirming') {
    return (
      <SafeAreaView style={styles.screen}>
        <ScreenHeader
          title="Confirm Object"
          onBack={rejectObject}
        />
        <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
          <DetectionOverlay
            imageUri={imageUri}
            detectedObjects={state.detection.objects}
            selectedObjectId={state.selected.id}
          />
          <DetectionConfirmationCard
            object={state.selected}
            imageUri={imageUri}
            onConfirm={confirmObject}
            onReject={rejectObject}
            onManualSearch={searchManually}
          />
          <View style={styles.bottomPad} />
        </ScrollView>
      </SafeAreaView>
    );
  }

  return null;
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function ScreenHeader({
  title, onBack, rightLabel, onRight,
}: {
  title:       string;
  onBack:      () => void;
  rightLabel?: string;
  onRight?:    () => void;
}) {
  return (
    <View style={styles.header}>
      <TouchableOpacity onPress={onBack} style={styles.headerBtn}>
        <Text style={styles.headerBack}>← Back</Text>
      </TouchableOpacity>

      <Text style={styles.headerTitle}>{title}</Text>

      {onRight ? (
        <TouchableOpacity onPress={onRight} style={styles.headerBtn}>
          <Text style={styles.headerRight}>{rightLabel}</Text>
        </TouchableOpacity>
      ) : (
        <View style={styles.headerBtn} />
      )}
    </View>
  );
}

function LoadingView({ message }: { message: string }) {
  return (
    <SafeAreaView style={[styles.screen, styles.center]}>
      <ActivityIndicator size="large" color="#00E5A0" />
      <Text style={styles.loadingMsg}>{message}</Text>
      <Text style={styles.loadingSub}>Usually takes a few seconds</Text>
    </SafeAreaView>
  );
}

function ErrorView({
  message, onRetry, onManualSearch,
}: {
  message:        string;
  onRetry:        () => void;
  onManualSearch: (q: string) => void;
}) {
  const [query, setQuery] = useState('');
  const [showInput, setShowInput] = useState(false);

  return (
    <SafeAreaView style={[styles.screen, styles.center]}>
      <Text style={styles.errorIcon}>⚠️</Text>
      <Text style={styles.errorTitle}>Something went wrong</Text>
      <Text style={styles.errorMsg}>{message}</Text>

      <TouchableOpacity style={styles.retryBtn} onPress={onRetry} activeOpacity={0.8}>
        <Text style={styles.retryBtnText}>Try Again</Text>
      </TouchableOpacity>

      {!showInput ? (
        <TouchableOpacity onPress={() => setShowInput(true)} style={styles.manualFallback}>
          <Text style={styles.manualFallbackText}>Search manually instead</Text>
        </TouchableOpacity>
      ) : (
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.errorInput}>
          <TextInput
            style={styles.errorTextInput}
            value={query}
            onChangeText={setQuery}
            placeholder="What are you working on?"
            placeholderTextColor="#3A3A3A"
            autoFocus
            returnKeyType="search"
            onSubmitEditing={() => query.trim() && onManualSearch(query.trim())}
          />
          <TouchableOpacity
            style={[styles.retryBtn, { marginTop: 0 }]}
            onPress={() => query.trim() && onManualSearch(query.trim())}
            disabled={!query.trim()}
            activeOpacity={0.8}
          >
            <Text style={styles.retryBtnText}>Search</Text>
          </TouchableOpacity>
        </KeyboardAvoidingView>
      )}
    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  screen: {
    flex:            1,
    backgroundColor: '#0A0A0A',
  },
  center: {
    justifyContent: 'center',
    alignItems:     'center',
    paddingHorizontal: 32,
    gap: 12,
  },
  scroll: { flex: 1 },
  bottomPad: { height: 40 },

  // Header
  header: {
    flexDirection:    'row',
    alignItems:       'center',
    paddingHorizontal: 16,
    paddingVertical:  12,
    borderBottomWidth: 1,
    borderBottomColor: '#141414',
  },
  headerBtn: {
    width:          60,
    paddingVertical: 4,
  },
  headerBack: {
    color:      '#00E5A0',
    fontSize:   15,
    fontWeight: '600',
  },
  headerTitle: {
    flex:       1,
    textAlign:  'center',
    fontSize:   16,
    fontWeight: '700',
    color:      '#F0F0F0',
  },
  headerRight: {
    color:      '#555',
    fontSize:   14,
    fontWeight: '500',
    textAlign:  'right',
  },

  // Loading
  loadingMsg: {
    fontSize:   16,
    fontWeight: '600',
    color:      '#CCC',
    textAlign:  'center',
    marginTop:  16,
  },
  loadingSub: {
    fontSize:  13,
    color:     '#444',
    textAlign: 'center',
  },

  // Error
  errorIcon:  { fontSize: 40, marginBottom: 8 },
  errorTitle: { fontSize: 20, fontWeight: '800', color: '#F0F0F0' },
  errorMsg: {
    fontSize:   14,
    color:      '#666',
    textAlign:  'center',
    lineHeight: 20,
    marginBottom: 8,
  },
  retryBtn: {
    backgroundColor: '#00E5A0',
    borderRadius:    14,
    paddingVertical: 14,
    paddingHorizontal: 40,
    marginTop:       8,
  },
  retryBtnText: {
    fontSize:   15,
    fontWeight: '800',
    color:      '#000',
  },
  manualFallback: { paddingVertical: 14 },
  manualFallbackText: {
    fontSize:          14,
    color:             '#555',
    textDecorationLine: 'underline',
  },
  errorInput: {
    width: '100%',
    gap:   10,
    marginTop: 8,
  },
  errorTextInput: {
    backgroundColor: '#141414',
    borderRadius:    12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize:        15,
    color:           '#F0F0F0',
    borderWidth:     1,
    borderColor:     '#2A2A2A',
    width:           '100%',
  },
});
