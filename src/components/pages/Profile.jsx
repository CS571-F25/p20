import { useState, useEffect } from 'react';
import { User, Mail, Calendar, Wallet, Target, LogOut, Trash2, Edit, Lock, Download, Upload, X } from "lucide-react";
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../../supabaseClient';
import { fetchExchangeRates, convertToBase } from '../reusable/currencyConverter';
import { useSettings } from '../contexts/SettingsContext';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import './Profile.css';

export default function Profile(props) {
  const { user } = useAuth();
  const { settings } = useSettings();
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [rates, setRates] = useState({});
  const [profileData, setProfileData] = useState({
    name: '',
    email: '',
    memberSince: '',
    totalBalance: 0,
    budgets: 0,
    transactions: 0,
    avatarUrl: null
  });
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showEditProfile, setShowEditProfile] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [editName, setEditName] = useState('');
  const [saving, setSaving] = useState(false);
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    loadProfileData();
  }, [user]);

  const loadProfileData = async () => {
    try {
        setLoading(true);

        // Fetch exchange rates
        const exchangeRates = await fetchExchangeRates(settings.currency);
        setRates(exchangeRates);

        const { data: userData } = await supabase.auth.getUser();
        const memberSince = userData?.user?.created_at 
        ? new Date(userData.user.created_at).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
        : 'Recently';

        const { data: transactions } = await supabase
        .from('transactions')
        .select('amount, currency')
        .eq('user_id', user.id);

        // Convert all transactions to USD
        const totalBalance = transactions?.reduce((sum, t) => {
        const convertedAmount = convertToBase(t.amount, t.currency || 'USD', exchangeRates);
        return sum + convertedAmount;
        }, 0) || 0;

        const { data: budgets } = await supabase
        .from('budgets')
        .select('id')
        .eq('user_id', user.id);

        const name = user.user_metadata?.full_name || user.email?.split('@')[0] || 'User';
        const avatarUrl = user.user_metadata?.avatar_url || null;

        setProfileData({
        name,
        email: user.email,
        memberSince,
        totalBalance,
        budgets: budgets?.length || 0,
        transactions: transactions?.length || 0,
        avatarUrl
        });

        setEditName(name);
    } catch (error) {
        console.error('Error loading profile:', error);
        toast.error('Failed to load profile data', {
        position: "top-right",
        autoClose: 2000,
        hideProgressBar: true,
        closeOnClick: true,
        pauseOnHover: false,
        draggable: false,
        });
    } finally {
        setLoading(false);
    }
    };

    const handleEditProfile = async () => {
    try {
        setSaving(true);

        const { error } = await supabase.auth.updateUser({
        data: { full_name: editName }
        });

        if (error) throw error;

        toast.success('Profile updated successfully!', {
        position: "top-right",
        autoClose: 2000,
        hideProgressBar: true,
        closeOnClick: true,
        pauseOnHover: false,
        draggable: false,
        });

        setShowEditProfile(false);
        loadProfileData();
    } catch (error) {
        console.error('Error updating profile:', error);
        toast.error('Failed to update profile', {
        position: "top-right",
        autoClose: 2000,
        hideProgressBar: true,
        closeOnClick: true,
        pauseOnHover: false,
        draggable: false,
        });
    } finally {
        setSaving(false);
    }
  };

  const uploadAvatar = async (event) => {
    try {
        setUploading(true);
        
        if (!event.target.files || event.target.files.length === 0) {
            return;
        }

        const file = event.target.files[0];
        const fileExt = file.name.split('.').pop();
        const fileName = `${user.id}/${Math.random()}.${fileExt}`;

        const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(fileName, file, { upsert: true });

        if (uploadError) throw uploadError;

        const { data } = supabase.storage
        .from('avatars')
        .getPublicUrl(fileName);

        const { error: updateError } = await supabase.auth.updateUser({
        data: { avatar_url: data.publicUrl }
        });

        if (updateError) throw updateError;

        toast.success('Profile picture updated!', {
            position: "top-right",
            autoClose: 2000,
            hideProgressBar: true,
            closeOnClick: true,
            pauseOnHover: false,
            draggable: false,
        });
        loadProfileData();

    } catch (error) {
        console.error('Error uploading avatar:', error);
        toast.error('Failed to upload profile picture', {
        position: "top-right",
        autoClose: 2000,
        hideProgressBar: true,
        closeOnClick: true,
        pauseOnHover: false,
        draggable: false,
        });
    } finally {
        setUploading(false);
    }
    };

    const removeAvatar = async () => {
    try {
        setUploading(true);

        const { error } = await supabase.auth.updateUser({
        data: { avatar_url: null }
        });

        if (error) throw error;

        toast.success('Profile picture removed!', {
        position: "top-right",
        autoClose: 2000,
        hideProgressBar: true,
        closeOnClick: true,
        pauseOnHover: false,
        draggable: false,
        });

        loadProfileData();
    } catch (error) {
        console.error('Error removing avatar:', error);
        toast.error('Failed to remove profile picture', {
        position: "top-right",
        autoClose: 2000,
        hideProgressBar: true,
        closeOnClick: true,
        pauseOnHover: false,
        draggable: false,
        });
    } finally {
        setUploading(false);
    }
    };

  const handleChangePassword = async () => {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(user.email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });

      if (error) throw error;

      toast.success('Password reset email sent! Check your inbox.', {
        position: "top-right",
        autoClose: 3000,
        hideProgressBar: true,
        closeOnClick: true,
        pauseOnHover: false,
        draggable: false,
      });
    } catch (error) {
      console.error('Error sending reset email:', error);
      toast.error('Failed to send password reset email', {
        position: "top-right",
        autoClose: 2000,
        hideProgressBar: true,
        closeOnClick: true,
        pauseOnHover: false,
        draggable: false,
      });
    }
  };

  const handleExportData = async () => {
    try {
      setExporting(true);

      // Fetch all user data
      const { data: transactions } = await supabase
        .from('transactions')
        .select('*')
        .eq('user_id', user.id)
        .order('date', { ascending: false });

      const { data: budgets } = await supabase
        .from('budgets')
        .select('*')
        .eq('user_id', user.id);

      const { data: settings } = await supabase
        .from('user_settings')
        .select('*')
        .eq('user_id', user.id)
        .single();

      // Create export object
      const exportData = {
        profile: {
          name: profileData.name,
          email: profileData.email,
          memberSince: profileData.memberSince,
          exportDate: new Date().toISOString()
        },
        transactions: transactions || [],
        budgets: budgets || [],
        settings: settings || {},
        summary: {
          totalTransactions: transactions?.length || 0,
          totalBudgets: budgets?.length || 0,
          totalBalance: profileData.totalBalance
        }
      };

      // Convert to JSON and download
      const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `walletpalz-data-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast.success('Data exported successfully!', {
        position: "top-right",
        autoClose: 2000,
        hideProgressBar: true,
        closeOnClick: true,
        pauseOnHover: false,
        draggable: false,
      });
    } catch (error) {
      console.error('Error exporting data:', error);
      toast.error('Failed to export data', {
        position: "top-right",
        autoClose: 2000,
        hideProgressBar: true,
        closeOnClick: true,
        pauseOnHover: false,
        draggable: false,
      });
    } finally {
      setExporting(false);
    }
  };

    const handleDeleteAccount = async () => {
    try {
        setDeleting(true);

        // Delete user's budgets
        await supabase
        .from('budgets')
        .delete()
        .eq('user_id', user.id);

        // Delete user's transactions
        await supabase
        .from('transactions')
        .delete()
        .eq('user_id', user.id);

        // Only delete user_settings if the table exists
        try {
        await supabase
            .from('user_settings')
            .delete()
            .eq('user_id', user.id);
        } catch (e) {
        // Silently ignore if table doesn't exist
        console.log('user_settings not found, skipping...');
        }

        // Delete the user account
        const { error } = await supabase.rpc('delete_user');
        
        if (error) throw error;

        toast.success('Account deleted successfully', {
        position: "top-right",
        autoClose: 2000,
        hideProgressBar: true,
        closeOnClick: true,
        pauseOnHover: false,
        draggable: false,
        });

        // Don't call signOut() - user is already deleted
        // Just redirect to home after a short delay
        setTimeout(() => {
        window.location.href = '/';
        }, 2000);

    } catch (error) {
        console.error('Error deleting account:', error);
        toast.error('Failed to delete account. Please contact support.', {
        position: "top-right",
        autoClose: 3000,
        hideProgressBar: true,
        closeOnClick: true,
        pauseOnHover: false,
        draggable: false,
        });
    } finally {
        setDeleting(false);
        setShowDeleteConfirm(false);
    }
    };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
  };

  if (loading) {
    return (
      <div className="loading-page">
        <div className="spinner"></div>
        <p style={{ marginTop: '16px', color: '#4f5b6cff', fontSize: '14px', marginLeft: '13px'}}>
          Loading profile...
        </p>
      </div>
    );
  }

  return (
    <div className="page-content">
      <ToastContainer position="top-right" autoClose={3000} />
      
      <div className="profile-page">
        {/* Profile Header Card */}
        <div className="profile-card">
          <div className="profile-header">
            <div className="profile-avatar">
              {profileData.avatarUrl ? (
                <img src={profileData.avatarUrl} alt="Profile" className="profile-avatar-img" />
              ) : (
                <User className="avatar-icon" />
              )}
            </div>
            <div className="profile-info">
              <h2>{profileData.name}</h2>
              <div className="profile-email">
                <Mail className="icon-small" />
                {profileData.email}
              </div>
            </div>
          </div>

          <div className="profile-member-since">
            <Calendar className="icon-small" />
            <span>Member since {profileData.memberSince}</span>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-label">
              <Wallet className="stat-icon" />
              <span>Total Balance ({settings.currency})</span>
            </div>
            <p className="stat-value" style={{color: (profileData.totalBalance === 0) ? "#2e392fff" : (profileData.totalBalance >= 0)? "#4CAF50" : "#F44336"}}>
                {profileData.totalBalance.toFixed(2).toLocaleString()}</p>
          </div>

          <div className="stat-card">
            <div className="stat-label">
              <Target className="stat-icon" />
              <span>Budgets</span>
            </div>
            <p className="stat-value">{profileData.budgets}</p>
          </div>

          <div className="stat-card">
            <div className="stat-label">
              <Wallet className="stat-icon" />
              <span>Transactions</span>
            </div>
            <p className="stat-value">{profileData.transactions}</p>
          </div>
        </div>

        {/* Account Actions */}
        <div className="profile-card">
          <h3>Account Actions</h3>
          
          <div className="actions-list">
            <button className="action-button" onClick={() => setShowEditProfile(true)}>
              <Edit className="button-icon" />
              Edit Profile Information
            </button>

            <button className="action-button" onClick={handleChangePassword}>
              <Lock className="button-icon" />
              Change Password
            </button>

            <button 
              className="action-button" 
              onClick={handleExportData}
              disabled={exporting}
            >
              <Download className="button-icon" />
              {exporting ? 'Exporting...' : 'Export My Data'}
            </button>

            <button className="action-button sign-out" onClick={handleSignOut}>
              <LogOut className="button-icon" />
              Logout
            </button>

            <button 
              className="action-button delete-account" 
              onClick={() => setShowDeleteConfirm(true)}
            >
              <Trash2 className="button-icon" />
              Delete Account
            </button>
          </div>
        </div>

        {/* Edit Profile Modal */}
        {showEditProfile && (
          <div className="modal-overlay" onClick={() => setShowEditProfile(false)}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
              <h3>Edit Profile</h3>
              
              <div className="form-group">
                <label>Profile Picture</label>
                <div className="avatar-upload-section">
                  <div className="current-avatar">
                    {profileData.avatarUrl ? (
                      <img src={profileData.avatarUrl} alt="Profile" className="edit-avatar-img" />
                    ) : (
                      <div className="edit-avatar-placeholder">
                        <User style={{ width: '32px', height: '32px', color: '#718096' }} />
                      </div>
                    )}
                  </div>
                  <div className="avatar-upload-controls">
                    <input
                      type="file"
                      id="avatar-upload"
                      accept="image/*"
                      style={{ display: 'none' }}
                      onChange={uploadAvatar}
                      disabled={uploading}
                    />
                    <label htmlFor="avatar-upload" className="upload-button">
                        <Upload className="button-icon-small" />
                        {uploading ? 'Uploading...' : 'Change Picture'}
                    </label>
                    {profileData.avatarUrl && (
                        <button 
                            className="remove-button" 
                            onClick={removeAvatar}
                            disabled={uploading}
                        >
                            <X className="button-icon-small" />
                            Remove
                        </button>
                    )}
                  </div>
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="edit-name">Display Name</label>
                <input
                  id="edit-name"
                  type="text"
                  className="form-input"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  placeholder="Enter your name"
                />
              </div>
              <div className="form-group">
                <label>Email</label>
                <input
                  type="email"
                  className="form-input"
                  value={profileData.email}
                  disabled
                  style={{ backgroundColor: '#f7fafc', cursor: 'not-allowed' }}
                />
                <p className="form-helper">Email cannot be changed</p>
              </div>
              <div className="modal-actions">
                <button 
                  className="modal-button cancel"
                  onClick={() => setShowEditProfile(false)}
                  disabled={saving}
                >
                  Cancel
                </button>
                <button 
                  className="modal-button confirm"
                  onClick={handleEditProfile}
                  disabled={saving || !editName.trim()}
                >
                  {saving ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Delete Confirmation Modal */}
        {showDeleteConfirm && (
          <div className="modal-overlay" onClick={() => setShowDeleteConfirm(false)}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
              <h3>Delete Account?</h3>
              <p className="modal-description">
                This will permanently delete your account and all associated data including budgets, transactions, and settings. This action cannot be undone.
              </p>
              <div className="modal-actions">
                <button 
                  className="modal-button cancel"
                  onClick={() => setShowDeleteConfirm(false)}
                  disabled={deleting}
                >
                  Cancel
                </button>
                <button 
                  className="modal-button confirm-delete"
                  onClick={handleDeleteAccount}
                  disabled={deleting}
                >
                  {deleting ? 'Deleting...' : 'Delete Account'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}