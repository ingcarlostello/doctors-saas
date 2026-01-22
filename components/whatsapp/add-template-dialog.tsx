import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from "@/components/ui/dialog";
import { TemplateForm } from "@/components/whatsapp/TemplateForm";

interface AddTemplateDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export function AddTemplateDialog({ open, onOpenChange }: AddTemplateDialogProps) {
    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[80vw] lg:max-w-[50vw] max-w-7xl w-full max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Crear Template</DialogTitle>
                    <DialogDescription>
                        Crea una nueva plantilla de mensaje para WhatsApp Business
                    </DialogDescription>
                </DialogHeader>

                {/* Info Banner */}
                <div className="bg-primary/5 border border-primary/20 rounded-lg p-4 mb-2">
                    <h3 className="font-medium text-foreground mb-2">
                        ℹ️ Información importante
                    </h3>
                    <ul className="text-sm text-muted-foreground space-y-1">
                        <li>• Las plantillas deben ser aprobadas por Meta antes de poder usarse (24-48 hrs)</li>
                        <li>• Las variables usan formato posicional: {"{{1}}"}, {"{{2}}"}, etc.</li>
                        <li>• Máximo 3 botones de respuesta rápida por plantilla</li>
                        <li>• El texto de cada botón no puede superar 20 caracteres</li>
                    </ul>
                </div>

                <TemplateForm onSuccess={() => onOpenChange(false)} />
            </DialogContent>
        </Dialog>
    );
}
