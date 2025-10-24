import { BrowserRouter } from "react-router-dom";
import AppRouter from "./AppRouter";
import ToastContainer from "./components/organisms/ToastContainer";
import { useDispatch, useSelector } from "react-redux";
import { useEffect, useState } from "react";
import { verifyToken } from "store/slices/authSlice";
import { API } from "axios/axios";
import LoadingSpinner from "components/atoms/LoadingSpinner";
import Error500Page from "components/organisms/Errors/Error500Page";

function App() {
  const { token } = useSelector((state) => state.auth);
  const dispatch = useDispatch();

  const [isAppLoading, setIsAppLoading] = useState(true);
  const [isAppError, setIsAppError] = useState(false);
  const [needsSetup, setNeedsSetup] = useState(false);

  useEffect(() => {
    const initializeApp = async () => {
      try {
        // credential check
        if (token) {
          await dispatch(verifyToken());

          setNeedsSetup(false); // Token valid berarti setup sudah selesai
        } else {
          // if no credentials, check if need setup or not
          const response = await API.get("/api/auth/setup-status");

          setNeedsSetup(response.data.needsSetup);
        }
      } catch (error) {
        console.error("Failed to initialize app:", error);
        setIsAppError(true);
      } finally {
        setIsAppLoading(false);
      }
    };

    initializeApp();
  }, [dispatch, token]);

  if (isAppLoading) {
    return (
      <div className="flex flex-col justify-center items-center h-full min-h-[100vh] bg-white rounded-xl shadow-lg p-6">
        <LoadingSpinner />
      </div>
    );
  }

  if (isAppError) {
    return <Error500Page />;
  }

  return (
    <BrowserRouter>
      <ToastContainer />
      <AppRouter needsSetup={needsSetup} />
    </BrowserRouter>
  );
}

export default App;
