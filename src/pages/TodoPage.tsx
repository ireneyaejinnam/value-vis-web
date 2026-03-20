import { useState, useEffect } from 'react';
import { useAppStore } from '../store/useAppStore';
import { Plus, Check, Trash2, Edit3, ChevronDown, ChevronRight, FolderPlus } from 'lucide-react';
import { Modal } from '../components/common/Modal';
import { ValueBadge } from '../components/common/ValueBadge';
import { colorVariantText } from '../components/common/ColorVariantBadge';
import { VALUES } from '../constants/onboarding';
import type { TodoItem, ColorVariant } from '../types';
import { COLOR_OPTIONS, BASE_CATEGORIES } from '../types';

const PRIORITY_LABELS: Record<string, { label: string; color: string; bg: string }> = {
  high:   { label: 'High',   color: '#C07050', bg: 'rgba(232,154,122,0.12)' },
  medium: { label: 'Medium', color: '#C0A030', bg: 'rgba(254,202,87,0.12)' },
  low:    { label: 'Low',    color: '#2AA890', bg: 'rgba(122,232,208,0.12)' },
};

export function TodoPage() {
  const store = useAppStore();
  const [showTodoModal, setShowTodoModal] = useState(false);
  const [editingTodo, setEditingTodo] = useState<TodoItem | null>(null);
  const [showNewProject, setShowNewProject] = useState(false);
  const [newProjectName, setNewProjectName] = useState('');
  const [expandedPriorities, setExpandedPriorities] = useState<Record<string, boolean>>({ high: true, medium: true, low: true, none: true });

  const currentProject = store.projects.find((p) => p.id === store.currentProjectId);
  const todos = currentProject?.todos ?? [];

  const byPriority = {
    high:   todos.filter((t) => t.priority === 'high'),
    medium: todos.filter((t) => t.priority === 'medium'),
    low:    todos.filter((t) => t.priority === 'low'),
    none:   todos.filter((t) => !t.priority),
  };

  const completedCount = todos.filter((t) => t.completed).length;

  function handleAddProject() {
    if (!newProjectName.trim()) return;
    store.addProject(newProjectName.trim());
    setNewProjectName('');
    setShowNewProject(false);
  }

  return (
    <div className="flex h-full">
      {/* Projects sidebar */}
      <div className="w-52 border-r border-border bg-surface flex-shrink-0 flex flex-col">
        <div className="px-4 py-4 border-b border-border">
          <p className="text-xs font-semibold text-text-muted uppercase tracking-widest">Projects</p>
        </div>
        <div className="flex-1 overflow-y-auto p-2 space-y-0.5">
          {store.projects.map((p) => {
            const done = p.todos.filter((t) => t.completed).length;
            return (
              <button key={p.id} onClick={() => store.setCurrentProjectId(p.id)}
                className={`w-full text-left px-3 py-2.5 rounded-xl text-sm transition-all ${p.id === store.currentProjectId ? 'bg-primary/10 text-primary' : 'text-text-secondary hover:text-text-primary hover:bg-surface-2'}`}
              >
                <div className="font-medium truncate">{p.name}</div>
                <div className="text-xs text-text-muted mt-0.5">{done}/{p.todos.length} done</div>
              </button>
            );
          })}
        </div>
        <div className="p-2 border-t border-border">
          {showNewProject ? (
            <div className="space-y-1.5">
              <input value={newProjectName} onChange={(e) => setNewProjectName(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') handleAddProject(); if (e.key === 'Escape') setShowNewProject(false); }}
                placeholder="Project name"
                autoFocus
                className="w-full bg-bg border border-border rounded-lg px-2 py-1.5 text-xs text-text-primary placeholder-text-muted outline-none focus:border-primary/60"
              />
              <div className="flex gap-1">
                <button onClick={handleAddProject} className="flex-1 py-1.5 rounded-lg bg-primary/10 text-primary text-xs hover:bg-primary/20 transition-colors font-medium">Add</button>
                <button onClick={() => setShowNewProject(false)} className="flex-1 py-1.5 rounded-lg bg-surface-2 text-text-muted text-xs hover:bg-border transition-colors">Cancel</button>
              </div>
            </div>
          ) : (
            <button onClick={() => setShowNewProject(true)} className="w-full flex items-center gap-1.5 px-2 py-2 rounded-xl text-xs text-text-muted hover:text-primary hover:bg-primary/10 transition-colors">
              <FolderPlus size={13} /> New Project
            </button>
          )}
        </div>
      </div>

      {/* Todo list */}
      <div className="flex-1 flex flex-col overflow-hidden bg-bg">
        <div className="px-5 py-4 border-b border-border bg-surface flex items-center justify-between flex-shrink-0">
          <div>
            <h2 className="text-base font-semibold text-text-primary">{currentProject?.name ?? 'No Project'}</h2>
            <p className="text-xs text-text-muted">{completedCount}/{todos.length} completed</p>
          </div>
          <button onClick={() => { setEditingTodo(null); setShowTodoModal(true); }}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium bg-primary text-white hover:bg-primary-dark transition-colors"
          >
            <Plus size={14} /> Add Task
          </button>
        </div>

        {/* Progress */}
        {todos.length > 0 && (
          <div className="px-5 py-2 border-b border-border bg-surface">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs text-text-muted">Progress</span>
              <span className="text-xs font-medium text-text-secondary">{Math.round((completedCount / todos.length) * 100)}%</span>
            </div>
            <div className="h-1.5 bg-surface-2 rounded-full overflow-hidden">
              <div className="h-full bg-emerald-500 rounded-full transition-all duration-500" style={{ width: `${(completedCount / todos.length) * 100}%` }} />
            </div>
          </div>
        )}

        <div className="flex-1 overflow-y-auto p-5 space-y-6">
          {todos.length === 0 ? (
            <div className="text-center py-20">
              <Check size={36} className="mx-auto text-text-muted mb-3 opacity-50" />
              <p className="text-text-secondary text-sm">No tasks yet</p>
              <button onClick={() => { setEditingTodo(null); setShowTodoModal(true); }} className="mt-3 text-primary text-sm hover:underline">Add your first task</button>
            </div>
          ) : (
            (Object.entries(byPriority) as [string, TodoItem[]][]).map(([priority, items]) => {
              if (items.length === 0) return null;
              const expanded = expandedPriorities[priority] ?? true;
              const info = PRIORITY_LABELS[priority];
              return (
                <div key={priority}>
                  <button onClick={() => setExpandedPriorities((p) => ({ ...p, [priority]: !p[priority] }))}
                    className="flex items-center gap-2 mb-3 text-xs font-semibold uppercase tracking-widest text-text-muted hover:text-text-primary transition-colors"
                  >
                    {expanded ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
                    {info ? <span style={{ color: info.color }}>{info.label} Priority</span> : <span>No Priority</span>}
                    <span className="text-text-muted normal-case font-normal tracking-normal">({items.length})</span>
                  </button>
                  {expanded && (
                    <div className="space-y-2">
                      {items.map((todo) => (
                        <TodoCard key={todo.id} todo={todo}
                          onEdit={() => { setEditingTodo(todo); setShowTodoModal(true); }}
                          onDelete={() => store.deleteTodo(todo.projectId, todo.id)}
                          onToggle={() => store.toggleTodo(todo.projectId, todo.id)}
                        />
                      ))}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>

      <TodoFormModal
        open={showTodoModal}
        onClose={() => setShowTodoModal(false)}
        todo={editingTodo}
        projectId={store.currentProjectId}
        customCategories={store.customCategories}
        onAddCategory={store.addCustomCategory}
      />
    </div>
  );
}

function TodoCard({ todo, onEdit, onDelete, onToggle }: { todo: TodoItem; onEdit: () => void; onDelete: () => void; onToggle: () => void }) {
  return (
    <div className="rounded-2xl border border-border bg-white p-4 flex items-start gap-3 card-hover">
      <button onClick={onToggle} className={`mt-0.5 w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 transition-colors ${todo.completed ? 'bg-emerald-500 border-emerald-500' : 'border-gray-300 hover:border-primary'}`}>
        {todo.completed && <Check size={10} color="white" />}
      </button>
      <div className="flex-1 min-w-0">
        <p className={`text-sm font-medium ${todo.completed ? 'line-through text-text-muted' : 'text-text-primary'}`}>{todo.title}</p>
        {todo.description && <p className="text-xs text-text-secondary mt-0.5 line-clamp-1">{todo.description}</p>}
        <div className="flex items-center gap-2 mt-1.5 flex-wrap">
          <span className="text-xs text-text-muted bg-surface-2 px-2 py-0.5 rounded-md">{todo.category}</span>
          {todo.time && <span className="text-xs text-text-muted">{todo.time}</span>}
          {todo.linkedValue && <ValueBadge valueId={todo.linkedValue} />}
          {todo.subtasks && todo.subtasks.length > 0 && (
            <span className="text-xs text-text-muted">{todo.subtasks.filter((s) => s.completed).length}/{todo.subtasks.length} subtasks</span>
          )}
        </div>
      </div>
      <div className="flex gap-1 flex-shrink-0">
        <button onClick={onEdit} className="p-1.5 rounded-lg hover:bg-surface-2 text-text-muted hover:text-text-primary transition-colors"><Edit3 size={13} /></button>
        <button onClick={onDelete} className="p-1.5 rounded-lg hover:bg-red-50 text-text-muted hover:text-red-500 transition-colors"><Trash2 size={13} /></button>
      </div>
    </div>
  );
}

function TodoFormModal({ open, onClose, todo, projectId, customCategories, onAddCategory }: {
  open: boolean; onClose: () => void; todo: TodoItem | null; projectId: string;
  customCategories: string[]; onAddCategory: (c: string) => { success: boolean; error?: string };
}) {
  const store = useAppStore();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [time, setTime] = useState('');
  const [priority, setPriority] = useState<'high'|'medium'|'low'|undefined>(undefined);
  const [category, setCategory] = useState('General');
  const [linkedValue, setLinkedValue] = useState('');
  const [colorVariant, setColorVariant] = useState<ColorVariant>('blue');
  const [newCategory, setNewCategory] = useState('');
  const [subtasks, setSubtasks] = useState<{ id: string; title: string; completed: boolean }[]>([]);
  const [newSubtask, setNewSubtask] = useState('');

  useEffect(() => {
    setTitle(todo?.title ?? '');
    setDescription(todo?.description ?? '');
    setTime(todo?.time ?? '');
    setPriority(todo?.priority ?? undefined);
    setCategory(todo?.category ?? 'General');
    setLinkedValue(todo?.linkedValue ?? '');
    setColorVariant(todo?.colorVariant ?? 'blue');
    setSubtasks(todo?.subtasks ?? []);
  }, [todo, open]);

  const allCategories = [...BASE_CATEGORIES, ...customCategories];
  const inputCls = "w-full bg-bg border border-border rounded-xl px-3 py-2.5 text-sm text-text-primary outline-none focus:border-primary/60 focus:ring-2 focus:ring-primary/10 transition-all";

  function handleSave() {
    if (!title.trim()) return;
    const data = { title: title.trim(), description: description.trim() || undefined, time: time || undefined, priority, category, linkedValue: linkedValue || undefined, colorVariant, completed: todo?.completed ?? false, projectId, subtasks: subtasks.length > 0 ? subtasks : undefined };
    if (todo) store.updateTodo(todo.projectId, todo.id, data);
    else store.addTodo(projectId, data);
    onClose();
  }

  return (
    <Modal open={open} onClose={onClose} title={todo ? 'Edit Task' : 'New Task'} size="lg">
      <div className="p-5 space-y-4">
        <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Task title" className={inputCls} />
        <textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Description (optional)" rows={2} className={inputCls + ' resize-none'} />

        <div className="grid grid-cols-2 gap-3">
          <div>
            <p className="text-xs font-medium text-text-muted mb-1.5">Time</p>
            <input type="time" value={time} onChange={(e) => setTime(e.target.value)} className={inputCls} />
          </div>
          <div>
            <p className="text-xs font-medium text-text-muted mb-1.5">Priority</p>
            <select value={priority ?? ''} onChange={(e) => setPriority((e.target.value as any) || undefined)} className="w-full bg-bg border border-border rounded-xl px-3 py-2.5 text-sm text-text-primary outline-none focus:border-primary/60">
              <option value="">None</option>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>
          </div>
        </div>

        <div>
          <p className="text-xs font-medium text-text-muted mb-1.5">Category</p>
          <select value={category} onChange={(e) => setCategory(e.target.value)} className="w-full bg-bg border border-border rounded-xl px-3 py-2.5 text-sm text-text-primary outline-none focus:border-primary/60 mb-2">
            {allCategories.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
          <div className="flex gap-2">
            <input value={newCategory} onChange={(e) => setNewCategory(e.target.value)} placeholder="Add custom category…" className="flex-1 bg-bg border border-border rounded-xl px-3 py-2 text-xs text-text-primary placeholder-text-muted outline-none focus:border-primary/60" />
            <button onClick={() => { const r = onAddCategory(newCategory); if (r.success) { setCategory(newCategory.trim()); setNewCategory(''); } }} disabled={!newCategory.trim()} className="px-3 py-1.5 rounded-lg bg-primary/10 text-primary text-xs hover:bg-primary/20 disabled:opacity-40 transition-colors">Add</button>
          </div>
        </div>

        <div>
          <p className="text-xs font-medium text-text-muted mb-1.5">Link to value</p>
          <select value={linkedValue} onChange={(e) => setLinkedValue(e.target.value)} className="w-full bg-bg border border-border rounded-xl px-3 py-2.5 text-sm text-text-primary outline-none focus:border-primary/60">
            <option value="">No value linked</option>
            {VALUES.map((v) => <option key={v.id} value={v.id}>{v.label}</option>)}
          </select>
        </div>

        <div>
          <p className="text-xs font-medium text-text-muted mb-1.5">Color</p>
          <div className="flex gap-2">
            {COLOR_OPTIONS.map((c) => (
              <button key={c} onClick={() => setColorVariant(c)} className={`w-7 h-7 rounded-full border-2 transition-all ${colorVariant === c ? 'border-gray-700 scale-110' : 'border-transparent'}`} style={{ background: colorVariantText(c) }} />
            ))}
          </div>
        </div>

        <div>
          <p className="text-xs font-medium text-text-muted mb-1.5">Subtasks</p>
          <div className="space-y-1.5 mb-2">
            {subtasks.map((st, i) => (
              <div key={st.id} className="flex items-center gap-2">
                <button onClick={() => setSubtasks(subtasks.map((s, idx) => idx === i ? { ...s, completed: !s.completed } : s))} className={`w-4 h-4 rounded border flex items-center justify-center flex-shrink-0 transition-colors ${st.completed ? 'bg-emerald-500 border-emerald-500' : 'border-gray-300'}`}>
                  {st.completed && <Check size={9} color="white" />}
                </button>
                <span className={`text-xs flex-1 ${st.completed ? 'line-through text-text-muted' : 'text-text-secondary'}`}>{st.title}</span>
                <button onClick={() => setSubtasks(subtasks.filter((_, idx) => idx !== i))} className="text-text-muted hover:text-red-500 transition-colors"><Trash2 size={11} /></button>
              </div>
            ))}
          </div>
          <div className="flex gap-2">
            <input value={newSubtask} onChange={(e) => setNewSubtask(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') { if (newSubtask.trim()) { setSubtasks([...subtasks, { id: `st-${Date.now()}`, title: newSubtask.trim(), completed: false }]); setNewSubtask(''); } } }} placeholder="Add subtask…" className="flex-1 bg-bg border border-border rounded-xl px-3 py-2 text-xs text-text-primary placeholder-text-muted outline-none focus:border-primary/60" />
            <button onClick={() => { if (newSubtask.trim()) { setSubtasks([...subtasks, { id: `st-${Date.now()}`, title: newSubtask.trim(), completed: false }]); setNewSubtask(''); } }} disabled={!newSubtask.trim()} className="px-3 py-1.5 rounded-lg bg-primary/10 text-primary text-xs hover:bg-primary/20 disabled:opacity-40 transition-colors"><Plus size={13} /></button>
          </div>
        </div>

        <button onClick={handleSave} disabled={!title.trim()} className="w-full py-3 rounded-xl bg-primary text-white text-sm font-semibold disabled:opacity-40 hover:bg-primary-dark transition-colors">
          {todo ? 'Save Changes' : 'Add Task'}
        </button>
      </div>
    </Modal>
  );
}
