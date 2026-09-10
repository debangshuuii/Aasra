import React, { useState } from 'react';
import { AlertTriangle, Phone, MessageSquare, ShieldAlert, X, Globe, HeartHandshake, MapPin } from 'lucide-react';

interface CrisisModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenNearbyHospitals?: () => void;
}

export const CrisisModal: React.FC<CrisisModalProps> = ({ 
  isOpen, 
  onClose,
  onOpenNearbyHospitals 
}) => {
  const [region, setRegion] = useState<'india' | 'international'>('india');

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150">
      <div className="bg-white w-full max-w-lg rounded-3xl p-6 sm:p-7 shadow-2xl relative border border-gray-200 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-red-100 text-red-700 flex items-center justify-center border border-red-200 shrink-0">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-bold text-gray-950 font-display">
                Immediate Crisis Support
              </h3>
              <span className="text-xs text-gray-500 font-medium">Free • Confidential • 24/7 Support</span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 hover:text-gray-800 transition-colors cursor-pointer"
            title="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Region Toggle: India (Default) vs International */}
        <div className="flex items-center p-1 bg-gray-100 rounded-xl mb-3">
          <button
            type="button"
            onClick={() => setRegion('india')}
            className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              region === 'india'
                ? 'bg-white text-gray-950 shadow-xs'
                : 'text-gray-500 hover:text-gray-900'
            }`}
          >
            🇮🇳 India Helplines (National)
          </button>
          <button
            type="button"
            onClick={() => setRegion('international')}
            className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              region === 'international'
                ? 'bg-white text-gray-950 shadow-xs'
                : 'text-gray-500 hover:text-gray-900'
            }`}
          >
            🌐 International (US / 988)
          </button>
        </div>

        {/* GPS Emergency Centers Finder Button */}
        {onOpenNearbyHospitals && (
          <div className="mb-4">
            <button
              type="button"
              onClick={() => {
                onClose();
                onOpenNearbyHospitals();
              }}
              className="w-full py-2.5 px-4 rounded-2xl bg-gradient-to-r from-red-600 to-rose-700 hover:from-red-700 hover:to-rose-800 text-white flex items-center justify-between shadow-xs transition-all cursor-pointer group"
            >
              <div className="flex items-center gap-2.5 text-left">
                <div className="w-8 h-8 rounded-xl bg-white/20 flex items-center justify-center">
                  <MapPin className="w-4 h-4 text-white animate-bounce" />
                </div>
                <div>
                  <div className="text-xs font-bold leading-tight">Find Nearest Emergency Hospitals &amp; Doctors</div>
                  <div className="text-[10px] text-red-100">GPS-based 24/7 trauma &amp; psychiatric centers</div>
                </div>
              </div>
              <span className="px-2.5 py-1 rounded-lg bg-white/25 text-[11px] font-bold group-hover:bg-white/35 transition-colors">
                Locate Now &rarr;
              </span>
            </button>
          </div>
        )}

        <p className="text-xs sm:text-sm text-gray-600 mb-4 leading-relaxed">
          If you or someone you care about is experiencing overwhelming distress or thoughts of harm, compassionate trained support is available immediately. You never have to carry this alone:
        </p>

        {region === 'india' ? (
          /* Indian Crisis & Mental Health Services */
          <div className="flex flex-col gap-3 mb-5">
            {/* Tele-MANAS (Primary Govt of India Helpline) */}
            <a
              href="tel:14416"
              className="p-4 rounded-2xl bg-red-600 text-white flex items-center justify-between hover:bg-red-700 transition-colors shadow-xs group"
            >
              <div className="flex items-center gap-3">
                <Phone className="w-5 h-5 shrink-0" />
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold block">Tele-MANAS: Call 14416</span>
                    <span className="text-[10px] uppercase font-bold bg-white/20 text-white px-2 py-0.5 rounded-full">
                      Toll-Free 24/7
                    </span>
                  </div>
                  <span className="text-xs text-red-100 block mt-0.5">
                    Govt of India National Tele Mental Health (20+ Indian Languages)
                  </span>
                </div>
              </div>
              <span className="text-white text-xs font-semibold group-hover:translate-x-0.5 transition-transform shrink-0 ml-2">
                Call 14416 →
              </span>
            </a>

            {/* KIRAN Helpline */}
            <a
              href="tel:18005990019"
              className="p-4 rounded-2xl bg-teal-50 text-teal-950 flex items-center justify-between hover:bg-teal-100/80 transition-colors border border-teal-200 group"
            >
              <div className="flex items-center gap-3">
                <HeartHandshake className="w-5 h-5 text-teal-700 shrink-0" />
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold block">KIRAN: 1800-599-0019</span>
                    <span className="text-[10px] uppercase font-bold bg-teal-100 text-teal-800 px-2 py-0.5 rounded-full">
                      13 Languages
                    </span>
                  </div>
                  <span className="text-xs text-teal-800 block mt-0.5">
                    Ministry of Social Justice 24/7 Psychological Support &amp; Suicide Prevention
                  </span>
                </div>
              </div>
              <span className="text-teal-900 text-xs font-semibold group-hover:translate-x-0.5 transition-transform shrink-0 ml-2">
                Call →
              </span>
            </a>

            {/* Vandrevala Foundation Phone & WhatsApp */}
            <div className="p-4 rounded-2xl bg-gray-50 text-gray-950 border border-gray-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <Phone className="w-5 h-5 text-gray-700 shrink-0" />
                <div>
                  <span className="text-sm font-bold block">Vandrevala Foundation</span>
                  <span className="text-xs text-gray-500 block">
                    Free 24/7 mental health counseling across India (+91 9999 666 555)
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <a
                  href="tel:9999666555"
                  className="px-3 py-1.5 rounded-xl bg-gray-900 text-white text-xs font-semibold hover:bg-gray-800 transition-colors"
                >
                  Call
                </a>
                <a
                  href="https://wa.me/919999666555"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3 py-1.5 rounded-xl bg-emerald-600 text-white text-xs font-semibold hover:bg-emerald-700 transition-colors"
                >
                  WhatsApp
                </a>
              </div>
            </div>

            {/* Emergency Services India: 112 */}
            <a
              href="tel:112"
              className="p-4 rounded-2xl bg-red-50 text-gray-900 flex items-center justify-between hover:bg-red-100/70 transition-colors border border-red-200"
            >
              <div className="flex items-center gap-3">
                <ShieldAlert className="w-5 h-5 text-red-600 shrink-0" />
                <div>
                  <span className="text-sm font-bold block text-red-950">National Emergency Services (112)</span>
                  <span className="text-xs text-gray-600">Unified pan-India emergency for Ambulance (108/102) &amp; Police</span>
                </div>
              </div>
              <span className="text-red-700 text-xs font-bold shrink-0 ml-2">Dial 112 →</span>
            </a>
          </div>
        ) : (
          /* International Crisis Helplines */
          <div className="flex flex-col gap-3 mb-5">
            <a
              href="tel:988"
              className="p-4 rounded-2xl bg-red-600 text-white flex items-center justify-between hover:bg-red-700 transition-colors shadow-xs group"
            >
              <div className="flex items-center gap-3">
                <Phone className="w-5 h-5 shrink-0" />
                <div>
                  <span className="text-sm font-bold block">988 Suicide &amp; Crisis Lifeline (US &amp; Canada)</span>
                  <span className="text-xs text-red-100">Free, confidential 24/7/365 counseling</span>
                </div>
              </div>
              <span className="text-white text-xs font-semibold group-hover:translate-x-0.5 transition-transform shrink-0">
                Call 988 →
              </span>
            </a>

            <a
              href="sms:741741"
              className="p-4 rounded-2xl bg-gray-50 text-gray-900 flex items-center justify-between hover:bg-gray-100 transition-colors border border-gray-200"
            >
              <div className="flex items-center gap-3">
                <MessageSquare className="w-5 h-5 text-gray-700 shrink-0" />
                <div>
                  <span className="text-sm font-bold block">Crisis Text Line (Text HOME to 741741)</span>
                  <span className="text-xs text-gray-500">Free 24/7 crisis support via SMS (US/UK)</span>
                </div>
              </div>
              <span className="text-gray-600 text-xs font-semibold shrink-0">Text →</span>
            </a>

            <a
              href="https://findahelpline.com"
              target="_blank"
              rel="noopener noreferrer"
              className="p-4 rounded-2xl bg-sky-50 text-sky-950 flex items-center justify-between hover:bg-sky-100/70 transition-colors border border-sky-200"
            >
              <div className="flex items-center gap-3">
                <Globe className="w-5 h-5 text-sky-700 shrink-0" />
                <div>
                  <span className="text-sm font-bold block">Find A Helpline (Global Directory)</span>
                  <span className="text-xs text-sky-800">Free support in 130+ countries worldwide</span>
                </div>
              </div>
              <span className="text-sky-800 text-xs font-semibold shrink-0">Search ↗</span>
            </a>
          </div>
        )}

        <button
          onClick={onClose}
          className="w-full py-3 rounded-xl bg-gray-100 text-gray-800 text-xs sm:text-sm font-semibold hover:bg-gray-200 transition-colors border border-gray-200 cursor-pointer"
        >
          Return to Aasra
        </button>
      </div>
    </div>
  );
};
