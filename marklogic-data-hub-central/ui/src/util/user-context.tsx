import React, {useContext, useEffect, useRef, useState} from 'react';
import {Subscription} from 'rxjs';
import axios from 'axios';
import {createUserPreferences, getUserPreferences, updateUserPreferences} from '../services/user-preferences';
import {IUserContextInterface, UserContextInterface} from '../types/user-types';
import {AuthoritiesContext} from './authorities';
import {StompContext, STOMPState} from './stomp';
import {resetEnvironment, setEnvironment} from '../util/environment';
import {useInterval} from '../hooks/use-interval';

const defaultUserData = {
  name: '',
  authenticated: false,
  error : {
    title: '',
    message: '',
    type: ''
  },
  pageRoute: '/tiles',
  maxSessionTime: 300
}

const defaultErrorData = {
  status: '',
  message: '',
  details: '',
  suggestion: ''
}

export const UserContext = React.createContext<IUserContextInterface>({
  user: defaultUserData,
  error: defaultErrorData,
  loginAuthenticated: () => {},
  sessionAuthenticated: () => {},
  userNotAuthenticated: () => {},
  handleError: () => {},
  clearErrorMessage: () => {},
  setPageRoute: () => {},
  setAlertMessage: () => {},
  resetSessionTime: () => {},
  getSessionTime: () => { return defaultUserData.maxSessionTime;}
});

