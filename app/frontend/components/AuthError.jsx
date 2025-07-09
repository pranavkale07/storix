import React from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { Button } from './ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from './ui/card';
import { Alert, AlertDescription } from './ui/alert';

export function AuthError() {
  const [searchParams] = useSearchParams();
  const error = searchParams.get('message');

  const getErrorMessage = (errorCode) => {
    switch (errorCode) {
    case 'oauth_failed':
      return 'OAuth authentication failed. Please try again.';
    case 'user_creation_failed':
      return 'Failed to create user account. Please try again.';
    case 'server_error':
      return 'Server error occurred. Please try again later.';
    default:
      return 'An error occurred during authentication. Please try again.';
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-2xl">Authentication Error</CardTitle>
          <CardDescription>
            Something went wrong during the login process
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert variant="destructive">
            <AlertDescription>
              {getErrorMessage(error)}
            </AlertDescription>
          </Alert>

          <div className="space-y-2">
            <Button asChild className="w-full">
              <Link to="/">Try Again</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}