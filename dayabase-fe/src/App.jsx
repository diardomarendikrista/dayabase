import { BrowserRouter } from "react-router-dom";
import AppRouter from "./AppRouter"; // Import the new router component
import ToastContainer from "./components/organisms/ToastContainer"; // Assuming path from src folder
import { useDispatch, useSelector } from "react-redux";
import { useEffect } from "react";
import { verifyToken } from "store/slices/authSlice";

function App() {
  const { token, isAuthLoading } = useSelector((state) => state.auth);

  const dispatch = useDispatch();

  useEffect(() => {
    if (token) {
      dispatch(verifyToken());
    }
  }, [dispatch, token]);

  if (isAuthLoading && token) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        Loading your session...
      </div>
    );
  }

  return (
    <BrowserRouter>
      <ToastContainer />
      <AppRouter />
    </BrowserRouter>
  );
}

export default App;
