/** Shared styling for the standalone auth-recovery pages (forgot / reset / verify). */
export const AUTH_RECOVERY_STYLES = `
  :host {
    --brand: #E04A2F;
    --brand-hover: #c93d25;
    --text-primary: #1a1a1a;
    --text-secondary: #545454;
    --border: #e0e0e0;
    font-family: 'Hanken Grotesk', system-ui, sans-serif;
  }

  .rec-wrap {
    min-height: 60vh;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 48px 16px;
  }

  .rec-card {
    width: 100%;
    max-width: 440px;
    background: #fff;
    border: 1px solid var(--border);
    border-radius: 18px;
    padding: 34px 32px 30px;
    box-shadow: 0 14px 44px rgba(0, 0, 0, 0.08);
    animation: recPop 220ms cubic-bezier(0.16, 1, 0.3, 1);
  }

  @keyframes recPop {
    from { opacity: 0; transform: scale(0.97) translateY(8px); }
    to   { opacity: 1; transform: scale(1) translateY(0); }
  }

  .rec-icon {
    width: 52px; height: 52px;
    border-radius: 50%;
    display: flex; align-items: center; justify-content: center;
    background: #fdeeea;
    color: var(--brand);
    margin-bottom: 16px;
  }
  .rec-icon .ms { font-size: 26px; }
  .rec-icon.ok { background: #e6f4ec; color: #1a7f43; }
  .rec-icon.err { background: #fdecea; color: #c0392b; }

  .rec-title {
    font-size: 1.45rem;
    font-weight: 800;
    letter-spacing: -0.02em;
    color: var(--text-primary);
    margin: 0 0 6px;
  }

  .rec-sub {
    font-size: 0.92rem;
    color: var(--text-secondary);
    line-height: 1.55;
    margin: 0 0 22px;
  }

  .rec-form { display: flex; flex-direction: column; gap: 14px; }

  .rec-field { display: flex; flex-direction: column; gap: 6px; }

  .rec-label {
    font-size: 0.78rem;
    font-weight: 600;
    color: var(--text-secondary);
    text-transform: uppercase;
    letter-spacing: 0.04em;
  }

  .rec-input {
    width: 100%;
    box-sizing: border-box;
    font-family: inherit;
    font-size: 0.95rem;
    color: var(--text-primary);
    background: #f7f7f7;
    border: 1.5px solid var(--border);
    border-radius: 10px;
    padding: 11px 13px;
    outline: none;
    transition: border-color 150ms ease, background 150ms ease;
  }
  .rec-input:focus { border-color: var(--brand); background: #fff; }

  .rec-error {
    display: flex;
    align-items: center;
    gap: 7px;
    font-size: 0.85rem;
    font-weight: 500;
    color: #c0392b;
    background: #fdecea;
    border: 1px solid #f5c6cb;
    border-radius: 10px;
    padding: 9px 12px;
  }
  .rec-error .ms { font-size: 16px; }

  .rec-submit {
    margin-top: 4px;
    height: 46px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-family: inherit;
    font-size: 0.95rem;
    font-weight: 700;
    color: #fff;
    background: var(--brand);
    border: none;
    border-radius: 10px;
    cursor: pointer;
    transition: background 150ms ease, transform 150ms ease, box-shadow 150ms ease;
  }
  .rec-submit:hover:not(:disabled) {
    background: var(--brand-hover);
    transform: translateY(-1px);
    box-shadow: 0 6px 18px rgba(224, 74, 47, 0.35);
  }
  .rec-submit:disabled { opacity: 0.7; cursor: default; }

  .rec-spinner {
    width: 18px; height: 18px;
    border: 2px solid rgba(255,255,255,0.4);
    border-top-color: #fff;
    border-radius: 50%;
    animation: recSpin 0.7s linear infinite;
  }
  .rec-spinner.dark { border-color: rgba(0,0,0,0.15); border-top-color: var(--brand); }
  @keyframes recSpin { to { transform: rotate(360deg); } }

  .rec-footer {
    text-align: center;
    font-size: 0.88rem;
    color: var(--text-secondary);
    margin: 20px 0 0;
  }

  .rec-link {
    background: none;
    border: none;
    color: var(--brand);
    font-family: inherit;
    font-size: 0.88rem;
    font-weight: 700;
    cursor: pointer;
    padding: 2px 4px;
    text-decoration: none;
  }
  .rec-link:hover { text-decoration: underline; }

  .rec-status { display: flex; flex-direction: column; align-items: flex-start; }
`;
