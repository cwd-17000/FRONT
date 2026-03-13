export type NotificationSettings = {
  weeklySummaryEmail: boolean;
  checkInRemindersEmail: boolean;
  mentionsEmail: boolean;
  productUpdatesInApp: boolean;
};

export type ProfileSettings = {
  fullName: string;
  email: string;
  title: string;
  timezone: string;
  organizationName: string;
  organizationRole: string;
};

export type SecuritySettings = {
  lastPasswordChange: string | null;
  twoFactorRequired: boolean;
};

export type CadenceOption = "Monthly" | "Quarterly" | "Semi-Annual" | "Annual";

export type OrganizationSettings = {
  name: string;
  slug: string;
  industry?: string;
  defaultCadence: CadenceOption;
  plan: string;
  membersCount: number;
  billingEmail: string;
};

export type SettingsResponse = {
  profile: ProfileSettings;
  security: SecuritySettings;
  notifications: NotificationSettings;
  organization?: OrganizationSettings | null;
};

export type SaveResult = {
  success: boolean;
  message?: string;
};
