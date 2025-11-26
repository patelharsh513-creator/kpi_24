
import React, { useState, useMemo, useEffect } from 'react';
import { KpiDashboard } from './components/KpiDashboard';
import { DataEntryForm } from './components/DataEntryForm';
import { InsightsPanel } from './components/InsightsPanel';
import { ErrorMessage } from './components/ErrorMessage';
import { SuccessMessage } from './components/SuccessMessage';
import { AppState, DailyInputs, DailyRecord, CalculatedData } from './types';
import { useKpiCalculations } from './hooks/useKpiCalculations';
import { saveDailyRecord, subscribeToRecords } from './services/firebase';
import { Bot } from 'lucide-react';

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
  internalStaffCount: 0,
  internalDeliveries: 0,
  internalPickups: 0,
  internalFuel: 0,
  extraCost: 0,
  extraCostNote: '',
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

export default function App() {
  const [appState, setAppState] = useState<AppState>({
    records: [],
    currentInputs: initialInputs,
    error: null,
    success: null,
  });
  const [isLoading, setIsLoading] = useState(true);

  // Subscribe to Firebase data on mount
  useEffect(() => {
    const unsubscribe = subscribeToRecords((records) => {
      setAppState(prevState => {
        // When records load (or update), check if the CURRENTLY viewed date has data in the new records.
        const currentDate = prevState.currentInputs.date;
        const matchingRecord = records.find(r => r.date === currentDate);
        
        let newInputs = prevState.currentInputs;

        // If we found a saved record for the selected date, we should display it.
        if (matchingRecord) {
             newInputs = { ...initialInputs, ...matchingRecord };
        }

        return {
            ...prevState,
            records: records,
            currentInputs: newInputs
        };
      });
    });

    // Enforce a minimum loading time for better UX (skeleton visibility) and chart initialization
    const timer = setTimeout(() => {
        setIsLoading(false);
    }, 1200);

    // Cleanup subscription on unmount
    return () => {
        unsubscribe();
        clearTimeout(timer);
    }
  }, []);

  const calculatedData: CalculatedData = useKpiCalculations(appState.currentInputs);

  // 1. Construct the Live Record (Current Inputs + Calculations)
  const liveRecord = useMemo<DailyRecord>(() => {
    return {
      ...initialInputs,
      ...appState.currentInputs,
      ...calculatedData,
    } as DailyRecord;
  }, [appState.currentInputs, calculatedData]);

  // 2. Construct Data for Visualization (History + Live Record)
  // This ensures the charts and totals show the "What if" scenario of the current data being typed.
  const liveDataForVisualization = useMemo(() => {
     // Filter out any existing record in history that matches the current date being edited
     const historyExcludingCurrentDate = appState.records.filter(r => r.date !== liveRecord.date);
     
     // If we have a valid date selected, append the live record
     if (liveRecord.date) {
         // Sort combined data by date to ensure charts render chronologically
         const combined = [...historyExcludingCurrentDate, liveRecord];
         
         return combined
            .filter(r => r.date && !isNaN(new Date(r.date).getTime())) // Filter invalid dates
            .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
     }
     return historyExcludingCurrentDate
        .filter(r => r.date && !isNaN(new Date(r.date).getTime()))
        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }, [appState.records, liveRecord]);

  // 3. Calculate Projected Totals based on the Live Visualization Data
  const projectedTotals = useMemo(() => {
      if (!liveRecord.date) return { weekly: { ali: 0, packator: 0, samir: 0, combinedFixedStops: 0 }, monthly: { ali: 0, packator: 0, samir: 0 } };

      const currentDate = new Date(liveRecord.date);
      const currentWeek = getWeekNumber(currentDate);
      const currentMonth = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}`;

      // Helper to sum from records
      const sumRecords = (recs: DailyRecord[]) => ({
          ali: recs.reduce((sum, r) => sum + (Number(r.aliCost) || 0) + (Number(r.ali2Cost) || 0) + (Number(r.ali3Cost) || 0) + (Number(r.ali4Cost) || 0) + (Number(r.packatorDispatchCost) || 0) + (Number(r.jozefCost) || 0) + (Number(r.extraCost) || 0), 0),
          packator: recs.reduce((sum, r) => sum + (Number(r.packatorStopCost) || 0), 0),
          samir: recs.reduce((sum, r) => sum + (Number(r.samirCost) || 0), 0),
          // Calculate the combined stops for the 88-stop rule (Ali 1 + Ali 2 + Jozef)
          combinedFixedStops: recs.reduce((sum, r) => sum + (Number(r.aliStops) || 0) + (Number(r.ali2Stops) || 0) + (Number(r.jozefStops) || 0), 0)
      });

      // Filter the *Live Data* (which includes history + current input)
      const weeklyRecords = liveDataForVisualization.filter(r => getWeekNumber(new Date(r.date)) === currentWeek);
      const monthlyRecords = liveDataForVisualization.filter(r => {
          const d = new Date(r.date);
          return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      }).filter(r => {
           const d = new Date(r.date);
           return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}` === currentMonth;
      });

      return {
          weekly: sumRecords(weeklyRecords),
          monthly: sumRecords(monthlyRecords)
      };
  }, [liveDataForVisualization, liveRecord.date]);

  // 4. Find Last Week's Record (Same Day)
  const lastWeekSameDayRecord = useMemo(() => {
    if (!liveRecord.date) return undefined;
    
    const currentDate = new Date(liveRecord.date);
    // Subtract 7 days to find the same day last week
    currentDate.setDate(currentDate.getDate() - 7);
    const lastWeekDateStr = currentDate.toISOString().split('T')[0];
    
    return appState.records.find(r => r.date === lastWeekDateStr);
  }, [liveRecord.date, appState.records]);


  const handleInputChange = (field: keyof DailyInputs, value: string | number) => {
    // If date changes, check if we have data for that date to reload
    if (field === 'date') {
        const newDate = value as string;
        // Strict find for the exact date string
        const existingRecord = appState.records.find(r => r.date === newDate);
        
        setAppState(prevState => ({
            ...prevState,
            currentInputs: existingRecord 
                ? { ...initialInputs, ...existingRecord } // Load existing data completely
                : { ...initialInputs, date: newDate } // Reset to defaults if no data exists for this date
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
    // Simple validation
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
        // We do NOT clear the inputs here. This allows the user to see what they just saved.
        error: null,
        success: "Record saved successfully!"
      }));

      // Auto-clear success message after 3 seconds
      setTimeout(() => {
        setAppState(prev => ({ ...prev, success: null }));
      }, 3000);

    } catch (error) {
      console.error("Save error", error);
      setAppState(prev => ({...prev, error: "Failed to save data. Please check console."}));
    }
  };
  
  return (
    <div className="min-h-screen bg-gray-900 text-gray-200 font-sans">
      <header className="bg-gray-800/50 backdrop-blur-sm border-b border-gray-700 p-4 sticky top-0 z-10">
        <div className="container mx-auto flex justify-between items-center">
          <div className="flex items-center gap-3">
            <Bot className="w-8 h-8 text-cyan-400" />
            <h1 className="text-2xl font-bold tracking-tight text-white">KPI Dashboard</h1>
          </div>
          {/* Debug Indicator to confirm data loading */}
          <div className="text-xs text-gray-500">
             {appState.records.length > 0 ? `${appState.records.length} records loaded` : 'Waiting for data...'}
          </div>
        </div>
      </header>
      <main className="container mx-auto p-4 md:p-8">
        {appState.error && <ErrorMessage message={appState.error} onClear={() => setAppState(prev => ({ ...prev, error: null }))} />}
        {appState.success && <SuccessMessage message={appState.success} onClear={() => setAppState(prev => ({ ...prev, success: null }))} />}
        
        <div className="flex flex-col lg:flex-row gap-8">
          <div className="lg:w-2/3 min-w-0">
             <DataEntryForm 
                inputs={appState.currentInputs}
                calculated={calculatedData}
                periodTotals={projectedTotals}
                onInputChange={handleInputChange}
                onSave={handleSaveRecord}
             />
             <div className="mt-8">
                {/* Passing the Live Data here ensures the charts update as you type */}
                <KpiDashboard data={liveDataForVisualization} isLoading={isLoading} />
             </div>
          </div>
          <aside className="lg:w-1/3 min-w-0">
            {liveRecord && (
                <InsightsPanel 
                    dailyData={liveRecord} 
                    weeklyStats={projectedTotals.weekly}
                    previousWeekRecord={lastWeekSameDayRecord}
                />
            )}
          </aside>
        </div>
      </main>
    </div>
  );
}