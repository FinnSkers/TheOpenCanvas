import React, { useState } from 'react';
import {
  Volume2,
  VolumeX,
  Share2,
  Download,
  Trash2,
  Users,
  Bot,
  Sparkles,
  Wifi,
  WifiOff,
  Maximize2,
  Smartphone,
  MoreVertical,
  User,
  X
} from 'lucide-react';
import { soundEngine } from '../../utils/soundEngine';

interface NavbarProps {
  userCount: number;
  roomId: string;
  isWsConnected: boolean;
  enableBots: boolean;
  onToggleBots: () => void;
  onClearCanvas: () => void;
  onExportImage: () => void;
  currentUser: { name: string; avatar: string; color: string };
  onUpdateUser: (name: string, avatar: string) => void;
  onTriggerChaos: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  userCount,
  roomId,
  isWsConnected,
  enableBots,
  onToggleBots,
  onClearCanvas,
  onExportImage,
  currentUser,
  onUpdateUser,
  onTriggerChaos
}) => {
  const [isMuted, setIsMuted] = useState(soundEngine.getIsMuted());
  const [isCopied, setIsCopied] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [showQrModal, setShowQrModal] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [tempName, setTempName] = useState(currentUser.name);
  const [tempAvatar, setTempAvatar] = useState(currentUser.avatar);

  const triggerHaptic = () => {
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      navigator.vibrate(10);
    }
  };

  const handleToggleMute = () => {
    triggerHaptic();
    const muted = soundEngine.toggleMute();
    setIsMuted(muted);
    if (!muted) {
      soundEngine.play('pop');
    }
  };

  const handleShare = async () => {
    triggerHaptic();
    if (typeof navigator !== 'undefined' && navigator.share) {
      try {
        await navigator.share({
          title: 'The Open Canvas',
          text: 'Come draw with me live with memes, stickers, and chats on The Open Canvas!',
          url: window.location.href
        });
        return;
      } catch {
        // user cancelled or share failed, fallback to clipboard
      }
    }
    navigator.clipboard.writeText(window.location.href);
    setIsCopied(true);
    soundEngine.play('pop');
    setTimeout(() => setIsCopied(false), 2000);
  };

  const handleToggleFullscreen = () => {
    triggerHaptic();
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
    } else {
      document.exitFullscreen().catch(() => {});
    }
  };

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    triggerHaptic();
    if (tempName.trim()) {
      onUpdateUser(tempName.trim(), tempAvatar);
      setShowProfileModal(false);
      soundEngine.play('high-five');
    }
  };

  const currentUrl = window.location.href;
  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(currentUrl)}&bgcolor=111827&color=f43f5e`;

  return (
    <>
      <header className="fixed top-2 sm:top-4 left-2 sm:left-4 right-2 sm:right-4 h-12 sm:h-14 bg-gray-900/90 backdrop-blur-md border border-white/10 rounded-2xl px-2.5 sm:px-4 flex items-center justify-between z-30 shadow-2xl select-none">
        {/* Left: Brand & Room Tag */}
        <div className="flex items-center gap-2 sm:gap-3">
          <div className="w-7 h-7 sm:w-9 sm:h-9 rounded-xl bg-gradient-to-tr from-purple-600 via-pink-500 to-amber-400 flex items-center justify-center shadow-lg shadow-pink-500/20 text-sm sm:text-lg">
            🎨
          </div>
          <div>
            <div className="flex items-center gap-1.5 sm:gap-2">
              <h1 className="text-xs sm:text-sm font-bold tracking-tight bg-gradient-to-r from-white via-gray-200 to-gray-400 bg-clip-text text-transparent">
                The Open Canvas
              </h1>
              <span className="text-[9px] sm:text-[10px] font-mono px-1.5 py-0.5 rounded-full bg-pink-500/20 text-pink-300 border border-pink-500/30 hidden xs:inline-block">
                #{roomId}
              </span>
            </div>
          </div>
        </div>

        {/* Center: Server Status, Active Count & Chaos */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          {/* Server Connection Badge (Desktop) */}
          <div
            className={`hidden md:flex items-center gap-1 px-2.5 py-1 rounded-xl border text-[11px] font-medium ${
              isWsConnected
                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                : 'bg-amber-500/10 border-amber-500/30 text-amber-300'
            }`}
          >
            {isWsConnected ? <Wifi className="w-3.5 h-3.5" /> : <WifiOff className="w-3.5 h-3.5" />}
            <span>{isWsConnected ? 'Live Multi-Device' : 'Local Sync'}</span>
          </div>

          {/* Active players pill */}
          <div className="flex items-center gap-1.5 px-2 sm:px-3 py-1 rounded-xl bg-white/5 border border-white/10 text-[11px] sm:text-xs">
            <span className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-emerald-400 animate-pulse" />
            <Users className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-gray-400" />
            <span className="font-semibold text-gray-200">{userCount}</span>
            <button
              onClick={() => {
                triggerHaptic();
                onToggleBots();
              }}
              title={enableBots ? 'Disable bot roomies' : 'Enable bot roomies'}
              className={`ml-0.5 px-1.5 py-0.5 rounded text-[10px] sm:text-[11px] font-medium hidden sm:flex items-center gap-1 transition-all cursor-pointer ${
                enableBots
                  ? 'bg-purple-500/30 text-purple-300 border border-purple-500/40'
                  : 'bg-white/5 text-gray-500 hover:text-gray-300'
              }`}
            >
              <Bot className="w-3 h-3" />
              <span>{enableBots ? 'Bots ON' : 'Bots OFF'}</span>
            </button>
          </div>

          {/* Quick Chaos Button */}
          <button
            onClick={() => {
              triggerHaptic();
              onTriggerChaos();
            }}
            className="px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-xl bg-gradient-to-r from-amber-500 to-rose-500 hover:from-amber-400 hover:to-rose-400 text-white font-bold text-[11px] sm:text-xs flex items-center gap-1 sm:gap-1.5 shadow-lg shadow-rose-500/20 active:scale-95 transition-all cursor-pointer"
          >
            <Sparkles className="w-3 h-3 sm:w-3.5 sm:h-3.5 animate-spin" />
            <span>Chaos!</span>
          </button>
        </div>

        {/* Right Desktop Actions (hidden on phone, accessible via mobile menu) */}
        <div className="hidden sm:flex items-center gap-1.5">
          {/* QR Code */}
          <button
            onClick={() => setShowQrModal(true)}
            className="p-2 rounded-xl bg-pink-500/10 border border-pink-500/30 text-pink-400 hover:bg-pink-500/20 transition-all cursor-pointer"
            title="Connect Phone"
          >
            <Smartphone className="w-4 h-4" />
          </button>

          {/* Sound Toggle */}
          <button
            onClick={handleToggleMute}
            className={`p-2 rounded-xl border transition-all cursor-pointer ${
              isMuted
                ? 'bg-rose-500/10 border-rose-500/30 text-rose-400'
                : 'bg-white/5 border-white/10 text-gray-300 hover:bg-white/10'
            }`}
            title={isMuted ? 'Unmute' : 'Mute'}
          >
            {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
          </button>

          {/* Fullscreen */}
          <button
            onClick={handleToggleFullscreen}
            className="p-2 rounded-xl bg-white/5 border border-white/10 text-gray-300 hover:bg-white/10 transition-all cursor-pointer hidden lg:flex"
            title="Toggle Fullscreen"
          >
            <Maximize2 className="w-4 h-4" />
          </button>

          {/* Share */}
          <button
            onClick={handleShare}
            className="p-2 rounded-xl bg-white/5 border border-white/10 text-gray-300 hover:bg-white/10 transition-all cursor-pointer relative"
            title="Copy room link"
          >
            <Share2 className="w-4 h-4" />
            {isCopied && (
              <span className="absolute -bottom-8 left-1/2 -translate-x-1/2 px-2 py-0.5 rounded bg-gray-800 text-[10px] text-emerald-400 border border-emerald-500/30 whitespace-nowrap shadow-lg">
                Copied!
              </span>
            )}
          </button>

          {/* Export PNG */}
          <button
            onClick={() => {
              triggerHaptic();
              onExportImage();
            }}
            className="p-2 rounded-xl bg-white/5 border border-white/10 text-gray-300 hover:bg-white/10 hover:text-pink-400 transition-all cursor-pointer"
            title="Download PNG snapshot"
          >
            <Download className="w-4 h-4" />
          </button>

          {/* Clear canvas */}
          <button
            onClick={() => {
              triggerHaptic();
              onClearCanvas();
            }}
            className="p-2 rounded-xl bg-white/5 border border-white/10 text-rose-400 hover:bg-rose-500/20 hover:border-rose-500/30 transition-all cursor-pointer"
            title="Clear canvas"
          >
            <Trash2 className="w-4 h-4" />
          </button>

          {/* Profile Pill */}
          <button
            onClick={() => setShowProfileModal(true)}
            className="flex items-center gap-1.5 pl-2 pr-3 py-1 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 transition-all cursor-pointer ml-1"
          >
            <span
              className="w-6 h-6 rounded-lg flex items-center justify-center text-xs shadow-inner"
              style={{ backgroundColor: currentUser.color }}
            >
              {currentUser.avatar}
            </span>
            <span className="text-xs font-medium text-gray-200 max-w-[90px] truncate">
              {currentUser.name}
            </span>
          </button>
        </div>

        {/* Right Mobile: Minimalist Touch Trigger */}
        <div className="flex sm:hidden items-center gap-1">
          {/* User Avatar Tiny */}
          <button
            onClick={() => setShowProfileModal(true)}
            className="w-7 h-7 rounded-lg flex items-center justify-center text-xs shadow-inner border border-white/10"
            style={{ backgroundColor: currentUser.color }}
          >
            {currentUser.avatar}
          </button>

          {/* Mobile "More" Menu Toggle */}
          <button
            onClick={() => {
              triggerHaptic();
              setShowMobileMenu(!showMobileMenu);
            }}
            className="p-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-gray-300 border border-white/10 cursor-pointer"
          >
            <MoreVertical className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* Mobile Actions Bottom Sheet / Popup */}
      {showMobileMenu && (
        <div
          onClick={(e) => {
            if (e.target === e.currentTarget) setShowMobileMenu(false);
          }}
          className="fixed inset-0 bg-black/65 backdrop-blur-sm z-50 flex flex-col justify-end p-2.5 sm:hidden animate-in fade-in duration-100"
        >
          <div className="bg-gray-900 border border-white/20 rounded-3xl p-4 shadow-2xl space-y-3 animate-in slide-in-from-bottom-4 duration-150 pb-[calc(1rem+env(safe-area-inset-bottom,0px))]">
            {/* Grab handle */}
            <div className="w-10 h-1 bg-white/20 rounded-full mx-auto -mt-1 mb-1" />

            <div className="flex items-center justify-between pb-2 border-b border-white/10">
              <span className="text-sm font-bold text-white flex items-center gap-2">
                <span>Quick Actions</span>
              </span>
              <button
                onClick={() => setShowMobileMenu(false)}
                className="p-1.5 text-gray-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 text-xs">
              {/* Native Mobile Share */}
              <button
                onClick={() => {
                  setShowMobileMenu(false);
                  handleShare();
                }}
                className="p-2.5 rounded-2xl flex flex-col items-center gap-1.5 bg-pink-500/15 border border-pink-500/30 text-pink-300 active:scale-95 transition-transform"
              >
                <Share2 className="w-5 h-5" />
                <span>Share Room</span>
              </button>

              {/* Sound */}
              <button
                onClick={() => {
                  handleToggleMute();
                  setShowMobileMenu(false);
                }}
                className={`p-2.5 rounded-2xl flex flex-col items-center gap-1.5 border active:scale-95 transition-transform ${
                  isMuted ? 'bg-rose-500/10 border-rose-500/30 text-rose-400' : 'bg-white/5 border-white/10 text-gray-200'
                }`}
              >
                {isMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
                <span>{isMuted ? 'Unmute' : 'Mute'}</span>
              </button>

              {/* QR Connect */}
              <button
                onClick={() => {
                  setShowMobileMenu(false);
                  setShowQrModal(true);
                }}
                className="p-2.5 rounded-2xl flex flex-col items-center gap-1.5 bg-purple-500/15 border border-purple-500/30 text-purple-300 active:scale-95 transition-transform"
              >
                <Smartphone className="w-5 h-5" />
                <span>QR Code</span>
              </button>

              {/* Export Snapshot */}
              <button
                onClick={() => {
                  setShowMobileMenu(false);
                  onExportImage();
                }}
                className="p-2.5 rounded-2xl flex flex-col items-center gap-1.5 bg-white/5 border border-white/10 text-gray-200 active:scale-95 transition-transform"
              >
                <Download className="w-5 h-5 text-emerald-400" />
                <span>Save PNG</span>
              </button>

              {/* Bot Toggle */}
              <button
                onClick={() => {
                  triggerHaptic();
                  onToggleBots();
                  setShowMobileMenu(false);
                }}
                className={`p-2.5 rounded-2xl flex flex-col items-center gap-1.5 border active:scale-95 transition-transform ${
                  enableBots ? 'bg-purple-500/20 border-purple-500/30 text-purple-300' : 'bg-white/5 border-white/10 text-gray-400'
                }`}
              >
                <Bot className="w-5 h-5" />
                <span>{enableBots ? 'Bots ON' : 'Bots OFF'}</span>
              </button>

              {/* Edit Profile */}
              <button
                onClick={() => {
                  setShowMobileMenu(false);
                  setShowProfileModal(true);
                }}
                className="p-2.5 rounded-2xl flex flex-col items-center gap-1.5 bg-white/5 border border-white/10 text-gray-200 active:scale-95 transition-transform"
              >
                <User className="w-5 h-5 text-cyan-400" />
                <span>My Profile</span>
              </button>

              {/* Clear Canvas */}
              <button
                onClick={() => {
                  setShowMobileMenu(false);
                  onClearCanvas();
                }}
                className="p-2.5 rounded-2xl flex flex-col items-center gap-1.5 bg-rose-500/10 border border-rose-500/30 text-rose-400 active:scale-95 transition-transform col-span-3 sm:col-span-1"
              >
                <Trash2 className="w-5 h-5" />
                <span>Clear All Canvas</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* QR Code / Phone Connect Modal */}
      {showQrModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-sm bg-gray-900 border border-white/20 rounded-3xl p-6 shadow-2xl flex flex-col items-center text-center space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="w-full flex items-center justify-between pb-2 border-b border-white/10">
              <div className="flex items-center gap-2 text-white font-bold text-sm">
                <Smartphone className="w-4 h-4 text-pink-400" />
                <span>Join on Mobile / Tablet</span>
              </div>
              <button
                onClick={() => setShowQrModal(false)}
                className="p-1 rounded-lg text-gray-400 hover:text-white hover:bg-white/10 transition-all cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-gray-300">
              Scan with your phone camera or visit this URL on your phone's browser:
            </p>

            <div className="p-3 bg-gray-950 rounded-2xl border border-white/10 shadow-inner flex items-center justify-center">
              <img
                src={qrCodeUrl}
                alt="Room QR Code"
                className="w-48 h-48 rounded-xl object-contain drop-shadow"
                loading="eager"
              />
            </div>

            <div className="w-full flex items-center gap-1.5 p-2 rounded-xl bg-black/40 border border-white/10 text-xs">
              <span className="font-mono text-gray-300 truncate flex-1 text-left px-1">
                {currentUrl}
              </span>
              <button
                onClick={handleShare}
                className="px-2.5 py-1 rounded-lg bg-pink-600 hover:bg-pink-500 text-white font-semibold text-[11px] shrink-0 cursor-pointer"
              >
                {isCopied ? 'Copied!' : 'Copy'}
              </button>
            </div>

            <div className="text-[11px] text-gray-400 space-y-1">
              <p>💡 Tip: Connect phone and laptop to the same Wi-Fi network!</p>
              <p>Use two fingers on mobile to pan and pinch-to-zoom.</p>
            </div>
          </div>
        </div>
      )}

      {/* Edit Profile Modal */}
      {showProfileModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <form
            onSubmit={handleSaveProfile}
            className="w-full max-w-sm bg-gray-900 border border-white/20 rounded-2xl p-6 shadow-2xl space-y-4"
          >
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <span>Your Chaos Identity</span>
            </h3>

            <div>
              <label className="text-xs text-gray-400 block mb-1">Nickname</label>
              <input
                type="text"
                value={tempName}
                onChange={(e) => setTempName(e.target.value)}
                maxLength={20}
                className="w-full px-3 py-2 rounded-xl bg-black/40 border border-white/10 text-white text-base sm:text-sm focus:outline-none focus:border-pink-500"
                placeholder="Enter nickname..."
              />
            </div>

            <div>
              <label className="text-xs text-gray-400 block mb-1">Choose Avatar</label>
              <div className="flex gap-2 flex-wrap">
                {['🐕', '🐸', '🐱', '👾', '🚀', '🔥', '👑', '⚡', '🗿', '🦄'].map((emoji) => (
                  <button
                    key={emoji}
                    type="button"
                    onClick={() => {
                      triggerHaptic();
                      setTempAvatar(emoji);
                    }}
                    className={`w-9 h-9 rounded-xl flex items-center justify-center text-lg transition-all cursor-pointer ${
                      tempAvatar === emoji
                        ? 'bg-pink-500/30 border-2 border-pink-500 scale-110'
                        : 'bg-white/5 border border-white/10 hover:bg-white/10'
                    }`}
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowProfileModal(false)}
                className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-gray-300 text-xs font-semibold cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 rounded-xl bg-pink-600 hover:bg-pink-500 text-white text-xs font-semibold shadow-lg shadow-pink-600/30 cursor-pointer"
              >
                Save
              </button>
            </div>
          </form>
        </div>
      )}
    </>
  );
};
