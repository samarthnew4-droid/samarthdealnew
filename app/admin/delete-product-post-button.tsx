"use client";

import { useActionState } from "react";
import { useRouter } from "next/navigation";

import type { ProductPostActionState } from "./create-deal/product-post-actions";

type DeleteProductPostButtonProps = {
  deleteAction: (
    previousState: ProductPostActionState,
    formData: FormData,
  ) => Promise<ProductPostActionState>;
  postId: string;
  productName: string | null;
};

const initialState: ProductPostActionState = { errorMessage: null };

export default function DeleteProductPostButton({ deleteAction, postId, productName }: DeleteProductPostButtonProps) {
  const router = useRouter();
  const [state, formAction] = useActionState(async (previousState: ProductPostActionState, formData: FormData) => {
    const result = await deleteAction(previousState, formData);
    if (!result.errorMessage) router.refresh();
    return result;
  }, initialState);
  const label = productName ? `“${productName}”` : "this product post";

  return (
    <form
      action={formAction}
      onSubmit={(event) => {
        if (!window.confirm(`Are you sure you want to delete ${label}? This cannot be undone.`)) event.preventDefault();
      }}
    >
      <input name="postId" type="hidden" value={postId} />
      <button className="rounded-xl bg-rose-600 px-3 py-2 text-xs font-bold text-white hover:bg-rose-700" type="submit">Delete</button>
      {state.errorMessage && <p className="mt-2 max-w-40 text-xs font-medium text-rose-700">{state.errorMessage}</p>}
    </form>
  );
}
