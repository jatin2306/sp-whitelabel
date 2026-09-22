import { useRef, useState } from 'react';
import uploadMedia from '../../config/services/media';
import {
  documentFieldKey,
  documentLabel,
  getVisibleVerificationRules,
  isFileDocument,
  mediaUrl,
} from '../../utility';

const ACCEPT = 'image/jpeg,image/png,image/webp,image/heic,application/pdf';

function isAllowed(file) {
  return (
    file && (file.type.startsWith('image/') || file.type === 'application/pdf')
  );
}

function FileUpload({ field, file, error, onChange }) {
  const inputRef = useRef(null);
  const [dragOver, setDragOver] = useState(false);

  const clearFile = (event) => {
    event.stopPropagation();
    if (file?.preview) URL.revokeObjectURL(file.preview);
    onChange(null);
  };

  const setFile = async (nextFile) => {
    if (!nextFile) return;
    if (!isAllowed(nextFile)) {
      onChange(null);
      return;
    }
    if (file?.preview) URL.revokeObjectURL(file.preview);
    const preview = nextFile.type.startsWith('image/')
      ? URL.createObjectURL(nextFile)
      : '';
    const base = {
      name: nextFile.name,
      type: nextFile.type,
      size: nextFile.size,
      preview,
    };
    onChange({ ...base, uploading: true, media: null, error: null });
    try {
      const media = await uploadMedia(nextFile);
      const url = media.url || mediaUrl(media);
      onChange({
        ...base,
        uploading: false,
        media,
        url,
        error: url ? null : 'Could not read uploaded file URL',
      });
    } catch {
      onChange({
        ...base,
        uploading: false,
        media: null,
        error: 'Could not upload document',
      });
    }
  };

  return (
    <>
      <div className="upload-wrap">
        {file && !file.uploading ? (
          <button
            type="button"
            className="upload-remove"
            aria-label="Remove document"
            onClick={clearFile}
          >
            ×
          </button>
        ) : null}
        <button
          type="button"
          className={`upload-drop${dragOver ? ' is-over' : ''}${
            error || file?.error ? ' has-error' : ''
          }${file ? ' has-file' : ''}${file?.uploading ? ' is-uploading' : ''}`}
          onClick={() => {
            if (!file?.uploading) inputRef.current?.click();
          }}
          onDragOver={(event) => {
            event.preventDefault();
            setDragOver(true);
          }}
          onDragLeave={() => setDragOver(false)}
          onDrop={(event) => {
            event.preventDefault();
            setDragOver(false);
            if (!file?.uploading) setFile(event.dataTransfer.files[0]);
          }}
        >
          {file ? (
            <>
              {file.preview ? (
                <img src={file.preview} alt="" />
              ) : (
                <span className="upload-icon" aria-hidden="true">
                  PDF
                </span>
              )}
              <strong>
                {file.uploading ? 'Uploading…' : file.error || file.name}
              </strong>
              <span>
                {file.uploading ? 'Please wait' : 'Click to replace image or PDF'}
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
                    strokeLinejoin="round"
                  />
                </svg>
              </span>
              <span>Click to upload image or PDF</span>
            </>
          )}
        </button>
      </div>
      <input
        ref={inputRef}
        type="file"
        accept={ACCEPT}
        hidden
        disabled={file?.uploading}
        onChange={(event) => {
          setFile(event.target.files[0]);
          event.target.value = '';
        }}
      />
      {(error || file?.error) && (
        <p className="inline-error">{error || file.error}</p>
      )}
    </>
  );
}

export function VerificationFields({ data, errors, onChange }) {
  const rules = getVisibleVerificationRules(data);
  const docs = data.docs || {};

  const setDoc = (field, value) => {
    onChange({
      docs: { ...docs, [field]: value },
      ...(field === 'passport' ? { passport: value } : {}),
      ...(field === 'boarding_pass' ? { boardingPass: value } : {}),
    });
  };

  if (!data.airline) {
    return (
      <p className="notice">Select an airline to see required documents.</p>
    );
  }

  if (rules.length === 0) {
    return (
      <p className="notice">No verification documents for this flight type.</p>
    );
  }

  return rules.map((rule) => {
    const field = documentFieldKey(rule);
    const label = documentLabel(rule);
    const file = docs[field];

    return (
      <div key={field} className="doc-block">
        <div className="doc-label">
          <strong>{label}</strong>
          <span className={rule.required ? 'required-tag' : 'optional-tag'}>
            {rule.required ? 'Required' : 'Optional'}
          </span>
        </div>
        {isFileDocument(rule) ? (
          <FileUpload
            field={field}
            file={file}
            error={errors[field]}
            onChange={(value) => setDoc(field, value)}
          />
        ) : (
          <>
            <input
              value={file?.value || ''}
              onChange={(event) =>
                setDoc(field, { value: event.target.value })
              }
              placeholder={`Enter ${label.toLowerCase()}`}
            />
            {errors[field] ? (
              <p className="inline-error">{errors[field]}</p>
            ) : null}
          </>
        )}
      </div>
    );
  });
}

export default function DocumentsStep({ data, errors, onChange }) {
  return (
    <div className="step-panel">
      <header className="section-head docs-head">
        <div>
          <h2>Verification Documents</h2>
          <p>Upload the documents required for your selected flight.</p>
        </div>
        <span className="step-progress">2/5</span>
      </header>
      <VerificationFields data={data} errors={errors} onChange={onChange} />
    </div>
  );
}
