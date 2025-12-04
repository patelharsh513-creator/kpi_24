

import React, { useState, useMemo } from 'react';
import { BellabonaRecord } from './types';
import { ResponsiveContainer, ComposedChart, Bar, Line, Area, AreaChart, XAxis, YAxis, CartesianGrid, Tooltip, Legend, PieChart, Pie, Cell, BarChart, LineChart } from 'recharts';
import { DollarSign, Activity, Calendar, TrendingDown, PieChart as PieIcon, Table as TableIcon } from 'lucide-react';

interface BellabonaDashboardProps {
    data: BellabonaRecord[];
    selectedDate?: string;
    liveRecord?: BellabonaRecord; // NEW: Live data from the input form
}

type ViewMode = 'daily' | 'weekly' | 'monthly';

const StatCard = ({ title, value, subtext, icon: Icon, color }: any) => (
    <div className="bg-gray-800 rounded-lg p-4 shadow-lg border border-gray-700 min-w-0 flex flex-col justify-between hover:border-gray-600 transition-colors">
        <div className="flex justify-between items-start mb-2">
            <p className="text-xs text-gray-400 uppercase tracking-wider font-medium truncate pr-2">{title}</p>
            {Icon && <div className={`p-2 rounded-lg ${color} bg-opacity-20`}><Icon className="w-4 h-4 text-white" /></div>}
        </div>
        <div>
            <p className="text-xl sm:text-2xl font-bold text-white">{value}</p>
            {subtext && <p className={`text-xs mt-1 text-gray-400`}>{subtext}</p>}
        </div>
    </div>
);

const ChartContainer = ({ title, children }: { title: string, children?: React.ReactNode }) => (
    <div className="bg-gray-800 p-4 rounded-lg border border-gray-700 shadow-lg min-h-[350px] flex flex-col">
        <h3 className="text-white font-semibold mb-4 text-sm uppercase tracking-wide flex items-center gap-2">
            {title}
        </h3>
        <div className="flex-grow relative">
            {children}
        </div>
    </div>
);

