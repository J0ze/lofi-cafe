import React, { createContext, useContext, useState, useRef, useEffect } from 'react';

const PlayerContext = createContext();

export const usePlayer = () => useContext(PlayerContext);

const INITIAL_PLAYLIST = [
  { id: 1, title: "Late Night Code", artist: "Lofi Dreamer", cover: "https://images.unsplash.com/photo-1516280440614-6697288d5d38?q=80&w=200", url: "https://cdn.pixabay.com/download/audio/2022/05/27/audio_1808fbf07a.mp3" },
  { id: 2, title: "Rainy Window", artist: "Chill Beats", cover: "https://images.unsplash.com/photo-1496360938681-982092429813?q=80&w=200", url: "https://cdn.pixabay.com/download/audio/2022/03/24/audio_07a0c9175d.mp3" }
];

export const PlayerProvider = ({ children }) => {
  const [playlist, setPlaylist] = useState(INITIAL_PLAYLIST);
  const [currentSongIndex, setCurrentSongIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isShuffle, setIsShuffle] = useState(false);
  const [volume, setVolume] = useState(0.5);
  const [consecutiveErrors, setConsecutiveErrors] = useState(0);
  const audioRef = useRef(null);

  const currentSong = playlist[currentSongIndex];

  // 1. 音量控制
  useEffect(() => {
    if (audioRef.current) audioRef.current.volume = volume;
  }, [volume]);

  // 2. 播放/暂停控制
  // 只要 isPlaying 或 currentSongIndex 变化，这里就会触发播放，保证切歌流畅
  useEffect(() => {
    if (!audioRef.current) return;

    if (isPlaying) {
      // 稍微延迟一下以确保 src 已经更新（虽然通常 React 渲染很快）
      const playPromise = audioRef.current.play();
      if (playPromise !== undefined) {
        playPromise.catch((err) => {
            console.warn("Playback prevented:", err);
            if (err.name === 'NotAllowedError') setIsPlaying(false);
        });
      }
    } else {
      audioRef.current.pause();
    }
  }, [isPlaying, currentSongIndex, playlist]); 

  // 3. Media Session API (锁屏控制 + 后台保活)
  useEffect(() => {
    if ('mediaSession' in navigator && currentSong) {
      navigator.mediaSession.metadata = new MediaMetadata({
        title: currentSong.title,
        artist: currentSong.artist,
        artwork: [
          { src: currentSong.cover, sizes: '96x96', type: 'image/jpeg' },
          { src: currentSong.cover, sizes: '128x128', type: 'image/jpeg' },
          { src: currentSong.cover, sizes: '256x256', type: 'image/jpeg' },
          { src: currentSong.cover, sizes: '512x512', type: 'image/jpeg' },
        ]
      });

      navigator.mediaSession.setActionHandler('play', () => setIsPlaying(true));
      navigator.mediaSession.setActionHandler('pause', () => setIsPlaying(false));
      navigator.mediaSession.setActionHandler('previoustrack', () => playPrev());
      navigator.mediaSession.setActionHandler('nexttrack', () => playNext());
    }
  }, [currentSong, isShuffle, playlist]); 

  // 4. 监听播放结束，自动下一首
  useEffect(() => {
    const audio = audioRef.current;
    const handleEnded = () => {
        console.log("Song finished. Auto-playing next...");
        playNext();
    };

    if (audio) {
      audio.addEventListener('ended', handleEnded);
      return () => audio.removeEventListener('ended', handleEnded);
    }
  }, [currentSongIndex, isShuffle, playlist]); 

  const togglePlay = () => setIsPlaying(!isPlaying);

  const playNext = () => {
    if (!playlist.length) return;
    if (isShuffle) {
      let nextIndex = Math.floor(Math.random() * playlist.length);
      if (playlist.length > 1) {
        while (nextIndex === currentSongIndex) {
            nextIndex = Math.floor(Math.random() * playlist.length);
        }
      }
      setCurrentSongIndex(nextIndex);
    } else {
      setCurrentSongIndex((prev) => (prev + 1) % playlist.length);
    }
    setIsPlaying(true);
  };

  const playPrev = () => {
    if (!playlist.length) return;
    setCurrentSongIndex((prev) => (prev - 1 + playlist.length) % playlist.length);
    setIsPlaying(true);
  };

  const selectSong = (index) => {
    setCurrentSongIndex(index);
    setIsPlaying(true);
    setConsecutiveErrors(0);
  };

  const startNewPlaylist = (newSongs) => {
    setIsPlaying(false); 
    setPlaylist(newSongs);
    setCurrentSongIndex(0);
    setConsecutiveErrors(0);
    setTimeout(() => setIsPlaying(true), 500); 
  };

  const handleAudioError = (e) => {
    if (playlist.length <= 1) return;
    const errorCode = e.target.error ? e.target.error.code : 'Unknown';
    if (errorCode !== 20) console.warn(`Song Error [${currentSong?.title}] Code: ${errorCode}`);

    if (consecutiveErrors >= 5) {
      setIsPlaying(false);
      setConsecutiveErrors(0);
    } else {
      setConsecutiveErrors((prev) => prev + 1);
      setTimeout(() => playNext(), 500);
    }
  };

  const handleAudioCanPlay = () => {
    if (consecutiveErrors > 0) setConsecutiveErrors(0);
  };

  return (
    <PlayerContext.Provider value={{
      playlist, setPlaylist, startNewPlaylist,
      currentSong, currentSongIndex,
      isPlaying, togglePlay,
      playNext, playPrev, selectSong,
      isShuffle, setIsShuffle,
      volume, setVolume,
      consecutiveErrors,
      audioRef,
      INITIAL_PLAYLIST
    }}>
      {children}
      {/* ★ 核心修改 ★
        1. 移除了 key={currentSong?.id}：现在 audio 标签是复用的，浏览器知道这是“同一个连续的播放会话”，
           配合上面的 Media Session API，即可完美支持后台自动切歌。
        2. 保留 referrerPolicy="no-referrer"：确保切歌后请求新 URL 时依然不带 Referrer，防盗链依然有效。
      */}
      <audio
        ref={audioRef}
        src={currentSong?.url}
        onError={handleAudioError}
        onCanPlay={handleAudioCanPlay}
        referrerPolicy="no-referrer"
      />
    </PlayerContext.Provider>
  );
};