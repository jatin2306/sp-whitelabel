import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Field } from "../ui";
import {
  COUNTRIES,
  countryById,
  formatPickupAddress,
} from "../catalog";
import getPickupCoverage from "../../config/services/coverage";

import {
  defaultCountries,
  FlagImage,
  parseCountry,
  usePhoneInput,
} from "react-international-phone";

const PREFERRED_COUNTRIES = [
  "in",
  "us",
  "gb",
  "ca",
  "au",
];


function fillFromNominatim(address, displayName) {
  const street = [
    address.house_number,
    address.road,
  ]
    .filter(Boolean)
    .join(" ");

  const countryCode = String(
    address.country_code || "",
  ).toUpperCase();

  const matched = COUNTRIES.find(
    (item) => item.id === countryCode,
  );

  return {
    address1:
      street ||
      displayName.split(",")[0] ||
      "",

    address2:
      address.suburb ||
      address.neighbourhood ||
      address.quarter ||
      "",

    city:
      address.city ||
      address.town ||
      address.village ||
      address.county ||
      "",

    postalCode:
      address.postcode || "",

    country: matched
      ? matched.id
      : undefined,

    phoneCode: matched
      ? matched.code
      : undefined,

    altPhoneCode: matched
      ? matched.code
      : undefined,
  };
}

