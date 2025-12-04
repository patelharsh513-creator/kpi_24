

import React, { useState, useMemo, useRef, useEffect } from 'react';
import { DailyRecord, DashboardPeriodTotals } from './types';
import { ResponsiveContainer, ComposedChart, Bar, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, PieChart, Pie, Cell, BarChart, LineChart } from 'recharts';
import { TrendingDown, Percent, Calendar, Users, Package, Truck, Euro } from 'lucide-react'; 

interface KpiDashboardProps {
  data: DailyRecord[];
  isLoading?: boolean;
  selectedDate?: string;
}

type ViewMode = 'daily' | 'weekly' | 'monthly';

const StatCard = ({ title, value, icon: Icon, color, textColor = "text-white" }: { title: string, value: string, icon?: React.ElementType, color: string, textColor?: string }) => (
    <div className="bg-gray-800 rounded-lg p-4 shadow-lg border border-gray-700 relative overflow-hidden min-w-0 flex flex-col justify-between h-full">
        <div className="flex justify-between items-start mb-2">
            <p className="text-xs text-gray-400 uppercase tracking-wider font-medium truncate pr-2" title={title}>{title}</p>
            {Icon && (
                <div className={`p-2 rounded-lg ${color} bg-opacity-20 flex-shrink-0`}>
                    <Icon className="w-5 h-5 text-white" />
                </div>
            )}
        </div>
        <div className="mt-1">
            <p className={`text-xl sm:text-2xl font-bold ${textColor} truncate`} title={value}>{value}</p>
        </div>
    </div>
);

const ChartCard: React.FC<{ title: string; children: React.ReactNode; rightContent?: React.ReactNode }> = ({ title, children, rightContent }) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const [isIntersecting, setIsIntersecting] = useState(false);
    const [hasDimensions, setHasDimensions] = useState(false);

    useEffect(() => {
        if (!containerRef.current) return;

        const intersectionObserver = new IntersectionObserver((entries) => {
            if (entries[0].isIntersecting) {
                setTimeout(() => setIsIntersecting(true), 300);
                intersectionObserver.disconnect();
            }
        }, { threshold: 0.05 }); 

        intersectionObserver.observe(containerRef.current);

        const resizeObserver = new ResizeObserver((entries) => {
            for (const entry of entries) {
                const { width, height } = entry.contentRect;
                if (width > 0 && height > 0) {
                    setHasDimensions(true);
                }
            }
        });
        resizeObserver.observe(containerRef.current);

        return () => {
            intersectionObserver.disconnect();
            resizeObserver.disconnect();
        };
    }, []);

    const shouldRender = isIntersecting && hasDimensions;

    return (
        <div className="bg-gray-800 p-4 rounded-lg shadow-lg border border-gray-700 w-full min-w-0 flex flex-col">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 min-h-[32px] gap-2">
                <h3 className="text-sm sm:text-base font-semibold text-gray-200 truncate w-full sm:w-auto">{title}</h3>
                {rightContent}
            </div>
            <div 
                ref={containerRef}
                style={{ width: '100%', height: 350, minWidth: 0 }} 
                className="bg-gray-900/50 rounded border border-gray-700/30 relative overflow-hidden"
            >
                {shouldRender ? children : (
                    <div className="w-full h-full flex flex-col items-center justify-center text-gray-500 text-sm">
                        <div className="w-6 h-6 border-2 border-gray-600 border-t-cyan-400 rounded-full animate-spin mb-2"></div>
                        <span className="text-xs font-mono opacity-50">
                            {isIntersecting ? "Rendering Chart..." : "Paused (Scroll to load)"}
                        </span>
                    </div>
                )}
            </div>
        </div>
    );
};

// Expanded colors to avoid collision for Internal Fuel (index 9) and Extra (index 10)
const COLORS = [
    '#06b6d4', // Cyan (Packator Services)
    '#8b5cf6', // Violet (Packator Dispatch)
    '#ec4899', // Pink (Samir)
    '#f97316', // Orange (Jozef)
    '#22c55e', // Green (Ali)
    '#facc15', // Yellow (Ali 2)
    '#64748b', // Slate (Ali 3)
    '#ef4444', // Red (Ali 4)
    '#3b82f6', // Blue (Internal Staff) (8)
    '#1e3a8a', // Dark Blue (Internal Fuel) (9)
    '#14b8a6', // Teal (Extra Costs) (10)
    '#000000'  // White (11)
];

