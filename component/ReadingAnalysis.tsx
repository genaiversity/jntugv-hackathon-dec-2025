import React, { useEffect, useRef, useState } from 'react';
import * as faceapi from 'face-api.js';
import { X, Camera, AlertCircle } from 'lucide-react';
import ReadingReliefOptions from './ReadingReliefOptions';

interface ReadingAnalysisProps {
  pdfPageCount: number;
  onClose: () => void;
  studentLanguage?: string;
}

const ReadingAnalysis: React.FC<ReadingAnalysisProps> = ({ 
  pdfPageCount, 
  onClose,
  studentLanguage = 'English'
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [currentExpression, setCurrentExpression] = useState('');
  const [showReliefOptions, setShowReliefOptions] = useState(false);
  const [dominantEmotion, setDominantEmotion] = useState('');
  const [emotionScore, setEmotionScore] = useState<Record<string, number>>({});
  const detectionIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Struggle detection thresholds
  const STRUGGLE_EMOTIONS = ['sad', 'angry', 'dull', 'fearful', 'disgusted'];
  const STRUGGLE_THRESHOLD = 0.6; // 60% of detections show struggle

  // Load models
  useEffect(() => {
    const loadModels = async () => {
      try {
        const MODEL_URL = 'https://cdn.jsdelivr.net/npm/@vladmandic/face-api/model/';
        
        await Promise.all([
          faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
          faceapi.nets.faceExpressionNet.loadFromUri(MODEL_URL),
        ]);
        
        setIsLoading(false);
      } catch (error) {
        console.error('Error loading models:', error);
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
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { width: { ideal: 320 }, height: { ideal: 240 } }
        });

        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.onloadedmetadata = () => {
            videoRef.current?.play();
            startFaceDetection();
          };
        }
      } catch (error) {
        console.error('Error accessing webcam:', error);
      }
    };

    if (!isLoading) {
      startWebcam();
    }

    return () => {
      if (videoRef.current?.srcObject) {
        const tracks = (videoRef.current.srcObject as MediaStream).getTracks();
        tracks.forEach(track => track.stop());
      }
    };
  }, [isLoading]);

  // Face detection with emotion analysis
  const startFaceDetection = () => {
    let emotionBuffer: Record<string, number> = {};
    let detectionCount = 0;

    detectionIntervalRef.current = setInterval(async () => {
      if (!videoRef.current || !canvasRef.current) return;

      try {
        const detections = await faceapi
          .detectAllFaces(videoRef.current, new faceapi.TinyFaceDetectorOptions())
          .withFaceExpressions();

        if (detections.length === 0) return;

        // Analyze first detected face
        const detection = detections[0];
        const expressions = (detection.expressions || {}) as any;
        
        const dominantExpression = Object.entries(expressions as Record<string, number>).reduce((a: [string, number], b: [string, number]) =>
          a[1] > b[1] ? a : b
        );

        const emotion = dominantExpression[0];
        const confidence = dominantExpression[1];

        // Update current display
        setCurrentExpression(`${emotion} (${(confidence * 100).toFixed(0)}%)`);

        // Buffer emotions for analysis
        emotionBuffer[emotion] = (emotionBuffer[emotion] || 0) + 1;
        detectionCount++;

        // Update emotion scores
        setEmotionScore(expressions as Record<string, number>);

        // Check for struggle every 5 seconds (roughly 15-20 detections at 300ms interval)
        if (detectionCount >= 15) {
          const strugglingEmotions = Object.entries(emotionBuffer)
            .filter(([emotion]) => STRUGGLE_EMOTIONS.includes(emotion))
            .reduce((sum, [_, count]) => sum + count, 0);

          const struggleRatio = strugglingEmotions / detectionCount;

          if (struggleRatio >= STRUGGLE_THRESHOLD) {
            setDominantEmotion(Object.entries(emotionBuffer).reduce((a, b) => a[1] > b[1] ? a : b)[0]);
            // Show relief options if struggling
            if (pdfPageCount > 5) {
              setShowReliefOptions(true);
            }
          }

          // Reset buffer
          emotionBuffer = {};
          detectionCount = 0;
        }

        // Draw canvas visualization
        const displaySize = {
          width: videoRef.current.offsetWidth,
          height: videoRef.current.offsetHeight
        };

        faceapi.matchDimensions(canvasRef.current, displaySize);
        const resizedDetections = faceapi.resizeResults([detection], displaySize);

        const ctx = canvasRef.current.getContext('2d');
        if (ctx) {
          ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
          const box = resizedDetections[0].detection.box;
          ctx.strokeStyle = '#4f46e5';
          ctx.lineWidth = 2;
          ctx.strokeRect(box.x, box.y, box.width, box.height);
          
          ctx.fillStyle = '#4f46e5';
          ctx.font = 'bold 14px Arial';
          ctx.fillText(emotion.toUpperCase(), box.x, box.y - 10);
        }
      } catch (error) {
        console.error('Detection error:', error);
      }
    }, 300);
  };

  const handleCloseWebcam = () => {
    if (videoRef.current?.srcObject) {
      const tracks = (videoRef.current.srcObject as MediaStream).getTracks();
      tracks.forEach(track => track.stop());
    }
    if (detectionIntervalRef.current) {
      clearInterval(detectionIntervalRef.current);
    }
    onClose();
  };

  if (isLoading) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-xl p-8 text-center">
          <div className="animate-spin h-12 w-12 border-4 border-indigo-600 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-slate-600">Loading emotion detection...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-40 p-4">
        <div className="bg-white rounded-xl shadow-2xl w-full max-w-md">
          {/* Header */}
          <div className="bg-gradient-to-r from-indigo-600 to-pink-600 p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Camera className="h-5 w-5 text-white" />
              <h2 className="text-lg font-bold text-white">Reading Analysis</h2>
            </div>
            <button
              onClick={handleCloseWebcam}
              className="text-white hover:bg-white hover:bg-opacity-20 p-1 rounded transition-all"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Webcam Feed */}
          <div className="p-4">
            <div className="bg-slate-100 rounded-lg overflow-hidden relative aspect-video mb-4">
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

            {/* Current Expression */}
            {currentExpression && (
              <div className="bg-indigo-50 border-2 border-indigo-200 rounded-lg p-3 mb-4">
                <p className="text-center text-sm font-semibold text-indigo-700">
                  Current: {currentExpression}
                </p>
              </div>
            )}

            {/* Emotion Stats */}
            <div className="space-y-2 mb-4">
              <h4 className="text-sm font-semibold text-slate-800">Emotion Breakdown:</h4>
              <div className="grid grid-cols-2 gap-2 text-xs">
                {Object.entries(emotionScore).map(([emotion, score]) => (
                  <div key={emotion} className="bg-slate-100 p-2 rounded">
                    <p className="capitalize font-medium">{emotion}</p>
                    <p className="text-slate-600">{(score * 100).toFixed(0)}%</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Alert if struggling */}
            {dominantEmotion && STRUGGLE_EMOTIONS.includes(dominantEmotion) && (
              <div className="bg-orange-50 border-2 border-orange-300 rounded-lg p-3 mb-4 flex gap-2">
                <AlertCircle className="h-5 w-5 text-orange-600 flex-shrink-0" />
                <div>
                  <p className="text-sm font-semibold text-orange-800">Detected Struggle</p>
                  <p className="text-xs text-orange-700">We noticed signs of fatigue or confusion</p>
                </div>
              </div>
            )}

            {/* Info Text */}
            {pdfPageCount > 5 && (
              <p className="text-xs text-slate-500 text-center mb-4">
                📄 Analyzing your emotions while reading {pdfPageCount} pages...
                <br />
                If you seem to struggle, relief options will appear.
              </p>
            )}

            <button
              onClick={handleCloseWebcam}
              className="w-full bg-indigo-600 text-white py-2 px-4 rounded-lg hover:bg-indigo-700 transition-all text-sm font-semibold"
            >
              Close Analysis
            </button>
          </div>
        </div>
      </div>

      {/* Relief Options Modal */}
      {showReliefOptions && (
        <ReadingReliefOptions
          onClose={() => {
            setShowReliefOptions(false);
            // Close webcam after relief break
            setTimeout(handleCloseWebcam, 1000);
          }}
          studentEmotionalState={dominantEmotion}
          studentLanguage={studentLanguage}
        />
      )}
    </>
  );
};

export default ReadingAnalysis;
