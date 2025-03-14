
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/lib/supabase";
import { useSpace } from "@/context/SpaceContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Mail, Plus, Settings, Trash, User } from "lucide-react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";

// Define schema for inviting users
const inviteSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  role: z.enum(["admin", "editor", "viewer"], {
    required_error: "Please select a role",
  }),
});

type InviteFormValues = z.infer<typeof inviteSchema>;

const SpaceManagement = () => {
  const { toast } = useToast();
  const { currentSpace, refreshSpaces, memberships } = useSpace();
  const [isLoading, setIsLoading] = useState(false);
  const [showInviteDialog, setShowInviteDialog] = useState(false);
  
  // Initialize react-hook-form with zod validation
  const form = useForm<InviteFormValues>({
    resolver: zodResolver(inviteSchema),
    defaultValues: {
      email: "",
      role: "viewer",
    },
  });

  if (!currentSpace) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-10">
          <p className="text-slate-500">Select a space to manage members</p>
        </CardContent>
      </Card>
    );
  }

  const spaceMembers = memberships
    .filter(membership => membership.space_id === currentSpace.id)
    .map(membership => ({
      id: membership.id,
      userId: membership.user_id,
      role: membership.role,
      // Note: In a real app, you'd fetch the user details from a profile table
    }));

  const inviteUser = async (values: InviteFormValues) => {
    if (!currentSpace) return;
    
    try {
      setIsLoading(true);
      
      // In a real application, you would:
      // 1. Check if the user exists in your auth system
      // 2. Create an invitation record
      // 3. Send an email to the user
      
      // For now, we'll just show a success message
      toast({
        title: "Invitation sent",
        description: `An invitation has been sent to ${values.email} to join the space as a ${values.role}.`,
      });
      
      setShowInviteDialog(false);
      form.reset();
    } catch (error: any) {
      console.error("Error inviting user:", error);
      toast({
        title: "Error inviting user",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Space Management</CardTitle>
            <CardDescription>
              Manage members and settings for {currentSpace.name}
            </CardDescription>
          </div>
          <Dialog open={showInviteDialog} onOpenChange={setShowInviteDialog}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Invite Member
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>Invite a new member</DialogTitle>
                <DialogDescription>
                  Send an invitation to join your space. They'll receive an email with instructions.
                </DialogDescription>
              </DialogHeader>
              
              <Form {...form}>
                <form onSubmit={form.handleSubmit(inviteUser)} className="space-y-4 py-4">
                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email</FormLabel>
                        <FormControl>
                          <Input placeholder="colleague@example.com" {...field} />
                        </FormControl>
                        <FormDescription>
                          Enter the email address of the person you want to invite
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="role"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Member Role</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select a role" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="admin">Admin (Full access)</SelectItem>
                            <SelectItem value="editor">Editor (Can edit recipes)</SelectItem>
                            <SelectItem value="viewer">Viewer (Read only)</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormDescription>
                          This determines what the member can do in your space
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <DialogFooter>
                    <Button 
                      type="submit" 
                      disabled={isLoading}
                      className="w-full"
                    >
                      {isLoading ? "Sending..." : "Send Invitation"}
                    </Button>
                  </DialogFooter>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Member</TableHead>
                <TableHead>Role</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {spaceMembers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={3} className="text-center py-6 text-slate-500">
                    No members found. Invite someone to get started!
                  </TableCell>
                </TableRow>
              ) : (
                spaceMembers.map((member) => (
                  <TableRow key={member.id}>
                    <TableCell className="font-medium">
                      <div className="flex items-center">
                        <User className="mr-2 h-4 w-4 text-slate-400" />
                        <span>{member.userId}</span>
                      </div>
                    </TableCell>
                    <TableCell className="capitalize">{member.role}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end space-x-2">
                        <Button size="sm" variant="outline">
                          <Settings className="h-4 w-4" />
                        </Button>
                        <Button size="sm" variant="outline" className="text-destructive">
                          <Trash className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
      <CardFooter className="flex justify-between">
        <Button variant="outline" className="w-full">
          <Mail className="mr-2 h-4 w-4" />
          Manage Invitations
        </Button>
      </CardFooter>
    </Card>
  );
};

export default SpaceManagement;
