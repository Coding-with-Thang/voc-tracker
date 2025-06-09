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

      // Validate file type
      if (!file.name.match(/\.(xlsx|xls)$/)) {
        throw new Error("Please upload an Excel file (.xlsx or .xls)");
      }

      const formData = new FormData();
      formData.append("file", file);

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 55000); // 55 second timeout

      const response = await fetch("/api/upload", {
        method: "POST",
        body: formData,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      const result = await response.json();

      if (!response.ok) {
        // Enhanced error handling with detailed information
        const errorMessage = result.details
          ? `${result.error}: ${result.details}`
          : result.error;

        if (result.invalidRows) {
          const rowErrors = result.invalidRows
            .map(
              (row) =>
                `Row ${row.row}: ${row.error} ${JSON.stringify(row.data)}`
            )
            .join("\n");

          throw new Error(`${errorMessage}\n\nProblematic rows:\n${rowErrors}`);
        }

        throw new Error(errorMessage);
      }

      if (result.error) {
        throw new Error(result.error);
      }

      set({ uploadStatus: result });

      // Refresh surveys after successful upload
      await get().fetchSurveys();

      return result;
    } catch (error) {
      let errorMessage =
        error.name === "AbortError"
          ? "Upload timed out. Please try with a smaller file or contact support."
          : error.message;

      // Log the full error for debugging
      console.error("Upload error details:", {
        message: error.message,
        name: error.name,
        stack: error.stack,
      });

      set({ error: errorMessage });
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
