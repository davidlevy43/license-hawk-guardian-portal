
import React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { User, UserRole } from "@/types";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

interface UserFormProps {
  user?: User;
  onSubmit: (data: FormValues) => void;
  onCancel: () => void;
}

// Create schema based on whether it's a new user or existing user
const createUserFormSchema = (isNewUser: boolean) => {
  const baseSchema = {
    username: z.string().min(3, "Username must be at least 3 characters"),
    email: z.string().email("Invalid email address"),
    role: z.nativeEnum(UserRole),
  };

  if (isNewUser) {
    return z.object({
      ...baseSchema,
      password: z.string().min(6, "Password must be at least 6 characters"),
      confirmPassword: z.string().min(6, "Please confirm your password"),
    }).refine((data) => data.password === data.confirmPassword, {
      message: "Passwords do not match",
      path: ["confirmPassword"],
    });
  } else {
    return z.object({
      ...baseSchema,
      password: z.string().min(6, "Password must be at least 6 characters").optional(),
      confirmPassword: z.string().optional(),
    }).refine((data) => {
      if (data.password || data.confirmPassword) {
        return data.password === data.confirmPassword;
      }
      return true;
    }, {
      message: "Passwords do not match",
      path: ["confirmPassword"],
    });
  }
};

type FormValues = {
  username: string;
  email: string;
  role: UserRole;
  password?: string;
  confirmPassword?: string;
};

const UserForm: React.FC<UserFormProps> = ({ user, onSubmit, onCancel }) => {
  const isNewUser = !user;
  const userFormSchema = createUserFormSchema(isNewUser);

  const form = useForm<FormValues>({
    resolver: zodResolver(userFormSchema),
    defaultValues: user
      ? {
          username: user.username,
          email: user.email,
          role: user.role,
        }
      : {
          username: "",
          email: "",
          role: UserRole.USER,
          password: "",
          confirmPassword: "",
        },
  });

  const handleSubmit = (data: FormValues) => {
    console.log('Form submitted with data:', data);
    // Remove confirmPassword from the data sent to the API
    const { confirmPassword, ...submitData } = data;
    onSubmit(submitData);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="username"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Username</FormLabel>
              <FormControl>
                <Input placeholder="johndoe" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email</FormLabel>
              <FormControl>
                <Input placeholder="john.doe@example.com" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="role"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Role</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a role" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value={UserRole.ADMIN}>Admin</SelectItem>
                  <SelectItem value={UserRole.USER}>User</SelectItem>
                </SelectContent>
              </Select>
              <FormDescription>
                Admins can manage users and system settings
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="password"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Password{isNewUser && " *"}</FormLabel>
              <FormControl>
                <Input type="password" placeholder="••••••••" {...field} />
              </FormControl>
              <FormDescription>
                {isNewUser ? "Required - At least 6 characters" : "Leave empty to keep current password"}
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="confirmPassword"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Confirm Password{isNewUser && " *"}</FormLabel>
              <FormControl>
                <Input type="password" placeholder="••••••••" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex justify-end space-x-4">
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button type="submit">
            {isNewUser ? "Create User" : "Update User"}
          </Button>
        </div>
      </form>
    </Form>
  );
};

export default UserForm;
