"use client";

import type { VerificationEvidenceDto } from "@globalscout/shared";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  CheckCircle2,
  ExternalLink,
  FileText,
  Link2,
  Loader2,
  Upload,
} from "lucide-react";
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
import { formatEvidenceType } from "@/features/admin/formatters";
import {
  addLinkEvidenceSchema,
  type AddLinkEvidenceFormValues,
} from "@/lib/validation/player-identity";

type EvidenceUploadProps = {
  onFileUpload: (file: File, type: AddLinkEvidenceFormValues["type"]) => Promise<void>;
  onLinkSubmit: (values: AddLinkEvidenceFormValues) => Promise<void>;
  evidence?: VerificationEvidenceDto[];
  disabled?: boolean;
};

function fileNameFromStorageKey(storageKey: string): string {
  const parts = storageKey.split("/");
  return parts[parts.length - 1] || storageKey;
}

function isFileEvidence(item: VerificationEvidenceDto): boolean {
  return Boolean(item.storageKey);
}

function evidenceLabel(item: VerificationEvidenceDto): string {
  if (item.url) {
    return item.url;
  }

  if (item.storageKey) {
    return fileNameFromStorageKey(item.storageKey);
  }

  return "Uploaded file";
}

function EvidenceTypeSelectLabel({
  value,
}: {
  value: AddLinkEvidenceFormValues["type"];
}) {
  const option = EVIDENCE_TYPE_OPTIONS.find((item) => item.value === value);
  return <>{option?.label ?? value}</>;
}

function SubmittedEvidenceList({
  evidence,
}: {
  evidence: VerificationEvidenceDto[];
}) {
  if (evidence.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-gray-200 bg-gray-50 px-4 py-5 text-center">
        <p className="text-sm font-medium text-gray-700">No evidence added yet</p>
        <p className="mt-1 text-sm text-muted-foreground">
          Upload a document or add a link below to support your claim.
        </p>
      </div>
    );
  }

  return (
    <ul className="space-y-3">
      {evidence.map((item) => {
        const isFile = isFileEvidence(item);
        const label = evidenceLabel(item);

        return (
          <li key={item.id}>
            <div className="flex items-start gap-3 rounded-lg border border-green-200 bg-green-50/70 px-4 py-3">
              <div
                className={
                  isFile
                    ? "rounded-lg bg-blue-50 p-2 text-blue-600"
                    : "rounded-lg bg-violet-50 p-2 text-violet-600"
                }
              >
                {isFile ? (
                  <FileText className="h-4 w-4" aria-hidden />
                ) : (
                  <ExternalLink className="h-4 w-4" aria-hidden />
                )}
              </div>

              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-medium text-gray-900">
                    {formatEvidenceType(String(item.type))}
                  </p>
                  <CheckCircle2
                    className="h-4 w-4 shrink-0 text-green-600"
                    aria-hidden
                  />
                </div>
                {item.url ? (
                  <a
                    href={item.url}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-0.5 block truncate text-sm text-primary underline-offset-4 hover:underline"
                  >
                    {label}
                  </a>
                ) : (
                  <p className="mt-0.5 truncate text-sm text-gray-700">{label}</p>
                )}
                {item.note ? (
                  <p className="mt-1 text-sm text-muted-foreground">{item.note}</p>
                ) : null}
                <p className="mt-1 text-xs text-green-700">
                  {isFile ? "File uploaded" : "Link added"}
                </p>
              </div>
            </div>
          </li>
        );
      })}
    </ul>
  );
}

export function EvidenceUpload({
  onFileUpload,
  onLinkSubmit,
  evidence = [],
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
    <div className="mb-8 space-y-6">
      <Card className="border-0 shadow-sm">
        <CardHeader>
          <CardTitle className="text-lg">Upload verification evidence</CardTitle>
          <p className="text-sm text-muted-foreground">
            Submit at least one document or link so our team can verify this
            profile belongs to you.
          </p>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-3">
            <div className="flex items-center justify-between gap-3">
              <p className="text-sm font-medium text-gray-900">Added evidence</p>
              {evidence.length > 0 ? (
                <p className="text-sm text-green-700">
                  {evidence.length} item{evidence.length === 1 ? "" : "s"} ready
                </p>
              ) : null}
            </div>
            <SubmittedEvidenceList evidence={evidence} />
          </div>

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
                <SelectValue>
                  <EvidenceTypeSelectLabel value={fileType} />
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {EVIDENCE_TYPE_OPTIONS.filter(
                  (option) =>
                    !["ProfileUrl", "SocialAccount"].includes(option.value),
                ).map((option) => (
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
                        <SelectValue>
                          <EvidenceTypeSelectLabel value={field.value} />
                        </SelectValue>
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
