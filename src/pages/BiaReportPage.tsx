import React, { useEffect, useState } from 'react';
import {
  IonPage, IonHeader, IonToolbar, IonTitle, IonContent,
  IonCard, IonCardHeader, IonCardTitle, IonCardContent,
  IonList, IonItem, IonLabel, IonSpinner, IonText, IonButtons, IonBackButton
} from '@ionic/react';
import { supabase } from '../utils/supabaseClient';

const BIAReportsPage: React.FC = () => {
  const [biaReports, setBIAReports] = useState<any[]>([]);
  const [recommendations, setRecommendations] = useState<any[]>([]);
  const [incidents, setIncidents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    setLoading(true);

    const { data: biaData } = await supabase
      .from('bia_reports')
      .select('*')
      .order('created_at', { ascending: false });

    const { data: recData } = await supabase
      .from('recommendations')
      .select('*');

    const { data: incidentData } = await supabase
      .from('incidents')
      .select('id, title');

    setBIAReports(biaData || []);
    setRecommendations(recData || []);
    setIncidents(incidentData || []);
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, []);

  const getRecommendationsForBIA = (biaId: string) => {
    return recommendations.filter(rec => rec.bia_id === biaId);
  };

  const getIncidentTitle = (incidentId: string) => {
    return incidents.find(i => i.id === incidentId)?.title || 'Unknown Incident';
  };

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonButtons slot="start">
            <IonBackButton defaultHref="/admin-dashboard" />
          </IonButtons>
          <IonTitle>📊 BIA Reports</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent className="ion-padding custom-bg">
        {loading ? (
          <IonSpinner name="dots" />
        ) : biaReports.length === 0 ? (
          <IonText>No BIA reports found.</IonText>
        ) : (
          <IonList>
            {biaReports.map(report => (
              <IonCard key={report.id} className="dashboard-card">
                <IonCardHeader>
                  <IonCardTitle>BIA Report #{report.id.slice(0, 8)}</IonCardTitle>
                </IonCardHeader>
                <IonCardContent>
                  <p><strong>Incident:</strong> {getIncidentTitle(report.incident_id)}</p>
                  <p><strong>Data:</strong> {report.report_data}</p>
                  <p><strong>Created:</strong> {new Date(report.created_at).toLocaleString()}</p>

                  <IonList>
                    {getRecommendationsForBIA(report.id).map(rec => (
                      <IonItem key={rec.id} lines="none">
                        <IonLabel>
                          <p><strong>Recommendation:</strong> {rec.recommendation_text}</p>
                        </IonLabel>
                      </IonItem>
                    ))}
                  </IonList>
                </IonCardContent>
              </IonCard>
            ))}
          </IonList>
        )}
      </IonContent>
    </IonPage>
  );
};

export default BIAReportsPage;
