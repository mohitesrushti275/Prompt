import { useState, useRef, useEffect } from 'react';
import type { ChangeEvent } from 'react';
import { Copy, Wand2, Check, RefreshCw, Loader2, FileText, ChevronLeft, ChevronRight, X, Download, LayoutGrid } from 'lucide-react';
import './index.css';

interface AnalysisResult {
  prompts: Record<string, string>;
}

interface PromptHistoryItem {
  id: string;
  prompt: string;
  timestamp: number;
  wordCount: number;
  charCount: number;
}

interface GalleryItem {
  id: number;
  title: string;
  desc: string;
  category: string;
}

const STORAGE_KEY = 'prompt_history';
const ITEMS_PER_PAGE = 4;

function loadHistory(): PromptHistoryItem[] {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
  } catch {
    return [];
  }
}

function saveHistory(history: PromptHistoryItem[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(history));
}

// ── Recent Prompts Section ────────────────────────────────────────────────────
function RecentPrompts({ history, onSelect }: { history: PromptHistoryItem[]; onSelect: (p: string) => void }) {
  const [page, setPage] = useState(1);

  if (history.length === 0) return null;

  const totalPages = Math.ceil(history.length / ITEMS_PER_PAGE);
  const start = (page - 1) * ITEMS_PER_PAGE;
  const items = history.slice(start, start + ITEMS_PER_PAGE);

  return (
    <div style={{ width: '100%', marginTop: '64px' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px', marginBottom: '28px' }}>
        <FileText size={14} color="var(--text-secondary)" />
        <span style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--text-secondary)' }}>
          Recent Prompts
        </span>
        <span style={{
          display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
          width: '22px', height: '22px', borderRadius: '50%',
          background: 'var(--surface)', border: '1px solid var(--border)',
          fontSize: '11px', fontWeight: 600, color: 'var(--text-secondary)'
        }}>
          {history.length}
        </span>
      </div>

      {/* Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1px', background: 'var(--border)', border: '1px solid var(--border)', borderRadius: '12px', overflow: 'hidden' }}>
        {items.map((item) => (
          <div
            key={item.id}
            onClick={() => onSelect(item.prompt)}
            style={{
              background: 'var(--surface)',
              padding: '20px 24px 24px',
              cursor: 'pointer',
              transition: 'background 0.15s',
            }}
            onMouseEnter={e => (e.currentTarget.style.background = 'var(--surface-hover)')}
            onMouseLeave={e => (e.currentTarget.style.background = 'var(--surface)')}
          >
            {/* Meta row */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '12px' }}>
              <FileText size={13} color="var(--text-secondary)" />
              <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                {item.wordCount} words
              </span>
              <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                {item.charCount} chars
              </span>
            </div>
            {/* Prompt preview */}
            <p style={{
              fontSize: '13px',
              color: 'var(--text-primary)',
              lineHeight: '1.65',
              display: '-webkit-box',
              WebkitLineClamp: 6,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden',
              fontFamily: 'var(--font-body)',
            }}>
              {item.prompt}
            </p>
          </div>
        ))}
        {/* Fill empty cells if odd number */}
        {items.length % 2 !== 0 && (
          <div style={{ background: 'var(--surface)' }} />
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', marginTop: '24px' }}>
          <button
            onClick={() => setPage(p => Math.max(1, p - 1))}
            disabled={page === 1}
            style={{ display: 'flex', alignItems: 'center', gap: '4px', padding: '6px 14px', background: 'transparent', border: '1px solid var(--border)', borderRadius: '6px', color: page === 1 ? 'var(--text-secondary)' : 'var(--text-primary)', fontSize: '13px', cursor: page === 1 ? 'not-allowed' : 'pointer', opacity: page === 1 ? 0.4 : 1 }}
          >
            <ChevronLeft size={14} /> Previous
          </button>
          {Array.from({ length: totalPages }, (_, i) => i + 1).map(n => (
            <button
              key={n}
              onClick={() => setPage(n)}
              style={{ width: '32px', height: '32px', borderRadius: '6px', background: n === page ? 'var(--text-primary)' : 'transparent', color: n === page ? 'var(--bg)' : 'var(--text-primary)', border: '1px solid var(--border)', fontSize: '13px', cursor: 'pointer', fontWeight: n === page ? 700 : 400 }}
            >
              {n}
            </button>
          ))}
          <button
            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            style={{ display: 'flex', alignItems: 'center', gap: '4px', padding: '6px 14px', background: 'transparent', border: '1px solid var(--border)', borderRadius: '6px', color: page === totalPages ? 'var(--text-secondary)' : 'var(--text-primary)', fontSize: '13px', cursor: page === totalPages ? 'not-allowed' : 'pointer', opacity: page === totalPages ? 0.4 : 1 }}
          >
            Next <ChevronRight size={14} />
          </button>
        </div>
      )}
    </div>
  );
}

