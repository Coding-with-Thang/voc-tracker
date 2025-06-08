import { create } from "zustand";

const useSurveyStore = create((set, get) => ({
  // State
  surveys: [],
  userRole: null,
  isLoading: false,
  error: null,
  uploadStatus: null,

  // Set user role
  setUserRole: (role) => {
    set({ userRole: role });
  },

  // Fetch surveys based on user role
  fetchSurveys: async () => {
    try {
      set({ isLoading: true, error: null });

      const response = await fetch("/api/surveys");
      if (!response.ok) throw new Error("Failed to fetch surveys");

      const data = await response.json();
      set({ surveys: data, isLoading: false });
    } catch (error) {
      set({ error: error.message, isLoading: false });
    }
  },

  // Get visible surveys based on user role and voice name
  getVisibleSurveys: (userData) => {
    const { surveys, userRole } = get();

    // If user is admin or manager, return all surveys
    if (userRole === "MANAGER" || userRole === "OPERATIONS") {
      return surveys;
    }

    // For regular agents, filter surveys by their voice name
    return surveys.filter((survey) => survey.voiceName === userData?.voiceName);
  },

  uploadSurveys: async (file) => {
    try {
      set({ isLoading: true, error: null, uploadStatus: null });

      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Upload failed");
      }

      const result = await response.json();
      set({ uploadStatus: result });

      // Refresh surveys after successful upload
      await get().fetchSurveys();

      return result;
    } catch (error) {
      set({ error: error.message });
      throw error;
    } finally {
      set({ isLoading: false });
    }
  },

  // Filter surveys by date range
  filterSurveysByDate: (startDate, endDate) => {
    const allSurveys = get().surveys;
    return allSurveys.filter((survey) => {
      const surveyDate = new Date(survey.date);
      return surveyDate >= startDate && surveyDate <= endDate;
    });
  },

  // Get surveys by voice name
  getSurveysByVoiceName: (voiceName) => {
    return get().surveys.filter((survey) => survey.voiceName === voiceName);
  },

  // Clear upload status
  clearUploadStatus: () => {
    set({ uploadStatus: null });
  },

  // Reset store
  resetStore: () => {
    set({ surveys: [], isLoading: false, error: null, uploadStatus: null });
  },
}));

export default useSurveyStore;
