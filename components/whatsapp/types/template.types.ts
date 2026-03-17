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
