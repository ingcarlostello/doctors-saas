"use client";

import { useState, useEffect } from "react";
import { useQuery, useAction } from "convex/react";
// eslint-disable-next-line @typescript-eslint/no-require-imports
const api = require("@/convex/_generated/api").api;
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { FileText, Loader2, Send } from "lucide-react";
import { Id } from "@/convex/_generated/dataModel";

interface TemplateSelectorProps {
    conversationId: Id<"conversations">;
    onSelect: (templateSid: string, variables: Record<string, string>, preview: string) => void;
    disabled?: boolean;
}

export function TemplateSelector({
    conversationId,
    onSelect,
    disabled,
}: TemplateSelectorProps) {
    const [open, setOpen] = useState(false);
    const [templates, setTemplates] = useState<any[] | undefined>(undefined);
    const listTemplates = useAction(api.twilio.listWhatsAppTemplates);

    useEffect(() => {
        if (open && templates === undefined) {
            listTemplates()
                .then((allTemplates) => {
                    // Filter to only show approved templates (required for WhatsApp Business)
                    const approvedTemplates = allTemplates.filter(
                        (t: any) => t.status === "approved"
                    );
                    setTemplates(approvedTemplates);
                })
                .catch((err) => {
                    console.error("Failed to load templates", err);
                    setTemplates([]);
                });
        }
    }, [open, templates, listTemplates]);

    const context = useQuery(api.chat.getConversationContext as any, {
        conversationId,
    });

    const handleSelect = (template: any) => {
        console.log('template ====>', template);
        console.log('context =====>', context);
        
        
        if (!context) {
            console.warn("Context not loaded yet");
            return;
        }

        // Map variables based on template variable keys
        // Template variables come as: { "1": "nombre_paciente", "2": "nombre_doctor", ... }
        const variables: Record<string, string> = {};

        if (template.variables) {
            Object.keys(template.variables).forEach((key) => {
                console.log('key ====>', key);

                const varName = template.variables[key];
                console.log('varName ====>', varName);

                // Map known variable names to context values
                if (varName.includes("paciente") || varName.includes("patient") || key === "1") {
                    variables[key] = context.patientName || "Paciente";
                    console.log('variables[key] 1====>', variables[key]);
                } else if (varName.includes("doctor") || key === "2") {
                    variables[key] = context.doctorName || "Doctor";
                    console.log('variables[key] 2====>', variables[key]);
                } else if (varName.includes("fecha") || varName.includes("date") || key === "3") {
                    variables[key] = context.nextAppointmentDate || "Pendiente";
                    console.log('variables[key] 3====>', variables[key]);
                } else {
                    // Default fallback
                    variables[key] = "";
                }
            });
        } else {
            // Fallback: sequential mapping
            variables["1"] = context.patientName || "Paciente";
            variables["2"] = context.doctorName || "Doctor";
            variables["3"] = context.nextAppointmentDate || "Pendiente";
        }

        const templateBody = typeof template.body === "string" ? template.body : "";
        const resolvedBody = templateBody.replace(/\{\{\s*(\d+)\s*\}\}/g, (_match: string, key: string) => {
            const value = variables[String(key)];
            return value ?? "";
        });
        const preview =
            resolvedBody.trim() ||
            templateBody.trim() ||
            template.friendlyName ||
            "Template";
        console.log('variables ))====>', variables);
        onSelect(template.sid, variables, preview);
        setOpen(false);
    };

    const isLoading = templates === undefined;

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <Button
                    variant="outline"
                    size="sm"
                    className="gap-2 h-9"
                    disabled={disabled}
                >
                    <FileText className="w-4 h-4" />
                    <span className="hidden sm:inline">Send Template</span>
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80 p-0" align="end">
                <div className="p-3 border-b font-medium bg-muted/50">
                    Select Template
                </div>
                <div className="max-h-[300px] overflow-y-auto p-1">
                    {isLoading ? (
                        <div className="flex justify-center p-4">
                            <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                        </div>
                    ) : templates?.length === 0 ? (
                        <div className="p-4 text-center text-sm text-muted-foreground">
                            No approved templates found.
                        </div>
                    ) : (
                        <div className="grid gap-1">
                            {templates?.map((template: any) => (
                                <button
                                    key={template.sid}
                                    onClick={() => handleSelect(template)}
                                    className="text-left px-3 py-2 rounded-md hover:bg-muted transition-colors text-sm flex flex-col gap-1"
                                >
                                    <span className="font-medium">{template.friendlyName}</span>
                                    <span className="text-xs text-muted-foreground line-clamp-1">
                                        {template.body}
                                    </span>
                                </button>
                            ))}
                        </div>
                    )}
                </div>
            </PopoverContent>
        </Popover>
    );
}
