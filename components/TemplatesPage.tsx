"use client"

import { useState, useEffect, useCallback } from "react";
import { LayoutTemplate, Search, Filter, Star, Clock, Tag, Eye, Download, Plus, ChevronDown, Trash2, Pencil } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";

// Template type
interface Template {
  id: string;
  title: string;
  description: string;
  category: string;
  featured: boolean;
  recent: boolean;
  tags: string[];
  previewUrl: string;
}

const categories = ["All", "Invoice", "Report", "Certificate", "Letter", "Proposal", "Resume", "Contract", "Brochure"];

export default function TemplatesPage({ onEdit }: { onEdit?: (templateId: string) => void } = {}) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null);
  const [activeTab, setActiveTab] = useState("all");
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [templateToDelete, setTemplateToDelete] = useState<Template | null>(null);
  const [deleting, setDeleting] = useState(false);

  // Fetch templates from API
  const fetchTemplates = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/templates?includePreview=true");
      const data = await res.json();
      if (data.success && Array.isArray(data.templates)) {
        // Map API data to Template type
        const mapped = data.templates.map((t: any) => ({
          id: t._id,
          title: t.name || "Untitled",
          description: t.data?.description || "",
          category: t.data?.category || "Other",
          featured: !!t.data?.featured,
          recent: !!t.data?.recent,
          tags: Array.isArray(t.data?.tags) ? t.data.tags : [],
          previewUrl: t.previewUrl || "/placeholder.svg?height=400&width=300",
        }));
        setTemplates(mapped);
      } else {
        setTemplates([]);
      }
    } catch (err) {
      setError("Failed to fetch templates");
      setTemplates([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTemplates();
  }, [fetchTemplates]);

  // Expose refreshTemplates for use after saving
  const refreshTemplates = fetchTemplates;

  // Filter templates based on search query and category
  const filteredTemplates = templates.filter((template) => {
    const matchesSearch =
      template.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      template.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      template.tags.some((tag) => tag.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesCategory = selectedCategory === "All" || template.category === selectedCategory;

    const matchesTab =
      activeTab === "all" ||
      (activeTab === "featured" && template.featured) ||
      (activeTab === "recent" && template.recent);

    return matchesSearch && matchesCategory && matchesTab;
  });

  // Delete handler
  const handleDeleteTemplate = async (template: Template) => {
    setTemplateToDelete(template);
  };

  const confirmDeleteTemplate = async () => {
    if (!templateToDelete) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/templates?id=${templateToDelete.id}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        setTemplateToDelete(null);
        await refreshTemplates();
      } else {
        alert(data.error || 'Failed to delete template');
      }
    } catch (err) {
      alert('Failed to delete template');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="w-full px-8 py-8">
      <div className="flex items-center gap-2 mb-6">
        <LayoutTemplate className="h-6 w-6" />
        <h1 className="text-2xl font-bold">Templates</h1>
      </div>

      {/* Search and Filter Bar */}
      <div className="flex flex-col md:flex-row gap-4 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search templates..."
            className="pl-9"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="flex items-center gap-2">
            <Filter className="h-4 w-4" />
            <span>Filter</span>
            <ChevronDown className="h-4 w-4 ml-1" />
          </Button>
          <Button variant="default">
            <Plus className="h-4 w-4 mr-2" />
            Create Template
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="all" className="mb-6" onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="all" className="flex items-center gap-2">
            <LayoutTemplate className="h-4 w-4" />
            All Templates
          </TabsTrigger>
          <TabsTrigger value="featured" className="flex items-center gap-2">
            <Star className="h-4 w-4" />
            Featured
          </TabsTrigger>
          <TabsTrigger value="recent" className="flex items-center gap-2">
            <Clock className="h-4 w-4" />
            Recently Used
          </TabsTrigger>
        </TabsList>
      </Tabs>

      {/* Category Pills */}
      <ScrollArea className="whitespace-nowrap pb-4 mb-6">
        <div className="flex gap-2">
          {categories.map((category) => (
            <Button
              key={category}
              variant={selectedCategory === category ? "default" : "outline"}
              size="sm"
              onClick={() => setSelectedCategory(category)}
              className="rounded-full"
            >
              {category}
            </Button>
          ))}
        </div>
      </ScrollArea>

      {/* Templates Grid */}
      {loading ? (
        <div className="flex justify-center items-center py-10">Loading templates...</div>
      ) : error ? (
        <div className="flex justify-center items-center py-10 text-red-500">{error}</div>
      ) : filteredTemplates.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {filteredTemplates.map((template) => (
            <TemplateCard
              key={template.id}
              template={template}
              onPreview={() => setSelectedTemplate(template)}
              onDelete={() => handleDeleteTemplate(template)}
              onEdit={onEdit}
            />
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center border-2 border-dashed rounded-md p-10">
          <p className="text-muted-foreground mb-2">No templates found matching your criteria</p>
          <Button
            onClick={() => {
              setSearchQuery("");
              setSelectedCategory("All");
              setActiveTab("all");
            }}
          >
            Clear Filters
          </Button>
        </div>
      )}

      {/* Template Preview Dialog */}
      {selectedTemplate && (
        <Dialog open={!!selectedTemplate} onOpenChange={(open) => !open && setSelectedTemplate(null)}>
          <DialogContent className="max-w-4xl">
            <DialogHeader>
              <DialogTitle>{selectedTemplate.title}</DialogTitle>
            </DialogHeader>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="md:col-span-2">
                <div className="border rounded-md overflow-hidden">
                  <img
                    src={selectedTemplate.previewUrl || "/placeholder.svg"}
                    alt={selectedTemplate.title}
                    className="w-full h-auto object-cover"
                  />
                </div>
              </div>
              <div className="space-y-4">
                <div>
                  <h3 className="font-medium mb-1">Description</h3>
                  <p className="text-sm text-muted-foreground">{selectedTemplate.description}</p>
                </div>
                <div>
                  <h3 className="font-medium mb-1">Category</h3>
                  <Badge variant="outline">{selectedTemplate.category}</Badge>
                </div>
                <div>
                  <h3 className="font-medium mb-1">Tags</h3>
                  <div className="flex flex-wrap gap-2">
                    {selectedTemplate.tags.map((tag: string) => (
                      <Badge key={tag} variant="secondary">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </div>
                <div className="pt-4">
                  <Button className="w-full">Use This Template</Button>
                </div>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Delete Confirmation Dialog */}
      <Dialog open={!!templateToDelete} onOpenChange={(open) => !open && setTemplateToDelete(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Delete Template</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p>Are you sure you want to delete the template <span className="font-semibold">{templateToDelete?.title}</span>? This action cannot be undone.</p>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setTemplateToDelete(null)} disabled={deleting}>Cancel</Button>
              <Button variant="destructive" onClick={confirmDeleteTemplate} disabled={deleting}>{deleting ? 'Deleting...' : 'Delete'}</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function TemplateCard({ template, onPreview, onDelete, onEdit }: { template: Template; onPreview: () => void; onDelete: () => void; onEdit?: (templateId: string) => void }) {
  return (
    <div className="border rounded-md overflow-hidden hover:border-primary transition-colors group relative">
      <div className="relative">
        <span className="absolute top-2 right-2 z-20 text-[10px] text-muted-foreground bg-white/80 px-2 py-0.5 rounded shadow-sm font-mono">
          [ {template.id} ]
        </span>
        <img
          src={template.previewUrl || "/placeholder.svg?height=400&width=300"}
          alt={template.title}
          className="w-full aspect-[1/1.414] object-cover"
        />
        <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 z-10">
          <Button size="sm" variant="secondary" onClick={onPreview}>
            <Eye className="h-4 w-4 mr-1" />
            Preview
          </Button>
          <Button size="sm" variant="secondary">
            <Download className="h-4 w-4 mr-1" />
            Use
          </Button>
          <Button size="sm" variant="outline" onClick={() => onEdit?.(template.id)}>
            <Pencil className="h-4 w-4 mr-1" />
            Edit
          </Button>
          <Button size="sm" variant="destructive" onClick={onDelete}>
            <Trash2 className="h-4 w-4 mr-1" />
            Delete
          </Button>
        </div>
        {template.featured && (
          <div className="absolute top-2 left-2">
            <Badge className="bg-yellow-500 hover:bg-yellow-600">
              <Star className="h-3 w-3 mr-1 fill-current" />
              Featured
            </Badge>
          </div>
        )}
      </div>
      <div className="p-3">
        <div className="flex items-start justify-between">
          <div>
            <h3 className="font-medium">{template.title}</h3>
            <p className="text-xs text-muted-foreground line-clamp-2">{template.description}</p>
          </div>
        </div>
        <div className="flex items-center mt-2">
          <Badge variant="outline" className="text-xs">
            <Tag className="h-3 w-3 mr-1" />
            {template.category}
          </Badge>
        </div>
      </div>
    </div>
  );
} 