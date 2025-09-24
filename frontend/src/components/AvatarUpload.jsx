import React, { useState, useRef } from 'react';
import { Camera, Upload, X } from 'lucide-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../services/api';
import toast from 'react-hot-toast';

const AvatarUpload = ({ currentAvatar, onAvatarUpdate, size = 'large' }) => {
  const [isUploading, setIsUploading] = useState(false);
  const [preview, setPreview] = useState(null);
  const fileInputRef = useRef(null);
  const queryClient = useQueryClient();

  const uploadMutation = useMutation({
    mutationFn: (formData) => api.users.uploadAvatar(formData),
    onSuccess: (data) => {
      toast.success('Profielfoto succesvol geüpload!');
      setPreview(null);
      setIsUploading(false);
      onAvatarUpdate?.(data.avatar);
      // Update the query cache
      queryClient.invalidateQueries(['profile']);
    },
    onError: (error) => {
      toast.error(error.response?.data?.error || 'Fout bij uploaden van foto');
      setIsUploading(false);
      setPreview(null);
    }
  });

  const handleFileSelect = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif'];
    if (!allowedTypes.includes(file.type)) {
      toast.error('Alleen JPEG, PNG en GIF bestanden zijn toegestaan');
      return;
    }

    // Validate file size (5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Bestand is te groot. Maximum grootte is 5MB');
      return;
    }

    // Create preview
    const reader = new FileReader();
    reader.onload = (e) => {
      setPreview(e.target.result);
    };
    reader.readAsDataURL(file);

    // Upload file
    setIsUploading(true);
    const formData = new FormData();
    formData.append('avatar', file);
    uploadMutation.mutate(formData);
  };

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  const handleCancelPreview = () => {
    setPreview(null);
    setIsUploading(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const sizeClasses = {
    small: 'w-16 h-16',
    medium: 'w-24 h-24',
    large: 'w-32 h-32'
  };

  const iconSizes = {
    small: 'w-4 h-4',
    medium: 'w-5 h-5',
    large: 'w-6 h-6'
  };

  const avatarSrc = preview || (currentAvatar ? `http://localhost:5000${currentAvatar}` : null);

  return (
    <div className="flex flex-col items-center space-y-4">
      <div className="relative">
        <div 
          className={`${sizeClasses[size]} rounded-full border-2 border-gray-300 overflow-hidden cursor-pointer hover:border-blue-500 transition-colors bg-gray-100 flex items-center justify-center`}
          onClick={handleClick}
        >
          {avatarSrc ? (
            <img 
              src={avatarSrc} 
              alt="Avatar" 
              className="w-full h-full object-cover"
            />
          ) : (
            <Camera className={`${iconSizes[size]} text-gray-400`} />
          )}
          
          {/* Upload overlay */}
          <div className="absolute inset-0 bg-black bg-opacity-0 hover:bg-opacity-30 transition-all duration-200 flex items-center justify-center">
            <Upload className={`${iconSizes[size]} text-white opacity-0 hover:opacity-100 transition-opacity`} />
          </div>
        </div>

        {/* Loading indicator */}
        {isUploading && (
          <div className="absolute inset-0 bg-black bg-opacity-50 rounded-full flex items-center justify-center">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white"></div>
          </div>
        )}

        {/* Cancel preview button */}
        {preview && !isUploading && (
          <button
            onClick={handleCancelPreview}
            className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 transition-colors"
          >
            <X className="w-3 h-3" />
          </button>
        )}
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/jpg,image/png,image/gif"
        onChange={handleFileSelect}
        className="hidden"
      />

      <div className="text-center">
        <button
          onClick={handleClick}
          disabled={isUploading}
          className="text-sm text-blue-600 hover:text-blue-800 disabled:text-gray-400"
        >
          {isUploading ? 'Uploaden...' : 'Foto wijzigen'}
        </button>
        <p className="text-xs text-gray-500 mt-1">
          JPEG, PNG, GIF (max 5MB)
        </p>
      </div>
    </div>
  );
};

export default AvatarUpload;