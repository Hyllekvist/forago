"use client";

import { useMemo, useState } from "react";
import styles from "./FindComposer.module.css";
import { cellIdFromLatLng } from "@/lib/geo/cell";

export function FindComposer() {
  const [species, setSpecies] = useState("ramsons");
  const [quality, setQuality] = useState(3);
  const [notes, setNotes] = useState("");
  const [cell, setCell] = useState<string>("—");
  const [ok, setOk] = useState(false);

  async function getGeo() {
    setOk(false);
    if (!navigator.geolocation) return;

    navigator.geolocation.getCurrentPosition((pos) => {
      const { latitude, longitude } = pos.coords;
      // Default: 5km-ish grid (privacy-first)
      const cid = cellIdFromLatLng(latitude, longitude, 2);
      setCell(cid);
    });
  }

  function submit(e: React.FormEvent) {
    e.preventDefault();
    // TODO: insert into Supabase `finds` with cell id only
    setOk(true);
  }

  return (
    <form className={styles.form} onSubmit={submit}>
      <div className={styles.row}>
        <label className={styles.label}>
          Species
          <select className={styles.input} value={species} onChange={(e) => setSpecies(e.target.value)}>
            <option value="ramsons">Ramsløg</option>
            <option value="chanterelle">Kantarel</option>
            <option value="elderflower">Hyldeblomst</option>
          </select>
        </label>

        <label className={styles.label}>
          Quality
          <input
            className={styles.input}
            type="number"
            min={1}
            max={5}
            value={quality}
            onChange={(e) => setQuality(Number(e.target.value))}
          />
        </label>
      </div>

      <label className={styles.label}>
        Notes
        <textarea className={styles.textarea} rows={4} value={notes} onChange={(e) => setNotes(e.target.value)} />
      </label>

      <div className={styles.geoRow}>
        <button className={styles.geoBtn} type="button" onClick={getGeo}>
          Get coarse location
        </button>
        <div className={styles.geoCell}>
          <span>Cell:</span> <code>{cell}</code>
        </div>
      </div>

      <button className={styles.btn} type="submit">Save find</button>
      {ok && <div className={styles.ok}>Saved (demo). Wire Supabase next.</div>}
    </form>
  );
}
