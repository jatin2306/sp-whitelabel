import { useNavigate } from "react-router-dom";
import {
  BAG_SIZES,
  CABIN_CLASSES,
  countryById,
  formatPickupAddress,
} from "../catalog";
import {
  documentFieldKey,
  documentLabel,
  getVisibleVerificationRules,
} from "../../utility";

function Row({ label, value }) {
  if (value == null || value === "") return null;
  return (
    <div className="review-row">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

function Card({ title, to, children }) {
  const navigate = useNavigate();
  return (
    <section className="review-card">
      <div className="review-card-head">
        <h3>{title}</h3>
        <button
          type="button"
          className="text-remove"
          onClick={() => navigate(to, { state: { fromReview: true } })}
        >
          Edit
        </button>
      </div>
      {children}
    </section>
  );
}

export default function ReviewBooking({ data = {}, submitError }) {
  const cabin = CABIN_CLASSES.find((item) => item.id === data.cabinClass);
  const country = countryById(data.country);
  const bagSize = (id) => BAG_SIZES.find((item) => item.id === id)?.name || id;

  return (
    <div className="step-panel">
      <header className="section-head">
        <h2>Review Booking</h2>
      </header>
      <p className="notice">
        Check these details before confirming. Use Edit to change a section.
      </p>

      <Card title="User Details" to="/flight">
        <Row label="Email" value={data.email} />
      </Card>

      <Card title="Flight" to="/flight">
        <Row
          label="Flight type"
          value={data.flightType
            ?.replace(/_/g, " ")
            .replace(/\b\w/g, (char) => char.toUpperCase())}
        />
        <Row label="Cabin class" value={cabin?.name} />
        <Row label="Airport" value={data.airportLabel || data.airport} />
        <Row label="Airline" value={data.airlineLabel || data.airline} />
        <Row label="Flight number" value={data.flightNumber} />
        <Row label="Flight date" value={data.date} />
        <Row label="Flight time" value={data.time} />
      </Card>

      <Card title="Documents" to="/documents">
        {getVisibleVerificationRules(data).map((rule) => {
          const field = documentFieldKey(rule);
          const doc = (data.docs || {})[field];
          return (
            <Row
              key={field}
              label={`${documentLabel(rule)}${rule.required ? " *" : ""}`}
              value={doc?.name || doc?.value || ""}
            />
          );
        })}
      </Card>

      <Card title="Pickup" to="/pickup">
        <Row label="Room / floor" value={data.floor} />
        <Row label="Address" value={formatPickupAddress(data)} />
        <Row label="Country" value={country?.name} />
        <Row label="Contact" value={`${data.phone}`.trim()} />
        {data.altPhone ? (
          <Row
            label="Alternate contact"
            value={` ${data.altPhone}`.trim()}
          />
        ) : null}
      </Card>

      <Card title="Timeslot" to="/timeslot">
        <Row label="Pickup date" value={data.slotDate} />
        <Row label="Slot" value={data.slot_label || data.slotTime} />
      </Card>

      {(data.bagPassengers || []).map((passenger, index) => (
        <Card key={passenger.id} title={`Passenger ${index + 1}`} to="/bags">
          <Row label="Name" value={passenger.name} />
          {(passenger.bags || []).map((bag, bagIndex) => (
            <div key={bag.id} className="review-bag">
              <Row label={`Bag ${bagIndex + 1}`} value={bag.name} />
              <Row label="Size" value={bagSize(bag.size)} />
              <Row
                label="Weight"
                value={bag.weight ? `${bag.weight} kg` : ""}
              />
            </div>
          ))}
        </Card>
      ))}

      {submitError ? <p className="inline-error">{submitError}</p> : null}
    </div>
  );
}
