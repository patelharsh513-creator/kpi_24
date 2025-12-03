import React, { useState, useMemo, useEffect } from 'react';
import { KpiDashboard } from './components/KpiDashboard';
import { DataEntryForm } from './components/DataEntryForm';
import { InsightsPanel } from './components/InsightsPanel';
import { ErrorMessage } from './components/ErrorMessage';
import { SuccessMessage } from './components/SuccessMessage';
import { SettingsModal } from './components/SettingsModal'; 
import { CityPage } from './components/CityPage';
import { AppState, DailyInputs, DailyRecord, CalculatedData, PeriodTotals } from './types';
import { useKpiCalculations, calculateKpi } from './hooks/useKpiCalculations';
import { saveDailyRecord, subscribeToRecords } from './services/firebase';
import { exportDataToExcel } from './services/excelParser';
import { Settings, Download } from 'lucide-react'; 

const initialInputs: Partial<DailyInputs> = {
  date: new Date().toISOString().split('T')[0],
  totalRevenue: 0,
  serviceFee: 0,
  catering: 0,
  meals: 0,
  addOns: 0,
  packator1Stops: 0,
  packator2Stops: 0,
  packator3Stops: 0,
  samirStops: 0,
  samirPickupStops: 0,
  jozefStops: 0,
  jozefPickups: 0,
  aliStops: 0,
  aliPickups: 0,
  ali2Stops: 0,
  ali2Pickups: 0,
  ali3Stops: 0,
  ali3Pickups: 0,
  ali4Stops: 0,
  ali4Pickups: 0,
  gygCateringRevenue: 0, 
  revoluteRevenue: 0, 
  internalStaffCount: 0,
  internalDeliveries: 0,
  internalPickups: 0,
  internalFuel: 0,
  extraCost: 0,
  extraCostNote: '',
  manualTotalDeliveries: 0,
  dishesScanned: 0,
  deliveriesLate: 0,
  minutesLate: 0,
};

// Helper for week number calculation
const getWeekNumber = (d: Date): string => {
    if (isNaN(d.getTime())) return "Invalid Week";
    d = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
    d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay() || 7));
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
    const weekNo = Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
    return `${d.getUTCFullYear()}-W${weekNo}`;
};

type City = 'Logistic KPI Berlin' | 'BELLABONA';

