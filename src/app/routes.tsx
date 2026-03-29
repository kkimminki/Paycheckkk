import { createBrowserRouter } from "react-router";
import { Layout } from "./components/Layout";
import { Dashboard } from "./pages/Dashboard";
import { Calendar } from "./pages/Calendar";
import { Calculator } from "./pages/Calculator";
import { Policy } from "./pages/Policy";
import { Settings } from "./pages/Settings";
import { NotFound } from "./pages/NotFound";

export const router = createBrowserRouter([
  {
    path: "/",
    Component: Layout,
    children: [
      { index: true, Component: Dashboard },
      { path: "calendar", Component: Calendar },
      { path: "calculator", Component: Calculator },
      { path: "policy", Component: Policy },
      { path: "settings", Component: Settings },
      { path: "*", Component: NotFound },
    ],
  },
]);
