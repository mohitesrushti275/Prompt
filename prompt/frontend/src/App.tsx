import { useState, useRef, useEffect } from 'react';
import type { ChangeEvent } from 'react';
import { Copy, Wand2, RefreshCw, X, Download, Code as CodeIcon, FileText } from 'lucide-react';
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
  id: string;
  title: string;
  desc: string;
  category: string;
  prompt?: string;
  code?: string;
  image?: string;
}

interface ComponentData {
  id: string;
  name: string;
  count: number;
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
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px', marginBottom: '28px' }}>
        <FileText size={14} color="var(--text-secondary)" />
        <span style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--text-secondary)' }}>Recent Prompts</span>
        <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '22px', height: '22px', borderRadius: '50%', background: 'var(--surface)', border: '1px solid var(--border)', fontSize: '11px', fontWeight: 600, color: 'var(--text-secondary)' }}>{history.length}</span>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1px', background: 'var(--border)', border: '1px solid var(--border)', borderRadius: '12px', overflow: 'hidden' }}>
        {items.map((item) => (
          <div key={item.id} onClick={() => onSelect(item.prompt)} className="history-card" style={{ background: 'var(--surface)', padding: '20px 24px 24px', cursor: 'pointer', transition: 'background 0.15s' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '12px' }}>
              <FileText size={13} color="var(--text-secondary)" />
              <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>{item.wordCount} words</span>
              <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>{item.charCount} chars</span>
            </div>
            <p style={{ fontSize: '13px', color: 'var(--text-primary)', lineHeight: '1.65', display: '-webkit-box', WebkitLineClamp: 6, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{item.prompt}</p>
          </div>
        ))}
        {items.length % 2 !== 0 && <div style={{ background: 'var(--surface)' }} />}
      </div>
    </div>
  );
}

