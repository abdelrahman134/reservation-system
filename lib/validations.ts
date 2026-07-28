import { z } from 'zod';

export const userSchema = z.object({
  name: z.string().min(1, 'Staff name is required').max(100),
});

export const apartmentSchema = z.object({
  name: z.string().min(1, 'Apartment name is required').max(100),
});

export const brokerSchema = z.object({
  name: z.string().min(1, 'Broker name is required').max(100),
  defaultPercentage: z.number().min(0, 'Percentage cannot be negative').max(100, 'Percentage cannot exceed 100%'),
});

export const reservationSchema = z.object({
  clientName: z.string().min(1, 'Client name is required').max(100),
  clientPhone: z.string().min(1, 'Client phone is required').max(50),
  apartment: z.string().min(1, 'Apartment is required'),
  createdByStaff: z.string().min(1, 'Staff member is required'),
  broker: z.string().optional().nullable(),
  commissionPercentage: z.number().min(0).max(100).optional().default(10),
  startDate: z.string().or(z.date()).transform((val) => new Date(val)),
  endDate: z.string().or(z.date()).transform((val) => new Date(val)),
  pricePerDay: z.number().min(0, 'Price per day must be positive'),
  deposit: z.number().min(0, 'Deposit must be non-negative'),
  status: z.enum(['confirmed', 'cancelled', 'completed']).optional().default('confirmed'),
}).refine((data) => data.endDate > data.startDate, {
  message: 'Check-out date must be after Check-in date',
  path: ['endDate'],
});

export const deliverySchema = z.object({
  reservation: z.string().min(1, 'Reservation ID is required'),
  staffUser: z.string().min(1, 'Delivering Staff User is required'),
  insurance: z.number().min(0, 'Insurance must be non-negative'),
  totalValue: z.number().min(0, 'Total cash collected value is required'),
  nationalIdPhotos: z.array(z.string()).optional().default([]),
});

export const receiverSchema = z.object({
  reservation: z.string().min(1, 'Reservation ID is required'),
  staffUser: z.string().min(1, 'Receiving Staff User is required'),
  returnInsurance: z.number().min(0, 'Return insurance must be non-negative'),
});

export const expenseSchema = z.object({
  name: z.string().min(1, 'Expense description is required'),
  value: z.number().min(0, 'Value must be positive'),
  user: z.string().min(1, 'Staff user is required'),
  source: z.enum(['manual', 'receiver-return', 'broker-payout']).optional().default('manual'),
  broker: z.string().optional().nullable(),
});

export const revenueSchema = z.object({
  name: z.string().min(1, 'Revenue description is required'),
  value: z.number().min(0, 'Value must be positive'),
  user: z.string().min(1, 'Staff user is required'),
  source: z.enum(['manual', 'deposit', 'delivery']).optional().default('manual'),
});
