import { API } from "axios/axios";
import Button from "components/atoms/Button";
import Input from "components/atoms/Input";
import { useEffect, useState } from "react";

export default function RegisterAdminPage() {
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    password: "",
    repeatPassword: "",
  });
  const [error, setError] = useState("");

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    try {
      await API.post("/api/auth/register-first-admin", formData);
      alert("Admin created.");
      window.location.href = "/login";
    } catch (err) {
      setError(err.response?.data?.message || "Fail to create admin.");
    }
  };

  useEffect(() => {
    if (formData.password !== formData.repeatPassword)
      setError("Password not match.");
    else setError("");
  }, [formData.repeatPassword]);

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <div className="p-8 bg-white rounded-lg shadow-md w-full max-w-sm">
        <h1 className="text-2xl font-bold mb-2 text-center">
          First Admin Setup
        </h1>
        <p className="text-center text-gray-600 mb-6">
          Welcome to DayaBase! Create your admin account.
        </p>
        <form
          onSubmit={handleRegister}
          className="space-y-4"
        >
          <Input
            name="fullName"
            type="text"
            placeholder="Full Name"
            onChange={handleChange}
            required
            className="w-full p-2 border rounded"
          />
          <Input
            name="email"
            type="email"
            placeholder="Email"
            onChange={handleChange}
            required
            className="w-full p-2 border rounded"
          />
          <Input
            name="password"
            type="password"
            placeholder="Password"
            onChange={handleChange}
            required
            className="w-full p-2 border rounded"
          />
          <Input
            name="repeatPassword"
            type="password"
            placeholder="Repeat Password"
            onChange={handleChange}
            required
            className="w-full p-2 border rounded"
          />
          {error && <p className="text-red-500 text-sm">{error}</p>}
          <Button
            type="submit"
            className="w-full"
          >
            Create Admin Account
          </Button>
        </form>
      </div>
    </div>
  );
}
