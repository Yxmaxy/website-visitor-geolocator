import { useState, useEffect } from "react";
import { Link } from "react-router";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Switch } from "@/components/ui/switch";
import {
    AlertDialog,
    AlertDialogContent,
    AlertDialogHeader,
    AlertDialogFooter,
    AlertDialogTitle,
    AlertDialogDescription,
    AlertDialogAction,
    AlertDialogCancel,
} from "@/components/ui/alert-dialog";

import { DomainApiService } from "@/services/apiDomain";
import type { Domain, DomainCreate, DomainUpdate } from "@/services/apiDomain";
import { copyToClipboard } from "@/services/clipboard";

import { Plus, Edit, Trash2, Copy, Eye, EyeOff, Code2, LineChart, GlobeIcon } from "lucide-react";


// Domain Card Component
interface DomainCardProps {
    domain: Domain;
    showApiKeys: Record<number, boolean>;
    onToggleApiKeyVisibility: (domainId: number) => void;
    onEdit: (domain: Domain) => void;
    onDelete: (domainId: number) => void;
    onShowScript: (domain: Domain) => void;
}

function DomainCard({
    domain,
    showApiKeys,
    onToggleApiKeyVisibility,
    onEdit,
    onDelete,
    onShowScript,
}: DomainCardProps) {
    return (
        <Card>
            <CardHeader>
                <div className="flex md:items-center justify-between md:flex-row flex-col gap-3">
                    <div>
                        <CardTitle className="flex items-center gap-2 mb-2">
                            {domain.domain}
                            <Badge variant={domain.active ? "default" : "secondary"}>
                                {domain.active ? "Active" : "Inactive"}
                            </Badge>
                        </CardTitle>
                        <CardDescription>
                            Created on {new Date(domain.created_at).toLocaleDateString()}
                        </CardDescription>
                    </div>
                    <div className="flex items-center gap-2">
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => onEdit(domain)}
                                >
                                    <Edit className="w-4 h-4" />
                                </Button>
                            </TooltipTrigger>
                            <TooltipContent>Edit domain</TooltipContent>
                        </Tooltip>
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => onDelete(domain.id)}
                                >
                                    <Trash2 className="w-4 h-4" />
                                </Button>
                            </TooltipTrigger>
                            <TooltipContent>Delete domain</TooltipContent>
                        </Tooltip>
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <Link to={`/statistics?domain=${domain.id}`}>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                    >
                                        <LineChart className="w-4 h-4" />
                                    </Button>
                                </Link>
                            </TooltipTrigger>
                            <TooltipContent>Domain statistics</TooltipContent>
                        </Tooltip>
                    </div>
                </div>
            </CardHeader>
            <CardContent>
                <div className="space-y-3">
                    <div>
                        <Label className="text-sm font-medium mb-1">API Key</Label>
                        <div className="flex items-center gap-2 mt-1">
                            <Input
                                type={showApiKeys[domain.id] ? "text" : "password"}
                                value={domain.api_key}
                                readOnly
                                className="font-mono text-sm"
                            />
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => onToggleApiKeyVisibility(domain.id)}
                            >
                                {showApiKeys[domain.id] ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                            </Button>
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => onShowScript(domain)}
                                    >
                                        <Code2 className="w-4 h-4" />
                                    </Button>
                                </TooltipTrigger>
                                <TooltipContent>View tracking script</TooltipContent>
                            </Tooltip>
                        </div>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}

// Domain validation function
function validateDomain(domain: string): { isValid: boolean; error?: string } {
    if (!domain.trim()) {
        return { isValid: false, error: "Domain is required" };
    }

    try {
        const url = new URL(domain);
        if (!url.protocol || !url.hostname) {
            return { isValid: false, error: "Please enter a valid domain with scheme (e.g., https://example.com)" };
        }
        
        // Check if protocol is http or https
        if (!["http:", "https:"].includes(url.protocol)) {
            return { isValid: false, error: "Domain must use HTTP or HTTPS protocol" };
        }
        
        // Check if hostname is valid
        if (!url.hostname || url.hostname.length === 0) {
            return { isValid: false, error: "Please enter a valid domain name" };
        }
        
        return { isValid: true };
    } catch (error) {
        return { isValid: false, error: "Please enter a valid domain with scheme (e.g., https://example.com)" };
    }
}

