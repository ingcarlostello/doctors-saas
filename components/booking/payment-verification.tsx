"use client"

import type React from "react"

import { useState, useCallback } from "react"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Upload, CheckCircle2, FileImage, X } from "lucide-react"
import { cn } from "@/lib/utils"

interface PaymentVerificationProps {
  onBack: () => void
}

export function PaymentVerification({ onBack }: PaymentVerificationProps) {
  const [uploadedFile, setUploadedFile] = useState<File | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [isSubmitted, setIsSubmitted] = useState(false)

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
  }, [])

  const handleDragIn = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.dataTransfer.items && e.dataTransfer.items.length > 0) {
      setIsDragging(true)
    }
  }, [])

  const handleDragOut = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      setUploadedFile(e.dataTransfer.files[0])
    }
  }, [])

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setUploadedFile(e.target.files[0])
    }
  }

  const handleSubmit = () => {
    setIsSubmitted(true)
  }

  const removeFile = () => {
    setUploadedFile(null)
  }

  if (isSubmitted) {
    return (
      <Card className="border border-border bg-card">
        <CardContent className="flex flex-col items-center py-12 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-success/10">
            <CheckCircle2 className="h-8 w-8 text-success" />
          </div>
          <h2 className="mt-4 text-xl font-semibold text-foreground">Booking Submitted!</h2>
          <p className="mt-2 text-sm text-muted-foreground max-w-xs">
            Your payment receipt has been submitted for verification. You will receive a WhatsApp confirmation within 24
            hours.
          </p>
          <Button className="mt-6" onClick={() => (window.location.href = "/")}>
            Return to Home
          </Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="border border-border bg-card">
      <CardHeader className="pb-4">
        <CardTitle className="text-lg text-foreground">Payment Verification</CardTitle>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Payment Instructions */}
        <div className="rounded-lg bg-secondary p-4">
          <h3 className="text-sm font-medium text-foreground">Payment Instructions</h3>
          <p className="mt-2 text-sm text-muted-foreground">
            Please send your payment via one of the following methods:
          </p>
          <div className="mt-3 space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Zelle</span>
              <span className="font-medium text-foreground">payments@nexcare.com</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Venmo</span>
              <span className="font-medium text-foreground">@NexCare-DrMitchell</span>
            </div>
          </div>
        </div>

        {/* Upload Zone */}
        <div className="space-y-3">
          <h3 className="text-sm font-medium text-foreground">Upload Payment Receipt</h3>

          {!uploadedFile ? (
            <div
              onDragEnter={handleDragIn}
              onDragLeave={handleDragOut}
              onDragOver={handleDrag}
              onDrop={handleDrop}
              className={cn(
                "flex flex-col items-center justify-center rounded-lg border-2 border-dashed p-8 transition-colors",
                isDragging ? "border-primary bg-primary/5" : "border-border hover:border-primary/50",
              )}
            >
              <Upload className="h-8 w-8 text-muted-foreground" />
              <p className="mt-2 text-sm font-medium text-foreground">Drag & drop your receipt here</p>
              <p className="text-xs text-muted-foreground">or</p>
              <label htmlFor="file-upload">
                <Button variant="outline" size="sm" className="mt-2 bg-transparent" asChild>
                  <span>Browse Files</span>
                </Button>
                <input
                  id="file-upload"
                  type="file"
                  className="sr-only"
                  accept="image/*,.pdf"
                  onChange={handleFileChange}
                />
              </label>
              <p className="mt-2 text-xs text-muted-foreground">PNG, JPG or PDF up to 10MB</p>
            </div>
          ) : (
            <div className="flex items-center gap-3 rounded-lg border border-border bg-secondary/50 p-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                <FileImage className="h-5 w-5 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="truncate text-sm font-medium text-foreground">{uploadedFile.name}</p>
                <p className="text-xs text-muted-foreground">{(uploadedFile.size / 1024).toFixed(1)} KB</p>
              </div>
              <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0" onClick={removeFile}>
                <X className="h-4 w-4" />
                <span className="sr-only">Remove file</span>
              </Button>
            </div>
          )}
        </div>

        {/* Disclaimer */}
        <p className="text-xs text-muted-foreground leading-relaxed">
          By submitting this form, you agree to our cancellation policy. Refunds are available up to 24 hours before
          your scheduled appointment. A 20% administrative fee applies to all refunds. For questions, contact
          support@nexcare.com.
        </p>
      </CardContent>

      <CardFooter className="flex gap-3 pt-4">
        <Button variant="outline" className="flex-1 bg-transparent" onClick={onBack}>
          Back
        </Button>
        <Button className="flex-1" onClick={handleSubmit} disabled={!uploadedFile}>
          Submit for Verification
        </Button>
      </CardFooter>
    </Card>
  )
}
