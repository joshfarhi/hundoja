import { NextRequest, NextResponse } from 'next/server';
import { createStripeInstance } from '@/lib/stripe';
import { supabase } from '@/lib/supabase';
import { headers } from 'next/headers';

const stripe = createStripeInstance();

export async function POST(req: NextRequest) {
  const body = await req.text();
  const headersList = await headers();
  const signature = headersList.get('stripe-signature');

  if (!signature) {
    return NextResponse.json({ error: 'No signature' }, { status: 400 });
  }

  try {
    const event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    );

    switch (event.type) {
      case 'payment_intent.succeeded':
        const paymentIntent = event.data.object;
        
        // Update order payment status
        const { error } = await supabase
          .from('orders')
          .update({
            payment_status: 'paid',
            status: 'processing',
          })
          .eq('stripe_payment_intent_id', paymentIntent.id);

        if (error) {
          console.error('Error updating order payment status:', error);
        }
        break;

      case 'payment_intent.payment_failed':
        const failedPayment = event.data.object;
        
        await supabase
          .from('orders')
          .update({
            payment_status: 'failed',
          })
          .eq('stripe_payment_intent_id', failedPayment.id);
        break;
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('Webhook error:', error);
    return NextResponse.json({ error: 'Webhook error' }, { status: 400 });
  }
}