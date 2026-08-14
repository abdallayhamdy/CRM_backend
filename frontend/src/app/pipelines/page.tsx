"use client"

import * as React from "react"
import { Plus, Pencil, Trash2, Layers } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { CrmPageLayout, CrmPageContent, CrmPageHeader } from "@/components/crm/CrmPageLayout"
import { pipelinesService, Pipeline } from "@/services/pipelines"
import { toast } from "sonner"
import { usePermissions } from "@/hooks/use-permissions"

interface PipelineFormData {
  name: string
  stages: { name: string; win_probability: number }[]
}

function defaultStage() {
  return { name: "", win_probability: 0 }
}

function PipelineFormDialog({
  open,
  onOpenChange,
  onSubmit,
  initialData,
  title,
  description,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSubmit: (data: PipelineFormData) => Promise<void>
  initialData?: PipelineFormData
  title: string
  description: string
}) {
  const isEdit = !!initialData
  const [form, setForm] = React.useState<PipelineFormData>({ name: "", stages: [defaultStage()] })
  const [submitting, setSubmitting] = React.useState(false)

  React.useEffect(() => {
    if (open) {
      if (initialData) {
        setForm({
          name: initialData.name,
          stages: initialData.stages.map(s => ({ ...s })),
        })
      } else {
        setForm({ name: "", stages: [defaultStage()] })
      }
    }
  }, [open, initialData])

  const updateField = (field: keyof PipelineFormData, value: any) => {
    setForm(prev => ({ ...prev, [field]: value }))
  }

  const updateStage = (index: number, field: "name" | "win_probability", value: string | number) => {
    setForm(prev => {
      const stages = [...prev.stages]
      stages[index] = { ...stages[index], [field]: value }
      return { ...prev, stages }
    })
  }

  const addStage = () => {
    setForm(prev => ({ ...prev, stages: [...prev.stages, defaultStage()] }))
  }

  const removeStage = (index: number) => {
    setForm(prev => ({
      ...prev,
      stages: prev.stages.filter((_, i) => i !== index),
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.name.trim()) {
      toast.error("Pipeline name is required")
      return
    }
    if (form.stages.length === 0) {
      toast.error("At least one stage is required")
      return
    }
    if (form.stages.some(s => !s.name.trim())) {
      toast.error("All stages must have a name")
      return
    }
    setSubmitting(true)
    try {
      await onSubmit(form)
      onOpenChange(false)
    } catch {
      // handled by caller
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="pipeline-name">Pipeline Name</Label>
              <Input
                id="pipeline-name"
                value={form.name}
                onChange={e => updateField("name", e.target.value)}
                placeholder="e.g. Sales Pipeline"
                required
              />
            </div>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label>Stages</Label>
                {!isEdit && (
                  <Button type="button" variant="outline" size="sm" onClick={addStage}>
                    <Plus className="h-4 w-4 mr-1" />
                    Add Stage
                  </Button>
                )}
              </div>
              {form.stages.map((stage, index) => (
                <div
                  key={index}
                  className="flex items-start gap-2 p-3 rounded-lg border border-border bg-muted/30"
                >
                  <div className="flex-1 space-y-2">
                    <Input
                      placeholder="Stage name"
                      value={stage.name}
                      onChange={e => updateStage(index, "name", e.target.value)}
                      disabled={isEdit}
                    />
                    <div className="flex items-center gap-2">
                      <Label className="text-xs text-muted-foreground shrink-0">Win %</Label>
                      <Input
                        type="number"
                        min={0}
                        max={100}
                        value={stage.win_probability}
                        onChange={e => updateStage(index, "win_probability", parseInt(e.target.value) || 0)}
                        className="w-20"
                        disabled={isEdit}
                      />
                    </div>
                  </div>
                  {!isEdit && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon-sm"
                      onClick={() => removeStage(index)}
                      disabled={form.stages.length <= 1}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  )}
                </div>
              ))}
            </div>
          </div>
          <DialogFooter className="mt-6" showCloseButton>
            <Button type="submit" disabled={submitting}>
              {submitting ? "Saving..." : "Save"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

function DeleteConfirmDialog({
  open,
  onOpenChange,
  onConfirm,
  pipelineName,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  onConfirm: () => Promise<void>
  pipelineName: string
}) {
  const [submitting, setSubmitting] = React.useState(false)

  const handleDelete = async () => {
    setSubmitting(true)
    try {
      await onConfirm()
      onOpenChange(false)
    } catch {
      // handled by caller
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Delete Pipeline</DialogTitle>
          <DialogDescription>
            Are you sure you want to delete <strong>{pipelineName}</strong>? This action cannot be undone.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter showCloseButton>
          <Button variant="destructive" onClick={handleDelete} disabled={submitting}>
            {submitting ? "Deleting..." : "Delete"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export default function PipelinesPage() {
  const { canCreatePipeline, canEditPipeline, canDeletePipeline } = usePermissions()
  const [pipelines, setPipelines] = React.useState<Pipeline[]>([])
  const [loading, setLoading] = React.useState(true)
  const [createOpen, setCreateOpen] = React.useState(false)
  const [editOpen, setEditOpen] = React.useState(false)
  const [deleteOpen, setDeleteOpen] = React.useState(false)
  const [editingPipeline, setEditingPipeline] = React.useState<Pipeline | null>(null)
  const [deletingPipeline, setDeletingPipeline] = React.useState<Pipeline | null>(null)

  const fetchPipelines = React.useCallback(async () => {
    setLoading(true)
    try {
      const { data, error } = await pipelinesService.getAll()
      if (error) throw new Error(error.message)
      setPipelines(data ?? [])
    } catch (err) {
      toast.error("Failed to load pipelines")
    } finally {
      setLoading(false)
    }
  }, [])

  React.useEffect(() => {
    fetchPipelines()
  }, [fetchPipelines])

  const handleCreate = async (formData: PipelineFormData) => {
    const { error } = await pipelinesService.create({
      name: formData.name,
      stages: formData.stages.map(s => ({ name: s.name, win_probability: s.win_probability })),
    })
    if (error) {
      toast.error(error.message)
      throw error
    }
    toast.success("Pipeline created")
    fetchPipelines()
  }

  const handleEdit = async (formData: PipelineFormData) => {
    if (!editingPipeline) return
    const { error } = await pipelinesService.update(editingPipeline.id, {
      name: formData.name,
    })
    if (error) {
      toast.error(error.message)
      throw error
    }
    toast.success("Pipeline updated")
    setEditingPipeline(null)
    fetchPipelines()
  }

  const handleDelete = async () => {
    if (!deletingPipeline) return
    const { error } = await pipelinesService.delete(deletingPipeline.id)
    if (error) {
      toast.error(error.message)
      throw error
    }
    toast.success("Pipeline deleted")
    setDeletingPipeline(null)
    fetchPipelines()
  }

  const openEdit = (pipeline: Pipeline) => {
    setEditingPipeline(pipeline)
    setEditOpen(true)
  }

  const openDelete = (pipeline: Pipeline) => {
    setDeletingPipeline(pipeline)
    setDeleteOpen(true)
  }

  const editInitialData = React.useMemo<PipelineFormData | undefined>(() => {
    if (!editingPipeline) return undefined
    return {
      name: editingPipeline.name,
      stages: editingPipeline.stages.map(s => ({
        name: s.name,
        win_probability: s.win_probability,
      })),
    }
  }, [editingPipeline])

  return (
    <CrmPageLayout>
      <CrmPageHeader
        title="Pipelines"
        icon={<Layers className="h-4 w-4" />}
        actions={
          canCreatePipeline ? (
            <Button onClick={() => setCreateOpen(true)}>
              <Plus className="h-4 w-4 mr-1" />
              Create Pipeline
            </Button>
          ) : undefined
        }
      />

      <CrmPageContent>
        <div className="p-6 max-w-4xl mx-auto space-y-4">
          <div>
            <h2 className="text-lg font-semibold">Pipelines</h2>
            <p className="text-sm text-muted-foreground">Manage your deal pipelines and stages.</p>
          </div>

          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3].map(i => (
                <div key={i} className="h-24 rounded-xl bg-muted/40 animate-pulse" />
              ))}
            </div>
          ) : pipelines.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <Layers className="h-10 w-10 mx-auto text-muted-foreground mb-3" />
                <p className="text-muted-foreground">No pipelines yet. Create your first pipeline to get started.</p>
                {canCreatePipeline && (
                  <Button className="mt-4" onClick={() => setCreateOpen(true)}>
                    <Plus className="h-4 w-4 mr-1" />
                    Create Pipeline
                  </Button>
                )}
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {pipelines.map(pipeline => (
                <Card key={pipeline.id} size="sm">
                  <CardHeader>
                    <div className="flex items-center justify-between w-full">
                      <div className="flex items-center gap-3">
                        <CardTitle>{pipeline.name}</CardTitle>
                        {pipeline.is_default && <Badge variant="secondary">Default</Badge>}
                      </div>
                      <div className="flex items-center gap-1">
                        {canEditPipeline && (
                          <Button variant="ghost" size="icon-sm" onClick={() => openEdit(pipeline)}>
                            <Pencil className="h-4 w-4" />
                          </Button>
                        )}
                        {canDeletePipeline && (
                          <Button variant="ghost" size="icon-sm" onClick={() => openDelete(pipeline)}>
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        )}
                      </div>
                    </div>
                    <CardDescription>
                      {pipeline.stages.length} stage{pipeline.stages.length !== 1 ? "s" : ""}
                    </CardDescription>
                  </CardHeader>
                </Card>
              ))}
            </div>
          )}
        </div>
      </CrmPageContent>

      <PipelineFormDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        onSubmit={handleCreate}
        title="Create Pipeline"
        description="Create a new pipeline with stages to organize your deals."
      />

      <PipelineFormDialog
        open={editOpen}
        onOpenChange={(open) => {
          setEditOpen(open)
          if (!open) setEditingPipeline(null)
        }}
        onSubmit={handleEdit}
        initialData={editInitialData}
        title="Edit Pipeline"
        description="Update the pipeline name and stages."
      />

      <DeleteConfirmDialog
        open={deleteOpen}
        onOpenChange={(open) => {
          setDeleteOpen(open)
          if (!open) setDeletingPipeline(null)
        }}
        onConfirm={handleDelete}
        pipelineName={deletingPipeline?.name ?? ""}
      />
    </CrmPageLayout>
  )
}
