
import React, { useState } from 'react';
import { InternshipOpportunity } from '../types';
import { evaluateScholarApplication } from '../services/geminiServices';
import { GraduationCap, MapPin, Users, Clock, AlertCircle, CheckCircle, ArrowRight, Loader2, Upload, FileText, X, Sun, Snowflake } from 'lucide-react';

const INTERNSHIPS: InternshipOpportunity[] = [
    {
        id: '1',
        institute: 'IIT Bombay',
        professor: 'Dr. Ramesh Kumar',
        domain: 'Artificial Intelligence & Robotics',
        title: 'Autonomous Navigation Systems',
        description: 'Research on SLAM algorithms for unmapped terrains using LiDAR and Computer Vision.',
        slots: 2,
        deadline: 'Dec 15, 2025',
        prerequisites: ['Python', 'ROS', 'Computer Vision', 'Linear Algebra'],
        tags: ['Winter Internship', 'Paid', 'On-site']
    },
    {
        id: '2',
        institute: 'IIT Delhi',
        professor: 'Dr. Anjali Verma',
        domain: 'Data Science & Big Data',
        title: 'Scalable Graph Neural Networks',
        description: 'Developing efficient GNN architectures for analyzing large-scale social networks.',
        slots: 2,
        deadline: 'Dec 15, 2025',
        prerequisites: ['PyTorch', 'Graph Theory', 'Python', 'Machine Learning'],
        tags: ['Winter Internship', 'Remote']
    },
    {
        id: '3',
        institute: 'NIT Trichy',
        professor: 'Dr. S. Sundar',
        domain: 'VLSI & Embedded Systems',
        title: 'Low Power Architecture Design',
        description: 'Design and verification of low-power RISC-V processor extensions.',
        slots: 2,
        deadline: 'Dec 15, 2025',
        prerequisites: ['Verilog', 'Digital Design', 'Computer Architecture', 'C++'],
        tags: ['Summer Internship', 'Core Engineering']
    },
    {
        id: '4',
        institute: 'IIT Madras',
        professor: 'Dr. P. Hughes',
        domain: 'Cloud Computing & Distributed Systems',
        title: 'Serverless Edge Computing Frameworks',
        description: 'Optimizing cold-start latency in serverless functions deployed at the edge.',
        slots: 2,
        deadline: 'Dec 15, 2025',
        prerequisites: ['Docker', 'Kubernetes', 'Go', 'Distributed Systems'],
        tags: ['Summer Internship', 'High Impact']
    },
    {
        id: '5',
        institute: 'IIT Kanpur',
        professor: 'Dr. Priya Sharma',
        domain: 'Cybersecurity & Cryptography',
        title: 'Quantum-Resistant Cryptographic Protocols',
        description: 'Designing post-quantum cryptographic algorithms for secure communication systems.',
        slots: 2,
        deadline: 'Dec 20, 2025',
        prerequisites: ['Cryptography', 'Number Theory', 'Python', 'Network Security'],
        tags: ['Summer Internship', 'Research']
    },
    {
        id: '6',
        institute: 'IIT Kharagpur',
        professor: 'Dr. Rajesh Patel',
        domain: 'Blockchain & Web3',
        title: 'Decentralized Finance (DeFi) Protocols',
        description: 'Building secure and scalable DeFi applications using Ethereum and smart contracts.',
        slots: 2,
        deadline: 'Dec 18, 2025',
        prerequisites: ['Solidity', 'Ethereum', 'JavaScript', 'Smart Contracts'],
        tags: ['Summer Internship', 'High Impact']
    },
    {
        id: '7',
        institute: 'NIT Warangal',
        professor: 'Dr. Meera Reddy',
        domain: 'IoT & Sensor Networks',
        title: 'Smart City Infrastructure Monitoring',
        description: 'Developing IoT-based systems for real-time monitoring of urban infrastructure.',
        slots: 2,
        deadline: 'Dec 22, 2025',
        prerequisites: ['Arduino', 'Raspberry Pi', 'MQTT', 'Embedded C'],
        tags: ['Summer Internship', 'On-site']
    },
    {
        id: '8',
        institute: 'IIT Roorkee',
        professor: 'Dr. Vikram Singh',
        domain: 'Quantum Computing',
        title: 'Quantum Machine Learning Algorithms',
        description: 'Exploring quantum algorithms for optimization and machine learning applications.',
        slots: 2,
        deadline: 'Dec 17, 2025',
        prerequisites: ['Quantum Computing', 'Linear Algebra', 'Python', 'Qiskit'],
        tags: ['Winter Internship', 'Research']
    },
    {
        id: '9',
        institute: 'NIT Surathkal',
        professor: 'Dr. Kavita Nair',
        domain: 'Computer Vision & Image Processing',
        title: 'Medical Image Analysis using Deep Learning',
        description: 'Developing AI models for automated diagnosis from medical imaging data.',
        slots: 2,
        deadline: 'Dec 19, 2025',
        prerequisites: ['TensorFlow', 'OpenCV', 'Python', 'Deep Learning'],
        tags: ['Summer Internship', 'Healthcare']
    },
    {
        id: '10',
        institute: 'IIT Guwahati',
        professor: 'Dr. Arjun Das',
        domain: 'Natural Language Processing',
        title: 'Multilingual Language Models',
        description: 'Building transformer-based models for Indian languages and code-switching scenarios.',
        slots: 2,
        deadline: 'Dec 21, 2025',
        prerequisites: ['Transformers', 'PyTorch', 'NLP', 'Python'],
        tags: ['Summer Internship', 'Remote']
    },
    {
        id: '11',
        institute: 'IIT Hyderabad',
        professor: 'Dr. Sneha Agarwal',
        domain: 'Bioinformatics & Computational Biology',
        title: 'Genomic Data Analysis Pipeline',
        description: 'Creating computational tools for analyzing large-scale genomic datasets.',
        slots: 2,
        deadline: 'Dec 16, 2025',
        prerequisites: ['Bioinformatics', 'R', 'Python', 'Statistics'],
        tags: ['Summer Internship', 'Research']
    },
    {
        id: '12',
        institute: 'NIT Calicut',
        professor: 'Dr. Ravi Menon',
        domain: 'Wireless Communication & 5G',
        title: '5G Network Optimization',
        description: 'Research on beamforming and resource allocation for 5G networks.',
        slots: 2,
        deadline: 'Dec 23, 2025',
        prerequisites: ['MATLAB', 'Signal Processing', 'Wireless Networks', 'Optimization'],
        tags: ['Summer Internship', 'Core Engineering']
    }
];

