
import React, { useState, useRef, useEffect } from 'react';
import { getLabExperiment } from '../services/geminiServices';
import { Terminal, Play, Loader2, ChevronDown, Server, Cloud, Shield, Database, Layout, GitBranch, Cpu, Code, Globe, Box, Network, BookOpen, Clock, Hammer, CheckSquare, ArrowDown, Edit3, Rocket, Settings, Zap, Target, Layers, Wrench, FileCode } from 'lucide-react';
import { WorkflowStep } from '../types';

const INDUSTRY_LABS = [
    { name: 'Git & GitHub Workflow Guide', icon: GitBranch },
    { name: 'DevOps CI/CD Pipeline Roadmap', icon: Server },
    { name: 'Cloud Deployment Guide (AWS/GCP)', icon: Cloud },
    { name: 'Postman API Testing Workflow', icon: Globe },
    { name: 'Agile Sprint & Scrum Guide', icon: Layout },
    { name: 'Data Structures Visualizer Guide', icon: Code },
    { name: 'System Design Architecture Blueprint', icon: Network },
    { name: 'Machine Learning Pipeline Walkthrough', icon: Cpu },
    { name: 'Docker & Kubernetes Setup Guide', icon: Box },
    { name: 'SQL & Database Query Masterclass', icon: Database },
    { name: 'Cybersecurity Defense Strategies', icon: Shield },
    { name: 'React Frontend Debugging Guide', icon: Code },
    { name: 'Custom Domain (Type your own)', icon: Edit3 }
];

interface LabData {
    techStack: string[];
    mncTip: string;
    roadmap: WorkflowStep[];
}

