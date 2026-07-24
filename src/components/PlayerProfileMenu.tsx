import { useEffect, useRef, useState, type ChangeEvent } from 'react';
import { Camera, ClipboardCheck, LogOut, ShieldCheck } from 'lucide-react';
import { NavLink } from 'react-router-dom';
import { getProfilePhotoUrl, uploadProfilePhoto } from '../api/profilePhoto';
import type { Profile } from '../types/database.types';

type Props = {
  profile: Profile;
  onProfileChanged: () => Promise<void>;
  onSignOut: () => Promise<void>;
};

export default function PlayerProfileMenu({ profile, onProfileChanged, onSignOut }: Props) {
  const [open, setOpen] = useState(false);
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState('');
  const rootRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const name = profile.name || 'Player';
  const initials = name.slice(0, 2).toUpperCase();

  useEffect(() => {
    if (!profile.avatar_path) {
      setPhotoUrl(null);
      return;
    }
    let active = true;
    let refreshTimer: number | undefined;
    const refresh = async () => {
      try {
        const url = await getProfilePhotoUrl(profile.avatar_path!);
        if (active) setPhotoUrl(url);
      } catch {
        if (active) setPhotoUrl(null);
      }
    };
    void refresh();
    refreshTimer = window.setInterval(refresh, 50 * 60 * 1000);
    return () => {
      active = false;
      if (refreshTimer) window.clearInterval(refreshTimer);
    };
  }, [profile.avatar_path]);

  useEffect(() => {
    if (!open) return;
    const closeOutside = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    };
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false);
    };
    document.addEventListener('pointerdown', closeOutside);
    document.addEventListener('keydown', closeOnEscape);
    return () => {
      document.removeEventListener('pointerdown', closeOutside);
      document.removeEventListener('keydown', closeOnEscape);
    };
  }, [open]);

  async function handlePhoto(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    setUploading(true);
    setMessage('');
    try {
      const uploaded = await uploadProfilePhoto(profile.id, file, profile.avatar_path);
      setPhotoUrl(uploaded.signedUrl);
      await onProfileChanged();
      setMessage('Profile photo updated.');
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Could not update the profile photo.');
    } finally {
      setUploading(false);
    }
  }

  const avatar = photoUrl
    ? <img src={photoUrl} alt="" onError={() => setPhotoUrl(null)} />
    : <span aria-hidden="true">{initials}</span>;

  return <div className="player-profile-menu" ref={rootRef}>
    <button
      type="button"
      className="player-profile-trigger"
      aria-label="Open player account menu"
      aria-haspopup="true"
      aria-expanded={open}
      aria-controls="player-profile-popover"
      onClick={() => setOpen((value) => !value)}
    >{avatar}</button>
    {open && <div id="player-profile-popover" className="player-profile-popover">
      <header>
        <span className="player-profile-avatar large">{avatar}</span>
        <span><strong>{name}</strong><small>{profile.email}</small></span>
      </header>
      <button type="button" className="player-profile-photo-action" disabled={uploading} onClick={() => inputRef.current?.click()}>
        <span className="player-profile-action-icon"><Camera size={17} /></span>
        <span>{uploading ? 'Uploading photo…' : photoUrl ? 'Change profile photo' : 'Upload profile photo'}</span>
      </button>
      <input ref={inputRef} className="sr-only" type="file" accept="image/jpeg,image/png,image/webp" onChange={handlePhoto} />
      {message && <p className="player-profile-message" role="status">{message}</p>}
      <nav aria-label="Player account">
        <NavLink to="/player/assignments" onClick={() => setOpen(false)}><span className="player-profile-action-icon"><ClipboardCheck size={17} /></span><span>Assignments</span></NavLink>
        <NavLink to="/player/account" onClick={() => setOpen(false)}><span className="player-profile-action-icon"><ShieldCheck size={17} /></span><span>Account &amp; Privacy</span></NavLink>
      </nav>
      <button type="button" className="player-profile-signout" onClick={onSignOut}><LogOut size={17} /><span>Sign out</span></button>
    </div>}
  </div>;
}
