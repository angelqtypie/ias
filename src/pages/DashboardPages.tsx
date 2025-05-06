import React, { useEffect, useState } from 'react';
import {
  IonPage, IonHeader, IonToolbar, IonTitle, IonContent,
  IonCard, IonCardHeader, IonCardTitle, IonCardContent,
  IonList, IonItem, IonLabel, IonGrid, IonCol, IonRow,
  IonText, IonSpinner, IonButton, IonIcon
} from '@ionic/react';
import { trash, logOutOutline, refreshOutline } from 'ionicons/icons';
import { supabase } from '../utils/supabaseClient';
import '../components/DashboardPage.css';  // Import the enhanced CSS file

const DashboardPage: React.FC = () => {
  const [users, setUsers] = useState<any[]>([]);
  const [userLogs, setUserLogs] = useState<any[]>([]);
  const [adminLogs, setAdminLogs] = useState<any[]>([]);
  const [userLogCount, setUserLogCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [userCount, setUserCount] = useState(0);
  const [adminCount, setAdminCount] = useState(0);

  const fetchDashboardData = async () => {
    setLoading(true);
    const now = new Date();
    const tenMinutesAgo = new Date(now.getTime() - 10 * 60 * 1000).toISOString();
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    await supabase.from('login_logs').delete().lt('expire_at', now.toISOString());

    const { data: logs } = await supabase
      .from('login_logs')
      .select('id, email, logged_in_at, role')
      .order('logged_in_at', { ascending: false });

    const { data: profiles } = await supabase
      .from('users')
      .select('full_name, email, user_password');

    const mergedLogs = (logs || []).map(log => {
      const user = profiles?.find(u => u.email.toLowerCase() === log.email.toLowerCase());
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
    const { data } = await supabase
      .from('users')
      .select('full_name, email, role, created_at, user_password')
      .order('created_at', { ascending: false });

    setUsers(data || []);
    const usersOnly = data?.filter(user => user.role === 'user').length || 0;
    const adminsOnly = data?.filter(user => user.role === 'admin').length || 0;
    setUserCount(usersOnly);
    setAdminCount(adminsOnly);
  };

  const deleteLog = async (logId: string) => {
    await supabase.from('login_logs').delete().eq('id', logId);
    fetchDashboardData();
  };
  

  useEffect(() => {
    fetchDashboardData();
    fetchUsers();
    const interval = setInterval(() => {
      fetchDashboardData();
    }, 10000);
    return () => clearInterval(interval);
  }, []);

  const renderLogItem = (log: any) => (
    <IonItem key={log.id} lines="none">
      <IonLabel>
        <h2>{log.full_name || log.email}</h2>
        <p>{log.email}</p>
        <p>🕓 {new Date(log.logged_in_at).toLocaleString()}</p>
        {log.user_password && (
          <p><strong>Hashed Password:</strong><br /> {log.user_password}</p>
        )}
      </IonLabel>
      <IonButton fill="clear" color="danger" onClick={() => deleteLog(log.id)}>
        <IonIcon icon={trash} />
      </IonButton>
    </IonItem>
  );

  return (
    <IonPage >
      <IonHeader>
        <IonToolbar className="dashboard-header">
          <IonTitle>📊 Admin Dashboard</IonTitle>
          <IonButton slot="end" fill="clear" color="light" onClick={fetchDashboardData}>
            <IonIcon icon={refreshOutline} />
          </IonButton>
        </IonToolbar>
      </IonHeader>

      <IonContent className="ion-padding custom-bg">
        <IonButton expand="block" color="medium" routerLink="/auth" style={{ marginBottom: '20px' }}>
          <IonIcon icon={logOutOutline} slot="start" />
          Back to Login
        </IonButton>

        <IonGrid>
          <IonRow>
            {/* Overview */}
            <IonCol size="12" sizeMd="6">
              <IonCard className="dashboard-card">
                <IonCardHeader>
                  <IonCardTitle>📈 Overview</IonCardTitle>
                </IonCardHeader>
                <IonCardContent>
                  <p>👤 Users: <strong>{userCount}</strong></p>
                  <p>🛡️ Admins: <strong>{adminCount}</strong></p>
                  <p>📅 Logins Today: <strong>{userLogCount}</strong></p>
                </IonCardContent>
              </IonCard>
            </IonCol>

            {/* Registered Admins */}
            <IonCol size="12" sizeMd="6">
              <IonCard className="dashboard-card">
                <IonCardHeader>
                  <IonCardTitle>👥 Registered Admins</IonCardTitle>
                </IonCardHeader>
                <IonCardContent>
                  <IonList>
                    {users.filter(u => u.role === 'admin').length === 0 ? (
                      <IonText>No admins registered.</IonText>
                    ) : (
                      users.filter(u => u.role === 'admin').map((user, index) => (
                        <IonItem key={index} lines="none">
                          <IonLabel>
                            <h2>{user.full_name || 'Unnamed'}</h2>
                            <p>{user.email}</p>
                            <p>🕑 {new Date(user.created_at).toLocaleString()}</p>
                            <p><strong>Password:</strong> {user.user_password}</p>
                          </IonLabel>
                        </IonItem>
                      ))
                    )}
                  </IonList>
                </IonCardContent>
              </IonCard>
            </IonCol>

            {/* User Logins */}
            <IonCol size="12" sizeMd="6">
              <IonCard className="dashboard-card">
                <IonCardHeader>
                  <IonCardTitle>🧑‍💼 Recent User Logins</IonCardTitle>
                </IonCardHeader>
                <IonCardContent>
                  {loading ? (
                    <IonSpinner name="dots" />
                  ) : userLogs.length === 0 ? (
                    <IonText>No recent user logins.</IonText>
                  ) : (
                    <IonList>{userLogs.map(renderLogItem)}</IonList>
                  )}
                </IonCardContent>
              </IonCard>
            </IonCol>

            {/* Admin Logins */}
            <IonCol size="12" sizeMd="6">
              <IonCard className="dashboard-card">
                <IonCardHeader>
                  <IonCardTitle>🛡️ Admin Login Logs</IonCardTitle>
                </IonCardHeader>
                <IonCardContent>
                  {loading ? (
                    <IonSpinner name="dots" />
                  ) : adminLogs.length === 0 ? (
                    <IonText>No admin logins found.</IonText>
                  ) : (
                    <IonList>{adminLogs.map(renderLogItem)}</IonList>
                  )}
                </IonCardContent>
              </IonCard>
            </IonCol>
          </IonRow>
        </IonGrid>
      </IonContent>
    </IonPage>
  );
};

export default DashboardPage;
