import React, { useState, useEffect } from 'react';
import { PlayerProvider, usePlayer } from './contexts/PlayerContext';
import Jukebox from './components/Jukebox';
import PlaylistMenu from './components/PlaylistMenu';
import * as API from './api/netease';

// 初始离线数据（防止白屏）
const INITIAL_PLAYLIST = [
  { id: 1, title: "Late Night Code", artist: "Lofi Dreamer", cover: "https://images.unsplash.com/photo-1516280440614-6697288d5d38?q=80&w=200", url: "https://cdn.pixabay.com/download/audio/2022/05/27/audio_1808fbf07a.mp3" },
  { id: 2, title: "Rainy Window", artist: "Chill Beats", cover: "https://images.unsplash.com/photo-1496360938681-982092429813?q=80&w=200", url: "https://cdn.pixabay.com/download/audio/2022/03/24/audio_07a0c9175d.mp3" }
];

// 内部组件：负责数据逻辑（因为必须在 Provider 内部使用 usePlayer）
const LofiCafeContent = () => {
  const { setPlaylist } = usePlayer();
  const [currentPlaylistId, setCurrentPlaylistId] = useState(API.DEFAULT_PLAYLIST_ID);
  const [showMenu, setShowMenu] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [loadingStatus, setLoadingStatus] = useState('');
  const [loadError, setLoadError] = useState(null);
  const [isUsingApi, setIsUsingApi] = useState(false);

  // 加载音乐核心逻辑
  const loadMusic = async () => {
    setIsLoading(true);
    setLoadError(null);
    setLoadingStatus('获取歌单信息...');

    try {
      // 1. 获取详情和总数
      const detailData = await API.fetchPlaylistDetail(currentPlaylistId);
      if (detailData.code !== 200) throw new Error("无法获取歌单详情");
      
      const totalTracks = detailData.playlist.trackCount;
      const limit = 50;
      let randomOffset = 0;
      
      // 2. 计算随机偏移
      if (totalTracks > limit) {
         const maxOffset = totalTracks - limit;
         randomOffset = Math.floor(Math.random() * (maxOffset + 1));
      }

      setLoadingStatus(`挖掘宝藏 (Start: ${randomOffset})...`);

      // 3. 获取歌曲列表
      const listData = await API.fetchTrackList(currentPlaylistId, limit, randomOffset);
      if (!listData.songs || listData.songs.length === 0) throw new Error("歌单片段为空");

      // 4. 获取真实 URL
      setLoadingStatus('解析音频源...');
      const songIds = listData.songs.map(s => s.id).join(',');
      const urlData = await API.fetchSongUrls(songIds);
      
      const urlMap = {};
      if (urlData.code === 200 && urlData.data) {
          urlData.data.forEach(item => { if (item.url) urlMap[item.id] = item.url; });
      }

      // 5. 格式化数据
      const formattedSongs = listData.songs.map(song => ({
        id: song.id,
        title: song.name,
        artist: song.ar ? song.ar.map(a => a.name).join(' / ') : 'Unknown',
        cover: song.al ? song.al.picUrl : 'https://images.unsplash.com/photo-1614613535308-eb5fbd3d2c17?q=80&w=200',
        url: urlMap[song.id] || `https://music.163.com/song/media/outer/url?id=${song.id}.mp3`
      }));

      setPlaylist(formattedSongs);
      setIsUsingApi(true);

    } catch (err) {
      console.error(err);
      setLoadError("加载失败，已切换至离线模式");
      setPlaylist(INITIAL_PLAYLIST);
      setIsUsingApi(false);
    } finally {
      setIsLoading(false);
      setLoadingStatus('');
    }
  };

  useEffect(() => {
    loadMusic();
  }, [currentPlaylistId]);

  const handleRefresh = () => {
    setPlaylist([]); // 清空以触发视觉上的刷新
    setTimeout(() => {
        // 简单触发重载的小技巧：如果ID没变，我们重新调用 loadMusic
        loadMusic();
    }, 100);
  };

  return (
    <div className="relative w-full h-screen overflow-hidden bg-black font-sans selection:bg-orange-500 selection:text-white">
      {/* 背景层 */}
      <div 
        className="absolute inset-0 z-0 bg-cover bg-center"
        style={{ 
          backgroundImage: `url('https://images.unsplash.com/photo-1542345812-d98d5ec5da68?q=80&w=2500&auto=format&fit=crop')`, 
          filter: 'brightness(0.6) contrast(1.1) blur(2px)'
        }}
      />
      <div className="absolute inset-0 z-0 bg-gradient-to-t from-black via-transparent to-black opacity-80 pointer-events-none"></div>
      <div className="absolute inset-0 z-0 bg-orange-900/20 pointer-events-none mix-blend-overlay"></div>

      {/* 主界面 */}
      <div className="relative z-10 w-full h-full flex flex-col items-center justify-center">
        {/* 标题 */}
        <div className="absolute top-8 left-8 text-orange-100 opacity-80 hidden md:block">
          <h1 className="text-3xl font-light tracking-widest uppercase">Lofi Café</h1>
          <div className="flex items-center gap-2 mt-1">
            <p className="text-sm font-light text-orange-300">Open 24/7</p>
            <span className={`text-[10px] px-1.5 py-0.5 rounded border ${isUsingApi ? 'bg-green-900/50 text-green-300 border-green-700/50' : 'bg-stone-800 text-stone-400 border-stone-700'}`}>
              {isUsingApi ? 'Online' : 'Offline'}
            </span>
          </div>
        </div>

        {/* 核心组件 */}
        <div className="relative">
          <Jukebox 
            onToggleMenu={() => setShowMenu(!showMenu)} 
            isLoading={isLoading} 
            loadingStatus={loadingStatus}
          />
          
          <PlaylistMenu 
            show={showMenu} 
            onClose={() => setShowMenu(false)}
            onPlaylistChange={setCurrentPlaylistId}
            onRefreshPlaylist={handleRefresh}
            isUsingApi={isUsingApi}
            loadError={loadError}
          />
        </div>
      </div>
      
      {/* 全局样式注入 */}
      <style>{`
        @keyframes spin-slow { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        .scrollbar-thin::-webkit-scrollbar { width: 6px; }
        .scrollbar-thin::-webkit-scrollbar-thumb { background-color: #44403c; border-radius: 3px; }
      `}</style>
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