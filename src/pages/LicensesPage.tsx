
import React, { useState } from "react";
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
import { Plus } from "lucide-react";
import LicenseTable from "@/components/licenses/LicenseTable";
import LicenseForm from "@/components/licenses/LicenseForm";
import { useAuth } from "@/context/AuthContext";

const LicensesPage: React.FC = () => {
  const { licenses, addLicense, updateLicense, deleteLicense, isLoading } = useLicenses();
  const { isAdmin } = useAuth();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedLicense, setSelectedLicense] = useState<License | null>(null);

  const handleOpenForm = (license?: License) => {
    setSelectedLicense(license || null);
    setIsFormOpen(true);
  };

  const handleCloseForm = () => {
    setSelectedLicense(null);
    setIsFormOpen(false);
  };

  const handleSubmit = (data: any) => {
    if (selectedLicense) {
      updateLicense(selectedLicense.id, data);
    } else {
      addLicense(data);
    }
    handleCloseForm();
  };

  const handleOpenDeleteDialog = (license: License) => {
    setSelectedLicense(license);
    setIsDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = () => {
    if (selectedLicense) {
      deleteLicense(selectedLicense.id);
    }
    setIsDeleteDialogOpen(false);
    setSelectedLicense(null);
  };

  const handleDeleteCancel = () => {
    setIsDeleteDialogOpen(false);
    setSelectedLicense(null);
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
        <Button onClick={() => handleOpenForm()}>
          <Plus className="mr-2 h-4 w-4" /> Add License
        </Button>
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
          <LicenseForm
            initialData={selectedLicense || undefined}
            onSubmit={handleSubmit}
            onCancel={handleCloseForm}
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
            <AlertDialogCancel onClick={handleDeleteCancel}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteConfirm} className="bg-destructive text-destructive-foreground">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default LicensesPage;
