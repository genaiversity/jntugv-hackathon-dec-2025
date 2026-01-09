import React, { useState, useRef, useEffect } from 'react';
import { generateProjectIdeas } from '../services/geminiServices';
import { ProjectIdea } from '../types';
import { Loader2, Lightbulb, Layers, GitBranch, ArrowRight, ChevronDown } from 'lucide-react';

const INTERESTS_LIST = [
    'Healthcare', 'FinTech', 'EdTech', 'E-commerce', 
    'Sustainability', 'Smart Cities', 'Agriculture', 
    'Social Media', 'Cybersecurity', 'Gaming'
];

const Projects: React.FC = () => {
  const [domain, setDomain] = useState('Web Development');
  const [interests, setInterests] = useState('');
  const [loading, setLoading] = useState(false);
  const [ideas, setIdeas] = useState<ProjectIdea[]>([]);
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

  const handleGenerate = async () => {
    if (!interests) return;
    setLoading(true);
    try {
      const data = await generateProjectIdeas(interests, domain);
      setIdeas(data);
    } catch (e) {
      alert("Failed to generate ideas.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 p-6 max-w-7xl mx-auto space-y-8">
      <div className="text-center space-y-2">
        <h2 className="text-4xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">AI Project Generator</h2>
        <p className="text-slate-600 text-lg">Get unique, plagiarism-free project ideas with architecture & roadmaps</p>
      </div>

      <div className="bg-white p-8 rounded-2xl shadow-xl border border-slate-200 backdrop-blur-sm">
        <div className="grid md:grid-cols-3 gap-6 items-end">
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2 flex items-center gap-2">
              <Layers className="h-4 w-4 text-indigo-600" />
              Domain
            </label>
            <select 
              value={domain}
              onChange={(e) => setDomain(e.target.value)}
              className="w-full p-3 bg-white text-slate-900 border-2 border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 focus:outline-none transition-all shadow-sm hover:border-indigo-300"
            >
              <option>Web Development</option>
              <option>Machine Learning / AI</option>
              <option>Blockchain</option>
              <option>IoT & Embedded</option>
              <option>Cybersecurity</option>
              <option>Cloud Computing</option>
            </select>
          </div>
          <div className="md:col-span-1 relative" ref={dropdownRef}>
            <label className="block text-sm font-bold text-slate-700 mb-2 flex items-center gap-2">
              <Lightbulb className="h-4 w-4 text-purple-600" />
              Specific Interests
            </label>
            <div className="relative">
                <input 
                type="text" 
                value={interests}
                onChange={(e) => setInterests(e.target.value)}
                onFocus={() => setShowDropdown(true)}
                placeholder="e.g. Healthcare, Finance..."
                className="w-full p-3 bg-white text-slate-900 border-2 border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 focus:outline-none pr-10 transition-all shadow-sm hover:border-indigo-300"
                />
                <button 
                    onClick={() => setShowDropdown(!showDropdown)}
                    className="absolute right-3 top-3.5 text-slate-400 hover:text-indigo-600 transition-colors"
                >
                    <ChevronDown className="h-5 w-5" />
                </button>
            </div>
            
            {showDropdown && (
                <div className="absolute top-full left-0 w-full mt-2 bg-white border-2 border-slate-200 rounded-xl shadow-2xl z-20 max-h-60 overflow-y-auto">
                    {INTERESTS_LIST.map((item) => (
                        <button
                            key={item}
                            onClick={() => {
                                setInterests(item);
                                setShowDropdown(false);
                            }}
                            className="w-full text-left px-4 py-3 text-sm font-medium text-slate-700 hover:bg-gradient-to-r hover:from-indigo-50 hover:to-purple-50 hover:text-indigo-700 transition-all border-b border-slate-50 last:border-0"
                        >
                            {item}
                        </button>
                    ))}
                    <div className="p-3 text-xs text-slate-400 border-t-2 border-slate-100 italic text-center bg-slate-50">
                        Type for custom interests
                    </div>
                </div>
            )}
          </div>
          <button 
            onClick={handleGenerate}
            disabled={loading || !interests}
            className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-bold py-3.5 px-8 rounded-xl flex items-center justify-center gap-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl transform hover:scale-105 active:scale-95"
          >
            {loading ? (
              <>
                <Loader2 className="animate-spin h-5 w-5" />
                Generating...
              </>
            ) : (
              <>
                Generate Ideas <Lightbulb className="h-5 w-5" />
              </>
            )}
          </button>
        </div>
      </div>

      {ideas.length === 0 && !loading && (
        <div className="text-center py-16">
          <div className="inline-block p-6 bg-white rounded-2xl shadow-lg border-2 border-slate-200">
            <Lightbulb className="h-16 w-16 text-indigo-400 mx-auto mb-4" />
            <p className="text-slate-600 font-medium">Select your domain and interests, then click "Generate Ideas" to get started!</p>
          </div>
        </div>
      )}

      {loading && (
        <div className="text-center py-16">
          <Loader2 className="h-12 w-12 animate-spin text-indigo-600 mx-auto mb-4" />
          <p className="text-slate-600 font-medium">Generating amazing project ideas for you...</p>
        </div>
      )}

      {ideas.length > 0 && (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {ideas.map((idea, idx) => (
            <div 
              key={idx} 
              className="bg-white rounded-2xl shadow-lg border-2 border-slate-200 overflow-hidden flex flex-col hover:shadow-2xl hover:border-indigo-300 transition-all transform hover:scale-105 group"
              style={{ animationDelay: `${idx * 100}ms` }}
            >
              <div className="h-2 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500"></div>
              <div className="p-6 flex-1 flex flex-col">
                <div className="flex justify-between items-start mb-4">
                  <h3 className="text-lg font-bold text-slate-800 leading-tight group-hover:text-indigo-600 transition-colors flex-1 pr-2">
                    {idea.title}
                  </h3>
                  <span className={`text-xs font-bold px-3 py-1.5 rounded-full shrink-0 ${
                    idea.difficulty === 'Beginner' ? 'bg-green-100 text-green-700 border-2 border-green-200' :
                    idea.difficulty === 'Intermediate' ? 'bg-yellow-100 text-yellow-700 border-2 border-yellow-200' :
                    'bg-purple-100 text-purple-700 border-2 border-purple-200'
                  }`}>
                    {idea.difficulty}
                  </span>
                </div>
                <p className="text-slate-600 text-sm mb-5 flex-1 leading-relaxed">{idea.description}</p>
                
                <div className="space-y-5">
                  <div>
                    <h4 className="text-xs font-bold text-indigo-600 uppercase tracking-wider mb-3 flex items-center gap-2">
                      <Layers className="h-4 w-4" /> Tech Stack
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      {idea.techStack.map((tech, i) => (
                        <span 
                          key={i} 
                          className="px-3 py-1.5 bg-gradient-to-r from-indigo-50 to-purple-50 text-indigo-700 text-xs font-medium rounded-lg border border-indigo-200 hover:border-indigo-300 transition-colors"
                        >
                          {tech}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div>
                    <h4 className="text-xs font-bold text-purple-600 uppercase tracking-wider mb-3 flex items-center gap-2">
                      <GitBranch className="h-4 w-4" /> Implementation Roadmap
                    </h4>
                    <ul className="space-y-2">
                      {idea.roadmap.slice(0, 4).map((step, i) => (
                        <li key={i} className="text-xs text-slate-700 flex items-start gap-2 bg-slate-50 p-2 rounded-lg hover:bg-indigo-50 transition-colors">
                          <span className="flex-shrink-0 w-5 h-5 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center text-[10px] font-bold mt-0.5">
                            {i + 1}
                          </span>
                          <span className="flex-1">{step}</span>
                        </li>
                      ))}
                      {idea.roadmap.length > 4 && (
                        <li className="text-xs text-indigo-600 font-medium text-center pt-1">
                          +{idea.roadmap.length - 4} more steps
                        </li>
                      )}
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Projects;