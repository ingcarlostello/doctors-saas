"use client";
import { useState, useEffect, useCallback } from "react";
import { useUser } from "@clerk/nextjs";
import { TemplateStatCards } from "./TemplateStatCards";
import { TemplateList } from "./TemplateList";
import { Button } from "@/components/ui/button";
import { MessageSquare, Plus, Clock, LayoutGrid, FileText, Languages } from "lucide-react";
import { useAction, useQuery } from "convex/react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { AddTemplateDialog } from "./add-template-dialog";
import { Template } from "./TemplateListItem";

const api = require("@/convex/_generated/api").api;

export function WhatsappTemplateContent() {
  const { user, isLoaded: isUserLoaded } = useUser();
  const email = user?.primaryEmailAddress?.emailAddress;
  const isAdmin = useQuery(api.admin.isAdmin, email ? { email } : "skip");

  // Admin tabs
  const [activeTab, setActiveTab] = useState("globales");
  // Normal user tabs
  const [activeUserTab, setActiveUserTab] = useState("catalogo");
  
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [twilioTemplates, setTwilioTemplates] = useState<Template[]>([]);
  const [isTwilioLoading, setIsTwilioLoading] = useState(true);

  // Global templates query for non-admins
  const globalTemplatesRaw = useQuery(api.templates.getGlobalTemplates, isAdmin === false ? {} : "skip");

  const listTemplatesAction = useAction(api.twilio.listWhatsAppTemplates);

  const fetchTwilioTemplates = useCallback(async () => {
    if (isAdmin !== true) {
      setIsTwilioLoading(false);
      return; 
    }
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
        createdAt: t.createdAt ? new Date(t.createdAt).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
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

    // Polling cada 5 minutos
    const intervalId = setInterval(fetchTwilioTemplates, 300000);
    return () => clearInterval(intervalId);
  }, [fetchTwilioTemplates]);

  const isLoading = !isUserLoaded || isAdmin === undefined || (isAdmin ? isTwilioLoading : globalTemplatesRaw === undefined);

  let templates: Template[] = [];
  if (isAdmin === true) {
    templates = twilioTemplates;
  } else if (isAdmin === false && globalTemplatesRaw) {
    templates = globalTemplatesRaw.map((t: any) => {
      let buttons: string[] = [];
      if (t.types?.["twilio/quick-reply"]) {
        buttons = (t.types["twilio/quick-reply"].actions || []).map((a: any) => a.title);
      }
      return {
        id: t.sid,
        friendlyName: t.name,
        templateName: t.name,
        variables: t.variables,
        category: t.category,
        language: t.language,
        body: t.body,
        buttons,
        status: (t.status === "approved" || t.status === "rejected") ? t.status : "pending",
        createdAt: t._creationTime ? new Date(t._creationTime).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
      };
    });
  }

  const stats = {
    approved: templates.filter((t) => t.status === "approved").length,
    pending: templates.filter((t) => t.status === "pending").length,
    total: templates.length,
  };

  if (isLoading) {
    return (
      <div className="max-w-6xl mx-auto flex items-center justify-center p-12 min-h-[400px]">
        <div className="flex flex-col items-center gap-4">
          <div className="w-8 h-8 rounded-full border-4 border-emerald-500 border-r-transparent animate-spin" />
          <p className="text-muted-foreground animate-pulse text-sm">Cargando templates...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto">
      {/* Dynamic Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-8 gap-4">
        <div className="flex items-center gap-4">
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">
            {!isAdmin 
              ? activeUserTab === "catalogo" ? "Catálogo de Plantillas" : "Mis Plantillas" 
              : activeTab === "globales" ? "Plantillas Globales" : "Aprobación de Plantillas"}
          </h1>
        </div>

        {isAdmin && activeTab === "globales" && (
          <Button onClick={() => setIsDialogOpen(true)} className="bg-[#0f172a] hover:bg-[#1e293b] text-white shadow-sm transition-all rounded-lg px-4 hidden sm:flex">
            <Plus className="w-4 h-4 mr-2" />
            Nueva Plantilla
          </Button>
        )}
        
        {isAdmin && activeTab === "globales" && (
          <Button onClick={() => setIsDialogOpen(true)} className="bg-[#0f172a] hover:bg-[#1e293b] text-white shadow-sm transition-all rounded-lg p-3 sm:hidden">
            <Plus className="w-5 h-5" />
          </Button>
        )}
      </div>
      
      <p className="text-slate-500 text-[15px] mt-1 mb-8 max-w-2xl">
        {!isAdmin 
          ? activeUserTab === "catalogo" 
            ? "Selecciona una plantilla, tradúcela a tu idioma y envíala a aprobación" 
            : "Gestiona tus plantillas traducidas y revisa su estado de aprobación"
          : activeTab === "globales" 
            ? "Crea y gestiona plantillas estándar que podrán usar todos los usuarios" 
            : "Revisa y aprueba las plantillas traducidas por los usuarios"}
      </p>

      {isAdmin && <TemplateStatCards stats={stats} />}

      <div className="mt-8">
        {!isAdmin ? (
          <Tabs value={activeUserTab} onValueChange={setActiveUserTab} className="w-full">
            <TabsList className="mb-8 w-auto border-b border-slate-200 rounded-none p-0 bg-transparent flex justify-start space-x-8">
              <TabsTrigger 
                value="catalogo" 
                className="rounded-none border-b-2 border-transparent data-[state=active]:border-emerald-500 data-[state=active]:text-emerald-600 font-medium data-[state=active]:bg-transparent data-[state=active]:shadow-none px-0 pb-3 text-slate-500 hover:text-slate-700 transition-colors"
              >
                <LayoutGrid className="w-4 h-4 mr-2.5" />
                Catálogo de Plantillas
              </TabsTrigger>
              <TabsTrigger 
                value="mis-plantillas"
                className="rounded-none border-b-2 border-transparent data-[state=active]:border-emerald-500 data-[state=active]:text-emerald-600 font-medium data-[state=active]:bg-transparent data-[state=active]:shadow-none px-0 pb-3 text-slate-500 hover:text-slate-700 transition-colors"
              >
                <FileText className="w-4 h-4 mr-2.5" />
                Mis Plantillas
              </TabsTrigger>
            </TabsList>

            <TabsContent value="catalogo" className="mt-0 animate-in fade-in duration-500">
              <div className="bg-white rounded-xl border border-slate-200 p-4 flex items-center gap-4 mb-6 shadow-sm">
                 <div className="text-slate-400">
                    <Languages className="w-6 h-6" /> 
                 </div>
                 <div>
                    <h3 className="text-sm font-semibold text-slate-900">{templates.length} plantillas disponibles</h3>
                    <p className="text-xs text-slate-500 mt-0.5">Idiomas disponibles: Español, English, Français, Português</p>
                 </div>
              </div>

              {templates.length > 0 ? (
                <TemplateList templates={templates} isCatalogView={true} isAdmin={false} />
              ) : (
                <div className="text-center p-12 border border-dashed border-slate-200 rounded-xl bg-slate-50">
                  <p className="text-slate-500">No hay templates en el catálogo.</p>
                </div>
              )}
            </TabsContent>

            <TabsContent value="mis-plantillas" className="mt-0 animate-in fade-in duration-500">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
                  <p className="text-sm font-medium text-slate-500 mb-1">Pendientes</p>
                  <p className="text-3xl font-semibold text-amber-500">0</p>
                </div>
                <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
                  <p className="text-sm font-medium text-slate-500 mb-1">Aprobadas</p>
                  <p className="text-3xl font-semibold text-emerald-500">0</p>
                </div>
                <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
                  <p className="text-sm font-medium text-slate-500 mb-1">Rechazadas</p>
                  <p className="text-3xl font-semibold text-red-500">0</p>
                </div>
              </div>

              <div className="p-16 flex flex-col items-center justify-center text-center bg-white rounded-xl border border-slate-200 shadow-sm max-w-full lg:max-w-4xl mx-auto">
                <div className="w-12 h-12 bg-slate-50 rounded-lg border border-slate-100 flex items-center justify-center mb-4">
                  <FileText className="w-6 h-6 text-slate-300" />
                </div>
                <h3 className="text-slate-900 font-medium mb-1">No tienes plantillas aún</h3>
                <p className="text-slate-500 text-sm">Ve al catálogo para seleccionar y traducir plantillas</p>
              </div>
            </TabsContent>
          </Tabs>
        ) : (
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="mb-8 w-auto border-b border-slate-200 rounded-none p-0 bg-transparent flex justify-start space-x-8">
              <TabsTrigger 
                value="globales" 
                className="rounded-none border-b-2 border-transparent data-[state=active]:border-emerald-500 data-[state=active]:text-emerald-600 font-medium data-[state=active]:bg-transparent data-[state=active]:shadow-none px-0 pb-3 text-slate-500 hover:text-slate-700 transition-colors"
              >
                <LayoutGrid className="w-4 h-4 mr-2.5" />
                Plantillas Globales
              </TabsTrigger>
              <TabsTrigger 
                value="aprobaciones"
                className="rounded-none border-b-2 border-transparent data-[state=active]:border-emerald-500 data-[state=active]:text-emerald-600 font-medium data-[state=active]:bg-transparent data-[state=active]:shadow-none px-0 pb-3 text-slate-500 hover:text-slate-700 transition-colors"
              >
                <FileText className="w-4 h-4 mr-2.5" />
                Aprobaciones
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="globales" className="mt-0 animate-in fade-in duration-500">
              <TemplateList templates={templates} isAdmin={isAdmin} />
            </TabsContent>
            
            <TabsContent value="aprobaciones" className="mt-0 animate-in fade-in duration-500">
              <div className="flex items-center gap-2.5 mb-6 text-amber-500 font-medium bg-amber-50/50 w-fit px-3 py-1.5 rounded-full border border-amber-100">
                <Clock className="w-4 h-4" />
                <span className="text-sm">Pendientes de aprobación ({stats.pending})</span>
              </div>
              
              {stats.pending > 0 ? (
                <TemplateList 
                  templates={templates.filter(t => t.status === "pending" || t.status === "rejected")} 
                  isAdmin={isAdmin}
                  isApprovalView={true} 
                />
              ) : (
                <div className="mt-4 p-12 flex flex-col items-center justify-center text-center bg-white rounded-xl border border-slate-200 shadow-sm max-w-full">
                   <p className="text-slate-500 font-medium">No hay plantillas pendientes de aprobación</p>
                </div>
              )}
            </TabsContent>
          </Tabs>
        )}
      </div>

      {isAdmin && (
        <AddTemplateDialog
          open={isDialogOpen}
          onOpenChange={setIsDialogOpen}
          onSuccess={() => {
            setIsDialogOpen(false);
            fetchTwilioTemplates(); 
          }}
        />
      )}
    </div>
  );
}
