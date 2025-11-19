import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../../supabaseClient';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import './Settings.css';
import AppCard from '../reusable/AppCard';

export default function Settings(props) {
    const { user } = useAuth();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    
    // Settings state
    const [currency, setCurrency] = useState('USD');
    const [theme, setTheme] = useState('light');
    const [notifications, setNotifications] = useState({
        emailAlerts: true,
        transactionAlerts: true,
        budgetAlerts: true,
        weeklyReport: false
    });

    const currencies = [
        "AED", "AUD", "BRL", "CAD", "CHF", "CLP", "COP", "CNY", "CZK", "DKK",
        "EUR", "GBP", "HKD", "HUF", "IDR", "ILS", "INR", "JPY", "KRW", "MXN",
        "MYR", "NOK", "NZD", "PHP", "PLN", "RON", "RUB", "SAR", "SEK", "SGD",
        "THB", "TWD", "TRY", "USD", "ZAR"
    ];

    useEffect(() => {
        loadSettings();
    }, [user]);

    const loadSettings = async () => {
        try {
            setLoading(true);
            
            const { data, error } = await supabase
                .from('user_settings')
                .select('*')
                .eq('user_id', user.id)
                .single();

            if (error && error.code !== 'PGRST116') {
                throw error;
            }

            if (data) {
                setCurrency(data.currency || 'USD');
                setTheme(data.theme || 'light');
                setNotifications(data.notifications || {
                    emailAlerts: true,
                    transactionAlerts: true,
                    budgetAlerts: true,
                    weeklyReport: false
                });
            }
        } catch (error) {
            console.error('Error loading settings:', error);
            toast.error('Failed to load settings', {
            position: "top-right",
            autoClose: 2000, // disappears after 2 seconds
            hideProgressBar: true,
            closeOnClick: true,
            pauseOnHover: false,
            draggable: false,
        });
        } finally {
            setLoading(false);
        }
    };

    const saveSettings = async () => {
        try {
            setSaving(true);

            const settingsData = {
                user_id: user.id,
                currency,
                theme,
                notifications,
                updated_at: new Date().toISOString()
            };

            const { error } = await supabase
                .from('user_settings')
                .upsert(settingsData, {
                    onConflict: 'user_id'
                });

            if (error) throw error;

            toast.success('Settings saved successfully!', {
                position: "top-right",
                autoClose: 2000, // disappears after 2 seconds
                hideProgressBar: true,
                closeOnClick: true,
                pauseOnHover: false,
                draggable: false,
            });
            
            document.documentElement.setAttribute('data-theme', theme);
        } catch (error) {
            console.error('Error saving settings:', error);
            toast.error('Failed to save settings', {
                position: "top-right",
                autoClose: 2000, // disappears after 2 seconds
                hideProgressBar: true,
                closeOnClick: true,
                pauseOnHover: false,
                draggable: false,
            });
        } finally {
            setSaving(false);
        }
    };

    const handleCurrencyChange = (e) => {
        setCurrency(e.target.value);
    };

    const handleThemeChange = (selectedTheme) => {
        setTheme(selectedTheme);
    };

    const handleNotificationToggle = (key) => {
        setNotifications(prev => ({
            ...prev,
            [key]: !prev[key]
        }));
    };

    if (loading) {
        return (
            <div className="loading-page">
                <div className="spinner"></div>
                <p style={{ marginTop: '16px', color: '#4f5b6cff', fontSize: '14px', marginLeft: '13px'}}>
                    Loading settings...
                </p>
            </div>
        );
    }

    return (
        <div className="page-content">
            <ToastContainer position="top-right" autoClose={3000} />
            
            <div className="settings-page">
                <h1>⚙ Settings</h1>

                <div className="row">
                    {/* Currency Settings */}
                    <div>
                        <AppCard width="100%" >
                            <div class="default-currency">
                                <div>
                                    <h3>💱 Default Currency</h3>
                                    <p className="setting-description">
                                        Select your preferred currency for displaying amounts throughout the app.
                                    </p>
                                </div>
                                <select
                                    value={currency}
                                    onChange={handleCurrencyChange}
                                    className="currency-select"
                                >
                                    {currencies.map(curr => (
                                        <option key={curr}>
                                            {curr}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </AppCard>
                    </div>

                    {/* Theme Settings */}
                    <div>
                        <AppCard width="100%" marginTop="25px">
                            <div class="theme">
                                <div>
                                    <h3>🎨 Appearance</h3>
                                    <p className="setting-description">
                                        Choose your preferred theme for the application.
                                    </p>
                                </div>
                                <div className="theme-buttons">
                                    <button
                                        onClick={() => handleThemeChange('light')}
                                        className={`theme-button ${theme === 'light' ? 'active' : ''}`}
                                    >
                                        ☀️ Light Mode
                                    </button>
                                    <button
                                        onClick={() => handleThemeChange('dark')}
                                        className={`theme-button ${theme === 'dark' ? 'active' : ''}`}
                                    >
                                        🌙 Dark Mode
                                    </button>
                                </div>
                            </div>
                        </AppCard>
                    </div>

                    {/* Notification Settings */}
                    <div>
                        <AppCard width="100%" marginTop="25px">
                            <h3>🔔 Notification Preferences</h3>
                            <p className="setting-description">
                                Manage how and when you receive notifications.
                            </p>
                            
                            <div className="notifications-list">
                                <div className="notification-item">
                                    <div style={{marginLeft: "10px"}}>
                                        <div className="notification-title">Email Alerts</div>
                                        <div className="notification-description">Receive important updates via email</div>
                                    </div>
                                    <button
                                        onClick={() => handleNotificationToggle('emailAlerts')}
                                        className={`toggle-switch ${notifications.emailAlerts ? 'active' : ''}`}
                                    >
                                        <span className="toggle-slider" />
                                    </button>
                                </div>

                                <div className="notification-item">
                                    <div style={{marginLeft: "10px"}}>
                                        <div className="notification-title">Transaction Alerts</div>
                                        <div className="notification-description">Get notified for each transaction</div>
                                    </div>
                                    <button
                                        onClick={() => handleNotificationToggle('transactionAlerts')}
                                        className={`toggle-switch ${notifications.transactionAlerts ? 'active' : ''}`}
                                    >
                                        <span className="toggle-slider" />
                                    </button>
                                </div>

                                <div className="notification-item">
                                    <div style={{marginLeft: "10px"}}>
                                        <div className="notification-title">Budget Alerts</div>
                                        <div className="notification-description">Alerts when approaching budget limits</div>
                                    </div>
                                    <button
                                        onClick={() => handleNotificationToggle('budgetAlerts')}
                                        className={`toggle-switch ${notifications.budgetAlerts ? 'active' : ''}`}
                                    >
                                        <span className="toggle-slider" />
                                    </button>
                                </div>

                                <div className="notification-item last">
                                    <div style={{marginLeft: "10px"}}>
                                        <div className="notification-title">Weekly Report</div>
                                        <div className="notification-description">Receive a weekly summary of your finances</div>
                                    </div>
                                    <button
                                        onClick={() => handleNotificationToggle('weeklyReport')}
                                        className={`toggle-switch ${notifications.weeklyReport ? 'active' : ''}`}
                                    >
                                        <span className="toggle-slider" />
                                    </button>
                                </div>
                            </div>
                        </AppCard>
                    </div>
                </div>

                {/* Save Button */}
                <div className="row">
                    <div className="col-12">
                        <div className="save-button-container">
                            <button
                                onClick={saveSettings}
                                disabled={saving}
                                className="btn-add"
                            >
                                {saving ? 'Saving...' : 'Save Settings'}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}