import React, { useState, useEffect, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Mic, ChevronRight, ArrowLeft, CheckCircle2, Play, Square, Loader2 } from 'lucide-react';
import { GoogleGenAI } from "@google/genai";
import { DB, Level, Category, SubTopic } from './db';
import { getOfflineTranslation } from './dictionary';

// Initialize Gemini
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

// --- Speech Recognition Types ---
interface SpeechRecognitionEvent extends Event {
  results: SpeechRecognitionResultList;
}

interface SpeechRecognition extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start: () => void;
  stop: () => void;
  onresult: (event: SpeechRecognitionEvent) => void;
  onerror: (event: any) => void;
  onend: () => void;
}

const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

export default function App() {
  const [screen, setScreen] = useState<'home' | 'category' | 'subtopic' | 'learning'>('home');
  const [level, setLevel] = useState<Level | null>(null);
  const [selectedCategoryIndex, setSelectedCategoryIndex] = useState(0);
  const [selectedSubTopicIndex, setSelectedSubTopicIndex] = useState(0);
  const [currentWordIndex, setCurrentWordIndex] = useState(0);
  const [isListening, setIsListening] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const [activeWordSpeech, setActiveWordSpeech] = useState<number | null>(null);
  const [activeTranslation, setActiveTranslation] = useState<{idx: number, text: string} | null>(null);
  const [isLoadingTranslation, setIsLoadingTranslation] = useState(false);
  const [aiVoiceState, setAiVoiceState] = useState<'idle' | 'loading' | 'playing'>('idle');

  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const isListeningRef = useRef(false);
  const audioContextRef = useRef<AudioContext | null>(null);
  const audioSourceRef = useRef<AudioBufferSourceNode | null>(null);

  useEffect(() => {
    isListeningRef.current = isListening;
  }, [isListening]);

  const words = useMemo(() => {
    if (!level) return [];
    return DB[selectedCategoryIndex].subTopics[selectedSubTopicIndex].texts[level].split(/\s+/);
  }, [level, selectedCategoryIndex, selectedSubTopicIndex]);

  const cleanWords = useMemo(() => {
    return words.map(w => w.replace(/[.,!?;:]/g, '').toLowerCase());
  }, [words]);

  useEffect(() => {
    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = 'en-US';

      recognition.onresult = (event: SpeechRecognitionEvent) => {
        let interimTranscript = '';
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            const speech = event.results[i][0].transcript.toLowerCase();
            processSpeech(speech);
          } else {
            interimTranscript += event.results[i][0].transcript;
          }
        }
      };

      recognition.onend = () => {
        if (isListeningRef.current) {
          recognition.start();
        }
      };

      recognitionRef.current = recognition;
    }
  }, []);

  const processSpeech = (speech: string) => {
    const spokenWords = speech.split(/\s+/);
    let tempIndex = currentWordIndex;
    
    spokenWords.forEach(sw => {
      if (tempIndex < cleanWords.length && sw.includes(cleanWords[tempIndex])) {
        tempIndex++;
      }
    });

    if (tempIndex !== currentWordIndex) {
      setCurrentWordIndex(tempIndex);
      if (tempIndex >= cleanWords.length) {
        setIsComplete(true);
        setIsListening(false);
        recognitionRef.current?.stop();
      }
    }
  };

  const toggleListening = () => {
    if (isListening) {
      setIsListening(false);
      recognitionRef.current?.stop();
    } else {
      setIsListening(true);
      recognitionRef.current?.start();
    }
  };

  const speakText = (text: string) => {
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'en-US';
    utterance.rate = 0.9;
    window.speechSynthesis.speak(utterance);
  };

  const speakWord = (word: string, idx: number) => {
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(word);
    utterance.lang = 'en-US';
    utterance.onstart = () => setActiveWordSpeech(idx);
    utterance.onend = () => setActiveWordSpeech(null);
    window.speechSynthesis.speak(utterance);
  };

  const translateWord = (word: string, idx: number) => {
    const translation = getOfflineTranslation(word);
    setActiveTranslation({ idx, text: translation });
  };

  const handleWordInteraction = (idx: number, event: React.MouseEvent | any) => {
    if (event.detail === 2) { // Double click
      translateWord(words[idx], idx);
    } else {
      speakWord(words[idx], idx);
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

  const renderHome = () => (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="flex flex-col items-center justify-center h-full"
    >
      <div className="text-center mb-12">
        <h1 className="text-[12px] uppercase tracking-[6px] text-[#f0e68c] font-display mb-4">Linguistics Lab</h1>
        <h2 className="text-5xl font-display font-light text-[#dcd0c0] leading-tight">Master Your<br/>Pronunciation</h2>
      </div>
      
      <div className="flex flex-col gap-4 w-full max-w-[280px]">
        {(['A1', 'A2', 'B1'] as Level[]).map((l) => (
          <button
            key={l}
            onClick={() => handleLevelSelect(l)}
            className="group relative overflow-hidden py-5 px-8 rounded-xl bg-[#3d2b1f] border border-[#f0e68c]/20 transition-all hover:bg-[#4e3829] active:scale-95"
          >
            <div className="flex items-center justify-between relative z-10">
              <div className="text-left">
                <span className="block text-[10px] text-[#f0e68c]/60 font-display uppercase tracking-widest mb-1">Begin Experience</span>
                <span className="text-2xl font-display text-[#dcd0c0]">Level {l}</span>
              </div>
              <ChevronRight className="w-5 h-5 text-[#f0e68c] transition-transform group-hover:translate-x-1" />
            </div>
            <div className="absolute top-0 right-0 p-1 opacity-10 group-hover:opacity-20 transition-opacity">
              <span className="text-6xl font-bold font-display leading-[0.8]">{l}</span>
            </div>
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
          Change Level
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
        <div className="flex flex-wrap items-center justify-center gap-x-2 gap-y-4 max-w-2xl px-4 leading-[2]">
          {words.map((word, i) => (
            <div key={i} className="relative group">
              <motion.span
                onClick={(e) => handleWordInteraction(i, e)}
                animate={{ 
                  color: i < currentWordIndex ? '#f0e68c' : '#dcd0c0',
                  scale: activeWordSpeech === i ? 1.1 : 1,
                  opacity: i < currentWordIndex ? 1 : 0.6
                }}
                className={`text-[28px] cursor-pointer inline-block transition-all duration-300 font-display font-medium ${
                  i < currentWordIndex ? 'text-[#f0e68c]' : 'text-[#dcd0c0]'
                } ${activeWordSpeech === i ? 'font-bold underline' : ''}`}
              >
                {word}
              </motion.span>
              
              <AnimatePresence>
                {activeTranslation?.idx === i && (
                  <motion.div
                    initial={{ opacity: 0, y: 10, scale: 0.9 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.9 }}
                    className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-1 bg-[#f0e68c] text-[#0a0a0a] text-xs font-semibold rounded pointer-events-none whitespace-nowrap z-50 shadow-xl"
                  >
                    {activeTranslation.text}
                    <div className="absolute top-full left-1/2 -translate-x-1/2 border-8 border-transparent border-t-[#f0e68c]" />
                  </motion.div>
                )}
              </AnimatePresence>

              {i === currentWordIndex && !isComplete && (
                <motion.div 
                  layoutId="cursor"
                  className="absolute -bottom-1 left-0 right-0 h-[2px] bg-[#f0e68c]"
                  animate={{ opacity: [1, 0.4, 1] }}
                  transition={{ repeat: Infinity, duration: 1 }}
                />
              )}
            </div>
          ))}
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
          {isComplete ? "Marvelous Work" : isListening ? "Reciting..." : "Hold to Begin"}
        </div>
      </div>

      <AnimatePresence>
        {isComplete && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="absolute inset-0 bg-[#0a0a0a]/90 backdrop-blur-sm z-[100] flex items-center justify-center p-8"
          >
            <motion.div 
              initial={{ scale: 0.8, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              className="bg-[#3d2b1f] border border-[#f0e68c]/30 p-8 rounded-2xl w-full max-w-sm text-center shadow-2xl"
            >
              <div className="w-20 h-20 bg-[#f0e68c] rounded-full 