// ── Sidebar Component ─────────────────────────────────────────────────────────
function Sidebar({ activeTab, onTabSelect }: { activeTab: string; onTabSelect: (tab: string) => void }) {
  const navItems = [
    { label: 'Home', count: 0 },
    { label: 'Announcements', count: 10 },
    { label: 'Backgrounds', count: 33 },
    { label: 'Borders', count: 12 },
    { label: 'Calls to Action', count: 34 },
    { label: 'Clients', count: 16 },
    { label: 'Comparisons', count: 6 },
    { label: 'Docks', count: 6 },
    { label: 'Features', count: 36 },
    { label: 'Footers', count: 14 },
    { label: 'Heroes', count: 73 },
    { label: 'Hooks', count: 31 },
    { label: 'Images', count: 26 },
    { label: 'Maps', count: 2 },
    { label: 'Navigation Menus', count: 11 },
    { label: 'Pricing Sections', count: 17 },
    { label: 'Scroll Areas', count: 24 },
    { label: 'Shaders', count: 15 },
  ];

  return (
    <nav className="sidebar">
      <div className="nav-list">
        {navItems.map((item) => (
          <div 
            key={item.label} 
            className={`nav-item ${activeTab === item.label ? 'active' : ''}`}
            onClick={() => onTabSelect(item.label)}
          >
            <span className="nav-item-label">{item.label}</span>
            {item.count > 0 && <span className="nav-item-count">{item.count}</span>}
          </div>
        ))}
      </div>
    </nav>
  );
}

