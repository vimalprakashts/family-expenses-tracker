import { Download, Eye, File, FileText, FolderOpen, Grid, Image, List, Loader2, Search, Trash2, Upload } from 'lucide-react';
import { useState } from 'react';
import { DeleteConfirmDialog } from '../components/ui/ConfirmDialog';
import Modal, { FormInput, FormSelect, ModalActions } from '../components/ui/Modal';
import { useDeleteDocument, useDocuments, useDocumentsSummary } from '../hooks/useDocuments';

interface UiDocument {
  id: string;
  name: string;
  type: 'pdf' | 'image' | 'other';
  category: string;
  size: string;
  uploadedAt: string;
  linkedTo?: string;
  fileUrl?: string;
}

// Format file size
const formatFileSize = (bytes: number): string => {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(0) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
};

// Get file type from file_type or extension
const getFileType = (fileType: string | null, fileName: string): 'pdf' | 'image' | 'other' => {
  const type = fileType || '';
  if (type.includes('pdf') || fileName.toLowerCase().endsWith('.pdf')) return 'pdf';
  if (type.includes('image') || /\.(jpg|jpeg|png|gif|webp)$/i.test(fileName)) return 'image';
  return 'other';
};

// Map database categories to UI categories
const mapCategory = (category: string | null): string => {
  switch (category) {
    case 'bank': return 'Loans';
    case 'tax': return 'Tax';
    case 'insurance': return 'Insurance';
    case 'property': return 'Bills';
    case 'identity': return 'Identity';
    default: return 'Other';
  }
};

const categories = ['All', 'Loans', 'Insurance', 'Income', 'Tax', 'Investments', 'Identity', 'Bills', 'Other'];

const typeIcons = {
  pdf: <FileText className="w-6 h-6 text-danger-500" />,
  image: <Image className="w-6 h-6 text-primary-500" />,
  other: <File className="w-6 h-6 text-gray-500" />,
};

