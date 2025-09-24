import React, { useState, useRef } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../contexts/AuthContext';
import { api } from '../services/api';
import { Upload, Video, X, Play, Trash2 } from 'lucide-react';
import VideoDisplay from './VideoDisplay';
import toast from 'react-hot-toast';

const VideoUpload = ({ userVideos = [], onVideoUpdate }) => {
  const { user } = useAuth();
  
  // Check if user is basic (no subscription or basic tier)
  const isBasicUser = user?.subscription?.tier === 'BASIC' || !user?.subscription;
  const videoLimit = isBasicUser ? 1 : -1; // -1 means unlimited
  const currentVideoCount = userVideos.length;
  const canUploadMore = videoLimit === -1 || currentVideoCount < videoLimit;
  const [isDragging, setIsDragging] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [videoData, setVideoData] = useState({
    title: '',
    description: '',
    tags: ''
  });
  const fileInputRef = useRef(null);
  const queryClient = useQueryClient();

  // Upload video mutation
  const uploadVideoMutation = useMutation({
    mutationFn: api.media.uploadVideo,
    onSuccess: (data) => {
      toast.success('Video uploaded successfully!');
      setIsUploading(false);
      setUploadProgress(0);
      setVideoData({ title: '', description: '', tags: '' });
      queryClient.invalidateQueries(['userVideos', user?.id]);
      if (onVideoUpdate) {
        onVideoUpdate();
      }
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to upload video');
      setIsUploading(false);
      setUploadProgress(0);
    },
  });

  // Delete video mutation
  const deleteVideoMutation = useMutation({
    mutationFn: api.media.deleteVideo,
    onSuccess: () => {
      toast.success('Video deleted successfully!');
      queryClient.invalidateQueries(['userVideos', user?.id]);
      if (onVideoUpdate) {
        onVideoUpdate();
      }
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to delete video');
    },
  });

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      handleFileSelect(files[0]);
    }
  };

  const handleFileSelect = (file) => {
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('video/')) {
      toast.error('Please select a video file');
      return;
    }

    // Validate file size (500MB limit)
    if (file.size > 500 * 1024 * 1024) {
      toast.error('Video file must be less than 500MB');
      return;
    }

    uploadVideo(file);
  };

  const uploadVideo = (file) => {
    setIsUploading(true);
    setUploadProgress(0);

    const formData = new FormData();
    formData.append('video', file);
    formData.append('title', videoData.title || file.name);
    formData.append('description', videoData.description);
    formData.append('tags', videoData.tags);

    // Simulate progress for better UX
    const progressInterval = setInterval(() => {
      setUploadProgress(prev => {
        if (prev >= 90) {
          clearInterval(progressInterval);
          return prev;
        }
        return prev + 10;
      });
    }, 200);

    uploadVideoMutation.mutate(formData);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setVideoData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleDeleteVideo = (videoId) => {
    if (window.confirm('Are you sure you want to delete this video?')) {
      deleteVideoMutation.mutate(videoId);
    }
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  return (
    <div className="space-y-6">
      {/* Upload Section */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Upload Video</h3>
          {isBasicUser && (
            <div className="text-sm text-gray-600">
              {currentVideoCount}/{videoLimit} video{videoLimit !== 1 ? 's' : ''} used
            </div>
          )}
        </div>
        
        {/* Video Limit Warning for Basic Users */}
        {isBasicUser && !canUploadMore && (
          <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-md">
            <div className="flex items-center">
              <Video className="h-5 w-5 text-amber-600 mr-2" />
              <div>
                <p className="text-sm font-medium text-amber-800">
                  Video Upload Limit Reached
                </p>
                <p className="text-sm text-amber-700">
                  Basic users can upload up to {videoLimit} video. Upgrade to Premium for unlimited uploads.
                </p>
              </div>
            </div>
          </div>
        )}
        
        {/* Video Details Form */}
        <div className="space-y-4 mb-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Video Title
            </label>
            <input
              type="text"
              name="title"
              value={videoData.title}
              onChange={handleInputChange}
              placeholder="Enter video title"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description
            </label>
            <textarea
              name="description"
              value={videoData.description}
              onChange={handleInputChange}
              placeholder="Describe your video..."
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Tags (comma-separated)
            </label>
            <input
              type="text"
              name="tags"
              value={videoData.tags}
              onChange={handleInputChange}
              placeholder="skills, goals, highlights"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>
        </div>

        {/* Upload Area */}
        <div
          className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
            !canUploadMore
              ? 'border-gray-200 bg-gray-50 cursor-not-allowed'
              : isDragging
              ? 'border-primary-500 bg-primary-50'
              : 'border-gray-300 hover:border-gray-400'
          }`}
          onDragOver={canUploadMore ? handleDragOver : undefined}
          onDragLeave={canUploadMore ? handleDragLeave : undefined}
          onDrop={canUploadMore ? handleDrop : undefined}
        >
          {isUploading ? (
            <div className="space-y-4">
              <Video className="mx-auto h-12 w-12 text-primary-600" />
              <div>
                <p className="text-lg font-medium text-gray-900">Uploading video...</p>
                <div className="mt-2 bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-primary-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${uploadProgress}%` }}
                  />
                </div>
                <p className="text-sm text-gray-500 mt-1">{uploadProgress}% complete</p>
              </div>
            </div>
          ) : !canUploadMore ? (
            <div className="space-y-4">
              <Upload className="mx-auto h-12 w-12 text-gray-300" />
              <div>
                <p className="text-lg font-medium text-gray-500">
                  Video upload limit reached
                </p>
                <p className="text-sm text-gray-400">
                  Upgrade to Premium for unlimited video uploads
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <Upload className="mx-auto h-12 w-12 text-gray-400" />
              <div>
                <p className="text-lg font-medium text-gray-900">
                  Drop your video here, or{' '}
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="text-primary-600 hover:text-primary-500"
                  >
                    browse
                  </button>
                </p>
                <p className="text-sm text-gray-500">
                  Supports MP4, MOV, AVI files up to 500MB
                </p>
              </div>
            </div>
          )}
        </div>

        <input
          ref={fileInputRef}
          type="file"
          accept="video/*"
          onChange={(e) => handleFileSelect(e.target.files[0])}
          className="hidden"
          disabled={!canUploadMore}
        />
      </div>

      {/* Videos Display */}
      {userVideos && userVideos.length > 0 && (
        <div className="space-y-6">
          <h3 className="text-lg font-semibold text-gray-900">Your Profile Videos</h3>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {userVideos.map((video) => (
              <VideoDisplay
                key={video.id}
                video={{
                  ...video,
                  url: `http://localhost:5000${video.url}`
                }}
                onDelete={handleDeleteVideo}
                showControls={true}
                autoPlay={false}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default VideoUpload;