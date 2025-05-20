import React, { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { Navigate } from "react-router-dom";
import { User, UserRole } from "@/types";
import UserTable from "@/components/users/UserTable";
import UserForm from "@/components/users/UserForm";
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
import { toast } from "sonner";
import { UserAPI } from "@/services/api";

const UsersPage: React.FC = () => {
  const { isAdmin, currentUser } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isResetPasswordDialogOpen, setIsResetPasswordDialogOpen] = useState(false);

  // Load users from API
  useEffect(() => {
    const loadUsers = async () => {
      try {
        setIsLoading(true);
        const apiUsers = await UserAPI.getAll();
        
        // Convert date strings to Date objects if needed
        const processedUsers = apiUsers.map(user => ({
          ...user,
          createdAt: user.createdAt instanceof Date ? user.createdAt : new Date(user.createdAt)
        }));
        
        setUsers(processedUsers);
      } catch (error) {
        console.error("Error loading users:", error);
        toast.error("Failed to load users");
      } finally {
        setIsLoading(false);
      }
    };
    
    loadUsers();
  }, []);

  // Redirect non-admin users
  if (!isAdmin) {
    return <Navigate to="/dashboard" />;
  }

  const handleOpenForm = (user?: User) => {
    setSelectedUser(user || null);
    setIsFormOpen(true);
  };

  const handleCloseForm = () => {
    setSelectedUser(null);
    setIsFormOpen(false);
  };

  const handleOpenDeleteDialog = (user: User) => {
    setSelectedUser(user);
    setIsDeleteDialogOpen(true);
  };

  const handleOpenResetPasswordDialog = (user: User) => {
    setSelectedUser(user);
    setIsResetPasswordDialogOpen(true);
  };

  const handleSubmit = async (formData: any) => {
    try {
      setIsLoading(true);
      
      if (selectedUser) {
        // Update existing user
        const updatedUser = await UserAPI.update(selectedUser.id, formData);
        
        setUsers(users.map(user => 
          user.id === selectedUser.id 
            ? updatedUser
            : user
        ));
        toast.success(`User ${formData.username} updated successfully`);
      } else {
        // Add new user - remove createdAt as API will handle it
        const newUser = await UserAPI.create({
          username: formData.username,
          email: formData.email,
          role: formData.role
        });
        
        setUsers([...users, newUser]);
        toast.success(`User ${formData.username} created successfully`);
      }
      
      handleCloseForm();
    } catch (error) {
      console.error("Error saving user:", error);
      toast.error("Failed to save user");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (selectedUser) {
      try {
        setIsLoading(true);
        
        // Prevent deleting self
        if (selectedUser.id === currentUser?.id) {
          toast.error("You cannot delete your own account");
          setIsDeleteDialogOpen(false);
          setSelectedUser(null);
          return;
        }
        
        // Delete from API
        await UserAPI.delete(selectedUser.id);
        
        // Update state
        setUsers(users.filter(user => user.id !== selectedUser.id));
        toast.success(`User ${selectedUser.username} deleted successfully`);
      } catch (error) {
        console.error("Error deleting user:", error);
        toast.error("Failed to delete user");
      } finally {
        setIsLoading(false);
      }
    }
    
    setIsDeleteDialogOpen(false);
    setSelectedUser(null);
  };

  const handleDeleteCancel = () => {
    setIsDeleteDialogOpen(false);
    setSelectedUser(null);
  };

  const handleResetPasswordConfirm = () => {
    if (selectedUser) {
      toast.success(`Password reset link sent to ${selectedUser.email}`);
    }
    
    setIsResetPasswordDialogOpen(false);
    setSelectedUser(null);
  };

  const handleResetPasswordCancel = () => {
    setIsResetPasswordDialogOpen(false);
    setSelectedUser(null);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Users</h1>
          <p className="text-muted-foreground">
            Manage user accounts and permissions
          </p>
        </div>
        <Button onClick={() => handleOpenForm()} disabled={isLoading}>
          <Plus className="mr-2 h-4 w-4" /> Add User
        </Button>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-8">
          <p>Loading users...</p>
        </div>
      ) : (
        <UserTable 
          users={users}
          onEdit={handleOpenForm}
          onDelete={handleOpenDeleteDialog}
          onResetPassword={handleOpenResetPasswordDialog}
        />
      )}

      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {selectedUser ? "Edit User" : "Add New User"}
            </DialogTitle>
            <DialogDescription>
              {selectedUser
                ? "Update the details of the existing user."
                : "Enter the details for the new user."}
            </DialogDescription>
          </DialogHeader>
          <UserForm
            user={selectedUser || undefined}
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
              Are you sure you want to delete user {selectedUser?.username}? This action cannot be undone.
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

      <AlertDialog open={isResetPasswordDialogOpen} onOpenChange={setIsResetPasswordDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Reset Password</AlertDialogTitle>
            <AlertDialogDescription>
              This will send a password reset link to {selectedUser?.email}.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={handleResetPasswordCancel}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleResetPasswordConfirm}>
              Send Reset Link
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default UsersPage;
