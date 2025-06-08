"use client";

import { useState } from "react";
import { CircularProgressbar } from 'react-circular-progressbar';
import 'react-circular-progressbar/dist/styles.css';

export default function StatsBar() {
    const [value, setValue] = useState(75);

    return (
        <section className="flex gap-3 justify-center items-center p-4 border border-gray-400 rounded-lg m-4 shadow">
            <div className="p-2">
                <h3 className="mb-2">Current CSAT</h3>
                <CircularProgressbar value={value} text={`${value}%`} className="w-20 h-20" />
            </div>
            <div>
                <h3 className="mb-2">CSAT MTD</h3>
                <CircularProgressbar value={value} text={`${value}%`} className="w-20 h-20" />
            </div>
            <div>
                <h3 className="mb-2">Quarterly CSAT</h3>
                <CircularProgressbar value={value} text={`${value}%`} className="w-20 h-20" />
            </div>
        </section>
    )
}