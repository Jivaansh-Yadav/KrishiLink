import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import type { User } from '@supabase/supabase-js';
import { CheckCircle, XCircle, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';


const getMetadataString = (value: unknown, fallback = '') =>
  typeof value === 'string' ? value : fallback;

const getMetadataNullableString = (value: unknown) =>
  typeof value === 'string' && value ? value : null;

const getMetadataRole = (value: unknown): 'farmer' | 'buyer' =>
  value === 'buyer' ? 'buyer' : 'farmer';

const ensureProfileFromMetadata = async (user: User) => {
  const { data: existingProfile, error: profileLookupError } = await supabase
    .from('users')
    .select('id')
    .eq('id', user.id)
    .maybeSingle();

  if (profileLookupError) {
    console.error('Profile lookup error on auth callback:', profileLookupError);
    return;
  }

  if (existingProfile) return;

  const meta = user.user_metadata;
  const { error: profileError } = await supabase.from('users').insert({
    id: user.id,
    first_name: getMetadataString(meta.first_name),
    last_name: getMetadataNullableString(meta.last_name),
    mobile_number: getMetadataNullableString(meta.mobile_number),
    whatsapp_number: getMetadataNullableString(meta.whatsapp_number),
    email: user.email || getMetadataString(meta.email),
    state: getMetadataNullableString(meta.state),
    district: getMetadataNullableString(meta.district),
    village: getMetadataNullableString(meta.village),
    postal_code: getMetadataNullableString(meta.postal_code),
    role: getMetadataRole(meta.role),
    username: getMetadataString(meta.username, `user${Math.floor(1000 + Math.random() * 9000)}`),
  });

  if (profileError) {
    console.error('Profile creation error on auth callback:', profileError);
  }
};

const AuthCallback: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    const handleAuth = async () => {
      try {
        // Check for error in URL params
        const error = searchParams.get('error');
        const errorDescription = searchParams.get('error_description');
        
        if (error) {
          setStatus('error');
          setErrorMessage(errorDescription || error || 'Authentication failed');
          return;
        }

        const code = searchParams.get('code');
        if (code) {
          const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);

          if (exchangeError) {
            console.error('Code exchange error:', exchangeError);
            setStatus('error');
            setErrorMessage(exchangeError.message);
            return;
          }
        }

        // Try to get session after Supabase has exchanged any confirmation code.
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError) {
          console.error('Session error:', sessionError);
          setStatus('error');
          setErrorMessage(sessionError.message);
          return;
        }

        if (session) {
          await ensureProfileFromMetadata(session.user);
          setStatus('success');
        } else {
          // No session yet, might be processing
          // Wait a moment and check again
          await new Promise(resolve => setTimeout(resolve, 1000));
          const { data: { session: retrySession } } = await supabase.auth.getSession();
          
          if (retrySession) {
            await ensureProfileFromMetadata(retrySession.user);
            setStatus('success');
          } else {
            setStatus('error');
            setErrorMessage('Could not verify authentication. Please try again.');
          }
        }
      } catch (err) {
        console.error('Auth callback error:', err);
        setStatus('error');
        setErrorMessage(err instanceof Error ? err.message : 'An unexpected error occurred');
      }
    };

    handleAuth();
  }, [searchParams]);

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-card rounded-2xl shadow-card p-8 text-center">
        {status === 'loading' && (
          <>
            <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-primary/10 flex items-center justify-center">
              <Loader2 className="w-8 h-8 text-primary animate-spin" />
            </div>
            <h1 className="font-heading text-2xl font-bold mb-2">Verifying...</h1>
            <p className="text-muted-foreground">
              Please wait while we verify your authentication.
            </p>
          </>
        )}

        {status === 'success' && (
          <>
            <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-green-100 flex items-center justify-center">
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
            <h1 className="font-heading text-2xl font-bold text-green-700 mb-2">
              Authentication Successful!
            </h1>
            <p className="text-muted-foreground mb-6">
              Your email has been verified successfully. You can now access your KrishiLink account and start using all features.
            </p>
            <div className="space-y-3">
              <Button onClick={() => navigate('/dashboard')} className="w-full">
                Go to Dashboard
              </Button>
              <Button variant="outline" onClick={() => navigate('/')} className="w-full">
                Back to Home
              </Button>
            </div>
          </>
        )}

        {status === 'error' && (
          <>
            <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-red-100 flex items-center justify-center">
              <XCircle className="w-8 h-8 text-red-600" />
            </div>
            <h1 className="font-heading text-2xl font-bold text-red-700 mb-2">
              Authentication Failed
            </h1>
            <p className="text-muted-foreground mb-2">
              We couldn't verify your authentication.
            </p>
            {errorMessage && (
              <p className="text-sm text-red-600 bg-red-50 p-3 rounded-lg mb-6">
                {errorMessage}
              </p>
            )}
            <div className="space-y-3">
              <Button onClick={() => navigate('/')} className="w-full">
                Back to Home
              </Button>
              <p className="text-sm text-muted-foreground">
                If you continue to experience issues, please contact our support team.
              </p>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default AuthCallback;
