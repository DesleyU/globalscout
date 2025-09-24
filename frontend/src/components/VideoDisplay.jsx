import React, { useState, useRef } from 'react';
import { Play, Pause, Volume2, VolumeX, Maximize, Download, Trash2 } from 'lucide-react';
import { api } from '../services/api';
import toast from 'react-hot-toast';

const VideoDisplay = ({ video, onDelete, showControls = true, autoPlay = false }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [videoError, setVideoError] = useState(null);
  const videoRef = useRef(null);

  // Debug video URL construction
  // Check if URL already includes the base URL to avoid duplication
  const videoUrl = video.url.startsWith('http') ? video.url : `http://localhost:5000${video.url}`;
  console.log('🎥 VideoDisplay - Video object:', video);
  console.log('🎥 VideoDisplay - Constructed URL:', videoUrl);

  const handlePlayPause = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const handleMuteToggle = () => {
    if (videoRef.current) {
      videoRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  };

  const handleTimeUpdate = () => {
    if (videoRef.current) {
      setCurrentTime(videoRef.current.currentTime);
    }
  };

  const handleLoadedMetadata = () => {
    if (videoRef.current) {
      setDuration(videoRef.current.duration);
      setVideoError(null); // Clear any previous errors
    }
  };

  const handleVideoError = (e) => {
    console.error('Video error:', e);
    const error = e.target.error;
    let errorMessage = 'Unknown video error';
    
    if (error) {
      switch (error.code) {
        case error.MEDIA_ERR_ABORTED:
          errorMessage = 'Video playback was aborted';
          break;
        case error.MEDIA_ERR_NETWORK:
          errorMessage = 'Network error occurred while loading video';
          break;
        case error.MEDIA_ERR_DECODE:
          errorMessage = 'Video format not supported or corrupted';
          break;
        case error.MEDIA_ERR_SRC_NOT_SUPPORTED:
          errorMessage = 'Video format not supported by browser';
          break;
        default:
          errorMessage = 'Unknown video error';
      }
    }
    
    setVideoError(errorMessage);
    console.error('Video error details:', errorMessage, error);
  };

  const handleCanPlay = () => {
    console.log('Video can play:', video.url);
    setVideoError(null);
  };

  const handleSeek = (e) => {
    if (videoRef.current) {
      const rect = e.currentTarget.getBoundingClientRect();
      const pos = (e.clientX - rect.left) / rect.width;
      videoRef.current.currentTime = pos * duration;
    }
  };

  const handleFullscreen = () => {
    if (videoRef.current) {
      if (videoRef.current.requestFullscreen) {
        videoRef.current.requestFullscreen();
      } else if (videoRef.current.webkitRequestFullscreen) {
        videoRef.current.webkitRequestFullscreen();
      } else if (videoRef.current.msRequestFullscreen) {
        videoRef.current.msRequestFullscreen();
      }
    }
  };

  const handleDownload = () => {
    const link = document.createElement('a');
    link.href = videoUrl; // Use the same URL logic as the video element
    link.download = `video_${video.id}.mp4`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleDelete = async () => {
    if (window.confirm('Are you sure you want to delete this video?')) {
      setIsLoading(true);
      try {
        await api.media.deleteVideo(video.id);
        toast.success('Video deleted successfully');
        if (onDelete) {
          onDelete(video.id);
        }
      } catch (error) {
        toast.error('Failed to delete video');
        console.error('Delete error:', error);
      } finally {
        setIsLoading(false);
      }
    }
  };

  const formatTime = (time) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const progressPercentage = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden">
      {/* Video Container */}
      <div className="relative bg-black">
        {videoError && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/80 z-10">
            <div className="text-center text-white p-4">
              <div className="text-red-400 mb-2">
                <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.268 19.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
              <p className="text-sm font-medium">Video Error</p>
              <p className="text-xs text-gray-300 mt-1">{videoError}</p>
              <button 
                onClick={() => {
                  setVideoError(null);
                  if (videoRef.current) {
                    videoRef.current.load();
                  }
                }}
                className="mt-2 px-3 py-1 bg-blue-600 text-white text-xs rounded hover:bg-blue-700"
              >
                Retry
              </button>
            </div>
          </div>
        )}
        <video
          ref={videoRef}
          src={videoUrl}
          className="w-full h-auto max-h-96 object-contain"
          onTimeUpdate={handleTimeUpdate}
          onLoadedMetadata={handleLoadedMetadata}
          onPlay={() => setIsPlaying(true)}
          onPause={() => setIsPlaying(false)}
          onError={handleVideoError}
          onCanPlay={handleCanPlay}
          autoPlay={autoPlay}
          muted={isMuted}
          preload="metadata"
          crossOrigin="anonymous"
        />

        {/* Video Controls Overlay */}
        {showControls && (
          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-4">
            {/* Progress Bar */}
            <div 
              className="w-full h-1 bg-white/30 rounded-full cursor-pointer mb-3"
              onClick={handleSeek}
            >
              <div 
                className="h-full bg-white rounded-full transition-all duration-200"
                style={{ width: `${progressPercentage}%` }}
              />
            </div>

            {/* Control Buttons */}
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <button
                  onClick={handlePlayPause}
                  className="text-white hover:text-gray-300 transition-colors"
                >
                  {isPlaying ? (
                    <Pause className="h-6 w-6" />
                  ) : (
                    <Play className="h-6 w-6" />
                  )}
                </button>

                <button
                  onClick={handleMuteToggle}
                  className="text-white hover:text-gray-300 transition-colors"
                >
                  {isMuted ? (
                    <VolumeX className="h-5 w-5" />
                  ) : (
                    <Volume2 className="h-5 w-5" />
                  )}
                </button>

                <span className="text-white text-sm">
                  {formatTime(currentTime)} / {formatTime(duration)}
                </span>
              </div>

              <div className="flex items-center space-x-2">
                <button
                  onClick={handleDownload}
                  className="text-white hover:text-gray-300 transition-colors"
                  title="Download video"
                >
                  <Download className="h-5 w-5" />
                </button>

                <button
                  onClick={handleFullscreen}
                  className="text-white hover:text-gray-300 transition-colors"
                  title="Fullscreen"
                >
                  <Maximize className="h-5 w-5" />
                </button>

                {onDelete && (
                  <button
                    onClick={handleDelete}
                    disabled={isLoading}
                    className="text-red-400 hover:text-red-300 transition-colors disabled:opacity-50"
                    title="Delete video"
                  >
                    <Trash2 className="h-5 w-5" />
                  </button>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Video Info */}
      <div className="p-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-medium text-gray-900">
              {video.filename || 'Profile Video'}
            </h3>
            <p className="text-sm text-gray-500">
              Uploaded on {new Date(video.createdAt).toLocaleDateString()}
            </p>
          </div>
          <div className="text-sm text-gray-500">
            {video.size && (
              <span>{(video.size / (1024 * 1024)).toFixed(1)} MB</span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default VideoDisplay;