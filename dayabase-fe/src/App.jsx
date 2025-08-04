// src/App.jsx
import { Routes, Route, BrowserRouter } from "react-router-dom";
import MainLayout from "layouts/MainLayout";

// Impor halaman-halaman baru Anda
import QuestionEditorPage from "pages/QuestionsPage/QuestionsForm";
import QuestionsListPage from "pages/QuestionsPage";
import ConnectionsPage from "pages/ConnectionsPage";
import MVP from "pages/MVP";
import ConnectionFormPage from "pages/ConnectionsPage/ConnectionsForm";
import DashboardPage from "pages/DashboardPage";
import DashboardViewPage from "pages/DashboardPage/DashboardView";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<MainLayout />}>
          <Route
            path="/"
            element={<MVP />}
          />
        </Route>

        <Route element={<MainLayout />}>
          {/* <Route path="/" element={<DashboardPage />} /> */}

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
          <Route
            path="/dashboards"
            element={<DashboardPage />}
          />
          <Route
            path="/dashboards/:id"
            element={<DashboardViewPage />}
          />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
