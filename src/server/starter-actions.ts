"use server";
import { revalidatePath } from "next/cache";
import { assertOrigin, requireUser } from "./auth";
import { authorize } from "../domain/permissions";
import { installStarterWebsite } from "./starter-website";
import type { FormState } from "../components/action-form";

export async function installStarterAction(): Promise<FormState> {
  const { principal } = await requireUser("website.edit");
  try {
    await assertOrigin();
    authorize(principal, principal.propertyId, "website.publish");
    const result = await installStarterWebsite(principal.propertyId, principal.userId);
    revalidatePath("/");
    revalidatePath("/admin/website");
    return { success: result.created ? "Starter homepage published. Open it below to customize every section." : "Your existing homepage has been preserved. Open it below to edit or publish." };
  } catch { return { error: "Unable to install the starter homepage. Check your publishing access and try again." }; }
}
