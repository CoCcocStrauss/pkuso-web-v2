export enum AttendanceStatus {
  PRESENT = "present",
  LATE = "late",
  ABSENT = "absent",
  EXCUSED = "excused",
}

export const AttendanceStr2EnumMap: Record<string, AttendanceStatus> = {
  "present": AttendanceStatus.PRESENT,
  "late": AttendanceStatus.LATE,
  "absent": AttendanceStatus.ABSENT,
  "excused": AttendanceStatus.EXCUSED,
};

export enum ProfileRole {
  ADMIN = "admin",
  MEMBER = "member",
}

export enum ProfileStatus {
  APPROVED = "approved",
  PENDING = "pending",
}

export enum RehearsalType {
  FULL = "full",
  SECTION = "section",
}

export enum PostType {
  ENSEMBLE = "ensemble",
  GATHERING = "gathering",
}
