import React, { useState, useEffect, useRef } from 'react';
import { Users, Code, MessageCircle, Star, Video, X, Send, User, Flame, Calendar, Clock, BookOpen, CheckCircle, ChevronLeft, ChevronRight, BadgeCheck, Linkedin, Award, Shield } from 'lucide-react';
import { Message } from '../types';

interface Certification {
    name: string;
    issuer: string;
    issueDate: string;
    credentialId?: string;
    linkedinUrl?: string;
}

interface Peer {
    id: number;
    name: string;
    role: string;
    skills: string[];
    learning: string;
    match: number;
    avatar: string;
    streak: number;
    availableSlots: string[];
    verified: boolean;
    linkedinUrl?: string;
    certifications: Certification[];
}

// Mock data with LinkedIn certifications and verification
const PEERS: Peer[] = [
    { 
        id: 1, 
        name: 'Arjun K.', 
        role: 'Frontend Dev', 
        skills: ['React', 'Tailwind'], 
        learning: 'Node.js', 
        match: 95, 
        avatar: 'bg-blue-100 text-blue-700', 
        streak: 12, 
        availableSlots: ['09:00 AM', '02:00 PM', '04:00 PM', '06:00 PM'],
        verified: true,
        linkedinUrl: 'https://www.linkedin.com/in/arjun-kumar-frontend',
        certifications: [
            { name: 'React - The Complete Guide', issuer: 'Udemy', issueDate: '2024-01-15', credentialId: 'UC-abc123', linkedinUrl: 'https://www.linkedin.com/in/arjun-kumar-frontend/details/certifications/' },
            { name: 'Advanced CSS and Sass', issuer: 'Coursera', issueDate: '2023-11-20', credentialId: 'CRS-xyz789', linkedinUrl: 'https://www.linkedin.com/in/arjun-kumar-frontend/details/certifications/' },
            { name: 'JavaScript Algorithms and Data Structures', issuer: 'freeCodeCamp', issueDate: '2023-09-10', credentialId: 'FCC-js-algo', linkedinUrl: 'https://www.linkedin.com/in/arjun-kumar-frontend/details/certifications/' }
        ]
    },
    { 
        id: 2, 
        name: 'Sneha R.', 
        role: 'Data Analyst', 
        skills: ['Python', 'SQL'], 
        learning: 'Machine Learning', 
        match: 88, 
        avatar: 'bg-pink-100 text-pink-700', 
        streak: 5, 
        availableSlots: ['10:00 AM', '11:00 AM', '03:00 PM', '05:00 PM'],
        verified: true,
        linkedinUrl: 'https://www.linkedin.com/in/sneha-reddy-data-analyst',
        certifications: [
            { name: 'Python for Data Science', issuer: 'IBM', issueDate: '2024-02-01', credentialId: 'IBM-PY-DS-2024', linkedinUrl: 'https://www.linkedin.com/in/sneha-reddy-data-analyst/details/certifications/' },
            { name: 'SQL for Data Science', issuer: 'Coursera', issueDate: '2023-12-05', credentialId: 'CRS-sql-ds', linkedinUrl: 'https://www.linkedin.com/in/sneha-reddy-data-analyst/details/certifications/' },
            { name: 'Data Analysis with Pandas', issuer: 'DataCamp', issueDate: '2023-10-18', credentialId: 'DC-pandas-101', linkedinUrl: 'https://www.linkedin.com/in/sneha-reddy-data-analyst/details/certifications/' }
        ]
    },
    { 
        id: 3, 
        name: 'Rahul V.', 
        role: 'Backend Dev', 
        skills: ['Node.js', 'MongoDB'], 
        learning: 'React', 
        match: 92, 
        avatar: 'bg-amber-100 text-amber-700', 
        streak: 20, 
        availableSlots: ['09:30 AM', '01:00 PM', '02:30 PM', '07:00 PM'],
        verified: true,
        linkedinUrl: 'https://www.linkedin.com/in/rahul-verma-backend',
        certifications: [
            { name: 'Node.js - The Complete Guide', issuer: 'Udemy', issueDate: '2024-01-20', credentialId: 'UC-node-complete', linkedinUrl: 'https://www.linkedin.com/in/rahul-verma-backend/details/certifications/' },
            { name: 'MongoDB Certified Developer', issuer: 'MongoDB University', issueDate: '2023-11-15', credentialId: 'MDB-CERT-DEV-2023', linkedinUrl: 'https://www.linkedin.com/in/rahul-verma-backend/details/certifications/' },
            { name: 'RESTful API Design', issuer: 'Pluralsight', issueDate: '2023-09-25', credentialId: 'PS-rest-api', linkedinUrl: 'https://www.linkedin.com/in/rahul-verma-backend/details/certifications/' }
        ]
    },
    { 
        id: 4, 
        name: 'Priya M.', 
        role: 'UI Designer', 
        skills: ['Figma', 'CSS'], 
        learning: 'JavaScript', 
        match: 85, 
        avatar: 'bg-purple-100 text-purple-700', 
        streak: 3, 
        availableSlots: ['10:30 AM', '12:00 PM', '04:30 PM', '06:30 PM'],
        verified: true,
        linkedinUrl: 'https://www.linkedin.com/in/priya-mishra-ui-designer',
        certifications: [
            { name: 'Figma UI/UX Design Essentials', issuer: 'LinkedIn Learning', issueDate: '2024-02-10', credentialId: 'LL-figma-essentials', linkedinUrl: 'https://www.linkedin.com/in/priya-mishra-ui-designer/details/certifications/' },
            { name: 'Advanced CSS Layouts', issuer: 'Frontend Masters', issueDate: '2023-12-20', credentialId: 'FEM-css-advanced', linkedinUrl: 'https://www.linkedin.com/in/priya-mishra-ui-designer/details/certifications/' },
            { name: 'Design Systems', issuer: 'Interaction Design Foundation', issueDate: '2023-10-05', credentialId: 'IDF-design-systems', linkedinUrl: 'https://www.linkedin.com/in/priya-mishra-ui-designer/details/certifications/' }
        ]
    },
];

