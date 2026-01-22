"use client";
import { useState, useEffect, useCallback } from "react";
import { TemplateStatCards } from "./TemplateStatCards";
import { TemplateList } from "./TemplateList";
import { Button } from "@/components/ui/button";
import { MessageSquare, Plus } from "lucide-react";
import { useAction } from "convex/react";
import { api } from "@/convex/_generated/api";
import { toast } from "sonner";
import { AddTemplateDialog } from "./add-template-dialog";
import { Template } from "./TemplateListItem";

export function WhatsappTemplateContent() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [templates, setTemplates] = useState<Template[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  const listTemplatesAction = useAction(api.twilio.listWhatsAppTemplates);

  const fetchTemplates = useCallback(async () => {
    try {
      const data = await listTemplatesAction();
      const mappedTemplates: Template[] = data.map((t: any) => ({
        id: t.sid,
        friendlyName: t.friendlyName,
        templateName: t.friendlyName, 
        category: t.category,
        language: t.language,
        body: t.body,
        buttons: t.buttons,
        status: (t.status === "approved" || t.status === "rejected") ? t.status : "pending",
        createdAt: t.createdAt ? new Date(t.createdAt).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
      }));
      setTemplates(mappedTemplates);
    } catch (error) {
      console.error("Error fetching templates:", error);
      toast.error("Error al cargar plantillas de Twilio");
    } finally {
      setIsLoading(false);
    }
  }, [listTemplatesAction]);

  useEffect(() => {
    fetchTemplates();
    
    // Polling cada 5 minutos (300000 ms)
    const intervalId = setInterval(fetchTemplates, 300000);
    
    return () => clearInterval(intervalId);
  }, [fetchTemplates]);

  const stats = {
    approved: templates.filter((t) => t.status === "approved").length,
    pending: templates.filter((t) => t.status === "pending").length,
    total: templates.length,
  };

  if (isLoading) {
    return (
      <div className="max-w-6xl mx-auto flex items-center justify-center p-12">
        <p className="text-muted-foreground animate-pulse">Cargando templates desde Twilio...</p>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
            <MessageSquare className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground">
              WhatsApp Templates
            </h1>
            <p className="text-muted-foreground">
              Crea y administra plantillas de mensajes para WhatsApp Business
            </p>
          </div>
        </div>

        <Button onClick={() => setIsDialogOpen(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Crear Template
        </Button>
      </div>

      <TemplateStatCards stats={stats} />

      <div className="mt-8">
        <h2 className="text-lg font-semibold text-foreground mb-4">
          Mis Templates
        </h2>
        {templates.length > 0 ? (
          <TemplateList templates={templates} />
        ) : (
          <div className="text-center p-8 border border-dashed rounded-lg">
            <p className="text-muted-foreground">No tienes templates creados aún.</p>
          </div>
        )}
      </div>

      <AddTemplateDialog 
        open={isDialogOpen} 
        onOpenChange={setIsDialogOpen}
        onSuccess={() => {
          setIsDialogOpen(false);
          fetchTemplates(); // Recargar lista al crear exitosamente
        }}
      />
    </div>
  );
}
