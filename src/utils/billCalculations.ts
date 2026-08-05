import { parseISO, differenceInDays } from 'date-fns';

interface SizeBalance {
  size: string;
  main: number;
  borrowed: number;
  total: number;
}

interface ExtraCost {
  date: string;
  note: string;
  pieces: number;
  pricePerPiece: number;
  total: number;
}

interface Discount {
  date: string;
  note: string;
  pieces: number;
  discountPerPiece: number;
  total: number;
}

interface Payment {
  date: string;
  method: 'cash' | 'bank' ;
  note: string;
  amount: number;
}

interface SizeBreakdown {
  pieces: number;
  days: number;
  rate: number;
  amount: number;
}

interface BillSummary {
  days: number;
  sizeBreakdown: Record<string, SizeBreakdown>;
  totalRent: number;
  totalUdharPlates: number;
  totalJamaPlates: number;
  netPlates: number;
  serviceCharge: number;
  totalExtraCosts: number;
  totalDiscounts: number;
  grandTotal: number;
  totalPayments: number;
  advancePaid: number;
  duePayment: number;
}

export const calculateDays = (fromDate: string, toDate: string): number => {
  try {
    // Parse the dates and ensure they're valid
    const start = parseISO(fromDate);
    const end = parseISO(toDate);
    
    // Calculate days including both start and end dates
    return differenceInDays(end, start) + 1;
  } catch (error) {
    console.error('Error calculating days:', error);
    return 0;
  }
};

export const calculateRentForSize = (
  pieces: number,
  days: number,
  dailyRent: number
): number => {
  // Ensure all values are numbers and not null/undefined
  const validPieces = Number(pieces) || 0;
  const validDays = Number(days) || 0;
  const validDailyRent = Number(dailyRent) || 0;

  // Calculate with decimal precision (dailyRent is rate per 100 plates)
  return Math.round(validPieces * validDays * validDailyRent) / 100;
};

export const calculateTotalPlates = (sizeBalances: Record<string, SizeBalance>): {
  udharPlates: number;
  jamaPlates: number;
  netPlates: number;
} => {
  if (!sizeBalances) return { udharPlates: 0, jamaPlates: 0, netPlates: 0 };

  let totalUdhar = 0;
  let totalJama = 0;

  Object.values(sizeBalances).forEach(balance => {
    totalUdhar += balance.main || 0;
    totalJama += balance.borrowed || 0;
  });

  return {
    udharPlates: totalUdhar,
    jamaPlates: totalJama,
    netPlates: totalUdhar - totalJama
  };
};

export const calculateServiceCharge = (
  totalUdharPlates: number,
  serviceRatePerPlate: number,
  overrideAmount?: number
): number => {
  if (typeof overrideAmount === 'number') {
    return overrideAmount;
  }
  return Math.round((totalUdharPlates * serviceRatePerPlate) * 100) / 100;
};

export const calculateRentBreakdown = (
  sizeBalances: Record<string, SizeBalance>,
  days: number,
  dailyRent: number
): { breakdown: Record<string, SizeBreakdown>, total: number } => {
  if (!sizeBalances) return { breakdown: {}, total: 0 };

  const breakdown: Record<string, SizeBreakdown> = {};
  let totalRent = 0;

  Object.entries(sizeBalances).forEach(([size, balance]) => {
    const totalPieces = balance.total;
    if (totalPieces > 0) {
      const amount = calculateRentForSize(totalPieces, days, dailyRent);
      breakdown[size] = {
        pieces: totalPieces,
        days,
        rate: dailyRent,
        amount
      };
      totalRent += amount;
    }
  });

  return { breakdown, total: totalRent };
};

export const calculateTotalExtraCosts = (extraCosts: ExtraCost[]): number => {
  // Handle null/undefined extraCosts
  if (!extraCosts) return 0;

  return extraCosts.reduce((total, cost) => {
    // Ensure the total is a valid number
    const costTotal = Number(cost.total) || 0;
    return total + costTotal;
  }, 0);
};

export const calculateTotalDiscounts = (discounts: Discount[]): number => {
  // Handle null/undefined discounts
  if (!discounts) return 0;

  return discounts.reduce((total, discount) => {
    // Ensure the total is a valid number
    const discountTotal = Number(discount.total) || 0;
    return total + discountTotal;
  }, 0);
};

