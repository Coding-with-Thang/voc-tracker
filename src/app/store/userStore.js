import { create } from "zustand";

const useUserStore = create((set, get) => ({
  users: [],
  availableVoiceNames: [],
  isLoading: false,
  error: null,
  assignmentStatus: null,

  // Fetch all users
  fetchUsers: async () => {
    try {
      set({ isLoading: true, error: null });
      const response = await fetch("/api/admin/users");
      if (!response.ok) throw new Error("Failed to fetch users");
      const data = await response.json();
      set({ users: data, isLoading: false });
    } catch (error) {
      set({ error: error.message, isLoading: false });
    }
  },

  // Fetch available voice names
  fetchVoiceNames: async () => {
    try {
      const response = await fetch("/api/admin/voice-names");
      if (!response.ok) throw new Error("Failed to fetch voice names");
      const data = await response.json();
      set({ availableVoiceNames: data });
    } catch (error) {
      set({ error: error.message });
    }
  },

  // Assign voice name to user
  assignVoiceName: async (userId, voiceName) => {
    try {
      set({ isLoading: true, error: null });
      const response = await fetch("/api/admin/assign-voice", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ userId, voiceName }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error);
      }

      const updatedUser = await response.json();

      // Update users list with new assignment
      set((state) => ({
        users: state.users.map((user) =>
          user.id === userId ? { ...user, voiceName } : user
        ),
        assignmentStatus: "success",
      }));

      // Refresh available voice names
      await get().fetchVoiceNames();
    } catch (error) {
      set({ error: error.message, assignmentStatus: "error" });
    } finally {
      set({ isLoading: false });
    }
  },

  clearAssignmentStatus: () => {
    set({ assignmentStatus: null });
  },
}));

export default useUserStore;
