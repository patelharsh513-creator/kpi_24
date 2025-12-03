
import { useMemo } from 'react';
import { DailyInputs, CalculatedData } from '../types';

// --- NEW FORMULA-BASED CALCULATIONS ---

/**
 * Calculates cost based on the standard pricing model.
 * Rule: 75 for 3-4 stops, then +10 for each additional stop.
 * Used for: Samir Deliveries,
 */
const calculateStandardCost = (stops: number): number => {
    if (stops <= 0) return 0;
    if (stops <= 2) return 0; // No price for 1 or 2 stops
    if (stops <= 4) return 75;
    return 75 + (stops - 4) * 10;
};

/**
 * Calculates cost based on the unique pricing model for Packator.
 * Rule: 95 for 3-4 stops, then +13 for each additional stop.
 */
const calculatePackatorCost = (stops: number): number => {
    if (stops <= 0) return 0;
    if (stops <= 2) return 0;
    if (stops <= 4) return 95;
    return 95 + (stops - 4) * 13;
};

/**
 * Calculates cost for Ali 3 and Ali 4.
 * Rule: Base dispatching fee of 50 + 10 per stop.
 */
const calculateAli34Cost = (stops: number): number => {
    if (stops <= 0) return 0;
    return 50 + (stops * 10);
};

