import { createBrowserRouter, Navigate } from "react-router-dom";

import MainLayout from "./layouts/MainLayout";
import ProtectedRoute from "./components/atoms/ProtectedRoute";
import LoginPage from "./pages/LoginPage";
import RegisterAdminPage from "./pages/RegisterAdminPage";
import DashboardViewPage from "./pages/DashboardEditorPage";
import QuestionEditorPage from "./pages/QuestionsFormPage";
import ConnectionsPage from "./pages/ConnectionsPage";
import ConnectionFormPage from "./pages/ConnectionsPage/ConnectionsForm";
import UserManagementPage from "./pages/UserManagementPage";
import HomePage from "pages/Home";
import CollectionPage from "pages/CollectionsPage";
import Error404Page from "components/organisms/Errors/Error404Page";
import QuestionViewPage from "./pages/QuestionViewPage";

export const createAppRouter = (needsSetup) => {
  if (needsSetup) {
    return createBrowserRouter([
      {
        path: "/setup",
        element: <RegisterAdminPage />,
      },
      {
        path: "*",
        element: (
          <Navigate
            to="/setup"
            replace
          />
        ),
      },
    ]);
  }

  return createBrowserRouter([
    {
      path: "/login",
      element: <LoginPage />,
    },
    {
      path: "/embed/dashboards/:token",
      element: <DashboardViewPage />,
    },
    {
      path: "/embed/dashboards/:token/questions/:id/view",
      element: <QuestionViewPage />,
    },
    {
      element: <ProtectedRoute />,
      children: [
        {
          element: <MainLayout />,
          children: [
            { path: "/", element: <HomePage /> },
            { path: "/collections/:id", element: <CollectionPage /> },
            { path: "/dashboards/:id", element: <DashboardViewPage /> },
            { path: "/questions/new", element: <QuestionEditorPage /> },
            { path: "/questions/:id", element: <QuestionEditorPage /> },
            { path: "/questions/:id/view", element: <QuestionViewPage /> },
            { path: "/settings/connections", element: <ConnectionsPage /> },
            {
              path: "/settings/connections/new",
              element: <ConnectionFormPage />,
            },
            {
              path: "/settings/connections/:id/edit",
              element: <ConnectionFormPage />,
            },
            { path: "/settings/users", element: <UserManagementPage /> },
          ],
        },
      ],
    },
    {
      path: "*",
      element: <Error404Page />,
    },
  ]);
};
