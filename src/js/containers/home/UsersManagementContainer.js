import React, { Component } from 'react'
import { connect } from 'react-redux'
import * as PopoverActions from '../../actions/PopoverActions';
import * as LoginActions from '../../actions/LoginActions';
import * as AlertModalActions from '../../actions/AlertModalActions';
import * as BodyUIActions from '../../actions/BodyUIActions';
import LoginContainer from './LoginContainer';
import Logout from '../../components/home/usersManagement/Logout';
import MuiThemeProvider from 'material-ui/styles/MuiThemeProvider';
import { Card } from 'material-ui/Card';

class UsersManagementContainer extends Component {
  instructions() {
    return (
      <div>
        <div style={{ margin: 15 }}>Please login with you Door43 Account</div>
        <div style={{ margin: 15 }}>If you do not have an account already, you may create an account.</div>
        <div style={{ margin: 15 }}>If you would rather work offline, you may select continue offline.</div>
      </div>
    )
  }

  componentWillMount() {
    let instructions = this.instructions();
    if (this.props.reducers.homeScreenReducer.homeInstructions !== instructions) {
      this.props.actions.changeHomeInstructions(instructions);
    }
  }

  render() {
    const userCardManagementCardStyle = {
      width: '100%', height: '100%',
      background: 'white', padding: '20px',
      marginTop: '5px', display: 'flex'
    }
    const { loggedInUser } = this.props.reducers.loginReducer;
    const userdata = this.props.reducers.loginReducer.userdata || {};
    const { username, email } = userdata;
    return (
      <div style={{ height: '100%', width: '100%' }}>
        User
      <MuiThemeProvider>
          <Card style={{ height: '100%' }} containerStyle={userCardManagementCardStyle}>
            {!loggedInUser ?
              <LoginContainer {...this.props} /> :
              <Logout username={username} email={email} {...this.props} />
            }
          </Card>
        </MuiThemeProvider>
      </div>
    );
  }
}

const mapDispatchToProps = (dispatch, ownProps) => {
  return {
    actions: {
      ...ownProps.actions,
      loginUser: (userDataSumbit) => {
        dispatch(LoginActions.loginUser(userDataSumbit));
      },
      loginLocalUser: (username) => {
        dispatch(LoginActions.loginLocalUser(username))
      },
      showPopover: (title, bodyText, positionCoord) => {
        dispatch(PopoverActions.showPopover(title, bodyText, positionCoord));
      },
      logoutUser: () => {
        dispatch(LoginActions.logoutUser());
      },
      showAlert: (message) => {
        dispatch(AlertModalActions.openAlertDialog(message));
      },
      goToNextStep: () => {
        dispatch(BodyUIActions.goToNextStep());
      },
      openOptionDialog: (alertMessage, callback, button1Text, button2Text) => {
        dispatch(AlertModalActions.openOptionDialog(alertMessage, callback, button1Text, button2Text));
      },
      closeAlert: () => {
        dispatch(AlertModalActions.closeAlertDialog());
      }
    }
  }
};

const mapStateToProps = (state, ownProps) => {
  return {
  }
}

export default connect(mapStateToProps, mapDispatchToProps)(UsersManagementContainer);
