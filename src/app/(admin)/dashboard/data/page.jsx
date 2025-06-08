"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import useSurveyStore from "@/app/store/surveyStore";

export default function AdminUploadPage() {
    const [file, setFile] = useState(null);
    const [uploading, setUploading] = useState(false);
    const [message, setMessage] = useState("");
    const [error, setError] = useState("");
    const uploadSurveys = useSurveyStore((state) => state.uploadSurveys);

    const handleFileChange = (e) => {
        const selectedFile = e.target.files[0];
        setFile(selectedFile);
        setMessage("");
        setError("");
    };

    const handleUpload = async () => {
        if (!file) {
            setError("Please select an Excel file to upload.");
            return;
        }

        setUploading(true);
        setMessage("");
        setError("");

        try {
            const result = await uploadSurveys(file);

            if (result.error) {
                throw new Error(result.details || result.error);
            }

            const { success, skipped, errors } = result;
            let statusMessage = `Successfully processed ${success} entries.`;
            if (skipped > 0) {
                statusMessage += ` Skipped ${skipped} duplicate entries.`;
            }
            if (errors.length > 0) {
                statusMessage += ` Failed to process ${errors.length} entries.`;
            }
            setMessage(statusMessage);

            if (errors.length > 0) {
                setError("Some entries had errors:\n" + errors.join("\n"));
            }
        } catch (error) {
            console.error("Upload error:", error);
            setError(error.message || "Failed to upload file. Please try again.");
        }

        setUploading(false);
        setFile(null);
        // Reset the file input
        const fileInput = document.querySelector('input[type="file"]');
        if (fileInput) fileInput.value = "";
    };

    return (
        <div className="max-w-2xl mx-auto p-8 space-y-6">
            <h1 className="text-2xl font-bold">Survey Uploads</h1>

            <Card>
                <CardContent className="p-4 flex flex-col space-y-4">
                    <div>
                        <input
                            type="file"
                            accept=".xlsx, .xls"
                            onChange={handleFileChange}
                            className="border p-2 w-full"
                        />
                        <p className="text-sm text-gray-500 mt-1">
                            Accepted formats: .xlsx, .xls (Max size: 10MB)
                        </p>
                    </div>

                    <Button
                        onClick={handleUpload}
                        disabled={uploading || !file}
                        className="w-full"
                    >
                        {uploading ? "Uploading..." : "Upload Surveys"}
                    </Button>

                    {message && (
                        <p className="text-sm text-green-600 whitespace-pre-wrap">{message}</p>
                    )}
                    {error && (
                        <p className="text-sm text-red-600 whitespace-pre-wrap">{error}</p>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
