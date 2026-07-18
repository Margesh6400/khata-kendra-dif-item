import React, { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast, { Toaster } from 'react-hot-toast';
import {
  ArrowLeft,
  Upload,
  Plus,
  Trash2,
  Save,
  Eye,
  Pencil,
  LayoutGrid,
  Image as ImageIcon,
  Undo2,
  Redo2,
  Check,
  HelpCircle,
  ChevronDown,
  ChevronUp,
  Bold,
  Italic,
  AlignLeft,
  AlignCenter,
  AlignRight,
} from 'lucide-react';
import Navbar from '../components/Navbar';
import DesignEditorCanvas, { Selection } from '../components/challanDesign/DesignEditorCanvas';
import DesignStage from '../components/challanDesign/DesignStage';
import {
  ChallanDesign,
  ChallanRenderInput,
  DEFAULT_TEXT_STYLE,
  DesignChallanType,
  DesignConfig,
  ItemCategory,
  PlacedField,
  PrintOn,
  RowBand,
  TextStyle,
  emptyConfig,
} from '../utils/challanDesign/types';
import { BAND_COLUMN_FIELDS, FIELD_KEYS, bandFieldLabel, fieldKeyLabel } from '../utils/challanDesign/dataKeys';
import { paginate } from '../utils/challanDesign/paginate';
import {
  deleteDesign,
  listDesigns,
  saveDesign,
  uploadBackground,
} from '../utils/challanDesign/designStorage';

type Draft = Omit<ChallanDesign, 'id'> & { id?: string };

const CATEGORY_OPTIONS: Array<{ value: ItemCategory; label: string }> = [
  { value: 'shuttering', label: 'Shuttering Plates' },
  { value: 'jack', label: 'Iron Jacks' },
  { value: 'cuplock', label: 'Cuplock' },
  { value: 'other', label: 'Other' },
];

const CHALLAN_TYPE_OPTIONS: Array<{ value: DesignChallanType; label: string }> = [
  { value: 'both', label: 'Both (Udhar + Jama)' },
  { value: 'udhar', label: 'Udhar' },
  { value: 'jama', label: 'Jama' },
];

const uid = () => (crypto.randomUUID ? crypto.randomUUID() : String(Math.random()).slice(2));

const clamp01 = (v: number) => Math.min(1, Math.max(0, v));

function newDraft(): Draft {
  return {
    name: '',
    category: 'shuttering',
    challan_type: 'both',
    background_path: null,
    background_url: null,
    background_width: 0,
    background_height: 0,
    config: emptyConfig(),
    is_default: false,
  };
}

// Serialised form used to detect unsaved changes (excludes id/timestamps/urls).
function snapshot(d: Draft): string {
  return JSON.stringify({
    name: d.name,
    category: d.category,
    challan_type: d.challan_type,
    background_path: d.background_path,
    background_width: d.background_width,
    background_height: d.background_height,
    config: d.config,
    is_default: d.is_default,
  });
}

function sampleInput(draft: Draft): ChallanRenderInput {
  const preprinted = draft.config.band.labels === 'preprinted';
  const count = preprinted ? draft.config.band.rowsPerPage + 3 : 6; // +3 forces overflow preview
  const rows = Array.from({ length: count }).map((_, i) => {
    const qty = (i * 3 + 2) % 9;
    const borrowed = i % 2;
    return {
      name: `આઈટમ ${i + 1}`,
      qty,
      borrowed,
      total: qty + borrowed,
      note: i % 3 === 0 ? 'નોંધ' : '',
    };
  });
  return {
    challanType: draft.challan_type === 'jama' ? 'jama' : 'udhar',
    challanNumber: '1234',
    date: '18/07/2026',
    clientName: 'નમૂનો ગ્રાહક',
    clientNicName: 'ન-૧',
    site: 'સાઇટ ૧',
    phone: '9876543210',
    driverName: 'ડ્રાઈવર',
    mainNote: 'નમૂનો નોંધ',
    rows,
    grandTotal: rows.reduce((s, r) => s + r.total, 0),
  };
}

const HELP_STEPS: Array<{ title: string; body: string }> = [
  {
    title: 'Upload the background',
    body: 'Take a straight photo or scan of a BLANK challan paper and upload it. Everything you place is drawn on top of this image, so it becomes your design template.',
  },
  {
    title: 'Place value fields',
    body: 'Click a chip (Challan No., Date, Client Name…) to drop it on the canvas, then drag it over the matching blank space on the paper. Turn on "Show sample data" to see realistic values while placing. Arrow keys nudge the selected field precisely (hold Shift for bigger steps).',
  },
  {
    title: 'Set up item rows',
    body: 'Enable "Item rows" for the repeating item table. Drag the blue Row 1 line onto the first row of the paper, then the green Row 2 line onto the second row — the gap between them sets the spacing for all rows.',
  },
  {
    title: 'Add columns',
    body: 'Add a column for each value the table needs (Qty, Total…). Drag each amber vertical line over the matching printed column. "Pre-printed on paper" means item names are already printed (shuttering plates / jacks) — rows follow size order. "Print item names" makes the engine print the names too (cuplock / other) — add the Item / Size column.',
  },
  {
    title: 'Rows per page',
    body: 'Set how many rows the physical paper has. When a challan has more items than fit on one page, extra pages are generated automatically. Set the Grand Total field to "Print on: last page" so it only appears once.',
  },
  {
    title: 'Preview, save, set default',
    body: 'Preview renders a sample challan, including page overflow. Save the design, then tick "Default" — challan exports for that item + challan type will use it automatically.',
  },
];

type ConfirmState = {
  message: string;
  confirmLabel: string;
  onConfirm: () => void;
} | null;

const ChallanDesigner: React.FC = () => {
  const navigate = useNavigate();
  const [designs, setDesigns] = useState<ChallanDesign[]>([]);
  const [draft, setDraft] = useState<Draft>(newDraft());
  const [selection, setSelection] = useState<Selection>(null);
  const [mode, setMode] = useState<'edit' | 'preview'>('edit');
  const [previewPage, setPreviewPage] = useState(0);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [showSample, setShowSample] = useState(false);
  const [helpOpen, setHelpOpen] = useState(false);
  const [confirmState, setConfirmState] = useState<ConfirmState>(null);

  const canvasWrapRef = useRef<HTMLDivElement>(null);
  const [canvasWidth, setCanvasWidth] = useState(600);

  // --- unsaved-changes tracking ---------------------------------------------
  const savedSnapRef = useRef<string>(snapshot(newDraft()));
  const isDirty = snapshot(draft) !== savedSnapRef.current;

  // --- undo / redo (layout config only) -------------------------------------
  const historyRef = useRef<DesignConfig[]>([]);
  const redoRef = useRef<DesignConfig[]>([]);
  const [, setHistVersion] = useState(0); // re-render so undo/redo buttons update

  const firstLoadRef = useRef(true);

  useLayoutEffect(() => {
    const measure = () => {
      if (canvasWrapRef.current) {
        setCanvasWidth(Math.max(280, Math.min(canvasWrapRef.current.clientWidth, 760)));
      }
    };
    measure();
    window.addEventListener('resize', measure);
    return () => window.removeEventListener('resize', measure);
  }, []);

  const refresh = useCallback(async () => {
    try {
      const list = await listDesigns();
      setDesigns(list);
      if (firstLoadRef.current) {
        firstLoadRef.current = false;
        if (list.length === 0) setHelpOpen(true); // first visit: open the guide
      }
    } catch (err) {
      console.error(err);
      toast.error('Failed to load designs');
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  // Warn before closing/reloading the tab with unsaved changes.
  useEffect(() => {
    if (!isDirty) return;
    const onBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = '';
    };
    window.addEventListener('beforeunload', onBeforeUnload);
    return () => window.removeEventListener('beforeunload', onBeforeUnload);
  }, [isDirty]);

  const setConfig = (updater: (c: DesignConfig) => DesignConfig) => {
    historyRef.current.push(draft.config);
    if (historyRef.current.length > 100) historyRef.current.shift();
    redoRef.current = [];
    setHistVersion((v) => v + 1);
    setDraft((d) => ({ ...d, config: updater(d.config) }));
  };

  const undo = () => {
    const prev = historyRef.current.pop();
    if (!prev) return;
    redoRef.current.push(draft.config);
    setHistVersion((v) => v + 1);
    setDraft((d) => ({ ...d, config: prev }));
  };

  const redo = () => {
    const next = redoRef.current.pop();
    if (!next) return;
    historyRef.current.push(draft.config);
    setHistVersion((v) => v + 1);
    setDraft((d) => ({ ...d, config: next }));
  };

  const resetHistory = () => {
    historyRef.current = [];
    redoRef.current = [];
    setHistVersion((v) => v + 1);
  };

  const patchBand = (patch: Partial<RowBand>) =>
    setConfig((c) => ({ ...c, band: { ...c.band, ...patch } }));

  const loadDesignRaw = (d: ChallanDesign) => {
    const copy = { ...d, config: JSON.parse(JSON.stringify(d.config)) as DesignConfig };
    setDraft(copy);
    savedSnapRef.current = snapshot(copy);
    resetHistory();
    setSelection(null);
    setMode('edit');
    setPreviewPage(0);
  };

  const startNewRaw = () => {
    const d = newDraft();
    setDraft(d);
    savedSnapRef.current = snapshot(d);
    resetHistory();
    setSelection(null);
    setMode('edit');
  };

  // Runs the action immediately, or asks first when there are unsaved changes.
  const confirmIfDirty = (action: () => void) => {
    if (!isDirty) {
      action();
      return;
    }
    setConfirmState({
      message: 'This design has unsaved changes. Discard them?',
      confirmLabel: 'Discard changes',
      onConfirm: action,
    });
  };

  const handleUpload = async (file: File) => {
    setUploading(true);
    try {
      const bg = await uploadBackground(file);
      setDraft((d) => ({
        ...d,
        background_path: bg.path,
        background_url: bg.url,
        background_width: bg.width,
        background_height: bg.height,
      }));
      toast.success('Background uploaded');
    } catch (err) {
      console.error(err);
      toast.error('Upload failed');
    } finally {
      setUploading(false);
    }
  };

  const addField = (key: string) => {
    // Stagger drop positions so consecutive adds don't stack invisibly.
    const n = draft.config.fields.length;
    const field: PlacedField = {
      id: uid(),
      key,
      x: 0.3 + (n % 4) * 0.06,
      y: 0.06 + (Math.floor(n / 4) % 8) * 0.05,
      w: 0,
      style: { ...DEFAULT_TEXT_STYLE },
      printOn: key === 'grandTotal' ? 'last' : 'every',
      staticText: key === 'literal' ? 'Text' : undefined,
    };
    setConfig((c) => ({ ...c, fields: [...c.fields, field] }));
    setSelection({ type: 'field', id: field.id });
  };

  const updateField = (id: string, patch: Partial<PlacedField>) =>
    setConfig((c) => ({
      ...c,
      fields: c.fields.map((f) => (f.id === id ? { ...f, ...patch } : f)),
    }));

  const updateFieldStyle = (id: string, patch: Partial<TextStyle>) =>
    setConfig((c) => ({
      ...c,
      fields: c.fields.map((f) => (f.id === id ? { ...f, style: { ...f.style, ...patch } } : f)),
    }));

  const deleteField = (id: string) => {
    setConfig((c) => ({ ...c, fields: c.fields.filter((f) => f.id !== id) }));
    setSelection(null);
  };

  const addColumn = (field: (typeof BAND_COLUMN_FIELDS)[number]['field']) => {
    const col = { id: uid(), field, x: 0.4, w: 0.1, style: { ...DEFAULT_TEXT_STYLE, align: 'center' as const } };
    setConfig((c) => ({ ...c, band: { ...c.band, columns: [...c.band.columns, col] } }));
    setSelection({ type: 'column', id: col.id });
  };

  const updateColumn = (id: string, patch: Partial<(typeof draft.config.band.columns)[number]>) =>
    setConfig((c) => ({
      ...c,
      band: { ...c.band, columns: c.band.columns.map((col) => (col.id === id ? { ...col, ...patch } : col)) },
    }));

  const updateColumnStyle = (id: string, patch: Partial<TextStyle>) =>
    setConfig((c) => ({
      ...c,
      band: {
        ...c.band,
        columns: c.band.columns.map((col) => (col.id === id ? { ...col, style: { ...col.style, ...patch } } : col)),
      },
    }));

  const deleteColumn = (id: string) => {
    setConfig((c) => ({ ...c, band: { ...c.band, columns: c.band.columns.filter((col) => col.id !== id) } }));
    setSelection(null);
  };

  const handleSave = async () => {
    if (!draft.name.trim()) {
      toast.error('Give the design a name');
      return;
    }
    setSaving(true);
    try {
      const saved = await saveDesign({
        id: draft.id,
        name: draft.name.trim(),
        category: draft.category,
        challan_type: draft.challan_type,
        background_path: draft.background_path,
        background_width: draft.background_width,
        background_height: draft.background_height,
        config: draft.config,
        is_default: draft.is_default,
      });
      const next = { ...saved, config: JSON.parse(JSON.stringify(saved.config)) as DesignConfig };
      setDraft(next);
      savedSnapRef.current = snapshot(next);
      await refresh();
      toast.success('Design saved');
    } catch (err) {
      console.error(err);
      toast.error('Save failed');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = () => {
    if (!draft.id) {
      confirmIfDirty(startNewRaw);
      return;
    }
    setConfirmState({
      message: `Delete design "${draft.name}"? This cannot be undone.`,
      confirmLabel: 'Delete design',
      onConfirm: async () => {
        try {
          await deleteDesign(draft as ChallanDesign);
          await refresh();
          startNewRaw();
          toast.success('Design deleted');
        } catch (err) {
          console.error(err);
          toast.error('Delete failed');
        }
      },
    });
  };

  const selectedField =
    selection?.type === 'field' ? draft.config.fields.find((f) => f.id === selection.id) : undefined;
  const selectedColumn =
    selection?.type === 'column' ? draft.config.band.columns.find((c) => c.id === selection.id) : undefined;

  // Keyboard: undo/redo, arrow-nudge, delete. Skips when typing in an input.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement | null;
      if (t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.tagName === 'SELECT' || t.isContentEditable))
        return;
      const key = e.key.toLowerCase();
      if ((e.ctrlKey || e.metaKey) && key === 'z' && !e.shiftKey) {
        e.preventDefault();
        undo();
        return;
      }
      if ((e.ctrlKey || e.metaKey) && (key === 'y' || (key === 'z' && e.shiftKey))) {
        e.preventDefault();
        redo();
        return;
      }
      if (mode !== 'edit') return;
      const step = e.shiftKey ? 0.01 : 0.002;
      if (selectedField) {
        if (e.key === 'ArrowLeft') {
          e.preventDefault();
          updateField(selectedField.id, { x: clamp01(selectedField.x - step) });
        } else if (e.key === 'ArrowRight') {
          e.preventDefault();
          updateField(selectedField.id, { x: clamp01(selectedField.x + step) });
        } else if (e.key === 'ArrowUp') {
          e.preventDefault();
          updateField(selectedField.id, { y: clamp01(selectedField.y - step) });
        } else if (e.key === 'ArrowDown') {
          e.preventDefault();
          updateField(selectedField.id, { y: clamp01(selectedField.y + step) });
        } else if (e.key === 'Delete') {
          e.preventDefault();
          deleteField(selectedField.id);
        }
      } else if (selectedColumn) {
        if (e.key === 'ArrowLeft') {
          e.preventDefault();
          updateColumn(selectedColumn.id, { x: clamp01(selectedColumn.x - step) });
        } else if (e.key === 'ArrowRight') {
          e.preventDefault();
          updateColumn(selectedColumn.id, { x: clamp01(selectedColumn.x + step) });
        } else if (e.key === 'Delete') {
          e.preventDefault();
          deleteColumn(selectedColumn.id);
        }
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  });

  const previewPages = mode === 'preview' ? paginate(draft.config, sampleInput(draft)) : [];
  const safePreviewPage = Math.min(previewPage, Math.max(0, previewPages.length - 1));

  const steps = [
    { label: '1. Background', done: !!draft.background_url },
    { label: '2. Place fields', done: draft.config.fields.length > 0 },
    { label: '3. Item rows', done: draft.config.band.enabled && draft.config.band.columns.length > 0 },
    { label: '4. Save', done: !!draft.id && !isDirty },
  ];
  const currentStep = steps.findIndex((s) => !s.done);

  const canUndo = historyRef.current.length > 0;
  const canRedo = redoRef.current.length > 0;

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col lg:flex-row">
      <Toaster position="top-right" />
      <Navbar />

      {confirmState && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-sm w-full p-5 space-y-4">
            <p className="text-sm text-gray-800">{confirmState.message}</p>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setConfirmState(null)}
                className="px-3 py-2 text-sm font-semibold rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  const action = confirmState.onConfirm;
                  setConfirmState(null);
                  action();
                }}
                className="px-3 py-2 text-sm font-bold rounded-lg bg-red-600 text-white hover:bg-red-700"
              >
                {confirmState.confirmLabel}
              </button>
            </div>
          </div>
        </div>
      )}

      <main className="flex-1 w-full px-3 py-6 pb-24 sm:px-6 lg:px-8 lg:ml-64">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="flex items-center justify-between gap-3 border-b border-gray-200 pb-4 mb-3 flex-wrap">
            <div className="flex items-center gap-3">
              <button
                onClick={() => confirmIfDirty(() => navigate('/settings'))}
                className="p-2 rounded-lg hover:bg-gray-100 text-gray-600"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <div className="p-2.5 bg-blue-100 text-blue-600 rounded-xl">
                <LayoutGrid className="w-6 h-6" />
              </div>
              <div>
                <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Challan Design Studio</h1>
                <p className="text-xs text-gray-500">Configure how exported challans are laid out</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {isDirty && (
                <span className="px-2 py-1 text-[11px] font-bold rounded-md bg-amber-100 text-amber-700">
                  Unsaved
                </span>
              )}
              <button
                onClick={undo}
                disabled={!canUndo}
                title="Undo (Ctrl+Z)"
                className="p-2 rounded-lg border border-gray-300 bg-white text-gray-600 hover:bg-gray-50 disabled:opacity-40"
              >
                <Undo2 className="w-4 h-4" />
              </button>
              <button
                onClick={redo}
                disabled={!canRedo}
                title="Redo (Ctrl+Y)"
                className="p-2 rounded-lg border border-gray-300 bg-white text-gray-600 hover:bg-gray-50 disabled:opacity-40"
              >
                <Redo2 className="w-4 h-4" />
              </button>
              <button
                onClick={() => setMode(mode === 'edit' ? 'preview' : 'edit')}
                className="flex items-center gap-1.5 px-3 py-2 text-sm font-semibold rounded-lg border border-gray-300 bg-white hover:bg-gray-50"
              >
                {mode === 'edit' ? <Eye className="w-4 h-4" /> : <Pencil className="w-4 h-4" />}
                {mode === 'edit' ? 'Preview' : 'Edit'}
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex items-center gap-1.5 px-4 py-2 text-sm font-bold rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-60"
              >
                <Save className="w-4 h-4" />
                {saving ? 'Saving…' : 'Save'}
              </button>
            </div>
          </div>

          {/* Workflow steps + help toggle */}
          <div className="flex items-center justify-between gap-2 flex-wrap mb-3">
            <div className="flex items-center gap-1.5 flex-wrap">
              {steps.map((s, i) => (
                <span
                  key={s.label}
                  className={`flex items-center gap-1 px-2.5 py-1 text-[11px] font-semibold rounded-full border ${
                    s.done
                      ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                      : i === currentStep
                        ? 'border-blue-400 bg-blue-50 text-blue-700'
                        : 'border-gray-200 bg-white text-gray-400'
                  }`}
                >
                  {s.done && <Check className="w-3 h-3" />}
                  {s.label}
                </span>
              ))}
            </div>
            <button
              onClick={() => setHelpOpen((o) => !o)}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg border border-blue-200 bg-blue-50 text-blue-700 hover:bg-blue-100"
            >
              <HelpCircle className="w-3.5 h-3.5" />
              How it works
              {helpOpen ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            </button>
          </div>

          {/* Help panel */}
          {helpOpen && (
            <div className="bg-blue-50/60 border border-blue-200 rounded-xl p-4 mb-4">
              <ol className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-3">
                {HELP_STEPS.map((h, i) => (
                  <li key={h.title} className="flex gap-2.5">
                    <span className="flex-shrink-0 w-5 h-5 rounded-full bg-blue-600 text-white text-[11px] font-bold flex items-center justify-center mt-0.5">
                      {i + 1}
                    </span>
                    <div>
                      <p className="text-xs font-bold text-gray-900">{h.title}</p>
                      <p className="text-[11px] text-gray-600 leading-relaxed">{h.body}</p>
                    </div>
                  </li>
                ))}
              </ol>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_360px] gap-4">
            {/* Canvas column */}
            <div className="space-y-3">
              {/* Saved designs bar */}
              <div className="flex items-center gap-2 flex-wrap bg-white rounded-xl border border-gray-200 p-2">
                <button
                  onClick={() => confirmIfDirty(startNewRaw)}
                  className={`flex items-center gap-1 px-3 py-1.5 text-xs font-semibold rounded-lg border ${
                    !draft.id ? 'border-blue-500 bg-blue-50 text-blue-700' : 'border-gray-200 text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  <Plus className="w-3.5 h-3.5" /> New
                </button>
                {designs.map((d) => (
                  <button
                    key={d.id}
                    onClick={() => {
                      if (d.id === draft.id) return;
                      confirmIfDirty(() => loadDesignRaw(d));
                    }}
                    className={`px-3 py-1.5 text-xs font-semibold rounded-lg border ${
                      draft.id === d.id
                        ? 'border-blue-500 bg-blue-50 text-blue-700'
                        : 'border-gray-200 text-gray-600 hover:bg-gray-50'
                    }`}
                    title={`${d.category} · ${d.challan_type}`}
                  >
                    {d.name}
                    {d.is_default && <span className="ml-1 text-[10px] text-emerald-600">★</span>}
                  </button>
                ))}
              </div>

              {/* Canvas toolbar: sample toggle + guide legend */}
              {mode === 'edit' && draft.background_url && (
                <div className="flex items-center justify-between gap-2 flex-wrap bg-white rounded-xl border border-gray-200 px-3 py-2">
                  <label className="flex items-center gap-2 text-xs font-semibold text-gray-700 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={showSample}
                      onChange={(e) => setShowSample(e.target.checked)}
                    />
                    Show sample data
                  </label>
                  <div className="flex items-center gap-3 flex-wrap text-[11px] text-gray-500">
                    {draft.config.band.enabled && (
                      <>
                        <span className="flex items-center gap-1">
                          <span className="w-3 h-0.5 bg-blue-600 inline-block" /> Row 1 position
                        </span>
                        <span className="flex items-center gap-1">
                          <span className="w-3 h-0.5 bg-green-600 inline-block" /> Row 2 = spacing
                        </span>
                        <span className="flex items-center gap-1">
                          <span className="w-0.5 h-3 bg-amber-500 inline-block" /> Column position
                        </span>
                      </>
                    )}
                    <span className="hidden sm:inline">Drag to move · Arrows nudge (Shift = big) · Del removes</span>
                  </div>
                </div>
              )}

              <div
                ref={canvasWrapRef}
                className="bg-white rounded-xl border border-gray-200 p-2 overflow-auto flex justify-center"
              >
                {!draft.background_url && mode === 'edit' ? (
                  <label className="w-full aspect-[1/1.414] max-w-md flex flex-col items-center justify-center gap-3 border-2 border-dashed border-gray-300 rounded-xl cursor-pointer hover:bg-gray-50 text-gray-500">
                    <ImageIcon className="w-10 h-10" />
                    <span className="text-sm font-semibold">Upload background design (PNG/JPG)</span>
                    <span className="text-xs">A straight photo or scan of your blank challan paper</span>
                    <span className="text-[11px] text-blue-600 font-semibold">
                      Step 1 of 4 — fields are placed on top of this image
                    </span>
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => e.target.files?.[0] && handleUpload(e.target.files[0])}
                    />
                  </label>
                ) : mode === 'edit' ? (
                  <DesignEditorCanvas
                    backgroundUrl={draft.background_url}
                    naturalWidth={draft.background_width}
                    naturalHeight={draft.background_height}
                    config={draft.config}
                    width={canvasWidth}
                    selection={selection}
                    onSelect={setSelection}
                    onFieldMove={(id, x, y) => updateField(id, { x, y })}
                    onBandChange={patchBand}
                    onColumnMove={(id, x) => updateColumn(id, { x })}
                    sampleInput={showSample ? sampleInput(draft) : null}
                  />
                ) : (
                  <div className="space-y-2">
                    {previewPages.length > 1 && (
                      <div className="flex items-center justify-center gap-2 text-sm">
                        <button
                          onClick={() => setPreviewPage((p) => Math.max(0, p - 1))}
                          className="px-2 py-1 rounded border border-gray-300"
                          disabled={safePreviewPage === 0}
                        >
                          ‹
                        </button>
                        <span className="font-semibold text-gray-600">
                          Page {safePreviewPage + 1} / {previewPages.length}
                        </span>
                        <button
                          onClick={() => setPreviewPage((p) => Math.min(previewPages.length - 1, p + 1))}
                          className="px-2 py-1 rounded border border-gray-300"
                          disabled={safePreviewPage >= previewPages.length - 1}
                        >
                          ›
                        </button>
                      </div>
                    )}
                    <p className="text-center text-[11px] text-gray-400">
                      Preview uses sample data — extra rows are added to demonstrate page overflow.
                    </p>
                    {previewPages[safePreviewPage] && (
                      <DesignStage
                        backgroundUrl={draft.background_url}
                        naturalWidth={draft.background_width}
                        naturalHeight={draft.background_height}
                        page={previewPages[safePreviewPage]}
                        width={canvasWidth}
                      />
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Inspector column */}
            <div className="space-y-4">
              {/* Design meta */}
              <section className="bg-white rounded-xl border border-gray-200 p-4 space-y-3">
                <h3 className="font-bold text-gray-900 text-sm">Design</h3>
                <input
                  value={draft.name}
                  onChange={(e) => setDraft((d) => ({ ...d, name: e.target.value }))}
                  placeholder="Design name"
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg"
                />
                <div className="grid grid-cols-2 gap-2">
                  <label className="text-xs font-semibold text-gray-600">
                    Item type
                    <select
                      value={draft.category}
                      onChange={(e) => setDraft((d) => ({ ...d, category: e.target.value as ItemCategory }))}
                      className="mt-1 w-full px-2 py-2 text-sm border border-gray-300 rounded-lg"
                    >
                      {CATEGORY_OPTIONS.map((o) => (
                        <option key={o.value} value={o.value}>
                          {o.label}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className="text-xs font-semibold text-gray-600">
                    Challan type
                    <select
                      value={draft.challan_type}
                      onChange={(e) => setDraft((d) => ({ ...d, challan_type: e.target.value as DesignChallanType }))}
                      className="mt-1 w-full px-2 py-2 text-sm border border-gray-300 rounded-lg"
                    >
                      {CHALLAN_TYPE_OPTIONS.map((o) => (
                        <option key={o.value} value={o.value}>
                          {o.label}
                        </option>
                      ))}
                    </select>
                  </label>
                </div>
                <label className="flex items-center gap-2 text-sm text-gray-700">
                  <input
                    type="checkbox"
                    checked={draft.is_default}
                    onChange={(e) => setDraft((d) => ({ ...d, is_default: e.target.checked }))}
                  />
                  Default for this item + challan type
                </label>
                <p className="text-[11px] text-gray-500">
                  Challan exports automatically pick the default design matching the challan's item and type.
                </p>
                <div className="flex items-center gap-2 pt-1">
                  <label className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-lg border border-gray-300 cursor-pointer hover:bg-gray-50">
                    <Upload className="w-3.5 h-3.5" />
                    {uploading ? 'Uploading…' : draft.background_url ? 'Replace background' : 'Upload background'}
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => e.target.files?.[0] && handleUpload(e.target.files[0])}
                    />
                  </label>
                  <button
                    onClick={handleDelete}
                    className="p-2 rounded-lg border border-red-200 text-red-600 hover:bg-red-50"
                    title="Delete design"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </section>

              {/* Field palette */}
              <section className="bg-white rounded-xl border border-gray-200 p-4 space-y-2">
                <h3 className="font-bold text-gray-900 text-sm">Add value fields</h3>
                <p className="text-[11px] text-gray-500">
                  Click to drop on the canvas, then drag into place over the paper.
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {FIELD_KEYS.map((k) => (
                    <button
                      key={k.key}
                      onClick={() => addField(k.key)}
                      className="px-2 py-1 text-[11px] font-semibold rounded-md border border-gray-200 text-gray-700 hover:bg-blue-50 hover:border-blue-300"
                    >
                      + {k.label}
                    </button>
                  ))}
                </div>
              </section>

              {/* Placed fields list */}
              {draft.config.fields.length > 0 && (
                <section className="bg-white rounded-xl border border-gray-200 p-4 space-y-2">
                  <h3 className="font-bold text-gray-900 text-sm">
                    Placed fields ({draft.config.fields.length})
                  </h3>
                  <div className="space-y-1">
                    {draft.config.fields.map((f) => {
                      const isSel = selection?.type === 'field' && selection.id === f.id;
                      return (
                        <div
                          key={f.id}
                          onClick={() => setSelection({ type: 'field', id: f.id })}
                          className={`flex items-center justify-between gap-2 px-2.5 py-1.5 rounded-lg border cursor-pointer text-xs ${
                            isSel
                              ? 'border-blue-400 bg-blue-50 text-blue-800'
                              : 'border-gray-100 text-gray-700 hover:bg-gray-50'
                          }`}
                        >
                          <span className="font-semibold truncate">
                            {f.key === 'literal' ? `"${f.staticText || 'Text'}"` : fieldKeyLabel(f.key)}
                          </span>
                          <span className="flex items-center gap-1.5 flex-shrink-0">
                            {f.printOn !== 'every' && (
                              <span className="px-1.5 py-0.5 text-[10px] font-bold rounded bg-gray-100 text-gray-500">
                                {f.printOn === 'first' ? 'first page' : 'last page'}
                              </span>
                            )}
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                deleteField(f.id);
                              }}
                              className="text-gray-400 hover:text-red-600"
                              title="Remove field"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </section>
              )}

              {/* Selected field editor */}
              {selectedField && (
                <section className="bg-white rounded-xl border border-blue-200 p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="font-bold text-blue-700 text-sm">{fieldKeyLabel(selectedField.key)}</h3>
                    <button onClick={() => deleteField(selectedField.id)} className="text-red-500 hover:text-red-700">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                  {selectedField.key === 'literal' && (
                    <input
                      value={selectedField.staticText || ''}
                      onChange={(e) => updateField(selectedField.id, { staticText: e.target.value })}
                      placeholder="Static text"
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg"
                    />
                  )}
                  <TextStyleControls
                    style={selectedField.style}
                    naturalHeight={draft.background_height}
                    onChange={(p) => updateFieldStyle(selectedField.id, p)}
                  />
                  <label className="block text-xs font-semibold text-gray-600">
                    Box width (0 = auto): {Math.round(selectedField.w * 100)}%
                    <input
                      type="range"
                      min={0}
                      max={100}
                      value={Math.round(selectedField.w * 100)}
                      onChange={(e) => updateField(selectedField.id, { w: Number(e.target.value) / 100 })}
                      className="w-full accent-blue-600"
                    />
                  </label>
                  <label className="block text-xs font-semibold text-gray-600">
                    Print on
                    <select
                      value={selectedField.printOn}
                      onChange={(e) => updateField(selectedField.id, { printOn: e.target.value as PrintOn })}
                      className="mt-1 w-full px-2 py-2 text-sm border border-gray-300 rounded-lg"
                    >
                      <option value="every">Every page</option>
                      <option value="first">First page only</option>
                      <option value="last">Last page only</option>
                    </select>
                  </label>
                  <p className="text-[11px] text-gray-500">
                    Controls which pages show this field when items overflow to extra pages.
                  </p>
                </section>
              )}

              {/* Row band */}
              <section className="bg-white rounded-xl border border-gray-200 p-4 space-y-3">
                <label className="flex items-center justify-between cursor-pointer">
                  <span className="font-bold text-gray-900 text-sm">Item rows (repeater)</span>
                  <input
                    type="checkbox"
                    checked={draft.config.band.enabled}
                    onChange={(e) => patchBand({ enabled: e.target.checked })}
                  />
                </label>
                {!draft.config.band.enabled && (
                  <p className="text-[11px] text-gray-500">
                    Enable to print the repeating item table (quantities, totals) on the challan.
                  </p>
                )}

                {draft.config.band.enabled && (
                  <>
                    <div className="grid grid-cols-2 gap-2">
                      <label className="text-xs font-semibold text-gray-600">
                        Row labels
                        <select
                          value={draft.config.band.labels}
                          onChange={(e) => patchBand({ labels: e.target.value as RowBand['labels'] })}
                          className="mt-1 w-full px-2 py-2 text-sm border border-gray-300 rounded-lg"
                        >
                          <option value="preprinted">Pre-printed on paper</option>
                          <option value="dynamic">Print item names</option>
                        </select>
                      </label>
                      <label className="text-xs font-semibold text-gray-600">
                        Rows / page
                        <input
                          type="number"
                          min={1}
                          value={draft.config.band.rowsPerPage}
                          onChange={(e) => patchBand({ rowsPerPage: Math.max(1, Number(e.target.value) || 1) })}
                          className="mt-1 w-full px-2 py-2 text-sm border border-gray-300 rounded-lg"
                        />
                      </label>
                      <label className="text-xs font-semibold text-gray-600">
                        Row spacing (% of page height)
                        <input
                          type="number"
                          min={0.5}
                          max={100}
                          step={0.1}
                          value={Number((draft.config.band.rowHeight * 100).toFixed(1))}
                          onChange={(e) => {
                            const v = Number(e.target.value);
                            if (!Number.isFinite(v)) return;
                            patchBand({ rowHeight: Math.min(1, Math.max(0.005, v / 100)) });
                          }}
                          className="mt-1 w-full px-2 py-2 text-sm border border-gray-300 rounded-lg"
                        />
                      </label>
                      <label className="text-xs font-semibold text-gray-600">
                        First row position (% from top)
                        <input
                          type="number"
                          min={0}
                          max={100}
                          step={0.1}
                          value={Number((draft.config.band.firstRowY * 100).toFixed(1))}
                          onChange={(e) => {
                            const v = Number(e.target.value);
                            if (!Number.isFinite(v)) return;
                            patchBand({ firstRowY: Math.min(1, Math.max(0, v / 100)) });
                          }}
                          className="mt-1 w-full px-2 py-2 text-sm border border-gray-300 rounded-lg"
                        />
                      </label>
                    </div>
                    <p className="text-[11px] text-gray-500 leading-relaxed">
                      {draft.config.band.labels === 'preprinted'
                        ? 'Item names are already printed on the paper (e.g. plate sizes). Rows follow the size order — only numbers are printed.'
                        : 'The engine prints item names too — add the "Item / Size" column below and give it enough width.'}
                    </p>
                    <p className="text-[11px] text-gray-500 leading-relaxed">
                      Drag the <span className="text-blue-600 font-semibold">blue (Row 1)</span> and{' '}
                      <span className="text-green-600 font-semibold">green (Row 2)</span> guides on the canvas — or type
                      exact values above.
                    </p>

                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold text-gray-600">Add columns</span>
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {BAND_COLUMN_FIELDS.filter(
                          (f) => f.field !== 'name' || draft.config.band.labels === 'dynamic',
                        ).map((f) => (
                          <button
                            key={f.field}
                            onClick={() => addColumn(f.field)}
                            className="px-2 py-1 text-[11px] font-semibold rounded-md border border-gray-200 text-gray-700 hover:bg-amber-50 hover:border-amber-300"
                          >
                            + {f.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Existing columns list */}
                    {draft.config.band.columns.length > 0 && (
                      <div className="space-y-1">
                        <span className="text-xs font-semibold text-gray-600">
                          Columns ({draft.config.band.columns.length})
                        </span>
                        {draft.config.band.columns.map((col) => {
                          const isSel = selection?.type === 'column' && selection.id === col.id;
                          return (
                            <div
                              key={col.id}
                              onClick={() => setSelection({ type: 'column', id: col.id })}
                              className={`flex items-center justify-between gap-2 px-2.5 py-1.5 rounded-lg border cursor-pointer text-xs ${
                                isSel
                                  ? 'border-amber-400 bg-amber-50 text-amber-800'
                                  : 'border-gray-100 text-gray-700 hover:bg-gray-50'
                              }`}
                            >
                              <span className="font-semibold">{bandFieldLabel(col.field)}</span>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  deleteColumn(col.id);
                                }}
                                className="text-gray-400 hover:text-red-600"
                                title="Remove column"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          );
                        })}
                      </div>
                    )}

                    {selectedColumn && (
                      <div className="border border-amber-200 rounded-lg p-3 space-y-3 bg-amber-50/40">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-amber-700 text-sm">{bandFieldLabel(selectedColumn.field)} column</span>
                          <button
                            onClick={() => deleteColumn(selectedColumn.id)}
                            className="text-red-500 hover:text-red-700"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                        <p className="text-[11px] text-gray-500">
                          Drag the amber line on the canvas (or use ←/→ keys) to set the column's horizontal position.
                        </p>
                        <label className="block text-xs font-semibold text-gray-600">
                          Column width: {Math.round(selectedColumn.w * 100)}%
                          <input
                            type="range"
                            min={2}
                            max={100}
                            value={Math.round(selectedColumn.w * 100)}
                            onChange={(e) => updateColumn(selectedColumn.id, { w: Number(e.target.value) / 100 })}
                            className="w-full accent-amber-600"
                          />
                        </label>
                        <TextStyleControls
                          style={selectedColumn.style}
                          naturalHeight={draft.background_height}
                          onChange={(p) => updateColumnStyle(selectedColumn.id, p)}
                        />
                      </div>
                    )}
                  </>
                )}
              </section>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

// Shared font/color/align controls for a TextStyle.
const TextStyleControls: React.FC<{
  style: TextStyle;
  naturalHeight?: number;
  onChange: (patch: Partial<TextStyle>) => void;
}> = ({ style, naturalHeight, onChange }) => (
  <div className="space-y-2">
    <label className="block text-xs font-semibold text-gray-600">
      Font size:{' '}
      {naturalHeight ? `≈ ${Math.round(style.fontSize * naturalHeight)}px on template` : Math.round(style.fontSize * 1000)}
      <input
        type="range"
        min={6}
        max={70}
        value={Math.round(style.fontSize * 1000)}
        onChange={(e) => onChange({ fontSize: Number(e.target.value) / 1000 })}
        className="w-full accent-blue-600"
      />
    </label>
    <div className="flex items-center gap-2">
      <button
        onClick={() => onChange({ bold: !style.bold })}
        title="Bold"
        className={`p-1.5 rounded border ${
          style.bold ? 'bg-blue-600 text-white border-blue-600' : 'border-gray-300 text-gray-700'
        }`}
      >
        <Bold className="w-3.5 h-3.5" />
      </button>
      <button
        onClick={() => onChange({ italic: !style.italic })}
        title="Italic"
        className={`p-1.5 rounded border ${
          style.italic ? 'bg-blue-600 text-white border-blue-600' : 'border-gray-300 text-gray-700'
        }`}
      >
        <Italic className="w-3.5 h-3.5" />
      </button>
      <div className="flex rounded border border-gray-300 overflow-hidden">
        {(
          [
            { value: 'left', title: 'Align left', Icon: AlignLeft },
            { value: 'center', title: 'Align center', Icon: AlignCenter },
            { value: 'right', title: 'Align right', Icon: AlignRight },
          ] as const
        ).map(({ value, title, Icon }) => (
          <button
            key={value}
            onClick={() => onChange({ align: value })}
            title={title}
            className={`p-1.5 ${style.align === value ? 'bg-blue-600 text-white' : 'text-gray-600'}`}
          >
            <Icon className="w-3.5 h-3.5" />
          </button>
        ))}
      </div>
      <input
        type="color"
        value={style.fill}
        onChange={(e) => onChange({ fill: e.target.value })}
        className="w-8 h-8 rounded border border-gray-300 cursor-pointer"
        title="Text color"
      />
    </div>
  </div>
);

export default ChallanDesigner;
