/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Mic, ChevronRight, ArrowLeft, CheckCircle2, Play, Square, Loader2 } from 'lucide-react';
import { GoogleGenAI } from "@google/genai";

// Initialize Gemini
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

import { DB, Level, Category, SubTopic } from './db';
import { getOfflineTranslation } from './dictionary';

// --- Speech Recognition Types ---
interface SpeechRecognitionEvent extends Event {
  results: SpeechRecognitionResultList;
}

interface SpeechRecognitionResultList {
  readonly length: number;
  item(index: number): SpeechRecognitionResult;
  [index: number]: SpeechRecognitionResult;
}

interface SpeechRecognitionResult {
  readonly length: number;
  item(index: number): SpeechRecognitionAlternative;
  [index: number]: SpeechRecognitionAlternative;
  isFinal: boolean;
}

interface SpeechRecognitionAlternative {
  transcript: string;
  confidence: number;
}

interface SpeechRecognition extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start(): void;
  stop(): void;
  abort(): void;
  onresult: (event: SpeechRecognitionEvent) => void;
  onerror: (event: any) => void;
  onend: () => void;
}

// --- App Component ---

export default function App() {
  const [screen, setScreen] = useState<'home' | 'category' | 'subtopic' | 'learning'>('home');
  const [level, setLevel] = useState<Level | null>(null);
  const [selectedCategoryIndex, setSelectedCategoryIndex] = useState(0);
  const [selectedSubTopicIndex, setSelectedSubTopicIndex] = useState(0);
  const [currentWordIndex, setCurrentWordIndex] = useState(0);
  const [isListening, setIsListening] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const [hasStartedSpeaking, setHasStartedSpeaking] = useState(false);
  const [activeWordSpeech, setActiveWordSpeech] = useState<number | null>(null);
  const [activeTranslation, setActiveTranslation] = useState<{idx: number, text: string} | null>(null);
  const [isLoadingTranslation, setIsLoadingTranslation] = useState(false);
  const [aiVoiceState, setAiVoiceState] = useState<'idle' | 'loading' | 'playing'>('idle');

  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const isListeningRef = useRef(false);
  const clickTimerRef = useRef<NodeJS.Timeout | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const audioSourceRef = useRef<AudioBufferSourceNode | null>(null);

  useEffect(() => {
    isListeningRef.current = isListening;
  }, [isListening]);

  const words = useMemo(() => {
    if (!level) return [];
    return DB[selectedCategoryIndex].subTopics[selectedSubTopicIndex].texts[level].split(/\s+/);
  }, [level, selectedCategoryIndex, selectedSubTopicIndex]);

  // Clean words for matching (lowercase, no punctuation)
  const cleanWords = useMemo(() => {
    return words.map(w => w.toLowerCase().replace(/[.,!?;:]/g, ''));
  }, [words]);

  // Handle TTS with robust voice loading
  const speakText = (text: string, onEnd?: () => void) => {
    window.speechSynthesis.cancel();
    
    const voices = window.speechSynthesis.getVoices();
    const utter = () => {
      const utterance = new SpeechSynthesisUtterance(text);
      const currentVoices = window.speechSynthesis.getVoices();
      const premiumVoice = currentVoices.find(v => v.name.includes('Google') && v.lang.includes('en')) || 
                          currentVoices.find(v => v.lang.includes('en'));
      if (premiumVoice) utterance.voice = premiumVoice;
      utterance.rate = 0.85;
      utterance.pitch = 1;
      if (onEnd) utterance.onend = onEnd;
      window.speechSynthesis.speak(utterance);
    };

    if (voices.length === 0) {
      window.speechSynthesis.onvoiceschanged = () => {
        utter();
        window.speechSynthesis.onvoiceschanged = null;
      };
    } else {
      utter();
    }
  };

  // Handle level completion
  useEffect(() => {
    if (words.length > 0 && currentWordIndex === words.length) {
      setIsComplete(true);
      if (isListening) stopListening();
    }
  }, [currentWordIndex, words.length, isListening]);

  // Initialize Speech Recognition
  useEffect(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = 'en-US';

      recognition.onresult = (event: SpeechRecognitionEvent) => {
        const transcript = Array.from(event.results)
          .map(result => result[0].transcript)
          .join('')
          .toLowerCase();
        
        checkSpeech(transcript);
      };

      recognition.onerror = (e: any) => {
        if (e.error === 'no-speech' || e.error === 'aborted') return;
        console.error('Speech recognition error', e);
        if (isListeningRef.current) {
          setTimeout(() => {
            try { recognition.start(); } catch(err) {}
          }, 100);
        } else {
          setIsListening(false);
        }
      };

      recognition.onend = () => {
        if (isListeningRef.current) {
          try {
            recognition.start();
          } catch (e) {
            // ignore
          }
        }
      };

      recognitionRef.current = recognition;
    }

    // Pre-load voices for TTS
    window.speechSynthesis.getVoices();
  }, [cleanWords]);

  const checkSpeech = (transcript: string) => {
    if (currentWordIndex >= cleanWords.length) return;
    
    // Improved matching logic: 
    // instead of searching the whole transcript (which grows), 
    // we look for the target word in the most recent additions.
    const target = cleanWords[currentWordIndex];
    const transcriptWords = transcript.split(/\s+/);
    
    // Scan the last few recognized words to see if we hit the target
    // Using a window of 4 words handles slight delays and filler words
    const lastFew = transcriptWords.slice(-4);
    
    if (lastFew.some(w => w.includes(target) || target.includes(w))) {
      setCurrentWordIndex(prev => prev + 1);
    }
  };

  const toggleListening = () => {
    if (!recognitionRef.current) {
      alert("Speech recognition is not supported in this browser.");
      return;
    }

    if (isListening) {
      stopListening();
    } else {
      // Small delay to ensure synthesis was canceled if user clicked Play All before
      window.speechSynthesis.cancel();
      setHasStartedSpeaking(true);
      setIsListening(true);
      try {
        recognitionRef.current.start();
      } catch (e) {
        console.warn("Recognition already started or error", e);
        setIsListening(false);
      }
    }
  };

  const stopListening = () => {
    setIsListening(false);
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
  };


  const translateWord = (word: string, idx: number) => {
    const translation = getOfflineTranslation(word);
    setActiveTranslation({ idx, text: translation });
  };

  const handleWordInteraction = (idx: number, event: React.MouseEvent | any) => {
    event.preventDefault();
    const word = words[idx];

    if (clickTimerRef.current) {
      // Double Click detected
      clearTimeout(clickTimerRef.current);
      clickTimerRef.current = null;
      if (activeTranslation?.idx === idx) {
        setActiveTranslation(null);
      } else {
        translateWord(word, idx);
      }
    } else {
      // Potential Single Click
      clickTimerRef.current = setTimeout(() => {
        clickTimerRef.current = null;
        setActiveTranslation(null);
        // We removed single click sound per request to use a button instead
      }, 250);
    }
  };

  const playAIVoice = async () => {
    if (aiVoiceState === 'playing' || aiVoiceState === 'loading') {
      if (audioSourceRef.current) {
        try { audioSourceRef.current.stop(); } catch(e){}
        audioSourceRef.current.disconnect();
      }
      if (audioContextRef.current) {
        try { audioContextRef.current.close().catch(()=>{}); } catch(e){}
      }
      setAiVoiceState('idle');
      return;
    }

    if (!level) return;
    setAiVoiceState('loading');
    
    try {
      const response = await ai.models.generateContent({
        model: "gemini-3.1-flash-tts-preview",
        contents: [{ parts: [{ text: DB[selectedCategoryIndex].subTopics[selectedSubTopicIndex].texts[level] }] }],
        config: {
          responseModalities: ["AUDIO"],
          speechConfig: {
              voiceConfig: {
                prebuiltVoiceConfig: { voiceName: 'Kore' },
              },
          },
        },
      });

      const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
      if (!base64Audio) throw new Error("No audio generated");

      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      const audioCtx = new AudioContextClass({ sampleRate: 24000 });
      audioContextRef.current = audioCtx;
      
      const binary = atob(base64Audio);
      const buffer = new Float32Array(binary.length / 2);
      for (let i = 0; i < buffer.length; i++) {
          const dataLow = binary.charCodeAt(i * 2);
          const dataHigh = binary.charCodeAt(i * 2 + 1);
          let int16 = dataLow | (dataHigh << 8);
          if (int16 >= 0x8000) int16 -= 0x10000;
          buffer[i] = int16 / 0x7FFF;
      }
      const audioBuffer = audioCtx.createBuffer(1, buffer.length, 24000);
      audioBuffer.getChannelData(0).set(buffer);
      
      const source = audioCtx.createBufferSource();
      source.buffer = audioBuffer;
      source.connect(audioCtx.destination);
      
      source.onended = () => {
         setAiVoiceState('idle');
      };

      audioSourceRef.current = source;
      source.start();
      setAiVoiceState('playing');

    } catch (err) {
      console.error("AI Voice play error", err);
      setAiVoiceState('idle');
    }
  };

  const resetState = () => {
    setScreen('home');
    setLevel(null);
    setSelectedCategoryIndex(0);
    setSelectedSubTopicIndex(0);
    setCurrentWordIndex(0);
    setIsListening(false);
    setIsComplete(false);
    setHasStartedSpeaking(false);
    setActiveWordSpeech(null);
    setActiveTranslation(null);
    window.speechSynthesis.cancel();
    
    if (audioSourceRef.current) {
      try { audioSourceRef.current.stop(); } catch(e){}
    }
    if (audioContextRef.current) {
      try { audioContextRef.current.close().catch(()=>{}); } catch(e){}
    }
    setAiVoiceState('idle');
  };

  const handleLevelSelect = (l: Level) => {
    setLevel(l);
    setScreen('category');
  };

  const handleCategorySelect = (idx: number) => {
    setSelectedCategoryIndex(idx);
    setScreen('subtopic');
  };

  const handleSubTopicSelect = (idx: number) => {
    setSelectedSubTopicIndex(idx);
    setScreen('learning');
    setCurrentWordIndex(0);
    setIsComplete(false);
    setTimeout(() => {
      if (level) speakText(DB[selectedCategoryIndex].subTopics[idx].texts[level]);
    }, 500);
  };

  const handleNextItem = () => {
    if (!level) return;
    const cat = DB[selectedCategoryIndex];
    const nextIdx = selectedSubTopicIndex + 1;
    if (nextIdx < cat.subTopics.length) {
      handleSubTopicSelect(nextIdx);
    } else {
      setScreen('subtopic');
    }
  };

  // --- Render Helpers ---

  const renderHome = () => (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="flex flex-col h-full"
    >
      <header className="text-center mb-10">
        <h1 className="text-sm uppercase tracking-[0.4em] text-[#dcd0c0]/40 font-display mb-4">Linguist Elite</h1>
        <h2 className="text-3xl font-display font-light text-[#dcd0c0]">Select Proficiency</h2>
      </header>
      
      <div className="flex flex-col gap-3">
        {(['A1', 'A2', 'B1'] as Level[]).map((l) => (
          <button
            key={l}
            onClick={() => handleLevelSelect(l)}
            className="group flex items-center justify-between p-6 rounded-2xl bg-[#3d2b1f]/20 border border-[#dcd0c0]/5 transition-all hover:bg-[#3d2b1f]/40 hover:border-[#f0e68c]/20"
          >
            <div className="flex flex-col items-start font-display">
              <span className="text-[10px] uppercase tracking-widest text-[#f0e68c]/60 mb-1">Proficiency</span>
              <span className="text-xl font-light text-[#dcd0c0]">Level {l}</span>
            </div>
            <ChevronRight className="w-5 h-5 text-[#dcd0c0]/20 group-hover:text-[#f0e68c] transition-colors" />
          </button>
        ))}
      </div>
    </motion.div>
  );

  const renderCategories = () => {
    if (!level) return null;

    return (
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 1.05 }}
        className="flex flex-col h-full"
      >
        <header className="text-center mb-8">
          <h1 className="text-[10px] uppercase tracking-[4px] text-[#f0e68c]/60 font-display mb-3">Level {level}</h1>
          <h2 className="text-3xl font-display font-light text-[#dcd0c0]">Topics</h2>
        </header>
        
        <div className="grid grid-cols-1 gap-3 max-h-[350px] overflow-y-auto pr-2 custom-scrollbar">
          {DB.map((cat, i) => (
            <button
              key={i}
              onClick={() => handleCategorySelect(i)}
              className="group flex flex-col items-start p-5 rounded-xl bg-[#3d2b1f]/20 border border-[#dcd0c0]/5 transition-all hover:bg-[#3d2b1f]/40 hover:border-[#f0e68c]/20"
            >
              <div className="flex w-full items-center justify-between">
                <span className="text-lg font-light text-[#dcd0c0]">{cat.name}</span>
                <span className="text-[10px] text-[#f0e68c]/40 font-mono">0{i+1}</span>
              </div>
            </button>
          ))}
        </div>

        <button 
          onClick={() => setScreen('home')}
          className="mt-8 flex items-center gap-3 text-[#dcd0c0]/40 hover:text-[#f0e68c] transition-colors self-center text-[10px] uppercase tracking-[0.3em] font-display"
        >
          <ArrowLeft className="w-3 h-3" />
          Back to proficiency
        </button>
      </motion.div>
    );
  };

  const renderSubTopics = () => {
    if (!level) return null;
    const cat = DB[selectedCategoryIndex];

    return (
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 1.05 }}
        className="flex flex-col h-full"
      >
        <header className="text-center mb-8">
          <h1 className="text-[10px] uppercase tracking-[4px] text-[#f0e68c]/60 font-display mb-3">{cat.name}</h1>
          <h2 className="text-3xl font-display font-light text-[#dcd0c0]">Select Lesson</h2>
        </header>
        
        <div className="grid grid-cols-1 gap-3 max-h-[350px] overflow-y-auto pr-2 custom-scrollbar">
          {cat.subTopics.map((sub, i) => (
            <button
              key={i}
              onClick={() => handleSubTopicSelect(i)}
              className="group flex flex-col items-start p-5 rounded-xl bg-[#3d2b1f]/20 border border-[#dcd0c0]/5 transition-all hover:bg-[#3d2b1f]/40 hover:border-[#f0e68c]/20"
            >
              <div className="flex w-full items-center justify-between">
                <span className="text-lg font-light text-[#dcd0c0]">{sub.title}</span>
                <ChevronRight className="w-4 h-4 text-[#dcd0c0]/20 group-hover:text-[#f0e68c]" />
              </div>
            </button>
          ))}
        </div>

        <button 
          onClick={() => setScreen('category')}
          className="mt-8 flex items-center gap-3 text-[#dcd0c0]/40 hover:text-[#f0e68c] transition-colors self-center text-[10px] uppercase tracking-[0.3em] font-display"
        >
          <ArrowLeft className="w-3 h-3" />
          Back to topics
        </button>
      </motion.div>
    );
  };

  const renderLearning = () => (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="flex flex-col h-full relative"
    >
      <div className="text-center mb-8 shrink-0 flex items-center justify-between relative">
        <button onClick={() => setScreen('subtopic')} className="text-[#dcd0c0]/40 hover:text-[#f0e68c]">
           <ArrowLeft className="w-5 h-5"/>
        </button>
        <div className="flex flex-col items-center flex-1">
          <p className="text-[14px] tracking-[3px] uppercase text-[#dcd0c0] opacity-70 font-display mb-2">{level && DB[selectedCategoryIndex].name}</p>
          <h3 className="text-[32px] text-[#f0e68c] font-display font-light">
            {level && DB[selectedCategoryIndex].subTopics[selectedSubTopicIndex].title}:
          </h3>
        </div>
        <div className="w-5" />
      </div>

      <div className="flex-1 flex items-center justify-center py-6">
        <div className="text-[24px] leading-[1.6] text-left font-sans cursor-pointer relative select-none">
          {words.map((word, idx) => {
            const isHighlight = idx < currentWordIndex;
            const isSpeaking = activeWordSpeech === idx;
            const isTranslated = activeTranslation?.idx === idx;
            
            return (
              <span 
                key={idx} 
                onClick={(e) => handleWordInteraction(idx, e)}
                className="relative inline-block mr-1.5 transition-all duration-300 ease-out hover:scale-110 active:scale-95"
              >
                <span className={`inline-block transition-all duration-300 ${isTranslated ? 'blur-[4px] opacity-20' : ''} ${
                  isHighlight 
                    ? 'text-[#f0e68c] drop-shadow-[0_0_15px_rgba(240,230,140,0.4)] opacity-100' 
                    : isSpeaking
                      ? 'text-[#f0e68c] opacity-100 underline decoration-[#f0e68c]/30 underline-offset-4'
                      : 'text-[#dcd0c0] opacity-30 hover:opacity-100'
                }`}>
                  {word}
                </span>

                <AnimatePresence>
                  {isTranslated && (
                    <motion.span
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.8 }}
                      className="absolute inset-0 flex items-center justify-center text-[#f0e68c] font-medium drop-shadow-[0_0_15px_rgba(240,230,140,0.8)] z-10 pointer-events-none"
                      style={{ whiteSpace: 'nowrap' }}
                    >
                      {activeTranslation.text}
                    </motion.span>
                  )}
                </AnimatePresence>
              </span>
            );
          })}
        </div>
      </div>

      <div className="mt-auto flex flex-col items-center shrink-0 pt-6">
        <div className="relative flex items-center justify-center w-full">
          <div className="absolute right-[calc(50%+60px)]">
            <button 
              onClick={playAIVoice}
              className="w-[50px] h-[50px] rounded-full bg-[#f0e68c] shadow-[0_0_20px_rgba(240,230,140,0.2)] flex items-center justify-center transition-all hover:scale-105 active:scale-95 text-[#0a0a0a]"
              title="Listen with AI"
            >
              {aiVoiceState === 'loading' ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : aiVoiceState === 'playing' ? (
                <Square className="w-4 h-4 fill-current" />
              ) : (
                <Play className="w-5 h-5 ml-1 fill-current" />
              )}
            </button>
          </div>

          <div className="relative z-10">
            <AnimatePresence>
              {isListening && (
                <motion.div 
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1.3, opacity: 0.15 }}
                  exit={{ scale: 0.8, opacity: 0 }}
                  transition={{ duration: 1.2, repeat: Infinity, ease: "easeOut" }}
                  className="absolute inset-0 bg-[#f0e68c] rounded-full -m-2"
                />
              )}
            </AnimatePresence>
            
            <button
              onClick={toggleListening}
              className={`relative z-10 w-[90px] h-[90px] rounded-full flex items-center justify-center transition-all duration-300 ${
                isListening 
                  ? 'bg-[#f0e68c] border-[#f0e68c] shadow-[0_0_20px_rgba(240,230,140,0.5)]' 
                  : 'bg-[#3d2b1f] border-2 border-[#dcd0c0]'
              }`}
            >
              {isListening ? (
                <Mic className="w-8 h-8 text-[#0a0a0a]" />
              ) : (
                <Mic className="w-8 h-8 text-[#dcd0c0]" />
              )}
            </button>
          </div>

          <div className="absolute left-[calc(50%+65px)] w-[60px]">
             <span className="text-[9px] uppercase tracking-[1.5px] leading-tight text-[#f0e68c]/60 font-semibold flex flex-col gap-0.5">
               <span>Studio</span>
               <span>Voice</span>
             </span>
          </div>
        </div>
        
        <div className="mt-6 text-center text-[11px] text-[#dcd0c0] opacity-50 tracking-[1px] uppercase font-display">
          {isListening ? "Listening..." : "Tap to Speak"}
        </div>

        <button 
          onClick={resetState}
          className="mt-6 text-[#dcd0c0]/30 hover:text-[#dcd0c0] transition-colors text-[10px] uppercase tracking-[0.2em] font-display"
        >
          End Session
        </button>
      </div>

      <AnimatePresence>
        {isComplete && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-[#0a0a0a]/90 backdrop-blur-sm p-6"
          >
            <motion.div 
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              className="bg-[#3d2b1f] border border-[#f0e68c]/30 rounded-2xl p-10 max-w-sm w-full text-center shadow-2xl"
            >
              <div className="flex justify-center mb-6">
                <div className="w-20 h-20 bg-[#f0e68c]/10 rounded-full flex items-center justify-center">
                  <CheckCircle2 className="w-12 h-12 text-[#f0e68c]" />
                </div>
              </div>
              <h2 className="text-3xl font-light text-[#dcd0c0] mb-4">Level Complete</h2>
              <p className="text-[#dcd0c0]/60 mb-8 font-light">You've mastered this paragraph with excellent precision.</p>
              <button 
                onClick={handleNextItem}
                className="w-full py-4 bg-[#f0e68c] text-[#0a0a0a] font-semibold rounded-lg hover:bg-[#f0e68c]/90 transition-colors uppercase tracking-widest text-sm"
              >
                {level && selectedSubTopicIndex < DB[selectedCategoryIndex].subTopics.length - 1 ? 'Next Lesson' : 'Finish Mastery'}
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-[#dcd0c0] font-sans flex items-center justify-center p-4">
      {/* App Shell */}
      <div className="relative w-full max-w-[420px] h-[720px] bg-[#0a0a0a] border border-[#dcd0c0]/10 rounded-[40px] shadow-[0_50px_100px_-20px_rgba(0,0,0,0.5)] overflow-hidden flex flex-col p-10">
        
        {/* Nav Bar */}
        <div className="flex justify-between items-center mb-10 shrink-0">
          <span className="border border-[#dcd0c0] px-3 py-1 rounded-full text-[10px] tracking-[2px] uppercase font-semibold text-[#dcd0c0]">
            Linguist Elite
          </span>
          <div className="flex gap-2">
            <div className={`w-1.5 h-1.5 rounded-full ${screen === 'home' ? 'bg-[#f0e68c]' : 'bg-[#3d2b1f]'}`} />
            <div className={`w-1.5 h-1.5 rounded-full ${screen === 'category' ? 'bg-[#f0e68c]' : 'bg-[#3d2b1f]'}`} />
            <div className={`w-1.5 h-1.5 rounded-full ${screen === 'subtopic' ? 'bg-[#f0e68c]' : 'bg-[#3d2b1f]'}`} />
            <div className={`w-1.5 h-1.5 rounded-full ${screen === 'learning' ? 'bg-[#f0e68c]' : 'bg-[#3d2b1f]'}`} />
          </div>
        </div>

        {/* Level Selector (Mini) */}
        <div className="flex gap-2 mb-8 justify-center shrink-0">
          {(['A1', 'A2', 'B1'] as Level[]).map((l) => (
            <button
              key={l}
              onClick={() => handleLevelSelect(l)}
              className={`px-4 py-2 rounded border text-xs transition-all ${
                level === l 
                  ? 'bg-[#3d2b1f] border-[#dcd0c0] text-[#dcd0c0]' 
                  : 'bg-transparent border-[#dcd0c0]/20 text-[#dcd0c0]/60'
              }`}
            >
              {l}
            </button>
          ))}
        </div>

        <div className="flex-1 min-h-0">
          <AnimatePresence mode="wait">
            {screen === 'home' && renderHome()}
            {screen === 'category' && renderCategories()}
            {screen === 'subtopic' && renderSubTopics()}
            {screen === 'learning' && renderLearning()}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
