"use client"

import * as React from "react"
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useForm, Controller } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { documentsService } from "@/services/documents"
import { companiesService } from "@/services/companies"
import { contactsService } from "@/services/contacts"
import { dealsService } from "@/services/deals"
import { productsService } from "@/services/products"
import { ticketsService } from "@/services/tickets"
import { toast } from "sonner"
import { useAuth } from "@/hooks/use-auth"
import { Upload, FileText, X, Loader2 } from "lucide-react"
import { logAudit } from "@/lib/audit"

const documentSchema = z.object({
  title: z.string().min(1, "Title is required"),
  document_type: z.enum(["Proposal", "Contract", "Invoice", "General"]),
  documentable_type: z.enum(["company", "contact", "deal", "product", "ticket"]),
  documentable_id: z.string().uuid("Enter a valid record ID"),
})

type DocumentValues = z.infer<typeof documentSchema>

interface UploadDocumentSheetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess?: () => void
}

const documentableTypes = [
  { value: "company", label: "Company" },
  { value: "contact", label: "Contact" },
  { value: "deal", label: "Deal" },
  { value: "product", label: "Product" },
  { value: "ticket", label: "Ticket" },
]

export function UploadDocumentSheet({ open, onOpenChange, onSuccess }: UploadDocumentSheetProps) {
  const { workspaceId, user } = useAuth()
  const [file, setFile] = React.useState<File | null>(null)
  const [uploading, setUploading] = React.useState(false)
  const [uploadProgress, setUploadProgress] = React.useState<number | null>(null)
  const [relatedRecords, setRelatedRecords] = React.useState<any[]>([])
  const [loadingRecords, setLoadingRecords] = React.useState(false)
  const fileInputRef = React.useRef<HTMLInputElement>(null)

  const {
    register,
    handleSubmit,
    control,
    reset,
    setValue,
    watch,
    formState: { errors, isValid },
  } = useForm<DocumentValues>({
    resolver: zodResolver(documentSchema),
    mode: "onChange",
    defaultValues: {
      document_type: "General",
      documentable_type: "company",
      documentable_id: "",
    }
  })

  const documentableType = watch("documentable_type")
  const selectedRecordId = watch("documentable_id")

  const selectedRecord = React.useMemo(
    () => relatedRecords.find((record) => record.id === selectedRecordId) ?? null,
    [relatedRecords, selectedRecordId]
  )

  const getRecordLabel = React.useCallback((record: any, type: string) => {
    switch (type) {
      case "company":
        return record.company_name || record.name || record.title || record.id
      case "contact":
        return `${record.first_name || ""} ${record.last_name || ""}`.trim() || record.name || record.id
      case "deal":
        return record.title || record.name || record.id
      case "product":
        return record.name || record.title || record.id
      case "ticket":
        return record.subject || record.title || record.name || record.id
      default:
        return record.name || record.title || record.id
    }
  }, [])

  React.useEffect(() => {
    const fetchRecords = async () => {
      if (!workspaceId || !documentableType) {
        setRelatedRecords([])
        return
      }

      setLoadingRecords(true)
      try {
        let response
        const params = {
          workspace_id: workspaceId,
          limit: 25,
          page: 1,
        }

        switch (documentableType) {
          case "company":
            response = await companiesService.getAll(params)
            break
          case "contact":
            response = await contactsService.getAll(params)
            break
          case "deal":
            response = await dealsService.getAll({}, params)
            break
          case "product":
            response = await productsService.getAll(params)
            break
          case "ticket":
            response = await ticketsService.getAll(params)
            break
          default:
            response = { data: [], error: null }
        }

        setRelatedRecords(response?.data ?? [])
      } catch {
        setRelatedRecords([])
      } finally {
        setLoadingRecords(false)
      }
    }

    fetchRecords()
  }, [workspaceId, documentableType])

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0])
    }
  }

  const onSubmit = async (data: DocumentValues) => {
    if (!file) {
      toast.error("Please select a file to upload")
      return
    }

    setUploading(true)
    setUploadProgress(0)
    try {
      const { error: uploadError } = await documentsService.upload(file, {
        documentable_type: data.documentable_type,
        documentable_id: data.documentable_id,
        name: data.title,
        document_type: data.document_type,
      })

      if (uploadError) throw new Error(uploadError.message)

      toast.success(`Document "${data.title}" uploaded`)
      if (workspaceId) {
        logAudit({
          workspace_id: workspaceId,
          action: 'Upload',
          category: 'Document',
          subcategory: 'Document Uploaded',
          source: 'web',
          modifiedBy: user,
        })
      }
      reset()
      setFile(null)
      setUploadProgress(null)
      onSuccess?.()
      onOpenChange(false)
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to upload document")
    } finally {
      setUploading(false)
      setUploadProgress(null)
    }
  }

  React.useEffect(() => {
    if (!open) {
      reset()
      setFile(null)
      setUploadProgress(null)
    }
  }, [open, reset])

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="sm:max-w-md">
        <SheetHeader>
          <SheetTitle>Upload document</SheetTitle>
        </SheetHeader>
      <form onSubmit={handleSubmit(onSubmit)} className="gap-6 h-full flex flex-col">
        <p className="text-muted-foreground text-sm">Upload a proposal, contract, or other business document.</p>

        <div className="space-y-2">
          <Label className="text-foreground font-semibold after:content-['*'] after:ml-0.5 after:text-destructive">
            Document File
          </Label>
          <div
            onClick={() => fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-lg p-8 flex flex-col items-center justify-center cursor-pointer transition-colors ${file ? "border-primary bg-primary/5" : "border-border hover:border-primary hover:bg-muted"
              }`}
          >
            <input
              type="file"
              ref={fileInputRef}
              className="hidden"
              onChange={handleFileChange}
            />
            {file ? (
              <div className="flex flex-col items-center gap-2">
                <FileText className="h-10 w-10 text-primary" />
                <div className="text-center">
                  <p className="text-sm font-medium text-foreground">{file.name}</p>
                  <p className="text-xs text-muted-foreground">{(file.size / 1024).toFixed(1)} KB</p>
                </div>
                {uploading && uploadProgress !== null && (
                  <div className="w-full max-w-[200px]">
                    <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                      <div
                        className="h-full bg-primary rounded-full transition-all duration-300"
                        style={{ width: `${uploadProgress}%` }}
                      />
                    </div>
                  </div>
                )}
                <Button
                  variant="ghost"
                  size="sm"
                  className="mt-2 text-destructive hover:text-destructive/80 hover:bg-destructive/10"
                  onClick={(e) => {
                    e.stopPropagation()
                    setFile(null)
                  }}
                  disabled={uploading}
                >
                  <X className="h-4 w-4 mr-1" />
                  Remove
                </Button>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-2">
                <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center">
                  <Upload className="h-5 w-5 text-muted-foreground" />
                </div>
                <div className="text-center">
                  <p className="text-sm font-medium text-foreground">Click to upload or drag and drop</p>
                  <p className="text-xs text-muted-foreground">PDF, DOCX, XLSX up to 10MB</p>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="title" className="text-foreground font-semibold after:content-['*'] after:ml-0.5 after:text-destructive">
            Document Title
          </Label>
          <Input
            id="title"
            placeholder="e.g. Q4 Performance Proposal"
            className="border-border focus-visible:ring-primary"
            {...register("title")}
          />
          {errors.title && <p className="text-xs text-destructive">{errors.title.message}</p>}
        </div>

        <div className="space-y-2">
          <Label className="text-foreground font-semibold">Related record type</Label>
          <Controller
            name="documentable_type"
            control={control}
            render={({ field }) => (
              <Select onValueChange={(value) => {
                field.onChange(value)
                setValue("documentable_id", "")
              }} value={field.value}>
                <SelectTrigger className="border-border focus:ring-primary">
                  <SelectValue placeholder="Select record type" />
                </SelectTrigger>
                <SelectContent>
                  {documentableTypes.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          />
        </div>

        <div className="space-y-2">
          <Label className="text-foreground font-semibold">Related record</Label>
          <Controller
            name="documentable_id"
            control={control}
            render={({ field }) => (
              <Select onValueChange={field.onChange} value={field.value}>
                <SelectTrigger className="border-border focus:ring-primary">
                  <SelectValue placeholder="Select record" />
                </SelectTrigger>
                <SelectContent>
                  {loadingRecords ? (
                    <SelectItem value="" disabled>
                      Loading records...
                    </SelectItem>
                  ) : relatedRecords.length > 0 ? (
                    relatedRecords.map((record) => (
                      <SelectItem key={record.id} value={record.id}>
                        {getRecordLabel(record, documentableType)}
                      </SelectItem>
                    ))
                  ) : (
                    <SelectItem value="" disabled>
                      No records available
                    </SelectItem>
                  )}
                </SelectContent>
              </Select>
            )}
          />
          {selectedRecord && (
            <div className="rounded-lg border border-border bg-muted/50 p-3 text-sm text-foreground">
              Selected: {getRecordLabel(selectedRecord, documentableType)}
            </div>
          )}
          {errors.documentable_id && <p className="text-xs text-destructive">{errors.documentable_id.message}</p>}
        </div>

        <div className="space-y-2">
          <Label className="text-foreground font-semibold">Document Type</Label>
          <Controller
            name="document_type"
            control={control}
            render={({ field }) => (
              <Select onValueChange={field.onChange} value={field.value}>
                <SelectTrigger className="border-border focus:ring-primary">
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Proposal">Proposal</SelectItem>
                  <SelectItem value="Contract">Contract</SelectItem>
                  <SelectItem value="Invoice">Invoice</SelectItem>
                  <SelectItem value="General">General</SelectItem>
                </SelectContent>
              </Select>
            )}
          />
        </div>

        <div className="mt-auto pt-6 border-t border-border flex justify-end gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)} type="button" disabled={uploading}>
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={!isValid || uploading || !file}
            className="bg-primary hover:bg-primary/90 text-primary-foreground border-0 shadow-sm"
          >
            {uploading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Uploading...
              </>
            ) : (
              "Upload"
            )}
          </Button>
        </div>
      </form>
      </SheetContent>
    </Sheet>
  )
}
