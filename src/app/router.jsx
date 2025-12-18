import { createBrowserRouter } from "react-router-dom";
import ProtectedRoute from "./ProtectedRoute";
import AppLayout from "./AppLayout";
import Login from "../pages/Login";
import Register from "../pages/Register";
import Home from "../pages/Home";
import PostDetail from "../pages/PostDetail";
import Notifications from "../pages/Notification";


export const router = createBrowserRouter([
  { path: "/login", element: <Login /> },
  { path: "/register", element: <Register /> },

  {
    path: "/",
    element: (
      <ProtectedRoute>
        <AppLayout />
      </ProtectedRoute>
    ),
        children: [
  { index: true, element: <Home /> },
  { path: "posts/:id", element: <PostDetail /> },
  { path: "notifications", element: <Notifications /> },
],

  },
]);
