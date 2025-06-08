"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function ExcelUpload() {
    const [file, setFile] = useState(null);
    const [uploading, setUploading] = useState(false);

    const handleFileChange = (e) => {
        if (e.target.files && e.target.files[0]) {
            setFile(e.target.files[0]);
        }
    };

    const handleUpload = async () => {
        if (!file) return;
        setUploading(true);

        const formData = new FormData();
        formData.append("file", file);

        try {
            const res = await fetch("/api/upload-excel", {
                method: "POST",
                body: formData,
            });

            const data = await res.json();
            alert(data.message);
        } catch (err) {
            console.error(err);
            alert("Upload failed.");
        } finally {
            setUploading(false);
        }
    };

    return (
        <div className="flex flex-col gap-4 p-4 rounded-xl border shadow-md max-w-md mx-auto">
            <Input type="file" accept=".xlsx, .xls" onChange={handleFileChange} />
            <Button disabled={!file || uploading} onClick={handleUpload}>
                {uploading ? "Uploading..." : "Upload Excel"}
            </Button>
        </div>
    );
}
