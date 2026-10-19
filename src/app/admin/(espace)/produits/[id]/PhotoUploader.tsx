"use client";

// Envoi de photos depuis le téléphone. Les photos d'appareil font plusieurs Mo : on les
// réduit ici (1 600 px, JPEG) avant l'envoi. C'est aussi ce qui garde le site rapide en 4G.

import { useRef, useState, useTransition } from "react";
import { MAX_IMAGES } from "@/domain/products";
import { uploadImage } from "../actions";

const MAX_SIDE = 1600;

async function shrink(file: File): Promise<Blob> {
  const bitmap = await createImageBitmap(file, { imageOrientation: "from-image" });
  const scale = Math.min(1, MAX_SIDE / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);
  const context = canvas.getContext("2d");
  if (!context) throw new Error("canvas");
  context.fillStyle = "#fff"; // les PNG transparents deviennent des JPEG sur fond blanc
  context.fillRect(0, 0, canvas.width, canvas.height);
  context.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  bitmap.close();
  const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/jpeg", 0.82));
  if (!blob) throw new Error("canvas");
  return blob;
}

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
          body.set("photo", new File([await shrink(file)], "photo.jpg", { type: "image/jpeg" }));
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
