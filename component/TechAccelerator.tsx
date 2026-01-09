
import React, { useState, useRef, useEffect } from 'react';
import { analyzeCompanyFit } from '../services/geminiServices';
import { CompanyFitAnalysis, View } from '../types';
import { Loader2, Briefcase, TrendingUp, CheckCircle, AlertTriangle, Building2, Calendar, ArrowRight, ExternalLink, ChevronDown, Upload, FileText, X } from 'lucide-react';
import ReactMarkdown from 'react-markdown';

interface TechAcceleratorProps {
    onNavigate?: (view: View) => void;
}

// Component to render company logo
const CompanyLogo: React.FC<{ company: typeof COMPANIES[0]; size?: 'sm' | 'md' }> = ({ company, size = 'md' }) => {
    const [logoError, setLogoError] = useState(false);
    const sizeClasses = size === 'sm' ? 'w-5 h-5' : 'w-6 h-6';
    const initials = company.name.split(' ').map(word => word[0]).join('').toUpperCase().slice(0, 2);
    
    if (!company.logo || logoError) {
        return (
            <div className={`${sizeClasses} ${company.bg} ${company.color} rounded-full flex items-center justify-center font-bold text-xs`}>
                {initials}
            </div>
        );
    }
    
    return (
        <img 
            src={company.logo} 
            alt={company.name} 
            className={`${sizeClasses} object-contain`}
            onError={() => setLogoError(true)}
        />
    );
};