function PhoneInput({
  value,
  countryCode,
  onChange,
  onCountryChange,
  placeholder,
  error,
}) {
  const [dropdownOpen, setDropdownOpen] =
    useState(false);

  const [search, setSearch] =
    useState("");

  const buttonRef = useRef(null);
  const dropdownRef = useRef(null);
  const searchRef = useRef(null);

  const [dropdownStyle, setDropdownStyle] =
    useState({
      top: 0,
      left: 0,
      width: 280,
    });

  const defaultCountry =
    countryCode
      ? String(countryCode).toLowerCase()
      : "in";

  const {
    inputValue,
    country,
    setCountry,
    handlePhoneValueChange,
    inputRef,
  } = usePhoneInput({
    defaultCountry:
      defaultCountry || "in",

    value: value || "",

    disableCountryGuess: true,

    disableDialCodePrefill: true,

    disableDialCodeAndPrefix: true,

    forceDialCode: false,

    onChange: (phoneData) => {
      onChange(phoneData.phone);

      onCountryChange({
        iso2: phoneData.country.iso2,
        dialCode: `+${phoneData.country.dialCode}`,
      });
    },
  });

  useEffect(() => {
    const nextCountry = countryCode
      ? String(countryCode).toLowerCase()
      : "in";

    if (
      nextCountry &&
      country?.iso2 !== nextCountry
    ) {
      setCountry(nextCountry, {
        focusOnInput: false,
      });
    }
  }, [countryCode, country?.iso2, setCountry]);


  const displayValue = inputValue
    .replace(`+${country.dialCode}`, "")
    .trim();

 
  const orderedCountries = useMemo(() => {
    const preferred =
      PREFERRED_COUNTRIES.map((iso2) =>
        defaultCountries.find(
          (item) =>
            parseCountry(item).iso2 ===
            iso2,
        ),
      ).filter(Boolean);

    const preferredSet = new Set(
      preferred.map(
        (item) =>
          parseCountry(item).iso2,
      ),
    );

    const remaining =
      defaultCountries.filter(
        (item) =>
          !preferredSet.has(
            parseCountry(item).iso2,
          ),
      );

    return [
      ...preferred,
      ...remaining,
    ];
  }, []);

 
  const filteredCountries = useMemo(() => {
    const query =
      search.trim().toLowerCase();

    if (!query) {
      return orderedCountries;
    }

    const normalizedDialCode =
      query.replace("+", "");

    return orderedCountries.filter(
      (item) => {
        const parsed =
          parseCountry(item);

        return (
          parsed.name
            .toLowerCase()
            .includes(query) ||
          parsed.iso2
            .toLowerCase()
            .includes(query) ||
          parsed.dialCode.includes(
            normalizedDialCode,
          )
        );
      },
    );
  }, [
    orderedCountries,
    search,
  ]);


  const updateDropdownPosition = () => {
    const rect =
      buttonRef.current?.getBoundingClientRect();

    if (!rect) return;

    const dropdownWidth = Math.min(
      300,
      window.innerWidth - 32,
    );

    let left = rect.left;

    if (
      left + dropdownWidth >
      window.innerWidth - 16
    ) {
      left =
        window.innerWidth -
        dropdownWidth -
        16;
    }

    setDropdownStyle({
      top: rect.bottom + 5,
      left: Math.max(16, left),
      width: dropdownWidth,
    });
  };


  const handleCountrySelect = (iso2) => {
    const countryItem =
      defaultCountries.find(
        (item) =>
          parseCountry(item).iso2 ===
          iso2,
      );

    if (!countryItem) return;

    const selectedCountry =
      parseCountry(countryItem);

    setCountry(iso2, {
      focusOnInput: true,
    });

    onCountryChange({
      iso2: selectedCountry.iso2,
      dialCode: `+${selectedCountry.dialCode}`,
    });

    setDropdownOpen(false);
    setSearch("");
  };


  useEffect(() => {
    if (!dropdownOpen) return;

    const timer = setTimeout(() => {
      searchRef.current?.focus();
    }, 50);

    return () => {
      clearTimeout(timer);
    };
  }, [dropdownOpen]);


  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(
          event.target,
        ) &&
        buttonRef.current &&
        !buttonRef.current.contains(
          event.target,
        )
      ) {
        setDropdownOpen(false);
      }
    };

    document.addEventListener(
      "mousedown",
      handleClickOutside,
    );

    return () => {
      document.removeEventListener(
        "mousedown",
        handleClickOutside,
      );
    };
  }, []);


  useEffect(() => {
    if (!dropdownOpen) return;

    const handlePositionChange = () => {
      updateDropdownPosition();
    };

    window.addEventListener(
      "resize",
      handlePositionChange,
    );

    window.addEventListener(
      "scroll",
      handlePositionChange,
      true,
    );

    return () => {
      window.removeEventListener(
        "resize",
        handlePositionChange,
      );

      window.removeEventListener(
        "scroll",
        handlePositionChange,
        true,
      );
    };
  }, [dropdownOpen]);


  return (
    <div className="phone-input-wrapper">
      <div
        className={`phone-input ${
          error ? "has-error" : ""
        }`}
      >
        <button
          ref={buttonRef}
          type="button"
          className="phone-country-button"
          onClick={() => {
            updateDropdownPosition();

            setDropdownOpen(
              (previous) => !previous,
            );

            setSearch("");
          }}
        >
          <FlagImage
            iso2={country.iso2}
            className="phone-country-flag"
          />

          <span className="phone-country-code">
            +{country.dialCode}
          </span>

          <svg
            className={`phone-country-arrow ${
              dropdownOpen
                ? "is-open"
                : ""
            }`}
            viewBox="0 0 20 20"
            fill="currentColor"
            aria-hidden="true"
          >
            <path
              fillRule="evenodd"
              d="M5.23 7.21a.75.75 0 0 1 1.06.02L10 11.168l3.71-3.938a.75.75 0 1 1 1.08 1.04l-4.25 4.5a.75.75 0 0 1-1.08 0l-4.25-4.5a.75.75 0 0 1 .02-1.06Z"
              clipRule="evenodd"
            />
          </svg>
        </button>

        <input
          ref={inputRef}
          type="tel"
          inputMode="numeric"
          value={displayValue}
          placeholder={
            placeholder || "Phone number"
          }
          onChange={
            handlePhoneValueChange
          }
          className="phone-number-input"
        />
      </div>

      {dropdownOpen && (
        <div
          ref={dropdownRef}
          className="phone-country-dropdown"
          style={{
            top: dropdownStyle.top,
            left: dropdownStyle.left,
            width: dropdownStyle.width,
          }}
        >
          <div className="phone-country-search">
            <input
              ref={searchRef}
              type="search"
              value={search}
              placeholder="Search country"
              onChange={(event) =>
                setSearch(
                  event.target.value,
                )
              }
            />
          </div>

          <ul className="phone-country-list">
            {filteredCountries.length ===
            0 ? (
              <li className="phone-no-country">
                No countries found
              </li>
            ) : (
              filteredCountries.map(
                (item) => {
                  const parsed =
                    parseCountry(item);

                  const isSelected =
                    parsed.iso2 ===
                    country.iso2;

                  return (
                    <li
                      key={parsed.iso2}
                      className={`phone-country-option ${
                        isSelected
                          ? "is-selected"
                          : ""
                      }`}
                      onClick={() =>
                        handleCountrySelect(
                          parsed.iso2,
                        )
                      }
                    >
                      <FlagImage
                        iso2={
                          parsed.iso2
                        }
                        className="phone-country-flag"
                      />

                      <span className="phone-country-name">
                        {parsed.name}
                      </span>

                      <span className="phone-country-dial">
                        +{parsed.dialCode}
                      </span>
                    </li>
                  );
                },
              )
            )}
          </ul>
        </div>
      )}
    </div>
  );
}


