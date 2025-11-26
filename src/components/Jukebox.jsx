import React from 'react';
import { Play, Pause, SkipForward, SkipBack, Shuffle, List, Volume2, RefreshCw } from 'lucide-react';
import { usePlayer } from '../contexts/PlayerContext';

const Jukebox = ({ onToggleMenu, isLoading, loadingStatus }) => {
  const { currentSong, isPlaying, togglePlay, playNext, playPrev, isShuffle, setIsShuffle, volume, setVolume, consecutiveErrors } = usePlayer();

  const handleImageError = (e) => {
    e.target.src = "https://images.unsplash.com/photo-1614613535308-eb5fbd3d2c17?q=80&w=200";
  };

  return (
    <div className="relative group">
      {/* 霓虹光晕 */}
      <div className={`absolute -inset-4 bg-orange-500/30 rounded-full blur-2xl transition-all duration-1000 ${isPlaying ? 'opacity-100 scale-110' : 'opacity-0 scale-90'}`}></div>

      <div className="relative w-80 h-[500px] bg-gradient-to-b from-stone-800 to-stone-900 rounded-t-[100px] rounded-b-3xl shadow-2xl border-4 border-stone-700 flex flex-col items-center overflow-hidden">
        
        {/* 顶部装饰 */}
        <div className="w-full h-24 mt-4 px-6 flex justify-between items-center space-x-2 opacity-50">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="w-full h-12 bg-black/40 rounded-full"></div>
          ))}
        </div>

        {/* 唱片显示区 */}
        <div 
          className="mt-6 w-56 h-56 relative cursor-pointer"
          onClick={onToggleMenu}
          title="点击打开/关闭歌单"
        >
           {isLoading && (
             <div className="absolute inset-0 z-30 flex flex-col gap-2 items-center justify-center bg-black/60 rounded-full backdrop-blur-sm px-4 text-center">
               <RefreshCw className="animate-spin text-orange-400" size={32} />
               <span className="text-[10px] text-orange-200 animate-pulse">{loadingStatus}</span>
             </div>
           )}

          <div className="absolute inset-0 bg-black/80 rounded-full border-4 border-orange-900/50 shadow-inner flex items-center justify-center overflow-hidden">
            <div className={`w-48 h-48 rounded-full bg-stone-900 border border-stone-800 flex items-center justify-center ${isPlaying ? 'animate-[spin_8s_linear_infinite]' : ''}`}>
               <div className="w-24 h-24 rounded-full border-2 border-stone-600 shadow-lg overflow-hidden bg-stone-800">
                 <img 
                  src={currentSong?.cover || "https://images.unsplash.com/photo-1614613535308-eb5fbd3d2c17?q=80&w=200"} 
                  alt="Cover" 
                  className="w-full h-full object-cover"
                  onError={handleImageError}
                 />
               </div>
               <div className="absolute inset-0 rounded-full border-2 border-white/5 opacity-20 pointer-events-none"></div>
            </div>
          </div>

          {/* 唱针 */}
          <div className={`absolute -top-4 -right-4 w-4 h-24 bg-stone-400 origin-top rotate-12 transition-transform duration-700 shadow-xl z-20 ${isPlaying ? 'rotate-[25deg]' : 'rotate-[-10deg]'}`}>
            <div className="absolute bottom-0 w-3 h-4 bg-orange-200"></div>
          </div>
        </div>

        {/* 歌曲信息 */}
        <div className="mt-6 px-6 w-full text-center">
          <div className="h-6 overflow-hidden relative w-full">
            <p className={`text-orange-100 font-medium tracking-wide whitespace-nowrap ${isPlaying ? 'animate-pulse' : ''}`}>
              {currentSong?.title || "Select a song"}
            </p>
          </div>
          <p className="text-orange-400/70 text-xs uppercase mt-1 tracking-wider">
            {consecutiveErrors > 0 ? <span className="text-red-400 animate-pulse">Loading / Skipping...</span> : (currentSong?.artist || "Unknown")}
          </p>
        </div>

        {/* 控制按钮 */}
        <div className="mt-auto mb-8 w-full px-8 flex justify-between items-center text-stone-400">
           <button onClick={playPrev} className="hover:text-orange-200 transition"><SkipBack size={24} /></button>
           <button 
            onClick={togglePlay} 
            className="w-14 h-14 bg-gradient-to-br from-orange-600 to-orange-800 rounded-full flex items-center justify-center text-white shadow-lg hover:shadow-orange-900/50 hover:scale-105 active:scale-95 transition-all border border-orange-500"
           >
             {isPlaying ? <Pause size={24} fill="currentColor" /> : <Play size={24} fill="currentColor" className="ml-1" />}
           </button>
           <button onClick={playNext} className="hover:text-orange-200 transition"><SkipForward size={24} /></button>
        </div>
        
        {/* 底部工具栏 */}
        <div className="w-full bg-black/30 h-12 flex justify-between items-center px-6 border-t border-white/5">
            <button 
              onClick={() => setIsShuffle(!isShuffle)} 
              className={`transition ${isShuffle ? 'text-orange-400' : 'text-stone-600 hover:text-stone-400'}`}
              title="随机播放"
            >
              <Shuffle size={16} />
            </button>
            
            <div className="flex items-center space-x-2 group/vol">
              <Volume2 size={16} className="text-stone-600 group-hover/vol:text-stone-400" />
              <input 
                type="range" 
                min="0" 
                max="1" 
                step="0.01" 
                value={volume} 
                onChange={(e) => setVolume(parseFloat(e.target.value))}
                className="w-16 h-1 bg-stone-700 rounded-lg appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-orange-500"
              />
            </div>

            <button 
              onClick={onToggleMenu}
              className="text-orange-400 transition"
            >
              <List size={16} />
            </button>
        </div>
      </div>
    </div>
  );
};

export default Jukebox;