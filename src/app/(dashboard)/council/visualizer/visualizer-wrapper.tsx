"use client";

import { useState } from "react";
import { CouncilVisualizer } from "@/components/council-visualizer";
import type { Question } from "@/db";

interface Props {
  questions: Question[];
}

export function CouncilVisualizerWrapper({ questions }: Props) {
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const selected = questions.find((q) => q.id === selectedId);

  return (
    <div className="space-y-4">
      {/* Question selector */}
      <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
        <p className="text-xs font-semibold uppercase tracking-wide text-gray-400 mb-3">
          Select a question to deliberate
        </p>
        <div className="space-y-2">
          {questions.map((q) => (
            <button
              key={q.id}
              onClick={() => setSelectedId(q.id)}
              className={`w-full text-left rounded-lg border px-4 py-3 text-sm transition-all ${
                selectedId === q.id
                  ? "border-soul-300 bg-soul-50 text-soul-900 font-medium"
                  : "border-gray-200 hover:border-soul-200 text-gray-700 hover:bg-gray-50"
              }`}
            >
              {q.question}
            </button>
          ))}
        </div>
      </div>

      {/* Visualizer */}
      {selected && (
        <CouncilVisualizer
          key={selected.id}
          questionId={selected.id}
          questionText={selected.question}
        />
      )}
    </div>
  );
}
