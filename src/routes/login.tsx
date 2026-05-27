import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/login")({
  beforeLoad: ({ search }) => {
    throw redirect({
      to: "/sign-in/applicant",
      search: search as { redirect?: string },
    });
  },
});
