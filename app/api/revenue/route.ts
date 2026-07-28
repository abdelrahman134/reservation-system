import { NextRequest, NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import dbConnect from '@/lib/mongodb';
import Revenue from '@/lib/models/Revenue';
import { revenueSchema } from '@/lib/validations';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    await dbConnect();
    const { searchParams } = new URL(req.url);
    const user = searchParams.get('user');
    const source = searchParams.get('source');
    const fromDate = searchParams.get('fromDate');
    const toDate = searchParams.get('toDate');

    const filter: any = { isActive: true };
    if (user) filter.user = user;
    if (source) filter.source = source;
    if (fromDate || toDate) {
      filter.createdAt = {};
      if (fromDate) filter.createdAt.$gte = new Date(fromDate);
      if (toDate) filter.createdAt.$lte = new Date(toDate);
    }

    const revenues = await Revenue.find(filter)
      .populate('user', 'name')
      .populate('reservation')
      .sort({ createdAt: -1 });

    return NextResponse.json(revenues);
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to fetch revenue logs' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    await dbConnect();
    const body = await req.json();

    const validation = revenueSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error.errors[0].message },
        { status: 400 }
      );
    }

    const newRevenue = await Revenue.create({
      ...validation.data,
      isActive: true,
    });

    revalidatePath('/revenue');
    revalidatePath('/insights');

    const populated = await newRevenue.populate('user', 'name');
    return NextResponse.json(populated, { status: 201 });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to create revenue log' },
      { status: 500 }
    );
  }
}
