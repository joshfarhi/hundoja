import { NextRequest, NextResponse } from 'next/server';

interface ShippingRequest {
  address: {
    line1: string;
    city: string;
    state: string;
    postal_code: string;
    country: string;
  };
  items: Array<{
    id: string;
    quantity: number;
    price: number;
  }>;
}

export async function POST(request: NextRequest) {
  try {
    const body: ShippingRequest = await request.json();
    const { address, items } = body;

    if (!address || !items || items.length === 0) {
      return NextResponse.json(
        { error: 'Missing address or items' },
        { status: 400 }
      );
    }

    // Calculate shipping based on address and items
    const shippingCost = calculateShippingCost(address, items);

    return NextResponse.json({
      shipping_cost: shippingCost,
      estimated_delivery: '5-7 business days',
      shipping_method: 'Standard Shipping'
    });

  } catch (error) {
    console.error('Shipping calculation error:', error);
    return NextResponse.json(
      { error: 'Failed to calculate shipping' },
      { status: 500 }
    );
  }
}

function calculateShippingCost(
  address: ShippingRequest['address'],
  items: ShippingRequest['items']
): number {
  // Basic shipping calculation logic

  // Base shipping cost
  let baseCost = 9.99;

  // Calculate total item weight/quantity factor
  const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);
  const totalValue = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);

  // Additional cost based on item count
  if (totalItems > 3) {
    baseCost += (totalItems - 3) * 2.00; // $2 per additional item
  }

  // Free shipping threshold
  if (totalValue >= 150) {
    return 0; // Free shipping over $150
  }

  // Regional adjustments
  if (address.state) {
    // Higher cost for Alaska and Hawaii
    if (['AK', 'HI'].includes(address.state.toUpperCase())) {
      baseCost += 15.00;
    }

    // Slightly higher for West Coast
    if (['CA', 'OR', 'WA'].includes(address.state.toUpperCase())) {
      baseCost += 3.00;
    }
  }

  return Math.round(baseCost * 100) / 100; // Round to 2 decimal places
}
