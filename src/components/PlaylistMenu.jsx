import React, { useState } from 'react';
import { Music, User, X, Search, RefreshCw, Sparkles, Play, AlertCircle } from 'lucide-react';
import { usePlayer } from '../contexts/PlayerContext';
import * as API from '../api/netease';

const PlaylistMenu = ({ show, onClose, onPlaylistChange, onRefreshPlaylist, isUsingApi, loadError }) => {
  const { playlist, currentSongIndex, isPlaying, selectSong } = usePlayer();
  const [menuView, setMenuView] = useState('tracks');
  const [userIdInput, setUserIdInput] = useState('');
  const [userPlaylists, setUserPlaylists] = useState([]);
  const [isFetchingPlaylists, setIsFetchingPlaylists] = useState(false);

  const handleUserSearch = async () => {
    if (!userIdInput) return;
    setIsFetchingPlaylists(true);
    try {
      const data = await API.fetchUserPlaylists(userIdInput);
      if (data.code === 200 && data.playlist) {
        setUserPlaylists(data.playlist);
      }
    } catch (error) { console.error(error); } finally { setIsFetchingPlaylists(false); }
  };

  const handlePlaylistClick = (id) => {
    onPlaylistChange(id);
    setMenuView('tracks');
  };

  return (
    // 核心修复：
    // 手机端 (默认): fixed inset-x-4 ... (中央弹窗)
    // 电脑端 (md:): absolute left-full ... (侧边悬浮)
    <div 
      className={`
        fixed inset-x-4 top-24 bottom-24 z-50 
        md:absolute md:inset-auto md:top-0 md:left-full md:ml-6 md:w-72 md:h-[500px]
        bg-stone-900/95 backdrop-blur-md rounded-2xl border border-stone-700 shadow-2xl 
        transition-all duration-300 overflow-hidden flex flex-col
        ${show ? 'opacity-100 scale-100 translate-y-0' : 'opacity-0 scale-95 translate-y-4 md:translate-y-0 pointer-events-none'}
      `}
    >
      {/* 顶部导航 */}
      <div className="p-3 border-b border-white/10 flex justify-between items-center bg-stone-800/50">
          <div className="flex gap-2">
              <button onClick={() => setMenuView('tracks')} className={`p-1.5 rounded transition ${menuView === 'tracks' ? 'bg-orange-900/50 text-orange-200' : 'text-stone-500 hover:text-stone-300'}`}>
                  <Music size={16} />
              </button>
              <button onClick={() => setMenuView('user_search')} className={`p-1.5 rounded transition ${menuView === 'user_search' ? 'bg-orange-900/50 text-orange-200' : 'text-stone-500 hover:text-stone-300'}`}>
                  <User size={16} />
              </button>
          </div>
          <button onClick={onClose} className="text-stone-500 hover:text-orange-300"><X size={18} /></button>
      </div>

      {loadError && (
        <div className="p-2 bg-red-900/20 border-b border-red-500/20 flex items-center gap-2 text-red-200 text-xs">
          <AlertCircle size={14} />
          <span>{loadError}</span>
        </div>
      )}

      {menuView === 'tracks' && (
        <>
          <div className="px-3 py-2 bg-black/10 text-[10px] text-stone-500 flex justify-between items-center">
              <span>Current Playlist ({playlist.length})</span>
              <button onClick={onRefreshPlaylist} className="flex items-center gap-1 hover:text-orange-300 transition" title="Shuffle New">
                  <Sparkles size={10} />
                  <span>Shuffle New</span>
              </button>
          </div>
          <div className="flex-1 overflow-y-auto p-2 scrollbar-thin scrollbar-thumb-stone-600 scrollbar-track-transparent">
            {playlist.map((song, index) => (
              <div 
                key={song.id}
                onClick={() => selectSong(index)}
                className={`flex items-center p-2 rounded-lg mb-1 cursor-pointer transition-all ${currentSongIndex === index ? 'bg-orange-900/30 border border-orange-500/30' : 'hover:bg-white/5 border border-transparent'}`}
              >
                <div className={`w-8 h-8 rounded shrink-0 shadow-sm overflow-hidden bg-stone-800 ${currentSongIndex === index && isPlaying ? 'animate-spin-slow' : ''}`}>
                    <img src={song.cover} className="w-full h-full object-cover" alt="cover" onError={(e) => e.target.src="https://images.unsplash.com/photo-1614613535308-eb5fbd3d2c17?q=80&w=200"}/>
                </div>
                <div className="ml-3 overflow-hidden">
                    <p className={`text-xs truncate font-medium ${currentSongIndex === index ? 'text-orange-200' : 'text-stone-300'}`}>{song.title}</p>
                    <p className="text-[10px] text-stone-500 truncate mt-0.5">{song.artist}</p>
                </div>
                <div className="ml-auto pl-2">
                    {currentSongIndex === index && isPlaying && (
                    <div className="flex gap-[2px] items-end h-3">
                        <span className="w-0.5 h-full bg-orange-500 animate-[bounce_1s_infinite]"></span>
                        <span className="w-0.5 h-2/3 bg-orange-500 animate-[bounce_1.2s_infinite]"></span>
                        <span className="w-0.5 h-full bg-orange-500 animate-[bounce_0.8s_infinite]"></span>
                    </div>
                    )}
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {menuView === 'user_search' && (
        <div className="flex flex-col h-full">
            <div className="p-3 border-b border-white/5 space-y-2">
                <label className="text-xs text-stone-400 block">Netease User ID</label>
                <div className="flex gap-2">
                    <input 
                        type="text" 
                        value={userIdInput}
                        onChange={(e) => setUserIdInput(e.target.value)}
                        placeholder="e.g. 32953014"
                        className="flex-1 bg-black/30 border border-stone-600 rounded px-2 py-1.5 text-xs text-stone-200 focus:border-orange-500 outline-none"
                    />
                    <button 
                        onClick={handleUserSearch}
                        disabled={isFetchingPlaylists}
                        className="bg-stone-700 hover:bg-orange-700 text-stone-200 px-3 py-1.5 rounded text-xs transition flex items-center justify-center min-w-[32px]"
                    >
                        {isFetchingPlaylists ? <RefreshCw size={12} className="animate-spin"/> : <Search size={12} />}
                    </button>
                </div>
            </div>

            <div className="flex-1 overflow-y-auto p-2 scrollbar-thin scrollbar-thumb-stone-600 scrollbar-track-transparent">
                {userPlaylists.map((pl) => (
                    <div 
                        key={pl.id}
                        onClick={() => handlePlaylistClick(pl.id)}
                        className="flex items-center p-2 rounded-lg mb-1 cursor-pointer hover:bg-white/5 border border-transparent hover:border-stone-600 transition-all group"
                    >
                        <div className="w-10 h-10 rounded shrink-0 shadow-sm overflow-hidden bg-stone-800 relative">
                            <img src={pl.coverImgUrl} className="w-full h-full object-cover group-hover:scale-110 transition duration-500" alt="cover" />
                        </div>
                        <div className="ml-3 overflow-hidden flex-1">
                            <p className="text-xs truncate font-medium text-stone-300 group-hover:text-orange-200">{pl.name}</p>
                            <p className="text-[10px] text-stone-500 truncate mt-0.5">{pl.trackCount} tracks</p>
                        </div>
                    </div>
                ))}
            </div>
        </div>
      )}
      
      <div className="p-3 bg-black/20 text-center border-t border-white/5">
        <p className="text-[10px] text-stone-600">{isUsingApi ? 'Connected to Netease' : 'Offline Mode'}</p>
      </div>
    </div>
  );
};

export default PlaylistMenu;