'use client';
import { useState, useRef } from 'react';
import { Camera, Upload, Zap, Package, DollarSign, AlertTriangle, CheckCircle, Loader2 } from 'lucide-react';

interface ScanResult {
  summary?: string;
  materials?: Array<{ item: string; quantity: string; estimated_cost: string }>;
  instructions?: string[];
  difficulty?: string;
  total_cost_range?: string;
  safety_notes?: string[];
  what_i_see?: string;
}

export default function DIYVisionPage() {
  const [scanning, setScanning] = useState(false);
  const [result, setResult] = useState<ScanResult | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  async function handleFile(file: File) {
    const reader = new FileReader();
    reader.onload = async (e) => {
      const base64 = (e.target?.result as string).split(',')[1];
      setPreview(e.target?.result as string);
      setScanning(true);
      setError(null);
      setResult(null);
      try {
        const res = await fetch('/api/diy/scan', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ imageBase64: base64, sessionId: null }),
        });
        const data = await res.json();
        if (data.error) throw new Error(data.error);
        setResult(data.analysis);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setScanning(false);
      }
    };
    reader.readAsDataURL(file);
  }

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
          <span className="text-3xl">🔍</span> DIY Vision Scanner
        </h1>
        <p className="text-gray-500 mt-1">Point at any project, damage, or material — get an instant AI analysis</p>
      </div>

      {/* Upload Zone */}
      <div
        onClick={() => fileRef.current?.click()}
        className="border-2 border-dashed border-gray-300 rounded-2xl p-12 text-center cursor-pointer hover:border-blue-400 hover:bg-blue-50 transition-all mb-6"
      >
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          capture="environment"
          className="hidden"
          onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
        />
        {preview ? (
          <img src={preview} alt="Preview" className="max-h-64 mx-auto rounded-xl object-contain" />
        ) : (
          <div className="space-y-3">
            <div className="flex justify-center gap-4">
              <Camera className="w-10 h-10 text-gray-400" />
              <Upload className="w-10 h-10 text-gray-400" />
            </div>
            <p className="text-gray-600 font-medium">Tap to take a photo or upload an image</p>
            <p className="text-gray-400 text-sm">Works with any home improvement project, damage, or material</p>
          </div>
        )}
      </div>

      {scanning && (
        <div className="flex items-center justify-center gap-3 p-8 bg-blue-50 rounded-2xl mb-6">
          <Loader2 className="w-6 h-6 text-blue-500 animate-spin" />
          <span className="text-blue-700 font-medium">Nexus Brain analyzing your image...</span>
        </div>
      )}

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 mb-6">
          {error}
        </div>
      )}

      {result && (
        <div className="space-y-4">
          {result.what_i_see && (
            <div className="p-5 bg-gray-50 rounded-2xl">
              <h3 className="font-bold text-gray-900 mb-2 flex items-center gap-2"><Zap className="w-4 h-4 text-blue-500" /> Analysis</h3>
              <p className="text-gray-700">{result.what_i_see}</p>
            </div>
          )}

          {result.materials && result.materials.length > 0 && (
            <div className="p-5 bg-white border border-gray-200 rounded-2xl">
              <h3 className="font-bold text-gray-900 mb-3 flex items-center gap-2"><Package className="w-4 h-4 text-green-500" /> Materials Needed</h3>
              <div className="space-y-2">
                {result.materials.map((m, i) => (
                  <div key={i} className="flex justify-between items-center py-2 border-b border-gray-100 last:border-0">
                    <span className="text-gray-800">{m.item} <span className="text-gray-400 text-sm">× {m.quantity}</span></span>
                    <span className="text-green-700 font-medium">{m.estimated_cost}</span>
                  </div>
                ))}
              </div>
              {result.total_cost_range && (
                <div className="mt-3 pt-3 border-t border-gray-200 flex items-center gap-2">
                  <DollarSign className="w-4 h-4 text-blue-500" />
                  <span className="font-semibold text-gray-900">Total: {result.total_cost_range}</span>
                </div>
              )}
            </div>
          )}

          {result.instructions && result.instructions.length > 0 && (
            <div className="p-5 bg-white border border-gray-200 rounded-2xl">
              <h3 className="font-bold text-gray-900 mb-3 flex items-center gap-2"><CheckCircle className="w-4 h-4 text-blue-500" /> Instructions</h3>
              <ol className="space-y-2">
                {result.instructions.map((step, i) => (
                  <li key={i} className="flex gap-3">
                    <span className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-100 text-blue-700 text-xs font-bold flex items-center justify-center">{i + 1}</span>
                    <span className="text-gray-700 text-sm">{step}</span>
                  </li>
                ))}
              </ol>
            </div>
          )}

          {result.safety_notes && result.safety_notes.length > 0 && (
            <div className="p-5 bg-amber-50 border border-amber-200 rounded-2xl">
              <h3 className="font-bold text-amber-900 mb-2 flex items-center gap-2"><AlertTriangle className="w-4 h-4 text-amber-500" /> Safety Notes</h3>
              <ul className="space-y-1">
                {result.safety_notes.map((note, i) => (
                  <li key={i} className="text-amber-800 text-sm">• {note}</li>
                ))}
              </ul>
            </div>
          )}

          {result.difficulty && (
            <div className="flex items-center gap-2 text-sm text-gray-500">
              Difficulty: <span className="font-semibold text-gray-800">{result.difficulty}</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
