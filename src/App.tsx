import { Redirect, Route } from 'react-router-dom';
import { IonApp, IonRouterOutlet, setupIonicReact} from '@ionic/react';
import { IonReactHashRouter } from '@ionic/react-router'; 


import AuthPage from './pages/AuthPages';
import CreatePage from './pages/CreatePages';
import DashboardPage from './pages/DashboardPages';
import WelcomePage from './pages/WelcomePages';

import '@ionic/react/css/core.css';
import '@ionic/react/css/normalize.css';
import '@ionic/react/css/structure.css';
import '@ionic/react/css/typography.css';
import '@ionic/react/css/padding.css';
import '@ionic/react/css/float-elements.css';
import '@ionic/react/css/text-alignment.css';
import '@ionic/react/css/text-transformation.css';
import '@ionic/react/css/flex-utils.css';
import '@ionic/react/css/display.css';
import '@ionic/react/css/palettes/dark.system.css';


import '@ionic/react/css/core.css';
import '@ionic/react/css/normalize.css';
import '@ionic/react/css/structure.css';
import '@ionic/react/css/typography.css';


import './theme/variables.css';
import ReportIncident from './pages/ReportIncident';


setupIonicReact();

const App: React.FC = () => (
  <IonApp>
    <IonReactHashRouter>
      <IonRouterOutlet>
        <Route exact path="/auth">
          <AuthPage />
        </Route>
        <Route exact path="/register">
          <CreatePage />
        </Route>
        <Route exact path="/dashboard">
          <DashboardPage />
        </Route>
        <Route exact path="/welcome">
          <WelcomePage />
        </Route>
        <Route exact path="/report-incidents">
          <ReportIncident />
        </Route>
        <Route exact path="/">
          <Redirect to="/auth" />
        </Route>
      </IonRouterOutlet>
      </IonReactHashRouter>
  </IonApp>
);

export default App;
