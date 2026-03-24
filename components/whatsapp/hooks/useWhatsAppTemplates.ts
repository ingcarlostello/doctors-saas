"use client";
import { useState, useEffect, useCallback } from "react";
import { useUser } from "@clerk/nextjs";
import { useAction, useQuery } from "convex/react";
import { toast } from "sonner";
import { Template } from "../types/template.types";

const api = require("@/convex/_generated/api").api;

export function useWhatsAppTemplates() {
  const { user, isLoaded: isUserLoaded } = useUser();
  const email = user?.primaryEmailAddress?.emailAddress;
  const isAdmin = useQuery(api.admin.isAdmin, email ? { email } : "skip");

  const [activeTab, setActiveTab] = useState("globales");
  const [activeUserTab, setActiveUserTab] = useState("catalogo");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [twilioTemplates, setTwilioTemplates] = useState<Template[]>([]);
  const [isTwilioLoading, setIsTwilioLoading] = useState(true);

  const globalTemplatesRaw = useQuery(
    api.templates.getGlobalTemplates,
    isAdmin === false ? {} : "skip"
  );

  const listTemplatesAction = useAction(api.twilio.listWhatsAppTemplates);
  const createContentTemplate = useAction(api.twilio.createContentTemplate);

  const fetchTwilioTemplates = useCallback(async () => {
    if (isAdmin === undefined) return;
    try {
      setIsTwilioLoading(true);
      const data = await listTemplatesAction();
      const mappedTemplates: Template[] = data.map((t: any) => ({
        id: t.sid,
        friendlyName: t.friendlyName,
        templateName: t.friendlyName,
        category: t.category,
        language: t.language,
        body: t.body,
        variables: t.variables,
        buttons: t.buttons,
        status: (t.status === "approved" || t.status === "rejected") ? t.status : "pending",
        createdAt: t.createdAt
          ? new Date(t.createdAt).toISOString().split("T")[0]
          : new Date().toISOString().split("T")[0],
      }));
      setTwilioTemplates(mappedTemplates);
    } catch (error) {
      console.error("Error fetching TWILIO templates:", error);
      toast.error("Error al cargar plantillas de Twilio");
    } finally {
      setIsTwilioLoading(false);
    }
  }, [listTemplatesAction, isAdmin]);

  useEffect(() => {
    fetchTwilioTemplates();
    const intervalId = setInterval(fetchTwilioTemplates, 300000);
    return () => clearInterval(intervalId);
  }, [fetchTwilioTemplates]);

  const isLoading =
    !isUserLoaded ||
    isAdmin === undefined ||
    isTwilioLoading ||
    (!isAdmin && globalTemplatesRaw === undefined);

  let templates: Template[] = [];
  if (isAdmin === true) {
    templates = twilioTemplates;
  } else if (isAdmin === false && globalTemplatesRaw) {
    templates = globalTemplatesRaw.map((t: any) => {
      let buttons: string[] = [];
      if (t.types?.["twilio/quick-reply"]) {
        buttons = (t.types["twilio/quick-reply"].actions || []).map(
          (a: any) => a.title
        );
      }
      return {
        id: t.sid,
        friendlyName: t.name,
        templateName: t.name,
        variables: t.variables,
        types: t.types,
        category: t.category,
        language: t.language,
        body: t.body,
        buttons,
        status: (t.status === "approved" || t.status === "rejected") ? t.status : "pending",
        createdAt: t._creationTime
          ? new Date(t._creationTime).toISOString().split("T")[0]
          : new Date().toISOString().split("T")[0],
      };
    });
  }

  const activeTemplates =
    !isAdmin && activeUserTab === "mis-plantillas" ? twilioTemplates : templates;

  const stats = {
    approved: activeTemplates.filter((t) => t.status === "approved").length,
    pending: activeTemplates.filter((t) => t.status === "pending").length,
    total: activeTemplates.length,
  };

  const handleUseTemplate = async (template: Template) => {
    try {
      await createContentTemplate({
        friendly_name: template.friendlyName,
        language: template.language,
        category: template.category,
        variables: template.variables || {},
        types: template.types || {},
      });
      toast.success("Plantilla solicitada", {
        description: "Se ha solicitado la plantilla para tu subcuenta de Twilio.",
      });
      await fetchTwilioTemplates();
      setActiveUserTab("mis-plantillas");
    } catch (error: any) {
      toast.error("Error al usar plantilla", {
        description: error.message || "No se pudo solicitar la plantilla.",
      });
    }
  };

  return {
    isAdmin,
    isLoading,
    templates,
    activeTemplates,
    twilioTemplates,
    stats,
    activeTab,
    setActiveTab,
    activeUserTab,
    setActiveUserTab,
    isDialogOpen,
    setIsDialogOpen,
    handleUseTemplate,
    fetchTwilioTemplates,
  };
}
