import { useEffect, useMemo, useState } from "react";
import {
  Navigate,
  Outlet,
  Route,
  Routes,
  useLocation,
  useNavigate,
  useOutletContext,
} from "react-router-dom";
import {
  airportLabel,
  CABIN_CLASSES,
  formatPickupAddress,
  PAYMENT_PATH,
  REVIEW_PATH,
  STEPS,
  SUCCESS_PATH,
} from "./catalog";
import { calcTotal, formatMoney } from "./pricing";
import { applyTheme, getTheme } from "./theme";
import { useIframeResize } from "./useIframeResize";
import BagsStep, { emptyPassenger } from "./steps/BagsStep";
import DocumentsStep from "./steps/DocumentsStep";
import PickupStep from "./steps/PickupStep";
import PaymentPage from "./steps/PaymentPage";
import TimeslotStep from "./steps/TimeslotStep";
import TripStep from "./steps/TripStep";
import { clearBooking, loadBooking, saveBooking } from "../config/storage";
import createBooking, { getCheckout } from "../config/services/booking";
import {
  anyDocumentUploading,
  documentFieldKey,
  documentLabel,
  getVisibleVerificationRules,
  isFileDocument,
  isFlightAtLeast24HoursAhead,
  isValidContactNumber,
  isValidEmail,
  localIsoDate,
  mediaUrl,
  minFlightDate,
} from "../utility";
import { toast } from "react-toastify";
import "./BookingWidget.css";
import ReviewBooking from "./steps/ReviewBooking";

const INITIAL_DATA = {
  flightType: "international",
  cabinClass: "premium-economy",
  airport: "",
  airline: "",
  airlineLabel: "",
  airportLabel: "",
  date: "",
  time: "",
  flightNumber: "",
  passengers: 1,
  luggage: 1,
  extras: [],
  floor: "",
  address1: "",
  address2: "",
  city: "",
  postalCode: "",
  country: "IN",
  phoneCode: "+91",
  altPhone: "",
  altPhoneCode: "+91",
  firstName: "",
  lastName: "",
  email: "",
  phone: "",
  notes: "",
  passport: null,
  docs: {},
  bagPassengers: [emptyPassenger()],
  slotDate: "",
  slotTime: "",
  serviced: null,
  zone_id: "",
  pickup_distance_km: null,
  zone_band: null,
  coverageChecking: false,
  weightCheck: null,
  payment: "arrival",
  terms: false,
};

function stepFromPath(pathname) {
  return STEPS.find((item) => item.path === pathname)?.id ?? 0;
}

