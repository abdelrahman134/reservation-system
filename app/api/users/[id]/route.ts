import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import User from '@/lib/models/User';
import Reservation from '@/lib/models/Reservation';
import { userSchema } from '@/lib/validations';

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
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

    const updatedUser = await User.findByIdAndUpdate(
      params.id,
      { name: validation.data.name },
      { new: true }
    );

    if (!updatedUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    return NextResponse.json(updatedUser);
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to update user' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await dbConnect();

    // Check if user has active/confirmed reservations
    const activeReservationsCount = await Reservation.countDocuments({
      user: params.id,
      isActive: true,
      status: { $in: ['confirmed', 'completed'] },
    });

    // Soft delete user
    const user = await User.findByIdAndUpdate(
      params.id,
      { isActive: false },
      { new: true }
    );

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    return NextResponse.json({
      message: 'User soft-deleted successfully',
      warning:
        activeReservationsCount > 0
          ? `User had ${activeReservationsCount} associated reservation(s). Historical reservation records are preserved.`
          : undefined,
      user,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to delete user' },
      { status: 500 }
    );
  }
}