const VirtualLab: React.FC = () => {
    const [topic, setTopic] = useState('Git & GitHub Workflow Guide');
    const [labData, setLabData] = useState<LabData | null>(null);
    const [loading, setLoading] = useState(false);
    const [showDropdown, setShowDropdown] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setShowDropdown(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const handleSimulate = async () => {
        if (!topic.trim()) {
            alert('Please select a domain module.');
            return;
        }
        setLoading(true);
        setLabData(null);
        try {
            const data = await getLabExperiment(topic);
            if (data && data.roadmap && data.roadmap.length > 0) {
                setLabData(data);
            } else {
                throw new Error('Invalid roadmap data');
            }
        } catch(e: any) {
            console.error('Lab experiment error:', e);
            // Try mock data as fallback
            const mockData = {
                techStack: ['Relevant Tools'],
                mncTip: 'Focus on hands-on practice and real projects.',
                roadmap: [
                    {
                        phaseName: 'Foundation',
                        duration: '2 weeks',
                        description: 'Learn fundamental concepts.',
                        keyConcepts: ['Core Concepts', 'Basics'],
                        tools: ['Documentation', 'Tutorials'],
                        practicalTask: 'Complete basic exercises'
                    }
                ]
            };
            setLabData(mockData);
        } finally {
            setLoading(false);
        }
    };
    
    // Auto-generate when a predefined topic is selected
    const handleTopicSelect = async (selectedTopic: string) => {
        if (selectedTopic.includes('Custom')) {
            setTopic('');
            inputRef.current?.focus();
        } else {
            setTopic(selectedTopic);
            setShowDropdown(false);
            // Auto-generate roadmap
            setLoading(true);
            setLabData(null);
            try {
                const data = await getLabExperiment(selectedTopic);
                if (data && data.roadmap && data.roadmap.length > 0) {
                    setLabData(data);
                }
            } catch(e: any) {
                console.error('Auto-generate error:', e);
            } finally {
                setLoading(false);
            }
        }
    };

    const currentIcon = INDUSTRY_LABS.find(l => l.name === topic)?.icon || Terminal;

    return (
        <div className="p-6 max-w-7xl mx-auto space-y-6 animate-in fade-in duration-500">
             <div className="flex items-center gap-3">
                <div className="p-3 bg-indigo-900 rounded-lg">
                    <Network className="h-6 w-6 text-indigo-400" />
                </div>
                <div>
                    <h2 className="text-3xl font-bold text-slate-800">Industry Tech Lab Simulator</h2>
                    <p className="text-slate-500">Visual workflow diagrams and timelines to master MNC technologies.</p>
                </div>
            </div>

            <div className="bg-white rounded-xl shadow-lg border border-slate-200 overflow-hidden flex flex-col min-h-[600px]">
                {/* Lab Toolbar */}
                <div className="bg-slate-100 p-4 border-b border-slate-200 flex flex-col md:flex-row gap-4 items-center justify-between">
                    <div className="flex-1 w-full relative" ref={dropdownRef}>
                         <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5 ml-1">Select Domain Module</label>
                         <div className="relative">
                            <div className="absolute left-3 top-3 text-slate-500">
                                {React.createElement(currentIcon, { className: "h-5 w-5" })}
                            </div>
                            <input 
                                ref={inputRef}
                                type="text" 
                                value={topic}
                                onChange={(e) => setTopic(e.target.value)}
                                onFocus={() => setShowDropdown(true)}
                                className="w-full bg-white text-slate-900 border border-slate-300 pl-10 pr-10 py-2.5 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none font-medium shadow-sm"
                                placeholder="Search or type custom domain..."
                            />
                            <button 
                                onClick={() => setShowDropdown(!showDropdown)}
                                className="absolute right-2 top-2.5 text-slate-400 hover:text-slate-600"
                            >
                                <ChevronDown className="h-5 w-5" />
                            </button>
                         </div>
                         
                         {showDropdown && (
                            <div className="absolute top-full left-0 w-full mt-2 bg-white border border-slate-200 rounded-lg shadow-xl z-20 max-h-80 overflow-y-auto">
                                <div className="p-2 text-xs font-semibold text-slate-400 bg-slate-50 border-b border-slate-100">
                                    Available Domain Modules
                                </div>
                                {INDUSTRY_LABS.map((lab) => (
                                    <button
                                        key={lab.name}
                                        onClick={() => handleTopicSelect(lab.name)}
                                        className="w-full text-left px-4 py-3 text-sm text-slate-700 hover:bg-indigo-50 hover:text-indigo-700 transition-colors flex items-center gap-3 border-b border-slate-50 last:border-0"
                                    >
                                        <lab.icon className={`h-4 w-4 ${lab.name.includes('Custom') ? 'text-indigo-600' : 'opacity-50'}`} />
                                        {lab.name}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                    
                    <button 
                        onClick={handleSimulate}
                        disabled={loading}
                        className="w-full md:w-auto bg-indigo-600 hover:bg-indigo-700 text-white px-8 py-2.5 rounded-lg font-bold flex items-center justify-center gap-2 transition-all disabled:opacity-50 shadow-md shadow-indigo-200 mt-6 md:mt-0"
                    >
                        {loading ? <Loader2 className="animate-spin h-4 w-4" /> : <Play className="h-4 w-4" />} 
                        Generate Roadmap
                    </button>
                </div>

                {/* Content Area */}
                <div className="flex-1 bg-slate-50 p-6 md:p-10 overflow-auto">
                    {!labData && !loading && (
                        <div className="h-full flex flex-col items-center justify-center text-slate-500 min-h-[400px]">
                            <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center mb-6 shadow-sm border border-slate-200">
                                <Network className="h-10 w-10 text-indigo-300" />
                            </div>
                            <h3 className="text-xl font-bold text-slate-700 mb-2">Ready to Initialize</h3>
                            <p className="text-slate-400 max-w-md text-center">Select a module above and click "Generate Roadmap" to view the step-by-step industrial workflow diagram.</p>
                        </div>
                    )}

                    {loading && (
                        <div className="h-full flex flex-col items-center justify-center min-h-[400px]">
                            <Loader2 className="h-12 w-12 text-indigo-600 animate-spin mb-4" />
                            <p className="text-slate-600 font-medium animate-pulse">Designing architectural blueprint...</p>
                        </div>
                    )}

                    {labData && (
                        <div className="max-w-4xl mx-auto">
                            {/* Header Summary */}
                            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 mb-10 flex flex-col md:flex-row gap-6 items-start">
                                <div className="flex-1">
                                    <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Global Tech Stack</h3>
                                    <div className="flex flex-wrap gap-2 mb-4">
                                        {labData.techStack.map((tech, i) => (
                                            <span key={i} className="px-3 py-1 bg-slate-100 text-slate-700 rounded-lg text-sm font-semibold border border-slate-200">
                                                {tech}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                                <div className="flex-1 bg-indigo-50 border border-indigo-100 p-4 rounded-xl">
                                    <h4 className="text-xs font-bold text-indigo-800 uppercase tracking-wider mb-1 flex items-center gap-1">
                                        <Play className="h-3 w-3 fill-current" /> MNC Insider Tip
                                    </h4>
                                    <p className="text-sm text-indigo-900 font-medium italic">"{labData.mncTip}"</p>
                                </div>
                            </div>

                            {/* Solid Flowchart Diagram */}
                            <div className="flex flex-col items-center space-y-2">
                                {labData.roadmap.map((step, index) => (
                                    <React.Fragment key={index}>
                                        {/* Connector Line (except for first item) */}
                                        {index > 0 && (
                                            <div className="h-8 w-0.5 bg-slate-300"></div>
                                        )}

                                        {/* Diagram Node */}
                                        <div className="w-full max-w-3xl bg-white rounded-xl shadow-sm border border-slate-200 relative overflow-hidden group hover:border-indigo-300 transition-all hover:shadow-md">
                                            {/* Time Badge - Floating */}
                                            <div className="absolute top-0 right-0 bg-indigo-600 text-white text-xs font-bold px-4 py-1.5 rounded-bl-xl shadow-sm z-10 flex items-center gap-1">
                                                <Clock className="h-3 w-3" />
                                                {step.duration}
                                            </div>

                                            <div className="flex flex-col md:flex-row">
                                                {/* Left: Phase Info */}
                                                <div className="p-6 md:w-1/3 bg-gradient-to-br from-slate-50 to-indigo-50/30 border-b md:border-b-0 md:border-r border-slate-100 flex flex-col justify-center">
                                                    <div className="flex items-center gap-3 mb-3">
                                                        <div className="w-10 h-10 rounded-lg bg-indigo-600 text-white flex items-center justify-center font-bold text-sm shadow-md shrink-0">
                                                            {index + 1}
                                                        </div>
                                                        <div className="flex-1">
                                                            <h4 className="font-bold text-slate-800 leading-tight text-base">{step.phaseName}</h4>
                                                        </div>
                                                    </div>
                                                    <p className="text-xs text-slate-600 leading-relaxed mb-3">{step.description}</p>
                                                    {/* Phase Icon */}
                                                    <div className="flex items-center gap-2 text-xs text-indigo-600 font-medium">
                                                        {index === 0 && <Rocket className="h-4 w-4" />}
                                                        {index === 1 && <Layers className="h-4 w-4" />}
                                                        {index === 2 && <Settings className="h-4 w-4" />}
                                                        {index === 3 && <Target className="h-4 w-4" />}
                                                        <span>Phase {index + 1}</span>
                                                    </div>
                                                </div>

                                                {/* Right: Details */}
                                                <div className="p-6 md:w-2/3 space-y-4">
                                                    <div>
                                                        <h5 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1">
                                                            <BookOpen className="h-3 w-3" /> Key Concepts
                                                        </h5>
                                                        <div className="flex flex-wrap gap-2">
                                                            {step.keyConcepts && step.keyConcepts.map((concept, i) => (
                                                                <span key={i} className="px-2.5 py-1 bg-indigo-50 text-indigo-700 border border-indigo-100 rounded-md text-xs font-semibold flex items-center gap-1">
                                                                    <Zap className="h-3 w-3" />
                                                                    {concept}
                                                                </span>
                                                            ))}
                                                        </div>
                                                    </div>
                                                    
                                                    <div className="flex flex-col sm:flex-row gap-4 pt-3 border-t border-slate-100">
                                                        <div className="flex-1">
                                                            <h5 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1">
                                                                <Wrench className="h-3 w-3" /> Tools
                                                            </h5>
                                                            <div className="flex flex-wrap gap-2">
                                                                {step.tools && step.tools.map((tool, i) => (
                                                                    <span key={i} className="px-2 py-1 bg-slate-100 text-slate-700 border border-slate-200 rounded text-xs font-medium">
                                                                        {tool}
                                                                    </span>
                                                                ))}
                                                            </div>
                                                        </div>
                                                        <div className="flex-1">
                                                            <h5 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1">
                                                                <FileCode className="h-3 w-3" /> Practical Task
                                                            </h5>
                                                            <div className="text-xs font-medium text-slate-800 flex items-start gap-2 bg-green-50 p-2 rounded border border-green-100">
                                                                <CheckSquare className="h-4 w-4 text-green-600 mt-0.5 shrink-0" />
                                                                <span className="flex-1">{step.practicalTask}</span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </React.Fragment>
                                ))}
                                
                                {/* End Node */}
                                <div className="h-8 w-0.5 bg-slate-300"></div>
                                <div className="px-6 py-2 bg-green-500 text-white rounded-full font-bold text-sm shadow-md flex items-center gap-2">
                                    <CheckSquare className="h-4 w-4" /> Industry Ready
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default VirtualLab;
