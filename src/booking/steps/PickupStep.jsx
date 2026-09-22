import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Field } from '../ui';
import { COUNTRIES, countryById, formatPickupAddress } from '../catalog';
import getPickupCoverage from '../../config/services/coverage';
import { isValidContactNumber } from '../../utility';

function fillFromNominatim(address, displayName) {
  const street = [address.house_number, address.road].filter(Boolean).join(' ');
  const countryCode = String(address.country_code || '').toUpperCase();
  const matched = COUNTRIES.find((item) => item.id === countryCode);

  return {
    address1: street || displayName.split(',')[0] || '',
    address2: address.suburb || address.neighbourhood || address.quarter || '',
    city: address.city || address.town || address.village || address.county || '',
    postalCode: address.postcode || '',
    country: matched ? matched.id : undefined,
    phoneCode: matched ? matched.code : undefined,
    altPhoneCode: matched ? matched.code : undefined,
  };
}

export default function PickupStep({ data, errors, onChange }) {
  const navigate = useNavigate();
  const country = countryById(data.country);
  const summary = formatPickupAddress(data);
  const [status, setStatus] = useState('');
  const [detecting, setDetecting] = useState(false);
  const askedRef = useRef(false);

  const checkCoverage = async (lat, lng, extra = {}) => {
    const coverage = await getPickupCoverage({
      lat,
      lng,
      airport_id: data.airport,
    });
    onChange({
      ...extra,
      serviced: coverage.serviced,
      zone_id: coverage.zone_id,
      pickup_distance_km: coverage.pickup_distance_km,
      zone_band: coverage.zone_band,
      coverageChecking: false,
    });
    return coverage.serviced;
  };

  const detectLocation = () => {
    if (!navigator.geolocation) {
      setStatus('Location is not supported in this browser');
      return;
    }

    setDetecting(true);
    onChange({ coverageChecking: true, serviced: null });
    setStatus('Detecting your location…');
    navigator.geolocation.getCurrentPosition(
      async ({ coords }) => {
        try {
          const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${coords.latitude}&lon=${coords.longitude}&addressdetails=1`,
          );
          const json = await response.json();
          const filled = fillFromNominatim(json.address || {}, json.display_name || '');
          await checkCoverage(coords.latitude, coords.longitude, {
            latitude: coords.latitude,
            longitude: coords.longitude,
            address1: filled.address1,
            address2: filled.address2,
            city: filled.city,
            postalCode: filled.postalCode,
            ...(filled.country
              ? {
                  country: filled.country,
                  phoneCode: filled.phoneCode,
                  altPhoneCode: filled.altPhoneCode,
                }
              : {}),
          });
          setStatus('');
        } catch {
          onChange({ serviced: false, coverageChecking: false });
          setStatus('Could not confirm pickup coverage');
        } finally {
          setDetecting(false);
        }
      },
      () => {
        setDetecting(false);
        onChange({ coverageChecking: false });
        setStatus('Allow location access to fill the address');
      },
      { enableHighAccuracy: true, timeout: 12000 },
    );
  };

  useEffect(() => {
    if (askedRef.current) return;
    askedRef.current = true;
    if (data.latitude != null && data.longitude != null && data.airport) {
      onChange({ coverageChecking: true });
      checkCoverage(data.latitude, data.longitude).catch(() => {
        onChange({ serviced: false, coverageChecking: false });
      });
      return;
    }
    detectLocation();
  }, []);

  return (
    <div className="step-panel">
      <header className="section-head">
        <h2>Pickup Location & Contact</h2>
        <span className="step-progress">3/5</span>
      </header>

      <button
        type="button"
        className="location-card"
        disabled={detecting}
        onClick={detectLocation}
      >
        <span className="location-pin" aria-hidden="true">
          {detecting ? (
            <span className="location-spinner" />
          ) : (
            <svg viewBox="0 0 24 24" fill="none">
              <path
                d="M12 21s7-6.2 7-11a7 7 0 1 0-14 0c0 4.8 7 11 7 11z"
                stroke="currentColor"
                strokeWidth="1.8"
              />
              <circle cx="12" cy="10" r="2.2" fill="currentColor" />
            </svg>
          )}
        </span>
        <div className="location-card-copy">
          <strong>Current Location</strong>
          <span>
            {detecting
              ? 'Detecting your location…'
              : status || summary || 'Click to use your current location'}
          </span>
        </div>
      </button>

      <div className="grid">
        <Field label="Room / Apartment / Floor" error={errors.floor}>
          <input
            value={data.floor}
            onChange={(event) => onChange({ floor: event.target.value })}
            placeholder="e.g. First Floor"
          />
        </Field>
        <Field label="Address Line 1" error={errors.address1}>
          <input
            value={data.address1}
            onChange={(event) => onChange({ address1: event.target.value })}
            placeholder="Building or street"
          />
        </Field>
        <Field label="Address Line 2" error={errors.address2}>
          <input
            value={data.address2}
            onChange={(event) => onChange({ address2: event.target.value })}
            placeholder="Area or landmark"
          />
        </Field>
        <Field label="City" error={errors.city}>
          <div className="field-locked">
            <input value={data.city} readOnly tabIndex={-1} />
          </div>
        </Field>
        <Field label="Postal Code" error={errors.postalCode}>
          <div className="field-locked">
            <input value={data.postalCode} readOnly tabIndex={-1} />
          </div>
        </Field>
        <Field label="Country" error={errors.country}>
          <div className="field-locked">
            <select value={data.country} disabled>
              {COUNTRIES.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.flag} {item.name}
                </option>
              ))}
            </select>
          </div>
        </Field>
        <Field
          label="Contact no."
          error={
            data.phone && !isValidContactNumber(data.phone, data.country)
              ? 'Enter a valid contact number'
              : errors.phone
          }
        >
          <div className="phone-input">
            <span>
              {country.flag} {data.phoneCode}
            </span>
            <input
              type="tel"
              inputMode="numeric"
              value={data.phone}
              onChange={(event) =>
                onChange({ phone: event.target.value.replace(/\D/g, '') })
              }
              placeholder="Phone number"
            />
          </div>
        </Field>
        <Field
          label="Alternate contact (optional)"
          error={
            data.altPhone && !isValidContactNumber(data.altPhone, data.country)
              ? 'Enter a valid alternate number'
              : errors.altPhone
          }
        >
          <div className="phone-input">
            <span>
              {country.flag} {data.altPhoneCode}
            </span>
            <input
              type="tel"
              inputMode="numeric"
              value={data.altPhone}
              onChange={(event) =>
                onChange({ altPhone: event.target.value.replace(/\D/g, '') })
              }
              placeholder="Optional"
            />
          </div>
        </Field>
      </div>

      <p className="notice">
        Pickup address can be changed until 24 hours before pickup.
      </p>

      {data.serviced === false && (
        <div className="coverage-modal" role="alertdialog" aria-modal="true">
          <div className="coverage-modal-card">
            <div className="coverage-modal-mark" aria-hidden="true">
              !
            </div>
            <h2>Location not serviceable</h2>
            <p>
              Pickup is not available at this location for the selected
              airport. Try changing the airport and check again.
            </p>
            <button
              type="button"
              className="btn-primary"
              onClick={() => {
                onChange({ serviced: null, coverageChecking: false });
                navigate('/flight');
              }}
            >
              Change airport
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