// --- STANDALONE CALCULATION FUNCTION ---
// Exported so App.tsx can use it to fix historical data
export const calculatekpi = (inputs: Partial<DailyInputs>): CalculatedData => {
    // --- CRITICAL FIX: Safe Parsing ---
    // We must ensure ALL inputs are converted to primitive Numbers before ANY math is performed.
    const safeNum = (val: any) => {
        if (val === '' || val === null || val === undefined) return 0;
        const n = parseFloat(val);
        return isNaN(n) ? 0 : n;
    };

    const totalRevenue = safeNum(inputs.totalRevenue);
    const serviceFee = safeNum(inputs.serviceFee);
    const catering = safeNum(inputs.catering);
    const meals = safeNum(inputs.meals);
    const addOns = safeNum(inputs.addOns);

    const packator1Stops = safeNum(inputs.packator1Stops);
    const packator2Stops = safeNum(inputs.packator2Stops);
    const packator3Stops = safeNum(inputs.packator3Stops);

    const samirStops = safeNum(inputs.samirStops);
    const samirPickupStops = safeNum(inputs.samirPickupStops);
    
    const jozefStops = safeNum(inputs.jozefStops);
    const jozefPickups = safeNum(inputs.jozefPickups); 

    const aliStops = safeNum(inputs.aliStops);
    const aliPickups = safeNum(inputs.aliPickups);
    
    const ali2Stops = safeNum(inputs.ali2Stops);
    const ali2Pickups = safeNum(inputs.ali2Pickups);

    const ali3Stops = safeNum(inputs.ali3Stops);
    const ali3Pickups = safeNum(inputs.ali3Pickups);

    const ali4Stops = safeNum(inputs.ali4Stops);
    const ali4Pickups = safeNum(inputs.ali4Pickups);

    // NEW: GYG Catering and Revolute are now revenue
    const gygCateringRevenue = safeNum(inputs.gygCateringRevenue);
    const revoluteRevenue = safeNum(inputs.revoluteRevenue);

    const internalStaffCount = safeNum(inputs.internalStaffCount);
    const internalDeliveries = safeNum(inputs.internalDeliveries);
    const internalPickups = safeNum(inputs.internalPickups);
    const internalFuel = safeNum(inputs.internalFuel);

    const extraCost = safeNum(inputs.extraCost);
    const extraCostNote = inputs.extraCostNote || '';

    const manualTotalDeliveries = safeNum(inputs.manualTotalDeliveries);
    
    // --- PER-STOP COST CALCULATIONS ---
    
    // Packator Logic:
    const packator1Cost = calculatePackatorCost(packator1Stops);
    const packator2Cost = calculatePackatorCost(packator2Stops);
    const packator3Cost = calculatePackatorCost(packator3Stops);
    const packatorStopCost = packator1Cost + packator2Cost + packator3Cost;

    // Packator Dispatch Cost (Paid to Ali): 15 Euro * Number of Packator WORKING (Active)
    const activePackators = [packator1Stops, packator2Stops, packator3Stops].filter(stops => stops > 0).length;
    const packatorDispatchCost = activePackators * 15;
    
    const packatorCost = packatorStopCost + packatorDispatchCost;
    
    // Samir:
    const samirPickupCost = samirPickupStops * 10;
    const samirCost = calculateStandardCost(samirStops) + samirPickupCost;

    // Jozef: Fixed 130 Euro if active
    const jozefCost = jozefStops > 0 ? 130 : 0;

    // Ali: Fixed 110 Euro for deliveries + 10 Euro per pickup
    const aliFixedCost = aliStops > 0 ? 110 : 0;
    const aliPickupCost = aliPickups * 10;
    const aliCost = aliFixedCost + aliPickupCost;

    // Ali 2: Fixed 110 Euro if active
    const ali2Cost = ali2Stops > 0 ? 110 : 0;

    // Ali 3 & Ali 4: Dispatching 50 + 10 per stop
    const ali3Cost = calculateAli34Cost(ali3Stops);
    const ali4Cost = calculateAli34Cost(ali4Stops);
    
    // --- INTERNAL COST CALCULATION ---
    const internalStaffCost = internalStaffCount * 110 + internalFuel;

    // Total Dispatching Cost (External Only)
    const totalDispatchingCost = packatorCost + samirCost + jozefCost + aliCost + ali2Cost + ali3Cost + ali4Cost;
    
    // Total Logistic Cost includes Dispatching + Internal + Extra Cost
    const totalLogisticCost = totalDispatchingCost + internalStaffCost + internalFuel + extraCost;

    // --- REVENUE DEFINITIONS ---
    // Main Revenue = Total Revenue (Input) + Service Fee + Catering
    const mainRevenueTotal = totalRevenue + serviceFee + catering;

    // Overall Revenue = Main Revenue + GYG Catering Sales + Revolute Sales
    const totalOverallRevenue = mainRevenueTotal + gygCateringRevenue + revoluteRevenue;
    
    // Overall Logistic Cost Percentage: Uses totalOverallRevenue as base
    const logisticCostPercentage = totalOverallRevenue > 0 ? totalLogisticCost / totalOverallRevenue : 0;

    // Main Revenue Share Percentage: How much of the TOTAL revenue is Main?
    const mainRevenuePercentage = totalOverallRevenue > 0 ? mainRevenueTotal / totalOverallRevenue : 0;

    const addonsMealsPercentage = meals > 0 ? addOns / meals : 0;
    
    // Net Profit: Now includes GYG Catering Revenue and Revolute Revenue positively
    const netProfit = totalOverallRevenue - totalLogisticCost;

    // --- UNIT ECONOMICS & EFFICIENCY ---
    
    const totalExternalStops = packator1Stops + packator2Stops + packator3Stops + samirStops + jozefStops + aliStops + ali2Stops + ali3Stops + ali4Stops;
    
    // LOGIC UPDATE: Separate "Stops" vs "Deliveries"
    // Stops = Internal delivery + Total External stops
    const totalStops = totalExternalStops + internalDeliveries;

    // Deliveries = Manual Entry Only
    const totalDeliveries = manualTotalDeliveries;

    // 1. Logistic Cost per Dish = Total Meals (Dishes) / Total Cost (Correct Financial Metric)
    const logisticCostPerDish = totalLogisticCost > 0 ? meals / totalLogisticCost : 0;
    
    // 2. Logistic Cost per Stop = Total Logistic cost / Stops
    const logisticCostPerStop = totalStops > 0 ? totalLogisticCost / totalStops : 0;

    // 3. Meals per Stop = Meals / Stops (Drop Size)
    const mealsPerStop = totalStops > 0 ? meals / totalStops : 0;
    
    // 4. Meals per Delivery
    const mealsPerDelivery = totalDeliveries > 0 ? meals / totalDeliveries : 0;

    const externalCostPerStop = totalExternalStops > 0 ? totalDispatchingCost / totalExternalStops : 0;

    // --- PAYABLES ---
    const totalAliPayable = aliCost + ali2Cost + ali3Cost + ali4Cost + jozefCost + packatorDispatchCost + extraCost;
    const totalPackatorPayable = packatorStopCost;
    const totalSamirPayable = samirCost;

    // Remove filter to keep color indices stable
    const costBreakdown = [
      { name: 'Packator Services', value: packatorStopCost },
      { name: 'Packator Dispatch (Ali)', value: packatorDispatchCost },
      { name: 'Samir', value: samirCost },
      { name: 'Jozef', value: jozefCost },
      { name: 'Ali', value: aliCost },
      { name: 'Ali 2', value: ali2Cost },
      { name: 'Ali 3', value: ali3Cost },
      { name: 'Ali 4', value: ali4Cost },
      { name: 'Internal Staff', value: internalStaffCost },
      { name: 'Internal Fuel', value: internalFuel },
      { name: 'Extra Costs', value: extraCost },
    ];

    return {
      totalDispatchingCost,
      internalStaffCost,
      totalLogisticCost,
      logisticCostPercentage,
      mainRevenuePercentage, 
      addonsMealsPercentage,
      netProfit,
      costBreakdown,
      packatorCost,
      packatorStopCost,
      packatorDispatchCost,
      samirCost,
      samirPickupCost,
      jozefCost,
      aliCost,
      aliPickupCost,
      ali2Cost,
      ali3Cost,
      ali4Cost,
      totalOverallRevenue,
      mainRevenueTotal,
      totalAliPayable,
      totalPackatorPayable,
      totalSamirPayable,
      totalExternalStops,
      totalStops,
      externalCostPerStop,
      logisticCostPerDish,
      logisticCostPerStop,
      mealsPerStop,
      mealsPerDelivery
    };
};

export const usekpiCalculations = (inputs: Partial<DailyInputs>): CalculatedData => {
  return useMemo(() => {
    return calculatekpi(inputs);
  }, [inputs]);
};
