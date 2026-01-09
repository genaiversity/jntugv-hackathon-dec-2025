import React, { useEffect, useRef, useState } from 'react';
import * as faceapi from 'face-api.js';
import { X, Camera, Loader2, Download } from 'lucide-react';
import { analyzeEmotionWithLLM, generateEmotionReport } from '../services/geminiServices';

interface FaceData {
  expression: string;
  confidence: number;
  detectionTime: string;
}

interface WebcamFaceRecognitionProps {
  onClose: () => void;
  notesContent: string;
}

const WebcamFaceRecognition: React.FC<WebcamFaceRecognitionProps> = ({ onClose, notesContent }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isDetecting, setIsDetecting] = useState(true);
  const [expressions, setExpressions] = useState<FaceData[]>([]);
  const [currentExpression, setCurrentExpression] = useState<string>('');
  const [stats, setStats] = useState({
    happy: 0,
    sad: 0,
    angry: 0,
    dull: 0,
    surprised: 0,
    fearful: 0,
    disgusted: 0,
    neutral: 0
  });
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [emotionReport, setEmotionReport] = useState<string>('');
  const [keepCameraOn, setKeepCameraOn] = useState<boolean>(() => {
    try {
      return localStorage.getItem('keep_camera_on') === 'true';
    } catch (e) { return false; }
  });
  const [sensitivity, setSensitivity] = useState<number>(() => {
    try { return parseFloat(localStorage.getItem('emotion_sensitivity') || '1.5'); } catch (e) { return 1.5; }
  });
  const [earClosedThreshold, setEarClosedThreshold] = useState<number>(() => {
    try { return parseFloat(localStorage.getItem('ear_closed') || '0.20'); } catch (e) { return 0.20; }
  });
  const [earOpenThreshold, setEarOpenThreshold] = useState<number>(() => {
    try { return parseFloat(localStorage.getItem('ear_open') || '0.32'); } catch (e) { return 0.32; }
  });
  const [detectorPreset, setDetectorPreset] = useState<string>(() => {
    try { return localStorage.getItem('detector_preset') || 'balanced'; } catch (e) { return 'balanced'; }
  });
  const [displayStats, setDisplayStats] = useState<any>({
    happy: 0, sad: 0, angry: 0, dull: 0, surprised: 0, fearful: 0, disgusted: 0, neutral: 0
  });
  const detectionIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [debugLogging, setDebugLogging] = useState<boolean>(false);

  // Load face-api models
  useEffect(() => {
    const loadModels = async () => {
      try {
        // Use the official face-api.js CDN model URL
        const MODEL_URL = 'https://cdn.jsdelivr.net/npm/face-api.js@0.22.2/dist/models/';
        
        console.log('Loading face-api models from:', MODEL_URL);
        
        await Promise.all([
          faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
          faceapi.nets.faceExpressionNet.loadFromUri(MODEL_URL),
          faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
          faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL),
        ]);
        
        console.log('Face-api models loaded successfully');
        setIsLoading(false);
      } catch (error) {
        console.error('Error loading face-api models:', error);
        alert('Failed to load face recognition models. Please refresh the page and try again.');
        setIsLoading(false);
      }
    };

    loadModels();

    return () => {
      if (detectionIntervalRef.current) {
        clearInterval(detectionIntervalRef.current);
      }
    };
  }, []);

  // Start webcam
  useEffect(() => {
    const startWebcam = async () => {
      try {
        console.log('Requesting camera access...');
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { 
            width: { ideal: 640 }, 
            height: { ideal: 480 },
            facingMode: 'user'
          },
          audio: false
        });

        console.log('Camera access granted');

        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.onloadedmetadata = () => {
            console.log('Video metadata loaded, starting face detection');
            videoRef.current?.play();
            startFaceDetection();
          };
        }
      } catch (error) {
        console.error('Error accessing webcam:', error);
        if (error instanceof DOMException) {
          if (error.name === 'NotAllowedError') {
            alert('Camera permission denied. Please allow camera access in your browser settings and refresh the page.');
          } else if (error.name === 'NotFoundError') {
            alert('No camera found. Please check that your camera is connected and not in use by another application.');
          } else {
            alert(`Camera error: ${error.message}`);
          }
        } else {
          alert('Unable to access webcam. Please check permissions and refresh the page.');
        }
      }
    };

    if (!isLoading) {
      startWebcam();
    }

    return () => {
      if (!keepCameraOn) {
        if (videoRef.current?.srcObject) {
          const tracks = (videoRef.current.srcObject as MediaStream).getTracks();
          tracks.forEach(track => track.stop());
        }
      }
      if (detectionIntervalRef.current) {
        clearInterval(detectionIntervalRef.current);
      }
    };
  }, [isLoading]);

  // Face detection loop
  const startFaceDetection = () => {
    if (detectionIntervalRef.current) return; // already running
    detectionIntervalRef.current = setInterval(async () => {
      if (!isDetecting) return;
      if (!videoRef.current || !canvasRef.current) return;

      try {
        // Choose detector options based on preset
        const presetOptions: Record<string, { inputSize: number; scoreThreshold: number }> = {
          // tuned for higher sensitivity on typical laptop webcams
          fast: { inputSize: 224, scoreThreshold: 0.35 },
          balanced: { inputSize: 416, scoreThreshold: 0.25 },
          accurate: { inputSize: 640, scoreThreshold: 0.18 }
        };
        const opts = presetOptions[detectorPreset] || presetOptions.balanced;
        const detections = await faceapi
          .detectAllFaces(videoRef.current, new faceapi.TinyFaceDetectorOptions({ inputSize: opts.inputSize, scoreThreshold: opts.scoreThreshold }))
          .withFaceLandmarks()
          .withFaceExpressions();

        // Draw canvas
        const displayWidth = videoRef.current.videoWidth || videoRef.current.offsetWidth;
        const displayHeight = videoRef.current.videoHeight || videoRef.current.offsetHeight;
        const displaySize = { width: displayWidth, height: displayHeight };

        // ensure canvas matches video intrinsic size for correct drawing/scaling
        canvasRef.current.width = displaySize.width;
        canvasRef.current.height = displaySize.height;

        faceapi.matchDimensions(canvasRef.current, displaySize);
        const resizedDetections = faceapi.resizeResults(detections, displaySize);

        const ctx = canvasRef.current.getContext('2d');
        if (ctx) {
          ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
        }

        if (resizedDetections.length === 0) {
          setCurrentExpression('No face detected - Position your face in front of the camera');
          // decay stats gradually when no face
          setStats(prev => {
            const decay = 0.92;
            const out: any = {};
            Object.entries(prev).forEach(([k, v]) => { out[k] = parseFloat((Number(v) * decay).toFixed(3)); });
            return out;
          });
          // also decay displayStats so UI percentages fall
          setDisplayStats(prev => {
            const decay = 0.88;
            const out: any = {};
            Object.entries(prev).forEach(([k, v]) => { out[k] = parseFloat((Number(v) * decay).toFixed(3)); });
            return out;
          });
        }

        // Draw detections
        resizedDetections.forEach((detection: any) => {
          const box = detection.detection.box;
          // set style first
          if (ctx) {
            ctx.strokeStyle = '#4f46e5';
            ctx.lineWidth = 2;
            ctx.strokeRect(box.x, box.y, box.width, box.height);
          }

          // Get dominant expression
          const expressionsMap = detection.expressions as Record<string, number>;
          const dominantEntry = Object.entries(expressionsMap).reduce((a: [string, number], b: [string, number]) => a[1] > b[1] ? a : b);
          const expression = String(dominantEntry[0]).toLowerCase();
          const confidenceNum = (dominantEntry[1] as number) * 100;

          setCurrentExpression(`${expression} (${confidenceNum.toFixed(1)}%)`);
          if (debugLogging) console.debug('face-api expressions:', expressionsMap, 'dominant:', expression, 'conf:', confidenceNum.toFixed(1));

          // Add to expressions history (keep last 60) and derive stats from this sliding window
          const faceData: FaceData = {
            expression: expression,
            confidence: parseFloat(confidenceNum.toFixed(1)),
            detectionTime: new Date().toLocaleTimeString()
          };

          setExpressions(prev => {
            const next = [...prev.slice(-59), faceData];

            // derive stats from recent window
            const map: any = { happy: 0, sad: 0, angry: 0, dull: 0, surprised: 0, fearful: 0, disgusted: 0, neutral: 0 };
            next.forEach(r => {
              const key = String(r.expression).toLowerCase();
              if (!(key in map)) map[key] = 0;
              map[key] = parseFloat((map[key] + (r.confidence / 100) * sensitivity).toFixed(3));
            });

            // Eye heuristic: boost dull/surprised based on EAR for this frame
            try {
              const landmarks = detection.landmarks;
              const leftEye = landmarks.getLeftEye();
              const rightEye = landmarks.getRightEye();
              const eyeAspectRatio = (eyeAR(leftEye) + eyeAR(rightEye)) / 2;
              if (eyeAspectRatio < earClosedThreshold) {
                map.dull = parseFloat(((map.dull || 0) + 0.5).toFixed(3));
              }
              if (eyeAspectRatio > earOpenThreshold) {
                map.surprised = parseFloat(((map.surprised || 0) + 0.5).toFixed(3));
              }
            } catch (e) {
              // ignore
            }

            setStats(map);
            // update displayStats smoothly (EMA) so UI shows rising/falling percentages
            const alpha = Math.max(0.12, Math.min(0.5, 0.25 * sensitivity));
            setDisplayStats(prev => {
              const out: any = {};
              Object.keys(map).forEach(k => {
                const pv = Number(prev[k] || 0);
                const nv = Number(map[k] || 0);
                out[k] = parseFloat((pv * (1 - alpha) + nv * alpha).toFixed(3));
              });
              return out;
            });
            return next;
          });

          // Draw expression label
          if (ctx) {
            ctx.fillStyle = '#4f46e5';
            ctx.font = 'bold 16px Arial';
            ctx.fillText(expression, box.x, box.y - 10);
          }
        });
      } catch (error) {
        console.error('Error during face detection:', error);
      }
    }, 300);
  };

  // respond to isDetecting changes: stop or start detection interval
  useEffect(() => {
    if (!isDetecting) {
      if (detectionIntervalRef.current) {
        clearInterval(detectionIntervalRef.current);
        detectionIntervalRef.current = null;
      }
    } else {
      // if models loaded and video playing, start detection
      if (!isLoading && videoRef.current && !detectionIntervalRef.current) {
        startFaceDetection();
      }
    }
    // cleanup handled elsewhere
  }, [isDetecting, isLoading]);

  // Persist detector preset and restart detection when it changes
  useEffect(() => {
    try { localStorage.setItem('detector_preset', detectorPreset); } catch (e) {}
    if (detectionIntervalRef.current) {
      clearInterval(detectionIntervalRef.current);
      detectionIntervalRef.current = null;
    }
    if (!isLoading && isDetecting) {
      startFaceDetection();
    }
  }, [detectorPreset]);

  // Analyze emotions with LLM
  // Analyze emotions with LLM - Auto-trigger when sufficient data collected
  useEffect(() => {
    // Auto-analyze every 5 seconds if we have enough expression data
    const autoAnalyzeInterval = setInterval(async () => {
      if (expressions.length >= 10 && !isAnalyzing && emotionReport.length === 0) {
        await performEmotionAnalysis();
      }
    }, 5000);

    return () => clearInterval(autoAnalyzeInterval);
  }, [expressions, isAnalyzing, emotionReport]);

  // helper: compute eye aspect ratio from landmarks points
  const eyeAR = (eyePoints: any[]) => {
    // eyePoints expected as array of {x,y}
    if (!eyePoints || eyePoints.length < 6) return 0.4;
    const dist = (p1: any, p2: any) => Math.hypot(p1.x - p2.x, p1.y - p2.y);
    const A = dist(eyePoints[1], eyePoints[5]);
    const B = dist(eyePoints[2], eyePoints[4]);
    const C = dist(eyePoints[0], eyePoints[3]);
    if (C === 0) return 0.4;
    return (A + B) / (2.0 * C);
  };

  const performEmotionAnalysis = async () => {
    if (expressions.length === 0) {
      return;
    }

    setIsAnalyzing(true);

    try {
      const dominantExpressionEntry = Object.entries(stats).reduce((a, b) => a[1] > b[1] ? a : b);
      const expressionSummary = {
        expressions: expressions,
        stats: stats,
        dominantExpression: dominantExpressionEntry[0],
        notesContent: notesContent
      };

      console.log('Auto-analyzing emotions with LLM:', expressionSummary);
      const report = await analyzeEmotionWithLLM(expressionSummary);
      setEmotionReport(report);
    } catch (error) {
      console.error('Error analyzing emotions:', error);
      // Don't show alert for auto-analysis, just log it
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleAnalyzeWithLLM = async () => {
    if (expressions.length === 0) {
      alert('No expressions detected yet. Please wait for the webcam to detect faces.');
      return;
    }

    await performEmotionAnalysis();
  };

  // Download report
  const handleDownloadReport = async () => {
    try {
      const pdfContent = await generateEmotionReport({
        expressions: expressions,
        stats: stats,
        analysis: emotionReport,
        notesContent: notesContent
      });

      const blob = new Blob([pdfContent], { type: 'text/html;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `emotion_report_${new Date().getTime()}.html`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error generating report:', error);
      alert('Failed to generate report.');
    }
  };

  if (isLoading) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-xl p-8 max-w-2xl w-full mx-4">
          <div className="flex flex-col items-center justify-center gap-4">
            <Loader2 className="h-12 w-12 text-indigo-600 animate-spin" />
            <p className="text-lg font-semibold text-slate-800">Loading Face Detection Models...</p>
            <p className="text-sm text-slate-500">This may take a moment on first load</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div ref={containerRef} className="bg-white rounded-xl shadow-2xl max-w-5xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-gradient-to-r from-indigo-600 to-pink-600 p-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Camera className="h-6 w-6 text-white" />
            <h2 className="text-2xl font-bold text-white">Face Expression Analysis</h2>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                try {
                  if (containerRef.current) {
                    // request fullscreen for the modal container
                    // @ts-ignore
                    if (document.fullscreenElement) {
                      document.exitFullscreen();
                    } else {
                      // @ts-ignore
                      containerRef.current.requestFullscreen();
                    }
                  }
                } catch (e) { console.warn('fullscreen error', e); }
              }}
              className="text-white hover:bg-white hover:bg-opacity-20 p-2 rounded-lg transition-all"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 3H5a2 2 0 00-2 2v3m0 8v3a2 2 0 002 2h3m8 0h3a2 2 0 002-2v-3m0-8V5a2 2 0 00-2-2h-3" />
              </svg>
            </button>
            <button
              onClick={onClose}
              className="text-white hover:bg-white hover:bg-opacity-20 p-2 rounded-lg transition-all"
            >
              <X className="h-6 w-6" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Webcam Feed */}
            <div className="lg:col-span-2">
              <div className="bg-slate-100 rounded-lg overflow-hidden relative aspect-video">
                <video
                  ref={videoRef}
                  autoPlay
                  muted
                  className="w-full h-full object-cover"
                />
                <canvas
                  ref={canvasRef}
                  className="absolute inset-0 w-full h-full"
                />
              </div>

              {currentExpression && (
                <div className="mt-4 p-4 bg-indigo-50 border-2 border-indigo-200 rounded-lg flex items-center justify-between">
                  <p className="text-center text-lg font-semibold text-indigo-700">
                    Current Expression: {currentExpression}
                  </p>
                  <div className="flex items-center gap-3">
                    <label className="text-sm text-slate-600">Keep camera on</label>
                    <input type="checkbox" className="h-4 w-4" checked={keepCameraOn} onChange={(e) => { setKeepCameraOn(e.target.checked); try { localStorage.setItem('keep_camera_on', e.target.checked ? 'true' : 'false'); } catch (err) {} }} />
                    <label className="text-sm text-slate-600">Sensitivity</label>
                    <input type="range" min={0.5} max={3} step={0.1} value={sensitivity} onChange={(e) => { const v = parseFloat(e.target.value); setSensitivity(v); try { localStorage.setItem('emotion_sensitivity', String(v)); } catch (err) {} }} />
                  </div>
                  <div className="mt-3 flex items-center gap-2">
                    <span className="text-sm text-slate-600 mr-2">Presets</span>
                    <button
                      className="px-3 py-1 rounded bg-slate-100 text-slate-700 text-sm"
                      onClick={() => {
                        const s = 1.0; const c = 0.22; const o = 0.33;
                        setSensitivity(s); setEarClosedThreshold(c); setEarOpenThreshold(o);
                        try { localStorage.setItem('emotion_sensitivity', String(s)); localStorage.setItem('ear_closed', String(c)); localStorage.setItem('ear_open', String(o)); } catch (err) {}
                      }}
                    >Low</button>
                    <button
                      className="px-3 py-1 rounded bg-indigo-600 text-white text-sm"
                      onClick={() => {
                        const s = 1.5; const c = 0.20; const o = 0.32;
                        setSensitivity(s); setEarClosedThreshold(c); setEarOpenThreshold(o);
                        try { localStorage.setItem('emotion_sensitivity', String(s)); localStorage.setItem('ear_closed', String(c)); localStorage.setItem('ear_open', String(o)); } catch (err) {}
                      }}
                    >Medium</button>
                    <button
                      className="px-3 py-1 rounded bg-rose-500 text-white text-sm"
                      onClick={() => {
                        const s = 2.2; const c = 0.18; const o = 0.30;
                        setSensitivity(s); setEarClosedThreshold(c); setEarOpenThreshold(o);
                        try { localStorage.setItem('emotion_sensitivity', String(s)); localStorage.setItem('ear_closed', String(c)); localStorage.setItem('ear_open', String(o)); } catch (err) {}
                      }}
                    >High</button>
                    <div className="ml-auto text-xs text-slate-500">EAR thresholds: {earClosedThreshold.toFixed(2)} / {earOpenThreshold.toFixed(2)}</div>
                  </div>
                    <div className="mt-2 flex items-center gap-3">
                      <span className="text-sm text-slate-600">Detector</span>
                      <button
                        className={`px-3 py-1 rounded text-sm ${detectorPreset === 'fast' ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-700'}`}
                        onClick={() => { setDetectorPreset('fast'); try { localStorage.setItem('detector_preset', 'fast'); } catch (e) {} }}
                      >Fast</button>
                      <button
                        className={`px-3 py-1 rounded text-sm ${detectorPreset === 'balanced' ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-700'}`}
                        onClick={() => { setDetectorPreset('balanced'); try { localStorage.setItem('detector_preset', 'balanced'); } catch (e) {} }}
                      >Balanced</button>
                      <button
                        className={`px-3 py-1 rounded text-sm ${detectorPreset === 'accurate' ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-700'}`}
                        onClick={() => { setDetectorPreset('accurate'); try { localStorage.setItem('detector_preset', 'accurate'); } catch (e) {} }}
                      >Accurate</button>
                      <div className="ml-auto text-xs text-slate-500">Preset: {detectorPreset}</div>
                    </div>
                    <div className="mt-2 flex items-center gap-3">
                      <label className="text-sm text-slate-600 flex items-center gap-2">
                        <input type="checkbox" className="h-4 w-4" checked={debugLogging} onChange={(e) => setDebugLogging(e.target.checked)} />
                        <span>Debug logs</span>
                      </label>
                    </div>
                </div>
              )}

              {/* Mini graph: recent emotion distribution */}
              <div className="mt-3">
                <div className="bg-white p-2 rounded-md border border-slate-100">
                  <p className="text-xs text-slate-500 mb-2">Recent emotion distribution</p>
                  <div className="flex gap-2 items-end" style={{ height: 48 }}>
                    {(() => {
                      const map = displayStats || { happy:0, sad:0, angry:0, dull:0, surprised:0, fearful:0, disgusted:0, neutral:0 };
                      const total = Object.values(map).reduce((s: number, n: any) => s + Number(n), 0) || 1;
                      return Object.entries(map).map(([k, v]) => {
                        const pct = (Number(v) / Number(total)) * 100;
                        const h = Math.max(3, Math.round(pct));
                        return (
                          <div key={k} className="flex-1 flex flex-col items-center">
                            <div title={`${k}: ${pct.toFixed(1)}%`} style={{ height: `${h}%`, width: '100%', background: '#e9d5ff', borderRadius: 3 }} />
                            <div className="text-[10px] text-slate-500 mt-1">{k.slice(0,3)}</div>
                          </div>
                        );
                      });
                    })()}
                  </div>
                </div>
              </div>
            </div>

            {/* Stats Panel */}
            <div className="space-y-4">
              {/* Real-time Mood Status */}
              <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-lg p-4 border-2 border-purple-200">
                <h3 className="font-semibold text-slate-800 mb-3">Live Mood Analysis</h3>
                <div className="space-y-3">
                  {currentExpression && (
                    <div className="p-3 bg-white rounded border-l-4 border-purple-500">
                      <p className="text-sm font-semibold text-purple-700">Current Mood</p>
                      <p className="text-lg font-bold text-slate-800">{currentExpression}</p>
                    </div>
                  )}
                  
                  {Object.entries(displayStats).length > 0 && (
                    <div className="p-3 bg-white rounded border-l-4 border-pink-500">
                      <p className="text-sm font-semibold text-pink-700">Dominant Emotion</p>
                      <p className="text-lg font-bold text-slate-800">
                        {Object.entries(displayStats).reduce((a, b) => a[1] > b[1] ? a : b)[0]?.toUpperCase()}
                      </p>
                      <p className="text-xs text-slate-500 mt-1">
                        Detected: {expressions.length} frames
                      </p>
                    </div>
                  )}
                  
                  {isAnalyzing && (
                    <div className="p-3 bg-blue-50 rounded border-l-4 border-blue-500 flex items-center gap-2">
                      <Loader2 className="h-4 w-4 text-blue-600 animate-spin" />
                      <p className="text-sm text-blue-700">Analyzing mood...</p>
                    </div>
                  )}
                  
                  {emotionReport && (
                    <div className="p-3 bg-green-50 rounded border-l-4 border-green-500">
                      <p className="text-sm font-semibold text-green-700">✓ Analysis Complete</p>
                      <p className="text-xs text-slate-600 mt-1">Mood report generated</p>
                    </div>
                  )}
                </div>
              </div>

              <div className="bg-slate-50 rounded-lg p-4 border border-slate-200">
                <h3 className="font-semibold text-slate-800 mb-4">Expression Stats</h3>
                <div className="space-y-2 text-sm">
                  {(() => {
                    const entries = Object.entries(displayStats);
                    const total = entries.reduce((s, [, v]) => s + Number(v), 0) || 1;
                    return entries.map(([emotion, count]) => {
                      const pct = (Number(count) / total) * 100;
                      return (
                        <div key={emotion} className="flex items-center justify-between">
                          <span className="capitalize text-slate-700">{emotion}</span>
                          <span className="font-semibold text-indigo-600">{pct.toFixed(1)}%</span>
                        </div>
                      );
                    });
                  })()}
                </div>
              </div>

              <div className="bg-slate-50 rounded-lg p-4 border border-slate-200">
                <h3 className="font-semibold text-slate-800 mb-2">Total Detections</h3>
                <p className="text-2xl font-bold text-indigo-600">{expressions.length}</p>
              </div>

              <button
                onClick={handleAnalyzeWithLLM}
                disabled={isAnalyzing || expressions.length === 0}
                className="w-full bg-gradient-to-r from-indigo-600 to-pink-600 text-white font-semibold py-3 px-4 rounded-lg hover:from-indigo-700 hover:to-pink-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
              >
                {isAnalyzing ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin" />
                    Analyzing...
                  </>
                ) : (
                  'Analyze with AI'
                )}
              </button>
            </div>
          </div>

          {/* Analysis Report */}
          {emotionReport && (
            <div className="mt-6">
              <div className="bg-indigo-50 rounded-lg p-6 border-2 border-indigo-200">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-indigo-800">AI Analysis Report</h3>
                  <button
                    onClick={handleDownloadReport}
                    className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors text-sm font-medium"
                  >
                    <Download className="h-4 w-4" />
                    Download Report
                  </button>
                </div>
                <div className="prose prose-indigo max-w-none text-slate-700 whitespace-pre-wrap">
                  {emotionReport}
                </div>
              </div>
            </div>
          )}

          {/* Detection Controls */}
          <div className="mt-6 flex gap-3">
            <button
              onClick={() => setIsDetecting(!isDetecting)}
              className={`flex-1 py-2 px-4 rounded-lg font-semibold transition-all ${
                isDetecting
                  ? 'bg-green-500 text-white hover:bg-green-600'
                  : 'bg-slate-300 text-slate-800 hover:bg-slate-400'
              }`}
            >
              {isDetecting ? 'Stop Detection' : 'Start Detection'}
            </button>
            <button
              onClick={onClose}
              className="flex-1 py-2 px-4 rounded-lg font-semibold bg-slate-200 text-slate-800 hover:bg-slate-300 transition-all"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WebcamFaceRecognition;
