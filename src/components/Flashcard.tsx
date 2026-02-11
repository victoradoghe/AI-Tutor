
import type React from 'react';
import { useState, useEffect } from 'react';
import {
  Plus, CheckCircle, ChevronLeft, ChevronRight,
  Wand2, Loader2, Layers, Trash2, Folder as FolderIcon,
  Search, Tag, GripVertical, ArrowLeft, Edit3, X, Save,
  ChevronUp, ChevronDown, PlusCircle, RotateCw
} from 'lucide-react';
import { generateFlashcards, generateCardAnswer } from '../services/geminiService';
import {
  getFolders, createFolder, updateFolder, deleteFolder,
  getSets, createSet, updateSet, deleteSet
} from '../services/flashcards';
import { useSubscription } from '../contexts/SubscriptionContext';

import type { Flashcard, FlashcardSet, Folder } from '../types';
import ConfirmationModal from './ConfirmationModal';

interface FlashcardsProps {
  userId: string;
}

type ViewMode = 'library' | 'folder' | 'set-edit' | 'study';

const Flashcards: React.FC<FlashcardsProps> = ({ userId }) => {
  const { checkLimit } = useSubscription();

  // --- Global State ---
  const [viewMode, setViewMode] = useState<ViewMode>('library');
  const [folders, setFolders] = useState<Folder[]>([]);
  const [sets, setSets] = useState<FlashcardSet[]>([]);
  const [notification, setNotification] = useState<string | null>(null);

  // --- Navigation State ---
  const [activeFolderId, setActiveFolderId] = useState<string | null>(null);
  const [activeSetId, setActiveSetId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTag, setSelectedTag] = useState<string | null>(null);

  // --- Confirmation State ---
  const [confirmationState, setConfirmationState] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
    isDangerous: boolean;
    confirmText?: string;
  }>({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => { },
    isDangerous: false,
  });

  const closeConfirmation = () => {
    setConfirmationState(prev => ({ ...prev, isOpen: false }));
  };

  const requestConfirmation = (
    title: string,
    message: string,
    onConfirm: () => void,
    isDangerous = false,
    confirmText = 'Confirm'
  ) => {
    setConfirmationState({
      isOpen: true,
      title,
      message,
      onConfirm,
      isDangerous,
      confirmText
    });
  };

  // --- Modal / UI State ---
  const [isFolderModalOpen, setIsFolderModalOpen] = useState(false);
  const [isAddSetModalOpen, setIsAddSetModalOpen] = useState(false);

  const [editingFolder, setEditingFolder] = useState<Folder | null>(null); // If set, we are editing
  const [folderFormName, setFolderFormName] = useState('');
  const [folderFormDesc, setFolderFormDesc] = useState('');
  const [folderFormTags, setFolderFormTags] = useState<string[]>([]);
  const [currentTagInput, setCurrentTagInput] = useState('');

  // --- Edit / Study State (hoisted so hooks are not called conditionally)
  const [editTitle, setEditTitle] = useState('');
  const [editDesc, setEditDesc] = useState('');
  const [editLocalCards, setEditLocalCards] = useState<Flashcard[]>([]);
  const [aiTopic, setAiTopic] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);



  // --- Data Loading ---
  useEffect(() => {
    const loadData = async () => {
      const [fetchedFolders, fetchedSets] = await Promise.all([
        getFolders(userId),
        getSets(userId)
      ]);

      // Hydrate folders with setIds based on set.folderId (relational mapping)
      const hydratedFolders = fetchedFolders.map(f => ({
        ...f,
        setIds: fetchedSets.filter(s => s.folderId === f.id).map(s => s.id)
      }));

      setFolders(hydratedFolders);
      setSets(fetchedSets);
    };
    loadData();
  }, [userId]);

  // --- Helpers ---
  const showNotification = (message: string) => {
    setNotification(message);
    setTimeout(() => setNotification(null), 3000);
  };

  const getUniqueTags = () => {
    const tags = new Set<string>();
    folders.forEach(f => f.tags.forEach(t => tags.add(t)));
    return Array.from(tags);
  };

  const activeFolder = folders.find(f => f.id === activeFolderId);
  const activeSet = sets.find(s => s.id === activeSetId);

  useEffect(() => {
    if (activeSet) {
      setEditTitle(activeSet.title);
      setEditDesc(activeSet.description);
      setEditLocalCards(activeSet.cards);
      setCurrentIndex(0);
      setIsFlipped(false);
    }
  }, [activeSet]);

  // --- Folder Management ---
  const handleOpenFolderModal = (folder?: Folder) => {
    if (folder) {
      setEditingFolder(folder);
      setFolderFormName(folder.name);
      setFolderFormDesc(folder.description);
      setFolderFormTags(folder.tags);
    } else {
      setEditingFolder(null);
      setFolderFormName('');
      setFolderFormDesc('');
      setFolderFormTags([]);
    }
    setIsFolderModalOpen(true);
  };

  const handleSaveFolder = async () => {
    if (!folderFormName.trim()) return;

    if (editingFolder) {
      // Edit
      const success = await updateFolder(editingFolder.id, {
        name: folderFormName,
        description: folderFormDesc
      });

      if (success) {
        setFolders(prev => prev.map(f => f.id === editingFolder.id ? {
          ...f,
          name: folderFormName,
          description: folderFormDesc,
          tags: folderFormTags // Tags not persisted to DB yet in this version
        } : f));
        showNotification('Folder updated successfully');
        setIsFolderModalOpen(false); // Close modal after edit
      }
    } else {
      // Create
      if (!checkLimit('folders', folders.length)) return;

      const newFolder = await createFolder(userId, folderFormName, folderFormDesc);
      if (newFolder) {
        setFolders(prev => [...prev, newFolder]);
        showNotification('Folder created successfully');
        setIsFolderModalOpen(false);
      } else {
        showNotification('Failed to create folder. Please try again.');
      }
    }
  };

  const handleDeleteFolder = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    requestConfirmation(
      'Delete Folder?',
      'Are you sure you want to delete this folder? The sets inside will not be deleted.',
      async () => {
        const success = await deleteFolder(id);
        if (success) {
          setFolders(prev => prev.filter(f => f.id !== id));
          if (activeFolderId === id) {
            setActiveFolderId(null);
            setViewMode('library');
          }
          showNotification('Folder deleted');
        }
      },
      true,
      'Delete'
    );
  };

  const handleAddTag = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && currentTagInput.trim()) {
      e.preventDefault();
      if (!folderFormTags.includes(currentTagInput.trim())) {
        setFolderFormTags([...folderFormTags, currentTagInput.trim()]);
      }
      setCurrentTagInput('');
    }
  };

  const removeTag = (tagToRemove: string) => {
    setFolderFormTags(prev => prev.filter(t => t !== tagToRemove));
  };

  // --- Set Management (Drag and Drop & Mobile Reorder) ---
  const handleDragStart = (e: React.DragEvent, index: number) => {
    e.dataTransfer.setData('text/plain', index.toString());
  };

  const handleDrop = (e: React.DragEvent, dropIndex: number) => {
    e.preventDefault();
    if (!activeFolder) return;
    const dragIndex = parseInt(e.dataTransfer.getData('text/plain'));
    if (dragIndex === dropIndex) return;

    const newSetIds = [...activeFolder.setIds];
    const [reorderedItem] = newSetIds.splice(dragIndex, 1);
    newSetIds.splice(dropIndex, 0, reorderedItem);

    setFolders(prev => prev.map(f => f.id === activeFolder.id ? { ...f, setIds: newSetIds } : f));
  };

  const handleMoveSet = (index: number, direction: 'up' | 'down', e: React.MouseEvent) => {
    e.stopPropagation();
    if (!activeFolder) return;
    const newSetIds = [...activeFolder.setIds];
    if (direction === 'up') {
      if (index === 0) return;
      [newSetIds[index - 1], newSetIds[index]] = [newSetIds[index], newSetIds[index - 1]];
    } else {
      if (index === newSetIds.length - 1) return;
      [newSetIds[index], newSetIds[index + 1]] = [newSetIds[index + 1], newSetIds[index]];
    }
    setFolders(prev => prev.map(f => f.id === activeFolder.id ? { ...f, setIds: newSetIds } : f));
  };

  const handleCreateSet = async () => {
    if (!checkLimit('flashcard_sets', sets.length)) return;

    const newSetData: Partial<FlashcardSet> = {
      title: 'Untitled Set',
      description: '',
      cards: []
    };
    const newSet = await createSet(userId, newSetData, activeFolderId || undefined);

    if (newSet) {
      setSets(prev => [...prev, newSet]);

      // If in a folder, add to folder locally (the DB link is established by createSet(..., folderId))
      if (activeFolderId) {
        setFolders(prev => prev.map(f => f.id === activeFolderId ? {
          ...f,
          setIds: [...f.setIds, newSet.id]
        } : f));
      }

      setActiveSetId(newSet.id);
      setViewMode('set-edit');
    }
  };

  const handleAddExistingSet = async (setId: string) => {
    if (!activeFolderId) return;
    // Check if already in folder
    const folder = folders.find(f => f.id === activeFolderId);
    if (folder?.setIds.includes(setId)) {
      showNotification('Set is already in this folder');
      return;
    }

    const success = await updateSet(setId, { folderId: activeFolderId });

    if (success) {
      setFolders(prev => prev.map(f => f.id === activeFolderId ? {
        ...f,
        setIds: [...f.setIds, setId]
      } : f));
      setIsAddSetModalOpen(false);
      showNotification('Set added to folder');
    }
  };

  const handleRemoveSetFromFolder = (setId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!activeFolderId) return;

    requestConfirmation(
      'Remove Set?',
      'Remove this set from the folder? (The set will not be deleted from your library)',
      async () => {
        // Set folderId to null to remove relation
        // We cast to any because Typescript might expect string | undefined, but DB needs null
        const success = await updateSet(setId, { folderId: null as any });

        if (success) {
          setFolders(prev => prev.map(f => f.id === activeFolderId ? {
            ...f,
            setIds: f.setIds.filter(id => id !== setId)
          } : f));
          showNotification('Set removed from folder');
        }
      },
      false, // Not dangerous, just removing reference
      'Remove'
    );
  };

  const handleDeleteSet = (setId: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    requestConfirmation(
      'Delete Set?',
      'Are you sure you want to permanently delete this flashcard set?',
      async () => {
        const success = await deleteSet(setId);
        if (success) {
          setSets(prev => prev.filter(s => s.id !== setId));
          // Remove from all folders
          setFolders(prev => prev.map(f => ({
            ...f,
            setIds: f.setIds.filter(id => id !== setId)
          })));
          if (activeSetId === setId) {
            setActiveSetId(null);
            setViewMode(activeFolderId ? 'folder' : 'library');
          }
          showNotification('Set deleted');
        }
      },
      true,
      'Delete'
    );
  };

  // --- Inner Components ---

  const LibraryView = () => {
    // 1. Filter Folders
    const filteredFolders = folders.filter(f => {
      const searchLower = searchQuery.toLowerCase();
      const matchesSearch = f.name.toLowerCase().includes(searchLower) ||
        f.description.toLowerCase().includes(searchLower);
      const matchesTag = selectedTag ? f.tags.includes(selectedTag) : true;
      return matchesSearch && matchesTag;
    });

    // 2. Filter Sets (Search in title AND description)
    const filteredSets = sets.filter(s => {
      if (!searchQuery) return true;
      const searchLower = searchQuery.toLowerCase();
      return s.title.toLowerCase().includes(searchLower) ||
        s.description.toLowerCase().includes(searchLower);
    });

    // 3. Determine sets to display
    const setsToDisplay = searchQuery
      ? filteredSets
      : [...sets].sort((a, b) => b.createdAt - a.createdAt).slice(0, 4);

    const setsTitle = searchQuery
      ? `Found ${setsToDisplay.length} Set${setsToDisplay.length !== 1 ? 's' : ''}`
      : "Recent Sets";

    return (
      <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
        {/* Tags Filter */}
        {getUniqueTags().length > 0 && (
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setSelectedTag(null)}
              className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all border border-transparent ${!selectedTag ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/20' : 'bg-white dark:bg-slate-800/50 text-slate-500 dark:text-slate-400 border-slate-200 dark:border-white/5 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-indigo-600 dark:hover:text-white'}`}
            >
              All
            </button>
            {getUniqueTags().map(tag => (
              <button
                key={tag}
                onClick={() => setSelectedTag(tag === selectedTag ? null : tag)}
                className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all border border-transparent ${selectedTag === tag ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/20' : 'bg-white dark:bg-slate-800/50 text-slate-500 dark:text-slate-400 border-slate-200 dark:border-white/5 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-indigo-600 dark:hover:text-white'}`}
              >
                {tag}
              </button>
            ))}
          </div>
        )}

        {/* Folders Grid */}
        <div>
          <h3 className="text-sm font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-4">Folders</h3>
          {filteredFolders.length === 0 ? (
            <div className="text-center py-8 text-slate-400 border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-xl">
              {searchQuery ? 'No folders match your search.' : 'No folders found. Create one to organize your sets!'}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredFolders.map(folder => (
                <div
                  key={folder.id}
                  onClick={() => { setActiveFolderId(folder.id); setViewMode('folder'); }}
                  className="bg-white/60 dark:bg-slate-800/50 backdrop-blur-xl p-6 rounded-3xl border border-slate-200 dark:border-white/5 hover:border-indigo-300 dark:hover:border-indigo-500/30 hover:shadow-2xl hover:shadow-indigo-500/10 transition-all cursor-pointer group relative hover:-translate-y-1 duration-300"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-gradient-to-tr from-indigo-500 to-purple-500 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-indigo-500/20 group-hover:scale-110 transition-transform duration-300">
                        <FolderIcon size={24} fill="currentColor" className="opacity-20 text-black dark:text-white" />
                        <FolderIcon size={24} className="absolute text-black dark:text-white" />
                      </div>
                      <div className="overflow-hidden">
                        <h4 className="font-bold text-slate-900 dark:text-white truncate max-w-[150px] text-lg">{folder.name}</h4>
                        <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">{folder.setIds.length} sets</p>
                      </div>
                    </div>
                    <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={(e) => { e.stopPropagation(); handleOpenFolderModal(folder); }}
                        className="p-2 text-slate-500 hover:text-indigo-600 dark:text-slate-400 dark:hover:text-white hover:bg-indigo-50 dark:hover:bg-white/10 rounded-lg transition-colors"
                      >
                        <Edit3 size={16} />
                      </button>
                      <button
                        onClick={(e) => handleDeleteFolder(folder.id, e)}
                        className="p-2 text-slate-500 hover:text-red-500 dark:text-slate-400 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg transition-colors"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                  {folder.description && (
                    <p className="text-sm text-slate-500 dark:text-slate-400 line-clamp-2 mb-4 leading-relaxed pl-1">{folder.description}</p>
                  )}
                  <div className="flex flex-wrap gap-2">
                    {folder.tags.map(tag => (
                      <span key={tag} className="px-2.5 py-1 bg-slate-100 dark:bg-white/5 text-slate-600 dark:text-slate-300 rounded-lg text-[10px] font-bold border border-slate-200 dark:border-white/5">
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Sets Section (Recent or Search Results) */}
        <div className="mt-8">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-sm font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">{setsTitle}</h3>
            {!searchQuery && sets.length > 4 && (
              <span className="text-xs text-slate-500 cursor-pointer hover:text-indigo-600 dark:hover:text-indigo-500">View all {sets.length} sets</span>
            )}
          </div>
          {setsToDisplay.length === 0 ? (
            <p className="text-slate-400 text-sm">
              {searchQuery ? 'No sets match your search.' : 'No flashcard sets yet.'}
            </p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {setsToDisplay.map(set => (
                <div
                  key={set.id}
                  onClick={() => { setActiveSetId(set.id); setViewMode('study'); }}
                  className="bg-white/60 dark:bg-slate-800/50 backdrop-blur-xl p-5 rounded-2xl border border-slate-200 dark:border-white/5 hover:bg-white dark:hover:bg-slate-800 transition-all cursor-pointer group hover:-translate-y-1 duration-300 hover:shadow-lg hover:shadow-black/5"
                >
                  <h4 className="font-bold text-slate-900 dark:text-white mb-1 truncate text-lg">{set.title}</h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mb-4 font-medium">{set.cards.length} terms</p>
                  {set.description && searchQuery && (
                    <p className="text-xs text-slate-500 mb-3 line-clamp-1">{set.description}</p>
                  )}
                  <div className="flex items-center gap-2 mt-auto justify-between border-t border-slate-100 dark:border-white/5 pt-3">
                    <div className="flex -space-x-2">

                    </div>
                    <button
                      onClick={(e) => handleDeleteSet(set.id, e)}
                      className="p-1.5 text-slate-400 hover:text-red-500 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                      title="Delete Set"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  };

  const FolderView = () => {
    if (!activeFolder) return null;

    // Get the actual set objects in the correct order
    const folderSets = activeFolder.setIds
      .map(id => sets.find(s => s.id === id))
      .filter((s): s is FlashcardSet => s !== undefined);

    return (
      <div className="space-y-8 animate-in slide-in-from-right-4">
        <div className="flex items-center gap-6 mb-8">
          <button onClick={() => { setActiveFolderId(null); setViewMode('library'); }} className="p-3 hover:bg-slate-100 dark:hover:bg-white/10 bg-white dark:bg-slate-800 text-slate-900 dark:text-white rounded-full transition-colors border border-slate-200 dark:border-white/5 shadow-sm">
            <ArrowLeft size={24} />
          </button>
          <div className="flex-1">
            <div className="flex items-center gap-4 mb-2">
              <h2 className="text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight">{activeFolder.name}</h2>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleOpenFolderModal(activeFolder)}
                  className="p-2 bg-white dark:bg-slate-800 text-slate-500 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-white hover:bg-indigo-50 dark:hover:bg-white/10 rounded-xl transition-colors border border-slate-200 dark:border-white/5 shadow-sm"
                  title="Edit Folder"
                >
                  <Edit3 size={20} />
                </button>
                <button
                  onClick={(e) => handleDeleteFolder(activeFolder.id, e)}
                  className="p-2 text-slate-500 bg-white dark:bg-slate-800 hover:text-red-500 dark:text-slate-400 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-xl transition-colors border border-slate-200 dark:border-white/5 shadow-sm"
                  title="Delete Folder"
                >
                  <Trash2 size={20} />
                </button>
              </div>
            </div>
            <p className="text-slate-500 dark:text-slate-400 text-lg">{activeFolder.description}</p>
            <div className="flex gap-2 mt-4">
              {activeFolder.tags.map(tag => (
                <span key={tag} className="px-3 py-1 bg-indigo-50 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-300 rounded-lg text-xs font-bold border border-indigo-100 dark:border-indigo-500/30">
                  #{tag}
                </span>
              ))}
            </div>
          </div>
        </div>

        <div className="flex justify-between items-center flex-wrap gap-4 border-b border-slate-200 dark:border-white/5 pb-4">
          <h3 className="font-bold text-slate-900 dark:text-white text-xl">{folderSets.length} Sets</h3>
          <div className="flex gap-3">
            <button
              onClick={() => setIsAddSetModalOpen(true)}
              className="flex items-center gap-2 px-6 py-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-white/5 text-slate-900 dark:text-white rounded-2xl font-bold hover:bg-slate-50 dark:hover:bg-slate-700 transition-all shadow-lg shadow-black/5 dark:shadow-black/20"
            >
              <PlusCircle size={18} /> Add Existing
            </button>
            <button
              onClick={handleCreateSet}
              className="flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-2xl font-bold hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-600/20"
            >
              <Plus size={18} /> Create New
            </button>
          </div>
        </div>

        <div className="space-y-4">
          {folderSets.length === 0 && (
            <div className="text-center py-16 bg-slate-50 dark:bg-slate-800/30 rounded-3xl border border-dashed border-slate-200 dark:border-slate-700 text-slate-400 dark:text-slate-500">
              <Layers size={48} className="mx-auto mb-4 opacity-30" />
              <p className="text-lg font-medium">This folder is empty.</p>
              <button onClick={() => setIsAddSetModalOpen(true)} className="text-indigo-600 dark:text-indigo-400 font-bold mt-2 hover:underline">Add a set now</button>
            </div>
          )}
          {folderSets.map((set, index) => (
            <div
              key={set.id}
              draggable
              onDragStart={(e) => handleDragStart(e, index)}
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => handleDrop(e, index)}
              onClick={() => { setActiveSetId(set.id); setViewMode('study'); }}
              className="group flex items-center justify-between bg-white/60 dark:bg-slate-800/50 backdrop-blur-md p-6 rounded-2xl border border-slate-200 dark:border-white/5 hover:bg-white dark:hover:bg-slate-800 transition-all cursor-pointer shadow-sm hover:shadow-xl hover:shadow-black/5 dark:hover:shadow-black/20"
            >
              <div className="flex items-center gap-6">
                <div className="flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={(e) => handleMoveSet(index, 'up', e)}
                    disabled={index === 0}
                    className="text-slate-500 hover:text-slate-900 dark:text-slate-500 dark:hover:text-white disabled:opacity-30 p-1"
                  >
                    <ChevronUp size={20} />
                  </button>
                  <button
                    onClick={(e) => handleMoveSet(index, 'down', e)}
                    disabled={index === folderSets.length - 1}
                    className="text-slate-500 hover:text-slate-900 dark:text-slate-500 dark:hover:text-white disabled:opacity-30 p-1"
                  >
                    <ChevronDown size={20} />
                  </button>
                </div>
                <div className="hidden md:block cursor-grab active:cursor-grabbing text-slate-500 hover:text-slate-600 dark:text-slate-600 dark:hover:text-slate-400 p-2">
                  <GripVertical size={24} />
                </div>
                <div>
                  <h4 className="font-bold text-slate-900 dark:text-white text-lg">{set.title}</h4>
                  <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">{set.cards.length} terms</p>
                </div>
              </div>
              <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                  onClick={(e) => { e.stopPropagation(); setActiveSetId(set.id); setViewMode('set-edit'); }}
                  className="p-2 hover:bg-indigo-50 dark:hover:bg-white/10 bg-slate-100 dark:bg-slate-900/50 text-slate-500 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-white rounded-lg transition-colors border border-slate-200 dark:border-white/5"
                  title="Edit Set"
                >
                  <Edit3 size={20} />
                </button>
                <button
                  onClick={(e) => handleRemoveSetFromFolder(set.id, e)}
                  className="p-2 hover:bg-orange-50 dark:hover:bg-orange-500/20 bg-slate-100 dark:bg-slate-900/50 text-slate-500 dark:text-slate-400 hover:text-orange-500 dark:hover:text-orange-400 rounded-lg transition-colors border border-slate-200 dark:border-white/5"
                  title="Remove from Folder"
                >
                  <X size={20} />
                </button>
                <button
                  onClick={(e) => handleDeleteSet(set.id, e)}
                  className="p-2 hover:bg-red-50 dark:hover:bg-red-500/20 bg-slate-100 dark:bg-slate-900/50 text-slate-500 dark:text-slate-400 hover:text-red-500 dark:hover:text-red-400 rounded-lg transition-colors border border-slate-200 dark:border-white/5"
                  title="Delete Set"
                >
                  <Trash2 size={20} />
                </button>
              </div>
            </div>
          ))}
        </div >
      </div >
    );
  };

  const SetEditView = () => {
    if (!activeSet) return null;

    const handleSaveSet = async () => {
      const updatedSet = { ...activeSet, title: editTitle, description: editDesc, cards: editLocalCards };

      const success = await updateSet(activeSet.id, {
        title: editTitle,
        description: editDesc,
        cards: editLocalCards
      });

      if (success) {
        setSets(prev => prev.map(s => s.id === activeSet.id ? updatedSet : s));
        showNotification('Set saved successfully');
        setViewMode(activeFolderId ? 'folder' : 'library');
      }
    };

    const handleGenerate = async () => {
      if (!aiTopic) return;
      setIsGenerating(true);
      const newCards = await generateFlashcards(aiTopic);
      setEditLocalCards(prev => [...prev, ...newCards]);
      setIsGenerating(false);
      setAiTopic('');
    };

    const addCard = () => {
      setEditLocalCards([...editLocalCards, { id: `card-${Date.now()}`, front: '', back: '', mastered: false }]);
    };

    const updateCard = (index: number, field: 'front' | 'back', value: string) => {
      const updated = [...editLocalCards];
      updated[index] = { ...updated[index], [field]: value };
      setEditLocalCards(updated);
    };

    const removeCard = (index: number) => {
      setEditLocalCards(editLocalCards.filter((_, i) => i !== index));
    };

    return (
      <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4">
        <div className="flex items-center justify-between sticky top-0 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md py-4 z-10 border-b border-slate-200 dark:border-white/5 -mx-4 px-4 md:mx-0 md:px-0 transition-colors">
          <div className="flex items-center gap-4">
            <button onClick={() => setViewMode(activeFolderId ? 'folder' : 'library')} className="p-3 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 rounded-full border border-slate-200 dark:border-white/5 transition-colors">
              <ArrowLeft size={24} className="text-slate-900 dark:text-white" />
            </button>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white">Edit Set</h2>
          </div>
          <button onClick={handleSaveSet} className="bg-indigo-600 text-white px-6 py-3 rounded-xl font-bold hover:bg-indigo-700 flex items-center gap-2 shadow-lg shadow-indigo-600/20 transition-all active:scale-95">
            <Save size={18} /> Done
          </button>
        </div>

        <div className="bg-white/60 dark:bg-slate-800/50 backdrop-blur-xl p-8 rounded-3xl shadow-lg border border-slate-200 dark:border-white/5 space-y-6 transition-colors">
          <div>
            <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2 block">Title</label>
            <input type="text" value={editTitle} onChange={(e) => setEditTitle(e.target.value)} className="w-full text-3xl font-bold bg-transparent border-b-2 border-slate-200 dark:border-white/10 focus:border-indigo-500 outline-none py-2 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-600 transition-colors" placeholder="Enter title (e.g., Biology 101)" />
          </div>
          <div>
            <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2 block">Description</label>
            <input type="text" value={editDesc} onChange={(e) => setEditDesc(e.target.value)} className="w-full bg-transparent border-b border-slate-200 dark:border-white/10 focus:border-indigo-500 outline-none py-2 text-slate-600 dark:text-slate-300 placeholder:text-slate-400 dark:placeholder:text-slate-600 transition-colors" placeholder="Add a description..." />
          </div>
        </div>

        {/* AI Generator */}
        <div className="bg-gradient-to-r from-violet-600 to-indigo-600 rounded-3xl p-8 text-white shadow-2xl shadow-indigo-500/20 flex flex-col md:flex-row items-center gap-6 border border-white/10 relative overflow-hidden group">
          <div className="absolute inset-0 bg-white/5 opacity-0 group-hover:opacity-100 transition-opacity" />
          <div className="p-4 bg-white/10 rounded-2xl backdrop-blur-sm shadow-inner hidden md:block">
            <Wand2 size={32} className="text-indigo-200" />
          </div>
          <div className="flex-1 z-10 text-center md:text-left">
            <h3 className="font-bold text-2xl mb-1">AI Quick Add</h3>
            <p className="text-indigo-200">Generate cards instantly by topic.</p>
          </div>
          <div className="flex gap-3 w-full md:w-auto z-10">
            <input type="text" value={aiTopic} onChange={(e) => setAiTopic(e.target.value)} placeholder="e.g. Photosynthesis" className="px-5 py-3 rounded-xl bg-white/10 text-white placeholder:text-indigo-200/50 outline-none w-full md:w-64 border border-white/10 focus:bg-white/20 transition-all font-medium" />
            <button onClick={handleGenerate} disabled={isGenerating || !aiTopic} className="bg-white text-indigo-600 px-6 py-3 rounded-xl font-bold hover:bg-indigo-50 disabled:opacity-50 shadow-lg shadow-black/10 transition-all active:scale-95 flex items-center justify-center min-w-[100px]">
              {isGenerating ? <Loader2 className="animate-spin" /> : 'Generate'}
            </button>
          </div>
        </div>

        {/* Cards List */}
        <div className="space-y-6">
          {editLocalCards.map((card, idx) => (
            <div key={card.id} className="bg-white/60 dark:bg-slate-800/50 backdrop-blur-md p-8 rounded-3xl shadow-sm border border-slate-200 dark:border-white/5 relative group hover:border-indigo-200 dark:hover:border-white/10 transition-colors">
              <div className="absolute top-6 left-6 text-slate-300 dark:text-slate-500 font-bold text-xl opacity-50">#{idx + 1}</div>
              <button onClick={() => removeCard(idx)} className="absolute top-6 right-6 p-2 bg-slate-100 dark:bg-slate-900/50 text-slate-400 hover:text-red-500 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-xl transition-all opacity-0 group-hover:opacity-100">
                <Trash2 size={20} />
              </button>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-8">
                <div>
                  <label className="block text-xs font-bold text-slate-400 dark:text-slate-400 uppercase tracking-wider mb-3">Term</label>
                  <textarea rows={3} value={card.front} onChange={(e) => updateCard(idx, 'front', e.target.value)} className="w-full bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-white/5 rounded-2xl p-4 resize-none outline-none focus:ring-2 focus:ring-indigo-500/50 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-600 transition-all" placeholder="Enter term..." />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-400 dark:text-slate-400 uppercase tracking-wider mb-3">Definition</label>
                  <div className="relative">
                    <textarea rows={3} value={card.back} onChange={(e) => updateCard(idx, 'back', e.target.value)} className="w-full bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-white/5 rounded-2xl p-4 resize-none outline-none focus:ring-2 focus:ring-indigo-500/50 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-600 transition-all" placeholder="Enter definition..." />
                    <button
                      onClick={async () => {
                        if (!card.front) return;
                        const ans = await generateCardAnswer(card.front);
                        updateCard(idx, 'back', ans);
                      }}
                      className="absolute right-3 bottom-3 bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-100 dark:hover:bg-indigo-500/20 p-2 rounded-xl transition-colors border border-indigo-100 dark:border-indigo-500/20"
                      title="Auto-Complete Definition"
                    >
                      <Wand2 size={16} />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        <button onClick={addCard} className="w-full py-6 bg-slate-50 dark:bg-slate-800/30 border-2 border-dashed border-slate-200 dark:border-slate-700 text-slate-400 dark:text-slate-400 font-bold rounded-3xl hover:border-indigo-500 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-500/5 transition-all flex items-center justify-center gap-3 text-lg group">
          <div className="p-2 bg-white dark:bg-slate-800 rounded-full group-hover:bg-indigo-100 dark:group-hover:bg-indigo-500/20 transition-colors shadow-sm">
            <Plus size={24} />
          </div>
          Add Card
        </button>

        <div className="flex justify-center mt-12 pb-12">
          <button
            onClick={(e) => handleDeleteSet(activeSet.id, e)}
            className="text-red-500 dark:text-red-400 bg-red-50 dark:bg-slate-800/50 hover:bg-red-100 dark:hover:bg-red-500/10 hover:text-red-600 dark:hover:text-red-300 font-bold flex items-center gap-3 px-6 py-3 rounded-xl transition-all border border-transparent dark:hover:border-red-500/20"
          >
            <Trash2 size={18} /> Delete Set
          </button>
        </div>
      </div>
    );
  };

  const StudyView = () => {
    if (!activeSet) return null;
    const cards = activeSet.cards;

    if (cards.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center h-96 text-center border-2 border-dashed border-white/5 rounded-3xl bg-slate-800/30">
          <p className="text-slate-400 mb-4 font-medium">This set has no cards yet.</p>
          <button onClick={() => setViewMode('set-edit')} className="text-indigo-400 font-bold hover:text-indigo-300">Add Cards</button>
        </div>
      );
    }

    const handleNext = () => {
      setIsFlipped(false);
      setTimeout(() => setCurrentIndex((prev) => (prev + 1) % cards.length), 200);
    };

    const handlePrev = () => {
      setIsFlipped(false);
      setTimeout(() => setCurrentIndex((prev) => (prev - 1 + cards.length) % cards.length), 200);
    };

    return (
      <div className="max-w-4xl mx-auto h-[calc(100vh-100px)] flex flex-col pb-6">
        <div className="flex items-center gap-6 mb-8">
          <button onClick={() => setViewMode(activeFolderId ? 'folder' : 'library')} className=" p-3 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-full transition-colors border border-slate-200 dark:border-white/5 shadow-sm">
            <ArrowLeft size={24} className="text-slate-900 dark:text-white" />
          </button>
          <div className="flex-1">
            <h2 className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">{activeSet.title}</h2>
            <div className="flex items-center gap-3 mt-2">
              <span className="bg-indigo-50 dark:bg-slate-800 text-indigo-600 dark:text-slate-300 px-3 py-1 rounded-lg text-xs font-bold border border-indigo-100 dark:border-white/5">
                {currentIndex + 1} / {cards.length}
              </span>
              <span className="text-slate-500 dark:text-slate-500 text-sm">Tap card to flip</span>
            </div>
          </div>
          <button onClick={() => setViewMode('set-edit')} className="p-3 bg-white dark:bg-slate-800 text-slate-400 hover:text-indigo-600 dark:hover:text-white hover:bg-indigo-50 dark:hover:bg-white/10 rounded-full transition-colors border border-slate-200 dark:border-white/5 shadow-sm">
            <Edit3 size={20} />
          </button>
        </div>

        <div className="flex-1 flex flex-col justify-center perspective-1000 w-full max-w-2xl mx-auto">
          <div
            className="relative w-full aspect-[3/2] cursor-pointer group perspective-1000"
            onClick={() => setIsFlipped(!isFlipped)}
            style={{ perspective: '1000px' }}
          >
            <div
              className={`w-full h-full relative transition-all duration-500 transform-style-3d ${isFlipped ? 'rotate-y-180' : ''}`}
              style={{ transformStyle: 'preserve-3d' }}
            >

              {/* Front */}
              <div
                className="absolute inset-0 bg-gradient-to-br from-white to-slate-50 dark:from-slate-800 dark:to-slate-900/90 backdrop-blur-xl rounded-[2.5rem] p-12 flex flex-col items-center justify-center border border-slate-200 dark:border-white/10 shadow-xl dark:shadow-2xl backface-hidden group-hover:border-indigo-300 dark:group-hover:border-indigo-500/30 transition-colors"
                style={{ backfaceVisibility: 'hidden' }}
              >
                <span className="absolute top-8 left-8 text-xs font-bold text-indigo-500 dark:text-indigo-400 uppercase tracking-widest border border-indigo-500/20 px-3 py-1 rounded-full">Term</span>
                <p className="text-4xl text-slate-900 dark:text-white font-medium text-center leading-relaxed select-none">{cards[currentIndex].front}</p>
                <div className="absolute bottom-8 right-8 text-slate-400 dark:text-slate-500 text-sm flex items-center gap-2 opacity-50">
                  <RotateCw size={16} /> Tap to flip
                </div>
              </div>

              {/* Back */}
              <div
                className="absolute inset-0 bg-gradient-to-tr from-indigo-50 to-white dark:from-indigo-900/50 dark:to-slate-900 backdrop-blur-xl rounded-[2.5rem] p-12 flex flex-col items-center justify-center border border-indigo-100 dark:border-indigo-500/20 shadow-xl dark:shadow-2xl backface-hidden rotate-y-180"
                style={{ backfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }}
              >
                <span className="absolute top-8 left-8 text-xs font-bold text-teal-600 dark:text-teal-400 uppercase tracking-widest border border-teal-500/20 px-3 py-1 rounded-full">Definition</span>
                <p className="text-2xl text-slate-700 dark:text-slate-200 text-center leading-relaxed select-none">{cards[currentIndex].back}</p>
                <div className="absolute bottom-8 right-8 text-slate-400 dark:text-slate-500 text-sm flex items-center gap-2 opacity-50">
                  <RotateCw size={16} /> Tap to flip back
                </div>
              </div>

            </div>
          </div>

          <div className="flex justify-center items-center gap-8 mt-12">
            <button
              onClick={handlePrev}
              className="p-6 bg-white dark:bg-slate-800/80 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-900 dark:text-white rounded-full transition-all hover:-translate-x-1 shadow-lg border border-slate-200 dark:border-white/5 disabled:opacity-50"
            >
              <ChevronLeft size={32} />
            </button>

            <div className="flex flex-col items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500">Navigation</span>
              <div className="flex gap-2">
                <div className="w-2 h-2 rounded-full bg-slate-200 dark:bg-slate-600"></div>
                <div className="w-2 h-2 rounded-full bg-slate-200 dark:bg-slate-600"></div>
                <div className="w-2 h-2 rounded-full bg-indigo-500 scale-125"></div>
                <div className="w-2 h-2 rounded-full bg-slate-200 dark:bg-slate-600"></div>
                <div className="w-2 h-2 rounded-full bg-slate-200 dark:bg-slate-600"></div>
              </div>
            </div>

            <button
              onClick={handleNext}
              className="p-6 bg-indigo-600 hover:bg-indigo-500 text-white rounded-full transition-all hover:translate-x-1 shadow-lg shadow-indigo-600/30 disabled:opacity-50"
            >
              <ChevronRight size={32} />
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="p-6 min-h-screen relative pb-32 animate-in fade-in duration-500">
      {/* Toast Notification */}
      {notification && (
        <div className="fixed top-6 right-6 z-50 bg-slate-900 text-white px-6 py-4 rounded-2xl shadow-2xl border border-white/10 animate-in slide-in-from-right fade-in flex items-center gap-3 font-bold">
          <CheckCircle size={20} className="text-emerald-400" />
          {notification}
        </div>
      )}

      {/* Add Existing Set Modal */}
      {isAddSetModalOpen && activeFolderId && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-md animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 w-full max-w-md rounded-3xl p-8 shadow-2xl border border-slate-200 dark:border-white/10 max-h-[80vh] flex flex-col transition-colors">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-2xl font-bold text-slate-900 dark:text-white">Add Set to Folder</h3>
              <button onClick={() => setIsAddSetModalOpen(false)} className="text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors bg-slate-100 dark:bg-white/5 p-2 rounded-full hover:bg-slate-200 dark:hover:bg-white/10"><X size={20} /></button>
            </div>
            <p className="text-sm text-slate-500 dark:text-slate-400 mb-6 leading-relaxed">Select a flashcard set to add to <strong className="text-slate-900 dark:text-white">{activeFolder?.name}</strong>.</p>

            <div className="flex-1 overflow-y-auto space-y-2 pr-2 custom-scrollbar">
              {sets.filter(s => activeFolder && !activeFolder.setIds.includes(s.id)).length === 0 ? (
                <div className="text-center py-12 text-slate-400 dark:text-slate-500 border border-dashed border-slate-200 dark:border-white/5 rounded-2xl bg-slate-50 dark:bg-slate-800/30">
                  <p>No available sets found.</p>
                  <button onClick={() => { setIsAddSetModalOpen(false); handleCreateSet(); }} className="text-indigo-600 dark:text-indigo-400 font-bold mt-2 hover:text-indigo-500 dark:hover:text-indigo-300">Create New Set</button>
                </div>
              ) : (
                sets.filter(s => activeFolder && !activeFolder.setIds.includes(s.id)).map(set => (
                  <div
                    key={set.id}
                    onClick={() => handleAddExistingSet(set.id)}
                    className="flex items-center justify-between p-4 rounded-xl border border-slate-200 dark:border-white/5 bg-slate-50 dark:bg-slate-800/50 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer group transition-colors"
                  >
                    <div>
                      <h4 className="font-bold text-slate-900 dark:text-white">{set.title}</h4>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">{set.cards.length} cards</p>
                    </div>
                    <PlusCircle size={20} className="text-indigo-500 dark:text-indigo-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Modal */}
      <ConfirmationModal
        isOpen={confirmationState.isOpen}
        onClose={closeConfirmation}
        onConfirm={confirmationState.onConfirm}
        title={confirmationState.title}
        message={confirmationState.message}
        isDangerous={confirmationState.isDangerous}
        confirmText={confirmationState.confirmText}
      />

      {/* Folder Modal */}
      {isFolderModalOpen && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-md animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 w-full max-w-md rounded-3xl p-8 shadow-2xl border border-slate-200 dark:border-white/10 transition-colors">
            <div className="flex justify-between items-center mb-8">
              <h3 className="text-2xl font-bold text-slate-900 dark:text-white">{editingFolder ? 'Edit Folder' : 'Create New Folder'}</h3>
              <button onClick={() => setIsFolderModalOpen(false)} className="text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors bg-slate-100 dark:bg-white/5 p-2 rounded-full hover:bg-slate-200 dark:hover:bg-white/10"><X size={20} /></button>
            </div>

            <div className="space-y-6">
              <div>
                <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">Folder Name</label>
                <input type="text" value={folderFormName} onChange={(e) => setFolderFormName(e.target.value)} className="w-full px-5 py-4 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-slate-800/50 outline-none focus:ring-2 focus:ring-indigo-500/50 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-600 transition-all font-medium" placeholder="e.g., Biology 101" autoFocus />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">Description (Optional)</label>
                <textarea value={folderFormDesc} onChange={(e) => setFolderFormDesc(e.target.value)} className="w-full px-5 py-4 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-slate-800/50 outline-none focus:ring-2 focus:ring-indigo-500/50 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-600 resize-none transition-all" rows={3} placeholder="What's this folder for?" />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">Tags</label>
                <div className="flex flex-wrap gap-2 mb-3">
                  {folderFormTags.map(tag => (
                    <span key={tag} className="px-3 py-1 bg-indigo-50 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-300 rounded-lg text-xs font-bold flex items-center gap-1 border border-indigo-100 dark:border-indigo-500/30">
                      {tag} <button onClick={() => removeTag(tag)} className="hover:text-indigo-900 dark:hover:text-white"><X size={12} /></button>
                    </span>
                  ))}
                </div>
                <div className="relative">
                  <Tag className="absolute left-4 mt-[1px] top-1/2 -translate-y-1/2 text-slate-500 dark:text-slate-500" size={16} />
                  <input type="text" value={currentTagInput} onChange={(e) => setCurrentTagInput(e.target.value)} onKeyDown={handleAddTag} className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-slate-800/50 outline-none focus:ring-2 focus:ring-indigo-500/50 text-slate-900 dark:text-white text-sm placeholder:text-slate-400 dark:placeholder:text-slate-600" placeholder="Type tag & press Enter" />
                </div>
              </div>
              <button onClick={handleSaveFolder} disabled={!folderFormName.trim()} className="w-full py-4 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-500 disabled:opacity-50 mt-2 shadow-lg shadow-indigo-600/20 transition-all active:scale-95">
                {editingFolder ? 'Save Changes' : 'Create Folder'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main View Router */}
      {viewMode === 'library' && (
        <>
          <div className="flex flex-col md:flex-row gap-6 justify-between items-start md:items-center mb-10">
            <div className="relative w-full md:w-96 group">
              <Search className="absolute left-4 mt-[1px] top-1/2 -translate-y-1/2 text-slate-500 dark:text-slate-500 group-hover:text-indigo-500 dark:group-hover:text-indigo-400 transition-colors" size={20} />
              <input
                id="search-flashcard-input"
                type="text"
                placeholder="Search folders and sets..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                autoComplete="off"
                spellCheck="false"
                className="w-full pl-12 pr-4 py-3 rounded-2xl border border-slate-200 dark:border-white/10 bg-white/60 dark:bg-slate-800/50 outline-none focus:ring-2 focus:ring-indigo-500/50 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 shadow-sm transition-all focus:bg-white dark:focus:bg-slate-800"
              />
            </div>
            <div className="flex gap-3 w-full md:w-auto">
              <button
                onClick={() => handleOpenFolderModal()}
                className="flex-1 md:flex-none flex items-center justify-center gap-2 px-6 py-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-white/5 rounded-xl font-bold text-slate-900 dark:text-white hover:bg-slate-50 dark:hover:bg-slate-700 transition-all shadow-sm active:scale-95"
              >
                <FolderIcon size={18} /> New Folder
              </button>
              <button
                onClick={handleCreateSet}
                className="flex-1 md:flex-none flex items-center justify-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-500 transition-all shadow-lg shadow-indigo-600/20 active:scale-95"
              >
                <Plus size={18} /> New Set
              </button>
            </div>
          </div>
          <LibraryView />
        </>
      )}
      {viewMode === 'folder' && FolderView()}
      {viewMode === 'set-edit' && SetEditView()}
      {viewMode === 'study' && StudyView()}
    </div>
  );
};

export default Flashcards;
