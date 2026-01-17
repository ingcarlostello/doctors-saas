export type MainAccountNumber = {
  sid: string;
  phoneNumber: string;
  friendlyName?: string;
  capabilities?: {
    sms?: boolean;
    voice?: boolean;
    mms?: boolean;
    fax?: boolean;
  };
};