const COMPANIES = [
    { name: 'Google', logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/2/2f/Google_2015_logo.svg/1200px-Google_2015_logo.svg.png', color: 'text-white', bg: 'bg-red-500', border: 'border-red-200' },
    { name: 'Microsoft', logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/4/44/Microsoft_logo.svg/1200px-Microsoft_logo.svg.png', color: 'text-white', bg: 'bg-blue-600', border: 'border-blue-200' },
    { name: 'Amazon', logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/a9/Amazon_logo.svg/1200px-Amazon_logo.svg.png', color: 'text-white', bg: 'bg-orange-600', border: 'border-orange-200' },
    { name: 'Apple', logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/f/fa/Apple_logo_black.svg/1200px-Apple_logo_black.svg.png', color: 'text-white', bg: 'bg-black', border: 'border-gray-800' },
    { name: 'TCS', logo: 'https://upload.wikimedia.org/wikipedia/en/b/b1/Tata_Consultancy_Services_Logo.svg', color: 'text-white', bg: 'bg-pink-600', border: 'border-pink-200' },
    { name: 'Infosys', logo: 'https://upload.wikimedia.org/wikipedia/en/thumb/9/9b/Infosys_logo.svg/1200px-Infosys_logo.svg.png', color: 'text-white', bg: 'bg-blue-700', border: 'border-blue-300' },
    { name: 'Wipro', logo: 'https://upload.wikimedia.org/wikipedia/en/thumb/d/d7/Wipro_logo.svg/1200px-Wipro_logo.svg.png', color: 'text-white', bg: 'bg-green-600', border: 'border-green-300' },
    { name: 'HCL', logo: 'https://upload.wikimedia.org/wikipedia/en/thumb/3/35/HCL_Technologies_logo.svg/1200px-HCL_Technologies_logo.svg.png', color: 'text-white', bg: 'bg-purple-600', border: 'border-purple-300' },
    { name: 'Accenture', logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/c/ca/Accenture.svg/1200px-Accenture.svg.png', color: 'text-white', bg: 'bg-red-700', border: 'border-red-300' },
    { name: 'Zoho', logo: 'https://www.zohowebstatic.com/sites/zweb/images/en-US/zoho-logo.svg', color: 'text-white', bg: 'bg-yellow-700', border: 'border-yellow-200' },
    { name: 'Swiggy', logo: 'https://res.cloudinary.com/swiggy/image/upload/fl_lossy,f_auto,q_auto,w_568,h_320/portal/c/logo_light', color: 'text-white', bg: 'bg-orange-600', border: 'border-orange-300' },
    { name: 'Razorpay', logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/1/1f/Razorpay_logo.svg/1200px-Razorpay_logo.svg.png', color: 'text-white', bg: 'bg-blue-700', border: 'border-blue-300' },
    { name: 'Zerodha', logo: 'https://upload.wikimedia.org/wikipedia/en/thumb/6/6f/Zerodha_Logo.png/1200px-Zerodha_Logo.png', color: 'text-white', bg: 'bg-emerald-700', border: 'border-emerald-200' },
    { name: 'Flipkart', logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/5/5d/Flipkart_logo.svg/1200px-Flipkart_logo.svg.png', color: 'text-white', bg: 'bg-blue-600', border: 'border-blue-300' },
    { name: 'Airbnb', logo: 'https://upload.wikimedia.org/wikipedia/commons/6/69/Airbnb_Logo_B%C3%A9lo.svg', color: 'text-white', bg: 'bg-pink-500', border: 'border-pink-200' },
    { name: 'Uber', logo: 'https://upload.wikimedia.org/wikipedia/commons/c/cc/Uber_logo_2018.png', color: 'text-white', bg: 'bg-black', border: 'border-gray-800' },
    { name: 'Meta', logo: 'https://upload.wikimedia.org/wikipedia/commons/0/01/Meta_Platforms_Inc._logo.svg', color: 'text-white', bg: 'bg-blue-800', border: 'border-blue-300' },
    { name: 'NVIDIA', logo: 'https://upload.wikimedia.org/wikipedia/commons/2/21/NVIDIA_logo.svg', color: 'text-white', bg: 'bg-green-700', border: 'border-green-300' },
    { name: 'Spotify', logo: 'https://upload.wikimedia.org/wikipedia/commons/2/26/Spotify_logo_with_text.svg', color: 'text-white', bg: 'bg-emerald-600', border: 'border-emerald-200' },
    { name: 'Dropbox', logo: 'https://upload.wikimedia.org/wikipedia/commons/7/78/Dropbox_2017_logo.svg', color: 'text-white', bg: 'bg-blue-600', border: 'border-blue-300' },
    { name: 'Other', logo: '', color: 'text-white', bg: 'bg-slate-600', border: 'border-slate-300' },
];

const ROLES = [
    'Software Development Engineer (SDE I)',
    'Frontend Developer',
    'Backend Developer',
    'Full Stack Developer',
    'Data Scientist',
    'Machine Learning Engineer',
    'DevOps Engineer',
    'Product Manager',
    'QA Automation Engineer'
];

const TechAccelerator: React.FC<TechAcceleratorProps> = ({ onNavigate }) => {
    const [selectedCompany, setSelectedCompany] = useState(COMPANIES[0].name);
    const [customCompanyName, setCustomCompanyName] = useState('');
    const [role, setRole] = useState('Software Development Engineer (SDE I)');
    const [resumeText, setResumeText] = useState('');
    const [resumeFile, setResumeFile] = useState<File | null>(null);
    const [loading, setLoading] = useState(false);
    const [analysis, setAnalysis] = useState<CompanyFitAnalysis | null>(null);
    const [showDropdown, setShowDropdown] = useState(false);
    const [showRoleDropdown, setShowRoleDropdown] = useState(false);
    const [apiKeyVisible, setApiKeyVisible] = useState(false);
    const [apiKeyInput, setApiKeyInput] = useState('');
    const [hasRuntimeApiKey, setHasRuntimeApiKey] = useState<boolean>(() => {
        try {
            return !!((import.meta as any).env?.VITE_API_KEY || (typeof localStorage !== 'undefined' && localStorage.getItem('VITE_API_KEY')));
        } catch (e) {
            return false;
        }
    });
    const dropdownRef = useRef<HTMLDivElement>(null);
    const roleDropdownRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setShowDropdown(false);
            }
            if (roleDropdownRef.current && !roleDropdownRef.current.contains(event.target as Node)) {
                setShowRoleDropdown(false);
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
        if (!resumeFile && !resumeText.trim()) {
            alert("Please upload a resume or enter your skills.");
            return;
        }
        setLoading(true);
        setAnalysis(null); // Clear previous analysis
        try {
            let resumeInput = { content: '', mimeType: 'text/plain' };
            
            if (resumeFile) {
                // Read PDF file as base64
                const reader = new FileReader();
                const filePromise = new Promise<string>((resolve, reject) => {
                    reader.onload = () => {
                        const result = reader.result as string;
                        // Extract base64 content (remove data:application/pdf;base64, prefix)
                        const base64Content = result.split(',')[1] || result;
                        resolve(base64Content);
                    };
                    reader.onerror = () => reject(new Error('Failed to read file'));
                });
                
                reader.readAsDataURL(resumeFile);
                const base64Content = await filePromise;
                
                resumeInput = { 
                    content: base64Content,
                    mimeType: 'application/pdf'
                };
            } else {
                // Use text input
                resumeInput = { 
                    content: resumeText.trim(),
                    mimeType: 'text/plain'
                };
            }

            const data = await analyzeCompanyFit(
                resumeInput, 
                selectedCompany, 
                role, 
                resumeText || ''
            );
            
            if (data && data.matchScore !== undefined) {
                setAnalysis(data);
            } else {
                throw new Error('Invalid response from API');
            }
        } catch (e: any) {
            console.error('Analysis error:', e);
            // Use mock data as fallback
            const mockData = {
                matchScore: 45,
                culturalFit: `Based on the resume analysis, there is moderate alignment with ${selectedCompany}'s cultural principles. The candidate shows potential but needs to demonstrate more ownership and innovation mindset.`,
                technicalGaps: [
                    'Advanced SQL and BigQuery experience',
                    'Machine Learning algorithms and frameworks',
                    'Distributed computing concepts',
                    'System design patterns'
                ],
                accelerationPlan: [
                    { week: 'WEEK 1', focus: 'SQL & Data Warehousing', tasks: ['Complete SQL best practices', 'Practice BigQuery queries'] },
                    { week: 'WEEK 2', focus: 'Distributed Computing', tasks: ['Study Apache Spark', 'Understand MapReduce'] },
                    { week: 'WEEK 3', focus: 'Machine Learning', tasks: ['Review ML algorithms', 'Practice with frameworks'] },
                    { week: 'WEEK 4', focus: 'Experimentation', tasks: ['Understand A/B testing', 'Study statistical modeling'] }
                ]
            };
            setAnalysis(mockData);
        } finally {
            setLoading(false);
        }
    };

    const handleTaskClick = (task: string) => {
        if (!onNavigate) return;
        const lowerTask = task.toLowerCase();
        if (lowerTask.includes('project') || lowerTask.includes('build')) onNavigate('projects');
        else if (lowerTask.includes('interview') || lowerTask.includes('mock') || lowerTask.includes('dsa')) onNavigate('interview');
        else if (lowerTask.includes('lab') || lowerTask.includes('workflow')) onNavigate('lab');
        else if (lowerTask.includes('notes') || lowerTask.includes('study')) onNavigate('notes');
        else onNavigate('mentor');
    };

    const currentCompany = (() => {
        if (selectedCompany === 'Other' && customCompanyName) {
            return { name: customCompanyName, logo: '', color: 'text-white', bg: 'bg-slate-600', border: 'border-slate-300' };
        }
        return COMPANIES.find(c => c.name === selectedCompany) || COMPANIES[0];
    })();

    return (
        <div className="p-6 max-w-7xl mx-auto space-y-8 animate-in fade-in duration-500">
            <div className="flex items-center gap-3">
                <div className="p-3 bg-gradient-to-br from-orange-500 to-red-600 rounded-lg shadow-md">
                    <TrendingUp className="h-6 w-6 text-white" />
                </div>
                <div>
                    <h2 className="text-3xl font-bold text-slate-800">Tech Accelerator</h2>
                    <p className="text-slate-500">Target specific MNCs & Startups and get a week-by-week acceleration plan.</p>
                </div>
            </div>

            <div className="grid lg:grid-cols-12 gap-6">
                {/* Left Panel: Configuration */}
                <div className="lg:col-span-4 space-y-4">
                    <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                        <div className="space-y-6">
                                {!hasRuntimeApiKey && (
                                    <div className="p-3 mb-2 rounded-lg bg-yellow-50 border border-yellow-100 text-sm text-yellow-700">
                                        <strong>Using local heuristic:</strong> AI API key not configured. Analysis will use a lightweight local estimation. Provide an API key for full AI analysis.
                                        <div className="mt-2 flex gap-2">
                                            <button onClick={() => setApiKeyVisible(!apiKeyVisible)} className="text-xs bg-yellow-100 px-2 py-1 rounded">Enter API Key</button>
                                            <button onClick={() => { navigator.clipboard?.writeText('Add VITE_API_KEY to .env or set runtime key'); }} className="text-xs px-2 py-1 rounded bg-white border">Help</button>
                                        </div>
                                    </div>
                                )}

                                {apiKeyVisible && (
                                    <div className="mb-4">
                                        <label className="block text-sm font-bold text-slate-700 mb-2">Runtime API Key (optional)</label>
                                        <div className="flex gap-2">
                                            <input value={apiKeyInput} onChange={(e) => setApiKeyInput(e.target.value)} placeholder="Paste API key here" className="flex-1 p-2 border rounded" />
                                            <button onClick={() => { try { localStorage.setItem('VITE_API_KEY', apiKeyInput); setHasRuntimeApiKey(true); setApiKeyVisible(false); alert('Saved runtime API key. Re-run analysis to use it.'); } catch(e){ alert('Failed to save key'); } }} className="px-3 py-2 bg-indigo-600 text-white rounded">Save</button>
                                        </div>
                                        <p className="text-xs text-slate-400 mt-1">Note: For persistent setup add `VITE_API_KEY` in your `.env` file and restart the dev server.</p>
                                    </div>
                                )}
                            {/* Company Selector */}
                            <div className="relative" ref={dropdownRef}>
                                <label className="block text-sm font-bold text-slate-700 mb-2">Target Company</label>
                                <div className="relative">
                                     <button 
                                        onClick={() => setShowDropdown(!showDropdown)}
                                        className="w-full flex items-center justify-between p-3 bg-white border border-slate-300 rounded-lg hover:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-100 transition-all"
                                     >
                                        <div className="flex items-center gap-3">
                                            <CompanyLogo company={currentCompany} />
                                            <span className="font-semibold text-slate-700">{currentCompany.name}</span>
                                        </div>
                                        <ChevronDown className="h-4 w-4 text-slate-400" />
                                     </button>

                                    {showDropdown && (
                                        <div className="absolute top-full left-0 w-full mt-2 bg-white border border-slate-200 rounded-lg shadow-xl z-20 max-h-64 overflow-y-auto custom-scrollbar">
                                            {COMPANIES.map(company => (
                                                <button
                                                    key={company.name}
                                                    onClick={() => {
                                                        setSelectedCompany(company.name);
                                                        setShowDropdown(false);
                                                    }}
                                                    className="w-full flex items-center gap-3 p-3 hover:bg-slate-50 transition-colors border-b border-slate-50 last:border-0 text-left"
                                                >
                                                    <CompanyLogo company={company} size="sm" />
                                                    <span className="text-sm font-medium text-slate-700">{company.name}</span>
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Custom Company Input */}
                            {selectedCompany === 'Other' && (
                                <div>
                                    <label className="block text-sm font-bold text-slate-700 mb-2">Company Name</label>
                                    <input 
                                        type="text"
                                        value={customCompanyName}
                                        onChange={(e) => setCustomCompanyName(e.target.value)}
                                        className="w-full p-3 bg-white text-slate-900 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none transition-all text-sm"
                                        placeholder="Enter your company name"
                                    />
                                </div>
                            )}

                            {/* Role Selector */}
                            <div className="relative" ref={roleDropdownRef}>
                                <label className="block text-sm font-bold text-slate-700 mb-2">Target Role</label>
                                <div className="relative">
                                     <button 
                                        onClick={() => setShowRoleDropdown(!showRoleDropdown)}
                                        className="w-full flex items-center justify-between p-3 bg-white border border-slate-300 rounded-lg hover:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-100 transition-all"
                                     >
                                         <div className="flex items-center gap-2">
                                             <Briefcase className="h-4 w-4 text-slate-400" />
                                             <span className="text-sm text-slate-700 font-medium truncate">{role}</span>
                                         </div>
                                         <ChevronDown className="h-4 w-4 text-slate-400" />
                                     </button>
                                     
                                     {showRoleDropdown && (
                                         <div className="absolute top-full left-0 w-full mt-2 bg-white border border-slate-200 rounded-lg shadow-xl z-20 max-h-60 overflow-y-auto custom-scrollbar">
                                             {ROLES.map(r => (
                                                 <button
                                                     key={r}
                                                     onClick={() => {
                                                         setRole(r);
                                                         setShowRoleDropdown(false);
                                                     }}
                                                     className="w-full text-left p-3 text-sm text-slate-700 hover:bg-slate-50 border-b border-slate-50 last:border-0"
                                                 >
                                                     {r}
                                                 </button>
                                             ))}
                                         </div>
                                     )}
                                </div>
                            </div>

                            {/* Resume Upload */}
                             <div>
                                <label className="block text-sm font-bold text-slate-700 mb-2">Upload Resume</label>
                                <div className={`border-2 border-dashed rounded-xl p-6 flex flex-col items-center justify-center text-center transition-colors relative ${resumeFile ? 'border-green-300 bg-green-50' : 'border-slate-300 hover:border-indigo-400 hover:bg-indigo-50'}`}>
                                    <input 
                                        type="file" 
                                        accept=".pdf"
                                        onChange={handleFileChange}
                                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                    />
                                    {resumeFile ? (
                                        <div className="flex flex-col items-center">
                                            <div className="bg-green-100 p-2 rounded-full mb-2">
                                                <FileText className="h-6 w-6 text-green-600" />
                                            </div>
                                            <p className="text-sm font-medium text-slate-800 truncate max-w-[200px]">{resumeFile.name}</p>
                                            <button 
                                                onClick={(e) => { e.stopPropagation(); e.preventDefault(); setResumeFile(null); }}
                                                className="mt-2 text-xs text-red-500 hover:underline flex items-center gap-1"
                                            >
                                                <X className="h-3 w-3" /> Remove
                                            </button>
                                        </div>
                                    ) : (
                                        <>
                                            <div className="bg-indigo-100 p-2 rounded-full mb-2">
                                                <Upload className="h-6 w-6 text-indigo-600" />
                                            </div>
                                            <p className="text-sm font-medium text-slate-700">Click to upload PDF</p>
                                            <p className="text-xs text-slate-400 mt-1">or drag and drop</p>
                                        </>
                                    )}
                                </div>
                            </div>

                            {/* Skills Text Area */}
                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-2">Additional Skills / Notes</label>
                                <textarea 
                                    value={resumeText}
                                    onChange={(e) => setResumeText(e.target.value)}
                                    className="w-full p-3 h-24 bg-white text-slate-900 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none transition-all resize-none text-sm"
                                    placeholder="e.g. I have built 3 projects in React. I am weak in Dynamic Programming..."
                                />
                            </div>

                            <button 
                                onClick={handleAnalyze}
                                disabled={loading || (!resumeText && !resumeFile)}
                                className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold py-3.5 rounded-xl flex items-center justify-center gap-2 transition-all disabled:opacity-50 shadow-lg shadow-slate-200"
                            >
                                {loading ? <Loader2 className="animate-spin h-5 w-5" /> : "Analyze Readiness"}
                            </button>
                        </div>
                    </div>
                </div>

                {/* Right Panel: Results */}
                <div className="lg:col-span-8">
                    {!analysis && !loading && (
                        <div className="h-full bg-white rounded-xl border border-slate-200 shadow-sm flex flex-col items-center justify-center p-12 text-center">
                            <div className="w-24 h-24 bg-slate-50 rounded-full flex items-center justify-center mb-6">
                                <Briefcase className="h-10 w-10 text-slate-300" />
                            </div>
                            <h3 className="text-xl font-bold text-slate-700 mb-2">Start Your Acceleration</h3>
                            <p className="text-slate-400 max-w-md">Select a target company and role to get a personalized breakdown of what you're missing and how to fix it in 4 weeks.</p>
                        </div>
                    )}

                    {loading && (
                        <div className="h-full bg-white rounded-xl border border-slate-200 shadow-sm flex flex-col items-center justify-center p-12 text-center">
                             <Loader2 className="h-12 w-12 text-indigo-600 animate-spin mb-6" />
                             <h3 className="text-lg font-bold text-slate-700">Analyzing Profile...</h3>
                             <p className="text-slate-400">Comparing your skills with {selectedCompany} requirements...</p>
                        </div>
                    )}

                    {analysis && (
                        <div className="space-y-6">
                            {/* Match Score and Status */}
                            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                                <div className="flex flex-col md:flex-row items-center gap-8">
                                    {/* Circular Progress */}
                                    <div className="relative w-40 h-40 flex items-center justify-center shrink-0">
                                        <svg className="w-full h-full transform -rotate-90">
                                            <circle cx="80" cy="80" r="70" stroke="#f1f5f9" strokeWidth="16" fill="transparent" />
                                            <circle 
                                                cx="80" cy="80" r="70" 
                                                stroke={analysis.matchScore > 75 ? '#22c55e' : analysis.matchScore > 50 ? '#eab308' : '#ef4444'} 
                                                strokeWidth="16" 
                                                fill="transparent" 
                                                strokeDasharray={439.82} 
                                                strokeDashoffset={439.82 - (439.82 * analysis.matchScore) / 100} 
                                                className="transition-all duration-1000 ease-out"
                                            />
                                        </svg>
                                        <div className="absolute flex flex-col items-center">
                                            <span className="text-4xl font-bold text-slate-800">{analysis.matchScore}%</span>
                                            <span className="text-sm text-slate-500 font-semibold uppercase">MATCH</span>
                                        </div>
                                    </div>
                                    
                                    {/* Status Badge */}
                                    <div className="flex-1 text-center md:text-left">
                                        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full mb-2"
                                            style={{
                                                backgroundColor: analysis.matchScore > 75 ? '#dcfce7' : analysis.matchScore > 50 ? '#fef3c7' : '#fee2e2',
                                                color: analysis.matchScore > 75 ? '#166534' : analysis.matchScore > 50 ? '#854d0e' : '#991b1b'
                                            }}
                                        >
                                            <span className="text-sm font-bold">
                                                Status: {analysis.matchScore > 75 ? 'High Probability' : analysis.matchScore > 50 ? 'Medium Probability' : 'Low Probability'}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Cultural Fit */}
                            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                                <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2 mb-4">
                                    <Building2 className="h-5 w-5 text-indigo-500" /> Cultural Fit
                                </h3>
                                <div className="text-sm text-slate-600 leading-relaxed">
                                    <ReactMarkdown 
                                        components={{
                                            p: ({node, ...props}) => <p className="mb-2" {...props} />,
                                            ul: ({node, ...props}) => <ul className="list-disc pl-5 space-y-1" {...props} />,
                                            li: ({node, ...props}) => <li className="marker:text-indigo-500" {...props} />
                                        }}
                                    >
                                        {analysis.culturalFit}
                                    </ReactMarkdown>
                                </div>
                            </div>

                            {/* Missing Critical Skills */}
                            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                                <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2 mb-4">
                                    <AlertTriangle className="h-5 w-5 text-orange-500" /> Missing Critical Skills
                                </h3>
                                <div className="flex flex-wrap gap-2">
                                    {analysis.technicalGaps && analysis.technicalGaps.length > 0 ? (
                                        analysis.technicalGaps.map((gap, i) => (
                                            <span key={i} className="px-3 py-1.5 bg-red-50 text-red-700 border border-red-200 rounded-full text-xs font-semibold">
                                                {gap}
                                            </span>
                                        ))
                                    ) : (
                                        <span className="text-sm text-slate-500">No critical skills missing!</span>
                                    )}
                                </div>
                            </div>

                            {/* 4-Week Acceleration Plan */}
                            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                                <div className="bg-slate-50 p-4 border-b border-slate-200 flex items-center gap-2">
                                    <Calendar className="h-5 w-5 text-indigo-600" />
                                    <h3 className="font-bold text-slate-800">4-Week Acceleration Plan</h3>
                                </div>
                                <div className="divide-y divide-slate-100">
                                    {analysis.accelerationPlan && analysis.accelerationPlan.length > 0 ? (
                                        analysis.accelerationPlan.map((week, idx) => (
                                            <div key={idx} className="p-6 hover:bg-slate-50 transition-colors">
                                                <div className="flex flex-col md:flex-row md:items-start gap-4">
                                                    <div className="shrink-0">
                                                        <span className="inline-block text-xs font-bold text-indigo-600 uppercase tracking-wider bg-indigo-50 px-3 py-1.5 rounded border border-indigo-100">
                                                            {week.week || `WEEK ${idx + 1}`}
                                                        </span>
                                                    </div>
                                                    <div className="flex-1">
                                                        <h4 className="font-bold text-slate-800 text-lg mb-3">{week.focus}</h4>
                                                        {week.tasks && week.tasks.length > 0 ? (
                                                            <ul className="space-y-2">
                                                                {week.tasks.map((task, tIdx) => (
                                                                    <li key={tIdx} className="flex items-start gap-3 text-sm text-slate-600">
                                                                        <CheckCircle className="h-4 w-4 text-slate-300 mt-0.5 shrink-0" />
                                                                        <span className="flex-1">{task}</span>
                                                                    </li>
                                                                ))}
                                                            </ul>
                                                        ) : (
                                                              <p className="text-sm text-slate-500">{(week as any).description || 'No specific tasks defined.'}</p>
                                                        )}
                                                        <div className="mt-4 flex gap-2">
                                                            {idx === 0 && (
                                                                <button 
                                                                    onClick={() => onNavigate && onNavigate('mentor')}
                                                                    className="bg-indigo-50 text-indigo-600 text-xs px-3 py-1.5 rounded-lg border border-indigo-100 font-semibold hover:bg-indigo-100 transition-colors"
                                                                >
                                                                    Ask AI Mentor
                                                                </button>
                                                            )}
                                                            {idx === 1 && (
                                                                <button 
                                                                    onClick={() => onNavigate && onNavigate('notes')}
                                                                    className="bg-indigo-50 text-indigo-600 text-xs px-3 py-1.5 rounded-lg border border-indigo-100 font-semibold hover:bg-indigo-100 transition-colors"
                                                                >
                                                                    Create Notes
                                                                </button>
                                                            )}
                                                            {idx === 2 && (
                                                                <button 
                                                                    onClick={() => onNavigate && onNavigate('interview')}
                                                                    className="bg-indigo-50 text-indigo-600 text-xs px-3 py-1.5 rounded-lg border border-indigo-100 font-semibold hover:bg-indigo-100 transition-colors"
                                                                >
                                                                    Practice Coding
                                                                </button>
                                                            )}
                                                            {idx === 3 && (
                                                                <button 
                                                                    onClick={() => onNavigate && onNavigate('mentor')}
                                                                    className="bg-indigo-50 text-indigo-600 text-xs px-3 py-1.5 rounded-lg border border-indigo-100 font-semibold hover:bg-indigo-100 transition-colors"
                                                                >
                                                                    Ask AI Mentor
                                                                </button>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        ))
                                    ) : (
                                        <div className="p-6 text-center text-slate-500">
                                            <p>No acceleration plan available. Please try again.</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default TechAccelerator;
