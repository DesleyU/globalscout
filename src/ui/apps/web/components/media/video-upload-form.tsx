"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, Upload, Video } from "lucide-react";
import { useRef, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  Progress,
  ProgressIndicator,
  ProgressTrack,
  ProgressValue,
} from "@/components/ui/progress";
import {
  BASIC_VIDEO_LIMIT,
  isBasicAccount,
  validateVideoFile,
  videoUploadFormSchema,
  type VideoUploadFormValues,
} from "@/lib/validation/media";
import { cn } from "@/lib/utils";

type VideoUploadFormProps = {
  accountType?: string | null;
  currentVideoCount: number;
  disabled?: boolean;
  onUpload: (input: {
    file: File;
    metadata: VideoUploadFormValues;
    onProgress: (progress: number) => void;
  }) => Promise<void>;
};

export function VideoUploadForm({
  accountType,
  currentVideoCount,
  disabled = false,
  onUpload,
}: VideoUploadFormProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [fileError, setFileError] = useState<string | null>(null);

  const basicAccount = isBasicAccount(accountType);
  const videoLimit = basicAccount ? BASIC_VIDEO_LIMIT : null;
  const canUploadMore =
    videoLimit === null || currentVideoCount < videoLimit;

  const form = useForm<VideoUploadFormValues>({
    resolver: zodResolver(videoUploadFormSchema),
    defaultValues: {
      title: "",
      description: "",
      tags: "",
    },
  });

  function handleFile(file: File) {
    const validationError = validateVideoFile(file);
    if (validationError) {
      setFileError(validationError);
      setSelectedFile(null);
      return;
    }

    setFileError(null);
    setSelectedFile(file);
  }

  function handleFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (file) {
      handleFile(file);
    }
  }

  function handleDrop(event: React.DragEvent<HTMLDivElement>) {
    event.preventDefault();
    setIsDragging(false);

    const file = event.dataTransfer.files[0];
    if (file) {
      handleFile(file);
    }
  }

  async function handleSubmit(values: VideoUploadFormValues) {
    if (!selectedFile) {
      setFileError("Choose a video file to upload.");
      return;
    }

    setIsUploading(true);
    setUploadProgress(0);

    try {
      await onUpload({
        file: selectedFile,
        metadata: values,
        onProgress: setUploadProgress,
      });
      setSelectedFile(null);
      setUploadProgress(0);
      form.reset();
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    } finally {
      setIsUploading(false);
    }
  }

  return (
    <Card className="border-0 shadow-sm">
      <CardHeader>
        <CardTitle className="text-lg">Upload highlight video</CardTitle>
        <p className="text-sm text-muted-foreground">
          MP4, MOV, or AVI up to 500 MB.
          {videoLimit !== null
            ? ` Basic accounts can upload ${videoLimit} video.`
            : " Premium accounts can upload unlimited videos."}
        </p>
      </CardHeader>
      <CardContent className="space-y-6">
        {!canUploadMore ? (
          <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
            You have reached your video upload limit. Upgrade to Premium to add
            more highlights.
          </div>
        ) : null}

        <div
          className={cn(
            "rounded-xl border-2 border-dashed p-8 text-center transition-colors",
            isDragging
              ? "border-primary bg-primary/5"
              : "border-muted-foreground/25",
            disabled || isUploading || !canUploadMore
              ? "pointer-events-none opacity-60"
              : "cursor-pointer hover:border-primary/50",
          )}
          onDragOver={(event) => {
            event.preventDefault();
            setIsDragging(true);
          }}
          onDragLeave={(event) => {
            event.preventDefault();
            setIsDragging(false);
          }}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          role="button"
          tabIndex={0}
          onKeyDown={(event) => {
            if (event.key === "Enter" || event.key === " ") {
              event.preventDefault();
              fileInputRef.current?.click();
            }
          }}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept="video/mp4,video/quicktime,video/x-msvideo,.mp4,.mov,.avi"
            className="hidden"
            onChange={handleFileChange}
            disabled={disabled || isUploading || !canUploadMore}
          />
          <Video className="mx-auto mb-3 h-10 w-10 text-muted-foreground" />
          <p className="font-medium text-foreground">
            {selectedFile ? selectedFile.name : "Drag and drop a video here"}
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            or click to browse your files
          </p>
        </div>

        {fileError ? (
          <p className="text-sm text-destructive">{fileError}</p>
        ) : null}

        <form
          onSubmit={(event) => {
            event.preventDefault();
            void form.handleSubmit(handleSubmit)(event);
          }}
        >
          <FieldGroup className="space-y-4">
            <Controller
              name="title"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor="video-title">Title</FieldLabel>
                  <Input
                    {...field}
                    id="video-title"
                    placeholder="Match highlights"
                    disabled={disabled || isUploading || !canUploadMore}
                  />
                  {fieldState.invalid ? (
                    <FieldError errors={[fieldState.error]} />
                  ) : null}
                </Field>
              )}
            />

            <Controller
              name="description"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor="video-description">Description</FieldLabel>
                  <textarea
                    {...field}
                    id="video-description"
                    rows={3}
                    placeholder="Brief summary of the clip"
                    disabled={disabled || isUploading || !canUploadMore}
                    className="flex min-h-20 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-xs outline-none transition-colors placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-50"
                  />
                  {fieldState.invalid ? (
                    <FieldError errors={[fieldState.error]} />
                  ) : null}
                </Field>
              )}
            />

            <Controller
              name="tags"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor="video-tags">Tags</FieldLabel>
                  <Input
                    {...field}
                    id="video-tags"
                    placeholder="goals, skills, match"
                    disabled={disabled || isUploading || !canUploadMore}
                  />
                  {fieldState.invalid ? (
                    <FieldError errors={[fieldState.error]} />
                  ) : null}
                </Field>
              )}
            />

            {isUploading ? (
              <Progress value={uploadProgress}>
                <ProgressTrack>
                  <ProgressIndicator />
                </ProgressTrack>
                <ProgressValue />
              </Progress>
            ) : null}

            <Button
              type="submit"
              className="w-full"
              disabled={
                disabled || isUploading || !canUploadMore || !selectedFile
              }
            >
              {isUploading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Upload className="h-4 w-4" />
              )}
              {isUploading ? `Uploading ${uploadProgress}%` : "Upload video"}
            </Button>
          </FieldGroup>
        </form>
      </CardContent>
    </Card>
  );
}
