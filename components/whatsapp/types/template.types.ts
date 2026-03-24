export interface QuickReplyButton {
  id: string;
  text: string;
  payload?: string;
}

export interface TemplateData {
  friendlyName: string;
  templateName: string;
  category: string;
  language: string;
  body: string;
  buttons: QuickReplyButton[];
  variableSamples: Record<string, string>;
}

export interface TemplateFormProps {
  onSuccess?: () => void;
}

export interface Template {
  id: string;
  friendlyName: string;
  templateName: string;
  category: string;
  language: string;
  body: string;
  buttons: string[];
  status: "approved" | "pending" | "rejected";
  createdAt: string;
  variables?: Record<string, string>;
  types?: Record<string, any>;
}

export interface TemplateListItemProps {
  template: Template;
  isAdmin?: boolean;
  isApprovalView?: boolean;
  isCatalogView?: boolean;
  onUseTemplate?: (template: Template) => Promise<void>;
}
