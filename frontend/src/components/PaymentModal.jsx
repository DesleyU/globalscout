import React, { useState, useEffect } from 'react';
import { X, Lock, Crown, Check } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { PayPalScriptProvider, PayPalButtons } from '@paypal/react-paypal-js';



// PayPal Payment Component
const PayPalPaymentForm = ({ onSuccess, onClose }) => {
  const [loading, setLoading] = useState(false);

  const createOrder = async () => {
    try {
      console.log('PayPal createOrder called');
      setLoading(true);
      const token = localStorage.getItem('token');
      console.log('Token:', token ? 'Present' : 'Missing');
      
      const response = await fetch(`${import.meta.env.VITE_API_URL}/payment/paypal/create-order`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          amount: 9.99
        })
      });

      console.log('PayPal API response status:', response.status);
      
      if (!response.ok) {
        const errorData = await response.json();
        console.error('PayPal API error:', errorData);
        throw new Error(errorData.error || 'Failed to create PayPal order');
      }

      const data = await response.json();
      console.log('PayPal order created:', data);
      return data.orderId;
    } catch (error) {
      console.error('Error creating PayPal order:', error);
      toast.error(error.message || 'Failed to initialize PayPal payment');
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const onApprove = async (data) => {
    try {
      console.log('PayPal onApprove called with data:', data);
      setLoading(true);
      const token = localStorage.getItem('token');
      
      const response = await fetch(`${import.meta.env.VITE_API_URL}/payment/paypal/capture-order`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          orderId: data.orderID
        })
      });

      console.log('PayPal capture response status:', response.status);

      if (!response.ok) {
        const errorData = await response.json();
        console.error('PayPal capture error:', errorData);
        throw new Error(errorData.error || 'Payment capture failed');
      }

      const result = await response.json();
      console.log('PayPal capture result:', result);
      
      if (result.success) {
        toast.success('Payment successful! Premium access activated!');
        
        if (onSuccess) {
          await onSuccess();
        }
        
        onClose();
      } else {
        throw new Error('Payment processing failed');
      }
    } catch (error) {
      console.error('PayPal capture error:', error);
      toast.error(error.message || 'Payment failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const onError = (err) => {
    console.error('PayPal error:', err);
    toast.error('PayPal payment failed. Please try again.');
  };

  const onCancel = () => {
    toast.info('Payment cancelled');
  };

  return (
    <div className="space-y-4">
      <div className="text-center">
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Pay with PayPal</h3>
        <p className="text-sm text-gray-600">Secure payment via PayPal</p>
      </div>
      
      {loading && (
        <div className="flex justify-center py-4">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
        </div>
      )}
      
      <PayPalButtons
        style={{
          layout: 'vertical',
          color: 'blue',
          shape: 'rect',
          label: 'pay'
        }}
        createOrder={createOrder}
        onApprove={onApprove}
        onError={onError}
        onCancel={onCancel}
        disabled={loading}
      />
      
      <div className="text-xs text-gray-500 text-center">
        <Lock className="inline w-3 h-3 mr-1" />
        Secure payment processed by PayPal
      </div>
    </div>
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



        {/* PayPal Payment */}
        <div className="p-6">
          <div className="text-center mb-4">
            <h3 className="text-lg font-medium text-gray-900 mb-2">Pay with PayPal</h3>
            <p className="text-sm text-gray-600">Secure payment processing</p>
          </div>
          
          <PayPalPaymentForm onSuccess={onSuccess} onClose={onClose} />
          
          {/* Cancel Button */}
          <button
            type="button"
            onClick={onClose}
            className="w-full mt-4 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-2 transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};

 // Wrapper component to handle PayPal
const PaymentModalWrapper = (props) => {
  const paypalOptions = {
    "client-id": import.meta.env.VITE_PAYPAL_CLIENT_ID,
    currency: "EUR",
    intent: "capture"
  };

  console.log('PayPal options:', paypalOptions);
  console.log('PayPal Client ID:', import.meta.env.VITE_PAYPAL_CLIENT_ID);

  return (
    <PayPalScriptProvider options={paypalOptions}>
      <PaymentModal {...props} />
    </PayPalScriptProvider>
  );
};

export default PaymentModalWrapper;