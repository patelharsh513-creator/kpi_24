
import React from 'react';
import { DailyInputs, CalculatedData, PeriodTotals } from '../types';
import { Save, DollarSign, Calendar, Calculator } from 'lucide-react';

interface DataEntryFormProps {
    inputs: Partial<DailyInputs>;
    calculated: CalculatedData;
    periodTotals: PeriodTotals; // Use the updated PeriodTotals from types.ts
    onInputChange: (field: keyof DailyInputs, value: string | number) => void;
    onSave: () => void;
}

const InputField: React.FC<{label: string; field: keyof DailyInputs; value: any; onChange: DataEntryFormProps['onInputChange']; type?: string, isDate?: boolean}> = 
    ({ label, field, value, onChange, type = 'number', isDate = false }) => (
    <div className="flex items-center">
        <label htmlFor={field} className="w-2/5 text-xs sm:text-sm text-gray-400 truncate pr-2" title={label}>{label}</label>
        <input
            id={field}
            type={type}
            value={value || (isDate ? '' : (type === 'number' ? 0 : ''))}
            onChange={(e) => onChange(field, isDate || type !== 'number' ? e.target.value : parseFloat(e.target.value) || 0)}
            className="w-3/5 p-1.5 sm:p-2 bg-gray-700 border border-gray-600 rounded-md text-white text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500 min-w-0"
        />
    </div>
);

const CalculatedField: React.FC<{label: string; value: string; className?: string}> = ({ label, value, className = '' }) => (
    <div className="flex items-center py-2">
        <span className="w-2/5 text-xs sm:text-sm text-gray-400 truncate pr-2" title={label}>{label}</span>
        <span className={`w-3/5 font-bold text-sm sm:text-base md:text-lg truncate ${className || 'text-yellow-300'}`}>{value}</span>
    </div>
);

const FormSection: React.FC<{title: string; children: React.ReactNode; gridCols?: string}> = ({ title, children, gridCols = 'md:grid-cols-2' }) => (
    <div className="mb-6">
        <h3 className="text-base sm:text-lg font-semibold text-white border-b border-gray-700 pb-2 mb-4">{title}</h3>
        <div className={`grid grid-cols-1 ${gridCols} gap-x-6 gap-y-4`}>
            {children}
        </div>
    </div>
);

const DispatcherInputGroup: React.FC<{
    name: string;
    stopsField: keyof DailyInputs;
    pickupsField?: keyof DailyInputs;
    cost: number;
    inputs: Partial<DailyInputs>;
    onInputChange: DataEntryFormProps['onInputChange'];
    formatCurrency: (value: number) => string;
    stopsLabel?: string;
    pickupsLabel?: string;
    highlightColor?: string; // New prop for custom color
}> = ({ name, stopsField, pickupsField, cost, inputs, onInputChange, formatCurrency, stopsLabel = "Stops", pickupsLabel = "Pickups", highlightColor = "text-yellow-300" }) => (
    <div className="bg-gray-700/50 p-2 sm:p-3 rounded-md grid grid-cols-3 gap-1 sm:gap-3 items-center">
         <span className="font-semibold text-gray-300 text-xs sm:text-sm md:text-base col-span-3 md:col-span-1 truncate">{name}</span>
         <div className="col-span-3 md:col-span-2 grid grid-cols-3 gap-1 sm:gap-3">
            <input 
                title={stopsLabel} 
                placeholder={stopsLabel} 
                type="number" 
                value={inputs[stopsField] || 0} 
                onChange={(e) => onInputChange(stopsField, parseFloat(e.target.value) || 0)} 
                className="w-full p-1 sm:p-2 bg-gray-800 border border-gray-600 rounded-md text-white text-xs sm:text-sm focus:outline-none focus:ring-1 focus:ring-cyan-500 min-w-0" 
            />
            
            {pickupsField ? (
                <input 
                    title={pickupsLabel} 
                    placeholder={pickupsLabel} 
                    type="number" 
                    value={inputs[pickupsField] || 0} 
                    onChange={(e) => onInputChange(pickupsField, parseFloat(e.target.value) || 0)} 
                    className="w-full p-1 sm:p-2 bg-gray-800 border border-gray-600 rounded-md text-white text-xs sm:text-sm focus:outline-none focus:ring-1 focus:ring-cyan-500 min-w-0" 
                />
            ) : (
                <div className="p-1 sm:p-2 bg-gray-800/20 rounded-md"></div>
            )}

            <div className={`flex items-center justify-center p-1 sm:p-2 bg-gray-800/50 rounded-md font-bold text-xs sm:text-sm md:text-base truncate min-w-0 ${highlightColor}`}>
                {formatCurrency(cost)}
            </div>
         </div>
    </div>
);

