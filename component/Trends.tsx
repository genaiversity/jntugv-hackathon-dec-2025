import React, { useEffect, useState } from 'react';
import { getTrendAnalytics } from '../services/geminiServices';
import { Loader2, Zap, Search, ArrowUpRight, TrendingUp, Activity, DollarSign, Sparkles, BarChart3, Target } from 'lucide-react';
import { 
    ComposedChart, Line, Area, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, AreaChart 
} from 'recharts';

interface TrendData {
    technology: string;
    description: string;
    currentDemand: number;
    futureScope: number;
    salaryHike: number;
    growthTrend: number[];
}

const COLORS = [
    { name: 'violet', bg: 'bg-gradient-to-br from-violet-50 to-purple-50', border: 'border-violet-200', text: 'text-violet-700', chart: '#8b5cf6', fill: '#ddd6fe', accent: 'bg-violet-500' },
    { name: 'blue', bg: 'bg-gradient-to-br from-blue-50 to-cyan-50', border: 'border-blue-200', text: 'text-blue-700', chart: '#3b82f6', fill: '#dbeafe', accent: 'bg-blue-500' },
    { name: 'orange', bg: 'bg-gradient-to-br from-orange-50 to-amber-50', border: 'border-orange-200', text: 'text-orange-700', chart: '#f97316', fill: '#ffedd5', accent: 'bg-orange-500' },
    { name: 'emerald', bg: 'bg-gradient-to-br from-emerald-50 to-teal-50', border: 'border-emerald-200', text: 'text-emerald-700', chart: '#10b981', fill: '#d1fae5', accent: 'bg-emerald-500' },
    { name: 'rose', bg: 'bg-gradient-to-br from-rose-50 to-pink-50', border: 'border-rose-200', text: 'text-rose-700', chart: '#f43f5e', fill: '#ffe4e6', accent: 'bg-rose-500' },
];

// Mock data for fast fallback
const getMockTrendData = (): TrendData[] => {
    return [
        {
            technology: 'Artificial Intelligence',
            description: 'Encompasses machine learning, deep learning, and natural language processing. Transforming industries with intelligent automation and predictive analytics.',
            currentDemand: 9.5,
            futureScope: 9.8,
            salaryHike: 15,
            growthTrend: [8.2, 8.5, 8.8, 9.0, 9.2, 9.5]
        },
        {
            technology: 'Data Science',
            description: 'Focuses on extracting insights and knowledge from large datasets using statistical methods, machine learning, and data visualization techniques.',
            currentDemand: 9.2,
            futureScope: 9.5,
            salaryHike: 12,
            growthTrend: [8.0, 8.3, 8.6, 8.8, 9.0, 9.2]
        },
        {
            technology: 'DevOps',
            description: 'A set of practices that combines software development (Dev) and IT operations (Ops) to shorten the development lifecycle and deliver high-quality software.',
            currentDemand: 9.0,
            futureScope: 9.3,
            salaryHike: 10,
            growthTrend: [7.8, 8.1, 8.4, 8.6, 8.8, 9.0]
        },
        {
            technology: 'Cybersecurity',
            description: 'Protecting systems, networks, and programs from digital attacks. Critical for safeguarding sensitive data and ensuring business continuity.',
            currentDemand: 9.7,
            futureScope: 9.6,
            salaryHike: 13,
            growthTrend: [8.5, 8.8, 9.0, 9.2, 9.4, 9.7]
        },
        {
            technology: 'Cloud Computing',
            description: 'Delivery of on-demand computing services—from applications to storage and processing power—typically over the internet and on a pay-as-you-go basis.',
            currentDemand: 9.4,
            futureScope: 9.7,
            salaryHike: 11,
            growthTrend: [8.3, 8.6, 8.9, 9.1, 9.3, 9.4]
        }
    ];
};

