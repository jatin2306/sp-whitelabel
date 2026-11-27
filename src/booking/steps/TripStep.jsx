import getAirlines from "../../config/services/airline";
import getAirports from "../../config/services/airport";
import {
  mapAirlineDropdownOptions,
  mapAirportDropdownOptions,
  minFlightDate,
} from "../../utility";
import Dropdown from "../Dropdown";
import { CABIN_CLASSES, FLIGHT_TYPES, SERVICE_TYPES } from "../catalog";
import { Field } from "../ui";
import { useEffect, useState } from "react";
import { VerificationFields } from "./DocumentsStep";

const clearDocs = {
  docs: {},
  passport: null,
  boardingPass: null,
};

export default function TripStep({ data, errors, onChange }) {
  const [airportOptions, setAirportOptions] = useState([]);
  const [airlineOptions, setAirlineOptions] = useState([]);
  const [airportsLoading, setAirportsLoading] = useState(true);
  const [airlinesLoading, setAirlinesLoading] = useState(false);
  const serviceType =
    data.serviceType === "ARRIVAL" ? "ARRIVAL" : "DEPARTURE";

  useEffect(() => {
    const fetchAirports = async () => {
      try {
        const response = await getAirports();
        setAirportOptions(mapAirportDropdownOptions(response.airports));
      } catch {
        setAirportOptions([]);
      } finally {
        setAirportsLoading(false);
      }
    };

    fetchAirports();
  }, []);

  useEffect(() => {
    if (!data.airport) {
      setAirlineOptions([]);
      setAirlinesLoading(false);
      return;
    }

    const fetchAirlines = async () => {
      setAirlineOptions([]);
      setAirlinesLoading(true);
      try {
        const response = await getAirlines(data.airport);
        setAirlineOptions(mapAirlineDropdownOptions(response.airlines));
      } catch {
        setAirlineOptions([]);
      } finally {
        setAirlinesLoading(false);
      }
    };

    fetchAirlines();
  }, [data.airport]);

  return (
    <div className="step-panel">
      <header className="section-head">
        <div>
          <h2>Flight & Passenger</h2>
          <p>Enter Flight & Passenger Details</p>
        </div>
      </header>

      <div className="service-tabs" role="tablist" aria-label="Service type">
        {SERVICE_TYPES.map((service) => (
          <button
            key={service.id}
            type="button"
            role="tab"
            aria-selected={serviceType === service.id}
            className={serviceType === service.id ? "is-active" : ""}
            onClick={() =>
              onChange({
                serviceType: service.id,
                ...clearDocs,
              })
            }
          >
            {service.name}
          </button>
        ))}
      </div>

      <h3 className="subhead">
        {serviceType === "ARRIVAL" ? "Arrival" : "Departure"}
      </h3>
      <Field label="Flight Number" error={errors.flightNumber}>
        <input
          value={data.flightNumber}
          onChange={(event) =>
            onChange({ flightNumber: event.target.value.toUpperCase() })
          }
          placeholder="Enter Number"
        />
      </Field>

      <h3 className="subhead">User Details</h3>
      <Field label="Email Address" error={errors.email}>
        <input
          type="email"
          value={data.email}
          onChange={(event) => onChange({ email: event.target.value })}
          placeholder="smart@gmail.com"
        />
      </Field>

      <h3 className="subhead">Flight Details</h3>
      <div className="grid">
        <Field label="Flight Type" error={errors.flightType}>
          <Dropdown
            value={data.flightType}
            options={FLIGHT_TYPES}
            valueKey="id"
            labelKey="name"
            placeholder="Select flight type"
            onChange={(value) =>
              onChange({
                flightType: value,
                ...clearDocs,
              })
            }
          />
        </Field>

        <Field label="Cabin Class" error={errors.cabinClass}>
          <Dropdown
            value={data.cabinClass}
            options={CABIN_CLASSES}
            valueKey="id"
            labelKey="name"
            placeholder="Select Cabin Class"
            onChange={(value) => onChange({ cabinClass: value })}
          />
        </Field>

        <Field label="Airport" error={errors.airport}>
          <Dropdown
            value={data.airport}
            options={airportOptions}
            loading={airportsLoading}
            placeholder="Select Airport"
            onChange={(value, selected) =>
              onChange({
                airport: value,
                airportLabel: selected?.label || "",
                airline: "",
                airline_id: "",
                airlineLabel: "",
                verification_rules_by_flight_type: null,
                ...clearDocs,
              })
            }
          />
        </Field>

        <Field label="Airline" error={errors.airline}>
          <Dropdown
            value={data.airline}
            options={airlineOptions}
            loading={airlinesLoading}
            disabled={
              !data.airport || (!airlinesLoading && airlineOptions.length === 0)
            }
            placeholder={
              !data.airport
                ? "Select Airport"
                : airlinesLoading
                  ? "Loading airlines"
                  : airlineOptions.length === 0
                    ? "No airlines for this airport"
                    : "Select Airline"
            }
            onChange={(value, selected) => {
              if (!selected) {
                onChange({
                  airline: "",
                  airline_id: "",
                  airlineLabel: "",
                  verification_rules_by_flight_type: null,
                  ...clearDocs,
                });
                return;
              }
              onChange({
                airline: value,
                airline_id: selected.airline_id,
                airlineLabel: selected.label,
                verification_rules_by_flight_type:
                  selected.verification_rules_by_flight_type,
                ...clearDocs,
              });
            }}
          />
        </Field>

        <Field label="Flight Date" error={errors.date}>
          <div className="icon-input">
            <input
              type="date"
              value={data.date}
              min={minFlightDate()}
              onChange={(event) => onChange({ date: event.target.value })}
            />
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <rect
                x="4"
                y="6"
                width="16"
                height="14"
                rx="2"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
              />
              <path
                d="M8 4v4M16 4v4M4 10h16"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
              />
            </svg>
          </div>
        </Field>

        <Field label="Flight Time" error={errors.time}>
          <div className="icon-input">
            <input
              type="time"
              value={data.time}
              onChange={(event) => onChange({ time: event.target.value })}
            />
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <circle
                cx="12"
                cy="12"
                r="8"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
              />
              <path
                d="M12 8v5l3 2"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
              />
            </svg>
          </div>
        </Field>

      </div>

      {/* <h3 className="subhead">Required documents</h3>
      <VerificationFields data={data} errors={errors} onChange={onChange} /> */}
    </div>
  );
}