function validate(step, data) {
  const errors = {};
  const required = (key, message) => {
    if (!String(data[key] || "").trim()) errors[key] = message;
  };

  if (step === 1) {
    required("flightType", "Select a flight type");
    required("cabinClass", "Select a cabin class");
    required("airport", "Select an airport");
    required("airline", "Select an airline");
    required("flightNumber", "Enter a flight number");
    required("email", "Enter an email");
    required("date", "Choose a flight date");
    required("time", "Choose a flight time");
    if (data.date && data.date < minFlightDate()) {
      errors.date = "Flight date must be at least 24 hours from now";
    }
    if (data.email && !isValidEmail(data.email)) {
      errors.email = "Enter a valid email";
    }
    if (
      data.date &&
      data.time &&
      !errors.date &&
      !isFlightAtLeast24HoursAhead(data.date, data.time)
    ) {
      errors.time = "Flight must be at least 24 hours from now";
    }
    // getVisibleVerificationRules(data).forEach((rule) => {
    //   const field = documentFieldKey(rule);
    //   const doc = (data.docs || {})[field];
    //   const label = documentLabel(rule);
    //   if (isFileDocument(rule)) {
    //     if (doc?.uploading) {
    //       errors[field] = `Please wait for ${label} to finish uploading`;
    //     } else if (
    //       rule.required &&
    //       !(doc?.url || mediaUrl(doc?.media))
    //     ) {
    //       errors[field] = `Please upload your ${label.toLowerCase()}`;
    //     }
    //   } else if (rule.required && !String(doc?.value || '').trim()) {
    //     errors[field] = `Enter your ${label.toLowerCase()}`;
    //   }
    // });
  }

  if (step === 2) {
    const rules = getVisibleVerificationRules(data);
    const docs = data.docs || {};
    rules.forEach((rule) => {
      const field = documentFieldKey(rule);
      const doc = docs[field];
      const label = documentLabel(rule);
      if (isFileDocument(rule)) {
        if (doc?.uploading) {
          errors[field] = `Please wait for ${label} to finish uploading`;
        } else if (rule.required && !(doc?.url || mediaUrl(doc?.media))) {
          errors[field] = `Please upload your ${label.toLowerCase()}`;
        }
      } else if (rule.required && !String(doc?.value || "").trim()) {
        errors[field] = `Enter your ${label.toLowerCase()}`;
      }
    });
  }

  if (step === 3) {
    required("floor", "Enter room / apartment / floor");
    required("address1", "Enter address line 1");
    required("address2", "Enter address line 2");
    required("city", "Enter a city");
    required("postalCode", "Enter a postal code");
    required("country", "Select a country");
    required("phone", "Enter a contact number");

    if (data.phone && !isValidContactNumber(data.phone, data.phoneCountry)) {
      errors.phone = "Enter a valid contact number";
    }

    if (
      data.altPhone &&
      !isValidContactNumber(data.altPhone, data.altPhoneCountry)
    ) {
      errors.altPhone = "Enter a valid alternate number";
    }

    if (data.serviced === false) {
      errors.serviced = "This pickup location is not serviceable";
    }
  }

  if (step === 4) {
    required("slotDate", "Select a pickup date");
    const today = localIsoDate();
    if (data.slotDate && data.slotDate < today) {
      errors.slotDate = "Pickup date must be today or later";
    } else if (data.date && data.slotDate && data.slotDate > data.date) {
      errors.slotDate = "Pickup date cannot be after the flight date";
    }
    required("slotTime", "Select a timeslot");
  }

  if (step === 5) {
    const list = data.bagPassengers || [];
    if (!list.length) errors.bagPassengers = "Add at least one passenger";
    list.forEach((passenger, passengerIndex) => {
      if (!String(passenger.name || "").trim()) {
        errors[`p-${passengerIndex}-name`] = "Enter passenger name";
      }
      if (!passenger.bags?.length) {
        errors[`p-${passengerIndex}-bags`] = "Add at least one bag";
      } else {
        const bagsAllowed =
          data.weightCheck?.per_passenger?.checked_bags_allowed;
        if (bagsAllowed != null && passenger.bags.length > bagsAllowed) {
          errors[`p-${passengerIndex}-bags`] =
            `Cannot add more than ${bagsAllowed} bags`;
        }
      }
      (passenger.bags || []).forEach((bag, bagIndex) => {
        if (!String(bag.name || "").trim()) {
          errors[`p-${passengerIndex}-b-${bagIndex}-name`] = "Enter bag name";
        }
        if (!bag.size) {
          errors[`p-${passengerIndex}-b-${bagIndex}-size`] = "Select bag size";
        }
        const maxKg = data.weightCheck?.per_passenger?.max_weight_kg_per_bag;
        if (!String(bag.weight || "").trim()) {
          errors[`p-${passengerIndex}-b-${bagIndex}-weight`] = "Enter weight";
        } else if (maxKg != null && Number(bag.weight) > Number(maxKg)) {
          errors[`p-${passengerIndex}-b-${bagIndex}-weight`] =
            `Weight cannot be more than ${maxKg} kg`;
        }
      });
    });
  }

  return errors;
}

function isStepComplete(step, data) {
  return Object.keys(validate(step, data)).length === 0;
}

function PaymentRoute() {
  const { paymentSession, payError, onPaid, onPayError } = useOutletContext();
  if (!paymentSession?.payment?.client_secret) {
    return <Navigate to={REVIEW_PATH} replace />;
  }
  return (
    <PaymentPage
      paymentSession={paymentSession}
      error={payError}
      onPaid={onPaid}
      onError={onPayError}
    />
  );
}

function ReviewPage() {
  const { data, submitError } = useOutletContext();
  return <ReviewBooking data={data} submitError={submitError} />;
}

function StepPage({ Step }) {
  const { data, errors, onChange } = useOutletContext();
  return <Step data={data} errors={errors} onChange={onChange} />;
}

