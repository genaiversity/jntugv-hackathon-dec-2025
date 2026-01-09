
import React, { useState, useEffect, useRef } from 'react';
import { generateTimetable } from '../services/geminiServices';
import { Calendar, Clock, Loader2, Save } from 'lucide-react';
import ReactMarkdown from 'react-markdown';

const Timetable: React.FC = () => {
  const [subjects, setSubjects] = useState('java, python, html, css');
  const [hours, setHours] = useState('3');
  const [memory, setMemory] = useState<number>(3);
  const [schedule, setSchedule] = useState('');
  const [loading, setLoading] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Auto-generate schedule when subjects or hours change
  useEffect(() => {
    // Clear previous timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    // Only generate if subjects are provided
    if (!subjects.trim()) {
      setSchedule('');
      return;
    }

    // Debounce: Wait 1 second after user stops typing
    timeoutRef.current = setTimeout(async () => {
      setLoading(true);
      try {
        const result = await generateTimetable(subjects, hours, memory);
        setSchedule(result);
      } catch (e) {
        console.error('Error generating timetable:', e);
        setSchedule('Error generating schedule. Please try again.');
      } finally {
        setLoading(false);
      }
    }, 1000);

    // Cleanup timeout on unmount
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [subjects, hours, memory]);

  const handleGenerate = async () => {
    if (!subjects.trim()) {
      alert("Please enter at least one subject.");
      return;
    }
    setLoading(true);
    try {
      const result = await generateTimetable(subjects, hours, memory);
      setSchedule(result);
    } catch (e) {
      alert("Error generating timetable");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-8 animate-in fade-in duration-500">
      <div className="flex items-center gap-3">
        <div className="p-3 bg-blue-100 rounded-full">
            <Calendar className="h-6 w-6 text-blue-600" />
        </div>
        <div>
            <h2 className="text-3xl font-bold text-slate-800">Smart Timetable</h2>
            <p className="text-slate-500">AI-optimized study schedule based on your subjects and free time.</p>
        </div>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        <div className="md:col-span-1 space-y-4 bg-white p-6 rounded-xl shadow-sm border border-slate-200 h-fit">
            <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Current Subjects</label>
                <textarea 
                    value={subjects}
                    onChange={(e) => setSubjects(e.target.value)}
                    placeholder="e.g. Data Structures, React, Calculus, Digital Logic"
                    className="w-full p-3 bg-white text-slate-900 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none h-32 resize-none"
                />
            </div>
            <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Daily Study Hours</label>
                <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-slate-400" />
                    <input 
                        type="number" 
                        value={hours}
                        onChange={(e) => setHours(e.target.value)}
                        className="w-full p-2 bg-white text-slate-900 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Memory / Retention (1-5)</label>
              <input
                type="range"
                min={1}
                max={5}
                value={memory}
                onChange={(e) => setMemory(parseInt(e.target.value))}
                className="w-full"
              />
              <div className="text-xs text-slate-500 mt-1">Lower value → allocate more practice/revision time</div>
            </div>
            <button 
                onClick={handleGenerate}
                disabled={loading || !subjects}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-lg flex items-center justify-center gap-2 transition-all disabled:opacity-50"
            >
                {loading ? <Loader2 className="animate-spin h-5 w-5" /> : "Generate Schedule"}
            </button>
        </div>

        <div className="md:col-span-2 bg-white p-6 rounded-xl shadow-sm border border-slate-200 min-h-[400px] overflow-auto">
            <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-bold text-slate-800">Your Personalized Plan</h3>
                {schedule && (
                    <button className="text-sm flex items-center gap-1 text-blue-600 hover:text-blue-700 font-medium">
                        <Save className="h-4 w-4" /> Save
                    </button>
                )}
            </div>
            
            {loading ? (
                <div className="h-full flex flex-col items-center justify-center text-slate-400 py-12">
                    <Loader2 className="h-8 w-8 animate-spin text-blue-500 mb-3" />
                    <p className="text-sm">Generating your personalized schedule...</p>
                </div>
            ) : !schedule ? (
                <div className="h-full flex flex-col items-center justify-center text-slate-400 py-12">
                    <Calendar className="h-12 w-12 mb-2 text-slate-200" />
                    <p className="text-sm">Enter subjects to generate your weekly plan.</p>
                </div>
            ) : (
                <div className="prose prose-blue max-w-none">
                    <ReactMarkdown
                        components={{
                            h2: ({node, ...props}) => <h2 className="text-lg font-bold text-slate-800 mt-6 mb-4 pb-2 border-b border-slate-200" {...props} />,
                            h3: ({node, ...props}) => <h3 className="text-base font-bold text-blue-700 mt-5 mb-3 flex items-center gap-2" {...props} />,
                            ul: ({node, ...props}) => <ul className="space-y-2 my-3 list-none" {...props} />,
                            li: ({node, ...props}) => (
                                <li className="flex items-start gap-3 text-slate-700 text-sm leading-relaxed py-1" {...props}>
                                    <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-blue-500 shrink-0"></span>
                                    <span className="flex-1">{props.children}</span>
                                </li>
                            ),
                            p: ({node, ...props}) => <p className="text-slate-600 mb-2 text-sm" {...props} />,
                            strong: ({node, ...props}) => <strong className="text-slate-800 font-semibold" {...props} />
                        }}
                    >
                        {schedule}
                    </ReactMarkdown>
                </div>
            )}
        </div>
      </div>
    </div>
  );
};

export default Timetable;
