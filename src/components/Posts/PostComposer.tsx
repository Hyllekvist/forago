"use client";

import { useState } from "react";
import styles from "./PostComposer.module.css";

export function PostComposer() {
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [type, setType] = useState("Identification");
  const [ok, setOk] = useState(false);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    // TODO: insert into Supabase
    setOk(true);
  }

  return (
    <form className={styles.form} onSubmit={submit}>
      <label className={styles.label}>
        Type
        <select className={styles.input} value={type} onChange={(e) => setType(e.target.value)}>
          <option>Identification</option>
          <option>How-to</option>
          <option>Recipe</option>
          <option>Guide</option>
        </select>
      </label>

      <label className={styles.label}>
        Title
        <input className={styles.input} value={title} onChange={(e) => setTitle(e.target.value)} required />
      </label>

      <label className={styles.label}>
        Details
        <textarea className={styles.textarea} value={body} onChange={(e) => setBody(e.target.value)} rows={6} />
      </label>

      <button className={styles.btn} type="submit">Post</button>
      {ok && <div className={styles.ok}>Saved (demo). Wire Supabase next.</div>}
    </form>
  );
}