function SuccessPage() {
  const { data, bookingRef, reset, paymentSession } = useOutletContext();
  const cabin = CABIN_CLASSES.find((item) => item.id === data.cabinClass);
  const amount = paymentSession?.checkout?.total_price;
  const currency = String(
    paymentSession?.checkout?.currency || "USD",
  ).toUpperCase();
  const checkoutCode = paymentSession?.checkout?.checkout_code || bookingRef;

  useEffect(() => {
    window.history.pushState(null, "", window.location.href);
    const blockBack = () => {
      window.history.pushState(null, "", window.location.href);
    };
    window.addEventListener("popstate", blockBack);
    return () => window.removeEventListener("popstate", blockBack);
  }, []);

  if (!bookingRef) {
    return <Navigate to={STEPS[0].path} replace />;
  }

  return (
    <div className="success">
      <div className="success-hero">
        <div className="success-mark">✓</div>
        <h2>Booking successfully created</h2>
        <p>Your pickup has been confirmed.</p>
      </div>

      <div className="success-details">
        <div className="review-row">
          <span>Reference</span>
          <strong>{checkoutCode}</strong>
        </div>
        <div className="review-row">
          <span>Email</span>
          <strong>{data.email}</strong>
        </div>
        <div className="review-row">
          <span>Airport</span>
          <strong>{data.airportLabel || airportLabel(data.airport)}</strong>
        </div>
        <div className="review-row">
          <span>Airline</span>
          <strong>{data.airlineLabel || data.airline}</strong>
        </div>
        <div className="review-row">
          <span>Flight</span>
          <strong>
            {[data.flightNumber, data.date, data.time]
              .filter(Boolean)
              .join(" · ")}
          </strong>
        </div>
        <div className="review-row">
          <span>Cabin</span>
          <strong>{cabin?.name}</strong>
        </div>
        <div className="review-row">
          <span>Pickup date</span>
          <strong>
            {[data.slotDate, data.slot_label || data.slotTime]
              .filter(Boolean)
              .join(" · ")}
          </strong>
        </div>
        <div className="review-row">
          <span>Pickup address</span>
          <strong>{formatPickupAddress(data)}</strong>
        </div>
        {amount != null && amount !== "" ? (
          <div className="review-row">
            <span>Amount paid</span>
            <strong>{formatMoney(amount, currency)}</strong>
          </div>
        ) : null}
      </div>

      <button type="button" className="btn-secondary" onClick={reset}>
        Book another pickup
      </button>
    </div>
  );
}

