"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import styles from "./Log.module.css";

type Locale = "dk" | "en" | "se" | "de";

function safeLocale(v: unknown): Locale {
  return v === "dk" || v === "en" || v === "se" || v === "de" ? v : "dk";
}

function fmtNow(locale: Locale) {
  const d = new Date();
  const hh = String(d.getHours()).padStart(2, "0");
  const mm = String(d.getMinutes()).padStart(2, "0");
  const dayLabel = locale === "dk" ? "I dag" : "Today";
  return `${dayLabel} · ${hh}:${mm}`;
}

export default function LogPage() {
  const router = useRouter();
  const params = useParams();
  const locale = useMemo(() => safeLocale(params?.locale), [params]);

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreviewUrl, setPhotoPreviewUrl] = useState<string | null>(null);

  const [query, setQuery] = useState("");
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    return () => {
      if (photoPreviewUrl?.startsWith("blob:")) URL.revokeObjectURL(photoPreviewUrl);
    };
  }, [photoPreviewUrl]);

  function openPicker() {
    fileInputRef.current?.click();
  }

  function onPickFile(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0] ?? null;
    if (!f) return;

    if (photoPreviewUrl?.startsWith("blob:")) URL.revokeObjectURL(photoPreviewUrl);

    setPhotoFile(f);
    setPhotoPreviewUrl(URL.createObjectURL(f));
  }

  function removePhoto() {
    if (photoPreviewUrl?.startsWith("blob:")) URL.revokeObjectURL(photoPreviewUrl);
    setPhotoFile(null);
    setPhotoPreviewUrl(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  async function saveLog() {
    if (saving) return;
    setErr(null);
    setSaving(true);

    try {
      const fd = new FormData();
      fd.set("locale", locale);
      if (query.trim()) fd.set