import React, { useEffect, useContext } from 'react';
import axios from 'axios';
import { Switch } from 'react-router';
import { Route, Redirect, RouteComponentProps, withRouter } from 'react-router-dom';
import { UserContext } from './util/user-context';
import SearchProvider from './util/search-context';
import ModelingProvider from './util/modeling-context';

import Header from './components/header/header';
import Footer from './components/footer/footer';
import Login from './pages/Login';
import TilesView from './pages/TilesView';
import NoMatchRedirect from './pages/noMatchRedirect';
import NoResponse from './pages/NoResponse';
import Error from './components/error/error';
import ModalStatus from './components/modal-status/modal-status';
import NavigationPrompt from './components/navigation-prompt/navigation-prompt';

import './App.scss';
import { Application } from './config/application.config';
import { themes, themeMap } from './config/themes.config';
import { getEnvironment } from './util/environment';

interface Props extends RouteComponentProps<any> {}

const App: React.FC<Props> = ({history, location}) => {
  const {
    user,
    error,
    handleError,
    clearErrorMessage
  } = useContext(UserContext);

  const PrivateRoute = ({ children, ...rest }) => (
    <Route {...rest} render={ props => (
      user.authenticated === true ? (
        children
      ) : (
        <Redirect push={true} to={{
          pathname: '/',
          state: { from: props.location }
        }}/>
      )
    )}/>
  );

  const showErrorPage = () => {
    history.push({
      pathname: '/error',
      state: { message: error['message'] ? error['message'] : 'No error message' }
    });
    clearErrorMessage();
  }

  useEffect(() => {
    // Error
    if (error.type !== '') {
      showErrorPage();
    // Logged in
    } else if (user.authenticated) {
      if (location.pathname === '/') {
        history.push(user.pageRoute); // Redirect to last saved page
      } else {
        history.push(location.pathname); 
      }
    // Not logged in
    } else {
      // Save last page (on logout)
      if (location.pathname !== '/' && location.pathname !== '/noresponse' && location.pathname !== '/error') {
        user.pageRoute = location.pathname;
      }
      history.push('/'); // Redirect to Login
    }
  }, [user]);

  useEffect(() => {
    // On route change...
    axios.get('/api/environment/systemInfo')
        .then(res => {})
        // Timeouts throw 401s and are caught here
        .catch(err => {
            if (err.response) {
              handleError(err);
            } else {
              history.push('/noresponse');
            }
        })
  }, [location.pathname]);

  const path = location['pathname'];
  const pageTheme = (themeMap[path]) ? themes[themeMap[path]] : themes['default'];
  document.body.classList.add(pageTheme['bodyBg']);
  document.title = Application.title;

  return (
    <div id="background" style={pageTheme['background']}>
      <SearchProvider>
        <ModelingProvider>
          <Header environment={getEnvironment()} />
          <ModalStatus/>
          <NavigationPrompt/>
          <main>
            <div className="contentContainer">
            <Switch>
              <Route path="/" exact component={Login}/>
              <Route path="/noresponse" exact component={NoResponse} />
              <Route path="/error" exact component={Error} />
              <PrivateRoute path="/tiles" exact>
                <TilesView/>
              </PrivateRoute>
              <PrivateRoute path="/tiles/load" exact>
                <TilesView id='load'/>
              </PrivateRoute>
              <PrivateRoute path="/tiles/model" exact>
                <TilesView id='model'/>
              </PrivateRoute>
              <PrivateRoute path="/tiles/curate" exact>
                <TilesView id='curate'/>
              </PrivateRoute>
              <PrivateRoute path="/tiles/run" exact>
                <TilesView id='run'/>
              </PrivateRoute>
              <PrivateRoute path="/tiles/run/add" exact>
                <TilesView id='run' addingStepToFlow='true' />
              </PrivateRoute>
              <PrivateRoute path="/tiles/explore" exact>
                <TilesView id='explore'/>
              </PrivateRoute>
              <PrivateRoute path="/tiles/explore/detail/:pk/:uri" exact>
                 <TilesView id='explore'/>
              </PrivateRoute>
              <Route component={NoMatchRedirect}/>
            </Switch>
            </div>
            <Footer pageTheme={pageTheme}/>
          </main>
        </ModelingProvider>
      </SearchProvider>
    </div>
  );
}

export default withRouter(App);
