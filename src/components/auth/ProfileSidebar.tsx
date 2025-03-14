
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

type ProfileSidebarProps = {
  displayName: string;
  avatarUrl: string;
  email?: string;
};

const ProfileSidebar = ({ displayName, avatarUrl, email }: ProfileSidebarProps) => {
  const { signOut } = useAuth();
  
  const getInitials = () => {
    if (displayName) {
      return displayName
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase();
    }
    return email?.charAt(0).toUpperCase() || "U";
  };

  const handleSignOut = async () => {
    await signOut();
  };

  return (
    <Card>
      <CardHeader className="flex flex-col items-center">
        <Avatar className="h-24 w-24 mb-4">
          <AvatarImage src={avatarUrl} alt={displayName || email} />
          <AvatarFallback className="text-xl">{getInitials()}</AvatarFallback>
        </Avatar>
        <CardTitle>{displayName || "Set your name"}</CardTitle>
        <CardDescription>{email}</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col items-center">
        <Button
          variant="outline"
          className="w-full mb-2"
          onClick={handleSignOut}
        >
          Sign Out
        </Button>
      </CardContent>
    </Card>
  );
};

export default ProfileSidebar;
