
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

    // Internal Costs & Operations
    internalStaffCount: number;
    internalDeliveries: number; // Manual entry for internal deliveries
    internalPickups: number;    // NEW: Manual entry for internal pickups
    internalFuel: number;       // NEW: Fuel cost for internal fleet

    // Extra Costs
    extraCost: number;
    extraCostNote: string;

    // Operational KPIs
    dishesScanned: number;
    deliveriesLate: number;
    minutesLate: number;
}

// Calculated values based on inputs
export interface CalculatedData {
    totalDispatchingCost: number; // This is Total External Cost
    internalStaffCost: number;
    totalLogisticCost: number;
    logisticCostPercentage: number;
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

    // New Unit Economics & Efficiency KPIs
    totalExternalStops: number;
    totalStops: number; // External + Internal (Deliveries + Pickups)
    externalCostPerStop: number;
    logisticCostPerDish: number;
    logisticCostPerStop: number;
    mealsPerDelivery: number;

    // Aggregated Totals for Payment Verification
    totalAliPayable: number;      // Ali 1-4 + Jozef + Packator Dispatch
    totalPackatorPayable: number; // Service fees only
    totalSamirPayable: number;    // All Samir costs
}

// Represents a full day's record, combining inputs and calculated values
export type DailyRecord = DailyInputs & CalculatedData;

// State for the main App component
export interface AppState {
  records: DailyRecord[];
  // Partial because the user fills it field by field
  currentInputs: Partial<DailyInputs>;
  error: string | null;
  success: string | null;
}
