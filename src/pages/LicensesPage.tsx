
import React, { useState, useEffect } from "react";
import { useLicenses } from "@/context/LicenseContext";
import { License } from "@/types";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Plus, RefreshCw } from "lucide-react";
import LicenseTable from "@/components/licenses/LicenseTable";
import LicenseForm from "@/components/licenses/LicenseForm";
import { useAuth } from "@/context/AuthContext";
import { toast } from "sonner";

const LicensesPage: React.FC = () => {
  const { licenses, addLicense, updateLicense, deleteLicense, isLoading, refreshLicenses } = useLicenses();
  const { isAdmin } = useAuth();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedLicense, setSelectedLicense] = useState<License | null>(null);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [refreshLoading, setRefreshLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleOpenForm = (license?: License) => {
    setSelectedLicense(license || null);
    setIsFormOpen(true);
  };

  const handleCloseForm = () => {
    setSelectedLicense(null);
    setIsFormOpen(false);
    setError(null);
  };

  const handleSubmit = async (data: any) => {
    setSubmitLoading(true);
    setError(null);
    
    try {
      console.log("Submitting license data:", data);
      
      if (selectedLicense) {
        await updateLicense(selectedLicense.id, data);
      } else {
        await addLicense(data);
      }
      
      handleCloseForm();
    } catch (error: any) {
      console.error("Error submitting license:", error);
      setError(error.message || "Failed to save license");
    } finally {
      setSubmitLoading(false);
    }
  };

  const handleOpenDeleteDialog = (license: License) => {
    setSelectedLicense(license);
    setIsDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!selectedLicense) return;
    
    setDeleteLoading(true);
    try {
      await deleteLicense(selectedLicense.id);
      setIsDeleteDialogOpen(false);
      setSelectedLicense(null);
    } catch (error) {
      console.error("Error deleting license:", error);
      // Error is already shown via toast from the context
    } finally {
      setDeleteLoading(false);
    }
  };

  const handleDeleteCancel = () => {
    setIsDeleteDialogOpen(false);
    setSelectedLicense(null);
  };

  const handleRefresh = async () => {
    setRefreshLoading(true);
    try {
      await refreshLicenses();
      toast.success("Licenses refreshed successfully");
    } catch (error) {
      console.error("Error refreshing licenses:", error);
      // Error is already shown via toast from the context
    } finally {
      setRefreshLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Licenses</h1>
          <p className="text-muted-foreground">
            Manage your software and service licenses
          </p>
        </div>
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            onClick={handleRefresh} 
            disabled={refreshLoading || isLoading}
          >
            <RefreshCw className={`mr-2 h-4 w-4 ${refreshLoading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
          <Button 
            onClick={() => handleOpenForm()}
            disabled={isLoading}
          >
            <Plus className="mr-2 h-4 w-4" /> Add License
          </Button>
        </div>
      </div>

      <LicenseTable
        onEdit={handleOpenForm}
        onDelete={handleOpenDeleteDialog}
      />

      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>
              {selectedLicense ? "Edit License" : "Add New License"}
            </DialogTitle>
            <DialogDescription>
              {selectedLicense
                ? "Update the details of the existing license."
                : "Enter the details for the new license."}
            </DialogDescription>
          </DialogHeader>
          {error && (
            <div className="bg-destructive/15 text-destructive p-3 rounded-md mb-4">
              {error}
            </div>
          )}
          <LicenseForm
            initialData={selectedLicense || undefined}
            onSubmit={handleSubmit}
            onCancel={handleCloseForm}
            isSubmitting={submitLoading}
          />
        </DialogContent>
      </Dialog>

      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm Deletion</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete {selectedLicense?.name}? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={handleDeleteCancel} disabled={deleteLoading}>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDeleteConfirm} 
              className="bg-destructive text-destructive-foreground"
              disabled={deleteLoading}
            >
              {deleteLoading ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default LicensesPage;
