"use client"

import * as React from "react"
import { 
  ChevronLeft, 
  Search, 
  Settings2, 
  Trash2, 
  Star, 
  GitBranch, 
  ExternalLink,
  ChevronDown,
  X,
  Info,
  Plus
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { Textarea } from "@/components/ui/textarea"
import { cn } from "@/lib/utils"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useFormLayout, FormFieldGroup } from "@/hooks/use-form-layout"
import { toast } from "sonner"
import { Loader2 } from "lucide-react"
import { FormEditorSkeleton } from "@/components/crm/FormEditorSkeleton"
import dynamic from "next/dynamic"
import { FormFieldsSkeleton } from "@/components/crm/FormFieldsSkeleton"

const SortableFormFields = dynamic(
  () => import("@/components/crm/SortableFormFields").then(m => ({ default: m.SortableFormFields })),
  { ssr: false, loading: () => <FormFieldsSkeleton /> }
) as React.ComponentType<{
  fields: FormFieldGroup[]
  onReorder: (newFields: FormFieldGroup[]) => void
  children: (field: FormFieldGroup, index: number, dragHandle: React.ReactNode) => React.ReactNode
}>

interface Property {
  id: string
  label: string
  required?: boolean
  selected: boolean
  type?: string
}

interface PropertyGroup {
  id: string
  label: string
  properties: Property[]
}

const INITIAL_GROUPS: PropertyGroup[] = [
  {
    id: "company-info",
    label: "Company information",
    properties: [
      { id: "about_us", label: "About us", selected: false, type: "textarea" },
      { id: "annual_revenue", label: "Annual revenue", selected: true, type: "number" },
      { id: "city", label: "City", selected: true, type: "text" },
      { id: "close_date", label: "Close date", selected: false, type: "date" },
      { id: "domain", label: "Company domain name", required: true, selected: true, type: "text" },
      { id: "keywords", label: "Company Keywords", selected: false, type: "text" },
      { id: "name", label: "Company name", required: true, selected: true, type: "text" },
      { id: "country", label: "Country/Region", selected: false, type: "select" },
      { id: "country_code", label: "Country/Region Code", selected: false, type: "text" },
      { id: "description", label: "Description", selected: true, type: "textarea" },
      { id: "employee_range", label: "Employee range", selected: false, type: "select" },
      { id: "industry", label: "Industry", selected: true, type: "select" },
      { id: "industry_group", label: "Industry group", selected: false, type: "select" },
      { id: "is_public", label: "Is public", selected: false, type: "checkbox" },
      { id: "lifecycle_stage", label: "Lifecycle stage", selected: false, type: "select" },
      { id: "linkedin_handle", label: "Linkedin handle", selected: false, type: "text" },
      { id: "logo_url", label: "Logo URL", selected: false, type: "text" },
      { id: "employees", label: "Number of employees", selected: true, type: "number" },
      { id: "traffic_source", label: "Original Traffic Source", selected: false, type: "select" },
      { id: "phone", label: "Phone number", selected: false, type: "tel" },
      { id: "postal_code", label: "Postal code", selected: true, type: "text" },
      { id: "quick_context", label: "Quick context", selected: false, type: "textarea" },
      { id: "revenue_range", label: "Revenue range", selected: false, type: "select" },
      { id: "state", label: "State/Region", selected: true, type: "select" },
      { id: "state_code", label: "State/Region Code", selected: false, type: "text" },
      { id: "street_address", label: "Street address", selected: false, type: "text" },
      { id: "street_address_2", label: "Street address 2", selected: false, type: "text" },
      { id: "timezone", label: "Time zone", selected: true, type: "select" },
      { id: "money_raised", label: "Total money raised", selected: false, type: "number" },
      { id: "type", label: "Type", selected: true, type: "select" },
      { id: "web_tech", label: "Web technologies", selected: false, type: "textarea" },
      { id: "website_url", label: "Website URL", selected: false, type: "url" },
      { id: "year_founded", label: "Year founded", selected: false, type: "number" },
    ]
  },
  {
    id: "social",
    label: "Social media information",
    properties: [
      { id: "facebook_url", label: "Facebook company page", selected: false, type: "url" },
      { id: "facebook_fans", label: "Facebook fans", selected: false, type: "number" },
      { id: "google_plus", label: "Google plus page", selected: false, type: "text" },
      { id: "linkedin_bio", label: "LinkedIn bio", selected: false, type: "textarea" },
      { id: "linkedin_url", label: "LinkedIn company page", selected: true, type: "url" },
      { id: "twitter_bio", label: "Twitter bio", selected: false, type: "textarea" },
      { id: "twitter_followers", label: "Twitter followers", selected: false, type: "number" },
      { id: "twitter_handle", label: "Twitter handle", selected: false, type: "text" },
    ]
  },
  {
    id: "target-accounts",
    label: "Target accounts information",
    properties: [
      { id: "icp_tier", label: "Ideal Customer Profile Tier", selected: false, type: "select" },
      { id: "target_account", label: "Target Account", selected: false, type: "checkbox" },
    ]
  },
  {
    id: "sales",
    label: "Sales properties",
    properties: [
      { id: "owner_id", label: "Company owner", selected: true, type: "select" },
      { id: "lead_status", label: "Lead status", selected: false, type: "select" },
    ]
  }
]