const UserProvider: React.FC<{ children: any }> = ({children}) => {

  const [user, setUser] = useState<UserContextInterface>(defaultUserData);
  const [error, setError] = useState(defaultErrorData);
  const [stompMessageSubscription, setStompMessageSubscription] = useState<Subscription|null>(null);
  const [unsubscribeId, setUnsubscribeId] = useState<string|null>(null);
  const sessionUser = localStorage.getItem('dataHubUser');
  const authoritiesService = useContext(AuthoritiesContext);
  const stompService = useContext(StompContext);
  const sessionCount = useRef<number>(300);
  let sessionTimer = true;

  const setSessionTime = (timeInSeconds) => {
    sessionCount.current = timeInSeconds;
  }

  const resetSessionMonitor = () => {
    // unsubscribe from STOMP/WebSockets
    if (unsubscribeId) {
      stompService.unsubscribe(unsubscribeId);
      setUnsubscribeId(null);
    }
    // unsubscribe from message queue, so we don't double up subscriptions on login/logout
    if (stompMessageSubscription !== null) {
      stompMessageSubscription.unsubscribe();
      setStompMessageSubscription(null);
    }
    const closedWebSockets = new Promise<STOMPState>(resolve => {
      if (stompService.isClosed() || stompService.isTrying()) {
        resolve(stompService.state.getValue());
      } else {
        stompService.state.asObservable().subscribe((value) => {
          if (value.valueOf() === STOMPState.CLOSED) {
            resolve(value);
          }
        });
      }
    });
    stompService.disconnect();
    return closedWebSockets;
  };

  const subscribeToMonitorSession = () => {
    const hubCentralSessionToken = localStorage.getItem('hubCentralSessionToken');
    if (hubCentralSessionToken) {
      if (!stompMessageSubscription) {
        setStompMessageSubscription(stompService.messages.subscribe((message) => {
          setSessionTime(parseInt(JSON.parse(message.body).sessionTimeout));
        }));
      }
      if (!unsubscribeId) {
        stompService.subscribe(`/topic/sessionStatus/${hubCentralSessionToken}`, (msgId: string) => {
          setUnsubscribeId(msgId);
        });
      }
    }
  };
  const monitorSession = () => {
    if (stompService.isClosed()) {
      stompService.configure(window.location.origin + '/websocket');
      stompService.tryConnect().then(subscribeToMonitorSession);
    }
  };

  const loginAuthenticated = async (username: string, authResponse: any) => {
    setEnvironment();
    let session = await axios('/api/environment/systemInfo');
    setSessionTime(parseInt(session.data['sessionTimeout']));

    localStorage.setItem('dataHubUser', username);
    localStorage.setItem('serviceName', session.data.serviceName);
    localStorage.setItem('hubCentralSessionToken', session.data.sessionToken);
    monitorSession();

    const authorities: string[] =  authResponse.authorities || [];
    authoritiesService.setAuthorities(authorities);

    let userPreferences = getUserPreferences(username);
    if (userPreferences) {
      let values = JSON.parse(userPreferences);
      setUser({
        ...user,
        name: username,
        authenticated: true,
        // pageRoute: values.pageRoute,
        maxSessionTime: sessionCount.current
      });
    } else {
      createUserPreferences(username);
      setUser({
        ...user,
        name: username,
        authenticated: true,
        maxSessionTime: sessionCount.current
      });
    }
  };

  const sessionAuthenticated = (username: string) => {
    monitorSession();
    localStorage.setItem('dataHubUser', username);
    let userPreferences = getUserPreferences(username);
    if (userPreferences) {
      let values = JSON.parse(userPreferences);
      setUser({
        ...user,
        name: username,
        authenticated: true,
        // pageRoute: values.pageRoute,
        maxSessionTime: sessionCount.current
      });
    } else {
      createUserPreferences(username);
      setUser({ ...user,name: username, authenticated: true});
    }
  };

  const userNotAuthenticated = () => {
    resetSessionMonitor().then(() => {
      localStorage.setItem('dataHubUser', '');
      localStorage.setItem('serviceName', '');
      localStorage.setItem('loginResp', '');
      localStorage.setItem('hubCentralSessionToken', '');
      authoritiesService.setAuthorities([]);
      resetEnvironment();
      setUser({...user, name: '', authenticated: false});
    });
  };

  const getError = (err) => {
    return {
      status: err.response.hasOwnProperty('status') ? err.response.status : '',
      message: err.response.data.hasOwnProperty('message') ? err.response.data.message : '',
      details: err.response.data.hasOwnProperty('details') ? err.response.data.details : '',
      suggestion: err.response.data.hasOwnProperty('suggestion') ? err.response.data.suggestion : ''
    }
  }

  const handleError = (error) => {
    console.log('HTTP ERROR', error.response);
    switch (error.response.status) {
      case 401: {
        localStorage.setItem('dataHubUser', '');
        setUser({ ...user, name: '', authenticated: false });
        break;
      }
      case 400:
      case 403:
      case 405:
      case 408:
      case 414: 
      case 500:
      case 501:
      case 502:
      case 503:
      case 504:
      case 505:
      case 511: {
        setError(getError(error));
        break;
      }
      case 404: {
        // NOTE this case currently intercepted and handled by the App.tsx routing
        setError(getError(error));
        break;
      }
      default: {
        setError(getError(error));
        break;
      }
    }
  }

  const clearErrorMessage = () => {
    setError({
      status: '',
      message: '',
      details: '',
      suggestion: ''
    });
  }

  const setPageRoute = (route: string) => {
    updateUserPreferences(user.name, { pageRoute: route });
  }

  const setAlertMessage = (title: string, message: string) => {
    setUser({
      ...user,
      error: {
        title,
        message,
        type: 'ALERT'
      }
    });
  }

  const resetSessionTime = () => {
    setSessionTime(user.maxSessionTime);
  }

  const getSessionTime = () =>{
      return sessionCount.current;
  }

  useEffect(() => {
    if (sessionUser) {
      sessionAuthenticated(sessionUser);
      let loginResponse = JSON.parse(localStorage.getItem('loginResp') || '{}')
      if(JSON.stringify(loginResponse) !== JSON.stringify({})){
        loginAuthenticated(sessionUser,loginResponse);
      }
    }
  }, []);

  useInterval(() => {
    if (user.authenticated && sessionTimer) {
      setSessionTime(getSessionTime() - 1);
    }
  }, 1000);

  return (
    <UserContext.Provider value={{
      user,
      error,
      loginAuthenticated,
      sessionAuthenticated,
      userNotAuthenticated,
      handleError,
      clearErrorMessage,
      setPageRoute,
      setAlertMessage,
      getSessionTime,
      resetSessionTime
    }}>
      {children}
    </UserContext.Provider>
  )
}

export default UserProvider;
