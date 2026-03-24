"use client";

import React from "react";
import { useAnnouncements } from "@/hooks/useAnnouncements";
import { AnnouncementSection } from "@/app/sections/mainpage/AnnouncementSection";
import { RehearsalSection } from "@/app/sections/mainpage/RehearsalSection";

export default function Home() {
  const { announcement, announcementLoading, fetchLatestAnnouncement } = useAnnouncements();

  React.useEffect(() => {
    void fetchLatestAnnouncement();
  }, [fetchLatestAnnouncement]);

  return (
    <div className="min-h-screen pb-6">
      <AnnouncementSection
        announcement={announcement}
        announcementLoading={announcementLoading}
        onDelete={() => fetchLatestAnnouncement()}
      />
      <RehearsalSection />
    </div>
  );
}