export default function PickupStep({
  data,
  errors = {},
  onChange,
}) {
  const navigate = useNavigate();

  const country = countryById(data.country);

  const summary =
    formatPickupAddress(data);

  const [status, setStatus] =
    useState("");

  const [detecting, setDetecting] =
    useState(false);

  const askedRef = useRef(false);

  const checkCoverage = async (
    lat,
    lng,
    extra = {},
  ) => {
    const coverage =
      await getPickupCoverage({
        lat,
        lng,
        airport_id: data.airport,
      });

    onChange({
      ...extra,

      serviced:
        coverage.serviced,

      zone_id:
        coverage.zone_id,

      pickup_distance_km:
        coverage.pickup_distance_km,

      zone_band:
        coverage.zone_band,

      coverageChecking: false,
    });

    return coverage.serviced;
  };


  const detectLocation = () => {
    if (!navigator.geolocation) {
      setStatus(
        "Location is not supported in this browser",
      );

      return;
    }

    setDetecting(true);

    onChange({
      coverageChecking: true,
      serviced: null,
    });

    setStatus(
      "Detecting your location…",
    );

    navigator.geolocation.getCurrentPosition(
      async ({ coords }) => {
        try {
          const response =
            await fetch(
              `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${coords.latitude}&lon=${coords.longitude}&addressdetails=1`,
            );

          const json =
            await response.json();

          const filled =
            fillFromNominatim(
              json.address || {},
              json.display_name || "",
            );

          await checkCoverage(
            coords.latitude,
            coords.longitude,
            {
              latitude:
                coords.latitude,

              longitude:
                coords.longitude,

              address1:
                filled.address1,

              address2:
                filled.address2,

              city:
                filled.city,

              postalCode:
                filled.postalCode,

              ...(filled.country
                ? {
                    country:
                      filled.country,
                  }
                : {}),

              ...(filled.phoneCode
                ? {
                    phoneCode:
                      filled.phoneCode,
                  }
                : {}),

              ...(filled.altPhoneCode
                ? {
                    altPhoneCode:
                      filled.altPhoneCode,
                  }
                : {}),
            },
          );

          setStatus("");
        } catch {
          onChange({
            serviced: false,
            coverageChecking: false,
          });

          setStatus(
            "Could not confirm pickup coverage",
          );
        } finally {
          setDetecting(false);
        }
      },

      () => {
        setDetecting(false);

        onChange({
          coverageChecking: false,
        });

        setStatus(
          "Allow location access to fill the address",
        );
      },

      {
        enableHighAccuracy: true,
        timeout: 12000,
      },
    );
  };


  useEffect(() => {
    if (askedRef.current) return;

    askedRef.current = true;

    if (
      data.latitude != null &&
      data.longitude != null &&
      data.airport
    ) {
      onChange({
        coverageChecking: true,
      });

      checkCoverage(
        data.latitude,
        data.longitude,
      ).catch(() => {
        onChange({
          serviced: false,
          coverageChecking: false,
        });
      });

      return;
    }

    detectLocation();
  }, []);

 
  const handlePhoneChange = (phone) => {
    onChange({
      phone,
    });
  };

  const handleAltPhoneChange = (
    phone,
  ) => {
    onChange({
      altPhone: phone,
    });
  };

 
  const handlePhoneCountryChange = ({
    iso2,
    dialCode,
  }) => {
    onChange({
      phoneCountry:
        iso2.toUpperCase(),

      phoneCode: dialCode,
    });
  };


  const handleAltPhoneCountryChange = ({
    iso2,
    dialCode,
  }) => {
    onChange({
      altPhoneCountry:
        iso2.toUpperCase(),

      altPhoneCode: dialCode,
    });
  };


  return (
    <div className="step-panel">
      <header className="section-head">
        <h2>
          Pickup Location & Contact
        </h2>

        <span className="step-progress">
          3/5
        </span>
      </header>

      
      <button
        type="button"
        className="location-card"
        disabled={detecting}
        onClick={detectLocation}
      >
        <span
          className="location-pin"
          aria-hidden="true"
        >
          {detecting ? (
            <span className="location-spinner" />
          ) : (
            <svg
              viewBox="0 0 24 24"
              fill="none"
            >
              <path
                d="M12 21s7-6.2 7-11a7 7 0 1 0-14 0c0 4.8 7 11 7 11z"
                stroke="currentColor"
                strokeWidth="1.8"
              />

              <circle
                cx="12"
                cy="10"
                r="2.2"
                fill="currentColor"
              />
            </svg>
          )}
        </span>

        <div className="location-card-copy">
          <strong>
            Current Location
          </strong>

          <span>
            {detecting
              ? "Detecting your location…"
              : status ||
                summary ||
                "Click to use your current location"}
          </span>
        </div>
      </button>

      {/* Form */}
      <div className="grid">
        <Field
          label="Room / Apartment / Floor"
          error={errors.floor}
        >
          <input
            value={data.floor || ""}
            onChange={(event) =>
              onChange({
                floor:
                  event.target.value,
              })
            }
            placeholder="e.g. First Floor"
          />
        </Field>

        <Field
          label="Address Line 1"
          error={errors.address1}
        >
          <input
            value={data.address1 || ""}
            onChange={(event) =>
              onChange({
                address1:
                  event.target.value,
              })
            }
            placeholder="Building or street"
          />
        </Field>

        <Field
          label="Address Line 2"
          error={errors.address2}
        >
          <input
            value={data.address2 || ""}
            onChange={(event) =>
              onChange({
                address2:
                  event.target.value,
              })
            }
            placeholder="Area or landmark"
          />
        </Field>

        <Field
          label="City"
          error={errors.city}
        >
          <div className="field-locked">
            <input
              value={data.city || ""}
              readOnly
              tabIndex={-1}
            />
          </div>
        </Field>

        <Field
          label="Postal Code"
          error={errors.postalCode}
        >
          <div className="field-locked">
            <input
              value={
                data.postalCode || ""
              }
              readOnly
              tabIndex={-1}
            />
          </div>
        </Field>

        <Field
          label="Country"
          error={errors.country}
        >
          <div className="field-locked">
            <input
              value={
                country
                  ? `${country.flag} ${country.name}`
                  : ""
              }
              readOnly
              tabIndex={-1}
            />
          </div>
        </Field>

        {/* Contact */}
        <Field
          label="Contact no."
          error={errors.phone}
        >
          <PhoneInput
            value={data.phone}
            countryCode={
              data.phoneCountry ||
              "IN"
            }
            onChange={
              handlePhoneChange
            }
            onCountryChange={
              handlePhoneCountryChange
            }
            placeholder="Phone number"
            error={!!errors.phone}
          />
        </Field>

        {/* Alternate Contact */}
        <Field
          label="Alternate contact (optional)"
          error={errors.altPhone}
        >
          <PhoneInput
            value={data.altPhone}
            countryCode={
              data.altPhoneCountry ||
              "IN"
            }
            onChange={
              handleAltPhoneChange
            }
            onCountryChange={
              handleAltPhoneCountryChange
            }
            placeholder="Optional"
            error={!!errors.altPhone}
          />
        </Field>
      </div>

      <p className="notice">
        Pickup address can be changed
        until 24 hours before pickup.
      </p>

      {/* Coverage Modal */}
      {data.serviced === false && (
        <div
          className="coverage-modal"
          role="alertdialog"
          aria-modal="true"
        >
          <div className="coverage-modal-card">
            <div
              className="coverage-modal-mark"
              aria-hidden="true"
            >
              !
            </div>

            <h2>
              Location not serviceable
            </h2>

            <p>
              Pickup is not available at
              this location for the selected
              airport. Try changing the
              airport and check again.
            </p>

            <button
              type="button"
              className="btn-primary"
              onClick={() => {
                onChange({
                  serviced: null,
                  coverageChecking: false,
                });

                navigate("/flight");
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