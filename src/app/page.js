"use client"

import StatsBar from "@@/components/stats";
import VoiceFeedback from "@@/components/VoiceFeedback";

export default function Home() {
  return (
    <div className="text-center mt-10">
      <h1>Hello User!</h1>
      <StatsBar />
      <VoiceFeedback />
    </div>
  );
}
