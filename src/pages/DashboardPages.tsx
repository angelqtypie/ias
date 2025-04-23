import React, { useEffect, useState } from 'react';
import {
  IonPage, IonHeader, IonToolbar, IonTitle, IonContent,
  IonCard, IonCardHeader, IonCardTitle, IonCardContent,
  IonList, IonItem, IonLabel, IonText, IonSpinner, IonButton
} from '@ionic/react';
import { supabase } from '../utils/supabaseClient';

const DashboardPage: React.FC = () => {
  const [users, setUsers] = useState<any[]>([]);
  const [userLogs, setUserLogs] = useState<any[]>([]);
  const [adminLogs, setAdminLogs] = useState<any[]>([]);
  const [userLogCount, setUserLogCount] = useState(0);
  const [loading, setLoading] = useState(true);

  const fetchDashboardData = async () => {
    setLoading(true);
    const now = new Date();
    const tenMinutesAgo = new Date(now.getTime() - 10 * 60 * 1000).toISOString();
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    // Cleanup expired logs
    await supabase.from('login_logs').delete().lt('expire_at', now.toISOString());

    // Fetch login logs
    const { data: logs, error: logError } = await supabase
      .from('login_logs')
      .select('email, logged_in_at, role')
      .order('logged_in_at', { ascending: false });

    if (logError) {
      console.error('Error fetching logs:', logError.message);
      return;
    }

    // Fetch user info to merge names and passwords
    const { data: userProfiles, error: userError } = await supabase
      .from('users')
      .select('full_name, email, user_password');

    if (userError) {
      console.error('Error fetching users:', userError.message);
      return;
    }

    const mergedLogs = (logs || []).map((log: any) => {
      const user = userProfiles?.find(u => u.email.toLowerCase() === log.email.toLowerCase());
      return {
        ...log,
        full_name: user?.full_name || '',
        user_password: user?.user_password || ''
      };
    });

    const recentUserLogs = mergedLogs.filter(
      log => log.role === 'user' && log.logged_in_at >= tenMinutesAgo
    );
    const adminLogs = mergedLogs.filter(log => log.role === 'admin');

    // Count of unique users who logged in today
    const uniqueTodayUsers = new Set(
      mergedLogs
        .filter(log => new Date(log.logged_in_at) >= startOfDay)
        .map(log => log.email)
    );

    setUserLogs(recentUserLogs);
    setAdminLogs(adminLogs);
    setUserLogCount(uniqueTodayUsers.size);
    setLoading(false);
  };

  const fetchUsers = async () => {
    const { data, error } = await supabase
      .from('users')
      .select('full_name, email, role, created_at, user_password')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching users:', error.message);
    } else {
      setUsers(data || []);
    }
  };

  useEffect(() => {
    fetchDashboardData();
    fetchUsers();
    const interval = setInterval(() => {
      fetchDashboardData();
    }, 10000); // Refresh every 10s
    return () => clearInterval(interval);
  }, []);

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar color="dark">
          <IonTitle>Admin Dashboard</IonTitle>
        </IonToolbar>
      </IonHeader>

      <IonContent className="ion-padding">
        <IonButton expand="block" color="medium" routerLink="/auth" style={{ marginBottom: '16px' }}>
          🔙 Back to Login
        </IonButton>

        <IonCard>
          <IonCardHeader>
            <IonCardTitle>📈  Unique user(s) logged in today: {userLogCount}</IonCardTitle>
          </IonCardHeader>
        </IonCard>

        {/* 👥 Registered Admin */}
        <IonCard>
          <IonCardHeader>
            <IonCardTitle>👥 Registered Admin</IonCardTitle>
          </IonCardHeader>
          <IonCardContent>
            {users.length === 0 ? (
              <IonText>No users found.</IonText>
            ) : (
              <IonList>
                {users.filter(user => user.role === 'admin').map((user, index) => (
                  <IonItem key={index}>
                    <IonLabel>
                      <h2>{user.full_name || 'Unnamed User'}</h2>
                      <p>{user.email} ({user.role})</p>
                      <p><small>Registered: {new Date(user.created_at).toLocaleString()}</small></p>
                      {user.user_password && (
                        <p style={{ fontSize: '12px', wordBreak: 'break-word' }}>
                          <strong>Password:</strong><br /> {user.user_password}
                        </p>
                      )}
                    </IonLabel>
                  </IonItem>
                ))}
              </IonList>
            )}
          </IonCardContent>
        </IonCard>

        {/* 🧑‍💼 User Login Logs */}
        <IonCard>
          <IonCardHeader>
            <IonCardTitle>🧑‍💼 User Login Logs</IonCardTitle>
          </IonCardHeader>
          <IonCardContent>
            {loading ? (
              <IonSpinner name="dots" />
            ) : (
              <IonList>
                {userLogs.length === 0 ? (
                  <IonText>No user logins recently.</IonText>
                ) : (
                  userLogs.map((log, index) => (
                    <IonItem key={index}>
                      <IonLabel>
                        <h2>{log.full_name || log.email}</h2>
                        <p>{log.email}</p>
                        <p>🕓 {new Date(log.logged_in_at).toLocaleString()}</p>
                        {log.user_password && (
                          <p style={{ fontSize: '12px', wordBreak: 'break-word' }}>
                            <strong>Hashed Password:</strong><br /> {log.user_password}
                          </p>
                        )}
                      </IonLabel>
                    </IonItem>
                  ))
                )}
              </IonList>
            )}
          </IonCardContent>
        </IonCard>

        {/* 🛡️ Admin Logs */}
        <IonCard>
          <IonCardHeader>
            <IonCardTitle>🛡️ Admin Login Logs</IonCardTitle>
          </IonCardHeader>
          <IonCardContent>
            {loading ? (
              <IonSpinner name="dots" />
            ) : (
              <IonList>
                {adminLogs.length === 0 ? (
                  <IonText>No admin logins found.</IonText>
                ) : (
                  adminLogs.map((log, index) => (
                    <IonItem key={index}>
                      <IonLabel>
                        <h2>{log.full_name || log.email}</h2>
                        <p>{log.email}</p>
                        <p>🕓 {new Date(log.logged_in_at).toLocaleString()}</p>
                        {log.user_password && (
                          <p style={{ fontSize: '12px', wordBreak: 'break-word' }}>
                            <strong>Hashed Password:</strong><br /> {log.user_password}
                          </p>
                        )}
                      </IonLabel>
                    </IonItem>
                  ))
                )}
              </IonList>
            )}
          </IonCardContent>
        </IonCard>
      </IonContent>
    </IonPage>
  );
};

export default DashboardPage;
