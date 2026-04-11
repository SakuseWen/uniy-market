import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { Button } from '../components/ui/button';
import { Card, CardContent } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Input } from '../components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from '../components/ui/avatar';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from '../components/ui/dialog';
import { Textarea } from '../components/ui/textarea';
import { Loader2, Search, Shield, Users, Package, Flag, ArrowLeft, Trash2, CheckCircle, XCircle, GraduationCap } from 'lucide-react';
import { toast } from 'sonner';
import { Toaster } from '../components/ui/sonner';
import { useAuth } from '../services/authContext';
import { adminService } from '../services/adminService';

export default function AdminPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('users');

  // Users state
  const [users, setUsers] = useState<any[]>([]);
  const [usersLoading, setUsersLoading] = useState(false);
  const [userSearch, setUserSearch] = useState('');

  // Products state
  const [products, setProducts] = useState<any[]>([]);
  const [productsLoading, setProductsLoading] = useState(false);
  const [productSearch, setProductSearch] = useState('');

  // Reports state
  const [reports, setReports] = useState<any[]>([]);
  const [reportsLoading, setReportsLoading] = useState(false);
  const [reportFilter, setReportFilter] = useState('pending');

  // Dialog state
  const [actionDialog, setActionDialog] = useState<{ type: string; target: any } | null>(null);
  const [actionReason, setActionReason] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  // Load users
  const loadUsers = async () => {
    setUsersLoading(true);
    try {
      const res = await adminService.getUsers({ search: userSearch || undefined, limit: 100 });
      setUsers(res.data.data?.users || []);
    } catch { toast.error('Failed to load users'); }
    finally { setUsersLoading(false); }
  };

  // Load products
  const loadProducts = async () => {
    setProductsLoading(true);
    try {
      const res = await adminService.getProducts({ search: productSearch || undefined, limit: 100 });
      setProducts(res.data.data?.products || []);
    } catch { toast.error('Failed to load products'); }
    finally { setProductsLoading(false); }
  };

  // Load reports
  const loadReports = async () => {
    setReportsLoading(true);
    try {
      const res = await adminService.getReports({ status: reportFilter || undefined, limit: 100 });
      setReports(res.data.data?.reports || res.data.data || []);
    } catch { toast.error('Failed to load reports'); }
    finally { setReportsLoading(false); }
  };

  useEffect(() => { loadUsers(); }, [userSearch]);
  useEffect(() => { loadProducts(); }, [productSearch]);
  useEffect(() => { loadReports(); }, [reportFilter]);

  // Action handlers
  const handleSuspendUser = async (userId: string) => {
    setActionLoading(true);
    try {
      await adminService.suspendUser(userId, actionReason);
      toast.success('User suspended');
      loadUsers();
    } catch (e: any) { toast.error(e.response?.data?.error?.message || 'Failed'); }
    finally { setActionLoading(false); setActionDialog(null); setActionReason(''); }
  };

  const handleActivateUser = async (userId: string) => {
    setActionLoading(true);
    try {
      await adminService.activateUser(userId, actionReason);
      toast.success('User activated');
      loadUsers();
    } catch (e: any) { toast.error(e.response?.data?.error?.message || 'Failed'); }
    finally { setActionLoading(false); setActionDialog(null); setActionReason(''); }
  };

  const handleDeleteUser = async (userId: string) => {
    setActionLoading(true);
    try {
      await adminService.deleteUser(userId, actionReason);
      toast.success('User deleted');
      loadUsers();
    } catch (e: any) { toast.error(e.response?.data?.error?.message || 'Failed'); }
    finally { setActionLoading(false); setActionDialog(null); setActionReason(''); }
  };

  const handleToggleVerify = async (userId: string, current: boolean) => {
    try {
      await adminService.toggleVerify(userId, !current);
      toast.success(current ? 'Verification revoked' : 'Verification granted');
      loadUsers();
    } catch (e: any) { toast.error(e.response?.data?.error?.message || 'Failed'); }
  };

  const handleRemoveProduct = async (productId: string) => {
    setActionLoading(true);
    try {
      await adminService.removeProduct(productId, actionReason);
      toast.success('Product removed');
      loadProducts();
    } catch (e: any) { toast.error(e.response?.data?.error?.message || 'Failed'); }
    finally { setActionLoading(false); setActionDialog(null); setActionReason(''); }
  };

  const handleResolveReport = async (reportId: number) => {
    setActionLoading(true);
    try {
      await adminService.resolveReport(reportId, actionReason);
      toast.success('Report resolved');
      loadReports();
    } catch (e: any) { toast.error(e.response?.data?.error?.message || 'Failed'); }
    finally { setActionLoading(false); setActionDialog(null); setActionReason(''); }
  };

  const handleDismissReport = async (reportId: number) => {
    setActionLoading(true);
    try {
      await adminService.dismissReport(reportId, actionReason);
      toast.success('Report dismissed');
      loadReports();
    } catch (e: any) { toast.error(e.response?.data?.error?.message || 'Failed'); }
    finally { setActionLoading(false); setActionDialog(null); setActionReason(''); }
  };

  if (!user?.isAdmin) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Shield className="w-16 h-16 mx-auto text-gray-300 mb-4" />
          <h2 className="text-xl font-semibold mb-2">Access Denied</h2>
          <p className="text-gray-500 mb-4">Admin privileges required</p>
          <Button onClick={() => navigate('/')}>Back to Home</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <Toaster position="top-right" />
      {/* Header */}
      <div className="bg-white border-b shadow-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => navigate('/')}>
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <Shield className="w-6 h-6 text-blue-600" />
            <h1 className="text-lg font-semibold">Admin Dashboard</h1>
          </div>
          <span className="text-sm text-gray-500">{user?.name}</span>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6 max-w-6xl">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="w-full mb-6">
            <TabsTrigger value="users" className="flex-1 gap-2"><Users className="w-4 h-4" />Users ({users.length})</TabsTrigger>
            <TabsTrigger value="products" className="flex-1 gap-2"><Package className="w-4 h-4" />Products ({products.length})</TabsTrigger>
            <TabsTrigger value="reports" className="flex-1 gap-2"><Flag className="w-4 h-4" />Reports ({reports.length})</TabsTrigger>
          </TabsList>

          {/* ── Users Tab ── */}
          <TabsContent value="users">
            <div className="mb-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input placeholder="Search users..." value={userSearch} onChange={(e) => setUserSearch(e.target.value)} className="pl-10" />
              </div>
            </div>
            {usersLoading ? (
              <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-blue-600" /></div>
            ) : (
              <div className="space-y-3">
                {users.map((u: any) => (
                  <Card key={u.userID}>
                    <CardContent className="p-4 flex items-center gap-4">
                      <Avatar className="w-10 h-10">
                        <AvatarImage src={u.profileImage ? `http://localhost:3000${u.profileImage}` : ''} />
                        <AvatarFallback>{u.name?.substring(0, 2).toUpperCase()}</AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold truncate">{u.name}</span>
                          {u.isAdmin ? <Badge className="bg-purple-100 text-purple-700">Admin</Badge> : null}
                          {Number(u.isVerified) === 1 ? <Badge className="bg-green-100 text-green-700"><GraduationCap className="w-3 h-3 mr-1" />Edu</Badge> : null}
                        </div>
                        <p className="text-sm text-gray-500 truncate">{u.email}</p>
                      </div>
                      <Badge className={u.status === 'active' ? 'bg-green-100 text-green-700' : u.status === 'suspended' ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-600'}>
                        {u.status}
                      </Badge>
                      <div className="flex gap-1">
                        <Button size="sm" variant="outline" onClick={() => handleToggleVerify(u.userID, Number(u.isVerified) === 1)} title={Number(u.isVerified) === 1 ? 'Revoke Edu' : 'Grant Edu'}>
                          <GraduationCap className={`w-4 h-4 ${Number(u.isVerified) === 1 ? 'text-green-600' : 'text-gray-400'}`} />
                        </Button>
                        {u.status === 'active' ? (
                          <Button size="sm" variant="outline" className="text-orange-600" onClick={() => setActionDialog({ type: 'suspend', target: u })}>Suspend</Button>
                        ) : u.status === 'suspended' ? (
                          <Button size="sm" variant="outline" className="text-green-600" onClick={() => setActionDialog({ type: 'activate', target: u })}>Activate</Button>
                        ) : null}
                        <Button size="sm" variant="outline" className="text-red-600" onClick={() => setActionDialog({ type: 'deleteUser', target: u })}><Trash2 className="w-4 h-4" /></Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          {/* ── Products Tab ── */}
          <TabsContent value="products">
            <div className="mb-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input placeholder="Search products..." value={productSearch} onChange={(e) => setProductSearch(e.target.value)} className="pl-10" />
              </div>
            </div>
            {productsLoading ? (
              <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-blue-600" /></div>
            ) : (
              <div className="space-y-3">
                {products.map((p: any) => (
                  <Card key={p.listingID} className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => navigate(`/product/${p.listingID}`)}>
                    <CardContent className="p-4 flex items-center gap-4">
                      <div className="w-12 h-12 rounded bg-gray-200 flex-shrink-0 overflow-hidden">
                        {p.images?.[0]?.imagePath ? (
                          <img src={`http://localhost:3000${p.images[0].imagePath}`} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-gray-400 text-xs">No img</div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold truncate">{p.title}</p>
                        <p className="text-sm text-gray-500">${p.price} · {p.condition} · Seller: {p.seller?.name || p.sellerID}</p>
                      </div>
                      <Badge className={p.status === 'active' ? 'bg-green-100 text-green-700' : p.status === 'sold' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-600'}>
                        {p.status}
                      </Badge>
                      <Button size="sm" variant="outline" className="text-red-600" onClick={(e: any) => { e.stopPropagation(); setActionDialog({ type: 'removeProduct', target: p }); }}>
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          {/* ── Reports Tab ── */}
          <TabsContent value="reports">
            <div className="mb-4 flex gap-2">
              {['pending', 'under_review', 'resolved', 'dismissed'].map((s) => (
                <Button key={s} size="sm" variant={reportFilter === s ? 'default' : 'outline'} onClick={() => setReportFilter(s)}>
                  {s.replace(/_/g, ' ')}
                </Button>
              ))}
              <Button size="sm" variant={reportFilter === '' ? 'default' : 'outline'} onClick={() => setReportFilter('')}>All</Button>
            </div>
            {reportsLoading ? (
              <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-blue-600" /></div>
            ) : reports.length === 0 ? (
              <div className="text-center py-12 text-gray-400">No reports found</div>
            ) : (
              <div className="space-y-3">
                {reports.map((r: any) => {
                  const images = r.evidence_images ? (() => { try { return JSON.parse(r.evidence_images); } catch { return []; } })() : [];
                  return (
                    <Card key={r.report_id}>
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <Badge variant="outline">{r.report_type}</Badge>
                            <Badge variant="outline">{r.category?.replace(/_/g, ' ')}</Badge>
                            <span className="text-xs text-gray-400">#{r.report_id}</span>
                          </div>
                          <Badge className={
                            r.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                            r.status === 'resolved' ? 'bg-green-100 text-green-800' :
                            r.status === 'dismissed' ? 'bg-gray-100 text-gray-600' :
                            'bg-blue-100 text-blue-800'
                          }>{r.status}</Badge>
                        </div>
                        <p className="text-sm mb-2">{r.reason}</p>
                        {images.length > 0 && (
                          <div className="flex gap-2 mb-2">
                            {images.map((img: string, i: number) => (
                              <img key={i} src={`http://localhost:3000${img}`} alt="" className="w-16 h-16 object-cover rounded border" />
                            ))}
                          </div>
                        )}
                        <div className="text-xs text-gray-400 mb-3">
                          Reporter: {r.reporter_name || r.reporter_id} · {new Date(r.created_at).toLocaleString()}
                          {r.product_id ? ` · Product: ${r.product_id}` : null}
                          {r.reported_user_id ? ` · Reported user: ${r.reported_user_name || r.reported_user_id}` : null}
                        </div>
                        {(r.status === 'pending' || r.status === 'under_review') ? (
                          <div className="flex gap-2">
                            <Button size="sm" style={{ background: '#16a34a', color: 'white' }} onClick={() => setActionDialog({ type: 'resolveReport', target: r })}>
                              <CheckCircle className="w-4 h-4 mr-1" />Resolve
                            </Button>
                            <Button size="sm" variant="outline" onClick={() => setActionDialog({ type: 'dismissReport', target: r })}>
                              <XCircle className="w-4 h-4 mr-1" />Dismiss
                            </Button>
                          </div>
                        ) : null}
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>

      {/* Action Confirmation Dialog */}
      <Dialog open={!!actionDialog} onOpenChange={(v: boolean) => { if (!v) { setActionDialog(null); setActionReason(''); } }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {actionDialog?.type === 'suspend' && 'Suspend User'}
              {actionDialog?.type === 'activate' && 'Activate User'}
              {actionDialog?.type === 'deleteUser' && 'Delete User'}
              {actionDialog?.type === 'removeProduct' && 'Remove Product'}
              {actionDialog?.type === 'resolveReport' && 'Resolve Report'}
              {actionDialog?.type === 'dismissReport' && 'Dismiss Report'}
            </DialogTitle>
            <DialogDescription>
              {actionDialog?.type === 'deleteUser' ? 'This action cannot be undone.' : 'Please provide a reason (optional).'}
            </DialogDescription>
          </DialogHeader>
          <Textarea placeholder="Reason / Notes..." value={actionReason} onChange={(e) => setActionReason(e.target.value)} rows={3} />
          <div className="flex gap-2 justify-end">
            <Button variant="outline" onClick={() => { setActionDialog(null); setActionReason(''); }}>Cancel</Button>
            <Button
              disabled={actionLoading}
              className={actionDialog?.type === 'deleteUser' || actionDialog?.type === 'removeProduct' ? 'bg-red-600 hover:bg-red-700' : ''}
              onClick={() => {
                if (!actionDialog) return;
                const t = actionDialog.target;
                switch (actionDialog.type) {
                  case 'suspend': handleSuspendUser(t.userID); break;
                  case 'activate': handleActivateUser(t.userID); break;
                  case 'deleteUser': handleDeleteUser(t.userID); break;
                  case 'removeProduct': handleRemoveProduct(t.listingID); break;
                  case 'resolveReport': handleResolveReport(t.report_id); break;
                  case 'dismissReport': handleDismissReport(t.report_id); break;
                }
              }}
            >
              {actionLoading && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
              Confirm
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
