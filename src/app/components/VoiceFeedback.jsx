import { useState } from "react";
import { AgGridReact } from "ag-grid-react";
import { AllCommunityModule, ModuleRegistry } from 'ag-grid-community';
import "ag-grid-community/styles/ag-grid.css";
import "ag-grid-community/styles/ag-theme-quartz.css";

export default function VoiceFeedback() {

    const [rowData, setRowData] = useState([
        { make: "Tesla", model: "Model 3", price: "100,000" },
        { make: "Ford", model: "Escape", price: "50,000" },
        { make: "Toyota", model: "Camry", price: "70,000" },
    ]);

    const [colDefs, setColDefs] = useState([
        { field: "make" },
        { field: "model" },
        { field: "price" }
    ]);

    return (
        <section className="mt-10">
            <h2 className="text-center">Voice Feedback</h2>
            <div className="ag-theme-quartz" style={{ height: 400, width: 600 }}>
                <AgGridReact rowData={rowData} columnDefs={colDefs} />
            </div>
        </section>
    )
}