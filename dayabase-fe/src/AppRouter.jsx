import { Routes, Route, Navigate } from "react-router-dom";

import MainLayout from "./layouts/MainLayout";
import ProtectedRoute from "./components/atoms/ProtectedRoute";
import LoginPage from "./pages/LoginPage";
import RegisterAdminPage from "./pages/RegisterAdminPage";
import DashboardViewPage from "./pages/DashboardEditorPage";
import QuestionEditorPage from "./pages/QuestionsFormPage";
import ConnectionsPage from "./pages/ConnectionsPage";
import ConnectionFormPage from "./pages/ConnectionsPage/ConnectionsForm";
import UserManagementPage from "./pages/UserManagementPage";
import MVP from "./pages/MVP";
import HomePage from "pages/Home";
import CollectionPage from "pages/CollectionsPage";

// AppRouter sekarang menerima `needsSetup` sebagai prop
export default function AppRouter({ needsSetup }) {
  return (
    <Routes>
      {needsSetup ? (
        // Setup Mode
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
        // Normal App Mode
        <>
          {/* Public Routes */}
          <Route
            path="/login"
            element={<LoginPage />}
          />
          <Route
            path="/embed/dashboards/:token"
            element={<DashboardViewPage />}
          />

          {/* Protected Routes */}
          <Route element={<ProtectedRoute />}>
            <Route element={<MainLayout />}>
              <Route
                path="/"
                element={<HomePage />}
              />
              <Route
                path="/collections/:id"
                element={<CollectionPage />}
              />
              <Route
                path="/dashboards/:id"
                element={<DashboardViewPage />}
              />
              <Route
                path="/questions/new"
                element={<QuestionEditorPage />}
              />
              <Route
                path="/questions/:id"
                element={<QuestionEditorPage />}
              />
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
              <Route
                path="/settings/users"
                element={<UserManagementPage />}
              />
              <Route
                path="/mvp"
                element={<MVP />}
              />
            </Route>
          </Route>
        </>
      )}
    </Routes>
  );
}
