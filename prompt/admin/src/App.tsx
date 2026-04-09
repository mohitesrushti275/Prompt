import { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Layout, Save, X, ChevronRight, Package, Home, Upload, Code as CodeIcon, Terminal } from 'lucide-react';
import './index.css';

interface Subsection {
  id: string;
  title: string;
  desc: string;
  prompt?: string;
  code?: string;
  image?: string;
  category: string;
}

interface Component {
  id: string;
  name: string;
  count: number;
  subsections: Subsection[];
}

export default function AdminApp() {
  const [components, setComponents] = useState<Component[]>([]);
  const [selectedCompId, setSelectedCompId] = useState<string | null>(null);
  const [isEditingComp, setIsEditingComp] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [isAddingComp, setIsAddingComp] = useState(false);
  const [newCompName, setNewCompName] = useState('');
  
  const [isAddingSection, setIsAddingSection] = useState(false);
  const [editingSectionId, setEditingSectionId] = useState<string | null>(null);
  const [newSection, setNewSection] = useState({ title: '', desc: '', prompt: '', code: '', image: '' });
  const [dragActive, setDragActive] = useState(false);

  useEffect(() => {
    fetchComponents();
  }, []);

  const fetchComponents = async () => {
    try {
      const res = await fetch('http://localhost:3000/api/components');
      const data = await res.json();
      setComponents(data);
      if (data.length > 0 && !selectedCompId) setSelectedCompId(data[0].id);
    } catch (err) {
      console.error('Failed to fetch:', err);
    }
  };

  const selectedComp = components.find(c => c.id === selectedCompId);

  // ── Component CRUD ──────────────────────────────────────────────────────────
  const handleCreateComp = async () => {
    if (!newCompName.trim()) return;
    try {
      const res = await fetch('http://localhost:3000/api/components', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newCompName })
      });
      if (res.ok) {
        setNewCompName('');
        setIsAddingComp(false);
        await fetchComponents();
      }
    } catch (err) {
      console.error('Failed to create component:', err);
    }
  };

  const handleUpdateComp = async (id: string) => {
    try {
      const res = await fetch(`http://localhost:3000/api/components/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: editName })
      });
      if (res.ok) {
        setIsEditingComp(null);
        await fetchComponents();
      }
    } catch (err) {
      console.error('Failed to update component:', err);
    }
  };

  const handleDeleteComp = async (id: string) => {
    if (!confirm('Are you sure you want to delete this component and all its sections? This cannot be undone.')) return;
    try {
      const res = await fetch(`http://localhost:3000/api/components/${id}`, { method: 'DELETE' });
      if (res.ok) {
        if (selectedCompId === id) setSelectedCompId(null);
        await fetchComponents();
      }
    } catch (err) {
      console.error('Failed to delete component:', err);
    }
  };

  const handleImageUpload = (file: File) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      setNewSection(prev => ({ ...prev, image: reader.result as string }));
    };
    reader.readAsDataURL(file);
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") setDragActive(true);
    else if (e.type === "dragleave") setDragActive(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleImageUpload(e.dataTransfer.files[0]);
    }
  };

  // ── Subsection CRUD ─────────────────────────────────────────────────────────
  const handleSaveSection = async () => {
    if (!selectedCompId) return;
    
    const url = editingSectionId 
      ? `http://localhost:3000/api/subsections/${editingSectionId}`
      : `http://localhost:3000/api/components/${selectedCompId}/subsections`;
    
    const method = editingSectionId ? 'PUT' : 'POST';

    try {
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newSection)
      });
      if (res.ok) {
        setIsAddingSection(false);
        setEditingSectionId(null);
        setNewSection({ title: '', desc: '', prompt: '', code: '', image: '' });
        await fetchComponents();
      }
    } catch (err) {
      console.error('Failed to save section:', err);
    }
  };

  const handleEditSection = (sub: Subsection) => {
    setEditingSectionId(sub.id);
    setNewSection({
      title: sub.title,
      desc: sub.desc,
      prompt: sub.prompt || '',
      code: sub.code || '',
      image: sub.image || ''
    });
    setIsAddingSection(true);
  };

  const handleDeleteSection = async (id: string) => {
    if (!confirm('Delete this section?')) return;
    try {
      const res = await fetch(`http://localhost:3000/api/subsections/${id}`, { method: 'DELETE' });
      if (res.ok) {
        await fetchComponents();
      }
    } catch (err) {
      console.error('Failed to delete section:', err);
    }
  };

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--bg)' }}>
      {/* Left Sidebar */}
      <aside className="sidebar" style={{ paddingTop: '32px' }}>
        <div style={{ padding: '0 16px 24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '24px', opacity: 0.8 }}>
            <Package size={18} color="var(--text-secondary)" />
            <span style={{ fontSize: '12px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.1em' }}>Admin Console</span>
          </div>
          <button className="action-btn" onClick={() => setIsAddingComp(true)} style={{ marginTop: 0 }}>
            <Plus size={16} /> Create Component
          </button>
        </div>

        <div className="nav-list">
          <div style={{ padding: '8px 24px', fontSize: '11px', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            All Components
          </div>
          {components.map(comp => (
            <div 
              key={comp.id} 
              className={`nav-item ${selectedCompId === comp.id ? 'active' : ''}`}
              onClick={() => setSelectedCompId(comp.id)}
              style={{ paddingRight: '12px' }}
            >
              {isEditingComp === comp.id ? (
                <input 
                  autoFocus
                  value={editName}
                  onChange={e => setEditName(e.target.value)}
                  onBlur={() => handleUpdateComp(comp.id)}
                  onKeyDown={e => e.key === 'Enter' && handleUpdateComp(comp.id)}
                  style={{ background: 'transparent', border: 'none', color: 'inherit', font: 'inherit', width: '100%', outline: 'none' }}
                />
              ) : (
                <>
                  <span className="nav-item-label">{comp.name}</span>
                  <div style={{ display: 'flex', gap: '4px' }} onClick={e => e.stopPropagation()}>
                    <button onClick={() => { setIsEditingComp(comp.id); setEditName(comp.name); }} style={{ background: 'transparent', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', padding: '4px' }}>
                      <Edit2 size={12} />
                    </button>
                    <button onClick={() => handleDeleteComp(comp.id)} style={{ background: 'transparent', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', padding: '4px' }}>
                      <Trash2 size={12} />
                    </button>
                  </div>
                </>
              )}
            </div>
          ))}
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="main-content-wrapper" style={{ padding: '48px 64px' }}>
        {selectedComp ? (
          <div style={{ maxWidth: '1000px' }}>
            <header style={{ marginBottom: '48px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
              <div>
                <span className="badge">Management / {selectedComp.name}</span>
                <h1 style={{ fontSize: '32px' }}>{selectedComp.name}</h1>
                <p style={{ color: 'var(--text-secondary)', fontSize: '14px', marginTop: '8px' }}>
                  Manage subsections and interactive cards for this component category.
                </p>
              </div>
              <button 
                className="action-btn secondary" 
                onClick={() => setIsAddingSection(true)}
                style={{ width: 'auto', padding: '10px 20px', fontSize: '13px' }}
              >
                <Plus size={16} /> Add Section
              </button>
            </header>

            {/* Grid of Subsections */}
            <div className="gallery-grid">
              {selectedComp.subsections.map(sub => (
                <div key={sub.id} className="gallery-card" style={{ cursor: 'default' }}>
                  <div className="gallery-card-preview" style={{ height: '140px' }}>
                    {sub.image ? (
                      <img src={sub.image} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    ) : (
                      <Layout size={32} color="var(--border)" />
                    )}
                  </div>
                  <div className="gallery-card-info">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <h3 className="gallery-card-title">{sub.title}</h3>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <button onClick={() => handleEditSection(sub)} style={{ background: 'transparent', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}>
                          <Edit2 size={14} />
                        </button>
                        <button onClick={() => handleDeleteSection(sub.id)} style={{ background: 'transparent', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}>
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                    <p className="gallery-card-desc" style={{ marginTop: '4px' }}>{sub.desc}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Add Section Modal Overlay */}
            {isAddingSection && (
              <div className="modal-overlay" onClick={() => setIsAddingSection(false)}>
                <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: '800px' }}>
                  <header className="modal-header">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                      <button 
                        onClick={() => { setIsAddingSection(false); setEditingSectionId(null); }} 
                        style={{ background: 'transparent', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', padding: '4px', display: 'flex', alignItems: 'center' }}
                      >
                        <ChevronRight size={20} style={{ transform: 'rotate(180deg)' }} />
                      </button>
                      <h2 className="modal-title">{editingSectionId ? 'Edit Section' : 'Add New Section'}</h2>
                    </div>
                  </header>
                  
                  <div className="modal-body" style={{ gridTemplateColumns: '1fr', overflowY: 'auto', maxHeight: '70vh' }}>
                    <div style={{ padding: '32px', display: 'flex', flexDirection: 'column', gap: '28px' }}>
                      
                      {/* Grid for Name and Desc */}
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
                        <div className="modal-meta-section">
                          <label style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '8px', display: 'block', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Name of Section</label>
                          <input 
                            className="admin-input" 
                            style={{ height: '56px' }}
                            value={newSection.title}
                            onChange={(e) => setNewSection({...newSection, title: e.target.value})}
                            placeholder="e.g. Hero Section V1"
                          />
                        </div>
                        <div className="modal-meta-section">
                          <label style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '8px', display: 'block', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Description</label>
                          <input 
                            className="admin-input" 
                            style={{ height: '56px' }}
                            value={newSection.desc}
                            onChange={(e) => setNewSection({...newSection, desc: e.target.value})}
                            placeholder="Briefly describe this section..."
                          />
                        </div>
                      </div>

                      {/* Prompt and Code */}
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
                        <div className="modal-meta-section">
                          <label style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '8px', display: 'block', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                              <Terminal size={14} /> Enter Prompt
                            </div>
                          </label>
                          <textarea 
                            className="admin-input" 
                            style={{ height: '140px', resize: 'none', fontFamily: 'var(--font-mono)', fontSize: '13px' }}
                            value={newSection.prompt}
                            onChange={(e) => setNewSection({...newSection, prompt: e.target.value})}
                            placeholder="Enter the AI generation prompt..."
                          />
                        </div>
                        <div className="modal-meta-section">
                          <label style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '8px', display: 'block', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                              <CodeIcon size={14} /> Enter Code
                            </div>
                          </label>
                          <textarea 
                            className="admin-input" 
                            style={{ height: '140px', resize: 'none', fontFamily: 'var(--font-mono)', fontSize: '13px' }}
                            value={newSection.code}
                            onChange={(e) => setNewSection({...newSection, code: e.target.value})}
                            placeholder="Paste your source code here..."
                          />
                        </div>
                      </div>

                      {/* Image Upload */}
                      <div className="modal-meta-section">
                        <label style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '8px', display: 'block', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Drag and Drop / Upload Image</label>
                        <div 
                          className={`zone-container dashed ${dragActive ? 'animate-pulse' : ''}`}
                          style={{ 
                            height: '200px', 
                            cursor: 'pointer', 
                            background: dragActive ? 'var(--surface-hover)' : 'transparent',
                            borderColor: dragActive ? 'var(--text-primary)' : 'var(--border)'
                          }}
                          onDragEnter={handleDrag}
                          onDragLeave={handleDrag}
                          onDragOver={handleDrag}
                          onDrop={handleDrop}
                          onClick={() => document.getElementById('sectionImage')?.click()}
                        >
                          {newSection.image ? (
                            <img src={newSection.image} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                          ) : (
                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px', color: 'var(--text-secondary)' }}>
                              <Upload size={24} />
                              <span style={{ fontSize: '13px' }}>Click or drag image to upload</span>
                            </div>
                          )}
                          <input 
                            id="sectionImage"
                            type="file" 
                            style={{ display: 'none' }} 
                            onChange={e => e.target.files?.[0] && handleImageUpload(e.target.files[0])}
                            accept="image/*"
                          />
                        </div>
                      </div>

                      <div className="modal-actions" style={{ marginTop: '8px' }}>
                        <button className="modal-action-btn primary" onClick={handleSaveSection} style={{ height: '52px' }}>
                          {editingSectionId ? 'Update Section' : 'Save Section'}
                        </button>
                        <button className="modal-action-btn outline" onClick={() => { setIsAddingSection(false); setEditingSectionId(null); }} style={{ height: '52px' }}>Cancel</button>
                      </div>

                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Create Component Modal Overlay */}
            {isAddingComp && (
              <div className="modal-overlay" onClick={() => setIsAddingComp(false)}>
                <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: '440px' }}>
                  <header className="modal-header" style={{ padding: '24px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                      <button 
                        onClick={() => setIsAddingComp(false)} 
                        style={{ background: 'transparent', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', padding: '4px', display: 'flex', alignItems: 'center' }}
                      >
                        <ChevronRight size={20} style={{ transform: 'rotate(180deg)' }} />
                      </button>
                      <h2 className="modal-title" style={{ fontSize: '18px' }}>Create New Component</h2>
                    </div>
                  </header>
                  <div style={{ padding: '32px' }}>
                    <div className="modal-meta-section">
                      <label style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '8px', display: 'block', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                        Name of the component
                      </label>
                      <input 
                        className="admin-input" 
                        style={{ height: '56px', fontSize: '15px' }}
                        value={newCompName}
                        onChange={(e) => setNewCompName(e.target.value)}
                        placeholder="e.g. Navigation Bars"
                        autoFocus
                      />
                    </div>
                    <div className="modal-actions" style={{ marginTop: '32px', gap: '12px' }}>
                      <button className="modal-action-btn primary" onClick={handleCreateComp}>Save Component</button>
                      <button className="modal-action-btn outline" onClick={() => setIsAddingComp(false)}>Cancel</button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div style={{ height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', opacity: 0.5 }}>
            <Layout size={48} color="var(--border)" style={{ marginBottom: '16px' }} />
            <p>Select a component from the sidebar to manage its content.</p>
          </div>
        )}
      </main>
    </div>
  );
}
