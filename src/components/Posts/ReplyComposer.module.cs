.form{
  margin-top: 14px;
  padding: 14px;
  border-radius: 18px;
  border: 1px solid var(--line);
  background: color-mix(in srgb, var(--panel) 75%, transparent);
}

.head{
  display:flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 10px;
}

.title{
  font-weight: 900;
}

.hint{
  font-size: 12px;
  color: var(--muted);
}

.textarea{
  width: 100%;
  border-radius: var(--radius);
  border: 1px solid var(--line);
  background: rgba(255,255,255,.04);
  padding: 12px 12px;
  color: var(--ink);
  outline: none;
  resize: vertical;
}

.actions{
  margin-top: 10px;
  display:flex;
  align-items:center;
  gap: 10px;
}

.btn{
  border-radius: var(--radius);
  border: 1px solid rgba(255,153,102,.35);
  background: linear-gradient(90deg, rgba(255,153,102,.18), rgba(255,94,98,.14));
  padding: 10px 12px;
  font-weight: 900;
  color: var(--ink);
}

.err{
  font-size: 12px;
  color: #ffb4b4;
}
