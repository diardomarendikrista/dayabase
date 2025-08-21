import { BrowserRouter } from "react-router-dom";
import AppRouter from "./AppRouter";
import ToastContainer from "./components/organisms/ToastContainer";
import { useDispatch, useSelector } from "react-redux";
import { useEffect, useState } from "react";
import { verifyToken } from "store/slices/authSlice";
import { API } from "axios/axios";

function App() {
  const { token } = useSelector((state) => state.auth);
  const dispatch = useDispatch();

  // State baru untuk mengelola semua status loading awal
  const [isAppLoading, setIsAppLoading] = useState(true);
  const [needsSetup, setNeedsSetup] = useState(false);

  useEffect(() => {
    const initializeApp = async () => {
      if (token) {
        await dispatch(verifyToken());
        setNeedsSetup(false);
      } else {
        // Jika tidak ada token, cek apakah setup diperlukan
        try {
          const response = await API.get("/api/auth/setup-status");
          setNeedsSetup(response.data.needsSetup);
        } catch (error) {
          console.error("Failed to check setup status:", error);
          setNeedsSetup(false);
        }
      }
      setIsAppLoading(false);
    };

    initializeApp();
  }, [dispatch, token]);

  // Tampilkan satu layar loading universal
  if (isAppLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        Loading application...
      </div>
    );
  }

  return (
    <BrowserRouter>
      <ToastContainer />
      <AppRouter needsSetup={needsSetup} />
    </BrowserRouter>
  );
}

export default App;
