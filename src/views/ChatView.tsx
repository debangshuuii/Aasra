import React, { useState, useRef, useEffect } from 'react';
import { ChatMessage, ChatSession } from '../types';
import {
  loadActiveChatSession,
  saveActiveChatSession,
  createInitialChatSession,
  autoGenerateTitle,
  formatSessionDateTime,
  autoSaveSessionToHistory,
  archiveActiveSessionBeforeNew
} from '../utils/chatStorage';
import { ChatHistoryModal } from '../components/ChatHistoryModal';
import { MarkdownRenderer } from '../components/MarkdownRenderer';
import { 
  Bot, 
  RotateCcw, 
  Send, 
  Sparkles, 
  AlertTriangle, 
  Phone, 
  Wind,
  ShieldCheck, 
  ChevronRight,
  History,
  PlusCircle,
  Lock,
  MessageSquare
} from 'lucide-react';

interface ChatViewProps {
  onOpenGrounding: () => void;
  onOpenCrisis: () => void;
}

export const ChatView: React.FC<ChatViewProps> = ({ onOpenGrounding, onOpenCrisis }) => {
  // Active conversation session persisted to localStorage
  const [session, setSession] = useState<ChatSession>(() => loadActiveChatSession());
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showCrisisBanner, setShowCrisisBanner] = useState(false);
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
  const chatScrollRef = useRef<HTMLDivElement>(null);

  const messages = session.messages;

  const scrollToBottom = (smooth = true) => {
    if (chatScrollRef.current) {
      chatScrollRef.current.scrollTo({
        top: chatScrollRef.current.scrollHeight,
        behavior: smooth ? 'smooth' : 'auto'
      });
    }
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading, showCrisisBanner]);

  // Persist session whenever it changes & auto-save to history
  const updateSessionAndPersist = (updater: (prev: ChatSession) => ChatSession) => {
    setSession(prev => {
      const updated = updater(prev);
      autoSaveSessionToHistory(updated);
      return updated;
    });
  };

  const handleSendMessage = async (textToSend?: string) => {
    const messageText = (textToSend || inputValue).trim();
    if (!messageText || isLoading) return;

    const userMsg: ChatMessage = {
      id: `u-${Date.now()}`,
      sender: 'user',
      text: messageText,
      timestamp: 'Just now'
    };

    // Prior messages before adding this new user message (avoid duplicate user turn in history)
    const priorHistory = messages.slice(-10).map(m => ({
      sender: m.sender,
      text: m.text
    }));

    // Append user message & update title if default
    let updatedMsgs = [...messages, userMsg];
    updateSessionAndPersist(prev => {
      const newTitle = prev.title === 'New Consultation'
        ? autoGenerateTitle(updatedMsgs)
        : prev.title;
      return {
        ...prev,
        title: newTitle,
        updatedAt: Date.now(),
        messages: updatedMsgs
      };
    });

    if (!textToSend) setInputValue('');

    // Check distress keywords
    const distressWords = ['die', 'suicide', 'kill', 'hurt myself', 'end it', 'emergency', 'harm', 'overdose'];
    if (distressWords.some(w => messageText.toLowerCase().includes(w))) {
      setShowCrisisBanner(true);
    }

    setIsLoading(true);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: messageText,
          history: priorHistory
        })
      });

      const data = await response.json();
      const assistantReply: ChatMessage = {
        id: `a-${Date.now()}`,
        sender: 'assistant',
        text: data.reply || 'I am listening. Could you share a little more about what you are feeling?',
        timestamp: 'Just now',
        isFallback: data.isFallback
      };

      updateSessionAndPersist(prev => ({
        ...prev,
        updatedAt: Date.now(),
        messages: [...prev.messages, assistantReply]
      }));
    } catch (err) {
      console.warn('Chat request failed, using client fallback:', err);
      const fallbackReply: ChatMessage = {
        id: `a-${Date.now()}`,
        sender: 'assistant',
        text: "I'm right here with you. Processing past stress and difficult memories takes time and kindness toward yourself. Would you like to practice a quick grounding technique or learn about how trauma affects the body?",
        timestamp: 'Just now',
        isFallback: true
      };

      updateSessionAndPersist(prev => ({
        ...prev,
        updatedAt: Date.now(),
        messages: [...prev.messages, fallbackReply]
      }));
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleQuickReply = (text: string) => {
    handleSendMessage(text);
  };

  const handleSafetyEscalationTest = () => {
    setShowCrisisBanner(true);
    const alertMsg: ChatMessage = {
      id: `alert-${Date.now()}`,
      sender: 'assistant',
      text: "⚠️ Your safety is the highest priority. If you or someone you know is experiencing acute distress in India, please call Tele-MANAS (14416 / 1800-891-4416), KIRAN (1800-599-0019), Vandrevala Foundation (+91 9999 666 555), or National Emergency (112).",
      timestamp: 'Just now'
    };

    updateSessionAndPersist(prev => ({
      ...prev,
      updatedAt: Date.now(),
      messages: [...prev.messages, alertMsg]
    }));
  };

  const handleClearChat = async () => {
    await archiveActiveSessionBeforeNew(session);
    const clearedMsg: ChatMessage = {
      id: 'reset',
      sender: 'assistant',
      text: "Chat history cleared for this session. I'm here whenever you're ready to explore symptoms, talk through your screener, or practice grounding exercises.",
      timestamp: 'Just now'
    };

    updateSessionAndPersist(prev => ({
      ...prev,
      updatedAt: Date.now(),
      messages: [clearedMsg]
    }));
    setShowCrisisBanner(false);
  };

  const handleStartNewChat = async () => {
    await archiveActiveSessionBeforeNew(session);
    const fresh = createInitialChatSession();
    setSession(fresh);
    saveActiveChatSession(fresh);
    setShowCrisisBanner(false);
  };

  const handleSelectSessionFromHistory = (selected: ChatSession) => {
    setSession(selected);
    saveActiveChatSession(selected);
    setShowCrisisBanner(false);
  };

  return (
    <div className="flex flex-col w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5 h-[calc(100vh-7.5rem)] min-h-[640px]">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 flex-1 min-h-0">
        
        {/* Left Desktop Sidebar: Guidance & Quick Prompts (4 cols) */}
        <div className="hidden lg:flex lg:col-span-4 flex-col gap-4 overflow-y-auto pr-1">
          {/* Assistant Info & Boundaries */}
          <div className="bg-white p-5 rounded-3xl border border-gray-200 shadow-2xs">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-11 h-11 rounded-2xl bg-teal-50 text-teal-700 flex items-center justify-center border border-teal-200 shrink-0">
                <Bot className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-sm font-bold text-gray-950 font-display flex items-center gap-1.5">
                  Saathi Companion
                  <span className="w-2 h-2 rounded-full bg-teal-600 animate-pulse" />
                </h2>
                <span className="text-[11px] text-teal-800 font-medium">
                  Trauma-Informed Psychoeducation
                </span>
              </div>
            </div>

            <p className="text-xs text-gray-600 leading-relaxed mb-4">
              I can explain DSM-5 trauma reactions, help interpret your screening scores, and guide you through evidence-based somatic grounding exercises.
            </p>

            <div className="p-3 rounded-xl bg-gray-50 border border-gray-100 text-[11px] text-gray-500 space-y-1.5">
              <div className="flex items-center gap-1.5 text-gray-700 font-medium">
                <ShieldCheck className="w-3.5 h-3.5 text-teal-600" />
                <span>Clinical Boundaries</span>
              </div>
              <p>Not a licensed therapist or emergency medical service. Does not provide clinical diagnoses.</p>
            </div>
          </div>

          {/* Secure Chat History & Sessions Card */}
          <div className="bg-white p-4 rounded-3xl border border-gray-200 shadow-2xs">
            <div className="flex items-center justify-between mb-2.5">
              <span className="text-xs font-bold text-gray-900 font-display flex items-center gap-1.5">
                <History className="w-4 h-4 text-teal-700" />
                <span>Chat History &amp; Privacy</span>
              </span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-teal-50 text-teal-800 font-semibold border border-teal-200/60 flex items-center gap-1">
                <Lock className="w-2.5 h-2.5" />
                <span>PIN Protected</span>
              </span>
            </div>
            
            <div className="mb-3 px-3 py-2 rounded-xl bg-gray-50 border border-gray-100 text-[11px] text-gray-600">
              <div className="font-semibold text-gray-900 truncate">
                {session.title}
              </div>
              <div className="text-[10px] text-gray-400 mt-0.5">
                Last updated {formatSessionDateTime(session.updatedAt)}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setIsHistoryModalOpen(true)}
                className="py-2 px-3 rounded-xl bg-teal-700 hover:bg-teal-800 text-white text-xs font-semibold transition-colors flex items-center justify-center gap-1.5 shadow-2xs cursor-pointer"
              >
                <History className="w-3.5 h-3.5" />
                <span>Chat History</span>
              </button>

              <button
                type="button"
                onClick={handleStartNewChat}
                className="py-2 px-3 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-800 text-xs font-semibold transition-colors flex items-center justify-center gap-1.5 cursor-pointer border border-gray-200"
              >
                <PlusCircle className="w-3.5 h-3.5 text-gray-600" />
                <span>New Chat</span>
              </button>
            </div>
          </div>

          {/* Somatic Grounding Quick Trigger */}
          <div className="bg-gradient-to-br from-teal-50/80 via-white to-sky-50/60 p-5 rounded-3xl border border-teal-200/80 shadow-2xs">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-teal-900 font-display flex items-center gap-1.5">
                <Wind className="w-4 h-4 text-teal-600" />
                Somatic Regulation
              </span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-teal-100 text-teal-800 font-semibold">
                Interactive
              </span>
            </div>
            <p className="text-xs text-gray-600 mb-3.5 leading-relaxed">
              If you feel flooded or activated right now, step through the 5-4-3-2-1 sensory grounding exercise.
            </p>
            <button
              type="button"
              onClick={onOpenGrounding}
              className="w-full py-2.5 rounded-xl bg-teal-700 text-white text-xs font-semibold hover:bg-teal-800 transition-colors flex items-center justify-center gap-1.5 shadow-xs cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Launch 5-4-3-2-1 Grounding</span>
            </button>
          </div>

          {/* Quick Discussion Topics */}
          <div className="bg-white p-5 rounded-3xl border border-gray-200 shadow-2xs flex-1 flex flex-col justify-between">
            <div>
              <h3 className="text-xs font-bold text-gray-900 uppercase tracking-wider mb-3 font-display">
                Suggested Inquiries
              </h3>
              <div className="space-y-2">
                {[
                  'Explain my PC-PTSD-5 screening score',
                  'What does hyperarousal feel like in the body?',
                  'How to talk to a doctor about trauma',
                  'What is EMDR therapy and how does it work?',
                  'Techniques for managing intrusive memories'
                ].map((prompt, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleQuickReply(prompt)}
                    className="w-full text-left p-2.5 rounded-xl text-xs text-gray-700 bg-gray-50 hover:bg-teal-50 hover:text-teal-900 border border-gray-100 transition-colors flex items-center justify-between group cursor-pointer"
                  >
                    <span className="truncate pr-2">{prompt}</span>
                    <ChevronRight className="w-3.5 h-3.5 text-gray-400 group-hover:text-teal-600 shrink-0" />
                  </button>
                ))}
              </div>
            </div>

            <div className="pt-4 mt-3 border-t border-gray-100 flex items-center justify-between">
              <button
                type="button"
                onClick={handleSafetyEscalationTest}
                className="text-[11px] text-red-600 hover:text-red-800 font-medium flex items-center gap-1"
              >
                <AlertTriangle className="w-3.5 h-3.5" />
                <span>Test Safety Escalation</span>
              </button>
              <button
                type="button"
                onClick={handleClearChat}
                className="text-[11px] text-gray-500 hover:text-black font-medium flex items-center gap-1"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Clear session</span>
              </button>
            </div>
          </div>
        </div>

        {/* Right Main Chat Console: Desktop Chat Workspace (8 cols) */}
        <div className="lg:col-span-8 flex flex-col bg-white rounded-3xl border border-gray-200 shadow-xs overflow-hidden h-full">
          {/* Header Bar */}
          <div className="p-3.5 sm:p-4 border-b border-gray-100 flex items-center justify-between bg-white shrink-0">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-9 h-9 rounded-xl bg-teal-50 text-teal-700 flex items-center justify-center border border-teal-200 shrink-0">
                <Bot className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <h3 className="text-xs sm:text-sm font-bold text-gray-900 font-display flex items-center gap-1.5 truncate">
                  <span className="truncate">{session.title}</span>
                  <span className="text-[10px] font-semibold text-teal-700 bg-teal-50 px-2 py-0.5 rounded-full border border-teal-200/60 hidden sm:flex items-center gap-1 shrink-0">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    Active
                  </span>
                </h3>
                <span className="text-[11px] text-gray-500 hidden sm:inline-block">
                  Empathetic Psychoeducational Support • Client Encrypted
                </span>
              </div>
            </div>

            <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
              {/* Chat History Trigger */}
              <button
                type="button"
                onClick={() => setIsHistoryModalOpen(true)}
                className="px-2.5 sm:px-3 py-1.5 rounded-xl bg-gray-100 hover:bg-teal-50 hover:text-teal-900 border border-gray-200 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                title="View previous conversations (PIN protected)"
              >
                <History className="w-3.5 h-3.5 text-teal-700" />
                <span className="hidden xs:inline">Chat History</span>
              </button>

              {/* New Chat Button */}
              <button
                type="button"
                onClick={handleStartNewChat}
                className="p-2 rounded-xl text-gray-600 hover:text-teal-900 hover:bg-teal-50 border border-gray-200 transition-colors cursor-pointer"
                title="Start a new conversation"
              >
                <PlusCircle className="w-4 h-4" />
              </button>

              {/* Mobile Grounding Quick Trigger */}
              <button
                type="button"
                onClick={onOpenGrounding}
                className="lg:hidden px-2.5 py-1.5 rounded-xl bg-teal-50 text-teal-800 text-xs font-semibold border border-teal-200/80 flex items-center gap-1"
                title="Grounding"
              >
                <Wind className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Grounding</span>
              </button>

              {/* Reset / Clear Session */}
              <button
                type="button"
                onClick={handleClearChat}
                className="p-2 rounded-xl text-gray-400 hover:text-gray-900 hover:bg-gray-100 transition-colors cursor-pointer"
                title="Reset conversation"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* High-Risk Safety Banner */}
          {showCrisisBanner && (
            <div className="p-4 bg-red-50 text-red-900 border-b border-red-200 animate-in fade-in duration-200 shrink-0">
              <div className="flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
                <div className="flex-1">
                  <h4 className="text-xs sm:text-sm font-bold text-red-800 mb-1 font-display">
                    Your immediate safety is our highest priority
                  </h4>
                  <p className="text-xs text-red-800 mb-3 leading-relaxed">
                    If you are experiencing acute distress, having thoughts of harm, or need immediate care:
                  </p>
                  <div className="flex flex-wrap gap-2">
                    <button
                      onClick={onOpenCrisis}
                      className="px-3.5 py-1.5 rounded-xl bg-red-600 text-white text-xs font-bold flex items-center gap-1.5 shadow-xs hover:bg-red-700 transition-colors cursor-pointer"
                    >
                      <Phone className="w-3.5 h-3.5" />
                      <span>Tele-MANAS (14416)</span>
                    </button>
                    <a
                      href="tel:112"
                      className="px-3.5 py-1.5 rounded-xl bg-white text-red-700 border border-red-200 text-xs font-bold flex items-center gap-1.5 shadow-2xs hover:bg-red-50 transition-colors"
                    >
                      <span>Emergency 112</span>
                    </a>
                    <button
                      type="button"
                      onClick={() => setShowCrisisBanner(false)}
                      className="px-3 py-1.5 rounded-xl bg-gray-100 text-gray-700 text-xs font-medium hover:bg-gray-200 border border-gray-200 cursor-pointer"
                    >
                      Dismiss
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Chat Messages Scroll Thread */}
          <div
            ref={chatScrollRef}
            className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4"
          >
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                {msg.sender === 'assistant' && (
                  <div className="w-8 h-8 rounded-xl bg-teal-50 text-teal-700 flex items-center justify-center shrink-0 mt-1 mr-3 border border-teal-200">
                    <Bot className="w-4 h-4" />
                  </div>
                )}
                <div className="flex flex-col max-w-[88%] sm:max-w-[78%]">
                  {msg.sender === 'assistant' && (
                    <div className="flex items-center gap-1 mb-1 px-1 text-[11px] font-medium text-teal-800">
                      <Sparkles className="w-3 h-3 text-teal-600" />
                      <span>{msg.isFallback ? 'Clinical Protocol' : 'Saathi'}</span>
                    </div>
                  )}
                  <div
                    className={`p-4 rounded-2xl text-xs sm:text-sm leading-relaxed ${
                      msg.sender === 'user'
                        ? 'bg-black text-white rounded-tr-none shadow-xs'
                        : 'bg-gray-50/80 border border-gray-200/80 text-gray-950 rounded-tl-none shadow-2xs'
                    }`}
                  >
                    <MarkdownRenderer content={msg.text} isUser={msg.sender === 'user'} />
                  </div>
                </div>
              </div>
            ))}

            {isLoading && (
              <div className="flex items-start gap-3 max-w-[80%]">
                <div className="w-8 h-8 rounded-xl bg-teal-50 text-teal-700 flex items-center justify-center shrink-0 mt-1 border border-teal-200">
                  <Bot className="w-4 h-4" />
                </div>
                <div className="p-4 rounded-2xl rounded-tl-none bg-gray-50 border border-gray-200 text-gray-600 text-xs flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-teal-600 animate-bounce" />
                  <span className="w-2 h-2 rounded-full bg-teal-600 animate-bounce [animation-delay:0.2s]" />
                  <span className="w-2 h-2 rounded-full bg-teal-600 animate-bounce [animation-delay:0.4s]" />
                  <span className="text-gray-500 text-xs ml-1 font-medium">
                    Reflecting with trauma-informed care...
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Mobile Quick Reply Pills (< lg) */}
          <div className="lg:hidden flex items-center gap-1.5 overflow-x-auto px-4 py-2 border-t border-gray-100 no-scrollbar shrink-0">
            <button
              type="button"
              onClick={() => handleQuickReply('Explain my screening score')}
              className="px-3 py-1 rounded-full bg-gray-100 text-gray-800 text-xs font-semibold whitespace-nowrap hover:bg-gray-200 transition-colors shrink-0 cursor-pointer"
            >
              Explain score
            </button>
            <button
              type="button"
              onClick={() => handleQuickReply('What is hyperarousal?')}
              className="px-3 py-1 rounded-full bg-gray-100 text-gray-800 text-xs font-semibold whitespace-nowrap hover:bg-gray-200 transition-colors shrink-0 cursor-pointer"
            >
              Hyperarousal
            </button>
            <button
              type="button"
              onClick={onOpenGrounding}
              className="px-3 py-1 rounded-full bg-teal-50 text-teal-800 text-xs font-semibold whitespace-nowrap hover:bg-teal-100 transition-colors shrink-0 cursor-pointer"
            >
              🌿 Grounding
            </button>
            <button
              type="button"
              onClick={() => handleQuickReply('How to talk to a doctor')}
              className="px-3 py-1 rounded-full bg-gray-100 text-gray-800 text-xs font-semibold whitespace-nowrap hover:bg-gray-200 transition-colors shrink-0 cursor-pointer"
            >
              Talk to doctor
            </button>
          </div>

          {/* Bottom Message Composer */}
          <div className="p-3 sm:p-4 border-t border-gray-100 bg-white shrink-0">
            <div className="flex items-center gap-2 bg-gray-50/90 rounded-2xl p-2 border border-gray-200/90 focus-within:border-black focus-within:bg-white transition-all">
              <button
                type="button"
                onClick={onOpenGrounding}
                className="p-2 text-gray-500 hover:text-teal-700 hover:bg-teal-50 transition-colors rounded-xl shrink-0 cursor-pointer"
                title="Somatic Grounding Guide"
              >
                <Sparkles className="w-5 h-5" />
              </button>

              <input
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ask about symptoms, emotional regulation, or your screener results..."
                className="flex-1 bg-transparent px-2 py-1 text-gray-900 placeholder:text-gray-400 text-xs sm:text-sm focus:outline-none"
              />

              <button
                type="button"
                onClick={() => handleSendMessage()}
                disabled={!inputValue.trim() || isLoading}
                className={`px-4 py-2 rounded-xl bg-black text-white text-xs font-semibold flex items-center gap-1.5 transition-all active:scale-95 shadow-xs shrink-0 ${
                  inputValue.trim() && !isLoading
                    ? 'opacity-100 hover:bg-gray-800 cursor-pointer'
                    : 'opacity-40 cursor-not-allowed'
                }`}
              >
                <span className="hidden sm:inline">Send</span>
                <Send className="w-3.5 h-3.5" />
              </button>
            </div>
            <div className="flex items-center justify-between text-[11px] text-gray-400 px-2 mt-2">
              <span>Press Enter to send message</span>
              <button
                type="button"
                onClick={() => setIsHistoryModalOpen(true)}
                className="flex items-center gap-1 text-teal-700 hover:text-teal-900 hover:underline cursor-pointer"
              >
                <ShieldCheck className="w-3.5 h-3.5 text-teal-600" />
                <span>Encrypted local storage • View History</span>
              </button>
            </div>
          </div>
        </div>

      </div>

      {/* Secure Chat History Modal */}
      <ChatHistoryModal
        isOpen={isHistoryModalOpen}
        onClose={() => setIsHistoryModalOpen(false)}
        activeSession={session}
        onSelectSession={handleSelectSessionFromHistory}
        onNewChat={handleStartNewChat}
      />
    </div>
  );
};
