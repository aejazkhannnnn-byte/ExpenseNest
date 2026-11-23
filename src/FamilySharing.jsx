
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  UsersRound,
  Copy,
  Plus,
  Crown,
  UserRound,
  Wallet,
  TrendingUp,
  TrendingDown,
  Pencil,
  Trash2,
  X,
  Save,
  RefreshCw,
} from 'lucide-react';
import { supabase } from './supabase';
import { formatCurrency } from './currency.js';
import { formatAppDate } from './dateFormatting.js';

function localDateKey(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function displayTransactionDate(value) {
  const [year, month, day] = String(value ?? '').slice(0, 10).split('-').map(Number);
  if (!year || !month || !day) return 'Date not available';
  return formatAppDate(new Date(year, month - 1, day));
}

export default function FamilySharing({ user, currency, onActivity }) {
  const [familyName, setFamilyName] = useState('');
  const [families, setFamilies] = useState([]);
  const [selectedFamily, setSelectedFamily] = useState(null);
  const [members, setMembers] = useState([]);
  const [membersLoading, setMembersLoading] = useState(false);
  const [removingMemberId, setRemovingMemberId] = useState(null);

  const [transactions, setTransactions] = useState([]);
  const [transactionsLoading, setTransactionsLoading] = useState(false);
  const [transactionSaving, setTransactionSaving] = useState(false);
  const [memberReportMonth, setMemberReportMonth] = useState(localDateKey().slice(0, 7));

  const [amount, setAmount] = useState('');
  const [type, setType] = useState('expense');
  const [category, setCategory] = useState('');
  const [description, setDescription] = useState('');
  const [transactionDate, setTransactionDate] = useState(
    localDateKey()
  );

  const [editingTransactionId, setEditingTransactionId] = useState(null);
  const [editAmount, setEditAmount] = useState('');
  const [editType, setEditType] = useState('expense');
  const [editCategory, setEditCategory] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editDate, setEditDate] = useState('');
  const [editSaving, setEditSaving] = useState(false);

  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteCode, setInviteCode] = useState('');
  const [createdInviteCode, setCreatedInviteCode] = useState('');

  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [inviteBusy, setInviteBusy] = useState(false);
  const [acceptBusy, setAcceptBusy] = useState(false);

  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const memberRequestRef = useRef(0);
  const transactionRequestRef = useRef(0);
  const selectedFamilyIdRef = useRef(null);
  selectedFamilyIdRef.current = selectedFamily?.id ?? null;

  const isOwner =
    selectedFamily && selectedFamily.owner_id === user?.id;

  const loadFamilies = useCallback(async () => {
    setLoading(true);

    try {
      const { data: { user: authUser }, error: authError } =
        await supabase.auth.getUser();

      if (authError) throw authError;
      if (!authUser) throw new Error('Please login first.');

      const { data, error: queryError } = await supabase
        .from('family_groups')
        .select('id, name, owner_id, created_at')
        .order('created_at', { ascending: false });

      if (queryError) throw queryError;

      const list = data || [];
      setFamilies(list);

      setSelectedFamily((current) => {
        if (current && list.some((f) => f.id === current.id)) {
          return current;
        }
        return list[0] || null;
      });

      return list;
    } catch (err) {
      console.error('Load families:', err);
      setError(err.message || 'Unable to load families.');
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  const loadMembers = useCallback(async (familyId) => {
    if (familyId && familyId !== selectedFamilyIdRef.current) return;
    const requestId = ++memberRequestRef.current;
    if (!familyId) {
      setMembers([]);
      setMembersLoading(false);
      return;
    }

    setMembersLoading(true);
    try {
      const { data, error: queryError } = await supabase
        .from('family_members')
        .select('family_id, user_id, role, joined_at')
        .eq('family_id', familyId)
        .order('joined_at', { ascending: true });

      if (requestId !== memberRequestRef.current) return;
      if (queryError) throw queryError;
      setMembers(data || []);
    } catch (err) {
      if (requestId !== memberRequestRef.current) return;
      console.error('Load members:', err);
      setError(err.message || 'Unable to load family members.');
      setMembers([]);
    } finally {
      if (requestId === memberRequestRef.current) setMembersLoading(false);
    }
  }, []);

  const loadTransactions = useCallback(async (familyId) => {
    if (familyId && familyId !== selectedFamilyIdRef.current) return;
    const requestId = ++transactionRequestRef.current;
    if (!familyId) {
      setTransactions([]);
      setTransactionsLoading(false);
      return;
    }

    setTransactionsLoading(true);

    try {
      const { data, error: queryError } = await supabase
        .from('family_transactions')
        .select('*')
        .eq('family_id', familyId)
        .order('transaction_date', { ascending: false })
        .order('created_at', { ascending: false });

      if (queryError) throw queryError;

      if (requestId !== transactionRequestRef.current) return;
      setTransactions(data || []);
    } catch (err) {
      if (requestId !== transactionRequestRef.current) return;
      console.error('Load transactions:', err);
      setError(err.message || 'Unable to load transactions.');
      setTransactions([]);
    } finally {
      if (requestId === transactionRequestRef.current) setTransactionsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadFamilies();
  }, [loadFamilies]);

  useEffect(() => {
    if (selectedFamily?.id) {
      loadMembers(selectedFamily.id);
      loadTransactions(selectedFamily.id);
    } else {
      setMembers([]);
      setTransactions([]);
    }
  }, [selectedFamily, loadMembers, loadTransactions]);

  async function createFamily(e) {
    e.preventDefault();
    setError('');
    setMessage('');

    if (!familyName.trim()) {
      setError('Please enter a family name.');
      return;
    }

    setCreating(true);

    try {
      const { data: { user: authUser }, error: authError } =
        await supabase.auth.getUser();

      if (authError) throw authError;
      if (!authUser) throw new Error('Please login again.');

      const { data, error: insertError } = await supabase
        .from('family_groups')
        .insert({
          name: familyName.trim(),
          owner_id: authUser.id,
        })
        .select('id, name, owner_id, created_at')
        .single();

      if (insertError) throw insertError;

      setFamilyName('');
      setSelectedFamily(data);
      setMessage('Family created successfully!');
      onActivity?.('family_created');
      await loadFamilies();
    } catch (err) {
      console.error('Create family:', err);
      setError(err.message || 'Unable to create family.');
    } finally {
      setCreating(false);
    }
  }

  async function createInvitation(e) {
    e.preventDefault();
    setError('');
    setMessage('');
    setCreatedInviteCode('');

    if (!selectedFamily) {
      setError('Please select a family first.');
      return;
    }

    if (!inviteEmail.trim()) {
      setError('Please enter the invited email.');
      return;
    }

    setInviteBusy(true);

    try {
      const { data, error: rpcError } = await supabase.rpc(
        'create_family_invitation',
        {
          _family_id: selectedFamily.id,
          _email: inviteEmail.trim().toLowerCase(),
        }
      );

      if (rpcError) throw rpcError;

      setCreatedInviteCode(data);
      setInviteEmail('');
      setMessage('Invitation created successfully.');
      onActivity?.('family_invitation_sent');
    } catch (err) {
      console.error('Create invitation:', err);
      setError(err.message || 'Unable to create invitation.');
    } finally {
      setInviteBusy(false);
    }
  }

  async function acceptInvitation(e) {
    e.preventDefault();
    setError('');
    setMessage('');

    const cleanCode = inviteCode.trim();

    if (!cleanCode) {
      setError('Please enter the invitation code.');
      return;
    }

    setAcceptBusy(true);

    try {
      const { data, error: rpcError } = await supabase.rpc(
        'accept_family_invitation',
        { _invite_code: cleanCode }
      );

      if (rpcError) throw rpcError;

      setInviteCode('');
      setMessage('You have successfully joined the family!');
      onActivity?.('family_invitation_accepted');

      const list = await loadFamilies();
      const joinedFamily = list.find((f) => f.id === data);

      if (joinedFamily) {
        setSelectedFamily(joinedFamily);
      }
    } catch (err) {
      console.error('Accept invitation:', err);
      setError(err.message || 'Unable to accept invitation.');
    } finally {
      setAcceptBusy(false);
    }
  }

  async function copyInvitationCode() {
    setError('');
    setMessage('');
    try {
      if (!navigator.clipboard?.writeText) throw new Error('Clipboard access is unavailable in this browser.');
      await navigator.clipboard.writeText(createdInviteCode);
      setMessage('Invitation code copied.');
    } catch (err) {
      setError(err.message || 'Could not copy the invitation code.');
    }
  }

  async function removeFamilyMember(member) {
    if (!isOwner || !selectedFamily || member.user_id === selectedFamily.owner_id) return;

    const familyId = selectedFamily.id;
    const memberLabel = `Member ${member.user_id.slice(0, 8)}`;
    const confirmed = window.confirm(
      `Remove ${memberLabel} from ${selectedFamily.name}? They will lose access, unused invites for their account will expire, and their existing transactions will remain in family history.`
    );

    if (!confirmed) return;

    setError('');
    setMessage('');
    setRemovingMemberId(member.user_id);

    try {
      const { error: rpcError } = await supabase.rpc('remove_family_member', {
        _family_id: familyId,
        _user_id: member.user_id,
      });

      if (rpcError) throw rpcError;

      if (selectedFamilyIdRef.current === familyId) {
        setMembers((current) => current.filter((item) => item.user_id !== member.user_id));
        setMessage(`${memberLabel} was removed. Their old invite codes are disabled, and previous transactions remain in the family history.`);
      }
      onActivity?.('family_member_removed');
    } catch (err) {
      console.error('Remove family member:', err);
      setError(err.message || 'Unable to remove this family member.');
    } finally {
      setRemovingMemberId(null);
    }
  }

  async function addTransaction(e) {
    e.preventDefault();
    setError('');
    setMessage('');

    if (!selectedFamily) {
      setError('Please select a family first.');
      return;
    }

    const parsedAmount = Number(amount);
    if (!amount || !Number.isFinite(parsedAmount) || parsedAmount <= 0) {
      setError('Please enter a valid amount.');
      return;
    }

    if (!category.trim()) {
      setError('Please enter a category.');
      return;
    }

    setTransactionSaving(true);

    try {
      const { data: { user: authUser }, error: authError } =
        await supabase.auth.getUser();

      if (authError) throw authError;
      if (!authUser) throw new Error('Please login again.');

      const { error: insertError } = await supabase
        .from('family_transactions')
        .insert({
          family_id: selectedFamily.id,
          created_by: authUser.id,
          amount: parsedAmount,
          type,
          category: category.trim(),
          description: description.trim(),
          transaction_date: transactionDate,
        });

      if (insertError) throw insertError;

      setAmount('');
      setType('expense');
      setCategory('');
      setDescription('');
      setTransactionDate(localDateKey());

      setMessage('Transaction added successfully!');
      onActivity?.('family_transaction_added');
      await loadTransactions(selectedFamily.id);
    } catch (err) {
      console.error('Add transaction:', err);
      setError(err.message || 'Unable to add transaction.');
    } finally {
      setTransactionSaving(false);
    }
  }

  function startEditing(item) {
    if (item.created_by !== user?.id) {
      setError('You can edit only your own transactions.');
      return;
    }

    setError('');
    setMessage('');
    setEditingTransactionId(item.id);
    setEditAmount(String(item.amount));
    setEditType(item.type);
    setEditCategory(item.category || '');
    setEditDescription(item.description || '');
    setEditDate(item.transaction_date || '');
  }

  function cancelEditing() {
    setEditingTransactionId(null);
    setEditAmount('');
    setEditType('expense');
    setEditCategory('');
    setEditDescription('');
    setEditDate('');
  }

  async function saveEditedTransaction(e) {
    e.preventDefault();
    setError('');
    setMessage('');

    if (!editingTransactionId) return;

    const parsedAmount = Number(editAmount);
    if (!editAmount || !Number.isFinite(parsedAmount) || parsedAmount <= 0) {
      setError('Please enter a valid amount.');
      return;
    }

    if (!editCategory.trim()) {
      setError('Please enter a category.');
      return;
    }

    setEditSaving(true);

    try {
      const { data, error: updateError } = await supabase
        .from('family_transactions')
        .update({
          amount: parsedAmount,
          type: editType,
          category: editCategory.trim(),
          description: editDescription.trim(),
          transaction_date: editDate,
        })
        .eq('id', editingTransactionId)
        .eq('created_by', user.id)
        .select();

      if (updateError) throw updateError;
      if (!data || data.length === 0) {
        throw new Error('Update not allowed. You can edit only your own transaction.');
      }

      cancelEditing();
      setMessage('Transaction updated successfully!');
      onActivity?.('family_transaction_updated');
      await loadTransactions(selectedFamily.id);
    } catch (err) {
      console.error('Update transaction:', err);
      setError(err.message || 'Unable to update transaction.');
    } finally {
      setEditSaving(false);
    }
  }

  async function deleteTransaction(transactionId) {
    const confirmed = window.confirm(
      'Are you sure you want to delete this transaction?'
    );

    if (!confirmed) return;

    setError('');
    setMessage('');

    try {
      const { data, error: deleteError } = await supabase
        .from('family_transactions')
        .delete()
        .eq('id', transactionId)
        .eq('created_by', user.id)
        .select();

      if (deleteError) throw deleteError;
      if (!data || data.length === 0) {
        throw new Error('You can delete only your own transaction.');
      }

      setMessage('Transaction deleted successfully!');
      onActivity?.('family_transaction_deleted');
      await loadTransactions(selectedFamily.id);
    } catch (err) {
      console.error('Delete transaction:', err);
      setError(err.message || 'Unable to delete transaction.');
    }
  }

  const totalIncome = transactions
    .filter((item) => item.type === 'income')
    .reduce((total, item) => total + Number(item.amount || 0), 0);

  const totalExpenses = transactions
    .filter((item) => item.type === 'expense')
    .reduce((total, item) => total + Number(item.amount || 0), 0);

  const balance = totalIncome - totalExpenses;

  const formatMoney = (value) => formatCurrency(value, currency);
  const reportMonthLabel = new Date(`${memberReportMonth}-01T00:00:00`).toLocaleDateString('en-IN', { month: 'long', year: 'numeric' });
  const activeMemberIds = new Set(members.map((member) => member.user_id));
  const memberIds = [...new Set([
    ...members.map((member) => member.user_id),
    ...transactions.map((item) => item.created_by),
  ].filter(Boolean))];
  const memberSpending = memberIds.map((memberId) => {
    const expenses = transactions.filter((item) => (
      item.created_by === memberId
      && item.type === 'expense'
      && String(item.transaction_date || '').slice(0, 7) === memberReportMonth
    ));
    return {
      id: memberId,
      label: memberId === user?.id
        ? 'You'
        : `${activeMemberIds.has(memberId) ? 'Member' : 'Former member'} ${memberId.slice(0, 8)}`,
      total: expenses.reduce((sum, item) => sum + Number(item.amount || 0), 0),
      count: expenses.length,
    };
  }).filter((member) => member.total > 0).sort((a, b) => b.total - a.total);
  const memberSpendingTotal = memberSpending.reduce((sum, member) => sum + member.total, 0);
  const highestMemberSpending = Math.max(0, ...memberSpending.map((member) => member.total));

  return (
    <div className="family-sharing">
      <div className="family-header">
        <div className="family-heading-icon">
          <UsersRound size={28} />
        </div>
        <div className="family-heading-content">
          <p className="eyebrow">SHARED FINANCES</p>
          <h2>Family Sharing</h2>
          <p>Manage your family's shared income and expenses.</p>
        </div>
      </div>

      {error && (
        <div className="family-alert family-error" role="alert">
          {error}
          <button type="button" onClick={() => setError('')}>
            <X size={15} />
          </button>
        </div>
      )}

      {message && (
        <div className="family-alert family-success" role="status">
          {message}
          <button type="button" onClick={() => setMessage('')}>
            <X size={15} />
          </button>
        </div>
      )}

      <div className="family-card">
        <h3>Create New Family</h3>
        <p>Create a family group to manage shared finances.</p>
        <form onSubmit={createFamily} className="family-form">
          <input
            value={familyName}
            onChange={(e) => setFamilyName(e.target.value)}
            placeholder="Enter family name"
            maxLength={60}
            disabled={creating}
            required
          />
          <button disabled={creating}>
            <Plus size={16} />
            {creating ? 'Creating...' : 'Create Family'}
          </button>
        </form>
      </div>

      <div className="family-card">
        <h3>Your Families</h3>
        {loading ? (
          <p>Loading families...</p>
        ) : families.length === 0 ? (
          <p>You haven't created or joined any family yet.</p>
        ) : (
          <div className="family-list">
            {families.map((family) => (
              <button
                type="button"
                key={family.id}
                className={`family-item ${
                  selectedFamily?.id === family.id ? 'selected' : ''
                }`}
                onClick={() => {
                  setSelectedFamily(family);
                  setCreatedInviteCode('');
                  setError('');
                  setMessage('');
                  cancelEditing();
                }}
              >
                <span>
                  <UsersRound size={17} />
                  {family.name}
                </span>
                <small>
                  {family.owner_id === user?.id ? 'Owner' : 'Member'}
                </small>
              </button>
            ))}
          </div>
        )}
      </div>

      {selectedFamily && (
        <>
          {isOwner && (
            <div className="family-card">
              <h3>Invite Family Member</h3>
              <p>Invite someone by email. They must sign in with that same address to join.</p>
              <form onSubmit={createInvitation} className="family-form">
                <input
                  type="email"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  placeholder="Enter member's email"
                  required
                  disabled={inviteBusy}
                />
                <button disabled={inviteBusy}>
                  {inviteBusy ? 'Creating...' : 'Create Invitation'}
                </button>
              </form>

              {createdInviteCode && (
                <div className="family-invite-code">
                  <strong>Invitation Code</strong>
                  <code>{createdInviteCode}</code>
                  <button
                    type="button"
                    onClick={copyInvitationCode}
                  >
                    <Copy size={15} /> Copy Code
                  </button>
                  <p>
                    Share this code with the invited person. They must sign
                    in using the invited email address.
                  </p>
                </div>
              )}
            </div>
          )}

          <div className="family-card">
            <div className="family-members-heading">
              <h3>{selectedFamily.name} – Members</h3>
              <span className="family-count">
                {members.length} {members.length === 1 ? 'member' : 'members'}
              </span>
            </div>
            {membersLoading ? (
              <p className="family-empty">Loading family members...</p>
            ) : members.length === 0 ? (
              <p>No members found.</p>
            ) : (
              <div className="family-list">
                {members.map((member) => (
                  <div className="family-member" key={member.user_id}>
                    <div className="family-member-info">
                      <div className="member-avatar">
                        <UserRound size={19} />
                      </div>
                      <div>
                        <strong>
                          {member.user_id === user?.id
                            ? 'You'
                            : `Member ${member.user_id.slice(0, 8)}`}
                        </strong>
                        <small>{member.user_id === user?.id ? 'Your account' : 'Family account'}</small>
                      </div>
                    </div>
                    <div className="family-member-actions">
                      <span className="member-role">
                        {member.user_id === selectedFamily.owner_id ? (
                          <><Crown size={14} /> Owner</>
                        ) : (
                          'Member'
                        )}
                      </span>
                      {isOwner && member.user_id !== selectedFamily.owner_id && (
                        <button
                          type="button"
                          className="family-remove-member-button"
                          onClick={() => removeFamilyMember(member)}
                          disabled={removingMemberId === member.user_id}
                          aria-label={`Remove Member ${member.user_id.slice(0, 8)} from family`}
                          title="Remove member"
                        >
                          <Trash2 size={15} />
                          {removingMemberId === member.user_id ? 'Removing...' : 'Remove'}
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="family-dashboard">
            <div className="family-dashboard-heading">
              <div>
                <h3>Family Dashboard</h3>
                <p>All shared family transactions</p>
              </div>
              <button
                type="button"
                className="family-refresh"
                onClick={() => loadTransactions(selectedFamily.id)}
                disabled={transactionsLoading}
                title="Refresh transactions"
              >
                <RefreshCw size={17} />
              </button>
            </div>

            <div className="family-summary-grid">
              <div className="family-summary income-summary">
                <div className="summary-icon"><TrendingUp size={21} /></div>
                <span>Total Income</span>
                <strong>{formatMoney(totalIncome)}</strong>
              </div>
              <div className="family-summary expense-summary">
                <div className="summary-icon"><TrendingDown size={21} /></div>
                <span>Total Expenses</span>
                <strong>{formatMoney(totalExpenses)}</strong>
              </div>
              <div className="family-summary balance-summary">
                <div className="summary-icon"><Wallet size={21} /></div>
                <span>Family Balance</span>
                <strong>{formatMoney(balance)}</strong>
              </div>
            </div>

            <section className="family-member-spending" aria-labelledby="member-spending-title">
              <div className="family-member-spending-heading">
                <div>
                  <span className="family-report-eyebrow">MONTHLY BREAKDOWN</span>
                  <h4 id="member-spending-title">Spending by member</h4>
                  <p>{reportMonthLabel} · grouped by who added each expense</p>
                </div>
                <label className="family-report-month">
                  <span>Month</span>
                  <input type="month" value={memberReportMonth} onChange={(event) => setMemberReportMonth(event.target.value)} aria-label="Choose month for member spending" />
                </label>
              </div>

              {transactionsLoading ? (
                <p className="family-member-spending-empty">Loading shared expenses…</p>
              ) : memberSpending.length === 0 ? (
                <p className="family-member-spending-empty">No shared expenses were recorded in {reportMonthLabel}.</p>
              ) : (
                <>
                  <div className="family-member-spending-total"><span>Family expenses this month</span><strong>{formatMoney(memberSpendingTotal)}</strong></div>
                  <ol className="family-member-spending-list">
                    {memberSpending.map((member) => {
                      const share = Math.round((member.total / memberSpendingTotal) * 100);
                      const width = highestMemberSpending ? Math.max(5, (member.total / highestMemberSpending) * 100) : 0;
                      return (
                        <li className="family-member-spending-row" key={member.id}>
                          <div className="family-member-spending-copy">
                            <span><strong>{member.label}</strong><small>{member.count} {member.count === 1 ? 'expense' : 'expenses'} · {share}%</small></span>
                            <strong>{formatMoney(member.total)}</strong>
                          </div>
                          <div className="family-member-spending-track" role="progressbar" aria-label={`${member.label} share of family spending`} aria-valuemin={0} aria-valuemax={100} aria-valuenow={share}>
                            <span style={{ width: `${width}%` }} />
                          </div>
                        </li>
                      );
                    })}
                  </ol>
                </>
              )}
              <p className="family-member-spending-note">Based on shared expenses entered in ExpenseNest. This does not include private transactions.</p>
            </section>
          </div>

          <div className="family-card">
            <h3>Add Shared Transaction</h3>
            <p>Add income or expenses that all family members can view.</p>

            <form onSubmit={addTransaction} className="family-transaction-form">
              <label>
                Transaction Type
                <select
                  value={type}
                  onChange={(e) => setType(e.target.value)}
                >
                  <option value="expense">Expense</option>
                  <option value="income">Income</option>
                </select>
              </label>

              <label>
                Amount (₹)
                <input
                  type="number"
                  min="0.01"
                  step="0.01"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="Enter amount"
                  required
                />
              </label>

              <label>
                Category
                <input
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  placeholder="e.g. Food, Rent, Salary"
                  maxLength={80}
                  required
                />
              </label>

              <label>
                Date
                <input
                  type="date"
                  value={transactionDate}
                  onChange={(e) => setTransactionDate(e.target.value)}
                  required
                />
              </label>

              <label className="family-full-field">
                Description
                <input
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Enter details (optional)"
                  maxLength={250}
                />
              </label>

              <button
                type="submit"
                className="family-submit-button"
                disabled={transactionSaving}
              >
                <Plus size={17} />
                {transactionSaving ? 'Adding...' : 'Add Transaction'}
              </button>
            </form>
          </div>

          <div className="family-card">
            <div className="family-history-heading">
              <div>
                <h3>Shared Transaction History</h3>
                <p>All family members can view these transactions.</p>
              </div>
              <span className="family-count">{transactions.length} Records</span>
            </div>

            {transactionsLoading ? (
              <p className="family-empty">Loading transactions...</p>
            ) : transactions.length === 0 ? (
              <p className="family-empty">No transactions added yet.</p>
            ) : (
              <div className="family-transaction-list">
                {transactions.map((item) => {
                  const isMine = item.created_by === user?.id;
                  const isEditing = editingTransactionId === item.id;

                  return (
                    <div className="family-transaction" key={item.id}>
                      {isEditing ? (
                        <form
                          className="family-edit-form"
                          onSubmit={saveEditedTransaction}
                        >
                          <h4>Edit Your Transaction</h4>

                          <label>
                            Type
                            <select
                              value={editType}
                              onChange={(e) => setEditType(e.target.value)}
                            >
                              <option value="expense">Expense</option>
                              <option value="income">Income</option>
                            </select>
                          </label>

                          <label>
                            Amount (₹)
                            <input
                              type="number"
                              min="0.01"
                              step="0.01"
                              value={editAmount}
                              onChange={(e) => setEditAmount(e.target.value)}
                              required
                            />
                          </label>

                          <label>
                            Category
                            <input
                              value={editCategory}
                              onChange={(e) => setEditCategory(e.target.value)}
                              required
                            />
                          </label>

                          <label>
                            Date
                            <input
                              type="date"
                              value={editDate}
                              onChange={(e) => setEditDate(e.target.value)}
                              required
                            />
                          </label>

                          <label className="family-full-field">
                            Description
                            <input
                              value={editDescription}
                              onChange={(e) =>
                                setEditDescription(e.target.value)
                              }
                            />
                          </label>

                          <div className="family-action-row">
                            <button type="submit" disabled={editSaving}>
                              <Save size={15} />
                              {editSaving ? 'Saving...' : 'Save Changes'}
                            </button>
                            <button
                              type="button"
                              className="family-cancel-button"
                              onClick={cancelEditing}
                              disabled={editSaving}
                            >
                              <X size={15} /> Cancel
                            </button>
                          </div>
                        </form>
                      ) : (
                        <>
                          <div className="transaction-main">
                            <div
                              className={`transaction-icon ${
                                item.type === 'income' ? 'income' : 'expense'
                              }`}
                            >
                              {item.type === 'income' ? (
                                <TrendingUp size={20} />
                              ) : (
                                <TrendingDown size={20} />
                              )}
                            </div>

                            <div className="transaction-info">
                              <strong>{item.category}</strong>
                              <span>{item.description || 'No description'}</span>
                              <small>
                                {displayTransactionDate(item.transaction_date)}
                                {' · '}
                                {isMine
                                  ? 'Added by You'
                                  : `Member ${item.created_by?.slice(0, 8)}`}
                              </small>
                            </div>
                          </div>

                          <div className="transaction-right">
                            <strong
                              className={
                                item.type === 'income'
                                  ? 'transaction-income'
                                  : 'transaction-expense'
                              }
                            >
                              {item.type === 'income' ? '+' : '-'}
                              {formatMoney(Number(item.amount || 0))}
                            </strong>

                            {isMine && (
                              <div className="transaction-actions">
                                <button
                                  type="button"
                                  className="edit-transaction-button"
                                  onClick={() => startEditing(item)}
                                  title="Edit transaction"
                                >
                                  <Pencil size={15} />
                                  Edit
                                </button>
                                <button
                                  type="button"
                                  className="delete-transaction-button"
                                  onClick={() => deleteTransaction(item.id)}
                                  title="Delete transaction"
                                >
                                  <Trash2 size={15} />
                                  Delete
                                </button>
                              </div>
                            )}
                          </div>
                        </>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </>
      )}

      <div className="family-card">
        <h3>Join a Family</h3>
        <p>Enter the invitation code shared by the family owner.</p>
        <form onSubmit={acceptInvitation} className="family-form">
          <input
            value={inviteCode}
            onChange={(e) => setInviteCode(e.target.value)}
            placeholder="Paste invitation code"
            required
            disabled={acceptBusy}
          />
          <button disabled={acceptBusy}>
            {acceptBusy ? 'Joining...' : 'Join Family'}
          </button>
        </form>
      </div>

      <style>{`
        .family-sharing {
          width: 100%;
          box-sizing: border-box;
          color: var(--text-primary, #202b45);
          font-family: inherit;
        }

        .family-sharing * {
          box-sizing: border-box;
        }

        .family-header {
          display: flex;
          align-items: center;
          gap: 18px;
          margin-bottom: 26px;
        }

        .family-heading-icon {
          width: 62px;
          height: 62px;
          min-width: 62px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 17px;
          background: #eef0ff;
          color: #5965df;
        }

        .family-heading-content .eyebrow {
          margin: 0 0 6px;
          color: #6475e8;
          font-size: 12px;
          font-weight: 700;
          letter-spacing: 1.3px;
        }

        .family-heading-content h2 {
          margin: 0;
          font-size: 27px;
          font-weight: 700;
        }

        .family-heading-content > p:last-child {
          margin: 6px 0 0;
          color: var(--text-secondary, #748099);
          font-size: 14px;
        }

        .family-sharing .family-card,
        .family-dashboard {
          width: 100%;
          padding: 23px;
          margin-bottom: 20px;
          border: 1px solid var(--border-color, #e5eaf3);
          border-radius: 18px;
          background: var(--card-background, #fff);
          box-shadow: 0 2px 8px rgba(25,40,75,.025);
        }

        .family-sharing .family-card h3,
        .family-dashboard h3 {
          margin: 0 0 9px;
          font-size: 19px;
          font-weight: 700;
          color: var(--text-primary, #202b45);
        }

        .family-sharing .family-card > p,
        .family-dashboard-heading p,
        .family-history-heading p {
          margin: 0 0 16px;
          color: var(--text-secondary, #748099);
          font-size: 13px;
          line-height: 1.6;
        }

        .family-form {
          display: grid;
          grid-template-columns: minmax(0, 1fr) auto;
          gap: 12px;
          margin-top: 16px;
        }

        .family-sharing input,
        .family-sharing select {
          width: 100%;
          min-width: 0;
          min-height: 46px;
          padding: 11px 13px;
          border: 1px solid var(--border-color, #dce3f0);
          border-radius: 10px;
          background: var(--input-background, #f8f9fc);
          color: var(--text-primary, #293653);
          font: inherit;
          font-size: 14px;
          outline: none;
        }

        .family-sharing input:focus,
        .family-sharing select:focus {
          border-color: #6257f5;
          box-shadow: 0 0 0 3px rgba(98,87,245,.10);
        }

        .family-sharing button {
          min-height: 42px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 7px;
          padding: 10px 16px;
          border: none;
          border-radius: 10px;
          background: #6257f5;
          color: #fff;
          font: inherit;
          font-size: 13px;
          font-weight: 600;
          cursor: pointer;
          transition: .2s ease;
        }

        .family-sharing button:hover {
          filter: brightness(.94);
        }

        .family-sharing button:disabled {
          opacity: .6;
          cursor: not-allowed;
        }

        .family-sharing .family-list {
          display: flex;
          flex-direction: column;
          gap: 9px;
          margin-top: 14px;
        }

        .family-sharing .family-item {
          width: 100%;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
          padding: 13px 15px;
          border: 1px solid var(--border-color, #e5eaf3);
          border-radius: 12px;
          background: var(--card-background, #f8f9fc);
          color: var(--text-primary, #293653);
          text-align: left;
        }

        .family-sharing .family-item span {
          display: flex;
          align-items: center;
          gap: 9px;
          font-weight: 600;
        }

        .family-sharing .family-item.selected {
          border-color: #6257f5;
          background: rgba(98,87,245,.08);
        }

        .family-sharing .family-item small {
          color: var(--text-secondary, #748099);
        }

        .family-members-heading {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
          margin-bottom: 12px;
        }

        .family-members-heading h3 {
          margin-bottom: 0 !important;
        }

        .family-member {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
          padding: 14px;
          border: 1px solid var(--border-color, #e5eaf3);
          border-radius: 12px;
          background: var(--card-background, #f8f9fc);
        }

        .family-member-info {
          display: flex;
          align-items: center;
          gap: 11px;
          min-width: 0;
        }

        .family-member-actions {
          display: flex;
          align-items: center;
          justify-content: flex-end;
          gap: 10px;
          flex-wrap: wrap;
        }

        .family-remove-member-button {
          min-height: 34px !important;
          padding: 7px 10px !important;
          border: 1px solid #f6d5d0 !important;
          background: #fff0ed !important;
          color: #c83c30 !important;
          font-size: 12px !important;
        }

        .member-avatar {
          width: 39px;
          height: 39px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 11px;
          background: #eef0ff;
          color: #5965df;
        }

        .family-member strong,
        .family-member small {
          display: block;
        }

        .family-member strong {
          font-size: 14px;
        }

        .family-member small {
          margin-top: 4px;
          color: var(--text-secondary, #748099);
          font-size: 12px;
        }

        .member-role {
          display: flex;
          align-items: center;
          gap: 5px;
          color: #6257f5;
          font-size: 12px;
          font-weight: 600;
        }

        .family-invite-code {
          display: grid;
          gap: 11px;
          margin-top: 16px;
          padding: 16px;
          border: 1px solid var(--border-color, #e5eaf3);
          border-radius: 13px;
          background: var(--card-background, #f8f9fc);
          overflow-wrap: anywhere;
        }

        .family-invite-code code {
          padding: 11px;
          border-radius: 8px;
          background: rgba(98,87,245,.07);
          color: #6257f5;
          word-break: break-all;
        }

        .family-invite-code p {
          margin: 0;
          color: var(--text-secondary, #748099);
          font-size: 13px;
        }

        .family-alert {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 10px;
          padding: 12px 15px;
          margin-bottom: 16px;
          border-radius: 11px;
          font-size: 14px;
        }

        .family-error {
          background: #fee9e7;
          color: #c52b20;
        }

        .family-success {
          background: #dcfce8;
          color: #00864b;
        }

        .family-alert button {
          min-height: 28px;
          padding: 4px 7px;
          background: transparent;
          color: inherit;
        }

        .family-dashboard {
          padding: 22px;
        }

        .family-dashboard-heading,
        .family-history-heading {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
        }

        .family-dashboard-heading p,
        .family-history-heading p {
          margin-bottom: 0;
        }

        .family-refresh {
          width: 39px;
          min-height: 39px !important;
          padding: 8px !important;
          background: #eef0ff !important;
          color: #6257f5 !important;
        }

        .family-summary-grid {
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 13px;
          margin-top: 20px;
        }

        .family-member-spending {
          margin-top: 18px;
          padding: 18px;
          border: 1px solid var(--border-color, #e5eaf3);
          border-radius: 14px;
          background: var(--input-background, #f8f9fc);
        }

        .family-member-spending-heading {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 16px;
        }

        .family-report-eyebrow {
          color: #6475e8;
          font-size: 10px;
          font-weight: 700;
          letter-spacing: .1em;
        }

        .family-member-spending-heading h4 {
          margin: 5px 0 4px;
          color: var(--text-primary, #202b45);
          font-size: 16px;
          font-weight: 650;
        }

        .family-member-spending-heading p {
          margin: 0;
          color: var(--text-secondary, #748099);
          font-size: 12px;
        }

        .family-report-month {
          display: grid;
          flex: 0 0 auto;
          gap: 5px;
          color: var(--text-secondary, #748099);
          font-size: 11px;
          font-weight: 600;
        }

        .family-sharing .family-report-month input {
          width: auto;
          min-height: 36px;
          padding: 6px 9px;
          font-size: 12px;
        }

        .family-member-spending-total {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
          margin: 17px 0 5px;
          padding: 12px 0;
          border-top: 1px solid var(--border-color, #e5eaf3);
          color: var(--text-secondary, #748099);
          font-size: 12px;
        }

        .family-member-spending-total strong {
          color: var(--text-primary, #202b45);
          font-size: 15px;
          font-variant-numeric: tabular-nums;
        }

        .family-member-spending-list {
          display: grid;
          gap: 13px;
          margin: 5px 0 0;
          padding: 0;
          list-style: none;
        }

        .family-member-spending-row { min-width: 0; }

        .family-member-spending-copy {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
          margin-bottom: 7px;
        }

        .family-member-spending-copy > span { display: grid; gap: 3px; min-width: 0; }
        .family-member-spending-copy > span strong { overflow: hidden; color: var(--text-primary, #293653); font-size: 12px; text-overflow: ellipsis; white-space: nowrap; }
        .family-member-spending-copy small { color: var(--text-secondary, #748099); font-size: 10px; }
        .family-member-spending-copy > strong { flex: 0 0 auto; color: var(--text-primary, #293653); font-size: 12px; font-variant-numeric: tabular-nums; }

        .family-member-spending-track {
          height: 7px;
          overflow: hidden;
          border-radius: 99px;
          background: rgba(107, 120, 151, .12);
        }

        .family-member-spending-track > span {
          display: block;
          height: 100%;
          border-radius: inherit;
          background: linear-gradient(90deg, #7771f2, #43bca7);
          transition: width .35s ease;
        }

        .family-member-spending-empty {
          margin: 17px 0 0;
          padding: 15px;
          border: 1px dashed var(--border-color, #dce3f0);
          border-radius: 10px;
          color: var(--text-secondary, #748099);
          font-size: 12px;
          text-align: center;
        }

        .family-member-spending-note {
          margin: 14px 0 0;
          color: var(--text-secondary, #748099);
          font-size: 10px;
          line-height: 1.5;
        }

        .family-summary {
          min-width: 0;
          padding: 17px;
          border: 1px solid var(--border-color, #e5eaf3);
          border-radius: 14px;
          background: var(--card-background, #fff);
        }

        .summary-icon {
          width: 36px;
          height: 36px;
          display: flex;
          align-items: center;
          justify-content: center;
          margin-bottom: 12px;
          border-radius: 10px;
        }

        .income-summary .summary-icon {
          background: #e5f8ed;
          color: #159653;
        }

        .expense-summary .summary-icon {
          background: #fff0ed;
          color: #dc5948;
        }

        .balance-summary .summary-icon {
          background: #eef0ff;
          color: #6257f5;
        }

        .family-summary span,
        .family-summary strong {
          display: block;
        }

        .family-summary span {
          color: var(--text-secondary, #748099);
          font-size: 12px;
        }

        .family-summary strong {
          margin-top: 7px;
          font-size: 18px;
          overflow-wrap: anywhere;
          font-variant-numeric: tabular-nums;
        }

        .family-transaction-form,
        .family-edit-form {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 14px;
        }

        .family-transaction-form label,
        .family-edit-form label {
          display: flex;
          flex-direction: column;
          gap: 7px;
          color: var(--text-secondary, #65718a);
          font-size: 13px;
          font-weight: 600;
        }

        .family-full-field {
          grid-column: 1 / -1;
        }

        .family-submit-button {
          grid-column: 1 / -1;
          width: 100%;
          min-height: 48px !important;
        }

        .family-count {
          padding: 7px 10px;
          border-radius: 20px;
          background: #eef0ff;
          color: #6257f5;
          font-size: 12px;
          font-weight: 600;
          white-space: nowrap;
        }

        .family-empty {
          padding: 20px 0;
          color: var(--text-secondary, #748099);
          font-size: 14px;
        }

        .family-transaction-list {
          display: flex;
          flex-direction: column;
          gap: 11px;
          margin-top: 17px;
        }

        .family-transaction {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 14px;
          padding: 15px;
          border: 1px solid var(--border-color, #e5eaf3);
          border-radius: 13px;
          background: var(--card-background, #fff);
        }

        .transaction-main {
          display: flex;
          align-items: center;
          gap: 12px;
          min-width: 0;
        }

        .family-sharing .transaction-icon {
          width: 42px;
          height: 42px;
          min-width: 42px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 12px;
        }

        .family-sharing .transaction-icon.income {
          background: #e5f8ed;
          color: #159653;
        }

        .family-sharing .transaction-icon.expense {
          background: #fff0ed;
          color: #dc5948;
        }

        .transaction-info {
          display: flex;
          flex-direction: column;
          gap: 4px;
          min-width: 0;
        }

        .transaction-info strong {
          font-size: 14px;
        }

        .transaction-info span,
        .transaction-info small {
          color: var(--text-secondary, #748099);
          font-size: 12px;
          overflow-wrap: anywhere;
        }

        .transaction-right {
          display: flex;
          flex-direction: column;
          align-items: flex-end;
          gap: 9px;
          flex-shrink: 0;
        }

        .transaction-right > strong {
          font-size: 15px;
          white-space: nowrap;
          font-variant-numeric: tabular-nums;
        }

        .transaction-income {
          color: #159653;
        }

        .transaction-expense {
          color: #dc5948;
        }

        .transaction-actions,
        .family-action-row {
          display: flex;
          align-items: center;
          gap: 7px;
          flex-wrap: wrap;
        }

        .transaction-actions button {
          min-height: 31px;
          padding: 6px 9px;
          font-size: 11px;
        }

        .edit-transaction-button {
          background: #eef0ff !important;
          color: #5145d8 !important;
        }

        .delete-transaction-button {
          background: #fff0ed !important;
          color: #c83c30 !important;
        }

        .family-edit-form {
          width: 100%;
          padding: 5px;
        }

        .family-edit-form h4 {
          grid-column: 1 / -1;
          margin: 0;
          font-size: 16px;
        }

        .family-action-row {
          grid-column: 1 / -1;
        }

        .family-cancel-button {
          background: #edf0f5 !important;
          color: #46516a !important;
        }

        @media (max-width: 650px) {
          .family-heading-content h2 {
            font-size: 23px;
          }

          .family-heading-icon {
            width: 52px;
            height: 52px;
            min-width: 52px;
          }

          .family-sharing .family-card,
          .family-dashboard {
            padding: 16px;
            border-radius: 15px;
          }

          .family-form,
          .family-transaction-form,
          .family-edit-form {
            grid-template-columns: 1fr;
          }

          .family-full-field,
          .family-submit-button,
          .family-edit-form h4,
          .family-action-row {
            grid-column: 1;
          }

          .family-form button {
            width: 100%;
          }

          .family-summary-grid {
            grid-template-columns: 1fr;
          }

          .family-member-spending { padding: 13px; }
          .family-member-spending-heading { flex-direction: column; }
          .family-report-month { width: 100%; }
          .family-sharing .family-report-month input { width: 100%; }

          .family-summary {
            display: grid;
            grid-template-columns: 42px 1fr;
            align-items: center;
            column-gap: 10px;
          }

          .summary-icon {
            grid-row: span 2;
            margin: 0;
          }

          .family-summary strong {
            margin-top: 3px;
          }

          .family-transaction {
            align-items: flex-start;
            flex-direction: column;
          }

          .family-member {
            align-items: flex-start;
            flex-direction: column;
          }

          .family-member-actions {
            width: 100%;
            justify-content: space-between;
          }

          .transaction-right {
            width: 100%;
            align-items: flex-start;
            padding-left: 54px;
          }

          .family-history-heading {
            align-items: flex-start;
            flex-direction: column;
          }
        }

        html[data-theme='dark'] .family-sharing {
          --text-primary: #e8eef8;
          --text-secondary: #9aa9bd;
          --border-color: #29384f;
          --card-background: #0e1727;
          --input-background: #0b1524;
          color: #e8eef8;
        }

        html[data-theme='dark'] .family-heading-icon,
        html[data-theme='dark'] .member-avatar {
          background: #202d4a;
          color: #aab7ff;
        }

        html[data-theme='dark'] .family-heading-content .eyebrow { color: #8c9cff; }
        html[data-theme='dark'] .family-sharing input::placeholder { color: #738199; }
        html[data-theme='dark'] .family-item.selected { background: #202d4a; }
        html[data-theme='dark'] .member-role { color: #aebaff; }
        html[data-theme='dark'] .family-invite-code code { background: #202d4a; color: #b6c2ff; }
        html[data-theme='dark'] .family-error { background: #46272c; color: #ff9b91; }
        html[data-theme='dark'] .family-success { background: #17382f; color: #70dfb5; }
        html[data-theme='dark'] .family-refresh { background: #202d4a !important; color: #b6c2ff !important; }
        html[data-theme='dark'] .income-summary .summary-icon { background: #17382f; color: #70dfb5; }
        html[data-theme='dark'] .expense-summary .summary-icon { background: #46272c; color: #ff9b91; }
        html[data-theme='dark'] .balance-summary .summary-icon { background: #202d4a; color: #b6c2ff; }
        html[data-theme='dark'] .family-count { background: #202d4a; color: #b6c2ff; }
        html[data-theme='dark'] .family-remove-member-button { border-color: #644044 !important; background: #46272c !important; color: #ff9b91 !important; }
        html[data-theme='dark'] .transaction-income { color: #70dfb5; }
        html[data-theme='dark'] .transaction-expense { color: #ff9b91; }
        html[data-theme='dark'] .edit-transaction-button { background: #202d4a !important; color: #b6c2ff !important; }
        html[data-theme='dark'] .delete-transaction-button { background: #46272c !important; color: #ff9b91 !important; }
        html[data-theme='dark'] .family-cancel-button { background: #26344a !important; color: #c4d0e0 !important; }
      `}</style>
    </div>
  );
}
