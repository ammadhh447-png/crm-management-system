const { v4: uuidv4 } = require('uuid');
const Document = require('../models/Document.model');
const { uploadFile, deleteFile, getSignedUrl, isConfigured } = require('../../../config/storage');
const activityService = require('../../activity/services/activity.service');
const AppError = require('../../../shared/errors/AppError');
const { parsePagination } = require('../../../shared/utils/pagination');

const enrichWithUrl = async (doc) => {
  const obj = doc.toObject ? doc.toObject() : { ...doc };
  if (obj.storageKey && isConfigured()) {
    try {
      obj.url = await getSignedUrl(obj.storageKey, 3600);
    } catch {
      obj.url = '';
    }
  }
  return obj;
};

const documentService = {
  upload: async (file, { contactId, dealId, category }, req) => {
    const key = `documents/${uuidv4()}-${file.originalname}`;

    if (isConfigured()) {
      await uploadFile(key, file.buffer, file.mimetype);
    }

    const doc = await Document.create({
      name: file.originalname,
      originalName: file.originalname,
      mimeType: file.mimetype,
      size: file.size,
      storageKey: key,
      url: '',
      contact: contactId || null,
      deal: dealId || null,
      uploadedBy: req.user._id,
      category: category || 'general',
    });

    await activityService.log({
      userId: req.user._id, action: 'upload', module: 'documents',
      description: `File uploaded: ${file.originalname}`, targetId: doc._id.toString(), targetType: 'document', req,
    });

    const populated = await doc.populate('uploadedBy');
    return enrichWithUrl(populated);
  },

  getAll: async (filters = {}) => {
    const query = {};
    if (filters.contact) query.contact = filters.contact;
    if (filters.deal) query.deal = filters.deal;
    if (filters.category) query.category = filters.category;

    const { limit, skip, buildMeta } = parsePagination(filters);

    const [docs, total] = await Promise.all([
      Document.find(query).populate('uploadedBy contact deal').sort('-createdAt').skip(skip).limit(limit),
      Document.countDocuments(query),
    ]);

    const documents = await Promise.all(docs.map(enrichWithUrl));
    return { documents, pagination: buildMeta(total) };
  },

  getById: async (id) => {
    const doc = await Document.findById(id).populate('uploadedBy');
    if (!doc) throw new AppError('Document not found', 404);
    return enrichWithUrl(doc);
  },

  getDownloadUrl: async (id) => {
    const doc = await Document.findById(id);
    if (!doc) throw new AppError('Document not found', 404);
    if (isConfigured() && doc.storageKey) {
      const url = await getSignedUrl(doc.storageKey, 3600);
      return { url, name: doc.originalName, mimeType: doc.mimeType };
    }
    return { url: doc.url, name: doc.originalName, mimeType: doc.mimeType };
  },

  delete: async (id, req) => {
    const doc = await Document.findById(id);
    if (!doc) throw new AppError('Document not found', 404);
    if (isConfigured() && doc.storageKey) await deleteFile(doc.storageKey);
    await Document.findByIdAndDelete(id);
    await activityService.log({
      userId: req.user._id, action: 'delete', module: 'documents',
      description: `File deleted: ${doc.originalName}`, targetId: id, targetType: 'document', req,
    });
    return { message: 'Document deleted' };
  },

  createVersion: async (id, file, req) => {
    const parent = await Document.findById(id);
    if (!parent) throw new AppError('Document not found', 404);
    const key = `documents/${uuidv4()}-${file.originalname}`;
    if (isConfigured()) await uploadFile(key, file.buffer, file.mimetype);
    const doc = await Document.create({
      name: file.originalname, originalName: file.originalname,
      mimeType: file.mimetype, size: file.size, storageKey: key, url: '',
      contact: parent.contact, deal: parent.deal, uploadedBy: req.user._id,
      version: parent.version + 1, parentDocument: parent._id, category: parent.category,
    });
    return enrichWithUrl(doc);
  },
};

module.exports = documentService;
