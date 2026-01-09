
import React, { useState } from 'react';
import { generateParentReport } from '../services/geminiServices';
import { Mail, CheckCircle, Loader2, UserCheck, Sparkles, ShieldCheck, Smartphone, Hash, FileText, Download } from 'lucide-react';
import ReactMarkdown from 'react-markdown';

const ParentPortal: React.FC = () => {
    const [report, setReport] = useState('');
    const [loading, setLoading] = useState(false);
    const [sending, setSending] = useState(false);
    const [sent, setSent] = useState(false);

    // Form State
    const [studentId, setStudentId] = useState('');
    const [parentId, setParentId] = useState('');
    const [studentMobile, setStudentMobile] = useState('');
    const [parentMobile, setParentMobile] = useState('');
    const [parentEmail, setParentEmail] = useState('');
    const [isVerified, setIsVerified] = useState(false);

    // Mock student stats
    const studentStats = "Attendance: 85%, Avg Grade: B+, Projects: 3 Completed, Weakness: Data Structures, Strength: Web Development, Engagement: High in practicals, Low in theory.";

    const handleVerify = (e: React.FormEvent) => {
        e.preventDefault();
        // Simulate verification
        if(studentId && parentId && studentMobile && parentMobile) {
            setIsVerified(true);
        } else {
            alert("Please fill all secure fields.");
        }
    };

    const handleGenerate = async () => {
        setLoading(true);
        try {
            const res = await generateParentReport("Rahul", studentStats);
            setReport(res);
        } catch(e) {
            alert('Error generating report');
        } finally {
            setLoading(false);
        }
    }

    const handleSendWithDoc = async () => {
        // Validate email format
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!parentEmail.trim()) {
            alert("Please enter a parent email address.");
            return;
        }
        if (!emailRegex.test(parentEmail)) {
            alert("Please enter a valid email address (e.g., parent@example.com).");
            return;
        }

        if (!report) {
            alert("Please generate a report first.");
            return;
        }

        setSending(true);

        try {
            // 1. Generate "Word Doc" (HTML Blob with .doc extension)
            const header = `<html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'><head><meta charset='utf-8'><title>Student Progress Report</title><style>body{font-family:Arial,sans-serif;padding:20px;line-height:1.6;}h1{color:#4f46e5;}h2{color:#6366f1;margin-top:20px;}</style></head><body>`;
            const footer = "</body></html>";
            const content = `
                <h1>EduBridge Student Progress Report</h1>
                <p><strong>Student ID:</strong> ${studentId || 'N/A'}</p>
                <p><strong>Student Mobile:</strong> ${studentMobile || 'N/A'}</p>
                <p><strong>Date:</strong> ${new Date().toLocaleDateString()}</p>
                <p><strong>Sent To:</strong> ${parentEmail}</p>
                <hr/>
                ${report.replace(/\n/g, '<br/>').replace(/\*\*(.*?)\*\*/g, '<b>$1</b>').replace(/## (.*?)/g, '<h2>$1</h2>').replace(/### (.*?)/g, '<h3>$1</h3>')}
                <br/>
                <hr/>
                <p><em>Generated securely via EduBridge Parent Portal.</em></p>
                <p><em>This is a confidential document. Please do not share.</em></p>
            `;
            
            const sourceHTML = header + content + footer;
            const source = 'data:application/vnd.ms-word;charset=utf-8,' + encodeURIComponent(sourceHTML);
            
            // Download the document
            const fileDownload = document.createElement("a");
            document.body.appendChild(fileDownload);
            fileDownload.href = source;
            fileDownload.download = `Progress_Report_${studentId || 'Student'}_${new Date().toISOString().split('T')[0]}.doc`;
            fileDownload.click();
            document.body.removeChild(fileDownload);

            // 2. Simulate sending email to the provided address
            // In a real application, this would call an email API service
            await new Promise(resolve => setTimeout(resolve, 2000));

            // Show success message with email confirmation
            setSending(false);
            setSent(true);
            
            // Log email details (in production, this would be sent to backend)
            console.log(`Email sent successfully to: ${parentEmail}`);
            console.log(`Report for Student ID: ${studentId}`);
            
            // Reset sent state after 5 seconds
            setTimeout(() => {
                setSent(false);
            }, 5000);
        } catch (error) {
            console.error("Error sending email:", error);
            alert(`Failed to send email to ${parentEmail}. Please try again.`);
            setSending(false);
        }
    }

    if (!isVerified) {
        return (
            <div className="p-6 max-w-lg mx-auto mt-10 animate-in fade-in zoom-in duration-500">
                <div className="bg-white p-8 rounded-2xl shadow-xl border border-slate-200">
                    <div className="text-center mb-8">
                        <div className="w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <ShieldCheck className="h-8 w-8 text-indigo-600" />
                        </div>
                        <h2 className="text-2xl font-bold text-slate-800">Secure Parent Login</h2>
                        <p className="text-slate-500">Verify identities to access student progress.</p>
                    </div>

                    <form onSubmit={handleVerify} className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Student ID</label>
                                <div className="relative">
                                    <Hash className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                                    <input 
                                        type="text" required value={studentId} onChange={e => setStudentId(e.target.value)}
                                        className="w-full pl-9 p-2 bg-slate-50 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none" placeholder="STU-XXXX"
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Parent ID</label>
                                <div className="relative">
                                    <Hash className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                                    <input 
                                        type="text" required value={parentId} onChange={e => setParentId(e.target.value)}
                                        className="w-full pl-9 p-2 bg-slate-50 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none" placeholder="PAR-XXXX"
                                    />
                                </div>
                            </div>
                        </div>

                        <div>
                             <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Student Mobile</label>
                             <div className="relative">
                                 <Smartphone className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                                 <input 
                                     type="tel" required value={studentMobile} onChange={e => setStudentMobile(e.target.value)}
                                     className="w-full pl-9 p-2 bg-slate-50 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none" placeholder="+91 98765 43210"
                                 />
                             </div>
                        </div>

                        <div>
                             <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Parent Mobile (Linked)</label>
                             <div className="relative">
                                 <Smartphone className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                                 <input 
                                     type="tel" required value={parentMobile} onChange={e => setParentMobile(e.target.value)}
                                     className="w-full pl-9 p-2 bg-slate-50 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none" placeholder="+91 98765 43210"
                                 />
                             </div>
                        </div>

                        <button type="submit" className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 rounded-xl shadow-lg transition-all mt-4">
                            Verify & Access Portal
                        </button>
                    </form>
                </div>
            </div>
        );
    }

    return (
        <div className="p-6 max-w-5xl mx-auto space-y-6 animate-in fade-in duration-500">
             <div className="flex items-center justify-between mb-8">
                 <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-indigo-100 rounded-xl flex items-center justify-center">
                        <UserCheck className="h-6 w-6 text-indigo-600" />
                    </div>
                    <div>
                        <h2 className="text-2xl font-bold text-slate-800">Parent Dashboard</h2>
                        <div className="flex items-center gap-2 text-sm text-green-600">
                            <ShieldCheck className="h-3 w-3" /> Secure Connection Verified
                        </div>
                    </div>
                </div>
                <button onClick={() => setIsVerified(false)} className="text-sm text-slate-500 hover:text-red-500">Logout</button>
            </div>

            <div className="grid md:grid-cols-3 gap-6">
                {/* Control Panel */}
                <div className="md:col-span-1 space-y-4">
                    <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-200">
                        <h3 className="font-bold text-slate-800 mb-2">Student Profile</h3>
                        <div className="text-sm text-slate-600 space-y-2 mb-4 bg-slate-50 p-3 rounded-lg border border-slate-100">
                            <p><strong>ID:</strong> {studentId}</p>
                            <p><strong>Mobile:</strong> {studentMobile}</p>
                            <p className="pt-2 border-t border-slate-200 mt-2"><strong>Attendance:</strong> <span className="text-green-600 font-bold">85%</span></p>
                        </div>
                        <button 
                            onClick={handleGenerate}
                            disabled={loading}
                            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-2.5 rounded-lg font-semibold shadow-sm transition-all flex items-center justify-center gap-2 disabled:opacity-50 text-sm"
                        >
                             {loading ? <Loader2 className="animate-spin h-4 w-4" /> : <><Sparkles className="h-4 w-4" /> Generate Report</>}
                        </button>
                    </div>
                    
                    {report && (
                         <div className="bg-white p-5 rounded-xl shadow-lg border-2 border-slate-200 animate-in slide-in-from-left-4">
                            <h3 className="font-bold text-slate-800 mb-3 flex items-center gap-2">
                                <Mail className="h-4 w-4 text-indigo-600" />
                                Delivery
                            </h3>
                            <div className="mb-4">
                                <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Parent Email</label>
                                <div className="relative">
                                    <Mail className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                                    <input 
                                        type="email" 
                                        value={parentEmail}
                                        onChange={(e) => setParentEmail(e.target.value)}
                                        placeholder="parent@example.com"
                                        className="w-full pl-10 p-2.5 border-2 border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
                                        disabled={sending || sent}
                                    />
                                </div>
                                {sent && (
                                    <div className="mt-2 p-2 bg-green-50 border border-green-200 rounded-lg">
                                        <p className="text-xs text-green-700 font-medium flex items-center gap-1.5">
                                            <CheckCircle className="h-3.5 w-3.5" />
                                            Email sent to: <span className="font-bold">{parentEmail}</span>
                                        </p>
                                    </div>
                                )}
                            </div>
                             <button 
                                onClick={handleSendWithDoc}
                                disabled={sending || sent || !parentEmail.trim()}
                                className={`w-full py-3 rounded-lg font-bold flex items-center justify-center gap-2 transition-all text-sm shadow-lg ${
                                    sent 
                                    ? 'bg-gradient-to-r from-green-500 to-emerald-500 text-white border-2 border-green-600' 
                                    : sending
                                    ? 'bg-gradient-to-r from-indigo-500 to-purple-500 text-white opacity-75 cursor-not-allowed'
                                    : 'bg-gradient-to-r from-slate-800 to-slate-900 text-white hover:from-slate-700 hover:to-slate-800 disabled:opacity-50 disabled:cursor-not-allowed'
                                }`}
                            >
                                {sending ? (
                                    <>
                                        <Loader2 className="animate-spin h-4 w-4" /> 
                                        Sending to {parentEmail}...
                                    </>
                                ) : sent ? (
                                    <>
                                        <CheckCircle className="h-4 w-4" /> 
                                        Email Sent Successfully!
                                    </>
                                ) : (
                                    <>
                                        <Mail className="h-4 w-4" /> 
                                        Email Report (.doc)
                                    </>
                                )}
                            </button>
                            <p className="text-[10px] text-slate-400 mt-3 text-center leading-tight">
                                *Report will be sent to the email address above as a Word Document attachment.
                            </p>
                         </div>
                    )}
                </div>

                {/* Report Preview */}
                <div className="md:col-span-2">
                    {!report ? (
                        <div className="bg-slate-50 border-2 border-dashed border-slate-200 rounded-xl h-full flex flex-col items-center justify-center p-8 text-center text-slate-400 min-h-[300px]">
                            <Mail className="h-12 w-12 mb-3 opacity-50" />
                            <p className="font-medium">Secure report preview area.</p>
                            <p className="text-sm mt-1">Generate report to view academic details.</p>
                        </div>
                    ) : (
                        <div className="bg-white rounded-xl shadow-lg border border-slate-100 overflow-hidden animate-in zoom-in-95">
                            <div className="bg-indigo-600 p-4 text-white flex justify-between items-center">
                                <span className="font-semibold text-sm tracking-wide uppercase">Confidential Progress Update</span>
                                <span className="text-indigo-200 text-xs">{new Date().toLocaleDateString()}</span>
                            </div>
                            <div className="p-6 md:p-8 prose prose-sm prose-indigo max-w-none">
                                <ReactMarkdown
                                    components={{
                                        ul: ({node, ...props}) => <ul className="grid gap-2 my-2 pl-0 list-none" {...props} />,
                                        li: ({node, ...props}) => (
                                            <li className="flex items-start gap-2 bg-slate-50 p-3 rounded-lg border border-slate-100 text-slate-700 text-sm leading-relaxed" {...props}>
                                                <span className="mt-1 h-1.5 w-1.5 rounded-full bg-indigo-500 shrink-0"></span>
                                                <div className="flex-1">{props.children}</div>
                                            </li>
                                        ),
                                        h1: ({node, ...props}) => <h3 className="text-lg font-bold text-indigo-900 mt-0 mb-3" {...props} />,
                                        h2: ({node, ...props}) => <h4 className="text-base font-bold text-slate-800 mt-4 mb-2 flex items-center gap-2" {...props} />,
                                    }}
                                >
                                    {report}
                                </ReactMarkdown>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ParentPortal;
