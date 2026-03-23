import React from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "../ui/alert-dialog";
import { AlertCircle, Trash2 } from "lucide-react";

export default function ConfirmDialog({
  isOpen,
  title,
  description,
  onConfirm,
  onCancel,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  variant = "default", // 'default' or 'destructive'
}) {
  const isDestructive = variant === "destructive";

  return (
    <AlertDialog open={isOpen} onOpenChange={(open) => {
      if (!open) onCancel();
    }}>
      <AlertDialogContent className="sm:max-w-md animate-in fade-in zoom-in-95 duration-200">
        <AlertDialogHeader>
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-full flex shrink-0 ${isDestructive ? 'bg-red-100 text-red-600' : 'bg-blue-100 text-blue-600'}`}>
              {isDestructive ? <Trash2 className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
            </div>
            <AlertDialogTitle className="text-xl font-bold">{title}</AlertDialogTitle>
          </div>
          <AlertDialogDescription className="text-base mt-3 text-gray-500 text-left pt-2">
            {description}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="mt-6 flex gap-3 sm:space-x-0">
          <AlertDialogCancel 
            onClick={onCancel}
            className="w-full sm:w-auto mt-0 border-gray-200 font-semibold"
          >
            {cancelLabel}
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={(e) => {
              e.preventDefault();
              onConfirm();
            }}
            className={`w-full sm:w-auto font-semibold ${
              isDestructive 
                ? "bg-red-600 hover:bg-red-700 text-white shadow-sm"
                : "bg-blue-600 hover:bg-blue-700 text-white shadow-sm"
            }`}
          >
            {confirmLabel}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
