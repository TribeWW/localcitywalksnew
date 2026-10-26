import { PostHog } from "posthog-node";

let posthogClient: PostHog | null | undefined;

export function getPostHogClient(): PostHog | null {
  if (posthogClient !== undefined) {
    return posthogClient;
  }

  const projectToken = process.env.NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN;
  const host = process.env.NEXT_PUBLIC_POSTHOG_HOST;

  if (!projectToken || !host) {
    posthogClient = null;
    return posthogClient;
  }

  posthogClient = new PostHog(projectToken, {
    host,
    flushAt: 1,
    flushInterval: 0,
    enableExceptionAutocapture: true,
  });

  return posthogClient;
}
