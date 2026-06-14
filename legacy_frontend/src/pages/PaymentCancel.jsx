import React from 'react';
import { Link } from 'react-router-dom';
import { XCircle } from 'lucide-react';

const PaymentCancel = () => (
  <div className="max-w-md mx-auto mt-16 text-center px-4">
    <XCircle className="w-16 h-16 text-amber-500 mx-auto mb-4" />
    <h1 className="text-xl font-semibold text-gray-900 mb-2">Checkout cancelled</h1>
    <p className="text-gray-600 text-sm mb-6">No charges were made. You can try again anytime.</p>
    <Link
      to="/profile"
      className="inline-flex items-center justify-center px-4 py-2 rounded-md bg-amber-500 text-white text-sm font-medium hover:bg-amber-600"
    >
      Back to profile
    </Link>
  </div>
);

export default PaymentCancel;
