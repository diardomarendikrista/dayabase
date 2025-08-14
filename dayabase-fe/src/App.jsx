import { BrowserRouter } from "react-router-dom";
import AppRouter from "./AppRouter"; // Import the new router component
import ToastContainer from "./components/organisms/ToastContainer"; // Assuming path from src folder

function App() {
  return (
    <BrowserRouter>
      <ToastContainer />
      <AppRouter />
    </BrowserRouter>
  );
}

export default App;
