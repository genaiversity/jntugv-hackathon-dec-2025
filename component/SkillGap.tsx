
import React, { useState, useRef, useEffect } from 'react';
import { analyzeSkillGap } from '../services/geminiServices';
import { SkillAnalysis } from '../types';
import { Loader2, CheckCircle, XCircle, Briefcase, ChevronDown, Upload, FileText, X, ExternalLink, BookOpen } from 'lucide-react';

const COMMON_ROLES = [
  'Full Stack Developer', 'Frontend Developer', 'Backend Developer',
  'Data Scientist', 'Machine Learning Engineer', 'DevOps Engineer',
  'Cloud Architect', 'Cybersecurity Analyst', 'Product Manager'
];

const SkillGap: React.FC = () => {
  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [targetRole, setTargetRole] = useState('Full Stack Developer');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<SkillAnalysis | null>(null);
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
      function handleClickOutside(event: MouseEvent) {
          if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
              setShowDropdown(false);
          }
      }
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files && e.target.files[0]) {
          setResumeFile(e.target.files[0]);
      }
  };

  const handleAnalyze = async () => {
    if (!resumeFile) return;
    setLoading(true);
    setResult(null); // Clear previous results
    
    try {
      // Optimized file reading with Promise
      const base64String = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
          const result = reader.result as string;
          const base64 = result.split(',')[1] || result;
          resolve(base64);
        };
        reader.onerror = reject;
        reader.readAsDataURL(resumeFile);
      });

      // Call analysis API
      const data = await analyzeSkillGap(
        { content: base64String, mimeType: resumeFile.type || 'application/pdf' }, 
        targetRole
      );
      
      setResult(data);
    } catch (e) {
      console.error("Analysis error:", e);
      alert("Analysis failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-8 animate-in fade-in duration-500">
      <div className="text-center space-y-2">
        <h2 className="text-3xl font-bold text-slate-800">Skill-Gap Predictor</h2>
        <p className="text-slate-500">Compare your skills with top MNC hiring trends.</p>
      </div>

      <div className="grid md:grid-cols-2 gap-8">
        <div className="space-y-6 bg-white p-8 rounded-xl shadow-sm border border-slate-200">
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2">Target Role</label>
            <div className="relative" ref={dropdownRef}>
              <Briefcase className="absolute left-3 top-3 h-5 w-5 text-slate-400 z-10" />
              <input 
                type="text" 
                value={targetRole}
                onChange={(e) => setTargetRole(e.target.value)}
                onFocus={() => setShowDropdown(true)}
                className="pl-10 w-full p-3 bg-white text-slate-900 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none transition-all pr-10"
                placeholder="e.g. Data Scientist"
              />
              <button onClick={() => setShowDropdown(!showDropdown)} className="absolute right-2 top-3 text-slate-400">
                  <ChevronDown className="h-5 w-5" />
              </button>
              {showDropdown && (
                  <div className="absolute top-full left-0 w-full mt-1 bg-white border border-slate-200 rounded-lg shadow-lg z-20 max-h-60 overflow-y-auto">
                      {COMMON_ROLES.map((role) => (
                          <button key={role} onClick={() => { setTargetRole(role); setShowDropdown(false); }}
                              className="w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-indigo-50 transition-colors">
                              {role}
                          </button>
                      ))}
                  </div>
              )}
            </div>
          </div>

          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2">Upload Resume (PDF)</label>
            <div className={`border-2 border-dashed rounded-xl p-8 flex flex-col items-center justify-center text-center transition-colors relative ${resumeFile ? 'border-indigo-300 bg-indigo-50' : 'border-slate-300 hover:border-indigo-400 hover:bg-slate-50'}`}>
                <input 
                    type="file" 
                    accept=".pdf"
                    onChange={handleFileChange}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                />
                {resumeFile ? (
                    <div className="flex flex-col items-center z-10">
                        <div className="bg-indigo-100 p-3 rounded-full mb-3">
                            <FileText className="h-8 w-8 text-indigo-600" />
                        </div>
                        <p className="text-sm font-bold text-slate-800">{resumeFile.name}</p>
                        <button onClick={(e) => { e.stopPropagation(); e.preventDefault(); setResumeFile(null); }}
                            className="mt-2 text-xs text-red-500 hover:underline flex items-center gap-1">
                            <X className="h-3 w-3" /> Remove
                        </button>
                    </div>
                ) : (
                    <>
                        <div className="bg-slate-100 p-3 rounded-full mb-3">
                            <Upload className="h-8 w-8 text-slate-500" />
                        </div>
                        <p className="text-sm font-bold text-slate-700">Click to Upload Resume</p>
                        <p className="text-xs text-slate-400 mt-1">PDF format only</p>
                    </>
                )}
            </div>
          </div>

          <button 
            onClick={handleAnalyze}
            disabled={loading || !resumeFile}
            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3.5 rounded-lg flex items-center justify-center gap-2 transition-all disabled:opacity-50 shadow-md"
          >
            {loading ? <Loader2 className="animate-spin h-5 w-5" /> : "Analyze Gap"}
          </button>
        </div>

        <div className="bg-white p-8 rounded-xl shadow-sm border border-slate-200 min-h-[400px]">
          {!result && !loading && (
            <div className="h-full flex flex-col items-center justify-center text-slate-400">
              <div className="p-4 bg-slate-50 rounded-full mb-3">
                <Briefcase className="h-10 w-10 text-slate-300" />
              </div>
              <p>Results will appear here</p>
            </div>
          )}

          {loading && (
            <div className="h-full flex flex-col items-center justify-center text-indigo-600 space-y-4">
              <Loader2 className="h-12 w-12 animate-spin" />
              <div className="text-center">
                  <p className="font-bold text-lg">AI is analyzing your resume...</p>
                  <p className="text-sm text-slate-500">Identifying missing skills & finding courses</p>
              </div>
            </div>
          )}

          {result && (
            <div className="space-y-6 animate-in slide-in-from-bottom-4">
              <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                <div>
                    <h3 className="text-sm text-slate-500 uppercase font-bold tracking-wider">Match Score</h3>
                    <div className={`text-4xl font-bold ${result.matchScore > 75 ? 'text-green-600' : result.matchScore > 50 ? 'text-yellow-600' : 'text-red-600'}`}>
                        {result.matchScore}%
                    </div>
                </div>
                <div className="text-right max-w-[200px]">
                    <p className="text-xs text-slate-500 font-medium italic">"{result.roleFit}"</p>
                </div>
              </div>

              <div>
                <h4 className="font-bold text-slate-800 flex items-center gap-2 mb-3">
                  <XCircle className="h-5 w-5 text-red-500" /> Missing Skills & Courses
                </h4>
                <div className="grid gap-3">
                  {result.missingSkills.map((item, i) => (
                    <div key={i} className="flex items-center justify-between p-3 bg-red-50 border border-red-100 rounded-lg group hover:border-red-200 transition-all">
                        <span className="text-sm font-bold text-red-800">{item.skill}</span>
                        <a 
                            href={item.courseLink} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-xs flex items-center gap-1 bg-white text-indigo-600 px-3 py-1.5 rounded-md border border-indigo-100 hover:bg-indigo-50 hover:border-indigo-300 transition-colors shadow-sm font-medium"
                        >
                            <BookOpen className="h-3 w-3" /> 
                            {item.platform === 'NPTEL' ? 'NPTEL' : 'Coursera'}
                            <ExternalLink className="h-3 w-3" />
                        </a>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <h4 className="font-bold text-slate-800 flex items-center gap-2 mb-2">
                  <CheckCircle className="h-5 w-5 text-green-500" /> Recommendations
                </h4>
                <ul className="space-y-2 text-sm text-slate-600">
                  {result.recommendations.map((rec, i) => (
                    <li key={i} className="flex items-start gap-2 bg-slate-50 p-2 rounded-lg">
                      <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-indigo-500 shrink-0"></span>
                      {rec}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SkillGap;