function App() {
  const [appState, setAppState] = useState<AppState>({
    records: [],
    currentInputs: initialInputs,
    error: null,
    success: null,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false); 
  
  // Navigation State
  const [activeCity, setActiveCity] = useState<City>('Logistic KPI Berlin');

  // Subscribe to Firebase data on mount
  useEffect(() => {
    const unsubscribe = subscribeToRecords((rawRecords) => {
      // --- HYDRATION STEP ---
      const hydratedRecords = rawRecords.map(record => {
          const calculated = calculateKpi(record);
          return { ...record, ...calculated };
      });

      setAppState(prevState => {
        const currentDate = prevState.currentInputs.date;
        const matchingRecord = hydratedRecords.find(r => r.date === currentDate);
        
        let newInputs = prevState.currentInputs;

        if (matchingRecord) {
             newInputs = { ...initialInputs, ...matchingRecord };
        }

        return {
            ...prevState,
            records: hydratedRecords,
            currentInputs: newInputs
        };
      });
    });

    const timer = setTimeout(() => {
        setIsLoading(false);
    }, 1200);

    return () => {
        unsubscribe();
        clearTimeout(timer);
    }
  }, []);

  const calculatedData: CalculatedData = useKpiCalculations(appState.currentInputs);

  const liveRecord = useMemo<DailyRecord>(() => {
    return {
      ...initialInputs,
      ...appState.currentInputs,
      ...calculatedData,
    } as DailyRecord;
  }, [appState.currentInputs, calculatedData]);

  const liveDataForVisualization = useMemo(() => {
     const historyExcludingCurrentDate = appState.records.filter(r => r.date !== liveRecord.date);
     
     if (liveRecord.date) {
         const combined = [...historyExcludingCurrentDate, liveRecord];
         
         return combined
            .filter(r => r.date && !isNaN(new Date(r.date).getTime())) 
            .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
     }
     return historyExcludingCurrentDate
        .filter(r => r.date && !isNaN(new Date(r.date).getTime()))
        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }, [appState.records, liveRecord]);

  // 3. Calculate Projected Totals based on the Live Visualization Data
  const projectedTotals = useMemo<PeriodTotals>(() => {
      const defaults = { 
          payableAli: 0, payablePackator: 0, payableSamir: 0, combinedFixedStops: 0, 
          totalOverallRevenue: 0, mainRevenueTotal: 0, gygCateringRevenueTotal: 0, revoluteRevenueTotal: 0,
          totalLogisticCost: 0, avgOverallLogisticCostPercentage: 0, avgMainRevenuePercentage: 0 
      };

      if (!liveRecord.date) return { weekly: defaults, monthly: defaults };

      const currentDate = new Date(liveRecord.date);
      const currentWeek = getWeekNumber(currentDate);
      const currentMonth = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}`;

      const sumRecords = (recs: DailyRecord[]) => {
          const payableAli = recs.reduce((sum, r) => sum + (Number(r.aliCost) || 0) + (Number(r.ali2Cost) || 0) + (Number(r.ali3Cost) || 0) + (Number(r.ali4Cost) || 0) + (Number(r.packatorDispatchCost) || 0) + (Number(r.jozefCost) || 0) + (Number(r.extraCost) || 0), 0);
          const payablePackator = recs.reduce((sum, r) => sum + (Number(r.packatorStopCost) || 0), 0);
          const payableSamir = recs.reduce((sum, r) => sum + (Number(r.samirCost) || 0), 0);
          const combinedFixedStops = recs.reduce((sum, r) => sum + (Number(r.aliStops) || 0) + (Number(r.ali2Stops) || 0) + (Number(r.jozefStops) || 0), 0);

          const totalLogisticCostSum = recs.reduce((sum, r) => sum + (Number(r.totalLogisticCost) || 0), 0);
          const totalOverallRevenueSum = recs.reduce((sum, r) => sum + (Number(r.totalOverallRevenue) || 0), 0);
          const mainRevenueTotalSum = recs.reduce((sum, r) => sum + (Number(r.mainRevenueTotal) || 0), 0);
          const gygCateringRevenueTotal = recs.reduce((sum, r) => sum + (Number(r.gygCateringRevenue) || 0), 0);
          const revoluteRevenueTotal = recs.reduce((sum, r) => sum + (Number(r.revoluteRevenue) || 0), 0);

          const avgOverallLogisticCostPercentage = totalOverallRevenueSum > 0 ? totalLogisticCostSum / totalOverallRevenueSum : 0;
          // Main Revenue Share %
          const avgMainRevenuePercentage = totalOverallRevenueSum > 0 ? mainRevenueTotalSum / totalOverallRevenueSum : 0;

          return {
              payableAli,
              payablePackator,
              payableSamir,
              combinedFixedStops,
              totalOverallRevenue: totalOverallRevenueSum,
              mainRevenueTotal: mainRevenueTotalSum,
              gygCateringRevenueTotal,
              revoluteRevenueTotal,
              totalLogisticCost: totalLogisticCostSum,
              avgOverallLogisticCostPercentage,
              avgMainRevenuePercentage,
          };
      };

      // Weekly: Must match Week Number AND Current Month (to handle month change resets)
      const weeklyRecords = liveDataForVisualization.filter(r => {
          const d = new Date(r.date);
          const sameWeek = getWeekNumber(d) === currentWeek;
          const sameMonth = d.getMonth() === currentDate.getMonth() && d.getFullYear() === currentDate.getFullYear();
          return sameWeek && sameMonth;
      });

      const monthlyRecords = liveDataForVisualization.filter(r => {
           const d = new Date(r.date);
           return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}` === currentMonth;
      });

      return {
          weekly: sumRecords(weeklyRecords),
          monthly: sumRecords(monthlyRecords)
      };
  }, [liveDataForVisualization, liveRecord.date]);

  const lastWeekSameDayRecord = useMemo(() => {
    if (!liveRecord.date) return undefined;
    
    const currentDate = new Date(liveRecord.date);
    currentDate.setDate(currentDate.getDate() - 7);
    const lastWeekDateStr = currentDate.toISOString().split('T')[0];
    
    return appState.records.find(r => r.date === lastWeekDateStr);
  }, [liveRecord.date, appState.records]);


  const handleInputChange = (field: keyof DailyInputs, value: string | number) => {
    if (field === 'date') {
        const newDate = value as string;
        const existingRecord = appState.records.find(r => r.date === newDate);
        
        setAppState(prevState => ({
            ...prevState,
            currentInputs: existingRecord 
                ? { ...initialInputs, ...existingRecord } 
                : { ...initialInputs, date: newDate } 
        }));
        return;
    }

    setAppState(prevState => ({
      ...prevState,
      currentInputs: {
        ...prevState.currentInputs,
        [field]: value,
      },
    }));
  };

  const handleSaveRecord = async () => {
    if (!appState.currentInputs.date || !appState.currentInputs.totalRevenue) {
      setAppState(prev => ({...prev, error: "Date and Total Revenue are required to save a record."}));
      return;
    }
    
    const newRecord: DailyRecord = {
        ...liveRecord
    };

    try {
      await saveDailyRecord(newRecord);
      
      setAppState(prevState => ({
        ...prevState,
        error: null,
        success: "Record saved successfully!"
      }));

      setTimeout(() => {
        setAppState(prev => ({ ...prev, success: null }));
      }, 3000);

    } catch (error) {
      console.error("Save error", error);
      setAppState(prev => ({...prev, error: "Failed to save data. Please check console."}));
    }
  };

  const handleExport = () => {
      exportDataToExcel(appState.records, `logistics_export_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  const renderMainContent = () => {
      return (
          <div className="flex flex-col gap-8 animate-in fade-in duration-300">
              
              {/* 1. Data Entry Section (Top) */}
              <div className="w-full">
                  <DataEntryForm 
                      inputs={appState.currentInputs}
                      calculated={calculatedData}
                      periodTotals={projectedTotals}
                      onInputChange={handleInputChange}
                      onSave={handleSaveRecord}
                  />
              </div>

              {/* 2. Numbers (Dashboard) & AI Advisor (Bottom) */}
              <div className="grid grid-cols-1 xl:grid-cols-4 gap-8">
                  {/* Dashboard takes more space */}
                  <div className="xl:col-span-3">
                      <KpiDashboard 
                        data={liveDataForVisualization} 
                        isLoading={isLoading} 
                        selectedDate={appState.currentInputs.date}
                      />
                  </div>
                  
                  {/* AI Panel on the side */}
                  <div className="xl:col-span-1">
                      {liveRecord && (
                        <InsightsPanel 
                            dailyData={liveRecord} 
                            weeklyStats={projectedTotals.weekly}
                            previousWeekRecord={lastWeekSameDayRecord}
                        />
                     )}
                  </div>
              </div>

          </div>
      );
  };
  
  return (
    <div className="min-h-screen bg-gray-900 text-gray-200 font-sans flex flex-col">
      <header className="bg-gray-800/80 backdrop-blur-md border-b border-gray-700 sticky top-0 z-20 shadow-lg">
        <div className="container mx-auto px-4 h-16 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <h1 className="text-xl md:text-2xl font-bold tracking-tight text-green-400 hidden sm:block">BELLABONA</h1>
          </div>

          {/* MAIN CITY NAVIGATION */}
          <nav className="flex items-center bg-gray-900/60 p-1 rounded-lg border border-gray-700/50 overflow-x-auto max-w-[50vw] sm:max-w-none no-scrollbar">
             {(['Logistic KPI Berlin', 'BELLABONA'] as City[]).map((city) => {
               const isActive = activeCity === city;
               let activeClass = 'bg-cyan-600 text-white shadow-md';
               
               // Apply Green color for BELLABONA
               if (city === 'BELLABONA') {
                   activeClass = 'bg-green-600 text-white shadow-md';
               }

               return (
                 <button
                    key={city}
                    onClick={() => { setActiveCity(city); }}
                    className={`whitespace-nowrap px-3 py-1.5 sm:px-4 sm:py-2 rounded-md text-xs sm:text-sm font-medium transition-all duration-200 flex items-center gap-2 ${isActive ? activeClass : 'text-gray-400 hover:text-white hover:bg-gray-700'}`}
                 >
                    {city}
                 </button>
               );
             })}
          </nav>

          <div className="flex items-center gap-2 sm:gap-3"> 
             {activeCity === 'Logistic KPI Berlin' && (
                <button
                    onClick={handleExport}
                    className="flex items-center gap-2 px-3 py-2 text-sm bg-green-600/20 text-green-400 border border-green-600/30 rounded-md hover:bg-green-600/30 transition-colors"
                    title="Download Excel"
                >
                    <Download className="w-4 h-4" />
                    <span className="hidden sm:inline">Export</span>
                </button>
             )}

            <button
              onClick={() => setIsSettingsModalOpen(true)}
              className="p-2 rounded-full text-gray-400 hover:bg-gray-700 hover:text-white transition-colors"
              aria-label="Open Settings"
            >
              <Settings className="w-6 h-6" />
            </button>
          </div>
        </div>
      </header>

      <main className="container mx-auto p-4 md:p-6 flex-grow">
        {appState.error && <ErrorMessage message={appState.error} onClear={() => setAppState(prev => ({ ...prev, error: null }))} />}
        {appState.success && <SuccessMessage message={appState.success} onClear={() => setAppState(prev => ({ ...prev, success: null }))} />}
        
        {activeCity === 'Logistic KPI Berlin' ? renderMainContent() : <CityPage cityName={activeCity} />}

      </main>
      <SettingsModal isOpen={isSettingsModalOpen} onClose={() => setIsSettingsModalOpen(false)} />
    </div>
  );
}

export default App;