'use client';

import React, { useState, useEffect } from 'react';
import { useStripe, useElements, PaymentElement } from '@stripe/react-stripe-js';
import { useCart } from '@/contexts/CartContext';
import { useRouter } from 'next/navigation';
import { useUser } from '@clerk/nextjs';
import { useToast } from '@/contexts/ToastContext';

export default function CheckoutForm() {
  const stripe = useStripe();
  const elements = useElements();
  const { state, dispatch } = useCart();
  const router = useRouter();
  const { user } = useUser();
  const { showToast } = useToast();
  
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Address form state
  const [billingAddress, setBillingAddress] = useState({
    name: user?.fullName || '',
    email: user?.primaryEmailAddress?.emailAddress || '',
    line1: '',
    city: '',
    state: '',
    postal_code: '',
    country: 'US',
  });

  const [shippingAddress, setShippingAddress] = useState({
    name: user?.fullName || '',
    email: user?.primaryEmailAddress?.emailAddress || '',
    line1: '',
    city: '',
    state: '',
    postal_code: '',
    country: 'US',
  });

  const [useSameAddress, setUseSameAddress] = useState(true);
  const [isCalculatingShipping, setIsCalculatingShipping] = useState(false);
  const [shippingCalculated, setShippingCalculated] = useState(false);

  // Validation function
  const validateAddresses = () => {
    if (!billingAddress.name || !billingAddress.email || !billingAddress.line1 ||
        !billingAddress.city || !billingAddress.state || !billingAddress.postal_code) {
      return 'Please fill in all required billing address fields';
    }

    if (!useSameAddress && (!shippingAddress.name || !shippingAddress.email || !shippingAddress.line1 ||
        !shippingAddress.city || !shippingAddress.state || !shippingAddress.postal_code)) {
      return 'Please fill in all required shipping address fields';
    }

    return null;
  };

  // Calculate shipping cost
  const calculateShipping = async (address: typeof billingAddress) => {
    if (state.items.length === 0) return;

    setIsCalculatingShipping(true);
    try {
      const response = await fetch('/api/shipping-calculate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          address,
          items: state.items.map(item => ({
            id: item.id,
            quantity: item.quantity,
            price: item.price,
          })),
        }),
      });

      if (response.ok) {
        const data = await response.json();
        dispatch({ type: 'UPDATE_SHIPPING', payload: data.shipping_cost });
        setShippingCalculated(true);
      } else {
        console.error('Failed to calculate shipping');
        dispatch({ type: 'UPDATE_SHIPPING', payload: 0 });
      }
    } catch (error) {
      console.error('Shipping calculation error:', error);
      dispatch({ type: 'UPDATE_SHIPPING', payload: 0 });
    } finally {
      setIsCalculatingShipping(false);
    }
  };

  // Calculate shipping when billing address changes
  useEffect(() => {
    const hasRequiredFields = billingAddress.line1 && billingAddress.city &&
                             billingAddress.state && billingAddress.postal_code;

    if (hasRequiredFields && useSameAddress) {
      calculateShipping(billingAddress);
    }
  }, [billingAddress.line1, billingAddress.city, billingAddress.state, billingAddress.postal_code, useSameAddress]);

  // Calculate shipping when shipping address changes
  useEffect(() => {
    const hasRequiredFields = shippingAddress.line1 && shippingAddress.city &&
                             shippingAddress.state && shippingAddress.postal_code;

    if (hasRequiredFields && !useSameAddress) {
      calculateShipping(shippingAddress);
    }
  }, [shippingAddress.line1, shippingAddress.city, shippingAddress.state, shippingAddress.postal_code, useSameAddress]);

  // Calculate shipping when cart items change
  useEffect(() => {
    if (state.items.length > 0) {
      const address = useSameAddress ? billingAddress : shippingAddress;
      const hasRequiredFields = address.line1 && address.city &&
                               address.state && address.postal_code;

      if (hasRequiredFields) {
        calculateShipping(address);
      }
    }
  }, [state.items]);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    // Validate addresses
    const validationError = validateAddresses();
    if (validationError) {
      setError(validationError);
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
            subtotal: state.subtotal,
            shipping: state.shipping,
            billing_address: billingAddress,
            shipping_address: useSameAddress ? billingAddress : shippingAddress,
            stripe_payment_intent_id: paymentIntentId,
          };

          const orderResponse = await fetch('/api/orders/create', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(orderData),
          });

          if (!orderResponse.ok) {
            // Order creation failed, but payment succeeded - handle silently
          } else {
            // Order created successfully
            await orderResponse.json();
          }
        } catch (orderError) {
          console.error('Order creation failed after successful payment:', orderError);
          showToast('Payment successful, but order creation failed. Please contact support.', 'warning');
        }

        // Clear cart on successful payment
        dispatch({ type: 'CLEAR_CART' });
        router.push('/checkout/success');
      }
    } catch (paymentError) {
      console.error('Payment error:', paymentError);
      const errorMessage = paymentError instanceof Error
        ? paymentError.message
        : 'An unexpected error occurred during payment';
      setError(errorMessage);
      showToast(errorMessage, 'error');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Billing Address */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-white">Billing Address</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">Full Name *</label>
            <input
              type="text"
              value={billingAddress.name}
              onChange={(e) => setBillingAddress(prev => ({ ...prev, name: e.target.value }))}
              className="w-full px-3 py-2 bg-neutral-800 border border-neutral-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">Email *</label>
            <input
              type="email"
              value={billingAddress.email}
              onChange={(e) => setBillingAddress(prev => ({ ...prev, email: e.target.value }))}
              className="w-full px-3 py-2 bg-neutral-800 border border-neutral-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
              required
            />
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1">Street Address *</label>
          <input
            type="text"
            value={billingAddress.line1}
            onChange={(e) => setBillingAddress(prev => ({ ...prev, line1: e.target.value }))}
            className="w-full px-3 py-2 bg-neutral-800 border border-neutral-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
            required
          />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">City *</label>
            <input
              type="text"
              value={billingAddress.city}
              onChange={(e) => setBillingAddress(prev => ({ ...prev, city: e.target.value }))}
              className="w-full px-3 py-2 bg-neutral-800 border border-neutral-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">State *</label>
            <input
              type="text"
              value={billingAddress.state}
              onChange={(e) => setBillingAddress(prev => ({ ...prev, state: e.target.value }))}
              className="w-full px-3 py-2 bg-neutral-800 border border-neutral-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">ZIP Code *</label>
            <input
              type="text"
              value={billingAddress.postal_code}
              onChange={(e) => setBillingAddress(prev => ({ ...prev, postal_code: e.target.value }))}
              className="w-full px-3 py-2 bg-neutral-800 border border-neutral-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
              required
            />
          </div>
        </div>
      </div>

      {/* Shipping Address */}
      <div className="space-y-4">
        <div className="flex items-center space-x-2">
          <input
            type="checkbox"
            id="sameAddress"
            checked={useSameAddress}
            onChange={(e) => setUseSameAddress(e.target.checked)}
            className="w-4 h-4 text-cyan-600 bg-neutral-800 border-neutral-600 rounded focus:ring-cyan-500"
          />
          <label htmlFor="sameAddress" className="text-sm text-gray-300">
            Shipping address same as billing
          </label>
        </div>

        {!useSameAddress && (
          <>
            <h3 className="text-lg font-semibold text-white">Shipping Address</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Full Name *</label>
                <input
                  type="text"
                  value={shippingAddress.name}
                  onChange={(e) => setShippingAddress(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full px-3 py-2 bg-neutral-800 border border-neutral-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Email *</label>
                <input
                  type="email"
                  value={shippingAddress.email}
                  onChange={(e) => setShippingAddress(prev => ({ ...prev, email: e.target.value }))}
                  className="w-full px-3 py-2 bg-neutral-800 border border-neutral-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
                  required
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">Street Address *</label>
              <input
                type="text"
                value={shippingAddress.line1}
                onChange={(e) => setShippingAddress(prev => ({ ...prev, line1: e.target.value }))}
                className="w-full px-3 py-2 bg-neutral-800 border border-neutral-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
                required
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">City *</label>
                <input
                  type="text"
                  value={shippingAddress.city}
                  onChange={(e) => setShippingAddress(prev => ({ ...prev, city: e.target.value }))}
                  className="w-full px-3 py-2 bg-neutral-800 border border-neutral-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">State *</label>
                <input
                  type="text"
                  value={shippingAddress.state}
                  onChange={(e) => setShippingAddress(prev => ({ ...prev, state: e.target.value }))}
                  className="w-full px-3 py-2 bg-neutral-800 border border-neutral-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">ZIP Code *</label>
                <input
                  type="text"
                  value={shippingAddress.postal_code}
                  onChange={(e) => setShippingAddress(prev => ({ ...prev, postal_code: e.target.value }))}
                  className="w-full px-3 py-2 bg-neutral-800 border border-neutral-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
                  required
                />
              </div>
            </div>
          </>
        )}
      </div>

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