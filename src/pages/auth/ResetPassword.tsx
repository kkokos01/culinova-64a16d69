
import { useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { ChefHat, ArrowLeft } from "lucide-react";

const ResetPassword = () => {
  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const { resetPassword } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrorMessage("");

    const { error } = await resetPassword(email);
    
    if (error) {
      setErrorMessage(error.message);
    } else {
      setIsSuccess(true);
    }
    
    setIsSubmitting(false);
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gray-50 p-4">
      <div className="flex items-center mb-6">
        <ChefHat className="h-8 w-8 text-sage-500 mr-2" />
        <h1 className="text-2xl font-display font-semibold text-sage-600">Culinova</h1>
      </div>

      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-xl">Reset your password</CardTitle>
          <CardDescription>
            Enter your email and we'll send you a link to reset your password
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isSuccess ? (
            <div className="p-4 bg-green-50 rounded-md text-green-800">
              <p>Check your email for a link to reset your password.</p>
              <p className="mt-2">If it doesn't appear within a few minutes, check your spam folder.</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="email@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              
              {errorMessage && (
                <div className="p-3 text-sm text-red-500 bg-red-50 rounded-md">
                  {errorMessage}
                </div>
              )}
              
              <Button
                type="submit"
                className="w-full bg-sage-500 hover:bg-sage-600"
                disabled={isSubmitting}
              >
                {isSubmitting ? "Sending..." : "Send Reset Link"}
              </Button>
            </form>
          )}
        </CardContent>
        <CardFooter className="flex justify-center">
          <Link to="/sign-in" className="text-sm text-sage-600 hover:underline flex items-center">
            <ArrowLeft className="h-4 w-4 mr-1" />
            Back to sign in
          </Link>
        </CardFooter>
      </Card>
    </div>
  );
};

export default ResetPassword;