// ── Sidebar Component ─────────────────────────────────────────────────────────
function Sidebar({ activeTab, onTabSelect, components }: { activeTab: string; onTabSelect: (tab: string) => void; components: ComponentData[] }) {
  return (
    <nav className="sidebar">
      <div className="nav-list">
        <div 
          className={`nav-item ${activeTab === 'Home' ? 'active' : ''}`}
          onClick={() => onTabSelect('Home')}
        >
          <span className="nav-item-label">Home</span>
        </div>
        {components.map((item) => (
          <div 
            key={item.id} 
            className={`nav-item ${activeTab === item.name ? 'active' : ''}`}
            onClick={() => onTabSelect(item.name)}
          >
            <span className="nav-item-label">{item.name}</span>
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
        <div style={{ position: 'absolute', inset: '2px', background: 'var(--bg)', borderRadius: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px', color: 'var(--text-secondary)' }}>Shine</div>
      </div>
    );
  }
  if (type === 'Border Beam') {
    return (
      <div style={{ width: '100%', height: '100%', borderRadius: '8px', padding: '2px', background: 'linear-gradient(90deg, var(--border), var(--text-secondary), var(--border))', position: 'relative', overflow: 'hidden' }}>
        <div style={{ width: '100%', height: '100%', background: 'var(--bg)', borderRadius: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px', color: 'var(--text-secondary)' }}>Beam</div>
      </div>
    );
  }
  return (
    <div style={{ width: '100%', height: '100%', background: 'var(--surface)', borderRadius: '8px', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-secondary)', fontSize: '10px' }}>{type}</div>
  );
};

function GalleryCard({ title, desc, onClick, children }: { title: string; desc: string; onClick: () => void; children: React.ReactNode }) {
  return (
    <div className="gallery-card" onClick={onClick}>
      <div className="gallery-card-preview">{children}</div>
      <div className="gallery-card-info">
        <h3 className="gallery-card-title">{title}</h3>
        <p className="gallery-card-desc">{desc}</p>
      </div>
    </div>
  );
}

function ComponentModal({ item, onClose }: { item: GalleryItem; onClose: () => void }) {
  const jsonContent = JSON.stringify({ 
    id: item.id,
    title: item.title, 
    category: item.category, 
    description: item.desc,
    prompt: item.prompt || '',
    code: item.code || '',
    image: item.image || '',
    timestamp: new Date().toISOString() 
  }, null, 2);

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
              {item.image ? (
                <img src={item.image} style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '12px', border: '1px solid var(--border)' }} />
              ) : item.category === 'Borders' ? (
                <BorderPreview type={item.title} />
              ) : (
                <div style={{ width: '100%', height: '100%', background: 'linear-gradient(45deg, #111, #1a1a1c)', borderRadius: '12px', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-secondary)', fontSize: '14px' }}>
                  {item.category} Preview
                </div>
              )}
            </div>
          </div>
          <div className="modal-details-area">
            <div className="modal-meta-section">
              <span className="badge" style={{ marginBottom: '12px' }}>{item.category} / Component</span>
              <p className="modal-desc" style={{ marginBottom: '24px' }}>{item.desc}</p>
            </div>

            {item.prompt && (
              <div className="modal-meta-section" style={{ marginBottom: '20px' }}>
                <label style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '8px', textTransform: 'uppercase' }}>
                  <Wand2 size={12} /> AI Prompt
                </label>
                <div style={{ position: 'relative' }}>
                  <textarea 
                    readOnly 
                    value={item.prompt} 
                    style={{ width: '100%', height: '80px', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '8px', padding: '12px', color: 'var(--text-primary)', fontSize: '12px', resize: 'none', fontFamily: 'var(--font-mono)' }}
                  />
                  <button 
                    onClick={() => navigator.clipboard.writeText(item.prompt || '')}
                    style={{ position: 'absolute', top: '8px', right: '8px', background: 'transparent', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}
                  >
                    <Copy size={14} />
                  </button>
                </div>
              </div>
            )}

            {item.code && (
              <div className="modal-meta-section" style={{ marginBottom: '20px' }}>
                <label style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '8px', textTransform: 'uppercase' }}>
                  <CodeIcon size={12} /> Source Code
                </label>
                <div style={{ position: 'relative' }}>
                  <textarea 
                    readOnly 
                    value={item.code} 
                    style={{ width: '100%', height: '80px', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '8px', padding: '12px', color: 'var(--text-primary)', fontSize: '12px', resize: 'none', fontFamily: 'var(--font-mono)' }}
                  />
                  <button 
                    onClick={() => navigator.clipboard.writeText(item.code || '')}
                    style={{ position: 'absolute', top: '8px', right: '8px', background: 'transparent', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}
                  >
                    <Copy size={14} />
                  </button>
                </div>
              </div>
            )}

            <div className="modal-actions">
              <button className="modal-action-btn primary" onClick={handleDownload}><Download size={16} /> Download JSON</button>
              <button className="modal-action-btn outline" onClick={onClose}>Close</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Main App ──────────────────────────────────────────────────────────────────
export default function App() {
  const [activeTab, setActiveTab] = useState('Home');
  const [components, setComponents] = useState<ComponentData[]>([]);
  const [galleryItems, setGalleryItems] = useState<GalleryItem[]>([]);
  const [selectedItem, setSelectedItem] = useState<GalleryItem | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [errorMsg, setErrorMsg] = useState('');
  const [history, setHistory] = useState<PromptHistoryItem[]>(loadHistory);

  const fetchComponents = () => {
    fetch('http://localhost:3000/api/components')
      .then(res => res.json())
      .then(data => {
        setComponents(data);
        // Robust Sync: If current tab is not 'Home' and not in the new component list, go Home
        if (activeTab !== 'Home' && !data.find((c: any) => c.name === activeTab)) {
          setActiveTab('Home');
        }
      });
  };

  const fetchItems = () => {
    if (activeTab === 'Home') return;
    const comp = components.find(c => c.name === activeTab);
    if (comp) {
      fetch(`http://localhost:3000/api/components/${comp.id}/subsections`)
        .then(res => {
          if (!res.ok) throw new Error('Not found');
          return res.json();
        })
        .then(data => setGalleryItems(data))
        .catch(() => setGalleryItems([]));
    } else {
      setGalleryItems([]);
    }
  };

  useEffect(() => {
    fetchComponents();
    // Immediate fetch on focus
    window.addEventListener('focus', fetchComponents);
    const interval = setInterval(fetchComponents, 5000); // Poll components every 5s
    return () => {
      window.removeEventListener('focus', fetchComponents);
      clearInterval(interval);
    };
  }, []);

  useEffect(() => {
    fetchItems();
    // Re-fetch items on focus if in a category
    const onFocus = () => { if (activeTab !== 'Home') fetchItems(); };
    window.addEventListener('focus', onFocus);
    const interval = setInterval(onFocus, 5000); // Poll items every 5s
    return () => {
      window.removeEventListener('focus', onFocus);
      clearInterval(interval);
    };
  }, [activeTab, components]);

  const handleGenerate = async () => {
    if (!file) return;
    setIsProcessing(true);
    try {
      const formData = new FormData();
      formData.append('image', file);
      const res = await fetch('http://localhost:3000/api/analyze', { method: 'POST', body: formData });
      const data = await res.json();
      setResult(data);
    } catch (err: any) { setErrorMsg(err.message); } finally { setIsProcessing(false); }
  };

  return (
    <div style={{ display: 'flex' }}>
      <Sidebar activeTab={activeTab} onTabSelect={setActiveTab} components={components} />
      <div className="main-content-wrapper">
        <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '64px 24px' }}>
          {activeTab === 'Home' ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <div className="badge">• NO EMAIL REQUIRED. FREE DAILY 3 IMAGE TO PROMPT</div>
              <h1 style={{ fontSize: '42px', textAlign: 'center', marginBottom: '20px' }}>Image to Prompt - AI Image<br />Analyzer & Generator</h1>
              <div className="workspace-card" style={{ width: '100%', display: 'flex', gap: '24px' }}>
                <div style={{ flex: 1 }}>
                  <div className="step-header"><span className="step-number">01</span> Upload Photo</div>
                  <div className="zone-container dashed" style={{ cursor: 'pointer' }} onClick={() => document.getElementById('fileInput')?.click()}>
                    {previewUrl ? <img src={previewUrl} style={{ width: '100%', height: '100%', objectFit: 'contain' }} /> : 'Drop image or click to select'}
                    <input id="fileInput" type="file" style={{ display: 'none' }} onChange={e => { if (e.target.files?.[0]) { setFile(e.target.files[0]); setPreviewUrl(URL.createObjectURL(e.target.files[0])); } }} />
                  </div>
                  <button className="action-btn" onClick={handleGenerate} disabled={!file || isProcessing}>{isProcessing ? 'Analyzing...' : 'Generate Prompt'}</button>
                </div>
                <div style={{ flex: 1 }}>
                  <div className="step-header"><span className="step-number">02</span> AI Prompt</div>
                  <div className="zone-container">
                    <textarea value={result?.prompts?.['DALL-E 3'] || ''} readOnly style={{ width: '100%', height: '100%', background: 'transparent', border: 'none', padding: '16px', color: 'var(--text-primary)', font: 'inherit', resize: 'none' }} placeholder="Result will appear here..." />
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="gallery-container">
              <header className="gallery-header">
                <span className="badge">Library / {activeTab}</span>
                <h1 style={{ fontSize: '32px' }}>{activeTab}</h1>
              </header>
              <div className="gallery-grid">
                {galleryItems.map(item => (
                  <GalleryCard key={item.id} title={item.title} desc={item.desc} onClick={async () => {
                    // Fetch fresh data for the modal to ensure sync
                    try {
                      const res = await fetch(`http://localhost:3000/api/subsections/${item.id}`);
                      const freshItem = await res.json();
                      setSelectedItem(freshItem);
                    } catch {
                      setSelectedItem(item);
                    }
                  }}>
                    {item.image ? (
                      <img src={item.image} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    ) : activeTab === 'Borders' ? (
                      <BorderPreview type={item.title} />
                    ) : (
                      <div style={{ width: '100%', height: '100%', background: 'var(--surface)', borderRadius: '8px', border: '1px solid var(--border)' }} />
                    )}
                  </GalleryCard>
                ))}
              </div>
            </div>
          )}
          {selectedItem && <ComponentModal item={selectedItem} onClose={() => setSelectedItem(null)} />}
        </div>
      </div>
    </div>
  );
}
