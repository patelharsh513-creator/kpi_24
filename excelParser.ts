// @ts-nocheck
import { DailyRecord, BellabonaRecord, KitchenMetrics } from '../types';

// Declare global variable for the script loaded in index.html
declare var XLSX: any;

export const importDataFromExcel = (file: File): Promise<any[]> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();

        reader.onload = (e) => {
            try {
                const data = e.target?.result;
                const workbook = XLSX.read(data, { type: 'binary' });
                const firstSheetName = workbook.SheetNames[0];
                const worksheet = workbook.Sheets[firstSheetName];
                const jsonData = XLSX.utils.sheet_to_json(worksheet);
                resolve(jsonData);
            } catch (err) {
                reject(err);
            }
        };

        reader.onerror = (err) => reject(err);

        reader.readAsBinaryString(file);
    });
};

export const exportDataToExcel = (data: DailyRecord[], filename: string = 'logistics_data.xlsx') => {
    if (!data || data.length === 0) {
        alert("No data to export");
        return;
    }

    // Sort data by date just in case
    const sortedData = [...data].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    const dates = sortedData.map(d => d.date);

    // Helper to get array of values for a specific key
    const getValues = (key: keyof DailyRecord | string) => sortedData.map(d => {
        const val = d[key as keyof DailyRecord];
        return (val === undefined || val === null) ? 0 : val;
    });

    // Define the Rows (Metric Names corresponding to Data Keys)
    // Structure: [Label, ...Values]
    const sheetData = [
        ['Date', ...dates],

        // --- REVENUE SECTION ---
        ['Total Revenue (Input)', ...getValues('totalRevenue')],
        ['Service Fee', ...getValues('serviceFee')],
        ['Catering', ...getValues('catering')],
        ['GYG Catering Sales', ...getValues('gygCateringRevenue')],
        ['Revolute Sales', ...getValues('revoluteRevenue')],
        ['Meals (Count)', ...getValues('meals')],
        ['Add-ons (Count)', ...getValues('addOns')],
        ['Total Overall Revenue (Calc)', ...getValues('totalOverallRevenue')],
        ['Main Revenue Total (Calc)', ...getValues('mainRevenueTotal')],

        ['', ...dates.map(() => '')], // Spacer

        // --- DISPATCHER INPUTS (STOPS & PICKUPS) ---
        ['Packator 1 Stops', ...getValues('packator1Stops')],
        ['Packator 2 Stops', ...getValues('packator2Stops')],
        ['Packator 3 Stops', ...getValues('packator3Stops')],
        ['Samir Stops', ...getValues('samirStops')],
        ['Samir Pickups', ...getValues('samirPickupStops')],
        ['Jozef Stops', ...getValues('jozefStops')],
        ['Jozef Pickups', ...getValues('jozefPickups')],
        ['Ali Stops', ...getValues('aliStops')],
        ['Ali Pickups', ...getValues('aliPickups')],
        ['Ali 2 Stops', ...getValues('ali2Stops')],
        ['Ali 2 Pickups', ...getValues('ali2Pickups')],
        ['Ali 3 Stops', ...getValues('ali3Stops')],
        ['Ali 3 Pickups', ...getValues('ali3Pickups')],
        ['Ali 4 Stops', ...getValues('ali4Stops')],
        ['Ali 4 Pickups', ...getValues('ali4Pickups')],

        ['', ...dates.map(() => '')], // Spacer

        // --- INTERNAL & OPERATIONAL INPUTS ---
        ['Internal Staff Count', ...getValues('internalStaffCount')],
        ['Internal Deliveries', ...getValues('internalDeliveries')],
        ['Internal Pickups', ...getValues('internalPickups')],
        ['Internal Fuel (€)', ...getValues('internalFuel')],
        ['Extra Cost (€)', ...getValues('extraCost')],
        ['Extra Cost Note', ...sortedData.map(d => d.extraCostNote || '')],
        ['Total Deliveries (Manual Input)', ...getValues('manualTotalDeliveries')],
        ['Dishes Scanned', ...getValues('dishesScanned')],
        ['Deliveries Late', ...getValues('deliveriesLate')],
        ['Minutes Late', ...getValues('minutesLate')],

        ['', ...dates.map(() => '')], // Spacer

        // --- CALCULATED COSTS (TOTALS) ---
        ['Total Logistic Cost', ...getValues('totalLogisticCost')],
        ['Total Dispatching Cost (External)', ...getValues('totalDispatchingCost')],
        ['Internal Staff Cost', ...getValues('internalStaffCost')],
        ['Net Profit', ...getValues('netProfit')],
        ['Overall Logistic Cost %', ...getValues('logisticCostPercentage')],
        ['Main Revenue %', ...getValues('mainRevenuePercentage')],

        ['', ...dates.map(() => '')], // Spacer

        // --- DETAILED COST BREAKDOWN ---
        ['Packator Total Cost', ...getValues('packatorCost')],
        ['Packator Stop Cost (Service)', ...getValues('packatorStopCost')],
        ['Packator Dispatch Cost (Ali)', ...getValues('packatorDispatchCost')],
        ['Samir Total Cost', ...getValues('samirCost')],
        ['Samir Pickup Cost', ...getValues('samirPickupCost')],
        ['Jozef Cost', ...getValues('jozefCost')],
        ['Ali Cost', ...getValues('aliCost')],
        ['Ali Pickup Cost', ...getValues('aliPickupCost')],
        ['Ali 2 Cost', ...getValues('ali2Cost')],
        ['Ali 3 Cost', ...getValues('ali3Cost')],
        ['Ali 4 Cost', ...getValues('ali4Cost')],

        ['', ...dates.map(() => '')], // Spacer

        // --- PAYABLES (ACCUMULATED) ---
        ['Total Payable to Ali (inc Jozef/Extra)', ...getValues('totalAliPayable')],
        ['Total Payable to Packator', ...getValues('totalPackatorPayable')],
        ['Total Payable to Samir', ...getValues('totalSamirPayable')],

        ['', ...dates.map(() => '')], // Spacer

        // --- UNIT ECONOMICS ---
        ['Total Stops (Calc)', ...getValues('totalStops')],
        ['Total External Stops', ...getValues('totalExternalStops')],
        ['Ext. Cost per Stop', ...getValues('externalCostPerStop')],
        ['Log. Cost per Stop', ...getValues('logisticCostPerStop')],
        ['Log. Cost per Dish', ...getValues('logisticCostPerDish')],
        ['Meals per Delivery', ...getValues('mealsPerDelivery')],
        ['Meals per Stop', ...getValues('mealsPerStop')]
    ];

    // Create Worksheet from Array of Arrays
    const worksheet = XLSX.utils.aoa_to_sheet(sheetData);

    // Create Workbook
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Logistics Data");

    // Write File
    XLSX.writeFile(workbook, filename);
};

