
import React, { useState, useEffect, useMemo } from 'react';
import { Upload, Download } from 'lucide-react';
import { importDataFromExcel, exportGenericToExcel, exportBellabonaToExcel } from '../services/excelParser';
import { BellabonaDataEntry } from './BellabonaDataEntry';
import { BellabonaDashboard } from './BellabonaDashboard';
import { subscribeToBellabonaRecords, saveBellabonaRecord } from '../services/firebase';
import { BellabonaRecord, BellabonaKitchen, KitchenMetrics } from '../types';

interface CityPageProps {
  cityName: string;
}

const emptyKitchenMetrics: KitchenMetrics = {
    pricePerDish: 0, pricePerDishWithFee: 0, dishesOrdered: 0,
    mainDishRevenue: 0, 
    mainBusiness: 0, serviceFee: 0, cateringCharges: 0,
    expectedMainBusiness: 0, expectedServiceFee: 0, expectedCateringCharges: 0,
    cogs: 0, leftoverCount: 0,
    totalRevenue: 0, cogsPercentage: 0, leftoverPercentage: 0
};

const initialBellabonaRecord: Partial<BellabonaRecord> = {
    date: new Date().toISOString().split('T')[0],
    berlin: { ...emptyKitchenMetrics },
    munich: { ...emptyKitchenMetrics },
    koln: { ...emptyKitchenMetrics },
    totalGlobalRevenue: 0,
    globalWowGrowth: 0
};

