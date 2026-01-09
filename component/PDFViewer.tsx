import React, { useState, useRef, useEffect } from 'react';
import { X, ChevronLeft, ChevronRight, Eye, Volume2, Download } from 'lucide-react';
import ReadingAnalysis from './ReadingAnalysis';

interface PDFViewerProps {
  htmlContent: string;
  fileName: string;
  pageCount?: number;
  studentLanguage?: string;
  onClose: () => void;
  onDownload: () => void;
}

const PDFViewer: React.FC<PDFViewerProps> = ({
  htmlContent,
  fileName,
  studentLanguage = 'English',
  onClose,
  onDownload
}) => {
  const [currentPage, setCurrentPage] = useState(1);
  const [showAnalysis, setShowAnalysis] = useState(false);
  const [estimatedPageCount, setEstimatedPageCount] = useState(1);
  const contentRef = useRef<HTMLDivElement>(null);

  // Estimate page count based on content length
  useEffect(() => {
    if (htmlContent) {
      const length = htmlContent.length;
      // Rough estimate: 3000 characters ≈ 1 page
      const estimated = Math.ceil(length / 3000);
      setEstimatedPageCount(Math.max(5, estimated)); // Minimum 5 pages
    }
  }, [htmlContent]);

  // Auto-trigger reading analysis if PDF has 5+ pages
  useEffect(() => {
    if (estimatedPageCount > 5 && !showAnalysis) {
      setTimeout(() => {
        setShowAnalysis(true);
      }, 2000); // Show after 2 seconds of reading
    }
  }, [estimatedPageCount, showAnalysis]);

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

  return (
    <>
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-xl shadow-2xl w-full max-h-[95vh] overflow-hidden flex flex-col">
          {/* Header */}
          <div className="bg-gradient-to-r from-indigo-600 to-pink-600 p-4 flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-white">{fileName}</h2>
              <p className="text-indigo-100 text-sm">
                Page {currentPage} of {estimatedPageCount} | Estimated {estimatedPageCount} pages
              </p>
            </div>
            <button
              onClick={onClose}
              className="text-white hover:bg-white hover:bg-opacity-20 p-2 rounded-lg transition-all"
            >
              <X className="h-6 w-6" />
            </button>
          </div>

          {/* Content Area */}
          <div className="flex-1 overflow-y-auto p-6 bg-slate-50">
            <div
              ref={contentRef}
              className="bg-white p-8 rounded-lg shadow prose prose-slate max-w-none"
              dangerouslySetInnerHTML={{ __html: htmlContent }}
            />
          </div>

          {/* Footer Controls */}
          <div className="bg-slate-100 p-4 border-t border-slate-200">
            {/* Action Buttons */}
            <div className="flex gap-2 mb-4 flex-wrap">
              <button
                onClick={handleTextToSpeech}
                className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-all text-sm font-semibold"
              >
                <Volume2 className="h-4 w-4" />
                Read Aloud
              </button>

              {estimatedPageCount > 5 && (
                <button
                  onClick={() => setShowAnalysis(true)}
                  className="flex items-center gap-2 bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-all text-sm font-semibold"
                >
                  <Eye className="h-4 w-4" />
                  Analyze Reading
                </button>
              )}

              <button
                onClick={onDownload}
                className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-all text-sm font-semibold"
              >
                <Download className="h-4 w-4" />
                Download PDF
              </button>
            </div>

            {/* Page Navigation */}
            <div className="flex items-center justify-between">
              <button
                onClick={handlePrevPage}
                disabled={currentPage === 1}
                className="flex items-center gap-2 bg-slate-300 text-slate-700 px-4 py-2 rounded-lg hover:bg-slate-400 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                <ChevronLeft className="h-4 w-4" />
                Previous
              </button>

              <div className="flex-1 mx-4">
                <div className="bg-white rounded-lg p-3">
                  <input
                    type="range"
                    min="1"
                    max={estimatedPageCount}
                    value={currentPage}
                    onChange={(e) => setCurrentPage(parseInt(e.target.value))}
                    className="w-full"
                  />
                  <p className="text-center text-xs text-slate-500 mt-2">
                    Page {currentPage} of {estimatedPageCount}
                  </p>
                </div>
              </div>

              <button
                onClick={handleNextPage}
                disabled={currentPage === estimatedPageCount}
                className="flex items-center gap-2 bg-slate-300 text-slate-700 px-4 py-2 rounded-lg hover:bg-slate-400 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                Next
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>

            {/* Info */}
            {estimatedPageCount > 5 && (
              <p className="text-xs text-slate-600 text-center mt-3">
                💡 Tip: Your reading emotions will be monitored during this {estimatedPageCount}-page document
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Reading Analysis Modal */}
      {showAnalysis && estimatedPageCount > 5 && (
        <ReadingAnalysis
          pdfPageCount={estimatedPageCount}
          onClose={() => setShowAnalysis(false)}
          studentLanguage={studentLanguage}
        />
      )}
    </>
  );
};

export default PDFViewer;
