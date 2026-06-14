import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { CheckCircle, Loader2 } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { toast } from 'react-hot-toast';

const POLL_MS = 1500;
const MAX_WAIT_MS = 60000;

const PaymentSuccess = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { refreshUser } = useAuth();
  const [status, setStatus] = useState('waiting');

  useEffect(() => {
    const sessionId = searchParams.get('session_id');
    if (!sessionId) {
      toast.error('Missing payment session');
      navigate('/profile', { replace: true });
      return;
    }

    const started = Date.now();
    let cancelled = false;

    const poll = async () => {
      while (!cancelled && Date.now() - started < MAX_WAIT_MS) {
        try {
          const profile = await refreshUser();
          const tier = profile?.accountType;
          if (tier === 'PREMIUM') {
            setStatus('done');
            toast.success('Welcome to Premium!');
            navigate('/profile', { replace: true });
            return;
          }
        } catch {
          // keep polling — webhook may be slightly delayed
        }
        await new Promise((r) => setTimeout(r, POLL_MS));
      }
      if (!cancelled) {
        setStatus('timeout');
        toast.error('Premium not activated yet. Refresh your profile in a moment.');
      }
    };

    poll();
    return () => {
      cancelled = true;
    };
  }, [searchParams, navigate, refreshUser]);

  return (
    <div className="max-w-md mx-auto mt-16 text-center px-4">
      {status === 'done' ? (
        <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
      ) : (
        <Loader2 className="w-16 h-16 text-amber-500 mx-auto mb-4 animate-spin" />
      )}
      <h1 className="text-xl font-semibold text-gray-900 mb-2">Processing your upgrade</h1>
      <p className="text-gray-600 text-sm">
        Confirming payment with Stripe. This usually takes a few seconds.
      </p>
    </div>
  );
};

export default PaymentSuccess;