export const CityPage: React.FC<CityPageProps> = ({ cityName }) => {
  const [data, setData] = useState<any[]>([]); // For generic Excel upload
  const [bellabonaRecords, setBellabonaRecords] = useState<BellabonaRecord[]>([]);
  const [currentRecord, setCurrentRecord] = useState<Partial<BellabonaRecord>>(JSON.parse(JSON.stringify(initialBellabonaRecord)));
  
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
      if (cityName === 'BELLABONA') {
          const unsubscribe = subscribeToBellabonaRecords((records) => {
             setBellabonaRecords(records);
             
             const today = new Date().toISOString().split('T')[0];
             // Initial Load: If today has no record, try to populate expected values
             if (!records.find(r => r.date === today)) {
                 loadRecordWithExpectations(today, records);
             } else {
                 const exists = records.find(r => r.date === today);
                 if (exists) setCurrentRecord(exists);
             }
          });
          return () => unsubscribe();
      }
  }, [cityName]);

  // Helper to carry over expected values from the most recent record with the SAME DAY OF WEEK
  const loadRecordWithExpectations = (date: string, records: BellabonaRecord[]) => {
      const exists = records.find(r => r.date === date);
      
      if (exists) {
          setCurrentRecord(exists);
      } else {
          // Create new record
          const newRec = { ...JSON.parse(JSON.stringify(initialBellabonaRecord)), date: date };
          
          // NEW LOGIC: Find most recent record with SAME DAY OF WEEK
          // This handles "Monday to Monday" carry over, respecting different expectations per weekday.
          const targetDay = new Date(date).getDay();
          
          const sameDayRecords = records
            .filter(r => {
                const rDate = new Date(r.date);
                // Ensure valid date and match day of week, only look in past
                return !isNaN(rDate.getTime()) && rDate.getDay() === targetDay && r.date < date;
            })
            .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
          
          const previousRec = sameDayRecords[0];

          if (previousRec) {
              // Copy expected values with strict fallback to 0 to avoid undefined
              const copyExpected = (k: BellabonaKitchen) => {
                  if (newRec[k] && previousRec[k]) {
                      newRec[k]!.expectedMainBusiness = previousRec[k]!.expectedMainBusiness || 0;
                      newRec[k]!.expectedServiceFee = previousRec[k]!.expectedServiceFee || 0;
                      newRec[k]!.expectedCateringCharges = previousRec[k]!.expectedCateringCharges || 0;
                  }
              };
              copyExpected('berlin');
              copyExpected('munich');
              copyExpected('koln');
          }
          
          setCurrentRecord(newRec);
      }
  };

  // Handle Input Changes for Bellabona (Nested Update)
  const handleInputChange = (kitchen: BellabonaKitchen, field: keyof KitchenMetrics, value: number) => {
      setCurrentRecord(prev => {
          if (!prev) return prev;
          const updatedKitchen = { ...prev[kitchen]!, [field]: value };
          return { ...prev, [kitchen]: updatedKitchen };
      });
  };

  const handleDateChange = (newDate: string) => {
      loadRecordWithExpectations(newDate, bellabonaRecords);
  };

  // Find Last Week's Record matching the current date's day of week
  const lastWeekRecord = useMemo(() => {
      if (!currentRecord.date) return undefined;
      const currentDate = new Date(currentRecord.date);
      currentDate.setDate(currentDate.getDate() - 7);
      const lastWeekDateStr = currentDate.toISOString().split('T')[0];
      return bellabonaRecords.find(r => r.date === lastWeekDateStr);
  }, [currentRecord.date, bellabonaRecords]);

  // Calculate Derived Values for All Kitchens before saving
  const calculatedRecord = useMemo(() => {
      if (!currentRecord) return null;
      
      const calcKitchen = (metrics: KitchenMetrics | undefined): KitchenMetrics => {
          const m = metrics || { ...emptyKitchenMetrics };
          
          // Total Revenue = Kitchen Revenue (mainBusiness) + Service Fee + Catering
          const totalRevenue = (m.mainBusiness || 0) + (m.serviceFee || 0) + (m.cateringCharges || 0);

          // COGS % = COGS / Total Revenue
          const cogsPercentage = totalRevenue > 0 ? (m.cogs || 0) / totalRevenue : 0;
          
          // Leftover % = Leftover Count / Dishes Ordered
          const leftoverPercentage = (m.dishesOrdered || 0) > 0 ? (m.leftoverCount || 0) / m.dishesOrdered : 0;
          
          // CRITICAL FIX: Ensure NO undefined values exist by defaulting to 0
          return { 
              ...m, 
              // Explicitly ensuring number types for all fields that might be undefined
              pricePerDish: m.pricePerDish || 0,
              pricePerDishWithFee: m.pricePerDishWithFee || 0,
              dishesOrdered: m.dishesOrdered || 0,
              mainDishRevenue: m.mainDishRevenue || 0,
              mainBusiness: m.mainBusiness || 0,
              serviceFee: m.serviceFee || 0,
              cateringCharges: m.cateringCharges || 0,
              expectedMainBusiness: m.expectedMainBusiness || 0,
              expectedServiceFee: m.expectedServiceFee || 0,
              expectedCateringCharges: m.expectedCateringCharges || 0,
              cogs: m.cogs || 0,
              leftoverCount: m.leftoverCount || 0,
              totalRevenue, 
              cogsPercentage, 
              leftoverPercentage 
          };
      };

      const berlin = calcKitchen(currentRecord.berlin);
      const munich = calcKitchen(currentRecord.munich);
      const koln = calcKitchen(currentRecord.koln);
      
      const totalGlobalRevenue = berlin.totalRevenue + munich.totalRevenue + koln.totalRevenue;

      return {
          ...currentRecord,
          berlin,
          munich,
          koln,
          totalGlobalRevenue
      } as BellabonaRecord;

  }, [currentRecord]);

  // Handle Save for Bellabona
  const handleSave = async () => {
      if (!calculatedRecord || !calculatedRecord.date) return;
      
      // Calculate Global WoW Growth based on Last Week Record
      let globalWowGrowth = 0;
      if (lastWeekRecord && lastWeekRecord.totalGlobalRevenue > 0 && calculatedRecord.totalGlobalRevenue > 0) {
          globalWowGrowth = (calculatedRecord.totalGlobalRevenue - lastWeekRecord.totalGlobalRevenue) / lastWeekRecord.totalGlobalRevenue;
      }

      const finalRecord: BellabonaRecord = {
          ...calculatedRecord,
          globalWowGrowth
      };

      try {
          await saveBellabonaRecord(finalRecord);
          setSuccess("All Kitchens Saved!");
          setTimeout(() => setSuccess(null), 3000);
      } catch (err) {
          console.error(err);
          setError("Failed to save record.");
      }
  };


  // --- EXCEL LOGIC (LEGACY / GENERIC) ---
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsLoading(true);
    setError(null);
    try {
      const importedData = await importDataFromExcel(file);
      setData(importedData);
    } catch (err) {
      setError("Failed to parse Excel file.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDownload = () => {
      if (cityName === 'BELLABONA') {
          exportBellabonaToExcel(bellabonaRecords, 'Bellabona_Global_Data.xlsx');
      } else {
          if (data.length === 0) return;
          const safeName = cityName.replace(/\s+/g, '_');
          exportGenericToExcel(data, `${safeName}_Data.xlsx`);
      }
  };

  return (
    <div className="w-full max-w-7xl mx-auto animate-in fade-in duration-300">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
          <div>
            <h2 className="text-2xl font-bold text-white flex items-center gap-2">
              <span className={cityName === 'BELLABONA' ? "text-green-400" : "text-cyan-400"}>{cityName}</span>
            </h2>
          </div>
          <div className="flex items-center gap-3">
               <button 
                    onClick={handleDownload}
                    className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md transition-colors shadow-lg"
                >
                    <Download className="w-4 h-4" />
                    <span>Download Excel</span>
                </button>
                {/* Keep generic upload for non-Bellabona pages if any */}
                {cityName !== 'BELLABONA' && (
                  <div className="relative group">
                    <input type="file" accept=".xlsx, .xls" onChange={handleFileUpload} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" />
                    <button className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md transition-colors shadow-lg">
                      <Upload className="w-4 h-4" />
                      <span>Upload Excel</span>
                    </button>
                  </div>
                )}
          </div>
      </div>

      {success && <div className="bg-green-500/20 text-green-400 p-3 rounded mb-4 border border-green-500/50">{success}</div>}
      {error && <div className="bg-red-500/20 text-red-400 p-3 rounded mb-4 border border-red-500/50">{error}</div>}

      {cityName === 'BELLABONA' ? (
          <div className="flex flex-col gap-8">
              <BellabonaDataEntry 
                  record={calculatedRecord || currentRecord} 
                  lastWeekRecord={lastWeekRecord}
                  onInputChange={handleInputChange} 
                  onDateChange={handleDateChange}
                  onSave={handleSave} 
              />
              <BellabonaDashboard 
                  data={bellabonaRecords} 
                  selectedDate={currentRecord.date} 
                  liveRecord={calculatedRecord as BellabonaRecord}
              />
          </div>
      ) : (
          <div className="bg-gray-800 rounded-lg p-6 shadow-lg border border-gray-700">
             {/* Generic Excel Table View */}
             {data.length > 0 ? (
                <div className="overflow-x-auto bg-gray-900 rounded-lg border border-gray-700">
                    <table className="w-full text-left text-sm whitespace-nowrap">
                        <thead>
                            <tr className="bg-gray-800 text-gray-400 border-b border-gray-700">
                                {Object.keys(data[0]).map(h => <th key={h} className="px-4 py-3">{h}</th>)}
                            </tr>
                        </thead>
                        <tbody>
                            {data.map((row, i) => (
                                <tr key={i} className="hover:bg-gray-800/30">
                                    {Object.values(row).map((v: any, j) => <td key={j} className="px-4 py-3 text-gray-300">{v}</td>)}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
             ) : (
                 <div className="text-center py-16 text-gray-500">Upload Excel file to view data.</div>
             )}
          </div>
      )}
    </div>
  );
};
