import React, { useState, useRef, useEffect } from 'react';
import { X, ChevronLeft, ChevronRight, Volume2, Download, Zap } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import * as faceapi from 'face-api.js';
import AIReliefGame from './AIReliefGame.tsx';

interface ReadingViewWithCameraProps {
  htmlContent: string;
  fileName: string;
  studentLanguage?: string;
  onClose: () => void;
  onDownload: () => void;
}

interface FaceExpression {
  happy: number;
  sad: number;
  angry: number;
  neutral: number;
  surprised: number;
  fearful: number;
  disgusted: number;
  dull: number;
}

const ReadingViewWithCamera: React.FC<ReadingViewWithCameraProps> = ({
  htmlContent,
  fileName,
  studentLanguage = 'English',
  onClose,
  onDownload
}) => {
  const [currentPage, setCurrentPage] = useState(1);
  const [estimatedPageCount, setEstimatedPageCount] = useState(1);
  const [showGame, setShowGame] = useState(false);
  const [isReading, setIsReading] = useState(true);
  const [showCameraModal, setShowCameraModal] = useState(false);
  
  // Camera and emotion detection state
  const [cameraActive, setCameraActive] = useState(false);
  const [modelsLoaded, setModelsLoaded] = useState(false);
  const [lastDetectionsCount, setLastDetectionsCount] = useState<number | null>(null);
  const [lastDetectError, setLastDetectError] = useState<string | null>(null);
  const [currentEmotion, setCurrentEmotion] = useState<string>('neutral');
  const [emotionStats, setEmotionStats] = useState<FaceExpression>({
    happy: 0, sad: 0, angry: 0, neutral: 0,
    surprised: 0, fearful: 0, disgusted: 0, dull: 0
  });
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisProgress, setAnalysisProgress] = useState(0);
  const [analysisResults, setAnalysisResults] = useState<string>('');
  const [tfLoaded, setTfLoaded] = useState(false);
  const [labeledDescriptorsLoaded, setLabeledDescriptorsLoaded] = useState(false);
  const labeledDescriptorsRef = useRef<any[]>([]);
  const faceMatcherRef = useRef<any>(null);
  const [recognizedName, setRecognizedName] = useState<string | null>(null);
  const [recognizedDistance, setRecognizedDistance] = useState<number | null>(null);
  const [detectionCount, setDetectionCount] = useState(0);
  const [cameraError, setCameraError] = useState<string>('');
  const [needsUserGesture, setNeedsUserGesture] = useState(false);

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const detectionIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const analysisBufferRef = useRef<string[]>([]);
  const analysisModeRef = useRef<boolean>(false);
  const analysisTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const tfModelRef = useRef<any>(null);

  // Estimate page count based on content length
  useEffect(() => {
    if (htmlContent) {
      const length = htmlContent.length;
      const estimated = Math.ceil(length / 3000);
      setEstimatedPageCount(Math.max(5, estimated));
    }
  }, [htmlContent]);

  // Initialize camera on mount
  useEffect(() => {
    const initializeAsync = async () => {
      // Start camera immediately without waiting for models
      const cameraPromise = initializeCamera();
      
      // Load models in parallel with camera
      const modelPromise = (async () => {
        try {
          const MODEL_URL = 'https://cdn.jsdelivr.net/npm/face-api.js@0.22.2/dist/models/';
          console.log('Loading face-api models...');
          
          await Promise.all([
            faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
            faceapi.nets.faceExpressionNet.loadFromUri(MODEL_URL),
            faceapi.nets.ssdMobilenetv1.loadFromUri(MODEL_URL),
            faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
            faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL)
          ]);
          console.log('✓ Face-api models loaded');
          setModelsLoaded(true);
        } catch (error) {
          console.error('Error loading models:', error);
          setCameraError('Face detection models failed to load. Camera active but detection unavailable.');
        }
      })();
      
      // Wait for both to complete
      await Promise.all([cameraPromise, modelPromise]);

      // After models are loaded, load any labeled faces for recognition
      await loadLabeledFaces();
    };
    
    initializeAsync();
    
    return () => {
      stopCamera();
      if (detectionIntervalRef.current) {
        clearInterval(detectionIntervalRef.current);
      }
    };
  }, []);

  const initializeCamera = async () => {
    try {
      setCameraError('');
      console.log('Requesting camera access...');
      
      // Request camera permission explicitly
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { 
          width: { ideal: 640 }, 
          height: { ideal: 480 },
          facingMode: 'user'
        },
        audio: false
      });

      console.log('✓ Camera stream obtained');

      if (videoRef.current) {
        // attach stream to the visible video element
        try {
          // detach any previous stream
          if (videoRef.current.srcObject) {
            const prev = videoRef.current.srcObject as MediaStream;
            prev.getTracks().forEach(t => t.stop());
          }
        } catch (e) {
          console.warn('Error stopping previous tracks', e);
        }

        videoRef.current.srcObject = stream;

        // Mark camera active immediately so UI shows video container
        setCameraActive(true);

        // Start detection loop right away; detection will be a no-op until models load
        try {
          startFaceDetection();
        } catch (e) {
          console.warn('startFaceDetection delayed until models available', e);
        }

        // Attempt to play video; don't block UI if play is delayed
        try {
          const playPromise = videoRef.current.play();
          if (playPromise && typeof playPromise.then === 'function') {
            playPromise
              .then(() => {
                console.log('✓ Video playing');
              })
              .catch(err => {
                console.warn('Video play rejected (autoplay policy?), will retry on interaction', err);
                setNeedsUserGesture(true);
              });
          }
        } catch (err) {
          console.warn('Video play error:', err);
        }
        
        return Promise.resolve();
      }
    } catch (error: any) {
      console.error('Camera access error:', error);
      if (error.name === 'NotAllowedError') {
        setCameraError('Camera permission denied. Please allow camera access in your browser settings.');
      } else if (error.name === 'NotFoundError') {
        setCameraError('No camera found on this device.');
      } else {
        setCameraError(error.message || 'Failed to access camera');
      }
      setCameraActive(false);
    }
  };

  // Helper to attach stream and try to play (used by overlay button)
  const attachAndPlay = async () => {
    try {
      if (!videoRef.current) return;
      const stream = videoRef.current.srcObject as MediaStream | null;
      console.log('attachAndPlay: current srcObject', !!stream);

      // If no stream available, re-init camera
      if (!stream) {
        await initializeCamera();
      }

      // Force play attempt
      try {
        await videoRef.current.play();
        console.log('attachAndPlay: video.play() successful');
        setNeedsUserGesture(false);
        setCameraError('');
      } catch (err) {
        console.warn('attachAndPlay playback failed', err);
        setCameraError('Playback blocked. Please interact with the page or allow camera.');
        setNeedsUserGesture(true);
      }
    } catch (err) {
      console.error('attachAndPlay error', err);
    }
  };

  // Load labeled faces from localStorage and build FaceMatcher
  const loadLabeledFaces = async () => {
    try {
      const raw = localStorage.getItem('gvp_labeled_faces');
      if (!raw) {
        labeledDescriptorsRef.current = [];
        faceMatcherRef.current = null;
        setLabeledDescriptorsLoaded(true);
        return;
      }

      const parsed = JSON.parse(raw) as Record<string, number[][]>;
      const labeled = Object.entries(parsed).map(([label, arrays]) => {
        const descriptors = (arrays || []).map(a => new Float32Array(a));
        return new (faceapi as any).LabeledFaceDescriptors(label, descriptors);
      });

      labeledDescriptorsRef.current = labeled;
      if (labeled.length > 0) {
        faceMatcherRef.current = new (faceapi as any).FaceMatcher(labeled, 0.6);
      }
      setLabeledDescriptorsLoaded(true);
      console.log('Loaded labeled faces:', labeled.length);
    } catch (err) {
      console.warn('Failed to load labeled faces', err);
      setLabeledDescriptorsLoaded(true);
    }
  };

  // Enroll the current user face as the provided label (default: "Me")
  const enrollFace = async (label = 'Me') => {
    try {
      if (!videoRef.current) throw new Error('Video not ready');
      if (!modelsLoaded) throw new Error('Models not loaded');
      if (!cameraActive) throw new Error('Camera not active');
      // Try to resume playback if paused
      try { await attachAndPlay(); } catch (_) {}
      // Detect single face and extract descriptor
      const result: any = await faceapi.detectSingleFace(videoRef.current, new (faceapi as any).TinyFaceDetectorOptions({ inputSize: 224, scoreThreshold: 0.2 })).withFaceLandmarks().withFaceDescriptor();
      if (!result || !result.descriptor) {
        alert('No face detected for enrollment — please position your face and try again.');
        return;
      }

      const descriptorArr = Array.from(result.descriptor as Float32Array);
      const raw = localStorage.getItem('gvp_labeled_faces');
      const parsed = raw ? JSON.parse(raw) as Record<string, number[][]> : {};
      parsed[label] = parsed[label] || [];
      parsed[label].push(descriptorArr);
      localStorage.setItem('gvp_labeled_faces', JSON.stringify(parsed));

      // rebuild matcher
      await loadLabeledFaces();
      alert(`Enrolled face as '${label}'. You can re-open the view to verify recognition.`);
    } catch (err) {
      console.error('Enroll failed', err);
      alert('Failed to enroll face. See console for details.');
    }
  };

  // Run a single detection pass and report results (debug helper)
  const runDetection = async () => {
    try {
      if (!videoRef.current) {
        alert('Video element not available');
        return;
      }
      if (!modelsLoaded) {
        alert('Models not loaded yet');
        return;
      }
      const tinyOptions = new faceapi.TinyFaceDetectorOptions({ inputSize: 160, scoreThreshold: 0.15 });
      const dets = await faceapi.detectAllFaces(videoRef.current, tinyOptions).withFaceLandmarks().withFaceExpressions().withFaceDescriptors();
      setLastDetectionsCount(dets.length);
      if (!dets || dets.length === 0) {
        alert('No faces detected (0)');
        return;
      }
      const lines: string[] = [];
      dets.forEach((d: any, i: number) => {
        const exprs = d.expressions || {};
        const rawBest = Object.entries(exprs).sort((a,b) => (b[1] as number) - (a[1] as number))[0] || ['none', 0];
        const best = rawBest as [string, number];
        const label = faceMatcherRef.current && d.descriptor ? faceMatcherRef.current.findBestMatch(d.descriptor) : null;
        const name = label && label.label && label.label !== 'unknown' ? `${label.label}(${(label.distance||0).toFixed(2)})` : 'unknown';
        lines.push(`#${i+1}: ${best[0]} ${(best[1]*100).toFixed(0)}% • ${name}`);
      });
      alert(`Detected ${dets.length} face(s):\n` + lines.join('\n'));
    } catch (err: any) {
      console.error('runDetection error', err);
      setLastDetectError(err?.message || String(err));
      alert('Detection error: ' + (err?.message || String(err)));
    }
  };

  const stopCamera = () => {
    if (videoRef.current?.srcObject) {
      const tracks = (videoRef.current.srcObject as MediaStream).getTracks();
      tracks.forEach(track => track.stop());
    }
    setCameraActive(false);
    setShowCameraModal(false);
    if (detectionIntervalRef.current) {
      clearInterval(detectionIntervalRef.current);
    }
    setNeedsUserGesture(false);
  };

  // If playback was blocked, try to resume on first user interaction
  useEffect(() => {
    if (!needsUserGesture) return;

    const resume = async () => {
      try {
        await videoRef.current?.play();
        console.log('Playback resumed after user interaction');
        setNeedsUserGesture(false);
        setCameraError('');
      } catch (err) {
        console.warn('Resume after gesture failed', err);
      }
    };

    const handler = () => resume();
    document.addEventListener('click', handler, { once: true });
    document.addEventListener('touchstart', handler, { once: true });
    document.addEventListener('keydown', handler, { once: true });

    return () => {
      document.removeEventListener('click', handler);
      document.removeEventListener('touchstart', handler);
      document.removeEventListener('keydown', handler);
    };
  }, [needsUserGesture]);

  const startFaceDetection = () => {
    if (detectionIntervalRef.current) {
      clearInterval(detectionIntervalRef.current);
    }
    
    detectionIntervalRef.current = setInterval(async () => {
      if (!videoRef.current || !canvasRef.current) return;
      // Ensure video has enough data and models are loaded before attempting detection
      const video = videoRef.current;
      const canvas = canvasRef.current;
      if (video.readyState < 2 || !modelsLoaded) {
        console.debug('Skipping detection - readyState:', video.readyState, 'modelsLoaded:', modelsLoaded);
        return;
      }

      // Make sure canvas matches video pixel size for accurate drawing/resizing
      if (video.videoWidth && video.videoHeight) {
        if (canvas.width !== video.videoWidth || canvas.height !== video.videoHeight) {
          canvas.width = video.videoWidth;
          canvas.height = video.videoHeight;
        }
      }

      try {
        // Try tiny face detector first, then SSD as a fallback
        // Make tiny detector more sensitive for webcam conditions
        const tinyOptions = new faceapi.TinyFaceDetectorOptions({ inputSize: 160, scoreThreshold: 0.15 });
        console.debug('Running tinyFaceDetector', tinyOptions, 'video size', video.videoWidth, video.videoHeight);
        // include landmarks, expressions and descriptors for recognition
        let detections = await faceapi.detectAllFaces(video, tinyOptions)
          .withFaceLandmarks()
          .withFaceExpressions()
          .withFaceDescriptors();
        console.debug('tiny detections:', detections?.length ?? 0);
        setLastDetectionsCount(detections?.length ?? 0);

        if (!detections || detections.length === 0) {
          console.debug('tiny detector failed, trying ssdMobilenetv1 fallback');
          try {
            detections = await faceapi.detectAllFaces(video, new faceapi.SsdMobilenetv1Options({ minConfidence: 0.3 }))
              .withFaceLandmarks()
              .withFaceExpressions()
              .withFaceDescriptors();
            console.debug('ssd detections:', detections?.length ?? 0);
            setLastDetectionsCount(detections?.length ?? 0);
          } catch (ssdErr) {
            console.warn('ssdMobilenetv1 detection error', ssdErr);
          }
        }

        if (detections && detections.length > 0) {
          // Get the first detected face
          const detection = detections[0] as any;
          const expressions = detection.expressions as unknown as Record<string, number>;

          console.log('Face detected! Expressions:', expressions);
          setLastDetectError(null);
          
          // Normalize expressions to 0-1 range
          const normalized = Object.entries(expressions).reduce((acc: any, [key, val]) => {
            acc[key] = Math.max(0, Math.min(1, val));
            return acc;
          }, {});

          // Ensure all emotions exist
          const fullEmotions: FaceExpression = {
            happy: normalized.happy || 0,
            sad: normalized.sad || 0,
            angry: normalized.angry || 0,
            neutral: normalized.neutral || 0,
            surprised: normalized.surprised || 0,
            fearful: normalized.fearful || 0,
            disgusted: normalized.disgusted || 0,
            dull: 0 // face-api doesn't have dull, use neutral
          };

          // Find dominant emotion
          const entries = Object.entries(fullEmotions);
          const dominantEntry = entries.reduce((a, b) => (b[1] as number) > (a[1] as number) ? b : a);
          const dominant = dominantEntry[0];
          setCurrentEmotion(dominant);
          setEmotionStats(fullEmotions);
          setDetectionCount(prev => prev + 1);
          // If analysis mode active, record the dominant emotion
          if (analysisModeRef.current) {
            analysisBufferRef.current.push(dominant);
          }

          // We'll perform per-detection recognition when drawing resizedDetections below

          // Draw canvas with detections (use video pixel size)
          const displaySize = { width: canvas.width, height: canvas.height };
          faceapi.matchDimensions(canvas, displaySize);
          const resizedDetections = faceapi.resizeResults(detections, displaySize);

          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.clearRect(0, 0, canvas.width, canvas.height);

            // Draw face box
            resizedDetections.forEach((detectionItem: any) => {
              const box = detectionItem.detection.box;
              ctx.strokeStyle = '#4f46e5';
              ctx.lineWidth = 2;
              ctx.strokeRect(box.x, box.y, box.width, box.height);

              // For each detection compute emotion label and recognition name (if available)
              const exprs = (detectionItem.expressions || {}) as Record<string, number>;
              let dominantLabel = dominant; // fallback
              let dominantPct = Math.round((fullEmotions[dominant] || 0) * 100);
              // If expressions exist per-detection, compute its dominant
              if (Object.keys(exprs).length > 0) {
                const eEntries = Object.entries(exprs);
                const dEntry = eEntries.reduce((a, b) => (b[1] as number) > (a[1] as number) ? b : a);
                dominantLabel = dEntry[0];
                dominantPct = Math.round((dEntry[1] || 0) * 100);
              }

              // Recognition per-detection
              let nameLabel = '';
              try {
                const descr = detectionItem.descriptor as Float32Array | undefined;
                if (descr && faceMatcherRef.current) {
                  const best = faceMatcherRef.current.findBestMatch(descr);
                  if (best && best.label && best.label !== 'unknown') {
                    nameLabel = ` • ${best.label} (${(best.distance ?? 0).toFixed(2)})`;
                  }
                }
              } catch (err) {
                console.warn('Per-face recognition failed', err);
              }

              // Draw label text
              ctx.fillStyle = '#4f46e5';
              ctx.font = 'bold 14px Arial';
              ctx.fillText(`${dominantLabel.toUpperCase()} ${dominantPct}%${nameLabel}`, box.x, box.y - 10);

              // draw small confidence bar underneath label
              const barX = box.x;
              const barY = box.y - 6;
              const barWidth = Math.max(40, box.width * 0.6);
              const filled = Math.max(2, Math.round((dominantPct / 100) * barWidth));
              ctx.fillStyle = 'rgba(255,255,255,0.15)';
              ctx.fillRect(barX, barY, barWidth, 4);
              ctx.fillStyle = '#10b981';
              ctx.fillRect(barX, barY, filled, 4);
            });
          }
        } else {
          // No detections from face-api — try a lightweight TF.js landmarks fallback
          setLastDetectionsCount(0);
          console.debug('face-api returned 0 detections, attempting TF fallback...');
          let handledByTF = false;
          try {
            if (!tfModelRef.current && !tfLoaded) {
              console.debug('Loading TensorFlow face-landmarks-detection from CDN...');
              try {
                    // @ts-ignore - dynamic CDN import used at runtime in browser
                    await import('https://cdn.jsdelivr.net/npm/@tensorflow/tfjs@3.21.0/dist/tf.min.js');
                  } catch (e) {
                console.warn('tf import may already exist or failed:', e);
              }
                  // @ts-ignore - dynamic CDN import used at runtime in browser
                  const fld = await import('https://cdn.jsdelivr.net/npm/@tensorflow-models/face-landmarks-detection@0.0.7/dist/face-landmarks-detection.min.js');
              tfModelRef.current = await fld.load(fld.SupportedPackages.mediapipeFacemesh, { maxFaces: 1 });
              setTfLoaded(true);
              console.debug('TF face-landmarks model loaded');
            }

            if (tfModelRef.current) {
              const predictions = await tfModelRef.current.estimateFaces({ input: video });
              console.debug('TF predictions length:', predictions?.length);
              if (predictions && predictions.length > 0) {
                const p = predictions[0];
                const lm: any[] = p.scaledMesh || p.mesh || [];
                const idx = { upperLip: 13, lowerLip: 14, leftCorner: 61, rightCorner: 291 };
                const get = (i: number) => lm[i] || [0,0];
                const a = get(idx.upperLip);
                const b = get(idx.lowerLip);
                const left = get(idx.leftCorner);
                const right = get(idx.rightCorner);
                const dist = (u: any, v: any) => Math.hypot(u[0]-v[0], u[1]-v[1]);
                const mouthOpen = dist(a,b);
                const mouthWidth = dist(left,right) || 1;
                let inferred = 'neutral';
                const ratio = mouthOpen / mouthWidth;
                if (ratio > 0.28) {
                  inferred = 'surprised';
                } else {
                  if (left[1] < a[1] - 2 && right[1] < a[1] - 2) {
                    inferred = 'happy';
                  } else {
                    inferred = 'neutral';
                  }
                }

                console.debug('TF heuristic inferred emotion:', inferred, { mouthOpen, mouthWidth, ratio });
                setCurrentEmotion(inferred);
                const basicStats: FaceExpression = {
                  happy: inferred === 'happy' ? 1 : 0,
                  sad: 0, angry: 0, neutral: inferred === 'neutral' ? 1 : 0,
                  surprised: inferred === 'surprised' ? 1 : 0, fearful: 0, disgusted: 0, dull: 0
                };
                setEmotionStats(basicStats);
                setDetectionCount(prev => prev + 1);
                if (analysisModeRef.current) analysisBufferRef.current.push(inferred);

                // draw box from prediction boundingBox if available
                const canvasCtx = canvas.getContext('2d');
                if (canvasCtx) {
                  canvasCtx.clearRect(0,0,canvas.width,canvas.height);
                  if ((p as any).boundingBox) {
                    const box = (p as any).boundingBox;
                    canvasCtx.strokeStyle = '#22c55e';
                    canvasCtx.lineWidth = 2;
                    canvasCtx.strokeRect(box.topLeft[0], box.topLeft[1], box.bottomRight[0]-box.topLeft[0], box.bottomRight[1]-box.topLeft[1]);
                    canvasCtx.fillStyle = '#22c55e';
                    canvasCtx.font = 'bold 14px Arial';
                    canvasCtx.fillText(inferred.toUpperCase(), box.topLeft[0], box.topLeft[1] - 8);
                  }
                }
                handledByTF = true;
              }
            }
          } catch (tfErr) {
            console.warn('TF fallback error:', tfErr);
          }

          if (!handledByTF) {
            // No face detected - reset to default
            setCurrentEmotion('neutral');
            setEmotionStats({
              happy: 0, sad: 0, angry: 0, neutral: 0,
              surprised: 0, fearful: 0, disgusted: 0, dull: 0
            });
            // Clear canvas
            const canvas = canvasRef.current;
            const ctx = canvas.getContext('2d');
            if (ctx) {
              ctx.clearRect(0, 0, canvas.width, canvas.height);
            }
          }
        }
      } catch (error) {
        console.error('Face detection error:', error);
      }
    }, 500); // Detection every 500ms (optimized for speed)
  };

  // Start a short analysis session that aggregates dominant emotions
  const startAnalysis = (seconds = 10) => {
    if (isAnalyzing) return;
    analysisBufferRef.current = [];
    analysisModeRef.current = true;
    setIsAnalyzing(true);
    setAnalysisProgress(0);
    setAnalysisResults('');

    const start = Date.now();
    // progress ticker
    const progressInterval = setInterval(() => {
      const elapsed = (Date.now() - start) / 1000;
      setAnalysisProgress(Math.min(100, Math.round((elapsed / seconds) * 100)));
    }, 200);

    // stop after duration
    analysisTimeoutRef.current = setTimeout(() => {
      analysisModeRef.current = false;
      setIsAnalyzing(false);
      setAnalysisProgress(100);
      clearInterval(progressInterval);

      // compute summary
      const counts: Record<string, number> = {};
      analysisBufferRef.current.forEach(e => counts[e] = (counts[e] || 0) + 1);
      const total = analysisBufferRef.current.length || 1;
      const sorted = Object.entries(counts).sort((a,b) => b[1] - a[1]);
      if (sorted.length === 0) {
        setAnalysisResults('No faces detected during analysis. Please try again.');
      } else {
        const top = sorted.slice(0,3).map(([emo, cnt]) => `${emo} (${Math.round((cnt/total)*100)}%)`).join(', ');
        setAnalysisResults(`Detected emotions: ${top}. Total samples: ${total}.`);
      }
    }, seconds * 1000);
  };

  const cancelAnalysis = () => {
    if (analysisTimeoutRef.current) {
      clearTimeout(analysisTimeoutRef.current);
      analysisTimeoutRef.current = null;
    }
    analysisModeRef.current = false;
    setIsAnalyzing(false);
    setAnalysisProgress(0);
    setAnalysisResults('Analysis cancelled.');
  };

  const emojiForEmotion = (emotion: string) => {
    const map: { [k: string]: string } = {
      happy: '😊',
      sad: '😢',
      angry: '😠',
      neutral: '😐',
      surprised: '😲',
      fearful: '😨',
      disgusted: '🤢',
      dull: '😑'
    };
    return map[emotion] || '🙂';
  };



  const handleNextPage = () => {
    if (currentPage < estimatedPageCount) {
      setCurrentPage(currentPage + 1);
    }
  };

  const handlePrevPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  const handleTextToSpeech = () => {
    if (contentRef.current) {
      const text = contentRef.current.innerText;
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = studentLanguage === 'Tamil' ? 'ta-IN' : 'en-IN';
      speechSynthesis.speak(utterance);
    }
  };

  const triggerGame = () => {
    setShowGame(true);
    setIsReading(false);
  };

  const resumeReading = () => {
    setShowGame(false);
    setIsReading(true);
  };

  return (
    <>
      {/* Main Split View Container */}
      <div className="fixed inset-0 bg-gradient-to-br from-gray-50 to-gray-100 z-50">
        {/* Header */}
        <div className="bg-gradient-to-r from-indigo-600 to-pink-600 p-4 flex items-center justify-between shadow-lg">
          <div>
            <h2 className="text-2xl font-bold text-white">{fileName}</h2>
            <p className="text-indigo-100 text-sm">
              Page {currentPage} of {estimatedPageCount} | Emotional Status: <span className="font-semibold capitalize">{currentEmotion}</span>
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-white hover:bg-white hover:bg-opacity-20 p-2 rounded-lg transition-all"
          >
            <X size={24} />
          </button>
        </div>

        {/* Main Content Area - Split Layout */}
        <div className="flex h-[calc(100vh-100px)] gap-4 p-4 overflow-hidden">
          {/* Left Side: Reading Content */}
          <div className="flex-1 flex flex-col bg-white rounded-lg shadow-lg overflow-hidden">
            {/* Content Display */}
            <div
              ref={contentRef}
              className="flex-1 overflow-y-auto p-6 text-black text-base leading-relaxed"
              style={{
                fontSize: '16px',
                color: '#000000',
                lineHeight: '1.8',
                fontFamily: 'system-ui, -apple-system, sans-serif'
              }}
            >
              <ReactMarkdown
                components={{
                  h1: ({ node, ...props }) => (
                    <h1 className="text-3xl font-bold text-black mb-4 mt-6" {...props} />
                  ),
                  h2: ({ node, ...props }) => (
                    <h2 className="text-2xl font-bold text-black mb-3 mt-5" {...props} />
                  ),
                  h3: ({ node, ...props }) => (
                    <h3 className="text-xl font-bold text-black mb-2 mt-4" {...props} />
                  ),
                  p: ({ node, ...props }) => (
                    <p className="text-black mb-3" {...props} />
                  ),
                  strong: ({ node, ...props }) => (
                    <strong className="text-black font-bold bg-yellow-100 px-1 rounded" {...props} />
                  ),
                  em: ({ node, ...props }) => (
                    <em className="text-black italic" {...props} />
                  ),
                  ul: ({ node, ...props }) => (
                    <ul className="list-disc list-inside ml-4 mb-3 text-black" {...props} />
                  ),
                  ol: ({ node, ...props }) => (
                    <ol className="list-decimal list-inside ml-4 mb-3 text-black" {...props} />
                  ),
                  li: ({ node, ...props }) => (
                    <li className="text-black mb-1" {...props} />
                  ),
                  blockquote: ({ node, ...props }) => (
                    <blockquote
                      className="border-l-4 border-indigo-500 bg-indigo-50 pl-4 py-2 my-3 text-black italic"
                      {...props}
                    />
                  ),
                  table: ({ node, ...props }) => (
                    <table className="w-full border-collapse border border-gray-300 my-3" {...props} />
                  ),
                  tr: ({ node, ...props }) => (
                    <tr className="border border-gray-300" {...props} />
                  ),
                  td: ({ node, ...props }) => (
                    <td className="border border-gray-300 p-2 text-black" {...props} />
                  ),
                  th: ({ node, ...props }) => (
                    <th className="border border-gray-300 p-2 bg-gray-100 text-black font-bold" {...props} />
                  ),
                  code: ({ node, ...props }) => (
                    <code className="bg-gray-100 text-black px-2 py-1 rounded font-mono" {...props} />
                  ),
                  pre: ({ node, ...props }) => (
                    <pre className="bg-gray-800 text-white p-4 rounded overflow-x-auto mb-3" {...props} />
                  )
                }}
              >
                {htmlContent}
              </ReactMarkdown>
            </div>

            {/* Reading Controls */}
            <div className="border-t border-gray-200 bg-gray-50 p-4 flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center gap-2">
                <button
                  onClick={handlePrevPage}
                  disabled={currentPage === 1}
                  className="p-2 hover:bg-gray-200 rounded-lg disabled:opacity-50 transition-all"
                >
                  <ChevronLeft size={20} className="text-black" />
                </button>

                <input
                  type="range"
                  min="1"
                  max={estimatedPageCount}
                  value={currentPage}
                  onChange={(e) => setCurrentPage(parseInt(e.target.value))}
                  className="w-48 h-2 bg-gray-300 rounded-lg appearance-none cursor-pointer"
                />

                <button
                  onClick={handleNextPage}
                  disabled={currentPage === estimatedPageCount}
                  className="p-2 hover:bg-gray-200 rounded-lg disabled:opacity-50 transition-all"
                >
                  <ChevronRight size={20} className="text-black" />
                </button>

                <span className="text-black font-semibold ml-2">
                  Page {currentPage}/{estimatedPageCount}
                </span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={handleTextToSpeech}
                  className="flex items-center gap-2 px-3 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-all"
                >
                  <Volume2 size={18} /> Read Aloud
                </button>

                <button
                  onClick={triggerGame}
                  className="flex items-center gap-2 px-3 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-all"
                >
                  <Zap size={18} /> Take a Break
                </button>

                <button
                  onClick={onDownload}
                  className="flex items-center gap-2 px-3 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-all"
                >
                  <Download size={18} /> Download
                </button>
              </div>
            </div>
          </div>

          {/* Right Side: Live Camera with Mood Analysis */}
          <div className="w-80 flex flex-col gap-4 h-full">
            {/* Camera Feed Container */}
            <div className="flex-1 bg-black rounded-xl overflow-hidden shadow-2xl flex flex-col">
              {/* Camera Status Header */}
              <div className="bg-gradient-to-r from-blue-600 to-cyan-600 px-4 py-2 flex items-center justify-between">
                <span className="text-white font-bold text-sm flex items-center gap-2">
                  📷 {cameraActive ? '✓ Live' : '⏳ Loading...'}
                </span>
                <span className="text-white text-xs font-semibold">{detectionCount} frames</span>
              </div>

              {/* Live Camera Feed */}
              <div className="flex-1 relative flex items-center justify-center overflow-hidden">
                  <>
                    {/* Always render video & canvas so refs exist even when inactive */}
                    <video
                      ref={videoRef}
                      className="w-full h-full object-cover"
                      autoPlay
                      playsInline
                      muted
                    />
                    <canvas
                      ref={canvasRef}
                      className="absolute inset-0 w-full h-full"
                      width={640}
                      height={480}
                    />

                    {/* If camera not active, show big enable UI */}
                    {!cameraActive && (
                      <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center">
                        <p className="text-lg text-white font-semibold mb-3">🎥 Camera not active</p>
                        <p className="text-sm text-gray-200 mb-4">Please allow camera access and click to start the live feed.</p>
                        <div className="flex flex-col gap-2 items-center">
                          <button
                            onClick={async () => { await attachAndPlay(); }}
                            className="px-6 py-3 bg-green-500 hover:bg-green-600 text-white font-bold rounded-lg w-48"
                          >
                            Enable Camera
                          </button>
                          <button
                            onClick={() => initializeCamera()}
                            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg w-40 mt-2"
                          >
                            Retry Permissions
                          </button>
                        </div>

                        <div className="mt-4 text-xs text-gray-300">
                            <div>Models loaded: {modelsLoaded ? 'yes' : 'no'}</div>
                            <div>Video readyState: {videoRef.current?.readyState ?? 0}</div>
                            <div>Video paused: {videoRef.current?.paused ? 'yes' : 'no'}</div>
                            <div>Last detections: {lastDetectionsCount ?? '–'}</div>
                            {lastDetectError && <div className="text-xs text-red-300">Detect error: {lastDetectError}</div>}
                        </div>
                      </div>
                    )}

                    {/* Playback / Error Overlay (shows when play blocked or error) */}
                    {(cameraError || needsUserGesture || (videoRef.current && (videoRef.current.paused || videoRef.current.readyState < 2))) && (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="bg-black bg-opacity-60 rounded-lg p-4 text-center">
                          {cameraError ? (
                            <>
                              <p className="text-white mb-2">{cameraError}</p>
                              <button
                                onClick={() => initializeCamera()}
                                className="px-4 py-2 bg-indigo-600 text-white rounded-lg"
                              >
                                Retry Camera
                              </button>
                            </>
                          ) : (
                            <>
                              <p className="text-white mb-2">Click to start camera</p>
                              <button
                                onClick={async () => {
                                  try {
                                    await attachAndPlay();
                                    console.log('Playback resumed by user gesture');
                                  } catch (err) {
                                    console.warn('Playback resume failed', err);
                                    setCameraError('Playback blocked. Please allow camera or interact with the page.');
                                  }
                                }}
                                className="px-4 py-2 bg-green-600 text-white rounded-lg"
                              >
                                Start Camera
                              </button>
                            </>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Mood Overlay on Camera */}
                    <div className="absolute bottom-4 left-4 right-4 bg-black bg-opacity-70 rounded-lg p-3 backdrop-blur-sm">
                      <div className="flex items-center gap-3">
                        <div className="text-3xl">{emojiForEmotion(currentEmotion)}</div>
                        <div className="flex-1">
                          <p className="text-white text-xs font-semibold uppercase">Current Mood</p>
                          <p className="text-white text-lg font-bold capitalize">{currentEmotion}</p>
                        </div>
                      </div>
                    </div>
                  </>
                </div>
                <div className="bg-slate-900 px-4 py-3 border-t border-slate-700">
                <div className="grid grid-cols-4 gap-2">
                  {Object.entries(emotionStats).slice(0, 4).map(([emotion, value]) => (
                    <div key={emotion} className="text-center">
                      <p className="text-xs text-gray-400 capitalize font-semibold mb-1">{emotion}</p>
                      <p className="text-sm font-bold text-white">{(value * 100).toFixed(0)}%</p>
                    </div>
                  ))}
                </div>
                <div className="grid grid-cols-3 gap-2 mt-2">
                  {Object.entries(emotionStats).slice(4).map(([emotion, value]) => (
                    <div key={emotion} className="text-center">
                      <p className="text-xs text-gray-400 capitalize font-semibold mb-1">{emotion}</p>
                      <p className="text-sm font-bold text-white">{(value * 100).toFixed(0)}%</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-2">
              <button
                onClick={() => setShowCameraModal(true)}
                disabled={!cameraActive}
                className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all font-semibold text-sm"
              >
                Expand
              </button>
              <button
                onClick={async () => {
                  if (!cameraActive) {
                    alert('Camera not active yet. Please enable the camera first.');
                    return;
                  }
                  if (!modelsLoaded) {
                    alert('Models are still loading. Please wait a moment and try again.');
                    return;
                  }
                  try {
                    // Ensure playback/resume
                    await attachAndPlay();
                  } catch (e) {
                    console.warn('attachAndPlay before enroll failed', e);
                  }
                  enrollFace('Me');
                }}
                disabled={!cameraActive || !modelsLoaded}
                className={`px-3 py-2 rounded-lg transition-all font-semibold text-sm ${(!cameraActive || !modelsLoaded) ? 'bg-emerald-300 text-white cursor-not-allowed' : 'bg-emerald-600 text-white hover:bg-emerald-700'}`}
                title={!cameraActive ? 'Enable camera first' : (!modelsLoaded ? 'Models loading' : 'Enroll your face')}
              >
                Enroll Me
              </button>
              <button
                onClick={async () => { await runDetection(); }}
                className="px-2 py-2 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 transition-all text-sm"
                title="Run a single detection pass and report results"
              >
                Test Detection
              </button>
              <button
                onClick={stopCamera}
                className="flex-1 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-all font-semibold text-sm"
              >
                Stop
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* AI Game Modal */}
      {showGame && (
        <AIReliefGame
          studentLanguage={studentLanguage}
          currentEmotion={currentEmotion}
          onResume={resumeReading}
        />
      )}

      {/* Camera Mood Analysis Modal */}
      {showCameraModal && (
        <div className="fixed inset-0 bg-black bg-opacity-70 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
            {/* Header */}
            <div className="bg-gradient-to-r from-blue-600 to-cyan-600 p-6 flex items-center justify-between">
              <h2 className="text-3xl font-bold text-white">📷 Real-Time Mood Analysis</h2>
              <button
                onClick={stopCamera}
                className="text-white hover:bg-white hover:bg-opacity-20 p-2 rounded-lg transition-all"
              >
                <X size={32} />
              </button>
            </div>

            {/* Main Content */}
            <div className="flex-1 overflow-y-auto p-6 flex gap-6">
              {/* Left: Camera Feed */}
              <div className="flex-1 flex flex-col relative">
                <div className="bg-black rounded-xl overflow-hidden flex-1 flex items-center justify-center min-h-96 relative">
                  {cameraActive ? (
                    <>
                      <video
                        ref={videoRef}
                        className="absolute inset-0 w-full h-full object-cover"
                        autoPlay
                        playsInline
                        muted
                      />
                      <canvas
                        ref={canvasRef}
                        className="absolute inset-0 w-full h-full"
                        width={640}
                        height={480}
                      />
                    </>
                  ) : (
                    <div className="text-white text-center">
                      <p className="text-2xl font-bold mb-4">🎥 Requesting Camera Access...</p>
                      {cameraError && (
                        <p className="text-red-400 text-lg mb-4">{cameraError}</p>
                      )}
                      <button
                        onClick={() => {
                          initializeCamera();
                        }}
                        className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-bold text-lg"
                      >
                        Try Again
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Right: Mood Analysis */}
              <div className="w-96 flex flex-col gap-4">
                {/* Large Current Emotion */}
                <div className="bg-gradient-to-br from-purple-100 to-pink-100 rounded-xl p-6 border-2 border-purple-300 shadow-lg">
                  <p className="text-sm font-bold text-gray-700 uppercase mb-2">Current Mood</p>
                  <div className="text-6xl mb-4">{emojiForEmotion(currentEmotion)}</div>
                  <p className="text-4xl font-bold text-gray-800 capitalize">{currentEmotion}</p>
                </div>

                {/* Detection Stats */}
                <div className="bg-blue-50 rounded-xl p-4 border-2 border-blue-300">
                  <p className="text-sm font-bold text-gray-700 uppercase mb-2">Analysis Stats</p>
                  <p className="text-2xl font-bold text-blue-600">Detections: {detectionCount}</p>
                  <p className="text-sm text-gray-600 mt-2">Updates every 500ms</p>
                  <div className="mt-3 flex gap-2">
                    {!isAnalyzing ? (
                      <button
                        onClick={() => startAnalysis(10)}
                        className="px-3 py-2 bg-green-600 text-white rounded-lg font-semibold"
                      >
                        Analyze 10s
                      </button>
                    ) : (
                      <>
                        <button
                          onClick={() => cancelAnalysis()}
                          className="px-3 py-2 bg-yellow-600 text-white rounded-lg font-semibold"
                        >
                          Cancel
                        </button>
                        <div className="flex-1 flex items-center gap-2">
                          <div className="text-xs text-gray-700 w-14">{analysisProgress}%</div>
                          <div className="flex-1 bg-gray-200 h-3 rounded overflow-hidden">
                            <div className="bg-gradient-to-r from-green-400 to-blue-500 h-full" style={{ width: `${analysisProgress}%` }} />
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                  {analysisResults && (
                    <p className="mt-3 text-sm text-gray-700">{analysisResults}</p>
                  )}
                </div>

                {/* Emotion Breakdown */}
                <div className="bg-gray-50 rounded-xl p-4 border-2 border-gray-300 flex-1 overflow-y-auto">
                  <p className="text-sm font-bold text-gray-700 uppercase mb-3">Emotion Breakdown</p>
                  <div className="space-y-3">
                    {Object.entries(emotionStats).map(([emotion, value]) => {
                      const percentage = Math.round(value * 100);
                      return (
                        <div key={emotion}>
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-lg font-semibold text-gray-700 capitalize">
                              {emojiForEmotion(emotion)} {emotion}
                            </span>
                            <span className="text-lg font-bold text-gray-800">{percentage}%</span>
                          </div>
                          <div className="w-full bg-gray-300 rounded-full h-4 overflow-hidden">
                            <div
                              className="bg-gradient-to-r from-purple-500 to-pink-500 h-full transition-all duration-300"
                              style={{ width: `${percentage}%` }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Close Button */}
                <button
                  onClick={stopCamera}
                  className="w-full px-6 py-4 bg-red-500 text-white font-bold text-lg rounded-lg hover:bg-red-600 transition-all shadow-lg"
                >
                  ✕ Close Camera
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default ReadingViewWithCamera;
