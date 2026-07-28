import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import User from '@/lib/models/User';
import Reservation from '@/lib/models/Reservation';
import { userSchema } from '@/lib/validations';
import mongoose from 'mongoose';

export async function GET() {
  try {
    await dbConnect();

    // Fetch active users with aggregated reservation count and total revenue
    const usersWithStats = await User.aggregate([
      { $match: { isActive: true } },
      {
        $lookup: {
          from: 'reservations',
          let: { userId: '$_id' },
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [
                    { $eq: ['$user', '$$userId'] },
                    { $eq: ['$isActive', true] },
                    { $ne: ['$status', 'cancelled'] },
                  ],
                },
              },
            },
          ],
          as: 'reservations',
        },
      },
      {
        $project: {
          _id: 1,
          name: 1,
          isActive: 1,
          createdAt: 1,
          updatedAt: 1,
          reservationCount: { $size: '$reservations' },
          totalValue: { $sum: '$reservations.value' },
        },
      },
      { $sort: { createdAt: -1 } },
    ]);

    return NextResponse.json(usersWithStats);
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to fetch users' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    await dbConnect();
    const body = await req.json();

    const validation = userSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error.errors[0].message },
        { status: 400 }
      );
    }

    const newUser = await User.create(validation.data);
    return NextResponse.json(newUser, { status: 201 });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to create user' },
      { status: 500 }
    );
  }
}
