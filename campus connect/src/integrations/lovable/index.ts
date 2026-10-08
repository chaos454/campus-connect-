// Local-friendly stub. On Lovable Cloud this used @lovable.dev/cloud-auth-js.
// For local development we use Supabase OAuth directly.

import { supabase } from "../supabase/client";

type OAuthProvider = "google" | "github" | "apple" | string;

type SignInOptions = {
  redirect_uri?: string;
  extraParams?: Record<string, string>;
};

type SignInResult =
  | { redirected: true; error?: undefined; tokens?: undefined }
  | { redirected?: false; error: Error; tokens?: undefined }
  | {
      redirected?: false;
      error?: undefined;
      tokens: { access_token: string; refresh_token: string };
    };

export const lovable = {
  auth: {
    signInWithOAuth: async (
      provider: OAuthProvider,
      opts?: SignInOptions,
    ): Promise<SignInResult> => {
      try {
        const { data, error } = await supabase.auth.signInWithOAuth({
          provider: provider as "google",
          options: {
            redirectTo: opts?.redirect_uri ?? window.location.origin + "/auth",
            queryParams: opts?.extraParams,
          },
        });
        if (error) return { error };
        if (data?.url) {
          window.location.assign(data.url);
          return { redirected: true };
        }
        return {
          error: new Error(
            "OAuth redirect was not initiated. Configure the provider in Supabase Auth → Providers.",
          ),
        };
      } catch (e) {
        return { error: e instanceof Error ? e : new Error(String(e)) };
      }
    },
  },
};
