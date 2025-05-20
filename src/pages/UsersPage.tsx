
import React, { useState } from "react";
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

// Mock users for demo
const MOCK_USERS: User[] = [
  {
    id: "1",
    username: "admin",
    email: "admin@example.com",
    role: UserRole.ADMIN,
    createdAt: new Date(2023, 0, 15)
  },
  {
    id: "2",
    username: "user",
    email: "user@example.com",
    role: UserRole.USER,
    createdAt: new Date(2023, 1, 10)
  },
  {
    id: "3",
    username: "johndoe",
    email: "john.doe@example.com",
    role: UserRole.USER,
    createdAt: new Date(2023, 2, 5)
  },
  {
    id: "4",
    username: "janedoe",
    email: "jane.doe@example.com",
    role: UserRole.USER,
    createdAt: new Date(2023, 3, 20)
  },
];

const UsersPage: React.FC = () => {
  const { isAdmin, currentUser } = useAuth();
  const [users, setUsers] = useState<User[]>(MOCK_USERS);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isResetPasswordDialogOpen, setIsResetPasswordDialogOpen] = useState(false);

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

  const handleSubmit = (formData: any) => {
    if (selectedUser) {
      // Update existing user
      setUsers(users.map(user => 
        user.id === selectedUser.id 
          ? { ...user, ...formData } 
          : user
      ));
      toast.success(`User ${formData.username} updated successfully`);
    } else {
      // Add new user
      const newUser: User = {
        id: (users.length + 1).toString(),
        username: formData.username,
        email: formData.email,
        role: formData.role,
        createdAt: new Date()
      };
      setUsers([...users, newUser]);
      toast.success(`User ${formData.username} created successfully`);
    }
    
    handleCloseForm();
  };

  const handleDeleteConfirm = () => {
    if (selectedUser) {
      // Prevent deleting self
      if (selectedUser.id === currentUser?.id) {
        toast.error("You cannot delete your own account");
        setIsDeleteDialogOpen(false);
        setSelectedUser(null);
        return;
      }
      
      setUsers(users.filter(user => user.id !== selectedUser.id));
      toast.success(`User ${selectedUser.username} deleted successfully`);
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
        <Button onClick={() => handleOpenForm()}>
          <Plus className="mr-2 h-4 w-4" /> Add User
        </Button>
      </div>

      <UserTable 
        users={users}
        onEdit={handleOpenForm}
        onDelete={handleOpenDeleteDialog}
        onResetPassword={handleOpenResetPasswordDialog}
      />

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
