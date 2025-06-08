"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import axios from "axios";

export default function AdminUploadPage() {
    const [file, setFile] = useState(null);
    const [uploading, setUploading] = useState(false);
    const [message, setMessage] = useState("");

    const handleFileChange = (e) => {
        setFile(e.target.files[0]);
    };

    const handleUpload = async () => {
        if (!file) {
            alert("Please select an Excel file to upload.");
            return;
        }

        setUploading(true);
        setMessage("");

        try {
            const formData = new FormData();
            formData.append("file", file);

            const res = await axios.post("/api/upload", formData, {
                headers: { "Content-Type": "multipart/form-data" },
            });

            setMessage(res.data.message || "Upload successful!");
        } catch (error) {
            console.error(error);
            setMessage("Upload failed.");
        }

        setUploading(false);
    };

    return (
        <div className="max-w-2xl mx-auto p-8 space-y-6">
            <h1 className="text-2xl font-bold">Survey Uploads</h1>

            <Card>
                <CardContent className="p-4 flex flex-col space-y-4">
                    <input
                        type="file"
                        accept=".xlsx, .xls"
                        onChange={handleFileChange}
                        className="border p-2"
                    />
                    <Button onClick={handleUpload} disabled={uploading}>
                        {uploading ? "Uploading..." : "Upload Surveys"}
                    </Button>

                    {message && <p className="text-sm text-green-600">{message}</p>}
                </CardContent>
            </Card>
        </div>
    );
}
