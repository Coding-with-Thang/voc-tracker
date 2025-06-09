'use client';

import useSurveyStore from '../../../store/surveyStore';
import { useRef } from 'react';

function SurveyUpload() {
  const { uploadSurveys, isLoading, error, uploadStatus, clearUploadStatus } = useSurveyStore();
  const fileInputRef = useRef(null);

  const handleFileUpload = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.name.match(/\.(xlsx|xls)$/)) {
      setError('Please upload an Excel file (.xlsx or .xls)');
      return;
    }

    try {
      await uploadSurveys(file);
    } catch (err) {
      // Error handling is managed by the store
      console.error('Upload failed:', err);
    }
  };

  const handleClear = () => {
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    clearUploadStatus();
  };

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <div className="bg-white shadow-md rounded px-8 pt-6 pb-8 mb-4">
        <h2 className="text-2xl font-bold mb-6">Upload Survey Data</h2>

        <div className="mb-6">
          <label className="block text-gray-700 text-sm font-bold mb-2">
            Select Excel File
          </label>
          <div className="flex gap-4">
            <input
              ref={fileInputRef}
              type="file"
              accept=".xlsx,.xls"
              onChange={handleFileUpload}
              disabled={isLoading}
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
            />
            <button
              onClick={handleClear}
              disabled={isLoading}
              className="bg-gray-500 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline disabled:opacity-50"
            >
              Clear
            </button>
          </div>
          <p className="text-sm text-gray-500 mt-2">
            Accepted formats: .xlsx, .xls
          </p>
        </div>

        {isLoading && (
          <div className="mb-4">
            <p className="text-blue-600">Uploading...</p>
          </div>
        )}

        {error && (
          <div className="mb-4 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
            {error}
          </div>
        )}

        {uploadStatus && (
          <div className="mb-4 bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded">
            <h3 className="font-bold">Upload Results:</h3>
            <ul className="mt-2">
              <li>Successfully added: {uploadStatus.success}</li>
              <li>Skipped (duplicates): {uploadStatus.skipped}</li>
              {uploadStatus.errors.length > 0 && (
                <li>
                  <p className="font-bold mt-2">Errors:</p>
                  <ul className="list-disc pl-5">
                    {uploadStatus.errors.map((error, index) => (
                      <li key={index} className="text-sm">{error}</li>
                    ))}
                  </ul>
                </li>
              )}
            </ul>
          </div>
        )}
      </div>

      <div className="bg-white shadow-md rounded px-8 pt-6 pb-8">
        <h3 className="text-xl font-bold mb-4">Excel File Format</h3>
        <p className="mb-4">Your Excel file should have the following columns:</p>
        <ul className="list-disc pl-5 space-y-2">
          <li><strong>voiceName</strong> - The voice name of the agent</li>
          <li><strong>AHT</strong> - Average Handle Time (format: MM:SS)</li>
          <li><strong>CSAT</strong> - Customer Satisfaction Score (1-5)</li>
          <li><strong>date</strong> - Survey date (YYYY-MM-DD format)</li>
          <li><strong>comment</strong> - Optional comment</li>
        </ul>
      </div>
    </div>
  );
}

export default SurveyUpload;