export default function Documents() {
  const { data: dbDocuments = [], isLoading } = useDocuments();
  const { data: summary } = useDocumentsSummary();
  const deleteMutation = useDeleteDocument();
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('list');
  const [searchQuery, setSearchQuery] = useState('');
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedDocument, setSelectedDocument] = useState<UiDocument | null>(null);

  // Transform database documents to UI format
  const documents: UiDocument[] = dbDocuments.map((doc: any) => ({
    id: doc.id,
    name: doc.name,
    type: getFileType(doc.file_type, doc.name),
    category: mapCategory(doc.category),
    size: formatFileSize(doc.file_size || 0),
    uploadedAt: doc.created_at,
    linkedTo: doc.linked_to,
    fileUrl: doc.file_url,
  }));

  const filteredDocuments = documents.filter(doc => {
    const matchesCategory = selectedCategory === 'All' || doc.category === selectedCategory;
    const matchesSearch = doc.name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const handleView = (doc: UiDocument) => {
    setSelectedDocument(doc);
    setIsViewModalOpen(true);
  };

  const handleDelete = (doc: UiDocument) => {
    setSelectedDocument(doc);
    setIsDeleteDialogOpen(true);
  };

  const handleConfirmDelete = () => {
    if (selectedDocument) {
      deleteMutation.mutate(selectedDocument.id);
    }
    setIsDeleteDialogOpen(false);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  // Calculate totals (use summary if available, otherwise compute)
  const totalDocuments = summary?.totalCount ?? documents.length;
  const pdfCount = documents.filter(d => d.type === 'pdf').length;
  const imageCount = documents.filter(d => d.type === 'image').length;
  const totalStorage = summary?.totalSize ? formatFileSize(summary.totalSize) :
    `${documents.length > 0 ? '~' : '0'} ${documents.length} docs`;

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Documents</h1>
          <p className="text-xs sm:text-sm text-gray-500">Store and organize all your financial documents</p>
        </div>
        <button onClick={() => setIsUploadModalOpen(true)} className="btn-primary flex items-center justify-center gap-2 min-h-[44px] w-full sm:w-auto">
          <Upload className="w-4 h-4" />
          Upload Document
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="card p-4 sm:p-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary-50 rounded-lg flex items-center justify-center flex-shrink-0">
              <FolderOpen className="w-5 h-5 text-primary-600" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xl sm:text-2xl font-bold text-gray-900 break-words">{totalDocuments}</p>
              <p className="text-xs sm:text-sm text-gray-500">Total Documents</p>
            </div>
          </div>
        </div>
        <div className="card p-4 sm:p-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-danger-50 rounded-lg flex items-center justify-center flex-shrink-0">
              <FileText className="w-5 h-5 text-danger-600" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xl sm:text-2xl font-bold text-gray-900 break-words">{pdfCount}</p>
              <p className="text-xs sm:text-sm text-gray-500">PDFs</p>
            </div>
          </div>
        </div>
        <div className="card p-4 sm:p-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-success-50 rounded-lg flex items-center justify-center flex-shrink-0">
              <Image className="w-5 h-5 text-success-600" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xl sm:text-2xl font-bold text-gray-900 break-words">{imageCount}</p>
              <p className="text-xs sm:text-sm text-gray-500">Images</p>
            </div>
          </div>
        </div>
        <div className="card p-4 sm:p-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-warning-50 rounded-lg flex items-center justify-center flex-shrink-0">
              <File className="w-5 h-5 text-warning-600" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xl sm:text-2xl font-bold text-gray-900 break-words">{totalStorage}</p>
              <p className="text-xs sm:text-sm text-gray-500">Storage Used</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 items-stretch sm:items-center justify-between">
        <div className="flex flex-wrap gap-2">
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 sm:px-4 py-2 text-xs sm:text-sm font-medium rounded-lg transition-colors min-h-[44px] ${selectedCategory === cat
                  ? 'bg-primary-500 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
            >
              {cat}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2 sm:gap-3">
          <div className="relative flex-1 sm:flex-initial">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search documents..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 pr-4 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none w-full sm:w-64 min-h-[44px]"
            />
          </div>
          <div className="flex border border-gray-200 rounded-lg overflow-hidden">
            <button
              onClick={() => setViewMode('list')}
              className={`p-2 min-w-[44px] min-h-[44px] flex items-center justify-center ${viewMode === 'list' ? 'bg-primary-50 text-primary-600' : 'text-gray-500 hover:bg-gray-50'}`}
            >
              <List className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('grid')}
              className={`p-2 min-w-[44px] min-h-[44px] flex items-center justify-center ${viewMode === 'grid' ? 'bg-primary-50 text-primary-600' : 'text-gray-500 hover:bg-gray-50'}`}
            >
              <Grid className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Documents List */}
      {viewMode === 'list' ? (
        <div className="card p-4 sm:p-6">
          {/* Desktop Table */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-gray-500 border-b border-gray-100">
                  <th className="pb-3 px-4 font-medium">Name</th>
                  <th className="pb-3 px-4 font-medium">Category</th>
                  <th className="pb-3 px-4 font-medium">Linked To</th>
                  <th className="pb-3 px-4 font-medium">Size</th>
                  <th className="pb-3 px-4 font-medium">Uploaded</th>
                  <th className="pb-3 px-4 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredDocuments.map(doc => (
                  <tr key={doc.id} className="border-b border-gray-50 hover:bg-gray-50">
                    <td className="py-4 px-4">
                      <div className="flex items-center gap-3">
                        {typeIcons[doc.type]}
                        <span className="font-medium text-gray-900">{doc.name}</span>
                      </div>
                    </td>
                    <td className="py-4 px-4 text-gray-600">{doc.category}</td>
                    <td className="py-4 px-4 text-gray-600">{doc.linkedTo || '-'}</td>
                    <td className="py-4 px-4 text-gray-600">{doc.size}</td>
                    <td className="py-4 px-4 text-gray-600">
                      {new Date(doc.uploadedAt).toLocaleDateString('en-IN', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </td>
                    <td className="py-4 px-4">
                      <div className="flex items-center justify-end gap-2">
                        <button onClick={() => handleView(doc)} className="p-2 text-gray-500 hover:text-primary-600 hover:bg-primary-50 rounded-lg min-w-[44px] min-h-[44px] flex items-center justify-center">
                          <Eye className="w-4 h-4" />
                        </button>
                        <button className="p-2 text-gray-500 hover:text-primary-600 hover:bg-primary-50 rounded-lg min-w-[44px] min-h-[44px] flex items-center justify-center">
                          <Download className="w-4 h-4" />
                        </button>
                        <button onClick={() => handleDelete(doc)} className="p-2 text-gray-500 hover:text-danger-600 hover:bg-danger-50 rounded-lg min-w-[44px] min-h-[44px] flex items-center justify-center">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {/* Mobile Card View */}
          <div className="md:hidden space-y-3">
            {filteredDocuments.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <FileText className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                <p className="text-sm">No documents found</p>
              </div>
            ) : (
              filteredDocuments.map(doc => (
                <div key={doc.id} className="bg-gray-50 rounded-xl p-4 border border-gray-200">
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <div className="flex-shrink-0">
                        {typeIcons[doc.type]}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-gray-900 text-sm truncate">{doc.name}</h3>
                        <p className="text-xs text-gray-500 mt-1">{doc.category}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <button onClick={() => handleView(doc)} className="p-2 text-gray-500 hover:text-primary-600 hover:bg-primary-50 rounded-lg min-w-[44px] min-h-[44px] flex items-center justify-center">
                        <Eye className="w-4 h-4" />
                      </button>
                      <button className="p-2 text-gray-500 hover:text-primary-600 hover:bg-primary-50 rounded-lg min-w-[44px] min-h-[44px] flex items-center justify-center">
                        <Download className="w-4 h-4" />
                      </button>
                      <button onClick={() => handleDelete(doc)} className="p-2 text-gray-500 hover:text-danger-600 hover:bg-danger-50 rounded-lg min-w-[44px] min-h-[44px] flex items-center justify-center">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3 pt-3 border-t border-gray-200">
                    <div>
                      <p className="text-xs text-gray-500">Linked To</p>
                      <p className="text-xs font-medium text-gray-700 truncate">{doc.linkedTo || '-'}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Size</p>
                      <p className="text-xs font-medium text-gray-700">{doc.size}</p>
                    </div>
                    <div className="col-span-2">
                      <p className="text-xs text-gray-500">Uploaded</p>
                      <p className="text-xs font-medium text-gray-700">
                        {new Date(doc.uploadedAt).toLocaleDateString('en-IN', { month: 'short', day: 'numeric', year: 'numeric' })}
                      </p>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-3 sm:gap-4">
          {filteredDocuments.map(doc => (
            <div key={doc.id} className="card p-3 sm:p-4 hover:shadow-md transition-shadow cursor-pointer group" onClick={() => handleView(doc)}>
              <div className="flex flex-col items-center text-center">
                <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gray-50 rounded-xl flex items-center justify-center mb-2 sm:mb-3">
                  {typeIcons[doc.type]}
                </div>
                <p className="font-medium text-gray-900 text-xs sm:text-sm truncate w-full">{doc.name}</p>
                <p className="text-[10px] sm:text-xs text-gray-500 mt-1">{doc.size}</p>
                <div className="flex gap-1 sm:gap-2 mt-2 sm:mt-3 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button className="p-1.5 text-gray-500 hover:text-primary-600 bg-gray-100 rounded min-w-[44px] min-h-[44px] flex items-center justify-center">
                    <Eye className="w-3.5 h-3.5" />
                  </button>
                  <button className="p-1.5 text-gray-500 hover:text-primary-600 bg-gray-100 rounded min-w-[44px] min-h-[44px] flex items-center justify-center">
                    <Download className="w-3.5 h-3.5" />
                  </button>
                  <button onClick={(e) => { e.stopPropagation(); handleDelete(doc); }} className="p-1.5 text-gray-500 hover:text-danger-600 bg-gray-100 rounded min-w-[44px] min-h-[44px] flex items-center justify-center">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {filteredDocuments.length === 0 && (
        <div className="card text-center py-12">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <FileText className="w-8 h-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No documents found</h3>
          <p className="text-gray-500 mb-4">Upload your first document to get started</p>
          <button onClick={() => setIsUploadModalOpen(true)} className="btn-primary">
            <Upload className="w-4 h-4 mr-2 inline" />
            Upload Document
          </button>
        </div>
      )}

      {/* Upload Modal */}
      <UploadDocumentModal isOpen={isUploadModalOpen} onClose={() => setIsUploadModalOpen(false)} />

      {/* View Modal */}
      {selectedDocument && (
        <ViewDocumentModal
          isOpen={isViewModalOpen}
          onClose={() => setIsViewModalOpen(false)}
          document={selectedDocument}
        />
      )}

      {/* Delete Confirmation */}
      <DeleteConfirmDialog
        isOpen={isDeleteDialogOpen}
        onClose={() => setIsDeleteDialogOpen(false)}
        onConfirm={handleConfirmDelete}
        itemName={selectedDocument?.name || ''}
        itemType="Document"
      />
    </div>
  );
}

function UploadDocumentModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const [formData, setFormData] = useState({
    category: '',
    linkedTo: '',
    notes: '',
  });

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Upload Document" icon="📄" size="md">
      <div className="space-y-6">
        {/* Dropzone */}
        <div className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center hover:border-primary-400 transition-colors cursor-pointer">
          <Upload className="w-10 h-10 text-gray-400 mx-auto mb-3" />
          <p className="font-medium text-gray-700">Drop files here or click to upload</p>
          <p className="text-sm text-gray-500 mt-1">PDF, JPG, PNG up to 10MB</p>
          <input type="file" className="hidden" accept=".pdf,.jpg,.jpeg,.png" />
        </div>

        <FormSelect
          label="Category"
          value={formData.category}
          onChange={(e) => setFormData({ ...formData, category: e.target.value })}
          options={[
            { value: 'Loans', label: 'Loans' },
            { value: 'Insurance', label: 'Insurance' },
            { value: 'Income', label: 'Income' },
            { value: 'Tax', label: 'Tax' },
            { value: 'Investments', label: 'Investments' },
            { value: 'Identity', label: 'Identity' },
            { value: 'Bills', label: 'Bills' },
            { value: 'Other', label: 'Other' },
          ]}
          placeholder="Select category"
        />

        <FormInput
          label="Link to Account/Policy (Optional)"
          value={formData.linkedTo}
          onChange={(e) => setFormData({ ...formData, linkedTo: e.target.value })}
          placeholder="e.g., Home Loan, LIC Policy"
        />

        <ModalActions
          onCancel={onClose}
          onSubmit={onClose}
          submitLabel="Upload"
        />
      </div>
    </Modal>
  );
}

function ViewDocumentModal({ isOpen, onClose, document }: { isOpen: boolean; onClose: () => void; document: UiDocument }) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title={document.name} size="lg">
      <div className="space-y-6">
        {/* Preview Area */}
        <div className="bg-gray-100 rounded-xl h-96 flex items-center justify-center">
          <div className="text-center">
            {typeIcons[document.type]}
            <p className="text-gray-500 mt-2">Document Preview</p>
            <p className="text-sm text-gray-400">(Preview would be shown here)</p>
          </div>
        </div>

        {/* Document Details */}
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-gray-500">Category</p>
            <p className="font-medium text-gray-900">{document.category}</p>
          </div>
          <div>
            <p className="text-gray-500">Size</p>
            <p className="font-medium text-gray-900">{document.size}</p>
          </div>
          <div>
            <p className="text-gray-500">Uploaded On</p>
            <p className="font-medium text-gray-900">
              {new Date(document.uploadedAt).toLocaleDateString('en-IN', { month: 'long', day: 'numeric', year: 'numeric' })}
            </p>
          </div>
          <div>
            <p className="text-gray-500">Linked To</p>
            <p className="font-medium text-gray-900">{document.linkedTo || 'Not linked'}</p>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          <button className="btn-primary flex-1 flex items-center justify-center gap-2">
            <Download className="w-4 h-4" />
            Download
          </button>
          <button className="btn-secondary flex-1">Share</button>
          <button className="btn-danger">Delete</button>
        </div>
      </div>
    </Modal>
  );
}
