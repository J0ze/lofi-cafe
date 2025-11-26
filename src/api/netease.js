// src/api/netease.js
export const API_BASE_URL = "https://cloudmusic-api-three.vercel.app";
export const DEFAULT_PLAYLIST_ID = "6654477071";

export const fetchPlaylistDetail = async (id) => {
  const res = await fetch(`${API_BASE_URL}/playlist/detail?id=${id}`);
  return res.json();
};

export const fetchTrackList = async (id, limit = 50, offset = 0) => {
  const res = await fetch(`${API_BASE_URL}/playlist/track/all?id=${id}&limit=${limit}&offset=${offset}`);
  return res.json();
};

export const fetchSongUrls = async (ids) => {
  const res = await fetch(`${API_BASE_URL}/song/url?id=${ids}`);
  return res.json();
};

export const fetchUserPlaylists = async (uid) => {
  const res = await fetch(`${API_BASE_URL}/user/playlist?uid=${uid}`);
  return res.json();
};