import { useEffect, useRef } from "react";
import Dropdown from "../Dropdown";
import { Field } from "../ui";
import { BAG_SIZES, CABIN_CLASSES } from "../catalog";
import uploadMedia from "../../config/services/media";
import { bagPhotoList, mediaUrl } from "../../utility";
import checkWeight from "../../config/services/checkWeight";

function nextId(prefix) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

export function emptyBag() {
  return { id: nextId("bag"), name: "", size: "", weight: "", photos: [] };
}

export function emptyPassenger() {
  return { id: nextId("pax"), name: "", passport: null, bags: [emptyBag()] };
}

function isImage(file) {
  return file && file.type.startsWith("image/");
}

function BagPhotos({ photos, error, onAdd, onRemove }) {
  const inputRef = useRef(null);
  const uploading = photos.some((photo) => photo.uploading);

  return (
    <div className="field">
      <span className="field-label">Upload photos</span>
      {photos.length > 0 ? (
        <ul className="bag-photos">
          {photos.map((photo) => (
            <li key={photo.id} className="bag-photo">
              {photo.preview || photo.url ? (
                <img src={photo.preview || photo.url} alt="" />
              ) : (
                <span className="bag-photo-fallback">Photo</span>
              )}
              <span>
                {photo.uploading ? "Uploading…" : photo.error || photo.name}
              </span>
              <button
                type="button"
                className="text-remove"
                onClick={() => onRemove(photo.id)}
              >
                Remove
              </button>
            </li>
          ))}
        </ul>
      ) : null}
      <button
        type="button"
        className="btn-add"
        disabled={uploading}
        onClick={() => inputRef.current?.click()}
      >
        + Add photo
      </button>
      {error ? <span className="field-error">{error}</span> : null}
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        multiple
        hidden
        onChange={(event) => {
          onAdd(event.target.files);
          event.target.value = "";
        }}
      />
    </div>
  );
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

  const passengersRef = useRef(passengers);
  passengersRef.current = passengers;

  const commitPassengers = (next) => {
    passengersRef.current = next;
    onChange({ bagPassengers: next });
  };

  const updatePassenger = (index, patch) => {
    commitPassengers(
      passengersRef.current.map((passenger, current) =>
        current === index ? { ...passenger, ...patch } : passenger,
      ),
    );
  };

  const updateBag = (passengerIndex, bagIndex, patch) => {
    updatePassenger(passengerIndex, {
      bags: passengersRef.current[passengerIndex].bags.map((bag, current) =>
        current === bagIndex ? { ...bag, ...patch } : bag,
      ),
    });
  };

  const writePhotos = (passengerIndex, bagIndex, photos) => {
    updateBag(passengerIndex, bagIndex, { photos, photo: null });
  };

  const addPhotos = async (passengerIndex, bagIndex, fileList) => {
    const files = [...fileList].filter(isImage);
    if (!files.length) return;
    const bag = passengersRef.current[passengerIndex].bags[bagIndex];
    const created = files.map((file) => ({
      file,
      photo: {
        id: nextId("photo"),
        name: file.name,
        type: file.type,
        preview: URL.createObjectURL(file),
        uploading: true,
        media: null,
        url: "",
        error: null,
      },
    }));
    writePhotos(passengerIndex, bagIndex, [
      ...bagPhotoList(bag),
      ...created.map((item) => item.photo),
    ]);

    await Promise.all(
      created.map(async ({ file, photo }) => {
        const finish = (patch) => {
          const latest = bagPhotoList(
            passengersRef.current[passengerIndex].bags[bagIndex],
          );
          writePhotos(
            passengerIndex,
            bagIndex,
            latest.map((item) =>
              item.id === photo.id ? { ...item, ...patch } : item,
            ),
          );
        };
        try {
          const media = await uploadMedia(file);
          const url = media.url || mediaUrl(media);
          finish({
            uploading: false,
            media,
            url,
            error: url ? null : "Could not read uploaded file URL",
          });
        } catch {
          finish({
            uploading: false,
            media: null,
            error: "Could not upload photo",
          });
        }
      }),
    );
  };

  const removePhoto = (passengerIndex, bagIndex, photoId) => {
    const latest = bagPhotoList(
      passengersRef.current[passengerIndex].bags[bagIndex],
    );
    const removed = latest.find((item) => item.id === photoId);
    if (removed?.preview) URL.revokeObjectURL(removed.preview);
    writePhotos(
      passengerIndex,
      bagIndex,
      latest.filter((item) => item.id !== photoId),
    );
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
                  <Dropdown
                    value={bag.size}
                    options={BAG_SIZES}
                    valueKey="id"
                    labelKey="name"
                    placeholder="Select size"
                    onChange={(value) =>
                      updateBag(passengerIndex, bagIndex, { size: value })
                    }
                  />
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
                    onWheel={(event) => event.currentTarget.blur()}
                    onChange={(event) =>
                      updateBag(passengerIndex, bagIndex, {
                        weight: event.target.value,
                      })
                    }
                    placeholder={maxKg != null ? `Max ${maxKg}` : "Weight"}
                  />
                </Field>
              </div>
              <BagPhotos
                photos={bagPhotoList(bag)}
                error={errors[`p-${passengerIndex}-b-${bagIndex}-photos`]}
                onAdd={(files) => addPhotos(passengerIndex, bagIndex, files)}
                onRemove={(photoId) =>
                  removePhoto(passengerIndex, bagIndex, photoId)
                }
              />
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
    </div>
  );
}
