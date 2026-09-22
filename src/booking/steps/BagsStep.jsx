import { useEffect } from "react";
import { Field } from "../ui";
import { BAG_SIZES, CABIN_CLASSES } from "../catalog";
import uploadMedia from "../../config/services/media";
import { mediaUrl } from "../../utility";
import checkWeight from "../../config/services/checkWeight";

function nextId(prefix) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

export function emptyBag() {
  return { id: nextId("bag"), name: "", size: "", weight: "", photo: null };
}

export function emptyPassenger() {
  return { id: nextId("pax"), name: "", bags: [emptyBag()] };
}

function isImage(file) {
  return file && file.type.startsWith("image/");
}

export default function BagsStep({ data, errors, onChange }) {
  const passengers = data.bagPassengers || [];
  const perPassenger = data.weightCheck?.per_passenger;
  const maxKg = perPassenger?.max_weight_kg_per_bag;
  const bagsAllowed = perPassenger?.checked_bags_allowed;

  useEffect(() => {
    const airline_id = data.airline;
    const cabin_class = CABIN_CLASSES.find(
      (item) => item.id === data.cabinClass,
    )?.name;
    const flight_type = data.flightType
      ? String(data.flightType).toUpperCase()
      : null;
    if (!airline_id || !cabin_class || !flight_type) return;

    let cancelled = false;

    const fetchLimit = async () => {
      try {
        const response = await checkWeight({
          airline_id,
          flight_type,
          passenger_count: passengers.length,
          cabin_class,
        });
        if (!cancelled) onChange({ weightCheck: response });
      } catch {
        if (!cancelled) onChange({ weightCheck: null });
      }
    };

    fetchLimit();
    return () => {
      cancelled = true;
    };
  }, [data.airline, data.flightType, data.cabinClass, passengers.length]);

  const setPassengers = (bagPassengers) => onChange({ bagPassengers });

  const updatePassenger = (index, patch) => {
    setPassengers(
      passengers.map((passenger, current) =>
        current === index ? { ...passenger, ...patch } : passenger,
      ),
    );
  };

  const updateBag = (passengerIndex, bagIndex, patch) => {
    updatePassenger(passengerIndex, {
      bags: passengers[passengerIndex].bags.map((bag, current) =>
        current === bagIndex ? { ...bag, ...patch } : bag,
      ),
    });
  };

  const setPhoto = async (passengerIndex, bagIndex, file) => {
    if (!file || !isImage(file)) return;
    const current = passengers[passengerIndex].bags[bagIndex].photo;
    if (current?.preview) URL.revokeObjectURL(current.preview);
    const preview = URL.createObjectURL(file);
    updateBag(passengerIndex, bagIndex, {
      photo: {
        name: file.name,
        type: file.type,
        preview,
        uploading: true,
        media: null,
        error: null,
      },
    });
    try {
      const media = await uploadMedia(file);
      const url = media.url || mediaUrl(media);
      updateBag(passengerIndex, bagIndex, {
        photo: {
          name: file.name,
          type: file.type,
          preview,
          uploading: false,
          media,
          url,
          error: url ? null : "Could not read uploaded file URL",
        },
      });
    } catch {
      updateBag(passengerIndex, bagIndex, {
        photo: {
          name: file.name,
          type: file.type,
          preview,
          uploading: false,
          media: null,
          error: "Could not upload photo",
        },
      });
    }
  };

  return (
    <div className="step-panel">
      <header className="section-head">
        <h2>Bags & Declarations</h2>
        <span className="step-progress">5/5</span>
      </header>

      {maxKg != null && (
        <p className="notice">
          Please ensure each bag weight is no more than {maxKg} kg.
        </p>
      )}

      {passengers.map((passenger, passengerIndex) => (
        <section key={passenger.id} className="passenger-card">
          <div className="passenger-card-head">
            <h3>Passenger {passengerIndex + 1}</h3>
            {passengers.length > 1 && (
              <button
                type="button"
                className="text-remove"
                onClick={() =>
                  setPassengers(
                    passengers.filter(
                      (_, current) => current !== passengerIndex,
                    ),
                  )
                }
              >
                Remove
              </button>
            )}
          </div>

          <Field
            label="Passenger Name"
            error={errors[`p-${passengerIndex}-name`]}
          >
            <input
              value={passenger.name}
              onChange={(event) =>
                updatePassenger(passengerIndex, { name: event.target.value })
              }
              placeholder="Full name as on ticket"
            />
          </Field>

          {passenger.bags.map((bag, bagIndex) => (
            <div key={bag.id} className="bag-block">
              <div className="bag-block-head">
                <strong>Bag {bagIndex + 1}</strong>
                {passenger.bags.length > 1 && (
                  <button
                    type="button"
                    className="text-remove"
                    onClick={() =>
                      updatePassenger(passengerIndex, {
                        bags: passenger.bags.filter(
                          (_, current) => current !== bagIndex,
                        ),
                      })
                    }
                  >
                    Remove bag
                  </button>
                )}
              </div>
              <div className="grid grid-3">
                <Field
                  label="Bag Name"
                  error={errors[`p-${passengerIndex}-b-${bagIndex}-name`]}
                >
                  <input
                    value={bag.name}
                    onChange={(event) =>
                      updateBag(passengerIndex, bagIndex, {
                        name: event.target.value,
                      })
                    }
                    placeholder="e.g. Check-in suitcase"
                  />
                </Field>
                <Field
                  label="Bag Size"
                  error={errors[`p-${passengerIndex}-b-${bagIndex}-size`]}
                >
                  <select
                    value={bag.size}
                    onChange={(event) =>
                      updateBag(passengerIndex, bagIndex, {
                        size: event.target.value,
                      })
                    }
                  >
                    <option value="">Select size</option>
                    {BAG_SIZES.map((size) => (
                      <option key={size.id} value={size.id}>
                        {size.name}
                      </option>
                    ))}
                  </select>
                </Field>
                <Field
                  label="Weight (in Kg)"
                  error={
                    maxKg != null &&
                    String(bag.weight || "").trim() &&
                    Number(bag.weight) > Number(maxKg)
                      ? `Weight cannot be more than ${maxKg} kg`
                      : errors[`p-${passengerIndex}-b-${bagIndex}-weight`]
                  }
                >
                  <input
                    type="number"
                    min="1"
                    value={bag.weight}
                    onChange={(event) =>
                      updateBag(passengerIndex, bagIndex, {
                        weight: event.target.value,
                      })
                    }
                    placeholder={maxKg != null ? `Max ${maxKg}` : "Weight"}
                  />
                </Field>
              </div>
              <div className="field">
                <span className="field-label">Upload photo</span>
                <label
                  className={`upload-drop is-compact${
                    bag.photo ? " has-file" : ""
                  }${bag.photo?.uploading ? " is-uploading" : ""}${
                    bag.photo?.error ? " has-error" : ""
                  }`}
                >
                  <input
                    type="file"
                    accept="image/*"
                    hidden
                    disabled={bag.photo?.uploading}
                    onChange={(event) => {
                      setPhoto(passengerIndex, bagIndex, event.target.files[0]);
                      event.target.value = "";
                    }}
                  />
                  {bag.photo ? (
                    <>
                      <img src={bag.photo.preview} alt="" />
                      <span>
                        {bag.photo.uploading
                          ? "Uploading…"
                          : bag.photo.error || bag.photo.name}
                      </span>
                    </>
                  ) : (
                    <>
                      <span className="upload-icon" aria-hidden="true">
                        <svg viewBox="0 0 24 24" fill="none">
                          <path
                            d="M7 18a5 5 0 0 1-.4-10 6 6 0 0 1 11.5 1.6A4 4 0 0 1 18 18"
                            stroke="currentColor"
                            strokeWidth="1.8"
                          />
                          <path
                            d="M12 18V9m0 0l-3.2 3.2M12 9l3.2 3.2"
                            stroke="currentColor"
                            strokeWidth="1.8"
                            strokeLinecap="round"
                          />
                        </svg>
                      </span>
                      <span>Click to browse files or images</span>
                    </>
                  )}
                </label>
              </div>
            </div>
          ))}

          <div className="add-row">
            <button
              type="button"
              className="btn-add"
              onClick={() => {
                if (
                  bagsAllowed != null &&
                  passenger.bags.length >= bagsAllowed
                ) {
                  return;
                }
                updatePassenger(passengerIndex, {
                  bags: [...passenger.bags, emptyBag()],
                });
              }}
            >
              + Add Bag
            </button>
            {(bagsAllowed != null && passenger.bags.length >= bagsAllowed
              ? `Cannot add more than ${bagsAllowed} bags`
              : errors[`p-${passengerIndex}-bags`]) && (
              <span className="field-error">
                {bagsAllowed != null && passenger.bags.length >= bagsAllowed
                  ? `Cannot add more than ${bagsAllowed} bags`
                  : errors[`p-${passengerIndex}-bags`]}
              </span>
            )}
          </div>
        </section>
      ))}

      <button
        type="button"
        className="btn-add-passenger"
        onClick={() => setPassengers([...passengers, emptyPassenger()])}
      >
        + Add Passenger
      </button>
    </div>
  );
}
