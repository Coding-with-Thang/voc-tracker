import { create } from "zustand";
import api from "@/app/utils/axios"

const useVoiceStore = create((set, get) => ({
    surveys: [],
    loading: false,
    error: null,

    fetchSurveys: async () => {
        set({ loading: true, error: null });
        try {
            const response = await api.get("/voice/get");
            set({
                surveys: response.data.surveys,
                loading: false,
            })
        } catch (error) {
            console.error("Error fetching voice surveys", error);
            set({ loading: false });
        }
    }
}));

export default useVoiceStore;