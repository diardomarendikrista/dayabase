import { API } from "axios/axios";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useDispatch } from "react-redux";
import { setCredentials } from "store/slices/authSlice";
import Input from "components/atoms/Input";
import Button from "components/atoms/Button";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const navigate = useNavigate();
  const dispatch = useDispatch();

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const response = await API.post("/api/auth/login", { email, password });
      dispatch(setCredentials(response.data));
      navigate("/");
    } catch (err) {
      setError("Incorrect email or password.");
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <div className="p-8 bg-white rounded-lg shadow-md w-full max-w-sm">
        <h1 className="text-2xl font-bold mb-6 text-center">Dayabase Login</h1>
        <form
          onSubmit={handleLogin}
          className="space-y-4"
        >
          <Input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <Input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          {error && <p className="text-red-500 text-sm">{error}</p>}
          <Button
            type="submit"
            className="w-full"
          >
            Login
          </Button>
        </form>
      </div>
    </div>
  );
}
