import { useEffect, useRef, useState } from "react";
import { useNavigate, useOutletContext } from "react-router-dom";
import { formatPickupAddress, STEPS } from "../catalog";

export default function IntroPage() {
  const { data, theme, onChange } = useOutletContext();
  const navigate = useNavigate();
  const frameRef = useRef(null);
  const [showTerms, setShowTerms] = useState(false);
  const [triedBook, setTriedBook] = useState(false);
  const company = theme?.company || "Smartporters";
  const accepted = Boolean(data.terms);
  const pickup =
    formatPickupAddress(data) || "Your home or selected address";
  const airport = data.airportLabel || "Your selected airport";
  const airportCity =
    String(data.airportLabel || "")
      .split("(")[0]
      .trim() || "your airport";

  const acceptTerms = () => {
    onChange({ terms: true });
    setTriedBook(false);
    setShowTerms(false);
  };

  const startBooking = () => {
    if (!accepted) {
      setTriedBook(true);
      return;
    }
    navigate(STEPS[0].path);
  };

  useEffect(() => {
    const frame = frameRef.current;
    const content = frame?.querySelector(".intro");
    if (!frame || !content) return;

    let observer;
    const fit = () => {
      observer?.unobserve(frame);
      content.style.zoom = "1";
      const available = frame.clientHeight;
      const needed = content.offsetHeight;
      const scale =
        available > 0 && needed > available ? available / needed : 1;
      content.style.zoom = scale < 0.999 ? String(scale) : "";
      observer?.observe(frame);
    };

    observer = new ResizeObserver(fit);
    fit();
    return () => observer.disconnect();
  }, [accepted, triedBook, pickup, airport]);

  return (
    <div className="intro-frame" ref={frameRef}>
    <div className="intro">
      <span className="intro-chip">
        Baggage collection — Home to {airportCity}
      </span>
      <h2>Travel lighter with {company}</h2>
      <p className="intro-lead">
        We collect your baggage from your home or another approved address and
        arrange its controlled handover at the airport.
      </p>

      <section className="intro-route" aria-label="Collection summary">
        <p className="intro-route-kicker">Your collection</p>
        <div className="intro-stop">
          <span className="intro-stop-dot" aria-hidden="true" />
          <div className="intro-row-copy">
            <span>Collected from</span>
            <strong>{pickup}</strong>
          </div>
        </div>
        <div className="intro-stop">
          <span className="intro-stop-dot is-end" aria-hidden="true" />
          <div className="intro-row-copy">
            <span>Handed over at</span>
            <strong>{airport}</strong>
          </div>
        </div>
      </section>

      <div className="intro-alert">
        <span className="intro-alert-icon" aria-hidden="true">
          !
        </span>
        <div>
          <strong>Before your baggage is collected</strong>
          <p>
            You must complete online check-in and have a valid boarding pass
            available before collection. You can upload it in the {company} app
            or present it to your pickup driver.
          </p>
        </div>
      </div>

      <div className="intro-legal">
        <label className="intro-accept">
          <input
            type="checkbox"
            checked={accepted}
            onChange={(event) => {
              onChange({ terms: event.target.checked });
              if (event.target.checked) setTriedBook(false);
            }}
          />
          <span>
            I accept the{" "}
            <button
              type="button"
              className="intro-link"
              onClick={(event) => {
                event.preventDefault();
                setShowTerms(true);
              }}
            >
              Terms and Conditions
            </button>{" "}
            and have read the{" "}
            <button
              type="button"
              className="intro-link"
              onClick={(event) => {
                event.preventDefault();
                setShowTerms(true);
              }}
            >
              Privacy Policy
            </button>
            .
          </span>
        </label>
        <div className="intro-actions">
          <button
            type="button"
            className="btn-ghost"
            onClick={() => setShowTerms(true)}
          >
            Read T&C
          </button>
          <button
            type="button"
            className={`intro-book${accepted ? " is-ready" : ""}`}
            aria-disabled={!accepted}
            onClick={startBooking}
          >
            Book now
            <span aria-hidden="true">→</span>
          </button>
        </div>
      </div>
      {!accepted && triedBook ? (
        <p className="intro-book-hint">Accept the T&C to continue</p>
      ) : null}
    </div>

      {showTerms ? (
        <div className="coverage-modal" onClick={() => setShowTerms(false)}>
          <div
            className="coverage-modal-card intro-terms-card"
            onClick={(event) => event.stopPropagation()}
          >
            <h3>Terms and Privacy</h3>
            <p>
              By booking a pickup with {company}, you agree that baggage must be
              ready at the selected address, that online check-in and a valid
              boarding pass are required before collection, and that personal
              data is used only to complete this booking.
            </p>
            <div className="intro-terms-actions">
              <button
                type="button"
                className="btn-ghost"
                onClick={() => setShowTerms(false)}
              >
                Close
              </button>
              <button
                type="button"
                className="btn-primary"
                onClick={acceptTerms}
              >
                Accept T&C
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
