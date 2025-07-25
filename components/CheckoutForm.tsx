'use client';

import React, { useState } from 'react';
import { useStripe, useElements, PaymentElement } from '@stripe/react-stripe-js';
import { useCart } from '@/contexts/CartContext';
import { useRouter } from 'next/navigation';
import { useUser } from '@clerk/nextjs';

export default function CheckoutForm() {
  const stripe = useStripe();
  const elements = useElements();
  const { state, dispatch } = useCart();
  const router = useRouter();
  const { user } = useUser();
  
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Create payment intent
      const response = await fetch('/api/create-payment-intent', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          amount: state.total,
          currency: 'usd',
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to create payment intent');
      }

      const { clientSecret, paymentIntentId } = await response.json();

      // Confirm payment
      const { error } = await stripe.confirmPayment({
        elements,
        clientSecret,
        confirmParams: {
          return_url: `${window.location.origin}/checkout/success`,
        },
      });

      if (error) {
        setError(error.message || 'An error occurred during payment');
      } else {
        // Create order in database after successful payment
        try {
          const orderData = {
            items: state.items,
            total: state.total,
            subtotal: state.total, // You can calculate tax/shipping separately if needed
            billing_address: {
              name: user?.fullName || 'Customer',
              email: user?.primaryEmailAddress?.emailAddress || 'customer@example.com',
              line1: '123 Main St', // This should come from a form
              city: 'City',
              state: 'State', 
              postal_code: '12345',
              country: 'US',
            },
            shipping_address: {
              name: user?.fullName || 'Customer',
              email: user?.primaryEmailAddress?.emailAddress || 'customer@example.com',
              line1: '123 Main St', // This should come from a form
              city: 'City',
              state: 'State',
              postal_code: '12345', 
              country: 'US',
            },
            stripe_payment_intent_id: paymentIntentId,
          };

          const orderResponse = await fetch('/api/orders/create', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(orderData),
          });

          if (!orderResponse.ok) {
            console.error('Failed to create order record');
          } else {
            const orderResult = await orderResponse.json();
            console.log('Order created:', orderResult.order_number);
          }
        } catch (orderError) {
          console.error('Error creating order:', orderError);
        }

        // Clear cart on successful payment
        dispatch({ type: 'CLEAR_CART' });
        router.push('/checkout/success');
      }
    } catch {
      setError('An error occurred during payment');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <PaymentElement 
        options={{
          layout: 'tabs',
        }}
      />
      
      {error && (
        <div className="bg-red-900/20 border border-red-500 text-red-300 px-4 py-3 rounded">
          {error}
        </div>
      )}

      <button
        type="submit"
        disabled={!stripe || isLoading}
        className="w-full bg-white text-black py-4 font-semibold hover:bg-gray-200 disabled:bg-gray-600 disabled:text-gray-400 transition-colors duration-300"
      >
        {isLoading ? 'Processing...' : `Pay $${state.total.toFixed(2)}`}
      </button>

      <p className="text-gray-400 text-sm text-center">
        Your payment information is secure and encrypted
      </p>
    </form>
  );
}