import React, { useState, useEffect } from 'react';
import { X, CreditCard, Lock, Crown, Check } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { loadStripe } from '@stripe/stripe-js';
import {
  Elements,
  CardElement,
  useStripe,
  useElements
} from '@stripe/react-stripe-js';

// Initialize Stripe
const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY);

// Stripe Payment Form Component
const StripePaymentForm = ({ onSuccess, onClose }) => {
  const stripe = useStripe();
  const elements = useElements();
  const [loading, setLoading] = useState(false);
  const [clientSecret, setClientSecret] = useState('');
  const [email, setEmail] = useState('');

  useEffect(() => {
    // Create payment intent when component mounts
    createPaymentIntent();
  }, []);

  const createPaymentIntent = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${import.meta.env.VITE_API_URL}/payment/create-intent`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          amount: 9.99,
          currency: 'eur'
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create payment intent');
      }

      const data = await response.json();
      setClientSecret(data.data.clientSecret);
    } catch (error) {
      console.error('Error creating payment intent:', error);
      toast.error(error.message || 'Failed to initialize payment');
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    
    if (!stripe || !elements || !clientSecret) {
      return;
    }

    setLoading(true);

    try {
      const cardElement = elements.getElement(CardElement);
      
      const { error, paymentIntent } = await stripe.confirmCardPayment(clientSecret, {
        payment_method: {
          card: cardElement,
          billing_details: {
            email: email,
          },
        },
      });

      if (error) {
        console.error('Payment error:', error);
        toast.error(error.message || 'Payment failed');
      } else if (paymentIntent.status === 'succeeded') {
        toast.success('Payment successful! Upgrading your account...');
        
        // Call the success callback
        if (onSuccess) {
          await onSuccess();
        }
        
        onClose();
      }
    } catch (error) {
      console.error('Payment processing error:', error);
      toast.error('Payment failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const cardElementOptions = {
    style: {
      base: {
        fontSize: '16px',
        color: '#424770',
        '::placeholder': {
          color: '#aab7c4',
        },
      },
      invalid: {
        color: '#9e2146',
      },
    },
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Email */}
      <div>
        <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
          Email Address
        </label>
        <input
          type="email"
          id="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent"
          placeholder="your@email.com"
          required
        />
      </div>

      {/* Card Element */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Card Information
        </label>
        <div className="w-full px-3 py-3 border border-gray-300 rounded-md focus-within:ring-2 focus-within:ring-amber-500 focus-within:border-transparent">
          <CardElement options={cardElementOptions} />
        </div>
      </div>

      {/* Security Notice */}
      <div className="flex items-center mt-4 p-3 bg-gray-50 rounded-md">
        <Lock className="h-4 w-4 text-gray-500 mr-2" />
        <span className="text-xs text-gray-600">
          Your payment information is secure and encrypted
        </span>
      </div>

      {/* Submit Button */}
      <button
        type="submit"
        disabled={loading || !stripe || !clientSecret}
        className="w-full mt-6 bg-gradient-to-r from-amber-500 to-orange-500 text-white py-3 px-4 rounded-md font-medium hover:from-amber-600 hover:to-orange-600 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
      >
        {loading ? (
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
            Processing...
          </div>
        ) : (
          `Pay €9.99 and Upgrade`
        )}
      </button>
    </form>
  );
};

const PaymentModal = ({ isOpen, onClose, onSuccess }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center">
            <Crown className="h-6 w-6 text-amber-500 mr-2" />
            <h2 className="text-xl font-semibold text-gray-900">Upgrade to Premium</h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Premium Benefits */}
        <div className="p-6 border-b border-gray-200">
          <div className="text-center mb-4">
            <div className="text-3xl font-bold text-gray-900 mb-1">€9.99</div>
            <div className="text-sm text-gray-500">per month</div>
          </div>
          
          <div className="space-y-3">
            <div className="flex items-center text-sm text-gray-700">
              <Check className="h-4 w-4 text-green-500 mr-2 flex-shrink-0" />
              <span>View detailed player statistics</span>
            </div>
            <div className="flex items-center text-sm text-gray-700">
              <Check className="h-4 w-4 text-green-500 mr-2 flex-shrink-0" />
              <span>See who visited your profile</span>
            </div>
            <div className="flex items-center text-sm text-gray-700">
              <Check className="h-4 w-4 text-green-500 mr-2 flex-shrink-0" />
              <span>Advanced search filters</span>
            </div>
            <div className="flex items-center text-sm text-gray-700">
              <Check className="h-4 w-4 text-green-500 mr-2 flex-shrink-0" />
              <span>Priority customer support</span>
            </div>
          </div>
        </div>

        {/* Payment Form with Stripe Elements */}
         <div className="p-6">
           <StripePaymentForm onSuccess={onSuccess} onClose={onClose} />
           
           {/* Cancel Button */}
           <button
             type="button"
             onClick={onClose}
             className="w-full mt-3 bg-gray-100 text-gray-700 py-2 px-4 rounded-md font-medium hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-colors"
           >
             Cancel
           </button>
         </div>
       </div>
     </div>
   );
 };

 // Wrapper component to handle Stripe Elements
 const PaymentModalWrapper = (props) => {
   return (
     <Elements stripe={stripePromise}>
       <PaymentModal {...props} />
     </Elements>
   );
 };

 export default PaymentModalWrapper;