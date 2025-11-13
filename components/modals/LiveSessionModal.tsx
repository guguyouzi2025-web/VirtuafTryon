import React, { useState, useEffect, useRef, useCallback } from 'react';
import { GoogleGenAI, LiveServerMessage, Modality, Blob, LiveSession } from "@google/genai";
import { Button } from '../shared/Button';
import { useI18n } from '../../i18n/i18n';
import { TranscriptionEntry } from '../../types';
import { blobToBase64 } from '../../utils/fileUtils';
import { Spinner } from '../shared/Spinner';

interface LiveSessionModalProps {
    isOpen: boolean;
    onClose: () => void;
    onNotify: (message: string, type: 'success' | 'error') => void;
}

const FRAME_RATE = 5; // Send 5 frames per second
const JPEG_QUALITY = 0.7;

// --- Audio Helper Functions (as per guidelines) ---

function encode(bytes: Uint8Array) {
  let binary = '';
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

function decode(base64: string) {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

async function decodeAudioData(
  data: Uint8Array,
  ctx: AudioContext,
  sampleRate: number,
  numChannels: number,
): Promise<AudioBuffer> {
  const dataInt16 = new Int16Array(data.buffer);
  const frameCount = dataInt16.length / numChannels;
  const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);

  for (let channel = 0; channel < numChannels; channel++) {
    const channelData = buffer.getChannelData(channel);
    for (let i = 0; i < frameCount; i++) {
      channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
    }
  }
  return buffer;
}


export const LiveSessionModal: React.FC<LiveSessionModalProps> = ({ isOpen, onClose, onNotify }) => {
    const { t } = useI18n();
    const [status, setStatus] = useState<'idle' | 'requesting' | 'connecting' | 'active' | 'error'>('idle');
    const [transcription, setTranscription] = useState<TranscriptionEntry[]>([]);
    
    const localVideoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const localStreamRef = useRef<MediaStream | null>(null);
    const sessionPromiseRef = useRef<Promise<LiveSession> | null>(null);

    const inputAudioContextRef = useRef<AudioContext | null>(null);
    const outputAudioContextRef = useRef<AudioContext | null>(null);
    const scriptProcessorRef = useRef<ScriptProcessorNode | null>(null);
    const mediaStreamSourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
    const nextStartTimeRef = useRef<number>(0);
    const audioSourcesRef = useRef<Set<AudioBufferSourceNode>>(new Set());
    const frameIntervalRef = useRef<number | null>(null);

    const transcriptionScrollRef = useRef<HTMLDivElement>(null);
    
    useEffect(() => {
        if (transcriptionScrollRef.current) {
            transcriptionScrollRef.current.scrollTop = transcriptionScrollRef.current.scrollHeight;
        }
    }, [transcription]);

    const cleanup = useCallback(() => {
        if (frameIntervalRef.current) {
            clearInterval(frameIntervalRef.current);
            frameIntervalRef.current = null;
        }

        sessionPromiseRef.current?.then(session => session.close());
        sessionPromiseRef.current = null;

        localStreamRef.current?.getTracks().forEach(track => track.stop());
        localStreamRef.current = null;

        if (localVideoRef.current) localVideoRef.current.srcObject = null;
        
        scriptProcessorRef.current?.disconnect();
        mediaStreamSourceRef.current?.disconnect();
        inputAudioContextRef.current?.close();
        outputAudioContextRef.current?.close();
        
        scriptProcessorRef.current = null;
        mediaStreamSourceRef.current = null;
        inputAudioContextRef.current = null;
        outputAudioContextRef.current = null;

        audioSourcesRef.current.forEach(source => source.stop());
        audioSourcesRef.current.clear();
        nextStartTimeRef.current = 0;
        
        setTranscription([]);
        setStatus('idle');
    }, []);

    const handleClose = () => {
        cleanup();
        onClose();
    };

    const startSession = async () => {
        setStatus('requesting');
        setTranscription([]);

        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: true });
            localStreamRef.current = stream;
            if (localVideoRef.current) {
                localVideoRef.current.srcObject = stream;
            }
            setStatus('connecting');
        } catch (err) {
            console.error(err);
            onNotify(t('errors.liveSessionPermissions'), 'error');
            setStatus('error');
            return;
        }

        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
        
        let currentInputTranscription = '';
        let currentOutputTranscription = '';

        sessionPromiseRef.current = ai.live.connect({
            model: 'gemini-2.5-flash-native-audio-preview-09-2025',
            callbacks: {
                onopen: () => {
                    setStatus('active');
                    inputAudioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
                    outputAudioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
                    
                    if (!inputAudioContextRef.current || !outputAudioContextRef.current || !localStreamRef.current) return;

                    // Audio Streaming
                    const source = inputAudioContextRef.current.createMediaStreamSource(localStreamRef.current);
                    mediaStreamSourceRef.current = source;
                    const scriptProcessor = inputAudioContextRef.current.createScriptProcessor(4096, 1, 1);
                    scriptProcessorRef.current = scriptProcessor;

                    scriptProcessor.onaudioprocess = (audioProcessingEvent) => {
                        const inputData = audioProcessingEvent.inputBuffer.getChannelData(0);
                        const pcmBlob = createBlob(inputData);
                        sessionPromiseRef.current?.then((session) => {
                            session.sendRealtimeInput({ media: pcmBlob });
                        });
                    };
                    source.connect(scriptProcessor);
                    scriptProcessor.connect(inputAudioContextRef.current.destination);

                    // Video Streaming
                    if (localVideoRef.current && canvasRef.current) {
                        const videoEl = localVideoRef.current;
                        const canvasEl = canvasRef.current;
                        const ctx = canvasEl.getContext('2d');
                        if (!ctx) return;
                        
                        frameIntervalRef.current = window.setInterval(() => {
                            canvasEl.width = videoEl.videoWidth;
                            canvasEl.height = videoEl.videoHeight;
                            ctx.drawImage(videoEl, 0, 0, videoEl.videoWidth, videoEl.videoHeight);
                            canvasEl.toBlob(
                                async (blob) => {
                                    if (blob) {
                                        const base64Data = await blobToBase64(blob);
                                        sessionPromiseRef.current?.then((session) => {
                                            session.sendRealtimeInput({
                                                media: { data: base64Data, mimeType: 'image/jpeg' }
                                            });
                                        });
                                    }
                                },
                                'image/jpeg',
                                JPEG_QUALITY
                            );
                        }, 1000 / FRAME_RATE);
                    }
                },
                onmessage: async (message: LiveServerMessage) => {
                     // Handle transcription
                    if (message.serverContent?.outputTranscription) {
                        const text = message.serverContent.outputTranscription.text;
                        currentOutputTranscription += text;
                         setTranscription(prev => {
                            const last = prev[prev.length - 1];
                            if (last?.source === 'model') {
                                return [...prev.slice(0, -1), { ...last, text: currentOutputTranscription }];
                            }
                            return [...prev, { source: 'model', text: currentOutputTranscription, isFinal: false }];
                        });

                    } else if (message.serverContent?.inputTranscription) {
                        const text = message.serverContent.inputTranscription.text;
                        currentInputTranscription += text;
                        setTranscription(prev => {
                            const last = prev[prev.length - 1];
                            if (last?.source === 'user') {
                                return [...prev.slice(0, -1), { ...last, text: currentInputTranscription }];
                            }
                            return [...prev, { source: 'user', text: currentInputTranscription, isFinal: false }];
                        });
                    }

                    if (message.serverContent?.turnComplete) {
                        const finalInput = currentInputTranscription;
                        const finalOutput = currentOutputTranscription;

                        setTranscription(prev => {
                            const next = [...prev];
                            // FIX: Property 'findLast' does not exist on type 'any[]'. Replaced with a compatible alternative.
                            const lastUser = [...next].reverse().find(t => t.source === 'user' && !t.isFinal);
                            if (lastUser) lastUser.isFinal = true;
                            // FIX: Property 'findLast' does not exist on type 'any[]'. Replaced with a compatible alternative.
                            const lastModel = [...next].reverse().find(t => t.source === 'model' && !t.isFinal);
                            if (lastModel) lastModel.isFinal = true;
                            return next;
                        });

                        currentInputTranscription = '';
                        currentOutputTranscription = '';
                    }

                    // Handle audio playback
                    const base64EncodedAudioString = message.serverContent?.modelTurn?.parts[0]?.inlineData?.data;
                    if (base64EncodedAudioString && outputAudioContextRef.current) {
                        const outCtx = outputAudioContextRef.current;
                        nextStartTimeRef.current = Math.max(nextStartTimeRef.current, outCtx.currentTime);
                        
                        const audioBuffer = await decodeAudioData(decode(base64EncodedAudioString), outCtx, 24000, 1);
                        const source = outCtx.createBufferSource();
                        source.buffer = audioBuffer;
                        source.connect(outCtx.destination);
                        
                        source.addEventListener('ended', () => {
                            audioSourcesRef.current.delete(source);
                        });

                        source.start(nextStartTimeRef.current);
                        nextStartTimeRef.current += audioBuffer.duration;
                        audioSourcesRef.current.add(source);
                    }
                },
                onerror: (e: ErrorEvent) => {
                    console.error('Session error:', e);
                    onNotify(t('errors.liveSessionFailed'), 'error');
                    setStatus('error');
                    cleanup();
                },
                onclose: (e: CloseEvent) => {
                    cleanup();
                },
            },
            config: {
                responseModalities: [Modality.AUDIO],
                inputAudioTranscription: {},
                outputAudioTranscription: {},
                systemInstruction: 'You are a friendly and helpful fashion stylist. The user is showing you an outfit they are wearing via their camera. Your goal is to provide constructive feedback and styling advice in a concise and encouraging manner.',
            },
        });

        function createBlob(data: Float32Array): Blob {
            const l = data.length;
            const int16 = new Int16Array(l);
            for (let i = 0; i < l; i++) {
                int16[i] = data[i] * 32768;
            }
            return {
                data: encode(new Uint8Array(int16.buffer)),
                mimeType: 'audio/pcm;rate=16000',
            };
        }
    };

    useEffect(() => {
      // Cleanup on component unmount or when modal is closed externally
      return () => {
        if (status !== 'idle') {
          cleanup();
        }
      };
    }, [status, cleanup]);

    if (!isOpen) return null;
    
    return (
        <div role="dialog" aria-modal="true" className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4" onClick={handleClose}>
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-5xl h-[90vh] flex flex-col" onClick={e => e.stopPropagation()}>
                <h2 className="text-xl font-bold p-4 border-b border-gray-200 text-center">{t('liveSessionModal.title')}</h2>
                
                <div className="flex-grow p-6 grid grid-cols-1 md:grid-cols-3 gap-6 overflow-hidden">
                    {/* Video Feed & Controls */}
                    <div className="flex flex-col space-y-4">
                        <div className="relative aspect-[3/4] bg-gray-900 rounded-lg overflow-hidden flex items-center justify-center">
                            <video ref={localVideoRef} autoPlay playsInline muted className="w-full h-full object-cover transform scale-x-[-1]"></video>
                            <canvas ref={canvasRef} className="hidden"></canvas>
                            {status === 'active' && (
                                <div className="absolute top-3 left-3 flex items-center space-x-2 bg-red-500 text-white px-2 py-1 rounded-full text-xs font-semibold">
                                    <span className="relative flex h-2 w-2">
                                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
                                        <span className="relative inline-flex rounded-full h-2 w-2 bg-white"></span>
                                    </span>
                                    <span>LIVE</span>
                                </div>
                            )}
                        </div>
                        {status === 'idle' || status === 'error' ? (
                            <Button onClick={startSession} className="w-full text-lg py-3">{t('liveSessionModal.start')}</Button>
                        ) : status === 'active' ? (
                             <Button onClick={handleClose} variant="secondary" className="w-full text-lg py-3 !bg-red-500 hover:!bg-red-600 text-white">{t('liveSessionModal.end')}</Button>
                        ) : (
                            <Button disabled className="w-full text-lg py-3 inline-flex items-center justify-center gap-2"><Spinner size="sm"/> {t('liveSessionModal.connecting')}</Button>
                        )}
                         <p className="text-sm text-gray-500 text-center">{t('liveSessionModal.description')}</p>
                    </div>

                    {/* Transcription */}
                    <div className="md:col-span-2 bg-gray-100 rounded-lg p-4 flex flex-col">
                        <div ref={transcriptionScrollRef} className="flex-grow space-y-4 overflow-y-auto pr-2">
                            {transcription.map((entry, index) => (
                                <div key={index} className={`flex flex-col ${entry.source === 'user' ? 'items-end' : 'items-start'}`}>
                                    <div className={`max-w-[80%] p-3 rounded-xl ${entry.source === 'user' ? 'bg-blue-500 text-white rounded-br-none' : 'bg-white text-gray-800 rounded-bl-none'}`}>
                                        <span className="font-bold text-sm mb-1">{entry.source === 'user' ? t('liveSessionModal.you') : t('liveSessionModal.stylist')}</span>
                                        <p className="text-base">{entry.text}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