export const calculateTotalPayments = (payments: Payment[]): number => {
  // Handle null/undefined payments
  if (!payments) return 0;

  return payments.reduce((total, payment) => {
    // Ensure the amount is a valid number
    const amount = Number(payment.amount) || 0;
    return total + amount;
  }, 0);
};

export const calculateGrandTotal = (
  totalRent: number,
  serviceCharge: number,
  totalExtraCosts: number
): number => {
  // Ensure all values are numbers
  const validRent = Number(totalRent) || 0;
  const validServiceCharge = Number(serviceCharge) || 0;
  const validExtraCosts = Number(totalExtraCosts) || 0;

  // Calculate with decimal precision
  return Math.round((validRent + validServiceCharge + validExtraCosts) * 100) / 100;
};

export const calculateDuePayment = (
  grandTotal: number,
  totalPayments: number
): number => {
  // Ensure all values are numbers
  const validGrandTotal = Number(grandTotal) || 0;
  const validTotalPayments = Number(totalPayments) || 0;

  // Calculate with decimal precision
  return Math.round((validGrandTotal - validTotalPayments) * 100) / 100;
};

// Validate bill calculations
export const validateBillCalculations = (summary: BillSummary): boolean => {
  // Calculate total rent from size breakdown
  const calculatedRent = Object.values(summary.sizeBreakdown).reduce(
    (total, size) => total + size.amount,
    0
  );

  // Calculate grand total
  const calculatedGrandTotal = calculatedRent + summary.totalExtraCosts - summary.totalDiscounts;
  
  // Calculate due payment
  const calculatedDuePayment = calculatedGrandTotal - summary.totalPayments;

  // Check if calculations match with small margin for floating point precision
  const isValid = 
    Math.abs(calculatedRent - summary.totalRent) < 0.01 &&
    Math.abs(calculatedGrandTotal - summary.grandTotal) < 0.01 &&
    Math.abs(calculatedDuePayment - summary.duePayment) < 0.01;

  if (!isValid) {
    console.error('Bill Calculation Validation Failed:', {
      expected: {
        totalRent: calculatedRent,
        grandTotal: calculatedGrandTotal,
        duePayment: calculatedDuePayment
      },
      actual: {
        totalRent: summary.totalRent,
        grandTotal: summary.grandTotal,
        duePayment: summary.duePayment
      }
    });
  }

  return isValid;
};

export const getBillSummary = (
  fromDate: string,
  toDate: string,
  dailyRent: number,
  sizeBalances: Record<string, SizeBalance>,
  extraCosts: ExtraCost[],
  discounts: Discount[],
  payments: Payment[],
  serviceRatePerPlate: number,
  serviceChargeOverride?: number,
  advancePaid: number = 0
): BillSummary => {
  // Step 1: Calculate days
  const days = calculateDays(fromDate, toDate);

  // Step 2: Calculate plate totals
  const { udharPlates, jamaPlates, netPlates } = calculateTotalPlates(sizeBalances);

  // Step 3: Calculate service charge
  const serviceCharge = calculateServiceCharge(udharPlates, serviceRatePerPlate, serviceChargeOverride);

  // Step 4: Calculate total rent with size breakdown
  const rentCalculation = calculateRentBreakdown(sizeBalances, days, dailyRent);

  // Step 5: Calculate total extra costs
  const totalExtraCosts = calculateTotalExtraCosts(extraCosts);

  // Step 6: Calculate total discounts
  const totalDiscounts = calculateTotalDiscounts(discounts);

  // Step 7: Calculate total payments
  const totalPayments = calculateTotalPayments(payments);

  // Step 8: Calculate grand total
  const grandTotal = calculateGrandTotal(rentCalculation.total, serviceCharge, totalExtraCosts);

  // Step 9: Calculate due payment considering advance
  const duePayment = grandTotal - totalDiscounts - advancePaid - totalPayments;

  // Create final summary with all details
  const summary: BillSummary = {
    days,
    sizeBreakdown: rentCalculation.breakdown,
    totalRent: rentCalculation.total,
    totalUdharPlates: udharPlates,
    totalJamaPlates: jamaPlates,
    netPlates,
    serviceCharge,
    totalExtraCosts,
    totalDiscounts,
    grandTotal,
    totalPayments,
    advancePaid,
    duePayment
  };

  // Validate calculations
  validateBillCalculations(summary);

  return summary;
};