export const exportGenericToExcel = (data: any[], filename: string) => {
    if (!data || data.length === 0) {
        alert("No data to export");
        return;
    }

    // 1. Identify the Date field
    const keys = Object.keys(data[0]);
    let dateKey = keys.find(k => k.toLowerCase().includes('date'));
    
    // Sort by date if possible
    let sortedData = [...data];
    if (dateKey) {
        sortedData.sort((a, b) => new Date(a[dateKey]).getTime() - new Date(b[dateKey]).getTime());
    }

    // 2. Prepare Header Row (Dates)
    const dates = dateKey 
        ? sortedData.map(d => d[dateKey]) 
        : sortedData.map((_, i) => `Record ${i + 1}`);
    
    const headerRow = ['Metric', ...dates];
    
    // 3. Prepare Data Rows (Transpose keys)
    const dataRows: any[][] = [];
    const metricKeys = keys.filter(k => k !== dateKey);

    metricKeys.forEach(key => {
        const row = [key]; 
        sortedData.forEach(record => {
            let val = record[key];
            if (val === undefined || val === null) val = '';
            row.push(val);
        });
        dataRows.push(row);
    });

    const finalSheetData = [headerRow, ...dataRows];
    const worksheet = XLSX.utils.aoa_to_sheet(finalSheetData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Sheet1");
    XLSX.writeFile(workbook, filename);
};

export const exportBellabonaToExcel = (data: BellabonaRecord[], filename: string) => {
    if (!data || data.length === 0) {
        alert("No Bellabona data to export");
        return;
    }
    const sorted = [...data].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    const dates = sorted.map(d => d.date);

    // Helper to extract nested kitchen data
    const getKVal = (kitch: 'berlin'|'munich'|'koln', key: keyof KitchenMetrics) => 
        sorted.map(d => d[kitch]?.[key] || 0);

    // Calculate Totals and Deltas for Export
    const getTotal = (d: BellabonaRecord, key: keyof KitchenMetrics) => 
        (d.berlin?.[key] || 0) + (d.munich?.[key] || 0) + (d.koln?.[key] || 0);

    const getTotalExpected = (d: BellabonaRecord) => 
        getTotal(d, 'expectedMainBusiness') + getTotal(d, 'expectedServiceFee') + getTotal(d, 'expectedCateringCharges');
    
    const getDelta = (d: BellabonaRecord) => {
        const exp = getTotalExpected(d);
        const act = d.totalGlobalRevenue || 0;
        return exp > 0 ? (act / exp) - 1 : 0;
    };

    const sheetData = [
        ['Date', ...dates],
        
        ['--- GLOBAL ---', ...dates.map(()=>'')],
        ['Total Global Revenue', ...sorted.map(d => d.totalGlobalRevenue)],
        ['Total Global Expected Revenue', ...sorted.map(d => getTotalExpected(d))],
        ['Delta %', ...sorted.map(d => getDelta(d))],
        ['Global WoW Growth %', ...sorted.map(d => d.globalWowGrowth)],

        // REORDERED: MUNICH -> BERLIN -> KOLN

        ['--- MUNICH ---', ...dates.map(()=>'')],
        ['Munich Price/Dish (Net)', ...getKVal('munich', 'pricePerDish')],
        ['Munich Dishes Ordered', ...getKVal('munich', 'dishesOrdered')],
        ['Munich Main Dish Revenue', ...getKVal('munich', 'mainDishRevenue')], // Renamed from Dish Revenue
        ['Munich Kitchen Revenue', ...getKVal('munich', 'mainBusiness')], // Renamed from Main Business
        ['Munich Exp Main Business', ...getKVal('munich', 'expectedMainBusiness')],
        ['Munich Service Fee', ...getKVal('munich', 'serviceFee')],
        ['Munich Exp Service Fee', ...getKVal('munich', 'expectedServiceFee')],
        ['Munich Catering', ...getKVal('munich', 'cateringCharges')],
        ['Munich Exp Catering', ...getKVal('munich', 'expectedCateringCharges')],
        ['Munich Total Rev', ...getKVal('munich', 'totalRevenue')],
        ['Munich COGS', ...getKVal('munich', 'cogs')],
        ['Munich Leftovers Count', ...getKVal('munich', 'leftoverCount')],
        ['Munich Leftover %', ...getKVal('munich', 'leftoverPercentage')],

        ['--- BERLIN ---', ...dates.map(()=>'')],
        ['Berlin Price/Dish (Net)', ...getKVal('berlin', 'pricePerDish')],
        ['Berlin Dishes Ordered', ...getKVal('berlin', 'dishesOrdered')],
        ['Berlin Main Dish Revenue', ...getKVal('berlin', 'mainDishRevenue')], // Renamed from Dish Revenue
        ['Berlin Kitchen Revenue', ...getKVal('berlin', 'mainBusiness')], // Renamed from Main Business
        ['Berlin Exp Main Business', ...getKVal('berlin', 'expectedMainBusiness')],
        ['Berlin Service Fee', ...getKVal('berlin', 'serviceFee')],
        ['Berlin Exp Service Fee', ...getKVal('berlin', 'expectedServiceFee')],
        ['Berlin Catering', ...getKVal('berlin', 'cateringCharges')],
        ['Berlin Exp Catering', ...getKVal('berlin', 'expectedCateringCharges')],
        ['Berlin Total Rev', ...getKVal('berlin', 'totalRevenue')],
        ['Berlin COGS', ...getKVal('berlin', 'cogs')],
        ['Berlin Leftovers Count', ...getKVal('berlin', 'leftoverCount')],
        ['Berlin Leftover %', ...getKVal('berlin', 'leftoverPercentage')],

        ['--- KOLN ---', ...dates.map(()=>'')],
        ['Koln Price/Dish (Net)', ...getKVal('koln', 'pricePerDish')],
        ['Koln Dishes Ordered', ...getKVal('koln', 'dishesOrdered')],
        ['Koln Main Dish Revenue', ...getKVal('koln', 'mainDishRevenue')], // Renamed from Dish Revenue
        ['Koln Kitchen Revenue', ...getKVal('koln', 'mainBusiness')], // Renamed from Main Business
        ['Koln Exp Main Business', ...getKVal('koln', 'expectedMainBusiness')],
        ['Koln Service Fee', ...getKVal('koln', 'serviceFee')],
        ['Koln Exp Service Fee', ...getKVal('koln', 'expectedServiceFee')],
        ['Koln Catering', ...getKVal('koln', 'cateringCharges')],
        ['Koln Exp Catering', ...getKVal('koln', 'expectedCateringCharges')],
        ['Koln Total Rev', ...getKVal('koln', 'totalRevenue')],
        ['Koln COGS', ...getKVal('koln', 'cogs')],
        ['Koln Leftovers Count', ...getKVal('koln', 'leftoverCount')],
        ['Koln Leftover %', ...getKVal('koln', 'leftoverPercentage')],
    ];

    const worksheet = XLSX.utils.aoa_to_sheet(sheetData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Bellabona Global Data");
    XLSX.writeFile(workbook, filename);
};