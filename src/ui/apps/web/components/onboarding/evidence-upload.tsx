"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, Link2, Upload } from "lucide-react";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { EVIDENCE_TYPE_OPTIONS } from "@/features/onboarding/player/constants";
import {
  addLinkEvidenceSchema,
  type AddLinkEvidenceFormValues,
} from "@/lib/validation/player-identity";

type EvidenceUploadProps = {
  onFileUpload: (file: File, type: AddLinkEvidenceFormValues["type"]) => Promise<void>;
  onLinkSubmit: (values: AddLinkEvidenceFormValues) => Promise<void>;
  uploadedCount?: number;
  disabled?: boolean;
};

export function EvidenceUpload({
  onFileUpload,
  onLinkSubmit,
  uploadedCount = 0,
  disabled = false,
}: EvidenceUploadProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [fileType, setFileType] =
    useState<AddLinkEvidenceFormValues["type"]>("RosterListing");
  const [isUploadingFile, setIsUploadingFile] = useState(false);

  const linkForm = useForm<AddLinkEvidenceFormValues>({
    resolver: zodResolver(addLinkEvidenceSchema),
    defaultValues: {
      type: "ProfileUrl",
      url: "",
      note: "",
    },
  });

  async function handleFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    setIsUploadingFile(true);
    try {
      await onFileUpload(file, fileType);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    } finally {
      setIsUploadingFile(false);
    }
  }

  async function handleLinkSubmit(values: AddLinkEvidenceFormValues) {
    await onLinkSubmit(values);
    linkForm.reset({
      type: "ProfileUrl",
      url: "",
      note: "",
    });
  }

  return (
    <div className="space-y-6">
      <Card className="border-0 shadow-sm">
        <CardHeader>
          <CardTitle className="text-lg">Upload verification evidence</CardTitle>
          <p className="text-sm text-muted-foreground">
            Submit at least one document or link to support your claim.{" "}
            {uploadedCount > 0
              ? `${uploadedCount} item${uploadedCount === 1 ? "" : "s"} added.`
              : null}
          </p>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-3">
            <FieldLabel htmlFor="evidence-file-type">Document type</FieldLabel>
            <Select
              value={fileType}
              onValueChange={(value) =>
                setFileType(value as AddLinkEvidenceFormValues["type"])
              }
              disabled={disabled || isUploadingFile}
            >
              <SelectTrigger id="evidence-file-type" className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {EVIDENCE_TYPE_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <input
              ref={fileInputRef}
              type="file"
              className="hidden"
              onChange={handleFileChange}
              disabled={disabled || isUploadingFile}
            />

            <Button
              type="button"
              variant="outline"
              className="w-full"
              disabled={disabled || isUploadingFile}
              onClick={() => fileInputRef.current?.click()}
            >
              {isUploadingFile ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Upload className="h-4 w-4" />
              )}
              {isUploadingFile ? "Uploading..." : "Upload file"}
            </Button>
          </div>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-card px-2 text-muted-foreground">
                Or submit a link
              </span>
            </div>
          </div>

          <form
            onSubmit={(event) => {
              event.preventDefault();
              void linkForm.handleSubmit(handleLinkSubmit)(event);
            }}
          >
            <FieldGroup className="space-y-4">
              <Controller
                name="type"
                control={linkForm.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor="evidence-link-type">Link type</FieldLabel>
                    <Select
                      value={field.value}
                      onValueChange={field.onChange}
                      disabled={disabled || linkForm.formState.isSubmitting}
                    >
                      <SelectTrigger
                        id="evidence-link-type"
                        className="w-full"
                        aria-invalid={fieldState.invalid}
                      >
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {EVIDENCE_TYPE_OPTIONS.filter((option) =>
                          ["ProfileUrl", "SocialAccount", "RosterListing"].includes(
                            option.value,
                          ),
                        ).map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {fieldState.invalid ? (
                      <FieldError errors={[fieldState.error]} />
                    ) : null}
                  </Field>
                )}
              />

              <Controller
                name="url"
                control={linkForm.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor="evidence-link-url">URL</FieldLabel>
                    <Input
                      {...field}
                      id="evidence-link-url"
                      placeholder="https://..."
                      aria-invalid={fieldState.invalid}
                      disabled={disabled || linkForm.formState.isSubmitting}
                    />
                    {fieldState.invalid ? (
                      <FieldError errors={[fieldState.error]} />
                    ) : null}
                  </Field>
                )}
              />

              <Controller
                name="note"
                control={linkForm.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor="evidence-link-note">
                      Note{" "}
                      <span className="font-normal text-muted-foreground">
                        (optional)
                      </span>
                    </FieldLabel>
                    <Input
                      {...field}
                      id="evidence-link-note"
                      value={field.value ?? ""}
                      placeholder="Brief description"
                      aria-invalid={fieldState.invalid}
                      disabled={disabled || linkForm.formState.isSubmitting}
                    />
                    {fieldState.invalid ? (
                      <FieldError errors={[fieldState.error]} />
                    ) : null}
                  </Field>
                )}
              />

              <Button
                type="submit"
                variant="secondary"
                className="w-full"
                disabled={disabled || linkForm.formState.isSubmitting}
              >
                {linkForm.formState.isSubmitting ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Link2 className="h-4 w-4" />
                )}
                {linkForm.formState.isSubmitting
                  ? "Submitting link..."
                  : "Add link evidence"}
              </Button>
            </FieldGroup>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
