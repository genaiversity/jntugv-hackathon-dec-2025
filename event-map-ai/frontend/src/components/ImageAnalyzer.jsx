import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './ImageAnalyzer.css';

const ImageAnalyzer = () => {
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [analysisResult, setAnalysisResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [autoCreateEvent, setAutoCreateEvent] = useState(false);
  const navigate = useNavigate();
  const { currentUser } = useAuth();

  const handleFileChange = (event) => {
    const file = event.target.files[0];
    if (file) {
      setSelectedFile(file);
      setPreviewUrl(URL.createObjectURL(file));
      setAnalysisResult(null);
      setError(null);
    }
  };

  const analyzeImage = async () => {
    if (!selectedFile) {
      setError('Please select an image file first');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append('image', selectedFile);

      const response = await fetch('/api/multimodal/analyze-image', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (response.ok) {
        setAnalysisResult(data);
        
        // Automatically create event if enabled
        if (autoCreateEvent && data.analysis) {
          await createEventFromAnalysis(data.analysis);
        }
      } else {
        setError(data.error || 'Failed to analyze image');
      }
    } catch (err) {
      console.error('Error analyzing image:', err);
      setError('Failed to analyze image: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const extractText = async () => {
    if (!selectedFile) {
      setError('Please select an image file first');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append('image', selectedFile);

      const response = await fetch('/api/multimodal/extract-text', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (response.ok) {
        setAnalysisResult({
          extractedText: data.extractedText,
          fileName: data.fileName
        });
      } else {
        setError(data.error || 'Failed to extract text');
      }
    } catch (err) {
      console.error('Error extracting text:', err);
      setError('Failed to extract text: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const suggestEvents = async () => {
    if (!selectedFile) {
      setError('Please select an image file first');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append('image', selectedFile);

      const response = await fetch('/api/multimodal/suggest-events', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (response.ok) {
        setAnalysisResult({
          eventSuggestions: data.eventSuggestions,
          fileName: data.fileName
        });
      } else {
        setError(data.error || 'Failed to suggest events');
      }
    } catch (err) {
      console.error('Error suggesting events:', err);
      setError('Failed to suggest events: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const createEventFromAnalysis = async (analysis) => {
    if (!currentUser) {
      setError('You must be logged in to create events');
      return;
    }

    try {
      // Prepare event data based on image analysis
      const eventData = new FormData();
      eventData.append('title', analysis.scene || 'Event from Image');
      eventData.append('description', analysis.description || 'Event created from image analysis');
      eventData.append('location', 'Location TBD'); // Default location
      eventData.append('latitude', '51.5074'); // Default London coordinates
      eventData.append('longitude', '-0.1278'); // Default London coordinates
      eventData.append('date', new Date().toISOString()); // Default to today
      eventData.append('category', analysis.tags && analysis.tags.length > 0 ? analysis.tags[0] : 'general');
      
      // Append the image file
      if (selectedFile) {
        eventData.append('photos', selectedFile);
      }

      const response = await fetch('/api/events', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${currentUser.token}`
        },
        body: eventData
      });

      const result = await response.json();

      if (response.ok) {
        alert('Event created successfully!');
        navigate(`/event/${result.event._id}`);
      } else {
        setError(result.message || 'Failed to create event');
      }
    } catch (err) {
      console.error('Error creating event:', err);
      setError('Failed to create event: ' + err.message);
    }
  };

  return (
    <div className="image-analyzer">
      <h2>Image Analyzer</h2>
      <p>Upload an image to analyze its content, extract text, or get event suggestions</p>
      
      <div className="upload-section">
        <input
          type="file"
          accept="image/*"
          onChange={handleFileChange}
          id="image-upload"
          className="file-input"
        />
        <label htmlFor="image-upload" className="file-label">
          Choose Image
        </label>
        
        {previewUrl && (
          <div className="image-preview">
            <img src={previewUrl} alt="Preview" />
          </div>
        )}
      </div>

      {selectedFile && (
        <div className="options-section">
          <div className="auto-create-option">
            <label>
              <input
                type="checkbox"
                checked={autoCreateEvent}
                onChange={(e) => setAutoCreateEvent(e.target.checked)}
              />
              Automatically create event from image analysis
            </label>
          </div>
          
          <div className="action-buttons">
            <button 
              onClick={analyzeImage} 
              disabled={loading}
              className="analyze-btn"
            >
              {loading ? 'Analyzing...' : 'Analyze Image'}
            </button>
            <button 
              onClick={extractText} 
              disabled={loading}
              className="extract-btn"
            >
              {loading ? 'Extracting...' : 'Extract Text'}
            </button>
            <button 
              onClick={suggestEvents} 
              disabled={loading}
              className="suggest-btn"
            >
              {loading ? 'Suggesting...' : 'Suggest Events'}
            </button>
          </div>
        </div>
      )}

      {error && (
        <div className="error-message">
          Error: {error}
        </div>
      )}

      {analysisResult && (
        <div className="results-section">
          <h3>Results</h3>
          
          {analysisResult.analysis && (
            <div className="analysis-result">
              <h4>Image Analysis</h4>
              <div className="result-item">
                <strong>Description:</strong>
                <p>{analysisResult.analysis.description}</p>
              </div>
              {analysisResult.analysis.objects && analysisResult.analysis.objects.length > 0 && (
                <div className="result-item">
                  <strong>Objects Detected:</strong>
                  <p>{analysisResult.analysis.objects.join(', ')}</p>
                </div>
              )}
              {analysisResult.analysis.tags && analysisResult.analysis.tags.length > 0 && (
                <div className="result-item">
                  <strong>Tags:</strong>
                  <p>{analysisResult.analysis.tags.join(', ')}</p>
                </div>
              )}
              {analysisResult.analysis.visibleText && (
                <div className="result-item">
                  <strong>Visible Text:</strong>
                  <p>{analysisResult.analysis.visibleText}</p>
                </div>
              )}
              {analysisResult.analysis.scene && (
                <div className="result-item">
                  <strong>Scene:</strong>
                  <p>{analysisResult.analysis.scene}</p>
                </div>
              )}
              
              {autoCreateEvent && (
                <div className="auto-create-info">
                  <p>✅ Event will be automatically created based on this analysis</p>
                </div>
              )}
            </div>
          )}

          {analysisResult.extractedText && (
            <div className="text-result">
              <h4>Extracted Text</h4>
              <div className="result-item">
                <pre>{analysisResult.extractedText}</pre>
              </div>
            </div>
          )}

          {analysisResult.eventSuggestions && analysisResult.eventSuggestions.length > 0 && (
            <div className="suggestions-result">
              <h4>Event Suggestions</h4>
              {analysisResult.eventSuggestions.map((suggestion, index) => (
                <div key={index} className="suggestion-item">
                  <h5>{suggestion.title}</h5>
                  <p><strong>Description:</strong> {suggestion.description}</p>
                  <p><strong>Category:</strong> {suggestion.category}</p>
                  <p><strong>Location Type:</strong> {suggestion.locationType}</p>
                  <p><strong>Target Audience:</strong> {suggestion.targetAudience}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ImageAnalyzer;