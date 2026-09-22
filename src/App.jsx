import { BrowserRouter } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import BookingWidget from './booking/BookingWidget';
import 'react-toastify/dist/ReactToastify.css';

function App() {
  return (
    <BrowserRouter>
      <BookingWidget />
      <ToastContainer
        position="top-right"
        autoClose={4500}
        hideProgressBar={false}
        newestOnTop
        closeOnClick
        pauseOnHover
        theme="colored"
      />
    </BrowserRouter>
  );
}

export default App;
