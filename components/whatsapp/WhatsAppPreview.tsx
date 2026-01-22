import { Smartphone } from "lucide-react";

interface QuickReplyButton {
  id: string;
  text: string;
}

interface WhatsAppPreviewProps {
  body: string;
  buttons: QuickReplyButton[];
}

export function WhatsAppPreview({ body, buttons }: WhatsAppPreviewProps) {
  const hasContent = body.trim().length > 0;

  return (
    <div className="space-y-3">
      <div className="border border-border rounded-xl overflow-hidden shadow-sm">
        {/* WhatsApp Header */}
        <div className="bg-[#25D366] px-4 py-3 flex items-center gap-3">
          <Smartphone className="w-5 h-5 text-white" />
          <span className="text-white font-medium">WhatsApp</span>
        </div>

        {/* Chat Area */}
        <div className="bg-[#ECE5DD] min-h-[350px] flex items-center justify-center p-4">
          {!hasContent ? (
            <p className="text-muted-foreground/70 text-center">
              Escribe un mensaje para ver la vista previa
            </p>
          ) : (
            <div className="w-full flex justify-end">
              <div className="bg-[#DCF8C6] rounded-lg p-3 shadow-sm max-w-[85%]">
                <p className="text-sm text-foreground whitespace-pre-wrap">
                  {body}
                </p>
                {buttons.length > 0 && (
                  <div className="mt-3 space-y-2">
                    {buttons.map((btn) => (
                      <button
                        key={btn.id}
                        className="w-full py-2 text-sm text-[#00a884] bg-white border border-[#00a884]/20 rounded-md hover:bg-[#00a884]/5 transition-colors"
                      >
                        {btn.text || "Botón"}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Disclaimer */}
      <p className="text-xs text-muted-foreground text-center">
        Esta es una vista previa aproximada. El aspecto final puede variar según el dispositivo.
      </p>
    </div>
  );
}
