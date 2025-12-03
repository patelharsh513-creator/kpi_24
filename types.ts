

// Raw data entered by the user
export interface DailyInputs {
    date: string;
    totalRevenue: number;
    serviceFee: number;
    catering: number;
    meals: number;
    addOns: number;
    
    // Per-Stop Dispatching Costs
    packator1Stops: number;
    packator2Stops: number;
    packator3Stops: number;

    // packatorPickups removed as per new logic
    samirStops: number;
    samirPickupStops: number; // Renamed for clarity
    jozefStops: number;
    jozefPickups: number;
    aliStops: number;
    aliPickups: number;
    ali2Stops: number;
    ali2Pickups: number;
    ali3Stops: number;
    ali3Pickups: number;
    ali4Stops: number;
    ali4Pickups: number;

    // NEW: Additional Revenue Streams (moved from dispatchers)
    gygCateringRevenue: number;
    revoluteRevenue: number;

    // Internal Costs & Operations
    internalStaffCount: number;
    internalDeliveries: number; // Manual entry for internal deliveries
    internalPickups: number;    // NEW: Manual entry for internal pickups
    internalFuel: number;       // NEW: Fuel cost for internal fleet

    // Extra Costs
    extraCost: number;
    extraCostNote: string;

    // Operational KPIs
    manualTotalDeliveries: number; // NEW: Manual override for total delivery count
    dishesScanned: number;
    deliveriesLate: number;
    minutesLate: number;
}

// Calculated values based on inputs
export interface CalculatedData {
    totalDispatchingCost: number; // This is Total External Cost
    internalStaffCost: number;
    totalLogisticCost: number;
    logisticCostPercentage: number; // Overall logistic cost % (totalLogisticCost / totalOverallRevenue)
    mainRevenuePercentage: number; // Main Revenue Share % (mainRevenueTotal / totalOverallRevenue) - Renamed from Core
    addonsMealsPercentage: number;
    netProfit: number;
    costBreakdown: { name: string; value: number }[];
    
    packatorCost: number; // Total Packator related cost (Stop + Dispatch)
    packatorStopCost: number; // Portion paid to Packator
    packatorDispatchCost: number; // Portion paid to Ali (15 per stop)
    
    samirCost: number;
    samirPickupCost: number; // Specific cost for Samir pickups
    jozefCost: number;
    aliCost: number;
    aliPickupCost: number; // Specific cost for Ali pickups
    ali2Cost: number;
    ali3Cost: number;
    ali4Cost: number;

    // NEW: Revenue breakdown
    mainRevenueTotal: number; // Revenue excluding GYG and Revolute (totalRevenue + serviceFee + catering) - Renamed from Core
    totalOverallRevenue: number; // Total Revenue including GYG Catering and Revolute Sales

    // Aggregated Totals for Payment Verification
    totalAliPayable: number;      // Ali 1-4 + Jozef + Packator Dispatch
    totalPackatorPayable: number; // Service fees only
    totalSamirPayable: number;    // All Samir costs

    // Unit Economics
    totalExternalStops: number;
    totalStops: number; // Internal + External
    externalCostPerStop: number;
    logisticCostPerDish: number;
    logisticCostPerStop: number;
    mealsPerDelivery: number;
    mealsPerStop: number; // New metric
}

// Represents a full day's record, combining inputs and calculated values
export type DailyRecord = DailyInputs & CalculatedData;

// --- BELLABONA SPECIFIC TYPES ---

export type BellabonaKitchen = 'berlin' | 'munich' | 'koln';

export interface KitchenMetrics {
    // New Unit Inputs
    pricePerDish: number; // Price without Fee
    pricePerDishWithFee: number;
    dishesOrdered: number; // Number of dishes sold
    
    // Revenue Fields (Actual)
    mainDishRevenue: number; // Renamed from dishRevenue (Manual entry)
    mainBusiness: number; // Revenue from dishes (Kitchen Revenue)
    serviceFee: number;   // Revenue from fees
    cateringCharges: number;
    
    // Revenue Fields (Expected / Target) - Carries over monthly
    expectedMainBusiness?: number;
    expectedServiceFee?: number;
    expectedCateringCharges?: number;

    cogs: number; // Cost of Goods Sold
    
    // Leftovers
    leftoverCount: number; // Number of leftover dishes
    
    // Deprecated / Removed from UI but kept optional for legacy data compatibility
    leftoversGenerated?: number; 
    leftoversSold?: number; 
    
    // Calculated per kitchen (Derived)
    totalRevenue: number;
    cogsPercentage: number;
    leftoverPercentage: number; // (Leftover / (Ordered + Leftover))
}

export interface BellabonaRecord {
    date: string;
    berlin: KitchenMetrics;
    munich: KitchenMetrics;
    koln: KitchenMetrics;
    
    // Global Calculated
    totalGlobalRevenue: number;
    globalWowGrowth: number;
}


// State for the main App component
export interface AppState {
  records: DailyRecord[];
  // Partial because the user fills it field by field
  currentInputs: Partial<DailyInputs>;
  error: string | null;
  success: string | null;
}

// Period Totals for Week/Month projection (used in App.tsx and DataEntryForm.tsx)
export interface PeriodTotals {
    weekly: {
        payableAli: number;
        payablePackator: number;
        payableSamir: number;
        totalOverallRevenue: number;
        mainRevenueTotal: number;
        gygCateringRevenueTotal: number;
        revoluteRevenueTotal: number;
        totalLogisticCost: number; // Added
        avgOverallLogisticCostPercentage: number;
        avgMainRevenuePercentage: number;
        combinedFixedStops: number;
    };
    monthly: {
        payableAli: number;
        payablePackator: number;
        payableSamir: number;
        totalOverallRevenue: number;
        mainRevenueTotal: number;
        gygCateringRevenueTotal: number;
        revoluteRevenueTotal: number;
        totalLogisticCost: number; // Added
        avgOverallLogisticCostPercentage: number;
        avgMainRevenuePercentage: number;
        combinedFixedStops: number;
    };
}

// Period Totals for Week/Month Payables Summary (used in KpiDashboard.tsx)
export interface DashboardPeriodTotals {
    weekly: {
        payableAli: number;
        payablePackator: number;
        payableSamir: number;
        totalOverallRevenue: number;
        mainRevenueTotal: number;
        gygCateringRevenueTotal: number;
        revoluteRevenueTotal: number;
        totalLogisticCost: number; // Added
        avgOverallLogisticCostPercentage: number;
        avgMainRevenuePercentage: number;
    };
    monthly: {
        payableAli: number;
        payablePackator: number;
        payableSamir: number;
        totalOverallRevenue: number;
        mainRevenueTotal: number;
        gygCateringRevenueTotal: number;
        revoluteRevenueTotal: number;
        totalLogisticCost: number; // Added
        avgOverallLogisticCostPercentage: number;
        avgMainRevenuePercentage: number;
    };
    weekLabel: string;
    monthLabel: string;
}