// Create Domain Dialog Component
interface CreateDomainDialogProps {
    isOpen: boolean;
    onOpenChange: (open: boolean) => void;
    onCreate: (formData: DomainCreate) => Promise<void>;
}

function CreateDomainDialog({ isOpen, onOpenChange, onCreate }: CreateDomainDialogProps) {
    const [form, setForm] = useState<DomainCreate>({
        domain: "",
        geolocation_api_token_ipinfo: ""
    });
    const [errors, setErrors] = useState<{ domain?: string | undefined }>({});

    const handleSubmit = async () => {
        // Validate domain
        const validation = validateDomain(form.domain);
        if (!validation.isValid) {
            setErrors({ domain: validation.error });
            return;
        }

        setErrors({});
        await onCreate(form);
        setForm({ domain: "", geolocation_api_token_ipinfo: "" });
    };

    const handleDomainChange = (value: string) => {
        setForm(prev => ({ ...prev, domain: value }));
        // Clear error when user starts typing
        if (errors.domain) {
            setErrors({});
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle className="mb-1">Add New Domain</DialogTitle>
                    <DialogDescription>
                        Add a new domain to track visitors.
                        You can optionally provide an IPInfo API token for enhanced geolocation data.
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-6 mt-2">
                    <div>
                        <Label htmlFor="domain" className="mb-2">Domain URL</Label>
                        <Input
                            id="domain"
                            placeholder="https://example.com"
                            value={form.domain}
                            onChange={event => handleDomainChange(event.target.value)}
                            className={errors.domain ? "border-red-500" : ""}
                        />
                        {errors.domain && (
                            <p className="text-sm text-red-500 mt-1">{errors.domain}</p>
                        )}
                    </div>
                    <div>
                        <Label htmlFor="ipinfo-token" className="mb-2">IPInfo API Token (Optional)</Label>
                        <Input
                            id="ipinfo-token"
                            placeholder="Enter your IPInfo API token"
                            value={form.geolocation_api_token_ipinfo}
                            onChange={event => setForm(prev => ({ ...prev, geolocation_api_token_ipinfo: event.target.value }))}
                        />
                    </div>
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)}>
                        Cancel
                    </Button>
                    <Button onClick={handleSubmit}>
                        Create Domain
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

// Edit Domain Dialog Component
interface EditDomainDialogProps {
    isOpen: boolean;
    onOpenChange: (open: boolean) => void;
    domain: Domain | null;
    onUpdate: (domainId: number, formData: DomainUpdate) => Promise<void>;
}

function EditDomainDialog({ isOpen, onOpenChange, domain, onUpdate }: EditDomainDialogProps) {
    const [form, setForm] = useState<DomainUpdate>({
        domain: "",
        geolocation_api_token_ipinfo: "",
        active: true
    });
    const [errors, setErrors] = useState<{ domain?: string | undefined }>({});

    // Update form when domain changes
    useEffect(() => {
        if (domain) {
            setForm({
                domain: domain.domain,
                geolocation_api_token_ipinfo: domain.geolocation_api_token_ipinfo,
                active: domain.active
            });
            setErrors({});
        }
    }, [domain]);

    const handleSubmit = async () => {
        // Validate domain
        const validation = validateDomain(form.domain || "");
        if (!validation.isValid) {
            setErrors({ domain: validation.error });
            return;
        }
        if (!domain) return;

        setErrors({});
        await onUpdate(domain.id, form);
    };

    const handleDomainChange = (value: string) => {
        setForm(prev => ({ ...prev, domain: value }));
        // Clear error when user starts typing
        if (errors.domain) {
            setErrors({});
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle className="mb-1">Edit Domain</DialogTitle>
                    <DialogDescription>
                        Update your domain settings and API tokens.
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-6 mt-2">
                    <div>
                        <Label htmlFor="edit-domain" className="mb-2">Domain URL</Label>
                        <Input
                            id="edit-domain"
                            placeholder="https://example.com"
                            value={form.domain}
                            onChange={event => handleDomainChange(event.target.value)}
                            className={errors.domain ? "border-destructive" : ""}
                        />
                        {errors.domain && (
                            <p className="text-sm text-destructive mt-1">{errors.domain}</p>
                        )}
                    </div>
                    <div>
                        <Label htmlFor="edit-ipinfo-token" className="mb-2">IPInfo API Token</Label>
                        <Input
                            id="edit-ipinfo-token"
                            placeholder="Enter your IPInfo API token"
                            value={form.geolocation_api_token_ipinfo}
                            onChange={event => setForm(prev => ({ ...prev, geolocation_api_token_ipinfo: event.target.value }))}
                        />
                    </div>
                    <div className="flex items-center space-x-2">
                        <Switch
                            id="edit-active"
                            checked={form.active}
                            onCheckedChange={checked => setForm(prev => ({ ...prev, active: checked }))}
                        />
                        <Label htmlFor="edit-active">Active</Label>
                    </div>
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)}>
                        Cancel
                    </Button>
                    <Button onClick={handleSubmit}>
                        Update Domain
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

// Script Dialog Component
interface ScriptData {
    script_url?: string;
    script_tag?: string;
    api_key?: string;
}

interface ScriptDialogProps {
    isOpen: boolean;
    onOpenChange: (open: boolean) => void;
    domain: Domain | null;
    scriptData: ScriptData | null;
    onCopyScript: (inputData: string, descriptor: string) => Promise<void>;
}

function ScriptDialog({ isOpen, onOpenChange, domain, scriptData, onCopyScript }: ScriptDialogProps) {
    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-2xl">
                <DialogHeader className="overflow-hidden">
                    <DialogTitle className="mb-1 truncate">Tracking Script for {domain?.domain}</DialogTitle>
                    <DialogDescription>
                        Copy this script and add it to your website to start tracking visitors.
                    </DialogDescription>
                </DialogHeader>
                <div className="space-y-6 mt-2">
                    <div>
                        <Label htmlFor="script-tag" className="mb-2">Script Tag</Label>
                        <div className="flex items-center gap-2 mt-1">
                            <Textarea
                                id="script-tag"
                                value={scriptData?.script_tag || ''}
                                readOnly
                                className="font-mono text-sm"
                                rows={2}
                            />
                            <Button
                                variant="outline"
                                onClick={() => scriptData && onCopyScript(scriptData.script_tag || "", "Script")}
                            >
                                <Copy className="w-4 h-4" />
                            </Button>
                        </div>
                    </div>
                    <Separator />
                    <div>
                        <Label htmlFor="script-url" className="mb-2">Script URL</Label>
                        <div className="flex items-center gap-2 mt-1">
                            <Input
                                id="script-url"
                                value={scriptData?.script_url || ''}
                                readOnly
                                className="font-mono text-sm"
                            />
                            <Button
                                variant="outline"
                                onClick={() => scriptData && onCopyScript(scriptData.script_url || "", "Script URL")}
                            >
                                <Copy className="w-4 h-4" />
                            </Button>
                        </div>
                    </div>
                    <div>
                        <Label htmlFor="api-key" className="mb-2">API Key</Label>
                        <div className="flex items-center gap-2 mt-1">
                            <Input
                                id="api-key"
                                value={scriptData?.api_key || ''}
                                readOnly
                                className="font-mono text-sm"
                            />
                            <Button
                                variant="outline"
                                onClick={() => scriptData && onCopyScript(scriptData.api_key || "", "API Key")}
                            >
                                <Copy className="w-4 h-4" />
                            </Button>
                        </div>
                    </div>
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)}>
                        Close
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

// Domain Header Component
interface DomainHeaderProps {
    onCreateClick: () => void;
    disabled?: boolean;
}

function DomainHeader({ onCreateClick, disabled = false }: DomainHeaderProps) {
    return (
        <div className="flex items-center justify-between mb-6 min-h-12">
            <div className="flex items-center gap-2">
                <GlobeIcon className="h-6 w-6" />
                <h1 className="text-2xl font-bold">My Domains</h1>
            </div>
            <Button onClick={onCreateClick} disabled={disabled}>
                <Plus className="w-4 h-4 mr-1" />
                Add Domain
            </Button>
        </div>
    );
}

// Loading Skeleton Component
function LoadingSkeleton() {
    return (
        <div>
            <DomainHeader onCreateClick={() => {}} disabled={true} />
            <div className="grid gap-4">
                {[1, 2, 3].map(i => (
                    <Card key={i} className="min-h-38">
                        <CardHeader>
                            <div className="h-4 bg-gray-200 rounded w-1/3 animate-pulse"></div>
                        </CardHeader>
                        <CardContent>
                            <div className="h-4 bg-gray-200 rounded w-1/2 animate-pulse mb-2"></div>
                            <div className="h-4 bg-gray-200 rounded w-1/4 animate-pulse"></div>
                        </CardContent>
                    </Card>
                ))}
            </div>
        </div>
    );
}

// Empty State Component
interface EmptyStateProps {
    onCreateClick: () => void;
}

function EmptyState({ onCreateClick }: EmptyStateProps) {
    return (
        <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
                <div className="text-center">
                    <h3 className="text-lg font-semibold mb-2">No domains yet</h3>
                    <p className="text-gray-500 mb-4">Create your first domain to start tracking visitors</p>
                    <Button onClick={onCreateClick}>
                        <Plus className="w-4 h-4 mr-2" />
                        Add Your First Domain
                    </Button>
                </div>
            </CardContent>
        </Card>
    );
}

// Delete Domain Dialog Component
interface DeleteDomainDialogProps {
    isOpen: boolean;
    onOpenChange: (open: boolean) => void;
    domain: Domain | null;
    onDeleteConfirm: (domainId: number) => Promise<void>;
}

function DeleteDomainDialog({ isOpen, onOpenChange, domain, onDeleteConfirm }: DeleteDomainDialogProps) {
    return (
        <AlertDialog open={isOpen} onOpenChange={onOpenChange}>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle className="mb-1">Delete Domain</AlertDialogTitle>
                    <AlertDialogDescription>
                        Are you sure you want to delete the domain <b>{domain?.domain}</b>? This action cannot be undone.
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter className="mt-2">
                    <AlertDialogCancel onClick={() => onOpenChange(false)}>
                        Cancel
                    </AlertDialogCancel>
                    <AlertDialogAction
                        onClick={async () => {
                            if (domain) {
                                await onDeleteConfirm(domain.id);
                                onOpenChange(false);
                            }
                        }}
                    >
                        Delete
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
}

// Main Domains Component
function Domains() {
    const [domains, setDomains] = useState<Domain[]>([]);
    const [loading, setLoading] = useState(true);
    const [showApiKeys, setShowApiKeys] = useState<Record<number, boolean>>({});
    const [editingDomain, setEditingDomain] = useState<Domain | null>(null);
    const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
    const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
    const [isScriptDialogOpen, setIsScriptDialogOpen] = useState(false);
    const [selectedDomainForScript, setSelectedDomainForScript] = useState<Domain | null>(null);
    const [scriptData, setScriptData] = useState<ScriptData | null>(null);
    const [domainToDelete, setDomainToDelete] = useState<Domain | null>(null);
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

    useEffect(() => {
        loadDomains();
    }, []);

    const loadDomains = async () => {
        try {
            setLoading(true);
            const data = await DomainApiService.getDomains();
            setDomains(data);
        } catch (error) {
            toast.error("Failed to load domains");
            throw error;
        } finally {
            setLoading(false);
        }
    };

    const handleCreateDomain = async (formData: DomainCreate) => {
        try {
            if (!formData.domain.trim()) {
                toast.error("Domain is required");
                return;
            }

            const newDomain = await DomainApiService.createDomain(formData);
            setDomains(prev => [...prev, newDomain]);
            setIsCreateDialogOpen(false);
            toast.success("Domain created successfully");
        } catch (error) {
            toast.error("Failed to create domain");
            throw error;
        }
    };

    const handleUpdateDomain = async (domainId: number, formData: DomainUpdate) => {
        try {
            const updatedDomain = await DomainApiService.updateDomain(domainId, formData);
            setDomains(prev => prev.map(domain => domain.id === domainId ? updatedDomain : domain));
            setEditingDomain(null);
            setIsEditDialogOpen(false);
            toast.success("Domain updated successfully");
        } catch (error) {
            toast.error("Failed to update domain");
            throw error;
        }
    };

    const handleDeleteDomain = async (domainId: number) => {
        try {
            await DomainApiService.deleteDomain(domainId);
            setDomains(prev => prev.filter(domain => domain.id !== domainId));
            toast.success("Domain deleted successfully");
        } catch (error) {
            toast.error("Failed to delete domain");
            throw error;
        }
    };

    const handleCopyInput = async (inputData: string, descriptor: string) => {
        const success = await copyToClipboard(inputData);
        if (success) {
            toast.success(`${descriptor} copied to clipboard`);
        } else {
            toast.error(`Failed to copy ${descriptor}`);
        }
    };

    const handleShowScript = async (domain: Domain) => {
        try {
            const scriptData = {
                script_url: domain.script_url,
                script_tag: `<script src="${domain.script_url}"></script>`,
                api_key: domain.api_key
            };
            setScriptData(scriptData);
            setSelectedDomainForScript(domain);
            setIsScriptDialogOpen(true);
        } catch (error) {
            toast.error("Failed to load script data");
            throw error;
        }
    };

    const toggleApiKeyVisibility = (domainId: number) => {
        setShowApiKeys(prev => ({
            ...prev,
            [domainId]: !prev[domainId]
        }));
    };

    if (loading) {
        return <LoadingSkeleton />;
    }

    return (
        <TooltipProvider>
            <DomainHeader onCreateClick={() => setIsCreateDialogOpen(true)} disabled={loading} />

            {domains.length === 0 ? (
                <EmptyState onCreateClick={() => setIsCreateDialogOpen(true)} />
            ) : (
                <div className="grid gap-10 mt-5">
                    {domains.map((domain) => (
                        <DomainCard
                            key={domain.id}
                            domain={domain}
                            showApiKeys={showApiKeys}
                            onToggleApiKeyVisibility={toggleApiKeyVisibility}
                            onEdit={() => {
                                setEditingDomain(domain);
                                setIsEditDialogOpen(true);
                            }}
                            onDelete={() => {
                                setDomainToDelete(domain);
                                setIsDeleteDialogOpen(true);
                            }}
                            onShowScript={handleShowScript}
                        />
                    ))}
                </div>
            )}

            <CreateDomainDialog
                isOpen={isCreateDialogOpen}
                onOpenChange={setIsCreateDialogOpen}
                onCreate={handleCreateDomain}
            />

            <EditDomainDialog
                isOpen={isEditDialogOpen}
                onOpenChange={setIsEditDialogOpen}
                domain={editingDomain}
                onUpdate={handleUpdateDomain}
            />

            <DeleteDomainDialog
                isOpen={isDeleteDialogOpen}
                onOpenChange={(open) => {
                    setIsDeleteDialogOpen(open);
                    if (!open) setDomainToDelete(null);
                }}
                domain={domainToDelete}
                onDeleteConfirm={async (domainId) => {
                    await handleDeleteDomain(domainId);
                    setDomainToDelete(null);
                }}
            />

            <ScriptDialog
                isOpen={isScriptDialogOpen}
                onOpenChange={setIsScriptDialogOpen}
                domain={selectedDomainForScript}
                scriptData={scriptData || null}
                onCopyScript={handleCopyInput}
            />
        </TooltipProvider>
    );
}

export default Domains;
