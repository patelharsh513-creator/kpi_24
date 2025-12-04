

import React, { useState } from 'react';
import { BellabonaRecord, BellabonaKitchen, KitchenMetrics } from './types';
import { Save, Pencil } from 'lucide-react';

interface BellabonaDataEntryProps {
    record: Partial<BellabonaRecord>;
    lastWeekRecord?: BellabonaRecord;
    onInputChange: (kitchen: BellabonaKitchen, field: keyof KitchenMetrics, value: number) => void;
    onDateChange: (date: string) => void;
    onSave: () => void;
}

// Helper to format currency for display
const formatCurrency = (val: number) => new Intl.NumberFormat('en-IE', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(val || 0);
const formatPercent = (val: number) => new Intl.NumberFormat('en-US', { style: 'percent', minimumFractionDigits: 1 }).format(val || 0);

// NEW: Smart Math Input Component
// Allows entering formulas like "=1+2" or "10+5" and evaluates them on blur
const SmartMathInput = ({ 
    value, 
    onChange, 
    placeholder, 
    className 
}: { 
    value: number, 
    onChange: (val: number) => void, 
    placeholder?: string,
    className?: string 
}) => {
    const [text, setText] = useState('');
    const [isFocused, setIsFocused] = useState(false);

    // Sync state with prop when not editing
    React.useEffect(() => {
        if (!isFocused) {
            // If value is 0, show empty string to allow cleaner input, unless intentional 0
            setText(value === 0 || value === undefined ? '' : value.toString());
        }
    }, [value, isFocused]);

    const handleBlur = () => {
        setIsFocused(false);
        let expr = text.trim();
        if (!expr) {
            onChange(0);
            return;
        }

        // Allow starting with '=' like Excel
        if (expr.startsWith('=')) {
            expr = expr.substring(1);
        }

        // Basic Math Evaluation
        try {
            // Security: Only allow numbers and basic math operators
            if (/^[0-9+\-*/.()\s]+$/.test(expr)) {
                // eslint-disable-next-line no-new-func
                const result = Function('"use strict";return (' + expr + ')')();
                if (typeof result === 'number' && !isNaN(result)) {
                    onChange(result);
                    setText(result.toString());
                    return;
                }
            }
        } catch (e) {
            console.warn("Invalid Math Expression", e);
        }

        // Fallback to simple parse
        const num = parseFloat(expr);
        onChange(isNaN(num) ? 0 : num);
        setText(isNaN(num) ? '' : num.toString());
    };

    return (
        <input
            type="text"
            inputMode="decimal"
            placeholder={placeholder}
            value={text}
            onChange={(e) => setText(e.target.value)}
            onFocus={() => setIsFocused(true)}
            onBlur={handleBlur}
            onKeyDown={(e) => {
                if(e.key === 'Enter') {
                    (e.target as HTMLInputElement).blur();
                }
            }}
            className={className}
        />
    );
};

// Reusable Editable Input Component (For Expected Values)
const EditableInput = ({ 
    value, 
    onChange, 
    placeholder = "Exp",
    isTotal = false 
}: { 
    value: number, 
    onChange?: (val: number) => void, 
    placeholder?: string,
    isTotal?: boolean 
}) => {
    const [isEditing, setIsEditing] = useState(false);

    if (isTotal) {
         return (
            <div className="text-right text-gray-500 font-mono text-xs pr-2 h-[24px] flex items-center justify-end italic bg-gray-900/30 rounded">
                Exp: {formatCurrency(value)}
            </div>
        );
    }

    if (isEditing) {
        return (
            <input 
                type="number"
                autoFocus
                value={value || ''}
                onBlur={() => setIsEditing(false)}
                onKeyDown={(e) => e.key === 'Enter' && setIsEditing(false)}
                onChange={(e) => onChange && onChange(parseFloat(e.target.value))}
                className="w-full h-[24px] bg-gray-600 text-white text-xs text-right rounded px-1 outline-none border border-cyan-500"
            />
        );
    }

    return (
        <div 
            onClick={() => setIsEditing(true)}
            className="group cursor-pointer text-right text-gray-400 font-mono text-xs pr-1 h-[24px] flex items-center justify-end hover:text-white transition-colors"
        >
            <span className="opacity-0 group-hover:opacity-100 mr-2"><Pencil className="w-3 h-3 text-cyan-500" /></span>
            <span>Exp: {value ? formatCurrency(value) : '-'}</span>
        </div>
    );
};

export const BellabonaDataEntry: React.FC<BellabonaDataEntryProps> = ({ record, lastWeekRecord, onInputChange, onDateChange, onSave }) => {
    
    // Calculate Totals for the 4th Column
    const getTotal = (field: keyof KitchenMetrics) => {
        return (record.berlin?.[field] || 0) + (record.munich?.[field] || 0) + (record.koln?.[field] || 0);
    };

    const renderKitchenColumn = (kitchen: BellabonaKitchen | 'total', label: string, colorClass: string) => {
        const isTotal = kitchen === 'total';
        const metrics = isTotal ? null : record[kitchen as BellabonaKitchen] || {} as KitchenMetrics;
        
        // --- CALCULATE EXPECTED TOTAL & DELTA ---
        let totalExpected = 0;
        if (isTotal) {
            totalExpected = getTotal('expectedMainBusiness') + getTotal('expectedServiceFee') + getTotal('expectedCateringCharges');
        } else if (metrics) {
            totalExpected = (metrics.expectedMainBusiness || 0) + (metrics.expectedServiceFee || 0) + (metrics.expectedCateringCharges || 0);
        }

        const currentTotalRevenue = isTotal ? (record.totalGlobalRevenue || 0) : (metrics?.totalRevenue || 0);
        
        // Delta Formula: (Actual / Expected) - 1
        let delta = 0;
        if (totalExpected > 0) {
            delta = (currentTotalRevenue / totalExpected) - 1;
        }


        // --- WoW CALCULATION (REVENUE) ---
        let wowGrowthRev = 0;
        let wowDiffRev = 0;
        let showGrowthRev = false;
        
        // --- WoW CALCULATION (DISHES) ---
        let wowGrowthDish = 0;
        let wowDiffDish = 0;
        let showGrowthDish = false;

        if (lastWeekRecord) {
            // Get Previous Values
            let prevRev = 0;
            let prevDish = 0;
            let currRev = 0;
            let currDish = 0;

            if (isTotal) {
                prevRev = lastWeekRecord.totalGlobalRevenue || 0;
                // Sum dishes for total
                prevDish = (lastWeekRecord.berlin?.dishesOrdered || 0) + (lastWeekRecord.munich?.dishesOrdered || 0) + (lastWeekRecord.koln?.dishesOrdered || 0);
                
                currRev = record.totalGlobalRevenue || 0;
                currDish = getTotal('dishesOrdered');
            } else {
                const prevMetrics = lastWeekRecord[kitchen as BellabonaKitchen];
                if (prevMetrics) {
                    prevRev = prevMetrics.totalRevenue || 0;
                    prevDish = prevMetrics.dishesOrdered || 0;
                }
                currRev = metrics?.totalRevenue || 0;
                currDish = metrics?.dishesOrdered || 0;
            }

            // Calculate Revenue Growth
            if (prevRev > 0) {
                wowDiffRev = currRev - prevRev;
                wowGrowthRev = wowDiffRev / prevRev;
                showGrowthRev = true;
            }

            // Calculate Dish Growth
            if (prevDish > 0) {
                wowDiffDish = currDish - prevDish;
                wowGrowthDish = wowDiffDish / prevDish;
                showGrowthDish = true;
            }
        }
        
        // --- COGS % Calculation for Total ---
        // Formula: COGS / (Kitchen Revenue + Service Fee)
        let totalCogsPercent = 0;
        if (isTotal) {
             const base = getTotal('mainBusiness') + getTotal('serviceFee');
             const cogs = getTotal('cogs');
             totalCogsPercent = base > 0 ? cogs / base : 0;
        }

        return (
            <div className="flex flex-col gap-2 min-w-[120px]">
                <h4 className={`text-center font-bold uppercase tracking-wider mb-2 ${colorClass} h-8 flex items-center justify-center`}>{label}</h4>
                
                {/* Price / Dish */}
                {isTotal ? (
                     <div className="h-[38px]"></div> // Spacer
                ) : (
                    <SmartMathInput 
                        placeholder="0.00"
                        value={metrics!.pricePerDish || 0}
                        onChange={(val) => onInputChange(kitchen as BellabonaKitchen, 'pricePerDish', val)}
                        className="w-full bg-gray-700 border border-gray-600 rounded p-2 text-white text-sm text-right focus:ring-1 focus:ring-cyan-500 h-[38px]"
                    />
                )}
                
                {/* Price / Dish (With Fee) */}
                {isTotal ? (
                     <div className="h-[38px]"></div> // Spacer
                ) : (
                    <SmartMathInput 
                        placeholder="0.00"
                        value={metrics!.pricePerDishWithFee || 0}
                        onChange={(val) => onInputChange(kitchen as BellabonaKitchen, 'pricePerDishWithFee', val)}
                        className="w-full bg-gray-700 border border-gray-600 rounded p-2 text-white text-sm text-right focus:ring-1 focus:ring-cyan-500 h-[38px]"
                    />
                )}

                {/* Dishes Ordered */}
                {isTotal ? (
                     <div className="bg-gray-900/50 p-2 rounded text-right font-bold text-gray-300 border border-gray-700 h-[38px] flex items-center justify-end">
                        {getTotal('dishesOrdered')}
                     </div>
                ) : (
                    <SmartMathInput 
                        placeholder="0"
                        value={metrics!.dishesOrdered || 0}
                        onChange={(val) => onInputChange(kitchen as BellabonaKitchen, 'dishesOrdered', val)}
                        className="w-full bg-gray-700 border border-gray-600 rounded p-2 text-white text-sm text-right focus:ring-1 focus:ring-cyan-500 h-[38px]"
                    />
                )}

                {/* WoW Growth (DISHES) */}
                <div className={`text-right text-xs font-mono pr-1 h-[24px] flex items-center justify-end ${wowDiffDish >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                    {showGrowthDish ? (
                        <span>
                            {wowDiffDish > 0 ? '+' : ''}{wowDiffDish} <span className="opacity-70">({formatPercent(wowGrowthDish)})</span>
                        </span>
                    ) : '-'}
                </div>
                
                {/* Main Dish Revenue (Manual Input, previously Dish Revenue) */}
                {isTotal ? (
                    <div className="bg-gray-900/50 p-2 rounded text-right font-bold text-gray-300 border border-gray-700 h-[38px] flex items-center justify-end">
                        {formatCurrency(getTotal('mainDishRevenue'))}
                    </div>
                ) : (
                    <SmartMathInput 
                        placeholder="0"
                        value={metrics!.mainDishRevenue || 0}
                        onChange={(val) => onInputChange(kitchen as BellabonaKitchen, 'mainDishRevenue', val)}
                        className="w-full bg-gray-700 border border-gray-600 rounded p-2 text-white text-sm text-right focus:ring-1 focus:ring-cyan-500 h-[38px]"
                    />
                )}

                {/* Kitchen Revenue (Manual) */}
                {isTotal ? (
                    <div className="bg-gray-800/50 p-2 rounded text-right font-semibold text-blue-200 border border-gray-700/50 h-[38px] flex items-center justify-end">
                        {formatCurrency(getTotal('mainBusiness'))}
                    </div>
                ) : (
                    <SmartMathInput 
                        placeholder="0"
                        value={metrics!.mainBusiness || 0}
                        onChange={(val) => onInputChange(kitchen as BellabonaKitchen, 'mainBusiness', val)}
                        className="w-full bg-gray-700 border border-gray-600 rounded p-2 text-white text-sm text-right focus:ring-1 focus:ring-cyan-500 h-[38px]"
                    />
                )}
                {/* Kitchen Revenue (Expected) */}
                <EditableInput 
                    value={isTotal ? getTotal('expectedMainBusiness') : (metrics!.expectedMainBusiness || 0)}
                    onChange={(val) => !isTotal && onInputChange(kitchen as BellabonaKitchen, 'expectedMainBusiness', val)}
                    isTotal={isTotal}
                />

                 {/* Service Fee Revenue (Actual) */}
                 {isTotal ? (
                    <div className="bg-gray-800/50 p-2 rounded text-right font-semibold text-purple-200 border border-gray-700/50 h-[38px] flex items-center justify-end">
                        {formatCurrency(getTotal('serviceFee'))}
                    </div>
                 ) : (
                    <SmartMathInput 
                        placeholder="0"
                        value={metrics!.serviceFee || 0}
                        onChange={(val) => onInputChange(kitchen as BellabonaKitchen, 'serviceFee', val)}
                        className="w-full bg-gray-700 border border-gray-600 rounded p-2 text-white text-sm text-right focus:ring-1 focus:ring-cyan-500 h-[38px]"
                    />
                 )}
                 {/* Service Fee (Expected) */}
                <EditableInput 
                    value={isTotal ? getTotal('expectedServiceFee') : (metrics!.expectedServiceFee || 0)}
                    onChange={(val) => !isTotal && onInputChange(kitchen as BellabonaKitchen, 'expectedServiceFee', val)}
                    isTotal={isTotal}
                />

                {/* Catering Charges (Actual) */}
                {isTotal ? (
                     <div className="bg-gray-900/50 p-2 rounded text-right font-bold text-gray-300 border border-gray-700 h-[38px] flex items-center justify-end">
                        {formatCurrency(getTotal('cateringCharges'))}
                     </div>
                ) : (
                    <SmartMathInput 
                        placeholder="0"
                        value={metrics!.cateringCharges || 0}
                        onChange={(val) => onInputChange(kitchen as BellabonaKitchen, 'cateringCharges', val)}
                        className="w-full bg-gray-700 border border-gray-600 rounded p-2 text-white text-sm text-right focus:ring-1 focus:ring-cyan-500 h-[38px]"
                    />
                )}
                 {/* Catering (Expected) */}
                 <EditableInput 
                    value={isTotal ? getTotal('expectedCateringCharges') : (metrics!.expectedCateringCharges || 0)}
                    onChange={(val) => !isTotal && onInputChange(kitchen as BellabonaKitchen, 'expectedCateringCharges', val)}
                    isTotal={isTotal}
                />

                {/* Total Revenue */}
                <div className="bg-gray-900 p-2 rounded text-right font-bold text-green-400 border border-gray-600 h-[38px] flex items-center justify-end shadow-inner mt-2">
                    {formatCurrency(currentTotalRevenue)}
                </div>

                {/* Total Expected Revenue (Calculated) */}
                <div className="text-right text-gray-500 font-mono text-xs pr-2 h-[24px] flex items-center justify-end italic bg-gray-900/30 rounded mt-1">
                    Exp: {formatCurrency(totalExpected)}
                </div>

                {/* WoW Growth (REVENUE) */}
                <div className={`text-right text-xs font-mono pr-1 h-[24px] flex items-center justify-end ${wowDiffRev >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                    {showGrowthRev ? (
                         <span>
                            {wowDiffRev > 0 ? '+' : ''}{formatCurrency(wowDiffRev)} <span className="opacity-70">({formatPercent(wowGrowthRev)})</span>
                        </span>
                    ) : '-'}
                </div>
                
                {/* Delta % */}
                 <div className={`text-right text-xs font-bold font-mono pr-1 h-[24px] flex items-center justify-end ${delta >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                    {totalExpected > 0 ? formatPercent(delta) : '-'}
                </div>

                <div className="my-1 border-t border-gray-700"></div>

                {/* COGS */}
                {isTotal ? (
                     <div className="bg-gray-900/50 p-2 rounded text-right font-bold text-gray-300 border border-gray-700 h-[38px] flex items-center justify-end">
                        {formatCurrency(getTotal('cogs'))}
                     </div>
                ) : (
                    <SmartMathInput 
                        placeholder="0"
                        value={metrics!.cogs || 0}
                        onChange={(val) => onInputChange(kitchen as BellabonaKitchen, 'cogs', val)}
                        className="w-full bg-gray-700 border border-gray-600 rounded p-2 text-white text-sm text-right focus:ring-1 focus:ring-cyan-500 h-[38px]"
                    />
                )}
                
                {/* COGS % */}
                 <div className="text-right text-xs text-yellow-300 font-mono pr-1 h-[24px] flex items-center justify-end">
                    {/* Updated to use totalCogsPercent calculated above (excluding catering) for Total col, or metrics value for individual col */}
                    {formatPercent(isTotal ? totalCogsPercent : (metrics!.cogsPercentage || 0))}
                </div>

                <div className="my-1 border-t border-gray-700"></div>

                {/* Leftovers Count */}
                {isTotal ? (
                     <div className="bg-gray-900/50 p-2 rounded text-right font-bold text-gray-300 border border-gray-700 h-[38px] flex items-center justify-end">
                        {getTotal('leftoverCount')}
                     </div>
                ) : (
                    <SmartMathInput 
                        placeholder="0"
                        value={metrics!.leftoverCount || 0}
                        onChange={(val) => onInputChange(kitchen as BellabonaKitchen, 'leftoverCount', val)}
                        className="w-full bg-gray-700 border border-gray-600 rounded p-2 text-white text-sm text-right focus:ring-1 focus:ring-cyan-500 h-[38px]"
                    />
                )}
                
                {/* Leftover % */}
                <div className="text-right text-xs text-blue-300 font-mono pr-1 h-[24px] flex items-center justify-end">
                    {/* Formula: 'leftoverCount' / 'DishesOrdered' */}
                    {isTotal ? (
                        formatPercent(getTotal('dishesOrdered') > 0 ? getTotal('leftoverCount') / getTotal('dishesOrdered') : 0)
                    ) : (
                        formatPercent(metrics!.leftoverPercentage || 0)
                    )}
                </div>
            </div>
        );
    };

    return (
        <div className="bg-gray-800 p-4 md:p-6 rounded-lg border border-gray-700 shadow-lg">
             <div className="flex flex-col gap-4 mb-6">
                <div className="flex justify-between items-center">
                    <h2 className="text-lg font-bold text-white">Daily Bellabona Numbers</h2>
                    <div className="w-1/2 max-w-[180px]">
                        <input 
                            type="date" 
                            value={record.date || ''} 
                            onChange={(e) => onDateChange(e.target.value)}
                            className="w-full bg-gray-700 border border-gray-600 rounded p-2 text-white text-sm focus:ring-2 focus:ring-cyan-500 outline-none"
                        />
                    </div>
                </div>
                <button 
                    onClick={onSave}
                    className="flex items-center justify-center gap-2 bg-cyan-600 text-white px-4 py-2 rounded-md hover:bg-cyan-700 transition-colors font-semibold shadow-md w-full max-w-[200px] ml-auto"
                >
                    <Save className="w-4 h-4" />
                    Save All Kitchens
                </button>
            </div>

            {/* PARALLEL GRID LAYOUT */}
            <div className="grid grid-cols-[1.3fr_1fr_1fr_1fr_1fr] gap-2 md:gap-4 items-start overflow-x-auto min-w-[700px]">
                {/* Labels Column */}
                <div className="flex flex-col gap-2 pt-[50px] min-w-[140px]">
                     <div className="h-[38px] flex items-center text-gray-400 text-sm">Price / Dish (No Fee)</div>
                     <div className="h-[38px] flex items-center text-gray-400 text-sm">Price / Dish (w/ Fee)</div>
                     <div className="h-[38px] flex items-center text-gray-400 text-sm font-semibold text-white">Dishes Ordered</div>
                     {/* WoW Dishes Label */}
                     <div className="h-[24px] flex items-center text-gray-500 text-xs italic justify-end">WoW (Dishes)</div>
                     
                     {/* NEW ROW: Main Dish Revenue (Manual) - Renamed from Dish Revenue */}
                     <div className="h-[38px] flex items-center text-gray-400 text-sm">Main Dish Revenue</div>

                     <div className="h-[38px] flex items-center text-gray-400 text-sm">Kitchen Revenue</div>
                     <div className="h-[24px] flex items-center text-gray-500 text-xs italic justify-end">Expected</div>
                     
                     <div className="h-[38px] flex items-center text-gray-400 text-sm">Service Fee Revenue</div>
                     <div className="h-[24px] flex items-center text-gray-500 text-xs italic justify-end">Expected</div>
                     
                     <div className="h-[38px] flex items-center text-gray-400 text-sm">Catering Charges</div>
                     <div className="h-[24px] flex items-center text-gray-500 text-xs italic justify-end">Expected</div>
                     
                     <div className="h-[38px] flex items-center text-white font-bold text-sm bg-gray-700/30 rounded pl-2 mt-2">Total Revenue</div>
                     <div className="h-[24px] flex items-center text-gray-500 text-xs italic justify-end">Expected</div>
                     <div className="h-[24px] flex items-center text-gray-500 text-xs italic justify-end">WoW (Rev)</div>
                     
                     {/* Delta % (NEW LABEL) */}
                     <div className="h-[24px] flex items-center text-gray-500 text-xs italic justify-end">Delta %</div>

                     <div className="my-1 h-px"></div>
                     
                     <div className="h-[38px] flex items-center text-gray-400 text-sm">COGS (€)</div>
                     <div className="h-[24px] flex items-center text-gray-500 text-xs italic justify-end">COGS % of Rev</div>

                     <div className="my-1 h-px"></div>

                     <div className="h-[38px] flex items-center text-gray-400 text-sm">Leftover Count</div>
                     <div className="h-[24px] flex items-center text-gray-500 text-xs italic justify-end">% of Dishes Ordered</div>
                </div>

                {/* Data Columns - Reordered: Munich, Berlin, Köln */}
                {renderKitchenColumn('munich', 'Munich', 'text-orange-400')}
                {renderKitchenColumn('berlin', 'Berlin', 'text-blue-400')}
                {renderKitchenColumn('koln', 'Köln', 'text-green-400')}
                {/* 4th Column: Global Sum */}
                {renderKitchenColumn('total', 'Total', 'text-white')}
            </div>
        </div>
    );
};
