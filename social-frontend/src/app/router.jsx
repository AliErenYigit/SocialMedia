import { createBrowserRouter } from "react-router-dom";
import ProtectedRoute from "./ProtectedRoute";
import AppLayout from "./AppLayout";

import Login from "../pages/Login";
import Register from "../pages/Register";
import Home from "../pages/Home";
import PostDetail from "../pages/PostDetail";
import Notifications from "../pages/Notification";
import Profile from "../pages/Profile";
import ChatPage from "../pages/ChatPage";

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

      // ✅ kendi profilim
      { path: "profile", element: <Profile /> },

      // ✅ başka kullanıcının profili
      { path: "profile/:userId", element: <Profile /> },

      // ✅ chat sayfası
      { path: "chat/:conversationId", element: <ChatPage /> },
    ],
  },
]);
