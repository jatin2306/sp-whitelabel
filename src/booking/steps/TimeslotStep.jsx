import { useEffect, useState } from 'react';
import { Field } from '../ui';
import getTimeslots from '../../config/services/timeslots';
import { localIsoDate, mapTimeslotOptions } from '../../utility';

function totalBags(data) {
  const count = (data.bagPassengers || []).reduce(
    (sum, passenger) => sum + (passenger.bags || []).length,
    0,
  );
  return Math.max(1, count);
}

function totalWeightKg(data) {
  return (data.bagPassengers || []).reduce(
    (sum, passenger) =>
      sum +
      (passenger.bags || []).reduce(
        (bagSum, bag) => bagSum + Number(bag.weight || 0),
        0,
      ),
    0,
  );
}

function flightTime(value) {
  if (!value) return '';
  return String(value).slice(0, 5);
}

export default function TimeslotStep({ data, errors, onChange }) {
  const [slots, setSlots] = useState([]);
  const [loading, setLoading] = useState(false);
  const bagCount = totalBags(data);
  const weightKg = totalWeightKg(data);
  const minDate = localIsoDate();
  const maxDate = data.date || minDate;

  useEffect(() => {
    if (!data.slotDate || data.latitude == null || data.longitude == null) {
      setSlots([]);
      return;
    }

    const fetchSlots = async () => {
      setSlots([]);
      setLoading(true);
      try {
        const response = await getTimeslots({
          lat: data.latitude,
          lng: data.longitude,
          airport_id: data.airport,
          pickup_date: data.slotDate,
          total_bags: bagCount,
          total_weight_kg: weightKg,
          flight_date: data.date,
          flight_time: flightTime(data.time),
        });
        setSlots(mapTimeslotOptions(response.time_slots));
        onChange({
          zone_id: response.zone_id,
          pickup_distance_km: response.pickup_distance_km,
          zone_band: response.zone_band,
          serviced: response.serviced,
        });
      } catch {
        setSlots([]);
      } finally {
        setLoading(false);
      }
    };

    fetchSlots();
  }, [
    data.slotDate,
    data.airport,
    data.latitude,
    data.longitude,
    data.date,
    data.time,
    bagCount,
    weightKg,
  ]);

  return (
    <div className="step-panel">
      <header className="section-head">
        <h2>Select Timeslot</h2>
        <span className="step-progress">4/5</span>
      </header>

      <div className="timeslot-card">
        <Field label="Select Date" error={errors.slotDate}>
          <div className="icon-input">
            <input
              type="date"
              value={data.slotDate}
              min={minDate}
              max={maxDate}
              onChange={(event) =>
                onChange({ slotDate: event.target.value, slotTime: '' })
              }
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

        {data.slotDate && (
          <>
            <p className="field-label">Available slots</p>
            {loading ? (
              <p className="notice">Loading timeslots…</p>
            ) : slots.length === 0 ? (
              <p className="notice">No timeslots for this date</p>
            ) : (
              <div className="slot-grid">
                {slots.map((slot) => (
                  <button
                    key={slot.value}
                    type="button"
                    className={`slot-chip${
                      data.slotTime === slot.value ? ' is-selected' : ''
                    }`}
                    onClick={() =>
                      onChange({
                        slotTime: slot.value,
                        slot_id: slot.value,
                        slot_key: slot.key,
                        slot_label: slot.label,
                        start_time: slot.start_time,
                        end_time: slot.end_time,
                      })
                    }
                  >
                    {slot.label}
                  </button>
                ))}
              </div>
            )}
            {errors.slotTime && (
              <p className="inline-error">{errors.slotTime}</p>
            )}
          </>
        )}
      </div>
    </div>
  );
}