// ── Gallery Components ────────────────────────────────────────────────────────
const BorderPreview = ({ type }: { type: string }) => {
  if (type === 'Shine Border') {
    return (
      <div style={{ width: '100%', height: '100%', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--surface)', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: '-100%', left: '-100%', width: '300%', height: '300%', background: 'conic-gradient(from 0deg, transparent 0 320deg, var(--text-primary) 360deg)', animation: 'spin 4s linear infinite', opacity: 0.3 }} />
        <div style={{ position: 'absolute', inset: '2px', background: 'var(--bg)', borderRadius: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px', color: 'var(--text-secondary)' }}>
          Shine
        </div>
      </div>
    );
  }
  if (type === 'Border Beam') {
    return (
      <div style={{ width: '100%', height: '100%', borderRadius: '8px', padding: '2px', background: 'linear-gradient(90deg, var(--border), var(--text-secondary), var(--border))', position: 'relative', overflow: 'hidden' }}>
        <div style={{ width: '100%', height: '100%', background: 'var(--bg)', borderRadius: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px', color: 'var(--text-secondary)' }}>
          Beam
        </div>
      </div>
    );
  }
  return (
    <div style={{ 
      width: '100%', height: '100%', 
      background: 'var(--surface)', 
      borderRadius: '8px', 
      border: '1px solid var(--border)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      color: 'var(--text-secondary)', fontSize: '10px'
    }}>
      {type}
    </div>
  );
};

function GalleryCard({ title, desc, onClick, children }: { title: string; desc: string; onClick: () => void; children: React.ReactNode }) {
  return (
    <div className="gallery-card" onClick={onClick}>
      <div className="gallery-card-preview">
        {children}
      </div>
      <div className="gallery-card-info">
        <h3 className="gallery-card-title">{title}</h3>
        <p className="gallery-card-desc">{desc}</p>
      </div>
    </div>
  );
}

function ComponentModal({ item, onClose }: { item: GalleryItem; onClose: () => void }) {
  const jsonContent = JSON.stringify({
    component: item.title,
    category: item.category,
    description: item.desc,
    timestamp: new Date().toISOString(),
    config: {
      theme: "dark",
      borderRadius: "12px",
      elevation: "high"
    }
  }, null, 2);

  const handleCopy = () => {
    navigator.clipboard.writeText(jsonContent);
  };

  const handleDownload = () => {
    const blob = new Blob([jsonContent], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${item.title.toLowerCase().replace(/\s+/g, '_')}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [onClose]);

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        <header className="modal-header">
          <h2 className="modal-title">{item.title}</h2>
          <button className="modal-close-btn" onClick={onClose}><X size={20} /></button>
        </header>

        <div className="modal-body">
          <div className="modal-preview-area">
            <div style={{ width: '280px', height: '180px' }}>
              {item.category === 'Borders' ? (
                <BorderPreview type={item.title} />
              ) : (
                <div style={{ 
                  width: '100%', height: '100%', 
                  background: 'linear-gradient(45deg, #111, #1a1a1c)', 
                  borderRadius: '12px', 
                  border: '1px solid var(--border)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: 'var(--text-secondary)', fontSize: '14px'
                }}>
                  {item.category} Preview
                </div>
              )}
            </div>
          </div>

          <div className="modal-details-area">
            <div className="modal-meta-section">
              <span className="badge" style={{ marginBottom: '12px' }}>{item.category} / Component</span>
              <p className="modal-desc">{item.desc}</p>
            </div>

            <div className="modal-actions">
              <button className="modal-action-btn primary" onClick={handleCopy}>
                <Copy size={16} /> Copy JSON
              </button>
              <button className="modal-action-btn outline" onClick={handleDownload}>
                <Download size={16} /> Download JSON
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function Gallery({ category, onSelectItem }: { category: string; onSelectItem: (item: GalleryItem) => void }) {
  // Real details for Borders, mock for others
  const borderItems = [
    { title: 'Shine Border', desc: 'A soft, rotating light effect that tracks the container edge.' },
    { title: 'Border Beam', desc: 'A high-speed light beam that orbits the component border.' },
    { title: 'Neon Glow', desc: 'An outer-glow border that pulses with a vibrant breathing effect.' },
    { title: 'Glass Border', desc: 'A semi-transparent border with a frosted glass texture.' },
    { title: 'Thin Stroke', desc: 'An ultra-refined 1px stroke for minimalist interfaces.' },
    { title: 'Dashed Outline', desc: 'A stylistic dashed border for drop zones and selection states.' },
    { title: 'Gradient Edge', desc: 'Multi-color gradient borders with customizable angles.' },
    { title: 'Double Border', desc: 'A classic nested border style for card emphasis.' },
  ];

  const items: GalleryItem[] = category === 'Borders' 
    ? borderItems.map((item, i) => ({ ...item, id: i, category }))
    : Array.from({ length: 12 }).map((_, i) => ({
      id: i,
      title: `${category} Component ${i + 1}`,
      desc: `A premium ${category.toLowerCase()} element with professional styling.`,
      category
    }));

  return (
    <div className="gallery-container">
      <header className="gallery-header">
        <span className="badge" style={{ marginBottom: '16px' }}>Library / {category}</span>
        <h1 style={{ fontSize: '32px', marginBottom: '8px', color: 'var(--text-primary)' }}>{category}</h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '14px', maxWidth: '600px' }}>
          Explore our collection of high-quality {category.toLowerCase()} components, designed to enhance your UI with premium effects and layouts.
        </p>
      </header>

      <div className="gallery-grid">
        {items.map(item => (
          <GalleryCard 
            key={item.id} 
            title={item.title} 
            desc={item.desc}
            onClick={() => onSelectItem(item)}
          >
            {category === 'Borders' ? (
              <div style={{ width: '120px', height: '80px' }}>
                <BorderPreview type={item.title} />
              </div>
            ) : (
              <div style={{ 
                width: '100%', height: '100%', 
                background: 'linear-gradient(45deg, #111, #1a1a1c)', 
                borderRadius: '8px', 
                border: '1px solid var(--border)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: 'var(--text-secondary)', fontSize: '12px'
              }}>
                {category}
              </div>
            )}
          </GalleryCard>
        ))}
      </div>
    </div>
  );
}

// ── Main App ──────────────────────────────────────────────────────────────────
export default function App() {
  const [activeTab, setActiveTab] = useState('Home');
  const [selectedItem, setSelectedItem] = useState<GalleryItem | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  const [isProcessing, setIsProcessing] = useState(false);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [errorMsg, setErrorMsg] = useState('');

  const [copied, setCopied] = useState(false);
  const [history, setHistory] = useState<PromptHistoryItem[]>(loadHistory);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Keep localStorage in sync whenever history changes
  useEffect(() => {
    saveHistory(history);
  }, [history]);

  const addToHistory = (prompt: string) => {
    const item: PromptHistoryItem = {
      id: Date.now().toString(),
      prompt,
      timestamp: Date.now(),
      wordCount: prompt.trim().split(/\s+/).length,
      charCount: prompt.length,
    };
    setHistory(prev => [item, ...prev].slice(0, 50)); // keep max 50
  };

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) handleFileSelected(e.target.files[0]);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const droppedFile = e.dataTransfer.files?.[0];
    if (droppedFile && droppedFile.type.startsWith('image/')) handleFileSelected(droppedFile);
  };

  const handleFileSelected = (selectedFile: File) => {
    setFile(selectedFile);
    setPreviewUrl(URL.createObjectURL(selectedFile));
    setResult(null);
    setErrorMsg('');
  };

  const resetAll = () => {
    setFile(null);
    setPreviewUrl(null);
    setResult(null);
    setErrorMsg('');
  };

  const handleGenerate = async () => {
    if (!file) return;
    setIsProcessing(true);
    setErrorMsg('');
    setResult(null);

    try {
      const formData = new FormData();
      formData.append('image', file);

      const res = await fetch('http://localhost:3000/api/analyze', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || `Server error: ${res.status}`);

      setResult(data);
      const promptText = data?.prompts?.['DALL-E 3'];
      if (promptText) addToHistory(promptText);
    } catch (err: any) {
      setErrorMsg(err.message || 'An unexpected error occurred.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCopy = () => {
    const text = result?.prompts?.['DALL-E 3'];
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const promptText = result?.prompts?.['DALL-E 3'] || '';

  return (
    <div style={{ display: 'flex' }}>
      <Sidebar activeTab={activeTab} onTabSelect={setActiveTab} />
      <div className="main-content-wrapper">
        <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '64px 24px', display: 'flex', flexDirection: 'column', alignItems: activeTab === 'Home' ? 'center' : 'stretch' }}>

          {activeTab === 'Home' ? (
            <>
              {/* Badge */}
              <div className="badge">• NO EMAIL REQUIRED. FREE DAILY 3 IMAGE TO PROMPT</div>

              <h1 style={{ fontSize: '42px', textAlign: 'center', marginBottom: '20px' }}>
                Image to Prompt - AI Image<br />Analyzer &amp; Prompt Generator
              </h1>

              <p style={{ color: 'var(--text-secondary)', textAlign: 'center', maxWidth: '780px', fontSize: '14px', lineHeight: '1.6', marginBottom: '56px' }}>
                Use our AI image Analyzer and Image to Prompt tool to instantly analyze any image and generate highly accurate and precise AI text prompts. Perfect for reverse engineering images, discovering AI prompt ideas, and optimizing your creative workflow.<br /><br />
                Get most precise and accurate text prompt for your image.<br />Just upload your image and get your prompt.
              </p>

              {/* Main Dual Workspace */}
              <div className="workspace-card" style={{ width: '100%', display: 'flex', gap: '24px' }}>

                {/* Left Column: Upload */}
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                  <div className="step-header">
                    <span className="step-number">01</span>
                    Upload Photo
                  </div>

                  <input type="file" ref={fileInputRef} style={{ display: 'none' }} accept="image/*" onChange={handleFileChange} />

                  <div
                    className={`zone-container ${!previewUrl ? 'dashed' : ''}`}
                    style={{ borderColor: isDragging ? 'var(--text-primary)' : 'var(--border)', cursor: previewUrl ? 'default' : 'pointer' }}
                    onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                    onDragLeave={() => setIsDragging(false)}
                    onDrop={handleDrop}
                    onClick={() => { if (!previewUrl) fileInputRef.current?.click(); }}
                  >
                    {previewUrl ? (
                      <>
                        <img src={previewUrl} alt="Upload preview" style={{ width: '100%', height: '100%', objectFit: 'contain', background: '#000' }} />
                        <button
                          onClick={(e) => { e.stopPropagation(); resetAll(); }}
                          style={{ position: 'absolute', top: '12px', right: '12px', background: 'rgba(0,0,0,0.6)', border: '1px solid rgba(255,255,255,0.2)', color: 'white', padding: '6px 12px', borderRadius: '4px', fontSize: '12px', cursor: 'pointer', zIndex: 10, display: 'flex', alignItems: 'center', gap: '6px' }}
                        >
                          <RefreshCw size={12} /> Clear
                        </button>
                      </>
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' }}>
                        <button className="pill-btn" onClick={(e) => { e.preventDefault(); fileInputRef.current?.click(); }}>Select Image</button>
                        <div style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>or drop image here</div>
                      </div>
                    )}
                  </div>

                  <button className="action-btn" disabled={!file || isProcessing} onClick={handleGenerate}>
                    {isProcessing ? <Loader2 size={18} style={{ animation: 'spin 1s linear infinite' }} /> : <Wand2 size={18} />}
                    {isProcessing ? 'Analyzing...' : 'Generate Prompt'}
                  </button>
                </div>

                {/* Right Column: Result */}
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                  <div className="step-header">
                    <span className="step-number">02</span>
                    Generated AI Image Analyzer Prompt
                  </div>

                  <div className="zone-container" style={{ alignItems: promptText ? 'stretch' : 'center' }}>
                    {errorMsg ? (
                      <div style={{ padding: '24px', textAlign: 'center', color: '#ef4444' }}>
                        <div style={{ marginBottom: '8px' }}>Error analyzing image:</div>
                        <div style={{ fontSize: '13px', opacity: 0.8 }}>{errorMsg}</div>
                      </div>
                    ) : isProcessing ? (
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' }}>
                        <Loader2 size={32} style={{ animation: 'spin 1s linear infinite', color: 'var(--text-secondary)' }} />
                        <div style={{ fontSize: '13px', color: 'var(--text-secondary)' }} className="animate-pulse">Engineering prompt...</div>
                      </div>
                    ) : promptText ? (
                      <textarea
                        value={promptText}
                        readOnly
                        style={{ width: '100%', height: '100%', background: 'transparent', border: 'none', padding: '24px', color: 'var(--text-primary)', fontFamily: 'var(--font-mono)', fontSize: '14px', lineHeight: '1.6', resize: 'none', outline: 'none' }}
                      />
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' }}>
                        <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: '#1c1c1e', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <Wand2 size={20} color="var(--text-secondary)" />
                        </div>
                        <div style={{ fontSize: '13px', color: 'var(--text-secondary)', maxWidth: '200px', textAlign: 'center', lineHeight: '1.5' }}>
                          Your AI-generated prompt will appear here
                        </div>
                      </div>
                    )}
                  </div>

                  <button
                    className="action-btn secondary"
                    disabled={!promptText}
                    onClick={handleCopy}
                    style={{
                      background: copied ? '#10b981' : promptText ? 'var(--text-primary)' : undefined,
                      color: promptText && !copied ? 'var(--bg)' : undefined,
                      borderColor: copied ? '#10b981' : undefined,
                    }}
                  >
                    {copied ? <Check size={18} /> : <Copy size={18} />}
                    {copied ? 'Copied' : 'Copy'}
                  </button>
                </div>

              </div>

              {/* Recent Prompts History Section */}
              <RecentPrompts
                history={history}
                onSelect={(prompt) => {
                  navigator.clipboard.writeText(prompt);
                }}
              />
            </>
          ) : (
            <Gallery 
              category={activeTab} 
              onSelectItem={(item) => setSelectedItem(item)} 
            />
          )}

          {selectedItem && (
            <ComponentModal 
              item={selectedItem} 
              onClose={() => setSelectedItem(null)} 
            />
          )}

        </div>
      </div>
    </div>
  );
}