const getWeekNumber = (d: Date): string => {
    const date = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
    date.setUTCDate(date.getUTCDate() + 4 - (date.getUTCDay() || 7));
    const yearStart = new Date(Date.UTC(date.getUTCFullYear(), 0, 1));
    const weekNo = Math.ceil((((date.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
    return `${date.getUTCFullYear()}-W${weekNo}`;
};

const COLORS = {
    berlin: '#3b82f6', // Blue
    munich: '#f97316', // Orange
    koln: '#22c55e',   // Green
    global: '#facc15', // Yellow
    expected: '#9ca3af', // Gray
    service: '#8b5cf6', // Purple
    catering: '#ec4899', // Pink
};

export const BellabonaDashboard: React.FC<BellabonaDashboardProps> = ({ data, selectedDate, liveRecord }) => {
    const [viewMode, setViewMode] = useState<ViewMode>('daily');

    const formatCurrency = (val: number) => new Intl.NumberFormat('en-IE', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(val || 0);
    const formatPercent = (val: number) => new Intl.NumberFormat('en-US', { style: 'percent', minimumFractionDigits: 1 }).format(val || 0);
    const formatNumber = (val: number) => new Intl.NumberFormat('en-US').format(val || 0);

    // Merge live data with historical data for real-time visualization
    const effectiveData = useMemo(() => {
        if (!liveRecord || !liveRecord.date) return data;

        // Check if the live record's date already exists in the data
        const existsIndex = data.findIndex(d => d.date === liveRecord.date);
        
        if (existsIndex >= 0) {
            // Replace existing record with live version
            const newData = [...data];
            newData[existsIndex] = liveRecord;
            return newData;
        } else {
            // Append live record if it's new
            return [...data, liveRecord];
        }
    }, [data, liveRecord]);

    // 1. AGGREGATION LOGIC
    const aggregatedData = useMemo(() => {
        if (!effectiveData || effectiveData.length === 0) return [];
        
        // Filter and Sort
        const sorted = [...effectiveData]
            .filter(d => d.date)
            // FILTER OUT WEEKENDS (Sat/Sun)
            .filter(d => {
                const date = new Date(d.date);
                const day = date.getDay();
                return day !== 0 && day !== 6; // 0=Sunday, 6=Saturday
            })
            .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

        if (viewMode === 'daily') {
            return sorted.map(d => {
                // Ensure Total Revenue matches definition: Kitchen Revenue + Service Fee + Catering
                const calcTotal = (k: 'berlin'|'munich'|'koln') => 
                    (d[k]?.mainBusiness||0) + (d[k]?.serviceFee||0) + (d[k]?.cateringCharges||0);

                const berlinRev = calcTotal('berlin');
                const munichRev = calcTotal('munich');
                const kolnRev = calcTotal('koln');
                const globalRev = berlinRev + munichRev + kolnRev;

                const globalExpected = 
                    ((d.berlin?.expectedMainBusiness||0) + (d.berlin?.expectedServiceFee||0) + (d.berlin?.expectedCateringCharges||0)) +
                    ((d.munich?.expectedMainBusiness||0) + (d.munich?.expectedServiceFee||0) + (d.munich?.expectedCateringCharges||0)) +
                    ((d.koln?.expectedMainBusiness||0) + (d.koln?.expectedServiceFee||0) + (d.koln?.expectedCateringCharges||0));
                
                // Revenue Streams
                const mainRev = (d.berlin?.mainBusiness||0) + (d.munich?.mainBusiness||0) + (d.koln?.mainBusiness||0);
                const serviceFee = (d.berlin?.serviceFee||0) + (d.munich?.serviceFee||0) + (d.koln?.serviceFee||0);
                const catering = (d.berlin?.cateringCharges||0) + (d.munich?.cateringCharges||0) + (d.koln?.cateringCharges||0);

                // COGS % based on recalculated Revenue
                const calcCogsPct = (k: 'berlin'|'munich'|'koln', rev: number) => rev > 0 ? (d[k]?.cogs||0) / rev : 0;

                // Dishes
                const berlinDishes = d.berlin?.dishesOrdered || 0;
                const munichDishes = d.munich?.dishesOrdered || 0;
                const kolnDishes = d.koln?.dishesOrdered || 0;
                const totalDishes = berlinDishes + munichDishes + kolnDishes;

                return {
                    date: d.date,
                    rawKey: d.date,
                    // Revenue
                    berlinRev,
                    munichRev,
                    kolnRev,
                    globalRev,
                    globalExpected,
                    
                    // Detailed Streams Per Kitchen
                    berlinMain: d.berlin?.mainBusiness || 0,
                    berlinService: d.berlin?.serviceFee || 0,
                    berlinCatering: d.berlin?.cateringCharges || 0,
                    
                    munichMain: d.munich?.mainBusiness || 0,
                    munichService: d.munich?.serviceFee || 0,
                    munichCatering: d.munich?.cateringCharges || 0,
                    
                    kolnMain: d.koln?.mainBusiness || 0,
                    kolnService: d.koln?.serviceFee || 0,
                    kolnCatering: d.koln?.cateringCharges || 0,

                    // Dishes
                    berlinDishes,
                    munichDishes,
                    kolnDishes,
                    totalDishes,
                    
                    // Percentages
                    berlinCogsPct: calcCogsPct('berlin', berlinRev),
                    munichCogsPct: calcCogsPct('munich', munichRev),
                    kolnCogsPct: calcCogsPct('koln', kolnRev),
                    
                    berlinLeftoverPct: d.berlin?.leftoverPercentage || 0,
                    munichLeftoverPct: d.munich?.leftoverPercentage || 0,
                    kolnLeftoverPct: d.koln?.leftoverPercentage || 0,

                    // Composition
                    streamMain: mainRev,
                    streamService: serviceFee,
                    streamCatering: catering,

                    // --- NEW METRICS FOR INVESTORS ---
                    globalDelta: globalExpected > 0 ? (globalRev / globalExpected) - 1 : 0,
                    globalRevPerDish: totalDishes > 0 ? globalRev / totalDishes : 0,
                    
                    berlinShare: globalRev > 0 ? berlinRev / globalRev : 0,
                    berlinRevPerDish: berlinDishes > 0 ? berlinRev / berlinDishes : 0,

                    munichShare: globalRev > 0 ? munichRev / globalRev : 0,
                    munichRevPerDish: munichDishes > 0 ? munichRev / munichDishes : 0,

                    kolnShare: globalRev > 0 ? kolnRev / globalRev : 0,
                    kolnRevPerDish: kolnDishes > 0 ? kolnRev / kolnDishes : 0,
                };
            });
        }

        // Grouping for Weekly/Monthly
        const groups: Record<string, typeof effectiveData> = {};
        sorted.forEach(d => {
            const dateObj = new Date(d.date);
            let key = '';
            if (viewMode === 'weekly') key = getWeekNumber(dateObj);
            else if (viewMode === 'monthly') key = `${dateObj.getFullYear()}-${String(dateObj.getMonth() + 1).padStart(2, '0')}`;
            
            if (!groups[key]) groups[key] = [];
            groups[key].push(d);
        });

        // Summing & Weighted Averages
        return Object.keys(groups).map(key => {
            const group = groups[key];
            
            // Helper to sum
            const sum = (fn: (d: BellabonaRecord) => number) => group.reduce((acc, d) => acc + fn(d), 0);
            
            // Recalculate Totals from Components to ensure consistency
            const berlinMain = sum(d => d.berlin?.mainBusiness || 0);
            const berlinService = sum(d => d.berlin?.serviceFee || 0);
            const berlinCatering = sum(d => d.berlin?.cateringCharges || 0);
            const berlinRev = berlinMain + berlinService + berlinCatering;

            const munichMain = sum(d => d.munich?.mainBusiness || 0);
            const munichService = sum(d => d.munich?.serviceFee || 0);
            const munichCatering = sum(d => d.munich?.cateringCharges || 0);
            const munichRev = munichMain + munichService + munichCatering;

            const kolnMain = sum(d => d.koln?.mainBusiness || 0);
            const kolnService = sum(d => d.koln?.serviceFee || 0);
            const kolnCatering = sum(d => d.koln?.cateringCharges || 0);
            const kolnRev = kolnMain + kolnService + kolnCatering;

            const globalRev = berlinRev + munichRev + kolnRev;

            const globalExpected = sum(d => 
                ((d.berlin?.expectedMainBusiness||0) + (d.berlin?.expectedServiceFee||0) + (d.berlin?.expectedCateringCharges||0)) +
                ((d.munich?.expectedMainBusiness||0) + (d.munich?.expectedServiceFee||0) + (d.munich?.expectedCateringCharges||0)) +
                ((d.koln?.expectedMainBusiness||0) + (d.koln?.expectedServiceFee||0) + (d.koln?.expectedCateringCharges||0))
            );

            // Dishes
            const berlinDishes = sum(d => d.berlin?.dishesOrdered || 0);
            const munichDishes = sum(d => d.munich?.dishesOrdered || 0);
            const kolnDishes = sum(d => d.koln?.dishesOrdered || 0);
            const totalDishes = berlinDishes + munichDishes + kolnDishes;

            // COGS Weighted Calculation using RECALCULATED Total Revenue
            const calcCogs = (k: 'berlin'|'munich'|'koln', calculatedTotalRev: number) => {
                const totalCogs = sum(d => d[k]?.cogs || 0);
                return calculatedTotalRev > 0 ? totalCogs / calculatedTotalRev : 0;
            };

            // Leftover Weighted Calculation
            const calcLeftover = (k: 'berlin'|'munich'|'koln') => {
                const totalLeft = sum(d => d[k]?.leftoverCount || 0);
                const totalDish = sum(d => d[k]?.dishesOrdered || 0);
                return totalDish > 0 ? totalLeft / totalDish : 0;
            };

            // Streams
            const streamMain = berlinMain + munichMain + kolnMain;
            const streamService = berlinService + munichService + kolnService;
            const streamCatering = berlinCatering + munichCatering + kolnCatering;

            let dateLabel = key;
            if (viewMode === 'monthly') {
                const [y, m] = key.split('-');
                const date = new Date(parseInt(y), parseInt(m) - 1);
                dateLabel = date.toLocaleString('default', { month: 'short', year: 'numeric' });
            }

            return {
                date: dateLabel,
                rawKey: key,
                berlinRev, munichRev, kolnRev, globalRev, globalExpected,
                berlinMain, berlinService, berlinCatering,
                munichMain, munichService, munichCatering,
                kolnMain, kolnService, kolnCatering,
                berlinDishes, munichDishes, kolnDishes, totalDishes,
                berlinCogsPct: calcCogs('berlin', berlinRev),
                munichCogsPct: calcCogs('munich', munichRev),
                kolnCogsPct: calcCogs('koln', kolnRev),
                berlinLeftoverPct: calcLeftover('berlin'),
                munichLeftoverPct: calcLeftover('munich'),
                kolnLeftoverPct: calcLeftover('koln'),
                streamMain, streamService, streamCatering,

                 // --- NEW METRICS ---
                 globalDelta: globalExpected > 0 ? (globalRev / globalExpected) - 1 : 0,
                 globalRevPerDish: totalDishes > 0 ? globalRev / totalDishes : 0,
                 
                 berlinShare: globalRev > 0 ? berlinRev / globalRev : 0,
                 berlinRevPerDish: berlinDishes > 0 ? berlinRev / berlinDishes : 0,
 
                 munichShare: globalRev > 0 ? munichRev / globalRev : 0,
                 munichRevPerDish: munichDishes > 0 ? munichRev / munichDishes : 0,
 
                 kolnShare: globalRev > 0 ? kolnRev / globalRev : 0,
                 kolnRevPerDish: kolnDishes > 0 ? kolnRev / kolnDishes : 0,
            };
        });
    }, [effectiveData, viewMode]);


    // 2. CURRENT STATS (kpi CARDS)
    const currentStats = useMemo(() => {
        if (!effectiveData || effectiveData.length === 0) return null;
        if (!aggregatedData.length) return null;

        // Try to find matching record for selectedDate
        let targetIndex = aggregatedData.length - 1; // Default to latest
        
        if (selectedDate) {
            if (viewMode === 'daily') {
                const idx = aggregatedData.findIndex(d => d.date === selectedDate);
                if (idx !== -1) targetIndex = idx;
            } else if (viewMode === 'weekly') {
                const targetWeek = getWeekNumber(new Date(selectedDate));
                const idx = aggregatedData.findIndex(d => d.rawKey === targetWeek);
                if (idx !== -1) targetIndex = idx;
            } else {
                 const d = new Date(selectedDate);
                 const mKey = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`;
                 // Monthly keys are formatted differently in aggregatedData.date often, but rawKey is reliable
                 const idx = aggregatedData.findIndex(d => d.rawKey === mKey);
                 if (idx !== -1) targetIndex = idx;
            }
        }

        const current = aggregatedData[targetIndex];
        const previous = targetIndex > 0 ? aggregatedData[targetIndex - 1] : null;
        
        // Beta Calculation (Churn/Drop)
        // 1 - (Curr / Prev)
        let beta = 0;
        if (previous && previous.globalRev > 0) {
            beta = 1 - (current.globalRev / previous.globalRev);
        }

        return {
            label: current.date,
            global: current.globalRev,
            berlin: current.berlinRev,
            munich: current.munichRev,
            koln: current.kolnRev,
            beta: viewMode === 'weekly' ? beta : 0,
            
            // Detailed Breakdown
            berlinDetails: { main: current.berlinMain, service: current.berlinService, catering: current.berlinCatering },
            munichDetails: { main: current.munichMain, service: current.munichService, catering: current.munichCatering },
            kolnDetails: { main: current.kolnMain, service: current.kolnService, catering: current.kolnCatering }
        };

    }, [effectiveData, selectedDate, viewMode, aggregatedData]);

    // Data for the detailed table (Reversed so latest is top)
    const tableData = useMemo(() => [...aggregatedData].reverse(), [aggregatedData]);

    if (!effectiveData || effectiveData.length === 0) return <div className="text-gray-500 text-center mt-10">No data available.</div>;

    const modeLabel = viewMode === 'daily' ? 'Daily' : viewMode === 'weekly' ? 'Weekly' : 'Monthly';

    // Pie Chart Data - Reordered: Munich, Berlin, Köln
    const pieData = currentStats ? [
        { name: 'Munich', value: currentStats.munich, color: COLORS.munich },
        { name: 'Berlin', value: currentStats.berlin, color: COLORS.berlin },
        { name: 'Köln', value: currentStats.koln, color: COLORS.koln },
    ].filter(d => d.value > 0) : [];

    return (
        <div className="flex flex-col gap-6 animate-in fade-in duration-500">
            {/* CONTROLS */}
            <div className="flex justify-between items-center bg-gray-800 p-3 rounded-lg border border-gray-700">
                <h3 className="text-white font-semibold flex items-center gap-2">
                    <Activity className="w-5 h-5 text-cyan-400" />
                    Bellabona Performance Dashboard
                </h3>
                <div className="flex bg-gray-700/50 rounded-lg p-1">
                    <button onClick={() => setViewMode('daily')} className={`px-3 py-1.5 text-xs sm:text-sm font-bold rounded transition-colors ${viewMode === 'daily' ? 'bg-cyan-600 text-white' : 'text-gray-400 hover:text-white'}`}>Daily</button>
                    <button onClick={() => setViewMode('weekly')} className={`px-3 py-1.5 text-xs sm:text-sm font-bold rounded transition-colors ${viewMode === 'weekly' ? 'bg-cyan-600 text-white' : 'text-gray-400 hover:text-white'}`}>Weekly</button>
                    <button onClick={() => setViewMode('monthly')} className={`px-3 py-1.5 text-xs sm:text-sm font-bold rounded transition-colors ${viewMode === 'monthly' ? 'bg-cyan-600 text-white' : 'text-gray-400 hover:text-white'}`}>Monthly</button>
                </div>
            </div>

            {/* kpi STAT CARDS */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard 
                    title={`Global Revenue`} 
                    value={formatCurrency(currentStats?.global || 0)} 
                    subtext={currentStats?.label}
                    icon={DollarSign} 
                    color="bg-green-500" 
                />
                
                {/* BETA CARD */}
                {viewMode === 'weekly' && (
                    <StatCard 
                        title="Beta (Weekly Drop)" 
                        value={formatPercent(currentStats?.beta || 0)} 
                        subtext={currentStats?.beta > 0 ? "Revenue Dropped" : "Revenue Grew"}
                        icon={TrendingDown} 
                        color={ (currentStats?.beta || 0) > 0 ? "bg-red-500" : "bg-green-500"}
                    />
                )}

                 {/* Reordered: Munich, Berlin, Köln */}
                 <StatCard 
                    title={`Munich`} 
                    value={formatCurrency(currentStats?.munich || 0)} 
                    subtext={`${formatPercent((currentStats?.global || 0) > 0 ? (currentStats?.munich || 0) / (currentStats?.global || 1) : 0)} Share`}
                    icon={Activity} 
                    color="bg-orange-500" 
                />
                <StatCard 
                    title={`Berlin`} 
                    value={formatCurrency(currentStats?.berlin || 0)} 
                    subtext={`${formatPercent((currentStats?.global || 0) > 0 ? (currentStats?.berlin || 0) / (currentStats?.global || 1) : 0)} Share`}
                    icon={Activity} 
                    color="bg-blue-500" 
                />
                 <StatCard 
                    title={`Köln`} 
                    value={formatCurrency(currentStats?.koln || 0)} 
                    subtext={`${formatPercent((currentStats?.global || 0) > 0 ? (currentStats?.koln || 0) / (currentStats?.global || 1) : 0)} Share`}
                    icon={Activity} 
                    color="bg-green-500" 
                />
            </div>

            {/* --- ROW 1: FINANCIAL OVERVIEW --- */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* REVENUE STACKED BAR */}
                <div className="lg:col-span-2">
                    <ChartContainer title={`${modeLabel} Revenue Contribution`}>
                        <ResponsiveContainer width="100%" height={300}>
                            <ComposedChart data={aggregatedData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                                <CartesianGrid stroke="#374151" strokeDasharray="3 3" vertical={false} />
                                <XAxis dataKey="date" stroke="#9ca3af" fontSize={10} tickLine={false} axisLine={false} />
                                <YAxis stroke="#9ca3af" fontSize={10} tickLine={false} axisLine={false} tickFormatter={(val) => `€${val >= 1000 ? (val/1000).toFixed(0) + 'k' : val}`} width={40} />
                                <Tooltip contentStyle={{ backgroundColor: '#1f2937', borderColor: '#374151', color: '#f3f4f6' }} formatter={(val: number) => formatCurrency(val)} />
                                <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
                                {/* Stack Order: Munich (bottom) -> Berlin -> Köln (top) */}
                                <Bar dataKey="munichRev" name="Munich" stackId="a" fill={COLORS.munich} barSize={30} />
                                <Bar dataKey="berlinRev" name="Berlin" stackId="a" fill={COLORS.berlin} barSize={30} />
                                <Bar dataKey="kolnRev" name="Köln" stackId="a" fill={COLORS.koln} barSize={30} radius={[4, 4, 0, 0]} />
                            </ComposedChart>
                        </ResponsiveContainer>
                    </ChartContainer>
                </div>

                {/* ACTUAL VS EXPECTED */}
                <div className="lg:col-span-1">
                    <ChartContainer title="Global Actual vs Expected">
                        <ResponsiveContainer width="100%" height={300}>
                            <ComposedChart data={aggregatedData} margin={{ top: 10, right: 0, left: -20, bottom: 0 }}>
                                <CartesianGrid stroke="#374151" strokeDasharray="3 3" vertical={false} />
                                <XAxis dataKey="date" stroke="#9ca3af" fontSize={10} tickLine={false} axisLine={false} />
                                <YAxis stroke="#9ca3af" fontSize={10} tickLine={false} axisLine={false} tickFormatter={(val) => `€${val >= 1000 ? (val/1000).toFixed(0) + 'k' : val}`} width={40} />
                                <Tooltip contentStyle={{ backgroundColor: '#1f2937', borderColor: '#374151', color: '#f3f4f6' }} formatter={(val: number) => formatCurrency(val)} />
                                <Legend wrapperStyle={{ fontSize: '10px' }} />
                                <Bar dataKey="globalExpected" name="Expected" fill={COLORS.expected} barSize={15} radius={[2, 2, 0, 0]} />
                                <Bar dataKey="globalRev" name="Actual" fill={COLORS.global} barSize={15} radius={[2, 2, 0, 0]} />
                            </ComposedChart>
                        </ResponsiveContainer>
                    </ChartContainer>
                </div>
            </div>

            {/* --- ROW 2: OPERATIONS & VOLUME --- */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* DISH VOLUME */}
                <ChartContainer title="Dishes Sold (Volume)">
                    <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={aggregatedData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                            <CartesianGrid stroke="#374151" strokeDasharray="3 3" vertical={false} />
                            <XAxis dataKey="date" stroke="#9ca3af" fontSize={10} tickLine={false} axisLine={false} />
                            <YAxis stroke="#9ca3af" fontSize={10} tickLine={false} axisLine={false} width={30} />
                            <Tooltip contentStyle={{ backgroundColor: '#1f2937', borderColor: '#374151', color: '#f3f4f6' }} />
                            <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
                            {/* Order: Munich -> Berlin -> Köln */}
                            <Bar dataKey="munichDishes" name="Munich Dishes" fill={COLORS.munich} barSize={20} radius={[2, 2, 0, 0]} />
                            <Bar dataKey="berlinDishes" name="Berlin Dishes" fill={COLORS.berlin} barSize={20} radius={[2, 2, 0, 0]} />
                            <Bar dataKey="kolnDishes" name="Köln Dishes" fill={COLORS.koln} barSize={20} radius={[2, 2, 0, 0]} />
                        </BarChart>
                    </ResponsiveContainer>
                </ChartContainer>

                {/* REVENUE STREAMS */}
                <ChartContainer title="Revenue Composition (Global)">
                    <ResponsiveContainer width="100%" height={300}>
                        <AreaChart data={aggregatedData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                            <CartesianGrid stroke="#374151" strokeDasharray="3 3" vertical={false} />
                            <XAxis dataKey="date" stroke="#9ca3af" fontSize={10} tickLine={false} axisLine={false} />
                            <YAxis stroke="#9ca3af" fontSize={10} tickLine={false} axisLine={false} tickFormatter={(val) => `€${val >= 1000 ? (val/1000).toFixed(0) + 'k' : val}`} width={40} />
                            <Tooltip contentStyle={{ backgroundColor: '#1f2937', borderColor: '#374151', color: '#f3f4f6' }} formatter={(val: number) => formatCurrency(val)} />
                            <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
                            <Area type="monotone" dataKey="streamMain" name="Kitchen Rev" stackId="1" stroke={COLORS.berlin} fill={COLORS.berlin} fillOpacity={0.6} />
                            <Area type="monotone" dataKey="streamService" name="Service Fee" stackId="1" stroke={COLORS.service} fill={COLORS.service} fillOpacity={0.6} />
                            <Area type="monotone" dataKey="streamCatering" name="Catering" stackId="1" stroke={COLORS.catering} fill={COLORS.catering} fillOpacity={0.6} />
                        </AreaChart>
                    </ResponsiveContainer>
                </ChartContainer>
            </div>

            {/* --- ROW 3: EFFICIENCY & WASTE --- */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* COGS % TREND */}
                <ChartContainer title="COGS % Efficiency (Lower is Better)">
                    <ResponsiveContainer width="100%" height={300}>
                        <LineChart data={aggregatedData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                            <CartesianGrid stroke="#374151" strokeDasharray="3 3" vertical={false} />
                            <XAxis dataKey="date" stroke="#9ca3af" fontSize={10} tickLine={false} axisLine={false} />
                            <YAxis stroke="#9ca3af" fontSize={10} tickLine={false} axisLine={false} tickFormatter={formatPercent} width={40} />
                            <Tooltip contentStyle={{ backgroundColor: '#1f2937', borderColor: '#374151', color: '#f3f4f6' }} formatter={(val: number) => formatPercent(val)} />
                            <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
                            {/* Order: Munich -> Berlin -> Köln */}
                            <Line type="monotone" dataKey="munichCogsPct" name="Munich COGS %" stroke={COLORS.munich} strokeWidth={2} dot={false} />
                            <Line type="monotone" dataKey="berlinCogsPct" name="Berlin COGS %" stroke={COLORS.berlin} strokeWidth={2} dot={false} />
                            <Line type="monotone" dataKey="kolnCogsPct" name="Köln COGS %" stroke={COLORS.koln} strokeWidth={2} dot={false} />
                        </LineChart>
                    </ResponsiveContainer>
                </ChartContainer>

                {/* LEFTOVER % TREND */}
                <ChartContainer title="Leftover % Waste (Lower is Better)">
                    <ResponsiveContainer width="100%" height={300}>
                        <LineChart data={aggregatedData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                            <CartesianGrid stroke="#374151" strokeDasharray="3 3" vertical={false} />
                            <XAxis dataKey="date" stroke="#9ca3af" fontSize={10} tickLine={false} axisLine={false} />
                            <YAxis stroke="#9ca3af" fontSize={10} tickLine={false} axisLine={false} tickFormatter={formatPercent} width={40} />
                            <Tooltip contentStyle={{ backgroundColor: '#1f2937', borderColor: '#374151', color: '#f3f4f6' }} formatter={(val: number) => formatPercent(val)} />
                            <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
                            {/* Order: Munich -> Berlin -> Köln */}
                            <Line type="step" dataKey="munichLeftoverPct" name="Munich Waste %" stroke={COLORS.munich} strokeWidth={2} dot={false} />
                            <Line type="step" dataKey="berlinLeftoverPct" name="Berlin Waste %" stroke={COLORS.berlin} strokeWidth={2} dot={false} />
                            <Line type="step" dataKey="kolnLeftoverPct" name="Köln Waste %" stroke={COLORS.koln} strokeWidth={2} dot={false} />
                        </LineChart>
                    </ResponsiveContainer>
                </ChartContainer>
            </div>

            {/* --- ROW 4: DISTRIBUTION PIE & INSIGHTS --- */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                 <ChartContainer title="Revenue Share by Kitchen">
                    {pieData.length > 0 ? (
                        <ResponsiveContainer width="100%" height={300}>
                            <PieChart>
                                <Pie
                                    data={pieData}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={60}
                                    outerRadius={90}
                                    paddingAngle={5}
                                    dataKey="value"
                                    isAnimationActive={false}
                                >
                                    {pieData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={entry.color} stroke="none" />
                                    ))}
                                </Pie>
                                <Tooltip formatter={(val: number) => formatCurrency(val)} contentStyle={{ backgroundColor: '#1f2937', borderColor: '#374151', color: '#f3f4f6' }} />
                                <Legend layout="vertical" verticalAlign="middle" align="right" />
                            </PieChart>
                        </ResponsiveContainer>
                    ) : (
                        <div className="flex items-center justify-center h-[300px] text-gray-500 text-sm">
                            No revenue data to display
                        </div>
                    )}
                 </ChartContainer>

                 <div className="bg-gray-800 p-6 rounded-lg border border-gray-700 shadow-lg flex flex-col justify-center items-center text-center">
                    <PieIcon className="w-16 h-16 text-cyan-400 mb-4 opacity-50" />
                    <h3 className="text-xl font-bold text-white mb-2">Total Insights</h3>
                    
                    <div className="text-gray-400 text-sm w-full max-w-sm space-y-3">
                        <div className="border-b border-gray-700 pb-3 mb-2">
                             <span className="text-xs uppercase tracking-wide opacity-70 block mb-1">{currentStats?.label} Analysis</span>
                             <div className="flex justify-between items-baseline">
                                <span>Global Revenue</span>
                                <span className="text-2xl text-green-400 font-bold">{formatCurrency(currentStats?.global || 0)}</span>
                             </div>
                        </div>
                        
                        {/* Munich Detail */}
                        <div className="flex flex-col border-b border-gray-700/50 border-dashed pb-2">
                            <div className="flex justify-between items-center text-xs py-1">
                                <span className="text-orange-400 font-semibold flex items-center gap-2">
                                    <span className="w-2 h-2 rounded-full bg-orange-500"></span> Munich
                                </span>
                                <div className="flex gap-3">
                                    <span className="text-gray-300 font-bold">{formatCurrency(currentStats?.munich || 0)}</span>
                                    <span className="font-bold w-[40px] text-right text-gray-500">{formatPercent((currentStats?.global||0) > 0 ? (currentStats?.munich||0) / (currentStats?.global||1) : 0)}</span>
                                </div>
                            </div>
                            <div className="flex justify-between text-[10px] text-gray-500 pl-4">
                                <span>Kit: {formatCurrency(currentStats?.munichDetails?.main || 0)}</span>
                                <span>Fee: {formatCurrency(currentStats?.munichDetails?.service || 0)}</span>
                                <span>Cat: {formatCurrency(currentStats?.munichDetails?.catering || 0)}</span>
                            </div>
                        </div>

                        {/* Berlin Detail */}
                        <div className="flex flex-col border-b border-gray-700/50 border-dashed pb-2">
                            <div className="flex justify-between items-center text-xs py-1">
                                <span className="text-blue-400 font-semibold flex items-center gap-2">
                                    <span className="w-2 h-2 rounded-full bg-blue-500"></span> Berlin
                                </span>
                                <div className="flex gap-3">
                                    <span className="text-gray-300 font-bold">{formatCurrency(currentStats?.berlin || 0)}</span>
                                    <span className="font-bold w-[40px] text-right text-gray-500">{formatPercent((currentStats?.global||0) > 0 ? (currentStats?.berlin||0) / (currentStats?.global||1) : 0)}</span>
                                </div>
                            </div>
                            <div className="flex justify-between text-[10px] text-gray-500 pl-4">
                                <span>Kit: {formatCurrency(currentStats?.berlinDetails?.main || 0)}</span>
                                <span>Fee: {formatCurrency(currentStats?.berlinDetails?.service || 0)}</span>
                                <span>Cat: {formatCurrency(currentStats?.berlinDetails?.catering || 0)}</span>
                            </div>
                        </div>

                        {/* Köln Detail */}
                        <div className="flex flex-col pb-1">
                            <div className="flex justify-between items-center text-xs py-1">
                                <span className="text-green-400 font-semibold flex items-center gap-2">
                                    <span className="w-2 h-2 rounded-full bg-green-500"></span> Köln
                                </span>
                                <div className="flex gap-3">
                                    <span className="text-gray-300 font-bold">{formatCurrency(currentStats?.koln || 0)}</span>
                                    <span className="font-bold w-[40px] text-right text-gray-500">{formatPercent((currentStats?.global||0) > 0 ? (currentStats?.koln||0) / (currentStats?.global||1) : 0)}</span>
                                </div>
                            </div>
                             <div className="flex justify-between text-[10px] text-gray-500 pl-4">
                                <span>Kit: {formatCurrency(currentStats?.kolnDetails?.main || 0)}</span>
                                <span>Fee: {formatCurrency(currentStats?.kolnDetails?.service || 0)}</span>
                                <span>Cat: {formatCurrency(currentStats?.kolnDetails?.catering || 0)}</span>
                            </div>
                        </div>
                    </div>
                 </div>
            </div>

            {/* --- DETAILED DATA TABLE --- */}
            <div className="bg-gray-800 rounded-lg border border-gray-700 shadow-lg mt-2 overflow-hidden">
                <div className="p-4 border-b border-gray-700 flex justify-between items-center bg-gray-800">
                    <h3 className="text-white font-semibold text-base uppercase tracking-wide flex items-center gap-2">
                        <TableIcon className="w-5 h-5 text-cyan-400" />
                        Detailed Analysis Data ({modeLabel})
                    </h3>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs whitespace-nowrap">
                        <thead className="bg-gray-900 text-gray-400 font-semibold">
                            <tr>
                                <th rowSpan={2} className="px-4 py-3 border-b border-r border-gray-700 sticky left-0 bg-gray-900 z-10 shadow-lg">Period</th>
                                <th colSpan={5} className="px-4 py-2 text-center border-b border-r border-gray-700 text-gray-200 bg-gray-900/50">Global Performance</th>
                                <th colSpan={3} className="px-4 py-2 text-center border-b border-r border-gray-700 text-gray-200 bg-gray-900/50">Revenue Streams</th>
                                <th colSpan={6} className="px-4 py-2 text-center border-b border-r border-gray-700 text-orange-400 bg-gray-900/50">Munich</th>
                                <th colSpan={6} className="px-4 py-2 text-center border-b border-r border-gray-700 text-blue-400 bg-gray-900/50">Berlin</th>
                                <th colSpan={6} className="px-4 py-2 text-center border-b text-green-400 bg-gray-900/50">Köln</th>
                            </tr>
                            <tr className="bg-gray-800/50">
                                {/* Global */}
                                <th className="px-3 py-2 text-right border-b border-gray-700">Actual</th>
                                <th className="px-3 py-2 text-right border-b border-gray-700">Expected</th>
                                <th className="px-3 py-2 text-right border-b border-gray-700 text-cyan-300">Delta%</th>
                                <th className="px-3 py-2 text-right border-b border-gray-700 text-yellow-300">Rev/Dish</th>
                                <th className="px-3 py-2 text-right border-b border-r border-gray-700">Dishes</th>
                                {/* Streams */}
                                <th className="px-3 py-2 text-right border-b border-gray-700">Kitchen</th>
                                <th className="px-3 py-2 text-right border-b border-gray-700">Fees</th>
                                <th className="px-3 py-2 text-right border-b border-r border-gray-700">Catering</th>
                                {/* Munich */}
                                <th className="px-3 py-2 text-right border-b border-gray-700">Rev</th>
                                <th className="px-3 py-2 text-right border-b border-gray-700 text-gray-400">Share%</th>
                                <th className="px-3 py-2 text-right border-b border-gray-700 text-yellow-300">Rev/Dish</th>
                                <th className="px-3 py-2 text-right border-b border-gray-700">Dish</th>
                                <th className="px-3 py-2 text-right border-b border-gray-700">COGS%</th>
                                <th className="px-3 py-2 text-right border-b border-r border-gray-700">Waste%</th>
                                {/* Berlin */}
                                <th className="px-3 py-2 text-right border-b border-gray-700">Rev</th>
                                <th className="px-3 py-2 text-right border-b border-gray-700 text-gray-400">Share%</th>
                                <th className="px-3 py-2 text-right border-b border-gray-700 text-yellow-300">Rev/Dish</th>
                                <th className="px-3 py-2 text-right border-b border-gray-700">Dish</th>
                                <th className="px-3 py-2 text-right border-b border-gray-700">COGS%</th>
                                <th className="px-3 py-2 text-right border-b border-r border-gray-700">Waste%</th>
                                {/* Köln */}
                                <th className="px-3 py-2 text-right border-b border-gray-700">Rev</th>
                                <th className="px-3 py-2 text-right border-b border-gray-700 text-gray-400">Share%</th>
                                <th className="px-3 py-2 text-right border-b border-gray-700 text-yellow-300">Rev/Dish</th>
                                <th className="px-3 py-2 text-right border-b border-gray-700">Dish</th>
                                <th className="px-3 py-2 text-right border-b border-gray-700">COGS%</th>
                                <th className="px-3 py-2 text-right border-b border-gray-700">Waste%</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-700/50">
                           {tableData.map((row, idx) => (
                               <tr key={idx} className="hover:bg-gray-700/30 transition-colors">
                                   <td className="px-4 py-3 font-medium text-gray-300 border-r border-gray-700 bg-gray-800 sticky left-0 z-10">{row.date}</td>
                                   
                                   {/* Global */}
                                   <td className="px-3 py-2 text-right font-bold text-green-400">{formatCurrency(row.globalRev)}</td>
                                   <td className="px-3 py-2 text-right text-gray-400 font-mono">{formatCurrency(row.globalExpected)}</td>
                                   <td className={`px-3 py-2 text-right font-bold font-mono ${row.globalDelta >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                                       {formatPercent(row.globalDelta)}
                                   </td>
                                   <td className="px-3 py-2 text-right text-yellow-300 font-mono">{formatCurrency(row.globalRevPerDish)}</td>
                                   <td className="px-3 py-2 text-right text-gray-300 border-r border-gray-700">{row.totalDishes}</td>

                                   {/* Streams */}
                                   <td className="px-3 py-2 text-right text-gray-300">{formatCurrency(row.streamMain)}</td>
                                   <td className="px-3 py-2 text-right text-gray-300">{formatCurrency(row.streamService)}</td>
                                   <td className="px-3 py-2 text-right text-gray-300 border-r border-gray-700">{formatCurrency(row.streamCatering)}</td>

                                   {/* Munich */}
                                   <td className="px-3 py-2 text-right text-orange-300">{formatCurrency(row.munichRev)}</td>
                                   <td className="px-3 py-2 text-right text-gray-400 font-mono text-[10px]">{formatPercent(row.munichShare)}</td>
                                   <td className="px-3 py-2 text-right text-yellow-300 font-mono text-[10px]">{formatCurrency(row.munichRevPerDish)}</td>
                                   <td className="px-3 py-2 text-right text-gray-400">{row.munichDishes}</td>
                                   <td className={`px-3 py-2 text-right font-mono ${row.munichCogsPct > 0.35 ? 'text-red-400' : 'text-gray-400'}`}>{formatPercent(row.munichCogsPct)}</td>
                                   <td className="px-3 py-2 text-right text-gray-400 font-mono border-r border-gray-700">{formatPercent(row.munichLeftoverPct)}</td>

                                   {/* Berlin */}
                                   <td className="px-3 py-2 text-right text-blue-300">{formatCurrency(row.berlinRev)}</td>
                                   <td className="px-3 py-2 text-right text-gray-400 font-mono text-[10px]">{formatPercent(row.berlinShare)}</td>
                                   <td className="px-3 py-2 text-right text-yellow-300 font-mono text-[10px]">{formatCurrency(row.berlinRevPerDish)}</td>
                                   <td className="px-3 py-2 text-right text-gray-400">{row.berlinDishes}</td>
                                   <td className={`px-3 py-2 text-right font-mono ${row.berlinCogsPct > 0.35 ? 'text-red-400' : 'text-gray-400'}`}>{formatPercent(row.berlinCogsPct)}</td>
                                   <td className="px-3 py-2 text-right text-gray-400 font-mono border-r border-gray-700">{formatPercent(row.berlinLeftoverPct)}</td>

                                   {/* Köln */}
                                   <td className="px-3 py-2 text-right text-green-300">{formatCurrency(row.kolnRev)}</td>
                                   <td className="px-3 py-2 text-right text-gray-400 font-mono text-[10px]">{formatPercent(row.kolnShare)}</td>
                                   <td className="px-3 py-2 text-right text-yellow-300 font-mono text-[10px]">{formatCurrency(row.kolnRevPerDish)}</td>
                                   <td className="px-3 py-2 text-right text-gray-400">{row.kolnDishes}</td>
                                   <td className={`px-3 py-2 text-right font-mono ${row.kolnCogsPct > 0.35 ? 'text-red-400' : 'text-gray-400'}`}>{formatPercent(row.kolnCogsPct)}</td>
                                   <td className="px-3 py-2 text-right text-gray-400 font-mono">{formatPercent(row.kolnLeftoverPct)}</td>
                               </tr>
                           ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};