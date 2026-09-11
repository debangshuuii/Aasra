import React, { useState, useEffect } from 'react';
import { ChatSession } from '../types';
import {
  isPinConfigured,
  setupChatPin,
  verifyEnteredPin,
  loadDecryptedSessions,
  saveEncryptedSessions,
  changeChatPin,
  clearAllChatHistory,
  formatSessionDateTime,
  autoGenerateTitle,
  getActiveSessionPin,
  setActiveSessionPin
} from '../utils/chatStorage';
import { stripMarkdown } from './MarkdownRenderer';
import {
  Lock,
  Unlock,
  KeyRound,
  ShieldCheck,
  X,
  Calendar,
  Clock,
  Trash2,
  Edit3,
  Check,
  AlertTriangle,
  MessageSquare,
  ArrowRight,
  Eye,
  EyeOff,
  PlusCircle,
  HelpCircle,
  Sparkles,
  Info
} from 'lucide-react';

interface ChatHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  activeSession: ChatSession;
  onSelectSession: (session: ChatSession) => void;
  onNewChat: () => void;
}

type ModalView = 'loading' | 'setup' | 'unlock' | 'list' | 'change_pin' | 'delete_all_confirm';

export const ChatHistoryModal: React.FC<ChatHistoryModalProps> = ({
  isOpen,
  onClose,
  activeSession,
  onSelectSession,
  onNewChat
}) => {
  const [currentView, setCurrentView] = useState<ModalView>('loading');
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [activePin, setActivePin] = useState<string>(''); // Kept in memory only during the active modal session

  // Inputs
  const [setupPin, setSetupPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [unlockPin, setUnlockPin] = useState('');

  // Change PIN inputs
  const [currentPinInput, setCurrentPinInput] = useState('');
  const [newPinInput, setNewPinInput] = useState('');
  const [confirmNewPinInput, setConfirmNewPinInput] = useState('');

  // UI state
  const [showPin, setShowPin] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deleteSessionId, setDeleteSessionId] = useState<string | null>(null);
  const [editingTitleId, setEditingTitleId] = useState<string | null>(null);
  const [editingTitleText, setEditingTitleText] = useState('');
  const [alsoResetPinOnDelete, setAlsoResetPinOnDelete] = useState(false);

  // Initialize or check auth state when modal opens
  useEffect(() => {
    if (!isOpen) {
      // Reset sensitive input states on close
      setUnlockPin('');
      setErrorMessage(null);
      setSuccessMessage(null);
      return;
    }

    const configured = isPinConfigured();
    const cachedPin = activePin || getActiveSessionPin();

    if (!configured) {
      setCurrentView('setup');
      setSetupPin('');
      setConfirmPin('');
      setErrorMessage(null);
    } else if (cachedPin) {
      // Already unlocked in memory / sessionStorage during this tab session
      setActivePin(cachedPin);
      loadSessionsWithPin(cachedPin);
    } else {
      setCurrentView('unlock');
      setUnlockPin('');
      setErrorMessage(null);
    }
  }, [isOpen]);

  const loadSessionsWithPin = async (pin: string) => {
    setIsSubmitting(true);
    setErrorMessage(null);
    try {
      let loaded = await loadDecryptedSessions(pin);

      // Ensure the currently active session is synced/included in the list if it has user messages
      const hasUserMessages = activeSession.messages.some(m => m.sender === 'user');
      if (hasUserMessages) {
        const existingIdx = loaded.findIndex(s => s.id === activeSession.id);
        const activeTitle = activeSession.title === 'New Consultation'
          ? autoGenerateTitle(activeSession.messages)
          : activeSession.title;

        const updatedActive = {
          ...activeSession,
          title: activeTitle,
          updatedAt: Date.now()
        };

        if (existingIdx >= 0) {
          loaded[existingIdx] = updatedActive;
        } else {
          loaded = [updatedActive, ...loaded];
        }

        // Persist synced sessions
        await saveEncryptedSessions(loaded, pin);
      }

      setSessions(loaded);
      setActivePin(pin);
      setActiveSessionPin(pin);
      setCurrentView('list');
    } catch (err: any) {
      console.error(err);
      setErrorMessage(err?.message || 'Could not decrypt chat history. Please verify your PIN.');
      setCurrentView('unlock');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handler: First-time PIN setup
  const handleSetupSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (setupPin.length < 4) {
      setErrorMessage('PIN must be at least 4 digits or characters.');
      return;
    }

    if (setupPin !== confirmPin) {
      setErrorMessage('PINs do not match. Please re-enter.');
      return;
    }

    setIsSubmitting(true);
    try {
      // Include active session if it has messages
      const initialSessions: ChatSession[] = [];
      const hasUserMessages = activeSession.messages.some(m => m.sender === 'user');
      if (hasUserMessages) {
        initialSessions.push({
          ...activeSession,
          title: activeSession.title === 'New Consultation' ? autoGenerateTitle(activeSession.messages) : activeSession.title,
          updatedAt: Date.now()
        });
      }

      const res = await setupChatPin(setupPin, initialSessions);
      if (!res.success) {
        setErrorMessage(res.error || 'Failed to initialize PIN.');
        return;
      }

      setActivePin(setupPin);
      setActiveSessionPin(setupPin);
      setSessions(initialSessions);
      setSuccessMessage('PIN configured successfully! Your conversations are now protected.');
      setTimeout(() => {
        setSuccessMessage(null);
        setCurrentView('list');
      }, 900);
    } catch (err: any) {
      setErrorMessage(err?.message || 'Failed to setup PIN.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handler: PIN Unlock
  const handleUnlockSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!unlockPin) {
      setErrorMessage('Please enter your PIN.');
      return;
    }

    setIsSubmitting(true);
    try {
      const isValid = await verifyEnteredPin(unlockPin);
      if (!isValid) {
        setErrorMessage('Incorrect PIN. Please check your credentials and try again.');
        setIsSubmitting(false);
        return;
      }

      await loadSessionsWithPin(unlockPin);
    } catch (err: any) {
      setErrorMessage(err?.message || 'Failed to verify PIN.');
      setIsSubmitting(false);
    }
  };

  // Handler: Change PIN
  const handleChangePinSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    if (newPinInput.length < 4) {
      setErrorMessage('New PIN must be at least 4 characters or digits.');
      return;
    }

    if (newPinInput !== confirmNewPinInput) {
      setErrorMessage('New PIN and confirmation do not match.');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await changeChatPin(currentPinInput, newPinInput);
      if (!res.success) {
        setErrorMessage(res.error || 'Failed to update PIN.');
        setIsSubmitting(false);
        return;
      }

      setActivePin(newPinInput);
      setActiveSessionPin(newPinInput);
      setSuccessMessage('PIN changed successfully.');
      setCurrentPinInput('');
      setNewPinInput('');
      setConfirmNewPinInput('');

      setTimeout(() => {
        setSuccessMessage(null);
        setCurrentView('list');
      }, 1000);
    } catch (err: any) {
      setErrorMessage(err?.message || 'Failed to change PIN.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handler: Delete single conversation
  const handleDeleteSession = async (sessionId: string) => {
    if (!activePin) return;
    try {
      const updated = sessions.filter(s => s.id !== sessionId);
      await saveEncryptedSessions(updated, activePin);
      setSessions(updated);
      setDeleteSessionId(null);

      // If active session was deleted, start a new chat
      if (activeSession.id === sessionId) {
        onNewChat();
      }
    } catch (err: any) {
      setErrorMessage('Failed to delete conversation: ' + err?.message);
    }
  };

  // Handler: Save custom title edit
  const handleSaveTitleEdit = async (sessionId: string) => {
    if (!activePin || !editingTitleText.trim()) {
      setEditingTitleId(null);
      return;
    }

    try {
      const updated = sessions.map(s => {
        if (s.id === sessionId) {
          return { ...s, title: editingTitleText.trim() };
        }
        return s;
      });

      await saveEncryptedSessions(updated, activePin);
      setSessions(updated);
      setEditingTitleId(null);

      // If the currently active session was renamed, update it
      if (activeSession.id === sessionId) {
        activeSession.title = editingTitleText.trim();
      }
    } catch (err: any) {
      setErrorMessage('Failed to update title: ' + err?.message);
    }
  };

  // Handler: Delete All History
  const handleConfirmDeleteAll = () => {
    clearAllChatHistory(alsoResetPinOnDelete);
    setSessions([]);
    setActivePin('');
    setActiveSessionPin(null);
    onNewChat();

    if (alsoResetPinOnDelete) {
      setCurrentView('setup');
      setSetupPin('');
      setConfirmPin('');
    } else {
      setCurrentView('list');
    }
    setSuccessMessage('All chat history has been permanently deleted from this browser.');
    setTimeout(() => setSuccessMessage(null), 2500);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-150">
      <div
        className="bg-white w-full max-w-2xl rounded-3xl border border-gray-200 shadow-2xl overflow-hidden my-6 flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-150"
        role="dialog"
        aria-modal="true"
        aria-labelledby="chat-history-title"
      >
        {/* Header Bar */}
        <div className="bg-gradient-to-r from-teal-900 via-teal-800 to-sky-900 text-white p-5 sm:p-6 relative shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="absolute top-5 right-5 w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors cursor-pointer"
            aria-label="Close Chat History"
          >
            <X className="w-4 h-4" />
          </button>

          <div className="flex items-center gap-2 mb-1.5">
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold tracking-wider uppercase bg-white/15 text-teal-100 flex items-center gap-1.5">
              {currentView === 'list' ? (
                <Unlock className="w-3 h-3 text-emerald-300" />
              ) : (
                <Lock className="w-3 h-3 text-amber-300" />
              )}
              {currentView === 'setup'
                ? 'Security Setup'
                : currentView === 'list'
                ? 'Secured History'
                : 'PIN Protected'}
            </span>
            <span className="text-white/40 text-xs">•</span>
            <span className="text-xs text-teal-100 font-medium">
              Client-Side Encrypted
            </span>
          </div>

          <h2 id="chat-history-title" className="text-xl sm:text-2xl font-bold font-display text-white flex items-center gap-2">
            Saathi Chat History
          </h2>
          <p className="text-xs sm:text-sm text-teal-100/90 mt-1 max-w-lg leading-relaxed">
            {currentView === 'setup'
              ? 'Create a PIN to protect access to your private conversations on this device.'
              : currentView === 'unlock'
              ? 'Enter your PIN to decrypt and review your past conversations.'
              : currentView === 'change_pin'
              ? 'Update your access PIN to keep your records secure.'
              : 'Review, resume, or manage your past trauma-informed consultation sessions.'}
          </p>
        </div>

        {/* Modal Body */}
        <div className="p-5 sm:p-6 overflow-y-auto flex-1 flex flex-col">
          {/* Notifications */}
          {errorMessage && (
            <div className="mb-4 p-3.5 rounded-2xl bg-red-50 border border-red-200 text-red-800 text-xs flex items-start gap-2.5 animate-in fade-in">
              <AlertTriangle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
              <div className="flex-1 font-medium">{errorMessage}</div>
              <button
                type="button"
                onClick={() => setErrorMessage(null)}
                className="text-red-500 hover:text-red-800"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {successMessage && (
            <div className="mb-4 p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs flex items-start gap-2.5 animate-in fade-in">
              <Check className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <div className="flex-1 font-medium">{successMessage}</div>
            </div>
          )}

          {/* VIEW: SETUP PIN (First time) */}
          {currentView === 'setup' && (
            <form onSubmit={handleSetupSubmit} className="space-y-4 max-w-md mx-auto w-full py-2">
              <div className="p-4 rounded-2xl bg-teal-50/80 border border-teal-200/80 text-xs text-teal-900 space-y-2">
                <div className="flex items-center gap-1.5 font-bold text-teal-950 font-display">
                  <ShieldCheck className="w-4 h-4 text-teal-700" />
                  <span>Why do I need a PIN?</span>
                </div>
                <p className="leading-relaxed">
                  Conversations with Saathi often touch on sensitive stress, trauma reactions, and mental health symptoms.
                  Setting a PIN ensures your chat transcripts remain private from anyone else who uses this device.
                </p>
                <p className="text-[11px] text-teal-800 font-medium pt-1 border-t border-teal-200/60">
                  🔒 Your PIN is derived using PBKDF2 SHA-256 and is never stored in plain text or sent to any server.
                </p>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-800 mb-1.5">
                  Create PIN or Password <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type={showPin ? 'text' : 'password'}
                    value={setupPin}
                    onChange={(e) => setSetupPin(e.target.value)}
                    placeholder="Enter 4 or more digits / characters"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 focus:border-teal-600 focus:ring-2 focus:ring-teal-100 outline-none text-sm font-mono tracking-wider transition-all"
                    required
                    autoFocus
                  />
                  <button
                    type="button"
                    onClick={() => setShowPin(!showPin)}
                    className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-700 cursor-pointer"
                  >
                    {showPin ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-800 mb-1.5">
                  Confirm PIN / Password <span className="text-red-500">*</span>
                </label>
                <input
                  type={showPin ? 'text' : 'password'}
                  value={confirmPin}
                  onChange={(e) => setConfirmPin(e.target.value)}
                  placeholder="Re-enter PIN to confirm"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 focus:border-teal-600 focus:ring-2 focus:ring-teal-100 outline-none text-sm font-mono tracking-wider transition-all"
                  required
                />
              </div>

              <button
                type="submit"
                disabled={isSubmitting || !setupPin || !confirmPin}
                className="w-full py-3 rounded-xl bg-teal-700 text-white font-semibold text-xs sm:text-sm hover:bg-teal-800 transition-all flex items-center justify-center gap-2 shadow-xs cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? (
                  <span>Securing storage...</span>
                ) : (
                  <>
                    <Lock className="w-4 h-4" />
                    <span>Set PIN &amp; Enable Chat History</span>
                  </>
                )}
              </button>

              <div className="text-center pt-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="text-xs text-gray-500 hover:text-gray-800 underline cursor-pointer"
                >
                  Skip for now (continue chatting without saving history)
                </button>
              </div>
            </form>
          )}

          {/* VIEW: UNLOCK WITH PIN */}
          {currentView === 'unlock' && (
            <form onSubmit={handleUnlockSubmit} className="space-y-4 max-w-sm mx-auto w-full py-4">
              <div className="w-12 h-12 rounded-2xl bg-teal-50 text-teal-700 flex items-center justify-center border border-teal-200 mx-auto mb-2">
                <Lock className="w-6 h-6" />
              </div>

              <div className="text-center">
                <h3 className="text-base font-bold text-gray-900 font-display">
                  Protected Chat History
                </h3>
                <p className="text-xs text-gray-500 mt-1">
                  Enter your PIN to decrypt and access your conversation transcripts.
                </p>
              </div>

              <div>
                <div className="relative mt-2">
                  <input
                    type={showPin ? 'text' : 'password'}
                    value={unlockPin}
                    onChange={(e) => setUnlockPin(e.target.value)}
                    placeholder="Enter your PIN"
                    className="w-full px-3.5 py-3 text-center rounded-xl border border-gray-300 focus:border-teal-600 focus:ring-2 focus:ring-teal-100 outline-none text-base font-mono tracking-widest transition-all"
                    autoFocus
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPin(!showPin)}
                    className="absolute right-3 top-3.5 text-gray-400 hover:text-gray-700 cursor-pointer"
                  >
                    {showPin ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={isSubmitting || !unlockPin}
                className="w-full py-3 rounded-xl bg-black text-white font-semibold text-xs sm:text-sm hover:bg-gray-800 transition-all flex items-center justify-center gap-2 shadow-xs cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? (
                  <span>Verifying PIN...</span>
                ) : (
                  <>
                    <Unlock className="w-4 h-4" />
                    <span>Unlock History</span>
                  </>
                )}
              </button>

              <div className="flex items-center justify-between text-[11px] text-gray-500 pt-3 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setCurrentView('delete_all_confirm')}
                  className="text-red-600 hover:text-red-800 underline cursor-pointer"
                >
                  Forgot PIN / Reset All
                </button>
                <button
                  type="button"
                  onClick={onClose}
                  className="hover:text-gray-900 underline cursor-pointer"
                >
                  Cancel
                </button>
              </div>
            </form>
          )}

          {/* VIEW: CONVERSATION LIST */}
          {currentView === 'list' && (
            <div className="space-y-4 flex-1 flex flex-col">
              {/* Toolbar */}
              <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-gray-100">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-gray-700 uppercase tracking-wider font-display">
                    Saved Sessions ({sessions.length})
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      onNewChat();
                      onClose();
                    }}
                    className="px-3 py-1.5 rounded-xl bg-teal-50 text-teal-800 hover:bg-teal-100 text-xs font-semibold flex items-center gap-1.5 transition-colors border border-teal-200/80 cursor-pointer"
                    title="Start a fresh conversation"
                  >
                    <PlusCircle className="w-3.5 h-3.5 text-teal-600" />
                    <span>New Chat</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setErrorMessage(null);
                      setSuccessMessage(null);
                      setCurrentView('change_pin');
                    }}
                    className="px-3 py-1.5 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                    title="Update your security PIN"
                  >
                    <KeyRound className="w-3.5 h-3.5" />
                    <span>Change PIN</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setCurrentView('delete_all_confirm')}
                    className="p-1.5 rounded-xl text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
                    title="Delete all saved conversations"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Trauma Privacy & Boundaries Notice */}
              <div className="p-3.5 rounded-2xl bg-amber-50/70 border border-amber-200/70 text-[11px] text-amber-900 flex items-start gap-2.5">
                <Info className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
                <div className="leading-relaxed">
                  <span className="font-bold text-amber-950">Privacy &amp; Clinical Notice:</span> This prototype securely encrypts and stores chat history locally on your device. It does not replace a clinical medical records system and does not make formal diagnoses.
                </div>
              </div>

              {/* List of Sessions */}
              {sessions.length === 0 ? (
                <div className="flex-1 flex flex-col items-center justify-center py-12 text-center text-gray-400">
                  <div className="w-12 h-12 rounded-2xl bg-gray-100 text-gray-400 flex items-center justify-center mb-3">
                    <MessageSquare className="w-6 h-6" />
                  </div>
                  <h4 className="text-sm font-bold text-gray-700 font-display">
                    No Saved Conversations Yet
                  </h4>
                  <p className="text-xs text-gray-500 max-w-xs mt-1">
                    As you chat with Saathi, your conversations will automatically be saved and protected here.
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      onNewChat();
                      onClose();
                    }}
                    className="mt-4 px-4 py-2 rounded-xl bg-teal-700 text-white text-xs font-semibold hover:bg-teal-800 transition-colors flex items-center gap-1.5 cursor-pointer"
                  >
                    <PlusCircle className="w-4 h-4" />
                    <span>Start First Conversation</span>
                  </button>
                </div>
              ) : (
                <div className="space-y-3 flex-1 overflow-y-auto pr-1">
                  {sessions.map((sess) => {
                    const isCurrent = activeSession.id === sess.id;
                    const messageCount = sess.messages.length;
                    const userSnippet = stripMarkdown(
                      sess.messages.find(m => m.sender === 'user')?.text || 'Initial consultation'
                    );

                    return (
                      <div
                        key={sess.id}
                        className={`p-4 rounded-2xl border transition-all ${
                          isCurrent
                            ? 'bg-teal-50/60 border-teal-300 ring-1 ring-teal-200 shadow-2xs'
                            : 'bg-white border-gray-200 hover:border-gray-300 shadow-2xs'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex-1 min-w-0">
                            {/* Header row: Date and badge */}
                            <div className="flex items-center gap-2 mb-1 flex-wrap">
                              <span className="text-[11px] text-gray-500 flex items-center gap-1 font-medium">
                                <Calendar className="w-3 h-3 text-gray-400" />
                                {formatSessionDateTime(sess.createdAt)}
                              </span>
                              <span className="text-gray-300">•</span>
                              <span className="text-[10px] px-2 py-0.5 rounded-full bg-gray-100 text-gray-700 font-medium">
                                {messageCount} {messageCount === 1 ? 'msg' : 'msgs'}
                              </span>
                              {isCurrent && (
                                <span className="text-[10px] px-2 py-0.5 rounded-full bg-teal-100 text-teal-900 font-bold">
                                  Active Session
                                </span>
                              )}
                            </div>

                            {/* Title (editable or display) */}
                            {editingTitleId === sess.id ? (
                              <div className="flex items-center gap-1.5 my-1">
                                <input
                                  type="text"
                                  value={editingTitleText}
                                  onChange={(e) => setEditingTitleText(e.target.value)}
                                  className="px-2 py-1 text-xs border border-teal-600 rounded-lg outline-none font-semibold text-gray-900 w-full"
                                  autoFocus
                                  onKeyDown={(e) => {
                                    if (e.key === 'Enter') handleSaveTitleEdit(sess.id);
                                    if (e.key === 'Escape') setEditingTitleId(null);
                                  }}
                                />
                                <button
                                  type="button"
                                  onClick={() => handleSaveTitleEdit(sess.id)}
                                  className="p-1 rounded-md bg-teal-700 text-white hover:bg-teal-800"
                                  title="Save Title"
                                >
                                  <Check className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setEditingTitleId(null)}
                                  className="p-1 rounded-md text-gray-500 hover:bg-gray-100"
                                  title="Cancel"
                                >
                                  <X className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            ) : (
                              <div className="flex items-center gap-2 group my-1">
                                <h4 className="text-sm font-bold text-gray-900 font-display truncate">
                                  {sess.title}
                                </h4>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setEditingTitleId(sess.id);
                                    setEditingTitleText(sess.title);
                                  }}
                                  className="opacity-0 group-hover:opacity-100 p-1 text-gray-400 hover:text-gray-700 transition-opacity"
                                  title="Rename conversation"
                                >
                                  <Edit3 className="w-3 h-3" />
                                </button>
                              </div>
                            )}

                            {/* Snippet preview */}
                            <p className="text-xs text-gray-500 line-clamp-1 mt-0.5">
                              "{userSnippet}"
                            </p>
                          </div>

                          {/* Action Buttons */}
                          <div className="flex items-center gap-1.5 shrink-0">
                            <button
                              type="button"
                              onClick={() => {
                                onSelectSession(sess);
                                onClose();
                              }}
                              className="px-3 py-1.5 rounded-xl bg-black text-white hover:bg-gray-800 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs"
                            >
                              <span>Open</span>
                              <ArrowRight className="w-3.5 h-3.5" />
                            </button>

                            {deleteSessionId === sess.id ? (
                              <div className="flex items-center gap-1 bg-red-50 p-1 rounded-xl border border-red-200">
                                <button
                                  type="button"
                                  onClick={() => handleDeleteSession(sess.id)}
                                  className="px-2 py-1 bg-red-600 text-white rounded-lg text-[10px] font-bold hover:bg-red-700"
                                >
                                  Delete
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setDeleteSessionId(null)}
                                  className="p-1 text-gray-500 hover:text-gray-800 text-[10px]"
                                >
                                  <X className="w-3 h-3" />
                                </button>
                              </div>
                            ) : (
                              <button
                                type="button"
                                onClick={() => setDeleteSessionId(sess.id)}
                                className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-colors cursor-pointer"
                                title="Delete this conversation"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* VIEW: CHANGE PIN */}
          {currentView === 'change_pin' && (
            <form onSubmit={handleChangePinSubmit} className="space-y-4 max-w-sm mx-auto w-full py-2">
              <div className="text-center mb-2">
                <div className="w-10 h-10 rounded-2xl bg-teal-50 text-teal-700 flex items-center justify-center border border-teal-200 mx-auto mb-2">
                  <KeyRound className="w-5 h-5" />
                </div>
                <h3 className="text-base font-bold text-gray-950 font-display">
                  Change Security PIN
                </h3>
                <p className="text-xs text-gray-500 mt-0.5">
                  Confirm your current PIN to re-encrypt your conversations with a new PIN.
                </p>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-800 mb-1">
                  Current PIN <span className="text-red-500">*</span>
                </label>
                <input
                  type={showPin ? 'text' : 'password'}
                  value={currentPinInput}
                  onChange={(e) => setCurrentPinInput(e.target.value)}
                  placeholder="Enter current PIN"
                  className="w-full px-3.5 py-2 rounded-xl border border-gray-300 focus:border-teal-600 outline-none text-sm font-mono"
                  required
                  autoFocus
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-800 mb-1">
                  New PIN <span className="text-red-500">*</span>
                </label>
                <input
                  type={showPin ? 'text' : 'password'}
                  value={newPinInput}
                  onChange={(e) => setNewPinInput(e.target.value)}
                  placeholder="At least 4 digits/characters"
                  className="w-full px-3.5 py-2 rounded-xl border border-gray-300 focus:border-teal-600 outline-none text-sm font-mono"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-800 mb-1">
                  Confirm New PIN <span className="text-red-500">*</span>
                </label>
                <input
                  type={showPin ? 'text' : 'password'}
                  value={confirmNewPinInput}
                  onChange={(e) => setConfirmNewPinInput(e.target.value)}
                  placeholder="Re-enter new PIN"
                  className="w-full px-3.5 py-2 rounded-xl border border-gray-300 focus:border-teal-600 outline-none text-sm font-mono"
                  required
                />
              </div>

              <div className="flex items-center justify-end">
                <button
                  type="button"
                  onClick={() => setShowPin(!showPin)}
                  className="text-[11px] text-gray-500 hover:text-gray-800 flex items-center gap-1 cursor-pointer"
                >
                  {showPin ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  <span>{showPin ? 'Hide PINs' : 'Show PINs'}</span>
                </button>
              </div>

              <div className="flex items-center gap-2 pt-2">
                <button
                  type="submit"
                  disabled={isSubmitting || !currentPinInput || !newPinInput || !confirmNewPinInput}
                  className="flex-1 py-2.5 rounded-xl bg-teal-700 text-white font-semibold text-xs hover:bg-teal-800 transition-colors flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  <Check className="w-4 h-4" />
                  <span>Update PIN</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setErrorMessage(null);
                    setCurrentView('list');
                  }}
                  className="px-4 py-2.5 rounded-xl border border-gray-300 text-gray-700 font-semibold text-xs hover:bg-gray-50 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
              </div>
            </form>
          )}

          {/* VIEW: CONFIRM DELETE ALL */}
          {currentView === 'delete_all_confirm' && (
            <div className="space-y-4 max-w-md mx-auto w-full py-4 text-center">
              <div className="w-12 h-12 rounded-2xl bg-red-100 text-red-700 flex items-center justify-center border border-red-200 mx-auto">
                <AlertTriangle className="w-6 h-6" />
              </div>

              <div>
                <h3 className="text-base sm:text-lg font-bold text-gray-950 font-display">
                  Permanently Delete All Chat History?
                </h3>
                <p className="text-xs text-gray-600 mt-1 leading-relaxed">
                  This will permanently erase all saved Saathi conversation transcripts from this browser's local storage. This action cannot be undone.
                </p>
              </div>

              <div className="p-3.5 rounded-2xl bg-red-50 border border-red-200 text-left text-xs text-red-800 space-y-2">
                <label className="flex items-center gap-2 cursor-pointer font-medium">
                  <input
                    type="checkbox"
                    checked={alsoResetPinOnDelete}
                    onChange={(e) => setAlsoResetPinOnDelete(e.target.checked)}
                    className="w-4 h-4 text-red-600 rounded border-red-300"
                  />
                  <span>Also reset my security PIN</span>
                </label>
              </div>

              <div className="flex items-center gap-2 pt-2">
                <button
                  type="button"
                  onClick={handleConfirmDeleteAll}
                  className="flex-1 py-2.5 rounded-xl bg-red-600 text-white font-bold text-xs sm:text-sm hover:bg-red-700 transition-colors shadow-xs cursor-pointer"
                >
                  Yes, Permanently Delete All
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (isPinConfigured() && activePin) {
                      setCurrentView('list');
                    } else if (isPinConfigured()) {
                      setCurrentView('unlock');
                    } else {
                      setCurrentView('setup');
                    }
                  }}
                  className="px-4 py-2.5 rounded-xl border border-gray-300 text-gray-700 font-semibold text-xs sm:text-sm hover:bg-gray-50 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
