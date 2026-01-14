export type TwilioIncomingPhoneNumber = {
  sid: string;
  phone_number: string;
  friendly_name?: string;
  capabilities?: {
    sms?: boolean;
    voice?: boolean;
    mms?: boolean;
    fax?: boolean;
  };
};