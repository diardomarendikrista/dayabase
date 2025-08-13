// src/App.jsx
import { useState, useEffect } from "react";
import { Routes, Route, BrowserRouter, Navigate } from "react-router-dom";
import MainLayout from "layouts/MainLayout";

import QuestionEditorPage from "pages/QuestionsPage/QuestionsForm";
import QuestionsListPage from "pages/QuestionsPage";
import ConnectionsPage from "pages/ConnectionsPage";
import MVP from "pages/MVP";
import ConnectionFormPage from "pages/ConnectionsPage/ConnectionsForm";
import DashboardPage from "pages/DashboardPage";
import DashboardViewPage from "pages/DashboardPage/DashboardView";
import LoginPage from "pages/LoginPage";
import ProtectedRoute from "components/atoms/ProtectedRoute";
import { API } from "axios/axios";
import RegisterAdminPage from "pages/RegisterAdminPage";
import UserManagementPage from "pages/UserManagementPage";

function App() {
  const [isLoading, setIsLoading] = useState(true);
  const [needsSetup, setNeedsSetup] = useState(false);

  useEffect(() => {
    // Cek ke backend apakah setup admin pertama diperlukan
    const checkSetupStatus = async () => {
      try {
        const response = await API.get("/api/auth/setup-status");
        setNeedsSetup(response.data.needsSetup);
      } catch (error) {
        console.error("Gagal mengecek status setup:", error);
        // Jika API error, anggap saja setup tidak diperlukan agar tidak macet
        setNeedsSetup(false);
      } finally {
        setIsLoading(false);
      }
    };
    checkSetupStatus();
  }, []);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        Loading...
      </div>
    );
  }

  return (
    <BrowserRouter>
      <Routes>
        {needsSetup ? (
          // Jika setup diperlukan, hanya render rute registrasi admin
          <>
            <Route
              path="/setup"
              element={<RegisterAdminPage />}
            />
            <Route
              path="*"
              element={
                <Navigate
                  to="/setup"
                  replace
                />
              }
            />
          </>
        ) : (
          <>
            {/* PUBLIC */}
            <Route
              path="/login"
              element={<LoginPage />}
            />
            <Route
              path="/embed/dashboards/:token"
              element={<DashboardViewPage />}
            />

            {/* NEED AUTH */}
            <Route element={<ProtectedRoute />}>
              <Route element={<MainLayout />}>
                {/* Rute untuk Dashboards */}
                <Route
                  path="/"
                  element={<DashboardPage />}
                />
                <Route
                  path="/dashboards"
                  element={<DashboardPage />}
                />
                <Route
                  path="/dashboards/:id"
                  element={<DashboardViewPage />}
                />

                {/* Route MVP, nanti dihapus, untuk demo aja */}
                <Route
                  path="/mvp"
                  element={<MVP />}
                />

                {/* Rute untuk Questions */}
                <Route
                  path="/questions"
                  element={<QuestionsListPage />}
                />
                <Route
                  path="/questions/new"
                  element={<QuestionEditorPage />}
                />
                <Route
                  path="/questions/:id"
                  element={<QuestionEditorPage />}
                />

                {/* Rute untuk Connections */}
                <Route
                  path="/settings/connections"
                  element={<ConnectionsPage />}
                />
                <Route
                  path="/settings/connections/new"
                  element={<ConnectionFormPage />}
                />
                <Route
                  path="/settings/connections/:id/edit"
                  element={<ConnectionFormPage />}
                />

                {/* Rute untuk Users */}
                <Route
                  path="/settings/users"
                  element={<UserManagementPage />}
                />
              </Route>
            </Route>
          </>
        )}
      </Routes>
    </BrowserRouter>
  );
}

export default App;
