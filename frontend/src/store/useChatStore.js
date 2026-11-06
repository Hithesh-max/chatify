import { create } from "zustand";
import { axiosInstance } from "../lib/axios";
import toast from "react-hot-toast";
import { useAuthStore } from "./useAuthStore";

const notify = (error, fallback) => toast.error(error.response?.data?.message || fallback);
const belongsTo = (message, self, other) =>
  (Number(message.senderId) === self && Number(message.receiverId) === other) ||
  (Number(message.receiverId) === self && Number(message.senderId) === other);
const merge = (list, message) => list.some((item) => item.id === message.id)
  ? list : [...list, message].sort((a, b) => a.id - b.id);

export const useChatStore = create((set, get) => ({
  allContacts: [], chats: [], messages: [], activeTab: "chats", selectedUser: null,
  isUsersLoading: false, isMessagesLoading: false,
  isSoundEnabled: localStorage.getItem("isSoundEnabled") === "true",
  toggleSound: () => {
    const next = !get().isSoundEnabled;
    localStorage.setItem("isSoundEnabled", String(next));
    set({ isSoundEnabled: next });
  },
  setActiveTab: (tab) => set({ activeTab: tab }),
  setSelectedUser: (user) => set({ selectedUser: user, messages: [], isMessagesLoading: Boolean(user) }),
  reset: () => set({ allContacts: [], chats: [], messages: [], selectedUser: null, activeTab: "chats", isUsersLoading: false, isMessagesLoading: false }),
  getAllContacts: async () => {
    const owner = useAuthStore.getState().authUser?.id;
    set({ isUsersLoading: true });
    try {
      const res = await axiosInstance.get("/messages/contacts");
      if (useAuthStore.getState().authUser?.id === owner) set({ allContacts: res.data });
    } catch (error) { notify(error, "Could not load contacts"); }
    finally { if (useAuthStore.getState().authUser?.id === owner) set({ isUsersLoading: false }); }
  },
  getMyChatPartners: async () => {
    const owner = useAuthStore.getState().authUser?.id;
    set({ isUsersLoading: true });
    try {
      const res = await axiosInstance.get("/messages/chats");
      if (useAuthStore.getState().authUser?.id === owner) set({ chats: res.data });
    } catch (error) { notify(error, "Could not load chats"); }
    finally { if (useAuthStore.getState().authUser?.id === owner) set({ isUsersLoading: false }); }
  },
  getMessagesByUserId: async (userId) => {
    const owner = useAuthStore.getState().authUser?.id;
    set({ isMessagesLoading: true });
    try {
      const res = await axiosInstance.get(`/messages/${userId}`);
      if (useAuthStore.getState().authUser?.id === owner && Number(get().selectedUser?.id) === Number(userId)) {
        // Include socket events that arrived while the history request was in flight.
        const self = Number(useAuthStore.getState().authUser?.id);
        const live = get().messages.filter((m) => belongsTo(m, self, Number(userId)));
        set({ messages: live.reduce(merge, res.data) });
      }
    } catch (error) { notify(error, "Could not load messages"); }
    finally {
      if (useAuthStore.getState().authUser?.id === owner && Number(get().selectedUser?.id) === Number(userId)) set({ isMessagesLoading: false });
    }
  },
  receiveMessage: (message) => {
    const self = Number(useAuthStore.getState().authUser?.id);
    const other = Number(get().selectedUser?.id);
    if (belongsTo(message, self, other)) {
      const alreadyPresent = get().messages.some((item) => item.id === message.id);
      set({ messages: merge(get().messages, message) });
      if (!alreadyPresent && Number(message.senderId) !== self && get().isSoundEnabled) {
        new Audio("/sounds/notification.mp3").play().catch(() => {});
      }
    }
    get().getMyChatPartners();
  },
  sendMessage: async (messageData) => {
    const other = get().selectedUser?.id;
    if (!other) return false;
    try {
      const res = await axiosInstance.post(`/messages/send/${other}`, messageData);
      if (Number(get().selectedUser?.id) === Number(other)) {
        set({ messages: merge(get().messages, res.data) });
      }
      get().getMyChatPartners();
      return true;
    } catch (error) {
      notify(error, "Could not send message");
      return false;
    }
  },
}));
