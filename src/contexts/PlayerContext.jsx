import React, { createContext, useContext, useState, useRef, useEffect } from 'react';

const PlayerContext = createContext();

export const usePlayer = () => useContext(PlayerContext);

export const PlayerProvider = ({ children }) => {
  // 状态定义
  const [playlist, setPlaylist] = useState([]);
  const [currentSongIndex, setCurrentSongIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isShuffle, setIsShuffle] = useState(false);
  const [volume, setVolume] = useState(0.5);
  const [consecutiveErrors, setConsecutiveErrors] = useState(0);
  const audioRef = useRef(null);

  const currentSong = playlist[currentSongIndex];

  // 音量控制
  useEffect(() => {
    if (audioRef.current) audioRef.current.volume = volume;
  }, [volume]);

  // 播放/暂停监听
  useEffect(() => {
    if (!audioRef.current) return;
    if (isPlaying) {
      const playPromise = audioRef.current.play();
      if (playPromise !== undefined) {
        playPromise.catch(() => setIsPlaying(false));
      }
    } else {
      audioRef.current.pause();
    }
  }, [isPlaying, currentSongIndex, playlist]); // 依赖项包含 playlist 确保切歌单后也能播放

  // 自动下一首监听
  useEffect(() => {
    const audio = audioRef.current;
    const handleEnded = () => playNext();
    if (audio) {
      audio.addEventListener('ended', handleEnded);
      return () => audio.removeEventListener('ended', handleEnded);
    }
  }, [currentSongIndex, isShuffle, playlist]);

  // 控制逻辑
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

  // 错误处理
  const handleAudioError = () => {
    if (playlist.length <= 1) return;
    if (consecutiveErrors >= 5) {
      setIsPlaying(false);
      setConsecutiveErrors(0);
      alert("多首歌曲无法播放，建议切换歌单或刷新重试。");
    } else {
      setConsecutiveErrors((prev) => prev + 1);
      playNext();
    }
  };

  const handleAudioCanPlay = () => {
    if (consecutiveErrors > 0) setConsecutiveErrors(0);
  };

  return (
    <PlayerContext.Provider value={{
      playlist, setPlaylist,
      currentSong, currentSongIndex,
      isPlaying, togglePlay,
      playNext, playPrev, selectSong,
      isShuffle, setIsShuffle,
      volume, setVolume,
      consecutiveErrors,
      audioRef
    }}>
      {children}
      <audio
        ref={audioRef}
        src={currentSong?.url}
        onError={handleAudioError}
        onCanPlay={handleAudioCanPlay}
      />
    </PlayerContext.Provider>
  );
};