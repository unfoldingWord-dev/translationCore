import React, { Component } from 'react';
import { Glyphicon } from 'react-bootstrap';
import TextField from 'material-ui/TextField';

class LoginDoor43Account extends Component {
    constructor(props) {
        super(props);
        this.state = {
            username:null,
            password:null
        };
    }
    
    infoClickDoor43(e) {
        let positionCoord = e.target;
        let title = <strong>Door43 Information</strong>
        let text =
            (<div style={{ padding: "0 20px" }}>
                <p>
                    Door43 is a free, online, revision-controlled content management
      <br />system for open-licensed biblical material.
      </p>
                <p>
                    It provides free, remote storage and collaboration services
      <br />for creators and translators of biblical content.
      </p>
            </div>);
        this.props.actions.showPopover(title, text, positionCoord)
    }

    loginHeaderDoor43() {
        return (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%' }}>
                <img style={{ height: 64, width: 64 }} src="src/images/D43_LOGO.png" />
                <div>
                    <span style={{ fontSize: 20, fontWeight: 'bold' }}>Log in With Door43</span>
                    <Glyphicon
                        glyph="info-sign"
                        style={{ fontSize: "16px", cursor: 'pointer', marginLeft: '5px' }}
                        onClick={(e) => this.infoClickDoor43(e)}
                    />
                </div>
            </div>
        )
    }

    loginTextFields() {
        const underLineColor = "var(--accent-color-dark)";
        return (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%' }}>
                <TextField
                    fullWidth={true}
                    floatingLabelText="Username"
                    underlineFocusStyle={{ borderColor: underLineColor }}
                    floatingLabelStyle={{ color: "var(--text-color-dark)", opacity: "0.3", fontWeight: "500" }}
                    onChange={e => this.setState({ username: e.target.value })}
                />
                <TextField
                    fullWidth={true}
                    floatingLabelText="Password"
                    type="password"
                    underlineFocusStyle={{ borderColor: underLineColor }}
                    floatingLabelStyle={{ color: "var(--text-color-dark)", opacity: "0.3", fontWeight: "500" }}
                    onChange={e => this.setState({ password: e.target.value })}
                />
            </div>
        )
    }

    loginButton() {
        return (
            <div style={{ width: '100%' }}>
                <button
                    className={"btn-prime"}
                    style={{ width: "100%", margin: "40px 0px 10px" }}
                    onClick={() => this.props.actions.loginUser(this.state)}>
                    Log in
            </button>
            </div>
        )
    }

    render() {
        return (
            <div style={{ display: 'flex', alignItems: 'center', flexDirection: 'column', margin: 'auto', width: 250 }}>
                {this.loginHeaderDoor43()}
                {this.loginTextFields()}
                {this.loginButton()}
            </div>
        );
    }
}

export default LoginDoor43Account;