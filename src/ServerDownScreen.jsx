import { useState } from 'react';
import axiosInstance from './config/axiosInstance';
import API from './config/endpoint';
import { setServerDown } from './config/serverStatus';
import './ServerDownScreen.css';

export default function ServerDownScreen() {
  const [retrying, setRetrying] = useState(false);

  const retry = async () => {
    setRetrying(true);
    try {
      await axiosInstance.get(API.getAirports);
      setServerDown(false);
    } catch {
      setServerDown(true);
    } finally {
      setRetrying(false);
    }
  };

  return (
    <div className="server-down">
      <div className="server-down-card">
        <div className="server-down-mark" aria-hidden="true">
          !
        </div>
        <h1>Service unavailable</h1>
        <p>
          We can&apos;t reach the booking server right now. Please check your
          connection or try again in a moment.
        </p>
        <button type="button" onClick={retry} disabled={retrying}>
          {retrying ? 'Checking…' : 'Try again'}
        </button>
      </div>
    </div>
  );
}
