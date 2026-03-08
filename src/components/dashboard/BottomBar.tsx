"use client";

import TimelinePanel from "@/components/panels/TimelinePanel";

export default function BottomBar() {
  return (
    <div className="fixed bottom-0 left-10 right-0 h-24 bg-military-dark/95 border-t border-gray-800 z-30 px-4 py-2">
      <TimelinePanel />
    </div>
  );
}
