"use client";

// Envoi de photos depuis le téléphone (réduites avant l'envoi : voir shrinkImage).

import { useRef, useState, useTransition } from "react";
import { MAX_IMAGES } from "@/domain/products";
import { shrinkImage } from "@/components/admin/shrinkImage";
import { uploadImage } from "../actions";

export function PhotoUploader({ productId, remaining }: { productId: string; remaining: number }) {
  const input = useRef<HTMLInputElement>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [progress, setProgress] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function onChange(event: React.ChangeEvent<HTMLInputElement>) {
    const files = [...(event.target.files ?? [])].slice(0, remaining);
    event.target.value = "";
    if (files.length === 0) return;
    setMessage(null);

    startTransition(async () => {
      let failures = 0;
      for (const [index, file] of files.entries()) {
        setProgress(`Envoi de la photo ${index + 1} sur ${files.length}…`);
        try {
          const body = new FormData();
          body.set("productId", productId);
          body.set("photo", new File([await shrinkImage(file)], "photo.jpg", { type: "image/jpeg" }));
          const result = await uploadImage(body);
          if (result.error) {
            failures++;
            setMessage(result.error);
          }
        } catch {
          failures++;
          setMessage("Cette photo n'a pas pu être lue. Essayez-en une autre.");
        }
      }
      setProgress(null);
      if (failures === 0) setMessage(null);
    });
  }

  if (remaining <= 0) {
    return <p className="text-sm text-muted">{MAX_IMAGES} photos au maximum : retirez-en une pour en ajouter.</p>;
  }

  return (
    <div className="flex flex-col gap-2">
      <input ref={input} type="file" accept="image/*" multiple onChange={onChange} className="sr-only" id="photos" disabled={pending} />
      <label
        htmlFor="photos"
        className={`flex h-13 cursor-pointer items-center justify-center rounded-lg border-[1.5px] border-dashed border-ink font-semibold has-[:focus-visible]:outline-2 ${pending ? "opacity-60" : ""}`}
      >
        {progress ?? "Ajouter des photos"}
      </label>
      {message && (
        <p role="alert" className="text-sm font-semibold text-red-700">
          {message}
        </p>
      )}
    </div>
  );
}
