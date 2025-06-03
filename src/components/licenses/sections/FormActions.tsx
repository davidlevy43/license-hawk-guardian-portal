
import React from "react";
import { License } from "@/types";
import { Button } from "@/components/ui/button";

interface FormActionsProps {
  onCancel: () => void;
  isSubmitting: boolean;
  initialData?: License;
}

const FormActions: React.FC<FormActionsProps> = ({ onCancel, isSubmitting, initialData }) => {
  return (
    <div className="flex justify-end space-x-4">
      <Button type="button" variant="outline" onClick={onCancel} disabled={isSubmitting}>
        Cancel
      </Button>
      <Button type="submit" disabled={isSubmitting}>
        {isSubmitting 
          ? (initialData ? "Updating..." : "Adding...")
          : (initialData ? "Update License" : "Add License")
        }
      </Button>
    </div>
  );
};

export default FormActions;
