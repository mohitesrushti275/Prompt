import { useState, useRef, useEffect } from 'react';
import type { ChangeEvent } from 'react';
import { Copy, Wand2, RefreshCw, X, Download, Code as CodeIcon, FileText, Layout } from 'lucide-react';
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

        <div 
          className={`nav-item ${activeTab === 'Design Manifest' ? 'active' : ''}`}
          onClick={() => onTabSelect('Design Manifest')}
        >
          <span className="nav-item-label">Design Manifest</span>
        </div>

        <div style={{ padding: '8px 24px', fontSize: '11px', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em', marginTop: '16px' }}>
          Browse Components
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

function GalleryCard({ title, onClick, children }: { title: string; onClick: () => void; children: React.ReactNode }) {
  return (
    <div className="gallery-card" onClick={onClick}>
      <div className="gallery-card-preview">{children}</div>
      <div className="gallery-card-info">
        <h3 className="gallery-card-title">{title}</h3>
      </div>
    </div>
  );
}

function ComponentModal({ item, onClose }: { item: GalleryItem; onClose: () => void }) {
  const jsonContent = JSON.stringify({ 
    id: item.id,
    title: item.title, 
    category: item.category, 
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
  
  // Design Manifest States
  const [manifest, setManifest] = useState({
    businessName: '',
    primaryColor: '#3368F7',
    headingFont: 'Space Grotesk',
    bodyFont: 'Inter',
    sectionType: 'Hero Section'
  });
  const [generatedPrompt, setGeneratedPrompt] = useState('');

  const GOOGLE_FONTS = [
    'Inter', 'Space Grotesk', 'Poppins', 'Montserrat', 'Roboto', 
    'Open Sans', 'Playfair Display', 'Merriweather', 'Nunito', 'Outfit', 
    'Syne', 'Lexend', 'Sora', 'Work Sans', 'Kanit', 'Ubuntu', 
    'Lato', 'Oswald', 'Raleway', 'Quicksand'
  ];

  const SECTION_TYPES = [
    'Hero Section', 'Features Grid', 'Testimonials', 'Pricing Table', 
    'Stats Section', 'Contact Form', 'FAQ Section', 'Footer'
  ];

  const [isGeneratingManifest, setIsGeneratingManifest] = useState(false);

  const handleGeneratePrompt = async () => {
    setIsGeneratingManifest(true);
    setGeneratedPrompt('Generating premium prompt with Claude...');
    try {
      const res = await fetch('http://localhost:3000/api/generate-manifest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(manifest)
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to generate');
      setGeneratedPrompt(data.prompt);
    } catch (err: any) {
      setGeneratedPrompt(`⚠️ API Error: ${err.message}`);
    } finally {
      setIsGeneratingManifest(false);
    }
  };

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
    setResult(null);
    setErrorMsg('');
    try {
      const formData = new FormData();
      formData.append('image', file);
      const res = await fetch('http://localhost:3000/api/analyze', { method: 'POST', body: formData });
      const data = await res.json();
      if (!res.ok || data.error) {
        throw new Error(data.error || 'Failed to generate prompt');
      }
      setResult(data);
    } catch (err: any) {
      setErrorMsg(err.message);
    } finally {
      setIsProcessing(false);
    }
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
                    {errorMsg ? (
                      <div style={{ padding: '16px', color: '#ff4a4a', fontSize: '13px', fontFamily: 'var(--font-mono)', lineHeight: '1.5' }}>
                        ⚠️ {errorMsg}
                      </div>
                    ) : (
                      <textarea value={result?.prompts?.['DALL-E 3'] || ''} readOnly style={{ width: '100%', height: '100%', background: 'transparent', border: 'none', padding: '16px', color: 'var(--text-primary)', font: 'inherit', resize: 'none' }} placeholder="Result will appear here..." />
                    )}
                  </div>
                </div>
              </div>
            </div>
          ) : activeTab === 'Design Manifest' ? (
            <div className="gallery-container">
              <div className="gallery-header">
                <span className="badge">Configurator / Design Manifest</span>
                <h1 style={{ fontSize: '32px' }}>Design Manifest</h1>
                <p style={{ color: 'var(--text-secondary)', fontSize: '14px', marginTop: '8px' }}>
                  Define your brand parameters to generate a specialized UI design prompt.
                </p>
              </div>

              <div className="workspace-grid" style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1.2fr) minmax(0, 0.8fr)', gap: '2px', background: 'var(--border)', borderRadius: '12px', overflow: 'hidden', border: '1px solid var(--border)' }}>
                {/* Left Panel - Form */}
                <div style={{ background: 'var(--surface)', padding: '40px', display: 'flex', flexDirection: 'column', gap: '32px' }}>
                  
                  <div className="manifest-section">
                    <div className="step-header">
                      <div className="step-number">01</div>
                      <span>Business Name</span>
                    </div>
                    <input 
                      type="text"
                      className="manifest-input"
                      placeholder="e.g. Antigravity AI"
                      value={manifest.businessName}
                      onChange={e => setManifest({...manifest, businessName: e.target.value})}
                    />
                  </div>

                  <div className="manifest-section">
                    <div className="step-header">
                      <div className="step-number">02</div>
                      <span>Brand Identity</span>
                    </div>
                    <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                      <input 
                        type="color" 
                        value={manifest.primaryColor}
                        onChange={e => setManifest({...manifest, primaryColor: e.target.value})}
                        style={{ width: '45px', height: '42px', border: '1px solid var(--border)', background: 'transparent', cursor: 'pointer', borderRadius: '4px', padding: '2px' }}
                      />
                      <input 
                        type="text"
                        className="manifest-input"
                        style={{ fontFamily: 'var(--font-mono)', fontSize: '13px' }}
                        value={manifest.primaryColor}
                        onChange={e => setManifest({...manifest, primaryColor: e.target.value})}
                        placeholder="#000000"
                      />
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
                    <div className="manifest-section">
                      <div className="step-header">
                        <div className="step-number">03</div>
                        <span>Heading Font</span>
                      </div>
                      <select 
                        className="manifest-input"
                        value={manifest.headingFont}
                        onChange={e => setManifest({...manifest, headingFont: e.target.value})}
                      >
                        {GOOGLE_FONTS.map(f => <option key={f} value={f}>{f}</option>)}
                      </select>
                    </div>
                    <div className="manifest-section">
                      <div className="step-header">
                        <div className="step-number">04</div>
                        <span>Body Font</span>
                      </div>
                      <select 
                        className="manifest-input"
                        value={manifest.bodyFont}
                        onChange={e => setManifest({...manifest, bodyFont: e.target.value})}
                      >
                        {GOOGLE_FONTS.map(f => <option key={f} value={f}>{f}</option>)}
                      </select>
                    </div>
                  </div>

                  <div className="manifest-section">
                    <div className="step-header">
                      <div className="step-number">05</div>
                      <span>Project Scope</span>
                    </div>
                    <select 
                      className="manifest-input"
                      value={manifest.sectionType}
                      onChange={e => setManifest({...manifest, sectionType: e.target.value})}
                    >
                      {SECTION_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                    </select>
                  </div>

                  <button 
                    className="action-btn" 
                    onClick={handleGeneratePrompt}
                    disabled={!manifest.businessName || isGeneratingManifest}
                  >
                    {isGeneratingManifest ? 'Generating with Claude...' : 'Generate UI Prompt'}
                  </button>
                </div>

                {/* Right Panel - Preview */}
                <div style={{ background: '#09090A', padding: '40px', display: 'flex', flexDirection: 'column' }}>
                  <div className="step-header">
                    <span>Generated Design Concept</span>
                  </div>
                  <div style={{ flex: 1, background: 'rgba(255,255,255,0.02)', border: '1px dashed var(--border)', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '32px' }}>
                    {generatedPrompt ? (
                      <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', gap: '24px' }}>
                        <div style={{ fontSize: '14px', color: 'var(--text-secondary)', lineHeight: 1.6, fontFamily: 'var(--font-mono)', wordBreak: 'break-word' }}>
                          {generatedPrompt}
                        </div>
                        <button 
                          className="action-btn secondary"
                          onClick={() => { navigator.clipboard.writeText(generatedPrompt); alert('Copied to clipboard!'); }}
                          style={{ marginTop: 'auto', width: 'auto', alignSelf: 'flex-start' }}
                        >
                          <Copy size={14} /> Copy Prompt
                        </button>
                      </div>
                    ) : (
                      <div style={{ textAlign: 'center', color: 'var(--text-secondary)' }}>
                        <Layout size={40} style={{ marginBottom: '16px', opacity: 0.2 }} />
                        <p style={{ fontSize: '13px' }}>Your design strategy will appear here...</p>
                      </div>
                    )}
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
                  <GalleryCard key={item.id} title={item.title} onClick={async () => {
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
