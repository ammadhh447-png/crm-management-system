import { useState, useEffect, useRef } from 'react';
import { Upload, Download, Trash2, FileText, Image, File } from 'lucide-react';
import { documentApi } from '../../lib/api';
import { PAGE_SIZE } from '../../lib/pagination';
import PageHeader from '../../components/ui/PageHeader';
import Badge from '../../components/ui/Badge';
import Button from '../../components/ui/Button';
import Alert from '../../components/ui/Alert';
import Spinner from '../../components/ui/Spinner';
import FilterBar from '../../components/ui/FilterBar';
import Pagination from '../../components/ui/Pagination';

const formatSize = (bytes) => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1048576) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1048576).toFixed(1)} MB`;
};

const getIcon = (mime) => {
  if (mime?.startsWith('image/')) return Image;
  if (mime === 'application/pdf') return FileText;
  return File;
};

const Documents = () => {
  const [docs, setDocs] = useState([]);
  const [pagination, setPagination] = useState({});
  const [page, setPage] = useState(1);
  const [category, setCategory] = useState('');
  const [draftCategory, setDraftCategory] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef();

  const load = async (targetPage = page) => {
    setLoading(true);
    try {
      const res = await documentApi.getAll({
        page: targetPage,
        limit: PAGE_SIZE,
        category: category || undefined,
      });
      setDocs(res.data);
      setPagination(res.pagination || {});
    } catch (e) { setError(e.message); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(page); }, [page, category]);

  const handleUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      await documentApi.upload(file, { category: 'general' });
      setPage(1);
      load(1);
    } catch (e) { setError(e.message); }
    finally { setUploading(false); e.target.value = ''; }
  };

  const handleDownload = async (id) => {
    try {
      const res = await documentApi.getDownloadUrl(id);
      window.open(res.data.url, '_blank');
    } catch (e) { setError(e.message); }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this file?')) return;
    try {
      await documentApi.delete(id);
      load(page);
    } catch (e) { setError(e.message); }
  };

  return (
    <div>
      <PageHeader
        title="Documents"
        subtitle="Upload and manage files, contracts, and attachments"
        actions={
          <>
            <input ref={fileRef} type="file" className="hidden" onChange={handleUpload} />
            <Button onClick={() => fileRef.current?.click()} loading={uploading}>
              <Upload className="h-4 w-4" /> Upload File
            </Button>
          </>
        }
      />
      <Alert type="error" message={error} onClose={() => setError('')} />

      <FilterBar
        onApply={() => { setCategory(draftCategory); setPage(1); }}
        onClear={() => { setDraftCategory(''); setCategory(''); setPage(1); }}
      >
        <div className="max-w-xs">
          <label className="form-label">Category</label>
          <select value={draftCategory} onChange={(e) => setDraftCategory(e.target.value)} className="form-input">
            <option value="">All Categories</option>
            <option value="general">General</option>
            <option value="contract">Contract</option>
            <option value="invoice">Invoice</option>
            <option value="proposal">Proposal</option>
          </select>
        </div>
      </FilterBar>

      {loading ? <div className="flex justify-center py-20"><Spinner size="lg" /></div> : (
        <>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {docs.map((doc) => {
              const Icon = getIcon(doc.mimeType);
              const isImage = doc.mimeType?.startsWith('image/');
              return (
                <div key={doc._id} className="card overflow-hidden">
                  <div className="flex h-32 items-center justify-center bg-slate-50">
                    {isImage && doc.url ? (
                      <img src={doc.url} alt={doc.name} className="h-full w-full object-cover" />
                    ) : (
                      <Icon className="h-12 w-12 text-slate-300" />
                    )}
                  </div>
                  <div className="p-4">
                    <p className="truncate text-sm font-medium text-slate-900">{doc.originalName}</p>
                    <div className="mt-1 flex items-center gap-2">
                      <Badge>{doc.category}</Badge>
                      <span className="text-xs text-slate-500">{formatSize(doc.size)}</span>
                      {doc.version > 1 && <Badge variant="info">v{doc.version}</Badge>}
                    </div>
                    <p className="mt-1 text-xs text-slate-500">{new Date(doc.createdAt).toLocaleDateString()}</p>
                    <div className="mt-3 flex gap-2">
                      <Button variant="secondary" className="flex-1 text-xs" onClick={() => handleDownload(doc._id)}>
                        <Download className="h-3 w-3" /> Download
                      </Button>
                      <Button variant="secondary" className="text-xs" onClick={() => handleDelete(doc._id)}>
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                </div>
              );
            })}
            {!docs.length && (
              <div className="col-span-full card py-16 text-center">
                <FileText className="mx-auto h-12 w-12 text-slate-300" />
                <p className="mt-4 text-sm text-slate-500">No documents uploaded yet</p>
                <Button className="mt-4" onClick={() => fileRef.current?.click()}>Upload your first file</Button>
              </div>
            )}
          </div>
          {pagination.totalPages > 1 && (
            <div className="card mt-4 overflow-hidden">
              <Pagination
                pagination={pagination}
                onPageChange={setPage}
                itemLabel="documents"
              />
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default Documents;