function BookingLayout() {
  const theme = useMemo(() => getTheme(), []);
  const navigate = useNavigate();
  const { pathname, state } = useLocation();
  const fromReview = Boolean(state?.fromReview);
  const [data, setData] = useState(() => ({
    ...INITIAL_DATA,
    ...loadBooking(),
  }));
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [bookingRef, setBookingRef] = useState("");
  const [submitError, setSubmitError] = useState("");
  const [paymentSession, setPaymentSession] = useState(null);
  const [payError, setPayError] = useState("");

  const step = stepFromPath(pathname);
  const isSuccess = pathname === SUCCESS_PATH;
  const isReview = pathname === REVIEW_PATH;
  const isPayment = pathname === PAYMENT_PATH;
  const total = calcTotal(data);

  useIframeResize([
    step,
    bookingRef,
    data.airport,
    data.passport,
    data.city,
    data.bagPassengers?.length,
    data.slotDate,
    isReview,
  ]);

  useEffect(() => {
    applyTheme(theme);
  }, [theme]);

  useEffect(() => {
    saveBooking(data);
  }, [data]);

  useEffect(() => {
    if (!step || isSuccess || isReview || isPayment) return;
    const stepOneOpen = !isStepComplete(1, data);
    const stepTwoOpen = !isStepComplete(2, data);
    if (step > 1 && stepOneOpen) {
      navigate(STEPS[0].path, { replace: true });
      return;
    }
    if (step > 2 && stepTwoOpen) {
      navigate(STEPS[0].path, { replace: true });
    }
  }, [step, isSuccess, isReview, data, navigate]);

  const update = (patch) => {
    setData((current) => ({ ...current, ...patch }));
    setErrors((current) => {
      const next = { ...current };
      Object.keys(patch).forEach((key) => delete next[key]);
      if (patch.bagPassengers) {
        Object.keys(next).forEach((key) => {
          if (key.startsWith("p-")) delete next[key];
        });
      }
      return next;
    });
  };

  const goNext = async () => {
    if (isReview) {
      setSubmitting(true);
      setSubmitError("");
      try {
        const response = await createBooking(data);
        if (response.ok === false) {
          const message = response.message || "Could not create this booking";
          setSubmitError(message);
          toast.error(message);
          return;
        }
        const clientSecret = response.payment?.client_secret;
        const publishableKey = response.publishable_key;
        const reference =
          response.checkout?.checkout_code ||
          response.booking_id ||
          response.booking?.booking_id ||
          response.payment?.payment_id ||
          `SP-${Math.floor(100000 + Math.random() * 900000)}`;
        setBookingRef(reference);
        if (clientSecret && publishableKey) {
          setPaymentSession(response);
          setPayError("");
          navigate(PAYMENT_PATH);
          return;
        }
        navigate(SUCCESS_PATH, { replace: true });
        window.parent.postMessage(
          { source: "sp-whitelabel", type: "booked", reference, total },
          "*",
        );
      } catch (error) {
        const message =
          error.response?.data?.message || "Could not create this booking";
        setSubmitError(message);
        toast.error(message);
      } finally {
        setSubmitting(false);
      }
      return;
    }

    const nextErrors = validate(step, data);
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length) return;

    if (fromReview) {
      navigate(REVIEW_PATH);
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }

    if (step < 5) {
      const nextStep = STEPS.find((item) => item.id === step + 1);
      navigate(nextStep.path);
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }

    navigate(REVIEW_PATH);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const onPaid = async (paymentIntent) => {
    const checkoutId =
      paymentSession?.checkout?.id ||
      paymentSession?.checkout?._id ||
      paymentSession?.checkout?.checkout_id;
    if (checkoutId) {
      try {
        const checkoutResponse = await getCheckout(checkoutId);
        if (checkoutResponse?.checkout) {
          setPaymentSession((current) => ({
            ...current,
            ...checkoutResponse,
            payment: current?.payment,
            publishable_key: current?.publishable_key,
          }));
        }
      } catch (error) {
        const message =
          error.response?.data?.message ||
          "Payment succeeded but checkout could not be confirmed";
        setPayError(message);
        toast.error(message);
        return;
      }
    }
    const reference =
      paymentSession?.checkout?.checkout_code ||
      paymentSession?.checkout?.booking_code ||
      bookingRef;
    setBookingRef(reference);
    navigate(SUCCESS_PATH, { replace: true });
    window.parent.postMessage(
      {
        source: "sp-whitelabel",
        type: "booked",
        reference,
        total: paymentSession?.checkout?.total_price ?? total,
        payment_intent_id: paymentIntent?.id,
      },
      "*",
    );
  };

  const reset = () => {
    clearBooking();
    setData(INITIAL_DATA);
    setErrors({});
    setBookingRef("");
    setSubmitError("");
    setPaymentSession(null);
    navigate(STEPS[0].path, { replace: true });
  };

  return (
    <div className="widget">
      {!isSuccess && !isReview && !isPayment && (
        <ol className="stepper" aria-label="Booking steps">
          {STEPS.map((item) => (
            <li
              key={item.id}
              className={
                item.id === step
                  ? "is-current"
                  : item.id < step
                    ? "is-done"
                    : ""
              }
            >
              <button
                type="button"
                disabled={!fromReview && item.id > step}
                onClick={() =>
                  (fromReview || item.id < step) &&
                  navigate(item.path, {
                    state: fromReview ? { fromReview: true } : undefined,
                  })
                }
              >
                <span>{item.id < step ? "✓" : item.id}</span>
                {item.label}
              </button>
            </li>
          ))}
        </ol>
      )}
      <main className="widget-body">
        <Outlet
          context={{
            data,
            errors,
            onChange: update,
            theme,
            bookingRef,
            total,
            reset,
            submitError,
            paymentSession,
            payError,
            onPaid,
            onPayError: (message) => {
              setPayError(message);
              if (message) toast.error(message);
            },
          }}
        />
      </main>

      {!isSuccess && !isPayment && (
        <footer
          className={`widget-footer${
            step === 1 && !isReview && !fromReview ? " is-single" : ""
          }`}
        >
          {(step > 1 || isReview || fromReview) && (
            <button
              type="button"
              className="btn-ghost"
              disabled={
                (step === 1 || step === 2) && anyDocumentUploading(data)
              }
              onClick={() => {
                if (isReview || fromReview) {
                  navigate(REVIEW_PATH);
                  return;
                }
                const previous = STEPS.find((item) => item.id === step - 1);
                navigate(previous.path);
              }}
            >
              Back
            </button>
          )}
          <button
            type="button"
            className="btn-primary"
            onClick={goNext}
            disabled={
              submitting ||
              ((step === 1 || step === 2) && anyDocumentUploading(data)) ||
              (step === 3 && (data.coverageChecking || data.serviced === false))
            }
          >
            {anyDocumentUploading(data) && (step === 1 || step === 2)
              ? "Uploading…"
              : submitting
                ? "Sending…"
                : isReview
                  ? "Confirm booking"
                  : fromReview
                    ? "Save & review"
                    : step === 5
                      ? "Review Booking"
                      : "Continue"}
          </button>
        </footer>
      )}
    </div>
  );
}

export default function BookingWidget() {
  return (
    <Routes>
      <Route element={<BookingLayout />}>
        <Route index element={<Navigate to={STEPS[0].path} replace />} />
        <Route path="flight" element={<StepPage Step={TripStep} />} />
        <Route path="documents" element={<StepPage Step={DocumentsStep} />} />
        <Route path="pickup" element={<StepPage Step={PickupStep} />} />
        <Route path="timeslot" element={<StepPage Step={TimeslotStep} />} />
        <Route path="bags" element={<StepPage Step={BagsStep} />} />
        <Route path="review" element={<ReviewPage />} />
        <Route path="pay" element={<PaymentRoute />} />
        <Route path="success" element={<SuccessPage />} />
      </Route>
      <Route path="*" element={<Navigate to={STEPS[0].path} replace />} />
    </Routes>
  );
}