const getWeekNumber = (d: Date): string => {
    const date = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
    date.setUTCDate(date.getUTCDate() + 4 - (date.getUTCDay() || 7));
    const yearStart = new Date(Date.UTC(date.getUTCFullYear(), 0, 1));
    const weekNo = Math.ceil((((date.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
    return `${date.getUTCFullYear()}-W${weekNo}`;
};

const safeNum = (val: any) => {
    if (val === '' || val === null || val === undefined) return 0;
    const n = parseFloat(val);
    return isNaN(n) ? 0 : n;
};

// Reusable aggregation logic
const aggregateRecords = (data: DailyRecord[], viewMode: ViewMode) => {
    const sortedData = (data || [])
        .filter(r => r.date && !isNaN(new Date(r.date).getTime()))
        // Filter out weekends (Saturday=6, Sunday=0) for charts
        .filter(r => {
            const d = new Date(r.date);
            const day = d.getDay();
            return day !== 0 && day !== 6;
        })
        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    let results: any[] = [];

    if (viewMode === 'daily') {
        results = sortedData.map(record => {
            const aliTotal = 
                safeNum(record.aliCost) +
                safeNum(record.ali2Cost) +
                safeNum(record.ali3Cost) +
                safeNum(record.ali4Cost) +
                safeNum(record.packatorDispatchCost) +
                safeNum(record.jozefCost) +
                safeNum(record.extraCost);

            const packatorTotal = safeNum(record.packatorStopCost);
            const samirTotal = safeNum(record.samirCost);
            
            // Split calculation for charts
            const cateringVal = safeNum(record.catering);
            // splitMainRevenue includes TotalRevenue + ServiceFee (Meals and AddOns are counts, not currency)
            const mainRevenueVal = safeNum(record.totalRevenue) + safeNum(record.serviceFee);

            return {
                ...record,
                date: record.date, 
                totalOverallRevenue: safeNum(record.totalOverallRevenue), 
                mainRevenueTotal: safeNum(record.mainRevenueTotal),
                splitMainRevenue: mainRevenueVal,
                splitCateringRevenue: cateringVal,
                gygCateringRevenue: safeNum(record.gygCateringRevenue),
                revoluteRevenue: safeNum(record.revoluteRevenue),
                totalLogisticCost: safeNum(record.totalLogisticCost),
                netProfit: safeNum(record.netProfit),
                logisticCostPercentage: safeNum(record.logisticCostPercentage), 
                mainRevenuePercentage: safeNum(record.mainRevenuePercentage), 
                aliTotal,
                packatorTotal,
                samirTotal,
                logisticCostPerStop: safeNum(record.logisticCostPerStop),
                logisticCostPerDish: safeNum(record.logisticCostPerDish),
                mealsPerStop: safeNum(record.mealsPerStop),
                mealsPerDelivery: safeNum(record.mealsPerDelivery),
                totalStops: safeNum(record.totalStops),
                manualTotalDeliveries: safeNum(record.manualTotalDeliveries),
                dishesScanned: safeNum(record.dishesScanned),
            };
        });
    } else {
        const groups: Record<string, DailyRecord[]> = {};

        sortedData.forEach(record => {
            if (!record.date) return;
            const dateObj = new Date(record.date);
            if (isNaN(dateObj.getTime())) return;

            let key = '';
            if (viewMode === 'weekly') {
                key = getWeekNumber(dateObj);
            } else if (viewMode === 'monthly') {
                key = `${dateObj.getFullYear()}-${String(dateObj.getMonth() + 1).padStart(2, '0')}`;
            }

            if (!groups[key]) groups[key] = [];
            groups[key].push(record);
        });

        results = Object.keys(groups).map(key => {
            const group = groups[key];
            
            const totalRevenue = group.reduce((sum, r) => sum + safeNum(r.totalRevenue), 0);
            const totalServiceFee = group.reduce((sum, r) => sum + safeNum(r.serviceFee), 0);
            const totalCatering = group.reduce((sum, r) => sum + safeNum(r.catering), 0);
            const totalMeals = group.reduce((sum, r) => sum + safeNum(r.meals), 0);
            const totalAddOns = group.reduce((sum, r) => sum + safeNum(r.addOns), 0);
            const totalGygCateringRevenue = group.reduce((sum, r) => sum + safeNum(r.gygCateringRevenue), 0);
            const totalRevoluteRevenue = group.reduce((sum, r) => sum + safeNum(r.revoluteRevenue), 0);

            const totalLogisticCost = group.reduce((sum, r) => sum + safeNum(r.totalLogisticCost), 0);
            const netProfit = group.reduce((sum, r) => sum + safeNum(r.netProfit), 0);
            
            const aliTotal = group.reduce((sum, r) => sum + (
                safeNum(r.aliCost) + 
                safeNum(r.ali2Cost) + 
                safeNum(r.ali3Cost) + 
                safeNum(r.ali4Cost) + 
                safeNum(r.packatorDispatchCost) + 
                safeNum(r.jozefCost) + 
                safeNum(r.extraCost)
            ), 0);
            
            const packatorTotal = group.reduce((sum, r) => sum + safeNum(r.packatorStopCost), 0);
            const samirTotal = group.reduce((sum, r) => sum + safeNum(r.samirCost), 0);

            const mainRevenueTotal = totalRevenue + totalServiceFee + totalCatering;
            const totalOverallRevenue = mainRevenueTotal + totalGygCateringRevenue + totalRevoluteRevenue;
            
            // Split calculation: Revenue + Fees (Excluding counts)
            const splitMainRevenue = totalRevenue + totalServiceFee;
            const splitCateringRevenue = totalCatering;

            const logisticCostPercentage = totalOverallRevenue > 0 ? totalLogisticCost / totalOverallRevenue : 0;
            const mainRevenuePercentage = totalOverallRevenue > 0 ? mainRevenueTotal / totalOverallRevenue : 0;

            // Unit Economics
            const totalStops = group.reduce((sum, r) => sum + safeNum(r.totalStops), 0);
            const totalDeliveries = group.reduce((sum, r) => sum + safeNum(r.manualTotalDeliveries), 0);
            const totalDishes = group.reduce((sum, r) => sum + safeNum(r.dishesScanned), 0);
            
            const logisticCostPerDish = totalLogisticCost > 0 ? totalMeals / totalLogisticCost : 0;
            
            const logisticCostPerStop = totalStops > 0 ? totalLogisticCost / totalStops : 0;
            const mealsPerStop = totalStops > 0 ? totalMeals / totalStops : 0;
            const mealsPerDelivery = totalDeliveries > 0 ? totalMeals / totalDeliveries : 0;

            let dateLabel = key;
            if (viewMode === 'monthly') {
                const [y, m] = key.split('-');
                const date = new Date(parseInt(y), parseInt(m) - 1);
                dateLabel = date.toLocaleString('default', { month: 'short', year: 'numeric' });
            }

            return {
                ...group[0], 
                date: dateLabel,
                rawKey: key,
                totalRevenue, 
                totalOverallRevenue, 
                mainRevenueTotal,
                splitMainRevenue,
                splitCateringRevenue,
                gygCateringRevenue: totalGygCateringRevenue, 
                revoluteRevenue: totalRevoluteRevenue, 
                totalLogisticCost, 
                logisticCostPercentage, 
                mainRevenuePercentage, 
                netProfit,
                aliTotal,
                packatorTotal,
                samirTotal,
                totalStops,
                manualTotalDeliveries: totalDeliveries,
                dishesScanned: totalDishes,
                logisticCostPerStop,
                logisticCostPerDish,
                mealsPerStop,
                mealsPerDelivery
            };
        });
    }

    if (results.length === 0) {
        return [{
            date: 'Today',
            totalOverallRevenue: 0,
            splitMainRevenue: 0,
            splitCateringRevenue: 0,
            gygCateringRevenue: 0,
            revoluteRevenue: 0,
            totalLogisticCost: 0,
            logisticCostPercentage: 0,
            mainRevenuePercentage: 0,
            netProfit: 0,
            aliTotal: 0,
            packatorTotal: 0,
            samirTotal: 0, 
            logisticCostPerStop: 0,
            logisticCostPerDish: 0,
            mealsPerStop: 0,
            mealsPerDelivery: 0,
            totalStops: 0,
            manualTotalDeliveries: 0,
            dishesScanned: 0,
        } as unknown as DailyRecord];
    }

    return results;
};

export const KpiDashboard: React.FC<KpiDashboardProps> = ({ data, isLoading = false, selectedDate }) => {
  const [viewMode, setViewMode] = useState<ViewMode>('daily');
  const [unitViewMode, setUnitViewMode] = useState<ViewMode>('daily'); // Independent view mode for Unit Economics
  const [revCostViewMode, setRevCostViewMode] = useState<ViewMode>('daily'); // Independent view mode for Rev vs Cost

  const aggregatedData = useMemo(() => aggregateRecords(data, viewMode), [data, viewMode]);
  
  // Independent aggregation for Unit Economics charts
  const unitAggregatedData = useMemo(() => aggregateRecords(data, unitViewMode), [data, unitViewMode]);

  // Independent aggregation for Rev vs Cost chart
  const revCostAggregatedData = useMemo(() => aggregateRecords(data, revCostViewMode), [data, revCostViewMode]);

  const yAxisMax = useMemo(() => {
      if (!aggregatedData.length) return 100;
      const maxVal = Math.max(
          ...aggregatedData.map(d => Math.max(safeNum(d.totalOverallRevenue)||0, safeNum(d.totalLogisticCost)||0)) 
      );
      return maxVal <= 0 ? 100 : Math.ceil(maxVal * 1.1);
  }, [aggregatedData]);

  const dispatcherMax = useMemo(() => {
      if (!aggregatedData.length) return 2000;
      const maxVal = Math.max(
          ...aggregatedData.map(d => (safeNum(d.aliTotal)||0) + (safeNum(d.packatorTotal)||0) + (safeNum(d.samirTotal)||0))
      );
      return maxVal <= 0 ? 1000 : Math.ceil(maxVal * 1.1);
  }, [aggregatedData]);

  const yAxisMinProfit = useMemo(() => {
      if (!aggregatedData.length) return 0;
      const minVal = Math.min(...aggregatedData.map(d => safeNum(d.netProfit)||0));
      return minVal < 0 ? Math.floor(minVal * 1.1) : 0;
  }, [aggregatedData]);
  
  const yAxisMaxProfit = useMemo(() => {
      if (!aggregatedData.length) return 100;
      const maxVal = Math.max(...aggregatedData.map(d => safeNum(d.netProfit)||0));
      return maxVal <= 0 ? 100 : Math.ceil(maxVal * 1.1);
  }, [aggregatedData]);


  const currentPeriodPayables = useMemo<DashboardPeriodTotals>(() => {
    // USE SELECTED DATE or fallback to Today
    let referenceDate = new Date();
    if (selectedDate) {
        const parsed = new Date(selectedDate);
        if (!isNaN(parsed.getTime())) {
            referenceDate = parsed;
        }
    }

    const currentWeekKey = getWeekNumber(referenceDate);
    const currentMonthKey = `${referenceDate.getFullYear()}-${String(referenceDate.getMonth() + 1).padStart(2, '0')}`;

    const defaults = { 
        weekly: { 
            payableAli: 0, payablePackator: 0, payableSamir: 0, 
            totalOverallRevenue: 0, mainRevenueTotal: 0, gygCateringRevenueTotal: 0, revoluteRevenueTotal: 0,
            totalLogisticCost: 0, avgOverallLogisticCostPercentage: 0, avgMainRevenuePercentage: 0 
        }, 
        monthly: { 
            payableAli: 0, payablePackator: 0, payableSamir: 0, 
            totalOverallRevenue: 0, mainRevenueTotal: 0, gygCateringRevenueTotal: 0, revoluteRevenueTotal: 0,
            totalLogisticCost: 0, avgOverallLogisticCostPercentage: 0, avgMainRevenuePercentage: 0 
        },
        weekLabel: currentWeekKey,
        monthLabel: referenceDate.toLocaleString('default', { month: 'long' })
    };

    if (!data || data.length === 0) return defaults;

    const sumPayables = (dataset: DailyRecord[]) => {
        const payableAli = dataset.reduce((sum, r) => sum + safeNum(r.totalAliPayable), 0);
        const payablePackator = dataset.reduce((sum, r) => sum + safeNum(r.totalPackatorPayable), 0);
        const payableSamir = dataset.reduce((sum, r) => sum + safeNum(r.totalSamirPayable), 0);

        const totalLogisticCostSum = dataset.reduce((sum, r) => sum + safeNum(r.totalLogisticCost), 0);
        const totalOverallRevenueSum = dataset.reduce((sum, r) => sum + safeNum(r.totalOverallRevenue), 0);
        const mainRevenueTotalSum = dataset.reduce((sum, r) => sum + safeNum(r.mainRevenueTotal), 0);
        const gygCateringRevenueTotal = dataset.reduce((sum, r) => sum + safeNum(r.gygCateringRevenue), 0);
        const revoluteRevenueTotal = dataset.reduce((sum, r) => sum + safeNum(r.revoluteRevenue), 0);

        const avgOverallLogisticCostPercentage = totalOverallRevenueSum > 0 ? totalLogisticCostSum / totalOverallRevenueSum : 0;
        const avgMainRevenuePercentage = totalOverallRevenueSum > 0 ? mainRevenueTotalSum / totalOverallRevenueSum : 0;
        
        return {
            payableAli,
            payablePackator,
            payableSamir,
            totalOverallRevenue: totalOverallRevenueSum,
            mainRevenueTotal: mainRevenueTotalSum,
            gygCateringRevenueTotal,
            revoluteRevenueTotal,
            totalLogisticCost: totalLogisticCostSum,
            avgOverallLogisticCostPercentage,
            avgMainRevenuePercentage,
        };
    };

    // Filter Weekly Data: Must be in same week AND same month to handle boundaries
    const thisWeekData = data.filter(d => {
        const date = new Date(d.date);
        const ref = new Date(referenceDate);
        return !isNaN(date.getTime()) && getWeekNumber(date) === currentWeekKey && date.getMonth() === ref.getMonth() && date.getFullYear() === ref.getFullYear();
    });
    
    const thisMonthData = data.filter(d => {
        const dDate = new Date(d.date);
        return !isNaN(dDate.getTime()) && `${dDate.getFullYear()}-${String(dDate.getMonth() + 1).padStart(2, '0')}` === currentMonthKey;
    });

    return {
        weekly: sumPayables(thisWeekData),
        monthly: sumPayables(thisMonthData),
        weekLabel: currentWeekKey,
        monthLabel: referenceDate.toLocaleString('default', { month: 'long' })
    };
  }, [data, selectedDate]);

  if (isLoading) {
      return (
          <div className="flex flex-col gap-6 w-full animate-in fade-in duration-500">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div className="bg-gray-800 rounded-lg p-5 shadow-lg border border-gray-700 h-40 animate-pulse flex flex-col justify-between">
                         <div className="h-6 w-1/3 bg-gray-700 rounded"></div>
                         <div className="space-y-3">
                             <div className="h-8 w-full bg-gray-700/50 rounded"></div>
                             <div className="h-8 w-full bg-gray-700/50 rounded"></div>
                         </div>
                    </div>
                </div>
          </div>
      );
  }

  const formatCurrency = (value: number) => new Intl.NumberFormat('en-IE', { style: 'currency', currency: 'EUR', minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(value || 0);
  // Updated formatPercent to show 2 decimal places for better precision on small values
  const formatPercent = (value: number) => new Intl.NumberFormat('en-US', { style: 'percent', minimumFractionDigits: 2 }).format(value || 0);
  const formatNumber = (value: number) => new Intl.NumberFormat('en-US').format(value || 0);
  
  const axisCurrencyFormatter = (val: number) => {
      if (val >= 1000) return `€${(val / 1000).toFixed(1)}k`;
      return `€${val}`;
  };

  const safeTotal = (arr: DailyRecord[], fn: (item: DailyRecord) => number) => arr.reduce((acc, item) => acc + (fn(item) || 0), 0);

  const targetRecord = data && data.length > 0 ? (
      selectedDate 
        ? data.find(r => r.date === selectedDate) || data[data.length - 1]
        : data[data.length - 1]
  ) : null;

  const currentDailyOverallLogisticCost = targetRecord ? targetRecord.logisticCostPercentage : 0; 
  const currentDailyOverallRevenue = targetRecord ? safeNum(targetRecord.totalOverallRevenue) : 0;
  const currentDailyMainRevenue = targetRecord ? safeNum(targetRecord.mainRevenueTotal) : 0;

  const aggregatedExpenseBreakdown = (data || [])
    .flatMap(d => d.costBreakdown || [])
    .reduce((acc, item) => {
        const existing = acc.find(i => i.name === item.name);
        if (existing) {
            existing.value += (safeNum(item.value) || 0);
        } else {
            acc.push({ ...item, value: safeNum(item.value) || 0 });
        }
        return acc;
    }, [] as {name: string, value: number}[]);

  return (
    <div className="flex flex-col gap-6 w-full">
        
        {/* PAYABLES CARDS */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
            <div className="bg-gray-800 rounded-lg p-4 md:p-5 shadow-lg border border-gray-700">
                 <div className="flex items-center gap-3 mb-4 border-b border-gray-700 pb-2">
                    {Calendar && <Calendar className="w-5 h-5 text-cyan-400" />}
                    <h3 className="text-base md:text-lg font-semibold text-white">This Week's Payables</h3>
                    <span className="text-xs text-gray-500 ml-auto font-mono">{currentPeriodPayables.weekLabel}</span>
                 </div>
                 <div className="space-y-3">
                    <div className="flex justify-between items-center p-2 bg-gray-700/30 rounded hover:bg-gray-700/50 transition-colors">
                        <span className="text-gray-300 text-sm">Ali (Total)</span>
                        <span className="text-base sm:text-lg md:text-xl font-bold text-green-400">{formatCurrency(currentPeriodPayables.weekly.payableAli)}</span>
                    </div>
                    <div className="flex justify-between items-center p-2 bg-gray-700/30 rounded hover:bg-gray-700/50 transition-colors">
                        <span className="text-gray-300 text-sm">Packator (Service)</span>
                        <span className="text-base sm:text-lg md:text-xl font-bold text-blue-400">{formatCurrency(currentPeriodPayables.weekly.payablePackator)}</span>
                    </div>
                     <div className="flex justify-between items-center p-2 bg-gray-700/30 rounded hover:bg-gray-700/50 transition-colors">
                        <span className="text-gray-300 text-sm">Samir</span>
                        <span className="text-base sm:text-lg md:text-xl font-bold text-orange-400">{formatCurrency(currentPeriodPayables.weekly.payableSamir)}</span>
                    </div>
                 </div>
            </div>

            <div className="bg-gray-800 rounded-lg p-4 md:p-5 shadow-lg border border-gray-700">
                 <div className="flex items-center gap-3 mb-4 border-b border-gray-700 pb-2">
                    {Calendar && <Calendar className="w-5 h-5 text-purple-400" />}
                    <h3 className="text-base md:text-lg font-semibold text-white">This Month's Payables</h3>
                    <span className="text-xs text-gray-500 ml-auto font-mono">{currentPeriodPayables.monthLabel}</span>
                 </div>
                 <div className="space-y-3">
                    <div className="flex justify-between items-center p-2 bg-gray-700/30 rounded hover:bg-gray-700/50 transition-colors">
                        <span className="text-gray-300 text-sm">Ali (Total)</span>
                        <span className="text-base sm:text-lg md:text-xl font-bold text-green-400">{formatCurrency(currentPeriodPayables.monthly.payableAli)}</span>
                    </div>
                    <div className="flex justify-between items-center p-2 bg-gray-700/30 rounded hover:bg-gray-700/50 transition-colors">
                        <span className="text-gray-300 text-sm">Packator (Service)</span>
                        <span className="text-base sm:text-lg md:text-xl font-bold text-blue-400">{formatCurrency(currentPeriodPayables.monthly.payablePackator)}</span>
                    </div>
                     <div className="flex justify-between items-center p-2 bg-gray-700/30 rounded hover:bg-gray-700/50 transition-colors">
                        <span className="text-gray-300 text-sm">Samir</span>
                        <span className="text-base sm:text-lg md:text-xl font-bold text-orange-400">{formatCurrency(currentPeriodPayables.monthly.payableSamir)}</span>
                    </div>
                 </div>
            </div>
        </div>

        <div className="flex flex-col md:flex-row justify-between items-end md:items-center gap-4 border-t border-gray-700 pt-6">
            <h3 className="text-lg md:text-xl font-semibold text-white">Performance Analytics</h3>
        </div>

        {/* PERFORMANCE STAT CARDS */}
        <div className="flex flex-col gap-4">
             {/* Overall Revenue Breakdown */}
             <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                 <StatCard title="Daily Overall Revenue" value={formatCurrency(currentDailyOverallRevenue)} icon={undefined} color="bg-emerald-500/80" textColor="text-emerald-400" />
                 <StatCard title="Weekly Overall Revenue" value={formatCurrency(currentPeriodPayables.weekly.totalOverallRevenue)} icon={undefined} color="bg-teal-500/80" textColor="text-teal-400" />
                 <StatCard title="Monthly Overall Revenue" value={formatCurrency(currentPeriodPayables.monthly.totalOverallRevenue)} icon={undefined} color="bg-green-500/80" textColor="text-green-400" />
            </div>

             {/* Main Revenue Breakdown */}
             <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                 <StatCard title="Daily Main Revenue" value={formatCurrency(currentDailyMainRevenue)} icon={Euro} color="bg-indigo-500/80" textColor="text-indigo-400" />
                 <StatCard title="Weekly Main Revenue" value={formatCurrency(currentPeriodPayables.weekly.mainRevenueTotal)} icon={Calendar} color="bg-violet-500/80" textColor="text-violet-400" />
                 <StatCard title="Monthly Main Revenue" value={formatCurrency(currentPeriodPayables.monthly.mainRevenueTotal)} icon={Calendar} color="bg-purple-500/80" textColor="text-purple-300" />
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <StatCard title="Total GYG Catering Sales (Monthly)" value={formatCurrency(currentPeriodPayables.monthly.gygCateringRevenueTotal)} icon={Euro} color="bg-pink-500/80" textColor="text-pink-400" />
                <StatCard title="Total Revolute Sales (Monthly)" value={formatCurrency(currentPeriodPayables.monthly.revoluteRevenueTotal)} icon={Euro} color="bg-cyan-500/80" textColor="text-cyan-400" />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <StatCard title="Total Logistic Cost (Monthly)" value={formatCurrency(currentPeriodPayables.monthly.totalLogisticCost)} icon={TrendingDown} color="bg-red-500/80" textColor="text-red-400" />
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <StatCard title="Current Daily Overall Log. Cost %" value={formatPercent(currentDailyOverallLogisticCost)} icon={Percent} color="bg-purple-500/80" textColor="text-purple-400" />
                <StatCard title="Weekly Overall Log. Cost % (Proj.)" value={formatPercent(currentPeriodPayables.weekly.avgOverallLogisticCostPercentage)} icon={Calendar} color="bg-indigo-500/80" textColor="text-indigo-400" />
                <StatCard title="Monthly Overall Log. Cost % (Proj.)" value={formatPercent(currentPeriodPayables.monthly.avgOverallLogisticCostPercentage)} icon={Calendar} color="bg-teal-500/80" textColor="text-teal-400" />
            </div>

            {/* Total Revenue % Cards */}
            <div className="grid grid-cols-2 gap-4">
                <StatCard title="Weekly Total Revenue % (Proj.)" value={formatPercent(currentPeriodPayables.weekly.avgMainRevenuePercentage)} icon={Calendar} color="bg-orange-500/80" textColor="text-orange-400" />
                <StatCard title="Monthly Total Revenue % (Proj.)" value={formatPercent(currentPeriodPayables.monthly.avgMainRevenuePercentage)} icon={Calendar} color="bg-lime-500/80" textColor="text-lime-400" />
            </div>
        </div>

        <h3 className="text-lg md:text-xl font-semibold text-white mt-2">Dispatcher Totals (Monthly)</h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 md:gap-6"> 
             <StatCard title="Total Ali (inc. Jozef & Extra)" value={formatCurrency(currentPeriodPayables.monthly.payableAli)} icon={Users} color="bg-green-600/80" />
             <StatCard title="Total Packator (Service)" value={formatCurrency(currentPeriodPayables.monthly.payablePackator)} icon={Package} color="bg-blue-600/80" />
             <StatCard title="Total Samir" value={formatCurrency(currentPeriodPayables.monthly.payableSamir)} icon={Truck} color="bg-orange-600/80" />
        </div>

        {/* FINANCIAL & COST CHARTS */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 min-w-0">
            {/* NEW CHART: Revenue vs Cost Overview */}
            <div className="lg:col-span-2">
                <ChartCard 
                    title="Revenue vs Logistic Cost Overview" 
                    rightContent={
                        <div className="flex bg-gray-700/50 rounded-lg p-1">
                            <button onClick={() => setRevCostViewMode('daily')} className={`px-2 py-1 text-[10px] sm:text-xs font-bold rounded transition-colors ${revCostViewMode === 'daily' ? 'bg-cyan-600 text-white' : 'text-gray-400 hover:text-white'}`}>Daily</button>
                            <button onClick={() => setRevCostViewMode('weekly')} className={`px-2 py-1 text-[10px] sm:text-xs font-bold rounded transition-colors ${revCostViewMode === 'weekly' ? 'bg-cyan-600 text-white' : 'text-gray-400 hover:text-white'}`}>Weekly</button>
                            <button onClick={() => setRevCostViewMode('monthly')} className={`px-2 py-1 text-[10px] sm:text-xs font-bold rounded transition-colors ${revCostViewMode === 'monthly' ? 'bg-cyan-600 text-white' : 'text-gray-400 hover:text-white'}`}>Monthly</button>
                        </div>
                    }
                >
                    <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0} debounce={100}>
                        <ComposedChart data={revCostAggregatedData} margin={{ top: 20, right: 10, left: 0, bottom: 0 }}>
                            <CartesianGrid stroke="#6b7280" strokeDasharray="3 3" vertical={false} strokeOpacity={0.4} />
                            <XAxis dataKey="date" type="category" stroke="#9ca3af" fontSize={10} tickLine={false} axisLine={false} />
                            <YAxis yAxisId="left" stroke="#9ca3af" fontSize={10} tickLine={false} axisLine={false} tickFormatter={axisCurrencyFormatter} width={35} />
                            <YAxis yAxisId="right" orientation="right" stroke="#facc15" fontSize={10} tickLine={false} axisLine={false} tickFormatter={formatPercent} width={35} />
                            
                            <Tooltip cursor={{fill: 'rgba(255, 255, 255, 0.05)'}} contentStyle={{ backgroundColor: '#1f2937', borderColor: '#374151', color: '#f3f4f6' }} formatter={(value: number, name: string) => {
                                if (name === 'Cost %') return formatPercent(safeNum(value));
                                return formatCurrency(safeNum(value));
                            }} />
                            <Legend wrapperStyle={{ fontSize: '10px', color: '#9ca3af', paddingTop: '10px' }} />
                            
                            <Bar yAxisId="left" dataKey="totalOverallRevenue" name="Total Revenue" fill="#10b981" barSize={30} isAnimationActive={false} activeBar={{ stroke: '#fff', strokeWidth: 2, fillOpacity: 0.8 }} />
                            <Bar yAxisId="left" dataKey="totalLogisticCost" name="Logistic Cost" fill="#ef4444" barSize={30} isAnimationActive={false} activeBar={{ stroke: '#fff', strokeWidth: 2, fillOpacity: 0.8 }} />
                            
                            <Line yAxisId="right" type="monotone" dataKey="logisticCostPercentage" name="Cost %" stroke="#facc15" strokeWidth={2} dot={{r: 2, fill: "#facc15"}} activeDot={{ r: 6, stroke: '#fff', strokeWidth: 2 }} isAnimationActive={false} />
                        </ComposedChart>
                    </ResponsiveContainer>
                </ChartCard>
            </div>

            <ChartCard 
                title={`${viewMode === 'daily' ? 'Day-to-Day' : viewMode === 'weekly' ? 'Week-to-Week' : 'Month-to-Month'} Financials`} 
                rightContent={
                    <div className="flex items-center gap-3">
                         <div className="flex bg-gray-700/50 rounded-lg p-1">
                            <button onClick={() => setViewMode('daily')} className={`px-2 py-1 text-[10px] sm:text-xs font-bold rounded transition-colors ${viewMode === 'daily' ? 'bg-cyan-600 text-white' : 'text-gray-400 hover:text-white'}`}>D2D</button>
                            <button onClick={() => setViewMode('weekly')} className={`px-2 py-1 text-[10px] sm:text-xs font-bold rounded transition-colors ${viewMode === 'weekly' ? 'bg-cyan-600 text-white' : 'text-gray-400 hover:text-white'}`}>W2W</button>
                            <button onClick={() => setViewMode('monthly')} className={`px-2 py-1 text-[10px] sm:text-xs font-bold rounded transition-colors ${viewMode === 'monthly' ? 'bg-cyan-600 text-white' : 'text-gray-400 hover:text-white'}`}>M2M</button>
                        </div>
                    </div>
                }
            >
                <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0} debounce={100}>
                    <ComposedChart data={aggregatedData} margin={{ top: 20, right: 10, left: 0, bottom: 0 }}>
                        <CartesianGrid stroke="#6b7280" strokeDasharray="3 3" vertical={false} strokeOpacity={0.4} />
                        <XAxis dataKey="date" type="category" stroke="#9ca3af" fontSize={10} tickLine={false} axisLine={false} minTickGap={10} />
                        <YAxis yAxisId="left" stroke="#9ca3af" fontSize={10} tickLine={false} axisLine={false} tickFormatter={axisCurrencyFormatter} domain={[0, yAxisMax]} width={35} />
                        <YAxis yAxisId="right" orientation="right" stroke="#8b5cf6" fontSize={10} tickLine={false} axisLine={false} tickFormatter={formatPercent} width={35} />
                        <Tooltip
                            cursor={{fill: 'rgba(255, 255, 255, 0.05)'}}
                            content={({ active, payload, label }) => {
                            if (active && payload && payload.length) {
                                return (
                                <div className="p-3 bg-gray-800 border border-gray-700 rounded-lg shadow-xl z-50">
                                    <p className="label text-white font-bold mb-2">{`${label}`}</p>
                                    {payload.map((pld: any) => (
                                    <div key={pld.dataKey} className="flex items-center justify-between gap-4 text-xs mb-1">
                                        <span style={{ color: pld.stroke || pld.fill }}>{pld.name}:</span>
                                        <span className="font-mono text-gray-200">
                                            {pld.dataKey.includes('Percentage') ? formatPercent(safeNum(pld.value)) : formatCurrency(safeNum(pld.value))}
                                        </span>
                                    </div>
                                    ))}
                                </div>
                                );
                            }
                            return null;
                        }} />
                        <Legend wrapperStyle={{ fontSize: '10px', color: '#9ca3af', paddingTop: '10px' }} />
                        
                        {/* Split Core Revenue Bars */}
                        <Bar yAxisId="left" stackId="revenue" dataKey="splitMainRevenue" name="Main Rev + Fees" fill="#3b82f6" barSize={20} isAnimationActive={false} activeBar={{ stroke: '#fff', strokeWidth: 1, fillOpacity: 0.9 }} />
                        <Bar yAxisId="left" stackId="revenue" dataKey="splitCateringRevenue" name="Catering" fill="#8b5cf6" barSize={20} isAnimationActive={false} activeBar={{ stroke: '#fff', strokeWidth: 1, fillOpacity: 0.9 }} />
                        
                        <Bar yAxisId="left" stackId="revenue" dataKey="gygCateringRevenue" name="GYG Sales" fill="#ec4899" barSize={20} isAnimationActive={false} activeBar={{ stroke: '#fff', strokeWidth: 1, fillOpacity: 0.9 }} />
                        <Bar yAxisId="left" stackId="revenue" dataKey="revoluteRevenue" name="Revolute Sales" fill="#14b8a6" radius={[4, 4, 0, 0]} barSize={20} isAnimationActive={false} activeBar={{ stroke: '#fff', strokeWidth: 1, fillOpacity: 0.9 }} />
                        
                        <Bar yAxisId="left" stackId="cost" dataKey="totalLogisticCost" name="Total Cost" fill="#ef4444" radius={[4, 4, 0, 0]} barSize={20} isAnimationActive={false} activeBar={{ stroke: '#fff', strokeWidth: 1, fillOpacity: 0.9 }} />
                        
                        <Line yAxisId="right" type="monotone" dataKey="logisticCostPercentage" name="Overall Cost %" stroke="#8b5cf6" strokeWidth={2} dot={{r: 2, fill: "#8b5cf6"}} activeDot={{ r: 6, stroke: '#fff', strokeWidth: 2 }} isAnimationActive={false} />
                    </ComposedChart>
                </ResponsiveContainer>
            </ChartCard>

            <ChartCard title="Dispatcher Cost Trends">
                 <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0} debounce={100}>
                    <BarChart data={aggregatedData} margin={{ top: 20, right: 10, left: 0, bottom: 0 }}>
                        <CartesianGrid stroke="#6b7280" strokeDasharray="3 3" vertical={false} strokeOpacity={0.4} />
                        <XAxis dataKey="date" type="category" stroke="#9ca3af" fontSize={10} tickLine={false} axisLine={false} />
                        <YAxis stroke="#9ca3af" fontSize={10} tickLine={false} axisLine={false} tickFormatter={axisCurrencyFormatter} width={35} domain={[0, dispatcherMax]} />
                        <Tooltip cursor={{fill: 'rgba(255, 255, 255, 0.05)'}} contentStyle={{ backgroundColor: '#1f2937', borderColor: '#374151', color: '#f3f4f6' }} formatter={(value: number) => formatCurrency(safeNum(value))} />
                        <Legend wrapperStyle={{ fontSize: '10px', color: '#9ca3af', paddingTop: '10px' }} />
                        <Bar dataKey="aliTotal" name="Ali" stackId="a" fill="#22c55e" barSize={20} isAnimationActive={false} activeBar={{ stroke: '#fff', strokeWidth: 1, fillOpacity: 0.9 }} />
                        <Bar dataKey="packatorTotal" name="Packator" stackId="a" fill="#3b82f6" barSize={20} isAnimationActive={false} activeBar={{ stroke: '#fff', strokeWidth: 1, fillOpacity: 0.9 }} />
                        <Bar dataKey="samirTotal" name="Samir" stackId="a" fill="#f97316" barSize={20} isAnimationActive={false} activeBar={{ stroke: '#fff', strokeWidth: 1, fillOpacity: 0.9 }} />
                    </BarChart>
                </ResponsiveContainer>
            </ChartCard>

            <ChartCard title={`${viewMode === 'daily' ? 'Daily' : viewMode === 'weekly' ? 'Weekly' : 'Monthly'} Net Profit Trend`}>
                 <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0} debounce={100}>
                    <ComposedChart data={aggregatedData} margin={{ top: 20, right: 10, left: 0, bottom: 0 }}>
                        <CartesianGrid stroke="#6b7280" strokeDasharray="3 3" vertical={false} strokeOpacity={0.4} />
                        <XAxis dataKey="date" type="category" stroke="#9ca3af" fontSize={10} tickLine={false} axisLine={false} />
                        <YAxis stroke="#9ca3af" fontSize={10} tickLine={false} axisLine={false} tickFormatter={axisCurrencyFormatter} width={35} domain={[yAxisMinProfit, yAxisMaxProfit]} />
                        <Tooltip cursor={{fill: 'rgba(255, 255, 255, 0.05)'}} contentStyle={{ backgroundColor: '#1f2937', borderColor: '#374151', color: '#f3f4f6' }} formatter={(value: number) => formatCurrency(safeNum(value))} />
                        <Bar dataKey="netProfit" name="Net Profit" fill="#06b6d4" radius={[4, 4, 0, 0]} barSize={20} isAnimationActive={false} activeBar={{ stroke: '#fff', strokeWidth: 2 }}>
                                {aggregatedData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={safeNum(entry.netProfit) >= 0 ? '#06b6d4' : '#ef4444'} />
                                ))}
                        </Bar>
                    </ComposedChart>
                </ResponsiveContainer>
            </ChartCard>

            {aggregatedExpenseBreakdown.length > 0 && (
                <ChartCard title="Cost Driver Distribution">
                    <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0} debounce={100}>
                        <PieChart>
                            <Pie 
                                data={aggregatedExpenseBreakdown} 
                                cx="50%" 
                                cy="50%" 
                                innerRadius={60} 
                                outerRadius={80} 
                                paddingAngle={2}
                                dataKey="value" 
                                nameKey="name"
                                isAnimationActive={false}
                                label={({ cx, cy, midAngle, innerRadius, outerRadius, percent, name }) => {
                                    if (percent < 0.05) return null;
                                    const radius = outerRadius + 20;
                                    const x = cx + radius * Math.cos(-midAngle * (Math.PI / 180));
                                    const y = cy + radius * Math.sin(-midAngle * (Math.PI / 180));
                                    return (
                                        <text x={x} y={y} fill="#e5e7eb" textAnchor={x > cx ? 'start' : 'end'} dominantBaseline="central" fontSize={10}>
                                        {`${name}`}
                                        </text>
                                    );
                                }}
                            >
                                {aggregatedExpenseBreakdown.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} stroke="rgba(0,0,0,0)" />
                                ))}
                            </Pie>
                            <Tooltip formatter={(value) => formatCurrency(safeNum(value))} contentStyle={{ backgroundColor: '#1f2937', borderColor: '#374151', color: '#f3f4f6' }} />
                            <Legend wrapperStyle={{fontSize: "10px", color: "#e5e7eb"}} />
                        </PieChart>
                    </ResponsiveContainer>
                </ChartCard>
            )}
        </div>

        {/* UNIT ECONOMICS SECTION */}
        <div className="flex flex-col md:flex-row justify-between items-end md:items-center gap-4 border-t border-gray-700 pt-6">
            <h3 className="text-lg md:text-xl font-semibold text-white">Operational Trends & Unit Economics</h3>
            <div className="flex bg-gray-700/50 rounded-lg p-1">
                <button onClick={() => setUnitViewMode('daily')} className={`px-2 py-1 text-[10px] sm:text-xs font-bold rounded transition-colors ${unitViewMode === 'daily' ? 'bg-cyan-600 text-white' : 'text-gray-400 hover:text-white'}`}>Daily</button>
                <button onClick={() => setUnitViewMode('weekly')} className={`px-2 py-1 text-[10px] sm:text-xs font-bold rounded transition-colors ${unitViewMode === 'weekly' ? 'bg-cyan-600 text-white' : 'text-gray-400 hover:text-white'}`}>Weekly</button>
                <button onClick={() => setUnitViewMode('monthly')} className={`px-2 py-1 text-[10px] sm:text-xs font-bold rounded transition-colors ${unitViewMode === 'monthly' ? 'bg-cyan-600 text-white' : 'text-gray-400 hover:text-white'}`}>Monthly</button>
            </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 min-w-0">
             {/* Chart 1: Logistic Cost per Stop */}
             <ChartCard title="Logistic Cost per Stop Trend">
                <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0} debounce={100}>
                    <LineChart data={unitAggregatedData} margin={{ top: 20, right: 10, left: 0, bottom: 0 }}>
                        <CartesianGrid stroke="#6b7280" strokeDasharray="3 3" vertical={false} strokeOpacity={0.4} />
                        <XAxis dataKey="date" type="category" stroke="#9ca3af" fontSize={10} tickLine={false} axisLine={false} />
                        <YAxis stroke="#9ca3af" fontSize={10} tickLine={false} axisLine={false} tickFormatter={axisCurrencyFormatter} width={35} />
                        <Tooltip contentStyle={{ backgroundColor: '#1f2937', borderColor: '#374151', color: '#f3f4f6' }} formatter={(value: number) => formatCurrency(safeNum(value))} />
                        <Legend wrapperStyle={{ fontSize: '10px', color: '#9ca3af', paddingTop: '10px' }} />
                        
                        <Line type="monotone" dataKey="logisticCostPerStop" name="Cost / Stop" stroke="#ef4444" strokeWidth={2} dot={false} activeDot={{ r: 6, stroke: '#fff', strokeWidth: 2 }} isAnimationActive={false} />
                    </LineChart>
                </ResponsiveContainer>
            </ChartCard>

             {/* Chart 2: Logistic Cost per Dish */}
             <ChartCard title="Logistic Cost per Dish Trend">
                <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0} debounce={100}>
                    <LineChart data={unitAggregatedData} margin={{ top: 20, right: 10, left: 0, bottom: 0 }}>
                        <CartesianGrid stroke="#6b7280" strokeDasharray="3 3" vertical={false} strokeOpacity={0.4} />
                        <XAxis dataKey="date" type="category" stroke="#9ca3af" fontSize={10} tickLine={false} axisLine={false} />
                        <YAxis stroke="#9ca3af" fontSize={10} tickLine={false} axisLine={false} tickFormatter={axisCurrencyFormatter} width={35} domain={[0, 1.5]} />
                        <Tooltip contentStyle={{ backgroundColor: '#1f2937', borderColor: '#374151', color: '#f3f4f6' }} />
                        <Legend wrapperStyle={{ fontSize: '10px', color: '#9ca3af', paddingTop: '10px' }} />
                        
                        <Line type="monotone" dataKey="logisticCostPerDish" name="Cost / Dish" stroke="#3b82f6" strokeWidth={2} dot={false} activeDot={{ r: 6, stroke: '#fff', strokeWidth: 2 }} isAnimationActive={false} />
                    </LineChart>
                </ResponsiveContainer>
            </ChartCard>

            {/* Chart 3: Operational Metrics */}
            <div className="lg:col-span-2">
                <ChartCard title="Operational Metrics (Stops & Meals/Stop)">
                    <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0} debounce={100}>
                        <ComposedChart data={unitAggregatedData} margin={{ top: 20, right: 10, left: 0, bottom: 0 }}>
                            <CartesianGrid stroke="#6b7280" strokeDasharray="3 3" vertical={false} strokeOpacity={0.4} />
                            <XAxis dataKey="date" type="category" stroke="#9ca3af" fontSize={10} tickLine={false} axisLine={false} />
                            <YAxis yAxisId="left" stroke="#9ca3af" fontSize={10} tickLine={false} axisLine={false} width={35} />
                            <YAxis yAxisId="right" orientation="right" stroke="#f59e0b" fontSize={10} tickLine={false} axisLine={false} width={35} />
                            
                            <Tooltip contentStyle={{ backgroundColor: '#1f2937', borderColor: '#374151', color: '#f3f4f6' }} />
                            <Legend wrapperStyle={{ fontSize: '10px', color: '#9ca3af', paddingTop: '10px' }} />
                            
                            <Bar yAxisId="left" dataKey="totalStops" name="Total Stops" fill="#14b8a6" barSize={30} isAnimationActive={false} activeBar={{ stroke: '#fff', strokeWidth: 2, fillOpacity: 0.8 }} />
                            <Line yAxisId="right" type="monotone" dataKey="mealsPerStop" name="Meals / Stop" stroke="#f59e0b" strokeWidth={2} dot={false} activeDot={{ r: 6, stroke: '#fff', strokeWidth: 2 }} isAnimationActive={false} />
                        </ComposedChart>
                    </ResponsiveContainer>
                </ChartCard>
            </div>
        </div>
    </div>
  );
};