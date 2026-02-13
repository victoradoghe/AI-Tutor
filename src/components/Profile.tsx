import React, { useRef, useState } from 'react';
import type { UserProfile } from '../types';
import { Camera, Mail, Lock, Moon, Sun, Save, LogOut, Edit2, Eye, EyeOff, Upload, X, Zap } from 'lucide-react';

interface ProfileProps {
  user: UserProfile;
  onUpdateUser: (u: UserProfile) => void;
  onLogout: () => void;
}

const PRESET_AVATARS = [
  'https://api.dicebear.com/7.x/avataaars/svg?seed=Felix',
  'https://api.dicebear.com/7.x/avataaars/svg?seed=Aneka',
  'https://api.dicebear.com/7.x/avataaars/svg?seed=Zoe',
  'https://api.dicebear.com/7.x/avataaars/svg?seed=Jack',
  'https://api.dicebear.com/7.x/bottts/svg?seed=Robot1',
  'https://api.dicebear.com/7.x/bottts/svg?seed=Robot2',
  'https://api.dicebear.com/7.x/notionists/svg?seed=Mia',
  'https://api.dicebear.com/7.x/notionists/svg?seed=Max',
];

const Profile: React.FC<ProfileProps> = ({ user, onUpdateUser, onLogout }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [isAvatarModalOpen, setIsAvatarModalOpen] = useState(false);
  const [formData, setFormData] = useState<UserProfile>({ ...user });
  const [showPassword, setShowPassword] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  function handleChange<K extends keyof UserProfile>(field: K, value: UserProfile[K]) {
    const updated = { ...formData, [field]: value } as UserProfile;

    // Auto-update full name if first or last name changes
    if (field === 'firstName' || field === 'lastName') {
      updated.name = `${String(updated.firstName)} ${String(updated.lastName)}`;
    }

    setFormData(updated);

    // If theme is changed, apply immediately to preview
    if (field === 'theme') {
      onUpdateUser({ ...user, theme: value as UserProfile['theme'] });
    }
  }

  const handleSave = () => {
    onUpdateUser(formData);
    setIsEditing(false);
  };

  const handleAvatarClick = () => {
    if (!isEditing) return;
    setIsAvatarModalOpen(true);
  };

  const handlePresetSelect = (url: string) => {
    setFormData(prev => ({ ...prev, avatar: url }));
    // Update user state immediately for avatar so it reflects in sidebar/topbar
    onUpdateUser({ ...user, avatar: url });
    setIsAvatarModalOpen(false);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const result = reader.result as string;
        setFormData(prev => ({ ...prev, avatar: result }));
        // Update user state immediately for avatar so it reflects in sidebar/topbar
        onUpdateUser({ ...user, avatar: result });
        setIsAvatarModalOpen(false);
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="p-4 md:p-6 max-w-2xl mx-auto space-y-6 md:space-y-8 pb-32 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="profile-div flex items-center justify-between">
        <h2 className="text-2xl md:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">Profile Settings</h2>
        <button
          onClick={onLogout}
          className="bg-white/80 dark:bg-slate-800/80 text-red-500 dark:text-red-400 hover:text-red-600 dark:hover:text-red-300 hover:bg-red-50 dark:hover:bg-red-500/10 flex items-center gap-2 font-bold px-4 py-2 md:px-5 md:py-2.5 rounded-xl transition-all border border-slate-200 dark:border-white/5 shadow-sm active:scale-95"
        >
          <LogOut size={20} /> <span className="hidden sm:inline">Sign Out</span>
        </button>
      </div>

      <div className="bg-white/60 dark:bg-slate-800/50 backdrop-blur-xl rounded-[2rem] shadow-xl border border-slate-200 dark:border-white/5 p-6 md:p-10 transition-colors relative overflow-hidden">

        {/* Decorative background element */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/5 dark:bg-indigo-500/5 rounded-full blur-3xl pointer-events-none -mr-16 -mt-16"></div>

        {/* Avatar Section */}
        <div className="flex flex-col items-center mb-8 md:mb-10 relative z-10">
          <div className={`relative group ${isEditing ? 'cursor-pointer' : ''}`} onClick={handleAvatarClick}>
            <div className={`w-28 h-28 md:w-32 md:h-32 rounded-full overflow-hidden border-4 shadow-2xl bg-white dark:bg-slate-800 relative z-10 transition-all ${isEditing ? 'border-indigo-500/50 group-hover:border-indigo-500' : 'border-slate-100 dark:border-slate-700'}`}>
              <img src={formData.avatar || 'https://picsum.photos/200'} alt="Profile" className="w-full h-full object-cover" />
            </div>
            {isEditing && (
              <div className="absolute inset-0 bg-black/60 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all z-20 backdrop-blur-sm">
                <Camera className="text-white drop-shadow-lg" size={32} />
              </div>
            )}
            {isEditing && <div className="absolute bottom-0 right-0 bg-indigo-600 text-white p-2 rounded-full z-30 shadow-lg border border-white dark:border-slate-900 group-hover:scale-110 transition-transform"><Edit2 size={14} /></div>}
          </div>
          <input
            type="file"
            ref={fileInputRef}
            className="hidden"
            accept="image/*"
            onChange={handleFileChange}
          />
          <h3 className="text-2xl font-bold mt-6 text-slate-900 dark:text-white">{user.name}</h3>
          <div className="flex items-center gap-2 mt-2">
            <span className="bg-indigo-500/10 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-300 px-3 py-1 rounded-full text-xs font-bold border border-indigo-500/20">Level {user.level} Scholar</span>
          </div>
          {isEditing && <p className="text-xs text-indigo-500 dark:text-indigo-400 font-medium mt-3 animate-pulse">Tap photo to change</p>}
        </div>

        {/* Form Section */}
        <div className="space-y-6 md:space-y-8 relative z-10">

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2 ml-1">First Name</label>
              <input
                type="text"
                value={formData.firstName}
                onChange={(e) => handleChange('firstName', e.target.value)}
                disabled={!isEditing}
                className="w-full px-5 py-3 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-slate-900/50 text-slate-900 dark:text-white outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/50 disabled:opacity-50 disabled:bg-slate-100 dark:disabled:bg-slate-900/30 transition-all font-medium placeholder:text-slate-400 dark:placeholder:text-slate-600"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2 ml-1">Last Name</label>
              <input
                type="text"
                value={formData.lastName}
                onChange={(e) => handleChange('lastName', e.target.value)}
                disabled={!isEditing}
                className="w-full px-5 py-3 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-slate-900/50 text-slate-900 dark:text-white outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/50 disabled:opacity-50 disabled:bg-slate-100 dark:disabled:bg-slate-900/30 transition-all font-medium placeholder:text-slate-400 dark:placeholder:text-slate-600"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2 ml-1">Email Address</label>
            <div className="flex items-center justify-between p-4 rounded-xl bg-slate-50/50 dark:bg-slate-900/30 border border-slate-200 dark:border-white/5">
              <div className="flex items-center gap-3 overflow-hidden">
                <div className="p-2 bg-slate-100 dark:bg-slate-800 rounded-lg text-slate-400 shrink-0">
                  <Mail size={18} />
                </div>
                <span className="text-slate-600 dark:text-slate-300 font-medium truncate">{user.email}</span>
              </div>
              <div className="flex items-center gap-2 shrink-0 ml-2">
                <span className={`px-2.5 py-1 rounded-lg text-xs font-bold uppercase tracking-wide border ${user.subscription_tier === 'pro'
                  ? 'bg-gradient-to-r from-amber-500/20 to-orange-500/20 text-amber-600 dark:text-amber-300 border-amber-500/30'
                  : 'bg-slate-200 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border-slate-300 dark:border-white/5'
                  }`}>
                  {user.subscription_tier}
                </span>
              </div>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2 ml-1">Password</label>
            <div className="relative group">
              <Lock className="absolute left-4 mt-[1px] top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500 group-focus-within:text-indigo-500 dark:group-focus-within:text-indigo-400 transition-colors" size={18} />
              <input
                type={showPassword ? "text" : "password"}
                placeholder={isEditing ? "Enter new password" : "••••••••"}
                value={isEditing ? formData.password : '********'}
                onChange={(e) => handleChange('password', e.target.value)}
                disabled={!isEditing}
                className="w-full pl-12 pr-12 py-3 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-slate-900/50 text-slate-900 dark:text-white outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/50 disabled:opacity-50 disabled:bg-slate-100 dark:disabled:bg-slate-900/30 transition-all font-medium placeholder:text-slate-400 dark:placeholder:text-slate-600 tracking-wider"
              />
              <button
                type="button"
                disabled={!isEditing}
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 mt-[1px] top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 dark:text-slate-500 dark:hover:text-white transition-colors disabled:opacity-0 p-1"
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <div className="pt-6 border-t border-slate-200 dark:border-white/5">
            <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-4 ml-1">App Theme</label>
            <div className="flex bg-slate-100 dark:bg-black/40 p-1.5 rounded-2xl w-full sm:w-fit border border-slate-200 dark:border-white/5">
              <button
                onClick={() => handleChange('theme', 'light')}
                className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold transition-all ${formData.theme === 'light'
                  ? 'bg-white text-slate-900 shadow-md ring-1 ring-black/5'
                  : 'text-slate-400 hover:text-slate-600 dark:hover:text-white dark:hover:bg-white/5'
                  }`}
              >
                <Sun size={18} /> Light
              </button>
              <button
                onClick={() => handleChange('theme', 'dark')}
                className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold transition-all ${formData.theme === 'dark'
                  ? 'bg-slate-700 text-white shadow-lg ring-1 ring-white/10'
                  : 'text-slate-400 hover:text-slate-600 dark:hover:text-white dark:hover:bg-white/5'
                  }`}
              >
                <Moon size={18} /> Dark
              </button>
            </div>
          </div>

          <div className="pt-4">
            {isEditing ? (
              <div className="flex gap-3">
                <button
                  onClick={() => setIsEditing(false)}
                  className="flex-1 py-4 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-xl font-bold hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors border border-transparent dark:border-white/5"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  className="flex-1 py-4 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-500 transition-all flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/20 active:scale-95"
                >
                  <Save size={20} /> Save Changes
                </button>
              </div>
            ) : (
              <button
                onClick={() => setIsEditing(true)}
                className="w-full py-4 bg-white dark:bg-white text-slate-900 rounded-xl font-bold hover:bg-indigo-50 transition-all flex items-center justify-center gap-2 shadow-lg hover:shadow-xl hover:scale-[1.01] active:scale-95 group border border-slate-100 dark:border-transparent"
              >
                <Edit2 size={20} className="group-hover:rotate-12 transition-transform" /> Edit Profile
              </button>
            )}
          </div>

        </div>
      </div>

      {/* Avatar Selection Modal */}
      {isAvatarModalOpen && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-md animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 w-full max-w-lg rounded-3xl p-8 shadow-2xl border border-slate-200 dark:border-white/10">
            <div className="flex justify-between items-center mb-8">
              <h3 className="text-2xl font-bold text-slate-900 dark:text-white">Choose Avatar</h3>
              <button onClick={() => setIsAvatarModalOpen(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-white transition-colors bg-slate-100 dark:bg-white/5 p-2 rounded-full hover:bg-slate-200 dark:hover:bg-white/10"><X size={20} /></button>
            </div>

            <div className="grid grid-cols-4 gap-4 mb-8">
              {PRESET_AVATARS.map((url, idx) => (
                <button
                  key={idx}
                  onClick={() => handlePresetSelect(url)}
                  className={`aspect-square rounded-2xl overflow-hidden border-2 transition-all bg-slate-50 dark:bg-slate-800 relative group ${formData.avatar === url
                    ? 'border-indigo-600 dark:border-indigo-500 ring-2 ring-indigo-600/30 dark:ring-indigo-500/30 scale-105'
                    : 'border-slate-200 dark:border-white/5 hover:border-indigo-400 hover:scale-105'
                    }`}
                >
                  <img src={url} alt={`Avatar ${idx}`} className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-indigo-500/10 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                </button>
              ))}
            </div>

            <div className="border-t border-slate-200 dark:border-white/10 pt-6">
              <button
                onClick={() => fileInputRef.current?.click()}
                className="w-full py-4 border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-xl text-slate-500 dark:text-slate-400 font-bold hover:border-indigo-500 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-indigo-500/5 transition-all flex items-center justify-center gap-2 group"
              >
                <Upload size={20} className="group-hover:-translate-y-1 transition-transform" /> Upload Custom Image
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Profile;
