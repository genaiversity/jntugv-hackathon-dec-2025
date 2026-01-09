import React, { useState, useRef } from 'react';
// pdfjs is imported dynamically at runtime to avoid type/resolution issues during build
import { generateNotesQuick } from '../services/quickNotesService';
import { generateRAGResponse } from '../services/ragServices';
import { Upload, FileText, X, Download, Loader2, File, Eye, Camera } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
// WebcamFaceRecognition and PDFViewer removed per new requirements
import ReadingViewWithCamera from './ReadingViewWithCamera';

const Notes: React.FC = () => {
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [fileBase64, setFileBase64] = useState<string>('');
  const [pastedText, setPastedText] = useState('');
  const [generatedNotes, setGeneratedNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState<string>('');
  const [showCameraView, setShowCameraView] = useState(false);
  const [useRAG, setUseRAG] = useState(true);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.type !== 'application/pdf') {
      alert('Please upload a PDF file.');
      return;
    }

    setUploadedFile(file);
    setPastedText(''); // Clear pasted text when file is uploaded

    const reader = new FileReader();
    reader.onload = (event) => {
      const result = event.target?.result;
      if (typeof result === 'string') {
        // Remove data URL prefix (data:application/pdf;base64,)
        const base64 = result.split(',')[1] || result;
        setFileBase64(base64);
      }
    };
    reader.readAsDataURL(file);
  };

  const removeFile = () => {
    setUploadedFile(null);
    setFileBase64('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleGenerateNotes = async () => {
    if (!fileBase64 && !pastedText.trim()) {
      alert('Please upload a PDF file or paste text content.');
      return;
    }

    setLoading(true);
    setProgress('Initializing...');
    setGeneratedNotes('');

    try {
      let notes: string;
      let extractedText = '';

      if (fileBase64) {
        // Extract text from PDF using pdfjs
        try {
          setProgress('Extracting text from PDF...');
          // Dynamically import pdfjs at runtime to avoid bundler/type issues
          let pdfjsLib: any = null;
          try {
            pdfjsLib = await import('pdfjs-dist');
          } catch (e) {
            console.warn('pdfjs dynamic import failed, falling back to base64 send', e);
          }
          if (!pdfjsLib) throw new Error('pdfjs import failed');

          // set worker from CDN to avoid bundler issues
          (pdfjsLib as any).GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.16.105/pdf.worker.min.js';

          const uint8 = base64ToUint8Array(fileBase64);
          const loadingTask: any = pdfjsLib.getDocument({ data: uint8 });
          const pdf = await loadingTask.promise;
          
          // Limit to first 10 pages for speed
          const maxPages = Math.min(10, pdf.numPages);
          let fullText = '';
          
          for (let i = 1; i <= maxPages; i++) {
            setProgress(`Extracting page ${i} of ${maxPages}...`);
            // eslint-disable-next-line no-await-in-loop
            const page = await pdf.getPage(i);
            // eslint-disable-next-line no-await-in-loop
            const content = await page.getTextContent();
            const strings = content.items.map((item: any) => item.str || '').join(' ');
            fullText += `\n\n--- Page ${i} ---\n` + strings;
          }
          
          if (maxPages < pdf.numPages) {
            fullText += `\n\n[... Document continues for ${pdf.numPages - maxPages} more pages]`;
          }
          
          extractedText = fullText;
          
          // If text extraction successful, use it. Otherwise fall back to base64
          if (fullText.trim().length > 50) {
            setProgress('Generating comprehensive 30-page notes (60-120 seconds)...');
            notes = await generateNotesQuick({ content: fullText, mimeType: undefined });
            
            // Enhance with RAG if enabled (done asynchronously)
            if (useRAG) {
              setProgress('Enhancing with knowledge base...');
              try {
                const ragResult = await generateRAGResponse({ 
                  question: `Summarize and create detailed study notes for: ${fullText.substring(0, 300)}` 
                });
                if (ragResult.answer) {
                  notes = `${notes}\n\n---\n\n**Knowledge Base Enhancement:**\n${ragResult.answer}`;
                }
              } catch (ragErr) {
                console.log('RAG enhancement skipped:', ragErr);
                // Continue without RAG enhancement
              }
            }
          } else {
            throw new Error('Extracted text too short');
          }
        } catch (pdfErr) {
          console.error('PDF text extraction or generation failed:', pdfErr);
          setProgress('Generating notes from PDF...');
          // Fall back to sending raw base64 to LLM
          notes = await generateNotesQuick({ content: fileBase64, mimeType: 'application/pdf' });
        }
      } else {
        // Analyze pasted text - Faster since no PDF extraction needed
        setProgress('Generating comprehensive 30-page notes (60-120 seconds)...');
        notes = await generateNotesQuick({
          content: pastedText,
          mimeType: undefined
        });
        
        // Enhance with RAG if enabled
        if (useRAG) {
          setProgress('Enhancing with knowledge base...');
          try {
            const ragResult = await generateRAGResponse({ 
              question: `Create detailed study notes for: ${pastedText.substring(0, 300)}` 
            });
            if (ragResult.answer) {
              notes = `${notes}\n\n---\n\n**Knowledge Base Enhancement:**\n${ragResult.answer}`;
            }
          } catch (ragErr) {
            console.log('RAG enhancement skipped:', ragErr);
          }
        }
      }

      setProgress('');
      setGeneratedNotes(notes);
    } catch (error) {
      console.error('Error generating notes:', error);
      const errorMsg = error instanceof Error ? error.message : 'Unknown error';
      alert(`Failed to generate notes: ${errorMsg}. Make sure your API key is configured in .env file.`);
      setProgress('');
    } finally {
        setLoading(false);
    }
  };

  const base64ToUint8Array = (base64: string) => {
    const raw = atob(base64);
    const uint8 = new Uint8Array(raw.length);
    for (let i = 0; i < raw.length; i++) {
      uint8[i] = raw.charCodeAt(i);
    }
    return uint8;
  };

  const handleDownloadPDF = () => {
    if (!generatedNotes) return;

    // Convert markdown to HTML
    const convertMarkdownToHTML = (markdown: string): string => {
      let html = markdown;
      
      // Headers
      html = html.replace(/^### (.*)$/gm, '<h3>$1</h3>');
      html = html.replace(/^## (.*)$/gm, '<h2>$1</h2>');
      html = html.replace(/^# (.*)$/gm, '<h1>$1</h1>');
      
      // Bold text (keywords)
      html = html.replace(/\*\*(.*?)\*\*/g, '<strong class="keyword">$1</strong>');
      
      // Bullet points
      const lines = html.split('\n');
      let inList = false;
      let result: string[] = [];
      
      lines.forEach(line => {
        const trimmed = line.trim();
        if (trimmed.startsWith('- ') || trimmed.startsWith('* ') || trimmed.startsWith('• ')) {
          if (!inList) {
            result.push('<ul>');
            inList = true;
          }
          const content = trimmed.replace(/^[-*•]\s+/, '');
          result.push(`<li>${content}</li>`);
        } else {
          if (inList) {
            result.push('</ul>');
            inList = false;
          }
          if (trimmed) {
            result.push(`<p>${trimmed}</p>`);
          }
        }
      });
      
      if (inList) {
        result.push('</ul>');
      }
      
      html = result.join('\n');
      
      // Code blocks
      html = html.replace(/`([^`]+)`/g, '<code>$1</code>');
      
      return html;
    };

    const htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="UTF-8">
          <title>Generated Notes - ${new Date().toLocaleDateString()}</title>
          <style>
            @page {
              margin: 2cm;
              size: A4;
            }
            * {
              margin: 0;
              padding: 0;
              box-sizing: border-box;
            }
            body {
              font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
              line-height: 1.8;
              color: #1e293b;
              max-width: 800px;
              margin: 0 auto;
              padding: 40px 20px;
              background: white;
            }
            h1 {
              color: #4f46e5;
              border-bottom: 3px solid #4f46e5;
              padding-bottom: 15px;
              margin-top: 0;
              margin-bottom: 30px;
              font-size: 28px;
            }
            h2 {
              color: #6366f1;
              margin-top: 35px;
              margin-bottom: 20px;
              font-size: 22px;
              border-left: 4px solid #6366f1;
              padding-left: 15px;
            }
            h3 {
              color: #818cf8;
              margin-top: 25px;
              margin-bottom: 15px;
              font-size: 18px;
            }
            ul {
              margin: 15px 0;
              padding-left: 35px;
            }
            ol {
              margin: 15px 0;
              padding-left: 35px;
            }
            li {
              margin: 8px 0;
              line-height: 1.7;
            }
            strong.keyword {
              color: #4f46e5;
              font-weight: 700;
              background-color: #fef3c7;
              padding: 2px 6px;
              border-radius: 4px;
              display: inline-block;
            }
            code {
              background-color: #f1f5f9;
              padding: 3px 8px;
              border-radius: 4px;
              font-family: 'Courier New', monospace;
              font-size: 0.9em;
              color: #dc2626;
            }
            p {
              margin: 12px 0;
              text-align: justify;
            }
            .footer {
              margin-top: 50px;
              padding-top: 20px;
              border-top: 2px solid #e5e7eb;
              text-align: center;
              color: #6b7280;
              font-size: 12px;
            }
            @media print {
              body {
                margin: 0;
                padding: 20px;
              }
              .no-print {
                display: none;
              }
            }
          </style>
        </head>
        <body>
          ${convertMarkdownToHTML(generatedNotes)}
          <div class="footer">
            <p>Generated by EduBridge AI Notes Converter on ${new Date().toLocaleString()}</p>
          </div>
        </body>
      </html>
    `;

    // Create blob and download
    const blob = new Blob([htmlContent], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `notes_${new Date().getTime()}.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    // Enable webcam after download
    // (moved to ReadingViewWithCamera if needed)
  };

  // handleViewPDF removed - "View & Read" flow replaced by Read with Camera

  const handleDownloadFromViewer = () => {
    if (!generatedNotes) return;
    handleDownloadPDF();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 p-4 md:p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-slate-800 mb-2">AI Notes Converter</h1>
          <p className="text-slate-600">Upload PDF or paste content to get concise revision notes with highlighted keywords.</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left Column - Input */}
          <div className="space-y-6">
            {/* File Upload Section */}
            <div className="bg-white rounded-xl shadow-lg p-6 border border-slate-200">
              <h2 className="text-lg font-semibold text-slate-800 mb-4 flex items-center gap-2">
                <Upload className="h-5 w-5 text-indigo-600" />
                Upload PDF File
              </h2>
              
              {!uploadedFile ? (
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="border-2 border-dashed border-pink-300 rounded-lg p-8 text-center cursor-pointer hover:border-pink-400 hover:bg-pink-50 transition-all"
                >
                  <FileText className="h-12 w-12 text-pink-400 mx-auto mb-3" />
                  <p className="text-slate-600 mb-2">Click to upload or drag and drop</p>
                  <p className="text-sm text-slate-500">PDF files only</p>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="application/pdf"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                </div>
              ) : (
                <div className="bg-slate-50 rounded-lg p-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
                    <File className="h-8 w-8 text-indigo-600" />
          <div>
                      <p className="font-medium text-slate-800">{uploadedFile.name}</p>
                      <p className="text-sm text-slate-500">
                        {(uploadedFile.size / 1024).toFixed(2)} KB
                      </p>
          </div>
        </div>
                  <button
                    onClick={removeFile}
                    className="text-red-600 hover:text-red-700 flex items-center gap-1 text-sm font-medium"
                  >
                    <X className="h-4 w-4" />
                    Remove File
                  </button>
        </div>
              )}
      </div>

            {/* Text Paste Section */}
            <div className="bg-white rounded-xl shadow-lg p-6 border border-slate-200">
              <div className="flex items-center gap-2 mb-4">
                <div className="flex-1 h-px bg-slate-200"></div>
                <span className="text-sm font-medium text-slate-500 uppercase">OR PASTE TEXT</span>
                <div className="flex-1 h-px bg-slate-200"></div>
              </div>
              
              <textarea
                value={pastedText}
                onChange={(e) => {
                  setPastedText(e.target.value);
                  if (e.target.value) {
                    setUploadedFile(null);
                    setFileBase64('');
                  }
                }}
                placeholder="Paste paragraphs or topic names here..."
                className="w-full h-64 p-4 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 resize-none text-slate-700 placeholder-slate-400"
              />
            </div>

            {/* RAG Enhancement Toggle */}
            <div className="flex items-center gap-3 bg-blue-50 p-3 rounded-lg mb-4 border border-blue-200">
              <input 
                type="checkbox" 
                id="rag-toggle"
                checked={useRAG}
                onChange={(e) => setUseRAG(e.target.checked)}
                className="w-4 h-4 text-blue-600 rounded"
              />
              <label htmlFor="rag-toggle" className="text-sm text-slate-700 cursor-pointer">
                <span className="font-semibold">Enhance with Knowledge Base</span>
                <span className="text-xs text-slate-500 block">Adds extra processing time but improves quality</span>
              </label>
            </div>

            {/* Generate Button */}
                      <button 
              onClick={handleGenerateNotes}
              disabled={loading || (!fileBase64 && !pastedText.trim())}
              className="w-full bg-gradient-to-r from-pink-500 to-indigo-600 text-white font-semibold py-4 px-6 rounded-lg shadow-lg hover:from-pink-600 hover:to-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" />
                  <div className="text-left">
                    <div>Generating Notes...</div>
                    <div className="text-xs opacity-80">{progress}</div>
                  </div>
                </>
              ) : (
                <>
                  Generate Notes
                  <FileText className="h-5 w-5" />
                </>
              )}
                      </button>
                  </div>

          {/* Right Column - Output */}
          <div className="bg-white rounded-xl shadow-lg p-6 border border-slate-200">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-slate-800 flex items-center gap-2">
                <FileText className="h-5 w-5 text-indigo-600" />
                Generated Notes
              </h2>
              {generatedNotes && (
                <div className="flex gap-2 flex-wrap">
                  <button
                    onClick={() => setShowCameraView(true)}
                    className="flex items-center gap-2 bg-gradient-to-r from-pink-500 to-red-500 text-white px-4 py-2 rounded-lg hover:shadow-lg transition-all text-sm font-medium"
                  >
                    <Camera className="h-4 w-4" />
                    Read with Camera
                  </button>
                  <button
                    onClick={handleDownloadPDF}
                    className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
                  >
                    <Download className="h-4 w-4" />
                    Download
                  </button>
                </div>
              )}
            </div>

            {loading ? (
              <div className="flex flex-col items-center justify-center h-96 text-slate-400">
                <Loader2 className="h-12 w-12 animate-spin mb-4" />
                <p>Analyzing content and generating notes...</p>
          </div>
            ) : generatedNotes ? (
              <div className="bg-slate-50 rounded-lg p-6 max-h-[calc(100vh-300px)] overflow-y-auto notes-display-container">
                <div className="prose prose-slate max-w-none">
                  <ReactMarkdown
                    components={{
                      h1: ({node, ...props}) => <h1 className="text-2xl font-bold text-indigo-700 mb-4 pb-2 border-b-2 border-indigo-200" {...props} />,
                      h2: ({node, ...props}) => <h2 className="text-xl font-semibold text-indigo-600 mt-6 mb-3" {...props} />,
                      h3: ({node, ...props}) => <h3 className="text-lg font-medium text-indigo-500 mt-4 mb-2" {...props} />,
                      ul: ({node, ...props}) => <ul className="list-disc pl-6 my-3 space-y-1" {...props} />,
                      ol: ({node, ...props}) => <ol className="list-decimal pl-6 my-3 space-y-1" {...props} />,
                      li: ({node, ...props}) => <li className="my-1 text-slate-700" {...props} />,
                      p: ({node, ...props}) => <p className="mb-3 text-slate-700 leading-relaxed" {...props} />,
                      strong: ({node, ...props}) => <strong className="font-bold text-indigo-700 bg-yellow-100 px-1 rounded" {...props} />,
                      code: ({node, ...props}) => <code className="bg-slate-200 px-2 py-1 rounded text-sm font-mono" {...props} />
                    }}
                  >
                    {generatedNotes}
                  </ReactMarkdown>
                </div>
             </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-96 text-slate-400">
                <FileText className="h-16 w-16 mb-4 opacity-30" />
                <p className="text-lg">Notes will appear here after conversion.</p>
                <p className="text-sm mt-2">Upload a PDF or paste text to get started.</p>
          </div>
        )}
      </div>
        </div>
      </div>

      {/* Reading with Camera Modal - NEW FEATURE */}
      {showCameraView && (
        <ReadingViewWithCamera
          htmlContent={generatedNotes}
          fileName={uploadedFile?.name || 'Generated Notes'}
          studentLanguage="English"
          onClose={() => setShowCameraView(false)}
          onDownload={handleDownloadFromViewer}
        />
      )}
    </div>
  );
};

export default Notes;
