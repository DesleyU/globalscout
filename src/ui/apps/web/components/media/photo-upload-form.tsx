"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Image as ImageIcon, Loader2, Upload } from "lucide-react";
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
  BASIC_PHOTO_LIMIT,
  isBasicAccount,
  photoUploadFormSchema,
  validatePhotoFile,
  type PhotoUploadFormValues,
} from "@/lib/validation/media";
import { cn } from "@/lib/utils";

type PhotoUploadFormProps = {
  accountType?: string | null;
  currentPhotoCount: number;
  disabled?: boolean;
  onUpload: (input: {
    file: File;
    metadata: PhotoUploadFormValues;
    onProgress: (progress: number) => void;
  }) => Promise<void>;
};

export function PhotoUploadForm({
  accountType,
  currentPhotoCount,
  disabled = false,
  onUpload,
}: PhotoUploadFormProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [fileError, setFileError] = useState<string | null>(null);

  const basicAccount = isBasicAccount(accountType);
  const photoLimit = basicAccount ? BASIC_PHOTO_LIMIT : null;
  const canUploadMore =
    photoLimit === null || currentPhotoCount < photoLimit;

  const form = useForm<PhotoUploadFormValues>({
    resolver: zodResolver(photoUploadFormSchema),
    defaultValues: {
      title: "",
      description: "",
      tags: "",
    },
  });

  function handleFile(file: File) {
    const validationError = validatePhotoFile(file);
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

  async function handleSubmit(values: PhotoUploadFormValues) {
    if (!selectedFile) {
      setFileError("Choose a photo to upload.");
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
        <CardTitle className="text-lg">Upload photo</CardTitle>
        <p className="text-sm text-muted-foreground">
          JPG, PNG, or WebP up to 15 MB.
          {photoLimit !== null
            ? ` Basic accounts can upload ${photoLimit} photos.`
            : " Premium accounts can upload unlimited photos."}
        </p>
      </CardHeader>
      <CardContent className="space-y-6">
        {!canUploadMore ? (
          <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
            You have reached your photo upload limit. Upgrade to Premium to
            add more photos.
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
            accept="image/jpeg,image/png,image/webp,.jpg,.jpeg,.png,.webp"
            className="hidden"
            onChange={handleFileChange}
            disabled={disabled || isUploading || !canUploadMore}
          />
          <ImageIcon className="mx-auto mb-3 h-10 w-10 text-muted-foreground" />
          <p className="font-medium text-foreground">
            {selectedFile ? selectedFile.name : "Drag and drop a photo here"}
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
                  <FieldLabel htmlFor="photo-title">Title</FieldLabel>
                  <Input
                    {...field}
                    id="photo-title"
                    placeholder="Pre-season training"
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
                  <FieldLabel htmlFor="photo-description">Description</FieldLabel>
                  <textarea
                    {...field}
                    id="photo-description"
                    rows={3}
                    placeholder="Brief summary of the photo"
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
                  <FieldLabel htmlFor="photo-tags">Tags</FieldLabel>
                  <Input
                    {...field}
                    id="photo-tags"
                    placeholder="training, matchday, team"
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
              {isUploading ? `Uploading ${uploadProgress}%` : "Upload photo"}
            </Button>
          </FieldGroup>
        </form>
      </CardContent>
    </Card>
  );
}
