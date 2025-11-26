import React, { useState, useEffect } from 'react';
import { PlayerProvider, usePlayer } from './contexts/PlayerContext';
import Jukebox from './components/Jukebox';
import PlaylistMenu from './components/PlaylistMenu';
import * as API from './api/netease';

const LofiCafeContent = () => {
  const { startNewPlaylist, INITIAL_PLAYLIST } = usePlayer();
  
  const [currentPlaylistId, setCurrentPlaylistId] = useState(API.DEFAULT_PLAYLIST_ID);
  const [showMenu, setShowMenu] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [loadingStatus, setLoadingStatus] = useState('');
  const [loadError, setLoadError] = useState(null);
  const [isUsingApi, setIsUsingApi] = useState(false);

  const CACHE_KEY = 'lofi_cafe_playlist_v2';

  const loadMusic = async () => {
    setIsLoading(true);
    setLoadError(null);
    setLoadingStatus('Checking cache...');

    try {
        const cached = localStorage.getItem(CACHE_KEY);
        if (cached) {
            const { pid, data, timestamp } = JSON.parse(cached);
            if (pid === currentPlaylistId && (Date.now() - timestamp < 3600000)) {
                startNewPlaylist(data);
                setIsUsingApi(true);
                setIsLoading(false);
                setLoadingStatus('');
                return;
            }
        }
    } catch (e) { console.warn(e); }

    setLoadingStatus('Connecting...');
    try {
      const detailData = await API.fetchPlaylistDetail(currentPlaylistId);
      if (detailData.code !== 200) throw new Error("API Error");
      
      const totalTracks = detailData.playlist.trackCount;
      const limit = 50; 
      let randomOffset = 0;
      if (totalTracks > limit) {
         const maxOffset = totalTracks - limit;
         randomOffset = Math.floor(Math.random() * (maxOffset + 1));
      }

      setLoadingStatus(`Digging (Start: ${randomOffset})...`);
      const listData = await API.fetchTrackList(currentPlaylistId, limit, randomOffset);
      if (!listData.songs || listData.songs.length === 0) throw new Error("Empty list");

      setLoadingStatus('Resolving audio...');
      const songIds = listData.songs.map(s => s.id).join(',');
      const urlData = await API.fetchSongUrls(songIds);
      
      const urlMap = {};
      if (urlData.code === 200 && urlData.data) {
          urlData.data.forEach(item => { if (item.url) urlMap[item.id] = item.url; });
      }

      const rawSongs = listData.songs.map(song => {
            const songUrl = urlMap[song.id] || `https://music.163.com/song/media/outer/url?id=${song.id}.mp3`;
            return {
                id: song.id,
                title: song.name,
                artist: song.ar ? song.ar.map(a => a.name).join(' / ') : 'Unknown',
                cover: song.al ? song.al.picUrl : 'https://images.unsplash.com/photo-1614613535308-eb5fbd3d2c17?q=80&w=200',
                url: songUrl
            };
        });

      // 依然保留切掉第一首的逻辑，确保播放稳定性
      const finalPlaylist = rawSongs.length > 1 ? rawSongs.slice(1) : rawSongs;

      localStorage.setItem(CACHE_KEY, JSON.stringify({
          pid: currentPlaylistId,
          data: finalPlaylist,
          timestamp: Date.now()
      }));

      startNewPlaylist(finalPlaylist);
      setIsUsingApi(true);

    } catch (err) {
      console.error(err);
      const cached = localStorage.getItem(CACHE_KEY);
      if (cached) {
          startNewPlaylist(JSON.parse(cached).data);
          setIsUsingApi(true);
          setLoadError("Offline Mode (Cache)");
      } else {
          setLoadError("Offline Mode");
          startNewPlaylist(INITIAL_PLAYLIST); 
          setIsUsingApi(false);
      }
    } finally {
      setIsLoading(false);
      setLoadingStatus('');
    }
  };

  useEffect(() => {
    loadMusic();
  }, [currentPlaylistId]);

  const handleRefresh = () => {
    localStorage.removeItem(CACHE_KEY);
    loadMusic();
  };

  return (
    <div className="relative w-full h-screen overflow-hidden bg-black font-sans selection:bg-orange-500 selection:text-white">
      <div className="absolute inset-0 z-0 bg-cover bg-center" style={{ backgroundImage: `url('https://images.unsplash.com/photo-1542345812-d98d5ec5da68?q=80&w=2500&auto=format&fit=crop')`, filter: 'brightness(0.6) contrast(1.1) blur(2px)' }} />
      <div className="absolute inset-0 z-0 bg-gradient-to-t from-black via-transparent to-black opacity-80 pointer-events-none"></div>
      <div className="absolute inset-0 z-0 bg-orange-900/20 pointer-events-none mix-blend-overlay"></div>

      <div className="relative z-10 w-full h-full flex flex-col items-center justify-center">
        {/* 修复：移除 hidden md:block，改为响应式布局，保证手机可见 */}
        <div className="absolute top-6 left-6 md:top-8 md:left-8 text-orange-100 opacity-80 z-20 pointer-events-none">
          <h1 className="text-xl md:text-3xl font-light tracking-widest uppercase">Lofi Café</h1>
          <div className="flex items-center gap-2 mt-1">
            <p className="text-xs md:text-sm font-light text-orange-300">Open 24/7</p>
            <span className={`text-[10px] px-1.5 py-0.5 rounded border ${isUsingApi ? 'bg-green-900/50 text-green-300 border-green-700/50' : 'bg-stone-800 text-stone-400 border-stone-700'}`}>
              {isUsingApi ? 'Online' : 'Offline'}
            </span>
          </div>
        </div>

        <div className="relative">
          <Jukebox onToggleMenu={() => setShowMenu(!showMenu)} isLoading={isLoading} loadingStatus={loadingStatus} />
          {/* 歌单组件 */}
          <PlaylistMenu show={showMenu} onClose={() => setShowMenu(false)} onPlaylistChange={setCurrentPlaylistId} onRefreshPlaylist={handleRefresh} isUsingApi={isUsingApi} loadError={loadError} />
        </div>
      </div>
      <style>{`@keyframes spin-slow { from { transform: rotate(0deg); } to { transform: rotate(360deg); } } .scrollbar-thin::-webkit-scrollbar { width: 6px; } .scrollbar-thin::-webkit-scrollbar-thumb { background-color: #44403c; border-radius: 3px; }`}</style>
    </div>
  );
};

const App = () => {
  return (
    <PlayerProvider>
      <LofiCafeContent />
    </PlayerProvider>
  );
};

export default App;