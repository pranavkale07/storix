import React from 'react';
import { Link } from 'react-router-dom';
import { Card, CardHeader, CardTitle, CardContent } from './ui/card';
import { Button } from './ui/button';

export default function AuthLanding() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold">Welcome to Storix</CardTitle>
          <p className="text-muted-foreground mt-2">
            Secure file storage and sharing platform
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button
            className="w-full"
            size="lg"
            asChild
          >
            <Link to="/login">Sign In</Link>
          </Button>
          <Button
            variant="outline"
            className="w-full"
            size="lg"
            asChild
          >
            <Link to="/signup">Create Account</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}