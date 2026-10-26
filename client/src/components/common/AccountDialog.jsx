import { useState } from "react";
import { ArrowLeft, CloudSun, Eye, EyeOff, X } from "lucide-react";
import { usePreferences } from "../../context/PreferencesContext.jsx";

export default function AccountDialog({ onClose }) {
  const { signIn } = usePreferences();
  const [register, setRegister] = useState(false);
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const submit = async (event) => {
    event.preventDefault();
    setBusy(true);
    setError("");
    const form = new FormData(event.currentTarget);
    try {
      await signIn(form.get("email"), form.get("password"), register);
      onClose();
    } catch (reason) {
      setError(reason.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="modal-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}>
      <section className="account-modal" role="dialog" aria-modal="true" aria-labelledby="account-title">
        <button className="icon-button modal-close" onClick={onClose} aria-label="Close sign in"><X size={19} /></button>
        <div className="modal-brand"><span className="brand-mark"><CloudSun size={20} /></span><span>aetherly<span>.</span></span></div>
        <div className="modal-eyebrow">Your weather, in sync</div>
        <h2 id="account-title">{register ? "Create your account" : "Welcome back"}</h2>
        <p className="modal-description">Save favourite places and preferences across your devices.</p>
        <form className="account-form" onSubmit={submit}>
          <label>Email address<input name="email" type="email" placeholder="you@example.com" autoComplete="email" required maxLength={254} /></label>
          <label>Password<span className="password-field"><input name="password" type={passwordVisible ? "text" : "password"} placeholder={register ? "At least 10 characters" : "Your password"} autoComplete={register ? "new-password" : "current-password"} required minLength={register ? 10 : 1} maxLength={128} /><button type="button" aria-label={passwordVisible ? "Hide password" : "Show password"} onClick={() => setPasswordVisible((value) => !value)}>{passwordVisible ? <EyeOff size={16} /> : <Eye size={16} />}</button></span></label>
          {error && <p className="form-error" role="alert">{error}</p>}
          <button className="button button-primary form-submit" type="submit" disabled={busy}>{busy ? "Please wait…" : register ? "Create account" : "Sign in"}</button>
        </form>
        <button className="text-switch" onClick={() => { setRegister((value) => !value); setError(""); }}>{register ? <><ArrowLeft size={14} /> Back to sign in</> : "New to Aetherly? Create an account"}</button>
        <p className="privacy-note">Your account uses a secure, httpOnly session. Passwords are hashed before storage.</p>
      </section>
    </div>
  );
}