export const DataEntryForm: React.FC<DataEntryFormProps> = ({ inputs, calculated, periodTotals, onInputChange, onSave }) => {
    // Update to Euro and 2 decimals
    const formatCurrency = (value: number) => new Intl.NumberFormat('en-IE', { style: 'currency', currency: 'EUR', minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(value);
    const formatPercent = (value: number) => new Intl.NumberFormat('en-US', { style: 'percent', minimumFractionDigits: 1 }).format(value);
    const formatNumber = (value: number) => new Intl.NumberFormat('en-US', { maximumFractionDigits: 2 }).format(value);

    return (
        <div className="bg-gray-800 rounded-lg p-4 sm:p-6 shadow-lg">
            <div className="flex flex-col gap-4 mb-6">
                <div className="flex justify-between items-center">
                    <h2 className="text-lg sm:text-xl font-bold text-white">Daily Data Entry</h2>
                    <div className="w-full max-w-[200px]">
                        <InputField label="Date" field="date" value={inputs.date} onChange={onInputChange} type="date" isDate={true} />
                    </div>
                </div>
                {/* Save Button Moved Here (Top) */}
                <button
                    onClick={onSave}
                    className="flex items-center justify-center gap-2 bg-cyan-600 text-white px-6 py-2 rounded-md hover:bg-cyan-700 transition-colors font-semibold shadow-md w-full max-w-[200px] ml-auto"
                >
                    <Save className="w-5 h-5" />
                    Save Daily Record
                </button>
            </div>

            <FormSection title="Main Inputs">
                <InputField label="Total Revenue" field="totalRevenue" value={inputs.totalRevenue} onChange={onInputChange} />
                <InputField label="Service Fee" field="serviceFee" value={inputs.serviceFee} onChange={onInputChange} />
                <InputField label="Catering" field="catering" value={inputs.catering} onChange={onInputChange} />
                <InputField label="Meals" field="meals" value={inputs.meals} onChange={onInputChange} />
                <InputField label="Add-ons" field="addOns" value={inputs.addOns} onChange={onInputChange} />
                {/* NEW: GYG Catering and Revolute Revenue */}
                <InputField label="GYG Catering Sales" field="gygCateringRevenue" value={inputs.gygCateringRevenue} onChange={onInputChange} />
                <InputField label="Revolute Sales" field="revoluteRevenue" value={inputs.revoluteRevenue} onChange={onInputChange} />
                <CalculatedField label="Addons / Meal %" value={formatPercent(calculated.addonsMealsPercentage)} />
            </FormSection>

            <FormSection title="Dispatching Costs">
                {/* PACKATOR SPECIAL SECTION */}
                <div className="bg-gray-700/50 p-2 sm:p-4 rounded-md border border-gray-600 col-span-1 md:col-span-2">
                    <div className="flex justify-between items-center mb-2">
                        <span className="font-bold text-cyan-300 text-base sm:text-lg">Packator Fleet</span>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-2 sm:gap-4">
                        {/* Headers */}
                        <div className="hidden md:block text-xs text-gray-400 font-semibold">Driver</div>
                        <div className="hidden md:block text-xs text-gray-400 font-semibold">Stops</div>
                        <div className="hidden md:block text-xs text-gray-400 font-semibold">Status</div>

                        {/* Packator 1 */}
                        <div className="flex items-center text-xs sm:text-sm text-gray-300">Packator 1</div>
                        <input 
                            type="number" 
                            placeholder="Stops"
                            value={inputs.packator1Stops || 0} 
                            onChange={(e) => onInputChange('packator1Stops', parseFloat(e.target.value) || 0)} 
                            className="p-1 sm:p-2 bg-gray-800 border border-gray-600 rounded-md text-white text-xs sm:text-sm focus:outline-none focus:ring-1 focus:ring-cyan-500 w-full min-w-0" 
                        />
                        <div className="text-[10px] sm:text-xs flex items-center text-gray-400 truncate">
                            {inputs.packator1Stops ? <span className="text-green-400 truncate">Active (+€15)</span> : <span>Inactive</span>}
                        </div>

                        {/* Packator 2 */}
                        <div className="flex items-center text-xs sm:text-sm text-gray-300">Packator 2</div>
                        <input 
                            type="number" 
                            placeholder="Stops"
                            value={inputs.packator2Stops || 0} 
                            onChange={(e) => onInputChange('packator2Stops', parseFloat(e.target.value) || 0)} 
                            className="p-1 sm:p-2 bg-gray-800 border border-gray-600 rounded-md text-white text-xs sm:text-sm focus:outline-none focus:ring-1 focus:ring-cyan-500 w-full min-w-0" 
                        />
                        <div className="text-[10px] sm:text-xs flex items-center text-gray-400 truncate">
                            {inputs.packator2Stops ? <span className="text-green-400 truncate">Active (+€15)</span> : <span>Inactive</span>}
                        </div>

                        {/* Packator 3 */}
                        <div className="flex items-center text-xs sm:text-sm text-gray-300">Packator 3</div>
                        <input 
                            type="number" 
                            placeholder="Stops"
                            value={inputs.packator3Stops || 0} 
                            onChange={(e) => onInputChange('packator3Stops', parseFloat(e.target.value) || 0)} 
                            className="p-1 sm:p-2 bg-gray-800 border border-gray-600 rounded-md text-white text-xs sm:text-sm focus:outline-none focus:ring-1 focus:ring-cyan-500 w-full min-w-0" 
                        />
                        <div className="text-[10px] sm:text-xs flex items-center text-gray-400 truncate">
                            {inputs.packator3Stops ? <span className="text-green-400 truncate">Active (+€15)</span> : <span>Inactive</span>}
                        </div>
                    </div>

                    <div className="mt-4 pt-3 border-t border-gray-600 grid grid-cols-2 gap-4">
                         <div className="min-w-0">
                            <label className="text-xs text-gray-400 mb-1 block truncate">Total Service Cost</label>
                            <div className="text-yellow-300 font-bold text-sm sm:text-base md:text-lg truncate">
                                {formatCurrency(calculated.packatorStopCost)}
                            </div>
                         </div>
                         <div className="min-w-0">
                            <label className="text-xs text-gray-400 mb-1 block truncate">Total Dispatch Cost (Ali)</label>
                            <div className="text-green-400 font-bold text-sm sm:text-base md:text-lg truncate">
                                {formatCurrency(calculated.packatorDispatchCost)}
                            </div>
                         </div>
                    </div>
                </div>

                <DispatcherInputGroup name="Samir" stopsField="samirStops" cost={calculated.samirCost} inputs={inputs} onInputChange={onInputChange} formatCurrency={formatCurrency} stopsLabel="Delivery Stops"/>
                <DispatcherInputGroup name="Jozef" stopsField="jozefStops" pickupsField="jozefPickups" cost={calculated.jozefCost} inputs={inputs} onInputChange={onInputChange} formatCurrency={formatCurrency}/>
                <DispatcherInputGroup name="Ali" stopsField="aliStops" cost={calculated.aliCost} inputs={inputs} onInputChange={onInputChange} formatCurrency={formatCurrency} stopsLabel="Stops"/>
                
                <DispatcherInputGroup name="Ali 2" stopsField="ali2Stops" pickupsField="ali2Pickups" cost={calculated.ali2Cost} inputs={inputs} onInputChange={onInputChange} formatCurrency={formatCurrency}/>
                <DispatcherInputGroup name="Ali 3" stopsField="ali3Stops" pickupsField="ali3Pickups" cost={calculated.ali3Cost} inputs={inputs} onInputChange={onInputChange} formatCurrency={formatCurrency}/>
                <DispatcherInputGroup name="Ali 4" stopsField="ali4Stops" pickupsField="ali4Pickups" cost={calculated.ali4Cost} inputs={inputs} onInputChange={onInputChange} formatCurrency={formatCurrency}/>
            </FormSection>

            <FormSection title="Internal & Extra Costs" gridCols="md:grid-cols-2">
                <div className="col-span-1 md:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="bg-gray-700/30 p-4 rounded-md border border-gray-600">
                        <h4 className="text-sm font-semibold text-cyan-300 mb-3">Internal Fleet</h4>
                        <div className="space-y-3">
                            <InputField label="Staff Count" field="internalStaffCount" value={inputs.internalStaffCount} onChange={onInputChange} />
                            <InputField label="Internal Deliveries" field="internalDeliveries" value={inputs.internalDeliveries} onChange={onInputChange} />
                            <InputField label="Internal Pickups" field="internalPickups" value={inputs.internalPickups} onChange={onInputChange} />
                            <InputField label="Internal Fuel (€)" field="internalFuel" value={inputs.internalFuel} onChange={onInputChange} />
                            <InputField label="Total Deliveries (Manual)" field="manualTotalDeliveries" value={inputs.manualTotalDeliveries} onChange={onInputChange} />
                            <CalculatedField label="Staff Cost (Salary)" value={formatCurrency(calculated.internalStaffCost)} className="text-cyan-300" />
                            <InputField label="Dishes Scanned" field="dishesScanned" value={inputs.dishesScanned} onChange={onInputChange} />
                            <InputField label="Deliveries Late" field="deliveriesLate" value={inputs.deliveriesLate} onChange={onInputChange} />
                            <InputField label="Minutes Late" field="minutesLate" value={inputs.minutesLate} onChange={onInputChange} />
                        </div>
                    </div>

                    <div className="bg-red-900/20 p-4 rounded-md border border-red-900/50">
                        <h4 className="text-sm font-semibold text-red-300 mb-3">Extra / Miscellaneous</h4>
                        <div className="space-y-3">
                            <InputField label="Amount (€)" field="extraCost" value={inputs.extraCost} onChange={onInputChange} />
                            <InputField label="Note / Reason" field="extraCostNote" value={inputs.extraCostNote} onChange={onInputChange} type="text" />
                            
                            <div className="border-t border-red-800/50 my-2 pt-2"></div>
                            <h5 className="text-xs font-semibold text-red-300/80 mb-2 uppercase tracking-wide">Pickup Operations</h5>
                            
                            {/* Samir Pickups */}
                            <div className="flex items-center justify-between gap-3">
                                <div className="flex-grow flex items-center">
                                    <label className="w-1/2 text-xs sm:text-sm text-gray-400 truncate pr-1">Samir Pickup</label>
                                    <input
                                        type="number"
                                        value={inputs.samirPickupStops || 0}
                                        onChange={(e) => onInputChange('samirPickupStops', parseFloat(e.target.value) || 0)}
                                        className="w-1/2 p-1.5 sm:p-2 bg-gray-900/50 border border-gray-600 rounded-md text-white text-sm focus:outline-none focus:ring-2 focus:ring-red-500 min-w-0"
                                    />
                                </div>
                                <div className="text-right min-w-[60px]">
                                    <span className="text-xs sm:text-sm font-bold text-yellow-300 truncate">{formatCurrency(calculated.samirPickupCost)}</span>
                                </div>
                            </div>

                            {/* Ali Pickups */}
                            <div className="flex items-center justify-between gap-3">
                                <div className="flex-grow flex items-center">
                                    <label className="w-1/2 text-xs sm:text-sm text-gray-400 truncate pr-1">Ali Pickup</label>
                                    <input
                                        type="number"
                                        value={inputs.aliPickups || 0}
                                        onChange={(e) => onInputChange('aliPickups', parseFloat(e.target.value) || 0)}
                                        className="w-1/2 p-1.5 sm:p-2 bg-gray-900/50 border border-gray-600 rounded-md text-white text-sm focus:outline-none focus:ring-2 focus:ring-red-500 min-w-0"
                                    />
                                </div>
                                <div className="text-right min-w-[60px]">
                                    <span className="text-xs sm:text-sm font-bold text-yellow-300 truncate">{formatCurrency(calculated.aliPickupCost)}</span>
                                </div>
                            </div>

                        </div>
                    </div>
                </div>
            </FormSection>
            
            {/* EFFICIENCY & UNIT ECONOMICS */}
            <div className="bg-gray-800 border border-gray-700 rounded-lg p-5 mb-6">
                 <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                    <Calculator className="w-5 h-5 text-purple-400" />
                    Efficiency & Unit Economics
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                     <div className="bg-gray-900 p-2 sm:p-3 rounded border border-gray-700 min-w-0">
                         <p className="text-[10px] sm:text-xs text-gray-400 truncate">Log. Cost / Stop</p>
                         <p className="text-sm sm:text-xl font-bold text-white truncate">{formatCurrency(calculated.logisticCostPerStop)}</p>
                     </div>
                     <div className="bg-gray-900 p-2 sm:p-3 rounded border border-gray-700 min-w-0">
                         <p className="text-[10px] sm:text-xs text-gray-400 truncate">Meals / Stop</p>
                         <p className="text-sm sm:text-xl font-bold text-white truncate">{formatNumber(calculated.mealsPerStop)}</p>
                     </div>
                     <div className="bg-gray-900 p-2 sm:p-3 rounded border border-gray-700 min-w-0">
                         <p className="text-[10px] sm:text-xs text-gray-400 truncate">Log. Cost / Dish</p>
                         <p className="text-sm sm:text-xl font-bold text-white truncate">{formatCurrency(calculated.logisticCostPerDish)}</p>
                     </div>
                     <div className="bg-gray-900 p-2 sm:p-3 rounded border border-gray-700 min-w-0">
                         <p className="text-[10px] sm:text-xs text-gray-400 truncate">Total Stops (Calc)</p>
                         <p className="text-sm sm:text-xl font-bold text-cyan-400 truncate">{calculated.totalStops}</p>
                     </div>
                </div>
            </div>

            {/* PAYMENT VERIFICATION SECTION */}
            <div className="bg-gray-900 border border-gray-700 rounded-lg p-5 mb-6">
                <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                    <DollarSign className="w-5 h-5 text-green-400" />
                    Payment Verification (Accumulated)
                </h3>
                
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm min-w-[300px]">
                        <thead>
                            <tr className="border-b border-gray-700 text-gray-400">
                                <th className="pb-2 font-medium truncate text-xs sm:text-sm">Entity</th>
                                <th className="pb-2 font-medium text-right truncate text-xs sm:text-sm">Daily (Current)</th>
                                <th className="pb-2 font-medium text-right truncate text-xs sm:text-sm">This Week (Proj.)</th>
                                <th className="pb-2 font-medium text-right truncate text-xs sm:text-sm">This Month (Proj.)</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-800">
                            <tr className="bg-gray-800/30">
                                <td className="py-3 pl-2 font-medium text-gray-300 truncate text-xs sm:text-sm">Ali <span className="text-[10px] font-normal text-gray-500 hidden sm:inline">(Total Payable)</span></td>
                                <td className="py-3 text-right font-bold text-green-400 text-sm sm:text-lg truncate">{formatCurrency(calculated.totalAliPayable)}</td>
                                <td className="py-3 text-right font-medium text-gray-300 truncate text-xs sm:text-base">{formatCurrency(periodTotals.weekly.payableAli)}</td>
                                <td className="py-3 text-right font-medium text-gray-300 truncate text-xs sm:text-base">{formatCurrency(periodTotals.monthly.payableAli)}</td>
                            </tr>
                            <tr className="bg-gray-800/30">
                                <td className="py-3 pl-2 font-medium text-gray-300 truncate text-xs sm:text-sm">Packator <span className="text-[10px] font-normal text-gray-500 hidden sm:inline">(Service Payable)</span></td>
                                <td className="py-3 text-right font-bold text-blue-400 text-sm sm:text-lg truncate">{formatCurrency(calculated.totalPackatorPayable)}</td>
                                <td className="py-3 text-right font-medium text-gray-300 truncate text-xs sm:text-base">{formatCurrency(periodTotals.weekly.payablePackator)}</td>
                                <td className="py-3 text-right font-medium text-gray-300 truncate text-xs sm:text-base">{formatCurrency(periodTotals.monthly.payablePackator)}</td>
                            </tr>
                            <tr className="bg-gray-800/30">
                                <td className="py-3 pl-2 font-medium text-gray-300 truncate text-xs sm:text-sm">Samir <span className="text-[10px] font-normal text-gray-500 hidden sm:inline">(Payable)</span></td>
                                <td className="py-3 text-right font-bold text-orange-400 text-sm sm:text-lg truncate">{formatCurrency(calculated.totalSamirPayable)}</td>
                                <td className="py-3 text-right font-medium text-gray-300 truncate text-xs sm:text-base">{formatCurrency(periodTotals.weekly.payableSamir)}</td>
                                <td className="py-3 text-right font-medium text-gray-300 truncate text-xs sm:text-base">{formatCurrency(periodTotals.monthly.payableSamir)}</td>
                            </tr>
                        </tbody>
                    </table>
                </div>
                <p className="text-[10px] sm:text-xs text-gray-500 mt-2 text-right">* "Proj." includes saved history + current unsaved input.</p>
            </div>

            <div className="bg-gray-900/50 rounded-lg p-4 mt-2">
                <h3 className="text-base sm:text-lg font-semibold text-white mb-4">Daily Summary</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
                    <div className="min-w-0">
                        <p className="text-xs sm:text-sm text-gray-400 truncate">Total Logistic Cost</p>
                        <p className="text-lg md:text-2xl font-bold text-red-400 truncate">{formatCurrency(calculated.totalLogisticCost)}</p>
                    </div>
                    <div className="min-w-0">
                        <p className="text-xs sm:text-sm text-gray-400 truncate">Net Profit</p>
                        <p className="text-[10px] text-gray-500 truncate">(Rev + Fee - Costs)</p>
                        <p className="text-lg md:text-2xl font-bold text-green-400 truncate">{formatCurrency(calculated.netProfit)}</p>
                    </div>
                    <div className="min-w-0">
                        <p className="text-xs sm:text-sm text-gray-400 truncate">Late Deliveries</p>
                        <p className="text-lg md:text-2xl font-bold text-yellow-400 truncate">{inputs.deliveriesLate || 0}</p>
                    </div>
                </div>
            </div>
        </div>
    );
};