function FieldItem({
  prop,
  toggleRequired,
  toggleProperty,
}: {
  prop: FormFieldGroup
  toggleRequired: (id: string) => void
  toggleProperty: (id: string) => void
}) {
  return (
    <div className="group relative transition-all duration-200">
      <div className="space-y-2.5 transition-all duration-200">
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2">
            <label className="text-[13px] font-bold text-foreground uppercase tracking-wider">
              {prop.label}
              {prop.required && <span className="text-primary ml-1">*</span>}
            </label>
            {prop.type && (
              <Badge variant="secondary" className="text-[10px] px-2 py-0.5">
                {prop.type === "text" ? "Text" :
                 prop.type === "number" ? "Number" :
                 prop.type === "tel" ? "Phone" :
                 prop.type === "url" ? "URL" :
                 prop.type === "textarea" ? "Textarea" :
                 prop.type === "select" ? "Dropdown" :
                 prop.type === "checkbox" ? "Checkbox" : "Text"}
              </Badge>
            )}
          </div>
        </div>
        <div className="space-y-1.5">
          {prop.type === "textarea" ? (
            <Textarea className="min-h-[42px] w-full resize-none rounded-xs border border-border bg-background px-4 py-2 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 group-hover:border-border" />
          ) : prop.type === "select" ? (
            <Select>
              <SelectTrigger className="h-[42px] w-full rounded-xs border border-border bg-background px-4 transition-all group-hover:border-border">
                <SelectValue placeholder="Select option" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="option1">Option 1</SelectItem>
                <SelectItem value="option2">Option 2</SelectItem>
              </SelectContent>
            </Select>
          ) : prop.type === "checkbox" ? (
            <div className="h-[42px] flex items-center">
              <Checkbox className="h-4 w-4" />
            </div>
          ) : prop.type === "number" ? (
            <Input type="number" className="h-[42px] w-full rounded-xs border border-border bg-background px-4 transition-all focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 group-hover:border-border" />
          ) : prop.type === "tel" ? (
            <Input type="tel" className="h-[42px] w-full rounded-xs border border-border bg-background px-4 transition-all focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 group-hover:border-border" />
          ) : prop.type === "url" ? (
            <Input type="url" className="h-[42px] w-full rounded-xs border border-border bg-background px-4 transition-all focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 group-hover:border-border" />
          ) : (
            <Input className="h-[42px] w-full rounded-xs border border-border bg-background px-4 transition-all focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 group-hover:border-border" />
          )}
        </div>
      </div>

      {/* Field Actions Overlay */}
      <div className="absolute right-0 -top-5 opacity-0 group-hover:opacity-100 transition-all duration-200 flex items-center bg-background border border-border rounded-xs shadow-[var(--shadow-drag)] overflow-hidden z-20">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => toggleRequired(prop.id)}
          title={prop.required ? "Required" : "Mark as required"}
          className={prop.required ? "text-primary" : "text-muted-foreground/60 hover:text-foreground hover:bg-accent"}
        >
          {prop.required ? <Star className="h-3 w-3" /> : <Star className="h-3 w-3" />}
        </Button>
        <div className="w-[1px] h-4 bg-border" />
        <Button
          variant="ghost"
          size="icon"
          title="Field logic"
          className="text-muted-foreground/60 hover:text-foreground hover:bg-accent"
        >
          <GitBranch className="h-3 w-3" />
        </Button>
        {!prop.required && (
          <>
            <div className="w-[1px] h-4 bg-border" />
            <Button
              variant="ghost"
              size="icon"
              title="Remove from form"
              onClick={() => toggleProperty(prop.id)}
              className="text-muted-foreground/60 hover:text-primary hover:bg-accent"
            >
              <Trash2 className="h-3 w-3" />
            </Button>
          </>
        )}
      </div>
    </div>
  )
}

