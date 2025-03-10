export interface UserDetail {
  id: string;
  fullName: string;
  email: string;
  roles: string[];
  isActive: boolean;
  phoneNumber: string;
  twoFacotrEnabled: true;
  phoneNumberConfirmed: true;
  accessFailedCount: 0;
}
