import { useMemo, useState } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import {
  Elements,
  PaymentElement,
  useElements,
  useStripe,
} from '@stripe/react-stripe-js';
import { formatMoney } from '../pricing';

const stripePromises = {};

function getStripe(publishableKey) {
  if (!publishableKey) return null;
  if (!stripePromises[publishableKey]) {
    stripePromises[publishableKey] = loadStripe(publishableKey);
  }
  return stripePromises[publishableKey];
}

function PayForm({ checkout, onPaid, onError }) {
  const stripe = useStripe();
  const elements = useElements();
  const [paying, setPaying] = useState(false);
  const amount = checkout?.total_price ?? 0;
  const currency = String(checkout?.currency || 'usd').toUpperCase();

  const pay = async (event) => {
    event.preventDefault();
    if (!stripe || !elements) return;
    setPaying(true);
    onError('');
    const { error, paymentIntent } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: `${window.location.origin}/success`,
      },
      redirect: 'if_required',
    });
    if (error) {
      setPaying(false);
      onError(error.message || 'Payment could not be completed');
      return;
    }
    if (paymentIntent?.status === 'succeeded' || paymentIntent?.status === 'processing') {
      try {
        await onPaid(paymentIntent);
      } catch (confirmError) {
        onError(
          confirmError.message ||
            'Payment succeeded but checkout could not be confirmed',
        );
      }
    }
    setPaying(false);
  };

  return (
    <form className="pay-form" onSubmit={pay}>
      <PaymentElement />
      <button
        type="submit"
        className="btn-primary"
        disabled={!stripe || paying}
      >
        {paying ? 'Processing…' : `Pay ${formatMoney(amount, currency)}`}
      </button>
    </form>
  );
}

export default function PaymentPage({ paymentSession, onPaid, onError, error }) {
  const checkout = paymentSession?.checkout;
  const clientSecret = paymentSession?.payment?.client_secret;
  const publishableKey = paymentSession?.publishable_key;
  const stripePromise = useMemo(
    () => getStripe(publishableKey),
    [publishableKey],
  );

  if (!clientSecret || !publishableKey || !stripePromise) {
    return (
      <div className="step-panel">
        <h2>Payment</h2>
        <p className="notice">Payment details are missing. Go back to review and confirm again.</p>
      </div>
    );
  }

  return (
    <div className="step-panel">
      <header className="section-head">
        <h2>Pay for pickup</h2>
      </header>
      <p className="notice">
        Checkout {checkout?.checkout_code} ·{' '}
        {formatMoney(checkout?.total_price || 0, String(checkout?.currency || 'usd').toUpperCase())}
      </p>
      {error ? <p className="inline-error">{error}</p> : null}
      <Elements
        stripe={stripePromise}
        options={{
          clientSecret,
          appearance: { theme: 'stripe' },
        }}
      >
        <PayForm checkout={checkout} onPaid={onPaid} onError={onError} />
      </Elements>
    </div>
  );
}