export default function EditCompanyFormPage() {
  const router = useRouter()
  const defaultSelected = React.useMemo(() => INITIAL_GROUPS.flatMap(g => g.properties.filter(p => p.selected)), [])
  const { formFields, setFormFields, loading, saving, hasChanges, save, reset: resetLayout, updateFormField } = useFormLayout('company', defaultSelected)
  const [groups, setGroups] = React.useState<PropertyGroup[]>(INITIAL_GROUPS)
  const [searchQuery, setSearchQuery] = React.useState("")
  const [expandedGroups, setExpandedGroups] = React.useState<string[]>(["company-info", "sales", "social"])

  // Warn before leaving with unsaved changes
  React.useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasChanges) {
        e.preventDefault()
        e.returnValue = ''
      }
    }
    window.addEventListener('beforeunload', handleBeforeUnload)
    return () => window.removeEventListener('beforeunload', handleBeforeUnload)
  }, [hasChanges])

  // Keep groups in sync with formFields for the left sidebar UI
  React.useEffect(() => {
    setGroups(prev => prev.map(group => ({
      ...group,
      properties: group.properties.map(prop => ({
        ...prop,
        selected: formFields.some(f => f.id === prop.id),
        required: formFields.find(f => f.id === prop.id)?.required || prop.required
      }))
    })))
  }, [formFields])

  const handleSave = async (shouldClose = false) => {
    const success = await save()
    if (success) {
      toast.success("Company form layout saved")
      if (shouldClose) router.push("/companies")
    } else {
      toast.error("Failed to save form layout")
    }
  }

  const handleReset = async () => {
    if (confirm("Are you sure you want to reset the form to default properties? All custom selections and order will be lost.")) {
      await resetLayout()
      toast.success("Form layout reset")
    }
  }

  const toggleGroup = (groupId: string) => {
    setExpandedGroups(prev => 
      prev.includes(groupId) 
        ? prev.filter(id => id !== groupId) 
        : [...prev, groupId]
    )
  }

  const toggleProperty = (propertyId: string) => {
    setFormFields(prev => {
      const exists = prev.some(f => f.id === propertyId)
      if (exists) {
        return prev.filter(f => f.id !== propertyId)
      } else {
        const prop = INITIAL_GROUPS.flatMap(g => g.properties).find(p => p.id === propertyId)
        if (prop) {
          return [...prev, { ...prop, selected: true }]
        }
        return prev
      }
    })
  }

  const toggleRequired = (propertyId: string) => {
    setFormFields(prev => prev.map(f => {
      if (f.id !== propertyId) return f
      return { ...f, required: !f.required }
    }))
  }

  const handleReorder = (newFields: typeof formFields) => {
    setFormFields(newFields)
  }

  const filteredGroups = groups.map(group => ({
    ...group,
    properties: group.properties.filter(prop => 
      prop.label.toLowerCase().includes(searchQuery.toLowerCase())
    )
  })).filter(group => group.properties.length > 0)

  return (
    <div className="flex flex-col h-[125vh] w-full max-w-screen-xl bg-muted/50 font-sans" style={{ zoom: 0.8 }}>
      {loading ? (
        <FormEditorSkeleton />
      ) : (
      <>
      {/* Top Header */}
      <header className="h-[52px] bg-foreground flex items-center justify-between px-4 shrink-0 text-primary-foreground shadow-sm z-50">
        <div className="flex items-center gap-4">
          <Link href="/companies">
            <Button variant="ghost" className="text-primary-foreground hover:bg-[var(--color-hs-card-bg)]/10 h-9 px-3 gap-2 text-[14px] font-bold transition-all">
              <ChevronLeft className="h-4 w-4" />
              Back
            </Button>
          </Link>
          <div className="h-5 w-[1px] bg-[var(--color-hs-card-bg)]/20" />
          <h1 className="text-[14px] font-bold tracking-tight text-foreground">Edit Company form</h1>
        </div>
        
        <div className="flex items-center gap-3">
          {!saving && (
            <span className="text-[12px] text-primary-foreground/50 font-medium mr-2">All changes saved</span>
          )}
          <Button 
            variant="secondary" 
            className="bg-muted hover:bg-border text-foreground h-9 px-5 text-[14px] font-bold border-none transition-colors"
            onClick={() => alert("The preview on the right shows exactly how the creation form will look for your users.")}
          >
            Preview
          </Button>
          <Button 
            variant="ghost" 
            className="text-primary-foreground hover:bg-[var(--color-hs-card-bg)]/10 h-9 px-4 text-[14px] font-bold transition-colors"
            onClick={handleReset}
          >
            Reset
          </Button>
          <Button 
            variant="ghost" 
            className="text-primary-foreground hover:bg-[var(--color-hs-card-bg)]/10 h-9 px-4 text-[14px] font-bold transition-colors"
            onClick={() => handleSave()}
            disabled={saving || !hasChanges}
          >
            {saving ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Saving...</> : "Save"}
          </Button>
          <Button 
            className="bg-primary hover:bg-primary/90 text-primary-foreground h-9 px-6 text-[14px] font-bold border-none transition-all shadow-sm active:scale-95"
            onClick={() => handleSave(true)}
            disabled={saving}
          >
            {saving ? "Saving..." : "Save and exit"}
          </Button>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Sidebar - Property Selection */}
        <div className="w-full sm:w-[340px] bg-background border-r border-border flex flex-col shrink-0 shadow-[var(--shadow-panel-right)] z-10">
          <div className="p-8 pb-5">
            <h2 className="text-[22px] font-bold text-foreground mb-3 tracking-tight">Add properties</h2>
            <p className="text-[14px] text-muted-foreground mb-6 leading-relaxed">
              Select the fields your team will see when adding a new company record. <a href="#" className="text-primary font-bold hover:underline inline-flex items-center gap-1">Docs <ExternalLink className="h-3 w-3" /></a>
            </p>
            
            <div className="p-3.5 bg-muted/50 border border-border rounded-[4px] mb-6 shadow-sm">
              <p className="text-[13px] text-muted-foreground font-medium leading-snug">
                Note: <span className="text-foreground font-bold">Domain name</span> or <span className="text-foreground font-bold">Company name</span> must be required.
              </p>
            </div>

            <div className="relative group">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/60 group-focus-within:text-primary transition-colors" />
              <input 
                placeholder="Search properties..." 
                aria-label="Search properties"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 h-[42px] rounded-md border border-border outline-none focus:border-primary focus:ring-4 focus:ring-primary/5 bg-muted/50/50 focus:bg-background placeholder:text-muted-foreground/60 text-[14px] transition-all"
              />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto crm-scrollbar px-4 pb-12">
            {filteredGroups.map(group => (
              <div key={group.id} className="mb-1">
                <button 
                  onClick={() => toggleGroup(group.id)}
                  className="w-full flex items-center justify-between p-3 hover:bg-accent rounded-sm transition-colors text-left group"
                >
                  <div className="flex items-center gap-2">
                    <ChevronDown className={cn(
                      "h-4 w-4 text-muted-foreground/60 transition-transform duration-200",
                      !expandedGroups.includes(group.id) && "-rotate-90"
                    )} />
                    <span className="text-[14px] font-bold text-foreground">{group.label}</span>
                  </div>
                  <span className="text-[12px] text-muted-foreground/60 font-medium bg-muted/50 px-1.5 py-0.5 rounded border border-border/50">
                    {group.properties.length}
                  </span>
                </button>
                
                {expandedGroups.includes(group.id) && (
                  <div className="mt-1 space-y-0.5 ml-1">
                    {group.properties.map(prop => (
                      <div 
                        key={prop.id}
                        className={cn(
                          "flex items-center gap-3 p-2 pl-8 rounded-sm transition-colors cursor-pointer group/item",
                          prop.selected ? "bg-muted" : "hover:bg-accent"
                        )}
                        onClick={() => toggleProperty(prop.id)}
                      >
                        <Checkbox 
                          checked={prop.selected} 
                          className={cn(
                            "border-border pointer-events-none data-[state=checked]:bg-primary data-[state=checked]:border-primary",
                            prop.required && "opacity-50"
                          )}
                          disabled={prop.required}
                        />
                        <label className="text-[14px] text-foreground cursor-pointer flex-1 py-1 font-medium select-none">
                          {prop.label}{prop.required && <span className="text-primary ml-0.5">*</span>}
                        </label>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
            {filteredGroups.length === 0 && (
              <div className="p-8 text-center">
                <p className="text-[14px] text-muted-foreground">No properties found matching &quot;{searchQuery}&quot;</p>
              </div>
            )}
          </div>

        </div>

        {/* Right Canvas - Form Preview */}
        <div className="flex-1 flex flex-col bg-muted/50 overflow-y-auto crm-scrollbar relative">
          <div className="w-full max-w-[640px] mx-auto py-12 px-6">
            <div className="bg-background border border-border rounded-sm shadow-[var(--shadow-card)] flex flex-col min-h-[850px]">
              {/* Form Header */}
              <div className="px-10 py-9 border-b border-border">
                <h2 className="text-[24px] font-bold text-foreground tracking-tight">Create company</h2>
                <p className="text-[14px] text-muted-foreground mt-2.5 leading-relaxed">
                  Configure the fields your team will use to add a new company record. Changes are saved automatically.
                </p>
              </div>

              {/* Form Fields */}
              <div className="p-10 space-y-9">
                    <SortableFormFields fields={formFields} onReorder={handleReorder}>
                      {(field, index, dragHandle) => (
                        <div className="group relative" key={field.id}>
                          {dragHandle}
                          <FieldItem
                            prop={field}
                            toggleRequired={toggleRequired}
                            toggleProperty={toggleProperty}
                          />
                        </div>
                      )}
                    </SortableFormFields>
                  </div>


            </div>
          </div>
        </div>

        {/* Right Floating Toolbar */}
        <div className="w-[56px] bg-background border-l border-border flex flex-col items-center py-8 gap-6 shadow-[var(--shadow-panel-left)] z-10">
           <Button variant="ghost" size="icon" className="h-10 w-10 text-muted-foreground hover:bg-accent hover:text-foreground transition-colors">
             <Settings2 className="h-5 w-5" />
           </Button>
           <Button variant="ghost" size="icon" className="h-10 w-10 text-muted-foreground hover:bg-accent hover:text-foreground transition-colors">
             <GitBranch className="h-5 w-5" />
           </Button>
           <div className="mt-auto">
             <Button variant="ghost" size="icon" className="h-10 w-10 text-muted-foreground hover:bg-accent transition-colors">
               <ExternalLink className="h-5 w-5" />
             </Button>
           </div>
        </div>
      </div>

      <style jsx global>{`
        .crm-scrollbar::-webkit-scrollbar {
          width: 8px;
        }
        .crm-scrollbar::-webkit-scrollbar-track {
          background: hsl(var(--muted) / 0.5);
        }
        .crm-scrollbar::-webkit-scrollbar-thumb {
          background: hsl(var(--border));
          border-radius: 20px;
          border: 2px solid hsl(var(--border));
        }
        .crm-scrollbar::-webkit-scrollbar-thumb:hover {
          background: hsl(var(--primary) / 0.1);
        }
      `}</style>
      </>
      )}
    </div>
  )
}
