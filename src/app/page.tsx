"use client";

import React from "react";
import { useUser } from "@/context/UserContext";
import { useAnnouncements } from "@/hooks/useAnnouncements";
import { useAttendance } from "@/hooks/useAttendance";
import { AnnouncementSection } from "@/app/section/AnnouncementSection";
import { RehearsalSection } from "@/app/section/RehearsalSection";
import { AttendanceModal } from "@/components/modal/AttendanceModal";

export default function Home() {
  const { user } = useUser(); // 只解构需要的 user
  const role = user?.role;
  const isAdmin = role === "admin";

  const { announcement, announcementLoading, fetchLatestAnnouncement } = useAnnouncements();
  const {
    myAttendanceByRehearsal,
    attendanceModalRehearsal,
    setAttendanceModalRehearsal,
    attendanceLoading,
    attendanceMembers,
    statusByUserId,
    setStatusByUserId,
    attendanceSaving,
    handleMemberSignIn,
    handleSaveAttendance,
  } = useAttendance(user?.id, isAdmin);

  React.useEffect(() => {
    void fetchLatestAnnouncement();
  }, [fetchLatestAnnouncement]);

  return (
    <div className="min-h-screen pb-6">
      <AnnouncementSection
        announcement={announcement}
        announcementLoading={announcementLoading}
      />

      <RehearsalSection />
    
      <AttendanceModal
        rehearsal={attendanceModalRehearsal}
        loading={attendanceLoading}
        members={attendanceMembers}
        statusByUserId={statusByUserId}
        onStatusChange={(userId, status) =>
          setStatusByUserId((prev) => ({ ...prev, [userId]: status }))
        }
        saving={attendanceSaving}
        onSave={handleSaveAttendance}
        onClose={() => setAttendanceModalRehearsal(null)}
      />
    </div>
  );
}