interface Appointment {
    id: string;
    peerId: number;
    date: string;
    time: string;
    skill: string;
    status: 'pending' | 'confirmed' | 'completed';
}

const PeerMatch: React.FC = () => {
    const [selectedPeer, setSelectedPeer] = useState<number | null>(null);
    const [messages, setMessages] = useState<Message[]>([]);
    const [inputText, setInputText] = useState('');
    const [showAppointmentModal, setShowAppointmentModal] = useState(false);
    const [selectedDate, setSelectedDate] = useState<string>('');
    const [selectedTime, setSelectedTime] = useState<string>('');
    const [selectedSkill, setSelectedSkill] = useState<string>('');
    const [appointments, setAppointments] = useState<Appointment[]>([]);
    const chatEndRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = () => {
        chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages, selectedPeer]);

    // Get available dates (next 7 days)
    const getAvailableDates = () => {
        const dates = [];
        const today = new Date();
        for (let i = 0; i < 7; i++) {
            const date = new Date(today);
            date.setDate(today.getDate() + i);
            dates.push(date);
        }
        return dates;
    };

    const handleConnect = (peerId: number) => {
        setSelectedPeer(peerId);
        const peer = PEERS.find(p => p.id === peerId);
        setMessages([
            {
                id: 'init',
                role: 'model',
                text: `Hi! 👋 I noticed we have a ${peer?.match}% skill match. I can help you with ${peer?.skills[0]}! Would you like to book a session?`,
                timestamp: new Date()
            }
        ]);
    };

    const handleSendMessage = () => {
        if (!inputText.trim()) return;

        const newUserMsg: Message = {
            id: Date.now().toString(),
            role: 'user',
            text: inputText,
            timestamp: new Date()
        };

        setMessages(prev => [...prev, newUserMsg]);
        setInputText('');

        // Simulate Peer Reply
        setTimeout(() => {
            const replyMsg: Message = {
                id: (Date.now() + 1).toString(),
                role: 'model',
                text: "That sounds great! Feel free to book a slot using the calendar button. I'm available for 1-hour sessions.",
                timestamp: new Date()
            };
            setMessages(prev => [...prev, replyMsg]);
        }, 1500);
    };

    const handleBookAppointment = () => {
        if (!selectedPeer || !selectedDate || !selectedTime || !selectedSkill) {
            alert('Please select date, time, and skill');
            return;
        }

        const peer = PEERS.find(p => p.id === selectedPeer);
        const newAppointment: Appointment = {
            id: Date.now().toString(),
            peerId: selectedPeer,
            date: selectedDate,
            time: selectedTime,
            skill: selectedSkill,
            status: 'pending'
        };

        setAppointments(prev => [...prev, newAppointment]);
        
        // Add appointment message to chat
        const appointmentMsg: Message = {
            id: Date.now().toString(),
            role: 'user',
            text: `📅 Booked appointment: ${selectedSkill} session on ${selectedDate} at ${selectedTime}`,
            timestamp: new Date()
        };
        setMessages(prev => [...prev, appointmentMsg]);

        // Peer confirmation
        setTimeout(() => {
            const confirmMsg: Message = {
                id: (Date.now() + 1).toString(),
                role: 'model',
                text: `✅ Great! I've confirmed your ${selectedSkill} session on ${selectedDate} at ${selectedTime}. Looking forward to teaching you!`,
                timestamp: new Date()
            };
            setMessages(prev => [...prev, confirmMsg]);
        }, 1000);

        setShowAppointmentModal(false);
        setSelectedDate('');
        setSelectedTime('');
        setSelectedSkill('');
    };

    const handleScheduleMeet = () => {
        const meetLink = `https://meet.google.com/new-${Math.random().toString(36).substring(7)}`;
        const meetMsg: Message = {
            id: Date.now().toString(),
            role: 'user',
            text: `🔗 Meeting Link: ${meetLink}`,
            timestamp: new Date()
        };
        setMessages(prev => [...prev, meetMsg]);
        window.open(meetLink, '_blank');
    };

    const peer = PEERS.find(p => p.id === selectedPeer);
    const availableDates = getAvailableDates();

    return (
        <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 p-6">
            <div className="max-w-7xl mx-auto h-[calc(100vh-3rem)] flex flex-col gap-6">
                {/* Header */}
                <div className="flex justify-between items-center">
                    <div>
                        <h2 className="text-4xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">Skill-Based Peer Matching</h2>
                        <p className="text-slate-600 text-lg mt-1">Connect with students who have complementary strengths and book learning sessions</p>
                    </div>
                    <button className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-6 py-3 rounded-xl font-semibold hover:from-indigo-700 hover:to-purple-700 transition-all shadow-lg hover:shadow-xl transform hover:scale-105">
                        Update Profile
                    </button>
                </div>

                <div className="flex-1 flex gap-6 overflow-hidden">
                    {/* Left Side: Peer List */}
                    <div className={`flex-1 flex flex-col gap-4 overflow-y-auto ${selectedPeer ? 'hidden lg:flex' : ''}`}>
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                            {PEERS.map(p => (
                                <div 
                                    key={p.id} 
                                    className="bg-white p-6 rounded-2xl shadow-lg border-2 border-slate-200 hover:border-indigo-300 hover:shadow-2xl transition-all cursor-pointer group relative overflow-hidden transform hover:scale-105"
                                    onClick={() => handleConnect(p.id)}
                                >
                                    {/* Gradient overlay on hover */}
                                    <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/0 to-purple-500/0 group-hover:from-indigo-500/5 group-hover:to-purple-500/5 transition-all"></div>
                                    
                                    <div className="relative z-10">
                                        <div className="flex justify-between items-start mb-4">
                                            <div className="flex items-center gap-4">
                                                <div className="relative">
                                                    <div className={`w-16 h-16 rounded-2xl flex items-center justify-center font-bold text-2xl shadow-lg ${p.avatar} transform group-hover:scale-110 transition-transform`}>
                                                        {p.name.charAt(0)}
                                                    </div>
                                                    {p.verified && (
                                                        <div className="absolute -bottom-1 -right-1 bg-blue-600 rounded-full p-1 border-2 border-white shadow-lg">
                                                            <BadgeCheck className="h-4 w-4 text-white" />
                                                        </div>
                                                    )}
                                                </div>
                                                <div>
                                                    <div className="flex items-center gap-2">
                                                        <h3 className="font-bold text-lg text-slate-800 group-hover:text-indigo-600 transition-colors">{p.name}</h3>
                                                        {p.verified && (
                                                            <span className="flex items-center gap-1 text-xs font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full border border-blue-200">
                                                                <Shield className="h-3 w-3" /> Verified
                                                            </span>
                                                        )}
                                                    </div>
                                                    <p className="text-sm text-slate-500 font-medium">{p.role}</p>
                                                    {p.linkedinUrl && (
                                                        <a 
                                                            href={p.linkedinUrl} 
                                                            target="_blank" 
                                                            rel="noopener noreferrer"
                                                            className="text-xs text-blue-600 hover:text-blue-700 flex items-center gap-1.5 mt-2 font-bold bg-blue-50 px-2 py-1 rounded-lg border border-blue-200 hover:bg-blue-100 transition-all"
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                e.preventDefault();
                                                                if (p.linkedinUrl) {
                                                                    window.location.href = p.linkedinUrl;
                                                                }
                                                            }}
                                                        >
                                                            <Linkedin className="h-3.5 w-3.5" /> View LinkedIn Profile
                                                        </a>
                                                    )}
                                                </div>
                                            </div>
                                            <div className="flex flex-col items-end gap-2">
                                                <span className="bg-gradient-to-r from-green-100 to-emerald-100 text-green-700 text-xs font-bold px-3 py-1.5 rounded-full flex items-center gap-1.5 shadow-sm border border-green-200">
                                                    <Star className="h-3.5 w-3.5 fill-current" /> {p.match}%
                                                </span>
                                                <span className="text-xs font-bold text-orange-600 flex items-center gap-1.5 bg-gradient-to-r from-orange-50 to-amber-50 px-3 py-1.5 rounded-full border border-orange-200 shadow-sm">
                                                    <Flame className="h-3.5 w-3.5 fill-current" /> {p.streak} Days
                                                </span>
                                            </div>
                                        </div>

                                        <div className="space-y-4">
                                            <div>
                                                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-2">
                                                    <Code className="h-3 w-3" /> Expert In
                                                </p>
                                                <div className="flex flex-wrap gap-2">
                                                    {p.skills.map(skill => (
                                                        <span key={skill} className="px-3 py-1.5 bg-gradient-to-r from-indigo-50 to-purple-50 text-indigo-700 text-xs font-semibold rounded-lg border border-indigo-200 shadow-sm">
                                                            {skill}
                                                        </span>
                                                    ))}
                                                </div>
                                            </div>
                                            {p.verified && p.certifications.length > 0 && (
                                                <div>
                                                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-2">
                                                        <Award className="h-3 w-3" /> LinkedIn Certifications ({p.certifications.length})
                                                    </p>
                                                    <div className="space-y-2 max-h-32 overflow-y-auto">
                                                        {p.certifications.slice(0, 2).map((cert, idx) => (
                                                            <div key={idx} className="px-3 py-2 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg">
                                                                <div className="flex items-start justify-between gap-2">
                                                                    <div className="flex-1">
                                                                        <p className="text-xs font-bold text-slate-700">{cert.name}</p>
                                                                        <p className="text-[10px] text-slate-500 mt-0.5">{cert.issuer}</p>
                                                                    </div>
                                                                    <BadgeCheck className="h-3.5 w-3.5 text-blue-600 shrink-0 mt-0.5" />
                                                                </div>
                                                            </div>
                                                        ))}
                                                        {p.certifications.length > 2 && (
                                                            <p className="text-[10px] text-indigo-600 font-medium text-center">+{p.certifications.length - 2} more certifications</p>
                                                        )}
                                                    </div>
                                                </div>
                                            )}
                                            <div>
                                                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-2">
                                                    <BookOpen className="h-3 w-3" /> Learning
                                                </p>
                                                <span className="px-3 py-1.5 bg-slate-50 text-slate-600 text-xs font-medium rounded-lg border border-slate-200">
                                                    {p.learning}
                                                </span>
                                            </div>
                                            <button 
                                                onClick={(e) => { e.stopPropagation(); handleConnect(p.id); }}
                                                className="w-full mt-2 flex items-center justify-center gap-2 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl text-sm font-bold hover:from-indigo-700 hover:to-purple-700 transition-all shadow-lg hover:shadow-xl transform hover:scale-105"
                                            >
                                                <MessageCircle className="h-4 w-4" /> Connect & Chat
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Right Side: Chat Interface */}
                    {selectedPeer && peer && (
                        <div className="flex-1 lg:max-w-md w-full bg-white rounded-2xl shadow-2xl border-2 border-slate-200 flex flex-col overflow-hidden animate-in slide-in-from-right duration-300">
                            {/* Chat Header */}
                            <div className="p-5 bg-gradient-to-r from-indigo-50 to-purple-50 border-b-2 border-slate-200 flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="relative">
                                        <div className={`w-12 h-12 rounded-xl flex items-center justify-center font-bold text-lg shadow-lg ${peer.avatar}`}>
                                            {peer.name.charAt(0)}
                                        </div>
                                        {peer.verified && (
                                            <div className="absolute -bottom-0.5 -right-0.5 bg-blue-600 rounded-full p-0.5 border-2 border-white shadow-md">
                                                <BadgeCheck className="h-3 w-3 text-white" />
                                            </div>
                                        )}
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-slate-800 text-base flex items-center gap-2">
                                            {peer.name}
                                            {peer.verified && (
                                                <span className="flex items-center gap-1 text-[10px] font-bold text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded border border-blue-200">
                                                    <Shield className="h-2.5 w-2.5" /> Verified
                                                </span>
                                            )}
                                            <span className="text-xs font-normal text-orange-600 flex items-center bg-orange-50 px-2 py-0.5 rounded-lg border border-orange-200">
                                                <Flame className="h-3 w-3 fill-current" /> {peer.streak}
                                            </span>
                                        </h3>
                                        <div className="flex items-center gap-2 text-xs text-green-600 font-medium">
                                            <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span> Online
                                            {peer.linkedinUrl && (
                                                <a 
                                                    href={peer.linkedinUrl} 
                                                    target="_blank" 
                                                    rel="noopener noreferrer"
                                                    className="text-blue-600 hover:text-blue-700 flex items-center gap-1.5 bg-blue-50 px-2 py-1 rounded-lg border border-blue-200 hover:bg-blue-100 transition-all font-bold"
                                                    onClick={(e) => {
                                                        e.preventDefault();
                                                        if (peer.linkedinUrl) {
                                                            window.location.href = peer.linkedinUrl;
                                                        }
                                                    }}
                                                    title="View LinkedIn Profile"
                                                >
                                                    <Linkedin className="h-3.5 w-3.5" /> Profile
                                                </a>
                                            )}
                                        </div>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <button 
                                        onClick={() => setShowAppointmentModal(true)}
                                        className="p-2.5 text-indigo-600 hover:bg-indigo-100 rounded-xl transition-all shadow-sm hover:shadow-md"
                                        title="Book Appointment"
                                    >
                                        <Calendar className="h-5 w-5" />
                                    </button>
                                    <button 
                                        onClick={handleScheduleMeet}
                                        className="p-2.5 text-purple-600 hover:bg-purple-100 rounded-xl transition-all shadow-sm hover:shadow-md"
                                        title="Schedule Video Call"
                                    >
                                        <Video className="h-5 w-5" />
                                    </button>
                                    <button 
                                        onClick={() => setSelectedPeer(null)}
                                        className="p-2.5 text-slate-400 hover:bg-slate-100 rounded-xl lg:hidden transition-all"
                                    >
                                        <X className="h-5 w-5" />
                                    </button>
                                </div>
                            </div>

                            {/* Chat Area */}
                            <div className="flex-1 overflow-y-auto p-5 space-y-4 bg-gradient-to-b from-slate-50 to-white">
                                {messages.map((msg) => (
                                    <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                                        <div className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm shadow-md ${
                                            msg.role === 'user' 
                                            ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-br-none' 
                                            : 'bg-white text-slate-700 border-2 border-slate-100 rounded-bl-none'
                                        }`}>
                                            {msg.text}
                                            <div className={`text-[10px] mt-1.5 opacity-80 ${msg.role === 'user' ? 'text-indigo-100' : 'text-slate-400'}`}>
                                                {msg.timestamp.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                                <div ref={chatEndRef} />
                            </div>

                            {/* Input Area */}
                            <div className="p-4 border-t-2 border-slate-200 bg-white">
                                <div className="flex items-center gap-2">
                                    <input 
                                        type="text"
                                        value={inputText}
                                        onChange={(e) => setInputText(e.target.value)}
                                        onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                                        placeholder="Type a message..."
                                        className="flex-1 bg-slate-100 border-2 border-slate-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
                                    />
                                    <button 
                                        onClick={handleSendMessage}
                                        disabled={!inputText.trim()}
                                        className="p-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl hover:from-indigo-700 hover:to-purple-700 disabled:opacity-50 disabled:hover:from-indigo-600 disabled:hover:to-purple-600 transition-all shadow-lg hover:shadow-xl"
                                    >
                                        <Send className="h-5 w-5" />
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Appointment Booking Modal */}
            {showAppointmentModal && peer && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto animate-in zoom-in duration-300">
                        <div className="p-6 border-b-2 border-slate-200 bg-gradient-to-r from-indigo-50 to-purple-50">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center font-bold text-lg ${peer.avatar}`}>
                                        {peer.name.charAt(0)}
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-lg text-slate-800">Book Learning Session</h3>
                                        <p className="text-sm text-slate-600">Schedule a 1-hour session with {peer.name}</p>
                                    </div>
                                </div>
                                <button 
                                    onClick={() => setShowAppointmentModal(false)}
                                    className="p-2 text-slate-400 hover:bg-slate-100 rounded-lg transition-all"
                                >
                                    <X className="h-5 w-5" />
                                </button>
                            </div>
                        </div>

                        <div className="p-6 space-y-6">
                            {/* Verification Badge */}
                            {peer.verified && (
                                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-blue-200 rounded-xl p-4">
                                    <div className="flex items-center gap-3">
                                        <div className="bg-blue-600 rounded-full p-2">
                                            <Shield className="h-5 w-5 text-white" />
                                        </div>
                                        <div className="flex-1">
                                            <p className="font-bold text-sm text-slate-800">Verified Profile</p>
                                            <p className="text-xs text-slate-600">This profile is verified through LinkedIn certifications</p>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <BadgeCheck className="h-6 w-6 text-blue-600" />
                                            {peer.linkedinUrl && (
                                                <a 
                                                    href={peer.linkedinUrl} 
                                                    target="_blank" 
                                                    rel="noopener noreferrer"
                                                    className="bg-blue-600 text-white px-3 py-1.5 rounded-lg hover:bg-blue-700 transition-all flex items-center gap-1.5 text-xs font-bold shadow-md hover:shadow-lg"
                                                    onClick={(e) => {
                                                        e.preventDefault();
                                                        if (peer.linkedinUrl) {
                                                            window.location.href = peer.linkedinUrl;
                                                        }
                                                    }}
                                                >
                                                    <Linkedin className="h-3.5 w-3.5" /> View Profile
                                                </a>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Certifications Display */}
                            {peer.verified && peer.certifications.length > 0 && (
                                <div>
                                    <label className="block text-sm font-bold text-slate-700 mb-3 flex items-center gap-2">
                                        <Award className="h-4 w-4 text-indigo-600" />
                                        LinkedIn Certifications
                                    </label>
                                    <div className="space-y-2 max-h-40 overflow-y-auto">
                                        {peer.certifications.map((cert, idx) => (
                                            <div key={idx} className="p-3 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg hover:border-blue-300 transition-all">
                                                <div className="flex items-start justify-between gap-2">
                                                    <div className="flex-1">
                                                        <p className="text-sm font-bold text-slate-700">{cert.name}</p>
                                                        <p className="text-xs text-slate-500 mt-1">{cert.issuer}</p>
                                                        <div className="flex items-center gap-3 mt-2">
                                                            <span className="text-[10px] text-slate-400">Issued: {new Date(cert.issueDate).toLocaleDateString()}</span>
                                                            {cert.credentialId && (
                                                                <span className="text-[10px] text-slate-400">ID: {cert.credentialId}</span>
                                                            )}
                                                        </div>
                                                    </div>
                                                    <div className="flex flex-col items-end gap-1">
                                                        <BadgeCheck className="h-4 w-4 text-blue-600" />
                                                        {cert.linkedinUrl && (
                                                            <a 
                                                                href={cert.linkedinUrl} 
                                                                target="_blank" 
                                                                rel="noopener noreferrer"
                                                                className="text-[10px] text-blue-600 hover:text-blue-700 flex items-center gap-1 bg-blue-50 px-2 py-1 rounded border border-blue-200 hover:bg-blue-100 transition-all font-bold"
                                                                onClick={(e) => {
                                                                    e.preventDefault();
                                                                    if (cert.linkedinUrl) {
                                                                        window.location.href = cert.linkedinUrl;
                                                                    }
                                                                }}
                                                            >
                                                                <Linkedin className="h-3 w-3" /> Verify
                                                            </a>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Skill Selection */}
                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-3 flex items-center gap-2">
                                    <Code className="h-4 w-4 text-indigo-600" />
                                    Select Skill to Learn
                                </label>
                                <div className="grid grid-cols-2 gap-3">
                                    {peer.skills.map(skill => (
                                        <button
                                            key={skill}
                                            onClick={() => setSelectedSkill(skill)}
                                            className={`p-4 rounded-xl border-2 transition-all ${
                                                selectedSkill === skill
                                                    ? 'border-indigo-500 bg-indigo-50 text-indigo-700 font-bold shadow-md'
                                                    : 'border-slate-200 hover:border-indigo-300 bg-white text-slate-700'
                                            }`}
                                        >
                                            {skill}
                                            {selectedSkill === skill && <CheckCircle className="h-4 w-4 inline-block ml-2 text-indigo-600" />}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Date Selection */}
                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-3 flex items-center gap-2">
                                    <Calendar className="h-4 w-4 text-indigo-600" />
                                    Select Date
                                </label>
                                <div className="grid grid-cols-7 gap-2">
                                    {availableDates.map((date, idx) => {
                                        const dateStr = date.toISOString().split('T')[0];
                                        const isSelected = selectedDate === dateStr;
                                        const isToday = idx === 0;
                                        return (
                                            <button
                                                key={dateStr}
                                                onClick={() => setSelectedDate(dateStr)}
                                                className={`p-3 rounded-xl border-2 transition-all ${
                                                    isSelected
                                                        ? 'border-indigo-500 bg-indigo-50 text-indigo-700 font-bold shadow-md'
                                                        : 'border-slate-200 hover:border-indigo-300 bg-white text-slate-700'
                                                }`}
                                            >
                                                <div className="text-xs font-medium">{date.toLocaleDateString('en-US', { weekday: 'short' })}</div>
                                                <div className="text-lg font-bold">{date.getDate()}</div>
                                                {isToday && <div className="text-[10px] text-indigo-600 font-medium">Today</div>}
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* Time Selection */}
                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-3 flex items-center gap-2">
                                    <Clock className="h-4 w-4 text-indigo-600" />
                                    Select Time Slot
                                </label>
                                <div className="grid grid-cols-4 gap-3">
                                    {peer.availableSlots.map(time => (
                                        <button
                                            key={time}
                                            onClick={() => setSelectedTime(time)}
                                            className={`p-3 rounded-xl border-2 transition-all ${
                                                selectedTime === time
                                                    ? 'border-indigo-500 bg-indigo-50 text-indigo-700 font-bold shadow-md'
                                                    : 'border-slate-200 hover:border-indigo-300 bg-white text-slate-700'
                                            }`}
                                        >
                                            {time}
                                            {selectedTime === time && <CheckCircle className="h-4 w-4 inline-block ml-1 text-indigo-600" />}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Book Button */}
                            <button
                                onClick={handleBookAppointment}
                                disabled={!selectedDate || !selectedTime || !selectedSkill}
                                className="w-full py-4 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl font-bold text-lg hover:from-indigo-700 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg hover:shadow-xl transform hover:scale-105 disabled:hover:scale-100 flex items-center justify-center gap-2"
                            >
                                <Calendar className="h-5 w-5" />
                                Book Appointment
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default PeerMatch;
