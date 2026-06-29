import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Badge } from '../ui/badge';
import { Checkbox } from '../ui/checkbox';
import { Textarea } from '../ui/textarea';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '../ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Calendar, MapPin, Users, Trash2, Edit, Plus, Send, Eye, X, ChevronLeft, ChevronRight, User as UserIcon } from 'lucide-react';
import { toast } from 'sonner';
import { jadwalPimpinanApi } from '../../../api/jadwalPimpinan';
import type { JadwalPimpinan, User, PendampingPegawai, PendampingDirecteur } from '../../../api/jadwalPimpinan';

// DIREKTUR_OPTIONS for checkboxes
const DIREKTUR_OPTIONS = [
  { kode: 'PKPS', nama: 'Dir. PKPS' },
  { kode: 'PKTHA', nama: 'Dir. PKTHA' },
  { kode: 'PUPS', nama: 'Dir. PUPS' },
  { kode: 'PPS', nama: 'Dir. PPS' },
];

export function JadwalPimpinanModule() {
  const [jadwalList, setJadwalList] = useState<JadwalPimpinan[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isNotificationModalOpen, setIsNotificationModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, totalPages: 0 });
  const [previewMessage, setPreviewMessage] = useState('');
  const [notificationType, setNotificationType] = useState<'weekly' | 'monthly'>('weekly');
  const [phoneNumber, setPhoneNumber] = useState('');

  // Form state
  const [formData, setFormData] = useState({
    acara: '',
    lokasi: '',
    sebagai: '',
    tanggal_awal: '',
    tanggal_akhir: '',
  });
  const [selectedPegawai, setSelectedPegawai] = useState<PendampingPegawai[]>([]);
  const [selectedDirekturs, setSelectedDirekturs] = useState<string[]>([]);

  useEffect(() => {
    fetchJadwal();
    fetchUsers();
  }, [pagination.page, searchTerm]);

  const fetchJadwal = async () => {
    setLoading(true);
    try {
      const response = await jadwalPimpinanApi.findAll({
        page: pagination.page,
        limit: pagination.limit,
        search: searchTerm,
      });
      setJadwalList(response.items);
      setPagination(response.pagination);
    } catch (error) {
      toast.error('Gagal memuat data jadwal');
    } finally {
      setLoading(false);
    }
  };

  const fetchUsers = async () => {
    try {
      const data = await jadwalPimpinanApi.getUsers();
      setUsers(data);
    } catch (error) {
      console.error('Gagal memuat users');
    }
  };

  const handleSubmit = async () => {
    if (!formData.acara || !formData.lokasi || !formData.sebagai || !formData.tanggal_awal || !formData.tanggal_akhir) {
      toast.error('Mohon lengkapi semua field wajib');
      return;
    }

    const payload = {
      ...formData,
      tanggal_awal: new Date(formData.tanggal_awal).toISOString(),
      tanggal_akhir: new Date(formData.tanggal_akhir).toISOString(),
      pendamping_pegawai: selectedPegawai,
      pendamping_direktur: selectedDirekturs.map((kode) => {
        const dir = DIREKTUR_OPTIONS.find((d) => d.kode === kode);
        return { kode_direktur: kode, nama_direktur: dir?.nama || kode };
      }),
    };

    try {
      if (editingId) {
        await jadwalPimpinanApi.update(editingId, payload);
        toast.success('Jadwal berhasil diperbarui');
      } else {
        await jadwalPimpinanApi.create(payload);
        toast.success('Jadwal berhasil ditambahkan');
      }
      resetForm();
      fetchJadwal();
    } catch (error) {
      toast.error(editingId ? 'Gagal memperbarui jadwal' : 'Gagal menambahkan jadwal');
    }
  };

  const handleEdit = (jadwal: JadwalPimpinan) => {
    setEditingId(jadwal.id);
    setFormData({
      acara: jadwal.acara,
      lokasi: jadwal.lokasi,
      sebagai: jadwal.sebagai,
      tanggal_awal: jadwal.tanggal_awal.split('T')[0],
      tanggal_akhir: jadwal.tanggal_akhir.split('T')[0],
    });
    setSelectedPegawai(jadwal.pendamping_pegawai);
    setSelectedDirekturs(jadwal.pendamping_direktur.map((d) => d.kode_direktur));
    setIsModalOpen(true);
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Yakin ingin menghapus jadwal ini?')) return;
    try {
      await jadwalPimpinanApi.delete(id);
      toast.success('Jadwal berhasil dihapus');
      fetchJadwal();
    } catch (error) {
      toast.error('Gagal menghapus jadwal');
    }
  };

  const resetForm = () => {
    setIsModalOpen(false);
    setEditingId(null);
    setFormData({ acara: '', lokasi: '', sebagai: '', tanggal_awal: '', tanggal_akhir: '' });
    setSelectedPegawai([]);
    setSelectedDirekturs([]);
  };

  const addPegawai = (user: User) => {
    if (selectedPegawai.some((p) => p.user_id === user.id)) {
      toast.warning('Pegawai sudah ditambahkan');
      return;
    }
    setSelectedPegawai([...selectedPegawai, { user_id: user.id, nama_lengkap: user.fullname }]);
  };

  const removePegawai = (userId: number) => {
    setSelectedPegawai(selectedPegawai.filter((p) => p.user_id !== userId));
  };

  const toggleDirecteur = (kode: string) => {
    setSelectedDirekturs((prev) =>
      prev.includes(kode) ? prev.filter((k) => k !== kode) : [...prev, kode]
    );
  };

  const handlePreviewNotification = async () => {
    try {
      const data = await jadwalPimpinanApi.previewNotification(notificationType);
      setPreviewMessage(data.preview);
    } catch (error) {
      toast.error('Gagal membuat preview');
    }
  };

  const handleSendNotification = async () => {
    if (!phoneNumber) {
      toast.error('Mohon masukkan nomor telepon');
      return;
    }
    try {
      await jadwalPimpinanApi.sendNotification(phoneNumber, notificationType);
      toast.success('Notifikasi berhasil dikirim');
      setIsNotificationModalOpen(false);
      setPhoneNumber('');
      setPreviewMessage('');
    } catch (error) {
      toast.error('Gagal mengirim notifikasi');
    }
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h2 className="text-xl md:text-2xl text-gray-900">Jadwal Pimpinan</h2>
          <p className="text-sm text-gray-600">Kelola jadwal pimpinan dan kirim notifikasi</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => { setIsNotificationModalOpen(true); setPreviewMessage(''); }}>
            <Send className="h-4 w-4 mr-2" />
            Kirim Notifikasi WA
          </Button>
          <Button className="bg-teal-600 hover:bg-teal-700" onClick={() => { resetForm(); setIsModalOpen(true); }}>
            <Plus className="h-4 w-4 mr-2" />
            Tambah Jadwal
          </Button>
        </div>
      </div>

      {/* Search */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex gap-2">
            <Input
              placeholder="Cari acara atau lokasi..."
              value={searchTerm}
              onChange={(e) => { setSearchTerm(e.target.value); setPagination({ ...pagination, page: 1 }); }}
              className="max-w-sm"
            />
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card>
        <CardHeader>
          <CardTitle>Daftar Jadwal</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8 text-gray-500">Memuat...</div>
          ) : jadwalList.length === 0 ? (
            <div className="text-center py-8 text-gray-500">Tidak ada jadwal</div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-3 px-2 font-medium">No</th>
                      <th className="text-left py-3 px-2 font-medium">Acara</th>
                      <th className="text-left py-3 px-2 font-medium">Lokasi</th>
                      <th className="text-left py-3 px-2 font-medium">Sebagai</th>
                      <th className="text-left py-3 px-2 font-medium">Tanggal</th>
                      <th className="text-left py-3 px-2 font-medium">Pendamping</th>
                      <th className="text-left py-3 px-2 font-medium">Aksi</th>
                    </tr>
                  </thead>
                  <tbody>
                    {jadwalList.map((jadwal, index) => (
                      <tr key={jadwal.id} className="border-b hover:bg-gray-50">
                        <td className="py-3 px-2">{(pagination.page - 1) * pagination.limit + index + 1}</td>
                        <td className="py-3 px-2 font-medium">{jadwal.acara}</td>
                        <td className="py-3 px-2">{jadwal.lokasi}</td>
                        <td className="py-3 px-2">{jadwal.sebagai}</td>
                        <td className="py-3 px-2">
                          {formatDate(jadwal.tanggal_awal)}
                          {new Date(jadwal.tanggal_awal).toDateString() !== new Date(jadwal.tanggal_akhir).toDateString() && (
                            <> - {formatDate(jadwal.tanggal_akhir)}</>
                          )}
                        </td>
                        <td className="py-3 px-2">
                          <div className="flex flex-wrap gap-1">
                            {jadwal.pendamping_pegawai.slice(0, 2).map((p) => (
                              <Badge key={p.id} variant="secondary" className="text-xs">
                                {p.nama_lengkap}
                              </Badge>
                            ))}
                            {jadwal.pendamping_pegawai.length > 2 && (
                              <Badge variant="outline" className="text-xs">+{jadwal.pendamping_pegawai.length - 2}</Badge>
                            )}
                            {jadwal.pendamping_direktur.map((d) => (
                              <Badge key={d.id} className="bg-teal-100 text-teal-800 text-xs">
                                {d.nama_direktur}
                              </Badge>
                            ))}
                          </div>
                        </td>
                        <td className="py-3 px-2">
                          <div className="flex gap-1">
                            <Button variant="ghost" size="sm" onClick={() => handleEdit(jadwal)}>
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="sm" className="text-red-600 hover:text-red-700" onClick={() => handleDelete(jadwal.id)}>
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              <div className="flex items-center justify-between mt-4 pt-4 border-t">
                <p className="text-sm text-gray-600">
                  Menampilkan {(pagination.page - 1) * pagination.limit + 1} - {Math.min(pagination.page * pagination.limit, pagination.total)} dari {pagination.total}
                </p>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" disabled={pagination.page === 1} onClick={() => setPagination({ ...pagination, page: pagination.page - 1 })}>
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <span className="px-3 py-2 text-sm">{pagination.page} / {pagination.totalPages || 1}</span>
                  <Button variant="outline" size="sm" disabled={pagination.page >= pagination.totalPages} onClick={() => setPagination({ ...pagination, page: pagination.page + 1 })}>
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Add/Edit Modal */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingId ? 'Edit Jadwal' : 'Tambah Jadwal Baru'}</DialogTitle>
            <DialogDescription>Isi form di bawah untuk {editingId ? 'memperbarui' : 'menambahkan'} jadwal pimpinan.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {/* Acara */}
            <div>
              <Label htmlFor="acara">Acara *</Label>
              <Input id="acara" value={formData.acara} onChange={(e) => setFormData({ ...formData, acara: e.target.value })} placeholder="Nama acara" />
            </div>

            {/* Lokasi */}
            <div>
              <Label htmlFor="lokasi">Lokasi *</Label>
              <Input id="lokasi" value={formData.lokasi} onChange={(e) => setFormData({ ...formData, lokasi: e.target.value })} placeholder="Tempat pelaksanaan" />
            </div>

            {/* Sebagai */}
            <div>
              <Label htmlFor="sebagai">Sebagai *</Label>
              <Input id="sebagai" value={formData.sebagai} onChange={(e) => setFormData({ ...formData, sebagai: e.target.value })} placeholder="Contoh: Pembicara, Tamu Undangan" />
            </div>

            {/* Tanggal */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="tanggal_awal">Tanggal Awal *</Label>
                <Input id="tanggal_awal" type="date" value={formData.tanggal_awal} onChange={(e) => setFormData({ ...formData, tanggal_awal: e.target.value })} />
              </div>
              <div>
                <Label htmlFor="tanggal_akhir">Tanggal Akhir *</Label>
                <Input id="tanggal_akhir" type="date" value={formData.tanggal_akhir} onChange={(e) => setFormData({ ...formData, tanggal_akhir: e.target.value })} />
              </div>
            </div>

            {/* Pendamping Pegawai */}
            <div>
              <Label>Pendamping Pegawai</Label>
              <div className="flex gap-2 mb-2">
                <Select onValueChange={(value: string) => {
                  const user = users.find((u) => u.id === parseInt(value));
                  if (user) addPegawai(user);
                }}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Pilih pegawai..." />
                  </SelectTrigger>
                  <SelectContent>
                    {users.map((user) => (
                      <SelectItem key={user.id} value={user.id.toString()}>
                        {user.fullname}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              {selectedPegawai.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {selectedPegawai.map((p) => (
                    <Badge key={p.user_id} variant="secondary" className="flex items-center gap-1">
                      {p.nama_lengkap}
                      <button onClick={() => removePegawai(p.user_id)} className="hover:text-red-600">
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
              )}
            </div>

            {/* Pendamping Direktur */}
            <div>
              <Label>Pendamping Direktur</Label>
              <div className="grid grid-cols-2 gap-2 mt-2">
                {DIREKTUR_OPTIONS.map((dir) => (
                  <div key={dir.kode} className="flex items-center space-x-2">
                    <Checkbox
                      id={`dir-${dir.kode}`}
                      checked={selectedDirekturs.includes(dir.kode)}
                      onCheckedChange={() => toggleDirecteur(dir.kode)}
                    />
                    <Label htmlFor={`dir-${dir.kode}`} className="text-sm font-normal cursor-pointer">
                      {dir.nama}
                    </Label>
                  </div>
                ))}
              </div>
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-2 pt-4">
              <Button variant="outline" onClick={resetForm}>Batal</Button>
              <Button className="bg-teal-600 hover:bg-teal-700" onClick={handleSubmit}>
                {editingId ? 'Simpan Perubahan' : 'Tambah Jadwal'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Notification Modal */}
      <Dialog open={isNotificationModalOpen} onOpenChange={setIsNotificationModalOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Kirim Notifikasi WhatsApp</DialogTitle>
            <DialogDescription>Kirim jadwal pimpinan ke Aspri via WhatsApp</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {/* Type Selection */}
            <div>
              <Label>Periode</Label>
              <div className="flex gap-4 mt-2">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="type-weekly"
                    checked={notificationType === 'weekly'}
                    onCheckedChange={() => { setNotificationType('weekly'); setPreviewMessage(''); }}
                  />
                  <Label htmlFor="type-weekly" className="font-normal">Mingguan (7 hari ke depan)</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="type-monthly"
                    checked={notificationType === 'monthly'}
                    onCheckedChange={() => { setNotificationType('monthly'); setPreviewMessage(''); }}
                  />
                  <Label htmlFor="type-monthly" className="font-normal">Bulanan (bulan ini)</Label>
                </div>
              </div>
            </div>

            {/* Phone Number */}
            <div>
              <Label htmlFor="phone">Nomor WhatsApp Aspri</Label>
              <Input
                id="phone"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                placeholder="08xxxxxxxxxx"
                className="mt-1"
              />
            </div>

            {/* Preview Button */}
            <Button variant="outline" onClick={handlePreviewNotification}>
              <Eye className="h-4 w-4 mr-2" />
              Lihat Preview Pesan
            </Button>

            {/* Preview Message */}
            {previewMessage && (
              <div>
                <Label>Preview Pesan</Label>
                <Textarea
                  value={previewMessage}
                  readOnly
                  className="mt-1 h-64 font-mono text-sm bg-gray-50"
                />
              </div>
            )}

            {/* Actions */}
            <div className="flex justify-end gap-2 pt-4">
              <Button variant="outline" onClick={() => setIsNotificationModalOpen(false)}>Tutup</Button>
              <Button className="bg-teal-600 hover:bg-teal-700" onClick={handleSendNotification} disabled={!phoneNumber}>
                <Send className="h-4 w-4 mr-2" />
                Kirim Notifikasi
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
