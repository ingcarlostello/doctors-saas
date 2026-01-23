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


export type UiChat = {
  id: string
  name: string
  avatar: string
  lastMessage: string
  timestamp: string
  unreadCount: number
  isOnline: boolean
  messageStatus: "sent" | "delivered" | "read"
}