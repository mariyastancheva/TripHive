/* eslint-disable */
import axios from 'axios';
import { showAlert } from './alerts';
const stripe = Stripe('pk_test_51N1XndLuGue7GVAzOnVcRS5KCWjF4ARCK0PbONsnsY3caGszVB9z6V8JbjJFicHyrbtQTPUf5S6nvoXQgKzAytEM00JfwEtcVC');

export const bookTour = async tourId => {
  try {
    // 1) Get checkout session from API
    const session = await axios(`/api/v1/bookings/checkout-session/${tourId}`);

    // 2) Create checkout form + chanre credit card
    await stripe.redirectToCheckout({
      sessionId: session.data.session.id
    });
  } catch (err) {
    showAlert('error', err);
  }
};
