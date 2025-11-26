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

  // 缓存键名
  const CACHE_KEY = 'lofi_cafe_playlist_v2'; // 升级版本号，避免读取旧缓存

  const loadMusic = async () => {
    setIsLoading(true);
    setLoadError(null);
    setLoadingStatus('检查缓存...');

    // --- 1. 优先读取缓存 (防 API 封禁) ---
    try {
        const cached = localStorage.getItem(CACHE_KEY);
        if (cached) {
            const { pid, data, timestamp } = JSON.parse(cached);
            if (pid === currentPlaylistId && (Date.now() - timestamp < 3600000)) {
                console.log("Using cached playlist");
                startNewPlaylist(data);
                setIsUsingApi(true);
                setIsLoading(false);
                setLoadingStatus('');
                return;
            }
        }
    } catch (e) { console.warn("Cache error", e); }

    // --- 2. 请求 API ---
    setLoadingStatus('连接音乐节点...');
    try {
      const detailData = await API.fetchPlaylistDetail(currentPlaylistId);
      if (detailData.code !== 200) throw new Error("无法获取歌单");
      
      const totalTracks = detailData.playlist.trackCount;
      // 稍微多取一点，因为我们要切掉第一首
      const limit = 50; 
      let randomOffset = 0;
      if (totalTracks > limit) {
         const maxOffset = totalTracks - limit;
         randomOffset = Math.floor(Math.random() * (maxOffset + 1));
      }

      setLoadingStatus(`挖掘宝藏 (Start: ${randomOffset})...`);
      const listData = await API.fetchTrackList(currentPlaylistId, limit, randomOffset);
      if (!listData.songs || listData.songs.length === 0) throw new Error("歌单片段为空");

      setLoadingStatus('解析音频...');
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

      // 🔪🔪🔪【核心讨巧修改】🔪🔪🔪
      // 既然第一首总是加载失败，我们直接把它切掉！
      // 从第二首开始取，彻底避开“首曲魔咒”
      const finalPlaylist = rawSongs.length > 1 ? rawSongs.slice(1) : rawSongs;

      if (finalPlaylist.length === 0) throw new Error("无可用歌曲");

      // --- 3. 写入缓存 ---
      localStorage.setItem(CACHE_KEY, JSON.stringify({
          pid: currentPlaylistId,
          data: finalPlaylist, // 存入的是切掉第一首后的干净列表
          timestamp: Date.now()
      }));

      startNewPlaylist(finalPlaylist);
      setIsUsingApi(true);

    } catch (err) {
      console.error(err);
      // 降级使用旧缓存
      const cached = localStorage.getItem(CACHE_KEY);
      if (cached) {
          startNewPlaylist(JSON.parse(cached).data);
          setIsUsingApi(true);
          setLoadError("网络受限，加载历史缓存");
      } else {
          setLoadError("加载失败，切换离线模式");
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
        <div className="absolute top-8 left-8 text-orange-100 opacity-80 hidden md:block">
          <h1 className="text-3xl font-light tracking-widest uppercase">Lofi Café</h1>
          <div className="flex items-center gap-2 mt-1">
            <p className="text-sm font-light text-orange-300">Open 24/7</p>
            <span className={`text-[10px] px-1.5 py-0.5 rounded border ${isUsingApi ? 'bg-green-900/50 text-green-300 border-green-700/50' : 'bg-stone-800 text-stone-400 border-stone-700'}`}>
              {isUsingApi ? 'Online' : 'Offline'}
            </span>
          </div>
        </div>

        <div className="relative">
          <Jukebox onToggleMenu={() => setShowMenu(!showMenu)} isLoading={isLoading} loadingStatus={loadingStatus} />
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