const Scholar: React.FC = () => {
    const [selectedId, setSelectedId] = useState<string | null>(null);
    const [resumeFile, setResumeFile] = useState<File | null>(null);
    const [applying, setApplying] = useState(false);
    const [result, setResult] = useState<any>(null);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setResumeFile(e.target.files[0]);
        }
    };

    const handleApply = async (opp: InternshipOpportunity) => {
        if (!resumeFile) {
            alert("Please upload your resume first.");
            return;
        }
        
        setApplying(true);
        setResult(null); // Clear previous result
        
        try {
            // Read file content
            const reader = new FileReader();
            
            const filePromise = new Promise<string>((resolve, reject) => {
                reader.onload = () => {
                    const result = reader.result as string;
                    const base64String = result.split(',')[1] || result;
                    resolve(base64String);
                };
                reader.onerror = () => reject(new Error('Failed to read file'));
            });
            
            reader.readAsDataURL(resumeFile);
            const base64String = await filePromise;
            const mimeType = resumeFile.type || 'application/pdf';

            const data = await evaluateScholarApplication(
                { content: base64String, mimeType: mimeType },
                opp.professor, 
                opp.institute, 
                opp.domain, 
                opp.prerequisites
            );
            
            // Validate response
            if (data && (data.selectionProbability !== undefined || data.selectionProbability === 0)) {
                setResult(data);
            } else {
                throw new Error('Invalid response from evaluation');
            }
        } catch (e: any) {
            console.error('Application error:', e);
            // Use fallback mock data
            const mockData = {
                selectionProbability: Math.floor(Math.random() * 65) + 20,
                decision: 'Reject',
                feedback: `Thank you for applying to ${opp.institute}. Your application is under review. Please ensure you meet all prerequisites: ${opp.prerequisites.join(', ')}.`
            };
            setResult(mockData);
        } finally {
            setApplying(false);
        }
    };

    const closeModal = () => {
        setSelectedId(null);
        setResult(null);
        setResumeFile(null);
    }

    const selectedOpp = INTERNSHIPS.find(i => i.id === selectedId);

    return (
        <div className="p-6 max-w-7xl mx-auto space-y-8 animate-in fade-in duration-500">
            {/* Header */}
            <div className="bg-gradient-to-r from-slate-900 to-indigo-900 rounded-2xl p-8 text-white relative overflow-hidden shadow-xl">
                <div className="absolute top-0 right-0 w-64 h-64 bg-yellow-500 opacity-10 rounded-full blur-3xl -mr-16 -mt-16"></div>
                <div className="relative z-10">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 bg-yellow-500/20 rounded-lg backdrop-blur-sm border border-yellow-500/30">
                            <GraduationCap className="h-6 w-6 text-yellow-400" />
                        </div>
                        <span className="text-yellow-400 font-bold tracking-wider uppercase text-sm">Elite Internship Program</span>
                    </div>
                    <h1 className="text-3xl md:text-4xl font-bold mb-4">SCHOLAR</h1>
                    <p className="text-indigo-200 max-w-2xl text-lg">
                        Collab with IIT/NIT Professors. Get research guidance, publish papers, and secure premium internships.
                    </p>
                    <div className="flex gap-4 mt-6 text-sm font-medium">
                        <div className="flex items-center gap-2 bg-white/10 px-3 py-1.5 rounded-full border border-white/10">
                            <Users className="h-4 w-4 text-yellow-400" /> Only 2 Slots per Domain
                        </div>
                        <div className="flex items-center gap-2 bg-white/10 px-3 py-1.5 rounded-full border border-white/10">
                            <CheckCircle className="h-4 w-4 text-green-400" /> Prerequisites Mandatory
                        </div>
                    </div>
                </div>
            </div>

            {/* Opportunities List */}
            <div className="grid md:grid-cols-2 gap-6">
                {INTERNSHIPS.map((opp) => (
                    <div key={opp.id} className="bg-white rounded-xl shadow-sm border border-slate-200 hover:shadow-lg transition-all hover:border-indigo-300 group overflow-hidden flex flex-col">
                        <div className="p-6 flex-1">
                            <div className="flex justify-between items-start mb-4">
                                <div className="flex items-center gap-3">
                                    <div className="w-12 h-12 bg-slate-50 border border-slate-100 rounded-lg flex items-center justify-center text-slate-700 font-bold text-lg shadow-sm">
                                        {opp.institute.split(' ')[0]}
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-slate-800">{opp.institute}</h3>
                                        <p className="text-xs text-slate-500 flex items-center gap-1">
                                            <MapPin className="h-3 w-3" /> India
                                        </p>
                                    </div>
                                </div>
                                <div className="flex flex-col items-end gap-1">
                                                    <div className="bg-red-50 text-red-600 px-3 py-1 rounded-full text-xs font-bold border border-red-100 flex items-center gap-1">
                                                        <Clock className="h-3 w-3" /> {opp.deadline}
                                                    </div>
                                                    {(() => {
                                                        // derive season tag from deadline month when possible
                                                        try {
                                                            const d = new Date(opp.deadline);
                                                            const m = d.getMonth();
                                                            const season = (m === 11 || m === 0 || m === 1) ? 'Winter Internship' : (m >= 5 && m <= 8) ? 'Summer Internship' : (opp.tags && opp.tags[0]) || 'Internship';
                                                            const isWinter = season.toLowerCase().includes('winter');
                                                            return (
                                                                <div className={`text-[10px] font-bold px-2 py-0.5 rounded border flex items-center gap-1 ${isWinter ? 'bg-blue-50 text-blue-600 border-blue-100' : 'bg-orange-50 text-orange-600 border-orange-100'}`}>
                                                                    {isWinter ? <Snowflake className="h-3 w-3" /> : <Sun className="h-3 w-3" />}
                                                                    {season}
                                                                </div>
                                                            );
                                                        } catch (e) {
                                                            return (
                                                                <div className={`text-[10px] font-bold px-2 py-0.5 rounded border flex items-center gap-1 bg-orange-50 text-orange-600 border-orange-100`}>
                                                                    <Sun className="h-3 w-3" />
                                                                    {opp.tags[0]}
                                                                </div>
                                                            );
                                                        }
                                                    })()}
                                </div>
                            </div>

                            <div className="mb-4">
                                <h4 className="text-lg font-bold text-indigo-900 mb-1 group-hover:text-indigo-600 transition-colors">{opp.title}</h4>
                                <p className="text-sm font-medium text-slate-600 mb-2">Guide: {opp.professor}</p>
                                <p className="text-sm text-slate-500 leading-relaxed">{opp.description}</p>
                            </div>

                            <div className="space-y-3">
                                <div>
                                    <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Prerequisites</span>
                                    <div className="flex flex-wrap gap-2 mt-1.5">
                                        {opp.prerequisites.map((req, i) => (
                                            <span key={i} className="bg-slate-100 text-slate-600 px-2 py-0.5 rounded text-xs font-medium border border-slate-200">
                                                {req}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="bg-slate-50 px-6 py-4 border-t border-slate-100 flex items-center justify-between">
                            <div className="flex items-center gap-2 text-xs font-medium text-slate-500">
                                <AlertCircle className="h-4 w-4 text-orange-500" />
                                {opp.slots} Slots Available
                            </div>
                            <button 
                                onClick={() => setSelectedId(opp.id)}
                                className="bg-slate-900 text-white px-5 py-2 rounded-lg text-sm font-semibold hover:bg-indigo-600 transition-colors flex items-center gap-2"
                            >
                                View & Apply <ArrowRight className="h-4 w-4" />
                            </button>
                        </div>
                    </div>
                ))}
            </div>

            {/* Application Modal */}
            {selectedId && selectedOpp && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden animate-in zoom-in-95 duration-200">
                        <div className="bg-slate-900 p-6 text-white flex justify-between items-start">
                            <div>
                                <h3 className="text-xl font-bold">Apply for Internship</h3>
                                <p className="text-slate-300 text-sm mt-1">{selectedOpp.institute} • {selectedOpp.professor}</p>
                            </div>
                            <button onClick={closeModal} className="text-slate-400 hover:text-white">✕</button>
                        </div>
                        
                        <div className="p-6">
                            {!result ? (
                                <>
                                    <div className="mb-6 bg-indigo-50 border border-indigo-100 p-4 rounded-xl text-sm text-indigo-800">
                                        <strong>⚠️ Strict Selection:</strong> The professor will filter candidates based on the prerequisites. Our AI will pre-screen your application.
                                    </div>
                                    
                                    <label className="block text-sm font-medium text-slate-700 mb-2">Upload Resume (PDF only)</label>
                                    <div className="border-2 border-dashed border-slate-300 rounded-xl p-8 flex flex-col items-center justify-center text-center transition-colors hover:border-indigo-400 hover:bg-indigo-50 mb-6 relative">
                                        <input 
                                            type="file" 
                                            accept=".pdf"
                                            onChange={handleFileChange}
                                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                        />
                                        <div className="bg-indigo-100 p-3 rounded-full mb-3">
                                            <Upload className="h-6 w-6 text-indigo-600" />
                                        </div>
                                        <p className="text-sm font-medium text-slate-800">
                                            {resumeFile ? resumeFile.name : "Click to upload or drag and drop"}
                                        </p>
                                        <p className="text-xs text-slate-500 mt-1">PDF up to 5MB</p>
                                    </div>

                                    {resumeFile && (
                                        <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg border border-slate-200 mb-6">
                                            <FileText className="h-5 w-5 text-slate-400" />
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm font-medium text-slate-700 truncate">{resumeFile.name}</p>
                                                <p className="text-xs text-slate-500">{(resumeFile.size / 1024).toFixed(1)} KB</p>
                                            </div>
                                            <button onClick={() => setResumeFile(null)} className="text-slate-400 hover:text-red-500">
                                                <X className="h-4 w-4" />
                                            </button>
                                        </div>
                                    )}
                                    <div className="flex gap-3">
                                        <button 
                                            onClick={() => handleApply(selectedOpp)}
                                            disabled={applying || !resumeFile}
                                            className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 rounded-xl flex items-center justify-center gap-2 transition-all disabled:opacity-50"
                                        >
                                            {applying ? <Loader2 className="animate-spin h-5 w-5" /> : "Submit for Professor's Review"}
                                        </button>
                                        <button
                                            onClick={() => {
                                                const subject = encodeURIComponent(`Application for ${selectedOpp.title} - ${selectedOpp.institute}`);
                                                const body = encodeURIComponent(`Dear ${selectedOpp.professor},\n\nI am applying for the position titled "${selectedOpp.title}" at ${selectedOpp.institute}. I have attached my resume (PDF). Please find a brief about my background:\n\n[Add 2-3 lines about your experience / projects]\n\nBest regards,\n[Your Name]\n[Contact Info]`);
                                                window.open(`mailto:?subject=${subject}&body=${body}`);
                                            }}
                                            className="flex-1 bg-slate-100 border border-slate-200 text-slate-700 py-3 rounded-xl hover:bg-slate-200 transition-colors"
                                        >
                                            Email Professor
                                        </button>
                                    </div>
                                </>
                            ) : (
                                <div className="space-y-6 text-center">
                                    {/* Circular Progress Indicator */}
                                    <div className="relative w-32 h-32 mx-auto">
                                        <svg className="w-full h-full transform -rotate-90">
                                            <circle cx="64" cy="64" r="56" stroke="#f1f5f9" strokeWidth="12" fill="transparent" />
                                            <circle 
                                                cx="64" cy="64" r="56" 
                                                stroke={result.selectionProbability > 70 ? '#22c55e' : result.selectionProbability > 40 ? '#eab308' : '#ef4444'} 
                                                strokeWidth="12" 
                                                fill="transparent" 
                                                strokeDasharray={351.86} 
                                                strokeDashoffset={351.86 - (351.86 * result.selectionProbability) / 100} 
                                                className="transition-all duration-1000 ease-out"
                                            />
                                        </svg>
                                        <div className="absolute inset-0 flex items-center justify-center">
                                            <span className={`text-3xl font-bold ${
                                                result.selectionProbability > 70 ? 'text-green-600' : 
                                                result.selectionProbability > 40 ? 'text-yellow-600' : 
                                                'text-red-600'
                                            }`}>
                                                {result.selectionProbability}%
                                            </span>
                                        </div>
                                    </div>
                                    
                                    {/* Decision Status */}
                                    <div>
                                        <h3 className={`text-3xl font-bold mb-2 ${
                                            result.selectionProbability > 70 ? 'text-green-700' : 
                                            result.selectionProbability > 40 ? 'text-yellow-700' : 
                                            'text-red-700'
                                        }`}>
                                            {result.decision || (result.selectionProbability > 60 ? 'Accept' : 'Reject')}
                                        </h3>
                                    </div>
                                    
                                    {/* Professor's Feedback */}
                                    <div className="bg-slate-50 p-5 rounded-xl text-left border border-slate-200">
                                        <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">PROFESSOR'S FEEDBACK</h4>
                                        <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-wrap">
                                            {result.feedback || 'No feedback available.'}
                                        </p>
                                    </div>

                                    <button 
                                        onClick={closeModal}
                                        className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold py-3 rounded-xl transition-colors"
                                    >
                                        Close
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Scholar;
