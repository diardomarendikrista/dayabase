import { API } from "axios/axios";
import Button from "components/atoms/Button";
import Input from "components/atoms/Input";
import Select from "components/atoms/Select";
import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";

export default function ConnectionFormPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEditMode = !!id;

  const [formData, setFormData] = useState({
    connection_name: "",
    db_type: "postgres",
    host: "localhost",
    port: 5432,
    db_user: "postgres",
    password: "",
    database_name: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);

  const dbTypeOptions = [
    { value: "postgres", label: "PostgreSQL" },
    { value: "mysql", label: "MySQL" },
  ];

  useEffect(() => {
    if (isEditMode) {
      const fetchConnectionDetails = async () => {
        try {
          const response = await API.get(`/api/connections/${id}`);
          const conn = response.data;
          setFormData({
            connection_name: conn.connection_name,
            db_type: conn.db_type,
            host: conn.host,
            port: conn.port,
            db_user: conn.db_user,
            password: "",
            database_name: conn.database_name,
          });
        } catch (err) {
          alert("Failed to load connection details.");
          navigate("/settings/connections");
        }
      };
      fetchConnectionDetails();
    }
  }, [id, isEditMode, navigate]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleDbTypeChange = (value) => {
    setFormData((prev) => ({ ...prev, db_type: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);
    try {
      if (isEditMode) {
        await API.put(`/api/connections/${id}`, formData);
      } else {
        await API.post("/api/connections", formData);
      }
      navigate("/settings/connections");
    } catch (err) {
      setError(err.response?.data?.message || "Operation failed.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div>
      <h1 className="text-3xl font-bold mb-6">
        {isEditMode ? "Edit Connection" : "Add New Connection"}
      </h1>
      <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
        <form
          onSubmit={handleSubmit}
          className="space-y-6"
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <Input
                name="connection_name"
                label="Connection Name"
                value={formData.connection_name}
                onChange={handleChange}
                placeholder="e.g., Production DB"
                required
              />
            </div>
            <div>
              <Select
                label="Database Type"
                options={dbTypeOptions}
                value={formData.db_type}
                onChange={handleDbTypeChange}
              />
            </div>
            <div>
              <Input
                label="Host"
                name="host"
                value={formData.host}
                onChange={handleChange}
                placeholder="localhost"
                required
              />
            </div>
            <div>
              <Input
                label="Port"
                name="port"
                type="number"
                value={formData.port}
                onChange={handleChange}
                placeholder="5432"
                required
              />
            </div>
            <div>
              <Input
                label="User"
                name="db_user"
                value={formData.db_user}
                onChange={handleChange}
                placeholder="postgres"
                required
              />
            </div>
            <div>
              <Input
                label="Password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                type="password"
                placeholder={
                  isEditMode ? "Leave empty to keep unchanged" : "Password"
                }
              />
            </div>
            <div>
              <Input
                label="Database Name"
                name="database_name"
                value={formData.database_name}
                onChange={handleChange}
                placeholder="mydatabase"
                required
              />
            </div>
          </div>
          {error && <p className="text-red-500 text-sm">{error}</p>}
          <div className="flex items-center space-x-4 pt-4">
            <Button
              type="submit"
              disabled={isSubmitting}
            >
              {isSubmitting
                ? "Saving..."
                : isEditMode
                  ? "Update Connection"
                  : "Save Connection"}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate(-1)}
            >
              Cancel
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
