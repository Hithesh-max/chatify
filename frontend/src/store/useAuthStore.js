import { create } from "zustand";
import { axiosInstance } from "../lib/axios";
import toast from "react-hot-toast";
import { io } from "socket.io-client";

const errorMessage = (error, fallback) => error.response?.data?.message || fallback;
export const useAuthStore = create((set, get) => ({
  authUser: null,
  isCheckingAuth: true,
  isSigningUp: false,
  isLoggingIn: false,
  socket: null,
  onlineUsers: [],

  checkAuth: async () => {
    try {
      const res = await axiosInstance.get("/auth/check");
      set({ authUser: res.data.user });
      get().connectSocket();
    } catch {
      get().disconnectSocket();
      set({ authUser: null });
    } finally {
      set({ isCheckingAuth: false });
    }
  },
  signup: async (data) => {
    set({ isSigningUp: true });
    try {
      const res = await axiosInstance.post("/auth/signup", data);
      set({ authUser: res.data });
      get().connectSocket();
      toast.success("Account created");
    } catch (error) {
      toast.error(errorMessage(error, "Could not create account"));
    } finally {
      set({ isSigningUp: false });
    }
  },
  login: async (data) => {
    set({ isLoggingIn: true });
    try {
      const res = await axiosInstance.post("/auth/login", data);
      set({ authUser: res.data });
      get().connectSocket();
      toast.success("Logged in");
    } catch (error) {
      toast.error(errorMessage(error, "Could not log in"));
    } finally {
      set({ isLoggingIn: false });
    }
  },
  logout: async () => {
    try {
      await axiosInstance.post("/auth/logout");
      get().disconnectSocket();
      set({ authUser: null });
      toast.success("Logged out");
    } catch (error) {
      toast.error(errorMessage(error, "Could not log out"));
    }
  },
  updateProfile: async (data) => {
    try {
      const res = await axiosInstance.post("/auth/update-profile", data);
      set({ authUser: res.data });
      toast.success("Profile updated");
      return true;
    } catch (error) {
      toast.error(errorMessage(error, "Could not update profile"));
      return false;
    }
  },
  connectSocket: () => {
    if (!get().authUser || get().socket) return;
    const socket = io({ withCredentials: true, autoConnect: false });
    socket.on("getOnlineUsers", (ids) => set({ onlineUsers: ids.map(String) }));
    socket.on("disconnect", () => set({ onlineUsers: [] }));
    socket.on("connect_error", (error) => {
      if (error.message === "Unauthorized") get().checkAuth();
    });
    set({ socket });
    socket.connect();
  },
  disconnectSocket: () => {
    get().socket?.disconnect();
    set({ socket: null, onlineUsers: [] });
  },
}));
