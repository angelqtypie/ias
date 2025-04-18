import React, { useEffect, useState } from 'react';
import {
  IonPage, IonHeader, IonToolbar, IonTitle, IonContent,
  IonCard, IonCardHeader, IonCardTitle, IonCardContent,
  IonList, IonItem, IonLabel, IonText, IonSpinner
} from '@ionic/react';
import { supabase } from '../utils/supabaseClient';

const DashboardPage: React.FC = () => {
  const [logs, setLogs] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchLogs = async () => {
    // Cleanup expired logs first
    await supabase
      .from('login_logs')
      .delete()
      .lt('expire_at', new Date().toISOString());
  
    // Then fetch the logs
    const { data, error } = await supabase
      .from('login_logs')
      .select('email, logged_in_at')
      .order('logged_in_at', { ascending: false });
  
    if (error) {
      console.error('Failed to fetch logs:', error.message);
    } else {
      setLogs(data);
    }
  
    setLoading(false);
  };
  
  const fetchUsers = async () => {
    const { data, error } = await supabase
      .from('users')
      .select('full_name, email, role, created_at, user_password')
      .order('created_at', { ascending: false });
  
    if (error) {
      console.error('Failed to fetch users:', error.message);
    } else {
      setUsers(data);
    }
  };
  

  useEffect(() => {
    fetchLogs();
    fetchUsers();
  }, []);

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar color="primary">
          <IonTitle>Admin Dashboard</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent className="ion-padding">
        
        {/* Registered Users */}
        <IonCard>
          <IonCardHeader>
            <IonCardTitle>👥 Registered Users</IonCardTitle>
          </IonCardHeader>
          <IonCardContent>
            {users.length === 0 ? (
              <IonText>No users found.</IonText>
            ) : (
              <IonList>
                {users.map((user, index) => (
                  <IonItem key={index}>
                  <IonLabel>
                    <h2>{user.full_name || 'Unnamed User'}</h2>
                    <p>{user.email} ({user.role})</p>
                    <p><small>Registered: {new Date(user.created_at).toLocaleString()}</small></p>
              
                    {user.user_password && (
  <p style={{ fontSize: '12px', wordBreak: 'break-all' }}>
    🔐 <strong>Hashed Password:</strong><br /> {user.user_password}
  </p>
)}
                  </IonLabel>
                </IonItem>
              ))}
              </IonList>
            )}
          </IonCardContent>
        </IonCard>

        {/* Login Logs */}
        <IonCard>
          <IonCardHeader>
            <IonCardTitle>🕵️ Login Audit Logs</IonCardTitle>
          </IonCardHeader>
          <IonCardContent>
            {loading ? (
              <IonSpinner name="dots" />
            ) : (
              <IonList>
                {logs.length === 0 ? (
                  <IonText>No login activity yet.</IonText>
                ) : (
                  logs.map((log, index) => (
                    <IonItem key={index}>
                      <IonLabel>
                        <h2>{log.email}</h2>
                        <p>🕓 {new Date(log.logged_in_at).toLocaleString()}</p>
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
