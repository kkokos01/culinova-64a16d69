import React, { useState } from "react";
import { useSpace } from "@/context/SpaceContext";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { PlusCircle, Users, X, Mail } from "lucide-react";

interface PublicSpaceCreatorProps {
  children: React.ReactNode;
  refreshSpaces?: () => Promise<void>;
}

export function PublicSpaceCreator({ children, refreshSpaces }: PublicSpaceCreatorProps) {
  const { createSpace } = useSpace();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [spaceName, setSpaceName] = useState("");
  const [spaceDescription, setSpaceDescription] = useState("");
  const [inviteEmails, setInviteEmails] = useState<string[]>([""]);
  const [userConsent, setUserConsent] = useState<{ [key: string]: boolean }>({});

  const handleCreatePublicSpace = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!spaceName.trim()) {
      toast({
        title: "Name required",
        description: "Please enter a name for your collection.",
        variant: "destructive"
      });
      return;
    }

    if (!spaceDescription.trim()) {
      toast({
        title: "Description required", 
        description: "Please enter a description for your collection.",
        variant: "destructive"
      });
      return;
    }
    
    setIsLoading(true);
    try {
      // Create public space with description and public flag
      const result = await createSpace(spaceName, { 
        description: spaceDescription, 
        isPublic: true 
      });
      if (result) {
        setIsOpen(false);
        setSpaceName("");
        setSpaceDescription("");
        setInviteEmails([""]);
        setUserConsent({});
        
        toast({
          title: "Public collection created",
          description: `"${spaceName}" has been created successfully!`,
        });
        
        // Call the parent refreshSpaces callback if provided
        if (refreshSpaces) {
          await refreshSpaces();
        }
      }
    } catch (error) {
      toast({
        title: "Error creating collection",
        description: "Failed to create public collection. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const addEmailField = () => {
    setInviteEmails([...inviteEmails, ""]);
  };

  const removeEmailField = (index: number) => {
    const newEmails = inviteEmails.filter((_, i) => i !== index);
    const newConsent = { ...userConsent };
    delete newConsent[index];
    setInviteEmails(newEmails.length > 0 ? newEmails : [""]);
    setUserConsent(newConsent);
  };

  const updateEmail = (index: number, value: string) => {
    const newEmails = [...inviteEmails];
    newEmails[index] = value;
    setInviteEmails(newEmails);
  };

  const updateConsent = (index: number, consent: boolean) => {
    setUserConsent({
      ...userConsent,
      [index]: consent
    });
  };

  const getValidInvites = () => {
    return inviteEmails
      .map((email, index) => ({
        email: email.trim(),
        consent: userConsent[index] || false
      }))
      .filter(invite => invite.email && invite.consent);
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px] max-h-[80vh] overflow-y-auto">
        <form onSubmit={handleCreatePublicSpace}>
          <DialogHeader>
            <DialogTitle>Create Public Collection</DialogTitle>
            <DialogDescription>
              Create a public collection to share recipes with the community and invite collaborators.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-6 py-4">
            {/* Collection Name */}
            <div className="space-y-2">
              <Label htmlFor="space-name">Collection Name *</Label>
              <Input
                id="space-name"
                placeholder="Enter collection name"
                value={spaceName}
                onChange={(e) => setSpaceName(e.target.value)}
                disabled={isLoading}
                required
              />
            </div>

            {/* Collection Description */}
            <div className="space-y-2">
              <Label htmlFor="space-description">Description *</Label>
              <Textarea
                id="space-description"
                placeholder="Describe your collection - what recipes will people find here?"
                value={spaceDescription}
                onChange={(e) => setSpaceDescription(e.target.value)}
                disabled={isLoading}
                rows={3}
                required
              />
            </div>

            {/* Invite Users Section */}
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-sage-600" />
                <Label className="text-base font-medium">Invite Collaborators (Optional)</Label>
              </div>
              
              <div className="space-y-3">
                {inviteEmails.map((email, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <div className="flex-1 relative">
                      <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <Input
                        placeholder="Enter email address"
                        value={email}
                        onChange={(e) => updateEmail(index, e.target.value)}
                        disabled={isLoading}
                        className="pl-10"
                        type="email"
                      />
                    </div>
                    
                    {email.trim() && (
                      <div className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          id={`consent-${index}`}
                          checked={userConsent[index] || false}
                          onChange={(e) => updateConsent(index, e.target.checked)}
                          className="h-4 w-4 text-sage-600 rounded border-gray-300 focus:ring-sage-500"
                        />
                        <Label htmlFor={`consent-${index}`} className="text-sm text-gray-600">
                          Consent to invite
                        </Label>
                      </div>
                    )}
                    
                    {inviteEmails.length > 1 && (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => removeEmailField(index)}
                        disabled={isLoading}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                ))}
              </div>

              <Button
                type="button"
                variant="outline"
                onClick={addEmailField}
                disabled={isLoading}
                className="w-full"
              >
                <PlusCircle className="h-4 w-4 mr-2" />
                Add Another Email
              </Button>

              {getValidInvites().length > 0 && (
                <div className="text-sm text-gray-600 bg-gray-50 p-3 rounded">
                  <strong>Ready to invite:</strong> {getValidInvites().length} user(s)
                </div>
              )}
            </div>
          </div>

          <DialogFooter className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsOpen(false)}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isLoading}
              className="bg-sage-400 hover:bg-sage-500 text-white"
            >
              {isLoading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Creating...
                </>
              ) : (
                <>
                  <PlusCircle className="h-4 w-4 mr-2" />
                  Create & Invite
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
