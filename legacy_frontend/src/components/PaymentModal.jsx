import React, { useState } from 'react';
import { X, Lock, Crown, Check } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { billingAPI } from '../services/api';

const PaymentModal = ({ isOpen, onClose }) => {
  const [loading, setLoading] = useState(false);

  const startCheckout = async () => {
    try {
      setLoading(true);
      const data = await billingAPI.createCheckoutSession();
      if (data?.url) {
        window.location.href = data.url;
        return;
      }
      throw new Error('No checkout URL returned');
    } catch (error) {
      const msg =
        error.response?.data?.detail ||
        error.response?.data?.title ||
        error.message ||
        'Could not start checkout';
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center">
            <Crown className="h-6 w-6 text-amber-500 mr-2" />
            <h2 className="text-xl font-semibold text-gray-900">Upgrade to Premium</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <div className="p-6 border-b border-gray-200">
          <div className="text-center mb-4">
            <div className="text-3xl font-bold text-gray-900 mb-1">€9.99</div>
            <div className="text-sm text-gray-500">per month (via Stripe)</div>
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

        <div className="p-6">
          <p className="text-sm text-gray-600 text-center mb-4">
            You will be redirected to Stripe&apos;s secure checkout. Premium activates automatically
            after payment.
          </p>

          <button
            type="button"
            onClick={startCheckout}
            disabled={loading}
            className="w-full px-4 py-3 text-sm font-medium text-white bg-amber-500 rounded-md hover:bg-amber-600 disabled:opacity-60 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-2"
          >
            {loading ? 'Starting checkout…' : 'Continue to Stripe Checkout'}
          </button>

          <button
            type="button"
            onClick={onClose}
            className="w-full mt-4 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-2 transition-colors"
          >
            Cancel
          </button>

          <div className="text-xs text-gray-500 text-center mt-4">
            <Lock className="inline w-3 h-3 mr-1" />
            Payments processed by Stripe
          </div>
        </div>
      </div>
    </div>
  );
};

export default PaymentModal;
