import { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { Plus, GripVertical, User, DollarSign, Percent, History, ArrowRight } from 'lucide-react';
import { dealApi, userApi } from '../../lib/api';
import { formatCurrency } from '../../lib/currency';
import { useAuth } from '../../hooks/useAuth';
import {
  DEAL_STAGES,
  STAGE_LABELS,
  STAGE_COLORS,
  getAssignedName,
  emptyDealForm,
  dealToForm,
} from '../../lib/deals';
import PageHeader from '../../components/ui/PageHeader';
import Modal from '../../components/ui/Modal';
import Badge from '../../components/ui/Badge';
import Button from '../../components/ui/Button';
import Alert from '../../components/ui/Alert';
import Spinner from '../../components/ui/Spinner';
import DealFormFields from '../../components/deals/DealFormFields';

const buildColumnsFromPipeline = (pipeline) => {
  const cols = {};
  DEAL_STAGES.forEach((stage) => {
    const section = pipeline.find((p) => p.stage === stage);
    cols[stage] = section?.deals || [];
  });
  return cols;
};

const buildStageStats = (pipeline) => {
  const stats = {};
  DEAL_STAGES.forEach((stage) => {
    const section = pipeline.find((p) => p.stage === stage);
    stats[stage] = {
      count: section?.totalCount || 0,
      totalValue: section?.totalValue || 0,
    };
  });
  return stats;
};

const Deals = () => {
  const navigate = useNavigate();
  const { user, hasPermission } = useAuth();
  const canCreate = hasPermission('deals:create');
  const canEdit = hasPermission('deals:edit');

  const [columns, setColumns] = useState(() => buildColumnsFromPipeline([]));
  const [stageStats, setStageStats] = useState(() => buildStageStats([]));
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedDeal, setSelectedDeal] = useState(null);
  const [form, setForm] = useState(emptyDealForm());

  const fetchDeals = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const response = await dealApi.getAll({ overview: true });
      const pipeline = response.data?.pipeline || [];
      setColumns(buildColumnsFromPipeline(pipeline));
      setStageStats(buildStageStats(pipeline));
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchUsers = useCallback(async () => {
    try {
      const response = await userApi.getAllUsers({ limit: 100 });
      setUsers(response.data);
    } catch {
      setUsers([]);
    }
  }, []);

  useEffect(() => {
    fetchDeals();
    fetchUsers();
  }, [fetchDeals, fetchUsers]);

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const openAddModal = () => {
    setForm(emptyDealForm(user?.id || user?._id));
    setShowAddModal(true);
  };

  const openEditModal = (deal) => {
    if (!canEdit) return;
    setSelectedDeal(deal);
    setForm(dealToForm(deal));
    setShowEditModal(true);
  };

  const closeModals = () => {
    setShowAddModal(false);
    setShowEditModal(false);
    setSelectedDeal(null);
    setForm(emptyDealForm(user?.id || user?._id));
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    setSuccess('');
    try {
      const payload = {
        title: form.title,
        value: Number(form.value) || 0,
        probability: Number(form.probability) || 0,
        stage: form.stage,
        description: form.description,
        assignedTo: form.assignedTo,
      };
      await dealApi.create(payload);
      setSuccess('Deal created successfully');
      closeModals();
      await fetchDeals();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    if (!selectedDeal) return;
    setSaving(true);
    setError('');
    setSuccess('');
    try {
      const payload = {
        title: form.title,
        value: Number(form.value) || 0,
        probability: Number(form.probability) || 0,
        stage: form.stage,
        description: form.description,
        assignedTo: form.assignedTo,
      };
      await dealApi.update(selectedDeal._id, payload);
      setSuccess('Deal updated successfully');
      closeModals();
      await fetchDeals();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const onDragEnd = async (result) => {
    if (!canEdit) return;
    const { destination, source, draggableId } = result;
    if (!destination) return;
    if (destination.droppableId === source.droppableId && destination.index === source.index) return;

    const sourceStage = source.droppableId;
    const destStage = destination.droppableId;

    setColumns((prev) => {
      const updated = { ...prev };
      const sourceDeals = [...updated[sourceStage]];
      const [removed] = sourceDeals.splice(source.index, 1);
      const movedDeal = { ...removed, stage: destStage };
      const destDeals = [...updated[destStage]];
      destDeals.splice(destination.index, 0, movedDeal);
      return { ...updated, [sourceStage]: sourceDeals, [destStage]: destDeals };
    });

    try {
      await dealApi.updateStage(draggableId, destStage);
      await fetchDeals();
    } catch (err) {
      setError(err.message);
      fetchDeals();
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div className="w-full max-w-full overflow-hidden">
      <PageHeader
        title="Sales Pipeline"
        subtitle="Recent deals across pipeline stages — open History for full management"
        actions={
          <>
            <Button variant="secondary" onClick={() => navigate('/deals/history')}>
              <History className="h-4 w-4" />
              History
            </Button>
            {canCreate && (
              <Button onClick={openAddModal}>
                <Plus className="h-4 w-4" />
                Add Deal
              </Button>
            )}
          </>
        }
      />

      <Alert type="error" message={error} onClose={() => setError('')} />
      <Alert type="success" message={success} onClose={() => setSuccess('')} />

      <DragDropContext onDragEnd={onDragEnd}>
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {DEAL_STAGES.map((stage) => {
            const colors = STAGE_COLORS[stage];
            const stats = stageStats[stage] || { count: 0, totalValue: 0 };
            const stageDeals = columns[stage] || [];

            return (
              <div key={stage} className="flex min-w-0 flex-col">
                <div className={`mb-3 rounded-xl border ${colors.header} ${colors.column} p-4`}>
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className={`h-2.5 w-2.5 rounded-full ${colors.dot}`} />
                      <h3 className="text-sm font-semibold text-slate-900">{STAGE_LABELS[stage]}</h3>
                      <Badge variant={colors.badge}>{stats.count}</Badge>
                    </div>
                    <Link
                      to={`/deals/history?stage=${stage}`}
                      className="inline-flex items-center gap-1 text-xs font-medium text-slate-600 hover:text-slate-900"
                    >
                      View All
                      <ArrowRight className="h-3 w-3" />
                    </Link>
                  </div>
                  <p className="mt-2 text-lg font-bold text-slate-900">
                    {formatCurrency(stats.totalValue)}
                  </p>
                  {stats.count > 2 && (
                    <p className="mt-1 text-xs text-slate-500">Showing 2 most recent</p>
                  )}
                </div>

                <Droppable droppableId={stage} isDropDisabled={!canEdit}>
                  {(provided, snapshot) => (
                    <div
                      ref={provided.innerRef}
                      {...provided.droppableProps}
                      className={`flex min-h-[160px] flex-1 flex-col gap-3 rounded-xl border border-slate-200 p-3 transition-colors ${
                        snapshot.isDraggingOver ? 'bg-slate-100' : 'bg-slate-50/50'
                      }`}
                    >
                      {stageDeals.map((deal, index) => (
                        <Draggable
                          key={deal._id}
                          draggableId={String(deal._id)}
                          index={index}
                          isDragDisabled={!canEdit}
                        >
                          {(dragProvided, dragSnapshot) => (
                            <div
                              ref={dragProvided.innerRef}
                              {...dragProvided.draggableProps}
                              className={`card p-4 transition-shadow ${
                                canEdit ? 'cursor-pointer hover:shadow-md' : ''
                              } ${dragSnapshot.isDragging ? 'shadow-lg ring-2 ring-slate-300' : ''}`}
                              onClick={() => openEditModal(deal)}
                            >
                              <div className="flex items-start gap-2">
                                {canEdit && (
                                  <div
                                    {...dragProvided.dragHandleProps}
                                    className="mt-0.5 text-slate-400 hover:text-slate-600"
                                    onClick={(e) => e.stopPropagation()}
                                  >
                                    <GripVertical className="h-4 w-4" />
                                  </div>
                                )}
                                <div className="min-w-0 flex-1">
                                  <p className="truncate text-sm font-semibold text-slate-900">{deal.title}</p>
                                  <div className="mt-2 flex items-center gap-1.5 text-sm font-medium text-slate-800">
                                    <DollarSign className="h-3.5 w-3.5 text-slate-400" />
                                    {formatCurrency(deal.value)}
                                  </div>
                                  <div className="mt-1.5 flex items-center gap-1.5 text-xs text-slate-500">
                                    <Percent className="h-3 w-3" />
                                    {deal.probability}% probability
                                  </div>
                                  <div className="mt-2 flex items-center gap-1.5 text-xs text-slate-500">
                                    <User className="h-3 w-3" />
                                    <span className="truncate">{getAssignedName(deal.assignedTo)}</span>
                                  </div>
                                </div>
                              </div>
                            </div>
                          )}
                        </Draggable>
                      ))}
                      {provided.placeholder}
                      {stageDeals.length === 0 && (
                        <p className="py-8 text-center text-xs text-slate-400">No deals</p>
                      )}
                    </div>
                  )}
                </Droppable>
              </div>
            );
          })}
        </div>
      </DragDropContext>

      {canCreate && (
        <Modal open={showAddModal} onClose={closeModals} title="Add Deal" size="lg">
          <form onSubmit={handleCreate}>
            <DealFormFields form={form} onChange={handleFormChange} users={users} />
            <div className="mt-6 flex justify-end gap-3">
              <Button type="button" variant="secondary" onClick={closeModals}>Cancel</Button>
              <Button type="submit" loading={saving}>Create Deal</Button>
            </div>
          </form>
        </Modal>
      )}

      {canEdit && (
        <Modal open={showEditModal} onClose={closeModals} title="Deal Details" size="lg">
          <form onSubmit={handleUpdate}>
            <DealFormFields form={form} onChange={handleFormChange} users={users} />
            <div className="mt-6 flex justify-end gap-3">
              <Button type="button" variant="secondary" onClick={closeModals}>Cancel</Button>
              <Button type="submit" loading={saving}>Save Changes</Button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};

export default Deals;