const Trends: React.FC = () => {
    const [chartData, setChartData] = useState<TrendData[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            try {
                const analyticsData = await getTrendAnalytics();
                if (analyticsData && analyticsData.length > 0) {
                    setChartData(analyticsData);
                } else {
                    // Use mock data if API returns empty
                    setChartData(getMockTrendData());
                }
            } catch (error) {
                console.error("Failed to load trends", error);
                // Use mock data on error
                setChartData(getMockTrendData());
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    // Helper to transform array of numbers to recharts object array
    const getSparklineData = (data: number[]) => {
        return data.map((val, i) => ({ i, val }));
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 p-6">
            <div className="max-w-7xl mx-auto space-y-8">
                {/* Enhanced Header */}
                <div className="text-center space-y-4 mb-8">
                    <div className="flex items-center justify-center gap-4">
                        <div className="p-4 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl shadow-xl transform hover:scale-105 transition-transform">
                            <Zap className="h-8 w-8 text-white" />
                        </div>
                        <div>
                            <h1 className="text-5xl font-bold bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
                                MNC Trend Scanner
                            </h1>
                            <p className="text-lg text-slate-600 mt-2 flex items-center justify-center gap-2">
                                <Sparkles className="h-4 w-4 text-indigo-500" />
                                Live top 5 technology distinctions with individual growth analytics
                            </p>
                        </div>
                    </div>
                </div>

                {loading ? (
                    <div className="bg-white p-16 rounded-2xl shadow-xl border-2 border-slate-200 flex flex-col items-center justify-center min-h-[500px]">
                        <div className="relative">
                            <Loader2 className="h-16 w-16 text-indigo-600 animate-spin mb-6" />
                            <div className="absolute inset-0 bg-gradient-to-r from-indigo-400 to-purple-400 rounded-full blur-xl opacity-30 animate-pulse"></div>
                        </div>
                        <p className="text-slate-600 text-lg font-medium animate-pulse flex items-center gap-3">
                            <Search className="h-5 w-5 text-indigo-500" /> 
                            Scanning real-time industry reports...
                        </p>
                    </div>
                ) : (
                    <div className="space-y-10">
                        {/* Top 5 Distinct Trend Cards */}
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6">
                            {chartData.map((tech, index) => {
                                const color = COLORS[index % COLORS.length];
                                const sparkData = getSparklineData(tech.growthTrend || [50, 60, 55, 70, 80, 85]);

                                return (
                                    <div 
                                        key={index} 
                                        className={`relative rounded-2xl border-2 ${color.border} bg-white shadow-lg hover:shadow-2xl transition-all overflow-hidden flex flex-col group transform hover:scale-105 hover:-translate-y-1`}
                                    >
                                        {/* Gradient Header */}
                                        <div className={`p-5 ${color.bg} border-b-2 ${color.border} relative overflow-hidden`}>
                                            <div className={`absolute top-0 right-0 w-32 h-32 ${color.accent} rounded-full blur-3xl opacity-20 group-hover:opacity-30 transition-opacity`}></div>
                                            <div className="relative z-10">
                                                <div className="flex items-start justify-between mb-2">
                                                    <h3 className={`font-bold text-lg ${color.text} leading-tight`}>{tech.technology}</h3>
                                                    <div className={`w-2 h-2 ${color.accent} rounded-full animate-pulse`}></div>
                                                </div>
                                                <p className="text-xs text-slate-600 line-clamp-3 leading-relaxed">{tech.description}</p>
                                            </div>
                                        </div>

                                        {/* Enhanced Metrics Grid */}
                                        <div className="p-5 grid grid-cols-2 gap-4 border-b border-slate-100">
                                            <div className="bg-gradient-to-br from-green-50 to-emerald-50 p-3 rounded-xl border border-green-200 shadow-sm">
                                                <p className="text-[10px] text-green-600 uppercase tracking-wider font-bold mb-1 flex items-center gap-1">
                                                    <DollarSign className="h-3 w-3" /> Salary Hike
                                                </p>
                                                <p className="text-xl font-bold text-green-700 flex items-center gap-1">
                                                    $ {tech.salaryHike}%
                                                </p>
                                            </div>
                                            <div className="bg-gradient-to-br from-indigo-50 to-purple-50 p-3 rounded-xl border border-indigo-200 shadow-sm">
                                                <p className="text-[10px] text-indigo-600 uppercase tracking-wider font-bold mb-1 flex items-center gap-1">
                                                    <Target className="h-3 w-3" /> Scope
                                                </p>
                                                <p className="text-xl font-bold text-indigo-700 flex items-center gap-1">
                                                    {tech.futureScope}/100
                                                </p>
                                            </div>
                                        </div>

                                        {/* Enhanced Graph */}
                                        <div className="flex-1 p-5 min-h-[140px] flex flex-col justify-end bg-gradient-to-b from-white to-slate-50">
                                            <div className="flex items-center justify-between mb-3">
                                                <span className="text-xs font-bold text-slate-500 flex items-center gap-1.5">
                                                    <Activity className="h-3.5 w-3.5 text-indigo-500" /> 6-Month Trend
                                                </span>
                                                <span className={`text-sm font-bold ${color.text} bg-white px-2 py-1 rounded-lg border ${color.border} shadow-sm`}>
                                                    +{tech.currentDemand}% Demand
                                                </span>
                                            </div>
                                            <div className="h-20 w-full">
                                                <ResponsiveContainer width="100%" height="100%">
                                                    <AreaChart data={sparkData} margin={{ top: 5, right: 5, left: 5, bottom: 5 }}>
                                                        <defs>
                                                            <linearGradient id={`gradient-${index}`} x1="0" y1="0" x2="0" y2="1">
                                                                <stop offset="5%" stopColor={color.chart} stopOpacity={0.4}/>
                                                                <stop offset="95%" stopColor={color.chart} stopOpacity={0}/>
                                                            </linearGradient>
                                                        </defs>
                                                        <Area 
                                                            type="monotone" 
                                                            dataKey="val" 
                                                            stroke={color.chart} 
                                                            strokeWidth={3}
                                                            fillOpacity={1} 
                                                            fill={`url(#gradient-${index})`}
                                                        />
                                                    </AreaChart>
                                                </ResponsiveContainer>
                                            </div>
                                        </div>

                                        {/* Bottom Accent Bar */}
                                        <div className={`h-1 ${color.accent} bg-gradient-to-r from-transparent via-white to-transparent`}></div>
                                    </div>
                                );
                            })}
                        </div>

                        {/* Enhanced Comparative Market Analysis */}
                        <div className="bg-white p-8 rounded-2xl shadow-xl border-2 border-slate-200">
                            <div className="mb-8 flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="p-3 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl shadow-lg">
                                        <BarChart3 className="h-6 w-6 text-white" />
                                    </div>
                                    <div>
                                        <h3 className="text-2xl font-bold text-slate-800">Comparative Market Analysis</h3>
                                        <p className="text-sm text-slate-500">Demand vs. Salary trends across top technologies</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2 px-4 py-2 bg-indigo-50 rounded-xl border border-indigo-200">
                                    <TrendingUp className="h-5 w-5 text-indigo-600" />
                                    <span className="text-sm font-bold text-indigo-700">Live Data</span>
                                </div>
                            </div>
                            <div className="h-[450px] bg-gradient-to-br from-slate-50 to-white rounded-xl p-4 border border-slate-100">
                                <ResponsiveContainer width="100%" height="100%">
                                    <ComposedChart
                                        data={chartData}
                                        margin={{ top: 20, right: 30, bottom: 20, left: 10 }}
                                    >
                                        <defs>
                                            <linearGradient id="currentDemandGradient" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor="#6366f1" stopOpacity={0.8}/>
                                                <stop offset="95%" stopColor="#6366f1" stopOpacity={0.3}/>
                                            </linearGradient>
                                            <linearGradient id="futureScopeGradient" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor="#e0e7ff" stopOpacity={0.8}/>
                                                <stop offset="95%" stopColor="#e0e7ff" stopOpacity={0.3}/>
                                            </linearGradient>
                                        </defs>
                                        <CartesianGrid stroke="#f1f5f9" strokeDasharray="3 3" vertical={false} />
                                        <XAxis 
                                            dataKey="technology" 
                                            scale="point" 
                                            padding={{ left: 20, right: 20 }} 
                                            tick={{fill: '#64748b', fontSize: 12, fontWeight: 600}}
                                            axisLine={false}
                                            tickLine={false}
                                        />
                                        <YAxis 
                                            yAxisId="left" 
                                            tick={{fill: '#64748b', fontSize: 11, fontWeight: 500}} 
                                            axisLine={false} 
                                            tickLine={false}
                                            label={{ value: 'Demand Score', angle: -90, position: 'insideLeft', style: { fill: '#94a3b8', fontSize: 12, fontWeight: 600 } }} 
                                        />
                                        <YAxis 
                                            yAxisId="right" 
                                            orientation="right" 
                                            tick={{fill: '#64748b', fontSize: 11, fontWeight: 500}} 
                                            axisLine={false} 
                                            tickLine={false}
                                            unit="%"
                                            label={{ value: 'Hike %', angle: 90, position: 'insideRight', style: { fill: '#94a3b8', fontSize: 12, fontWeight: 600 } }} 
                                        />
                                        <Tooltip 
                                            contentStyle={{ 
                                                borderRadius: '12px', 
                                                border: '2px solid #e2e8f0', 
                                                boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)',
                                                backgroundColor: 'white',
                                                padding: '12px'
                                            }}
                                            labelStyle={{ fontWeight: 600, color: '#1e293b' }}
                                        />
                                        <Legend 
                                            wrapperStyle={{ paddingTop: '30px' }}
                                            iconType="circle"
                                        />
                                        
                                        <Bar 
                                            yAxisId="left" 
                                            dataKey="currentDemand" 
                                            name="Current Demand" 
                                            fill="url(#currentDemandGradient)" 
                                            barSize={40} 
                                            radius={[8, 8, 0, 0]}
                                        />
                                        <Bar 
                                            yAxisId="left" 
                                            dataKey="futureScope" 
                                            name="Future Potential" 
                                            fill="url(#futureScopeGradient)" 
                                            barSize={40} 
                                            radius={[8, 8, 0, 0]}
                                        />
                                        <Line 
                                            yAxisId="right" 
                                            type="monotone" 
                                            dataKey="salaryHike" 
                                            name="Salary Hike %" 
                                            stroke="#10b981" 
                                            strokeWidth={4} 
                                            dot={{r: 6, fill: '#fff', strokeWidth: 3, stroke: '#10b981'}} 
                                            activeDot={{r: 8, strokeWidth: 2}}
                                        />
                                    </ComposedChart>
                                </ResponsiveContainer>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Trends;
